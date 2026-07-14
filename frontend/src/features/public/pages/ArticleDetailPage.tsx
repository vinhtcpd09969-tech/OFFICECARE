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

  const scrollToHeading = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

      <div className="max-w-5xl mx-auto px-6">
        {/* Hero */}
        <div className="mb-8 text-center">
          <span className="bg-[#14B8A6]/10 text-[#0D9488] border border-[#14B8A6]/20 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-3 shadow-sm">
            {DANH_MUC_LABELS[article.danh_muc] || article.danh_muc}
          </span>
          <h1 className="font-heading font-black text-2xl md:text-3xl text-slate-900 tracking-tight leading-tight mb-4">
            {article.tieu_de}
          </h1>
          <div className="flex items-center justify-center gap-4 text-xs text-slate-450 font-semibold">
            <span className="flex items-center gap-1.5"><Calendar size={13} /> {article.ngay_dang ? new Date(article.ngay_dang).toLocaleDateString('vi-VN') : ''}</span>
            <span className="flex items-center gap-1.5"><Eye size={13} /> {article.luot_xem} lượt xem</span>
            {article.nguoi_dung?.ho_ten && <span>Bởi {article.nguoi_dung.ho_ten}</span>}
          </div>
        </div>

        {article.anh_bia && (
          <div className="aspect-video rounded-3xl overflow-hidden mb-10 shadow-lg">
            <img src={resolveImageUrl(article.anh_bia)} alt={article.tieu_de} className="w-full h-full object-cover" loading="lazy" />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* TOC Sidebar */}
          {toc.length > 0 && (
            <div className="hidden lg:block lg:col-span-3 sticky top-28">
              <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <List size={12} /> Mục lục
                </h4>
                <ul className="space-y-2">
                  {toc.map(item => (
                    <li key={item.id}>
                      <button
                        onClick={() => scrollToHeading(item.id)}
                        className={`text-left text-xs font-semibold text-slate-500 hover:text-[#0D9488] transition-colors ${item.level === 3 ? 'pl-3' : ''}`}
                      >
                        {item.text}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Content */}
          <div className={toc.length > 0 ? 'lg:col-span-9' : 'lg:col-span-12'}>
            <div
              ref={contentRef}
              className="prose prose-slate max-w-none prose-headings:font-heading prose-headings:font-black prose-a:text-[#0D9488]"
              dangerouslySetInnerHTML={{ __html: article.noi_dung }}
            />

            {/* CTA đặt lịch */}
            <div className="mt-12 bg-gradient-to-br from-[#0D9488] to-[#14B8A6] rounded-3xl p-8 text-center shadow-lg">
              <h3 className="font-heading font-black text-lg text-white mb-2">Sẵn sàng bắt đầu hành trình phục hồi?</h3>
              <p className="text-teal-50 text-xs font-semibold mb-5 max-w-md mx-auto">
                Đặt lịch khám ngay hôm nay để được chuyên gia OfficeCare tư vấn phác đồ phù hợp với bạn.
              </p>
              <Link
                to="/booking"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#0D9488] font-black text-xs rounded-xl shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                Đặt lịch ngay <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
