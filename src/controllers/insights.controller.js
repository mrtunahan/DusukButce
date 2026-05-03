const {
  getPriceTrend,
  getMarketComparison,
  getBasketInflation,
  detectAnomalies,
} = require('../services/analysis.service');
const mongoose = require('mongoose');

async function priceTrend(req, res, next) {
  try {
    const { id } = req.params;
    const days = parseInt(req.query.days || '90');
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid product id' });

    const data = await getPriceTrend(new mongoose.Types.ObjectId(id), days);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function marketComparison(req, res, next) {
  try {
    const { id } = req.params;
    const days = parseInt(req.query.days || '30');
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid product id' });

    const data = await getMarketComparison(new mongoose.Types.ObjectId(id), days);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function basketInflation(req, res, next) {
  try {
    const months = parseInt(req.query.months || '6');
    const data = await getBasketInflation(req.userId, months);
    res.json(data || { inflation_rate: null, product_count: 0 });
  } catch (err) {
    next(err);
  }
}

async function anomalies(req, res, next) {
  try {
    const threshold = parseFloat(req.query.threshold || '0.2');
    const data = await detectAnomalies(req.userId, threshold);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { priceTrend, marketComparison, basketInflation, anomalies };
