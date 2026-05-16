import { useEffect, useState } from 'react';
import axios from 'axios';

interface Feedback {
  id: string;
  ten_khach_hang: string;
  ten_ky_thuat_vien: string;
  ten_dich_vu: string;
  so_sao_tong: number;
  so_sao_ktv: number;
  nhan_xet: string;
  hieu_qua_dieu_tri: string;
  thoi_gian_danh_gia: string;
}

export default function ViewFeedback() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const res = await axios.get('/api/admin/feedback');
      setFeedbacks(res.data);
    } catch (error) {
      console.error('Lỗi khi tải đánh giá:', error);
    }
  };

  const renderStars = (count: number) => {
    return (
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <span key={i} className={i < count ? 'text-amber-400' : 'text-slate-200'}>
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Đánh giá & Phản hồi</h1>
        <p className="text-slate-500">Xem ý kiến của khách hàng về dịch vụ và kỹ thuật viên.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {feedbacks.map((f) => (
          <div key={f.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col h-full">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-lg">
                  👤
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{f.ten_khach_hang}</h3>
                  <p className="text-xs text-slate-400">{new Date(f.thoi_gian_danh_gia).toLocaleDateString('vi-VN')} {new Date(f.thoi_gian_danh_gia).toLocaleTimeString('vi-VN')}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-medium text-slate-400 mb-1">Dịch vụ</div>
                <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-md">{f.ten_dich_vu}</span>
              </div>
            </div>

            <div className="space-y-3 flex-1">
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Đánh giá chung</p>
                  {renderStars(f.so_sao_tong)}
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 mb-1">Kỹ thuật viên: <span className="text-slate-700 font-medium">{f.ten_ky_thuat_vien}</span></p>
                  {renderStars(f.so_sao_ktv)}
                </div>
              </div>

              <div className="pt-2">
                <p className="text-sm font-medium text-slate-500 mb-1 italic">Nhận xét:</p>
                <p className="text-slate-700 leading-relaxed bg-amber-50/30 p-4 rounded-xl border border-amber-100/50">
                  "{f.nhan_xet || 'Khách hàng không để lại bình luận.'}"
                </p>
              </div>

              {f.hieu_qua_dieu_tri && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400">Hiệu quả:</span>
                  <span className="font-bold text-slate-700 uppercase tracking-wider">{f.hieu_qua_dieu_tri}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
