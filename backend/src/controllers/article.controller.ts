import { Request, Response } from 'express';
import { ZodError } from 'zod';
import articleService from '../services/article.service';
import { articleSchema } from '../schemas/article.schema';

export const getArticles = async (req: Request, res: Response) => {
  try {
    const { danh_muc, trang_thai, search } = req.query as { danh_muc?: string; trang_thai?: string; search?: string };
    const articles = await articleService.getArticles({ danh_muc, trang_thai, search });
    res.json(articles);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách bài viết:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách bài viết' });
  }
};

export const getArticleById = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params as { id: string };
    const article = await articleService.getArticleById(id);
    res.json(article);
  } catch (error: any) {
    return res.status(400).json({ message: error.message || 'Không thể lấy bài viết' });
  }
};

export const createArticle = async (req: Request, res: Response): Promise<any> => {
  try {
    const { body } = articleSchema.parse({ body: req.body });
    const article = await articleService.createArticle(body, req.user.id);
    res.status(201).json(article);
  } catch (error: any) {
    if (error instanceof ZodError) return res.status(400).json({ message: error.errors[0].message });
    return res.status(400).json({ message: error.message || 'Không thể tạo bài viết' });
  }
};

export const updateArticle = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params as { id: string };
    const { body } = articleSchema.parse({ body: req.body });
    const article = await articleService.updateArticle(id, body);
    res.json(article);
  } catch (error: any) {
    if (error instanceof ZodError) return res.status(400).json({ message: error.errors[0].message });
    return res.status(400).json({ message: error.message || 'Không thể cập nhật bài viết' });
  }
};

export const deleteArticle = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params as { id: string };
    await articleService.deleteArticle(id);
    res.json({ message: 'Đã xóa bài viết thành công' });
  } catch (error: any) {
    return res.status(400).json({ message: error.message || 'Không thể xóa bài viết' });
  }
};

// --- Public ---

export const getPublicArticles = async (req: Request, res: Response) => {
  try {
    const { danh_muc } = req.query as { danh_muc?: string };
    const articles = await articleService.getPublicArticles(danh_muc);
    res.json(articles);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách bài viết public:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const getPublicArticleBySlug = async (req: Request, res: Response): Promise<any> => {
  try {
    const { slug } = req.params as { slug: string };
    const article = await articleService.getPublicArticleBySlug(slug);
    res.json(article);
  } catch (error: any) {
    return res.status(404).json({ message: error.message || 'Không tìm thấy bài viết' });
  }
};
