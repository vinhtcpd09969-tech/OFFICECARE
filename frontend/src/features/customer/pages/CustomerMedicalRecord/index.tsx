import { useState, useEffect } from 'react';
import { 
  FileText, 
  Calendar, 
  User, 
  TrendingUp, 
  ShieldAlert, 
  Star, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  CreditCard,
  ChevronDown,
  ChevronUp,
  MapPin,
  HeartPulse,
  Sparkles
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getCustomerMedicalRecord, rateAppointment } from '../../api/customer.api';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function CustomerMedicalRecord() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'goi' | 'le' | 'kham'>('goi');
  
  // Expanded package IDs for timeline view
  const [expandedPackages, setExpandedPackages] = useState<Record<string, boolean>>({});
  // Inline rating states for specific session IDs
  const [ratingSessionId, setRatingSessionId] = useState<string | null>(null);
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  const fetchRecord = async () => {
    try {
      setLoading(true);
      const res = await getCustomerMedicalRecord();
      setData(res.data);
      
      // Auto expand the first package if exists
      if (res.data?.goi_dieu_tri?.length > 0) {
        setExpandedPackages({ [res.data.goi_dieu_tri[0].phac_do_id]: true });
      }
    } catch (err) {
      console.error('Lỗi khi tải hồ sơ trị liệu:', err);
      toast.error('Không thể tải thông tin hồ sơ trị liệu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecord();
  }, []);

  const togglePackage = (id: string) => {
    setExpandedPackages(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenRating = (sessionId: string) => {
    setRatingSessionId(sessionId);
    setRatingStars(5);
    setRatingComment('');
  };

  const handleSubmitRating = async (sessionId: string) => {
    if (ratingStars === 0) {
      toast.error('Vui lòng chọn số sao đánh giá.');
      return;
    }
    setSubmittingRating(true);
    try {
      await rateAppointment(sessionId, {
        so_sao: ratingStars,
        nhan_xet: ratingComment
      });
      toast.success('Đánh giá buổi trị liệu thành công!');
      setRatingSessionId(null);
      await fetchRecord(); // reload data to show stars
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Lỗi gửi đánh giá.');
    } finally {
      setSubmittingRating(false);
    }
  };

  const formatPrice = (value: number | string | null | undefined) => {
    if (value === null || value === undefined) return '0đ';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  const getInvoiceStatusBadge = (status: string) => {
    switch (status) {
      case 'da_thanh_toan':
        return <span className="px-3 py-1 text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 rounded-full">Đã thanh toán</span>;
      case 'dang_tra_gop':
        return <span className="px-3 py-1 text-xs font-bold text-amber-700 bg-amber-100 border border-amber-300 rounded-full">Đang trả góp</span>;
      case 'chua_thanh_toan':
      default:
        return <span className="px-3 py-1 text-xs font-bold text-rose-700 bg-rose-100 border border-rose-300 rounded-full font-jakarta">Chờ thanh toán</span>;
    }
  };

  const getPaymentMethodLabel = (method: string | null) => {
    if (!method) return 'N/A';
    const mapping: Record<string, string> = {
      tra_thang: 'Trả thẳng 100%',
      tra_gop: 'Trả góp theo đợt',
      tung_buoi: 'Trả lẻ từng buổi'
    };
    return mapping[method] || method;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-3">
        <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-500">Đang tải hồ sơ & hóa đơn y khoa...</p>
      </div>
    );
  }

  const { khach_hang, lich_su_kham = [], goi_dieu_tri = [], dieu_tri_le = [] } = data || {};

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Patient Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-950 via-slate-900 to-slate-950 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute right-0 bottom-0 translate-y-1/4 translate-x-1/4 opacity-10">
          <HeartPulse size={300} />
        </div>
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30">
              <Sparkles size={12} /> Bệnh án điện tử
            </span>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">{khach_hang?.ho_ten}</h1>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-300">
              <span className="flex items-center gap-1.5"><Clock size={16} /> SĐT: {khach_hang?.so_dien_thoai}</span>
              {khach_hang?.email && <span className="flex items-center gap-1.5"><FileText size={16} /> Email: {khach_hang?.email}</span>}
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <div className="text-right">
              <p className="text-xs text-teal-300 font-bold uppercase tracking-wider">Hạng thành viên</p>
              <p className="text-lg font-black text-white">Khách Hàng Thân Thiết</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center font-bold text-white shadow-lg">
              VIP
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex gap-2 p-1.5 bg-slate-100/80 backdrop-blur-md rounded-2xl border border-slate-200">
        <button
          onClick={() => setActiveTab('goi')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 ${
            activeTab === 'goi' 
              ? 'bg-teal-600 text-white shadow-md' 
              : 'text-slate-600 hover:text-teal-600 hover:bg-white/50'
          }`}
        >
          <HeartPulse size={16} /> Gói liệu trình ({goi_dieu_tri.length})
        </button>
        <button
          onClick={() => setActiveTab('le')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 ${
            activeTab === 'le' 
              ? 'bg-teal-600 text-white shadow-md' 
              : 'text-slate-600 hover:text-teal-600 hover:bg-white/50'
          }`}
        >
          <Sparkles size={16} /> Dịch vụ lẻ ({dieu_tri_le.length})
        </button>
        <button
          onClick={() => setActiveTab('kham')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 ${
            activeTab === 'kham' 
              ? 'bg-teal-600 text-white shadow-md' 
              : 'text-slate-600 hover:text-teal-600 hover:bg-white/50'
          }`}
        >
          <FileText size={16} /> Khám lâm sàng ({lich_su_kham.length})
        </button>
      </div>

      {/* Tab Panels */}
      <div className="space-y-6">
        
        {/* TAB 1: GÓI LIỆU TRÌNH */}
        {activeTab === 'goi' && (
          <div className="space-y-6">
            {goi_dieu_tri.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center gap-4">
                <HeartPulse size={48} className="text-slate-400" />
                <p className="text-slate-500 font-bold text-lg">Bạn chưa đăng ký gói trị liệu nào.</p>
                <p className="text-slate-400 text-sm max-w-sm">Vui lòng đăng ký gói hoặc liên hệ lễ tân để được tư vấn phác đồ điều trị phù hợp.</p>
              </div>
            ) : (
              goi_dieu_tri.map((pkg: any) => {
                const isExpanded = !!expandedPackages[pkg.phac_do_id];
                const percentCompleted = pkg.tong_so_buoi > 0 ? Math.round((pkg.so_buoi_da_dung / pkg.tong_so_buoi) * 100) : 0;
                
                return (
                  <div key={pkg.phac_do_id} className="bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300 hover:border-teal-300">
                    {/* Header Card */}
                    <div className="p-6 md:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 bg-slate-50/50">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-teal-600 uppercase tracking-widest bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
                            Mã phác đồ: {pkg.ma_phac_do}
                          </span>
                          <span className="text-xs font-bold text-slate-500">
                            Kích hoạt: {pkg.ngay_kich_hoat ? format(new Date(pkg.ngay_kich_hoat), 'dd/MM/yyyy', { locale: vi }) : 'Chờ kích hoạt'}
                          </span>
                        </div>
                        <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
                          {pkg.ten_dich_vu}
                        </h2>
                        
                        {/* Progress bar */}
                        <div className="space-y-1.5 max-w-md">
                          <div className="flex justify-between text-xs font-bold text-slate-600">
                            <span>Tiến trình phục hồi: {pkg.so_buoi_da_dung}/{pkg.tong_so_buoi} buổi</span>
                            <span>{percentCompleted}%</span>
                          </div>
                          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                            <div 
                              className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500" 
                              style={{ width: `${percentCompleted}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      {/* Invoice integrated info */}
                      <div className="flex flex-col sm:flex-row gap-4 items-stretch lg:items-center bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                        <div className="space-y-1 pr-6 sm:border-r border-slate-100">
                          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 flex items-center gap-1">
                            <DollarSign size={12} /> Hóa đơn: {pkg.ma_hoa_don || 'Chờ cấp'}
                          </p>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-lg font-black text-slate-800">{formatPrice(pkg.tong_tien_phai_tra)}</span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium">Hình thức: {getPaymentMethodLabel(pkg.hinh_thuc_thanh_toan_goi)}</p>
                        </div>

                        <div className="flex flex-col justify-center gap-2">
                          <div className="flex items-center gap-1.5">
                            {getInvoiceStatusBadge(pkg.trang_thai_hoa_don)}
                          </div>
                          <p className="text-xs text-slate-500 font-semibold">Đã trả: {formatPrice(pkg.so_tien_da_tra)}</p>
                          {pkg.tong_tien_phai_tra - pkg.so_tien_da_tra > 0 && (
                            <p className="text-xs text-rose-500 font-bold">Còn lại: {formatPrice(pkg.tong_tien_phai_tra - pkg.so_tien_da_tra)}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Timeline toggle bar */}
                    <button
                      onClick={() => togglePackage(pkg.phac_do_id)}
                      className="w-full py-3.5 px-6 bg-slate-50 flex items-center justify-between text-xs font-bold text-slate-600 hover:text-teal-600 hover:bg-slate-100/60 border-b border-slate-100 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <FileText size={16} /> Chi tiết nhật ký các buổi trị liệu ({pkg.buoi_dieu_tri.length})
                      </span>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {/* Timeline list of sessions */}
                    {isExpanded && (
                      <div className="p-6 md:p-8 bg-white space-y-6">
                        {pkg.buoi_dieu_tri.length === 0 ? (
                          <p className="text-center text-slate-400 text-sm py-4">Chưa có buổi trị liệu nào được ghi nhận cho phác đồ này.</p>
                        ) : (
                          <div className="relative border-l border-slate-200 ml-4 pl-6 md:pl-8 space-y-8">
                            {pkg.buoi_dieu_tri.map((session: any) => {
                              const isCompleted = session.trang_thai === 'hoan_thanh';
                              const sessionDate = format(new Date(session.ngay_gio_bat_dau), 'dd MMMM, yyyy', { locale: vi });
                              const sessionTime = format(new Date(session.ngay_gio_bat_dau), 'HH:mm');

                              return (
                                <div key={session.cuoc_hen_id} className="relative">
                                  {/* Timeline marker */}
                                  <span className={`absolute -left-[33px] md:-left-[41px] top-1.5 w-6 h-6 rounded-full flex items-center justify-center border-2 bg-white ${
                                    isCompleted 
                                      ? 'border-teal-500 text-teal-600 shadow-sm shadow-teal-100' 
                                      : 'border-slate-300 text-slate-400'
                                  }`}>
                                    {isCompleted ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                                  </span>

                                  {/* Session detail card */}
                                  <div className="bg-slate-50/50 hover:bg-slate-50 rounded-2xl border border-slate-100 p-5 md:p-6 transition-all duration-300 space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60">
                                      <div className="space-y-1">
                                        <h4 className="text-sm md:text-base font-black text-slate-800">
                                          Buổi {session.so_thu_tu_buoi}
                                        </h4>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                                          <span className="flex items-center gap-1"><Calendar size={14} /> {sessionDate}</span>
                                          <span className="flex items-center gap-1"><Clock size={14} /> {sessionTime}</span>
                                          {session.ten_bac_si && <span className="flex items-center gap-1"><User size={14} /> Bác sĩ/KTV: {session.ten_bac_si}</span>}
                                          {session.ten_phong && <span className="flex items-center gap-1"><MapPin size={14} /> {session.ten_phong}</span>}
                                        </div>
                                      </div>
                                      
                                      <div>
                                        {isCompleted ? (
                                          <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 rounded-md">Đã thực hiện</span>
                                        ) : (
                                          <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 rounded-md">Chờ trị liệu</span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Clinical Diary content */}
                                    {isCompleted ? (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                          {session.chan_doan && (
                                            <div>
                                              <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Chẩn đoán buổi điều trị</p>
                                              <p className="text-sm font-semibold text-slate-700 mt-0.5">{session.chan_doan}</p>
                                            </div>
                                          )}
                                          {session.chong_chi_dinh && (
                                            <div className="flex gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700">
                                              <ShieldAlert size={18} className="shrink-0 mt-0.5" />
                                              <div>
                                                <p className="text-[10px] uppercase font-black tracking-wider text-rose-500">Chống chỉ định lưu ý</p>
                                                <p className="text-xs font-semibold mt-0.5">{session.chong_chi_dinh}</p>
                                              </div>
                                            </div>
                                          )}
                                          {session.ghi_chu && (
                                            <div>
                                              <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Nhật ký & Ghi chú Bác sĩ</p>
                                              <p className="text-sm text-slate-600 italic mt-0.5">"{session.ghi_chu}"</p>
                                            </div>
                                          )}
                                        </div>

                                        <div className="space-y-4 flex flex-col justify-between">
                                          {/* VAS progression score display */}
                                          <div className="flex gap-4 p-4 bg-teal-50/50 border border-teal-100/60 rounded-2xl">
                                            <div className="flex-1 text-center border-r border-teal-200/50 pr-4">
                                              <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">VAS Trước buổi</p>
                                              <p className="text-2xl font-black text-slate-700 mt-1">{session.vas_truoc ?? 'N/A'}</p>
                                            </div>
                                            <div className="flex-1 text-center">
                                              <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">VAS Sau buổi</p>
                                              <p className="text-2xl font-black text-teal-600 mt-1">{session.vas_sau ?? 'N/A'}</p>
                                            </div>
                                            <div className="shrink-0 flex items-center justify-center p-2 rounded-xl bg-teal-500/10 text-teal-600">
                                              <TrendingUp size={20} />
                                            </div>
                                          </div>

                                          {/* Session Rating details */}
                                          <div className="border-t border-slate-200/60 pt-4">
                                            {session.danh_gia_sao ? (
                                              <div className="bg-teal-50/20 border border-teal-100/50 rounded-xl p-3">
                                                <div className="flex items-center gap-1.5">
                                                  <span className="text-[10px] font-black uppercase text-teal-600 tracking-wider">Đánh giá của bạn:</span>
                                                  <div className="flex text-amber-400">
                                                    {[...Array(5)].map((_, i) => (
                                                      <Star key={i} size={12} fill={i < session.danh_gia_sao ? 'currentColor' : 'none'} />
                                                    ))}
                                                  </div>
                                                </div>
                                                {session.danh_gia_nhan_xet && (
                                                  <p className="text-xs text-slate-500 italic mt-1">"{session.danh_gia_nhan_xet}"</p>
                                                )}
                                              </div>
                                            ) : (
                                              <div>
                                                {ratingSessionId === session.cuoc_hen_id ? (
                                                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-md space-y-3">
                                                    <div className="flex items-center justify-between">
                                                      <span className="text-xs font-black text-slate-700">Đánh giá buổi trị liệu này</span>
                                                      <div className="flex gap-1">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                          <button 
                                                            key={star} 
                                                            onClick={() => setRatingStars(star)}
                                                            className="text-amber-400 transition-transform active:scale-125"
                                                          >
                                                            <Star size={18} fill={star <= ratingStars ? 'currentColor' : 'none'} />
                                                          </button>
                                                        ))}
                                                      </div>
                                                    </div>
                                                    <textarea
                                                      rows={2}
                                                      placeholder="Nhập cảm nhận của bạn sau buổi trị liệu (không bắt buộc)..."
                                                      value={ratingComment}
                                                      onChange={(e) => setRatingComment(e.target.value)}
                                                      className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:ring-1 focus:ring-teal-500 focus:border-teal-500 resize-none"
                                                    />
                                                    <div className="flex justify-end gap-2">
                                                      <button 
                                                        disabled={submittingRating}
                                                        onClick={() => setRatingSessionId(null)}
                                                        className="px-3.5 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                                                      >
                                                        Hủy
                                                      </button>
                                                      <button 
                                                        disabled={submittingRating}
                                                        onClick={() => handleSubmitRating(session.cuoc_hen_id)}
                                                        className="px-3.5 py-1.5 text-xs font-black text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-md shadow-teal-600/10 flex items-center gap-1.5 transition-all"
                                                      >
                                                        {submittingRating ? 'Đang gửi...' : 'Gửi đánh giá'}
                                                      </button>
                                                    </div>
                                                  </div>
                                                ) : (
                                                  <button
                                                    onClick={() => handleOpenRating(session.cuoc_hen_id)}
                                                    className="w-full py-2 border border-slate-200 hover:border-teal-500 rounded-xl text-xs font-black text-slate-600 hover:text-teal-600 hover:bg-teal-50/20 flex items-center justify-center gap-1.5 transition-all duration-300"
                                                  >
                                                    <Star size={14} /> Gửi đánh giá buổi trị liệu này
                                                  </button>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-xs text-slate-500 italic">Nhật ký y khoa & đánh giá sẽ tự động hiển thị sau khi buổi trị liệu hoàn thành.</p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: DỊCH VỤ LẺ */}
        {activeTab === 'le' && (
          <div className="space-y-6">
            {dieu_tri_le.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center gap-4">
                <Sparkles size={48} className="text-slate-400" />
                <p className="text-slate-500 font-bold text-lg">Bạn chưa có lịch sử điều trị dịch vụ lẻ.</p>
                <p className="text-slate-400 text-sm max-w-sm">Mọi ca trị liệu theo buổi lẻ bạn từng thực hiện sẽ hiển thị ở đây để xem chẩn đoán & hóa đơn.</p>
              </div>
            ) : (
              dieu_tri_le.map((item: any) => {
                const treatmentDateStr = format(new Date(item.ngay_dieu_tri), 'dd/MM/yyyy HH:mm', { locale: vi });
                
                return (
                  <div key={item.cuoc_hen_id} className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm flex flex-col lg:flex-row gap-6 hover:border-teal-300 transition-all duration-300">
                    
                    {/* Diagnostic column */}
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 rounded-md">Buổi lẻ</span>
                        <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                          <Calendar size={14} /> {treatmentDateStr}
                        </span>
                      </div>

                      <h3 className="text-xl font-black text-slate-800 tracking-tight">{item.ten_dich_vu}</h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2 text-sm text-slate-600">
                          {item.ten_bac_si && <p className="flex items-center gap-1.5"><User size={16} /> Bác sĩ/KTV: <span className="font-bold text-slate-700">{item.ten_bac_si}</span></p>}
                          {item.ten_phong && <p className="flex items-center gap-1.5"><MapPin size={16} /> Phòng: <span className="font-bold text-slate-700">{item.ten_phong}</span></p>}
                          {item.chan_doan && <p className="text-slate-500 font-medium">Chẩn đoán: <span className="text-slate-800 font-semibold">{item.chan_doan}</span></p>}
                        </div>

                        {item.chong_chi_dinh && (
                          <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs flex gap-2">
                            <ShieldAlert size={18} className="shrink-0 mt-0.5" />
                            <div>
                              <p className="font-black uppercase tracking-wider text-rose-500">Chống chỉ định</p>
                              <p className="font-semibold mt-0.5">{item.chong_chi_dinh}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* VAS score show */}
                      {(item.vas_truoc !== null || item.vas_sau !== null) && (
                        <div className="inline-flex gap-4 p-3 bg-slate-50 border border-slate-200/60 rounded-xl text-xs">
                          <span>VAS Trước: <strong className="text-slate-700">{item.vas_truoc ?? 'N/A'}</strong></span>
                          <span>VAS Sau: <strong className="text-teal-600">{item.vas_sau ?? 'N/A'}</strong></span>
                        </div>
                      )}

                      {/* Ghi chú */}
                      {item.ghi_chu && (
                        <p className="text-xs text-slate-500 italic mt-2">Ghi chú: "{item.ghi_chu}"</p>
                      )}
                    </div>

                    {/* Integrated Invoice column */}
                    <div className="shrink-0 lg:w-72 bg-slate-50/50 border border-slate-100 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 flex items-center gap-1">
                            <CreditCard size={12} /> Hóa đơn: {item.ma_hoa_don || 'Chờ cấp'}
                          </p>
                          {getInvoiceStatusBadge(item.trang_thai_hoa_don)}
                        </div>
                        <div className="flex justify-between items-baseline pt-2">
                          <span className="text-xs text-slate-500 font-bold">Số tiền:</span>
                          <span className="text-lg font-black text-slate-800">{formatPrice(item.tong_tien_phai_tra)}</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs text-slate-500 font-bold">Đã trả:</span>
                          <span className="text-sm font-black text-teal-600">{formatPrice(item.so_tien_da_tra)}</span>
                        </div>
                        {item.tong_tien_phai_tra - item.so_tien_da_tra > 0 && (
                          <div className="flex justify-between items-baseline">
                            <span className="text-xs text-slate-500 font-bold">Còn lại:</span>
                            <span className="text-sm font-black text-rose-500">{formatPrice(item.tong_tien_phai_tra - item.so_tien_da_tra)}</span>
                          </div>
                        )}
                      </div>

                      {/* Rating details for single treatment */}
                      <div className="border-t border-slate-200/60 pt-3">
                        {item.danh_gia_sao ? (
                          <div className="bg-teal-50/20 border border-teal-100/50 rounded-xl p-3 text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="font-black uppercase text-teal-600 tracking-wider">Đã đánh giá:</span>
                              <div className="flex text-amber-400">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} size={10} fill={i < item.danh_gia_sao ? 'currentColor' : 'none'} />
                                ))}
                              </div>
                            </div>
                            {item.danh_gia_nhan_xet && (
                              <p className="italic text-slate-500 mt-1">"{item.danh_gia_nhan_xet}"</p>
                            )}
                          </div>
                        ) : (
                          <div>
                            {ratingSessionId === item.cuoc_hen_id ? (
                              <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-md space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-black text-slate-700">Đánh giá trị liệu</span>
                                  <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <button 
                                        key={star} 
                                        onClick={() => setRatingStars(star)}
                                        className="text-amber-400 transition-transform active:scale-125"
                                      >
                                        <Star size={star <= ratingStars ? 14 : 14} fill={star <= ratingStars ? 'currentColor' : 'none'} />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <textarea
                                  rows={1.5}
                                  placeholder="Nhận xét cảm nhận..."
                                  value={ratingComment}
                                  onChange={(e) => setRatingComment(e.target.value)}
                                  className="w-full text-xs p-2 border border-slate-200 rounded-xl resize-none"
                                />
                                <div className="flex justify-end gap-1.5">
                                  <button 
                                    onClick={() => setRatingSessionId(null)}
                                    className="px-2 py-1 text-[10px] font-bold text-slate-500 bg-slate-100 rounded-md"
                                  >
                                    Hủy
                                  </button>
                                  <button 
                                    onClick={() => handleSubmitRating(item.cuoc_hen_id)}
                                    className="px-2.5 py-1 text-[10px] font-black text-white bg-teal-600 rounded-md shadow-sm"
                                  >
                                    Gửi
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleOpenRating(item.cuoc_hen_id)}
                                className="w-full py-1.5 border border-slate-200 hover:border-teal-500 rounded-xl text-xs font-black text-slate-600 hover:text-teal-600 hover:bg-teal-50/20 flex items-center justify-center gap-1.5 transition-all duration-300"
                              >
                                <Star size={12} /> Đánh giá buổi trị liệu này
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 3: KHÁM LÂM SÀNG */}
        {activeTab === 'kham' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {lich_su_kham.length === 0 ? (
              <div className="col-span-full bg-white rounded-3xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center gap-4">
                <FileText size={48} className="text-slate-400" />
                <p className="text-slate-500 font-bold text-lg">Bạn chưa có lịch sử khám lâm sàng nào.</p>
                <p className="text-slate-400 text-sm max-w-sm">Mọi phiếu chẩn đoán lâm sàng đầu vào từ Bác sĩ trưởng phòng khám sẽ được số hóa ở đây.</p>
              </div>
            ) : (
              lich_su_kham.map((exam: any) => {
                const examDateStr = format(new Date(exam.ngay_kham), 'dd/MM/yyyy HH:mm', { locale: vi });
                
                return (
                  <div key={exam.cuoc_hen_id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:border-teal-300 transition-all duration-300 flex flex-col justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 rounded-md">Phiếu khám bệnh</span>
                        <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                          <Calendar size={14} /> {examDateStr}
                        </span>
                      </div>

                      <div className="border-b border-slate-100 pb-3 mt-2">
                        <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Chẩn đoán lâm sàng</p>
                        <p className="text-base font-black text-slate-800 mt-1">{exam.chan_doan || 'Khám tổng quát cơ xương khớp'}</p>
                      </div>

                      {exam.chong_chi_dinh && (
                        <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-xs flex gap-2">
                          <ShieldAlert size={18} className="shrink-0 mt-0.5" />
                          <div>
                            <p className="font-black uppercase tracking-wider text-rose-500">Chống chỉ định đặc biệt</p>
                            <p className="font-semibold mt-0.5">{exam.chong_chi_dinh}</p>
                          </div>
                        </div>
                      )}

                      {exam.ghi_chu && (
                        <div>
                          <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Khuyến nghị & Lượng giá</p>
                          <p className="text-xs text-slate-600 italic mt-0.5">"{exam.ghi_chu}"</p>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-500">
                      <span>Bác sĩ khám: <strong>{exam.ten_bac_si || 'Bác sĩ chuyên khoa'}</strong></span>
                      <span>Phòng: <strong>{exam.ten_phong || 'Phòng khám'}</strong></span>
                    </div>

                    {/* Integrated Invoice Details for Clinical Exam */}
                    {exam.hoa_don_id && (
                      <div className="mt-2 bg-slate-50 border border-slate-200/50 rounded-2xl p-4 flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-500 flex items-center gap-1">
                            <CreditCard size={12} /> Hóa đơn: {exam.ma_hoa_don || 'Chờ cấp'}
                          </p>
                          <p className="text-slate-500">Số tiền: <strong className="text-slate-800">{formatPrice(exam.tong_tien_phai_tra)}</strong></p>
                        </div>
                        <div>
                          {getInvoiceStatusBadge(exam.trang_thai_hoa_don)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

      </div>
    </div>
  );
}
