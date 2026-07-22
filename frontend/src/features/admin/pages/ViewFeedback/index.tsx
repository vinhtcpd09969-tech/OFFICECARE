import { useEffect, useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../../../api/axios';
import { censorText } from '../../../../utils/profanity';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  MessageSquare,
  Award,
  Smile,
  Loader2,
  Package,
  Users,
  Sparkles,
  RotateCcw,
  Lightbulb,
  BellRing,
  CheckCircle2,
  XCircle,
  PieChart,
  Pencil,
  Bot,
  Send
} from 'lucide-react';

interface Feedback {
  id: string;
  ten_khach_hang: string;
  ten_ky_thuat_vien: string;
  ten_dich_vu: string;
  so_sao_tong: number | null;
  so_sao_ktv: number | null;
  nhan_xet: string;
  hieu_qua_dieu_tri?: string;
  thoi_gian_danh_gia: string;
  phan_hoi_nhan_xet: string | null;
  ten_nguoi_phan_hoi: string | null;
  ngay_phan_hoi: string | null;
  loai_danh_gia: 'service' | 'staff';
  cam_xuc: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | null;
  do_tin_cay: number | null;
  ly_do_cam_xuc: string | null;
  de_xuat_hanh_dong: string | null;
  de_xuat_phan_hoi: string | null;
}

interface AnalyzeResult {
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  confidence: number;
  reason: string;
  suggestedAction: string;
  draftReply: string;
}

interface BatchLogEntry {
  id: string;
  label: string;
  status: 'running' | 'ok' | 'skip';
}

const SENTIMENT_CONFIG: Record<string, { label: string; cls: string; barCls: string }> = {
  POSITIVE: { label: 'Tích cực', cls: 'bg-emerald-50 text-emerald-700 border-emerald-150 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900', barCls: 'bg-emerald-500' },
  NEGATIVE: { label: 'Tiêu cực', cls: 'bg-rose-50 text-rose-700 border-rose-150 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900', barCls: 'bg-rose-500' },
  NEUTRAL: { label: 'Trung tính', cls: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700', barCls: 'bg-slate-400' },
};

const BATCH_DELAY_MS = 13000; // Free tier Gemini: 5 request/phút — nghỉ 13s giữa các lần để không bị 429.
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const cardStagger = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 24, delay: Math.min(i, 8) * 0.05 }
  })
};

export default function ViewFeedback() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'service' | 'staff'>('service');
  const [isClient, setIsClient] = useState(false);

  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ done: number; total: number } | null>(null);
  const [batchLog, setBatchLog] = useState<BatchLogEntry[]>([]);
  const [batchStopReason, setBatchStopReason] = useState<'quota' | null>(null);

  useEffect(() => {
    setIsClient(true);
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/feedback');
      setFeedbacks(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Lỗi khi tải đánh giá:', error);
      toast.error('Không thể kết nối API tải đánh giá.');
    } finally {
      setLoading(false);
    }
  };

  const submitReply = async (id: string, type: 'service' | 'staff', text: string) => {
    if (!text.trim()) {
      toast.error('Vui lòng nhập nội dung phản hồi.');
      return false;
    }
    try {
      setSubmittingReply(true);
      await api.post(`/admin/feedback/${type}/${id}/reply`, { phanHoi: text });
      toast.success('Gửi phản hồi thành công!');
      fetchFeedback();
      return true;
    } catch (error) {
      console.error('Lỗi gửi phản hồi:', error);
      toast.error('Không thể gửi phản hồi.');
      return false;
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleSendReply = async (id: string, type: 'service' | 'staff') => {
    const ok = await submitReply(id, type, replyText);
    if (ok) {
      setReplyingId(null);
      setReplyText('');
    }
  };

  const handleQuickApprove = async (f: Feedback) => {
    if (!f.de_xuat_phan_hoi) return;
    await submitReply(f.id, f.loai_danh_gia, f.de_xuat_phan_hoi);
  };

  const handleBulkApprove = async (ready: Feedback[]) => {
    if (ready.length === 0 || submittingReply) return;
    const confirmed = window.confirm(`Gửi ngay ${ready.length} câu trả lời do AI soạn cho khách hàng? Hành động này không thể hoàn tác.`);
    if (!confirmed) return;

    setSubmittingReply(true);
    let successCount = 0;
    for (const f of ready) {
      try {
        await api.post(`/admin/feedback/${f.loai_danh_gia}/${f.id}/reply`, { phanHoi: f.de_xuat_phan_hoi });
        successCount++;
      } catch (error) {
        console.error('Lỗi gửi phản hồi hàng loạt:', error);
      }
    }
    setSubmittingReply(false);

    if (successCount === ready.length) {
      toast.success(`Đã gửi ${successCount} phản hồi thành công!`);
    } else {
      toast.error(`Chỉ gửi thành công ${successCount}/${ready.length} phản hồi.`);
    }
    fetchFeedback();
  };

  const applyAnalysisResult = (id: string, result: AnalyzeResult) => {
    setFeedbacks(prev => prev.map(f => f.id === id ? {
      ...f,
      cam_xuc: result.sentiment,
      do_tin_cay: result.confidence,
      ly_do_cam_xuc: result.reason,
      de_xuat_hanh_dong: result.suggestedAction,
      de_xuat_phan_hoi: result.draftReply
    } : f));
  };

  const handleAnalyzeOne = async (f: Feedback) => {
    if (analyzingId || batchRunning) return;
    setAnalyzingId(f.id);
    try {
      const res = await api.post(`/admin/feedback/${f.loai_danh_gia}/${f.id}/analyze`);
      const result = res.data.data as AnalyzeResult;
      applyAnalysisResult(f.id, result);
      // Nếu đang mở ô soạn phản hồi cho đúng đánh giá này -> đồng bộ luôn câu AI vừa soạn vào ô.
      if (replyingId === f.id) {
        setReplyText(result.draftReply || '');
      }
      toast.success('AI đã phân tích và soạn câu trả lời xong.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'AI không thể phân tích đánh giá này lúc này.');
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleJumpToReview = (f: Feedback) => {
    setSelectedService('Tất cả');
    setSelectedSpecialist('Tất cả');
    setSelectedStars('Tất cả');
    setSelectedSentiment('Tất cả');
    setReplyingId(f.id);
    setReplyText(f.de_xuat_phan_hoi || '');
    setTimeout(() => {
      document.getElementById(`feedback-${f.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 60);
  };

  const [selectedService, setSelectedService] = useState<string>('Tất cả');
  const [selectedSpecialist, setSelectedSpecialist] = useState<string>('Tất cả');
  const [selectedStars, setSelectedStars] = useState<string>('Tất cả');
  const [selectedSentiment, setSelectedSentiment] = useState<string>('Tất cả');

  // Reset page filters when activeTab changes
  useEffect(() => {
    setSelectedStars('Tất cả');
    setSelectedService('Tất cả');
    setSelectedSpecialist('Tất cả');
    setSelectedSentiment('Tất cả');
  }, [activeTab]);

  // Extract unique lists dynamically
  const uniqueServices = useMemo(() => {
    const services = feedbacks
      .filter(f => f.so_sao_tong !== null && f.ten_dich_vu)
      .map(f => f.ten_dich_vu);
    return ['Tất cả', ...Array.from(new Set(services))];
  }, [feedbacks]);

  const uniqueSpecialists = useMemo(() => {
    const specialists = feedbacks
      .filter(f => f.so_sao_ktv !== null && f.ten_ky_thuat_vien && f.ten_ky_thuat_vien !== '-')
      .map(f => f.ten_ky_thuat_vien);
    return ['Tất cả', ...Array.from(new Set(specialists))];
  }, [feedbacks]);

  // Split reviews (for stats)
  const allServiceFeedbacks = useMemo(() => {
    return feedbacks.filter(f => f.so_sao_tong !== null);
  }, [feedbacks]);

  const allStaffFeedbacks = useMemo(() => {
    return feedbacks.filter(f => f.so_sao_ktv !== null);
  }, [feedbacks]);

  const activeAllFeedbacks = activeTab === 'service' ? allServiceFeedbacks : allStaffFeedbacks;

  // Filtered reviews (for rendering list)
  const serviceFeedbacks = useMemo(() => {
    return feedbacks.filter(f => {
      if (f.so_sao_tong === null) return false;
      if (selectedService !== 'Tất cả' && f.ten_dich_vu !== selectedService) return false;
      if (selectedStars !== 'Tất cả' && f.so_sao_tong !== Number(selectedStars)) return false;
      if (selectedSentiment !== 'Tất cả' && f.cam_xuc !== selectedSentiment) return false;
      return true;
    });
  }, [feedbacks, selectedService, selectedStars, selectedSentiment]);

  const staffFeedbacks = useMemo(() => {
    return feedbacks.filter(f => {
      if (f.so_sao_ktv === null) return false;
      if (selectedSpecialist !== 'Tất cả' && f.ten_ky_thuat_vien !== selectedSpecialist) return false;
      if (selectedStars !== 'Tất cả' && f.so_sao_ktv !== Number(selectedStars)) return false;
      if (selectedSentiment !== 'Tất cả' && f.cam_xuc !== selectedSentiment) return false;
      return true;
    });
  }, [feedbacks, selectedSpecialist, selectedStars, selectedSentiment]);

  // Calculations (KPIs)
  const serviceStats = useMemo(() => {
    if (allServiceFeedbacks.length === 0) return { avg: 5.0, count: 0 };
    const sum = allServiceFeedbacks.reduce((acc, f) => acc + (f.so_sao_tong || 0), 0);
    return {
      avg: Number((sum / allServiceFeedbacks.length).toFixed(1)),
      count: allServiceFeedbacks.length
    };
  }, [allServiceFeedbacks]);

  const staffStats = useMemo(() => {
    if (allStaffFeedbacks.length === 0) return { avg: 5.0, count: 0 };
    const sum = allStaffFeedbacks.reduce((acc, f) => acc + (f.so_sao_ktv || 0), 0);
    return {
      avg: Number((sum / allStaffFeedbacks.length).toFixed(1)),
      count: allStaffFeedbacks.length
    };
  }, [allStaffFeedbacks]);

  // AI sentiment distribution for the active tab
  const sentimentBreakdown = useMemo(() => {
    const total = activeAllFeedbacks.length;
    const positive = activeAllFeedbacks.filter(f => f.cam_xuc === 'POSITIVE').length;
    const negative = activeAllFeedbacks.filter(f => f.cam_xuc === 'NEGATIVE').length;
    const neutral = activeAllFeedbacks.filter(f => f.cam_xuc === 'NEUTRAL').length;
    const unclassified = total - positive - negative - neutral;
    return { total, positive, negative, neutral, unclassified };
  }, [activeAllFeedbacks]);

  const sentimentDonutStyle = useMemo(() => {
    const { total, positive, negative, neutral } = sentimentBreakdown;
    if (total === 0) return { background: '#e2e8f0' };
    const c1 = (positive / total) * 100;
    const c2 = c1 + (negative / total) * 100;
    const c3 = c2 + (neutral / total) * 100;
    return {
      background: `conic-gradient(#10b981 0% ${c1}%, #f43f5e ${c1}% ${c2}%, #94a3b8 ${c2}% ${c3}%, #e2e8f0 ${c3}% 100%)`
    };
  }, [sentimentBreakdown]);

  const responseRate = useMemo(() => {
    const total = activeAllFeedbacks.length;
    const replied = activeAllFeedbacks.filter(f => f.phan_hoi_nhan_xet).length;
    return { total, replied, pct: total > 0 ? Math.round((replied / total) * 100) : 0 };
  }, [activeAllFeedbacks]);

  // Hàng đợi cần xử lý: mọi đánh giá chưa được phản hồi, ưu tiên tiêu cực lên đầu.
  const pendingReplies = useMemo(() => {
    return activeAllFeedbacks
      .filter(f => !f.phan_hoi_nhan_xet)
      .sort((a, b) => {
        const aNeg = a.cam_xuc === 'NEGATIVE' ? 0 : 1;
        const bNeg = b.cam_xuc === 'NEGATIVE' ? 0 : 1;
        if (aNeg !== bNeg) return aNeg - bNeg;
        return new Date(b.thoi_gian_danh_gia).getTime() - new Date(a.thoi_gian_danh_gia).getTime();
      });
  }, [activeAllFeedbacks]);

  const readyToSend = useMemo(() => pendingReplies.filter(f => f.de_xuat_phan_hoi), [pendingReplies]);

  const toDraftCount = pendingReplies.filter(f => !f.de_xuat_phan_hoi && f.nhan_xet && f.nhan_xet.trim()).length;

  const handleBatchAnalyze = async () => {
    const targets = activeAllFeedbacks.filter(f => !f.phan_hoi_nhan_xet && !f.de_xuat_phan_hoi && f.nhan_xet && f.nhan_xet.trim());
    if (targets.length === 0) {
      toast('Không có đánh giá nào cần AI soạn trả lời.');
      return;
    }

    setBatchRunning(true);
    setBatchStopReason(null);
    setBatchProgress({ done: 0, total: targets.length });
    setBatchLog([]);

    for (let i = 0; i < targets.length; i++) {
      const f = targets[i];
      const snippet = censorText(f.nhan_xet);
      const label = `${f.ten_khach_hang} — ${snippet.slice(0, 36)}${snippet.length > 36 ? '…' : ''}`;
      setBatchLog(prev => [...prev, { id: f.id, label, status: 'running' }]);
      setAnalyzingId(f.id);

      try {
        const res = await api.post(`/admin/feedback/${f.loai_danh_gia}/${f.id}/analyze`);
        applyAnalysisResult(f.id, res.data.data);
        setBatchLog(prev => prev.map(l => (l.id === f.id ? { ...l, status: 'ok' } : l)));
        setBatchProgress({ done: i + 1, total: targets.length });
      } catch (error: any) {
        const status = error.response?.status;
        const msg: string = error.response?.data?.message || '';
        setBatchLog(prev => prev.map(l => (l.id === f.id ? { ...l, status: 'skip' } : l)));

        if (status === 429 || msg.includes('hết lượt') || msg.includes('giới hạn')) {
          setBatchStopReason('quota');
          setAnalyzingId(null);
          setBatchRunning(false);
          return;
        }
        setBatchProgress({ done: i + 1, total: targets.length });
      }

      if (i < targets.length - 1) {
        await sleep(BATCH_DELAY_MS);
      }
    }

    setAnalyzingId(null);
    setBatchRunning(false);
  };

  const renderStars = (count: number) => {
    return (
      <div className="flex gap-0.5 text-amber-400">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={14}
            className={i < count ? 'fill-amber-400 stroke-none' : 'text-zinc-200 fill-zinc-200 stroke-none'}
          />
        ))}
      </div>
    );
  };

  const renderAIPanel = (f: Feedback) => {
    const hasContent = f.nhan_xet && f.nhan_xet.trim().length > 0;
    if (!hasContent) return null;

    const isAnalyzingThis = analyzingId === f.id;

    if (!f.cam_xuc) {
      return (
        <button
          type="button"
          onClick={() => handleAnalyzeOne(f)}
          disabled={!!analyzingId || batchRunning}
          className="w-full flex items-center justify-center gap-2 border border-dashed border-teal-300 dark:border-teal-800 text-teal-650 dark:text-teal-400 rounded-2xl py-3 text-[11px] font-black uppercase tracking-wider hover:bg-teal-50/60 dark:hover:bg-teal-950/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isAnalyzingThis ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              AI đang đọc và phân tích...
            </>
          ) : (
            <>
              <Sparkles size={14} />
              AI đánh giá ngay
            </>
          )}
        </button>
      );
    }

    const config = SENTIMENT_CONFIG[f.cam_xuc];
    if (!config) return null;

    return (
      <div className={`rounded-2xl border p-3.5 space-y-2 ${config.cls}`}>
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider">
            🤖 {config.label}
            {typeof f.do_tin_cay === 'number' && (
              <span className="opacity-60 font-bold">· {Math.round(f.do_tin_cay * 100)}% tin cậy</span>
            )}
          </span>
          <button
            type="button"
            title="Phân tích lại"
            onClick={() => handleAnalyzeOne(f)}
            disabled={!!analyzingId || batchRunning}
            className="p-1 rounded-lg hover:bg-white/60 dark:hover:bg-black/20 transition-colors disabled:opacity-40 cursor-pointer shrink-0"
          >
            {isAnalyzingThis ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
          </button>
        </div>
        {f.ly_do_cam_xuc && (
          <p className="text-[11px] leading-relaxed opacity-90">{f.ly_do_cam_xuc}</p>
        )}
        {f.de_xuat_hanh_dong && (
          <div className="flex items-start gap-1.5 pt-2 border-t border-current/10">
            <Lightbulb size={12} className="mt-0.5 shrink-0" />
            <p className="text-[11px] font-bold leading-relaxed">{f.de_xuat_hanh_dong}</p>
          </div>
        )}
      </div>
    );
  };

  const formatDate = (isoString: string) => {
    if (!isClient) return '';
    const d = new Date(isoString);
    return `${d.toLocaleDateString('vi-VN')} ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const renderFeedbackCard = (f: Feedback, index: number, kind: 'service' | 'staff') => (
    <motion.div
      key={f.id}
      id={`feedback-${f.id}`}
      custom={index}
      variants={cardStagger}
      initial="hidden"
      animate="show"
      whileHover={{ y: -4 }}
      className="bg-white dark:bg-zinc-900 rounded-[28px] border border-zinc-150/60 dark:border-zinc-800 p-6 md:p-8 shadow-xs hover:shadow-lg hover:shadow-zinc-200/40 dark:hover:shadow-none hover:border-zinc-200 dark:hover:border-zinc-700 transition-shadow duration-300 flex flex-col justify-between scroll-mt-24"
    >
      <div className="space-y-4">
        {/* Header info */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-750 flex items-center justify-center text-slate-400 shadow-inner shrink-0">
              👤
            </div>
            <div>
              <h4 className="font-extrabold text-xs text-secondary dark:text-zinc-200">{f.ten_khach_hang}</h4>
              <p className="text-[9px] text-zinc-400 font-bold uppercase mt-0.5">{formatDate(f.thoi_gian_danh_gia)}</p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-1">
              {kind === 'service' ? 'Dịch vụ trị liệu' : 'Kỹ thuật viên'}
            </p>
            <span
              className={
                kind === 'service'
                  ? 'text-[9px] font-black text-teal-650 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/20 px-2.5 py-1 rounded-lg uppercase tracking-tight'
                  : 'text-[9px] font-black text-amber-750 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-2.5 py-1 rounded-lg uppercase tracking-tight flex items-center gap-1'
              }
            >
              {kind === 'staff' && <Award size={10} />} {kind === 'service' ? f.ten_dich_vu : f.ten_ky_thuat_vien}
            </span>
          </div>
        </div>

        {/* Rating display */}
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-850/30 px-3.5 py-2.5 rounded-xl border border-slate-100 dark:border-zinc-800/80 w-fit">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
            {kind === 'service' ? 'Đánh giá:' : 'Đánh giá KTV:'}
          </span>
          {renderStars((kind === 'service' ? f.so_sao_tong : f.so_sao_ktv) || 0)}
        </div>

        {/* Review Text */}
        <div className="relative pt-1.5">
          <p className="text-[13px] font-semibold text-slate-600 dark:text-zinc-350 leading-relaxed bg-slate-50/50 dark:bg-zinc-850/10 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800/50 italic">
            "{censorText(f.nhan_xet) || 'Khách hàng không để lại nhận xét bằng chữ.'}"
          </p>
        </div>

        {/* AI panel */}
        {renderAIPanel(f)}
      </div>

      {/* Reply section */}
      {f.phan_hoi_nhan_xet ? (
        <div className="mt-4 p-4 bg-emerald-50/50 dark:bg-emerald-950/10 border-l-2 border-[#0D9488] rounded-r-2xl text-[12px] space-y-1">
          <p className="font-extrabold text-slate-800 dark:text-zinc-200">
            Phản hồi từ {f.ten_nguoi_phan_hoi || 'Phòng khám OfficeCare'}:
          </p>
          <p className="text-slate-655 dark:text-zinc-350 italic">"{f.phan_hoi_nhan_xet}"</p>
          {f.ngay_phan_hoi && (
            <p className="text-[9px] text-zinc-400 font-bold uppercase mt-1">
              Lúc {formatDate(f.ngay_phan_hoi)}
            </p>
          )}
          {replyingId !== f.id && (
            <button
              onClick={() => {
                setReplyingId(f.id);
                setReplyText(f.phan_hoi_nhan_xet || '');
              }}
              className="text-[9px] font-black uppercase text-primary hover:text-emerald-700 mt-2 block cursor-pointer"
            >
              Sửa phản hồi
            </button>
          )}
        </div>
      ) : (
        replyingId !== f.id && (
          <button
            onClick={() => {
              setReplyingId(f.id);
              setReplyText(f.de_xuat_phan_hoi || '');
            }}
            className="mt-4 text-xs font-black uppercase text-primary hover:text-teal-700 flex items-center gap-1 cursor-pointer select-none"
          >
            💬 Phản hồi đánh giá
          </button>
        )
      )}

      {replyingId === f.id && (
        <div className="mt-4 space-y-3 p-4 bg-slate-50 dark:bg-zinc-850/20 rounded-2xl border border-slate-200/40">
          {replyText && replyText === f.de_xuat_phan_hoi && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-[9px] font-black uppercase text-teal-650 dark:text-teal-400">🤖 AI đã soạn sẵn — chỉnh sửa nếu cần</span>
              <button
                type="button"
                onClick={() => handleAnalyzeOne(f)}
                disabled={!!analyzingId || batchRunning}
                className="flex items-center gap-1 text-[9px] font-black uppercase text-slate-500 hover:text-primary disabled:opacity-40 cursor-pointer"
              >
                {analyzingId === f.id ? <Loader2 size={11} className="animate-spin" /> : <RotateCcw size={11} />}
                Soạn lại
              </button>
            </div>
          )}
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Nhập nội dung phản hồi y khoa của phòng khám..."
            className="w-full min-h-[80px] p-3 text-xs bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-primary text-slate-700 dark:text-zinc-200"
          />
          <div className="flex gap-2 justify-end">
            {!replyText && f.nhan_xet?.trim() && (
              <button
                type="button"
                onClick={() => handleAnalyzeOne(f)}
                disabled={!!analyzingId || batchRunning}
                className="px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-teal-650 dark:text-teal-400 hover:text-teal-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-40 mr-auto"
              >
                {analyzingId === f.id ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                Để AI soạn giúp
              </button>
            )}
            <button
              onClick={() => setReplyingId(null)}
              className="px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-slate-700 cursor-pointer"
              disabled={submittingReply}
            >
              Hủy
            </button>
            <button
              onClick={() => handleSendReply(f.id, f.loai_danh_gia)}
              className="px-4 py-1.5 bg-primary hover:bg-teal-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              disabled={submittingReply}
            >
              {submittingReply && <Loader2 size={12} className="animate-spin" />}
              Gửi phản hồi
            </button>
          </div>
        </div>
      )}

      {kind === 'staff' && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-[9px] text-zinc-400 font-bold uppercase">
          <span>Dịch vụ liên quan:</span>
          <span className="text-secondary dark:text-zinc-200">{f.ten_dich_vu}</span>
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-secondary dark:text-zinc-100 tracking-tight flex items-center gap-2.5">
            <MessageSquare className="text-primary animate-pulse" size={26} />
            Đánh giá & Phản hồi
          </h1>
          <p className="text-xs text-zinc-400 dark:text-zinc-550 font-bold uppercase mt-0.5 tracking-wider">
            Phân tích mức độ hài lòng của khách hàng về dịch vụ trị liệu & nhân sự y khoa
          </p>
        </div>
      </div>

      {/* Analytics Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Service Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-150/60 dark:border-zinc-800 rounded-[28px] p-6 shadow-xs flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Đánh giá dịch vụ</p>
            <h3 className="text-2xl font-black text-secondary dark:text-zinc-100">
              {serviceStats.avg} <span className="text-xs text-zinc-400 font-bold">/ 5.0</span>
            </h3>
            <p className="text-[10px] text-teal-600 font-extrabold">Từ {serviceStats.count} lượt đánh giá</p>
          </div>
          <div className="w-12 h-12 bg-teal-50 dark:bg-teal-950/20 text-teal-650 dark:text-teal-400 rounded-2xl flex items-center justify-center shadow-xs">
            <Package size={22} />
          </div>
        </div>

        {/* Staff Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-150/60 dark:border-zinc-800 rounded-[28px] p-6 shadow-xs flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Đánh giá KTV & Bác sĩ</p>
            <h3 className="text-2xl font-black text-secondary dark:text-zinc-100">
              {staffStats.avg} <span className="text-xs text-zinc-400 font-bold">/ 5.0</span>
            </h3>
            <p className="text-[10px] text-amber-600 font-extrabold">Từ {staffStats.count} lượt đánh giá</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center shadow-xs">
            <Users size={22} />
          </div>
        </div>

        {/* Happy Index */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-150/60 dark:border-zinc-800 rounded-[28px] p-6 shadow-xs flex items-center justify-between gap-4 sm:col-span-2 lg:col-span-1">
          <div className="space-y-1">
            <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Chỉ số hài lòng</p>
            <h3 className="text-2xl font-black text-[#0D9488]">
              {Number((((serviceStats.avg + staffStats.avg) / 10) * 100).toFixed(0))}%
            </h3>
            <p className="text-[10px] text-zinc-450 font-bold">Mức độ hài lòng toàn diện đạt chuẩn</p>
          </div>
          <div className="w-12 h-12 bg-[#EBFBFA] text-[#0D9488] rounded-2xl flex items-center justify-center shadow-xs">
            <Smile size={22} />
          </div>
        </div>
      </div>

      {/* AI Analytics Row: Sentiment breakdown + Pending replies queue */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
        {/* Sentiment breakdown — donut */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-150/60 dark:border-zinc-800 rounded-[28px] p-6 shadow-xs flex flex-col">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 bg-teal-50 dark:bg-teal-950/20 text-teal-650 dark:text-teal-400 rounded-xl flex items-center justify-center shrink-0">
              <PieChart size={16} />
            </div>
            <div>
              <h3 className="text-xs font-black text-secondary dark:text-zinc-100 uppercase tracking-wider">Phân bố cảm xúc AI</h3>
              <p className="text-[9px] text-zinc-400 font-bold uppercase">
                {sentimentBreakdown.total} đánh giá {activeTab === 'service' ? 'dịch vụ' : 'kỹ thuật viên'}
              </p>
            </div>
          </div>

          {sentimentBreakdown.total === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-[11px] text-zinc-400 italic">Chưa có đánh giá nào ở mục này.</p>
            </div>
          ) : (
            <div className="flex-1 flex items-center gap-7">
              <div className="relative size-32 rounded-full shrink-0" style={sentimentDonutStyle}>
                <div className="absolute inset-[12px] rounded-full bg-white dark:bg-zinc-900 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-secondary dark:text-zinc-100 leading-none">{sentimentBreakdown.total}</span>
                  <span className="text-[8px] font-black text-zinc-400 uppercase mt-1.5 tracking-wider">đánh giá</span>
                </div>
              </div>

              <div className="flex-1 min-w-0 space-y-3">
                {[
                  { label: 'Tích cực', count: sentimentBreakdown.positive, dot: 'bg-emerald-500' },
                  { label: 'Tiêu cực', count: sentimentBreakdown.negative, dot: 'bg-rose-500' },
                  { label: 'Trung tính', count: sentimentBreakdown.neutral, dot: 'bg-slate-400' },
                  { label: 'Chưa phân loại', count: sentimentBreakdown.unclassified, dot: 'bg-slate-200 dark:bg-zinc-700' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2.5">
                    <span className={`size-2.5 rounded-full shrink-0 ${item.dot}`} />
                    <span className="text-[11.5px] font-bold text-slate-600 dark:text-zinc-300 flex-1 truncate">{item.label}</span>
                    <span className="text-[12px] font-black text-slate-800 dark:text-zinc-100 tabular-nums">{item.count}</span>
                    <span className="text-[9.5px] font-bold text-zinc-400 tabular-nums w-9 text-right">
                      {sentimentBreakdown.total > 0 ? Math.round((item.count / sentimentBreakdown.total) * 100) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pending replies queue + response rate */}
        <div className="lg:col-span-3 bg-white dark:bg-zinc-900 border border-zinc-150/60 dark:border-zinc-800 rounded-[28px] p-6 shadow-xs flex flex-col">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center shrink-0">
                <BellRing size={16} />
              </div>
              <div>
                <h3 className="text-xs font-black text-secondary dark:text-zinc-100 uppercase tracking-wider">Chờ phản hồi</h3>
                <p className="text-[9px] text-zinc-400 font-bold uppercase">Duyệt câu trả lời AI soạn sẵn</p>
              </div>
            </div>
            <span className="text-[10px] font-black text-slate-500 dark:text-zinc-400 shrink-0 text-right">
              {responseRate.replied}/{responseRate.total} đã trả lời<br />
              <span className="text-primary">{responseRate.pct}%</span>
            </span>
          </div>

          <div className="h-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden mb-4">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${responseRate.pct}%` }} />
          </div>

          <div className="flex items-center gap-2 mb-2">
            <button
              type="button"
              onClick={handleBatchAnalyze}
              disabled={batchRunning || !!analyzingId || toDraftCount === 0}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-tr from-[#0D9488] to-[#14B8A6] text-white rounded-xl text-[11px] font-black uppercase tracking-wider shadow-sm hover:shadow-md active:scale-95 transition-all disabled:opacity-40 disabled:active:scale-100 cursor-pointer disabled:cursor-not-allowed"
            >
              {batchRunning ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              {batchRunning ? `Đang soạn ${batchProgress ? `${batchProgress.done}/${batchProgress.total}` : '...'}` : `Trả lời tất cả (${toDraftCount})`}
            </button>
            <button
              type="button"
              onClick={() => handleBulkApprove(readyToSend)}
              disabled={readyToSend.length === 0 || submittingReply}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-secondary dark:bg-teal-900/30 text-white dark:text-teal-300 rounded-xl text-[11px] font-black uppercase tracking-wider hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
            >
              {submittingReply ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              Xác nhận tất cả ({readyToSend.length})
            </button>
          </div>
          <p className="text-[8.5px] text-zinc-400 font-bold uppercase tracking-wide text-center mb-4">
            Soạn dùng chung hạn mức ~20 lượt AI miễn phí/ngày với chatbot trên trang khách hàng
          </p>

          {batchRunning && batchProgress && (
            <div className="h-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden mb-3">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${(batchProgress.done / batchProgress.total) * 100}%` }}
              />
            </div>
          )}

          {batchStopReason === 'quota' && batchProgress && (
            <div className="flex items-start gap-2 p-3 mb-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-150 dark:border-amber-900 rounded-xl text-[11px] text-amber-750 dark:text-amber-400 font-semibold">
              ⏸️ Đã dừng vì hết lượt gọi AI miễn phí trong hôm nay. Còn {batchProgress.total - batchProgress.done} đánh giá chưa được AI soạn trả lời — thử lại vào ngày mai.
            </div>
          )}

          <AnimatePresence>
            {batchLog.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1 max-h-28 overflow-y-auto pr-1 mb-3"
              >
                {batchLog.slice().reverse().map(entry => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 text-[10px] font-semibold text-slate-500 dark:text-zinc-400"
                  >
                    {entry.status === 'running' && <Loader2 size={11} className="animate-spin text-primary shrink-0" />}
                    {entry.status === 'ok' && <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />}
                    {entry.status === 'skip' && <XCircle size={11} className="text-rose-400 shrink-0" />}
                    <span className="truncate">{entry.label}</span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {pendingReplies.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-[11px] text-zinc-400 italic">🎉 Không còn đánh giá nào đang chờ phản hồi.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-2 -mr-2">
              {pendingReplies.slice(0, 8).map(f => (
                <div
                  key={f.id}
                  className={`p-4 rounded-2xl border-2 transition-colors ${
                    f.cam_xuc === 'NEGATIVE'
                      ? 'bg-rose-50/40 dark:bg-rose-950/10 border-rose-150 dark:border-rose-900/50'
                      : f.de_xuat_phan_hoi
                        ? 'bg-white dark:bg-zinc-900 border-teal-150 dark:border-teal-900/50'
                        : 'bg-slate-50/60 dark:bg-zinc-850/20 border-slate-150/70 dark:border-zinc-800/70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[12px] font-black text-slate-700 dark:text-zinc-200 truncate">{f.ten_khach_hang}</p>
                    {f.cam_xuc && (
                      <span className={`shrink-0 text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full border ${SENTIMENT_CONFIG[f.cam_xuc]?.cls}`}>
                        {SENTIMENT_CONFIG[f.cam_xuc]?.label}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate italic mt-1">"{censorText(f.nhan_xet)}"</p>

                  {f.de_xuat_phan_hoi ? (
                    <div className="mt-3 space-y-2.5">
                      <div className="flex items-start gap-2 bg-teal-50/70 dark:bg-teal-950/20 rounded-xl p-3">
                        <Bot size={14} className="text-teal-600 dark:text-teal-400 mt-0.5 shrink-0" />
                        <p className="text-[11.5px] text-teal-800 dark:text-teal-300 line-clamp-3 leading-relaxed">{f.de_xuat_phan_hoi}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleQuickApprove(f)}
                          disabled={submittingReply}
                          className="flex-1 text-[10.5px] font-black uppercase text-white bg-primary hover:bg-teal-700 px-3 py-2 rounded-xl cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <CheckCircle2 size={12} /> Dùng câu này
                        </button>
                        <button
                          type="button"
                          title="Sửa trước khi gửi"
                          onClick={() => handleJumpToReview(f)}
                          className="p-2 rounded-xl text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 cursor-pointer transition-colors"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          title="Soạn lại"
                          onClick={() => handleAnalyzeOne(f)}
                          disabled={!!analyzingId || batchRunning}
                          className="p-2 rounded-xl text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 disabled:opacity-40 cursor-pointer transition-colors"
                        >
                          {analyzingId === f.id ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
                        </button>
                      </div>
                    </div>
                  ) : f.nhan_xet?.trim() ? (
                    <p className="mt-3 text-[10px] text-zinc-400 italic text-center py-1.5 border border-dashed border-slate-200 dark:border-zinc-700 rounded-xl">
                      Chưa có câu trả lời AI — dùng "Trả lời tất cả" ở trên, hoặc lướt xuống danh sách để soạn riêng.
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleJumpToReview(f)}
                      className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-slate-300 dark:border-zinc-700 rounded-xl text-[10.5px] font-black uppercase text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                    >
                      Phản hồi thủ công
                    </button>
                  )}
                </div>
              ))}
              {pendingReplies.length > 8 && (
                <p className="text-[9px] text-zinc-400 font-bold text-center pt-1">+{pendingReplies.length - 8} đánh giá khác</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs segment navigation */}
      <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-2xl w-fit shadow-inner">
        <button
          onClick={() => setActiveTab('service')}
          className={`px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center gap-2 cursor-pointer ${
            activeTab === 'service'
              ? 'bg-white dark:bg-zinc-900 text-primary shadow-xs border border-zinc-200/20 scale-[1.02]'
              : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          <Package size={14} />
          Đánh giá dịch vụ ({serviceStats.count})
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center gap-2 cursor-pointer ${
            activeTab === 'staff'
              ? 'bg-white dark:bg-zinc-900 text-primary shadow-xs border border-zinc-200/20 scale-[1.02]'
              : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          <Users size={14} />
          Đánh giá kỹ thuật viên ({staffStats.count})
        </button>
      </div>

      {/* Filters Section */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150/60 dark:border-zinc-800 rounded-[24px] p-5 shadow-xs flex flex-wrap items-center gap-4 animate-in fade-in duration-300">
        <div className="text-xs font-black text-secondary dark:text-zinc-300 uppercase tracking-wider shrink-0">
          🔍 Bộ lọc nhanh:
        </div>

        {activeTab === 'service' ? (
          <div className="flex flex-col sm:flex-row gap-3 items-center flex-1">
            <div className="w-full sm:w-72">
              <label className="block text-[10px] text-zinc-400 font-black uppercase mb-1">Gói dịch vụ</label>
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-primary text-slate-700 dark:text-zinc-200 font-semibold cursor-pointer"
              >
                {uniqueServices.map((svc) => (
                  <option key={svc} value={svc}>{svc}</option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3 items-center flex-1">
            <div className="w-full sm:w-72">
              <label className="block text-[10px] text-zinc-400 font-black uppercase mb-1">Bác sĩ & Kỹ thuật viên</label>
              <select
                value={selectedSpecialist}
                onChange={(e) => setSelectedSpecialist(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-primary text-slate-700 dark:text-zinc-200 font-semibold cursor-pointer"
              >
                {uniqueSpecialists.map((spec) => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="w-full sm:w-40">
          <label className="block text-[10px] text-zinc-400 font-black uppercase mb-1">Số sao đánh giá</label>
          <select
            value={selectedStars}
            onChange={(e) => setSelectedStars(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-primary text-slate-700 dark:text-zinc-200 font-semibold cursor-pointer"
          >
            <option value="Tất cả">Tất cả sao</option>
            <option value="5">⭐⭐⭐⭐⭐ (5 sao)</option>
            <option value="4">⭐⭐⭐⭐ (4 sao)</option>
            <option value="3">⭐⭐⭐ (3 sao)</option>
            <option value="2">⭐⭐ (2 sao)</option>
            <option value="1">⭐ (1 sao)</option>
          </select>
        </div>

        <div className="w-full sm:w-40">
          <label className="block text-[10px] text-zinc-400 font-black uppercase mb-1">Cảm xúc (AI)</label>
          <select
            value={selectedSentiment}
            onChange={(e) => setSelectedSentiment(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-primary text-slate-700 dark:text-zinc-200 font-semibold cursor-pointer"
          >
            <option value="Tất cả">Tất cả cảm xúc</option>
            <option value="POSITIVE">🤖 Tích cực</option>
            <option value="NEGATIVE">🤖 Tiêu cực</option>
            <option value="NEUTRAL">🤖 Trung tính</option>
          </select>
        </div>

        {(selectedService !== 'Tất cả' || selectedSpecialist !== 'Tất cả' || selectedStars !== 'Tất cả' || selectedSentiment !== 'Tất cả') && (
          <button
            type="button"
            onClick={() => {
              setSelectedService('Tất cả');
              setSelectedSpecialist('Tất cả');
              setSelectedStars('Tất cả');
              setSelectedSentiment('Tất cả');
            }}
            className="text-[10px] font-black uppercase text-rose-500 hover:text-rose-700 cursor-pointer transition-colors"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-zinc-900 border border-zinc-150/60 dark:border-zinc-800 rounded-[32px]">
          <Loader2 className="animate-spin text-primary mb-3" size={28} />
          <p className="text-xs font-bold text-slate-400">Đang tải danh sách phản hồi...</p>
        </div>
      ) : activeTab === 'service' ? (
        // SERVICE REVIEWS TAB
        serviceFeedbacks.length === 0 ? (
          <div className="p-16 text-center bg-white dark:bg-zinc-900 border border-zinc-150/60 dark:border-zinc-800 rounded-[32px] text-xs font-semibold text-slate-450 italic">
            Chưa có đánh giá chất lượng dịch vụ nào được ghi nhận.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {serviceFeedbacks.map((f, i) => renderFeedbackCard(f, i, 'service'))}
          </div>
        )
      ) : (
        // STAFF REVIEWS TAB
        staffFeedbacks.length === 0 ? (
          <div className="p-16 text-center bg-white dark:bg-zinc-900 border border-zinc-150/60 dark:border-zinc-800 rounded-[32px] text-xs font-semibold text-slate-450 italic">
            Chưa có đánh giá kỹ thuật viên nào được ghi nhận.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {staffFeedbacks.map((f, i) => renderFeedbackCard(f, i, 'staff'))}
          </div>
        )
      )}
    </div>
  );
}
