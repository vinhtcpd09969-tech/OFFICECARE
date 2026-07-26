import { useState, useEffect, useMemo } from 'react';
import { Clock, Calendar, AlertCircle, Sparkles, CheckCircle2, Moon, CalendarDays, UserCheck } from 'lucide-react';
import { getDoctorSchedules, DoctorSchedule } from '../../api/doctor.api';

export default function DoctorSchedules() {
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'hoat_dong' | 'tam_nghi'>('all');

  useEffect(() => {
    async function loadSchedules() {
      setLoading(true);
      try {
        const res = await getDoctorSchedules();
        setSchedules(res.data || []);
      } catch (error) {
        console.error('Lỗi khi tải lịch trực:', error);
      } finally {
        setLoading(false);
      }
    }
    loadSchedules();
  }, []);

  // Chuyển chuỗi ngày sang Thứ tiếng Việt
  const getDayOfWeek = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const day = date.getDay();
      switch (day) {
        case 0: return 'Chủ Nhật';
        case 1: return 'Thứ Hai';
        case 2: return 'Thứ Ba';
        case 3: return 'Thứ Tư';
        case 4: return 'Thứ Năm';
        case 5: return 'Thứ Sáu';
        case 6: return 'Thứ Bảy';
        default: return '';
      }
    } catch {
      return '';
    }
  };

  // Định dạng ngày hiển thị dd/mm/yyyy
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Kiểm tra ca trực có phải hôm nay không
  const isToday = (dateStr: string) => {
    const todayStr = new Date().toLocaleDateString('fr-CA'); // YYYY-MM-DD
    return dateStr.substring(0, 10) === todayStr;
  };

  // Lọc lịch làm việc
  const filteredSchedules = useMemo(() => {
    return schedules
      .filter(s => {
        if (filter === 'all') return true;
        return s.trang_thai === filter;
      })
      .sort((a, b) => new Date(a.ngay).getTime() - new Date(b.ngay).getTime());
  }, [schedules, filter]);

  // Thống kê ca trực
  const kpis = useMemo(() => {
    const total = schedules.length;
    const active = schedules.filter(s => s.trang_thai === 'hoat_dong').length;
    const todayShift = schedules.find(s => isToday(s.ngay) && s.trang_thai === 'hoat_dong');
    return { total, active, todayShift };
  }, [schedules]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto pb-10">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 dark:from-zinc-900 dark:via-teal-950/60 dark:to-zinc-900 rounded-[32px] p-6 md:p-8 text-white shadow-xl border border-teal-800/30">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/15 border border-teal-400/30 text-teal-300 text-[10px] font-black uppercase tracking-widest">
              <CalendarDays size={12} className="text-teal-400" />
              Thời gian biểu cá nhân
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <Calendar className="text-teal-400" size={28} />
              Lịch Trực Cá Nhân
            </h1>
            <p className="text-xs text-teal-100/80 font-medium max-w-xl leading-relaxed">
              Theo dõi phân công ca làm việc, lịch nghỉ và quản lý thời gian biểu cá nhân hàng tuần.
            </p>
          </div>

          {/* Quick KPI stats */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3.5 shrink-0">
            <div className="text-center px-3">
              <p className="text-[9px] font-black uppercase tracking-wider text-teal-200/80">Tổng Ca Xếp</p>
              <p className="text-xl font-black text-white mt-0.5">{kpis.total}</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center px-3">
              <p className="text-[9px] font-black uppercase tracking-wider text-emerald-300">Ca Làm Việc</p>
              <p className="text-xl font-black text-emerald-400 mt-0.5">{kpis.active}</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Highlight Card for Today */}
      {kpis.todayShift ? (
        <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-emerald-500/10 border-2 border-emerald-500/30 dark:border-emerald-500/20 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold shadow-md shrink-0">
              <Sparkles size={22} className="animate-pulse" />
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500 text-white shadow-xs">
                Hôm Nay Có Lịch Trực
              </span>
              <h3 className="text-sm font-black text-slate-800 dark:text-zinc-100 mt-1">
                {getDayOfWeek(kpis.todayShift.ngay)}, {formatDate(kpis.todayShift.ngay)}
              </h3>
              <p className="text-xs font-bold text-slate-600 dark:text-zinc-300 mt-0.5 flex items-center gap-1.5">
                <Clock size={13} className="text-emerald-600" />
                Khung giờ trực: <span className="text-emerald-700 dark:text-emerald-400 font-extrabold">{kpis.todayShift.gio_bat_dau.substring(0, 5)} - {kpis.todayShift.gio_ket_thuc.substring(0, 5)}</span>
              </p>
            </div>
          </div>
          <div className="shrink-0">
            <span className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-sm">
              <UserCheck size={15} /> Sẵn sàng trực
            </span>
          </div>
        </div>
      ) : null}

      {/* Filter Tabs Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-150/60 dark:border-zinc-800 shadow-xs">
        <div className="flex items-center gap-2">
          <CalendarDays size={18} className="text-primary" />
          <span className="text-xs font-black text-slate-800 dark:text-zinc-100 uppercase tracking-wider">
            Danh sách phân ca ({filteredSchedules.length})
          </span>
        </div>

        {/* Filter Segment Navigation */}
        <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-2xl">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-white dark:bg-zinc-900 text-primary shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            Tất cả ({schedules.length})
          </button>
          <button
            onClick={() => setFilter('hoat_dong')}
            className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              filter === 'hoat_dong'
                ? 'bg-white dark:bg-zinc-900 text-emerald-600 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            Ca làm việc ({schedules.filter(s => s.trang_thai === 'hoat_dong').length})
          </button>
          <button
            onClick={() => setFilter('tam_nghi')}
            className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              filter === 'tam_nghi'
                ? 'bg-white dark:bg-zinc-900 text-rose-500 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            Lịch nghỉ ({schedules.filter(s => s.trang_thai === 'tam_nghi').length})
          </button>
        </div>
      </div>

      {/* Schedules Grid List */}
      {loading ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-150/60 dark:border-zinc-800 rounded-3xl p-24 text-center text-zinc-400 flex flex-col items-center justify-center gap-3">
          <div className="size-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold uppercase tracking-wider">Đang tải lịch trực cá nhân...</p>
        </div>
      ) : filteredSchedules.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-150/60 dark:border-zinc-800 rounded-3xl p-16 text-center text-zinc-400 flex flex-col items-center justify-center gap-3 shadow-xs">
          <AlertCircle size={36} className="text-zinc-300" />
          <p className="text-xs font-bold text-slate-500">Không tìm thấy ca làm việc nào phù hợp với bộ lọc</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSchedules.map((schedule) => {
            const current = isToday(schedule.ngay);
            const active = schedule.trang_thai === 'hoat_dong';
            
            return (
              <div 
                key={schedule.id} 
                className={`bg-white dark:bg-zinc-900 p-5 rounded-3xl border transition-all hover:shadow-md relative overflow-hidden flex items-center justify-between ${
                  current 
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm' 
                    : 'border-zinc-150/60 dark:border-zinc-800'
                }`}
              >
                {/* Special indicator for today's duty */}
                {current && (
                  <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[8px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl flex items-center gap-1 shadow-xs">
                    <Sparkles size={10} fill="currentColor" />
                    Hôm nay
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <div className={`size-13 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                    active 
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50' 
                      : 'bg-rose-50 dark:bg-rose-955/20 text-rose-500 border border-rose-200/50'
                  }`}>
                    <Calendar size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-black text-slate-800 dark:text-zinc-100 uppercase tracking-wide">
                        {getDayOfWeek(schedule.ngay)}
                      </h4>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono font-bold">
                        {formatDate(schedule.ngay)}
                      </span>
                    </div>

                    <p className="text-[10.5px] font-extrabold text-slate-500 dark:text-zinc-400 mt-1.5 flex items-center gap-1.5">
                      <Clock size={13} className="text-teal-600" />
                      Ca trực: <span className="text-slate-800 dark:text-zinc-200 font-black">{schedule.gio_bat_dau.substring(0, 5)} - {schedule.gio_ket_thuc.substring(0, 5)}</span>
                    </p>
                  </div>
                </div>

                <div className="shrink-0 pl-4">
                  {active ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-955/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900/40">
                      <CheckCircle2 size={12} />
                      Làm việc
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 dark:bg-rose-955/20 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/40">
                      <Moon size={12} />
                      Tạm nghỉ
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
