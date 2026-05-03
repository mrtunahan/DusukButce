const PriceHistory = require('../models/PriceHistory');
const ReceiptItem = require('../models/ReceiptItem');
const Receipt = require('../models/Receipt');

async function getPriceTrend(productId, days = 90) {
  const cutoff = new Date(Date.now() - days * 86400000);

  return PriceHistory.aggregate([
    { $match: { product_id: productId, observed_at: { $gte: cutoff } } },
    {
      $group: {
        _id: {
          market_id: '$market_id',
          week: { $dateTrunc: { date: '$observed_at', unit: 'week' } },
        },
        avg_price: { $avg: { $toDouble: '$price' } },
        sample_count: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'markets',
        localField: '_id.market_id',
        foreignField: '_id',
        as: 'market',
      },
    },
    { $sort: { '_id.week': 1 } },
  ]);
}

async function getMarketComparison(productId, days = 30) {
  const cutoff = new Date(Date.now() - days * 86400000);

  return PriceHistory.aggregate([
    { $match: { product_id: productId, observed_at: { $gte: cutoff } } },
    {
      $group: {
        _id: '$market_id',
        avg_price: { $avg: { $toDouble: '$price' } },
        min_price: { $min: { $toDouble: '$price' } },
        max_price: { $max: { $toDouble: '$price' } },
        count: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'markets',
        localField: '_id',
        foreignField: '_id',
        as: 'market',
      },
    },
    { $sort: { avg_price: 1 } },
  ]);
}

async function getBasketInflation(userId, months = 6) {
  const cutoff = new Date(Date.now() - months * 30 * 86400000);
  const midpoint = new Date(Date.now() - (months / 2) * 30 * 86400000);

  const receipts = await Receipt.find({
    user_id: userId,
    purchase_date: { $gte: cutoff },
    status: 'DONE',
  })
    .select('_id purchase_date')
    .lean();

  const receiptIds = receipts.map((r) => r._id);

  const [earlyItems, lateItems] = await Promise.all([
    ReceiptItem.aggregate([
      {
        $match: {
          receipt_id: { $in: receiptIds.filter((_, i) => receipts[i].purchase_date < midpoint) },
          product_id: { $ne: null },
        },
      },
      { $group: { _id: '$product_id', avg_price: { $avg: { $toDouble: '$unit_price' } } } },
    ]),
    ReceiptItem.aggregate([
      {
        $match: {
          receipt_id: { $in: receiptIds.filter((_, i) => receipts[i].purchase_date >= midpoint) },
          product_id: { $ne: null },
        },
      },
      { $group: { _id: '$product_id', avg_price: { $avg: { $toDouble: '$unit_price' } } } },
    ]),
  ]);

  const earlyMap = new Map(earlyItems.map((i) => [String(i._id), i.avg_price]));
  let totalChange = 0;
  let count = 0;

  for (const late of lateItems) {
    const early = earlyMap.get(String(late._id));
    if (early && early > 0) {
      totalChange += (late.avg_price - early) / early;
      count++;
    }
  }

  return count > 0 ? { inflation_rate: totalChange / count, product_count: count } : null;
}

async function detectAnomalies(userId, threshold = 0.2) {
  const receipts = await Receipt.find({ user_id: userId, status: 'DONE' })
    .select('_id')
    .limit(100)
    .lean();
  const ids = receipts.map((r) => r._id);

  return ReceiptItem.aggregate([
    { $match: { receipt_id: { $in: ids }, product_id: { $ne: null } } },
    {
      $lookup: {
        from: 'products',
        localField: 'product_id',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: '$product' },
    {
      $addFields: {
        price_double: { $toDouble: '$unit_price' },
        avg_double: { $toDouble: '$product.current_avg_price' },
      },
    },
    {
      $match: {
        avg_double: { $gt: 0 },
        $expr: {
          $gt: [
            { $abs: { $divide: [{ $subtract: ['$price_double', '$avg_double'] }, '$avg_double'] } },
            threshold,
          ],
        },
      },
    },
    {
      $project: {
        raw_name: 1,
        unit_price: 1,
        'product.current_avg_price': 1,
        'product.canonical_name': 1,
      },
    },
  ]);
}

module.exports = { getPriceTrend, getMarketComparison, getBasketInflation, detectAnomalies };
