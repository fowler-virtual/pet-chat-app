/**
 * Image Storage Service
 *
 * STORAGE_DRIVER=local   (default) — ローカルファイルシステム (development)
 * STORAGE_DRIVER=s3      — AWS S3 / S3互換ストレージ (production)
 *
 * S3 Setup:
 * 1. npm install @aws-sdk/client-s3
 * 2. Set environment variables:
 *    - STORAGE_DRIVER=s3
 *    - S3_BUCKET=your-bucket-name
 *    - S3_REGION=ap-northeast-1
 *    - AWS_ACCESS_KEY_ID=...
 *    - AWS_SECRET_ACCESS_KEY=...
 *    - S3_PUBLIC_URL=https://your-bucket.s3.ap-northeast-1.amazonaws.com (optional)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const STORAGE_DRIVER = process.env.STORAGE_DRIVER || 'local';
const UPLOAD_DIR = path.join(__dirname, 'data', 'uploads');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * 画像をアップロードして公開URLを返す
 * @param {Buffer} buffer - 画像データ
 * @param {string} mimeType - 'image/jpeg', 'image/png' etc.
 * @param {string} userId - ユーザーID
 * @returns {Promise<string>} 公開URL
 */
async function uploadImage(buffer, mimeType, userId) {
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error('file_too_large');
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(mimeType)) {
    throw new Error('invalid_file_type');
  }

  const ext = mimeType === 'image/png' ? '.png' : mimeType === 'image/webp' ? '.webp' : '.jpg';
  const filename = `${userId}/${crypto.randomUUID()}${ext}`;

  if (STORAGE_DRIVER === 's3') {
    return uploadToS3(buffer, filename, mimeType);
  }

  return uploadToLocal(buffer, filename);
}

async function uploadToLocal(buffer, filename) {
  const filePath = path.join(UPLOAD_DIR, filename);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, buffer);
  // ローカル開発時の URL
  const port = process.env.PORT || 3001;
  return `http://localhost:${port}/uploads/${filename}`;
}

async function uploadToS3(buffer, filename, mimeType) {
  const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
  const client = new S3Client({ region: process.env.S3_REGION || 'ap-northeast-1' });
  const bucket = process.env.S3_BUCKET;

  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: `avatars/${filename}`,
    Body: buffer,
    ContentType: mimeType,
  }));

  const publicUrl = process.env.S3_PUBLIC_URL || `https://${bucket}.s3.${process.env.S3_REGION || 'ap-northeast-1'}.amazonaws.com`;
  return `${publicUrl}/avatars/${filename}`;
}

/**
 * 画像を削除
 */
async function deleteImage(url) {
  if (STORAGE_DRIVER === 's3') {
    // S3 の場合はキーを抽出して削除
    try {
      const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
      const client = new S3Client({ region: process.env.S3_REGION || 'ap-northeast-1' });
      const key = url.split('/').slice(-3).join('/'); // avatars/userId/filename
      await client.send(new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
      }));
    } catch {
      // 削除失敗は無視
    }
    return;
  }

  // ローカルの場合
  const filename = url.replace(/^.*\/uploads\//, '');
  const filePath = path.join(UPLOAD_DIR, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

module.exports = {
  uploadImage,
  deleteImage,
  UPLOAD_DIR,
};
