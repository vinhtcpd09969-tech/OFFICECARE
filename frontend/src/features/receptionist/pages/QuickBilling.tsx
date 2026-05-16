import { useState } from 'react';
import axiosInstance from '../../../api/axios';
import { useNavigate } from 'react-router-dom';

export default function QuickBilling() {
  const [lichDatId, setLichDatId] = useState('');
  const [soTienNhan, setSoTienNhan] = useState('');
  const [phuongThuc, setPhuongThuc] = useState('tien_mat');
  const [hoaDon, setHoaDon] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleTạoHoaDon = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axiosInstance.post('/receptionist/billing', { lich_dat_id: lichDatId });
      setHoaDon(res.data.hoa_don);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Lỗi tạo hóa đơn');
    } finally {
      setLoading(false);
    }
  };

  const handleThanhToan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hoaDon) return;
    setLoading(true);
    try {
      await axiosInstance.post('/receptionist/payment', {
        hoa_don_id: hoaDon.id,
        so_tien_nhan: soTienNhan,
        phuong_thuc: phuongThuc
      });
      alert('Thanh toán thành công!');
      navigate('/receptionist');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Lỗi thanh toán');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Thanh toán Nhanh (Quick Billing)</h2>
          <p className="text-slate-500 mt-1">Tạo hóa đơn và nhận thanh toán cho khách hàng.</p>
        </div>
      </div>

      {!hoaDon ? (
        <form onSubmit={handleTạoHoaDon} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Mã Lịch Đặt *</label>
            <input 
              required
              type="text" 
              value={lichDatId}
              onChange={(e) => setLichDatId(e.target.value)}
              placeholder="VD: LD123456"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-2.5 text-white bg-teal-600 hover:bg-teal-700 rounded-xl font-medium"
          >
            {loading ? 'Đang xử lý...' : 'Tra cứu & Tạo Hóa Đơn'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleThanhToan} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
          <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 mb-6">
            <h3 className="font-bold text-teal-800 mb-2">Thông tin Hóa Đơn</h3>
            <p className="text-sm text-teal-700">Mã: {hoaDon.ma_hoa_don}</p>
            <p className="text-sm text-teal-700">Tổng tiền: <strong className="text-lg">{formatCurrency(hoaDon.tong_tien_thanh_toan)}</strong></p>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Phương thức thanh toán</label>
              <select 
                value={phuongThuc}
                onChange={(e) => setPhuongThuc(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
              >
                <option value="tien_mat">Tiền mặt</option>
                <option value="chuyen_khoan">Chuyển khoản</option>
                <option value="the">Thẻ</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Số tiền nhận (VNĐ) *</label>
              <input 
                required
                type="number" 
                value={soTienNhan}
                onChange={(e) => setSoTienNhan(e.target.value)}
                min={hoaDon.tong_tien_thanh_toan}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <button 
              type="button" 
              onClick={() => setHoaDon(null)}
              className="flex-1 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium"
            >
              Hủy
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 py-2.5 text-white bg-teal-600 hover:bg-teal-700 rounded-xl font-medium"
            >
              {loading ? 'Đang xử lý...' : 'Xác nhận Thanh Toán'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
