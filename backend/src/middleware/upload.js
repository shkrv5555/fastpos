import multer from 'multer';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import path from 'path';
import { HttpError } from './errorHandler.js';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
mkdirSync(`${UPLOAD_DIR}/products`, { recursive: true });

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) return cb(null, true);
  cb(new HttpError(415, 'ONLY_IMAGES_ALLOWED'));
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE_MB || '5') * 1024 * 1024 },
});

// Şəkili WebP-ə çevir və yadda saxla
export async function processProductImage(buffer) {
  const filename = `${randomUUID()}.webp`;
  const filepath = path.join(UPLOAD_DIR, 'products', filename);

  await sharp(buffer)
    .resize(800, 600, { fit: 'cover', withoutEnlargement: true })
    .webp({ quality: 85 })
    .toFile(filepath);

  return `/uploads/products/${filename}`;
}
