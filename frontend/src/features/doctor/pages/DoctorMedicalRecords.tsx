import { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  User, 
  Phone, 
  FileText, 
  Activity, 
  AlertTriangle,
  TrendingUp,
  Layers,
  HeartHandshake
} from 'lucide-react';
import { getPatients, getPatientProfile, PatientInfo, PatientProfile } from '../api/doctor.api';

export default function DoctorMedicalRecords() {
  const [patients, setPatients] = useState<PatientInfo[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedPatient, setSelectedPatient] = useState<PatientInfo | null>(null);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<'history' | 'treatments'>('history');

  // Load danh sách bệnh nhân
  useEffect(() => {
    async function loadPatients() {
      setLoadingPatients(true);
      try {
        const res = await getPatients();
        setPatients(res.data);
      } catch (error) {
        console.error('Lỗi khi tải danh sách bệnh nhân:', error);
      } finally {
        setLoadingPatients(false);
      }
    }
    loadPatients();
  }, []);

  // Load bệnh án của bệnh nhân được chọn
  useEffect(() => {
    if (!selectedPatient) {
      setProfile(null);
      return;
    }

    async function loadProfile() {
      setLoadingProfile(true);
      try {
        const res = await getPatientProfile(selectedPatient!.id);
        setProfile(res.data);
      } catch (error) {
        console.error('Lỗi khi tải bệnh án bệnh nhân:', error);
      } finally {
        setLoadingProfile(false);
      }
    }
    loadProfile();
  }, [selectedPatient]);

  // Lọc danh sách bệnh nhân dựa theo tìm kiếm
  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      const name = p.ho_ten.toLowerCase();
      const phone = p.so_dien_thoai || '';
      const search = searchTerm.toLowerCase();
      return name.includes(search) || phone.includes(search);
    });
  }, [patients, searchTerm]);

  // Tính tuổi bệnh nhân
  const getAge = (birthday?: string) => {
    if (!birthday) return '';
    try {
      const birthYear = new Date(birthday).getFullYear();
      const currentYear = new Date().getFullYear();
      return `${currentYear - birthYear} tuổi`;
    } catch {
      return '';
    }
  };

  return (
    <div className="h-[calc(100vh-10rem)] -mt-2 flex gap-8 animate-in fade-in duration-500 overflow-hidden">
      
      {/* LEFT: Patients List Sidebar (5 Cols equivalent) */}
      <div className="w-80 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm flex flex-col overflow-hidden shrink-0">
        {/* Search Header */}
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 space-y-3">
          <div>
            <h3 className="text-xs font-black text-secondary dark:text-zinc-100 uppercase tracking-wider">Danh sách bệnh nhân</h3>
            <p className="text-[9px] text-zinc-400 font-bold uppercase mt-0.5">Tìm kiếm & xem hồ sơ nhanh</p>
          </div>
          <div className="relative group">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-primary transition-colors">
              <Search size={14} />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nhập tên hoặc số điện thoại..."
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-855 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-secondary dark:text-zinc-100 placeholder-zinc-455 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* Patients Scrollable List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin">
          {loadingPatients ? (
            <div className="text-center py-12 text-zinc-400 dark:text-zinc-500 flex flex-col items-center justify-center gap-2">
              <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[10px] font-bold uppercase tracking-wider">Đang tải bệnh nhân...</p>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center py-12 text-zinc-400 dark:text-zinc-500 text-xs font-bold">
              Không tìm thấy bệnh nhân nào
            </div>
          ) : (
            filteredPatients.map((p) => {
              const isSelected = selectedPatient?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPatient(p)}
                  className={`w-full text-left p-3.5 rounded-2xl flex items-center gap-3 transition-all border ${
                    isSelected
                      ? 'bg-primary/5 dark:bg-primary/10 border-primary/30 text-primary shadow-sm'
                      : 'border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-550 dark:text-zinc-300'
                  }`}
                >
                  <div className={`size-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-inner ${
                    isSelected ? 'bg-primary/20 text-primary' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                  }`}>
                    {p.ho_ten.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold truncate">{p.ho_ten}</h4>
                    <p className="text-[9px] text-zinc-400 font-semibold mt-0.5 flex items-center gap-1">
                      {p.gioi_tinh === 'nam' ? 'Nam' : 'Nữ'} • {getAge(p.ngay_sinh) || 'N/A'}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT: Patient Clinical Profile Details (7 Cols equivalent) */}
      <div className="flex-1 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm flex flex-col overflow-hidden">
        {selectedPatient ? (
          <>
            {/* Patient Header Detail */}
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30 flex items-start gap-4">
              <div className="size-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-lg shadow-inner">
                {selectedPatient.ho_ten.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-sm font-extrabold text-secondary dark:text-zinc-100">{selectedPatient.ho_ten}</h2>
                  <span className="text-[8px] font-extrabold bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500 dark:text-zinc-400 uppercase">
                    {selectedPatient.gioi_tinh === 'nam' ? 'Nam' : 'Nữ'}
                  </span>
                  {selectedPatient.ngay_sinh && (
                    <span className="text-[8px] font-extrabold bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500 dark:text-zinc-400 uppercase">
                      {getAge(selectedPatient.ngay_sinh)}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Phone size={13} className="text-zinc-400" />
                    {selectedPatient.so_dien_thoai}
                  </span>
                  {selectedPatient.email && (
                    <span className="flex items-center gap-1.5">
                      <User size={13} className="text-zinc-400" />
                      {selectedPatient.email}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Content Navigation Tabs */}
            <div className="border-b border-zinc-100 dark:border-zinc-800 flex bg-white dark:bg-zinc-900">
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 text-center transition-all ${
                  activeTab === 'history'
                    ? 'border-primary text-primary bg-primary/5 dark:bg-primary/10'
                    : 'border-transparent text-zinc-400 dark:text-zinc-500 hover:text-zinc-700'
                }`}
              >
                Lịch sử chẩn đoán ({profile?.medicalRecords?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('treatments')}
                className={`flex-1 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 text-center transition-all ${
                  activeTab === 'treatments'
                    ? 'border-primary text-primary bg-primary/5 dark:bg-primary/10'
                    : 'border-transparent text-zinc-400 dark:text-zinc-500 hover:text-zinc-700'
                }`}
              >
                Tiến trình trị liệu thực tế ({profile?.treatmentPlans?.length || 0})
              </button>
            </div>

            {/* Profile Main View Area */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
              {loadingProfile ? (
                <div className="h-full flex flex-col items-center justify-center gap-2 text-zinc-450">
                  <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-[10px] font-bold uppercase tracking-wider">Đang nạp hồ sơ bệnh án...</p>
                </div>
              ) : (
                <>
                  {/* Tab 1: Lịch sử chẩn đoán lâm sàng */}
                  {activeTab === 'history' && (
                    <div className="space-y-6">
                      {!profile || profile.medicalRecords.length === 0 ? (
                        <div className="text-center py-16 text-zinc-400 dark:text-zinc-550 flex flex-col items-center justify-center gap-2">
                          <FileText size={24} />
                          <p className="text-xs font-bold">Chưa ghi nhận bệnh án nào từ chuyên gia y khoa</p>
                        </div>
                      ) : (
                        <div className="relative border-l border-zinc-150 dark:border-zinc-800 pl-6 space-y-6 ml-3">
                          {profile.medicalRecords.map((record) => (
                            <div key={record.id} className="relative group">
                              <div className="absolute -left-[31px] top-1.5 size-4 rounded-full bg-white dark:bg-zinc-900 border-2 border-primary group-hover:bg-primary transition-colors flex items-center justify-center">
                                <div className="size-1.5 rounded-full bg-primary group-hover:bg-white"></div>
                              </div>
                              
                              <div className="bg-zinc-50/50 dark:bg-zinc-855/20 border border-zinc-100 dark:border-zinc-800/80 rounded-2xl p-5 space-y-3">
                                <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400">
                                  <span className="flex items-center gap-1">
                                    <Activity size={12} className="text-primary" />
                                    BS khám: {record.ten_bac_si}
                                  </span>
                                  <span>{new Date(record.thoi_gian_tao).toLocaleDateString('vi-VN')}</span>
                                </div>

                                <div>
                                  <p className="text-[9px] text-zinc-400 dark:text-zinc-550 font-bold uppercase tracking-wider">Chẩn đoán y khoa</p>
                                  <p className="text-xs font-bold text-secondary dark:text-zinc-200 mt-0.5">{record.chan_doan}</p>
                                </div>

                                {record.chong_chi_dinh && (
                                  <div className="bg-rose-50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/30 px-3.5 py-2 rounded-xl">
                                    <p className="text-[8px] text-rose-550 font-bold uppercase tracking-wider">Chống chỉ định</p>
                                    <p className="text-[11px] font-bold text-rose-600 dark:text-rose-450 mt-0.5">{record.chong_chi_dinh}</p>
                                  </div>
                                )}

                                {(record.khuyen_nghi_dich_vu || record.khuyen_nghi_goi) && (
                                  <div className="flex gap-2 flex-wrap">
                                    {record.khuyen_nghi_dich_vu && (
                                      <span className="text-[8px] font-bold bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded uppercase tracking-tight">
                                        Dịch vụ lẻ: {record.khuyen_nghi_dich_vu}
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

                  {/* Tab 2: Tiến trình trị liệu */}
                  {activeTab === 'treatments' && (
                    <div className="space-y-6">
                      {!profile || profile.treatmentPlans.length === 0 ? (
                        <div className="text-center py-16 text-zinc-400 dark:text-zinc-550 flex flex-col items-center justify-center gap-2">
                          <Layers size={24} />
                          <p className="text-xs font-bold">Bệnh nhân chưa thực hiện liệu trình nào</p>
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
                                    Tiến trình: {plan.so_buoi_da_dung}/{plan.tong_so_buoi} buổi
                                  </span>
                                </div>
                              </div>

                              {/* Sessions List */}
                              <div className="p-4 space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin divide-y divide-zinc-50 dark:divide-zinc-800">
                                {plan.sessions.map((session) => (
                                  <div key={session.id} className="pt-3 first:pt-0 space-y-2">
                                    <div className="flex items-center justify-between text-[10px] font-bold">
                                      <span className="text-secondary dark:text-zinc-350">
                                        Buổi {session.so_thu_tu_buoi} • {session.ten_ky_thuat_vien || 'Kỹ thuật viên'}
                                      </span>
                                      <span className={`px-1.5 py-0.5 rounded text-[8px] ${
                                        session.trang_thai === 'hoan_thanh'
                                          ? 'bg-emerald-50 text-emerald-650'
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
                                            <AlertTriangle size={12} /> Cảnh báo đặc biệt: {session.canh_bao_dac_biet}
                                          </div>
                                        )}
                                        {session.ai_tom_tat_ngan && (
                                          <div className="md:col-span-2 border-t border-zinc-100/80 pt-2 flex items-center gap-1 text-[9px] text-primary font-bold">
                                            <TrendingUp size={12} /> Tiến trình phục hồi: {session.ai_tom_tat_ngan}
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
                </>
              )}
            </div>
          </>
        ) : (
          /* Placeholder State when no patient is selected */
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-zinc-400 dark:text-zinc-500 text-center gap-4">
            <div className="size-20 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center border border-zinc-100 dark:border-zinc-800 text-4xl shadow-inner">
              🗂️
            </div>
            <div className="max-w-xs space-y-1">
              <h3 className="font-extrabold text-secondary dark:text-zinc-300 text-sm">Hồ sơ bệnh án chi tiết</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                Vui lòng chọn một bệnh nhân từ danh sách bên trái để tra cứu toàn bộ lịch sử chẩn đoán lâm sàng và quá trình điều trị thực tế.
              </p>
            </div>
            <div className="bg-primary/5 dark:bg-primary/10 px-4 py-3 rounded-2xl border border-primary/20 max-w-sm flex items-start gap-2.5 text-left mt-2">
              <HeartHandshake className="text-primary size-5 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-black text-primary uppercase tracking-wider">Lưu ý chuyên môn</p>
                <p className="text-[10px] text-zinc-650 dark:text-zinc-400 font-semibold mt-0.5">
                  Việc đối chiếu tiến độ phục hồi qua ghi chú kỹ thuật viên giúp bác sĩ chẩn đoán chính xác hơn cho lần tái khám.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
