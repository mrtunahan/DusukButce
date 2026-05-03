const PRICE_REGEX = /(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})\s*(?:TL|₺)?$/;
const KDV_LINE_REGEX = /[*K]?\s*%?\s*(01|10|20)\s*$/i;
const TOTAL_REGEX = /^(?:TOPLAM|TOPLAM\s*TUTAR|GENEL\s*TOPLAM)[\s:]*([\d.,]+)/i;
const DATE_REGEX = /(\d{2})[./\-](\d{2})[./\-](\d{4})/;
const TIME_REGEX = /(\d{2}):(\d{2})(?::(\d{2}))?/;
const RECEIPT_NO_REGEX = /F[İI][ŞS]\s*N[Oo][.:]?\s*(\d+)/i;
const TC_NO_REGEX = /\b[1-9]\d{10}\b/g;

const MARKET_DICTIONARY = [
  { pattern: /B[İI]M\s*A\.?\s*[ŞS]\.?/i, name: 'BİM' },
  { pattern: /A\s*101/i, name: 'A101' },
  { pattern: /M[İI]GROS/i, name: 'Migros' },
  { pattern: /[ŞS]OK\s*MARKET/i, name: 'ŞOK' },
  { pattern: /CARREFOUR/i, name: 'CarrefourSA' },
  { pattern: /MACROCENTER/i, name: 'Macrocenter' },
  { pattern: /HAKMAR/i, name: 'Hakmar' },
  { pattern: /ONUR\s*MARKET/i, name: 'Onur' },
];

function detectMarket(text) {
  for (const entry of MARKET_DICTIONARY) {
    if (entry.pattern.test(text)) return entry.name;
  }
  return null;
}

function maskTCNo(text) {
  return text.replace(TC_NO_REGEX, '***********');
}

module.exports = {
  PRICE_REGEX,
  KDV_LINE_REGEX,
  TOTAL_REGEX,
  DATE_REGEX,
  TIME_REGEX,
  RECEIPT_NO_REGEX,
  detectMarket,
  maskTCNo,
};
