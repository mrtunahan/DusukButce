const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: randomUUID } = require('uuid');
const { s3, bucket } = require('../../config/storage');

async function uploadReceiptImage(buffer, userId, mimeType = 'image/jpeg') {
  const key = `receipts/${userId}/${Date.now()}-${randomUUID()}.jpg`;
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      ServerSideEncryption: 'AES256',
    })
  );
  return key;
}

async function getPresignedUrl(key) {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(s3, command, { expiresIn: 300 });
}

async function deleteReceiptImage(key) {
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

module.exports = { uploadReceiptImage, getPresignedUrl, deleteReceiptImage };
