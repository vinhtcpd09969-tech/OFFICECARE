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

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 pt-28 font-jakarta">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12 max-w-3xl mx-auto text-center">
          <span className="bg-[#14B8A6]/10 text-[#0D9488] border border-[#14B8A6]/20 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-3 shadow-sm">
            📰 GÓC SỨC KHỎE
          </span>
          <h1 className="font-heading font-black text-2xl md:text-3xl text-slate-900 tracking-tight leading-tight mb-3">
            Bài Viết & <span className="bg-gradient-to-r from-[#0D9488] to-[#14B8A6] bg-clip-text text-transparent">Kiến Thức Y Khoa</span>
          </h1>
          <p className="text-slate-500 font-semibold text-xs md:text-sm leading-relaxed max-w-2xl mx-auto">
            Cập nhật kiến thức phục hồi chức năng, phòng ngừa chấn thương và tin tức mới nhất từ đội ngũ chuyên gia OfficeCare.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {DANH_MUC_FILTERS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setDanhMuc(opt.value)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-200 border ${
                danhMuc === opt.value
                  ? 'bg-[#0D9488] border-[#0D9488] text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-[#14B8A6]/40'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {articles.length === 0 ? (
          <div className="text-center py-20 text-slate-400 font-semibold text-sm">
            Chưa có bài viết nào trong danh mục này.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article: any) => (
              <div
                key={article.id}
                onClick={() => navigate(`/tin-tuc/${article.slug}`)}
                className="group bg-white border border-slate-150 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer"
              >
                <div className="aspect-[16/9] bg-slate-100 overflow-hidden">
                  {article.anh_bia ? (
                    <img src={resolveImageUrl(article.anh_bia)} alt={article.tieu_de} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs font-bold">OfficeCare</div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-heading font-black text-sm text-slate-900 line-clamp-2 group-hover:text-[#0D9488] transition-colors mb-2">
                    {article.tieu_de}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium line-clamp-2 mb-4">{article.tom_tat}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                    <span className="flex items-center gap-1"><Calendar size={11} /> {article.ngay_dang ? new Date(article.ngay_dang).toLocaleDateString('vi-VN') : ''}</span>
                    <span className="flex items-center gap-1"><Clock size={11} /> {estimateReadMinutes(article.noi_dung)} phút đọc</span>
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
