const Tesseract = require('tesseract.js');
const logger = require('../utils/logger');

let worker = null;

async function getWorker() {
  if (worker) return worker;

  worker = await Tesseract.createWorker('tur', 1, {
    logger: () => {},
  });

  await worker.setParameters({
    tessedit_pageseg_mode: '6',
    tessedit_char_whitelist:
      'ABCDEFGHIJKLMNOPQRSTUVWXYZÇĞİÖŞÜabcdefghijklmnopqrstuvwxyzçğıöşü0123456789.,*/₺TL -',
  });

  logger.info('Tesseract worker initialized');
  return worker;
}

async function runOCR(imageBuffer) {
  const w = await getWorker();
  const { data } = await w.recognize(imageBuffer);
  return {
    text: data.text,
    lines: data.lines,
    confidence: data.confidence / 100, // 0-1 aralığına normalize
  };
}

async function terminateWorker() {
  if (worker) {
    await worker.terminate();
    worker = null;
  }
}

// Uzun süre çalışan servislerde bellek sızıntısını önlemek için periyodik yeniden başlatma
let requestCount = 0;
const RESTART_AFTER = 500;

async function runOCRWithRestart(imageBuffer) {
  requestCount++;
  if (requestCount >= RESTART_AFTER) {
    logger.info('Restarting Tesseract worker to prevent memory leak');
    await terminateWorker();
    requestCount = 0;
  }
  return runOCR(imageBuffer);
}

module.exports = { runOCR: runOCRWithRestart, terminateWorker };
