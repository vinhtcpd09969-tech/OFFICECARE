import { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  FileText,
  Zap,
  Sparkles,
  Smile,
  MessageSquare,
  Sliders,
  Flame,
  AlertTriangle,
  Calendar,
  Stethoscope,
} from 'lucide-react';
import { format } from 'date-fns';
import { TreatmentLogItem } from '../../technician/api/technician.api';
import toast from 'react-hot-toast';

interface TechnicianTreatmentDeskProps {
  patientName: string;
  appointmentDetail?: {
    id?: string;
    khach_hang_id?: string;
    phac_do_dieu_tri_id?: string | null;
    chan_doan?: string;
    chong_chi_dinh?: string;
    ghi_chu?: string;
    ghi_chu_chuyen_vien?: string;
    chuyen_vien_chi_dinh?: string;
    ma_lich_kham_goc?: string;
    ngay_luong_gia?: string;
    ten_dich_vu?: string | null;
    quy_trinh?: string | null;
    mo_ta_goi?: string | null;
    thoi_luong_phut?: number | null;
    so_thu_tu_buoi?: number | null;
    pd_tong_so_buoi?: number | null;
    vas_truoc?: number;
    vas_sau?: number;
    du_lieu_tri_lieu?: { nhat_ky: TreatmentLogItem[] } | null;
  } | null;
  onCompleteTreatment: (data: {
    vas_truoc: number;
    vas_sau: number;
    ghi_chu: string;
    du_lieu_tri_lieu: { nhat_ky: TreatmentLogItem[] };
  }) => Promise<void>;
  onSaveDraft?: (data: {
    vas_truoc: number;
    vas_sau: number;
    ghi_chu: string;
    du_lieu_tri_lieu: { nhat_ky: TreatmentLogItem[] };
  }) => void;
}

// Wong-Baker Faces mapping
const WONG_BAKER_FACES = [
  { score: 0, face: '😊', label: 'Không đau', desc: 'Hoàn toàn thoải mái' },
  { score: 2, face: '😐', label: 'Đau nhẹ', desc: 'Đau ít, không ảnh hưởng sinh hoạt' },
  { score: 4, face: '🙁', label: 'Đau vừa', desc: 'Đau gây khó chịu nhẹ' },
  { score: 6, face: '😣', label: 'Đau nhiều', desc: 'Ảnh hưởng tập trung / giấc ngủ' },
  { score: 8, face: '😫', label: 'Rất đau', desc: 'Khó vận động, đau nhói' },
  { score: 10, face: '😭', label: 'Đau dữ dội', desc: 'Không thể chịu đựng' },
];

export function TechnicianTreatmentDesk({
  patientName,
  appointmentDetail,
  onCompleteTreatment,
  onSaveDraft,
}: TechnicianTreatmentDeskProps) {
  // Parse quy trình kỹ thuật chuẩn của gói từ DB (nếu có, phân tách bằng dấu chấm phẩy hoặc xuống dòng)
  const packageSteps = (() => {
    const rawProtocol = appointmentDetail?.quy_trinh || '';
    if (!rawProtocol.trim()) {
      // Fallback mặc định theo chuyên khoa PHCN chuẩn
      return [
        { name: 'Chườm nóng & Massage cổ - vai - gáy - lưng: Nhiệt trị liệu làm mềm cơ kết hợp xoa bóp chuyên sâu giảm đau mỏi vùng vai gáy và lưng.', icon: '♨️' },
        { name: 'Massage chân & bắp chân: Xoa bóp day ấn nhẹ chi dưới giúp giảm cảm giác nặng chân, tê mỏi và hỗ trợ tuần hoàn máu.', icon: '🦵' },
        { name: 'Massage đầu & Kéo giãn cơ toàn thân: Massage thư giãn thần kinh vùng đầu kết hợp kéo giãn linh hoạt các khớp cơ toàn cơ thể.', icon: '💆' },
        { name: 'Nhiệt trị liệu phục hồi: Tác động nhiệt sâu giúp giãn cơ tối đa, duy trì hiệu quả thư giãn và phục hồi thể trạng.', icon: '🔥' },
      ];
    }

    const lines = rawProtocol.split(/[;\n\r]+/).map(s => s.trim()).filter(Boolean);
    const icons = ['♨️', '🦵', '💆', '🔥', '⚡', '🩹', '🧘', '🩺'];
    return lines.map((line, idx) => ({
      name: line.replace(/^[\d+.\-–*•]\s*/, ''),
      icon: icons[idx % icons.length]
    }));
  })();

  const [vasMode, setVasMode] = useState<'faces' | 'verbal' | 'slider'>('faces');
  const [vasTruoc, setVasTruoc] = useState<number>(appointmentDetail?.vas_truoc ?? 4);
  const [vasSau, setVasSau] = useState<number>(appointmentDetail?.vas_sau ?? 2);
  const [notes, setNotes] = useState<string>(appointmentDetail?.ghi_chu || '');
  const [logs, setLogs] = useState<TreatmentLogItem[]>(
    appointmentDetail?.du_lieu_tri_lieu?.nhat_ky || []
  );

  // Loading & Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [triedSubmitWithoutLogs, setTriedSubmitWithoutLogs] = useState(false);

  const draftKey = appointmentDetail?.id ? ('draft_treat_' + appointmentDetail.id) : ('draft_treat_' + patientName.trim().replace(/\s+/g, '_'));

  // Khôi phục nháp từ sessionStorage nếu vừa chuyển tab hoặc rời trang quay lại
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.vasTruoc != null) setVasTruoc(parsed.vasTruoc);
        if (parsed.vasSau != null) setVasSau(parsed.vasSau);
        if (parsed.notes != null) setNotes(parsed.notes);
        if (Array.isArray(parsed.logs)) setLogs(parsed.logs);
      }
    } catch (e) {}
  }, [draftKey]);

  // Tự động lưu nháp (debounce ~1.5s) sang server & lưu tức thì sang sessionStorage
  const isFirstRender = useRef(true);
  useEffect(() => {
    try {
      sessionStorage.setItem(draftKey, JSON.stringify({ vasTruoc, vasSau, notes, logs }));
    } catch (e) {}

    if (!onSaveDraft) return;
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      onSaveDraft({ vas_truoc: vasTruoc, vas_sau: vasSau, ghi_chu: notes, du_lieu_tri_lieu: { nhat_ky: logs } });
    }, 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vasTruoc, vasSau, notes, logs, draftKey]);

  // Tích chọn tất cả các bước theo quy trình gói (1-click)
  const handleSelectAllPackageProtocol = () => {
    setTriedSubmitWithoutLogs(false);
    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const newItems: TreatmentLogItem[] = packageSteps.map(step => ({
      luc: timeStr,
      noi_dung: step.name
    }));
    setLogs(prev => {
      const existingNames = new Set(prev.map(p => p.noi_dung));
      const filteredNew = newItems.filter(i => !existingNames.has(i.noi_dung));
      const nextLogs = [...prev, ...filteredNew];
      try {
        sessionStorage.setItem(draftKey, JSON.stringify({ vasTruoc, vasSau, notes, logs: nextLogs }));
      } catch (e) {}
      if (onSaveDraft) {
        onSaveDraft({ vas_truoc: vasTruoc, vas_sau: vasSau, ghi_chu: notes, du_lieu_tri_lieu: { nhat_ky: nextLogs } });
      }
      return nextLogs;
    });
  };

  // Tick / Untick 1 bước trong gói (Lưu tức thì 0ms)
  const togglePackageStep = (name: string) => {
    setTriedSubmitWithoutLogs(false);
    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    setLogs(prev => {
      const exists = prev.some(l => l.noi_dung === name);
      const nextLogs = exists
        ? prev.filter(l => l.noi_dung !== name)
        : [...prev, { luc: timeStr, noi_dung: name }];
      try {
        sessionStorage.setItem(draftKey, JSON.stringify({ vasTruoc, vasSau, notes, logs: nextLogs }));
      } catch (e) {}
      if (onSaveDraft) {
        onSaveDraft({ vas_truoc: vasTruoc, vas_sau: vasSau, ghi_chu: notes, du_lieu_tri_lieu: { nhat_ky: nextLogs } });
      }
      return nextLogs;
    });
  };

  // Kiểm tra tính hợp lệ trước khi mở Modal xác nhận hoàn thành
  const handleOpenCompleteModal = () => {
    if (logs.length === 0) {
      setTriedSubmitWithoutLogs(true);
      toast.error('Vui lòng tích chọn ít nhất 1 quy trình / thao tác kỹ thuật trước khi hoàn thành ca trị liệu!');
      const el = document.getElementById('technician-protocol-card');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    setTriedSubmitWithoutLogs(false);
    setShowConfirmModal(true);
  };

  // Nộp ca trị liệu
  const handleSubmit = async () => {
    if (logs.length === 0) {
      setTriedSubmitWithoutLogs(true);
      setShowConfirmModal(false);
      toast.error('Vui lòng tích chọn ít nhất 1 quy trình / thao tác kỹ thuật trước khi hoàn thành!');
      return;
    }
    setSubmitting(true);
    try {
      await onCompleteTreatment({
        vas_truoc: vasTruoc,
        vas_sau: vasSau,
        ghi_chu: notes,
        du_lieu_tri_lieu: { nhat_ky: logs },
      });
      try {
        sessionStorage.removeItem(draftKey);
      } catch (e) {}
    } finally {
      setSubmitting(false);
      setShowConfirmModal(false);
    }
  };

  const deltaVas = vasTruoc - vasSau;
  const isTreatmentPlanPackage = Boolean(
    appointmentDetail?.phac_do_dieu_tri_id || (appointmentDetail?.so_thu_tu_buoi && appointmentDetail.so_thu_tu_buoi > 0)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-jakarta">
      {/* CARD 1: THÔNG TIN HỒ SƠ & CHỈ ĐỊNH TỪ CHUYÊN VIÊN PHCN (CHỈ HIỂN THỊ VỚI GÓI LIỆU TRÌNH) */}
      {isTreatmentPlanPackage && (
        <div className="bg-gradient-to-br from-teal-900/10 via-cyan-900/5 to-slate-900/10 dark:from-teal-950/40 dark:via-cyan-950/20 dark:to-zinc-900/40 border border-teal-500/20 dark:border-teal-500/30 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-teal-500/15 dark:border-teal-500/20 pb-3">
            <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 font-black text-sm uppercase tracking-wider font-jakarta">
              <Sparkles className="text-teal-600 dark:text-teal-400" size={18} />
              <span>Kế Hoạch Trị Liệu & Chỉ Định Từ Chuyên Viên PHCN</span>
            </div>
            <div className="flex items-center flex-wrap gap-2">
              {appointmentDetail?.chuyen_vien_chi_dinh && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 dark:text-teal-200 bg-white/90 dark:bg-zinc-800/90 px-3 py-1 rounded-full border border-teal-300/80 dark:border-teal-700/80 shadow-2xs">
                  <Stethoscope size={13} className="text-teal-600 dark:text-teal-400" />
                  <span>Chỉ định bởi: <strong className="font-black text-teal-950 dark:text-teal-100">{appointmentDetail.chuyen_vien_chi_dinh}</strong></span>
                </span>
              )}
              {appointmentDetail?.so_thu_tu_buoi && (
                <span className="text-xs font-extrabold text-teal-700 dark:text-teal-300 bg-teal-100 dark:bg-teal-900/50 px-3 py-1 rounded-full border border-teal-300 dark:border-teal-700">
                  Buổi {appointmentDetail.so_thu_tu_buoi}{appointmentDetail.pd_tong_so_buoi ? ` / ${appointmentDetail.pd_tong_so_buoi}` : ''}
                </span>
              )}
            </div>
          </div>

          {/* Thông tin buổi lượng giá gốc nếu có */}
          {(appointmentDetail?.ma_lich_kham_goc || appointmentDetail?.ngay_luong_gia) && (
            <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 text-[11.5px] text-slate-600 dark:text-zinc-400 font-semibold bg-white/60 dark:bg-zinc-900/60 p-2.5 rounded-xl border border-teal-500/10 dark:border-teal-500/20">
              {appointmentDetail.ma_lich_kham_goc && (
                <span className="flex items-center gap-1">
                  <span>📋 Buổi lượng giá gốc:</span>
                  <strong className="text-teal-700 dark:text-teal-300 font-black">{appointmentDetail.ma_lich_kham_goc}</strong>
                </span>
              )}
              {appointmentDetail.ngay_luong_gia && (
                <span className="flex items-center gap-1">
                  <Calendar size={12} className="text-slate-400" />
                  <span>Ngày lượng giá:</span>
                  <strong className="text-slate-800 dark:text-zinc-200">
                    {format(new Date(appointmentDetail.ngay_luong_gia), 'dd/MM/yyyy')}
                  </strong>
                </span>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Kết luận lượng giá */}
            <div className="bg-white/80 dark:bg-zinc-900/80 rounded-2xl p-4 border border-teal-500/10 dark:border-teal-500/20 space-y-1.5 shadow-2xs">
              <span className="font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider text-[10px] block">
                Kết luận lượng giá chức năng:
              </span>
              <p className="font-semibold text-slate-800 dark:text-zinc-200 leading-relaxed">
                {appointmentDetail?.chan_doan || 'Lượng giá phục hồi chức năng cơ xương khớp vùng làm việc.'}
              </p>
            </div>

            {/* Chống chỉ định */}
            <div className="bg-rose-50/80 dark:bg-rose-955/40 rounded-2xl p-4 border border-rose-200/80 dark:border-rose-900/50 space-y-1.5 shadow-2xs">
              <span className="font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
                <AlertTriangle size={12} />
                Chống chỉ định & Vùng cần tránh:
              </span>
              <p className="font-semibold text-rose-900 dark:text-rose-200 leading-relaxed">
                {appointmentDetail?.chong_chi_dinh || 'Không có chống chỉ định đặc biệt.'}
              </p>
            </div>
          </div>

          {(appointmentDetail?.ghi_chu_chuyen_vien || appointmentDetail?.ghi_chu) && (
            <div className="bg-white/60 dark:bg-zinc-900/60 rounded-xl p-3 border border-slate-200/60 dark:border-zinc-800 text-xs text-slate-600 dark:text-zinc-300 font-medium">
              <span className="font-bold text-slate-700 dark:text-zinc-200">Ghi chú & Dặn dò từ Chuyên viên PHCN:</span> {appointmentDetail.ghi_chu_chuyen_vien || appointmentDetail.ghi_chu}
            </div>
          )}
        </div>
      )}

      {/* CARD 2: ĐÁNH GIÁ THANG ĐAU VAS (TRƯỚC & SAU THAO TÁC) */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2 text-slate-800 dark:text-zinc-100 font-black text-sm uppercase tracking-wider font-jakarta">
            <Flame className="text-amber-500" size={18} />
            <span>Thang Đo Đau VAS (Trước & Sau Trị Liệu)</span>
          </div>

          {/* Selector Chế độ VAS */}
          <div className="inline-flex p-1 bg-slate-100 dark:bg-zinc-800 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setVasMode('faces')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                vasMode === 'faces'
                  ? 'bg-white dark:bg-zinc-900 text-teal-600 dark:text-teal-400 shadow-sm'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800'
              }`}
            >
              <Smile size={14} />
              <span>Mặt Cười</span>
            </button>
            <button
              type="button"
              onClick={() => setVasMode('verbal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                vasMode === 'verbal'
                  ? 'bg-white dark:bg-zinc-900 text-teal-600 dark:text-teal-400 shadow-sm'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800'
              }`}
            >
              <MessageSquare size={14} />
              <span>Mô Tả</span>
            </button>
            <button
              type="button"
              onClick={() => setVasMode('slider')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                vasMode === 'slider'
                  ? 'bg-white dark:bg-zinc-900 text-teal-600 dark:text-teal-400 shadow-sm'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800'
              }`}
            >
              <Sliders size={14} />
              <span>Thanh Trượt</span>
            </button>
          </div>
        </div>

        {/* 2 Cột: Trước Trị Liệu & Sau Trị Liệu */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CỘT 1: VAS TRƯỚC */}
          <div className="space-y-3 bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/70 dark:border-zinc-700/60 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                1. Mức đau TRƯỚC khi bắt đầu
              </span>
              <span className="text-sm font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-955/60 px-2.5 py-0.5 rounded-lg border border-rose-200 dark:border-rose-900/50">
                {vasTruoc} / 10
              </span>
            </div>

            {vasMode === 'faces' && (
              <div className="grid grid-cols-6 gap-1.5 pt-1">
                {WONG_BAKER_FACES.map(f => (
                  <button
                    key={f.score}
                    type="button"
                    onClick={() => setVasTruoc(f.score)}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      vasTruoc === f.score
                        ? 'bg-rose-500 text-white border-rose-600 shadow-md scale-105'
                        : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 hover:border-rose-300 text-slate-700 dark:text-zinc-300'
                    }`}
                  >
                    <span className="text-xl">{f.face}</span>
                    <span className="text-[10px] font-black">{f.score}</span>
                  </button>
                ))}
              </div>
            )}

            {vasMode === 'verbal' && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                {WONG_BAKER_FACES.map(f => (
                  <button
                    key={f.score}
                    type="button"
                    onClick={() => setVasTruoc(f.score)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      vasTruoc === f.score
                        ? 'bg-rose-500 text-white border-rose-600 shadow-md font-bold'
                        : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 hover:border-rose-300 text-slate-700 dark:text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span>{f.label}</span>
                      <span className="opacity-80">({f.score})</span>
                    </div>
                    <p className={`text-[10px] truncate mt-0.5 ${vasTruoc === f.score ? 'text-white/90' : 'text-slate-400 dark:text-zinc-500'}`}>
                      {f.desc}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {vasMode === 'slider' && (
              <div className="pt-2 px-1 space-y-2">
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={1}
                  value={vasTruoc}
                  onChange={e => setVasTruoc(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-rose-600"
                />
                <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-zinc-500">
                  <span>0 (Không đau)</span>
                  <span>5 (Đau vừa)</span>
                  <span>10 (Dữ dội)</span>
                </div>
              </div>
            )}
          </div>

          {/* CỘT 2: VAS SAU */}
          <div className="space-y-3 bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/70 dark:border-zinc-700/60 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                2. Mức đau SAU khi kết thúc ca
              </span>
              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-955/60 px-2.5 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-900/50">
                {vasSau} / 10
              </span>
            </div>

            {vasMode === 'faces' && (
              <div className="grid grid-cols-6 gap-1.5 pt-1">
                {WONG_BAKER_FACES.map(f => (
                  <button
                    key={f.score}
                    type="button"
                    onClick={() => setVasSau(f.score)}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      vasSau === f.score
                        ? 'bg-emerald-500 text-white border-emerald-600 shadow-md scale-105'
                        : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 hover:border-emerald-300 text-slate-700 dark:text-zinc-300'
                    }`}
                  >
                    <span className="text-xl">{f.face}</span>
                    <span className="text-[10px] font-black">{f.score}</span>
                  </button>
                ))}
              </div>
            )}

            {vasMode === 'verbal' && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                {WONG_BAKER_FACES.map(f => (
                  <button
                    key={f.score}
                    type="button"
                    onClick={() => setVasSau(f.score)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      vasSau === f.score
                        ? 'bg-emerald-500 text-white border-emerald-600 shadow-md font-bold'
                        : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 hover:border-emerald-300 text-slate-700 dark:text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span>{f.label}</span>
                      <span className="opacity-80">({f.score})</span>
                    </div>
                    <p className={`text-[10px] truncate mt-0.5 ${vasSau === f.score ? 'text-white/90' : 'text-slate-400 dark:text-zinc-500'}`}>
                      {f.desc}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {vasMode === 'slider' && (
              <div className="pt-2 px-1 space-y-2">
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={1}
                  value={vasSau}
                  onChange={e => setVasSau(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-zinc-500">
                  <span>0 (Không đau)</span>
                  <span>5 (Đau vừa)</span>
                  <span>10 (Dữ dội)</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Delta VAS badge */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-base">📊</span>
            <div>
              <span className="font-bold text-slate-700 dark:text-zinc-200">Hiệu quả giảm đau buổi trị liệu:</span>
              <span className="font-medium text-slate-500 dark:text-zinc-400 ml-1">
                {deltaVas > 0
                  ? `Mức đau giảm ${deltaVas} điểm (${vasTruoc} → ${vasSau})`
                  : deltaVas === 0
                  ? `Mức đau giữ nguyên (${vasTruoc}/10)`
                  : `Mức đau tăng nhẹ ${Math.abs(deltaVas)} điểm (${vasTruoc} → ${vasSau})`}
              </span>
            </div>
          </div>
          {deltaVas > 0 && (
            <span className="px-3 py-1 rounded-full bg-emerald-500 text-white font-black text-xs shadow-sm">
              -{Math.round((deltaVas / (vasTruoc || 1)) * 100)}% đau
            </span>
          )}
        </div>
      </div>

      {/* CARD 3: NHẬT KÝ THAO TÁC KỸ THUẬT TRỊ LIỆU THỦ CÔNG */}
      <div
        id="technician-protocol-card"
        className={`bg-white dark:bg-zinc-900 border rounded-3xl p-5 sm:p-6 shadow-sm space-y-5 transition-all duration-300 ${
          triedSubmitWithoutLogs && logs.length === 0
            ? 'border-2 border-rose-500/90 dark:border-rose-500 ring-4 ring-rose-500/10'
            : 'border-slate-200/80 dark:border-zinc-800'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2 text-slate-800 dark:text-zinc-100 font-black text-sm uppercase tracking-wider font-jakarta">
            <Zap className="text-cyan-600 dark:text-cyan-400" size={18} />
            <span>Nhật Ký Thao Tác Kỹ Thuật Trị Liệu</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-955/50 px-3 py-1 rounded-full border border-teal-200/60 font-mono">
              {logs.length} / {packageSteps.length} kỹ thuật đã chọn
            </span>
          </div>
        </div>

        {/* THÔNG BÁO LỖI NẾU CHƯA CHỌN MÀ BẤM HOÀN THÀNH */}
        {triedSubmitWithoutLogs && logs.length === 0 && (
          <div className="p-3.5 rounded-2xl bg-rose-50/90 dark:bg-rose-955/60 border border-rose-200 dark:border-rose-800/80 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
            <AlertTriangle size={17} className="text-rose-600 shrink-0" />
            <span>Vui lòng tích chọn các thao tác kỹ thuật đã thực hiện dưới đây (hoặc bấm "Tích chọn tất cả") trước khi hoàn thành ca trị liệu!</span>
          </div>
        )}

        {/* QUY TRÌNH KỸ THUẬT THEO GÓI DỊCH VỤ (KẾT NỐI ĐỘNG TỪ DB) */}
        <div className="bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/70 dark:border-zinc-700/60 rounded-2xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-zinc-700/60 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200">
                📋 Quy trình kỹ thuật chuẩn của gói: <span className="text-teal-600 dark:text-teal-400">
                  {appointmentDetail?.ten_dich_vu || 'Vật lý trị liệu'}
                  {appointmentDetail?.so_thu_tu_buoi ? ` (Buổi ${appointmentDetail.so_thu_tu_buoi}${appointmentDetail.pd_tong_so_buoi ? `/${appointmentDetail.pd_tong_so_buoi}` : ''})` : ''}
                </span>
              </span>
            </div>

            <button
              type="button"
              onClick={handleSelectAllPackageProtocol}
              className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap"
            >
              <Zap size={14} />
              <span>⚡ TÍCH CHỌN TẤT CẢ THEO QUY TRÌNH GÓI</span>
            </button>
          </div>

          {/* CHECKLIST CÁC BƯỚC CỦA GÓI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {packageSteps.map(step => {
              const isLogged = logs.some(l => l.noi_dung === step.name);
              return (
                <button
                  key={step.name}
                  type="button"
                  onClick={() => togglePackageStep(step.name)}
                  className={`p-3.5 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                    isLogged
                      ? 'bg-teal-50 dark:bg-teal-955/40 border-teal-300 dark:border-teal-700 text-teal-900 dark:text-teal-200 font-bold shadow-xs'
                      : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:border-teal-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base">{step.icon}</span>
                    <span className="text-xs leading-relaxed">{step.name}</span>
                  </div>
                  <div className={`size-5 rounded-md flex items-center justify-center border transition-all shrink-0 ${
                    isLogged ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-800'
                  }`}>
                    {isLogged && <CheckCircle2 size={13} />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* CARD 4: GHI CHÚ DIỄN TIẾN CA TRỊ LIỆU */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-800 dark:text-zinc-100 font-black text-sm uppercase tracking-wider font-jakarta border-b border-slate-100 dark:border-zinc-800 pb-3">
          <FileText className="text-slate-600 dark:text-zinc-400" size={18} />
          <span>Ghi Chú Diễn Tiến & Dặn Dò KTV</span>
        </div>

        <textarea
          rows={3}
          placeholder="Nhập ghi chú phản ứng của khách hàng, mức đáp ứng trị liệu, dặn dò KTV cho các buổi tiếp theo..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-xs font-medium text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50 leading-relaxed resize-none"
        />
      </div>

      {/* FOOTER ACTION BAR */}
      <div className="flex items-center justify-end gap-4 pt-2">
        <button
          type="button"
          onClick={handleOpenCompleteModal}
          className="px-8 py-3.5 rounded-2xl text-white font-black text-xs uppercase tracking-wider shadow-lg bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 shadow-teal-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
        >
          <CheckCircle2 size={18} />
          <span>HOÀN THÀNH CA TRỊ LIỆU</span>
        </button>
      </div>

      {/* MODAL XÁC NHẬN HOÀN THÀNH */}
      {showConfirmModal && (() => {
        const plannedDuration = appointmentDetail?.thoi_luong_phut || 60;
        const startTimeIso = (appointmentDetail as any)?.thoi_gian_bat_dau || (appointmentDetail as any)?.thoi_gian_goi_vao || (appointmentDetail as any)?.thoi_gian_checkin;
        const startMs = startTimeIso ? new Date(startTimeIso).getTime() : Date.now();
        const elapsedMinutes = Math.max(1, Math.floor((Date.now() - startMs) / 60000));
        const earlyMinutes = plannedDuration - elapsedMinutes;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-teal-600 dark:text-teal-400">
                <CheckCircle2 size={28} />
                <h3 className="text-base font-black text-slate-900 dark:text-zinc-100 font-jakarta uppercase tracking-wider">
                  Xác Nhận Hoàn Thành Trị Liệu
                </h3>
              </div>

              {earlyMinutes > 0 && (
                <div className="bg-amber-50/90 dark:bg-amber-955/50 border border-amber-200 dark:border-amber-800/80 rounded-2xl p-3.5 flex items-start gap-2.5 text-left shadow-xs">
                  <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-xs">
                    <p className="font-extrabold text-amber-900 dark:text-amber-200">
                      ⚡ Ca hẹn dự kiến hoàn thành sớm
                    </p>
                    <p className="text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                      Bạn đang hoàn thành sớm trước <strong className="text-amber-950 dark:text-amber-100 font-black">{earlyMinutes} phút</strong> so với dự kiến (ca dự kiến {plannedDuration} phút).
                    </p>
                  </div>
                </div>
              )}

              <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed font-medium bg-slate-50 dark:bg-zinc-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-zinc-800 text-left">
                Bạn có chắc muốn kết thúc ca trị liệu cho bệnh nhân <strong className="text-slate-900 dark:text-zinc-100">{patientName}</strong>?<br />
                • Thang đau VAS: <strong className="text-rose-600 font-bold">{vasTruoc}</strong> → <strong className="text-emerald-600 font-bold">{vasSau}</strong><br />
                • Kỹ thuật thực hiện: <strong className="text-teal-600 font-bold">{logs.length} thao tác</strong>
              </p>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-bold text-xs transition-all cursor-pointer"
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Xác nhận hoàn thành</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
