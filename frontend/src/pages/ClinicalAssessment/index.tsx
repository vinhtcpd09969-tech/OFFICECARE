import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Stethoscope, Activity, CheckCircle2, FileText, Monitor } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { PatientHeaderBanner } from '../../features/clinical/components/PatientHeaderBanner';
import { SpecialistAssessmentDesk } from '../../features/clinical/components/SpecialistAssessmentDesk';
import { TechnicianTreatmentDesk } from '../../features/clinical/components/TechnicianTreatmentDesk';
import { EmbeddedPatientEmrView } from '../../features/clinical/components/EmbeddedPatientEmrView';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import {
  getAppointmentDetail as getAppointmentDetailDoctor,
  getPackages,
  saveAssessment,
  saveAssessmentDraft as saveAssessmentDraftDoctor,
  getDoctorQueue,
  getActiveSession as getActiveSessionDoctor,
} from '../../features/doctor/api/doctor.api';
import {
  getAppointmentDetail as getAppointmentDetailKtv,
  saveTreatmentRecord,
  saveTreatmentDraft,
  getActiveSession as getActiveSessionKtv,
} from '../../features/technician/api/technician.api';
import { useAuthStore } from '../../stores/authStore';

export function ClinicalAssessment() {
  const params = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isKtv = user?.vai_tro_id === 3;

  const [packages, setPackages] = useState<any[]>([]);
  const [activeDeskTab, setActiveDeskTab] = useState<'desk' | 'emr'>('desk');

  // ==== NHÁNH CHUYÊN VIÊN — đúng 1 bàn ====
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | undefined>(
    !isKtv ? params.id : undefined
  );
  const [currentAppointment, setCurrentAppointment] = useState<any>(null);

  // ==== NHÁNH KTV — tối đa 2 bàn trị liệu song song ====
  const [ktvOpenAppointments, setKtvOpenAppointments] = useState<Record<string, any>>({});
  const [ktvActiveId, setKtvActiveId] = useState<string | undefined>(undefined);
  const [overtimeConfirm, setOvertimeConfirm] = useState<{ id: string; message: string } | null>(null);
  const ktvOpenIds = Object.keys(ktvOpenAppointments);

  const loadQueueData = async () => {
    try {
      if (user?.id && !isKtv) {
        await getDoctorQueue();
      }
    } catch (err) {
      console.error('Lỗi tải hàng đợi:', err);
    }
  };

  // ---- Chuyên viên: đồng bộ route -> selectedAppointmentId
  useEffect(() => {
    if (isKtv) return;
    const routeId = params.id;
    if (routeId) {
      setSelectedAppointmentId(routeId);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await getActiveSessionDoctor();
        if (!cancelled && res.data?.id) {
          navigate(`/doctor/appointments/${res.data.id}/assess`, { replace: true });
        }
      } catch (err) {
        console.error('Lỗi kiểm tra ca đang mở:', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isKtv, params.id, navigate]);

  // ---- Chuyên viên: tải chi tiết ca + danh mục gói
  useEffect(() => {
    if (isKtv || !selectedAppointmentId) return;
    let cancelled = false;
    (async () => {
      try {
        const [aptRes, pkgRes] = await Promise.all([
          getAppointmentDetailDoctor(selectedAppointmentId!),
          getPackages(),
        ]);
        if (cancelled) return;
        setCurrentAppointment(aptRes.data);
        setPackages(pkgRes.data || []);
      } catch (err: any) {
        if (cancelled) return;
        console.error('Lỗi khi tải chi tiết ca:', err);
        toast.error(err?.response?.data?.message || 'Không mở được ca khám này.');
        navigate('/doctor/appointments');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isKtv, selectedAppointmentId]);

  // ---- KTV: đồng bộ route + tải TOÀN BỘ các bàn đang 'dang_kham' của KTV này
  useEffect(() => {
    if (!isKtv) return;
    const routeId = params.id;
    let cancelled = false;

    (async () => {
      try {
        // 1. Lấy tất cả ca đang 'dang_kham' của KTV này từ server
        const resSessions = await getActiveSessionKtv();
        if (cancelled) return;
        const activeList = resSessions.data || [];

        // Tập hợp danh sách ID cần tải chi tiết
        const idsToFetch = new Set<string>(activeList.map((s) => s.id));
        if (routeId) {
          idsToFetch.add(routeId);
        }

        if (idsToFetch.size === 0) {
          setKtvOpenAppointments({});
          setKtvActiveId(undefined);
          return;
        }

        // Tải song song chi tiết tất cả các bàn đang mở
        const detailPromises = Array.from(idsToFetch).map(async (id) => {
          try {
            const detailRes = await getAppointmentDetailKtv(id);
            return { id, data: detailRes.data };
          } catch (err: any) {
            const errorCode = err?.response?.data?.errorCode;
            const message = err?.response?.data?.message || 'Không mở được bàn trị liệu này.';
            if (errorCode === 'SHIFT_OVERTIME_WARNING' && id === routeId) {
              setOvertimeConfirm({ id, message });
            }
            return null;
          }
        });

        const results = await Promise.all(detailPromises);
        if (cancelled) return;

        const newMap: Record<string, any> = {};
        results.forEach((r) => {
          if (r && r.data) {
            newMap[r.id] = r.data;
          }
        });

        setKtvOpenAppointments(newMap);

        if (routeId && newMap[routeId]) {
          setKtvActiveId(routeId);
        } else if (activeList.length > 0 && newMap[activeList[0].id]) {
          setKtvActiveId(activeList[0].id);
          if (!routeId) {
            navigate(`/technician/appointments/${activeList[0].id}/assess`, { replace: true });
          }
        }
      } catch (err) {
        console.error('Lỗi tải danh sách bàn KTV đang mở:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isKtv, params.id]);

  const confirmOvertimeOpen = async () => {
    if (!overtimeConfirm) return;
    const { id } = overtimeConfirm;
    setOvertimeConfirm(null);
    try {
      const res = await getAppointmentDetailKtv(id, true);
      setKtvOpenAppointments((prev) => ({ ...prev, [id]: res.data }));
      setKtvActiveId(id);
    } catch (err: any) {
      console.error('Lỗi khi mở bàn 2:', err);
      toast.error(err?.response?.data?.message || 'Không mở được bàn trị liệu này.');
      navigate('/technician/appointments');
    }
  };

  const cancelOvertimeOpen = () => {
    setOvertimeConfirm(null);
    navigate('/technician/appointments');
  };

  // Nộp kết quả Hoàn thành Lượng Giá
  const handleCompleteAssessment = async (data: any) => {
    if (!selectedAppointmentId) return;

    await saveAssessment({
      lich_dat_id: selectedAppointmentId,
      chan_doan: data.clinicalConclusion?.trim() || 'Chưa điền',
      chong_chi_dinh: data.contraindications?.trim() || 'Chưa điền',
      goi_dich_vu_id: data.selectedPackageId,
      ghi_chu: data.notes,
      vas_score: data.vasScore,
      rom_data: data.romData,
      mmt_data: data.mmtData,
    });

    setSelectedAppointmentId(undefined);
    setCurrentAppointment(null);
    loadQueueData();
    navigate('/doctor/appointments');
  };

  // Nộp Hẹn Tái Khám
  const handleScheduleReassessment = async (
    limitDate: string,
    notes?: string,
    assessmentData?: {
      vasScore?: number;
      romData?: any[];
      mmtData?: any[];
      clinicalConclusion?: string;
      contraindications?: string;
    }
  ) => {
    if (!selectedAppointmentId) return;

    await saveAssessment({
      lich_dat_id: selectedAppointmentId,
      chan_doan: assessmentData?.clinicalConclusion?.trim() || currentAppointment?.chan_doan || 'Chưa thể kết luận',
      chong_chi_dinh: assessmentData?.contraindications?.trim() || 'Chưa điền',
      ghi_chu: notes ? `[Hẹn tái khám hạn: ${limitDate}] ${notes}` : `Hẹn tái khám hạn: ${limitDate}`,
      is_reassessment: true,
      han_tai_kham: limitDate,
      vas_score: assessmentData?.vasScore,
      rom_data: assessmentData?.romData,
      mmt_data: assessmentData?.mmtData,
    });

    setSelectedAppointmentId(undefined);
    setCurrentAppointment(null);
    loadQueueData();
    navigate('/doctor/appointments');
  };

  // Nộp kết quả Hoàn thành Trị liệu
  const handleCompleteTreatment = async (
    appointmentId: string,
    data: { vas_truoc: number; vas_sau: number; ghi_chu?: string; du_lieu_tri_lieu?: any }
  ) => {
    await saveTreatmentRecord({
      lich_dat_id: appointmentId,
      vas_truoc: data.vas_truoc,
      vas_sau: data.vas_sau,
      ghi_chu: data.ghi_chu,
      du_lieu_tri_lieu: data.du_lieu_tri_lieu,
    });

    toast.success('Đã hoàn thành ca trị liệu.');

    const remainingIds = ktvOpenIds.filter((i) => i !== appointmentId);
    setKtvOpenAppointments((prev) => {
      const next = { ...prev };
      delete next[appointmentId];
      return next;
    });

    if (remainingIds.length > 0) {
      navigate(`/technician/appointments/${remainingIds[0]}/assess`);
    } else {
      navigate('/technician/appointments');
    }
  };

  const handleSaveDraft = (
    appointmentId: string,
    data: { vas_truoc: number; vas_sau: number; ghi_chu?: string; du_lieu_tri_lieu?: any }
  ) => {
    saveTreatmentDraft({
      lich_dat_id: appointmentId,
      vas_truoc: data.vas_truoc,
      vas_sau: data.vas_sau,
      ghi_chu: data.ghi_chu,
      du_lieu_tri_lieu: data.du_lieu_tri_lieu,
    }).catch((err) => console.error('Lỗi lưu nháp buổi trị liệu:', err));
  };

  const handleSaveAssessmentDraft = (
    appointmentId: string,
    data: {
      vasScore: number;
      romData: any[];
      mmtData: any[];
      clinicalConclusion: string;
      contraindications: string;
      selectedPackageId?: string;
    }
  ) => {
    saveAssessmentDraftDoctor({
      lich_dat_id: appointmentId,
      chan_doan: data.clinicalConclusion,
      chong_chi_dinh: data.contraindications,
      vas_score: data.vasScore,
      rom_data: data.romData,
      mmt_data: data.mmtData,
      selected_package_id: data.selectedPackageId,
    }).catch((err) => console.error('Lỗi lưu nháp lượng giá:', err));
  };

  const redirectPath = isKtv ? '/technician/appointments' : '/doctor/appointments';

  // ==================== NHÁNH KTV — hỗ trợ 2 bàn song song ====================
  if (isKtv) {
    const activeApt = ktvActiveId ? ktvOpenAppointments[ktvActiveId] : null;
    const activePatientId = activeApt?.khach_hang_id || activeApt?.khach_hang?.id || activeApt?.id || '';
    const activePatientName = activeApt?.ten_khach_hang || 'Khách hàng';

    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 bg-[#F8FAFC] dark:bg-zinc-950 min-h-screen font-jakarta">
        <ConfirmDialog
          isOpen={!!overtimeConfirm}
          title="Mở bàn trị liệu thứ 2?"
          message={overtimeConfirm?.message || ''}
          confirmLabel="Vẫn mở bàn 2"
          cancelLabel="Để sau"
          type="warning"
          onConfirm={confirmOvertimeOpen}
          onCancel={cancelOvertimeOpen}
        />

        {ktvOpenIds.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-16 text-center shadow-sm space-y-5 animate-in fade-in duration-300 my-8">
            <div className="size-16 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto shadow-inner">
              <Activity size={32} />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-base font-black text-slate-900 dark:text-zinc-100 font-jakarta">
                Chưa có ca trị liệu nào đang mở bàn
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium leading-relaxed">
                Vui lòng truy cập trang <span className="font-bold text-slate-700 dark:text-zinc-300">LỊCH HẸN</span> để xem
                danh sách bệnh nhân đang chờ và bấm <span className="font-bold text-teal-600 dark:text-teal-400">[ Vào bàn trị liệu ]</span>.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate(redirectPath)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-teal-600/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Activity size={16} />
              <span>CHUYỂN ĐẾN DANH SÁCH LỊCH HẸN</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* THANH ĐIỀU HƯỚNG TÁP: BÀN LÀM VIỆC vs LỊCH SỬ ĐIỀU TRỊ + DROPDOWN BÀN ĐANG MỞ */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-2 shadow-2xs">
              {/* Tab Selector */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-zinc-800/80 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveDeskTab('desk')}
                  className={`px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                    activeDeskTab === 'desk'
                      ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md shadow-teal-600/25'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-200/60 dark:hover:bg-zinc-700/60'
                  }`}
                >
                  <Monitor size={15} />
                  <span>🖥️ BÀN LÀM VIỆC</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveDeskTab('emr')}
                  className={`px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                    activeDeskTab === 'emr'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/25'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-200/60 dark:hover:bg-zinc-700/60'
                  }`}
                >
                  <FileText size={15} />
                  <span>📜 LỊCH SỬ ĐIỀU TRỊ</span>
                </button>
              </div>

              {/* Dropdown danh sách bàn KTV đang mở */}
              {ktvOpenIds.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider hidden sm:inline">
                    Bàn đang mở:
                  </span>
                  <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-zinc-800 p-1 rounded-xl border border-slate-200/80 dark:border-zinc-700">
                    {ktvOpenIds.map((id, idx) => {
                      const apt = ktvOpenAppointments[id];
                      const isActive = id === ktvActiveId;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => navigate(`/technician/appointments/${id}/assess`)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                            isActive
                              ? 'bg-teal-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-200/60 dark:hover:bg-zinc-700'
                          }`}
                        >
                          <span className={`size-2 rounded-full ${isActive ? 'bg-white animate-pulse' : 'bg-slate-400'}`}></span>
                          <span>Bàn {idx + 1}: {apt?.ten_khach_hang || 'Khách'}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* TAB CONTENT: BÀN LÀM VIỆC VS LỊCH SỬ ĐIỀU TRỊ (EMR) */}
            {activeDeskTab === 'emr' ? (
              <EmbeddedPatientEmrView
                patientId={activePatientId}
                patientName={activePatientName}
                soDienThoai={activeApt?.so_dien_thoai}
                gioiTinh={activeApt?.gioi_tinh}
                tuoi={activeApt?.tuoi}
              />
            ) : (
              ktvOpenIds.map((id) => {
                const apt = ktvOpenAppointments[id];
                return (
                  <div key={id} className={id === ktvActiveId ? 'block space-y-6' : 'hidden'}>
                    <PatientHeaderBanner
                      patient={{
                        id: String(apt.id),
                        khach_hang_id: apt.khach_hang_id,
                        ma_khach_hang: apt.ma_khach_hang || 'KH-88392',
                        ten_khach_hang: apt.ten_khach_hang || 'Bệnh nhân',
                        so_dien_thoai: apt.so_dien_thoai,
                        tuoi: apt.tuoi || 28,
                        gioi_tinh: apt.gioi_tinh || 'Nam',
                        ly_do_kham: apt.ly_do_kham || apt.ghi_chu,
                        anh_dinh_kem_url: apt.anh_dinh_kem_url || apt.anh_dinh_kem,
                        vas_truoc: apt.vas_truoc !== undefined && apt.vas_truoc !== null ? apt.vas_truoc : undefined,
                        trang_thai: apt.trang_thai,
                        ten_dich_vu: apt.ten_dich_vu,
                        thoi_luong_phut: apt.thoi_luong_phut,
                        thoi_gian_bat_dau: apt.thoi_gian_bat_dau || apt.thoi_gian_goi_vao || apt.thoi_gian_checkin,
                      }}
                      onBack={() => navigate(redirectPath)}
                      isKtvMode
                    />
                    <TechnicianTreatmentDesk
                      patientName={apt.ten_khach_hang || 'Khách hàng'}
                      appointmentDetail={apt}
                      onCompleteTreatment={(data) => handleCompleteTreatment(id, data)}
                      onSaveDraft={(data) => handleSaveDraft(id, data)}
                    />
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    );
  }

  // ==================== NHÁNH CHUYÊN VIÊN — đúng 1 bàn ====================
  const currentStatus = String(currentAppointment?.trang_thai || '');
  const isCompleted = currentStatus === 'hoan_thanh' || currentStatus === 'da_huy' || currentStatus === 'khong_den';

  const docPatientId = currentAppointment?.khach_hang_id || currentAppointment?.khach_hang?.id || currentAppointment?.id || '';
  const docPatientName = currentAppointment?.ten_khach_hang || 'Khách hàng';

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 bg-[#F8FAFC] dark:bg-zinc-950 min-h-screen font-jakarta">
      <main className="w-full space-y-6">
        {selectedAppointmentId && currentAppointment ? (
          isCompleted ? (
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-12 text-center shadow-sm space-y-5 animate-in fade-in duration-300 my-8">
              <div className="size-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={36} />
              </div>
              <div className="space-y-2 max-w-md mx-auto">
                <span className="px-3 py-1 rounded-xl text-xs font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                  ĐÃ HOÀN THÀNH
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-zinc-100 font-jakarta pt-1">
                  Ca lượng giá cho bệnh nhân {currentAppointment.ten_khach_hang || 'Khách hàng'} đã kết thúc
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium leading-relaxed">
                  Dữ liệu đã được cập nhật thành công vào hồ sơ bệnh nhân. Bàn làm việc đã giải phóng để đón ca tiếp theo.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAppointmentId(undefined);
                    setCurrentAppointment(null);
                    navigate(redirectPath);
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-teal-600/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <CheckCircle2 size={16} />
                  <span>QUAY LẠI DANH SÁCH LỊCH HẸN</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* THANH ĐIỀU HƯỚNG TÁP BÀN LÀM VIỆC VS LỊCH SỬ ĐIỀU TRỊ (CHUYÊN VIÊN) */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-2 shadow-2xs">
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-zinc-800/80 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setActiveDeskTab('desk')}
                    className={`px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                      activeDeskTab === 'desk'
                        ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md shadow-teal-600/25'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-200/60 dark:hover:bg-zinc-700/60'
                    }`}
                  >
                    <Monitor size={15} />
                    <span>🖥️ BÀN LÀM VIỆC</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveDeskTab('emr')}
                    className={`px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                      activeDeskTab === 'emr'
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/25'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-200/60 dark:hover:bg-zinc-700/60'
                    }`}
                  >
                    <FileText size={15} />
                    <span>📜 LỊCH SỬ ĐIỀU TRỊ</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl text-xs font-black bg-teal-50 dark:bg-teal-950/60 text-[#0d766e] dark:text-teal-400 border border-teal-200/60 dark:border-teal-800">
                    🟢 ĐANG KHÁM: {docPatientName}
                  </span>
                </div>
              </div>

              {activeDeskTab === 'emr' ? (
                <EmbeddedPatientEmrView
                  patientId={docPatientId}
                  patientName={docPatientName}
                  soDienThoai={currentAppointment.so_dien_thoai}
                  gioiTinh={currentAppointment.gioi_tinh}
                  tuoi={currentAppointment.tuoi}
                />
              ) : (
                <>
                  <PatientHeaderBanner
                    patient={{
                      id: String(currentAppointment.id),
                      khach_hang_id: currentAppointment.khach_hang_id || currentAppointment.khach_hang?.id,
                      ma_khach_hang: currentAppointment.ma_khach_hang || 'KH-88392',
                      ten_khach_hang: currentAppointment.ten_khach_hang || 'Bệnh nhân',
                      so_dien_thoai: currentAppointment.so_dien_thoai,
                      tuoi: currentAppointment.tuoi || 28,
                      gioi_tinh: currentAppointment.gioi_tinh || 'Nam',
                      ly_do_kham: currentAppointment.ly_do_kham || currentAppointment.ghi_chu,
                      anh_dinh_kem_url: currentAppointment.anh_dinh_kem_url || currentAppointment.anh_dinh_kem,
                      vas_truoc:
                        currentAppointment.vas_truoc !== undefined && currentAppointment.vas_truoc !== null
                          ? currentAppointment.vas_truoc
                          : undefined,
                      trang_thai: currentAppointment.trang_thai,
                      ten_dich_vu: currentAppointment.ten_dich_vu,
                      thoi_luong_phut: currentAppointment.thoi_luong_phut,
                      thoi_gian_bat_dau: currentAppointment.thoi_gian_bat_dau || currentAppointment.thoi_gian_goi_vao || currentAppointment.thoi_gian_checkin,
                    }}
                    onBack={() => navigate(redirectPath)}
                    isKtvMode={false}
                  />

                  <SpecialistAssessmentDesk
                    patientName={currentAppointment.ten_khach_hang || 'Khách hàng'}
                    packages={packages}
                    appointmentDetail={currentAppointment}
                    onCompleteAssessment={handleCompleteAssessment}
                    onScheduleReassessment={handleScheduleReassessment}
                    onSaveDraft={(data) => handleSaveAssessmentDraft(selectedAppointmentId!, data)}
                  />
                </>
              )}
            </div>
          )
        ) : (
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-16 text-center shadow-sm space-y-5 animate-in fade-in duration-300 my-8">
            <div className="size-16 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto shadow-inner">
              <Stethoscope size={32} />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-base font-black text-slate-900 dark:text-zinc-100 font-jakarta">
                Chưa có ca khám nào đang mở bàn tư vấn
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium leading-relaxed">
                Vui lòng truy cập trang <span className="font-bold text-slate-700 dark:text-zinc-300">LỊCH HẸN</span> để xem
                danh sách bệnh nhân đang chờ và bấm{' '}
                <span className="font-bold text-teal-600 dark:text-teal-400">[ 🩺 MỞ BÀN ]</span>.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate(redirectPath)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-teal-600/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Stethoscope size={16} />
              <span>CHUYỂN ĐẾN DANH SÁCH LỊCH HẸN</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default ClinicalAssessment;
