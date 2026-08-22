import React, { useEffect, useState, useMemo, useRef } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../../../api/axios';
import { censorText } from '../../../../utils/profanity';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfirmDialog } from '../../../../components/ConfirmDialog';
import {
  Star,
  Search,
  Sparkles,
  Send,
  Loader2,
  CheckCircle2,
  X,
  CheckSquare,
  Square,
  MessageSquare,
  Award,
  Edit3,
  Quote,
  Eye,
  Clock,
  ChevronDown,
  RefreshCw
} from 'lucide-react';

interface Feedback {
  id: string;
  ten_khach_hang: string;
  ten_ky_thuat_vien: string;
  vai_tro_nhan_su?: string | null;
  ma_vai_tro_nhan_su?: string | null;
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

interface DropdownOption {
  value: string;
  label: string;
  icon?: string;
  badgeColor?: string;
}

// Helper logic: Phân loại chức danh Kỹ thuật viên vs Chuyên viên HOÀN TOÀN ĐỘNG từ Database
const getStaffRoleLabel = (feedback: Feedback) => {
  if (feedback.loai_danh_gia === 'service') return 'Dịch vụ đã thực hiện';
  if (feedback.ma_vai_tro_nhan_su === 'bac_si' || feedback.ma_vai_tro_nhan_su === 'chuyen_vien') {
    return 'Chuyên viên tư vấn';
  }
  if (feedback.vai_tro_nhan_su) {
    return feedback.vai_tro_nhan_su;
  }
  return 'Kỹ thuật viên';
};

// Custom Popover Filter Dropdown with smart positioning
function FilterSelect({
  label,
  value,
  options,
  onChange,
  align = 'left'
}: {
  label: string;
  value: string;
  options: DropdownOption[];
  onChange: (val: string) => void;
  align?: 'left' | 'right';
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOpt = options.find(o => o.value === value) || options[0];
  const isFiltered = value !== 'Tất cả';

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border shadow-2xs ${
          isFiltered
            ? 'bg-teal-50/90 dark:bg-teal-950/50 border-teal-300 dark:border-teal-700 text-teal-800 dark:text-teal-200 shadow-sm shadow-teal-600/10'
            : 'bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-850'
        }`}
      >
        {selectedOpt.icon && <span className="text-sm leading-none">{selectedOpt.icon}</span>}
        <span className="truncate max-w-[150px]">
          {isFiltered ? selectedOpt.label : label}
        </span>
        <ChevronDown size={13} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-teal-600' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-2 w-56 bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-2xl shadow-2xl shadow-slate-300/50 dark:shadow-none p-1.5 z-40 space-y-0.5 max-h-64 overflow-y-auto font-sans`}
          >
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-bold text-left flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    {opt.icon && <span className="text-sm">{opt.icon}</span>}
                    <span className="truncate">{opt.label}</span>
                  </span>
                  {isSelected && <CheckCircle2 size={13} className="text-white shrink-0" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ViewFeedback() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'service' | 'staff'>('service');
  const [isClient, setIsClient] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<string>('Tất cả');
  const [selectedSpecialist, setSelectedSpecialist] = useState<string>('Tất cả');
  const [selectedStars, setSelectedStars] = useState<string>('Tất cả');
  const [selectedSentiment, setSelectedSentiment] = useState<string>('Tất cả');
  const [selectedResponseStatus, setSelectedResponseStatus] = useState<string>('Tất cả');

  // Center Popup Modal State
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isEditingReply, setIsEditingReply] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);

  // Confirm Dialog State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    type?: 'warning' | 'danger' | 'info' | 'success';
    confirmLabel?: string;
    onConfirm: () => void;
  } | null>(null);

  // Multi-select & Actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
    fetchFeedback();
  }, []);

  // Reset tab-specific filters & selection on tab change
  useEffect(() => {
    setSelectedStars('Tất cả');
    setSelectedService('Tất cả');
    setSelectedSpecialist('Tất cả');
    setSelectedSentiment('Tất cả');
    setSelectedResponseStatus('Tất cả');
    setSelectedIds(new Set());
  }, [activeTab]);

  // Keep modal feedback in sync with latest list updates
  useEffect(() => {
    if (selectedFeedback) {
      const updated = feedbacks.find(f => f.id === selectedFeedback.id);
      if (updated) {
        setSelectedFeedback(updated);
      }
    }
  }, [feedbacks]);

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

  const handleSendReply = async () => {
    if (!selectedFeedback) return;
    const ok = await submitReply(selectedFeedback.id, selectedFeedback.loai_danh_gia, replyText);
    if (ok) {
      setIsEditingReply(false);
      setReplyText('');
    }
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
    if (analyzingId) return;
    setAnalyzingId(f.id);
    try {
      const res = await api.post(`/admin/feedback/${f.loai_danh_gia}/${f.id}/analyze`);
      const result = res.data.data as AnalyzeResult;
      applyAnalysisResult(f.id, result);
      
      if (selectedFeedback && selectedFeedback.id === f.id) {
        if (!replyText || isEditingReply) {
          setReplyText(result.draftReply || '');
        }
      }
      toast.success('AI đã phân tích cảm xúc & gợi ý câu trả lời.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'AI không thể phân tích đánh giá lúc này.');
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleRegenerateAIDraft = async (f: Feedback) => {
    if (analyzingId) return;
    setAnalyzingId(f.id);
    try {
      const res = await api.post(`/admin/feedback/${f.loai_danh_gia}/${f.id}/analyze`);
      const result = res.data.data as AnalyzeResult;
      applyAnalysisResult(f.id, result);
      setReplyText(result.draftReply || '');
      toast.success('AI đã soạn thảo một mẫu phản hồi mới!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể tạo phản hồi mới lúc này.');
    } finally {
      setAnalyzingId(null);
    }
  };


  const handleBulkApprove = (ready: Feedback[]) => {
    if (ready.length === 0 || submittingReply) return;

    setConfirmConfig({
      isOpen: true,
      title: 'Xác nhận gửi phản hồi hàng loạt',
      type: 'info',
      confirmLabel: `Gửi ngay ${ready.length} phản hồi`,
      message: (
        <div className="space-y-2 text-left">
          <p>
            Bạn có chắc chắn muốn gửi ngay <b>{ready.length}</b> câu trả lời do AI soạn thảo cho khách hàng?
          </p>
          <p className="text-xs text-slate-500 font-medium">
            Hành động này sẽ cập nhật trực tiếp nội dung phản hồi chính thức từ phòng khám.
          </p>
        </div>
      ),
      onConfirm: async () => {
        setConfirmConfig(null);
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
      }
    });
  };

  // Open center popup modal for a feedback
  const handleOpenDetail = (f: Feedback) => {
    setSelectedFeedback(f);
    setReplyText(f.phan_hoi_nhan_xet || f.de_xuat_phan_hoi || '');
    setIsEditingReply(!f.phan_hoi_nhan_xet);
  };

  // Checkbox interactions
  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === filteredFeedbacks.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredFeedbacks.map(f => f.id)));
    }
  };

  // Unique dropdown options
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

  // Tab splits
  const allServiceFeedbacks = useMemo(() => feedbacks.filter(f => f.so_sao_tong !== null), [feedbacks]);
  const allStaffFeedbacks = useMemo(() => feedbacks.filter(f => f.so_sao_ktv !== null), [feedbacks]);
  const activeAllFeedbacks = activeTab === 'service' ? allServiceFeedbacks : allStaffFeedbacks;

  // Filtered list
  const filteredFeedbacks = useMemo(() => {
    return activeAllFeedbacks.filter(f => {
      const rating = activeTab === 'service' ? f.so_sao_tong : f.so_sao_ktv;
      
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = f.ten_khach_hang?.toLowerCase().includes(query);
        const matchComment = f.nhan_xet?.toLowerCase().includes(query);
        const matchTarget = activeTab === 'service'
          ? f.ten_dich_vu?.toLowerCase().includes(query)
          : f.ten_ky_thuat_vien?.toLowerCase().includes(query);
        if (!matchName && !matchComment && !matchTarget) return false;
      }

      // Dropdown filters
      if (activeTab === 'service') {
        if (selectedService !== 'Tất cả' && f.ten_dich_vu !== selectedService) return false;
      } else {
        if (selectedSpecialist !== 'Tất cả' && f.ten_ky_thuat_vien !== selectedSpecialist) return false;
      }

      if (selectedStars !== 'Tất cả' && rating !== Number(selectedStars)) return false;
      if (selectedSentiment !== 'Tất cả' && f.cam_xuc !== selectedSentiment) return false;
      if (selectedResponseStatus === 'pending' && f.phan_hoi_nhan_xet) return false;
      if (selectedResponseStatus === 'replied' && !f.phan_hoi_nhan_xet) return false;

      return true;
    });
  }, [activeAllFeedbacks, activeTab, searchQuery, selectedService, selectedSpecialist, selectedStars, selectedSentiment, selectedResponseStatus]);

  // Stats Calculations
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

  const currentTabStats = activeTab === 'service' ? serviceStats : staffStats;

  // Sentiment Breakdown & Action Metrics
  const sentimentBreakdown = useMemo(() => {
    const total = activeAllFeedbacks.length;
    const positive = activeAllFeedbacks.filter(f => f.cam_xuc === 'POSITIVE').length;
    const negative = activeAllFeedbacks.filter(f => f.cam_xuc === 'NEGATIVE').length;
    const neutral = activeAllFeedbacks.filter(f => f.cam_xuc === 'NEUTRAL').length;
    const unclassified = total - positive - negative - neutral;
    const positivePct = total > 0 ? Math.round((positive / total) * 100) : 0;
    const negativePct = total > 0 ? Math.round((negative / total) * 100) : 0;
    const neutralPct = total > 0 ? Math.round((neutral / total) * 100) : 0;
    return { total, positive, negative, neutral, unclassified, positivePct, negativePct, neutralPct };
  }, [activeAllFeedbacks]);

  const responseRate = useMemo(() => {
    const total = activeAllFeedbacks.length;
    const replied = activeAllFeedbacks.filter(f => f.phan_hoi_nhan_xet).length;
    return { total, replied, pct: total > 0 ? Math.round((replied / total) * 100) : 0 };
  }, [activeAllFeedbacks]);



  const hasActiveFilters = searchQuery !== '' ||
    selectedService !== 'Tất cả' ||
    selectedSpecialist !== 'Tất cả' ||
    selectedStars !== 'Tất cả' ||
    selectedSentiment !== 'Tất cả' ||
    selectedResponseStatus !== 'Tất cả';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedService('Tất cả');
    setSelectedSpecialist('Tất cả');
    setSelectedStars('Tất cả');
    setSelectedSentiment('Tất cả');
    setSelectedResponseStatus('Tất cả');
  };

  const formatDate = (isoString: string) => {
    if (!isClient) return '';
    const d = new Date(isoString);
    return `${d.toLocaleDateString('vi-VN')} · ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const formatDateShort = (isoString: string) => {
    if (!isClient) return '';
    const d = new Date(isoString);
    return d.toLocaleDateString('vi-VN');
  };

  return (
    <div className="space-y-5 pb-12 font-sans text-slate-800 dark:text-zinc-100">
      {/* 1. PRO MAX HORIZONTAL SUMMARY BAR */}
      <div className="bg-gradient-to-r from-teal-900/5 via-emerald-900/5 to-cyan-900/5 dark:from-teal-950/30 dark:to-zinc-900/50 backdrop-blur-xl border border-teal-500/15 rounded-3xl p-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Left KPI Highlights */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-7 text-xs">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shadow-inner">
              <MessageSquare size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 block">Tổng Đánh Giá</span>
              <span className="text-xl font-black text-slate-900 dark:text-zinc-100 tracking-tight">{currentTabStats.count} <span className="text-xs font-semibold text-slate-400">lượt</span></span>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-200/80 dark:bg-zinc-800 hidden sm:block" />

          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shadow-inner">
              <Star size={20} className="fill-amber-400 stroke-none" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 block">Điểm Trung Bình</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black text-amber-600 dark:text-amber-400 tracking-tight">{currentTabStats.avg}</span>
                <span className="text-xs font-bold text-slate-400">/ 5.0 ★</span>
              </div>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-200/80 dark:bg-zinc-800 hidden sm:block" />

          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner text-xl">
              😊
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 block">Tích Cực (AI)</span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">{sentimentBreakdown.positivePct}% <span className="text-xs font-semibold text-slate-400">({sentimentBreakdown.positive} ca)</span></span>
            </div>
          </div>

          {sentimentBreakdown.negative > 0 && (
            <>
              <div className="h-8 w-px bg-slate-200/80 dark:bg-zinc-800 hidden sm:block" />
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-inner text-xl animate-pulse">
                  🙁
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-500 block">Cần Ưu Tiên</span>
                  <span className="text-xl font-black text-rose-600 dark:text-rose-400 tracking-tight">{sentimentBreakdown.negative} <span className="text-xs font-semibold text-rose-400">ca tiêu cực</span></span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Response Progress Metric */}
        <div className="bg-white/80 dark:bg-zinc-900/80 p-3.5 rounded-2xl border border-slate-200/60 dark:border-zinc-800 shadow-xs min-w-[220px]">
          <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-zinc-300 mb-1.5">
            <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-400">
              <CheckCircle2 size={13} className="text-teal-600" /> Tiến độ xử lý
            </span>
            <span className="text-teal-700 dark:text-teal-400 font-black text-sm">{responseRate.pct}%</span>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${responseRate.pct}%` }}
            />
          </div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 mt-1.5 text-right">
            Đã tương tác {responseRate.replied} / {responseRate.total} đánh giá
          </p>
        </div>
      </div>

      {/* 2. FULL WIDTH 50/50 SEGMENTED CONTROL TABS */}
      <div className="w-full bg-slate-100/90 dark:bg-zinc-800/80 p-1.5 rounded-2xl border border-slate-200/60 dark:border-zinc-800 shadow-inner grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('service')}
          className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'service'
              ? 'bg-white dark:bg-zinc-900 text-teal-700 dark:text-teal-300 shadow-md shadow-teal-600/10'
              : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
          }`}
        >
          <span>Đánh giá dịch vụ</span>
          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black ${
            activeTab === 'service'
              ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300'
              : 'bg-slate-200 text-slate-600 dark:bg-zinc-700 dark:text-zinc-400'
          }`}>
            {serviceStats.count}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('staff')}
          className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'staff'
              ? 'bg-white dark:bg-zinc-900 text-teal-700 dark:text-teal-300 shadow-md shadow-teal-600/10'
              : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
          }`}
        >
          <span>Kỹ thuật viên & Chuyên viên</span>
          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black ${
            activeTab === 'staff'
              ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300'
              : 'bg-slate-200 text-slate-600 dark:bg-zinc-700 dark:text-zinc-400'
          }`}>
            {staffStats.count}
          </span>
        </button>
      </div>

      {/* 3. PRO MAX COMPACT FILTER TOOLBAR */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-3 shadow-xs flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm khách hàng, chuyên viên hoặc dịch vụ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:border-teal-500 transition-all shadow-2xs"
          />
        </div>

        {/* Custom Popover Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Target Filter */}
          {activeTab === 'service' ? (
            <FilterSelect
              label="Tất cả dịch vụ"
              value={selectedService}
              options={uniqueServices.map(svc => ({ value: svc, label: svc }))}
              onChange={setSelectedService}
              align="left"
            />
          ) : (
            <FilterSelect
              label="Tất cả nhân sự"
              value={selectedSpecialist}
              options={uniqueSpecialists.map(spec => ({ value: spec, label: spec }))}
              onChange={setSelectedSpecialist}
              align="left"
            />
          )}

          {/* Rating Filter */}
          <FilterSelect
            label="Tất cả sao"
            value={selectedStars}
            options={[
              { value: 'Tất cả', label: 'Tất cả sao' },
              { value: '5', label: '5 sao (★★★★★)', icon: '⭐' },
              { value: '4', label: '4 sao (★★★★☆)', icon: '⭐' },
              { value: '3', label: '3 sao (★★★☆☆)', icon: '⭐' },
              { value: '2', label: '2 sao (★★☆☆☆)', icon: '⭐' },
              { value: '1', label: '1 sao (★☆☆☆☆)', icon: '⭐' },
            ]}
            onChange={setSelectedStars}
            align="left"
          />

          {/* AI Sentiment Filter with Vivid Emojis */}
          <FilterSelect
            label="Cảm xúc AI"
            value={selectedSentiment}
            options={[
              { value: 'Tất cả', label: 'Tất cả cảm xúc' },
              { value: 'POSITIVE', label: 'Tích cực', icon: '😊' },
              { value: 'NEUTRAL', label: 'Trung tính', icon: '😐' },
              { value: 'NEGATIVE', label: 'Tiêu cực', icon: '🙁' },
            ]}
            onChange={setSelectedSentiment}
            align="right"
          />

          {/* Response Status Filter */}
          <FilterSelect
            label="Trạng thái"
            value={selectedResponseStatus}
            options={[
              { value: 'Tất cả', label: 'Tất cả trạng thái' },
              { value: 'pending', label: 'Chưa phản hồi', icon: '⏳' },
              { value: 'replied', label: 'Đã phản hồi', icon: '✅' },
            ]}
            onChange={setSelectedResponseStatus}
            align="right"
          />

          {/* Reset Filter Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <X size={13} />
              <span>Đặt lại</span>
            </button>
          )}
        </div>
      </div>



      {/* 4. SMART REVIEW LIST / DATA-DENSE WORKSPACE TABLE (CHỈ ĐỂ TÊN KHÁCH HÀNG TINH GỌN) */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-[28px] overflow-hidden shadow-xl shadow-slate-200/30 dark:shadow-none font-jakarta">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-teal-600 mb-2" size={28} />
            <span className="text-xs font-bold text-slate-400">Đang đồng bộ dữ liệu đánh giá...</span>
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <div className="text-center py-20 px-4">
            <MessageSquare size={36} className="mx-auto text-slate-300 dark:text-zinc-600 mb-2.5" />
            <p className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400">Không tìm thấy đánh giá nào phù hợp</p>
            <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1 font-medium">Thử thay đổi từ khóa tìm kiếm hoặc bấm đặt lại bộ lọc.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-zinc-950/80 border-b border-slate-200/70 dark:border-zinc-800 text-slate-400 dark:text-zinc-500 font-black uppercase tracking-wider text-[10px] select-none">
                  <th className="py-4 px-4 w-12 text-center">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {selectedIds.size === filteredFeedbacks.length && filteredFeedbacks.length > 0 ? (
                        <CheckSquare size={15} className="text-teal-600" />
                      ) : (
                        <Square size={15} />
                      )}
                    </button>
                  </th>
                  <th className="py-4 px-6 min-w-[240px]">Khách hàng</th>
                  <th className="py-4 px-4 w-60 text-center">Cảm xúc AI</th>
                  <th className="py-4 px-4 w-52 text-center">Trạng thái</th>
                  <th className="py-4 px-4 w-40 text-center">Thời gian</th>
                  <th className="py-4 px-4 w-32 text-center">Thao tác</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 font-sans">
                {filteredFeedbacks.map((f) => {
                  const isSelected = selectedIds.has(f.id);
                  const isNegative = f.cam_xuc === 'NEGATIVE';

                  return (
                    <tr
                      key={f.id}
                      onClick={() => handleOpenDetail(f)}
                      className={`group transition-all duration-150 cursor-pointer select-none ${
                        isSelected
                          ? 'bg-teal-50/50 dark:bg-teal-950/20'
                          : 'hover:bg-slate-50/90 dark:hover:bg-zinc-800/40'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-4 px-4 text-center" onClick={(e) => handleToggleSelect(f.id, e)}>
                        <button type="button" className="text-slate-300 dark:text-zinc-600 group-hover:text-slate-500 cursor-pointer">
                          {isSelected ? <CheckSquare size={15} className="text-teal-600" /> : <Square size={15} />}
                        </button>
                      </td>

                      {/* Customer Name Only (Gọn gàng, thanh thoát) */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5">
                          <div className="size-10 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white font-black text-sm flex items-center justify-center shadow-sm shrink-0">
                            {f.ten_khach_hang ? f.ten_khach_hang.charAt(0).toUpperCase() : 'K'}
                          </div>
                          <span className="font-bold text-slate-800 dark:text-zinc-100 text-sm truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                            {f.ten_khach_hang || 'Khách hàng'}
                          </span>
                        </div>
                      </td>

                      {/* AI Sentiment with Vivid Colored Emojis (Căn giữa hoàn hảo) */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          {f.cam_xuc === 'POSITIVE' ? (
                            <span className="inline-flex items-center gap-2 text-xs font-extrabold text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300/80 dark:border-emerald-800/80 px-3.5 py-1.5 rounded-2xl shadow-2xs">
                              <span className="text-base leading-none">😊</span>
                              <span>Tích cực</span>
                              {f.do_tin_cay && <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">({Math.round(f.do_tin_cay * 100)}%)</span>}
                            </span>
                          ) : f.cam_xuc === 'NEGATIVE' ? (
                            <span className="inline-flex items-center gap-2 text-xs font-extrabold text-rose-800 dark:text-rose-200 bg-rose-50 dark:bg-rose-950/50 border border-rose-300/80 dark:border-rose-800/80 px-3.5 py-1.5 rounded-2xl shadow-2xs animate-pulse">
                              <span className="text-base leading-none">🙁</span>
                              <span>Tiêu cực</span>
                              {f.do_tin_cay && <span className="text-[11px] font-black text-rose-600 dark:text-rose-400">({Math.round(f.do_tin_cay * 100)}%)</span>}
                            </span>
                          ) : f.cam_xuc === 'NEUTRAL' ? (
                            <span className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-700 dark:text-zinc-200 bg-amber-50/60 dark:bg-zinc-800 border border-amber-200/80 dark:border-zinc-700 px-3.5 py-1.5 rounded-2xl shadow-2xs">
                              <span className="text-base leading-none">😐</span>
                              <span>Trung tính</span>
                              {f.do_tin_cay && <span className="text-[11px] font-black text-amber-600 dark:text-amber-400">({Math.round(f.do_tin_cay * 100)}%)</span>}
                            </span>
                          ) : f.nhan_xet?.trim() ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAnalyzeOne(f);
                              }}
                              disabled={analyzingId === f.id}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 dark:text-teal-300 hover:text-teal-800 bg-teal-50 dark:bg-teal-950/40 border border-teal-300/80 px-3 py-1.5 rounded-2xl cursor-pointer transition-colors shadow-2xs"
                            >
                              {analyzingId === f.id ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                              <span>AI phân tích</span>
                            </button>
                          ) : (
                            <span className="text-xs text-slate-300 dark:text-zinc-600 font-medium italic">—</span>
                          )}
                        </div>
                      </td>

                      {/* Status (Căn giữa thẳng hàng với tiêu đề TRẠNG THÁI) */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          {f.phan_hoi_nhan_xet ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 px-3 py-1.5 rounded-2xl shadow-2xs">
                              <CheckCircle2 size={13} className="text-emerald-600" />
                              <span>Đã phản hồi</span>
                            </span>
                          ) : (
                            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-2xl border shadow-2xs ${
                              isNegative
                                ? 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200/80'
                                : 'text-slate-600 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700'
                            }`}>
                              <Clock size={12} />
                              <span>Chưa phản hồi</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Date (Căn giữa) */}
                      <td className="py-4 px-4 text-center text-slate-500 dark:text-zinc-400 text-xs font-bold whitespace-nowrap">
                        {formatDateShort(f.thoi_gian_danh_gia)}
                      </td>

                      {/* Action Button (Căn giữa) */}
                      <td className="py-4 px-4 text-center" onClick={(e) => { e.stopPropagation(); handleOpenDetail(f); }}>
                        <button
                          type="button"
                          className="px-3.5 py-1.5 bg-slate-100 hover:bg-teal-50 dark:bg-zinc-800 dark:hover:bg-teal-950/50 text-slate-700 hover:text-teal-700 dark:text-zinc-300 dark:hover:text-teal-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 mx-auto cursor-pointer shadow-2xs border border-slate-200/60 dark:border-zinc-700"
                        >
                          <Eye size={13} />
                          <span>Chi tiết</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. FLOATING BULK ACTION BAR */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 dark:bg-zinc-800/95 backdrop-blur-xl text-white px-6 py-3.5 rounded-2xl shadow-2xl border border-slate-700/60 flex items-center gap-5 text-xs font-bold"
          >
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-teal-400 animate-pulse" />
              <span>Đã chọn <b>{selectedIds.size}</b> đánh giá</span>
            </div>

            <div className="h-4 w-px bg-slate-700" />

            <button
              type="button"
              onClick={() => {
                const selectedItems = feedbacks.filter(f => selectedIds.has(f.id));
                const ready = selectedItems.filter(f => !f.phan_hoi_nhan_xet && f.de_xuat_phan_hoi);
                if (ready.length > 0) {
                  handleBulkApprove(ready);
                } else {
                  toast('Chưa có câu trả lời AI nào sẵn sàng trong các mục đã chọn.');
                }
              }}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-teal-600/20"
            >
              <Send size={13} />
              <span>Gửi phản hồi đã chọn</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer text-xs"
            >
              Bỏ chọn
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. PRO MAX CENTER POPUP MODAL (GỘP CARD THÀNH 1 BANNER & 1 CARD NHẬN XÉT DUY NHẤT) */}
      <AnimatePresence>
        {selectedFeedback && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedFeedback(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-md cursor-pointer"
            />

            {/* Modal Dialog Content (Center Popup) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 10 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-[32px] shadow-2xl border border-slate-200/80 dark:border-zinc-800 overflow-hidden z-10 my-8 flex flex-col font-sans"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 dark:border-zinc-800 bg-gradient-to-r from-teal-900/5 to-transparent flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="size-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white font-black text-base flex items-center justify-center shadow-md shadow-teal-600/20 shrink-0">
                    {selectedFeedback.ten_khach_hang ? selectedFeedback.ten_khach_hang.charAt(0).toUpperCase() : 'K'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-zinc-100 font-jakarta">
                        {selectedFeedback.ten_khach_hang || 'Khách hàng'}
                      </h3>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200/50">
                        {selectedFeedback.loai_danh_gia === 'service' ? 'Đánh giá dịch vụ' : 'Đánh giá nhân sự'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium mt-1 flex items-center gap-1.5">
                      <Clock size={13} /> {formatDate(selectedFeedback.thoi_gian_danh_gia)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedFeedback(null)}
                  className="size-9 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto max-h-[75vh] space-y-6 text-xs font-sans">
                {/* 1. GỘP CARD THÀNH 1 BANNER TỔNG QUAN DUY NHẤT (Phân loại chức danh thông minh) */}
                <div className="p-4 sm:p-5 bg-gradient-to-r from-teal-500/5 via-emerald-500/5 to-slate-50 dark:from-teal-950/40 dark:to-zinc-950/60 rounded-3xl border border-teal-500/20 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: Star rating score + stars */}
                  <div className="flex items-center gap-3.5">
                    <div className="flex items-baseline gap-1 bg-amber-500/10 dark:bg-amber-950/40 px-3.5 py-2 rounded-2xl border border-amber-500/20 shrink-0">
                      <span className="text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
                        {((selectedFeedback.loai_danh_gia === 'service' ? selectedFeedback.so_sao_tong : selectedFeedback.so_sao_ktv) || 0)}.0
                      </span>
                      <span className="text-xs font-bold text-amber-600/70">/ 5★</span>
                    </div>
                    <div>
                      <div className="flex text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => {
                          const val = (selectedFeedback.loai_danh_gia === 'service' ? selectedFeedback.so_sao_tong : selectedFeedback.so_sao_ktv) || 0;
                          return (
                            <Star
                              key={i}
                              size={16}
                              className={i < val ? 'fill-amber-400 stroke-none' : 'text-slate-200 dark:text-zinc-700 fill-slate-200 dark:fill-zinc-700 stroke-none'}
                            />
                          );
                        })}
                      </div>
                      <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 block mt-0.5">
                        Đánh giá của khách hàng
                      </span>
                    </div>
                  </div>

                  {/* Right: Target service / doctor name (hiển thị trọn vẹn, không bị thụt) */}
                  <div className="flex items-center gap-2.5 bg-white dark:bg-zinc-900 px-4 py-2.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs">
                    <Award size={18} className="text-teal-600 shrink-0" />
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 block">
                        {selectedFeedback.loai_danh_gia === 'service'
                          ? 'Dịch vụ đã thực hiện'
                          : getStaffRoleLabel(selectedFeedback)}
                      </span>
                      <span className="font-extrabold text-xs text-teal-800 dark:text-teal-300 block">
                        {selectedFeedback.loai_danh_gia === 'service'
                          ? selectedFeedback.ten_dich_vu
                          : selectedFeedback.ten_ky_thuat_vien}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. GỘP CHUNG: NỘI DUNG NHẬN XÉT + CẢM XÚC AI TRONG 1 CARD DUY NHẤT */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200 flex items-center gap-2 font-jakarta">
                    <MessageSquare size={14} className="text-teal-600" />
                    <span>Nội dung nhận xét</span>
                  </h4>

                  <div className="p-5 bg-slate-50/80 dark:bg-zinc-950/70 border border-slate-200/80 dark:border-zinc-800 rounded-3xl space-y-4 shadow-2xs">
                    {/* Lời nhận xét */}
                    <div className="relative">
                      <Quote size={24} className="text-teal-600/20 absolute top-0 right-0 pointer-events-none" />
                      <p className="text-sm font-medium leading-relaxed text-slate-800 dark:text-zinc-100 italic pr-8 font-sans">
                        {selectedFeedback.nhan_xet?.trim() ? (
                          `"${censorText(selectedFeedback.nhan_xet)}"`
                        ) : (
                          <span className="not-italic text-slate-400">Khách hàng không để lại nhận xét chi tiết bằng văn bản.</span>
                        )}
                      </p>
                    </div>

                    {/* Phân tích cảm xúc & Khuyến nghị xử lý (nằm trong CÙNG 1 card) */}
                    {selectedFeedback.cam_xuc && (
                      <div className="pt-4 border-t border-slate-200/60 dark:border-zinc-800/80 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {selectedFeedback.cam_xuc === 'POSITIVE' ? (
                              <div className="flex items-center gap-2 text-xs font-black text-emerald-800 dark:text-emerald-200 bg-emerald-500/10 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                                <span className="text-base leading-none">😊</span>
                                <span>Cảm xúc: TÍCH CỰC</span>
                              </div>
                            ) : selectedFeedback.cam_xuc === 'NEGATIVE' ? (
                              <div className="flex items-center gap-2 text-xs font-black text-rose-800 dark:text-rose-200 bg-rose-500/10 dark:bg-rose-950/40 px-3 py-1.5 rounded-xl border border-rose-500/20">
                                <span className="text-base leading-none">🙁</span>
                                <span>Cảm xúc: TIÊU CỰC</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-xs font-black text-slate-700 dark:text-zinc-200 bg-amber-500/10 dark:bg-zinc-800 px-3 py-1.5 rounded-xl border border-amber-500/20">
                                <span className="text-base leading-none">😐</span>
                                <span>Cảm xúc: TRUNG TÍNH</span>
                              </div>
                            )}
                          </div>

                          {selectedFeedback.do_tin_cay && (
                            <span className="text-xs font-bold text-slate-400">
                              Độ tin cậy: <b className="text-teal-600 dark:text-teal-400">{Math.round(selectedFeedback.do_tin_cay * 100)}%</b>
                            </span>
                          )}
                        </div>

                        {selectedFeedback.ly_do_cam_xuc && (
                          <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed font-medium">
                            {selectedFeedback.ly_do_cam_xuc}
                          </p>
                        )}

                        {selectedFeedback.de_xuat_hanh_dong && (
                          <div className="pt-2.5 border-t border-slate-200/40 dark:border-zinc-800/60">
                            <span className="text-[10px] font-black uppercase tracking-wider text-teal-700 dark:text-teal-400 block mb-1">
                              💡 Khuyến nghị xử lý
                            </span>
                            <p className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                              {selectedFeedback.de_xuat_hanh_dong}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Response Section (Phản hồi từ phòng khám OfficeCare) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200 flex items-center gap-2 font-jakarta">
                      <Send size={14} className="text-teal-600" />
                      <span>Phản hồi từ phòng khám OfficeCare</span>
                    </h4>

                    {selectedFeedback.phan_hoi_nhan_xet && !isEditingReply && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingReply(true);
                          setReplyText(selectedFeedback.phan_hoi_nhan_xet || '');
                        }}
                        className="text-xs font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400 flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 size={13} />
                        <span>Chỉnh sửa phản hồi</span>
                      </button>
                    )}
                  </div>

                  {selectedFeedback.phan_hoi_nhan_xet && !isEditingReply ? (
                    <div className="p-4 bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/70 dark:border-teal-800/60 rounded-3xl space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="font-extrabold text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                          <CheckCircle2 size={14} className="text-teal-600" />
                          {selectedFeedback.ten_nguoi_phan_hoi || 'Quản trị viên OfficeCare'}
                        </span>
                        {selectedFeedback.ngay_phan_hoi && (
                          <span className="font-medium text-[11px]">{formatDate(selectedFeedback.ngay_phan_hoi)}</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 dark:text-zinc-200 leading-relaxed font-medium pt-1 italic font-sans">
                        "{selectedFeedback.phan_hoi_nhan_xet}"
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <textarea
                        rows={4}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Nhập nội dung phản hồi y khoa gửi tới khách hàng..."
                        className="w-full p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-3xl text-xs font-medium text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-teal-500 leading-relaxed shadow-inner font-sans"
                      />

                      {/* AI Draft quick helper & Regenerate AI Response Button */}
                      <div className="flex flex-wrap items-center gap-2">
                        {selectedFeedback.de_xuat_phan_hoi && replyText !== selectedFeedback.de_xuat_phan_hoi && (
                          <button
                            type="button"
                            onClick={() => setReplyText(selectedFeedback.de_xuat_phan_hoi || '')}
                            className="px-3.5 py-1.5 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors border border-teal-200/50"
                          >
                            <Sparkles size={13} className="text-teal-600" />
                            <span>Dùng câu trả lời AI gợi ý</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRegenerateAIDraft(selectedFeedback)}
                          disabled={analyzingId === selectedFeedback.id}
                          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors border border-slate-200/60 dark:border-zinc-700 disabled:opacity-50"
                        >
                          {analyzingId === selectedFeedback.id ? (
                            <Loader2 size={13} className="animate-spin text-teal-600" />
                          ) : (
                            <RefreshCw size={13} className="text-teal-600" />
                          )}
                          <span>Soạn lại phản hồi khác (AI)</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer Actions */}
              {(!selectedFeedback.phan_hoi_nhan_xet || isEditingReply) && (
                <div className="p-5 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-950/60 flex items-center justify-between gap-3">
                  {isEditingReply && selectedFeedback.phan_hoi_nhan_xet ? (
                    <button
                      type="button"
                      onClick={() => setIsEditingReply(false)}
                      className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300 cursor-pointer"
                    >
                      Hủy chỉnh sửa
                    </button>
                  ) : <div />}

                  <button
                    type="button"
                    onClick={handleSendReply}
                    disabled={submittingReply || !replyText.trim()}
                    className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-md shadow-teal-600/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                  >
                    {submittingReply ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    <span>{selectedFeedback.phan_hoi_nhan_xet ? 'Cập nhật phản hồi' : 'Gửi phản hồi cho khách'}</span>
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. CUSTOM CONFIRM DIALOG */}
      {confirmConfig && (
        <ConfirmDialog
          isOpen={confirmConfig.isOpen}
          title={confirmConfig.title}
          message={confirmConfig.message}
          type={confirmConfig.type || 'info'}
          confirmLabel={confirmConfig.confirmLabel || 'Xác nhận'}
          cancelLabel="Hủy bỏ"
          onConfirm={confirmConfig.onConfirm}
          onCancel={() => setConfirmConfig(null)}
        />
      )}
    </div>
  );
}
