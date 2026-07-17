import { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { PenSquare, Search } from 'lucide-react';

import { getArticles, deleteArticle } from '../../api/admin.api';
import ArticleEditor from '../../components/articles/ArticleEditor';
import { ConfirmDialog } from '../../../../components/ConfirmDialog';
import { ArticleRow } from './ArticleRow';

const DANH_MUC_FILTERS = [
  { value: 'all', label: 'Tất cả danh mục' },
  { value: 'suc_khoe', label: 'Sức khỏe' },
  { value: 'dieu_tri', label: 'Điều trị' },
  { value: 'tin_tuc', label: 'Tin tức' },
  { value: 'khuyen_mai', label: 'Khuyến mãi' },
  { value: 'phong_ngua', label: 'Phòng ngừa' }
];

const COMBINING_MARKS = new RegExp('[' + String.fromCharCode(0x300) + '-' + String.fromCharCode(0x36f) + ']', 'g');

const normalizeString = (str: string): string => {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .replace(/đ/g, 'd')
    .trim();
};

export default function ManageArticles() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [danhMucFilter, setDanhMucFilter] = useState('all');
  const [trangThaiFilter, setTrangThaiFilter] = useState<'all' | 'nhap' | 'xuat_ban'>('all');

  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getArticles();
      setArticles(res.data || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
      toast.error('Không thể tải danh sách bài viết');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredArticles = useMemo(() => {
    return articles.filter((a: any) => {
      const matchesSearch = normalizeString(a.tieu_de).includes(normalizeString(searchQuery));
      const matchesDanhMuc = danhMucFilter === 'all' || a.danh_muc === danhMucFilter;
      const matchesTrangThai = trangThaiFilter === 'all' || a.trang_thai === trangThaiFilter;
      return matchesSearch && matchesDanhMuc && matchesTrangThai;
    });
  }, [articles, searchQuery, danhMucFilter, trangThaiFilter]);

  const publishedCount = useMemo(() => articles.filter(a => a.trang_thai === 'xuat_ban').length, [articles]);
  const draftCount = useMemo(() => articles.filter(a => a.trang_thai === 'nhap').length, [articles]);

  const handleDelete = (article: any) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Xóa bài viết',
      message: `Bạn có chắc chắn muốn xóa bài viết "${article.tieu_de}" không? Hành động này không thể hoàn tác.`,
      onConfirm: async () => {
        setConfirmConfig(null);
        try {
          await deleteArticle(article.id);
          toast.success(`Đã xóa bài viết "${article.tieu_de}"`);
          fetchData();
        } catch (error: any) {
          toast.error(error.response?.data?.message || 'Không thể xóa bài viết');
        }
      }
    });
  };

  return (
    <div className="space-y-6 pb-8 text-zinc-800 font-sans text-sm min-h-[600px]">
      <AnimatePresence mode="wait">
        {!isEditorOpen ? (
          <motion.div
            key="articles-list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black font-heading text-secondary">Bài viết (Blog)</h2>
                <p className="text-xs text-slate-450 font-medium mt-0.5">
                  {articles.length} bài viết · {publishedCount} đã đăng · {draftCount} bản nháp
                </p>
              </div>
              <button
                onClick={() => { setEditingArticle(null); setIsEditorOpen(true); }}
                className="flex items-center gap-2 px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md transition-all text-xs shrink-0"
              >
                <PenSquare size={14} /> Viết bài mới
              </button>
            </div>

            <div className="p-6 bg-white border border-zinc-200 rounded-2xl shadow-sm space-y-4">
              <div className="flex flex-col lg:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm tiêu đề bài viết..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 rounded-xl text-xs outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 text-secondary font-bold placeholder-zinc-400 shadow-sm"
                  />
                </div>
                <select
                  value={danhMucFilter}
                  onChange={(e) => setDanhMucFilter(e.target.value)}
                  className="px-4 py-2.5 border border-zinc-200 rounded-xl bg-white text-xs outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 text-secondary font-bold shadow-sm cursor-pointer"
                >
                  {DANH_MUC_FILTERS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>

              <div className="flex border-t border-slate-100 pt-4 items-center gap-2 overflow-x-auto pb-1">
                {(['all', 'xuat_ban', 'nhap'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => setTrangThaiFilter(status)}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 shrink-0 border ${
                      trangThaiFilter === status
                        ? 'bg-secondary border-secondary text-white shadow-sm'
                        : 'bg-slate-55 border-zinc-200 text-slate-655 hover:bg-slate-100'
                    }`}
                  >
                    {status === 'all' ? 'Tất cả trạng thái' : status === 'xuat_ban' ? 'Đã đăng' : 'Bản nháp'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {loading ? (
                <div className="px-6 py-16 text-center text-zinc-450 bg-white border border-zinc-200 rounded-2xl shadow-sm">
                  <div className="animate-spin w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full mx-auto mb-3" />
                  <span className="font-heading text-xs font-bold uppercase tracking-wider">Đang tải danh sách bài viết...</span>
                </div>
              ) : filteredArticles.length === 0 ? (
                <div className="px-6 py-16 text-center text-zinc-400 bg-white border border-zinc-200 rounded-2xl shadow-sm">
                  <span className="font-heading font-bold text-xs uppercase tracking-wider text-secondary">Không tìm thấy bài viết nào phù hợp</span>
                  <p className="text-[10px] text-zinc-455 mt-1 font-semibold">Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc.</p>
                </div>
              ) : (
                filteredArticles.map((article) => (
                  <ArticleRow
                    key={article.id}
                    article={article}
                    onEdit={(a) => { setEditingArticle(a); setIsEditorOpen(true); }}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="articles-editor"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="w-full"
          >
            <ArticleEditor
              editingArticle={editingArticle}
              onClose={() => { setIsEditorOpen(false); setEditingArticle(null); }}
              onSuccess={() => { setIsEditorOpen(false); setEditingArticle(null); fetchData(); }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={!!confirmConfig?.isOpen}
        title={confirmConfig?.title || ''}
        message={confirmConfig?.message || ''}
        type="danger"
        onConfirm={confirmConfig?.onConfirm || (() => {})}
        onCancel={() => setConfirmConfig(null)}
      />
    </div>
  );
}
