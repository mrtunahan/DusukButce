require('dotenv').config();
const { Worker } = require('bullmq');
const { connection } = require('./queue');
const Receipt = require('../models/Receipt');
const ReceiptItem = require('../models/ReceiptItem');
const PriceHistory = require('../models/PriceHistory');
const Market = require('../models/Market');
const { connectDB } = require('../../config/database');
const { readReceiptQR } = require('../services/qr.service');
const { preprocessForOCR, computePHash } = require('../services/preprocess.service');
const { runOCR } = require('../services/ocr.service');
const { parseReceipt, validateGeometry } = require('../services/parser.service');
const { llmParse } = require('../services/llm-fallback.service');
const { matchProduct, updateProductAvgPrice } = require('../services/product-matcher.service');
const storageService = require('../services/storage.service');
const logger = require('../utils/logger');

const OCR_THRESHOLD = parseFloat(process.env.OCR_CONFIDENCE_THRESHOLD || '0.7');

async function processReceipt(job) {
  const { receiptId } = job.data;
  const receipt = await Receipt.findById(receiptId);
  if (!receipt) throw new Error(`Receipt ${receiptId} not found`);

  await Receipt.findByIdAndUpdate(receiptId, { status: 'PROCESSING' });

  try {
    // Görseli indir
    const presigned = await storageService.getPresignedUrl(receipt.image_key);
    const res = await fetch(presigned);
    const imageBuffer = Buffer.from(await res.arrayBuffer());

    // pHash ile duplicate kontrolü
    const phash = await computePHash(imageBuffer);
    const dup = await Receipt.findOne({ image_phash: phash, _id: { $ne: receiptId } });
    if (dup) {
      await Receipt.findByIdAndUpdate(receiptId, {
        status: 'FAILED',
        error_log: ['Duplicate receipt detected'],
      });
      return;
    }
    await Receipt.findByIdAndUpdate(receiptId, { image_phash: phash });

    let parsed = null;
    let method = 'OCR_ONLY';

    // 1. QR kod dene
    const qrData = await readReceiptQR(imageBuffer);
    if (qrData) {
      receipt.qr_payload = qrData.raw;
      parsed = {
        market_name: null,
        vkn: qrData.vkn,
        purchase_date: qrData.purchase_date,
        total_amount: qrData.total_amount,
        items: [],
      };
      method = 'QR_ONLY';
    }

    // 2. OCR pipeline
    const preprocessed = await preprocessForOCR(imageBuffer);
    const ocrResult = await runOCR(preprocessed);
    const maskedText = ocrResult.text;

    await Receipt.findByIdAndUpdate(receiptId, { raw_ocr_text: maskedText });

    if (!parsed || parsed.items.length === 0) {
      const regexParsed = parseReceipt(maskedText);
      const geo = validateGeometry(regexParsed.items, regexParsed.total_amount);

      const confidence = Math.min(ocrResult.confidence, geo.confidence || ocrResult.confidence);

      if (confidence >= OCR_THRESHOLD) {
        parsed = { ...parsed, ...regexParsed };
        method = qrData ? 'QR_PLUS_OCR' : 'OCR_ONLY';
      } else {
        // LLM fallback
        logger.info({ receiptId, confidence }, 'Low confidence, using LLM fallback');
        const llmResult = await llmParse(maskedText);
        parsed = { ...parsed, ...llmResult };
        method = 'OCR_PLUS_LLM';
      }

      await Receipt.findByIdAndUpdate(receiptId, { ocr_confidence: ocrResult.confidence });
    }

    // Market eşleştir
    let marketId = null;
    if (parsed.vkn) {
      const market = await Market.findOne({ vkn: parsed.vkn });
      if (market) marketId = market._id;
    }
    if (!marketId && parsed.market_name) {
      const market = await Market.findOne({
        $or: [
          { name: new RegExp(parsed.market_name, 'i') },
          { known_aliases: new RegExp(parsed.market_name, 'i') },
        ],
      });
      if (market) marketId = market._id;
    }

    // Receipt güncelle
    await Receipt.findByIdAndUpdate(receiptId, {
      market_id: marketId,
      purchase_date: parsed.purchase_date,
      total_amount: parsed.total_amount,
      processing_method: method,
      status: 'DONE',
    });

    // Kalemleri kaydet ve ürün eşleştir
    const observedAt = parsed.purchase_date || new Date();

    for (const item of parsed.items || []) {
      const { product, confidence } = await matchProduct(item.raw_name);

      const savedItem = await ReceiptItem.create({
        receipt_id: receiptId,
        product_id: product._id,
        raw_name: item.raw_name,
        normalized_name: product.canonical_name,
        unit_price: item.unit_price,
        quantity: item.quantity,
        line_total: item.line_total,
        kdv_rate: item.kdv_rate,
        match_confidence: confidence,
      });

      if (marketId) {
        await PriceHistory.create({
          product_id: product._id,
          market_id: marketId,
          receipt_id: receiptId,
          price: item.unit_price,
          observed_at: observedAt,
          kdv_rate: item.kdv_rate,
        });
        await updateProductAvgPrice(product._id);
      }
    }

    logger.info({ receiptId, method, itemCount: parsed.items?.length }, 'Receipt processed');
  } catch (err) {
    logger.error({ err, receiptId }, 'Receipt processing failed');
    await Receipt.findByIdAndUpdate(receiptId, {
      status: 'FAILED',
      $push: { error_log: err.message },
    });
    throw err;
  }
}

async function startWorker() {
  await connectDB();

  const worker = new Worker('receipt-processing', processReceipt, {
    connection,
    concurrency: 2,
  });

  worker.on('completed', (job) => logger.info({ jobId: job.id }, 'Job completed'));
  worker.on('failed', (job, err) => logger.error({ jobId: job?.id, err }, 'Job failed'));

  logger.info('Receipt processor worker started');
}

startWorker().catch((err) => {
  logger.error(err, 'Worker startup failed');
  process.exit(1);
});
