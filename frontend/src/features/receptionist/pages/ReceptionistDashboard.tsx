import { useState, useEffect } from 'react';
import axiosInstance from '../../../api/axios';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface Appointment {
  id: string;
  ma_lich_dat: string;
  ngay_gio_bat_dau: string;
  ngay_gio_ket_thuc: string;
  trang_thai: string;
  ten_khach_hang: string;
  sdt_khach_hang: string;
  ten_dich_vu: string;
  ten_ky_thuat_vien: string | null;
}

export default function ReceptionistDashboard() {
  const [stats, setStats] = useState({ checkin: 0, waiting: 0, total: 0 });
  const [kanbanData, setKanbanData] = useState<Record<string, Appointment[]>>({
    cho_xac_nhan: [],
    da_xac_nhan: [],
    da_checkin: [],
    hoan_thanh: []
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, kanbanRes] = await Promise.all([
        axiosInstance.get('/receptionist/stats'),
        axiosInstance.get('/receptionist/today-appointments')
      ]);
      setStats(statsRes.data);
      setKanbanData(kanbanRes.data);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu lễ tân:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Optional: Auto refresh every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await axiosInstance.patch(`/receptionist/appointments/${id}/status`, { trang_thai: newStatus });
      fetchData(); // Refresh data
    } catch (error) {
      alert('Cập nhật trạng thái thất bại');
      console.error(error);
    }
  };

  const KanbanColumn = ({ title, statusKey, items, colorClass }: { title: string, statusKey: string, items: Appointment[], colorClass: string }) => (
    <div className={`flex flex-col bg-slate-100/50 rounded-xl p-4 min-w-[300px] flex-1 border border-slate-200`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-700">{title} <span className="bg-white px-2 py-0.5 rounded-md text-sm text-slate-500 border border-slate-200 ml-2">{items?.length || 0}</span></h3>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto">
        {items?.map(apt => (
          <div key={apt.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing group">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-slate-500">{apt.ma_lich_dat}</span>
              <span className={`text-xs px-2 py-1 rounded-md font-medium ${colorClass}`}>
                {format(new Date(apt.ngay_gio_bat_dau), 'HH:mm')}
              </span>
            </div>
            <h4 className="font-bold text-slate-800 text-sm mb-1">{apt.ten_khach_hang}</h4>
            <p className="text-xs text-slate-500 mb-3">{apt.sdt_khach_hang}</p>
            <div className="text-xs text-slate-600 space-y-1 mb-3">
              <p className="flex items-center gap-1">🛠 {apt.ten_dich_vu}</p>
              <p className="flex items-center gap-1">👨‍⚕️ {apt.ten_ky_thuat_vien || 'Chưa xếp KTV'}</p>
            </div>
            
            {/* Quick Actions based on current status */}
            <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
              {statusKey === 'cho_xac_nhan' && (
                <button onClick={() => handleStatusChange(apt.id, 'da_xac_nhan')} className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-medium py-1.5 rounded-lg transition-colors">Xác nhận</button>
              )}
              {statusKey === 'da_xac_nhan' && (
                <button onClick={() => handleStatusChange(apt.id, 'da_checkin')} className="flex-1 bg-teal-50 text-teal-600 hover:bg-teal-100 text-xs font-medium py-1.5 rounded-lg transition-colors">Check-in ngay</button>
              )}
              {statusKey === 'da_checkin' && (
                <button onClick={() => handleStatusChange(apt.id, 'hoan_thanh')} className="flex-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-xs font-medium py-1.5 rounded-lg transition-colors">Đã xong</button>
              )}
              {statusKey === 'hoan_thanh' && (
                <button 
                  onClick={() => navigate(`/receptionist/billing?appointment=${apt.id}`)}
                  className="flex-1 bg-amber-50 text-amber-600 hover:bg-amber-100 text-xs font-medium py-1.5 rounded-lg transition-colors"
                >
                  Thanh toán
                </button>
              )}
            </div>
          </div>
        ))}
        {(!items || items.length === 0) && (
          <div className="text-center p-6 text-sm text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
            Trống
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Lịch làm việc hôm nay</h2>
          <p className="text-slate-500 mt-1">{format(new Date(), 'EEEE, dd MMMM yyyy', { locale: vi })}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Tổng lịch hôm nay</p>
            <h3 className="text-3xl font-bold text-slate-800">{stats.total}</h3>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center text-xl">📅</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Đã Check-in</p>
            <h3 className="text-3xl font-bold text-teal-600">{stats.checkin}</h3>
          </div>
          <div className="w-12 h-12 bg-teal-50 text-teal-500 rounded-full flex items-center justify-center text-xl">✅</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Đang chờ phục vụ</p>
            <h3 className="text-3xl font-bold text-amber-500">{stats.waiting}</h3>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center text-xl">⏳</div>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <div className="flex-1 flex gap-6 overflow-x-auto pb-4 items-stretch">
          <KanbanColumn title="Chờ xác nhận" statusKey="cho_xac_nhan" items={kanbanData.cho_xac_nhan} colorClass="bg-yellow-100 text-yellow-700" />
          <KanbanColumn title="Đã xác nhận" statusKey="da_xac_nhan" items={kanbanData.da_xac_nhan} colorClass="bg-blue-100 text-blue-700" />
          <KanbanColumn title="Đã Check-in (Đang làm)" statusKey="da_checkin" items={kanbanData.da_checkin} colorClass="bg-teal-100 text-teal-700" />
          <KanbanColumn title="Hoàn thành (Chờ TT)" statusKey="hoan_thanh" items={kanbanData.hoan_thanh} colorClass="bg-emerald-100 text-emerald-700" />
        </div>
      )}
    </div>
  );
}
