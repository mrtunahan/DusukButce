const Receipt = require('../models/Receipt');
const ReceiptItem = require('../models/ReceiptItem');
const { uploadReceiptImage, getPresignedUrl, deleteReceiptImage } = require('../services/storage.service');
const { receiptQueue } = require('../workers/queue');
const logger = require('../utils/logger');

async function upload(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'Image file required' });

    const imageKey = await uploadReceiptImage(req.file.buffer, req.userId, req.file.mimetype);

    const receipt = await Receipt.create({
      user_id: req.userId,
      image_key: imageKey,
      status: 'PENDING',
    });

    await receiptQueue.add('process', { receiptId: receipt._id }, { attempts: 3, backoff: 5000 });

    res.status(202).json({
      receipt_id: receipt._id,
      status: 'PENDING',
      estimated_seconds: 8,
      poll_url: `/receipts/${receipt._id}/status`,
    });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const page = parseInt(req.query.page || '1');
    const limit = Math.min(parseInt(req.query.limit || '20'), 50);
    const skip = (page - 1) * limit;

    const [receipts, total] = await Promise.all([
      Receipt.find({ user_id: req.userId })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .select('-raw_ocr_text -qr_payload')
        .lean(),
      Receipt.countDocuments({ user_id: req.userId }),
    ]);

    res.json({ data: receipts, total, page, limit });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const receipt = await Receipt.findOne({
      _id: req.params.id,
      user_id: req.userId,
    }).lean();

    if (!receipt) return res.status(404).json({ error: 'Receipt not found' });

    const items = await ReceiptItem.find({ receipt_id: receipt._id }).lean();

    let image_url = null;
    if (receipt.image_key) {
      image_url = await getPresignedUrl(receipt.image_key);
    }

    res.json({ ...receipt, items, image_url });
  } catch (err) {
    next(err);
  }
}

async function getStatus(req, res, next) {
  try {
    const receipt = await Receipt.findOne({
      _id: req.params.id,
      user_id: req.userId,
    })
      .select('status processing_method ocr_confidence error_log')
      .lean();

    if (!receipt) return res.status(404).json({ error: 'Receipt not found' });
    res.json(receipt);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const receipt = await Receipt.findOne({ _id: req.params.id, user_id: req.userId });
    if (!receipt) return res.status(404).json({ error: 'Receipt not found' });

    await Promise.all([
      deleteReceiptImage(receipt.image_key),
      ReceiptItem.deleteMany({ receipt_id: receipt._id }),
      receipt.deleteOne(),
    ]);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { upload, list, getOne, getStatus, remove };
