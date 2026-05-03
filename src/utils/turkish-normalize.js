const MAP = {
  ı: 'i', İ: 'i', ş: 's', Ş: 's', ğ: 'g', Ğ: 'g',
  ü: 'u', Ü: 'u', ö: 'o', Ö: 'o', ç: 'c', Ç: 'c',
};

function normalize(text) {
  return text
    .toLowerCase()
    .split('')
    .map((ch) => MAP[ch] || ch)
    .join('')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const UNIT_REGEX = /(\d+(?:[.,]\d+)?)\s*(l|ml|kg|gr?|adet|paket|pkt)\b/i;
const UNIT_NORM = { GR: 'G', G: 'G', L: 'L', ML: 'ML', KG: 'KG', ADET: 'ADET', PAKET: 'PAKET', PKT: 'PAKET' };

function extractUnit(text) {
  const m = text.match(UNIT_REGEX);
  if (!m) return { unit: null, size: null };
  const raw = m[2].toUpperCase().replace('GR', 'G');
  return { size: parseFloat(m[1].replace(',', '.')), unit: UNIT_NORM[raw] || raw };
}

const STOPWORDS = new Set(['ve', 'ile', 'tam', 'adet', 'bir', 'ile']);

function tokenize(text) {
  return normalize(text)
    .split(' ')
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}

function jaccard(a, b) {
  const sa = new Set(a);
  const sb = new Set(b);
  const intersection = [...sa].filter((x) => sb.has(x)).length;
  const union = new Set([...sa, ...sb]).size;
  return union === 0 ? 0 : intersection / union;
}

module.exports = { normalize, extractUnit, tokenize, jaccard };
