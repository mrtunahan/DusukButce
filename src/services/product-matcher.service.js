const Product = require('../models/Product');
const { normalize, extractUnit, tokenize, jaccard } = require('../utils/turkish-normalize');

const BRAND_LIST = [
  'icim', 'pinar', 'sek', 'ulker', 'eti', 'torku', 'mis', 'dobbo',
  'president', 'lurpak', 'arko', 'bingo', 'fairy', 'domestos',
];

function detectBrand(tokens) {
  for (const t of tokens) {
    if (BRAND_LIST.includes(t)) return t;
  }
  return null;
}

async function matchProduct(rawName) {
  const tokens = tokenize(rawName);
  const { unit, size } = extractUnit(rawName);
  const brand = detectBrand(tokens);

  const query = {};
  if (brand) query.brand = brand;
  if (unit) query.unit = unit;

  const candidates = await Product.find(query).limit(50).lean();

  let best = null;
  let bestScore = 0;

  for (const cand of candidates) {
    const score = jaccard(tokens, cand.tokens);
    if (score > bestScore) {
      bestScore = score;
      best = cand;
    }
  }

  if (bestScore >= 0.6) return { product: best, confidence: bestScore };

  // Yeni ürün oluştur
  const newProduct = await Product.create({
    canonical_name: rawName.trim(),
    brand,
    unit: unit || 'ADET',
    unit_size: size,
    tokens,
    last_seen_at: new Date(),
  });

  return { product: newProduct, confidence: 0 };
}

async function updateProductAvgPrice(productId) {
  const PriceHistory = require('../models/PriceHistory');
  const cutoff = new Date(Date.now() - 30 * 86400000);

  const agg = await PriceHistory.aggregate([
    { $match: { product_id: productId, observed_at: { $gte: cutoff } } },
    { $group: { _id: null, avg: { $avg: { $toDouble: '$price' } } } },
  ]);

  if (agg.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      current_avg_price: agg[0].avg,
      last_seen_at: new Date(),
    });
  }
}

module.exports = { matchProduct, updateProductAvgPrice };
