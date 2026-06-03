import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Image as ImageIcon
} from 'lucide-react';
import { 
  getAppointmentDetail, 
  getPatientProfile, 
  getServices, 
  getPackages, 
  saveAssessment,
  PatientProfile,
  ServiceItem,
  PackageItem
} from '../api/doctor.api';

export default function ClinicalAssessment() {
  const { id: appointmentId } = useParams<{ id: string }>();
  const navigate = useNavigate();

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

  // UI States
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'treatments'>('info');
  const [errorMsg, setErrorMsg] = useState('');

  // Tải dữ liệu ban đầu
  const loadInitialData = useCallback(async () => {
    if (!appointmentId) return;
    setLoading(true);
    setErrorMsg('');
    try {
      // 1. Tải chi tiết ca khám
      const apptRes = await getAppointmentDetail(appointmentId);
      const apptData = apptRes.data;
      setAppointment(apptData);

      // Điền sẵn chẩn đoán nếu đã có lưu nháp trước đó
      if (apptData.chan_doan) setChanDoan(apptData.chan_doan);
      if (apptData.chong_chi_dinh) setChongChiDinh(apptData.chong_chi_dinh);
      if (apptData.goi_dich_vu_id) setGoiDichVuId(apptData.goi_dich_vu_id);
      if (apptData.dich_vu_id) setDichVuId(apptData.dich_vu_id);
      if (apptData.ghi_chu) setGhiChu(apptData.ghi_chu);

      // 2. Tải danh mục dịch vụ và gói để làm đề xuất
      const [servicesRes, packagesRes] = await Promise.all([
        getServices(),
        getPackages()
      ]);
      setServices(servicesRes.data);
      setPackages(packagesRes.data);

      // 3. Tải hồ sơ bệnh án cũ của bệnh nhân (nếu đã liên kết khách hàng)
      if (apptData.khach_hang_id) {
        const profileRes = await getPatientProfile(apptData.khach_hang_id);
        setProfile(profileRes.data);
      }
    } catch (error: any) {
      console.error('Lỗi khi tải dữ liệu khám bệnh:', error);
      setErrorMsg(error.response?.data?.message || 'Không thể tải dữ liệu ca khám. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Xử lý gửi kết quả khám
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointmentId) return;
    if (!chanDoan.trim()) {
      alert('Vui lòng điền chẩn đoán lâm sàng của bệnh nhân.');
      return;
    }

    setSubmitLoading(true);
    try {
      await saveAssessment({
        lich_dat_id: appointmentId,
        chan_doan: chanDoan,
        chong_chi_dinh: chongChiDinh,
        goi_dich_vu_id: goiDichVuId || null,
        dich_vu_id: dichVuId || null,
        ghi_chu: ghiChu || null
      });

      alert('Ghi nhận chẩn đoán lâm sàng và hoàn thành ca khám thành công!');
      navigate('/doctor'); // Trở lại danh sách hàng chờ
    } catch (error: any) {
      console.error('Lỗi khi lưu bệnh án:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi lưu bệnh án.');
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
      <div className="min-h-[500px] flex flex-col items-center justify-center gap-3 text-zinc-400">
        <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold uppercase tracking-wider">Đang tải hồ sơ bệnh án khách hàng...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 p-6 rounded-3xl text-center max-w-lg mx-auto mt-12 space-y-4">
        <AlertTriangle className="size-12 text-red-500 mx-auto" />
        <h3 className="font-extrabold text-secondary dark:text-red-400">Đã xảy ra lỗi</h3>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">{errorMsg}</p>
        <button 
          onClick={() => navigate('/doctor')}
          className="bg-primary text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all hover:opacity-90"
        >
          Trở lại hàng chờ
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* Top Navigation */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/doctor')}
          className="p-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-300 hover:bg-zinc-50 rounded-xl transition-all shadow-sm"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-black text-secondary dark:text-zinc-100 tracking-tight flex items-center gap-2">
            Khám Lâm Sàng & Lượng Giá
          </h1>
          <p className="text-zinc-450 dark:text-zinc-500 text-[10px] font-bold uppercase mt-0.5">
            Mã ca khám: <span className="font-mono text-primary font-extrabold">{appointment.ma_lich_dat}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Patient Info & History (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Patient Card Header */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 p-6 shadow-sm flex items-start gap-4">
            <div className="size-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xl shadow-inner shrink-0">
              {(appointment.ten_khach_hang || appointment.ho_ten_khach || 'K').charAt(0).toUpperCase()}
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-base font-extrabold text-secondary dark:text-zinc-100">
                  {appointment.ten_khach_hang || appointment.ho_ten_khach}
                </h2>
                <span className="text-[9px] font-extrabold tracking-wide uppercase px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-500 dark:text-zinc-400">
                  {appointment.gioi_tinh === 'nam' ? 'Nam' : 'Nữ'}
                </span>
                {patientAge && (
                  <span className="text-[9px] font-extrabold tracking-wide uppercase px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-550 dark:text-zinc-450">
                    {patientAge}
                  </span>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Phone size={14} className="text-zinc-400" />
                  {appointment.so_dien_thoai || appointment.sdt_khach_hang}
                </span>
                <span className="flex items-center gap-1.5">
                  <CalendarIcon size={14} className="text-zinc-400" />
                  Hẹn khám: {new Date(appointment.ngay_gio_bat_dau).toLocaleDateString('vi-VN')} {new Date(appointment.ngay_gio_bat_dau).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>

          {/* Medical Records Navigation Tabs */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden">
            <div className="border-b border-zinc-100 dark:border-zinc-800 flex">
              <button
                onClick={() => setActiveTab('info')}
                className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider border-b-2 text-center transition-all ${
                  activeTab === 'info'
                    ? 'border-primary text-primary bg-primary/5 dark:bg-primary/10'
                    : 'border-transparent text-zinc-400 dark:text-zinc-500 hover:text-zinc-700'
                }`}
              >
                Ca khám hiện tại
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider border-b-2 text-center transition-all ${
                  activeTab === 'history'
                    ? 'border-primary text-primary bg-primary/5 dark:bg-primary/10'
                    : 'border-transparent text-zinc-400 dark:text-zinc-500 hover:text-zinc-700'
                }`}
              >
                Lịch sử chẩn đoán ({profile?.medicalRecords?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('treatments')}
                className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider border-b-2 text-center transition-all ${
                  activeTab === 'treatments'
                    ? 'border-primary text-primary bg-primary/5 dark:bg-primary/10'
                    : 'border-transparent text-zinc-400 dark:text-zinc-500 hover:text-zinc-700'
                }`}
              >
                Tiến trình trị liệu ({profile?.treatmentPlans?.length || 0})
              </button>
            </div>

            <div className="p-6">
              {/* Tab 1: Ca khám hiện tại */}
              {activeTab === 'info' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2">Lý do khám bệnh</h4>
                    <div className="bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-xs font-semibold text-secondary dark:text-zinc-200">
                      {appointment.ly_do_kham || 'Không có mô tả chi tiết lý do khám.'}
                    </div>
                  </div>

                  {appointment.anh_dinh_kem_url && (
                    <div>
                      <h4 className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <ImageIcon size={14} /> Ảnh tổn thương đính kèm
                      </h4>
                      <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden max-w-sm bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-2">
                        <img 
                          src={appointment.anh_dinh_kem_url} 
                          alt="Ảnh tổn thương" 
                          className="w-full max-h-60 object-contain rounded-xl shadow-inner hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Lịch sử chẩn đoán trước đó */}
              {activeTab === 'history' && (
                <div className="space-y-6">
                  {!profile || profile.medicalRecords.length === 0 ? (
                    <div className="text-center py-12 text-zinc-400 dark:text-zinc-550 flex flex-col items-center justify-center gap-2">
                      <FileText size={24} />
                      <p className="text-xs font-bold">Chưa có lịch sử bệnh án lâm sàng trước đây</p>
                    </div>
                  ) : (
                    <div className="relative border-l border-zinc-150 dark:border-zinc-800 pl-6 space-y-6 ml-3">
                      {profile.medicalRecords.map((record) => (
                        <div key={record.id} className="relative group">
                          {/* Timeline dot */}
                          <div className="absolute -left-[31px] top-1.5 size-4 rounded-full bg-white dark:bg-zinc-900 border-2 border-primary group-hover:bg-primary transition-colors flex items-center justify-center">
                            <div className="size-1.5 rounded-full bg-primary group-hover:bg-white"></div>
                          </div>
                          
                          <div className="bg-zinc-50/50 dark:bg-zinc-855/20 border border-zinc-100 dark:border-zinc-800/80 rounded-2xl p-4 space-y-3">
                            <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400">
                              <span className="flex items-center gap-1">
                                <Activity size={12} className="text-primary" />
                                BS: {record.ten_bac_si}
                              </span>
                              <span>{new Date(record.thoi_gian_tao).toLocaleDateString('vi-VN')}</span>
                            </div>

                            <div>
                              <p className="text-[9px] text-zinc-400 dark:text-zinc-550 font-bold uppercase tracking-wider">Chẩn đoán</p>
                              <p className="text-xs font-bold text-secondary dark:text-zinc-200 mt-0.5">{record.chan_doan}</p>
                            </div>

                            {record.chong_chi_dinh && (
                              <div className="bg-rose-50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/30 px-3 py-1.5 rounded-xl">
                                <p className="text-[8px] text-rose-550 font-bold uppercase tracking-wider">Chống chỉ định</p>
                                <p className="text-[11px] font-bold text-rose-600 dark:text-rose-450 mt-0.5">{record.chong_chi_dinh}</p>
                              </div>
                            )}

                            {(record.khuyen_nghi_dich_vu || record.khuyen_nghi_goi) && (
                              <div className="flex gap-2 flex-wrap">
                                {record.khuyen_nghi_dich_vu && (
                                  <span className="text-[8px] font-bold bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded uppercase tracking-tight">
                                    Đề xuất: {record.khuyen_nghi_dich_vu}
                                  </span>
                                )}
                                {record.khuyen_nghi_goi && (
                                  <span className="text-[8px] font-bold bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border border-indigo-150/30 px-2 py-0.5 rounded uppercase tracking-tight">
                                    Gói đề xuất: {record.khuyen_nghi_goi}
                                  </span>
                                )}
                              </div>
                            )}

                            {record.ghi_chu && (
                              <p className="text-[10px] italic text-zinc-500 mt-2 border-t border-zinc-100 dark:border-zinc-800/50 pt-2">
                                Ghi chú: {record.ghi_chu}
                              </p>
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
                <div className="space-y-6">
                  {!profile || profile.treatmentPlans.length === 0 ? (
                    <div className="text-center py-12 text-zinc-400 dark:text-zinc-550 flex flex-col items-center justify-center gap-2">
                      <FileSpreadsheet size={24} />
                      <p className="text-xs font-bold">Chưa có lịch sử liệu trình thực tế nào</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {profile.treatmentPlans.map((plan) => (
                        <div key={plan.id} className="border border-zinc-100 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                          {/* Plan Header */}
                          <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between flex-wrap gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[9px] font-bold text-zinc-400">
                                  {plan.ma_lich_dieu_tri}
                                </span>
                                <span className="text-[8px] font-bold uppercase bg-indigo-55/10 text-indigo-600 px-1.5 py-0.5 rounded">
                                  {plan.loai_dieu_tri === 'goi' ? 'Gói điều trị' : 'Dịch vụ lẻ'}
                                </span>
                              </div>
                              <h5 className="text-xs font-extrabold text-secondary dark:text-zinc-200 mt-1">
                                {plan.ten_goi || plan.ten_dich_vu}
                              </h5>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-full border border-emerald-100">
                                Tiến độ: {plan.so_buoi_da_dung}/{plan.tong_so_buoi} buổi
                              </span>
                            </div>
                          </div>

                          {/* Sessions List */}
                          <div className="p-4 space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin divide-y divide-zinc-50 dark:divide-zinc-800">
                            {plan.sessions.map((session, sIdx) => (
                              <div key={session.id} className={`pt-3 ${sIdx === 0 ? 'pt-0' : ''} space-y-2`}>
                                <div className="flex items-center justify-between text-[10px] font-bold">
                                  <span className="text-secondary dark:text-zinc-300">
                                    Buổi {session.so_thu_tu_buoi} • {session.ten_ky_thuat_vien || 'Kỹ thuật viên'}
                                  </span>
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] ${
                                    session.trang_thai === 'hoan_thanh'
                                      ? 'bg-emerald-50 text-emerald-650'
                                      : session.trang_thai === 'cho_tri_lieu'
                                        ? 'bg-blue-50 text-blue-650'
                                        : 'bg-zinc-100 text-zinc-450'
                                  }`}>
                                    {session.trang_thai === 'hoan_thanh' ? 'Hoàn thành' : 'Chưa diễn ra'}
                                  </span>
                                </div>

                                {session.trang_thai === 'hoan_thanh' && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-zinc-50/50 dark:bg-zinc-855/10 p-3 rounded-xl border border-zinc-100/50 text-[10px] space-y-1">
                                    <div>
                                      <span className="text-zinc-400 font-bold uppercase text-[8px]">Đánh giá trước buổi</span>
                                      <p className="font-semibold text-zinc-755 dark:text-zinc-350 mt-0.5">{session.danh_gia_truoc_buoi || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <span className="text-zinc-400 font-bold uppercase text-[8px]">Đánh giá hiệu quả sau buổi</span>
                                      <p className="font-semibold text-zinc-755 dark:text-zinc-350 mt-0.5">{session.danh_gia_sau_buoi || 'N/A'}</p>
                                    </div>
                                    {session.canh_bao_dac_biet && (
                                      <div className="md:col-span-2 text-rose-500 font-bold flex items-center gap-1">
                                        <AlertTriangle size={12} /> Cảnh báo: {session.canh_bao_dac_biet}
                                      </div>
                                    )}
                                    {session.ai_tom_tat_ngan && (
                                      <div className="md:col-span-2 border-t border-zinc-100/80 pt-2 flex items-center gap-1 text-[9px] text-primary font-bold">
                                        <TrendingUp size={12} /> Tiến trình: {session.ai_tom_tat_ngan}
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

        {/* RIGHT COLUMN: Diagnostic & Recommendations Form (5 Cols) */}
        <div className="lg:col-span-5">
          <form 
            onSubmit={handleSubmit}
            className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 p-6 shadow-sm space-y-5 sticky top-24"
          >
            <div>
              <h3 className="text-sm font-extrabold text-secondary dark:text-zinc-100 uppercase tracking-wider">Kết luận lâm sàng</h3>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-550 font-bold uppercase mt-0.5">Phần nhập chẩn đoán & phác đồ</p>
            </div>

            {/* Chẩn đoán */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">
                Chẩn đoán lâm sàng <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={chanDoan}
                onChange={(e) => setChanDoan(e.target.value)}
                placeholder="Nhập chẩn đoán y khoa của bạn... (ví dụ: Thoái hóa đốt sống cổ C5-C6 kèm co thắt cơ nâng vai)"
                rows={4}
                required
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-855 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-semibold text-secondary dark:text-zinc-150 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder-zinc-400"
              />
            </div>

            {/* Chống chỉ định */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-rose-400 dark:text-rose-500 uppercase tracking-widest block flex items-center gap-1.5">
                <AlertTriangle size={14} /> Chống chỉ định y khoa (nếu có)
              </label>
              <textarea
                value={chongChiDinh}
                onChange={(e) => setChongChiDinh(e.target.value)}
                placeholder="Chống chỉ định kỹ thuật (ví dụ: Tránh xung sóng siêu âm vùng cột sống ngực, không dán parafin nóng vùng cổ chân có viêm khớp dạng thấp)"
                rows={2}
                className="w-full px-4 py-3 bg-rose-50/10 dark:bg-rose-950/5 border border-rose-200 dark:border-rose-900/40 rounded-2xl text-xs font-semibold text-rose-600 dark:text-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 outline-none transition-all placeholder-rose-300"
              />
            </div>

            {/* Đề xuất dịch vụ điều trị */}
            <div className="space-y-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <div>
                <h4 className="text-[10px] font-black text-zinc-400 dark:text-zinc-550 uppercase tracking-widest">Khuyến nghị phác đồ trị liệu</h4>
                <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold uppercase mt-0.5">Chọn gói điều trị hoặc dịch vụ lẻ đề xuất cho bệnh nhân</p>
              </div>

              {/* Gói đề xuất */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-extrabold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider block">
                  Đề xuất gói điều trị (Ưu tiên)
                </label>
                <select
                  value={goiDichVuId}
                  onChange={(e) => {
                    setGoiDichVuId(e.target.value);
                    if (e.target.value) setDichVuId(''); // Nếu chọn gói thì xóa chọn dịch vụ lẻ
                  }}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-855 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-semibold text-secondary dark:text-zinc-150 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
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
                <label className="text-[9px] font-extrabold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider block">
                  Hoặc đề xuất dịch vụ lẻ (Sử dụng 1 buổi)
                </label>
                <select
                  value={dichVuId}
                  onChange={(e) => {
                    setDichVuId(e.target.value);
                    if (e.target.value) setGoiDichVuId(''); // Nếu chọn dịch vụ thì xóa chọn gói
                  }}
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-855 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-semibold text-secondary dark:text-zinc-150 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
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
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">
                Ghi chú / Dặn dò thêm
              </label>
              <textarea
                value={ghiChu}
                onChange={(e) => setGhiChu(e.target.value)}
                placeholder="Nhập hướng dẫn tập luyện tại nhà hoặc dặn dò thêm..."
                rows={2}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-855 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-semibold text-secondary dark:text-zinc-150 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder-zinc-400"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitLoading}
              className="w-full py-3.5 bg-primary hover:bg-primary/95 text-white font-bold rounded-2xl text-xs shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              {submitLoading ? (
                <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Hoàn thành ca khám
                </>
              )}
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
