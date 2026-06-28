import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  PlayCircle,
  ChevronLeft,
  ChevronRight,
  Layers,
  MapPin,
  Calendar as CalendarIcon,
  CalendarDays,
  HelpCircle
} from 'lucide-react';
import axiosInstance from '../../../api/axios';
import { format, addDays, subDays, startOfWeek } from 'date-fns';
import { vi } from 'date-fns/locale';
import toast from 'react-hot-toast';

// Import Components đã bóc tách
import AppointmentCalendar from '../components/AppointmentCalendar';
import AppointmentWeeklyCalendar from '../components/AppointmentWeeklyCalendar';
import AppointmentDetailModal from '../components/AppointmentDetailModal';
import NewTreatmentForm from '../components/NewTreatmentForm';

const statusConfig = {
  chua_xac_nhan: { label: 'Chưa xác nhận', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: <HelpCircle size={14} /> },
  cho_xac_nhan: { label: 'Chờ xác nhận', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: <AlertCircle size={14} /> },
  da_xac_nhan: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <CheckCircle2 size={14} /> },
  da_checkin: { label: 'Đã Check-in', color: 'bg-teal-100 text-teal-700 border-teal-200', icon: <PlayCircle size={14} /> },
  dang_thuc_hien: { label: 'Đang thực hiện', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: <PlayCircle size={14} /> },
  hoan_thanh: { label: 'Hoàn thành', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <CheckCircle2 size={14} /> },
  da_huy: { label: 'Đã hủy', color: 'bg-red-100 text-red-700 border-red-200', icon: <XCircle size={14} /> },
  khong_den: { label: 'Không đến', color: 'bg-slate-200 text-slate-700 border-slate-300', icon: <XCircle size={14} /> },
};

export default function ManageTreatments() {
  const location = useLocation();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [roomsList, setRoomsList] = useState<any[]>([]);
  const [schedulesList, setSchedulesList] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  // Filters State
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const params = new URLSearchParams(window.location.search);
    const dateParam = params.get('date');
    if (dateParam) {
      const parsedDate = new Date(dateParam);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }
    return new Date();
  });

  const scheduleType = 'dieu_tri'; // Hardcoded cho màn hình Lịch Trình Điều Trị

  const [viewMode, setViewMode] = useState<'today' | 'week'>(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    if (viewParam && ['today', 'week'].includes(viewParam)) {
      return viewParam as 'today' | 'week';
    }
    return 'today';
  });
  const [roomFilter, setRoomFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const focusTimerRef = useRef<any>(null);

  // Modals State
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Assignment State in Detail Modal
  const [assignStaffId, setAssignStaffId] = useState<string>('');
  const [assignRoomId, setAssignRoomId] = useState<string>('');
  const [assignGiuongSo, setAssignGiuongSo] = useState<string>('');
  const [assignStatus, setAssignStatus] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);


  const fetchData = async () => {
    try {
      setLoading(true);
      const [aptRes, staffRes, roomsRes, schedulesRes] = await Promise.all([
        axiosInstance.get('/admin/appointments'),
        axiosInstance.get('/admin/staff'),
        axiosInstance.get('/admin/rooms').catch(() => ({ data: [] })),
        axiosInstance.get('/admin/schedules').catch(() => ({ data: [] }))
      ]);

      setAppointments(aptRes.data);
      setStaffList(staffRes.data);
      setRoomsList(roomsRes.data || []);
      setSchedulesList(schedulesRes.data || []);
    } catch (error) {
      console.error('Lỗi tải dữ liệu:', error);
      toast.error('Không thể tải dữ liệu lịch trình');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const scrollToAppointment = (aptId: string) => {
    const doScroll = (retries = 15) => {
      const element = document.getElementById(`appointment-card-${aptId}`);
      if (element) {
        // Initial scroll instantly to bypass smooth scroll animation conflicts
        element.scrollIntoView({ behavior: 'auto', block: 'center' });
        
        // Secondary corrective scroll to handle layout shifts and React DOM reflows
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'auto', block: 'center' });
        }, 150);
        
        // Highlighting style effects
        element.style.transition = 'all 0.5s ease-in-out';
        element.style.boxShadow = '0 0 25px rgba(245, 158, 11, 0.9)';
        element.style.borderColor = '#f59e0b';
        element.style.borderWidth = '2px';
        element.style.transform = 'scale(1.05)';
        
        // Fade away smoothly after 2 seconds
        setTimeout(() => {
          element.style.boxShadow = '';
          element.style.borderColor = '';
          element.style.borderWidth = '';
          element.style.transform = '';
        }, 2000);
      } else if (retries > 0) {
        setTimeout(() => doScroll(retries - 1), 150);
      } else {
        toast.error('Không tìm thấy ca hẹn trên bảng lịch trình.');
      }
    };
    doScroll(15);
  };

  const handleUpdateAppointment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedAppointment) return;

    try {
      setIsAssigning(true);
      await axiosInstance.patch(`/admin/appointments/${selectedAppointment.id}/status`, {
        trang_thai: assignStatus,
        ky_thuat_vien_id: assignStaffId || null,
        phong_id: assignRoomId || null,
        giuong_so: assignGiuongSo ? Number(assignGiuongSo) : null
      });

      toast.success('Cập nhật thông tin ca trực thành công');
      setIsDetailModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Failed to update:', error);
      toast.error('Lỗi cập nhật ca trực');
    } finally {
      setIsAssigning(false);
    }
  };


  const handleNavigateDay = (direction: 'next' | 'prev' | 'today') => {
    if (direction === 'today') {
      setSelectedDate(new Date());
    } else if (direction === 'next') {
      setSelectedDate(prev => viewMode === 'week' ? addDays(prev, 7) : addDays(prev, 1));
    } else {
      setSelectedDate(prev => viewMode === 'week' ? subDays(prev, 7) : subDays(prev, 1));
    }
  };


  const activeRole = 'Chuyên gia y tế';
  const formattedSelectedDate = format(selectedDate, 'yyyy-MM-dd');
  
  const startDateOfWeek = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const endDateOfWeek = addDays(startDateOfWeek, 6);

  const isSelectedToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  const currentActualWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const isSelectedCurrentWeek = format(startDateOfWeek, 'yyyy-MM-dd') === format(currentActualWeekStart, 'yyyy-MM-dd');
  const isCurrentRangeActive = viewMode === 'today' ? isSelectedToday : isSelectedCurrentWeek;

  const filteredAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.ngay_gio_bat_dau);
    let matchDate = false;

    if (viewMode === 'today') {
      const aptDateStr = format(aptDate, 'yyyy-MM-dd');
      matchDate = aptDateStr === formattedSelectedDate;
    } else {
      matchDate = aptDate >= startDateOfWeek && aptDate <= new Date(endDateOfWeek.setHours(23, 59, 59, 999));
    }

    const matchType = apt.loai_lich === scheduleType; // Chỉ hiển thị dieu_tri
    const matchRoom = roomFilter === 'all' || String(apt.phong_id) === roomFilter;
    const matchStatus = statusFilter === 'all' || apt.trang_thai === statusFilter;
    const matchSearch = searchTerm === '' ||
      apt.ma_lich_dat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.ten_khach_hang.toLowerCase().includes(searchTerm.toLowerCase());

    return matchDate && matchType && matchRoom && matchStatus && matchSearch;
  });

  // KPI Metrics calculation (Filtered by date/time range and type only, independent of search/status/room filters)
  const kpiAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.ngay_gio_bat_dau);
    const matchType = apt.loai_lich === scheduleType;
    
    if (viewMode === 'today') {
      const aptDateStr = format(aptDate, 'yyyy-MM-dd');
      return aptDateStr === formattedSelectedDate && matchType;
    } else {
      const isWithinWeek = aptDate >= startDateOfWeek && aptDate <= new Date(endDateOfWeek.setHours(23, 59, 59, 999));
      return isWithinWeek && matchType;
    }
  });


  const kpis = {
    total: kpiAppointments.length,
    waiting: kpiAppointments.filter(a => a.trang_thai === 'cho_xac_nhan').length,
    completed: kpiAppointments.filter(a => a.trang_thai === 'hoan_thanh').length,
    cancelled: kpiAppointments.filter(a => a.trang_thai === 'da_huy' || a.trang_thai === 'khong_den').length,
  };

  const allUnassignedTreatments = appointments
    .filter(apt => {
      const isTreatment = apt.loai_lich === 'dieu_tri';
      const isActive = !['hoan_thanh', 'da_huy', 'khong_den'].includes(apt.trang_thai);
      const hasNoKtv = !apt.ky_thuat_vien_id;
      return isTreatment && isActive && hasNoKtv;
    })
    .sort((a, b) => new Date(a.ngay_gio_bat_dau).getTime() - new Date(b.ngay_gio_bat_dau).getTime());

  // Clean up focus timer on component unmount
  useEffect(() => {
    return () => {
      if (focusTimerRef.current) {
        clearTimeout(focusTimerRef.current);
      }
    };
  }, []);

  // Auto-focus treatment session when navigated from other pages with triggerFocus=true
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const treatIdParam = params.get('treatmentId');
    if (params.get('triggerFocus') === 'true' && !loading) {
      const targetId = treatIdParam || (allUnassignedTreatments.length > 0 ? String(allUnassignedTreatments[0].id) : null);
      if (targetId) {
        // Find target details for date initialization if needed
        const target = appointments.find(a => String(a.id) === targetId);
        const targetDate = target ? new Date(target.ngay_gio_bat_dau) : (allUnassignedTreatments.length > 0 ? new Date(allUnassignedTreatments[0].ngay_gio_bat_dau) : new Date());
        
        // Clean up URL parameter immediately to prevent infinite loops on re-renders
        params.delete('triggerFocus');
        const newSearch = params.toString() ? `?${params.toString()}` : '';
        navigate(location.pathname + newSearch, { replace: true });

        setSelectedDate(targetDate);
        setViewMode('today');

        // Cancel previous timer if any
        if (focusTimerRef.current) {
          clearTimeout(focusTimerRef.current);
        }

        focusTimerRef.current = setTimeout(() => {
          scrollToAppointment(targetId);
        }, 500);
      }
    }
  }, [location.search, allUnassignedTreatments, appointments, navigate, location.pathname, loading]);

  const dynamicTimeSlots = Array.from(
    new Set(
      filteredAppointments.map(apt => format(new Date(apt.ngay_gio_bat_dau), 'HH:mm'))
    )
  ).sort();



  const handleOpenDetailModal = (apt: any) => {
    setSelectedAppointment(apt);
    setAssignStatus(apt.trang_thai);
    setAssignStaffId(apt.ky_thuat_vien_id || '');
    setAssignRoomId(apt.phong_id ? String(apt.phong_id) : '');
    setAssignGiuongSo(apt.giuong_so ? String(apt.giuong_so) : '');
    setIsDetailModalOpen(true);
  };


  if (loading && appointments.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-96 gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-emerald-600 border-r-2 border-emerald-200"></div>
        <p className="text-slate-500 font-medium text-sm">Đang đồng bộ hóa hệ thống lịch trình...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-full">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-2 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="text-indigo-700" size={28} />
            <h1 className="text-3xl font-bold tracking-tight text-slate-800">
              Lịch Trình Điều Trị
            </h1>
          </div>
          <p className="text-slate-500 text-sm">Quản lý và điều phối các ca phục hồi chức năng với Kỹ thuật viên.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 self-stretch md:self-auto">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all"
          >
            + Tạo lịch điều trị
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Tổng số ca điều trị</span>
          <div className="flex justify-between items-baseline mt-3">
            <span className="text-4xl font-black text-slate-800">{kpis.total}</span>
            <span className="text-sm text-slate-400 font-medium">ca trực</span>
          </div>
        </div>
        <div className="bg-amber-50/50 p-5 rounded-2xl shadow-sm border border-amber-100 flex flex-col justify-between">
          <span className="text-amber-700 text-xs font-semibold uppercase tracking-wider">Chờ xác nhận</span>
          <div className="flex justify-between items-baseline mt-3">
            <span className="text-4xl font-black text-amber-600">{kpis.waiting}</span>
            <span className="text-xs bg-amber-100 text-amber-700 font-bold px-2 py-1 rounded-md">WAITING</span>
          </div>
        </div>
        <div className="bg-emerald-50/50 p-5 rounded-2xl shadow-sm border border-emerald-100 flex flex-col justify-between">
          <span className="text-emerald-700 text-xs font-semibold uppercase tracking-wider">Đã hoàn thành</span>
          <div className="flex justify-between items-baseline mt-3">
            <span className="text-4xl font-black text-emerald-600">{kpis.completed}</span>
            <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded-md">DONE</span>
          </div>
        </div>
        <div className="bg-rose-50/50 p-5 rounded-2xl shadow-sm border border-rose-100 flex flex-col justify-between">
          <span className="text-rose-700 text-xs font-semibold uppercase tracking-wider">Hủy / Vắng mặt</span>
          <div className="flex justify-between items-baseline mt-3">
            <span className="text-4xl font-black text-rose-600">{kpis.cancelled}</span>
            <span className="text-xs bg-rose-100 text-rose-700 font-bold px-2 py-1 rounded-md">CANCEL</span>
          </div>
        </div>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-2 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-50 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('today')}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all ${viewMode === 'today' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              <CalendarIcon size={18} /> Hôm nay
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all ${viewMode === 'week' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              <CalendarDays size={18} /> Tuần này
            </button>
          </div>

          <div className={`flex items-center rounded-xl p-1 justify-between select-none transition-all duration-300 border ${
            isCurrentRangeActive
              ? 'bg-indigo-100/80 border-indigo-300 text-indigo-900 shadow-sm font-extrabold'
              : 'bg-white border-slate-200 text-slate-700 shadow-sm'
          }`}>
            <button
              onClick={() => handleNavigateDay('prev')}
              className={`p-2 rounded-lg transition-all shadow-sm border border-transparent ${
                isCurrentRangeActive
                  ? 'hover:bg-white text-indigo-800'
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              <ChevronLeft size={18} />
            </button>
            <div className="px-4 text-sm font-semibold text-center min-w-[180px] md:min-w-[220px]">
              {viewMode === 'today'
                ? format(selectedDate, 'eeee, dd/MM/yyyy', { locale: vi })
                : `Tuần: ${format(startDateOfWeek, 'dd/MM')} - ${format(endDateOfWeek, 'dd/MM/yyyy')}`
              }
            </div>
            <button
              onClick={() => handleNavigateDay('next')}
              className={`p-2 rounded-lg transition-all shadow-sm border border-transparent ${
                isCurrentRangeActive
                  ? 'hover:bg-white text-indigo-800'
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 lg:justify-end">
          <div className="relative shrink-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 text-sm font-medium rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="cho_xac_nhan">Chờ xác nhận</option>
              <option value="dang_thuc_hien">Đang thực hiện</option>
              <option value="hoan_thanh">Hoàn thành</option>
              <option value="da_huy">Đã hủy</option>
            </select>
          </div>

          <div className="relative shrink-0">
            <select
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-sm font-medium rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer"
            >
              <option value="all">Tất cả Phòng điều trị</option>
              {roomsList
                .filter(room => room.loai_phong === 'tri_lieu' || room.loai_phong === 'phong_tri_lieu_chuan')
                .map(room => (
                  <option key={room.id} value={room.id}>{room.ten_phong}</option>
                ))}
            </select>
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          </div>

          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm bệnh nhân, mã liệu trình..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder-slate-400"
            />
          </div>
        </div>
      </div>

      {/* COMPONENT: BẢNG LƯỚI LỊCH TRÌNH */}
      {viewMode === 'today' ? (
        <AppointmentCalendar
          timeSlots={dynamicTimeSlots.length > 0 ? dynamicTimeSlots : ['08:00', '13:00']} // Fallback nếu ngày trống
          appointments={filteredAppointments}
          statusConfig={statusConfig}
          handleOpenDetailModal={handleOpenDetailModal}
        />
      ) : (
        <AppointmentWeeklyCalendar
          selectedDate={selectedDate}
          appointments={filteredAppointments}
          statusConfig={statusConfig}
          handleOpenDetailModal={handleOpenDetailModal}
          scheduleType={scheduleType}
        />
      )}

      {/* COMPONENT: MODAL CHI TIẾT CA TRỰC */}
      {isDetailModalOpen && (
        <AppointmentDetailModal
          selectedAppointment={selectedAppointment}
          roomsList={roomsList}
          staffList={staffList}
          activeRole={activeRole}
          assignRoomId={assignRoomId}
          setAssignRoomId={setAssignRoomId}
          assignGiuongSo={assignGiuongSo}
          setAssignGiuongSo={setAssignGiuongSo}
          assignStaffId={assignStaffId}
          setAssignStaffId={setAssignStaffId}
          assignStatus={assignStatus}
          setAssignStatus={setAssignStatus}
          isAssigning={isAssigning}
          onClose={() => setIsDetailModalOpen(false)}
          onSave={handleUpdateAppointment}
          onOpenTreatment={() => {}}
          onSuccess={fetchData}
          appointments={appointments}
          schedulesList={schedulesList}
        />
      )}

      {/* COMPONENT: DRAWER TẠO MỚI LỊCH ĐIỀU TRỊ */}
      <NewTreatmentForm
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}
