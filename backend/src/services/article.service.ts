import sanitizeHtml from 'sanitize-html';
import articleRepository from '../repositories/article.repository';

const ALLOWED_TAGS = ['p', 'h2', 'h3', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'br'];

const COMBINING_MARKS = new RegExp('[' + String.fromCharCode(0x300) + '-' + String.fromCharCode(0x36f) + ']', 'g');

function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

class ArticleService {
  async getArticles(filter: { danh_muc?: string; trang_thai?: string; search?: string }) {
    return articleRepository.getAll(filter);
  }

  async getArticleById(id: string) {
    const article = await articleRepository.getById(id);
    if (!article) {
      throw new Error('Không tìm thấy bài viết');
    }
    return article;
  }

  async createArticle(data: any, nguoiVietId: number) {
    const slug = data.slug ? slugify(data.slug) : slugify(data.tieu_de);
    const existing = await articleRepository.findBySlugExcludingId(slug);
    if (existing) {
      throw new Error(`Slug "${slug}" đã tồn tại, vui lòng chọn tiêu đề hoặc slug khác`);
    }

    const noiDungSach = sanitizeHtml(data.noi_dung, { allowedTags: ALLOWED_TAGS, allowedAttributes: { a: ['href', 'target', 'rel'], img: ['src', 'alt', 'loading'] } });

    return articleRepository.create({
      ...data,
      slug,
      noi_dung: noiDungSach,
      nguoi_viet_id: nguoiVietId,
      ngay_dang: data.trang_thai === 'xuat_ban' ? new Date() : null
    });
  }

  async updateArticle(id: string, data: any) {
    const current = await articleRepository.getById(id);
    if (!current) {
      throw new Error('Không tìm thấy bài viết');
    }

    const slug = data.slug ? slugify(data.slug) : slugify(data.tieu_de);
    const existing = await articleRepository.findBySlugExcludingId(slug, id);
    if (existing) {
      throw new Error(`Slug "${slug}" đã tồn tại, vui lòng chọn tiêu đề hoặc slug khác`);
    }

    const noiDungSach = sanitizeHtml(data.noi_dung, { allowedTags: ALLOWED_TAGS, allowedAttributes: { a: ['href', 'target', 'rel'], img: ['src', 'alt', 'loading'] } });

    const ngayDang = current.trang_thai !== 'xuat_ban' && data.trang_thai === 'xuat_ban'
      ? new Date()
      : current.ngay_dang;

    return articleRepository.update(id, {
      ...data,
      slug,
      noi_dung: noiDungSach,
      ngay_dang: ngayDang
    });
  }

  async deleteArticle(id: string) {
    const current = await articleRepository.getById(id);
    if (!current) {
      throw new Error('Không tìm thấy bài viết');
    }
    return articleRepository.delete(id);
  }

  async getPublicArticles(danhMuc?: string) {
    return articleRepository.getPublicList(danhMuc);
  }

  async getPublicArticleBySlug(slug: string) {
    const article = await articleRepository.getPublicBySlug(slug);
    if (!article) {
      throw new Error('Không tìm thấy bài viết');
    }
    await articleRepository.incrementViewCount(article.id);
    return article;
  }
}

export default new ArticleService();
