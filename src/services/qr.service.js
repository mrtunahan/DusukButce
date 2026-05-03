const jsQR = require('jsqr');
const sharp = require('sharp');

async function readReceiptQR(imageBuffer) {
  const { data, info } = await sharp(imageBuffer)
    .raw()
    .ensureAlpha()
    .toBuffer({ resolveWithObject: true });

  const code = jsQR(new Uint8ClampedArray(data), info.width, info.height);
  if (!code) return null;

  return parseGIBPayload(code.data);
}

function parseGIBPayload(payload) {
  // GİB QR formatı cihaz markasına göre varyasyon gösterebilir
  const parts = payload.split(/[|\t]/);
  if (parts.length < 3) return { raw: payload };

  return {
    vkn: parts[0] || null,
    receipt_no: parts[1] || null,
    purchase_date: parseGIBDate(parts[2]),
    total_amount: parseGIBAmount(parts[3]),
    raw: payload,
  };
}

function parseGIBDate(str) {
  if (!str) return null;
  // Format: DD/MM/YYYY HH:MM:SS veya YYYYMMDDHHMMSS
  const m = str.match(/(\d{2})[./](\d{2})[./](\d{4})/);
  if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}`);
  if (str.length >= 8) {
    return new Date(`${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}`);
  }
  return null;
}

function parseGIBAmount(str) {
  if (!str) return null;
  return parseFloat(str.replace(',', '.')) || null;
}

module.exports = { readReceiptQR };
