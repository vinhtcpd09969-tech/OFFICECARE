import { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Trash2,
  CheckCircle2,
  FileText,
  Zap,
  Sparkles,
  Smile,
  MessageSquare,
  Sliders,
  Flame,
  AlertTriangle,
} from 'lucide-react';
import { TreatmentLogItem } from '../../technician/api/technician.api';

interface TechnicianTreatmentDeskProps {
  patientName: string;
  appointmentDetail?: {
    id?: string;
    khach_hang_id?: string;
    chan_doan?: string;
    chong_chi_dinh?: string;
    ghi_chu?: string;
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
  // Lưu nháp định kỳ — KHÔNG bắt buộc (nếu không truyền thì không tự lưu). Rời trang giữa chừng (qua
  // Hàng đợi, "Bàn làm việc", F5...) mà không có prop này thì dữ liệu đang gõ dở sẽ mất khi quay lại,
  // vì mỗi lần mở lại bàn là 1 lần mount mới — chỉ giữ được state khi chuyển tab NGAY TRONG cùng
  // trang (xem ClinicalAssessment/index.tsx).
  onSaveDraft?: (data: {
    vas_truoc: number;
    vas_sau: number;
    ghi_chu: string;
    du_lieu_tri_lieu: { nhat_ky: TreatmentLogItem[] };
  }) => void;
}

// Preset kỹ thuật bổ sung chuẩn PHCN
const PRESET_TECHNIQUES = [
  { name: 'Di động khớp vai / cột sống', icon: '🧘‍♂️' },
  { name: 'Giải phóng điểm đau & cơ sâu (Myofascial)', icon: '💆‍♂️' },
  { name: 'Chườm nóng thảo dược / Nhiệt trị liệu', icon: '♨️' },
  { name: 'Điện xung trị liệu TENS', icon: '⚡' },
  { name: 'Siêu âm điều trị tần số sâu', icon: '🔊' },
  { name: 'Tập vận động thụ động & trợ lực', icon: '🏋️‍♂️' },
  { name: 'Nắn chỉnh mô mềm & xoa bóp trị liệu', icon: '🖐️' },
];

// Wong-Baker Faces mapping
const WONG_BAKER_FACES = [
  { score: 0, face: '😊', label: 'Không đau', desc: 'Hoàn toàn thoải mái' },
  { score: 2, face: '😐', label: 'Đau nhẹ', desc: 'Đau ít, không ảnh hưởng sinh hoạt' },
  { score: 4, face: '🙁', label: 'Đau vừa', desc: 'Đau gây khó chịu nhẹ' },
  { score: 6, face: '😣', label: 'Đau nhiều', desc: 'Ảnh hưởng tập trung / giấc ngủ' },
  { score: 8, face: '😫', label: 'Rất đau', desc: 'Khó vận động, đau nhói' },
  { score: 10, face: '😭', label: 'Đau dữ dội', desc: 'Không thể chịu đựng' },
];

// Bộ phân tách Quy trình gói dịch vụ thành các bước kỹ thuật động chuẩn
function parsePackageProtocol(quyTrinhStr?: string | null) {
  if (!quyTrinhStr || !quyTrinhStr.trim()) {
    return [
      { name: 'Nhiệt trị liệu / Chườm nóng thảo dược', icon: '♨️' },
      { name: 'Điện xung trị liệu TENS giảm đau', icon: '⚡' },
      { name: 'Giải phóng điểm đau & Mô mềm sâu (Myofascial)', icon: '💆‍♂️' },
      { name: 'Tập vận động kéo giãn trợ lực', icon: '🏋️‍♂️' },
    ];
  }

  let rawSteps: string[] = [];
  if (quyTrinhStr.includes('\n')) {
    rawSteps = quyTrinhStr.split(/\r?\n/);
  } else if (/[|;]/.test(quyTrinhStr)) {
    rawSteps = quyTrinhStr.split(/[|;]/);
  } else if (/\d+[\.\)]\s*/.test(quyTrinhStr)) {
    rawSteps = quyTrinhStr.split(/(?=\b\d+[\.\)]\s*)/);
  } else {
    rawSteps = [quyTrinhStr];
  }

  rawSteps = rawSteps.map(s => s.trim()).filter(Boolean);

  if (rawSteps.length === 0) {
    return [{ name: quyTrinhStr.trim(), icon: '⚡' }];
  }

  return rawSteps.map(step => {
    const cleanName = step.replace(/^(\d+[\.\)]\s*|bước\s*\d+:\s*)/i, '').trim();

    let icon = '⚡';
    if (/nhiệt|chườm|nóng/i.test(cleanName)) icon = '♨️';
    else if (/xung|điện|tens/i.test(cleanName)) icon = '⚡';
    else if (/cơ|massage|nắn|bóp/i.test(cleanName)) icon = '💆‍♂️';
    else if (/khớp|nắn chỉnh/i.test(cleanName)) icon = '🧘‍♂️';
    else if (/tập|vận động|kéo/i.test(cleanName)) icon = '🏋️‍♂️';
    else if (/siêu âm/i.test(cleanName)) icon = '🔊';

    return { name: cleanName, icon };
  });
}

export function TechnicianTreatmentDesk({
  patientName,
  appointmentDetail,
  onCompleteTreatment,
  onSaveDraft,
}: TechnicianTreatmentDeskProps) {
  // Thang đo VAS trước & sau
  const [vasMode, setVasMode] = useState<'faces' | 'verbal' | 'numeric'>('faces');
  const [vasTruoc, setVasTruoc] = useState<number>(appointmentDetail?.vas_truoc ?? 6);
  const [vasSau, setVasSau] = useState<number>(appointmentDetail?.vas_sau ?? 3);

  // Parse các bước kỹ thuật từ gói dịch vụ
  const packageSteps = parsePackageProtocol(appointmentDetail?.quy_trinh);

  // Nhật ký thao tác kỹ thuật thực tế
  const [logs, setLogs] = useState<TreatmentLogItem[]>(() => {
    if (appointmentDetail?.du_lieu_tri_lieu?.nhat_ky?.length) {
      return appointmentDetail.du_lieu_tri_lieu.nhat_ky;
    }
    const nowStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return [
      { luc: nowStr, noi_dung: packageSteps[0]?.name || 'Chườm nóng & Nhiệt trị liệu' }
    ];
  });

  // Dynamic input state cho kỹ thuật mới
  const [newTechniqueName, setNewTechniqueName] = useState('');

  // Ghi chú KTV
  const [notes, setNotes] = useState(appointmentDetail?.ghi_chu || '');

  // Loading & Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const draftKey = appointmentDetail?.id ? `draft_treat_${appointmentDetail.id}` : `draft_treat_${patientName.trim().replace(/\s+/g, '_')}`;

  // Khôi phục nháp từ sessionStorage nếu vừa chuyển tab hoặc rời trang quay lại
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.vasTruoc != null) setVasTruoc(parsed.vasTruoc);
        if (parsed.vasSau != null) setVasSau(parsed.vasSau);
        if (parsed.notes != null) setNotes(parsed.notes);
        if (Array.isArray(parsed.logs) && parsed.logs.length > 0) setLogs(parsed.logs);
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
    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const newItems: TreatmentLogItem[] = packageSteps.map(step => ({
      luc: timeStr,
      noi_dung: step.name
    }));
    setLogs(prev => {
      const existingNames = new Set(prev.map(p => p.noi_dung));
      const filteredNew = newItems.filter(i => !existingNames.has(i.noi_dung));
      return [...prev, ...filteredNew];
    });
  };

  // Tick / Untick 1 bước trong gói
  const togglePackageStep = (name: string) => {
    const exists = logs.some(l => l.noi_dung === name);
    if (exists) {
      setLogs(prev => prev.filter(l => l.noi_dung !== name));
    } else {
      const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      setLogs(prev => [...prev, { luc: timeStr, noi_dung: name }]);
    }
  };

  // Thêm nhanh kỹ thuật từ preset bổ sung
  const handleAddPreset = (name: string) => {
    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    setLogs(prev => [...prev, { luc: timeStr, noi_dung: name }]);
  };

  // Thêm kỹ thuật tùy chỉnh
  const handleAddCustomTechnique = () => {
    if (!newTechniqueName.trim()) return;
    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    setLogs(prev => [...prev, { luc: timeStr, noi_dung: newTechniqueName.trim() }]);
    setNewTechniqueName('');
  };

  // Xóa kỹ thuật
  const handleRemoveLog = (index: number) => {
    setLogs(prev => prev.filter((_, i) => i !== index));
  };

  // Nộp ca trị liệu
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onCompleteTreatment({
        vas_truoc: vasTruoc,
        vas_sau: vasSau,
        ghi_chu: notes,
        du_lieu_tri_lieu: { nhat_ky: logs },
      });
    } finally {
      setSubmitting(false);
      setShowConfirmModal(false);
    }
  };

  const deltaVas = vasTruoc - vasSau;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-jakarta">
      


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
              onClick={() => setVasMode('numeric')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                vasMode === 'numeric'
                  ? 'bg-white dark:bg-zinc-900 text-teal-600 dark:text-teal-400 shadow-sm'
                  : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800'
              }`}
            >
              <Sliders size={14} />
              <span>Thang Số</span>
            </button>
          </div>
        </div>

        {/* 2 KHỐI VAS TRƯỚC VÀ SAU */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* VAS TRƯỚC */}
          <div className="bg-rose-50/40 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-rose-700 dark:text-rose-300">
                🔴 VAS Trước Khi Trị Liệu
              </span>
              <span className="text-lg font-black text-rose-600 dark:text-rose-400">
                {vasTruoc} / 10
              </span>
            </div>

            {vasMode === 'faces' && (
              <div className="grid grid-cols-6 gap-1.5 pt-1">
                {WONG_BAKER_FACES.map(f => (
                  <button
                    key={`truoc-${f.score}`}
                    type="button"
                    onClick={() => setVasTruoc(f.score)}
                    className={`flex flex-col items-center p-2 rounded-xl border text-center transition-all ${
                      vasTruoc === f.score
                        ? 'bg-rose-500 text-white border-rose-600 scale-105 shadow-md shadow-rose-500/20'
                        : 'bg-white dark:bg-zinc-900 border-rose-100 dark:border-rose-900/40 text-slate-700 dark:text-zinc-300 hover:border-rose-300'
                    }`}
                  >
                    <span className="text-xl">{f.face}</span>
                    <span className="text-[10px] font-black mt-1">{f.score}</span>
                  </button>
                ))}
              </div>
            )}

            {vasMode === 'verbal' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                {WONG_BAKER_FACES.map(f => (
                  <button
                    key={`truoc-verb-${f.score}`}
                    type="button"
                    onClick={() => setVasTruoc(f.score)}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                      vasTruoc === f.score
                        ? 'bg-rose-500 text-white border-rose-600 font-bold'
                        : 'bg-white dark:bg-zinc-900 border-rose-100 dark:border-rose-900/40 text-slate-700 dark:text-zinc-300'
                    }`}
                  >
                    <div className="font-black">{f.score} - {f.label}</div>
                    <div className="text-[10px] opacity-80 line-clamp-1">{f.desc}</div>
                  </button>
                ))}
              </div>
            )}

            {vasMode === 'numeric' && (
              <div className="space-y-2 pt-2">
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={1}
                  value={vasTruoc}
                  onChange={e => setVasTruoc(Number(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                  <span>0 (Không đau)</span>
                  <span>5 (Vừa)</span>
                  <span>10 (Dữ dội)</span>
                </div>
              </div>
            )}
          </div>

          {/* VAS SAU */}
          <div className="bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                🟢 VAS Sau Khi Trị Liệu
              </span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                {vasSau} / 10
              </span>
            </div>

            {vasMode === 'faces' && (
              <div className="grid grid-cols-6 gap-1.5 pt-1">
                {WONG_BAKER_FACES.map(f => (
                  <button
                    key={`sau-${f.score}`}
                    type="button"
                    onClick={() => setVasSau(f.score)}
                    className={`flex flex-col items-center p-2 rounded-xl border text-center transition-all ${
                      vasSau === f.score
                        ? 'bg-emerald-600 text-white border-emerald-700 scale-105 shadow-md shadow-emerald-600/20'
                        : 'bg-white dark:bg-zinc-900 border-emerald-100 dark:border-emerald-900/40 text-slate-700 dark:text-zinc-300 hover:border-emerald-300'
                    }`}
                  >
                    <span className="text-xl">{f.face}</span>
                    <span className="text-[10px] font-black mt-1">{f.score}</span>
                  </button>
                ))}
              </div>
            )}

            {vasMode === 'verbal' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                {WONG_BAKER_FACES.map(f => (
                  <button
                    key={`sau-verb-${f.score}`}
                    type="button"
                    onClick={() => setVasSau(f.score)}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                      vasSau === f.score
                        ? 'bg-emerald-600 text-white border-emerald-700 font-bold'
                        : 'bg-white dark:bg-zinc-900 border-emerald-100 dark:border-emerald-900/40 text-slate-700 dark:text-zinc-300'
                    }`}
                  >
                    <div className="font-black">{f.score} - {f.label}</div>
                    <div className="text-[10px] opacity-80 line-clamp-1">{f.desc}</div>
                  </button>
                ))}
              </div>
            )}

            {vasMode === 'numeric' && (
              <div className="space-y-2 pt-2">
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={1}
                  value={vasSau}
                  onChange={e => setVasSau(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                  <span>0 (Không đau)</span>
                  <span>5 (Vừa)</span>
                  <span>10 (Dữ dội)</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MỨC CẢI THIỆN ĐAU SPARKLINE BANNER */}
        <div className="bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-emerald-500/10 border border-teal-500/20 rounded-2xl p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles className="text-teal-600 dark:text-teal-400" size={20} />
            <div className="text-xs">
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
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2 text-slate-800 dark:text-zinc-100 font-black text-sm uppercase tracking-wider font-jakarta">
            <Zap className="text-cyan-600 dark:text-cyan-400" size={18} />
            <span>Nhật Ký Thao Tác Kỹ Thuật Trị Liệu</span>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {logs.length} kỹ thuật đã thực hiện
          </span>
        </div>

        {/* QUY TRÌNH KỸ THUẬT THEO GÓI DỊCH VỤ (KẾT NỐI ĐỘNG TỪ DB) */}
        <div className="bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/70 dark:border-zinc-700/60 rounded-2xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-zinc-700/60 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200">
                📋 Quy trình kỹ thuật chuẩn của gói: <span className="text-teal-600 dark:text-teal-400">{appointmentDetail?.ten_dich_vu || 'Vật lý trị liệu'}</span>
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
                      ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-300 dark:border-teal-700 text-teal-900 dark:text-teal-200 font-bold shadow-xs'
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

        {/* THÊM NHANH TỪ PRESET KỸ THUẬT BỔ SUNG */}
        <div className="space-y-2 pt-1">
          <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
            Thêm kỹ thuật bổ sung / phát sinh ngoài gói:
          </span>
          <div className="flex flex-wrap gap-2">
            {PRESET_TECHNIQUES.map(pt => (
              <button
                key={pt.name}
                type="button"
                onClick={() => handleAddPreset(pt.name)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-teal-50 hover:text-teal-700 dark:bg-zinc-800 dark:hover:bg-teal-950/40 dark:hover:text-teal-300 text-slate-700 dark:text-zinc-300 text-xs font-bold transition-all border border-transparent hover:border-teal-200 cursor-pointer"
              >
                <span>{pt.icon}</span>
                <span>{pt.name}</span>
                <Plus size={12} className="ml-0.5 text-teal-600" />
              </button>
            ))}
          </div>
        </div>

        {/* FORM NHẬP KỸ THUẬT TÙY CHỈNH */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <input
            type="text"
            placeholder="Nhập tên kỹ thuật thủ công khác (ví dụ: Tập di động khớp vai)..."
            value={newTechniqueName}
            onChange={e => setNewTechniqueName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCustomTechnique())}
            className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-xs font-medium text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
          />
          <button
            type="button"
            onClick={handleAddCustomTechnique}
            className="px-5 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap"
          >
            <Plus size={14} />
            <span>Thêm mục</span>
          </button>
        </div>

        {/* DANH SÁCH NHẬT KÝ KỸ THUẬT ĐÃ THỰC HIỆN */}
        <div className="border border-slate-100 dark:border-zinc-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-zinc-800">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs font-medium">
              Chưa ghi nhận kỹ thuật nào. Bấm nút [ ⚡ Tích Chọn Tất Cả Theo Quy Trình Gói ] ở trên hoặc chọn các mục từ danh sách.
            </div>
          ) : (
            logs.map((item, idx) => (
              <div key={idx} className="p-3.5 bg-white dark:bg-zinc-900 flex items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-all">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate">
                    {item.noi_dung}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveLog(idx)}
                  className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all shrink-0"
                  title="Xóa kỹ thuật"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
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
          onClick={() => setShowConfirmModal(true)}
          className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-teal-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
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
