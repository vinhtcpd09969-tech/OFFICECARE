import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import {
  Search,
  Plus,
  Eye,
  Activity,
  Calendar,
  Wrench,
  Cpu,
  ShieldCheck
} from 'lucide-react';
import {
  getEquipment,
  createEquipment,
  updateEquipment
} from '../../api/admin.api';
import { format } from 'date-fns';
import api from '../../../../api/axios';

interface Equipment {
  id: string;
  ma_thiet_bi: string;
  ten_thiet_bi: string;
  ngay_mua?: string;
  trang_thai: string;
  ghi_chu?: string;
  phong_id?: number | null;
  ten_phong?: string;
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
  // Sorting helper states
  const [newlyCreatedId, setNewlyCreatedId] = useState<string | null>(null);

  // Modals state
  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);

  // Form state
  const [equipmentFormData, setEquipmentFormData] = useState<{
    ma_thiet_bi: string;
    ten_thiet_bi: string;
    ngay_mua: string;
    trang_thai: string;
    ghi_chu: string;
    phong_id: string | number;
  }>({
    ma_thiet_bi: '',
    ten_thiet_bi: '',
    ngay_mua: '',
    trang_thai: 'san_sang',
    ghi_chu: '',
    phong_id: ''
  });

  const [rooms, setRooms] = useState<any[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const eqRes = await getEquipment();
      
      const normalized = (eqRes.data || []).map((eq: any) => {
        let normalizedStatus = eq.trang_thai;
        if (eq.trang_thai === 'dang_su_dung' || eq.trang_thai === 'hoat_dong') normalizedStatus = 'san_sang';
        if (eq.trang_thai === 'bao_tri' || eq.trang_thai === 'tam_dung') normalizedStatus = 'dang_bao_tri';
        if (eq.trang_thai === 'hong' || eq.trang_thai === 'da_xoa' || eq.trang_thai === 'ngung_hoat_dong') normalizedStatus = 'ngung_su_dung';
        return {
          ...eq,
          trang_thai: normalizedStatus || 'san_sang'
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
    api.get('/admin/rooms').then(res => setRooms(res.data || [])).catch(() => {});
  }, []);

  const stats = useMemo(() => {
    const total = equipment.length;
    const ready = equipment.filter(e => e.trang_thai === 'san_sang').length;
    const maintenance = equipment.filter(e => e.trang_thai === 'dang_bao_tri').length;
    const discontinued = equipment.filter(e => e.trang_thai === 'ngung_su_dung').length;
    return { total, ready, maintenance, discontinued };
  }, [equipment]);

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
        trang_thai: eq.trang_thai || 'san_sang',
        ghi_chu: eq.ghi_chu || '',
        phong_id: eq.phong_id || ''
      });
    } else {
      setEditingEquipment(null);
      setEquipmentFormData({
        ma_thiet_bi: 'TB-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
        ten_thiet_bi: '',
        ngay_mua: getLocalDateString(),
        trang_thai: 'san_sang',
        ghi_chu: '',
        phong_id: ''
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
        ghi_chu: equipmentFormData.ghi_chu || null,
        phong_id: equipmentFormData.phong_id ? Number(equipmentFormData.phong_id) : null
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

  return (
    <div className="space-y-6 pb-12 animate-fade-in text-slate-800 font-sans">
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
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block">Sẵn sàng</span>
            <span className="text-2xl font-black text-emerald-700 mt-2 block">{stats.ready}</span>
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

      {/* Filters and Action Toolbar */}
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
                <option value="san_sang">🟢 Sẵn sàng</option>
                <option value="dang_bao_tri">🛠️ Đang bảo trì</option>
                <option value="ngung_su_dung">🚫 Ngưng sử dụng</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              onClick={() => handleOpenEquipmentModal()}
              className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white px-4 py-2.5 text-xs font-bold rounded-xl transition-all shadow-md shadow-teal-600/20 active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus size={16} className="stroke-[2.5]" />
              Thêm thiết bị mới
            </button>
          </div>
        </div>
      </div>

      {/* Equipment View Render */}
      {loading ? (
        <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl p-12 text-center text-slate-400 font-bold uppercase tracking-wider text-xs shadow-sm animate-pulse">
          ⏳ Đang đồng bộ hóa thiết bị y tế...
        </div>
      ) : processedEquipment.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl p-12 text-center text-slate-400 font-semibold italic text-xs shadow-sm">
          Không tìm thấy thiết bị nào phù hợp.
        </div>
      ) : (
        /* TABLE MODE */
        <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-zinc-800/60 border-b border-slate-100 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 font-black uppercase tracking-wider select-none text-[11px]">
                  <th className="p-4 pl-6 w-36 text-left">Mã máy</th>
                  <th className="p-4 text-left">Tên thiết bị y tế</th>
                  <th className="p-4 w-48 text-left">Vị trí phòng</th>
                  <th className="p-4 w-36 text-center">Ngày mua</th>
                  <th className="p-4 w-36 text-center">Trạng thái</th>
                  <th className="p-4 pr-6 w-28 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                {processedEquipment.map((eq) => {
                  const isDiscontinued = eq.trang_thai === 'ngung_su_dung';
                  const isNew = eq.id === newlyCreatedId;

                  return (
                    <tr
                      key={eq.id}
                      onClick={() => handleOpenEquipmentModal(eq)}
                      className={`hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer group ${
                        isDiscontinued ? 'bg-slate-50/30 dark:bg-zinc-900/30 opacity-75' : ''
                      } ${isNew ? 'bg-indigo-50/30 dark:bg-indigo-950/20 font-semibold shadow-sm' : ''}`}
                    >
                      <td className="p-4 pl-6 font-mono font-bold text-slate-500 dark:text-zinc-400 text-left align-middle">
                        <div className="flex flex-col">
                          <span>{eq.ma_thiet_bi}</span>
                          {isNew && (
                            <span className="text-[8px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mt-0.5">Mới tạo</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-left align-middle">
                        <div className="font-extrabold text-slate-800 dark:text-zinc-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                          {eq.ten_thiet_bi}
                        </div>
                        {eq.ghi_chu && (
                          <div className="text-[11px] text-slate-400 dark:text-zinc-500 italic mt-0.5 font-normal">
                            {eq.ghi_chu}
                          </div>
                        )}
                      </td>
                      <td className="p-4 font-bold text-slate-700 dark:text-zinc-300 text-left align-middle">
                        {eq.ten_phong ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 text-xs font-black">
                            🏢 {eq.ten_phong}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-zinc-500 font-normal italic">
                            Chưa phân phòng
                          </span>
                        )}
                      </td>
                      <td className="p-4 font-semibold text-slate-600 dark:text-zinc-300 text-center align-middle">
                        {eq.ngay_mua ? format(new Date(eq.ngay_mua), 'dd/MM/yyyy') : '—'}
                      </td>
                      <td className="p-4 text-center align-middle">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase border tracking-wider ${
                          eq.trang_thai === 'san_sang'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : eq.trang_thai === 'dang_bao_tri'
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                              : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-zinc-700'
                        }`}>
                          <span className={`size-1.5 rounded-full ${
                            eq.trang_thai === 'san_sang' 
                              ? 'bg-emerald-500 animate-pulse' 
                              : eq.trang_thai === 'dang_bao_tri' 
                                ? 'bg-amber-500 animate-pulse' 
                                : 'bg-slate-400'
                          }`} />
                          {eq.trang_thai === 'san_sang' ? 'Sẵn sàng' : eq.trang_thai === 'dang_bao_tri' ? 'Đang bảo trì' : 'Ngưng sử dụng'}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-center align-middle">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEquipmentModal(eq);
                          }}
                          className="size-8 inline-flex items-center justify-center rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-slate-600 dark:text-zinc-400 hover:text-teal-600 dark:hover:text-teal-300 border border-slate-200/80 dark:border-zinc-700/80 hover:border-teal-300 transition-all cursor-pointer shadow-2xs group/btn"
                          title="Xem chi tiết & Hiệu chỉnh"
                        >
                          <Eye size={15} className="group-hover/btn:scale-110 transition-transform" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Add / Edit Equipment */}
      {isEquipmentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 shadow-xl max-w-md w-full flex flex-col rounded-2xl animate-scale-up overflow-hidden">
            {/* Modal Header */}
            <div className="border-b border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 px-6 py-4 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block mb-0.5">
                  {editingEquipment ? 'Hạ tầng y tế' : 'Đăng ký thiết bị'}
                </span>
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-zinc-100 uppercase tracking-wider">
                  {editingEquipment ? 'Hiệu chỉnh thiết bị' : 'Thêm thiết bị mới'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEquipmentModalOpen(false)}
                className="text-slate-400 dark:text-zinc-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors font-bold text-sm cursor-pointer p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleEquipmentSubmit} className="p-6 space-y-4 text-slate-800 dark:text-zinc-200 text-xs">
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-zinc-400 uppercase tracking-widest mb-1.5">Mã thiết bị (Độc nhất)</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: LASER-01, SHOCK-02..."
                  value={equipmentFormData.ma_thiet_bi}
                  onChange={(e) => setEquipmentFormData({ ...equipmentFormData, ma_thiet_bi: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 p-2.5 font-bold rounded-xl text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-slate-500/10 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-zinc-400 uppercase tracking-widest mb-1.5">Tên thiết bị</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Máy Laser trị liệu công suất cao..."
                  value={equipmentFormData.ten_thiet_bi}
                  onChange={(e) => setEquipmentFormData({ ...equipmentFormData, ten_thiet_bi: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 p-2.5 font-bold rounded-xl text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-slate-500/10 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-zinc-400 uppercase tracking-widest mb-1.5">Phòng / Vị trí bố trí</label>
                <select
                  value={equipmentFormData.phong_id || ''}
                  onChange={(e) => setEquipmentFormData({ ...equipmentFormData, phong_id: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 p-2.5 font-bold rounded-xl text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-slate-500/10 transition-colors cursor-pointer"
                >
                  <option value="">-- Chưa gán phòng (Hoặc thiết bị lưu kho) --</option>
                  {rooms.filter((r: any) => r.loai_phong === 'phong_tri_lieu' || r.loai_phong === 'phong_dieu_tri').map((r: any) => (
                    <option key={r.id} value={r.id}>
                      🏥 {r.ten_phong} ({r.ma_phong})
                    </option>
                  ))}
                </select>
              </div>

              {/* Trạng thái 3 lựa chọn động */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-zinc-400 uppercase tracking-widest mb-1.5">Trạng thái</label>
                <select
                  value={equipmentFormData.trang_thai}
                  onChange={(e) => setEquipmentFormData({ ...equipmentFormData, trang_thai: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 p-2.5 font-bold rounded-xl text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-slate-500/10 transition-colors cursor-pointer"
                >
                  {editingEquipment ? (
                    editingEquipment.trang_thai === 'san_sang' ? (
                      <>
                        <option value="san_sang">🟢 Sẵn sàng (Hiện tại)</option>
                        <option value="dang_bao_tri">🛠️ Đang bảo trì</option>
                        <option value="ngung_su_dung">🚫 Ngưng sử dụng</option>
                      </>
                    ) : editingEquipment.trang_thai === 'dang_bao_tri' ? (
                      <>
                        <option value="dang_bao_tri">🛠️ Đang bảo trì (Hiện tại)</option>
                        <option value="san_sang">🟢 Sẵn sàng</option>
                        <option value="ngung_su_dung">🚫 Ngưng sử dụng</option>
                      </>
                    ) : (
                      <>
                        <option value="ngung_su_dung">🚫 Ngưng sử dụng (Hiện tại)</option>
                        <option value="san_sang">🟢 Sẵn sàng</option>
                        <option value="dang_bao_tri">🛠️ Đang bảo trì</option>
                      </>
                    )
                  ) : (
                    <>
                      <option value="san_sang">🟢 Sẵn sàng</option>
                      <option value="dang_bao_tri">🛠️ Đang bảo trì</option>
                      <option value="ngung_su_dung">🚫 Ngưng sử dụng</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-zinc-400 uppercase tracking-widest mb-1.5">Ngày mua</label>
                <CustomDatePicker
                  value={equipmentFormData.ngay_mua}
                  onChange={(val) => setEquipmentFormData({ ...equipmentFormData, ngay_mua: val })}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-zinc-400 uppercase tracking-widest mb-1.5">Ghi chú / Mô tả</label>
                <textarea
                  value={equipmentFormData.ghi_chu}
                  onChange={(e) => setEquipmentFormData({ ...equipmentFormData, ghi_chu: e.target.value })}
                  placeholder="Thông tin chi tiết về tình trạng máy..."
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 p-2.5 font-semibold rounded-xl text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-slate-500/10 transition-colors"
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsEquipmentModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-slate-900 dark:bg-teal-600 hover:bg-slate-800 dark:hover:bg-teal-500 text-white text-xs font-bold uppercase tracking-wider transition-colors rounded-xl active:scale-95 cursor-pointer shadow-sm"
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
