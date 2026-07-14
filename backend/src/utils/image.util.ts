import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

const UPLOADS_ROOT = path.join(__dirname, '../../uploads');

const RESIZE_PRESETS: Record<string, number> = {
  blog: 1200,
  package: 1000,
  specialist: 800
};

export async function processAndSaveImage(buffer: Buffer, subDir: string): Promise<string> {
  const destDir = path.join(UPLOADS_ROOT, subDir);
  await fs.mkdir(destDir, { recursive: true });

  const maxWidth = RESIZE_PRESETS[subDir] || 1200;
  const filename = `${randomUUID()}.webp`;
  const filePath = path.join(destDir, filename);

  await sharp(buffer)
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(filePath);

  return `/uploads/${subDir}/${filename}`;
}
