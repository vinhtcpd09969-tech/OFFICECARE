import { useState, useEffect } from 'react';
import { 
  getRooms, 
  getEquipment, 
  createRoom, 
  updateRoom, 
  deleteRoom, 
  createEquipment, 
  updateEquipment, 
  deleteEquipment 
} from '../../../api/admin.api';
import { 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Loader2, 
  Search,
  Calendar,
  AlertTriangle,
  Info,
  Wrench
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ManageRoomsEquipment() {
  const [activeTab, setActiveTab] = useState<'rooms' | 'equipment'>('rooms');
  const [rooms, setRooms] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals visibility
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);

  // Selected item for edit (null means creating new)
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null);

  // Room Form Fields
  const [tenPhong, setTenPhong] = useState('');
  const [maPhong, setMaPhong] = useState('');
  const [loaiPhong, setLoaiPhong] = useState('');
  const [tang, setTang] = useState('');
  const [sucChua, setSucChua] = useState(1);
  const [trangThaiPhong, setTrangThaiPhong] = useState('san_sang');
  const [moTaPhong, setMoTaPhong] = useState('');
  const [loaiDichVuHoTroInput, setLoaiDichVuHoTroInput] = useState('');

  // Equipment Form Fields
  const [tenThietBi, setTenThietBi] = useState('');
  const [maThietBi, setMaThietBi] = useState('');
  const [loaiThietBi, setLoaiThietBi] = useState('');
  const [ngayMua, setNgayMua] = useState('');
  const [ngayBaoTri, setNgayBaoTri] = useState('');
  const [trangThaiEq, setTrangThaiEq] = useState('san_sang');
  const [phongId, setPhongId] = useState<string>('');
  const [ghiChuEq, setGhiChuEq] = useState('');

  const [submitting, setSubmitting] = useState(false);

  // Fetch all data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [roomsRes, eqRes] = await Promise.all([
        getRooms(),
        getEquipment()
      ]);
      setRooms(roomsRes.data || []);
      setEquipment(eqRes.data || []);
    } catch (error) {
      console.error('Error fetching rooms & equipment:', error);
      toast.error('Không thể đồng bộ dữ liệu hạ tầng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Room handlers
  const openCreateRoomModal = () => {
    setSelectedRoom(null);
    setTenPhong('');
    setMaPhong('');
    setLoaiPhong('');
    setTang('');
    setSucChua(2);
    setTrangThaiPhong('san_sang');
    setMoTaPhong('');
    setLoaiDichVuHoTroInput('');
    setIsRoomModalOpen(true);
  };

  const openEditRoomModal = (room: any) => {
    setSelectedRoom(room);
    setTenPhong(room.ten_phong || '');
    setMaPhong(room.ma_phong || '');
    setLoaiPhong(room.loai_phong || '');
    setTang(room.tang || '');
    setSucChua(room.suc_chua || 2);
    setTrangThaiPhong(room.trang_thai || 'san_sang');
    setMoTaPhong(room.mo_ta || '');
    
    // Parse loai_dich_vu_ho_tro
    let servicesList = [];
    try {
      servicesList = typeof room.loai_dich_vu_ho_tro === 'string'
        ? JSON.parse(room.loai_dich_vu_ho_tro)
        : (room.loai_dich_vu_ho_tro || []);
    } catch (e) {
      servicesList = [];
    }
    setLoaiDichVuHoTroInput(servicesList.join(', '));
    setIsRoomModalOpen(true);
  };

  const handleRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenPhong.trim() || !maPhong.trim()) {
      toast.error('Vui lòng điền đầy đủ Tên phòng và Mã phòng');
      return;
    }

    // Process services array from comma-separated string
    const loai_dich_vu_ho_tro = loaiDichVuHoTroInput
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const payload = {
      ten_phong: tenPhong.trim(),
      ma_phong: maPhong.trim(),
      loai_phong: loaiPhong.trim() || null,
      tang: tang.trim() || null,
      suc_chua: Number(sucChua) || 1,
      trang_thai: trangThaiPhong,
      mo_ta: moTaPhong.trim() || null,
      loai_dich_vu_ho_tro
    };

    try {
      setSubmitting(true);
      if (selectedRoom) {
        await updateRoom(selectedRoom.id, payload);
        toast.success('Cập nhật phòng thành công!');
      } else {
        await createRoom(payload);
        toast.success('Tạo phòng mới thành công!');
      }
      setIsRoomModalOpen(false);
      fetchData();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Lỗi khi lưu thông tin phòng');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRoom = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa phòng này vĩnh viễn? Điều này cũng có thể xóa các ca điều trị liên quan.')) return;
    try {
      setLoading(true);
      await deleteRoom(id);
      toast.success('Đã xóa phòng thành công');
      fetchData();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Không thể xóa phòng');
    } finally {
      setLoading(false);
    }
  };

  // Equipment handlers
  const openCreateEquipmentModal = () => {
    setSelectedEquipment(null);
    setTenThietBi('');
    setMaThietBi('');
    setLoaiThietBi('');
    setNgayMua('');
    setNgayBaoTri('');
    setTrangThaiEq('san_sang');
    setPhongId('');
    setGhiChuEq('');
    setIsEquipmentModalOpen(true);
  };

  const openEditEquipmentModal = (eq: any) => {
    setSelectedEquipment(eq);
    setTenThietBi(eq.ten_thiet_bi || '');
    setMaThietBi(eq.ma_thiet_bi || '');
    setLoaiThietBi(eq.loai_thiet_bi || '');
    
    // Format dates to YYYY-MM-DD for input type="date"
    const formatDateStr = (dStr: string) => {
      if (!dStr) return '';
      try {
        const d = new Date(dStr);
        return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
      } catch {
        return '';
      }
    };

    setNgayMua(formatDateStr(eq.ngay_mua));
    setNgayBaoTri(formatDateStr(eq.ngay_bao_tri_tiep_theo || eq.ngay_bao_tri_gan_nhat));
    setTrangThaiEq(eq.trang_thai || 'san_sang');
    setPhongId(eq.phong_id_hien_tai ? String(eq.phong_id_hien_tai) : '');
    setGhiChuEq(eq.ghi_chu || '');
    setIsEquipmentModalOpen(true);
  };

  const handleEquipmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenThietBi.trim()) {
      toast.error('Vui lòng điền Tên thiết bị');
      return;
    }

    const payload = {
      ten_thiet_bi: tenThietBi.trim(),
      ma_thiet_bi: maThietBi.trim() || undefined,
      loai_thiet_bi: loaiThietBi.trim() || null,
      ngay_mua: ngayMua || null,
      ngay_bao_tri_tiep_theo: ngayBaoTri || null,
      trang_thai: trangThaiEq,
      phong_id_hien_tai: phongId ? Number(phongId) : null,
      ghi_chu: ghiChuEq.trim() || null
    };

    try {
      setSubmitting(true);
      if (selectedEquipment) {
        await updateEquipment(selectedEquipment.id, payload);
        toast.success('Cập nhật thiết bị thành công!');
      } else {
        await createEquipment(payload);
        toast.success('Tạo thiết bị mới thành công!');
      }
      setIsEquipmentModalOpen(false);
      fetchData();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Lỗi khi lưu thông tin thiết bị');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEquipment = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thiết bị này vĩnh viễn?')) return;
    try {
      setLoading(true);
      await deleteEquipment(id);
      toast.success('Đã xóa thiết bị thành công');
      fetchData();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Không thể xóa thiết bị');
    } finally {
      setLoading(false);
    }
  };

  // Status badges mapping
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'san_sang':
      case 'trong':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">TRỐNG</span>;
      case 'dang_su_dung':
      case 'dang_dung':
        return <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">ĐANG DÙNG</span>;
      case 'dang_bao_tri':
      case 'bao_tri':
        return <span className="bg-rose-500 text-white border border-rose-600 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full shadow-xs">BẢO TRÌ</span>;
      case 'hong':
        return <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">HỎNG</span>;
      default:
        return <span className="bg-slate-50 text-slate-700 border border-slate-200 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">N/A</span>;
    }
  };

  const getEquipmentStatusBadge = (status: string) => {
    switch (status) {
      case 'san_sang':
      case 'hoat_dong':
        return <span className="bg-cyan-50 text-cyan-700 border border-cyan-100 text-[10px] font-bold px-2.5 py-0.5 rounded-md">Hoạt động</span>;
      case 'dang_su_dung':
        return <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-bold px-2.5 py-0.5 rounded-md">Đang dùng</span>;
      case 'dang_bao_tri':
      case 'ngung_dung':
        return <span className="bg-rose-50 text-rose-700 border border-rose-100 text-[10px] font-bold px-2.5 py-0.5 rounded-md">Bảo trì</span>;
      case 'hong':
        return <span className="bg-slate-100 text-slate-600 border border-slate-250 text-[10px] font-bold px-2.5 py-0.5 rounded-md">Hỏng</span>;
      default:
        return <span className="bg-slate-50 text-slate-700 border border-slate-200 text-[10px] font-bold px-2.5 py-0.5 rounded-md">N/A</span>;
    }
  };

  // Filtering lists
  const filteredRooms = rooms.filter(room => 
    room.ten_phong?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.ma_phong?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.loai_phong?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.tang?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEquipment = equipment.filter(eq => 
    eq.ten_thiet_bi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eq.ma_thiet_bi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eq.loai_thiet_bi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eq.ten_phong?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in pb-12 relative h-full">
      {/* Header and Search */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Quản lý Phòng & Thiết bị</h2>
          <p className="text-slate-400 mt-0.5 text-xs font-semibold">Trung tâm cấu hình và theo dõi phòng khám, máy móc trị liệu</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Tìm phòng, thiết bị, khu vực..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-4 py-2 w-full bg-white border border-zinc-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-700 font-semibold text-secondary placeholder-slate-400"
            />
          </div>

          <button 
            onClick={() => activeTab === 'rooms' ? openCreateRoomModal() : openCreateEquipmentModal()}
            className="px-5 py-2.5 bg-teal-800 text-white font-bold rounded-xl text-xs hover:bg-teal-900 active:scale-95 transition-all flex items-center gap-1.5 shadow-md shadow-teal-900/10"
          >
            <Plus size={14} />
            {activeTab === 'rooms' ? 'Thêm phòng mới' : 'Thêm thiết bị mới'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 p-0.5 rounded-2xl shadow-inner w-max border border-zinc-200/50">
        <button 
          onClick={() => setActiveTab('rooms')}
          className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
            activeTab === 'rooms' 
              ? 'bg-white text-teal-800 shadow-sm' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Phòng ({rooms.length})
        </button>
        <button 
          onClick={() => setActiveTab('equipment')}
          className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
            activeTab === 'equipment' 
              ? 'bg-white text-teal-800 shadow-sm' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Thiết bị ({equipment.length})
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-teal-600">
          <Loader2 className="animate-spin w-8 h-8 text-teal-700 mb-3" />
          <p className="font-bold text-slate-400 text-sm">Đang đồng bộ dữ liệu hạ tầng...</p>
        </div>
      ) : (
        <>
          {/* ROOMS GRID */}
          {activeTab === 'rooms' && (
            <div>
              {filteredRooms.length === 0 ? (
                <div className="bg-white rounded-[24px] border border-zinc-150 p-12 text-center space-y-4">
                  <div className="size-16 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 mx-auto border border-teal-100">
                    <Info size={30} />
                  </div>
                  <div>
                    <h4 className="text-slate-850 font-bold text-base">Chưa có phòng nào được tạo</h4>
                    <p className="text-slate-400 text-xs mt-1">Bấm nút "Thêm phòng mới" ở trên để bắt đầu cấu hình cơ sở vật chất phòng khám.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  {filteredRooms.map(room => {
                    const isMaintenance = room.trang_thai === 'dang_bao_tri' || room.trang_thai === 'bao_tri';
                    
                    // Parse services tags
                    let supportedServices = [];
                    try {
                      supportedServices = typeof room.loai_dich_vu_ho_tro === 'string'
                        ? JSON.parse(room.loai_dich_vu_ho_tro)
                        : (room.loai_dich_vu_ho_tro || []);
                    } catch (e) {
                      supportedServices = [];
                    }

                    return (
                      <div 
                        key={room.id} 
                        className={`rounded-[24px] shadow-xs border p-6 flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-white border-zinc-150/80 group relative`}
                      >
                        {/* Dropdown/Actions in absolute top right */}
                        <div className="absolute top-5 right-5 flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => openEditRoomModal(room)}
                            className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all"
                            title="Sửa phòng"
                          >
                            <Edit size={13} />
                          </button>
                          <button 
                            onClick={() => handleDeleteRoom(room.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Xóa phòng"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        <div className="flex justify-between items-start mb-5">
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border shadow-xs ${
                            isMaintenance 
                              ? 'bg-rose-50 text-rose-600 border-rose-100' 
                              : 'bg-teal-550/10 text-teal-700 border-teal-100'
                          }`}>
                            {isMaintenance ? <Wrench size={18} /> : <span>🏥</span>}
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-slate-850 truncate max-w-[150px]">{room.ten_phong}</h3>
                            <span className="text-[10px] font-bold text-slate-400 font-mono">({room.ma_phong})</span>
                            {getStatusBadge(room.trang_thai)}
                          </div>
                          <p className="text-[11px] text-slate-400 font-bold tracking-wide mt-1 uppercase">
                            {room.tang || 'Khu vực khác'} — {room.loai_phong || 'Phòng chuyên năng'}
                          </p>
                        </div>

                        {room.mo_ta && (
                          <p className="text-xs text-slate-500 italic leading-relaxed mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            "{room.mo_ta}"
                          </p>
                        )}

                        {/* Services tags */}
                        {supportedServices.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-5">
                            {supportedServices.map((srv: string, idx: number) => (
                              <span key={idx} className="bg-slate-50 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded border border-slate-200">
                                {srv}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100 text-xs">
                          <div className="flex items-center gap-1.5 text-slate-500 font-bold">
                            Sức chứa: <span className="font-extrabold text-slate-800">{room.suc_chua || 1} ca</span>
                          </div>
                          <span className="text-slate-400 font-semibold">ID: #{room.id}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* EQUIPMENT TABLE */}
          {activeTab === 'equipment' && (
            <div className="bg-white rounded-[24px] shadow-xs border border-zinc-150 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-extrabold text-slate-850 text-base">Danh sách Máy móc & Thiết bị</h3>
                <span className="text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
                  Tổng số: {filteredEquipment.length} thiết bị
                </span>
              </div>

              {filteredEquipment.length === 0 ? (
                <div className="p-12 text-center space-y-4">
                  <div className="size-16 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 mx-auto border border-teal-100">
                    <Info size={30} />
                  </div>
                  <div>
                    <h4 className="text-slate-850 font-bold text-base">Chưa tìm thấy thiết bị nào</h4>
                    <p className="text-slate-400 text-xs mt-1">Bấm nút "Thêm thiết bị mới" ở trên để khai báo thông tin vật tư, thiết bị y khoa.</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider border-b border-zinc-100">
                        <th className="py-4 px-6">Mã Thiết bị</th>
                        <th className="py-4 px-6">Tên Thiết bị</th>
                        <th className="py-4 px-6">Loại / Phân nhóm</th>
                        <th className="py-4 px-6">Phòng hiện tại</th>
                        <th className="py-4 px-6 text-center">Trạng thái</th>
                        <th className="py-4 px-6 text-center">Ngày bảo trì tiếp theo</th>
                        <th className="py-4 px-6 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-55 text-slate-700">
                      {filteredEquipment.map((eq) => {
                        const nextBaoTri = eq.ngay_bao_tri_tiep_theo || eq.ngay_bao_tri_gan_nhat;
                        const isOverdue = nextBaoTri && new Date(nextBaoTri).getTime() < new Date().getTime();

                        return (
                          <tr key={eq.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="py-4 px-6 font-mono font-bold text-slate-500">{eq.ma_thiet_bi}</td>
                            <td className="py-4 px-6">
                              <div className="font-bold text-slate-850">{eq.ten_thiet_bi}</div>
                              {eq.ghi_chu && <div className="text-[10px] text-slate-400 mt-0.5 italic">"{eq.ghi_chu}"</div>}
                            </td>
                            <td className="py-4 px-6 font-semibold text-slate-600">{eq.loai_thiet_bi || 'Mặc định'}</td>
                            <td className="py-4 px-6 font-bold text-emerald-700">
                              {eq.ten_phong || <span className="text-amber-600 italic font-semibold">Kho tổng (Chưa xếp)</span>}
                            </td>
                            <td className="py-4 px-6 text-center">
                              {getEquipmentStatusBadge(eq.trang_thai)}
                            </td>
                            <td className="py-4 px-6 text-center">
                              {nextBaoTri ? (
                                <span className={`font-mono font-bold ${isOverdue ? 'text-rose-600 flex items-center justify-center gap-1' : 'text-slate-650'}`}>
                                  {isOverdue && <AlertTriangle size={12} className="text-rose-500" />}
                                  {new Date(nextBaoTri).toLocaleDateString('vi-VN')}
                                  {isOverdue && <span className="text-[9px] uppercase tracking-wider font-extrabold">(Quá hạn)</span>}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-semibold italic">Chưa lập lịch</span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="flex justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => openEditEquipmentModal(eq)}
                                  className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all"
                                  title="Sửa thiết bị"
                                >
                                  <Edit size={14} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteEquipment(eq.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                  title="Xóa thiết bị"
                                >
                                  <Trash2 size={14} />
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
          )}
        </>
      )}

      {/* ROOM MODAL */}
      {isRoomModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-5 border-b border-zinc-100 flex justify-between items-center bg-white">
              <div className="flex items-center gap-2.5">
                <div className="size-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
                  <span className="font-bold text-lg">🏥</span>
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 tracking-tight">
                    {selectedRoom ? 'Cập Nhật Phòng Lâm Sàng' : 'Khai Báo Phòng Lâm Sàng Mới'}
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">Cấu hình thông tin phòng và quản trị hạ tầng trị liệu</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRoomModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleRoomSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[70vh] text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tên phòng *</label>
                  <input
                    required
                    type="text"
                    placeholder="Ví dụ: Phòng P.101"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-teal-550/20 focus:border-teal-700 transition-all"
                    value={tenPhong}
                    onChange={(e) => setTenPhong(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Mã phòng (Định danh) *</label>
                  <input
                    required
                    type="text"
                    placeholder="Ví dụ: P.101"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-teal-550/20 focus:border-teal-700 transition-all font-mono"
                    value={maPhong}
                    onChange={(e) => setMaPhong(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tầng / Vị trí</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Tầng 1"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-teal-550/20 focus:border-teal-700 transition-all"
                    value={tang}
                    onChange={(e) => setTang(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Sức chứa tối đa (Ca)</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-teal-550/20 focus:border-teal-700 transition-all"
                    value={sucChua}
                    onChange={(e) => setSucChua(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Trạng thái phòng</label>
                  <select
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-teal-550/20 focus:border-teal-700 transition-all cursor-pointer"
                    value={trangThaiPhong}
                    onChange={(e) => setTrangThaiPhong(e.target.value)}
                  >
                    <option value="san_sang">Sẵn sàng (Trống)</option>
                    <option value="dang_su_dung">Đang sử dụng</option>
                    <option value="dang_bao_tri">Bảo trì</option>
                    <option value="hong">Hỏng hóc</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Chuyên môn / Loại phòng</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Vật lý trị liệu, Phục hồi cơ bản, VIP Recovery"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-teal-550/20 focus:border-teal-700 transition-all"
                  value={loaiPhong}
                  onChange={(e) => setLoaiPhong(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Dịch vụ hỗ trợ</label>
                  <span className="text-[10px] text-slate-400 font-semibold">(Cách nhau bằng dấu phẩy)</span>
                </div>
                <input
                  type="text"
                  placeholder="Ví dụ: Di động cột sống, Siêu âm trị liệu, Nhiệt trị liệu"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-teal-550/20 focus:border-teal-700 transition-all"
                  value={loaiDichVuHoTroInput}
                  onChange={(e) => setLoaiDichVuHoTroInput(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Ghi chú lâm sàng / Mô tả</label>
                <textarea
                  placeholder="Ví dụ: Phòng trang bị giường cơ nâng điện, máy siêu âm xách tay..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-teal-550/20 focus:border-teal-700 transition-all min-h-[80px]"
                  value={moTaPhong}
                  onChange={(e) => setMoTaPhong(e.target.value)}
                />
              </div>

              {/* Action buttons */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 -mx-6 -mb-6 p-4">
                <button
                  type="button"
                  onClick={() => setIsRoomModalOpen(false)}
                  className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-teal-800 text-white font-bold rounded-xl hover:bg-teal-900 transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-teal-900/10 active:scale-95"
                >
                  {submitting && <Loader2 className="animate-spin" size={14} />}
                  {submitting ? 'Đang lưu...' : selectedRoom ? 'Cập nhật' : 'Tạo phòng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EQUIPMENT MODAL */}
      {isEquipmentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-5 border-b border-zinc-100 flex justify-between items-center bg-white">
              <div className="flex items-center gap-2.5">
                <div className="size-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
                  <span className="font-bold text-lg">⚙️</span>
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 tracking-tight">
                    {selectedEquipment ? 'Cập Nhật Thiết Bị Y Tế' : 'Khai Báo Thiết Bị Y Tế Mới'}
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">Cấu hình máy móc, thông số thiết bị và gán phòng hiện hành</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEquipmentModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEquipmentSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[70vh] text-xs">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tên thiết bị *</label>
                <input
                  required
                  type="text"
                  placeholder="Ví dụ: Máy shockwave BTL-6000"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-teal-550/20 focus:border-teal-700 transition-all"
                  value={tenThietBi}
                  onChange={(e) => setTenThietBi(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Mã thiết bị (Số Serial)</label>
                  <input
                    type="text"
                    placeholder="Mã máy (Tự tạo nếu trống)"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-teal-550/20 focus:border-teal-700 transition-all font-mono"
                    value={maThietBi}
                    onChange={(e) => setMaThietBi(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Phân loại / Nhóm máy</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Siêu âm, Điện xung, Máy cơ học"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-teal-550/20 focus:border-teal-700 transition-all"
                    value={loaiThietBi}
                    onChange={(e) => setLoaiThietBi(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Ngày nhập mua</label>
                  <div className="relative">
                    <Calendar className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                      type="date"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-teal-550/20 focus:border-teal-700 transition-all cursor-pointer"
                      value={ngayMua}
                      onChange={(e) => setNgayMua(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Lịch bảo trì kế tiếp</label>
                  <div className="relative">
                    <Calendar className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                      type="date"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-teal-550/20 focus:border-teal-700 transition-all cursor-pointer"
                      value={ngayBaoTri}
                      onChange={(e) => setNgayBaoTri(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Phòng đặt hiện tại</label>
                  <select
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-teal-550/20 focus:border-teal-700 transition-all cursor-pointer"
                    value={phongId}
                    onChange={(e) => setPhongId(e.target.value)}
                  >
                    <option value="">-- Kho tổng (Chưa xếp phòng) --</option>
                    {rooms.map(r => (
                      <option key={r.id} value={r.id}>{r.ten_phong} ({r.ma_phong})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Trạng thái thiết bị</label>
                  <select
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-teal-550/20 focus:border-teal-700 transition-all cursor-pointer"
                    value={trangThaiEq}
                    onChange={(e) => setTrangThaiEq(e.target.value)}
                  >
                    <option value="san_sang">Sẵn sàng (Hoạt động)</option>
                    <option value="dang_su_dung">Đang sử dụng</option>
                    <option value="dang_bao_tri">Đang bảo trì / Ngừng dùng</option>
                    <option value="hong">Đã hỏng</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Ghi chú bảo dưỡng / Trạng thái chi tiết</label>
                <textarea
                  placeholder="Ví dụ: Thiết bị mới bảo dưỡng định kỳ tháng 5/2026, hoạt động ổn định..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-teal-550/20 focus:border-teal-700 transition-all min-h-[80px]"
                  value={ghiChuEq}
                  onChange={(e) => setGhiChuEq(e.target.value)}
                />
              </div>

              {/* Action buttons */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 -mx-6 -mb-6 p-4">
                <button
                  type="button"
                  onClick={() => setIsEquipmentModalOpen(false)}
                  className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-teal-800 text-white font-bold rounded-xl hover:bg-teal-900 transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-teal-900/10 active:scale-95"
                >
                  {submitting && <Loader2 className="animate-spin" size={14} />}
                  {submitting ? 'Đang lưu...' : selectedEquipment ? 'Cập nhật' : 'Tạo thiết bị'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
