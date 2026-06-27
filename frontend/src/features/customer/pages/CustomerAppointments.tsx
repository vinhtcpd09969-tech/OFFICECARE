import { useState, useEffect } from 'react';
import { 
  Calendar, 
  AlertCircle, 
  XCircle, 
  RefreshCw,
  PlusCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../../../api/axios';

interface Appointment {
  id: string;
  ma_lich_dat: string;
  ngay_gio_bat_dau: string;
  ngay_gio_ket_thuc: string;
  trang_thai: string;
  loai_lich: string;
  ten_khach_hang: string;
  so_dien_thoai: string;
  ten_dich_vu: string | null;
  ten_ky_thuat_vien: string | null;
  ten_phong: string | null;
  chan_doan: string | null;
  chong_chi_dinh: string | null;
  ly_do_huy: string | null;
  thoi_gian_huy: string | null;
  ly_do_kham: string | null;
  thoi_gian_tao: string;
}

export default function CustomerAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [lyDoHuy, setLyDoHuy] = useState<string>('');

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const response = await api.get('/client/appointments');
      setAppointments(response.data);
    } catch (error) {
      console.error('Lỗi khi tải danh sách lịch hẹn:', error);
      toast.error('Không thể tải danh sách lịch hẹn của bạn.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingId || !lyDoHuy.trim()) {
      toast.error('Vui lòng cung cấp lý do hủy lịch hẹn!');
      return;
    }

    const toastId = toast.loading('Đang gửi yêu cầu hủy lịch hẹn...');
    try {
      await api.patch(`/client/appointments/${cancellingId}/cancel`, { ly_do_huy: lyDoHuy });
      toast.success('Đã gửi yêu cầu hủy lịch hẹn! Vui lòng chờ lễ tân liên hệ xác nhận.', { id: toastId });
      setCancellingId(null);
      setLyDoHuy('');
      fetchAppointments();
    } catch (error: any) {
      console.error('Lỗi khi hủy lịch hẹn:', error);
      toast.error(error.response?.data?.message || 'Không thể hủy lịch hẹn.', { id: toastId });
    }
  };

  const formatDateTime = (isoString: string) => {
    const d = new Date(isoString);
    const dateStr = d.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return { dateStr, timeStr };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'cho_xac_nhan':
      case 'chua_xac_nhan':
        return (
          <span className="text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Chờ Duyệt
          </span>
        );
      case 'da_xac_nhan':
        return (
          <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Đã Xác Nhận
          </span>
        );
      case 'cho_huy':
        return (
          <span className="text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
            Chờ Lễ Tân Hủy
          </span>
        );
      case 'da_huy':
        return (
          <span className="text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Đã Hủy Lịch
          </span>
        );
      case 'hoan_thanh':
        return (
          <span className="text-[10px] font-black text-zinc-500 bg-zinc-100 border border-zinc-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Đã Khám Xong
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-black text-gray-500 bg-gray-50 border border-gray-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            {status}
          </span>
        );
    }
  };

  const getStatusLineClass = (status: string) => {
    switch (status) {
      case 'cho_xac_nhan':
      case 'chua_xac_nhan':
        return 'bg-amber-400';
      case 'da_xac_nhan':
        return 'bg-emerald-500';
      case 'cho_huy':
        return 'bg-rose-500 animate-pulse';
      case 'da_huy':
        return 'bg-zinc-400';
      case 'hoan_thanh':
        return 'bg-slate-400';
      default:
        return 'bg-zinc-300';
    }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-secondary flex items-center gap-2.5">
            <Calendar className="text-primary" size={32} />
            Lịch hẹn của tôi
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Quản lý, đổi giờ hoặc hủy các cuộc hẹn khám lượng giá tại PhysioFlow.
          </p>
        </div>

        <button 
          onClick={() => navigate('/booking')}
          className="flex items-center gap-2 bg-primary hover:opacity-90 text-white font-bold text-xs uppercase tracking-wider py-3.5 px-6 rounded-xl transition-all shadow-xs"
        >
          <PlusCircle size={16} /> Đặt lịch khám mới
        </button>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="bg-white rounded-[24px] border border-gray-100 p-16 text-center space-y-4 shadow-sm flex flex-col items-center justify-center">
          <RefreshCw className="animate-spin text-primary size-10" />
          <p className="text-sm font-semibold text-gray-400">Đang đồng bộ danh sách lịch khám của bạn...</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-white rounded-[24px] border border-dashed border-gray-200 p-16 text-center space-y-6">
          <div className="size-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
            <AlertCircle size={32} />
          </div>
          <div className="max-w-sm mx-auto space-y-2">
            <h3 className="font-heading font-black text-lg text-secondary">Bạn chưa có lịch khám nào</h3>
            <p className="text-xs text-gray-400 leading-relaxed font-semibold">
              Đăng ký ngay một buổi lượng giá lâm sàng và lập phác đồ trị liệu 100% miễn phí cùng Bác sĩ Chuyên khoa.
            </p>
          </div>
          <button 
            onClick={() => navigate('/booking')}
            className="bg-primary hover:opacity-95 text-white font-bold text-xs uppercase tracking-wider py-3.5 px-6 rounded-xl shadow-xs transition-all active:scale-95"
          >
            Đăng ký Khám ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {appointments.map((app) => {
            const { dateStr, timeStr } = formatDateTime(app.ngay_gio_bat_dau);
            const statusLineClass = getStatusLineClass(app.trang_thai);

            return (
              <div 
                key={app.id}
                className="bg-white text-slate-700 border border-zinc-150 shadow-sm relative overflow-hidden flex flex-col justify-between hover:border-emerald-250 transition-all duration-300 rounded-[24px]"
              >
                {/* Left vertical status indicator strip */}
                <div className={`absolute left-0 top-0 bottom-0 w-[4px] ${statusLineClass}`}></div>

                {/* Ticket notches left and right */}
                <div className="absolute -left-2.5 top-[92px] w-5 h-5 bg-background rounded-full border-r border-zinc-150 z-10"></div>
                <div className="absolute -right-2.5 top-[92px] w-5 h-5 bg-background rounded-full border-l border-zinc-150 z-10"></div>

                {/* Ticket Header */}
                <div className="p-6 pl-8 pb-4 border-b border-dashed border-zinc-150">
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                      Mã: {app.ma_lich_dat}
                    </span>
                    {getStatusBadge(app.trang_thai)}
                  </div>
                  
                  <h3 className="font-heading font-black text-secondary text-base leading-tight uppercase tracking-wide">
                    {app.ten_dich_vu || 'Khám Lâm sàng & Lượng giá'}
                  </h3>
                  
                  <p className="text-[10px] font-semibold text-slate-400 mt-1">Lược đồ lượng giá lâm sàng & chẩn trị</p>
                </div>

                {/* Ticket Details */}
                <div className="p-6 pl-8 pt-5 space-y-4 flex-1">
                  
                  {/* Clean Datetime Panel */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 border border-slate-100 rounded-xl text-xs">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase block font-bold tracking-wider">Khung giờ</span>
                      <span className="text-slate-800 font-extrabold text-sm block mt-0.5">{timeStr}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase block font-bold tracking-wider">Ngày Khám</span>
                      <span className="text-slate-800 font-bold text-[11px] block mt-0.5">{dateStr}</span>
                    </div>
                  </div>

                  {/* Clinician and Room details if not cancelled */}
                  {app.trang_thai !== 'da_huy' && (
                    <div className="space-y-2 pt-1.5 text-xs text-slate-650">
                      <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                        <span className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Bác sĩ phụ trách:</span>
                        <span className={app.ten_ky_thuat_vien ? "text-slate-700 font-extrabold" : "text-amber-600 font-bold italic text-[11px]"}>
                          {app.ten_ky_thuat_vien || 'Đang phân công'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                        <span className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Phòng lâm sàng:</span>
                        <span className={app.ten_phong ? "text-slate-700 font-extrabold" : "text-amber-600 font-bold italic text-[11px]"}>
                          {app.ten_phong || 'Đang sắp xếp'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Dynamic Status Notices */}
                  {app.trang_thai === 'chua_xac_nhan' && (
                    <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl text-[11px] text-rose-700 font-extrabold leading-relaxed animate-pulse">
                      📧 VUI LÒNG KIỂM TRA EMAIL ĐỂ XÁC NHẬN LỊCH HẸN!
                    </div>
                  )}

                  {app.trang_thai === 'cho_xac_nhan' && (
                    <div className="bg-amber-50/50 border border-amber-200 p-3.5 rounded-xl text-[11px] text-amber-700 font-semibold leading-relaxed">
                      Lịch hẹn đang chờ phê duyệt. Bạn sẽ nhận được thông báo ngay tại đây khi lễ tân xác thực.
                    </div>
                  )}

                  {app.trang_thai === 'da_xac_nhan' && (
                    <div className="bg-emerald-50/50 border border-emerald-200 p-3.5 rounded-xl text-[11px] text-emerald-700 font-semibold leading-relaxed flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                      Lịch hẹn đã được xác nhận. Mời bạn đến phòng khám đúng giờ để thực hiện check-in.
                    </div>
                  )}

                  {app.trang_thai === 'cho_huy' && (
                    <div className="bg-rose-50/50 border border-rose-200 p-3.5 rounded-xl text-[11px] text-rose-700 font-semibold leading-relaxed space-y-1">
                      <p className="font-bold flex items-center gap-1.5 text-rose-600">
                        <AlertCircle size={14} className="animate-pulse" /> Đang chờ xác nhận hủy lịch
                      </p>
                      <p className="text-slate-500 italic">"Lý do: {app.ly_do_huy || 'Không có lý do chi tiết'}"</p>
                      <p className="text-[10px] text-slate-450 font-normal">Lễ tân sẽ liên hệ điện thoại để xác minh yêu cầu hủy này.</p>
                    </div>
                  )}

                  {app.trang_thai === 'da_huy' && (
                    <div className="bg-rose-50/20 border border-rose-100 p-3.5 rounded-xl text-[11px] text-slate-500 font-semibold leading-relaxed">
                      <p className="font-bold text-rose-600 flex items-center gap-1.5"><XCircle size={14} /> Đã hủy lịch hẹn</p>
                      <p className="text-slate-400 mt-1 italic text-[10px]">"Lý do: {app.ly_do_huy || 'Không có lý do chi tiết'}"</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="p-6 pl-8 pt-0 flex flex-col gap-2">
                  <button
                    onClick={() => navigate(`/booking/success/${app.id}`)}
                    className="w-full bg-primary hover:opacity-90 text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl transition-all text-center shadow-xs"
                  >
                    Xem Chi Tiết & Mã QR
                  </button>
                  {(app.trang_thai === 'cho_xac_nhan' || app.trang_thai === 'da_xac_nhan') && (
                    <button
                      onClick={() => setCancellingId(app.id)}
                      className="w-full bg-zinc-50 hover:bg-rose-50 hover:text-rose-600 border border-zinc-150 hover:border-rose-200 text-secondary font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition-all"
                    >
                      Hủy lịch hẹn
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* CANCEL APPOINTMENT CONFIRMATION MODAL */}
      {cancellingId && (
        <div className="fixed inset-0 bg-secondary/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-800 rounded-[32px] border border-zinc-150 max-w-md w-full p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            
            <form onSubmit={handleCancelSubmit} className="space-y-6">
              <div className="text-center space-y-3">
                <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-100">
                  <XCircle size={28} />
                </div>
                <h3 className="text-xl font-heading font-black text-slate-900 uppercase tracking-wide">Yêu cầu hủy lịch hẹn?</h3>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  Yêu cầu của bạn sẽ được gửi tới bộ phận lễ tân để liên hệ xác minh. Vui lòng cho biết lý do hủy lịch.
                </p>
              </div>

              <div className="space-y-1.5 text-left">
                <label htmlFor="lyDoHuyInput" className="text-[9px] font-mono font-bold text-slate-400 uppercase block tracking-wider">Lý do hủy lịch *</label>
                <textarea
                  id="lyDoHuyInput"
                  rows={3}
                  required
                  value={lyDoHuy}
                  onChange={(e) => setLyDoHuy(e.target.value)}
                  placeholder="Tôi có việc bận đột xuất..."
                  className="w-full bg-zinc-50 border border-zinc-200 focus:border-primary p-4 rounded-xl text-xs font-semibold resize-none outline-none text-slate-800 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="submit"
                  className="bg-rose-600 hover:opacity-90 text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl shadow-xs transition-all"
                >
                  Gửi yêu cầu hủy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCancellingId(null);
                    setLyDoHuy('');
                  }}
                  className="bg-zinc-50 hover:bg-zinc-100 text-slate-600 font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl border border-zinc-200 transition-all"
                >
                  Quay lại
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
