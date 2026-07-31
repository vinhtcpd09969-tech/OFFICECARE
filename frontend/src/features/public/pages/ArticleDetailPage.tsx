import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Calendar, Eye, List, Play, Square, ArrowLeft, Clock, Share2, Check, UserCheck, Volume2, Bookmark, Sparkles, ChevronRight } from 'lucide-react';
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

const wrapTextNodes = (node: Node, doc: Document, sentences: string[], counter: { val: number }) => {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent || '';
    if (text.trim().length === 0) return node;

    const parts = text.split(/(?<=[.!?])\s+/);
    const fragment = doc.createDocumentFragment();

    parts.forEach((part) => {
      const trimmed = part.trim();
      if (trimmed.length > 0) {
        const span = doc.createElement('span');
        span.className = 'tts-sentence transition-all duration-300 rounded-sm px-0.5';
        span.setAttribute('data-sentence-index', String(counter.val));
        span.textContent = part + ' ';
        fragment.appendChild(span);

        sentences.push(trimmed);
        counter.val++;
      } else {
        fragment.appendChild(doc.createTextNode(part));
      }
    });

    return fragment;
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    if (['SCRIPT', 'STYLE', 'BUTTON', 'A'].includes(node.nodeName)) {
      return node;
    }

    const element = node as Element;
    const childNodes = Array.from(element.childNodes);
    element.innerHTML = '';

    childNodes.forEach((child) => {
      const processed = wrapTextNodes(child, doc, sentences, counter);
      element.appendChild(processed);
    });
  }

  return node;
};

const wrapSentencesInHtml = (html: string) => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const sentences: string[] = [];
  const counter = { val: 1 };

  const body = doc.body;
  const childNodes = Array.from(body.childNodes);
  body.innerHTML = '';

  childNodes.forEach((child) => {
    const processed = wrapTextNodes(child, doc, sentences, counter);
    body.appendChild(processed);
  });

  return {
    processedHtml: body.innerHTML,
    sentences
  };
};

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

  // AI Text-to-Speech (TTS) states & logic
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState(1.0);
  const [processedHtml, setProcessedHtml] = useState('');
  const [currentSentenceIdx, setCurrentSentenceIdx] = useState<number>(-1);
  const currentSentenceIndex = useRef(0);
  const sentencesRef = useRef<string[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
            .slice(0, 5); // Up to 5 related articles for vertical sidebar
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

  // Pre-process and wrap sentences when article loads
  useEffect(() => {
    if (!article) return;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
    const serverOrigin = baseUrl.replace(/\/api\/?$/, '');
    const absoluteHtml = (article.noi_dung || '').replace(/src="\/uploads\//g, `src="${serverOrigin}/uploads/`);
    
    const { processedHtml: wrappedHtml, sentences } = wrapSentencesInHtml(absoluteHtml);
    setProcessedHtml(wrappedHtml);

    const titleText = article.tieu_de;
    sentencesRef.current = [titleText, ...sentences];
    currentSentenceIndex.current = 0;
    setCurrentSentenceIdx(-1);
  }, [article]);

  // Handle visual highlight and auto-scroll for TTS
  useEffect(() => {
    const allSpans = document.querySelectorAll('.tts-sentence');
    allSpans.forEach(span => {
      span.removeAttribute('data-active');
    });

    if (currentSentenceIdx >= 0) {
      const activeEl = document.querySelector(`[data-sentence-index="${currentSentenceIdx}"]`);
      if (activeEl) {
        activeEl.setAttribute('data-active', 'true');
        activeEl.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  }, [currentSentenceIdx]);

  // Click-to-read from target sentence
  useEffect(() => {
    const contentEl = contentRef.current;
    if (!contentEl) return;

    const handleContentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const span = target.closest('.tts-sentence');
      if (span) {
        const idx = parseInt(span.getAttribute('data-sentence-index') || '-1', 10);
        if (idx >= 0 && sentencesRef.current[idx]) {
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
          }
          if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
          }
          
          currentSentenceIndex.current = idx;
          setCurrentSentenceIdx(idx);
          setIsPlaying(true);
          setIsPaused(false);
          speakSentence();
        }
      }
    };

    contentEl.addEventListener('click', handleContentClick);
    return () => {
      contentEl.removeEventListener('click', handleContentClick);
    };
  }, [processedHtml]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakSentence = () => {
    if (currentSentenceIndex.current >= sentencesRef.current.length) {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentSentenceIdx(-1);
      return;
    }

    const text = sentencesRef.current[currentSentenceIndex.current];
    setCurrentSentenceIdx(currentSentenceIndex.current);
    
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      const url = `${baseUrl}/client/tts?text=${encodeURIComponent(text)}`;
      
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      const audio = new Audio(url);
      audio.playbackRate = rate;
      audioRef.current = audio;

      audio.onended = () => {
        currentSentenceIndex.current++;
        speakSentence();
      };

      audio.onerror = () => {
        speakSentenceWebSpeech(text);
      };

      audio.play().catch(() => {
        speakSentenceWebSpeech(text);
      });
    } catch (error) {
      speakSentenceWebSpeech(text);
    }
  };

  const speakSentenceWebSpeech = (text: string) => {
    if (!window.speechSynthesis) {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentSentenceIdx(-1);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const allVoices = window.speechSynthesis.getVoices();
    const viVoice = allVoices.find(v => v.lang.toLowerCase().includes('vi'));
    if (viVoice) {
      utterance.voice = viVoice;
    }
    
    utterance.rate = rate;

    utterance.onend = () => {
      currentSentenceIndex.current++;
      speakSentence();
    };

    utterance.onerror = (e) => {
      if (e.error !== 'interrupted') {
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentSentenceIdx(-1);
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      if (isPaused) {
        if (audioRef.current) {
          audioRef.current.play().catch(() => {});
        } else if (window.speechSynthesis) {
          window.speechSynthesis.resume();
        }
        setIsPaused(false);
      } else {
        if (audioRef.current) {
          audioRef.current.pause();
        } else if (window.speechSynthesis) {
          window.speechSynthesis.pause();
        }
        setIsPaused(true);
      }
    } else {
      setIsPlaying(true);
      setIsPaused(false);
      speakSentence();
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
    currentSentenceIndex.current = 0;
    setCurrentSentenceIdx(-1);
  };

  const cycleRate = () => {
    let nextRate = 1.0;
    if (rate === 1.0) nextRate = 1.25;
    else if (rate === 1.25) nextRate = 1.5;
    else nextRate = 1.0;
    
    setRate(nextRate);
  };

  useEffect(() => {
    if (isPlaying && !isPaused) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      speakSentence();
    }
  }, [rate]);

  // Generate Table of Contents (TOC) from heading h2/h3
  useEffect(() => {
    if (!article || !contentRef.current) return;
    const headings = contentRef.current.querySelectorAll('h2, h3');
    const items: TocItem[] = [];
    headings.forEach((el, idx) => {
      if (!el.id) el.id = `heading-${idx}`;
      items.push({ id: el.id, text: el.textContent || '', level: el.tagName === 'H2' ? 2 : 3 });
    });
    setToc(items);
  }, [article, processedHtml]);

  // ScrollSpy & Reading Progress
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        setScrollProgress((window.scrollY / totalScroll) * 100);
      }

      if (!toc.length) return;
      const headingElements = toc.map(item => document.getElementById(item.id));
      let currentActiveId = '';

      for (const el of headingElements) {
        if (el) {
          const rect = el.getBoundingClientRect();
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
    setTimeout(handleScroll, 200);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [toc]);

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 120;
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

  const handleCopyShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedShare(true);
    toast.success('Đã sao chép đường dẫn bài viết!');
    setTimeout(() => setCopiedShare(false), 3000);
  };

  if (loading) return <LoadingScreen />;
  if (!article) return null;

  const readMinutes = estimateReadMinutes(article.noi_dung);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    headline: article.tieu_de,
    image: article.anh_bia ? [resolveImageUrl(article.anh_bia)] : undefined,
    datePublished: article.ngay_dang,
    dateModified: article.ngay_cap_nhat,
    author: { '@type': 'Person', name: article.nguoi_dung?.ho_ten || 'OfficeCare' }
  };

  const getFontSizeClass = () => {
    if (fontSizeLevel === 'large') return 'text-[1.05rem]';
    if (fontSizeLevel === 'xlarge') return 'text-[1.15rem]';
    return 'text-[0.95rem]';
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 pt-28 font-jakarta">
      <Helmet>
        <title>{article.meta_title || article.tieu_de} | OfficeCare</title>
        <meta name="description" content={article.meta_description || article.tom_tat} />
        {article.meta_keywords && <meta name="keywords" content={article.meta_keywords} />}
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      {/* Top Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1.5 bg-slate-100 z-[9999]">
        <div
          className="h-full bg-gradient-to-r from-[#14B8A6] via-[#0D9488] to-emerald-600 transition-all duration-75 shadow-sm"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <style>{`
        .prose-article img {
          max-width: 580px !important;
          width: 100% !important;
          max-height: 320px !important;
          margin: 2rem auto !important;
          object-fit: cover !important;
          border-radius: 1.25rem !important;
          box-shadow: 0 10px 25px rgba(15, 23, 42, 0.05) !important;
          display: block !important;
          border: 3px solid #ffffff !important;
        }
        .prose-article h2 {
          font-family: 'Plus Jakarta Sans', sans-serif !important;
          font-size: 1.35rem !important;
          font-weight: 800 !important;
          color: #0F172A !important;
          margin-top: 2rem !important;
          margin-bottom: 1rem !important;
          letter-spacing: -0.02em !important;
          line-height: 1.35 !important;
        }
        .prose-article h3 {
          font-family: 'Plus Jakarta Sans', sans-serif !important;
          font-size: 1.1rem !important;
          font-weight: 700 !important;
          color: #1E293B !important;
          margin-top: 1.5rem !important;
          margin-bottom: 0.75rem !important;
          line-height: 1.4 !important;
        }
        .prose-article p {
          line-height: 1.8 !important;
          color: #334155 !important;
          margin-bottom: 1.3rem !important;
        }
        .prose-article ul {
          list-style-type: disc !important;
          padding-left: 1.4rem !important;
          margin-bottom: 1.3rem !important;
          line-height: 1.8 !important;
          color: #334155 !important;
        }
        .prose-article li {
          margin-bottom: 0.4rem !important;
        }
        @keyframes bounce-bar {
          0%, 100% { height: 4px; }
          50% { height: 14px; }
        }
        .tts-sentence {
          cursor: pointer;
          transition: background-color 0.2s ease, border-bottom 0.2s ease;
        }
        .tts-sentence:hover {
          background-color: rgba(13, 148, 136, 0.06);
        }
        .tts-sentence[data-active="true"] {
          background-color: rgba(46, 196, 182, 0.2) !important;
          border-bottom: 2px solid #0D9488 !important;
          color: #0F172A !important;
          font-weight: 600 !important;
        }
      `}</style>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Navigation Breadcrumb & Back Button */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
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

        {/* Compact Header Article Card */}
        <div className="bg-white rounded-[24px] border border-slate-200/80 p-5 sm:p-6 mb-6 shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-[#0D9488]/10 text-[#0D9488] border border-[#0D9488]/20 text-[10px] font-black uppercase tracking-widest px-3 py-0.5 rounded-md">
              {DANH_MUC_LABELS[article.danh_muc] || article.danh_muc}
            </span>
            <span className="bg-amber-50 text-amber-700 border border-amber-200/60 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md flex items-center gap-1">
              <Sparkles size={11} /> Tham vấn y khoa
            </span>
          </div>

          <h1 className="font-heading font-black text-xl sm:text-2xl md:text-3xl text-slate-900 tracking-tight leading-snug">
            <span className="tts-sentence transition-all duration-300 rounded-sm px-0.5" data-sentence-index="0">
              {article.tieu_de}
            </span>
          </h1>

          {/* Author & Metadata Row */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-full bg-teal-100 text-[#0D9488] font-black text-xs flex items-center justify-center shrink-0">
                BS
              </div>
              <div>
                <p className="font-extrabold text-slate-800 text-xs flex items-center gap-1">
                  {article.nguoi_dung?.ho_ten || 'Hội đồng Y Khoa OfficeCare'}
                  <UserCheck size={13} className="text-[#0D9488]" />
                </p>
                <p className="text-[10px] text-slate-400 font-semibold">
                  Chuyên gia Phục hồi chức năng • Kiểm duyệt y y khoa
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 text-slate-500 text-xs shrink-0">
              <span className="flex items-center gap-1"><Calendar size={12} className="text-[#0D9488]" /> {article.ngay_dang ? new Date(article.ngay_dang).toLocaleDateString('vi-VN') : ''}</span>
              <span className="flex items-center gap-1"><Clock size={12} className="text-[#0D9488]" /> {readMinutes} phút đọc</span>
              <span className="flex items-center gap-1"><Eye size={12} className="text-[#0D9488]" /> {article.luot_xem || 0} lượt xem</span>
            </div>
          </div>

          {/* Sleek Compact AI Reader Widget */}
          <div className="bg-gradient-to-r from-teal-50/80 via-white to-teal-50/80 border border-teal-200/70 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="size-7 rounded-lg bg-[#0D9488] text-white flex items-center justify-center shrink-0">
                <Volume2 size={15} />
              </div>
              <div>
                <p className="font-extrabold text-slate-900 text-xs flex items-center gap-1">
                  Nghe đọc bài viết AI (Tiếng Việt)
                  {isPlaying && !isPaused && (
                    <span className="flex items-end gap-0.5 h-2.5 ml-1">
                      <span className="w-0.5 bg-[#0D9488] rounded-full" style={{ animation: 'bounce-bar 1.2s infinite ease-in-out', animationDelay: '0.1s' }} />
                      <span className="w-0.5 bg-[#0D9488] rounded-full" style={{ animation: 'bounce-bar 1.2s infinite ease-in-out', animationDelay: '0.3s' }} />
                      <span className="w-0.5 bg-[#0D9488] rounded-full" style={{ animation: 'bounce-bar 1.2s infinite ease-in-out', animationDelay: '0.5s' }} />
                    </span>
                  )}
                </p>
                <p className="text-[10px] text-slate-400 font-medium">
                  Click vào bất kỳ câu nào trong bài viết để phát từ vị trí đó.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handlePlayPause}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#0D9488] hover:bg-[#0b7a70] text-white text-xs font-extrabold rounded-lg transition-all cursor-pointer"
              >
                {isPlaying && !isPaused ? (
                  <span>Tạm dừng</span>
                ) : (
                  <>
                    <Play size={11} className="fill-current" />
                    <span>{isPaused ? 'Tiếp tục' : 'Nghe đọc ngay'}</span>
                  </>
                )}
              </button>

              {isPlaying && (
                <button
                  type="button"
                  onClick={handleStop}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 text-rose-600 text-xs font-bold rounded-lg"
                >
                  <Square size={10} className="fill-current" />
                </button>
              )}

              <button
                type="button"
                onClick={cycleRate}
                className="px-2.5 py-1.5 bg-slate-100 text-slate-700 text-[11px] font-bold rounded-lg border border-slate-200"
              >
                Tốc độ: {rate}x
              </button>
            </div>
          </div>
        </div>

        {/* Compact Balanced Cover Image (Dành khoảng trống vừa phải, không bị tràn màn hình) */}
        {article.anh_bia && (
          <div className="w-full max-w-3xl mx-auto rounded-2xl overflow-hidden mb-8 border border-slate-200/80 bg-slate-900 shadow-2xs">
            <div className="aspect-[16/9] md:aspect-[21/9] w-full max-h-[300px] overflow-hidden relative">
              <img
                src={resolveImageUrl(article.anh_bia)}
                alt={article.tieu_de}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* 2-Column Layout: Main Article Content (8 Cols) + Sticky Right Sidebar (4 Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          
          {/* LEFT MAIN ARTICLE BODY (8 COLUMNS) */}
          <div className="lg:col-span-8 space-y-6">
            
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
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
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
                  className="inline-flex items-center gap-1 px-3 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all cursor-pointer"
                >
                  {copiedShare ? <Check size={12} className="text-emerald-600" /> : <Share2 size={12} />}
                  <span>Chia sẻ</span>
                </button>
              </div>
            </div>

            {/* Article Main HTML Content */}
            <div className="bg-white rounded-[24px] border border-slate-200/80 p-5 sm:p-7 md:p-8 shadow-2xs">
              <div
                ref={contentRef}
                className={`prose prose-slate max-w-none prose-a:text-[#0D9488] prose-article font-jakarta text-slate-700 ${getFontSizeClass()}`}
                dangerouslySetInnerHTML={{ __html: processedHtml || article.noi_dung }}
              />
            </div>

            {/* Author Credibility Footer Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row gap-4 items-center">
              <div className="size-12 rounded-xl bg-teal-100 text-[#0D9488] border border-teal-200/80 flex items-center justify-center text-sm font-black shrink-0">
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
                  Bài viết được xem duyệt chuyên môn kỹ lưỡng bởi đội ngũ Bác sĩ CKI Phục hồi chức năng nhằm mang lại thông tin y khoa chính xác cho người bệnh.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT STICKY SIDEBAR (4 COLUMNS) */}
          <div className="lg:col-span-4 space-y-5 sticky top-28">
            
            {/* Widget 1: Table of Contents (Mục lục tự động ScrollSpy) */}
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
                
                <ul className="space-y-2 max-h-[45vh] overflow-y-auto no-scrollbar pr-1">
                  {toc.map(item => (
                    <li key={item.id} className="relative">
                      <button
                        onClick={() => scrollToHeading(item.id)}
                        className={`text-left text-xs transition-all duration-200 block w-full py-1 px-2 rounded-xl ${
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

            {/* Widget 2: Bài Viết Cùng Chủ Đề (Dạng Dọc ở Cột Phải) */}
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

                <div className="space-y-3">
                  {relatedArticles.map((relArt) => (
                    <Link
                      key={relArt.id}
                      to={`/tin-tuc/${relArt.slug}`}
                      className="group flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200/60"
                    >
                      <div className="size-14 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200/60">
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
                      <div className="space-y-1 min-w-0 flex-1">
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
