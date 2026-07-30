import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock } from 'lucide-react';
import { getPublicArticles } from '../api/public.api';
import LoadingScreen from '../../../components/LoadingScreen';
import { resolveImageUrl } from '../../../utils/imageUrl';

const DANH_MUC_FILTERS = [
  { value: 'ALL', label: 'Tất cả bài viết' },
  { value: 'suc_khoe', label: 'Sức khỏe' },
  { value: 'dieu_tri', label: 'Điều trị' },
  { value: 'tin_tuc', label: 'Tin tức' },
  { value: 'khuyen_mai', label: 'Khuyến mãi' },
  { value: 'phong_ngua', label: 'Phòng ngừa' }
];

function estimateReadMinutes(html: string): number {
  const text = html.replace(/<[^>]*>/g, ' ');
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export default function Articles() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [danhMuc, setDanhMuc] = useState('ALL');

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const res = await getPublicArticles(danhMuc === 'ALL' ? undefined : danhMuc);
        setArticles(res.data || []);
      } catch (err) {
        console.error('Lỗi khi lấy danh sách bài viết:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [danhMuc]);

  if (loading) return <LoadingScreen />;

  const featuredArticle = articles.length > 0 ? articles[0] : null;
  const gridArticles = articles.length > 1 ? articles.slice(1) : articles;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 pt-28 font-jakarta">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Clean Hero Header - No Top Badge */}
        <div className="mb-10 max-w-3xl mx-auto text-center space-y-2">
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl md:text-[32px] text-slate-900 tracking-tight leading-snug">
            Bài Viết &amp; Kiến Thức Y Khoa
          </h1>
          <p className="text-slate-600 font-normal text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto">
            Cập nhật kiến thức phục hồi chức năng, phòng ngừa chấn thương và tin tức mới nhất từ đội ngũ chuyên gia OfficeCare.
          </p>
        </div>

        {/* Search & Segmented Filter Control Bar */}
        <div className="bg-white rounded-[28px] border border-slate-200/80 p-4 md:p-5 mb-10 shadow-[0_10px_35px_rgba(15,23,42,0.03)]">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {DANH_MUC_FILTERS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setDanhMuc(opt.value)}
                className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all duration-200 cursor-pointer ${
                  danhMuc === opt.value
                    ? 'bg-[#0D9488] text-white shadow-sm shadow-teal-500/20'
                    : 'bg-slate-50 border border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Article Hero Card (Top Featured Post) */}
        {featuredArticle && danhMuc === 'ALL' && (
          <div
            onClick={() => navigate(`/tin-tuc/${featuredArticle.slug}`)}
            className="group bg-white rounded-[28px] border border-slate-200/80 p-6 md:p-7 mb-10 shadow-sm hover:shadow-md hover:border-[#0D9488]/40 transition-all duration-300 cursor-pointer"
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-6 aspect-[16/10] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/70 relative">
                <span className="absolute top-3 left-3 bg-[#0D9488] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-lg z-10 shadow-sm">
                  ★ Bài viết nổi bật
                </span>
                {featuredArticle.anh_bia ? (
                  <img src={resolveImageUrl(featuredArticle.anh_bia)} alt={featuredArticle.tieu_de} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">OfficeCare Medical Article</div>
                )}
              </div>

              <div className="md:col-span-6 space-y-3 text-left">
                <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                  <span className="flex items-center gap-1.5"><Calendar size={13} className="text-[#0D9488]" /> {featuredArticle.ngay_dang ? new Date(featuredArticle.ngay_dang).toLocaleDateString('vi-VN') : ''}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5"><Clock size={13} className="text-[#0D9488]" /> {estimateReadMinutes(featuredArticle.noi_dung)} phút đọc</span>
                </div>

                <h2 className="font-heading font-extrabold text-xl md:text-2xl text-slate-900 leading-snug group-hover:text-[#0D9488] transition-colors">
                  {featuredArticle.tieu_de}
                </h2>

                <p className="text-xs text-slate-600 font-normal leading-relaxed line-clamp-3">
                  {featuredArticle.tom_tat}
                </p>

                <div className="pt-2">
                  <span className="inline-flex items-center gap-1.5 bg-slate-50 group-hover:bg-[#0D9488] border border-slate-200 group-hover:border-[#0D9488] text-slate-700 group-hover:text-white px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200">
                    <span>Đọc bài viết</span>
                    <span>→</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3-Column Grid of Articles */}
        {gridArticles.length === 0 ? (
          <div className="text-center py-20 text-slate-400 font-semibold text-sm">
            Chưa có bài viết nào trong danh mục này.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {gridArticles.map((article: any) => (
              <div
                key={article.id}
                onClick={() => navigate(`/tin-tuc/${article.slug}`)}
                className="group bg-white rounded-[28px] border border-slate-200/80 p-5 md:p-6 shadow-sm hover:shadow-md hover:border-[#0D9488]/40 transition-all duration-300 flex flex-col h-full cursor-pointer"
              >
                <div className="aspect-[16/10] w-full rounded-2xl overflow-hidden border border-slate-200/70 bg-slate-100 mb-4 shrink-0 relative">
                  {article.anh_bia ? (
                    <img src={resolveImageUrl(article.anh_bia)} alt={article.tieu_de} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">OfficeCare</div>
                  )}
                </div>

                <div className="flex-1 flex flex-col text-left space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                    <span className="flex items-center gap-1"><Calendar size={12} className="text-[#0D9488]" /> {article.ngay_dang ? new Date(article.ngay_dang).toLocaleDateString('vi-VN') : ''}</span>
                    <span className="flex items-center gap-1"><Clock size={12} className="text-[#0D9488]" /> {estimateReadMinutes(article.noi_dung)} phút đọc</span>
                  </div>

                  <h3 className="font-heading font-extrabold text-base text-slate-900 leading-snug group-hover:text-[#0D9488] transition-colors line-clamp-2 pt-0.5">
                    {article.tieu_de}
                  </h3>

                  <p className="text-xs text-slate-600 font-normal leading-relaxed line-clamp-2 flex-1">
                    {article.tom_tat}
                  </p>

                  <div className="pt-3 mt-auto">
                    <span className="bg-slate-50 group-hover:bg-slate-100 border border-slate-200 group-hover:border-[#0D9488] text-slate-700 group-hover:text-[#0D9488] text-center font-bold py-2.5 px-4 rounded-xl text-xs transition-all duration-200 flex items-center justify-center gap-1 w-full">
                      <span>Đọc chi tiết →</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
