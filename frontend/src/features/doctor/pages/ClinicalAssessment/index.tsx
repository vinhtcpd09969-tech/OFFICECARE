import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  Phone, 
  Calendar as CalendarIcon, 
  FileText, 
  Activity, 
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  FileSpreadsheet,
  TrendingUp,
  User,
  HeartPulse,
  History,
  ClipboardList,
  ShieldAlert,
  FlameKindling
} from 'lucide-react';
import { useAuthStore } from '../../../../stores/authStore';
import { 
  getAppointmentDetail, 
  getPatientProfile, 
  getServices, 
  getPackages, 
  saveAssessment,
  PatientProfile,
  ServiceItem,
  PackageItem
} from '../../api/doctor.api';
import {
  getAppointmentDetail as getAppointmentDetailKtv,
  saveTreatmentRecord as saveTreatmentRecordKtv,
  getPatientProfile as getPatientProfileKtv
} from '../../../technician/api/technician.api';

const getVasDescription = (score: number | null) => {
  if (score === null || score === undefined) return 'Vui lòng chọn mức độ đau';
  if (score === 0) return '🟢 0 - Không đau: Cơ thể hoàn toàn bình thường, thoải mái.';
  if (score <= 3) return `🟢 ${score} - Đau nhẹ: Ê ẩm, mỏi nhẹ (Vẫn làm việc, sinh hoạt bình thường).`;
  if (score <= 6) return `🟡 ${score} - Đau vừa: Nhức rõ rệt, cản trở nhẹ khớp (Gây bất tiện khi cử động).`;
  if (score <= 9) return `🔴 ${score} - Đau nặng: Đau buốt dữ dội (Hạn chế vận động, ảnh hưởng sinh hoạt).`;
  return '🔴 10 - Đau cực độ: Đau kinh khủng không thể chịu đựng nổi, cần can thiệp y tế khẩn cấp.';
};

const getVasColorClass = (score: number, isSelected: boolean) => {
  if (!isSelected) {
    return 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-105 dark:hover:bg-zinc-750';
  }
  if (score === 0) return 'bg-emerald-500 border-emerald-600 text-white font-black shadow-lg shadow-emerald-500/30 ring-4 ring-emerald-500/20 scale-110';
  if (score <= 3) return 'bg-teal-500 border-teal-600 text-white font-black shadow-lg shadow-teal-500/30 ring-4 ring-teal-500/20 scale-110';
  if (score <= 6) return 'bg-amber-500 border-amber-600 text-white font-black shadow-lg shadow-amber-500/30 ring-4 ring-amber-500/20 scale-110';
  if (score <= 9) return 'bg-rose-500 border-rose-600 text-white font-black shadow-lg shadow-rose-500/30 ring-4 ring-rose-500/20 scale-110';
  return 'bg-red-600 border-red-700 text-white font-black shadow-lg shadow-red-600/30 ring-4 ring-red-650/20 scale-110';
};

export default function ClinicalAssessment() {
  const { id: appointmentId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { user } = useAuthStore();
  const isKtv = Number(user?.vai_tro_id) === 3;

  // Ca khám hiện tại
  const [appointment, setAppointment] = useState<any>(null);
  // Hồ sơ bệnh lịch sử
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  
  // Danh mục đề xuất
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [packages, setPackages] = useState<PackageItem[]>([]);

  // Form State
  const [chanDoan, setChanDoan] = useState('');
  const [chongChiDinh, setChongChiDinh] = useState('');
  const [goiDichVuId, setGoiDichVuId] = useState<string>('');
  const [dichVuId, setDichVuId] = useState<string>('');
  const [ghiChu, setGhiChu] = useState('');

  // VAS states for KTV
  const [vasTruoc, setVasTruoc] = useState<number>(5);
  const [vasSau, setVasSau] = useState<number>(0);

  // UI States
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'history' | 'treatments'>('history');
  const [errorMsg, setErrorMsg] = useState('');

  // Tải dữ liệu ban đầu
  const loadInitialData = useCallback(async () => {
    if (!appointmentId) return;
    setLoading(true);
    setErrorMsg('');
    try {
      // 1. Tải chi tiết ca khám
      const apptRes = isKtv
        ? await getAppointmentDetailKtv(appointmentId)
        : await getAppointmentDetail(appointmentId);
      const apptData = apptRes.data;
      setAppointment(apptData);

      // Điền sẵn chẩn đoán nếu đã có lưu nháp trước đó
      if (apptData.chan_doan) setChanDoan(apptData.chan_doan);
      if (apptData.chong_chi_dinh) setChongChiDinh(apptData.chong_chi_dinh);
      if (apptData.goi_dich_vu_id) setGoiDichVuId(apptData.goi_dich_vu_id);
      if (apptData.dich_vu_id) setDichVuId(apptData.dich_vu_id);
      if (apptData.ghi_chu) setGhiChu(apptData.ghi_chu);
      if (apptData.vas_truoc !== undefined && apptData.vas_truoc !== null) setVasTruoc(apptData.vas_truoc);
      if (apptData.vas_sau !== undefined && apptData.vas_sau !== null) setVasSau(apptData.vas_sau);

      // 2. Tải danh mục dịch vụ và gói để làm đề xuất (chỉ bác sĩ)
      if (!isKtv) {
        const [servicesRes, packagesRes] = await Promise.all([
          getServices(),
          getPackages()
        ]);
        setServices(servicesRes.data);
        setPackages(packagesRes.data);
      }

      // 3. Tải hồ sơ điều trị cũ của bệnh nhân (nếu đã liên kết khách hàng)
      if (apptData.khach_hang_id) {
        const profileRes = isKtv
          ? await getPatientProfileKtv(apptData.khach_hang_id)
          : await getPatientProfile(apptData.khach_hang_id);
        setProfile(profileRes.data);
      }
    } catch (error: any) {
      console.error('Lỗi khi tải dữ liệu khám bệnh:', error);
      setErrorMsg(error.response?.data?.message || 'Không thể tải dữ liệu ca khám. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [appointmentId, isKtv]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Xử lý gửi kết quả khám
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointmentId) return;

    if (isKtv) {
      if (vasTruoc === undefined || vasSau === undefined) {
        toast.error('Vui lòng điền đầy đủ lượng giá VAS trước và sau buổi.');
        return;
      }
      if (!ghiChu.trim()) {
        toast.error('Vui lòng điền diễn tiến / ghi chú trị liệu.');
        return;
      }
    } else {
      if (!chanDoan.trim()) {
        toast.error('Vui lòng điền chẩn đoán lâm sàng của bệnh nhân.');
        return;
      }
    }

    setSubmitLoading(true);
    try {
      if (isKtv) {
        await saveTreatmentRecordKtv({
          lich_dat_id: appointmentId,
          vas_truoc: vasTruoc,
          vas_sau: vasSau,
          ghi_chu: ghiChu || null
        });
        toast.success('Ghi nhận kết quả buổi trị liệu thành công!');
        navigate('/technician/appointments');
      } else {
        await saveAssessment({
          lich_dat_id: appointmentId,
          chan_doan: chanDoan,
          chong_chi_dinh: chongChiDinh,
          goi_dich_vu_id: goiDichVuId || null,
          dich_vu_id: dichVuId || null,
          ghi_chu: ghiChu || null
        });
        toast.success('Ghi nhận chẩn đoán lâm sàng và hoàn thành ca khám thành công!');
        navigate('/doctor'); // Trở lại danh sách hàng chờ
      }
    } catch (error: any) {
      console.error('Lỗi khi lưu hồ sơ điều trị:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi lưu hồ sơ điều trị.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Tính tuổi bệnh nhân
  const patientAge = useMemo(() => {
    if (!appointment?.ngay_sinh) return '';
    try {
      const birthYear = new Date(appointment.ngay_sinh).getFullYear();
      const currentYear = new Date().getFullYear();
      return `${currentYear - birthYear} tuổi`;
    } catch {
      return '';
    }
  }, [appointment]);

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center gap-3 text-zinc-400 dark:text-zinc-650">
        <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">Đang tải hồ sơ điều trị khách hàng...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="bg-red-50 dark:bg-red-950/10 border border-red-200 dark:border-red-900/30 p-6 rounded-3xl text-center max-w-lg mx-auto mt-12 space-y-4">
        <AlertTriangle className="size-12 text-rose-500 mx-auto" />
        <h3 className="font-extrabold text-secondary dark:text-red-400">Đã xảy ra lỗi</h3>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 font-semibold">{errorMsg}</p>
        <button 
          onClick={() => navigate(isKtv ? '/technician/appointments' : '/doctor')}
          className="bg-primary text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all hover:opacity-90 shadow-soft-button"
        >
          {isKtv ? 'Trở lại lịch hẹn' : 'Trở lại hàng chờ'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* Top Navigation */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(isKtv ? '/technician/appointments' : '/doctor')}
          className="p-2.5 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-2xl transition-all shadow-sm hover:scale-105"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-black text-secondary dark:text-zinc-100 tracking-tight flex items-center gap-2">
            {isKtv ? 'Bàn Trị Liệu & Lượng Giá KTV' : 'Khám Lâm Sàng & Lượng Giá'}
          </h1>
          <p className="text-zinc-400 dark:text-zinc-550 text-[10px] font-bold uppercase mt-0.5 tracking-wider">
            Mã ca khám: <span className="font-mono text-primary font-extrabold">{appointment.ma_lich_dat}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Diagnostic & Recommendations Form (5 Cols) */}
        <div className="lg:col-span-5">
          <form 
            onSubmit={handleSubmit}
            className="bg-white dark:bg-zinc-900 rounded-[24px] border border-zinc-150/60 dark:border-zinc-800 p-6 shadow-sm space-y-5 sticky top-24"
          >
            <div>
              <h3 className="text-sm font-black text-secondary dark:text-zinc-100 uppercase tracking-wider flex items-baseline gap-2 flex-wrap">
                <span className="flex items-center gap-2">
                  <ClipboardList size={16} className="text-primary shrink-0" />
                  {isKtv ? 'Lượng giá buổi trị liệu' : 'Kết luận lâm sàng'}
                </span>
                {appointment && (
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-extrabold lowercase">
                    {(() => {
                      const d = new Date(appointment.ngay_gio_bat_dau);
                      const hour = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                      const day = d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' });
                      return `( ${hour} ngày ${day} )`;
                    })()}
                  </span>
                )}
              </h3>
              <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold uppercase mt-0.5 tracking-wider">
                {isKtv ? 'Chỉ số đau (VAS) & nhật ký trị liệu' : 'Chẩn đoán & Khuyến nghị điều trị'}
              </p>
            </div>

            {/* Lý do khám bệnh / trị liệu (Đổ tự động từ ca hiện tại) */}
            {appointment && (
              <div className="bg-zinc-50/60 dark:bg-zinc-850/20 p-4 rounded-xl border border-zinc-150/50 dark:border-zinc-800 space-y-3 text-left">
                <div>
                  <span className="text-[8px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                    Lý do {appointment.loai === 'KHAM' ? 'khám bệnh' : 'trị liệu'}
                  </span>
                  <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mt-1 leading-relaxed">
                    {appointment.ly_do_kham || 'Không có mô tả chi tiết lý do.'}
                  </p>
                </div>
                {appointment.anh_dinh_kem_url && (
                  <div className="space-y-1.5 pt-1.5 border-t border-zinc-150/40 dark:border-zinc-800/40">
                    <span className="text-[8px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                      Ảnh tổn thương đính kèm
                    </span>
                    <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden max-w-[200px] bg-zinc-100 dark:bg-zinc-950 p-1">
                      <img 
                        src={appointment.anh_dinh_kem_url} 
                        alt="Ảnh tổn thương" 
                        className="w-full max-h-40 object-contain rounded"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {isKtv ? (
              <>
                {/* Pain Scale (VAS) circular selectors - Pro Max */}
                <div className="space-y-5 pt-3">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block flex justify-between">
                      <span>Mức độ đau Trước trị liệu (VAS) <span className="text-rose-500">*</span></span>
                      <span className="text-primary font-bold">Mức {vasTruoc}</span>
                    </label>
                    <div className="grid grid-cols-6 sm:grid-cols-11 gap-1.5">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                        const isSelected = vasTruoc === num;
                        return (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setVasTruoc(num)}
                            className={`size-9 rounded-xl border text-[11px] font-black transition-all duration-200 flex items-center justify-center ${getVasColorClass(num, isSelected)}`}
                          >
                            {num}
                          </button>
                        );
                      })}
                    </div>
                    {vasTruoc !== null && (
                      <p className="text-[10px] text-zinc-650 dark:text-zinc-450 font-bold mt-2 italic bg-zinc-50 dark:bg-zinc-850/50 p-3 rounded-xl border border-zinc-150/40 dark:border-zinc-800/80 leading-relaxed">
                        {getVasDescription(vasTruoc)}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 pt-3 border-t border-zinc-100 dark:border-zinc-800/50">
                    <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block flex justify-between">
                      <span>Mức độ đau Sau trị liệu (VAS) <span className="text-rose-500">*</span></span>
                      <span className="text-primary font-bold">Mức {vasSau}</span>
                    </label>
                    <div className="grid grid-cols-6 sm:grid-cols-11 gap-1.5">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                        const isSelected = vasSau === num;
                        return (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setVasSau(num)}
                            className={`size-9 rounded-xl border text-[11px] font-black transition-all duration-200 flex items-center justify-center ${getVasColorClass(num, isSelected)}`}
                          >
                            {num}
                          </button>
                        );
                      })}
                    </div>
                    {vasSau !== null && (
                      <p className="text-[10px] text-zinc-655 dark:text-zinc-450 font-bold mt-2 italic bg-zinc-50 dark:bg-zinc-850/50 p-3 rounded-xl border border-zinc-150/40 dark:border-zinc-800/80 leading-relaxed">
                        {getVasDescription(vasSau)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Diễn tiến / Ghi chú trị liệu */}
                <div className="space-y-1.5 pt-3 border-t border-zinc-100 dark:border-zinc-800/50">
                  <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block flex items-center gap-1.5">
                    <FileText size={14} className="text-primary" />
                    Ghi chú buổi trị liệu <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    value={ghiChu}
                    onChange={(e) => setGhiChu(e.target.value)}
                    placeholder="Nhập tiến trình tập, kỹ thuật đã thực hiện, phản hồi cơ thể của khách (vd: giãn cơ, bấm huyệt vùng cổ, xung siêu âm nhẹ nhàng)..."
                    rows={4}
                    required
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-semibold text-secondary dark:text-zinc-150 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder-zinc-400"
                  />
                </div>
              </>
            ) : (
              <>
                {/* Chẩn đoán */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block flex items-center gap-1.5">
                    <HeartPulse size={14} className="text-primary" />
                    Chẩn đoán lâm sàng <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    value={chanDoan}
                    onChange={(e) => setChanDoan(e.target.value)}
                    placeholder="Nhập chẩn đoán y khoa... (ví dụ: Thoái hóa đốt sống cổ C5-C6 gây chèn ép thần kinh vai gáy)"
                    rows={4}
                    required
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-855 border border-zinc-200 dark:border-zinc-850/50 rounded-2xl text-xs font-semibold text-secondary dark:text-zinc-150 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder-zinc-400"
                  />
                </div>

                {/* Chống chỉ định */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest block flex items-center gap-1.5">
                    <ShieldAlert size={14} /> Chống chỉ định y khoa (nếu có)
                  </label>
                  <textarea
                    value={chongChiDinh}
                    onChange={(e) => setChongChiDinh(e.target.value)}
                    placeholder="Những vùng tránh can thiệp mạnh (ví dụ: Tránh siêu âm nhiệt vùng có kim loại, không dán parafin nóng vùng cổ chân có viêm cấp)..."
                    rows={2}
                    className="w-full px-4 py-3 bg-rose-50/10 dark:bg-rose-955/5 border border-rose-200/50 dark:border-rose-900/40 rounded-2xl text-xs font-semibold text-rose-650 dark:text-rose-450 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 outline-none transition-all placeholder-rose-350"
                  />
                </div>

                {/* Đề xuất dịch vụ điều trị */}
                <div className="space-y-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                  <div>
                    <h4 className="text-[10px] font-black text-zinc-450 dark:text-zinc-500 uppercase tracking-widest">Khuyến nghị phác đồ trị liệu</h4>
                    <p className="text-[8px] text-zinc-400 dark:text-zinc-500 font-bold uppercase mt-0.5">Lựa chọn gói phục hồi hoặc dịch vụ lẻ đề xuất cho khách</p>
                  </div>

                  {/* Gói đề xuất */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                      Đề xuất gói điều trị (Ưu tiên)
                    </label>
                    <select
                      value={goiDichVuId}
                      onChange={(e) => {
                        setGoiDichVuId(e.target.value);
                        if (e.target.value) setDichVuId(''); // Nếu chọn gói thì xóa chọn dịch vụ lẻ
                      }}
                      className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-secondary dark:text-zinc-150 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                    >
                      <option value="">-- Không đề xuất gói --</option>
                      {packages.map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.ten_goi} ({pkg.gia_goi.toLocaleString('vi-VN')}đ)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Dịch vụ lẻ đề xuất */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                      Hoặc đề xuất dịch vụ lẻ (Sử dụng 1 buổi)
                    </label>
                    <select
                      value={dichVuId}
                      onChange={(e) => {
                        setDichVuId(e.target.value);
                        if (e.target.value) setGoiDichVuId(''); // Nếu chọn dịch vụ thì xóa chọn gói
                      }}
                      className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-secondary dark:text-zinc-150 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                    >
                      <option value="">-- Không đề xuất dịch vụ lẻ --</option>
                      {services.map((svc) => (
                        <option key={svc.id} value={svc.id}>
                          {svc.ten_dich_vu} ({svc.gia_hien_tai.toLocaleString('vi-VN')}đ)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Dặn dò bác sĩ */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">
                    Ghi chú / Dặn dò thêm
                  </label>
                  <textarea
                    value={ghiChu}
                    onChange={(e) => setGhiChu(e.target.value)}
                    placeholder="Nhập hướng dẫn tập luyện thêm tại nhà hoặc dặn dò đặc biệt..."
                    rows={2}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-semibold text-secondary dark:text-zinc-150 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder-zinc-400"
                  />
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitLoading}
              className="w-full py-4 bg-primary hover:bg-primary/95 text-white font-extrabold rounded-2xl text-xs shadow-lg shadow-primary/15 hover:shadow-primary/25 hover:scale-[1.01] transition-all flex items-center justify-center gap-2.5 uppercase tracking-widest"
            >
              {submitLoading ? (
                <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <CheckCircle size={16} />
                  {isKtv ? 'Xác nhận hoàn thành ca trị liệu' : 'Hoàn thành ca khám'}
                </>
              )}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: Patient Info & History (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Patient Card Header - Pro Max */}
          <div className="bg-white dark:bg-zinc-900 rounded-[24px] border border-zinc-150/60 dark:border-zinc-800 p-6 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-5 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary/5 dark:bg-primary/10 w-24 h-24 rounded-full -mr-6 -mt-6 blur-2xl"></div>
            
            <div className="size-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/5 border border-primary/20 flex items-center justify-center text-primary font-black text-2xl shadow-inner shrink-0 scale-105">
              {(appointment.ten_khach_hang || appointment.ho_ten_khach || 'K').charAt(0).toUpperCase()}
            </div>
            
            <div className="flex-1 w-full space-y-4 text-center md:text-left">
              <div>
                <h2 className="text-lg font-black text-secondary dark:text-zinc-100 flex items-center justify-center md:justify-start gap-2.5">
                  {appointment.ten_khach_hang || appointment.ho_ten_khach}
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/25">
                    {appointment.loai === 'KHAM' ? 'Khám lâm sàng' : 'Trị liệu'}
                  </span>
                </h2>
                <p className="text-zinc-400 dark:text-zinc-550 text-[10px] font-bold uppercase mt-1">Hồ sơ khách hàng</p>
              </div>

              {/* Grid of details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-zinc-50 dark:bg-zinc-850/50 p-2.5 rounded-xl border border-zinc-150/50 dark:border-zinc-800 flex items-center gap-2">
                  <User size={14} className="text-primary shrink-0" />
                  <div className="text-left min-w-0">
                    <p className="text-[8px] text-zinc-400 dark:text-zinc-500 font-bold uppercase">Giới tính</p>
                    <p className="text-xs font-bold text-secondary dark:text-zinc-200 capitalize truncate">
                      {appointment.gioi_tinh === 'nam' ? 'Nam' : 'Nữ'}
                    </p>
                  </div>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-850/50 p-2.5 rounded-xl border border-zinc-150/50 dark:border-zinc-800 flex items-center gap-2">
                  <Activity size={14} className="text-primary shrink-0" />
                  <div className="text-left min-w-0">
                    <p className="text-[8px] text-zinc-400 dark:text-zinc-500 font-bold uppercase">Tuổi</p>
                    <p className="text-xs font-bold text-secondary dark:text-zinc-200 truncate">
                      {patientAge || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-850/50 p-2.5 rounded-xl border border-zinc-150/50 dark:border-zinc-800 flex items-center gap-2">
                  <Phone size={14} className="text-primary shrink-0" />
                  <div className="text-left min-w-0">
                    <p className="text-[8px] text-zinc-400 dark:text-zinc-500 font-bold uppercase">Điện thoại</p>
                    <p className="text-xs font-bold text-secondary dark:text-zinc-200 truncate">
                      {appointment.so_dien_thoai || appointment.sdt_khach_hang || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-850/50 p-2.5 rounded-xl border border-zinc-150/50 dark:border-zinc-800 flex items-center gap-2">
                  <CalendarIcon size={14} className="text-primary shrink-0" />
                  <div className="text-left min-w-0">
                    <p className="text-[8px] text-zinc-400 dark:text-zinc-500 font-bold uppercase">Giờ hẹn</p>
                    <p className="text-[10px] font-bold text-secondary dark:text-zinc-200 truncate">
                      {new Date(appointment.ngay_gio_bat_dau).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} {new Date(appointment.ngay_gio_bat_dau).toLocaleDateString('vi-VN', {day: 'numeric', month: 'numeric'})}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Medical Records Navigation Tabs - sliding Pill Style */}
          <div className="bg-white dark:bg-zinc-900 rounded-[24px] border border-zinc-150/60 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col">
            <div className="bg-zinc-50 dark:bg-zinc-950 p-1.5 rounded-t-[24px] flex gap-1 border-b border-zinc-200/50 dark:border-zinc-800/80">
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                  activeTab === 'history'
                    ? 'bg-white dark:bg-zinc-900 text-primary shadow-sm border border-zinc-200/20 dark:border-zinc-800/40 scale-102'
                    : 'text-zinc-400 dark:text-zinc-555 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                <History size={14} />
                Lịch sử chẩn đoán ({profile?.medicalRecords?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('treatments')}
                className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                  activeTab === 'treatments'
                    ? 'bg-white dark:bg-zinc-900 text-primary shadow-sm border border-zinc-200/20 dark:border-zinc-800/40 scale-102'
                    : 'text-zinc-400 dark:text-zinc-555 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                <FileSpreadsheet size={14} />
                Tiến trình trị liệu ({profile?.treatmentPlans?.length || 0})
              </button>
            </div>

            <div className="p-6 min-h-[300px]">
              
              {/* Tab 2: Lịch sử chẩn đoán trước đó */}
              {activeTab === 'history' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {!profile || profile.medicalRecords.length === 0 ? (
                    <div className="text-center py-16 text-zinc-450 dark:text-zinc-550 flex flex-col items-center justify-center gap-3">
                      <FileText size={32} className="text-zinc-300" />
                      <p className="text-xs font-extrabold uppercase tracking-wide">Chưa có lịch sử hồ sơ lâm sàng</p>
                    </div>
                  ) : (
                    <div className="relative border-l-2 border-dashed border-zinc-200 dark:border-zinc-800/80 pl-6 space-y-6 ml-3 text-left">
                      {profile.medicalRecords.map((record) => (
                        <div key={record.id} className="relative group">
                          {/* Timeline dot */}
                          <div className="absolute -left-[33px] top-1.5 size-4 rounded-full bg-white dark:bg-zinc-900 border-2 border-primary group-hover:bg-primary transition-all flex items-center justify-center">
                            <div className="size-1.5 rounded-full bg-primary group-hover:bg-white transition-all"></div>
                          </div>
                          
                          <div className="bg-white dark:bg-zinc-900 border border-zinc-150/60 dark:border-zinc-800 group-hover:border-primary/30 rounded-2xl p-5 shadow-sm group-hover:shadow transition-all duration-300 space-y-3">
                            <div className="flex items-center justify-between text-[10px] font-extrabold text-zinc-400">
                              <span className="flex items-center gap-1.5">
                                <HeartPulse size={12} className="text-primary animate-pulse" />
                                BS: <span className="text-secondary dark:text-zinc-200">{record.ten_bac_si}</span>
                              </span>
                              <span className="font-mono">{new Date(record.thoi_gian_tao).toLocaleDateString('vi-VN')}</span>
                            </div>

                            <div>
                              <p className="text-[8px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-widest">Chẩn đoán</p>
                              <p className="text-xs font-extrabold text-secondary dark:text-zinc-150 mt-0.5 leading-relaxed">{record.chan_doan}</p>
                            </div>

                            {record.chong_chi_dinh && (
                              <div className="bg-rose-50/50 dark:bg-rose-955/10 border border-rose-100/50 dark:border-rose-900/30 px-4 py-2.5 rounded-xl flex items-start gap-2.5">
                                <ShieldAlert size={14} className="text-rose-500 shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-[8px] text-rose-550 font-black uppercase tracking-widest">Chống chỉ định</p>
                                  <p className="text-xs font-bold text-rose-600 dark:text-rose-455 mt-0.5 leading-relaxed">{record.chong_chi_dinh}</p>
                                </div>
                              </div>
                            )}

                            {(record.khuyen_nghi_dich_vu || record.khuyen_nghi_goi) && (
                              <div className="flex gap-2 flex-wrap border-t border-zinc-100 dark:border-zinc-800/80 pt-2.5">
                                {record.khuyen_nghi_dich_vu && (
                                  <span className="text-[8px] font-black bg-primary/10 text-primary border border-primary/25 px-2.5 py-1 rounded uppercase tracking-wider">
                                    Đề xuất: {record.khuyen_nghi_dich_vu}
                                  </span>
                                )}
                                {record.khuyen_nghi_goi && (
                                  <span className="text-[8px] font-black bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 border border-teal-150/30 px-2.5 py-1 rounded uppercase tracking-wider">
                                    Gói đề xuất: {record.khuyen_nghi_goi}
                                  </span>
                                )}
                              </div>
                            )}

                            {record.ghi_chu && (
                              <div className="text-[10px] text-zinc-550 dark:text-zinc-400 font-medium bg-zinc-50 dark:bg-zinc-850/40 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800/60 leading-relaxed italic">
                                Dặn dò: "{record.ghi_chu}"
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Tiến trình trị liệu chi tiết */}
              {activeTab === 'treatments' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {!profile || profile.treatmentPlans.length === 0 ? (
                    <div className="text-center py-16 text-zinc-450 dark:text-zinc-555 flex flex-col items-center justify-center gap-3">
                      <FileSpreadsheet size={32} className="text-zinc-300" />
                      <p className="text-xs font-extrabold uppercase tracking-wide">Chưa có lịch sử trị liệu</p>
                    </div>
                  ) : (
                    <div className="space-y-6 text-left">
                      {profile.treatmentPlans.map((plan) => (
                        <div key={plan.id} className="border border-zinc-150/60 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm hover:shadow transition-shadow">
                          {/* Plan Header */}
                          <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 border-b border-zinc-150/60 dark:border-zinc-800 flex items-center justify-between flex-wrap gap-2.5">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[9px] font-bold text-zinc-450 dark:text-zinc-500 tracking-wider">
                                  {plan.ma_lich_dieu_tri}
                                </span>
                                <span className="text-[8px] font-black uppercase bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded">
                                  {plan.loai_dieu_tri === 'goi' ? 'Theo Gói' : 'Dịch vụ lẻ'}
                                </span>
                              </div>
                              <h5 className="text-xs font-black text-secondary dark:text-zinc-150 mt-1.5">
                                {plan.ten_goi || plan.ten_dich_vu}
                              </h5>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1 rounded-full border border-emerald-100 dark:border-emerald-900/30">
                                Tiến độ: {plan.so_buoi_da_dung}/{plan.tong_so_buoi} buổi
                              </span>
                            </div>
                          </div>

                          {/* Sessions List */}
                          <div className="p-4 space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin divide-y divide-zinc-100 dark:divide-zinc-800">
                            {plan.sessions.map((session, sIdx) => (
                              <div key={session.id} className={`pt-4 ${sIdx === 0 ? 'pt-0' : ''} space-y-3`}>
                                <div className="flex items-center justify-between text-[10px] font-extrabold">
                                  <span className="text-secondary dark:text-zinc-300">
                                    Buổi {session.so_thu_tu_buoi} • KTV: <span className="text-primary">{session.ten_ky_thuat_vien || 'Chưa phân công'}</span>
                                  </span>
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${
                                    session.trang_thai === 'hoan_thanh'
                                      ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30'
                                      : session.trang_thai === 'cho_tri_lieu'
                                        ? 'bg-blue-50 dark:bg-blue-955/15 text-primary border-primary/20'
                                        : 'bg-zinc-50 text-zinc-400 border-zinc-200/50'
                                  }`}>
                                    {session.trang_thai === 'hoan_thanh' ? 'Hoàn thành' : 'Chưa diễn ra'}
                                  </span>
                                </div>

                                {session.trang_thai === 'hoan_thanh' && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-zinc-50/50 dark:bg-zinc-855/15 p-4 rounded-xl border border-zinc-150/50 dark:border-zinc-800/80 text-[10px] space-y-1">
                                    <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800/60">
                                      <span className="text-zinc-400 dark:text-zinc-500 font-black uppercase text-[8px] tracking-wider block">VAS Trước trị liệu</span>
                                      <p className="font-extrabold text-secondary dark:text-zinc-200 mt-1 flex items-center gap-1.5">
                                        <FlameKindling size={12} className="text-amber-500" />
                                        Mức {session.danh_gia_truoc_buoi || 'N/A'}
                                      </p>
                                    </div>
                                    <div className="bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800/60">
                                      <span className="text-zinc-400 dark:text-zinc-500 font-black uppercase text-[8px] tracking-wider block">VAS Sau trị liệu</span>
                                      <p className="font-extrabold text-secondary dark:text-zinc-200 mt-1 flex items-center gap-1.5">
                                        <CheckCircle size={12} className="text-emerald-500" />
                                        Mức {session.danh_gia_sau_buoi || 'N/A'}
                                      </p>
                                    </div>
                                    {session.canh_bao_dac_biet && (
                                      <div className="md:col-span-2 bg-rose-50/50 dark:bg-rose-955/15 text-rose-500 font-bold p-2.5 rounded-lg border border-rose-100/50 flex items-center gap-2 text-[10px]">
                                        <AlertTriangle size={14} className="animate-bounce" /> 
                                        Cảnh báo: {session.canh_bao_dac_biet}
                                      </div>
                                    )}
                                    {session.ai_tom_tat_ngan && (
                                      <div className="md:col-span-2 border-t border-zinc-100 dark:border-zinc-800/50 pt-2 flex items-center gap-1.5 text-[9px] text-primary font-bold">
                                        <TrendingUp size={12} /> Tiến trình: {session.ai_tom_tat_ngan}
                                      </div>
                                    )}
                                    {session.danh_gia_hieu_qua && (
                                      <div className="md:col-span-2 border-t border-zinc-150/40 dark:border-zinc-800/50 pt-2.5">
                                        <span className="text-zinc-400 dark:text-zinc-500 font-black uppercase text-[8px] tracking-wider">Diễn tiến / Ghi chú trị liệu</span>
                                        <p className="font-semibold text-zinc-650 dark:text-zinc-355 mt-1 italic leading-relaxed">
                                          "{session.danh_gia_hieu_qua}"
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
