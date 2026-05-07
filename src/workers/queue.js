let receiptQueue = null;
let connection = null;

// Redis yoksa kuyruk devre dışı kalır, sadece auth/list/get endpoint'leri çalışır
if (process.env.REDIS_HOST) {
  try {
    const { Queue } = require('bullmq');
    const IORedis = require('ioredis');

    connection = new IORedis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null,
    });

    receiptQueue = new Queue('receipt-processing', { connection });
  } catch (err) {
    console.warn('[queue] Redis bağlantısı kurulamadı, kuyruk devre dışı:', err.message);
  }
}

module.exports = { receiptQueue, connection };
