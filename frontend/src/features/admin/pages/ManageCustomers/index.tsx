import { useState, useEffect, useMemo } from 'react';
import { 
  Search, User, FileText, Award, Edit3
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { getMedicalRecords, updateCustomer, toggleCustomerLock } from '../../api/admin.api';
import PatientEmrDetail from '../../components/PatientEmrDetail';

export default function ManageCustomers() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Reputation Score Filters
  const [minPoints, setMinPoints] = useState<number>(0);
  const [maxPoints, setMaxPoints] = useState<number>(500); // 500 max default
  
  // Selection/Detail state
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);

  // Edit Customer Modal State
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    ho_ten: '',
    so_dien_thoai: '',
    email: '',
    gioi_tinh: 'khac',
    dia_chi: '',
    ngay_sinh: '',
    diem_uy_tin: 100
  });

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await getMedicalRecords();
      setPatients(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Không thể kết nối API danh sách khách hàng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  // Compute EMR stats
  const stats = useMemo(() => {
    const total = patients.length;
    
    // Count patients with at least one plan or at least one completed appointment
    const hasEmr = patients.filter((p: any) => 
      (p.plans?.length || 0) > 0 || p.appointments?.some((ap: any) => ap.trang_thai === 'hoan_thanh')
    ).length;

    const activePlans = patients.filter((p: any) => 
      p.plans?.some((pl: any) => pl.trang_thai === 'dang_dieu_tri')
    ).length;

    return { total, hasEmr, activePlans };
  }, [patients]);

  const handleStartEdit = (patient: any) => {
    setEditingCustomer(patient);
    setEditForm({
      ho_ten: patient.ho_ten || '',
      so_dien_thoai: patient.so_dien_thoai || '',
      email: patient.email || '',
      gioi_tinh: patient.gioi_tinh || 'khac',
      dia_chi: patient.dia_chi || '',
      ngay_sinh: patient.ngay_sinh ? format(new Date(patient.ngay_sinh), 'yyyy-MM-dd') : '',
      diem_uy_tin: patient.diem_uy_tin || 0
    });
  };

  const handleSaveProfile = async () => {
    if (!editingCustomer) return;
    try {
      await updateCustomer(editingCustomer.id, editForm);
      toast.success('Đã cập nhật thông tin khách hàng thành công!');
      setEditingCustomer(null);
      fetchPatients(); // Reload fresh state
      // If the selected patient is the one being edited, update its details too
      if (selectedPatient && selectedPatient.id === editingCustomer.id) {
        setSelectedPatient({ ...selectedPatient, ...editForm });
      }
    } catch (error) {
      console.error('Failed to update customer:', error);
      toast.error('Có lỗi xảy ra khi lưu thông tin khách hàng.');
    }
  };

  const handleToggleLock = async (patient: any) => {
    const isLocked = patient.trang_thai !== 'vo_hieu';
    const confirmMsg = isLocked 
      ? `Bạn có chắc chắn muốn KHÓA tài khoản của khách hàng "${patient.ho_ten}"? Khách hàng sẽ không thể đăng nhập vào hệ thống nữa.`
      : `Bạn có chắc chắn muốn MỞ KHÓA tài khoản của khách hàng "${patient.ho_ten}"?`;
      
    if (!window.confirm(confirmMsg)) return;

    try {
      await toggleCustomerLock(patient.id, isLocked);
      toast.success(isLocked ? 'Đã khóa tài khoản khách hàng thành công' : 'Đã mở khóa tài khoản khách hàng thành công');
      fetchPatients(); // Reload fresh list
      if (selectedPatient && selectedPatient.id === patient.id) {
        setSelectedPatient({ ...selectedPatient, trang_thai: isLocked ? 'vo_hieu' : 'hoat_dong' });
      }
    } catch (error) {
      console.error('Failed to toggle customer lock:', error);
      toast.error('Có lỗi xảy ra khi thực hiện thao tác.');
    }
  };

  // Filter patients
  const filteredPatients = useMemo(() => {
    return patients.filter((p: any) => {
      const patientCode = 'KH-' + p.id.substring(0, 8).toUpperCase();
      const matchesSearch = 
        (p.ho_ten?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (p.so_dien_thoai || '').includes(searchTerm) ||
        patientCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());

      const points = p.diem_uy_tin || 0;
      const matchesPoints = points >= minPoints && points <= maxPoints;

      return matchesSearch && matchesPoints;
    });
  }, [patients, searchTerm, minPoints, maxPoints]);

  return (
    <div className="space-y-6">
      {/* ------------------ OVERVIEW VIEW ------------------ */}
      {!selectedPatient ? (
        <div className="space-y-6 animate-fade-in">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              Quản lý Khách hàng & Hồ sơ điều trị
            </h2>
            <p className="text-slate-505 text-xs font-semibold mt-1">
              Danh sách chi tiết thông tin hành chính người dùng và quản lý hồ sơ bệnh lý.
            </p>
          </div>

          {/* Unified KPI Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-6 rounded-2xl shadow-sm flex items-center justify-between transition-all hover:shadow-md border border-slate-800 animate-scale-up">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Tổng số khách hàng</span>
                <span className="text-3xl font-black mt-2 block">{stats.total}</span>
              </div>
              <div className="size-12 rounded-xl bg-white/10 flex items-center justify-center">
                <User size={22} className="stroke-[2.5]" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-500/5 to-indigo-500/10 border border-indigo-100/50 p-6 rounded-2xl shadow-sm flex items-center justify-between transition-all hover:shadow-md hover:shadow-indigo-500/5 animate-scale-up">
              <div>
                <span className="text-[10px] font-black text-indigo-850 uppercase tracking-widest block">Hồ sơ điều trị</span>
                <span className="text-3xl font-black text-indigo-950 mt-2 block">{stats.hasEmr}</span>
              </div>
              <div className="size-12 rounded-xl bg-indigo-500/10 border border-indigo-200/20 flex items-center justify-center text-indigo-600">
                <FileText size={22} className="stroke-[2.5]" />
              </div>
            </div>
          </div>

          {/* Search and point filters */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Point Range Filter */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 font-extrabold flex items-center gap-1.5 uppercase tracking-wider">
                  <Award size={14} className="text-indigo-500" />
                  Điểm uy tín:
                </span>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    placeholder="Từ" 
                    value={minPoints} 
                    onChange={(e) => setMinPoints(Number(e.target.value))} 
                    className="w-20 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-center focus:outline-none focus:ring-2 focus:ring-slate-500/10" 
                  />
                  <span className="text-slate-450 font-bold">—</span>
                  <input 
                    type="number" 
                    placeholder="Đến" 
                    value={maxPoints} 
                    onChange={(e) => setMaxPoints(Number(e.target.value))} 
                    className="w-20 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-center focus:outline-none focus:ring-2 focus:ring-slate-500/10" 
                  />
                </div>
              </div>

              {/* Smart Search */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Tìm kiếm họ tên, số điện thoại, email..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-500/10 w-full"
                />
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
                    <th className="p-4 font-black">Ngày sinh</th>
                    <th className="p-4 font-black">Giới tính</th>
                    <th className="p-4 font-black">Số điện thoại / Email</th>
                    <th className="p-4 font-black">Địa chỉ</th>
                    <th className="p-4 font-black text-center">Điểm uy tín</th>
                    <th className="p-4 font-black text-center">Hồ Sơ Điều Trị</th>
                    <th className="p-4 font-black text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 font-semibold animate-pulse">Đang tải dữ liệu khách hàng...</td>
                    </tr>
                  ) : filteredPatients.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 font-semibold">Không tìm thấy khách hàng nào thỏa mãn điều kiện lọc.</td>
                    </tr>
                  ) : (
                    filteredPatients.map((p) => {
                      const patientCode = 'KH-' + p.id.substring(0, 8).toUpperCase();
                      const hasCompletedApts = p.appointments?.some((ap: any) => ap.trang_thai === 'hoan_thanh');
                      const realPlans = p.plans?.filter((pl: any) => !pl.id.startsWith('virtual-')) || [];
                      const hasEmr = realPlans.length > 0 || hasCompletedApts;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 font-bold text-slate-800">
                            <div className="flex items-center gap-3">
                              <div className="size-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[10px] uppercase shadow-sm">
                                {p.ho_ten?.charAt(0) || 'K'}
                              </div>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-slate-850 font-bold">{p.ho_ten}</span>
                                  {p.trang_thai === 'vo_hieu' && (
                                    <span className="inline-flex px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-rose-50 text-rose-600 border border-rose-100">
                                      Đã khóa
                                    </span>
                                  )}
                                </div>
                                <span className="text-[9px] text-slate-400 font-extrabold font-mono mt-0.5">{patientCode}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-semibold text-slate-700">
                            {p.ngay_sinh ? format(new Date(p.ngay_sinh), 'dd/MM/yyyy') : 'Chưa cập nhật'}
                          </td>
                          <td className="p-4 font-semibold text-slate-700 capitalize">
                            {p.gioi_tinh === 'nam' ? 'Nam' : p.gioi_tinh === 'nu' ? 'Nữ' : (p.gioi_tinh || 'Chưa cập nhật')}
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-semibold text-slate-700">{p.so_dien_thoai || '-'}</span>
                              <span className="text-[10px] text-slate-400 font-medium">{p.email || '-'}</span>
                            </div>
                          </td>
                          <td className="p-4 text-slate-650 max-w-[150px] truncate">
                            {p.dia_chi || 'Chưa cập nhật'}
                          </td>
                          <td className="p-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-black border border-indigo-100/50">
                              <Award size={10} className="text-indigo-500" />
                              {p.diem_uy_tin || 0}đ
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            {hasEmr ? (
                              <button
                                onClick={() => setSelectedPatient(p)}
                                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-[10px] transition-all hover:scale-[1.02] active:scale-95 shadow-sm whitespace-nowrap"
                              >
                                Xem Chi Tiết
                              </button>
                            ) : (
                              <span className="text-slate-400 font-semibold italic">Không có</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex justify-center items-center gap-2">
                              <button
                                onClick={() => handleStartEdit(p)}
                                className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-655 hover:text-slate-800 rounded-xl font-bold text-[10px] transition-all flex items-center gap-1 hover:scale-[1.02] active:scale-95 whitespace-nowrap shadow-sm"
                              >
                                <Edit3 size={10} />
                                Sửa thông tin
                              </button>
                              <button
                                onClick={() => handleToggleLock(p)}
                                className={`px-2.5 py-1.5 border rounded-xl font-bold text-[10px] transition-all flex items-center gap-1 hover:scale-[1.02] active:scale-95 whitespace-nowrap shadow-sm ${
                                  p.trang_thai === 'vo_hieu'
                                    ? 'border-emerald-250 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/70'
                                    : 'border-rose-200 bg-rose-50/50 text-rose-600 hover:bg-rose-50'
                                }`}
                              >
                                {p.trang_thai === 'vo_hieu' ? 'Mở khóa' : 'Khóa tài khoản'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ------------------ PATIENT PROFILE DETAILS VIEW (EMR HUB ONLY) ------------------ */
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm animate-fade-in">
          <PatientEmrDetail 
            patient={selectedPatient} 
            onBack={() => setSelectedPatient(null)} 
            showAdminInfo={false}
          />
        </div>
      )}

      {/* ------------------ EDIT CUSTOMER MODAL (GLASSMORPHISM POPUP) ------------------ */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl max-w-lg w-full space-y-5 animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-50 pb-3">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-1.5">
                <Edit3 size={16} className="text-indigo-600" />
                Cập nhật thông tin hành chính
              </h3>
              <button 
                onClick={() => setEditingCustomer(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="col-span-2">
                <label className="block text-slate-400 font-semibold mb-1">Họ và tên</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-205 rounded-xl font-bold text-slate-850 focus:outline-none focus:ring-2 focus:ring-slate-500/10"
                  value={editForm.ho_ten}
                  onChange={(e) => setEditForm({ ...editForm, ho_ten: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Số điện thoại</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-205 rounded-xl font-bold text-slate-855 focus:outline-none focus:ring-2 focus:ring-slate-500/10"
                  value={editForm.so_dien_thoai}
                  onChange={(e) => setEditForm({ ...editForm, so_dien_thoai: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Email</label>
                <input 
                  type="email" 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-205 rounded-xl font-bold text-slate-855 focus:outline-none focus:ring-2 focus:ring-slate-500/10"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Giới tính</label>
                <select 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-205 rounded-xl font-bold text-slate-855 focus:outline-none focus:ring-2 focus:ring-slate-500/10 cursor-pointer"
                  value={editForm.gioi_tinh}
                  onChange={(e) => setEditForm({ ...editForm, gioi_tinh: e.target.value })}
                >
                  <option value="nam">Nam</option>
                  <option value="nu">Nữ</option>
                  <option value="khac">Khác</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Ngày sinh</label>
                <input 
                  type="date" 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-205 rounded-xl font-bold text-slate-855 focus:outline-none focus:ring-2 focus:ring-slate-500/10"
                  value={editForm.ngay_sinh}
                  onChange={(e) => setEditForm({ ...editForm, ngay_sinh: e.target.value })}
                />
              </div>

              <div className="col-span-2">
                <label className="block text-slate-400 font-semibold mb-1">Địa chỉ thường trú</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-205 rounded-xl font-bold text-slate-855 focus:outline-none focus:ring-2 focus:ring-slate-500/10"
                  value={editForm.dia_chi}
                  onChange={(e) => setEditForm({ ...editForm, dia_chi: e.target.value })}
                />
              </div>

              <div className="col-span-2">
                <label className="block text-slate-400 font-semibold mb-1">Điểm uy tín (0 - 500)</label>
                <input 
                  type="number" 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-205 rounded-xl font-bold text-slate-855 focus:outline-none focus:ring-2 focus:ring-slate-500/10"
                  value={editForm.diem_uy_tin}
                  onChange={(e) => setEditForm({ ...editForm, diem_uy_tin: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2 text-xs">
              <button 
                onClick={handleSaveProfile}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-md active:scale-95"
              >
                Lưu thay đổi
              </button>
              <button 
                onClick={() => setEditingCustomer(null)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold transition-all active:scale-95"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
