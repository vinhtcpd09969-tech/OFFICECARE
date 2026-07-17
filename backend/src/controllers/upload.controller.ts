import { Request, Response } from 'express';
import { processAndSaveImage } from '../utils/image.util';

const ALLOWED_TYPES = ['blog', 'package', 'specialist'];

export const uploadImage = async (req: Request, res: Response): Promise<any> => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Vui lòng chọn file ảnh' });
    }

    const type = typeof req.query.type === 'string' && ALLOWED_TYPES.includes(req.query.type)
      ? req.query.type
      : 'blog';

    const url = await processAndSaveImage(req.file.buffer, type);
    res.json({ url });
  } catch (error: any) {
    console.error('Lỗi khi upload ảnh:', error);
    res.status(400).json({ message: error.message || 'Không thể xử lý ảnh' });
  }
};
