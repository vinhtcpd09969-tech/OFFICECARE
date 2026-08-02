import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Calendar, Eye, List, ArrowLeft, Clock, Share2, Check, UserCheck, Bookmark, Sparkles, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { getPublicArticleBySlug, getPublicArticles } from '../api/public.api';
import { resolveImageUrl } from '../../../utils/imageUrl';
import LoadingScreen from '../../../components/LoadingScreen';

const DANH_MUC_LABELS: Record<string, string> = {
  suc_khoe: 'Sức khỏe văn phòng',
  dieu_tri: 'Phác đồ điều trị',
  tin_tuc: 'Tin tức y khoa',
  khuyen_mai: 'Ưu đãi & Gói tập',
  phong_ngua: 'Bài tập phòng ngừa'
};

interface TocItem {
  id: string;
  text: string;
  level: number;
}

function estimateReadMinutes(html: string): number {
  if (!html) return 3;
  const text = html.replace(/<[^>]*>/g, ' ');
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export default function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<any>(null);
  const [relatedArticles, setRelatedArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeId, setActiveId] = useState<string>('');
  const [fontSizeLevel, setFontSizeLevel] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [copiedShare, setCopiedShare] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Fetch Article Detail & Related Articles
  useEffect(() => {
    async function fetchData() {
      if (!slug) return;
      try {
        setLoading(true);
        const res = await getPublicArticleBySlug(slug);
        const artData = res.data;
        setArticle(artData);

        if (artData) {
          const relRes = await getPublicArticles(artData.danh_muc);
          const filteredRel = (relRes.data || [])
            .filter((a: any) => a.slug !== slug)
            .slice(0, 5);
          setRelatedArticles(filteredRel);
        }
      } catch (error) {
        toast.error('Không tìm thấy bài viết này.');
        navigate('/tin-tuc');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [slug, navigate]);

  // Extract Table of Contents & Attach IDs to DOM Headings once content renders
  useEffect(() => {
    if (!article || !article.noi_dung) return;

    // Small delay to ensure dangerouslySetInnerHTML has rendered into contentRef DOM
    const timer = setTimeout(() => {
      if (!contentRef.current) return;
      const headings = contentRef.current.querySelectorAll('h2, h3');
      const items: TocItem[] = [];

      headings.forEach((el, idx) => {
        const id = `article-section-${idx}`;
        el.id = id;
        el.classList.add('scroll-mt-28'); // Ensures offset below sticky header bar

        const text = el.textContent?.trim() || '';
        if (text) {
          items.push({
            id,
            text,
            level: el.tagName.toUpperCase() === 'H2' ? 2 : 3
          });
        }
      });

      setToc(items);
    }, 100);

    return () => clearTimeout(timer);
  }, [article]);

  // Track scroll position & active heading highlight
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, progress)));
      }

      if (!toc.length || !contentRef.current) return;
      const headings = contentRef.current.querySelectorAll('h2, h3');
      let currentActive = '';

      headings.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top <= 140) {
          currentActive = el.id;
        }
      });

      setActiveId(currentActive);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [toc]);

  // Smooth scroll to targeted TOC section with header offset
  const scrollToHeading = (id: string) => {
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveId(id);
    }
  };

  const handleCopyShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedShare(true);
    toast.success('Đã sao chép liên kết bài viết!');
    setTimeout(() => setCopiedShare(false), 2500);
  };

  const getFontSizeClass = () => {
    if (fontSizeLevel === 'large') return 'text-base leading-relaxed';
    if (fontSizeLevel === 'xlarge') return 'text-lg leading-relaxed';
    return 'text-sm sm:text-base leading-relaxed';
  };

  if (loading) return <LoadingScreen message="Đang tải bài viết y khoa..." />;
  if (!article) return null;

  const readMinutes = estimateReadMinutes(article.noi_dung);

  return (
    <div className="bg-slate-50/60 min-h-screen pb-16 font-jakarta">
      <Helmet>
        <title>{article.meta_title || article.tieu_de} | OfficeCare Rehab</title>
        <meta name="description" content={article.meta_description || article.tom_tat} />
        {article.meta_keywords && <meta name="keywords" content={article.meta_keywords} />}
      </Helmet>

      {/* Reading Progress Indicator */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-slate-200 z-50">
        <div
          className="h-full bg-[#0D9488] transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-5">
        
        {/* Navigation Breadcrumb & Back Button */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/tin-tuc'))}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-extrabold rounded-xl border border-slate-200/90 shadow-2xs transition-all duration-200 group cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#0D9488] group-hover:-translate-x-1 transition-transform" />
            <span>Trở lại</span>
          </button>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
            <Link to="/" className="hover:text-[#0D9488]">Trang chủ</Link>
            <span>/</span>
            <Link to="/tin-tuc" className="hover:text-[#0D9488]">Bài viết</Link>
            <span>/</span>
            <span className="text-[#0D9488] font-bold">
              {DANH_MUC_LABELS[article.danh_muc] || article.danh_muc}
            </span>
          </div>
        </div>

        {/* Header Article Card - Clean, Standard UX/UI Proportion */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 mb-5 shadow-2xs space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-[#0D9488]/10 text-[#0D9488] border border-[#0D9488]/20 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md">
              {DANH_MUC_LABELS[article.danh_muc] || article.danh_muc}
            </span>
            <span className="bg-amber-50 text-amber-700 border border-amber-200/60 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md flex items-center gap-1">
              <Sparkles size={11} /> Tham vấn y khoa
            </span>
          </div>

          <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight leading-snug">
            {article.tieu_de}
          </h1>

          {/* Author & Metadata Row */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-full bg-teal-100 text-[#0D9488] font-black text-xs flex items-center justify-center shrink-0 border border-teal-200/60">
                BS
              </div>
              <div>
                <p className="font-extrabold text-slate-800 text-xs flex items-center gap-1">
                  {article.nguoi_dung?.ho_ten || 'Hội đồng Y Khoa OfficeCare'}
                  <UserCheck size={13} className="text-[#0D9488]" />
                </p>
                <p className="text-[10px] text-slate-400 font-semibold">
                  Chuyên gia Phục hồi chức năng • Kiểm duyệt y khoa
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 text-slate-500 text-xs shrink-0">
              <span className="flex items-center gap-1"><Calendar size={12} className="text-[#0D9488]" /> {article.ngay_dang ? new Date(article.ngay_dang).toLocaleDateString('vi-VN') : ''}</span>
              <span className="flex items-center gap-1"><Clock size={12} className="text-[#0D9488]" /> {readMinutes} phút đọc</span>
              <span className="flex items-center gap-1"><Eye size={12} className="text-[#0D9488]" /> {article.luot_xem || 0} lượt xem</span>
            </div>
          </div>
        </div>

        {/* Balanced Cover Image (Full Aspect Ratio No Crop) */}
        {article.anh_bia && (
          <div className="w-full rounded-2xl overflow-hidden mb-6 border border-slate-200/80 bg-slate-100 shadow-2xs">
            <div className="w-full aspect-[21/9] md:aspect-[2.4/1] max-h-[340px] overflow-hidden relative">
              <img
                src={resolveImageUrl(article.anh_bia)}
                alt={article.tieu_de}
                className="w-full h-full object-cover rounded-2xl object-center"
              />
            </div>
          </div>
        )}

        {/* 2-Column Layout: Main Article Content (8 Cols) + Sticky Right Sidebar (4 Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT MAIN ARTICLE BODY (8 COLUMNS) */}
          <div className="lg:col-span-8 space-y-5">
            
            {/* Compact Toolbar */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-3 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500">Cỡ chữ:</span>
                <button
                  type="button"
                  onClick={() => setFontSizeLevel('normal')}
                  className={`px-2.5 py-0.5 rounded-md text-xs font-black transition-all ${
                    fontSizeLevel === 'normal' ? 'bg-[#0D9488] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  A
                </button>
                <button
                  type="button"
                  onClick={() => setFontSizeLevel('large')}
                  className={`px-2.5 py-0.5 rounded-md text-xs font-black transition-all ${
                    fontSizeLevel === 'large' ? 'bg-[#0D9488] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  A+
                </button>
                <button
                  type="button"
                  onClick={() => setFontSizeLevel('xlarge')}
                  className={`px-2.5 py-0.5 rounded-md text-xs font-black transition-all ${
                    fontSizeLevel === 'xlarge' ? 'bg-[#0D9488] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  A++
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsBookmarked(!isBookmarked);
                    toast.success(isBookmarked ? 'Đã bỏ lưu bài viết' : 'Đã lưu bài viết vào danh sách yêu thích!');
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    isBookmarked
                      ? 'bg-amber-50 text-amber-700 border-amber-300'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Bookmark size={12} className={isBookmarked ? 'fill-amber-500' : ''} />
                  <span>{isBookmarked ? 'Đã lưu' : 'Lưu bài'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyShare}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all cursor-pointer"
                >
                  {copiedShare ? <Check size={12} className="text-emerald-600" /> : <Share2 size={12} />}
                  <span>Chia sẻ</span>
                </button>
              </div>
            </div>

            {/* Article Main HTML Content with Standard Image Bounds & Headings */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-7 shadow-2xs">
              <style>{`
                .article-body-content img {
                  max-height: 420px !important;
                  width: auto !important;
                  max-width: 100% !important;
                  margin: 1.25rem auto !important;
                  border-radius: 12px !important;
                  border: 1px solid #e2e8f0 !important;
                  object-fit: contain !important;
                  display: block !important;
                  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.05) !important;
                }
                .article-body-content h2, .article-body-content h3 {
                  scroll-margin-top: 7rem !important;
                }
              `}</style>
              <div
                ref={contentRef}
                className={`article-body-content prose prose-slate max-w-none prose-a:text-[#0D9488] prose-headings:font-bold prose-headings:text-slate-900 prose-p:text-slate-700 prose-p:leading-relaxed ${getFontSizeClass()}`}
                dangerouslySetInnerHTML={{ __html: article.noi_dung }}
              />
            </div>

            {/* Author Credibility Footer Card */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row gap-3.5 items-center">
              <div className="size-11 rounded-xl bg-teal-100 text-[#0D9488] border border-teal-200/80 flex items-center justify-center text-xs font-black shrink-0">
                BS
              </div>
              <div className="space-y-0.5 text-center sm:text-left">
                <span className="text-[9px] font-black text-[#0D9488] uppercase tracking-widest bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                  Hội đồng Y Khoa Biên Soạn
                </span>
                <h4 className="text-xs font-black text-slate-900 pt-0.5">
                  {article.nguoi_dung?.ho_ten || 'Ban biên tập Y Khoa OfficeCare'}
                </h4>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  Bài viết được kiểm duyệt chuyên môn kỹ lưỡng bởi đội ngũ Bác sĩ CKI Phục hồi chức năng nhằm mang lại thông tin y khoa chính xác cho người bệnh.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT STICKY SIDEBAR (4 COLUMNS) */}
          <div className="lg:col-span-4 space-y-5 sticky top-28">
            
            {/* Widget 1: Table of Contents (Mục lục tự động Target chính xác 100%) */}
            {toc.length > 0 && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <List size={14} className="text-[#0D9488]" /> Mục Lục Bài Viết
                  </h4>
                  <span className="text-[10px] font-black text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                    {toc.length} mục
                  </span>
                </div>
                
                <ul className="space-y-1.5 max-h-[45vh] overflow-y-auto no-scrollbar pr-1">
                  {toc.map(item => (
                    <li key={item.id} className="relative">
                      <button
                        type="button"
                        onClick={() => scrollToHeading(item.id)}
                        className={`text-left text-xs transition-all duration-200 block w-full py-1.5 px-2.5 rounded-xl cursor-pointer ${
                          activeId === item.id
                            ? 'font-black bg-teal-50 text-[#0D9488] border border-teal-200/60 translate-x-0.5'
                            : 'font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        } ${item.level === 3 ? 'pl-4 text-[11px]' : ''}`}
                      >
                        {item.text}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Widget 2: Bài Viết Cùng Chủ Đề */}
            {relatedArticles.length > 0 && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={14} className="text-[#0D9488]" /> Bài Viết Cùng Chủ Đề
                  </h4>
                  <Link to="/tin-tuc" className="text-[10px] font-bold text-[#0D9488] hover:underline">
                    Xem tất cả
                  </Link>
                </div>

                <div className="space-y-2.5">
                  {relatedArticles.map((relArt) => (
                    <Link
                      key={relArt.id}
                      to={`/tin-tuc/${relArt.slug}`}
                      className="group flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200/60 overflow-hidden"
                    >
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200/60">
                        {relArt.anh_bia ? (
                          <img
                            src={resolveImageUrl(relArt.anh_bia)}
                            alt={relArt.tieu_de}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px] font-bold">
                            OfficeCare
                          </div>
                        )}
                      </div>
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <h5 className="font-extrabold text-xs text-slate-800 group-hover:text-[#0D9488] transition-colors leading-snug line-clamp-2">
                          {relArt.tieu_de}
                        </h5>
                        <span className="text-[10px] text-slate-400 font-semibold block">
                          {estimateReadMinutes(relArt.noi_dung)} phút đọc
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Minimal Fast Booking Action Link */}
                <div className="pt-2 border-t border-slate-100 text-center">
                  <Link
                    to="/booking"
                    className="inline-flex items-center gap-1 text-[11px] font-black text-[#0D9488] hover:underline uppercase tracking-wider"
                  >
                    <span>📅 Đặt lịch tư vấn bác sĩ 1:1</span>
                    <ChevronRight size={13} />
                  </Link>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
