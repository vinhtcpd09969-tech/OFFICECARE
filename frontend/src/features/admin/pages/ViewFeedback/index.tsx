import { useEffect, useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../../../api/axios';
import { 
  Star, 
  MessageSquare, 
  Award, 
  Smile, 
  Loader2, 
  Package, 
  Users 
} from 'lucide-react';

interface Feedback {
  id: string;
  ten_khach_hang: string;
  ten_ky_thuat_vien: string;
  ten_dich_vu: string;
  so_sao_tong: number | null;
  so_sao_ktv: number | null;
  nhan_xet: string;
  hieu_qua_dieu_tri?: string;
  thoi_gian_danh_gia: string;
}

export default function ViewFeedback() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'service' | 'staff'>('service');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/feedback');
      setFeedbacks(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Lỗi khi tải đánh giá:', error);
      toast.error('Không thể kết nối API tải đánh giá.');
    } finally {
      setLoading(false);
    }
  };

  // Split reviews
  const serviceFeedbacks = useMemo(() => {
    return feedbacks.filter(f => f.so_sao_tong !== null);
  }, [feedbacks]);

  const staffFeedbacks = useMemo(() => {
    return feedbacks.filter(f => f.so_sao_ktv !== null);
  }, [feedbacks]);

  // Calculations
  const serviceStats = useMemo(() => {
    if (serviceFeedbacks.length === 0) return { avg: 5.0, count: 0 };
    const sum = serviceFeedbacks.reduce((acc, f) => acc + (f.so_sao_tong || 0), 0);
    return {
      avg: Number((sum / serviceFeedbacks.length).toFixed(1)),
      count: serviceFeedbacks.length
    };
  }, [serviceFeedbacks]);

  const staffStats = useMemo(() => {
    if (staffFeedbacks.length === 0) return { avg: 5.0, count: 0 };
    const sum = staffFeedbacks.reduce((acc, f) => acc + (f.so_sao_ktv || 0), 0);
    return {
      avg: Number((sum / staffFeedbacks.length).toFixed(1)),
      count: staffFeedbacks.length
    };
  }, [staffFeedbacks]);

  const renderStars = (count: number) => {
    return (
      <div className="flex gap-0.5 text-amber-400">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star 
            key={i} 
            size={14} 
            className={i < count ? 'fill-amber-400 stroke-none' : 'text-zinc-200 fill-zinc-200 stroke-none'} 
          />
        ))}
      </div>
    );
  };

  const formatDate = (isoString: string) => {
    if (!isClient) return ''; 
    const d = new Date(isoString);
    return `${d.toLocaleDateString('vi-VN')} ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-secondary dark:text-zinc-100 tracking-tight flex items-center gap-2.5">
            <MessageSquare className="text-primary animate-pulse" size={26} />
            Đánh giá & Phản hồi
          </h1>
          <p className="text-xs text-zinc-400 dark:text-zinc-550 font-bold uppercase mt-0.5 tracking-wider">
            Phân tích mức độ hài lòng của khách hàng về dịch vụ trị liệu & nhân sự y khoa
          </p>
        </div>
      </div>

      {/* Analytics Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Service Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-150/60 dark:border-zinc-800 rounded-[28px] p-6 shadow-xs flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Đánh giá dịch vụ</p>
            <h3 className="text-2xl font-black text-secondary dark:text-zinc-100">
              {serviceStats.avg} <span className="text-xs text-zinc-400 font-bold">/ 5.0</span>
            </h3>
            <p className="text-[10px] text-teal-600 font-extrabold">Từ {serviceStats.count} lượt đánh giá</p>
          </div>
          <div className="w-12 h-12 bg-teal-50 dark:bg-teal-950/20 text-teal-650 dark:text-teal-400 rounded-2xl flex items-center justify-center shadow-xs">
            <Package size={22} />
          </div>
        </div>

        {/* Staff Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-150/60 dark:border-zinc-800 rounded-[28px] p-6 shadow-xs flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Đánh giá KTV & Bác sĩ</p>
            <h3 className="text-2xl font-black text-secondary dark:text-zinc-100">
              {staffStats.avg} <span className="text-xs text-zinc-400 font-bold">/ 5.0</span>
            </h3>
            <p className="text-[10px] text-amber-600 font-extrabold">Từ {staffStats.count} lượt đánh giá</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center shadow-xs">
            <Users size={22} />
          </div>
        </div>

        {/* Happy Index */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-150/60 dark:border-zinc-800 rounded-[28px] p-6 shadow-xs flex items-center justify-between gap-4 sm:col-span-2 lg:col-span-1">
          <div className="space-y-1">
            <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Chỉ số hài lòng</p>
            <h3 className="text-2xl font-black text-[#0D9488]">
              {Number((((serviceStats.avg + staffStats.avg) / 10) * 100).toFixed(0))}%
            </h3>
            <p className="text-[10px] text-zinc-450 font-bold">Mức độ hài lòng toàn diện đạt chuẩn</p>
          </div>
          <div className="w-12 h-12 bg-[#EBFBFA] text-[#0D9488] rounded-2xl flex items-center justify-center shadow-xs">
            <Smile size={22} />
          </div>
        </div>
      </div>

      {/* Tabs segment navigation */}
      <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-2xl w-fit shadow-inner">
        <button
          onClick={() => setActiveTab('service')}
          className={`px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center gap-2 cursor-pointer ${
            activeTab === 'service'
              ? 'bg-white dark:bg-zinc-900 text-primary shadow-xs border border-zinc-200/20 scale-[1.02]'
              : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          <Package size={14} />
          Đánh giá dịch vụ ({serviceStats.count})
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center gap-2 cursor-pointer ${
            activeTab === 'staff'
              ? 'bg-white dark:bg-zinc-900 text-primary shadow-xs border border-zinc-200/20 scale-[1.02]'
              : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          <Users size={14} />
          Đánh giá kỹ thuật viên ({staffStats.count})
        </button>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-zinc-900 border border-zinc-150/60 dark:border-zinc-800 rounded-[32px]">
          <Loader2 className="animate-spin text-primary mb-3" size={28} />
          <p className="text-xs font-bold text-slate-400">Đang tải danh sách phản hồi...</p>
        </div>
      ) : activeTab === 'service' ? (
        // SERVICE REVIEWS TAB
        serviceFeedbacks.length === 0 ? (
          <div className="p-16 text-center bg-white dark:bg-zinc-900 border border-zinc-150/60 dark:border-zinc-800 rounded-[32px] text-xs font-semibold text-slate-450 italic">
            Chưa có đánh giá chất lượng dịch vụ nào được ghi nhận.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {serviceFeedbacks.map((f) => (
              <div key={f.id} className="bg-white dark:bg-zinc-900 rounded-[28px] border border-zinc-150/60 dark:border-zinc-800 p-6 md:p-8 shadow-xs flex flex-col justify-between hover:shadow-sm hover:border-zinc-200 dark:hover:border-zinc-700 transition-all duration-350">
                <div className="space-y-4">
                  {/* Header info */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-750 flex items-center justify-center text-slate-400 shadow-inner shrink-0">
                        👤
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs text-secondary dark:text-zinc-200">{f.ten_khach_hang}</h4>
                        <p className="text-[9px] text-zinc-400 font-bold uppercase mt-0.5">{formatDate(f.thoi_gian_danh_gia)}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-1">Dịch vụ trị liệu</p>
                      <span className="text-[9px] font-black text-teal-650 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/20 px-2.5 py-1 rounded-lg uppercase tracking-tight">
                        {f.ten_dich_vu}
                      </span>
                    </div>
                  </div>

                  {/* Rating display */}
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-850/30 px-3.5 py-2.5 rounded-xl border border-slate-100 dark:border-zinc-800/80 w-fit">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Đánh giá:</span>
                    {renderStars(f.so_sao_tong || 0)}
                  </div>

                  {/* Review Text */}
                  <div className="relative pt-1.5">
                    <p className="text-[13px] font-semibold text-slate-600 dark:text-zinc-350 leading-relaxed bg-slate-50/50 dark:bg-zinc-850/10 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800/50 italic">
                      "{f.nhan_xet || 'Khách hàng không để lại nhận xét bằng chữ.'}"
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        // STAFF REVIEWS TAB
        staffFeedbacks.length === 0 ? (
          <div className="p-16 text-center bg-white dark:bg-zinc-900 border border-zinc-150/60 dark:border-zinc-800 rounded-[32px] text-xs font-semibold text-slate-450 italic">
            Chưa có đánh giá kỹ thuật viên nào được ghi nhận.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {staffFeedbacks.map((f) => (
              <div key={f.id} className="bg-white dark:bg-zinc-900 rounded-[28px] border border-zinc-150/60 dark:border-zinc-800 p-6 md:p-8 shadow-xs flex flex-col justify-between hover:shadow-sm hover:border-zinc-200 dark:hover:border-zinc-700 transition-all duration-350">
                <div className="space-y-4">
                  {/* Header info */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-750 flex items-center justify-center text-slate-400 shadow-inner shrink-0">
                        👤
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs text-secondary dark:text-zinc-200">{f.ten_khach_hang}</h4>
                        <p className="text-[9px] text-zinc-400 font-bold uppercase mt-0.5">{formatDate(f.thoi_gian_danh_gia)}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-1">Kỹ thuật viên</p>
                      <span className="text-[9px] font-black text-amber-750 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-2.5 py-1 rounded-lg uppercase tracking-tight flex items-center gap-1">
                        <Award size={10} /> {f.ten_ky_thuat_vien}
                      </span>
                    </div>
                  </div>

                  {/* Rating display */}
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-850/30 px-3.5 py-2.5 rounded-xl border border-slate-100 dark:border-zinc-800/80 w-fit">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Đánh giá KTV:</span>
                    {renderStars(f.so_sao_ktv || 0)}
                  </div>

                  {/* Review Text */}
                  <div className="relative pt-1.5">
                    <p className="text-[13px] font-semibold text-slate-600 dark:text-zinc-350 leading-relaxed bg-slate-50/50 dark:bg-zinc-850/10 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800/50 italic">
                      "{f.nhan_xet || 'Khách hàng không để lại nhận xét bằng chữ.'}"
                    </p>
                  </div>
                </div>

                {/* Footer Service details */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-[9px] text-zinc-400 font-bold uppercase">
                  <span>Dịch vụ liên quan:</span>
                  <span className="text-secondary dark:text-zinc-200">{f.ten_dich_vu}</span>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
