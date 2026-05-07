const { v4: randomUUID } = require('uuid');
const path = require('path');
const fs = require('fs');

const USE_S3 = !!(process.env.S3_ENDPOINT && process.env.S3_KEY);
const LOCAL_DIR = path.join(__dirname, '../../uploads');

// Yerel depolama klasörünü oluştur (S3 yoksa)
if (!USE_S3 && !fs.existsSync(LOCAL_DIR)) {
  fs.mkdirSync(LOCAL_DIR, { recursive: true });
}

async function uploadReceiptImage(buffer, userId, mimeType = 'image/jpeg') {
  const key = `receipts/${userId}/${Date.now()}-${randomUUID()}.jpg`;

  if (USE_S3) {
    const { PutObjectCommand } = require('@aws-sdk/client-s3');
    const { s3, bucket } = require('../../config/storage');
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        ServerSideEncryption: 'AES256',
      })
    );
  } else {
    const localPath = path.join(LOCAL_DIR, key.replace(/\//g, '_'));
    fs.mkdirSync(path.dirname(localPath), { recursive: true });
    fs.writeFileSync(localPath, buffer);
  }

  return key;
}

async function getPresignedUrl(key) {
  if (USE_S3) {
    const { GetObjectCommand } = require('@aws-sdk/client-s3');
    const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
    const { s3, bucket } = require('../../config/storage');
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    return getSignedUrl(s3, command, { expiresIn: 300 });
  }
  // Yerel modda URL dönemeyiz, null dön
  return null;
}

async function deleteReceiptImage(key) {
  if (USE_S3) {
    const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
    const { s3, bucket } = require('../../config/storage');
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  } else {
    const localPath = path.join(LOCAL_DIR, key.replace(/\//g, '_'));
    if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
  }
}

module.exports = { uploadReceiptImage, getPresignedUrl, deleteReceiptImage };
