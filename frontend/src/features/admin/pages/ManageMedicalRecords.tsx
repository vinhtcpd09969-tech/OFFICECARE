import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { getMedicalRecords } from '../../../api/admin.api';
import { format } from 'date-fns';

export default function ManageMedicalRecords() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('customer') || '');

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await getMedicalRecords();
      setRecords(res.data);
    } catch (error) {
      console.error('Error fetching medical records:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const filteredRecords = records.filter(rec => 
    rec.ten_khach_hang?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rec.ma_khach_hang?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rec.ma_danh_gia?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Hồ sơ điều trị</h2>
          <p className="text-slate-500 mt-1">Tra cứu hồ sơ điều trị, phiếu lượng giá và lịch sử điều trị của khách hàng.</p>
        </div>
        <div className="relative w-72">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm theo mã KH, mã HS điều trị, tên..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                <th className="p-4 font-semibold">Mã Đánh Giá</th>
                <th className="p-4 font-semibold">Khách Hàng</th>
                <th className="p-4 font-semibold">Ngày Lượng Giá</th>
                <th className="p-4 font-semibold">Chẩn Đoán Bệnh</th>
                <th className="p-4 font-semibold">Kỹ Thuật Viên Phụ Trách</th>
                <th className="p-4 font-semibold text-center">Trạng Thái</th>
                <th className="p-4 font-semibold text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">Đang tải dữ liệu...</td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">Chưa có hồ sơ điều trị nào.</td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium text-slate-800">{rec.ma_danh_gia || '-'}</td>
                    <td className="p-4 font-medium text-slate-800">
                      <div className="flex flex-col">
                        <span>{rec.ten_khach_hang}</span>
                        <span className="text-xs text-slate-500 font-mono">{rec.ma_khach_hang}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 text-sm">
                      {rec.ngay_danh_gia ? format(new Date(rec.ngay_danh_gia), 'dd/MM/yyyy') : '-'}
                    </td>
                    <td className="p-4 text-slate-600 text-sm max-w-[200px] truncate" title={rec.chan_doan}>
                      {rec.chan_doan || 'Chưa chẩn đoán'}
                    </td>
                    <td className="p-4 text-slate-600 text-sm">
                      {rec.ten_ky_thuat_vien || '-'}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        rec.trang_thai === 'hoan_thanh' ? 'bg-emerald-100 text-emerald-800' : 
                        rec.trang_thai === 'da_de_xuat' ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {rec.trang_thai === 'hoan_thanh' ? 'Hoàn thành' : 
                         rec.trang_thai === 'da_de_xuat' ? 'Đã đề xuất gói' : 'Bản nháp'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button className="text-teal-600 hover:text-teal-800 text-sm font-medium mr-3">Xem Chi Tiết</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
