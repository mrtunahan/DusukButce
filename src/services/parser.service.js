const {
  PRICE_REGEX,
  KDV_LINE_REGEX,
  TOTAL_REGEX,
  DATE_REGEX,
  detectMarket,
  maskTCNo,
} = require('../utils/regex');

function parseAmount(str) {
  if (!str) return null;
  return parseFloat(str.replace(/\./g, '').replace(',', '.'));
}

function parseLine(line) {
  const text = line.trim();
  if (!text) return null;

  const priceMatch = text.match(PRICE_REGEX);
  if (!priceMatch) return null;

  const price = parseAmount(priceMatch[1]);
  const name = text.slice(0, text.lastIndexOf(priceMatch[1])).trim();

  if (!name || price === null) return null;
  return { raw_name: name, unit_price: price, quantity: 1, line_total: price, kdv_rate: 10 };
}

function parseReceipt(ocrText) {
  const safeText = maskTCNo(ocrText);
  const lines = safeText.split('\n');

  const items = [];
  let total_amount = null;
  let purchase_date = null;
  let market_name = detectMarket(safeText) || null;

  for (const line of lines) {
    const totalMatch = line.match(TOTAL_REGEX);
    if (totalMatch) {
      total_amount = parseAmount(totalMatch[1]);
      continue;
    }

    const kdvMatch = line.match(KDV_LINE_REGEX);
    if (kdvMatch && items.length > 0) {
      items[items.length - 1].kdv_rate = parseInt(kdvMatch[1], 10);
      continue;
    }

    const dateMatch = line.match(DATE_REGEX);
    if (dateMatch && !purchase_date) {
      purchase_date = new Date(`${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`);
      continue;
    }

    const item = parseLine(line);
    if (item) items.push(item);
  }

  return { market_name, purchase_date, total_amount, items };
}

function validateGeometry(items, statedTotal) {
  if (!statedTotal || items.length === 0) return { valid: false, confidence: 0, diff: null };

  const calculated = items.reduce((s, i) => s + i.line_total, 0);
  const diff = Math.abs(calculated - statedTotal);
  const tolerance = 0.05;

  return {
    valid: diff <= tolerance,
    confidence: Math.max(0, 1 - diff / statedTotal),
    diff,
  };
}

module.exports = { parseReceipt, validateGeometry };
