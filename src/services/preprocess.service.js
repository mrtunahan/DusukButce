const sharp = require('sharp');

async function preprocessForOCR(inputBuffer) {
  // Sharp ile temel önişleme (opencv4nodejs Node 20'de kırılgan olduğundan sadece sharp kullanıyoruz)
  const processed = await sharp(inputBuffer)
    .rotate()           // EXIF auto-rotate
    .grayscale()        // Renk → gri
    .normalize()        // Kontrast germe
    .sharpen()          // Keskinleştirme
    .threshold(128)     // Binary threshold (termal fiş için)
    .toBuffer();

  return processed;
}

async function computePHash(imageBuffer) {
  // 8x8 küçültülmüş gri piksel ortalamasına dayalı basit perceptual hash
  const { data } = await sharp(imageBuffer)
    .resize(8, 8, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const avg = data.reduce((s, v) => s + v, 0) / data.length;
  let hash = '';
  for (const pixel of data) hash += pixel >= avg ? '1' : '0';
  return BigInt('0b' + hash).toString(16).padStart(16, '0');
}

module.exports = { preprocessForOCR, computePHash };
