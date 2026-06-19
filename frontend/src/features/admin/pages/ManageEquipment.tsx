import { useState, useEffect, useMemo } from 'react';
import { 
  getRooms, 
  getEquipment, 
  createEquipment, 
  updateEquipment, 
  deleteEquipment 
} from '../../../api/admin.api';

// --- Types ---
interface Room {
  id: string | number;
  ten_phong: string;
  ma_phong: string;
  loai_phong: string;
  tang: string;
}

interface Equipment {
  id: string | number;
  ma_thiet_bi: string;
  ten_thiet_bi: string;
  loai_thiet_bi?: string;
  ngay_mua?: string;
  ngay_bao_tri_tiep_theo?: string;
  ngay_bao_tri_gan_nhat?: string;
  trang_thai: string;
  phong_id_hien_tai?: string | number | null;
  ten_phong?: string;
  ghi_chu?: string;
  co_the_di_chuyen?: boolean;
  so_lan_su_dung?: number;
  nguong_canh_bao?: number | null;
  nguong_bat_buoc_bao_tri?: number | null;
  tan_suat_bao_tri_ngay?: number | null;
  cap_rui_ro?: string;
  active_booking_type?: string;
  active_booking_id?: string;
  active_patient_name?: string;
  active_operator_name?: string;
  active_service_name?: string;
  active_booking_code?: string;
}

// --- Constants & Helpers for Grouping ---
const DEVICE_TO_GROUP_MAP: Record<string, string> = {
  'Đèn hồng ngoại': 'nhiet',
  'Máy laser': 'nhiet',
  'Máy điện xung': 'dien',
  'Máy Shockwave': 'co_hoc',
  'Máy siêu âm': 'co_hoc',
  'Máy nén ép': 'co_hoc',
  'Giường kéo giãn': 'keo_gian',
  'Máy kéo giãn cổ': 'keo_gian',
  'Máy từ trường': 'tu_truong'
};

const GROUP_LABELS: Record<string, string> = {
  'nhiet': 'Nhiệt',
  'dien': 'Điện',
  'co_hoc': 'Cơ học/Sóng',
  'keo_gian': 'Kéo giãn',
  'tu_truong': 'Từ trường',
  'khac': 'Khác (Dụng cụ/Thiết bị tập)'
};

// Maps group key → loai_thiet_bi representative value (for SQL trigger compatibility)
const GROUP_TO_LOAI_THIET_BI: Record<string, string> = {
  nhiet: 'Đèn hồng ngoại',
  dien: 'Máy điện xung',
  co_hoc: 'Máy Shockwave',
  keo_gian: 'Giường kéo giãn',
  tu_truong: 'Máy từ trường',
  khac: 'Thiết bị phòng tập'
};

const GROUP_OPTIONS = [
  { value: 'nhiet', label: 'Nhóm tác động Nhiệt' },
  { value: 'dien', label: 'Nhóm tác động Điện' },
  { value: 'co_hoc', label: 'Nhóm tác động Cơ học / Sóng' },
  { value: 'keo_gian', label: 'Nhóm tác động Kéo giãn' },
  { value: 'tu_truong', label: 'Nhóm tác động Từ trường' },
  { value: 'khac', label: 'Dụng cụ & Thiết bị khác' }
];

export default function ManageEquipment() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');
  const [statFilter, setStatFilter] = useState<string | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' | 'info' }[]>([]);
  
  // Modals state
  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'nhiet': true,
    'dien': true,
    'co_hoc': true,
    'keo_gian': true,
    'tu_truong': true,
    'khac': true
  });

  // Form state
  const [formGroup, setFormGroup] = useState<string>('dien');
  const [formDeviceName, setFormDeviceName] = useState<string>('');

  const [equipmentFormData, setEquipmentFormData] = useState({
    ten_thiet_bi: '',
    ma_thiet_bi: '',
    loai_thiet_bi: 'Máy điện xung',
    ngay_mua: '',
    ngay_bao_tri_tiep_theo: '',
    trang_thai: 'san_sang',
    phong_id_hien_tai: '' as string | number,
    ghi_chu: '',
    co_the_di_chuyen: true,
    cap_rui_ro: 'trung_binh',
    tan_suat_bao_tri_ngay: 45,
    nguong_canh_bao: 80,
    nguong_bat_buoc_bao_tri: 100,
    ngay_bao_tri_gan_nhat: ''
  });

  // Derive loai_thiet_bi from selected group for SQL trigger compatibility
  const getLoaiThietBiFromGroup = (group: string) => GROUP_TO_LOAI_THIET_BI[group] || 'Thiết bị phòng tập';

  // Check if a group represents stationary equipment
  const isStationaryGroup = (group: string) => group === 'keo_gian' || group === 'tu_truong';

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Fetch all rooms & equipment
  const loadData = async () => {
    try {
      setLoading(true);
      const [roomsRes, eqRes] = await Promise.all([getRooms(), getEquipment()]);
      setRooms(roomsRes.data || []);
      setEquipment(eqRes.data || []);
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu y tế:', error);
      showToast('Không thể kết nối API. Đang dùng dữ liệu mô phỏng.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Statistics calculation
  const stats = useMemo(() => {
    const totalEq = equipment.length;
    const maintenanceEq = equipment.filter(e => e.trang_thai === 'dang_bao_tri' || e.trang_thai === 'hong').length;
    
    // Check overdue maintenance based on use count
    const overdueEq = equipment.filter(e => {
      return e.so_lan_su_dung !== undefined && e.nguong_canh_bao && e.so_lan_su_dung >= e.nguong_canh_bao && e.trang_thai === 'san_sang';
    }).length;

    return {
      totalEq,
      maintenanceEq,
      overdueEq
    };
  }, [equipment]);

  const filteredEquipment = useMemo(() => {
    return equipment.filter(eq => {
      const query = searchQuery.toLowerCase();
      const matchSearch = eq.ten_thiet_bi.toLowerCase().includes(query) ||
                          eq.ma_thiet_bi.toLowerCase().includes(query) ||
                          (eq.ten_phong && eq.ten_phong.toLowerCase().includes(query));
      if (!matchSearch) return false;

      if (selectedStatus !== 'all') {
        if (selectedStatus === 'san_sang' && eq.trang_thai !== 'san_sang') return false;
        if (selectedStatus === 'dang_su_dung' && eq.trang_thai !== 'dang_su_dung') return false;
        if (selectedStatus === 'dang_bao_tri' && eq.trang_thai !== 'dang_bao_tri') return false;
        if (selectedStatus === 'hong' && eq.trang_thai !== 'hong') return false;
      }

      if (selectedGroupFilter !== 'all') {
        const type = eq.loai_thiet_bi || '';
        const groupKey = DEVICE_TO_GROUP_MAP[type] || 'khac';
        if (groupKey !== selectedGroupFilter) return false;
      }

      if (statFilter === 'eq_maintenance' && eq.trang_thai !== 'dang_bao_tri' && eq.trang_thai !== 'hong') return false;
      if (statFilter === 'eq_overdue') {
        const isOverdue = eq.so_lan_su_dung !== undefined && eq.nguong_canh_bao && eq.so_lan_su_dung >= eq.nguong_canh_bao && eq.trang_thai === 'san_sang';
        if (!isOverdue) return false;
      }

      return true;
    });
  }, [equipment, searchQuery, selectedStatus, selectedGroupFilter, statFilter]);

  const groupedEquipment = useMemo(() => {
    const groups: Record<string, Equipment[]> = {
      'nhiet': [],
      'dien': [],
      'co_hoc': [],
      'keo_gian': [],
      'tu_truong': [],
      'khac': []
    };
    
    filteredEquipment.forEach(eq => {
      const type = eq.loai_thiet_bi || '';
      const groupKey = DEVICE_TO_GROUP_MAP[type] || 'khac';
      groups[groupKey].push(eq);
    });
    return groups;
  }, [filteredEquipment]);

  const getCompatibleRooms = (loaiThietBi: string) => {
    const typeLower = (loaiThietBi || '').toLowerCase();
    
    return rooms.filter(r => {
      if (typeLower.includes('kéo giãn') || typeLower.includes('keo gian') || typeLower.includes('từ trường') || typeLower.includes('tu truong')) {
        return r.loai_phong === 'phong_may_co_dinh';
      }
      
      if (typeLower.includes('tập') || typeLower.includes('tap') || typeLower.includes('phcn')) {
        return r.loai_phong === 'phong_tap_phcn' || r.loai_phong === 'phuc_hoi';
      }
      
      return r.loai_phong === 'kho_thiet_bi' || r.loai_phong === 'phong_tri_lieu_chuan';
    });
  };

  // Handle Equipment CRUD
  const handleOpenEquipmentModal = (eq: Equipment | null = null) => {
    if (eq) {
      const deviceType = eq.loai_thiet_bi || 'Máy điện xung';
      const groupKey = DEVICE_TO_GROUP_MAP[deviceType] || 'khac';

      setFormGroup(groupKey);
      setFormDeviceName(eq.ten_thiet_bi);

      setEditingEquipment(eq);
      setEquipmentFormData({
        ten_thiet_bi: eq.ten_thiet_bi,
        ma_thiet_bi: eq.ma_thiet_bi,
        loai_thiet_bi: deviceType,
        ngay_mua: eq.ngay_mua ? eq.ngay_mua.substring(0, 10) : '',
        ngay_bao_tri_tiep_theo: eq.ngay_bao_tri_tiep_theo ? eq.ngay_bao_tri_tiep_theo.substring(0, 10) : '',
        trang_thai: eq.trang_thai,
        phong_id_hien_tai: eq.phong_id_hien_tai || '',
        ghi_chu: eq.ghi_chu || '',
        co_the_di_chuyen: eq.co_the_di_chuyen !== false,
        cap_rui_ro: eq.cap_rui_ro || 'trung_binh',
        tan_suat_bao_tri_ngay: eq.tan_suat_bao_tri_ngay ?? 45,
        nguong_canh_bao: eq.nguong_canh_bao ?? 80,
        nguong_bat_buoc_bao_tri: eq.nguong_bat_buoc_bao_tri ?? 100,
        ngay_bao_tri_gan_nhat: eq.ngay_bao_tri_gan_nhat ? eq.ngay_bao_tri_gan_nhat.substring(0, 10) : ''
      });
    } else {
      const defaultGroup = 'dien';
      setFormGroup(defaultGroup);
      setFormDeviceName('');
      setEditingEquipment(null);
      setEquipmentFormData({
        ten_thiet_bi: '',
        ma_thiet_bi: '',
        loai_thiet_bi: getLoaiThietBiFromGroup(defaultGroup),
        ngay_mua: new Date().toISOString().substring(0, 10),
        ngay_bao_tri_tiep_theo: '',
        trang_thai: 'san_sang',
        phong_id_hien_tai: '',
        ghi_chu: '',
        co_the_di_chuyen: true,
        cap_rui_ro: 'trung_binh',
        tan_suat_bao_tri_ngay: 45,
        nguong_canh_bao: 80,
        nguong_bat_buoc_bao_tri: 100,
        ngay_bao_tri_gan_nhat: ''
      });
    }
    setIsEquipmentModalOpen(true);
  };

  const handleEquipmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = formDeviceName.trim();
    if (!trimmedName) {
      showToast('Vui lòng nhập tên thiết bị.', 'error');
      return;
    }
    try {
      const loai = getLoaiThietBiFromGroup(formGroup);
      const dataToSend = {
        ...equipmentFormData,
        loai_thiet_bi: loai,
        ten_thiet_bi: trimmedName,
        phong_id_hien_tai: equipmentFormData.phong_id_hien_tai ? Number(equipmentFormData.phong_id_hien_tai) : null
      };
      
      if (editingEquipment) {
        await updateEquipment(editingEquipment.id.toString(), dataToSend);
        showToast('Cập nhật thiết bị thành công!');
      } else {
        await createEquipment(dataToSend);
        showToast('Thêm thiết bị mới thành công!');
      }
      setIsEquipmentModalOpen(false);
      loadData();
    } catch (error) {
      console.error(error);
      showToast('Lỗi khi lưu thông tin thiết bị.', 'error');
    }
  };

  const handleDeleteEquipment = async (id: string | number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa thiết bị này khỏi hệ thống?')) {
      try {
        await deleteEquipment(id.toString());
        showToast('Đã xóa thiết bị thành công.');
        loadData();
      } catch (error) {
        showToast('Lỗi khi xóa thiết bị.', 'error');
      }
    }
  };

  const translateFloor = (floor: string) => {
    if (floor.toLowerCase() === 'tang 1') return 'Tầng 1';
    if (floor.toLowerCase() === 'tang 2') return 'Tầng 2';
    if (floor.toLowerCase() === 'tang 3') return 'Tầng 3';
    return floor;
  };

  return (
    <div className="space-y-6 pb-12 relative animate-[fadeIn_0.4s_ease-out] font-sans text-slate-800">
      
      {/* HUD-Style Custom Toast System */}
      <div className="fixed top-6 right-6 z-[999] flex flex-col gap-3">
        {toasts.map(t => (
          <div 
            key={t.id} 
            className={`border px-5 py-3.5 rounded-none shadow-[0_4px_20px_rgba(0,0,0,0.08)] flex items-center justify-between gap-4 w-96 backdrop-blur-md transition-all duration-300 translate-x-0 border-l-[3px] ${
              t.type === 'success' 
                ? 'bg-emerald-50/90 border-emerald-500 text-emerald-950 border-l-emerald-500' 
                : t.type === 'error' 
                  ? 'bg-rose-50/90 border-rose-500 text-rose-950 border-l-rose-500' 
                  : 'bg-teal-50/90 border-teal-500 text-teal-950 border-l-teal-500'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold tracking-widest uppercase">
                {t.type === 'success' ? 'SUCCESS' : t.type === 'error' ? 'ERROR' : 'INFO'}
              </span>
              <p className="text-sm font-medium">{t.message}</p>
            </div>
            <button onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))} className="text-slate-400 hover:text-slate-600 transition-colors">
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <h2 className="text-3xl font-extrabold text-teal-950 tracking-tight flex items-center gap-3">
            <svg className="w-8 h-8 text-teal-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            QUẢN LÝ THIẾT BỊ Y TẾ
          </h2>
          <p className="text-slate-500 mt-1 text-sm font-medium tracking-wide uppercase">Kiểm định kỹ thuật máy móc & điều phối công nghệ trị liệu tại Office Care</p>
        </div>
        
        <div>
          <button 
            onClick={() => handleOpenEquipmentModal()}
            className="bg-teal-800 hover:bg-teal-900 text-white px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all duration-200 rounded-none active:scale-95 shadow-sm"
          >
            + THÊM THIẾT BỊ Y TẾ
          </button>
        </div>
      </div>

      {/* QUICK STATS HEADER PANEL */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => setStatFilter(null)}
          className={`border p-5 cursor-pointer transition-all duration-300 rounded-none hover:shadow-md ${!statFilter ? 'bg-teal-950/5 border-teal-800 shadow-[0_0_12px_rgba(15,118,110,0.06)]' : 'bg-white border-slate-200 hover:border-slate-300'}`}
        >
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Tổng Số Thiết Bị</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{stats.totalEq}</span>
            <span className="text-xs text-slate-400">máy móc đang quản lý</span>
          </div>
        </div>

        <div 
          className="border p-5 bg-white border-slate-200 hover:border-slate-300 transition-all duration-300 rounded-none"
        >
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Đã Điều Phối Vào Phòng</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-teal-850 tracking-tight">
              {equipment.filter(e => e.phong_id_hien_tai).length}
            </span>
            <span className="text-xs text-slate-400">thiết bị nằm ngoài kho</span>
          </div>
        </div>

        <div 
          onClick={() => setStatFilter('eq_maintenance')}
          className={`border p-5 cursor-pointer transition-all duration-300 rounded-none hover:shadow-md ${statFilter === 'eq_maintenance' ? 'bg-rose-50/50 border-rose-600 shadow-[0_0_12px_rgba(244,63,94,0.06)]' : 'bg-white border-slate-200 hover:border-slate-300'}`}
        >
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Thiết Bị Sự Cố / Bảo Trì</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-700 tracking-tight">{stats.maintenanceEq}</span>
            <span className="text-xs text-slate-400">đang sửa hoặc hỏng</span>
          </div>
        </div>

        <div 
          onClick={() => setStatFilter('eq_overdue')}
          className={`border p-5 cursor-pointer transition-all duration-300 rounded-none hover:shadow-md ${statFilter === 'eq_overdue' ? 'bg-amber-50/50 border-amber-600 shadow-[0_0_12px_rgba(245,158,11,0.06)]' : 'bg-white border-slate-200 hover:border-slate-300'}`}
        >
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Máy Cần Hiệu Chuẩn</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-700 tracking-tight">{stats.overdueEq}</span>
            <span className="text-xs text-rose-500 font-bold">chạm ngưỡng cảnh báo</span>
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTERS PANEL */}
      <div className="bg-slate-50 border border-slate-200 p-5 rounded-none grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        
        {/* Search */}
        <div className="relative md:col-span-2">
          <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input 
            type="text" 
            placeholder="Tìm mã thiết bị, tên máy, vị trí phòng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 bg-white text-sm font-semibold rounded-none focus:outline-none focus:border-teal-800 placeholder-slate-400"
          />
        </div>

        {/* Nhóm tác động selector */}
        <div>
          <select 
            value={selectedGroupFilter}
            onChange={(e) => setSelectedGroupFilter(e.target.value)}
            className="w-full py-2 px-3 border border-slate-200 bg-white text-sm font-bold rounded-none focus:outline-none focus:border-teal-800"
          >
            <option value="all">TẤT CẢ NHÓM TÁC ĐỘNG</option>
            <option value="nhiet">NHÓM TÁC ĐỘNG NHIỆT</option>
            <option value="dien">NHÓM TÁC ĐỘNG ĐIỆN</option>
            <option value="co_hoc">NHÓM CƠ HỌC / SÓNG</option>
            <option value="keo_gian">NHÓM KÉO GIÃN</option>
            <option value="tu_truong">NHÓM TỪ TRƯỜNG</option>
            <option value="khac">DỤNG CỤ & THIẾT BỊ KHÁC</option>
          </select>
        </div>

        {/* Status selector */}
        <div>
          <select 
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full py-2 px-3 border border-slate-200 bg-white text-sm font-bold rounded-none focus:outline-none focus:border-teal-800"
          >
            <option value="all">TẤT CẢ TRẠNG THÁI</option>
            <option value="san_sang">HOẠT ĐỘNG BÌNH THƯỜNG</option>
            <option value="dang_su_dung">ĐANG ĐƯỢC VẬN HÀNH</option>
            <option value="dang_bao_tri">ĐANG HIỆU CHUẨN/BẢO TRÌ</option>
            <option value="hong">HỎNG / NGỪNG SỬ DỤNG</option>
          </select>
        </div>
      </div>

      {/* Active filters display */}
      {(statFilter || selectedStatus !== 'all' || selectedGroupFilter !== 'all' || searchQuery) && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Đang lọc theo:</span>
          {searchQuery && (
            <span className="bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-semibold rounded-none flex items-center gap-1.5">
              Từ khóa: "{searchQuery}"
              <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </span>
          )}
          {selectedGroupFilter !== 'all' && (
            <span className="bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-semibold rounded-none flex items-center gap-1.5">
              Nhóm tác động: {GROUP_LABELS[selectedGroupFilter]}
              <button onClick={() => setSelectedGroupFilter('all')} className="text-slate-400 hover:text-slate-655 font-bold">✕</button>
            </span>
          )}
          {selectedStatus !== 'all' && (
            <span className="bg-slate-100 border border-slate-200 px-2.5 py-1 text-xs font-semibold rounded-none flex items-center gap-1.5">
              Trạng thái: {selectedStatus === 'san_sang' ? 'Hoạt động bình thường' : selectedStatus === 'dang_su_dung' ? 'Đang sử dụng' : selectedStatus === 'dang_bao_tri' ? 'Đang bảo trì' : 'Hỏng'}
              <button onClick={() => setSelectedStatus('all')} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </span>
          )}
          {statFilter && (
            <span className="bg-teal-50 border border-teal-200 text-teal-950 px-2.5 py-1 text-xs font-black rounded-none flex items-center gap-1.5 uppercase tracking-wider">
              {statFilter === 'eq_maintenance' ? 'Lỗi/Sự cố' : statFilter === 'eq_overdue' ? 'Đến hạn bảo trì' : 'Lọc chỉ số'}
              <button onClick={() => setStatFilter(null)} className="text-teal-600 hover:text-teal-900 font-bold">✕</button>
            </span>
          )}
          <button 
            onClick={() => {
              setSearchQuery('');
              setSelectedStatus('all');
              setSelectedGroupFilter('all');
              setStatFilter(null);
            }} 
            className="text-xs font-bold text-teal-800 hover:underline hover:text-teal-900 uppercase tracking-widest ml-auto"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-teal-800">
          <div className="w-12 h-12 border-2 border-teal-800 border-t-transparent animate-spin rounded-none mb-4"></div>
          <p className="font-bold text-xs tracking-widest uppercase text-slate-500">Đang truy vấn danh mục thiết bị...</p>
        </div>
      ) : (
        <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
          
          {/* Accordion List for the 5 categories */}
          {(() => {
            const categories = [
              { key: 'nhiet', title: 'Nhóm tác động Nhiệt', icon: '🔥', color: 'text-amber-600 bg-amber-50 border-amber-200' },
              { key: 'dien', title: 'Nhóm tác động Điện', icon: '⚡', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
              { key: 'co_hoc', title: 'Nhóm tác động Cơ học / Sóng', icon: '🌊', color: 'text-teal-600 bg-teal-50 border-teal-200' },
              { key: 'keo_gian', title: 'Nhóm tác động Kéo giãn', icon: '↔️', color: 'text-rose-600 bg-rose-50 border-rose-200' },
              { key: 'tu_truong', title: 'Nhóm tác động Từ trường', icon: '🧲', color: 'text-cyan-600 bg-cyan-50 border-cyan-200' },
              { key: 'khac', title: 'Dụng cụ & Thiết bị khác', icon: '⚙️', color: 'text-slate-600 bg-slate-50 border-slate-200' }
            ];
            
            const allCategories = categories;

            return allCategories.map(cat => {
              const items = groupedEquipment[cat.key] || [];
              if (items.length === 0) return null; // Hide categories with no items
              
              const isExpanded = expandedCategories[cat.key] !== false;
              
              const activeCount = items.filter(e => e.trang_thai === 'san_sang').length;
              const runningCount = items.filter(e => e.trang_thai === 'dang_su_dung').length;
              const maintenanceCount = items.filter(e => e.trang_thai === 'dang_bao_tri' || e.trang_thai === 'hong').length;

              return (
                <div key={cat.key} className="border border-slate-200 bg-white overflow-hidden rounded-none shadow-sm hover:shadow-md transition-all duration-300">
                  {/* Category Header */}
                  <div 
                    onClick={() => setExpandedCategories(prev => ({ ...prev, [cat.key]: !prev[cat.key] }))}
                    className="p-4 bg-slate-50/50 flex justify-between items-center cursor-pointer select-none border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-none border flex items-center justify-center font-bold text-base ${cat.color}`}>
                        {cat.icon}
                      </span>
                      <div>
                        <h4 className="font-extrabold text-teal-950 text-xs tracking-tight uppercase">{cat.title}</h4>
                        <div className="flex gap-2.5 text-[9px] text-slate-400 mt-0.5 font-bold uppercase tracking-wider">
                          <span>Tổng số: <strong className="text-slate-600 font-black">{items.length} máy</strong></span>
                          {activeCount > 0 && <span className="text-emerald-600">• Sẵn sàng: {activeCount}</span>}
                          {runningCount > 0 && <span className="text-cyan-600">• Đang dùng: {runningCount}</span>}
                          {maintenanceCount > 0 && <span className="text-rose-600">• Bảo trì/Lỗi: {maintenanceCount}</span>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400">
                        {isExpanded ? (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Category Content */}
                  {isExpanded && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/30 border-b border-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest select-none">
                            <th className="p-3 pl-6 w-32">Mã thiết bị</th>
                            <th className="p-3">Tên thiết bị y khoa</th>
                            <th className="p-3 text-center w-36">Trạng thái</th>
                            <th className="p-3 w-64">Vị trí hiện tại</th>
                            <th className="p-3 pr-6 text-right w-64">Phương thức vận hành</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {items.map(eq => {
                            const currentRoom = rooms.find(r => r.id.toString() === eq.phong_id_hien_tai?.toString());
                            return (
                              <tr key={eq.id} className="hover:bg-teal-950/[0.01] transition-colors group text-xs">
                                <td className="p-3 pl-6 font-mono font-bold text-slate-450">{eq.ma_thiet_bi}</td>
                                <td className="p-3">
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-slate-800">{eq.ten_thiet_bi}</span>
                                    {eq.so_lan_su_dung !== undefined && eq.nguong_canh_bao && eq.so_lan_su_dung >= eq.nguong_canh_bao && eq.trang_thai === 'san_sang' && (
                                      <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider border border-amber-200">
                                        ⚠️ Cần bảo trì
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex gap-2 text-[10px] text-slate-400 mt-0.5">
                                    {eq.so_lan_su_dung !== undefined && (
                                      <span className="font-semibold">
                                        Đã dùng: <strong className="text-slate-655 font-bold">{eq.so_lan_su_dung}</strong>
                                        {eq.nguong_bat_buoc_bao_tri ? ` / ${eq.nguong_bat_buoc_bao_tri}` : ''} lần
                                      </span>
                                    )}
                                    {eq.ghi_chu && <span className="border-l border-slate-200 pl-2 italic">{eq.ghi_chu}</span>}
                                  </div>
                                </td>
                                <td className="p-3 text-center">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-none text-[9px] font-black uppercase tracking-wider border ${
                                    eq.trang_thai === 'san_sang' 
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                      : eq.trang_thai === 'dang_su_dung'
                                        ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                                        : eq.trang_thai === 'dang_bao_tri'
                                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                                          : 'bg-rose-50 text-rose-700 border-rose-200'
                                  }`}>
                                    {eq.trang_thai === 'san_sang' ? 'Hoạt động' : eq.trang_thai === 'dang_su_dung' ? 'Đang chạy' : eq.trang_thai === 'dang_bao_tri' ? 'Bảo trì' : 'Hỏng/Sự cố'}
                                  </span>
                                </td>
                                <td className="p-3">
                                  {currentRoom ? (
                                    <div className="space-y-1.5">
                                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                                        <span className="bg-slate-100 px-2 py-0.5 font-mono text-[10px] border border-slate-200">
                                          {currentRoom.ma_phong}
                                        </span>
                                        <span className="text-slate-500 font-medium">({currentRoom.ten_phong.includes(' - ') ? currentRoom.ten_phong.split(' - ')[1] : currentRoom.ten_phong})</span>
                                        {eq.trang_thai === 'dang_su_dung' && eq.co_the_di_chuyen && (
                                          <span className="bg-teal-50 text-teal-700 border border-teal-200 px-1 py-0.2 text-[8px] font-black uppercase tracking-wider animate-pulse">
                                            ⚡ Tạm thời
                                          </span>
                                        )}
                                      </div>

                                      {eq.trang_thai === 'dang_su_dung' && eq.active_booking_code && (
                                        <div className="bg-teal-950/[0.03] border border-teal-600/10 p-2 rounded-none space-y-1 text-[11px] font-medium max-w-xs text-slate-600 text-left">
                                          <div className="flex items-center gap-1">
                                            <span className="font-extrabold text-teal-900">
                                              {eq.active_booking_type === 'lich_kham' ? '🩺 Lịch khám:' : '⚡ Lịch điều trị:'}
                                            </span>
                                            <span className="font-mono text-teal-850 font-bold bg-teal-50 px-1 border border-teal-200/50">
                                              {eq.active_booking_code}
                                            </span>
                                          </div>
                                          <div>
                                            <strong className="text-slate-700">Khách:</strong> {eq.active_patient_name}
                                          </div>
                                          <div>
                                            <strong className="text-slate-700">{eq.active_booking_type === 'lich_kham' ? 'Bác sĩ:' : 'KTV:'}</strong> {eq.active_operator_name}
                                          </div>
                                          {eq.active_service_name && (
                                            <div className="text-[10px] text-slate-400 italic mt-0.5">
                                              ({eq.active_service_name})
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-xs text-slate-400 italic">Kho lưu trữ (Chưa gán)</span>
                                  )}
                                </td>
                                <td className="p-3 pr-6 text-right">
                                  <div className="flex justify-end gap-2 items-center">
                                    {eq.co_the_di_chuyen === false ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 border border-slate-200 text-[10px] font-black text-slate-550 uppercase tracking-wider rounded-none" title="Thiết bị cố định, không thể di chuyển">
                                        🔒 Cố định
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-teal-50 border border-teal-200 text-[10px] font-black text-teal-800 uppercase tracking-wider rounded-none" title="Vận hành tự động theo lịch hẹn trị liệu">
                                        ⚡ Tự động
                                      </span>
                                    )}

                                    <button 
                                      onClick={() => handleOpenEquipmentModal(eq)}
                                      className="p-1 text-slate-400 hover:text-teal-800 transition-colors ml-1"
                                      title="Chỉnh sửa thiết bị"
                                    >
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                      </svg>
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteEquipment(eq.id)}
                                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                                      title="Xóa thiết bị"
                                    >
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>
      )}

      {/* MODAL: EQUIPMENT EDIT / CREATE */}
      {isEquipmentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-none shadow-[0_12px_40px_rgba(0,0,0,0.15)] max-w-lg w-full overflow-hidden animate-[zoomIn_0.25s_ease-out]">
            <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="font-extrabold text-sm uppercase tracking-widest">
                {editingEquipment ? `Cập nhật Thiết bị: ${editingEquipment.ma_thiet_bi}` : 'Thêm thiết bị mới'}
              </h3>
              <button onClick={() => setIsEquipmentModalOpen(false)} className="text-slate-400 hover:text-white font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleEquipmentSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Mã thiết bị (ví dụ: EQP-00412)</label>
                  <input 
                    type="text" 
                    required
                    placeholder="EQP-xxxxx"
                    disabled={!!editingEquipment}
                    value={equipmentFormData.ma_thiet_bi}
                    onChange={(e) => setEquipmentFormData({ ...equipmentFormData, ma_thiet_bi: e.target.value.toUpperCase() })}
                    className={`w-full border border-slate-200 p-2.5 text-sm font-mono font-bold rounded-none focus:outline-none focus:border-teal-800 ${
                      editingEquipment ? 'bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200' : 'bg-white text-slate-800'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Phân loại (Nhóm tác động)</label>
                  <select 
                    value={formGroup}
                    onChange={(e) => {
                      const g = e.target.value;
                      setFormGroup(g);
                      const loai = getLoaiThietBiFromGroup(g);
                      const stationary = isStationaryGroup(g);
                      const compRooms = getCompatibleRooms(loai);
                      const defaultRoomId = compRooms.length > 0 ? compRooms[0].id : '';
                      const isCurrentCompatible = compRooms.some(r => r.id.toString() === equipmentFormData.phong_id_hien_tai.toString());
                      setEquipmentFormData(prev => ({
                        ...prev,
                        loai_thiet_bi: loai,
                        co_the_di_chuyen: !stationary,
                        phong_id_hien_tai: isCurrentCompatible ? prev.phong_id_hien_tai : defaultRoomId
                      }));
                    }}
                    className="w-full border border-slate-200 bg-white p-2.5 text-sm font-bold rounded-none focus:outline-none focus:border-teal-800"
                  >
                    {GROUP_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tên thiết bị (nhập chính xác tên / model / hãng)</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ví dụ: Đèn hồng ngoại Philips HP3616, Máy điện xung BTL-4000..."
                  value={formDeviceName}
                  onChange={(e) => setFormDeviceName(e.target.value)}
                  className="w-full border border-slate-200 bg-white p-2.5 text-sm font-bold rounded-none focus:outline-none focus:border-teal-800"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Nhóm tác động sẽ tự động phân loại thiết bị này vào đúng nhóm trên trang danh sách.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Trạng thái kỹ thuật</label>
                  <select 
                    value={equipmentFormData.trang_thai}
                    onChange={(e) => setEquipmentFormData({ ...equipmentFormData, trang_thai: e.target.value })}
                    className="w-full border border-slate-200 bg-white p-2.5 text-sm font-bold rounded-none focus:outline-none focus:border-teal-800"
                  >
                    <option value="san_sang">Hoạt động bình thường</option>
                    <option value="dang_su_dung">Đang sử dụng</option>
                    {editingEquipment && (
                      <>
                        <option value="dang_bao_tri">Đang sửa chữa / Bảo trì</option>
                        <option value="hong">Hỏng hoàn toàn / Ngừng sử dụng</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Ngày mua máy</label>
                  <input 
                    type="date" 
                    value={equipmentFormData.ngay_mua}
                    onChange={(e) => setEquipmentFormData({ ...equipmentFormData, ngay_mua: e.target.value })}
                    className="w-full border border-slate-200 bg-white p-2.5 text-sm font-semibold rounded-none focus:outline-none focus:border-teal-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Phân bổ vị trí hiện tại</label>
                <select 
                  value={equipmentFormData.phong_id_hien_tai}
                  disabled={!equipmentFormData.co_the_di_chuyen}
                  onChange={(e) => setEquipmentFormData({ ...equipmentFormData, phong_id_hien_tai: e.target.value })}
                  className={`w-full border border-slate-200 p-2.5 text-sm font-bold rounded-none focus:outline-none focus:border-teal-800 ${
                    !equipmentFormData.co_the_di_chuyen ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : 'bg-white'
                  }`}
                >
                  <option value="">Kho lưu trữ (Chưa gán vị trí)</option>
                  {getCompatibleRooms(equipmentFormData.loai_thiet_bi).map(r => (
                    <option key={r.id} value={r.id}>
                      {r.ma_phong} - {r.ten_phong.includes(' - ') ? r.ten_phong.split(' - ')[1] : r.ten_phong} ({translateFloor(r.tang)})
                    </option>
                  ))}
                </select>
                {!equipmentFormData.co_the_di_chuyen && (
                  <p className="text-[10px] text-amber-600 font-semibold mt-1">⚠️ Thiết bị cố định — vị trí khóa sau khi tạo.</p>
                )}
              </div>

              {/* === SECTION: BẢO TRÌ BẰNG SỐ LẦN SỬ DỤNG === */}
              <div className="border border-slate-200 rounded-none p-4 space-y-3 bg-slate-50">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">⚙️ Cấu hình Bảo trì theo số lần sử dụng</p>

                {/* Toggle di động / cố định */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEquipmentFormData({ ...equipmentFormData, co_the_di_chuyen: !equipmentFormData.co_the_di_chuyen })}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      equipmentFormData.co_the_di_chuyen ? 'bg-teal-700' : 'bg-slate-300'
                    }`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                      equipmentFormData.co_the_di_chuyen ? 'left-5' : 'left-0.5'
                    }`} />
                  </button>
                  <span className="text-xs font-bold text-slate-600">
                    {equipmentFormData.co_the_di_chuyen ? '🟢 Thiết bị di động (KTV có thể luân chuyển)' : '🔒 Thiết bị cố định (không di chuyển được)'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Ngưỡng cảnh báo (lần dùng)</label>
                    <input
                      type="number"
                      min={1}
                      value={equipmentFormData.nguong_canh_bao || ''}
                      onChange={(e) => setEquipmentFormData({ ...equipmentFormData, nguong_canh_bao: Number(e.target.value) })}
                      className="w-full border border-slate-200 bg-white p-2 text-xs font-bold rounded-none focus:outline-none focus:border-teal-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Bắt buộc bảo trì (lần dùng)</label>
                    <input
                      type="number"
                      min={1}
                      value={equipmentFormData.nguong_bat_buoc_bao_tri || ''}
                      onChange={(e) => setEquipmentFormData({ ...equipmentFormData, nguong_bat_buoc_bao_tri: Number(e.target.value) })}
                      className="w-full border border-slate-200 bg-white p-2 text-xs font-bold rounded-none focus:outline-none focus:border-teal-800"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nhật ký sự cố / Ghi chú kỹ thuật</label>
                <textarea 
                  value={equipmentFormData.ghi_chu}
                  onChange={(e) => setEquipmentFormData({ ...equipmentFormData, ghi_chu: e.target.value })}
                  placeholder="Ghi chú lịch sử sửa chữa, số series máy hoặc lỗi vận hành..."
                  rows={2}
                  className="w-full border border-slate-200 bg-white p-2.5 text-sm font-semibold rounded-none focus:outline-none focus:border-teal-800"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                {editingEquipment && (
                  <button 
                    type="button"
                    onClick={() => handleDeleteEquipment(editingEquipment.id)}
                    className="mr-auto px-4 py-2 border border-rose-600 text-rose-600 text-xs font-bold uppercase tracking-wider rounded-none hover:bg-rose-50 transition-all active:scale-95"
                  >
                    Xóa máy
                  </button>
                )}
                <button 
                  type="button" 
                  onClick={() => setIsEquipmentModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider rounded-none hover:bg-slate-50 transition-all"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-teal-800 hover:bg-teal-950 text-white text-xs font-black uppercase tracking-wider transition-all rounded-none active:scale-95"
                >
                  {editingEquipment ? 'Lưu thông tin' : 'Thêm thiết bị'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
