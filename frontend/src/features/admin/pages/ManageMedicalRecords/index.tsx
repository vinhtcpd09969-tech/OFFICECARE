import { useState, useEffect } from 'react';
import { Search, Printer, ChevronLeft, FileText, AlertTriangle, Stethoscope, Sparkles, Activity, Clock, UserCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getMedicalRecords } from '../../api/admin.api';
import { format } from 'date-fns';
import { resolveImageUrl } from '../../../../utils/imageUrl';
import { getMinPaymentRequired, resolveGrossBeforeExamDeduction } from '../../../../utils/billing';

function StaffAvatar({ name, photo, size = 'sm' }: { name?: string | null; photo?: string | null; size?: 'sm' | 'md' }) {
  const dimension = size === 'md' ? 'size-10 text-xs' : 'size-6 text-[9px]';
  const initial = name?.trim()?.charAt(0)?.toUpperCase() || '?';
  if (photo) {
    return (
      <img
        src={resolveImageUrl(photo)}
        alt={name || 'Nhân sự'}
        className={`${dimension} rounded-full object-cover border-2 border-white shadow-sm shrink-0`}
      />
    );
  }
  return (
    <div className={`${dimension} rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-black border-2 border-white shadow-sm shrink-0`}>
      {initial}
    </div>
  );
}

export default function ManageMedicalRecords() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Navigation State
  const [viewState, setViewState] = useState<'overview' | 'detail'>('overview');
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedAptId, setSelectedAptId] = useState<string | null>(null);
  
  // Filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, package, single, exam
  const [filterStatus, setFilterStatus] = useState('all'); // all, dang_dieu_tri, hoan_thanh
  const [filterStaff, setFilterStaff] = useState('all');



  const fetchData = async () => {
    try {
      setLoading(true);
      const recordsRes = await getMedicalRecords();
      setPatients(recordsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Không thể kết nối API hồ sơ điều trị.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute Stats for KPI Cards dynamically
  const activePatientsCount = patients.filter(p => 
    p.plans?.some((pl: any) => pl.trang_thai === 'dang_dieu_tri')
  ).length;

  const activePackagesCount = patients.reduce((sum, p) => {
    const pkgPlans = p.plans?.filter((pl: any) => pl.loai_goi === 'LIEU_TRINH' && pl.trang_thai === 'dang_dieu_tri') || [];
    return sum + pkgPlans.length;
  }, 0);

  // Single treatment count for today
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todaySingleTreatmentsCount = patients.reduce((sum, p) => {
    const todayApts = p.appointments?.filter((ap: any) => 
      !ap.phac_do_dieu_tri_id && 
      ap.loai !== 'KHAM' &&
      format(new Date(ap.ngay_gio_bat_dau), 'yyyy-MM-dd') === todayStr
    ) || [];
    return sum + todayApts.length;
  }, 0);

  // Transform nested patient records to a flat list for Overview
  const flatRecords: any[] = [];
  patients.forEach(p => {
    // 1. Add treatment packages
    p.plans?.forEach((pl: any) => {
      if (pl.trang_thai === 'cho_kich_hoat') return;

      // Find latest completed treatment session
      const completedApts = p.appointments
        ?.filter((ap: any) => ap.phac_do_dieu_tri_id === pl.id && ap.trang_thai === 'hoan_thanh' && ap.loai !== 'KHAM')
        .sort((a: any, b: any) => new Date(b.ngay_gio_bat_dau).getTime() - new Date(a.ngay_gio_bat_dau).getTime()) || [];

      const latestApt = completedApts[0];
      const latestSessionStr = latestApt ? format(new Date(latestApt.ngay_gio_bat_dau), 'HH:mm dd/MM/yyyy') : 'Chưa trị liệu';
      const latestStaffName = latestApt ? latestApt.ten_nhan_su : 'Chưa phân công';

      flatRecords.push({
        id: pl.id,
        patientId: p.id,
        patientName: p.ho_ten,
        patientPhone: p.so_dien_thoai,
        patientCode: p.ma_khach_hang,
        diem_uy_tin: p.diem_uy_tin,
        type: 'package',
        packageName: pl.ten_goi,
        loai_goi: pl.loai_goi,
        so_buoi_da_dung: pl.so_buoi_da_dung,
        tong_so_buoi: pl.tong_so_buoi,
        latestSession: latestSessionStr,
        staffName: latestStaffName,
        status: pl.trang_thai,
        originalRecord: p
      });
    });

    // 2. Add COMPLETED clinical exam appointments as separate rows
    const examApts = p.appointments?.filter((ap: any) => ap.loai === 'KHAM' && ap.trang_thai === 'hoan_thanh') || [];
    examApts.forEach((ap: any) => {
      flatRecords.push({
        id: ap.id,
        appointmentId: ap.id,
        patientId: p.id,
        patientName: p.ho_ten,
        patientPhone: p.so_dien_thoai,
        patientCode: p.ma_khach_hang,
        diem_uy_tin: p.diem_uy_tin,
        type: 'exam',
        packageName: ap.ten_dich_vu || 'Khám lâm sàng & Lượng giá',
        loai_goi: 'LE',
        so_buoi_da_dung: 1,
        tong_so_buoi: 1,
        latestSession: format(new Date(ap.ngay_gio_bat_dau), 'HH:mm dd/MM/yyyy'),
        staffName: ap.ten_nhan_su || 'Chưa phân công',
        staffPhoto: ap.anh_nhan_su,
        status: ap.trang_thai,
        phac_do_dieu_tri_id: ap.phac_do_dieu_tri_id,
        originalRecord: p
      });
    });

    // 3. Add COMPLETED single treatment appointments (which do not have a phac_do_dieu_tri_id and are not exams)
    const singleApts = p.appointments?.filter((ap: any) => !ap.phac_do_dieu_tri_id && ap.loai !== 'KHAM' && ap.trang_thai === 'hoan_thanh') || [];
    singleApts.forEach((ap: any) => {
      flatRecords.push({
        id: ap.id,
        appointmentId: ap.id,
        patientId: p.id,
        patientName: p.ho_ten,
        patientPhone: p.so_dien_thoai,
        patientCode: p.ma_khach_hang,
        diem_uy_tin: p.diem_uy_tin,
        type: 'single',
        packageName: ap.ten_dich_vu || 'Trị liệu dịch vụ lẻ',
        loai_goi: 'LE',
        so_buoi_da_dung: 1,
        tong_so_buoi: 1,
        latestSession: format(new Date(ap.ngay_gio_bat_dau), 'HH:mm dd/MM/yyyy'),
        staffName: ap.ten_nhan_su || 'Chưa phân công',
        staffPhoto: ap.anh_nhan_su,
        status: ap.trang_thai,
        originalRecord: p
      });
    });
  });

  // Filter flat records
  const filteredRecords = flatRecords.filter(rec => {
    const matchesSearch = rec.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.patientPhone?.includes(searchTerm) ||
      rec.packageName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'all' || 
      (filterType === 'package' && rec.type === 'package') ||
      (filterType === 'single' && rec.type === 'single') ||
      (filterType === 'exam' && rec.type === 'exam');

    const matchesStatus = filterStatus === 'all' || rec.status === filterStatus;

    const matchesStaff = filterStaff === 'all' || rec.staffName === filterStaff;

    return matchesSearch && matchesType && matchesStatus && matchesStaff;
  });

  // Unique list of staff names for filters
  const uniqueStaffNames = Array.from(new Set(flatRecords.map(r => r.staffName).filter(Boolean)));

  const handleOpenDetail = (rec: any) => {
    setSelectedPatient(rec.originalRecord);
    if (rec.type === 'package') {
      setSelectedPlanId(rec.id);
      setSelectedAptId(null);
    } else {
      setSelectedPlanId(null);
      setSelectedAptId(rec.appointmentId);
    }
    setViewState('detail');
  };

  const selectedPlan = selectedPatient?.plans?.find((p: any) => p.id === selectedPlanId);
  const selectedPlanSessions = selectedPatient?.appointments?.filter(
    (ap: any) => ap.phac_do_dieu_tri_id === selectedPlanId
  ) || [];

  const selectedPlanKtvs = selectedPatient?.appointments
    ?.filter((ap: any) => ap.phac_do_dieu_tri_id === selectedPlanId && ap.loai !== 'KHAM')
    .map((ap: any) => ap.ten_nhan_su)
    .filter(Boolean) || [];
  const uniqueSelectedPlanKtvs = Array.from(new Set(selectedPlanKtvs));
  const selectedPlanKtvsDisplay = uniqueSelectedPlanKtvs.length > 0 ? uniqueSelectedPlanKtvs.join(', ') : 'Chưa phân công';

  // Find the exact next unscheduled session number
  let firstEmptySessionNum = 1;
  if (selectedPlan) {
    for (let i = 1; i <= selectedPlan.tong_so_buoi; i++) {
      const apptExists = selectedPlanSessions.some((ap: any) => 
        ap.so_thu_tu_buoi === i && ap.loai !== 'KHAM'
      );
      if (!apptExists) {
        firstEmptySessionNum = i;
        break;
      }
    }
  }



  // Selected appointment details (for exam/single detail view)
  const selectedApt = selectedPatient?.appointments?.find((ap: any) => ap.id === selectedAptId);
  const prescribedPlan = selectedApt
    ? selectedPatient?.plans?.find((p: any) => p.cuoc_hen_id === selectedApt.id)
    : null;
  const bookedApt = prescribedPlan ? selectedPatient?.appointments?.find((ap: any) => 
    String(ap.goi_dich_vu_id) === String(prescribedPlan.goi_dich_vu_id) && 
    ap.loai !== 'KHAM' && 
    ap.trang_thai !== 'da_huy'
  ) : null;

  const handlePrint = () => {
    window.print();
  };



  return (
    <div className="space-y-6">
      {viewState === 'overview' ? (
        // ------------------ OVERVIEW VIEW (Screen 3) ------------------
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                Danh sách hồ sơ điều trị (tổng quan)
              </h2>
              <p className="text-slate-500 text-xs font-semibold mt-1">
                Theo dõi, tìm kiếm và phân tích tiến độ hồ sơ phác đồ điều trị của toàn bộ khách hàng.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                <option value="all">Tất cả loại</option>
                <option value="package">Chỉ gói phác đồ</option>
                <option value="single">Chỉ dịch vụ lẻ</option>
                <option value="exam">Chỉ lịch khám lẻ</option>
              </select>

              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="dang_dieu_tri">Đang điều trị</option>
                <option value="hoan_thanh">Hoàn thành</option>
              </select>

              <select 
                value={filterStaff} 
                onChange={(e) => setFilterStaff(e.target.value)}
                className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                <option value="all">Tất cả chuyên viên</option>
                {uniqueStaffNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>

              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Tìm khách hàng..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/20 w-52"
                />
              </div>
            </div>
          </div>

          {/* Stats KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-teal-500/5 to-teal-500/10 border border-teal-100/50 p-6 rounded-2xl shadow-sm flex items-center justify-between transition-all hover:shadow-md hover:shadow-teal-500/5">
              <div>
                <span className="text-[10px] font-black text-teal-850 uppercase tracking-widest block">Đang điều trị</span>
                <span className="text-3xl font-black text-teal-950 mt-2 block">{activePatientsCount}</span>
              </div>
              <div className="size-12 rounded-xl bg-teal-500/10 border border-teal-200/20 flex items-center justify-center text-teal-600">
                <Activity size={22} className="stroke-[2.5]" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-500/5 to-indigo-500/10 border border-indigo-100/50 p-6 rounded-2xl shadow-sm flex items-center justify-between transition-all hover:shadow-md hover:shadow-indigo-500/5">
              <div>
                <span className="text-[10px] font-black text-indigo-850 uppercase tracking-widest block">Gói liệu trình hoạt động</span>
                <span className="text-3xl font-black text-indigo-950 mt-2 block">{activePackagesCount}</span>
              </div>
              <div className="size-12 rounded-xl bg-indigo-500/10 border border-indigo-200/20 flex items-center justify-center text-indigo-600">
                <UserCheck size={22} className="stroke-[2.5]" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-sky-500/5 to-sky-500/10 border border-sky-100/50 p-6 rounded-2xl shadow-sm flex items-center justify-between transition-all hover:shadow-md hover:shadow-sky-500/5">
              <div>
                <span className="text-[10px] font-black text-sky-850 uppercase tracking-widest block">Dịch vụ lẻ hôm nay</span>
                <span className="text-3xl font-black text-sky-950 mt-2 block">{todaySingleTreatmentsCount}</span>
              </div>
              <div className="size-12 rounded-xl bg-sky-500/10 border border-sky-200/20 flex items-center justify-center text-sky-600">
                <Clock size={22} className="stroke-[2.5]" />
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="p-4 font-black">Khách hàng</th>
                    <th className="p-4 font-black">Loại</th>
                    <th className="p-4 font-black">Dịch vụ</th>
                    <th className="p-4 font-black">Trị liệu gần nhất</th>
                    <th className="p-4 font-black">Phụ trách</th>
                    <th className="p-4 font-black text-center">Trạng thái</th>
                    <th className="p-4 font-black text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 font-semibold">Đang tải dữ liệu...</td>
                    </tr>
                  ) : filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 font-semibold">Không tìm thấy hồ sơ nào.</td>
                    </tr>
                  ) : (
                    filteredRecords.map((rec) => (
                      <tr key={rec.id + '-' + rec.type} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-bold text-slate-800">
                          <div className="flex flex-col">
                            <span>{rec.patientName}</span>
                            <span className="text-[10px] text-slate-400 font-extrabold font-mono mt-0.5">{rec.patientCode}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          {rec.type === 'package' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase bg-teal-50 text-teal-700">
                              Gói {rec.so_buoi_da_dung}/{rec.tong_so_buoi}
                            </span>
                          ) : rec.type === 'exam' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase bg-indigo-50 text-indigo-700">
                              Khám
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-100 text-slate-650">
                              Lẻ
                            </span>
                          )}
                        </td>
                        <td className="p-4 font-semibold text-slate-800 max-w-[200px] truncate" title={rec.packageName}>
                          {rec.packageName}
                        </td>
                        <td className="p-4">
                          <span className={rec.latestSession === 'Chưa trị liệu' ? 'text-slate-400 font-medium' : 'text-slate-700 font-bold'}>
                            {rec.latestSession}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-slate-700">
                          <div className="flex items-center gap-2">
                            <StaffAvatar name={rec.staffName} photo={rec.staffPhoto} />
                            <span>{rec.staffName}</span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            rec.status === 'hoan_thanh' 
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/50' 
                              : rec.status === 'da_tam_dung'
                                ? 'bg-amber-50 text-amber-700 border border-amber-100/50'
                                : 'bg-teal-50 text-teal-700 border border-teal-100/50'
                          }`}>
                            {rec.status === 'hoan_thanh' 
                              ? 'Hoàn thành' 
                              : rec.status === 'da_tam_dung'
                                ? 'Tạm dừng'
                                : 'Đang điều trị'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleOpenDetail(rec)}
                            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-[10px] transition-all"
                          >
                            Xem Chi Tiết
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        // ------------------ DETAIL VIEW (Screen 4) ------------------
        <div className="space-y-6">
          {/* Back Button & Patient Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setViewState('overview')}
                className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-850 hover:bg-slate-50 transition-all shadow-sm active:scale-95 shrink-0"
              >
                <ChevronLeft size={16} className="stroke-[3]" />
              </button>
              
              {/* Patient Banner */}
              <div className="flex items-center gap-3.5">
                <div className="size-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 text-white flex items-center justify-center font-black text-sm uppercase shadow-md shadow-slate-950/15 border border-slate-700/10 shrink-0">
                  {selectedPatient?.ho_ten?.charAt(0) || 'K'}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-tight">{selectedPatient.ho_ten}</h3>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                    <span className="font-extrabold font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded mr-1.5">{'KH-' + selectedPatient.id.substring(0, 8).toUpperCase()}</span>
                    {selectedPatient.so_dien_thoai} • {selectedPlanId ? (
                      <>BS chỉ định: {selectedPlan?.ten_bac_si || 'N/A'} • KTV thực hiện: {selectedPlanKtvsDisplay}</>
                    ) : (
                      <>Nhân viên thực hiện: {selectedApt?.ten_nhan_su || 'N/A'}</>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-end sm:self-center">
              {selectedApt && selectedApt.loai === 'KHAM' && selectedApt.phac_do_dieu_tri_id && selectedPatient?.plans?.some((p: any) => p.id === selectedApt.phac_do_dieu_tri_id && p.trang_thai === 'dang_dieu_tri') && (
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

          {/* Render 1: Package Plan Detail View */}
          {selectedPlanId && selectedPlan ? (
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
                          if (selectedPlan.cuoc_hen_id) {
                            window.location.href = `/admin/quick-billing?lich_dat_id=${selectedPlan.cuoc_hen_id}`;
                          } else {
                            window.location.href = `/admin/quick-billing?customer_id=${selectedPatient.id}&goi_dich_vu_id=${selectedPlan.goi_dich_vu_id}&lich_dieu_tri_id=${selectedPlan.id}`;
                          }
                        }}
                        className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-[11px] transition-all shadow-sm flex items-center gap-1 active:scale-95 cursor-pointer"
                      >
                        <span>💵 Thanh toán & Kích hoạt</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Bác sĩ chỉ định</span>
                    <strong className="text-slate-800 block mt-1">{selectedPlan.ten_bac_si || 'BS. Nguyễn Văn Khoa'}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Ngày lập</span>
                    <strong className="text-slate-800 block mt-1">
                      {selectedPlan.ngay_kich_hoat ? format(new Date(selectedPlan.ngay_kich_hoat), 'dd/MM/yyyy') : 'N/A'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Tổng số buổi</span>
                    <strong className="text-slate-800 block mt-1">{selectedPlan.tong_so_buoi} buổi</strong>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Chẩn đoán</span>
                    <strong className="text-teal-700 block mt-1 font-black">{selectedPlan.chan_doan || 'Đau cơ xương khớp'}</strong>
                  </div>
                </div>
              </div>

              {/* Hồ sơ Khám lâm sàng & Lượng giá (Bác sĩ) của Buổi 1 */}
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                  <FileText size={16} className="text-teal-600 stroke-[2.5]" />
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Hồ sơ Khám lâm sàng & Lượng giá của Bác sĩ</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 p-3 bg-teal-50/20 border border-teal-100/30 rounded-xl">
                    <span className="text-[10px] font-black text-teal-750 uppercase tracking-widest block">Chẩn đoán y khoa</span>
                    <p className="text-xs font-bold text-teal-950 leading-relaxed">
                      {selectedPlan.chan_doan || 'Chưa có chẩn đoán cụ thể.'}
                    </p>
                  </div>

                  <div className="space-y-1.5 p-3 bg-rose-50/30 border border-rose-100/30 rounded-xl">
                    <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest block flex items-center gap-1">
                      <AlertTriangle size={12} className="text-rose-500" /> Chống chỉ định y khoa (Bác sĩ lưu ý)
                    </span>
                    <p className="text-xs font-black text-rose-950 leading-relaxed">
                      {selectedPlan.chong_chi_dinh || 'Không có chống chỉ định đặc biệt.'}
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
                    // Check if appointment exists
                    const appt = selectedPlanSessions.find((ap: any) => ap.so_thu_tu_buoi === sessionNum && ap.loai !== 'KHAM');

                    const isUnbooked = !appt && sessionNum === firstEmptySessionNum;
                    const isFinished = appt?.trang_thai === 'hoan_thanh';

                    if (appt) {
                      return (
                        <div key={appt.id} className="border border-slate-100 rounded-xl overflow-hidden bg-white">
                          <div className="p-4 flex justify-between items-center gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                                  isFinished ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {isFinished ? 'Hoàn thành' : 'Đã đặt lịch'}
                                </span>
                                <strong className="text-xs font-black text-slate-800">
                                  Buổi {sessionNum} • Trị liệu phục hồi
                                </strong>
                              </div>
                              <p className="text-[10px] text-slate-400 font-semibold mt-1">
                                {format(new Date(appt.ngay_gio_bat_dau), 'dd/MM/yyyy HH:mm')} • KTV {appt.ten_nhan_su || 'Chưa phân công'}
                              </p>
                            </div>
                            {appt.vas_truoc !== null && (
                              <span className="text-[10px] font-black bg-slate-50 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-lg shrink-0">
                                VAS: {appt.vas_truoc} ➔ {appt.vas_sau}
                              </span>
                            )}
                          </div>
                          {appt.ghi_chu_tri_lieu && (
                            <div className="px-4 pb-4 pt-1.5 border-t border-slate-50 text-xs text-slate-650 bg-slate-50/20 italic">
                              Ghi chú: {appt.ghi_chu_tri_lieu}
                            </div>
                          )}
                        </div>
                      );
                    } else if (isUnbooked) {
                       const isUnpaid = selectedPlan.trang_thai === 'cho_kich_hoat' && selectedPlan.loai_goi !== 'LE';
                       
                       // Check if previous session is completed
                       const prevAppt = sessionNum > 1 
                         ? selectedPlanSessions.find((ap: any) => ap.so_thu_tu_buoi === sessionNum - 1 && ap.loai !== 'KHAM')
                         : null;
                       const isPrevFinished = sessionNum === 1 || (prevAppt && prevAppt.trang_thai === 'hoan_thanh');
                       
                       // Check if previous sessions are paid (Unified mathematical check)
                       const grossBeforeExamDeduction = resolveGrossBeforeExamDeduction(selectedPlan);
                       const minRequired = getMinPaymentRequired(
                         selectedPlan.hinh_thuc_thanh_toan_goi || 'tra_thang',
                         Number(selectedPlan.tong_tien_phai_tra || 0),
                         Number(selectedPlan.tong_so_buoi || 10),
                         sessionNum,
                         grossBeforeExamDeduction
                       );
                       const soTienDaTra = Number(selectedPlan.so_tien_da_tra || 0);
                       const isPaymentBlocked = selectedPlan.loai_goi !== 'LE' && soTienDaTra < minRequired;

                       const isBlocked = !isPrevFinished || isPaymentBlocked;
                       const blockMessage = !isPrevFinished 
                         ? `⚠️ Vui lòng hoàn thành buổi điều trị số ${sessionNum - 1} để đặt lịch buổi này.`
                         : (selectedPlan.hinh_thuc_thanh_toan_goi === 'tra_gop' 
                             ? `⚠️ Vui lòng thanh toán Đợt 2 của gói trả góp để đặt lịch buổi này.`
                             : `⚠️ Vui lòng thanh toán liệu trình để đặt lịch buổi này.`);

                       return (
                         <div key={sessionNum} className={`border rounded-xl p-4 flex justify-between items-center gap-4 ${
                           isUnpaid || isBlocked
                             ? 'border-amber-100 bg-amber-50/10 opacity-80' 
                             : 'border-sky-100 bg-sky-50/30'
                         }`}>
                           <div>
                             <div className="flex items-center gap-2">
                               <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                                 isUnpaid ? 'bg-amber-105 text-amber-800 border border-amber-200' : (isBlocked ? 'bg-slate-100 text-slate-500 border border-slate-200' : 'bg-sky-100 text-sky-850')
                               }`}>
                                 {isUnpaid ? 'Chờ kích hoạt' : (isBlocked ? 'Chưa đủ điều kiện' : 'Chưa đặt lịch')}
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
                                 window.location.href = `${basePath}/quick-billing?customer_id=${selectedPatient.id}&goi_dich_vu_id=${selectedPlan.goi_dich_vu_id}&dang_ky_goi=true`;
                               }}
                               className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
                             >
                               Kích hoạt ngay
                             </button>
                           ) : isPaymentBlocked && isPrevFinished && selectedPlan.hoa_don_id ? (
                            // Bị chặn vì chưa đóng đủ tiền (không phải vì buổi trước chưa xong) —
                            // mở thẳng hóa đơn gói để thu Đợt 2, thay vì để nút chết không lối thoát.
                            <button
                              type="button"
                              onClick={() => {
                                const basePath = window.location.pathname.startsWith('/receptionist') ? '/receptionist/billing' : '/admin/finance';
                                window.location.href = `${basePath}?hoa_don_id=${selectedPlan.hoa_don_id}`;
                              }}
                              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
                            >
                              💵 Thanh toán Đợt 2
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
                                window.location.href = `${basePath}/appointments?khach_hang_id=${selectedPatient.id}&goi_dich_vu_id=${selectedPlan.goi_dich_vu_id}`;
                              }}
                              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
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
                          <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
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
                            window.location.href = `${basePath}/appointments?khach_hang_id=${selectedPatient.id}&goi_dich_vu_id=${prescribedPlan.goi_dich_vu_id}`;
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

              <div className={`rounded-2xl p-6 shadow-sm border overflow-hidden relative ${
                selectedApt.loai === 'KHAM'
                  ? 'bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 border-indigo-900/50'
                  : 'bg-gradient-to-br from-sky-950 via-sky-900 to-slate-900 border-sky-900/50'
              }`}>
                <div className="absolute -right-8 -top-8 size-40 rounded-full bg-white/5 blur-2xl" />
                <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
                  <div className="flex items-start gap-4">
                    <div className={`size-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                      selectedApt.loai === 'KHAM' ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-400/20' : 'bg-sky-500/15 text-sky-300 border border-sky-400/20'
                    }`}>
                      {selectedApt.loai === 'KHAM' ? <Stethoscope size={24} className="stroke-[2.25]" /> : <Sparkles size={24} className="stroke-[2.25]" />}
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-black uppercase tracking-widest text-white/40 block">
                        {selectedApt.loai === 'KHAM' ? 'Ca khám lâm sàng' : 'Ca trị liệu dịch vụ lẻ'}
                      </span>
                      <h3 className="text-lg font-black text-white leading-tight">
                        {selectedApt.ten_dich_vu || (selectedApt.loai === 'KHAM' ? 'Khám lâm sàng & Lượng giá' : 'Trị liệu dịch vụ lẻ')}
                      </h3>
                      {selectedApt.gia_dich_vu != null && (
                        <span className="text-xs font-bold text-emerald-300">
                          {Number(selectedApt.gia_dich_vu).toLocaleString('vi-VN')}đ
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`inline-flex px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase shrink-0 ${
                    selectedApt.trang_thai === 'hoan_thanh'
                      ? 'bg-emerald-400/15 text-emerald-300 border border-emerald-400/25'
                      : 'bg-amber-400/15 text-amber-300 border border-amber-400/25'
                  }`}>
                    {selectedApt.trang_thai === 'hoan_thanh' ? '✓ Hoàn thành' : 'Đã đặt lịch'}
                  </span>
                </div>

                <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs mt-6 pt-5 border-t border-white/10">
                  <div>
                    <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider block mb-1.5">Chuyên viên phụ trách</span>
                    <div className="flex items-center gap-2">
                      <StaffAvatar name={selectedApt.ten_nhan_su} photo={selectedApt.anh_nhan_su} size="md" />
                      <strong className="text-white block">{selectedApt.ten_nhan_su || 'Chưa phân công'}</strong>
                    </div>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider block">Ngày thực hiện</span>
                    <strong className="text-white block mt-1">
                      {format(new Date(selectedApt.ngay_gio_bat_dau), 'HH:mm dd/MM/yyyy')}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider block">Phòng làm việc</span>
                    <strong className="text-white block mt-1">{selectedApt.ten_phong || 'Chưa phân công'}</strong>
                  </div>
                </div>
              </div>

              {selectedApt.loai === 'KHAM' ? (
                // Detailed Clinical Exam diagnosis & notes
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                    <FileText size={16} className="text-teal-600 stroke-[2.5]" />
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Hồ sơ bệnh lý & Kết luận từ Bác sĩ</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5 p-3 bg-teal-50/20 border border-teal-100/30 rounded-xl">
                      <span className="text-[10px] font-black text-teal-750 uppercase tracking-widest block">Chẩn đoán lâm sàng</span>
                      <p className="text-xs font-bold text-teal-950 leading-relaxed">
                        {selectedApt.chan_doan_tri_lieu || 'Đau cơ xương khớp chưa chẩn đoán chi tiết'}
                      </p>
                    </div>

                    <div className="space-y-1.5 p-3 bg-rose-50/30 border border-rose-100/30 rounded-xl">
                      <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest block flex items-center gap-1">
                        <AlertTriangle size={12} className="text-rose-500" /> Chống chỉ định y khoa
                      </span>
                      <p className="text-xs font-black text-rose-950 leading-relaxed">
                        {selectedApt.chong_chi_dinh_tri_lieu || 'Không có chống chỉ định đặc biệt.'}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-650 leading-relaxed">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Ghi chú lâm sàng</span>
                    "{selectedApt.ghi_chu || 'Không có ghi chú thêm.'}"
                  </div>
                </div>
              ) : (
                // Detailed treatment log for single session
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                    <FileText size={16} className="text-teal-600 stroke-[2.5]" />
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Đánh giá & Nhật ký ca điều trị lẻ</h4>
                  </div>

                  {selectedApt.vas_truoc !== null && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Thang đo đau (VAS)</span>
                      <div className="mt-1.5 flex items-center justify-between gap-6 bg-slate-50 border border-slate-100 p-3 rounded-xl max-w-sm">
                        <div className="text-center">
                          <span className="text-[9px] text-slate-400 font-bold block">Trước</span>
                          <span className="text-xs font-black text-rose-500 block mt-0.5">{selectedApt.vas_truoc}/10</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-[9px] text-emerald-600 font-black">Giảm {selectedApt.vas_truoc - selectedApt.vas_sau} điểm</span>
                          <span className="text-slate-350 text-xs">➔</span>
                        </div>
                        <div className="text-center">
                          <span className="text-[9px] text-slate-400 font-bold block">Sau</span>
                          <span className="text-xs font-black text-teal-600 block mt-0.5">{selectedApt.vas_sau}/10</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-650 leading-relaxed italic">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 font-sans not-italic">Nhật ký & Diễn tiến trị liệu lẻ</span>
                    "{selectedApt.ghi_chu_tri_lieu || 'Không có ghi chú thêm.'}"
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-2xl py-32 text-center shadow-sm">
              <h4 className="text-sm font-black text-slate-800">Không tìm thấy thông tin ca lịch hẹn</h4>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
