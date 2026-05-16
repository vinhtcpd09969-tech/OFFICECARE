import { useState, useEffect } from 'react';
import axiosInstance from '../../../api/axios';
import { useNavigate } from 'react-router-dom';

export default function WalkInBooking() {
  const [formData, setFormData] = useState({
    sdt: '',
    ho_ten: '',
    gioi_tinh: 'khac',
    ngay_sinh: '',
    dich_vu_id: '',
    ky_thuat_vien_id: '',
    gio_bat_dau: new Date().toISOString().slice(0, 16) // Format YYYY-MM-DDTHH:mm
  });
  const [services, setServices] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSelectData = async () => {
      try {
        const [servRes, staffRes] = await Promise.all([
          axiosInstance.get('/admin/services'), // Reuse admin endpoint
          axiosInstance.get('/admin/staff') // Reuse admin endpoint
        ]);
        setServices(servRes.data);
        setStaff(staffRes.data.filter((s: any) => s.vai_tro === 'Kỹ thuật viên' || s.vai_tro === 'Bác sĩ'));
      } catch (error) {
        console.error('Error loading form data:', error);
      }
    };
    fetchSelectData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axiosInstance.post('/receptionist/walk-in', formData);
      alert('Tạo lịch thành công!');
      navigate('/receptionist'); // Go back to Kanban
    } catch (error) {
      alert('Lỗi tạo lịch vãng lai');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Đăng ký khách vãng lai (Walk-in)</h2>
          <p className="text-slate-500 mt-1">Tạo thông tin khách hàng và xếp lịch dịch vụ ngay lập tức.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-8">
        {/* Thông tin khách hàng */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-sm">1</span>
            Thông tin Khách hàng
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Số điện thoại *</label>
              <input 
                required
                type="text" 
                name="sdt"
                value={formData.sdt}
                onChange={handleChange}
                placeholder="Nhập SĐT để tự động tìm khách hàng cũ..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Họ và tên *</label>
              <input 
                required
                type="text" 
                name="ho_ten"
                value={formData.ho_ten}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Giới tính</label>
              <select 
                name="gioi_tinh"
                value={formData.gioi_tinh}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition-all"
              >
                <option value="khac">Khác</option>
                <option value="nam">Nam</option>
                <option value="nu">Nữ</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Năm sinh</label>
              <input 
                type="date" 
                name="ngay_sinh"
                value={formData.ngay_sinh}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Thông tin dịch vụ */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-sm">2</span>
            Dịch vụ & Lịch hẹn
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Dịch vụ *</label>
              <select 
                required
                name="dich_vu_id"
                value={formData.dich_vu_id}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition-all"
              >
                <option value="">-- Chọn dịch vụ --</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.ten_dich_vu} ({s.thoi_luong_phut} phút - {s.don_gia}đ)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Kỹ thuật viên</label>
              <select 
                name="ky_thuat_vien_id"
                value={formData.ky_thuat_vien_id}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition-all"
              >
                <option value="">-- Bỏ trống nếu chưa xếp --</option>
                {staff.map(st => (
                  <option key={st.id} value={st.id}>{st.ho_ten}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Giờ bắt đầu làm *</label>
              <input 
                required
                type="datetime-local" 
                name="gio_bat_dau"
                value={formData.gio_bat_dau}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex justify-end gap-4">
          <button 
            type="button" 
            onClick={() => navigate('/receptionist')}
            className="px-6 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors"
          >
            Hủy
          </button>
          <button 
            type="submit" 
            disabled={loading}
            className="px-8 py-2.5 text-white bg-teal-600 hover:bg-teal-700 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? 'Đang xử lý...' : 'Tạo Lịch & Check-in ngay'}
          </button>
        </div>
      </form>
    </div>
  );
}
