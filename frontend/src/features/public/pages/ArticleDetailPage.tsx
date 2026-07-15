import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Calendar, Eye, ArrowRight, List } from 'lucide-react';
import toast from 'react-hot-toast';
import { getPublicArticleBySlug } from '../api/public.api';
import { resolveImageUrl } from '../../../utils/imageUrl';
import LoadingScreen from '../../../components/LoadingScreen';

const DANH_MUC_LABELS: Record<string, string> = {
  suc_khoe: 'Sức khỏe',
  dieu_tri: 'Điều trị',
  tin_tuc: 'Tin tức',
  khuyen_mai: 'Khuyến mãi',
  phong_ngua: 'Phòng ngừa'
};

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export default function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeId, setActiveId] = useState<string>('');
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchData() {
      if (!slug) return;
      try {
        setLoading(true);
        const res = await getPublicArticleBySlug(slug);
        setArticle(res.data);
      } catch (error) {
        toast.error('Không tìm thấy bài viết này.');
        navigate('/tin-tuc');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [slug, navigate]);

  // Tự sinh mục lục (TOC) từ heading h2/h3 sau khi nội dung được render
  useEffect(() => {
    if (!article || !contentRef.current) return;
    const headings = contentRef.current.querySelectorAll('h2, h3');
    const items: TocItem[] = [];
    headings.forEach((el, idx) => {
      if (!el.id) el.id = `heading-${idx}`;
      items.push({ id: el.id, text: el.textContent || '', level: el.tagName === 'H2' ? 2 : 3 });
    });
    setToc(items);
  }, [article]);

  // Lắng nghe scroll để tính tiến trình đọc và kích hoạt ScrollSpy
  useEffect(() => {
    const handleScroll = () => {
      // 1. Tính toán tiến trình đọc
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        setScrollProgress((window.scrollY / totalScroll) * 100);
      }

      // 2. ScrollSpy cho mục lục
      if (!toc.length) return;
      const headingElements = toc.map(item => document.getElementById(item.id));
      let currentActiveId = '';

      for (const el of headingElements) {
        if (el) {
          const rect = el.getBoundingClientRect();
          // Nếu phần tiêu đề cuộn đến khoảng trên màn hình
          if (rect.top <= 180) {
            currentActiveId = el.id;
          }
        }
      }

      if (currentActiveId) {
        setActiveId(currentActiveId);
      } else if (toc.length > 0) {
        setActiveId(toc[0].id);
      }
    };

    window.addEventListener('scroll', handleScroll);
    setTimeout(handleScroll, 200); // Trigger ban đầu sau khi vẽ xong
    return () => window.removeEventListener('scroll', handleScroll);
  }, [toc]);

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 120; // Tránh bị thanh header đè
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  if (loading) return <LoadingScreen />;
  if (!article) return null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    headline: article.tieu_de,
    image: article.anh_bia ? [resolveImageUrl(article.anh_bia)] : undefined,
    datePublished: article.ngay_dang,
    dateModified: article.ngay_cap_nhat,
    author: { '@type': 'Person', name: article.nguoi_dung?.ho_ten || 'OfficeCare' }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 pt-28 font-jakarta">
      <Helmet>
        <title>{article.meta_title || article.tieu_de} | OfficeCare</title>
        <meta name="description" content={article.meta_description || article.tom_tat} />
        {article.meta_keywords && <meta name="keywords" content={article.meta_keywords} />}
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      {/* Thanh tiến trình đọc y khoa chạy trên đầu */}
      <div className="fixed top-0 left-0 right-0 h-1.5 bg-slate-100 z-[9999]">
        <div className="h-full bg-gradient-to-r from-[#2EC4B6] to-[#0D9488] transition-all duration-75" style={{ width: `${scrollProgress}%` }}></div>
      </div>

      {/* Style tùy biến cục bộ cho hình ảnh trong bài viết không bị to quá cỡ */}
      <style>{`
        .prose-article img {
          max-width: 500px !important;
          width: 100% !important;
          max-height: 320px !important;
          margin: 2.5rem auto !important;
          object-fit: cover !important;
          border-radius: 1.5rem !important;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05) !important;
          display: block !important;
          border: 4px solid #ffffff !important;
        }
        .prose-article h2 {
          font-family: 'Plus Jakarta Sans', sans-serif !important;
          font-size: 1.45rem !important;
          font-weight: 800 !important;
          color: #0F172A !important;
          margin-top: 2.5rem !important;
          margin-bottom: 1.25rem !important;
          letter-spacing: -0.025em !important;
          line-height: 1.35 !important;
        }
        .prose-article h3 {
          font-family: 'Plus Jakarta Sans', sans-serif !important;
          font-size: 1.2rem !important;
          font-weight: 700 !important;
          color: #1E293B !important;
          margin-top: 1.8rem !important;
          margin-bottom: 0.9rem !important;
          line-height: 1.4 !important;
        }
        .prose-article p {
          font-size: 0.95rem !important;
          line-height: 1.8 !important;
          color: #475569 !important;
          margin-bottom: 1.5rem !important;
        }
        .prose-article ul {
          list-style-type: disc !important;
          padding-left: 1.5rem !important;
          margin-bottom: 1.5rem !important;
          font-size: 0.95rem !important;
          line-height: 1.8 !important;
          color: #475569 !important;
        }
        .prose-article li {
          margin-bottom: 0.5rem !important;
        }
      `}</style>

      <div className="max-w-5xl mx-auto px-6">
        
        {/* Quay lại & Breadcrumbs */}
        <div className="mb-6 flex items-center justify-between text-xs text-slate-400 font-semibold">
          <div className="flex items-center gap-1.5">
            <Link to="/" className="hover:text-primary transition-colors">Trang chủ</Link>
            <span>/</span>
            <Link to="/tin-tuc" className="hover:text-primary transition-colors">Tin tức</Link>
            <span>/</span>
            <span className="text-slate-600 truncate max-w-xs">{article.tieu_de}</span>
          </div>
          <Link to="/tin-tuc" className="text-slate-500 hover:text-slate-800 transition-colors">
            ← Tất cả bài viết
          </Link>
        </div>

        {/* Hero Header */}
        <div className="mb-10 text-center space-y-4">
          <span className="bg-[#14B8A6]/10 text-[#0D9488] border border-[#14B8A6]/20 text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full inline-block shadow-sm">
            {DANH_MUC_LABELS[article.danh_muc] || article.danh_muc}
          </span>
          <h1 className="font-heading font-black text-2xl md:text-4xl text-slate-900 tracking-tight leading-tight max-w-3xl mx-auto">
            {article.tieu_de}
          </h1>
          <div className="flex items-center justify-center gap-5 text-xs text-slate-400 font-semibold border-y border-slate-100 py-3 max-w-xl mx-auto">
            <span className="flex items-center gap-1.5"><Calendar size={13} /> {article.ngay_dang ? new Date(article.ngay_dang).toLocaleDateString('vi-VN') : ''}</span>
            <span className="flex items-center gap-1.5"><Eye size={13} /> {article.luot_xem} lượt xem</span>
            {article.nguoi_dung?.ho_ten && <span className="text-[#0D9488] font-bold">Tác giả: {article.nguoi_dung.ho_ten}</span>}
          </div>
        </div>

        {/* Constraint main cover image banner */}
        {article.anh_bia && (
          <div className="w-full max-h-[360px] rounded-[32px] overflow-hidden mb-12 shadow-md border border-slate-100">
            <img src={resolveImageUrl(article.anh_bia)} alt={article.tieu_de} className="w-full h-full max-h-[360px] object-cover hover:scale-[1.01] transition-transform duration-700" loading="lazy" />
          </div>
        )}

        {/* Grid Layout: Sidebar TOC & Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Active ScrollSpy Table of Contents Sidebar */}
          {toc.length > 0 && (
            <div className="hidden lg:block lg:col-span-3 sticky top-28">
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_15px_40px_rgba(15,23,42,0.015)] space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <List size={13} className="text-[#14B8A6]" /> Mục lục
                </h4>
                <ul className="space-y-3.5 border-l border-slate-100">
                  {toc.map(item => (
                    <li key={item.id} className="relative pl-4">
                      {/* Active Indicator bar */}
                      {activeId === item.id && (
                        <span className="absolute left-[-1.5px] top-1/2 -translate-y-1/2 w-1 h-4 bg-[#2EC4B6] rounded-r-md transition-all duration-300"></span>
                      )}
                      <button
                        onClick={() => scrollToHeading(item.id)}
                        className={`text-left text-xs transition-all duration-300 block py-0.5 ${
                          activeId === item.id
                            ? 'font-black text-[#0D9488] translate-x-1'
                            : 'font-semibold text-slate-450 hover:text-slate-700'
                        } ${item.level === 3 ? 'pl-3 text-[11px]' : ''}`}
                      >
                        {item.text}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Main Article Content */}
          <div className={toc.length > 0 ? 'lg:col-span-9 space-y-8' : 'lg:col-span-12 space-y-8'}>
            <div
              ref={contentRef}
              className="prose prose-slate max-w-none prose-a:text-[#0D9488] prose-article font-jakarta text-slate-700"
              dangerouslySetInnerHTML={{ __html: article.noi_dung }}
            />

            {/* Author info footer card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_15px_40px_rgba(15,23,42,0.015)] flex flex-col sm:flex-row gap-5 items-center">
              <div className="size-16 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center text-[#2EC4B6] text-xl font-black shrink-0">
                {article.nguoi_dung?.ho_ten?.charAt(0) || 'O'}
              </div>
              <div className="space-y-1 text-center sm:text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đội ngũ y tế biên soạn</p>
                <h4 className="text-sm font-black text-slate-800">{article.nguoi_dung?.ho_ten || 'Ban biên tập y khoa OfficeCare'}</h4>
                <p className="text-xs text-slate-450 font-semibold leading-relaxed">
                  Bài viết được xem duyệt chuyên môn y khoa kỹ lưỡng nhằm mang lại thông tin chính xác, tin cậy về phục hồi chức năng cơ xương khớp cho bệnh nhân.
                </p>
              </div>
            </div>

            {/* CTA đặt lịch */}
            <div className="mt-12 bg-gradient-to-br from-[#0D9488] to-[#14B8A6] rounded-[32px] p-10 text-center shadow-lg relative overflow-hidden text-white">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full pointer-events-none blur-xl"></div>
              <div className="relative z-10 space-y-4 max-w-md mx-auto">
                <h3 className="font-heading font-black text-xl md:text-2xl">Sẵn sàng bắt đầu hành trình phục hồi?</h3>
                <p className="text-teal-50 text-xs md:text-sm font-semibold leading-relaxed">
                  Đặt lịch tầm soát cột sống và cơ xương khớp ngay hôm nay để nhận tư vấn trực tiếp từ chuyên gia OfficeCare.
                </p>
                <div className="pt-2">
                  <Link
                    to="/booking"
                    className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-[#0D9488] font-black text-xs rounded-xl shadow-md hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all"
                  >
                    Đặt lịch ngay <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
