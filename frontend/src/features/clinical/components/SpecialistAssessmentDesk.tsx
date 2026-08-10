import { useState, useEffect, useMemo, useRef } from 'react';
import { format } from 'date-fns';
import {
  Activity,
  Plus,
  Trash2,
  CheckCircle2,
  RotateCcw,
  Layers,
  Check,
  Clock,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { PackageItem } from '../../../features/doctor/api/doctor.api';

interface RomItem {
  joint: string;
  movement: string;
  degrees: string;
}

interface MmtItem {
  muscleGroup: string;
  grade: string; // 0-5
}

interface AssessmentExtraData {
  vasScore?: number;
  romData?: RomItem[];
  mmtData?: MmtItem[];
  clinicalConclusion?: string;
  contraindications?: string;
}

interface SpecialistAssessmentDeskProps {
  patientName: string;
  packages: PackageItem[];
  appointmentDetail?: any;
  onCompleteAssessment: (data: {
    vasScore: number;
    romData: RomItem[];
    mmtData: MmtItem[];
    clinicalConclusion: string;
    contraindications: string;
    selectedPackageId?: string;
    notes?: string;
  }) => Promise<void>;
  onScheduleReassessment: (limitDate: string, notes?: string, assessmentData?: AssessmentExtraData) => Promise<void>;
  onSaveDraft?: (data: {
    vasScore: number;
    romData: RomItem[];
    mmtData: MmtItem[];
    clinicalConclusion: string;
    contraindications: string;
    selectedPackageId?: string;
  }) => void;
}

export function SpecialistAssessmentDesk({
  patientName,
  packages,
  appointmentDetail,
  onCompleteAssessment,
  onScheduleReassessment,
  onSaveDraft,
}: SpecialistAssessmentDeskProps) {
  // Mode chọn VAS (1: Wong-Baker Mặt Cười, 2: Mô Tả Bằng Lời, 3: Thang Số Slider)
  const [vasMode, setVasMode] = useState<'faces' | 'verbal' | 'numeric'>('faces');
  const [vasScore, setVasScore] = useState<number>(6);

  // Bảng ROM (Tầm vận động) & MMT (Cơ lực)
  const [romList, setRomList] = useState<RomItem[]>([]);
  const [mmtList, setMmtList] = useState<MmtItem[]>([]);

  // Text fields
  const [clinicalConclusion, setClinicalConclusion] = useState('');
  const [contraindications, setContraindications] = useState('');
  const [notes] = useState('');

  // Chỉ định gói
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');

  // Modal Hẹn tái khám State
  const [showReassessModal, setShowReassessModal] = useState(false);
  const [reassessDays, setReassessDays] = useState<number>(3);
  const [reassessNotes, setReassessNotes] = useState('');

  // Tính toán thời điểm hết hạn live từ thời điểm hiện tại
  const calculatedDeadline = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + Math.max(1, Number(reassessDays) || 1));
    return d;
  }, [reassessDays]);

  const [loadingComplete, setLoadingComplete] = useState(false);
  const [loadingReassess, setLoadingReassess] = useState(false);

  // Modal Xác nhận Hoàn thành State
  const [showConfirmCompleteModal, setShowConfirmCompleteModal] = useState(false);

  // Thêm dòng ROM / MMT
  const handleAddRom = () => {
    setRomList([...romList, { joint: 'Khớp cổ', movement: 'Xoay trái', degrees: '40°' }]);
  };
  const handleRemoveRom = (index: number) => {
    setRomList(romList.filter((_, i) => i !== index));
  };

  const handleAddMmt = () => {
    setMmtList([...mmtList, { muscleGroup: 'Nhóm cơ thang', grade: '3/5' }]);
  };
  const handleRemoveMmt = (index: number) => {
    setMmtList(mmtList.filter((_, i) => i !== index));
  };

  const isHydratedRef = useRef(false);
  const hydratedAptIdRef = useRef<string | null>(null);

  const draftKey = useMemo(() => {
    return appointmentDetail?.id 
      ? `draft_assess_${appointmentDetail.id}` 
      : `draft_assess_${patientName.trim().replace(/\s+/g, '_')}`;
  }, [appointmentDetail?.id, patientName]);

  // Tự động khôi phục bản nháp từ sessionStorage (ƯU TIÊN HÀNG ĐẦU) hoặc pre-fill từ DB (chỉ chạy 1 LẦN duy nhất khi đổi ca)
  useEffect(() => {
    if (!appointmentDetail?.id) return;
    if (hydratedAptIdRef.current === appointmentDetail.id) return;
    hydratedAptIdRef.current = appointmentDetail.id;

    try {
      const savedDraft = sessionStorage.getItem(draftKey);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.vasMode) setVasMode(parsed.vasMode);
        if (parsed.vasScore != null) setVasScore(parsed.vasScore);
        if (parsed.romList) setRomList(parsed.romList);
        if (parsed.mmtList) setMmtList(parsed.mmtList);
        if (parsed.clinicalConclusion != null) setClinicalConclusion(parsed.clinicalConclusion);
        if (parsed.contraindications != null) setContraindications(parsed.contraindications);
        if (parsed.selectedPackageId != null) setSelectedPackageId(parsed.selectedPackageId);
        isHydratedRef.current = true;
        return;
      }
    } catch (err) {
      console.error('Lỗi khôi phục bản nháp lượng giá:', err);
    }

    // Nếu CHƯA CÓ bản nháp trong sessionStorage -> Pre-fill từ DB (ca tái lượng giá / ca cũ)
    if (appointmentDetail.vas_truoc != null && appointmentDetail.vas_truoc !== undefined) {
      setVasScore(Number(appointmentDetail.vas_truoc));
    }
    if (appointmentDetail.chan_doan && appointmentDetail.chan_doan !== 'Chưa thể kết luận') {
      setClinicalConclusion(appointmentDetail.chan_doan);
    }
    if (appointmentDetail.chong_chi_dinh && appointmentDetail.chong_chi_dinh !== 'Chưa điền') {
      setContraindications(appointmentDetail.chong_chi_dinh);
    }

    const rawLuongGia = appointmentDetail.du_lieu_luong_gia;
    if (rawLuongGia) {
      let parsed = typeof rawLuongGia === 'string' ? null : rawLuongGia;
      if (typeof rawLuongGia === 'string') {
        try { parsed = JSON.parse(rawLuongGia); } catch (e) {}
      }
      if (parsed) {
        if (Array.isArray(parsed.rom_data) && parsed.rom_data.length > 0) {
          setRomList(parsed.rom_data);
        }
        if (Array.isArray(parsed.mmt_data) && parsed.mmt_data.length > 0) {
          setMmtList(parsed.mmt_data);
        }
      }
    }
    isHydratedRef.current = true;
  }, [appointmentDetail?.id, draftKey]);

  // Tự động lưu nháp: vừa lưu sessionStorage tức thì, vừa debounce ~1.5s gửi về server (giống hệt KTV)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (!isHydratedRef.current) return;
    try {
      sessionStorage.setItem(
        draftKey,
        JSON.stringify({
          vasMode,
          vasScore,
          romList,
          mmtList,
          clinicalConclusion,
          contraindications,
          selectedPackageId,
        })
      );
    } catch (err) {}

    if (!onSaveDraft) return;
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      onSaveDraft({
        vasScore,
        romData: romList,
        mmtData: mmtList,
        clinicalConclusion,
        contraindications,
        selectedPackageId: selectedPackageId || undefined,
      });
    }, 1500);
    return () => clearTimeout(timer);
  }, [draftKey, vasMode, vasScore, romList, mmtList, clinicalConclusion, contraindications, selectedPackageId, onSaveDraft]);

  // Xử lý nút Hoàn thành (Bật Modal xác nhận)
  const handleSubmitComplete = () => {
    if (!clinicalConclusion.trim()) {
      toast.error('Vui lòng nhập Kết luận lượng giá chức năng!');
      return;
    }
    setShowConfirmCompleteModal(true);
  };

  // Thực thi Hoàn thành khi bác sĩ đã bấm xác nhận trên Modal
  const executeCompleteAssessment = async () => {
    setShowConfirmCompleteModal(false);
    setLoadingComplete(true);
    try {
      await onCompleteAssessment({
        vasScore,
        romData: romList,
        mmtData: mmtList,
        clinicalConclusion,
        contraindications,
        selectedPackageId: selectedPackageId || undefined,
        notes,
      });
      sessionStorage.removeItem(draftKey);
      toast.success('Đã hoàn thành lượng giá & gửi chỉ định thành công!');
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi lưu kết quả lượng giá');
    } finally {
      setLoadingComplete(false);
    }
  };

  // Xử lý Hẹn tái khám (Giải phóng chuyên viên ngay)
  const handleSubmitReassess = async () => {
    const days = Math.max(1, Number(reassessDays) || 1);
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + days);

    const limitDateIso = format(deadline, 'yyyy-MM-dd');
    const hh = String(deadline.getHours()).padStart(2, '0');
    const mm = String(deadline.getMinutes()).padStart(2, '0');
    const dateStr = format(deadline, 'dd/MM/yyyy');
    
    const limitNoteText = `[Hạn tái lượng giá: ${hh}:${mm} ngày ${dateStr}] ${reassessNotes}`.trim();

    setLoadingReassess(true);
    try {
      await onScheduleReassessment(limitDateIso, limitNoteText, {
        vasScore,
        romData: romList,
        mmtData: mmtList,
        clinicalConclusion,
        contraindications,
      });
      sessionStorage.removeItem(draftKey);
      setShowReassessModal(false);
      toast.success(`Đã lưu hẹn tái khám (${days} ngày)! Chuyên viên đã được giải phóng để nhận ca mới.`);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi lưu hẹn tái khám');
    } finally {
      setLoadingReassess(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-5 md:p-6 shadow-sm space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-zinc-800">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-cyan-700 bg-cyan-50 border border-cyan-200 px-2.5 py-0.5 rounded-lg">
            BÀN LƯỢNG GIÁ LÂM SÀNG PHCN
          </span>
          <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-zinc-100 mt-1">
            Đánh giá chức năng & Ra chỉ định trị liệu
          </h3>
        </div>

        <span className="text-xs font-semibold text-slate-500">
          Bệnh nhân: <strong className="text-slate-800 dark:text-zinc-200">{patientName}</strong>
        </span>
      </div>

      {/* KHỐI 1: THANG ĐO ĐAU VAS WONG-BAKER 3 CÁCH NHẬP */}
      <div className="p-4 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/80 rounded-2xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-cyan-600" />
            <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider">
              1. Thang đo điểm đau (VAS Pain Scale): <strong className="text-cyan-700 dark:text-cyan-400 text-sm ml-1">{vasScore}/10</strong>
            </h4>
          </div>

          {/* Switch mode nhập VAS */}
          <div className="flex bg-slate-200 dark:bg-zinc-700 p-0.5 rounded-xl text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setVasMode('faces')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                vasMode === 'faces' ? 'bg-white dark:bg-zinc-800 text-cyan-700 dark:text-cyan-300 shadow-xs' : 'text-slate-600 dark:text-zinc-400'
              }`}
            >
              Mặt cười (Wong-Baker)
            </button>
            <button
              type="button"
              onClick={() => setVasMode('verbal')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                vasMode === 'verbal' ? 'bg-white dark:bg-zinc-800 text-cyan-700 dark:text-cyan-300 shadow-xs' : 'text-slate-600 dark:text-zinc-400'
              }`}
            >
              Mô tả lời
            </button>
            <button
              type="button"
              onClick={() => setVasMode('numeric')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                vasMode === 'numeric' ? 'bg-white dark:bg-zinc-800 text-cyan-700 dark:text-cyan-300 shadow-xs' : 'text-slate-600 dark:text-zinc-400'
              }`}
            >
              Thang số
            </button>
          </div>
        </div>

        {/* Render theo mode được chọn */}
        {vasMode === 'faces' && (
          <div className="grid grid-cols-6 gap-2 pt-1">
            {[
              { score: 0, face: '😊', label: 'Không đau' },
              { score: 2, face: '🙂', label: 'Đau nhẹ' },
              { score: 4, face: '😐', label: 'Đau vừa' },
              { score: 6, face: '😟', label: 'Đau nhức' },
              { score: 8, face: '😣', label: 'Đau nặng' },
              { score: 10, face: '😫', label: 'Cực độ' },
            ].map((f) => (
              <button
                key={f.score}
                type="button"
                onClick={() => setVasScore(f.score)}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  vasScore === f.score
                    ? 'bg-cyan-600 text-white border-cyan-600 shadow-md scale-105'
                    : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 hover:border-cyan-400'
                }`}
              >
                <span className="text-2xl">{f.face}</span>
                <span className="text-[11px] font-bold">{f.score} điểm</span>
                <span className="text-[9.5px] opacity-80">{f.label}</span>
              </button>
            ))}
          </div>
        )}

        {vasMode === 'verbal' && (
          <div className="flex flex-wrap gap-2 pt-1">
            {[
              { score: 0, text: 'Không đau (0)' },
              { score: 2, text: 'Ê ẩm nhẹ (2)' },
              { score: 4, text: 'Đau tức vừa (4)' },
              { score: 6, text: 'Đau nhức cản trở (6)' },
              { score: 8, text: 'Đau buốt dữ dội (8)' },
              { score: 10, text: 'Không thể chịu nổi (10)' },
            ].map((v) => (
              <button
                key={v.score}
                type="button"
                onClick={() => setVasScore(v.score)}
                className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  vasScore === v.score
                    ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                    : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 hover:border-cyan-400'
                }`}
              >
                {v.text}
              </button>
            ))}
          </div>
        )}

        {vasMode === 'numeric' && (
          <div className="space-y-2 pt-1">
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={vasScore}
              onChange={(e) => setVasScore(Number(e.target.value))}
              className="w-full accent-cyan-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-bold text-slate-400">
              <span>0 · Không đau</span>
              <span>5 · Đau trung bình</span>
              <span>10 · Đau cực độ</span>
            </div>
          </div>
        )}
      </div>

      {/* KHỐI 2: BẢNG CHỈ SỐ ROM & MMT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ROM */}
        <div className="p-4 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/80 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider">
              2. Tầm vận động khớp (ROM):
            </h4>
            <button
              type="button"
              onClick={handleAddRom}
              className="px-2.5 py-1 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 font-bold text-[11px] flex items-center gap-1 border border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100 cursor-pointer"
            >
              <Plus size={12} /> Thêm khớp
            </button>
          </div>

          <div className="space-y-2 max-h-44 overflow-y-auto pr-1 hide-scrollbar">
            {romList.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-white dark:bg-zinc-800 p-2 rounded-xl border border-slate-200/80 dark:border-zinc-700">
                <input
                  type="text"
                  placeholder="Vị trí khớp (Khớp cổ...)"
                  value={item.joint}
                  onChange={(e) => {
                    const next = [...romList];
                    next[idx].joint = e.target.value;
                    setRomList(next);
                  }}
                  className="w-1/3 px-2 py-1 text-xs bg-transparent border-b border-slate-200 focus:border-cyan-500 focus:outline-none text-slate-800 dark:text-zinc-200 font-medium"
                />
                <input
                  type="text"
                  placeholder="Cử động (Xoay/Gập...)"
                  value={item.movement}
                  onChange={(e) => {
                    const next = [...romList];
                    next[idx].movement = e.target.value;
                    setRomList(next);
                  }}
                  className="w-1/3 px-2 py-1 text-xs bg-transparent border-b border-slate-200 focus:border-cyan-500 focus:outline-none text-slate-800 dark:text-zinc-200 font-medium"
                />
                <input
                  type="text"
                  placeholder="Góc đo (°)"
                  value={item.degrees}
                  onChange={(e) => {
                    const next = [...romList];
                    next[idx].degrees = e.target.value;
                    setRomList(next);
                  }}
                  className="w-1/3 px-2 py-1 text-xs bg-transparent border-b border-slate-200 focus:border-cyan-500 focus:outline-none text-slate-800 dark:text-zinc-200 font-medium"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveRom(idx)}
                  className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* MMT */}
        <div className="p-4 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/80 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider">
              3. Đánh giá cơ lực (MMT 0-5):
            </h4>
            <button
              type="button"
              onClick={handleAddMmt}
              className="px-2.5 py-1 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 font-bold text-[11px] flex items-center gap-1 border border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100 cursor-pointer"
            >
              <Plus size={12} /> Thêm nhóm cơ
            </button>
          </div>

          <div className="space-y-2 max-h-44 overflow-y-auto pr-1 hide-scrollbar">
            {mmtList.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-white dark:bg-zinc-800 p-2 rounded-xl border border-slate-200/80 dark:border-zinc-700">
                <input
                  type="text"
                  placeholder="Tên nhóm cơ..."
                  value={item.muscleGroup}
                  onChange={(e) => {
                    const next = [...mmtList];
                    next[idx].muscleGroup = e.target.value;
                    setMmtList(next);
                  }}
                  className="flex-1 px-2 py-1 text-xs bg-transparent border-b border-slate-200 focus:border-cyan-500 focus:outline-none text-slate-800 dark:text-zinc-200 font-medium"
                />
                <select
                  value={item.grade}
                  onChange={(e) => {
                    const next = [...mmtList];
                    next[idx].grade = e.target.value;
                    setMmtList(next);
                  }}
                  className="w-28 px-2 py-1 text-xs font-bold bg-slate-100 dark:bg-zinc-700 rounded-lg text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-600 focus:outline-none cursor-pointer"
                >
                  <option value="0/5">0/5 (Tê liệt)</option>
                  <option value="1/5">1/5 (Co cơ)</option>
                  <option value="2/5">2/5 (Yếu nặng)</option>
                  <option value="3/5">3/5 (Trung bình)</option>
                  <option value="4/5">4/5 (Khá tốt)</option>
                  <option value="5/5">5/5 (Bình thường)</option>
                </select>
                <button
                  type="button"
                  onClick={() => handleRemoveMmt(idx)}
                  className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KHỐI 3: KẾT LUẬN LƯỢNG GIÁ & CHỐNG CHỈ ĐỊNH */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider block mb-1.5">
            4. Kết luận lượng giá chức năng (`chan_doan`): *
          </label>
          <textarea
            rows={3}
            value={clinicalConclusion}
            onChange={(e) => setClinicalConclusion(e.target.value)}
            placeholder="Mô tả chức năng hạn chế, không gõ chẩn đoán bệnh lý y khoa..."
            className="w-full p-3 text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-slate-800 dark:text-zinc-200 font-medium"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider block mb-1.5">
            5. Chống chỉ định vận động / trị liệu (`chong_chi_dinh`):
          </label>
          <textarea
            rows={3}
            value={contraindications}
            onChange={(e) => setContraindications(e.target.value)}
            placeholder="Các lưu ý chống chỉ định nắn chỉnh, siêu âm hay kéo giãn..."
            className="w-full p-3 text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-slate-800 dark:text-zinc-200 font-medium"
          />
        </div>
      </div>

      {/* KHỐI 4: THẺ CHỌN CHỈ ĐỊNH GÓI LIỆU TRÌNH SANG TRỌNG */}
      <div className="p-4 bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-200/80 dark:border-cyan-800/60 rounded-3xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-xl bg-cyan-600 text-white flex items-center justify-center font-bold">
              <Layers size={15} />
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider">
              6. Chỉ định Gói điều trị / Liệu trình đề xuất:
            </h4>
          </div>
          <span className="text-[11px] font-semibold text-slate-500">
            {selectedPackageId ? 'Đã chọn 1 gói chỉ định' : 'Chưa chọn gói (Dịch vụ lẻ)'}
          </span>
        </div>

        {/* DANH SÁCH THẺ GÓI LIỆU TRÌNH SANG TRỌNG */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {/* Card Option 1: Không chỉ định gói */}
          <div
            onClick={() => setSelectedPackageId('')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 relative ${
              selectedPackageId === ''
                ? 'bg-white dark:bg-zinc-800 border-2 border-slate-800 dark:border-zinc-300 shadow-sm'
                : 'bg-white/80 dark:bg-zinc-900/60 border-slate-200 dark:border-zinc-800 hover:border-slate-400'
            }`}
          >
            <div className={`size-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
              selectedPackageId === '' ? 'border-slate-800 dark:border-zinc-200 bg-slate-800 text-white' : 'border-slate-300 dark:border-zinc-600'
            }`}>
              {selectedPackageId === '' && <Check size={11} />}
            </div>
            <div>
              <h5 className="font-heading text-xs font-bold text-slate-900 dark:text-zinc-100">
                Không chỉ định gói
              </h5>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">
                Chỉ thực hiện dịch vụ lẻ hoặc theo dõi thêm.
              </p>
            </div>
          </div>

          {/* Cards các gói điều trị */}
          {packages.map((pkg) => {
            const isSelected = selectedPackageId === pkg.id;
            return (
              <div
                key={pkg.id}
                onClick={() => setSelectedPackageId(pkg.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 relative ${
                  isSelected
                    ? 'bg-cyan-500/10 dark:bg-cyan-950/40 border-2 border-cyan-600 dark:border-cyan-500 shadow-sm'
                    : 'bg-white dark:bg-zinc-800/80 border-slate-200 dark:border-zinc-700 hover:border-cyan-300'
                }`}
              >
                <div className={`size-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                  isSelected ? 'border-cyan-600 bg-cyan-600 text-white' : 'border-slate-300 dark:border-zinc-600'
                }`}>
                  {isSelected && <Check size={11} />}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-1">
                    <h5 className="font-heading text-xs font-bold text-slate-900 dark:text-zinc-100 line-clamp-1">
                      {pkg.ten_goi}
                    </h5>
                    <span className="px-2 py-0.5 rounded-md text-[9.5px] font-black bg-cyan-100 dark:bg-cyan-900/60 text-cyan-800 dark:text-cyan-300 shrink-0">
                      {pkg.tong_so_buoi || 10} buổi
                    </span>
                  </div>
                  <p className="text-xs font-bold text-cyan-700 dark:text-cyan-400">
                    {Number(pkg.gia_goi).toLocaleString('vi-VN')} đ
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FOOTER: ĐÚNG 2 NÚT KẾT THÚC (HOÀN THÀNH & HẸN TÁI KHÁM) */}
      <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex flex-wrap items-center justify-end gap-3">
        {/* Nút 2: Hẹn tái khám (Tái lượng giá) */}
        <button
          type="button"
          onClick={() => setShowReassessModal(true)}
          className="px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2"
        >
          <RotateCcw size={15} />
          <span>🔄 HẸN TÁI KHÁM</span>
        </button>

        {/* Nút 1: Hoàn thành lượng giá */}
        <button
          type="button"
          disabled={loadingComplete}
          onClick={handleSubmitComplete}
          className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-600/20 active:scale-98 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
        >
          <CheckCircle2 size={16} />
          <span>🟢 HOÀN THÀNH LƯỢNG GIÁ</span>
        </button>
      </div>

      {/* MODAL HẸN TÁI KHÁM (CHUYỂN SANG CHỜ TÁI LƯỢNG GIÁ & GIẢI PHÓNG SLOT) */}
      {showReassessModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-2xl bg-purple-500/15 text-purple-600 flex items-center justify-center font-bold shrink-0">
                <RotateCcw size={22} />
              </div>
              <div>
                <h3 className="font-heading text-base font-bold text-slate-900 dark:text-zinc-100">
                  Xác Nhận Hẹn Tái Khám
                </h3>
              </div>
            </div>

            <div className="space-y-4 pt-1 font-jakarta">
              {/* 1. Nhập số ngày thời hạn tái khám */}
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-zinc-200 block mb-1.5">
                  1. Thời hạn tái khám (số ngày): *
                </label>
                <div className="flex items-center gap-2.5">
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={reassessDays}
                    onChange={(e) => setReassessDays(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-24 p-3 text-sm font-extrabold text-center bg-purple-50 dark:bg-zinc-800 border-2 border-purple-300 dark:border-purple-700 rounded-2xl text-purple-900 dark:text-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                    ngày (tính từ thời điểm hiện tại)
                  </span>
                </div>

                {/* Live preview thời điểm hết hạn */}
                <div className="mt-3 p-3 rounded-2xl bg-purple-500/10 border border-purple-300/60 dark:border-purple-800/60 text-purple-900 dark:text-purple-200 text-xs font-semibold flex items-center gap-2">
                  <Clock size={16} className="text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>
                    Thời hạn hết vào: <strong className="font-extrabold text-purple-700 dark:text-purple-300">{format(calculatedDeadline, 'HH:mm')} ngày {format(calculatedDeadline, 'dd/MM/yyyy')}</strong>
                  </span>
                </div>
              </div>

              {/* 2. Dặn dò khi mang phim/kết quả quay lại */}
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-zinc-200 block mb-1.5">
                  2. Dặn dò khi mang phim/kết quả quay lại:
                </label>
                <textarea
                  rows={3}
                  value={reassessNotes}
                  onChange={(e) => setReassessNotes(e.target.value)}
                  placeholder="Khách mang phim X-quang/MRI ngoài đến để xem kết quả..."
                  className="w-full p-3 text-xs font-medium bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-2xl text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setShowReassessModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 font-bold text-xs hover:bg-slate-200 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={loadingReassess}
                onClick={handleSubmitReassess}
                className="px-6 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs disabled:opacity-50 transition-all shadow-md cursor-pointer"
              >
                {loadingReassess ? 'Đang lưu...' : 'Xác Nhận Hẹn Tái Khám'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN HOÀN THÀNH LƯỢNG GIÁ & CHỈ ĐỊNH */}
      {showConfirmCompleteModal && (() => {
        const selectedPkg = packages.find((p) => String(p.id) === selectedPackageId);
        return (
          <div className="fixed inset-0 z-50 bg-slate-955/65 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
                  <CheckCircle2 size={26} />
                </div>
                <div>
                  <h3 className="font-heading text-base font-black uppercase text-slate-900 dark:text-zinc-100 tracking-wide">
                    Xác Nhận Hoàn Tất Lượng Giá & Chỉ Định?
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold">
                    Bệnh nhân: <span className="font-black text-slate-800 dark:text-zinc-200">{patientName}</span>
                  </p>
                </div>
              </div>

              {/* Tóm tắt thông tin kết quả */}
              <div className="bg-slate-50 dark:bg-zinc-800/60 rounded-2xl p-4 space-y-2.5 text-xs border border-slate-200/60 dark:border-zinc-700/60">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/60 dark:border-zinc-700/50">
                  <span className="font-bold text-slate-500 dark:text-zinc-400">Thang đau VAS:</span>
                  <span className="font-black text-amber-600 dark:text-amber-400">{vasScore}/10</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500 dark:text-zinc-400 block mb-0.5">Kết luận lượng giá:</span>
                  <p className="font-bold text-slate-800 dark:text-zinc-200 line-clamp-2 leading-relaxed">
                    {clinicalConclusion}
                  </p>
                </div>
                {contraindications && (
                  <div>
                    <span className="font-bold text-slate-500 dark:text-zinc-400 block mb-0.5">Chống chỉ định:</span>
                    <p className="font-bold text-rose-600 dark:text-rose-400 line-clamp-1">
                      {contraindications}
                    </p>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200/60 dark:border-zinc-700/50 flex justify-between items-center">
                  <span className="font-bold text-slate-500 dark:text-zinc-400">Chỉ định phác đồ / gói:</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">
                    {selectedPkg ? selectedPkg.ten_goi : 'Chưa chọn gói (Khám lẻ)'}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-amber-700 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-955/30 p-3 rounded-xl border border-amber-200/80 dark:border-amber-900/50">
                ⚠️ Kết quả lượng giá sẽ được lưu vĩnh viễn vào Hồ sơ điều trị của khách hàng và chuyên viên được giải phóng để nhận ca mới.
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmCompleteModal(false)}
                  className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-bold text-xs transition-all cursor-pointer"
                >
                  ↩️ Kiểm tra lại
                </button>
                <button
                  type="button"
                  disabled={loadingComplete}
                  onClick={executeCompleteAssessment}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-emerald-600/20 active:scale-98 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {loadingComplete ? 'Đang hoàn tất...' : '✅ Xác nhận — Hoàn tất ngay'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
