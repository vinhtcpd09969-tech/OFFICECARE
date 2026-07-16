import { useState, useMemo } from 'react';
import { 
  ChevronLeft, FileText, Printer, Stethoscope, Sparkles, 
  AlertTriangle, ChevronDown, ChevronUp, Calendar, MapPin, Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { resolveImageUrl } from '../../../utils/imageUrl';
import { getMinPaymentRequired, isPlanCancelled, resolveGrossBeforeExamDeduction } from '../../../utils/billing';
const getStaffRoleTitle = (staffName: string, roleId: number) => {
  const nameLower = (staffName || '').toLowerCase();
  if (nameLower.includes('ktv') || nameLower.includes('kỹ thuật viên') || nameLower.includes('kĩ thuật viên')) {
    return 'Kỹ thuật viên PHCN';
  }
  if (nameLower.includes('bs') || nameLower.includes('bác sĩ') || nameLower.includes('bác sỹ')) {
    return 'Bác sĩ chuyên khoa';
  }
  return roleId === 3 ? 'Bác sĩ chuyên khoa' : 'Kỹ thuật viên PHCN';
};

interface PatientEmrDetailProps {
  patient: any;
  onBack: () => void;
  showAdminInfo?: boolean;
}

export default function PatientEmrDetail({ patient, onBack, showAdminInfo = true }: PatientEmrDetailProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedAptId, setSelectedAptId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'plans' | 'history'>('plans');
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  const selectedPlan = useMemo(() => {
    return patient?.plans?.find((p: any) => p.id === selectedPlanId);
  }, [patient, selectedPlanId]);

  const selectedPlanSessions = useMemo(() => {
    const isPrepaidPackage = selectedPlan?.hinh_thuc_thanh_toan_goi === 'tra_thang' || selectedPlan?.hinh_thuc_thanh_toan_goi === 'tra_gop';
    const raw = patient?.appointments?.filter(
      (ap: any) => ap.phac_do_dieu_tri_id === selectedPlanId
    ) || [];
    // Buổi "không đến" của gói trả từng buổi (Nhóm A) không mất buổi — coi slot như chưa từng
    // đặt để cho đặt lại đúng buổi đó. Gói đã trả trước (Nhóm B) thì buổi không đến vẫn bị tính
    // tiêu thụ nên giữ lại để khóa slot (resolveNoShowOutcome, docs/BUSINESS_RULES.md).
    return raw.filter((ap: any) => {
      const isNoShow = ['khong_den', 'khach_khong_den', 'khach_khong_den_phat'].includes(ap.trang_thai);
      return !isNoShow || isPrepaidPackage;
    });
  }, [patient, selectedPlanId, selectedPlan]);

  const selectedPlanKtvs = useMemo(() => {
    return patient?.appointments
      ?.filter((ap: any) => ap.phac_do_dieu_tri_id === selectedPlanId && ap.loai !== 'KHAM')
      .map((ap: any) => ap.ten_nhan_su)
      .filter(Boolean) || [];
  }, [patient, selectedPlanId]);

  const uniqueSelectedPlanKtvs = useMemo(() => {
    return Array.from(new Set(selectedPlanKtvs));
  }, [selectedPlanKtvs]);

  const selectedPlanKtvsDisplay = useMemo(() => {
    return uniqueSelectedPlanKtvs.length > 0 ? uniqueSelectedPlanKtvs.join(', ') : 'Chưa phân công';
  }, [uniqueSelectedPlanKtvs]);

  // Find the exact next unscheduled session number
  const firstEmptySessionNum = useMemo(() => {
    if (!selectedPlan) return 1;
    for (let i = 1; i <= selectedPlan.tong_so_buoi; i++) {
      const apptExists = selectedPlanSessions.some((ap: any) => 
        ap.so_thu_tu_buoi === i && ap.loai !== 'KHAM'
      );
      if (!apptExists) {
        return i;
      }
    }
    return selectedPlan.tong_so_buoi + 1;
  }, [selectedPlan, selectedPlanSessions]);

  // Selected appointment details (for exam/single detail view)
  const selectedApt = useMemo(() => {
    return patient?.appointments?.find((ap: any) => ap.id === selectedAptId);
  }, [patient, selectedAptId]);

  const prescribedPlan = useMemo(() => {
    return selectedApt
      ? patient?.plans?.find((p: any) => p.cuoc_hen_id === selectedApt.id)
      : null;
  }, [patient, selectedApt]);

  const bookedApt = useMemo(() => {
    if (!prescribedPlan) return null;
    return patient?.appointments?.find((ap: any) => 
      String(ap.goi_dich_vu_id) === String(prescribedPlan.goi_dich_vu_id) && 
      ap.loai !== 'KHAM' && 
      ap.trang_thai !== 'da_huy'
    );
  }, [patient, prescribedPlan]);

  const handlePrint = () => {
    window.print();
  };



  return (
    <div className="space-y-6">
      {/* Back Button & Patient Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              if (selectedPlanId) {
                setSelectedPlanId(null);
              } else if (selectedAptId) {
                setSelectedAptId(null);
              } else {
                onBack();
              }
            }}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-650 hover:text-slate-850 hover:bg-slate-50 transition-all shadow-sm active:scale-95 shrink-0"
          >
            <ChevronLeft size={16} className="stroke-[3]" />
          </button>
          
          <div className="flex items-center gap-3.5">
            <div className="size-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 text-white flex items-center justify-center font-black text-sm uppercase shadow-md shadow-slate-950/15 border border-slate-700/10 shrink-0">
              {patient?.ho_ten?.charAt(0) || 'K'}
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 leading-tight">{patient?.ho_ten}</h3>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                <span className="font-extrabold font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded mr-1.5">
                  {'KH-' + patient?.id?.substring(0, 8).toUpperCase()}
                </span>
                {patient?.so_dien_thoai} • {selectedPlanId ? (
                  <>BS chỉ định: {selectedPlan?.ten_bac_si || 'N/A'} • KTV thực hiện: {selectedPlanKtvsDisplay}</>
                ) : (
                  <>Bệnh nhân điều trị tích hợp</>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-center">
          {selectedApt && selectedApt.loai === 'KHAM' && selectedApt.phac_do_dieu_tri_id && patient?.plans?.some((p: any) => p.id === selectedApt.phac_do_dieu_tri_id && p.trang_thai === 'dang_dieu_tri') && (
            <button
              onClick={() => {
                setSelectedPlanId(selectedApt.phac_do_dieu_tri_id);
                setSelectedAptId(null);
              }}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-teal-500/10 active:scale-95"
            >
              <FileText size={13} className="stroke-[2.5]" />
              <span>Xem phác đồ đã chỉ định</span>
            </button>
          )}
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200/50 rounded-xl text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
          >
            <Printer size={13} className="stroke-[2.5]" />
            <span>In hồ sơ</span>
          </button>
        </div>
      </div>



      {/* Render detail segments */}
      {!selectedPlanId && !selectedAptId ? (
        /* Patient Profile Hub View (when no specific plan or apt is selected) */
        <div className={showAdminInfo ? "grid grid-cols-1 lg:grid-cols-3 gap-6" : "w-full"}>
          {/* Left Column: Patient Profile Summary */}
          {showAdminInfo && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="size-14 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 text-white flex items-center justify-center font-black text-xl uppercase shadow-md shadow-teal-500/10 shrink-0">
                    {patient?.ho_ten?.charAt(0) || 'K'}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-805 leading-tight">{patient?.ho_ten}</h4>
                    <span className="text-[10px] text-slate-400 font-extrabold font-mono bg-slate-50 px-1.5 py-0.5 rounded inline-block mt-1.5">
                      {'KH-' + patient?.id?.substring(0, 8).toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-50 pt-4 space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Số điện thoại:</span>
                    <strong className="text-slate-700 font-bold">{patient?.so_dien_thoai}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Email:</span>
                    <strong className="text-slate-700 font-bold">{patient?.email || 'Chưa cung cấp'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Điểm uy tín:</span>
                    <strong className="text-teal-600 font-black">{patient?.diem_uy_tin || 0}đ</strong>
                  </div>
                </div>
              </div>

              {/* Quick statistics */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-3">
                <h4 className="text-xs font-black text-slate-805 uppercase tracking-wider">Thống kê hồ sơ</h4>
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div className="bg-slate-50 p-3 rounded-xl text-center">
                    <span className="text-[20px] font-black text-slate-850 block">
                      {patient?.plans?.filter((pl: any) => !pl.id.startsWith('virtual-')).length || 0}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">Phác đồ</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl text-center">
                    <span className="text-[20px] font-black text-slate-850 block">
                      {patient?.appointments?.filter((ap: any) => ap.trang_thai === 'hoan_thanh').length || 0}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">Buổi hoàn thành</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Right Column: EMR Content (Plans & History) */}
          <div className={showAdminInfo ? "lg:col-span-2 space-y-6" : "w-full space-y-6"}>
            {/* Tabs */}
            <div className="flex gap-4 border-b border-slate-100 pb-px">
              <button
                onClick={() => setActiveTab('plans')}
                className={`pb-2.5 px-1 text-xs font-black uppercase tracking-wider transition-all border-b-2 ${
                  activeTab === 'plans'
                    ? 'border-teal-650 text-teal-600 border-teal-600'
                    : 'border-transparent text-slate-450 hover:text-slate-750'
                }`}
              >
                Phác đồ điều trị ({patient?.plans?.filter((pl: any) => !pl.id.startsWith('virtual-')).length || 0})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`pb-2.5 px-1 text-xs font-black uppercase tracking-wider transition-all border-b-2 ${
                  activeTab === 'history'
                    ? 'border-teal-650 text-teal-600 border-teal-600'
                    : 'border-transparent text-slate-450 hover:text-slate-750'
                }`}
              >
                Lịch sử Khám & Dịch vụ lẻ ({
                  patient?.appointments?.filter(
                    (ap: any) => (!ap.phac_do_dieu_tri_id || ap.loai === 'KHAM') && ap.trang_thai === 'hoan_thanh'
                  ).length || 0
                })
              </button>
            </div>

            {/* Tab content: Plans */}
            {activeTab === 'plans' && (() => {
              const realPlans = patient?.plans?.filter((pl: any) => !pl.id.startsWith('virtual-')) || [];
              return (
                <div className="space-y-4">
                  {realPlans.length === 0 ? (
                    <div className="bg-white border border-slate-100 rounded-2xl py-12 text-center text-slate-400 font-semibold text-xs shadow-sm">
                      Bệnh nhân chưa có phác đồ điều trị nào.
                    </div>
                  ) : (
                    realPlans.map((pl: any) => {
                      const progressPercent = Math.min(100, Math.round(((pl.so_buoi_da_dung || 0) / (pl.tong_so_buoi || 10)) * 100));
                      return (
                        <div key={pl.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <span className={`inline-flex px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                                pl.trang_thai === 'dang_dieu_tri'
                                  ? 'bg-teal-50 text-teal-700 border border-teal-100/50'
                                  : pl.trang_thai === 'cho_kich_hoat'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-100/50'
                                    : 'bg-slate-100 text-slate-650'
                              }`}>
                                {pl.trang_thai === 'dang_dieu_tri' ? 'Đang điều trị' : pl.trang_thai === 'cho_kich_hoat' ? 'Chờ kích hoạt' : 'Hoàn thành'}
                              </span>
                              <h4 className="text-sm font-black text-slate-805 mt-1.5">{pl.ten_goi}</h4>
                              <p className="text-[10px] text-slate-400 font-semibold mt-1">
                                Bác sĩ: {pl.ten_bac_si || 'N/A'} • Ngày kích hoạt: {pl.ngay_kich_hoat ? format(new Date(pl.ngay_kich_hoat), 'dd/MM/yyyy') : 'N/A'}
                              </p>
                            </div>
                            <button
                              onClick={() => setSelectedPlanId(pl.id)}
                              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-[10px] transition-all"
                            >
                              Xem phác đồ
                            </button>
                          </div>

                          {/* Progress bar */}
                          <div className="space-y-1.5 pt-1">
                            <div className="flex justify-between text-[10px] font-bold text-slate-500">
                              <span>Tiến độ liệu trình: {pl.so_buoi_da_dung}/{pl.tong_so_buoi} buổi</span>
                              <span>{progressPercent}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div className="bg-teal-500 h-full rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })()}

            {/* Tab content: History */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                {patient?.appointments?.filter(
                  (ap: any) => (!ap.phac_do_dieu_tri_id || ap.loai === 'KHAM') && ap.trang_thai === 'hoan_thanh'
                ).length === 0 ? (
                  <div className="bg-white border border-slate-100 rounded-2xl py-12 text-center text-slate-400 font-semibold text-xs shadow-sm">
                    Bệnh nhân chưa có lịch sử ca khám hoặc dịch vụ lẻ nào.
                  </div>
                ) : (
                  patient?.appointments
                    ?.filter((ap: any) => (!ap.phac_do_dieu_tri_id || ap.loai === 'KHAM') && ap.trang_thai === 'hoan_thanh')
                    ?.map((ap: any) => {
                      const isFinished = ap.trang_thai === 'hoan_thanh';
                      return (
                        <div key={ap.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex justify-between items-center gap-4 hover:shadow-md transition-shadow">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                                ap.loai === 'KHAM' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-650'
                              }`}>
                                {ap.loai === 'KHAM' ? 'Khám lâm sàng' : 'Dịch vụ lẻ'}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                                isFinished ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                              }`}>
                                {isFinished ? 'Đã hoàn thành' : 'Đã đặt lịch'}
                              </span>
                            </div>
                            <h4 className="text-xs font-black text-slate-800">{ap.ten_dich_vu || (ap.loai === 'KHAM' ? 'Khám lâm sàng & Lượng giá' : 'Trị liệu dịch vụ lẻ')}</h4>
                            <p className="text-[10px] text-slate-400 font-semibold">
                              {format(new Date(ap.ngay_gio_bat_dau), 'dd/MM/yyyy HH:mm')} • Thực hiện: {ap.ten_nhan_su || 'Chưa phân công'}
                            </p>
                          </div>
                          <button
                            onClick={() => setSelectedAptId(ap.id)}
                            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-[10px] transition-all shrink-0"
                          >
                            Chi tiết
                          </button>
                        </div>
                      );
                    })
                )}
              </div>
            )}
          </div>
        </div>
      ) : selectedPlanId && selectedPlan ? (
        /* Phác đồ chi tiết sub-view */
        <div className="space-y-6">
          {/* Phác đồ summary */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-50 pb-3">
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase block tracking-wider">Phác đồ điều trị</span>
                <h3 className="text-base font-black text-slate-800 mt-0.5">{selectedPlan.ten_goi}</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                  selectedPlan.trang_thai === 'dang_dieu_tri' 
                    ? 'bg-teal-100 text-teal-800' 
                    : selectedPlan.trang_thai === 'cho_kich_hoat'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-800'
                }`}>
                  {selectedPlan.trang_thai === 'dang_dieu_tri' 
                    ? 'Đang chạy' 
                    : selectedPlan.trang_thai === 'cho_kich_hoat'
                      ? 'Chờ kích hoạt'
                      : 'Hoàn thành'}
                </span>
                {selectedPlan.trang_thai === 'cho_kich_hoat' && selectedPlan.loai_goi !== 'LE' && (
                  <button
                    type="button"
                    onClick={() => {
                      const basePath = window.location.pathname.startsWith('/receptionist') ? '/receptionist' : '/admin';
                      if (selectedPlan.cuoc_hen_id) {
                        window.location.href = `${basePath}/quick-billing?lich_dat_id=${selectedPlan.cuoc_hen_id}`;
                      } else {
                        window.location.href = `${basePath}/quick-billing?customer_id=${patient.id}&goi_dich_vu_id=${selectedPlan.goi_dich_vu_id}&lich_dieu_tri_id=${selectedPlan.id}`;
                      }
                    }}
                    className="px-3 py-1.5 bg-teal-650 hover:bg-teal-700 text-white rounded-lg font-bold text-[11px] transition-all shadow-sm flex items-center gap-1 active:scale-95 cursor-pointer"
                  >
                    <span>💵 Thanh toán & Kích hoạt</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Bác sĩ chỉ định</span>
                <strong className="text-slate-805 block mt-1">{selectedPlan.ten_bac_si || 'BS. Nguyễn Văn Khoa'}</strong>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Ngày lập</span>
                <strong className="text-slate-805 block mt-1">
                  {selectedPlan.ngay_kich_hoat ? format(new Date(selectedPlan.ngay_kich_hoat), 'dd/MM/yyyy') : 'N/A'}
                </strong>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Tổng số buổi</span>
                <strong className="text-slate-805 block mt-1">{selectedPlan.tong_so_buoi} buổi</strong>
              </div>
            </div>
          </div>

          {/* Hồ sơ Khám lâm sàng & Lượng giá */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-55/40 pb-3">
              <FileText size={16} className="text-teal-600 stroke-[2.5]" />
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Hồ sơ Khám lâm sàng & Lượng giá của Bác sĩ</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 p-3.5 bg-teal-50/20 border border-teal-100/30 rounded-xl">
                <span className="text-[10px] font-black text-teal-750 uppercase tracking-widest block">Chẩn đoán y khoa</span>
                <p className="text-xs font-bold text-teal-955 leading-relaxed">
                  {selectedPlan.chan_doan || 'Chưa có chẩn đoán cụ thể.'}
                </p>
              </div>

              <div className="space-y-1.5 p-3.5 bg-rose-50/20 border border-rose-100/30 rounded-xl">
                <span className="text-[10px] font-black text-rose-800 uppercase tracking-widest block flex items-center gap-1">
                  <AlertTriangle size={12} className="text-rose-505" /> Chống chỉ định y khoa (Bác sĩ lưu ý)
                </span>
                <p className="text-xs font-black text-rose-950 leading-relaxed">
                  {selectedPlan.chong_chi_dinh && selectedPlan.chong_chi_dinh !== '1' ? selectedPlan.chong_chi_dinh : 'Không ghi nhận chống chỉ định.'}
                </p>
              </div>
            </div>

            {selectedPlan.ghi_chu_kham && (
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-650 leading-relaxed">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Hướng điều trị & Ghi chú của Bác sĩ</span>
                 "{selectedPlan.ghi_chu_kham}"
              </div>
            )}
          </div>

          {/* Collapsible Session List */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-50 pb-3">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Các buổi điều trị</h4>
            </div>

            <div className="space-y-3">
              {Array.from({ length: selectedPlan.tong_so_buoi }).map((_, index) => {
                const sessionNum = index + 1;
                const appt = selectedPlanSessions.find((ap: any) => ap.so_thu_tu_buoi === sessionNum && ap.loai !== 'KHAM');
                const isUnbooked = !appt && sessionNum === firstEmptySessionNum;
                const isFinished = appt?.trang_thai === 'hoan_thanh';
                // Sau khi lọc ở selectedPlanSessions, appt không đến còn sót lại luôn thuộc gói
                // Nhóm B (đã trả trước) — buổi đã bị tính tiêu thụ, không cho đặt lại.
                const isNoShowForfeited = ['khong_den', 'khach_khong_den', 'khach_khong_den_phat'].includes(appt?.trang_thai);

                if (appt) {
                  const isExpanded = expandedSessionId === appt.id;
                  const initial = appt.ten_nhan_su?.trim()?.charAt(0)?.toUpperCase() || '?';
                  return (
                    <div 
                      key={appt.id} 
                      className={`border rounded-xl overflow-hidden bg-white transition-all duration-300 ${
                        isExpanded ? 'border-indigo-105 shadow-sm ring-1 ring-indigo-50/50' : 'border-slate-100 hover:border-slate-200 shadow-sm'
                      }`}
                    >
                      {/* Summary Row */}
                      <div 
                        onClick={() => setExpandedSessionId(isExpanded ? null : appt.id)}
                        className="p-4 flex justify-between items-center gap-4 cursor-pointer select-none hover:bg-slate-50/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`size-8 rounded-xl flex items-center justify-center shrink-0 font-black text-[11px] border shadow-sm ${
                            isFinished ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : isNoShowForfeited ? 'bg-slate-100 text-slate-400 border-slate-200/50' : 'bg-amber-50 text-amber-700 border-amber-100'
                          }`}>
                            {sessionNum}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                                isFinished ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/50' : isNoShowForfeited ? 'bg-slate-100 text-slate-400 border border-slate-200/50' : 'bg-amber-50 text-amber-700 border border-amber-100/50'
                              }`}>
                                {isFinished ? 'Hoàn thành' : isNoShowForfeited ? 'Không đến (đã tính phí)' : 'Đã đặt lịch'}
                              </span>
                              <strong className="text-xs font-black text-slate-800">
                                Buổi {sessionNum} • Trị liệu phục hồi
                              </strong>
                            </div>
                            <p className="text-[10px] text-slate-400 font-semibold mt-1">
                              {format(new Date(appt.ngay_gio_bat_dau), 'dd/MM/yyyy HH:mm')} • Thực hiện: {appt.ten_nhan_su || 'Chưa phân công'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {appt.vas_truoc !== null && (
                            <span className="text-[9px] font-black bg-slate-50 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-lg">
                              VAS: {appt.vas_truoc} ➔ {appt.vas_sau}
                            </span>
                          )}
                          {isExpanded ? <ChevronUp size={14} className="text-slate-455 stroke-[2.5]" /> : <ChevronDown size={14} className="text-slate-455 stroke-[2.5]" />}
                        </div>
                      </div>

                      {/* Expanded Section */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-3 border-t border-slate-100/60 bg-slate-50/15 space-y-4 animate-fade-in text-xs">
                          {/* Expert Profile Card */}
                          <div className="bg-white border border-slate-100 rounded-xl p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm">
                            <div className="flex items-center gap-3">
                              {appt.anh_nhan_su ? (
                                <img
                                  src={resolveImageUrl(appt.anh_nhan_su)}
                                  alt={appt.ten_nhan_su}
                                  className="size-10 rounded-full object-cover border border-slate-100 shadow-sm shrink-0"
                                />
                              ) : (
                                <div className="size-10 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm shrink-0">
                                  {initial}
                                </div>
                              )}
                              <div>
                                <h5 className="font-extrabold text-slate-800">{appt.ten_nhan_su || 'Chưa phân công'}</h5>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">
                                  {getStaffRoleTitle(appt.ten_nhan_su, appt.vai_tro_id)}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col sm:items-end gap-1 text-[10px] text-slate-500 font-semibold">
                              <span className="flex items-center gap-1">
                                <Calendar size={11} className="text-slate-400 stroke-[2.25]" />
                                {format(new Date(appt.ngay_gio_bat_dau), 'EEEE, dd/MM/yyyy')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock size={11} className="text-slate-400 stroke-[2.25]" />
                                {format(new Date(appt.ngay_gio_bat_dau), 'HH:mm')} - {format(new Date(appt.ngay_gio_ket_thuc), 'HH:mm')}
                              </span>
                              {appt.ten_phong && (
                                <span className="flex items-center gap-1">
                                  <MapPin size={11} className="text-slate-400 stroke-[2.25]" />
                                  {appt.ten_phong}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Notes/Outcome */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {appt.chan_doan_tri_lieu && (
                              <div className="p-3 bg-teal-50/10 border border-teal-100/20 rounded-xl">
                                <span className="text-[9px] font-black text-teal-700 uppercase tracking-widest block mb-1">Nhật ký trị liệu của KTV</span>
                                <p className="text-slate-700 font-bold leading-relaxed">{appt.chan_doan_tri_lieu}</p>
                              </div>
                            )}

                            {appt.chong_chi_dinh_tri_lieu && (
                              <div className="p-3 bg-rose-50/20 border border-rose-100/20 rounded-xl">
                                <span className="text-[9px] font-black text-rose-700 uppercase tracking-widest block mb-1 flex items-center gap-1">
                                  <AlertTriangle size={11} /> Ghi nhận chống chỉ định
                                </span>
                                <p className="text-rose-950 font-black leading-relaxed">{appt.chong_chi_dinh_tri_lieu}</p>
                              </div>
                            )}
                          </div>

                          {appt.ghi_chu_tri_lieu && (
                            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Ghi chú & Hướng dẫn phục hồi</span>
                              <p className="text-slate-650 italic">"{appt.ghi_chu_tri_lieu}"</p>
                            </div>
                          )}

                          {/* Pain Scale Visualizer */}
                          {appt.vas_truoc !== null && appt.vas_sau !== null && (
                            <div className="space-y-1.5 pt-2.5 border-t border-slate-100/70">
                              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                                <span>Chỉ số đau (VAS Pain Scale):</span>
                                <span className="text-slate-800 font-extrabold">
                                  Cảm giác đau giảm: VAS {appt.vas_truoc} (Trước) ➔ VAS {appt.vas_sau} (Sau)
                                </span>
                              </div>
                              <div className="relative w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex items-center px-1">
                                <div 
                                  className="absolute h-2 bg-gradient-to-r from-teal-500 to-rose-500 rounded-full"
                                  style={{
                                    left: `${(appt.vas_sau || 0) * 10}%`,
                                    right: `${100 - (appt.vas_truoc || 10) * 10}%`
                                  }}
                                />
                                <span className="absolute text-[8px] font-black text-teal-800 font-mono" style={{ left: `${(appt.vas_sau || 0) * 10}%`, transform: 'translateY(-1px)' }}>
                                  ▲ {appt.vas_sau}
                                </span>
                                <span className="absolute text-[8px] font-black text-rose-800 font-mono" style={{ left: `${(appt.vas_truoc || 0) * 10}%`, transform: 'translateY(-1px)' }}>
                                  ▲ {appt.vas_truoc}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                } else if (isUnbooked) {
                   const isCancelled = isPlanCancelled(selectedPlan);
                   const isUnpaid = !isCancelled && selectedPlan.trang_thai === 'cho_kich_hoat' && selectedPlan.loai_goi !== 'LE';

                   const prevAppt = sessionNum > 1
                     ? selectedPlanSessions.find((ap: any) => ap.so_thu_tu_buoi === sessionNum - 1 && ap.loai !== 'KHAM')
                     : null;
                   // prevAppt không đến còn sót lại (sau filter ở selectedPlanSessions) luôn thuộc
                   // gói Nhóm B — buổi đã bị tính tiêu thụ nên vẫn coi là "xong" để mở buổi kế tiếp.
                   const isPrevNoShowForfeited = ['khong_den', 'khach_khong_den', 'khach_khong_den_phat'].includes(prevAppt?.trang_thai);
                   const isPrevFinished = sessionNum === 1 || (prevAppt && (prevAppt.trang_thai === 'hoan_thanh' || isPrevNoShowForfeited));

                   const grossBeforeExamDeduction = resolveGrossBeforeExamDeduction(selectedPlan);
                   const minRequired = getMinPaymentRequired(
                     selectedPlan.hinh_thuc_thanh_toan_goi || 'tra_thang',
                     Number(selectedPlan.tong_tien_phai_tra || 0),
                     Number(selectedPlan.tong_so_buoi || 10),
                     sessionNum,
                     grossBeforeExamDeduction
                   );
                   const soTienDaTra = Number(selectedPlan.so_tien_da_tra || 0);
                   const isPaymentBlocked = !isCancelled && selectedPlan.loai_goi !== 'LE' && soTienDaTra < minRequired;
                   const isBlocked = isCancelled || !isPrevFinished || isPaymentBlocked;
                   const blockMessage = isCancelled
                     ? '🚫 Gói đã bị hủy và hoàn tiền — không thể đặt thêm buổi điều trị.'
                     : (!isPrevFinished
                         ? `⚠️ Vui lòng hoàn thành buổi điều trị số ${sessionNum - 1} để đặt lịch buổi này.`
                         : (selectedPlan.hinh_thuc_thanh_toan_goi === 'tra_gop'
                             ? `⚠️ Vui lòng thanh toán Đợt 2 của gói trả góp để đặt lịch buổi này.`
                             : `⚠️ Vui lòng thanh toán liệu trình để đặt lịch buổi này.`));

                   return (
                     <div key={sessionNum} className={`border rounded-xl p-4 flex justify-between items-center gap-4 ${
                       isCancelled
                         ? 'border-rose-100 bg-rose-50/20 opacity-75'
                         : isUnpaid || isBlocked
                           ? 'border-amber-100 bg-amber-50/10 opacity-80'
                           : 'border-sky-100 bg-sky-50/30'
                     }`}>
                       <div>
                         <div className="flex items-center gap-2">
                           <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                             isCancelled
                               ? 'bg-rose-50 text-rose-600 border border-rose-200'
                               : isUnpaid ? 'bg-amber-100 text-amber-800 border border-amber-200' : (isBlocked ? 'bg-slate-100 text-slate-500 border border-slate-200' : 'bg-sky-100 text-sky-850')
                           }`}>
                             {isCancelled ? 'Đã hủy gói' : (isUnpaid ? 'Chờ kích hoạt' : (isBlocked ? 'Chưa đủ điều kiện' : 'Chưa đặt lịch'))}
                           </span>
                           <strong className="text-xs font-black text-slate-800">
                             Buổi {sessionNum} • Trị liệu phục hồi
                           </strong>
                         </div>
                         <p className="text-[10px] text-slate-500 font-semibold mt-1">
                           {isUnpaid 
                             ? '⚠️ Vui lòng kích hoạt và thanh toán gói để bắt đầu đặt lịch.' 
                             : (isBlocked ? blockMessage : 'Sẵn sàng để lên lịch đặt chỗ.')}
                         </p>
                       </div>
                       
                       {isUnpaid ? (
                         <button
                           type="button"
                           onClick={() => {
                             const basePath = window.location.pathname.startsWith('/receptionist') ? '/receptionist' : '/admin';
                             window.location.href = `${basePath}/quick-billing?customer_id=${patient.id}&goi_dich_vu_id=${selectedPlan.goi_dich_vu_id}&dang_ky_goi=true`;
                           }}
                           className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
                         >
                           Kích hoạt ngay
                         </button>
                       ) : isPaymentBlocked && isPrevFinished && selectedPlan.hoa_don_id ? (
                        <button
                          type="button"
                          onClick={() => {
                            const basePath = window.location.pathname.startsWith('/receptionist') ? '/receptionist/billing' : '/admin/finance';
                            window.location.href = `${basePath}?hoa_don_id=${selectedPlan.hoa_don_id}`;
                          }}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
                        >
                          💵 {selectedPlan.hinh_thuc_thanh_toan_goi === 'tra_gop' ? 'Thanh toán Đợt 2' : 'Thanh toán gói'}
                        </button>
                      ) : isBlocked ? (
                        <button
                          disabled
                          className="px-4 py-2 bg-slate-200 text-slate-400 rounded-xl text-xs font-bold cursor-not-allowed shrink-0"
                        >
                          Đặt lịch
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            const basePath = window.location.pathname.startsWith('/receptionist') ? '/receptionist' : '/admin';
                            window.location.href = `${basePath}/appointments?khach_hang_id=${patient.id}&goi_dich_vu_id=${selectedPlan.goi_dich_vu_id}`;
                          }}
                          className="px-4 py-2 bg-sky-650 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
                        >
                          Đặt lịch
                        </button>
                      )}
                     </div>
                   );
                } else {
                  return (
                    <div key={sessionNum} className="border border-dashed border-slate-100 rounded-xl p-4 flex justify-between items-center gap-4 opacity-50 bg-slate-50/20">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-500">
                            Chưa tới hạn
                          </span>
                          <strong className="text-xs font-bold text-slate-500">
                            Buổi {sessionNum} • Trị liệu phục hồi
                          </strong>
                        </div>
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          </div>
        </div>
      ) : selectedApt ? (
        // Render 2: Single Service or Exam Detail View
        <div className="space-y-6">
          {/* Gói chỉ định từ ca khám */}
          {prescribedPlan && prescribedPlan.trang_thai === 'cho_kich_hoat' && (
            prescribedPlan.loai_goi === 'LE' ? (
              <div className="border border-sky-200 bg-gradient-to-r from-sky-50/70 via-sky-50/30 to-white text-sky-900 rounded-2xl p-5 shadow-sm shadow-sky-500/5 transition-all duration-300">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-start gap-3">
                    <div className="size-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm bg-sky-100 text-sky-700">
                      <Stethoscope size={18} className="stroke-[2.5]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                          Dịch vụ lẻ chỉ định từ ca khám
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                          !bookedApt
                            ? 'bg-sky-100 text-sky-800 border-sky-200'
                            : bookedApt.trang_thai === 'hoan_thanh'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border-amber-200'
                        }`}>
                          {!bookedApt ? 'Chưa đặt lịch' : bookedApt.trang_thai === 'hoan_thanh' ? 'Đã hoàn thành' : 'Đã đặt lịch'}
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-slate-800 mt-1">
                        {prescribedPlan.ten_goi} ({prescribedPlan.tong_so_buoi} buổi)
                      </h4>
                      <p className="text-[10px] text-slate-505 font-semibold mt-0.5">
                        {bookedApt
                          ? `Lịch hẹn: ${format(new Date(bookedApt.ngay_gio_bat_dau), 'dd/MM/yyyy HH:mm')} • KTV ${bookedApt.ten_nhan_su || 'Chưa phân công'}`
                          : 'Bác sĩ đã chỉ định dịch vụ lẻ này. Khách hàng sẽ thanh toán sau khi thực hiện dịch vụ.'}
                      </p>
                    </div>
                  </div>

                  {!bookedApt && (
                    <button
                      type="button"
                      onClick={() => {
                        const basePath = window.location.pathname.startsWith('/receptionist') ? '/receptionist' : '/admin';
                        window.location.href = `${basePath}/appointments?khach_hang_id=${patient.id}&goi_dich_vu_id=${prescribedPlan.goi_dich_vu_id}`;
                      }}
                      className="px-4.5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-black shadow-md shadow-sky-500/10 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <span>📅 Đặt lịch hẹn</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="border border-amber-200 bg-gradient-to-r from-amber-50/70 via-amber-50/30 to-white text-amber-900 rounded-2xl p-5 shadow-sm shadow-amber-500/5 transition-all duration-300">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm bg-amber-100 text-amber-700`}>
                      <Stethoscope size={18} className="stroke-[2.5]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                          Gói chỉ định từ ca khám này
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-200">
                          Chờ kích hoạt
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-slate-800 mt-1">
                        {prescribedPlan.ten_goi} ({prescribedPlan.tong_so_buoi} buổi)
                      </h4>
                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                        Bác sĩ đã chỉ định phác đồ điều trị này. Vui lòng thanh toán để kích hoạt và bắt đầu buổi trị liệu.
                      </p>
                      {prescribedPlan.han_kich_hoat && (() => {
                        const daysLeft = Math.ceil(
                          (new Date(prescribedPlan.han_kich_hoat).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                        );
                        return (
                          <p className={`text-[10px] font-bold mt-1 ${daysLeft <= 3 ? 'text-red-600' : 'text-amber-700'}`}>
                            ⏱ {daysLeft > 0 ? `Còn ${daysLeft} ngày để kích hoạt` : 'Hết hạn hôm nay'}
                          </p>
                        );
                      })()}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const basePath = window.location.pathname.startsWith('/receptionist') ? '/receptionist' : '/admin';
                      window.location.href = `${basePath}/quick-billing?lich_dat_id=${prescribedPlan.cuoc_hen_id}&dang_ky_goi=true`;
                    }}
                    className="px-4.5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black shadow-md shadow-amber-500/10 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <span>💵 Thanh toán & Kích hoạt gói</span>
                  </button>
                </div>
              </div>
            )
          )}

          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-5 animate-fade-in">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`size-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                  selectedApt.loai === 'KHAM' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-sky-50 text-sky-700 border border-sky-100'
                }`}>
                  {selectedApt.loai === 'KHAM' ? <Stethoscope size={20} className="stroke-[2.25]" /> : <Sparkles size={20} className="stroke-[2.25]" />}
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">
                    {selectedApt.loai === 'KHAM' ? 'Ca khám lâm sàng & lượng giá' : 'Ca trị liệu dịch vụ lẻ'}
                  </span>
                  <h3 className="text-sm font-black text-slate-800 leading-tight">
                    {selectedApt.ten_dich_vu || (selectedApt.loai === 'KHAM' ? 'Khám lâm sàng & Lượng giá' : 'Trị liệu phục hồi')}
                  </h3>
                </div>
              </div>

              {selectedApt.gia_dich_vu != null && (
                <div className="text-right">
                  <span className="text-[9px] font-black uppercase text-slate-400 block">Chi phí dịch vụ</span>
                  <span className="text-xs font-black text-slate-900 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                    {Number(selectedApt.gia_dich_vu).toLocaleString('vi-VN')}đ
                  </span>
                </div>
              )}
            </div>

            {/* Time & Expert row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Expert Card */}
              <div className="border border-slate-100 rounded-xl p-4 flex items-center gap-4 bg-slate-50/20 shadow-sm">
                {selectedApt.anh_nhan_su ? (
                  <img
                    src={resolveImageUrl(selectedApt.anh_nhan_su)}
                    alt={selectedApt.ten_nhan_su}
                    className="size-12 rounded-full object-cover border border-slate-200 shadow-sm shrink-0"
                  />
                ) : (
                  <div className="size-12 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-black text-base shrink-0">
                    {selectedApt.ten_nhan_su?.trim()?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Chuyên gia phụ trách</span>
                  <h4 className="text-sm font-black text-slate-800 mt-0.5">{selectedApt.ten_nhan_su || 'Chưa phân công'}</h4>
                  <span className="text-[9px] font-bold text-indigo-650 bg-indigo-50 border border-indigo-100/50 px-2.5 py-0.5 rounded-full inline-block mt-1">
                    {getStaffRoleTitle(selectedApt.ten_nhan_su, selectedApt.vai_tro_id)}
                  </span>
                </div>
              </div>

              {/* Time Card */}
              <div className="border border-slate-100 rounded-xl p-4 flex flex-col justify-center gap-1.5 bg-slate-50/20 text-xs text-slate-600 font-semibold shadow-sm">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Thời gian thực hiện</span>
                <span className="flex items-center gap-2">
                  <Calendar size={13} className="text-slate-400 shrink-0" />
                  {format(new Date(selectedApt.ngay_gio_bat_dau), 'EEEE, dd/MM/yyyy')}
                </span>
                <span className="flex items-center gap-2">
                  <Clock size={13} className="text-slate-400 shrink-0" />
                  {format(new Date(selectedApt.ngay_gio_bat_dau), 'HH:mm')} - {format(new Date(selectedApt.ngay_gio_ket_thuc), 'HH:mm')}
                </span>
                {selectedApt.ten_phong && (
                  <span className="flex items-center gap-2">
                    <MapPin size={13} className="text-slate-400 shrink-0" />
                    {selectedApt.ten_phong}
                  </span>
                )}
              </div>
            </div>

            {/* Pain Scale visualizer if available */}
            {selectedApt.vas_truoc !== null && selectedApt.vas_sau !== null && (
              <div className="border border-slate-100 rounded-xl p-4 space-y-2 bg-slate-50/10">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                  <span>Kết quả lượng giá đau (VAS Pain Scale):</span>
                  <span className="text-slate-800 font-extrabold">
                    VAS {selectedApt.vas_truoc} (Trước) ➔ VAS {selectedApt.vas_sau} (Sau)
                  </span>
                </div>
                <div className="relative w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex items-center px-1">
                  <div 
                    className="absolute h-2 bg-gradient-to-r from-teal-500 to-rose-500 rounded-full"
                    style={{
                      left: `${(selectedApt.vas_sau || 0) * 10}%`,
                      right: `${100 - (selectedApt.vas_truoc || 10) * 10}%`
                    }}
                  />
                  <span className="absolute text-[8px] font-black text-teal-800 font-mono" style={{ left: `${(selectedApt.vas_sau || 0) * 10}%`, transform: 'translateY(-1px)' }}>
                    ▲ {selectedApt.vas_sau}
                  </span>
                  <span className="absolute text-[8px] font-black text-rose-800 font-mono" style={{ left: `${(selectedApt.vas_truoc || 0) * 10}%`, transform: 'translateY(-1px)' }}>
                    ▲ {selectedApt.vas_truoc}
                  </span>
                </div>
              </div>
            )}

            {/* Diagnostics and Treatment journal */}
            <div className="space-y-4 pt-2">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                Kết quả khám lâm sàng & Điều trị
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 p-3.5 bg-teal-50/20 border border-teal-100/30 rounded-xl">
                  <span className="text-[9px] font-black text-teal-855 uppercase tracking-widest block">Chẩn đoán / Ghi chép trị liệu</span>
                  <p className="text-xs font-bold text-teal-950 leading-relaxed">
                    {selectedApt.chan_doan_tri_lieu || 'Đang chờ cập nhật chẩn đoán.'}
                  </p>
                </div>

                <div className="space-y-1.5 p-3.5 bg-rose-50/20 border border-rose-100/30 rounded-xl">
                  <span className="text-[9px] font-black text-rose-850 uppercase tracking-widest block flex items-center gap-1">
                    <AlertTriangle size={12} className="text-rose-500" /> Chống chỉ định lâm sàng
                  </span>
                  <p className="text-xs font-black text-rose-955 leading-relaxed">
                    {selectedApt.chong_chi_dinh_tri_lieu || 'Không ghi nhận chống chỉ định.'}
                  </p>
                </div>
              </div>

              {selectedApt.ghi_chu_tri_lieu && (
                <div className="pt-2 text-xs">
                  <span className="text-[9px] text-slate-400 block font-mono uppercase">Ghi chú & Chỉ định thêm</span>
                  <p className="text-slate-700 italic mt-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    "{selectedApt.ghi_chu_tri_lieu}"
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
