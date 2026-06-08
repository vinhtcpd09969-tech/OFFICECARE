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
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

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
                        rec.trang_thai === 'hoan_thanh' || rec.trang_thai === 'da_dieu_phoi'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {rec.trang_thai === 'hoan_thanh' || rec.trang_thai === 'da_dieu_phoi' ? 'Hoàn thành' : 'Sơ bộ'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => {
                          setSelectedRecord(rec);
                          setIsDetailOpen(true);
                        }}
                        className="text-teal-600 hover:text-teal-800 text-sm font-medium mr-3"
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

      {/* Modal Xem Chi Tiết */}
      {isDetailOpen && selectedRecord && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-5 border-b border-zinc-100 flex justify-between items-center bg-white">
              <div className="flex items-center gap-2.5">
                <div className="size-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
                  <span className="font-bold text-lg">🩺</span>
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">
                    Chi Tiết Hồ Sơ Điều Trị
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">
                    Mã đánh giá: <span className="font-mono text-teal-600 font-bold">{selectedRecord.ma_danh_gia || 'N/A'}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsDetailOpen(false);
                  setSelectedRecord(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
              {/* Patient Info Card */}
              <div className="bg-slate-50 p-4 rounded-xl border border-zinc-200/50 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Khách hàng</span>
                  <span className="text-sm font-bold text-slate-850 block mt-0.5">{selectedRecord.ten_khach_hang}</span>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Số điện thoại</span>
                  <span className="text-sm font-semibold text-slate-800 block mt-0.5">{selectedRecord.so_dien_thoai || 'Chưa cung cấp'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Bác sĩ lập hồ sơ</span>
                  <span className="text-sm font-bold text-slate-800 block mt-0.5">{selectedRecord.ten_bac_si || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Phòng khám ban đầu</span>
                  <span className="text-sm font-semibold text-slate-800 block mt-0.5">{selectedRecord.ten_phong_kham || 'N/A'}</span>
                </div>
              </div>

              {/* Diagnosis and Treatment */}
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Lý do khám / Triệu chứng ban đầu</span>
                  <div className="mt-1 p-3 bg-zinc-50 border border-slate-200/50 rounded-lg text-xs text-slate-600 italic">
                    "{selectedRecord.trieu_chung || 'Không mô tả triệu chứng'}"
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Chẩn đoán y khoa</span>
                  <div className="mt-1 p-3 bg-teal-50/20 border border-teal-100 rounded-lg text-xs text-slate-800 font-bold">
                    "{selectedRecord.chan_doan || 'Không có chẩn đoán chi tiết'}"
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Chỉ định phương pháp điều trị</span>
                  <div className="mt-1 p-3 bg-slate-50 border border-slate-200/50 rounded-lg text-xs text-slate-800 font-medium">
                    {selectedRecord.phuong_phap_dieu_tri || 'Chưa chỉ định'}
                  </div>
                </div>

                {selectedRecord.ghi_chu && (
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Ghi chú lâm sàng</span>
                    <div className="mt-1 p-3 bg-slate-50 border border-slate-200/50 rounded-lg text-xs text-slate-650 italic">
                      "{selectedRecord.ghi_chu}"
                    </div>
                  </div>
                )}
              </div>

              {/* Service package and session details */}
              <div className="bg-emerald-50/20 p-4 rounded-xl border border-emerald-100/50 space-y-3">
                <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">Thông tin gói chỉ định</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block font-bold uppercase tracking-wider text-[9px]">Tên gói:</span>
                    <span className="font-extrabold text-emerald-700 text-sm mt-0.5 block">{selectedRecord.ten_goi || 'Liệu trình tự chọn'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold uppercase tracking-wider text-[9px]">Số lượng buổi:</span>
                    <span className="font-extrabold text-slate-800 text-sm mt-0.5 block">
                      {selectedRecord.so_luong_buoi} buổi {selectedRecord.so_luong_goi > 1 && `(x${selectedRecord.so_luong_goi} gói)`}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold uppercase tracking-wider text-[9px]">Tổng chi phí:</span>
                    <span className="font-mono font-extrabold text-emerald-600 text-sm mt-0.5 block">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(selectedRecord.gia_tien) * (selectedRecord.so_luong_goi || 1))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Assignment details (Manager Assignment) */}
              <div className="border-t border-zinc-150 pt-4 space-y-3">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Điều phối trị liệu từ Quản lý</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Kỹ thuật viên trị liệu</span>
                    <div className="mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800">
                      {selectedRecord.ten_ky_thuat_vien || (
                        <span className="text-amber-600 italic font-semibold">Chưa điều phối KTV</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Phòng trị liệu thực hiện</span>
                    <div className="mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800">
                      {selectedRecord.ten_phong_tri_lieu || (
                        <span className="text-amber-600 italic font-semibold">Chưa điều phối phòng</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end bg-slate-50">
              <button
                type="button"
                onClick={() => {
                  setIsDetailOpen(false);
                  setSelectedRecord(null);
                }}
                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
