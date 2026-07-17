import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import {
  Search,
  Plus,
  Grid,
  List,
  Activity,
  Calendar,
  Wrench,
  Trash2,
  Edit3,
  RefreshCw,
  Cpu,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import {
  getEquipment,
  createEquipment,
  updateEquipment,
  deleteEquipment
} from '../../api/admin.api';
import { format } from 'date-fns';

interface Equipment {
  id: string;
  ma_thiet_bi: string;
  ten_thiet_bi: string;
  ngay_mua?: string;
  trang_thai: string;
  ghi_chu?: string;
}

// Utility to calculate local YYYY-MM-DD date string without timezone offsets
const getLocalDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Premium Custom React Calendar (Inline collapsible layout to prevent modal overflow)
function CustomDatePicker({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Parse YYYY-MM-DD value
  const currentDate = useMemo(() => {
    if (!value) return new Date();
    const d = new Date(value);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [value]);

  const [navDate, setNavDate] = useState(currentDate);

  // Sync when value changes externally
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setNavDate(d);
      }
    }
  }, [value]);

  const year = navDate.getFullYear();
  const month = navDate.getMonth();

  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  const daysInMonth = useMemo(() => {
    return new Date(year, month + 1, 0).getDate();
  }, [year, month]);

  const firstDayIndex = useMemo(() => {
    return new Date(year, month, 1).getDay();
  }, [year, month]);

  const handlePrevMonth = () => {
    setNavDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setNavDate(new Date(year, month + 1, 1));
  };

  const handleDaySelect = (dayNum: number) => {
    const selectedDate = new Date(year, month, dayNum);
    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const d = String(selectedDate.getDate()).padStart(2, '0');
    onChange(`${y}-${m}-${d}`);
    setIsOpen(false);
  };

  const formattedValue = useMemo(() => {
    if (!value) return 'Chọn ngày';
    const parts = value.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return value;
  }, [value]);

  const calendarCells = useMemo(() => {
    const cells = [];
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(d);
    }
    return cells;
  }, [firstDayIndex, daysInMonth]);

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full border border-slate-200 p-2.5 font-bold rounded-xl bg-white text-left text-slate-705 focus:outline-none focus:ring-2 focus:ring-slate-500/10 flex justify-between items-center cursor-pointer shadow-sm hover:border-slate-350 transition-colors"
      >
        <span>{formattedValue}</span>
        <Calendar size={14} className="text-slate-400" />
      </button>

      {isOpen && (
        <div className="bg-slate-50 border border-slate-150 shadow-inner rounded-2xl p-4 w-full animate-scale-up text-slate-800">
          <div className="flex justify-between items-center mb-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="size-7 rounded-lg hover:bg-slate-200 flex items-center justify-center font-bold text-slate-505 transition-colors cursor-pointer"
            >
              ‹
            </button>
            <span className="font-extrabold text-xs text-slate-800 uppercase tracking-wide">
              {monthNames[month]} {year}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="size-7 rounded-lg hover:bg-slate-200 flex items-center justify-center font-bold text-slate-505 transition-colors cursor-pointer"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center font-black text-[9px] text-slate-400 uppercase tracking-wider mb-2">
            <span>CN</span>
            <span>T2</span>
            <span>T3</span>
            <span>T4</span>
            <span>T5</span>
            <span>T6</span>
            <span>T7</span>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {calendarCells.map((cell, idx) => {
              if (cell === null) {
                return <div key={`empty-${idx}`} />;
              }

              const isSelected = 
                currentDate.getDate() === cell &&
                currentDate.getMonth() === month &&
                currentDate.getFullYear() === year;

              return (
                <button
                  key={`day-${cell}`}
                  type="button"
                  onClick={() => handleDaySelect(cell)}
                  className={`aspect-square w-full rounded-lg font-bold flex items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-teal-600 text-white shadow-sm font-black'
                      : 'hover:bg-slate-200/80 text-slate-700'
                  }`}
                >
                  {cell}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ManageEquipment() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  // Sorting helper states
  const [newlyCreatedId, setNewlyCreatedId] = useState<string | null>(null);

  // Custom Confirm Modal State
  const [deleteTarget, setDeleteTarget] = useState<Equipment | null>(null);

  // Modals state
  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);

  // Form state
  const [equipmentFormData, setEquipmentFormData] = useState({
    ma_thiet_bi: '',
    ten_thiet_bi: '',
    ngay_mua: '',
    trang_thai: 'dang_su_dung',
    ghi_chu: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const eqRes = await getEquipment();
      
      const normalized = (eqRes.data || []).map((eq: any) => {
        let normalizedStatus = eq.trang_thai;
        if (eq.trang_thai === 'san_sang') normalizedStatus = 'dang_su_dung';
        if (eq.trang_thai === 'hong' || eq.trang_thai === 'da_xoa') normalizedStatus = 'ngung_su_dung';
        return {
          ...eq,
          trang_thai: normalizedStatus
        };
      });

      setEquipment(normalized);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách thiết bị:', error);
      toast.error('Không thể kết nối API thiết bị.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = useMemo(() => {
    const activeEq = equipment.filter(e => e.trang_thai !== 'ngung_su_dung');
    const total = activeEq.length;
    const inUse = activeEq.filter(e => e.trang_thai === 'dang_su_dung').length;
    const maintenance = activeEq.filter(e => e.trang_thai === 'dang_bao_tri').length;
    const discontinued = equipment.filter(e => e.trang_thai === 'ngung_su_dung').length;
    return { total, inUse, maintenance, discontinued };
  }, [equipment]);

  const getEquipmentIcon = (name: string) => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('laser')) return '⚡';
    if (nameLower.includes('shockwave') || nameLower.includes('xung kích')) return '💥';
    if (nameLower.includes('kéo giãn') || nameLower.includes('traction')) return '🏹';
    if (nameLower.includes('siêu âm') || nameLower.includes('ultrasound')) return '🔊';
    if (nameLower.includes('nhiệt') || nameLower.includes('đông') || nameLower.includes('cryo')) return '❄️';
    if (nameLower.includes('điện xung') || nameLower.includes('tens')) return '🔋';
    return '🔌';
  };

  const processedEquipment = useMemo(() => {
    const filtered = equipment.filter(eq => {
      const query = searchQuery.toLowerCase();
      const matchSearch = eq.ten_thiet_bi.toLowerCase().includes(query) ||
        eq.ma_thiet_bi.toLowerCase().includes(query);
      if (!matchSearch) return false;

      if (selectedStatus !== 'all') {
        if (eq.trang_thai !== selectedStatus) return false;
      }

      return true;
    });

    return [...filtered].sort((a, b) => {
      const aDeleted = a.trang_thai === 'ngung_su_dung';
      const bDeleted = b.trang_thai === 'ngung_su_dung';

      if (aDeleted && !bDeleted) return 1;
      if (!aDeleted && bDeleted) return -1;

      if (a.id === newlyCreatedId) return -1;
      if (b.id === newlyCreatedId) return 1;

      return a.ten_thiet_bi.localeCompare(b.ten_thiet_bi);
    });
  }, [equipment, searchQuery, selectedStatus, newlyCreatedId]);

  const handleOpenEquipmentModal = (eq: Equipment | null = null) => {
    if (eq) {
      setEditingEquipment(eq);
      setEquipmentFormData({
        ma_thiet_bi: eq.ma_thiet_bi,
        ten_thiet_bi: eq.ten_thiet_bi,
        ngay_mua: eq.ngay_mua ? eq.ngay_mua.substring(0, 10) : '',
        trang_thai: eq.trang_thai,
        ghi_chu: eq.ghi_chu || ''
      });
    } else {
      setEditingEquipment(null);
      setEquipmentFormData({
        ma_thiet_bi: 'TB-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
        ten_thiet_bi: '',
        ngay_mua: getLocalDateString(),
        trang_thai: 'dang_su_dung',
        ghi_chu: ''
      });
    }
    setIsEquipmentModalOpen(true);
  };

  const handleEquipmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipmentFormData.ma_thiet_bi.trim()) {
      toast.error('Vui lòng nhập mã thiết bị.');
      return;
    }
    if (!equipmentFormData.ten_thiet_bi.trim()) {
      toast.error('Vui lòng nhập tên thiết bị.');
      return;
    }

    try {
      const dataToSend = {
        ma_thiet_bi: equipmentFormData.ma_thiet_bi.trim(),
        ten_thiet_bi: equipmentFormData.ten_thiet_bi.trim(),
        ngay_mua: equipmentFormData.ngay_mua || null,
        trang_thai: equipmentFormData.trang_thai,
        ghi_chu: equipmentFormData.ghi_chu || null
      };

      if (editingEquipment) {
        await updateEquipment(editingEquipment.id, dataToSend);
        toast.success('Cập nhật thiết bị thành công!');
      } else {
        const res = await createEquipment(dataToSend);
        toast.success('Thêm thiết bị mới thành công!');
        if (res?.data?.id) {
          setNewlyCreatedId(res.data.id);
        }
      }
      setIsEquipmentModalOpen(false);
      loadData();
    } catch (error: any) {
      console.error(error);
      const msg = error?.response?.data?.message || 'Lỗi khi lưu thông tin thiết bị.';
      toast.error(msg);
    }
  };

  const confirmSoftDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteEquipment(deleteTarget.id);
      toast.success(`Đã ngưng sử dụng thiết bị "${deleteTarget.ten_thiet_bi}" thành công.`);
      setDeleteTarget(null);
      loadData();
    } catch (error) {
      toast.error('Lỗi khi cập nhật trạng thái thiết bị.');
    }
  };

  const handleRestoreEquipment = async (eq: Equipment) => {
    try {
      await updateEquipment(eq.id, {
        ma_thiet_bi: eq.ma_thiet_bi,
        ten_thiet_bi: eq.ten_thiet_bi,
        ngay_mua: eq.ngay_mua ? eq.ngay_mua.substring(0, 10) : null,
        trang_thai: 'dang_su_dung',
        ghi_chu: eq.ghi_chu || null
      });
      toast.success('Đã khôi phục thiết bị hoạt động bình thường!');
      setNewlyCreatedId(eq.id);
      loadData();
    } catch (error) {
      toast.error('Lỗi khi khôi phục thiết bị.');
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in text-slate-800 font-sans">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
            <Cpu size={26} className="text-teal-600 stroke-[2.5]" />
            Quản lý Thiết bị Y tế
          </h2>
          <p className="text-slate-500 mt-1 text-xs font-semibold">
            Quản lý danh mục thiết bị, theo dõi trạng thái hoạt động và khấu hao thời gian máy móc.
          </p>
        </div>

        <div>
          <button
            onClick={() => handleOpenEquipmentModal()}
            className="bg-slate-900 hover:bg-slate-850 text-white px-4 py-2.5 text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-1.5 cursor-pointer animate-scale-up"
          >
            <Plus size={16} className="stroke-[2.5]" />
            Thêm thiết bị mới
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center justify-between transition-all hover:shadow-md">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Tổng số thiết bị</span>
            <span className="text-2xl font-black text-slate-800 mt-2 block">{stats.total}</span>
          </div>
          <div className="size-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Cpu size={20} className="stroke-[2.25]" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center justify-between transition-all hover:shadow-md">
          <div>
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block">Đang hoạt động</span>
            <span className="text-2xl font-black text-emerald-700 mt-2 block">{stats.inUse}</span>
          </div>
          <div className="size-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <ShieldCheck size={20} className="stroke-[2.25]" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center justify-between transition-all hover:shadow-md">
          <div>
            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest block">Đang bảo trì</span>
            <span className="text-2xl font-black text-amber-700 mt-2 block">{stats.maintenance}</span>
          </div>
          <div className="size-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Wrench size={20} className="stroke-[2.25]" />
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center justify-between transition-all hover:shadow-md">
          <div>
            <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest block">Ngưng sử dụng</span>
            <span className="text-2xl font-black text-rose-700 mt-2 block">{stats.discontinued}</span>
          </div>
          <div className="size-11 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
            <Activity size={20} className="stroke-[2.25]" />
          </div>
        </div>
      </div>

      {/* Filters and View toggles */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4.5 h-4.5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm tên máy hoặc mã số..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 p-2.5 pl-9 text-xs font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500/10 transition-all placeholder-slate-400"
              />
            </div>

            <div className="w-full sm:w-48">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500/10 cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="dang_su_dung">🟢 Đang sử dụng</option>
                <option value="dang_bao_tri">🛠️ Đang bảo trì</option>
                <option value="ngung_su_dung">🚫 Ngưng sử dụng</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 border border-slate-100 bg-slate-50 p-1.5 rounded-xl self-end md:self-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-800 shadow-sm font-black'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Chế độ lưới"
            >
              <Grid size={15} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-slate-800 shadow-sm font-black'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Chế độ danh sách"
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Equipment View Render */}
      {loading ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-400 font-bold uppercase tracking-wider text-xs shadow-sm animate-pulse">
          ⏳ Đang đồng bộ hóa thiết bị y tế...
        </div>
      ) : processedEquipment.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-400 font-semibold italic text-xs shadow-sm">
          Không tìm thấy thiết bị nào phù hợp.
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID MODE */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {processedEquipment.map((eq) => {
            const isDiscontinued = eq.trang_thai === 'ngung_su_dung';
            const icon = getEquipmentIcon(eq.ten_thiet_bi);
            const isNew = eq.id === newlyCreatedId;

            return (
              <div
                key={eq.id}
                className={`bg-white border rounded-2xl p-5 shadow-sm transition-all duration-300 relative flex flex-col justify-between min-h-[200px] ${
                  isNew ? 'ring-2 ring-indigo-500 border-indigo-200 shadow-md shadow-indigo-500/5' : ''
                } ${
                  isDiscontinued 
                    ? 'border-slate-200 bg-slate-50/20 opacity-75' 
                    : 'border-slate-100 hover:border-slate-200 hover:shadow-md'
                }`}
              >
                {/* Header info */}
                <div>
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xl shrink-0">{icon}</span>
                      <div className="flex flex-col">
                        <span className="font-mono text-[9px] font-black text-slate-400 uppercase">{eq.ma_thiet_bi}</span>
                        {isNew && (
                          <span className="inline-block bg-indigo-50 text-indigo-700 text-[8px] font-extrabold px-1.5 py-0.5 rounded tracking-wide uppercase mt-0.5 w-fit">
                            Mới tạo
                          </span>
                        )}
                      </div>
                    </div>

                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border tracking-wide ${
                      eq.trang_thai === 'dang_su_dung'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : eq.trang_thai === 'dang_bao_tri'
                          ? 'bg-amber-50 text-amber-700 border-amber-100'
                          : 'bg-slate-100 text-slate-505 border-slate-200'
                    }`}>
                      {!isDiscontinued && (
                        <span className={`size-1.5 rounded-full shrink-0 ${
                          eq.trang_thai === 'dang_su_dung'
                            ? 'bg-emerald-500 animate-pulse'
                            : 'bg-amber-500 animate-pulse'
                        }`} />
                      )}
                      {eq.trang_thai === 'dang_su_dung' ? 'Đang sử dụng' : eq.trang_thai === 'dang_bao_tri' ? 'Đang bảo trì' : 'Ngưng sử dụng'}
                    </span>
                  </div>

                  <h4 className="font-black text-slate-800 text-sm mt-3.5 leading-tight">{eq.ten_thiet_bi}</h4>
                  
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold mt-2.5">
                    <Calendar size={11} />
                    <span>Ngày mua: {eq.ngay_mua ? format(new Date(eq.ngay_mua), 'dd/MM/yyyy') : '—'}</span>
                  </div>

                  {eq.ghi_chu && (
                    <p className="text-[11px] text-slate-450 italic mt-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100/50 line-clamp-2">
                      "{eq.ghi_chu}"
                    </p>
                  )}
                </div>

                <div className="flex gap-2 justify-end pt-4 border-t border-slate-50 mt-4">
                  {isDiscontinued ? (
                    <button
                      onClick={() => handleRestoreEquipment(eq)}
                      className="px-3.5 py-1.5 border border-emerald-250 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-bold text-[10px] transition-all flex items-center gap-1 active:scale-95 cursor-pointer shadow-sm"
                    >
                      <RefreshCw size={10} />
                      Khôi phục hoạt động
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleOpenEquipmentModal(eq)}
                        className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-655 hover:text-slate-800 rounded-xl font-bold text-[10px] transition-all flex items-center gap-1 active:scale-95 cursor-pointer shadow-sm"
                      >
                        <Edit3 size={10} />
                        Sửa
                      </button>
                      <button
                        onClick={() => setDeleteTarget(eq)}
                        className="px-2.5 py-1.5 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl font-bold text-[10px] transition-all flex items-center gap-1 active:scale-95 cursor-pointer shadow-sm"
                      >
                        <Trash2 size={10} />
                        Ngưng sử dụng
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE MODE */
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-550 font-bold uppercase tracking-wider select-none">
                  <th className="p-4 pl-6 w-32">Mã máy</th>
                  <th className="p-4">Tên thiết bị y tế</th>
                  <th className="p-4 w-44">Ngày mua</th>
                  <th className="p-4 text-center w-36">Trạng thái</th>
                  <th className="p-4 pr-6 text-right w-48">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {processedEquipment.map((eq) => {
                  const isDiscontinued = eq.trang_thai === 'ngung_su_dung';
                  const isNew = eq.id === newlyCreatedId;

                  return (
                    <tr
                      key={eq.id}
                      className={`hover:bg-slate-50/50 transition-colors ${
                        isDiscontinued ? 'bg-slate-50/30 opacity-75' : ''
                      } ${isNew ? 'bg-indigo-50/30 font-semibold shadow-sm' : ''}`}
                    >
                      <td className="p-4 pl-6 font-mono font-bold text-slate-500">
                        <div className="flex flex-col">
                          <span>{eq.ma_thiet_bi}</span>
                          {isNew && (
                            <span className="text-[8px] font-black text-indigo-600 uppercase tracking-wide mt-0.5">Mới tạo</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-extrabold text-slate-800">{eq.ten_thiet_bi}</div>
                        {eq.ghi_chu && <div className="text-[11px] text-slate-400 italic mt-0.5">{eq.ghi_chu}</div>}
                      </td>
                      <td className="p-4 font-semibold text-slate-700">
                        {eq.ngay_mua ? format(new Date(eq.ngay_mua), 'dd/MM/yyyy') : '—'}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border tracking-wider ${
                          eq.trang_thai === 'dang_su_dung'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : eq.trang_thai === 'dang_bao_tri'
                              ? 'bg-amber-50 text-amber-700 border-amber-100'
                              : 'bg-slate-100 text-slate-505 border-slate-200'
                        }`}>
                          {eq.trang_thai === 'dang_su_dung' ? 'Đang sử dụng' : eq.trang_thai === 'dang_bao_tri' ? 'Đang bảo trì' : 'Ngưng sử dụng'}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex justify-end gap-2">
                          {isDiscontinued ? (
                            <button
                              onClick={() => handleRestoreEquipment(eq)}
                              className="px-3.5 py-1.5 border border-emerald-250 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-bold text-[10px] transition-all flex items-center gap-1 active:scale-95 cursor-pointer shadow-sm"
                            >
                              <RefreshCw size={10} />
                              Khôi phục
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => handleOpenEquipmentModal(eq)}
                                className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-655 hover:text-slate-800 rounded-xl font-bold text-[10px] transition-all flex items-center gap-1 active:scale-95 cursor-pointer shadow-sm"
                              >
                                <Edit3 size={10} />
                                Sửa
                              </button>
                              <button
                                onClick={() => setDeleteTarget(eq)}
                                className="px-2.5 py-1.5 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl font-bold text-[10px] transition-all flex items-center gap-1 active:scale-95 cursor-pointer shadow-sm"
                              >
                                <Trash2 size={10} />
                                Ngưng
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Custom Pro Confirm Modal (No local native window.confirm!) */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in">
          <div className="bg-white border border-slate-100 shadow-2xl max-w-sm w-full flex flex-col overflow-hidden rounded-2xl animate-scale-up">
            <div className="p-6 text-center space-y-4">
              <div className="size-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
                <AlertTriangle size={28} className="stroke-[2.25]" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-black text-slate-800">Xác nhận ngưng sử dụng</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Bạn có chắc chắn muốn ngưng hoạt động thiết bị <strong className="text-slate-850 font-bold">"{deleteTarget.ten_thiet_bi}"</strong>?
                  Máy sẽ bị chuyển trạng thái thành Ngưng sử dụng và đưa xuống cuối danh sách.
                </p>
              </div>
            </div>
            <div className="bg-slate-50 px-6 py-4 flex gap-3 justify-end border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 border border-slate-200 bg-white text-slate-550 text-xs font-bold rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmSoftDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors active:scale-95 cursor-pointer"
              >
                Xác nhận ngưng dùng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add / Edit Equipment */}
      {isEquipmentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-100 shadow-xl max-w-md w-full flex flex-col rounded-2xl animate-scale-up">
            {/* Modal Header */}
            <div className="border-b border-slate-100 bg-slate-50 px-6 py-4 flex justify-between items-center rounded-t-2xl">
              <div>
                <span className="text-[10px] font-black text-indigo-655 uppercase tracking-widest block mb-0.5">
                  {editingEquipment ? 'Hạ tầng y tế' : 'Đăng ký thiết bị'}
                </span>
                <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">
                  {editingEquipment ? 'Hiệu chỉnh thiết bị' : 'Thêm thiết bị mới'}
                </h3>
              </div>
              <button
                onClick={() => setIsEquipmentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleEquipmentSubmit} className="p-6 space-y-4 text-slate-800 text-xs rounded-b-2xl">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Mã thiết bị (Độc nhất)</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: LASER-01, SHOCK-02..."
                  value={equipmentFormData.ma_thiet_bi}
                  onChange={(e) => setEquipmentFormData({ ...equipmentFormData, ma_thiet_bi: e.target.value })}
                  className="w-full border border-slate-200 p-2.5 font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500/10 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tên thiết bị</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Máy Laser trị liệu công suất cao..."
                  value={equipmentFormData.ten_thiet_bi}
                  onChange={(e) => setEquipmentFormData({ ...equipmentFormData, ten_thiet_bi: e.target.value })}
                  className="w-full border border-slate-200 p-2.5 font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500/10 transition-colors"
                />
              </div>

              {editingEquipment && (
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Trạng thái</label>
                  <select
                    value={equipmentFormData.trang_thai}
                    onChange={(e) => setEquipmentFormData({ ...equipmentFormData, trang_thai: e.target.value })}
                    className="w-full border border-slate-200 p-2.5 font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500/10 transition-colors cursor-pointer"
                  >
                    <option value="dang_su_dung">Đang sử dụng</option>
                    <option value="dang_bao_tri">Đang bảo trì</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Ngày mua</label>
                <CustomDatePicker
                  value={equipmentFormData.ngay_mua}
                  onChange={(val) => setEquipmentFormData({ ...equipmentFormData, ngay_mua: val })}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Ghi chú / Mô tả</label>
                <textarea
                  value={equipmentFormData.ghi_chu}
                  onChange={(e) => setEquipmentFormData({ ...equipmentFormData, ghi_chu: e.target.value })}
                  placeholder="Thông tin chi tiết về tình trạng máy..."
                  rows={3}
                  className="w-full border border-slate-200 p-2.5 font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500/10 transition-colors"
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEquipmentModalOpen(false)}
                  className="px-4 py-2 border border-slate-250 text-slate-500 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider transition-colors rounded-xl active:scale-95"
                >
                  {editingEquipment ? 'Lưu thông tin' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
