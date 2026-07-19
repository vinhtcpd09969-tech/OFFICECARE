import { motion } from 'framer-motion';
import { Calendar, AlertCircle, CalendarCheck, MapPin, Stethoscope, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { AppointmentKpiBuckets } from '../../../../../utils/appointmentKpi';

type FilterableBucketKey = Exclude<keyof AppointmentKpiBuckets, 'total'>;

interface AppointmentKpiCardsProps {
  role: 'admin' | 'receptionist' | 'doctor' | 'technician';
  kpis: AppointmentKpiBuckets;
  viewMode: 'timeline' | 'capacity';
  timeRange: 'today' | '7days' | 'month' | 'custom';
  activeType: 'kham' | 'dieu_tri';
  /** Bucket đang được chọn để lọc danh sách bên dưới — thẻ "Tổng ca" không nằm trong tập này vì
   * không dùng để lọc. */
  activeStatusFilter?: FilterableBucketKey | null;
  /** Bấm 1 thẻ (trừ Tổng ca) để lọc theo đúng trạng thái đó; bấm lại thẻ đang chọn để bỏ lọc.
   * Bỏ qua prop này (undefined) thì thẻ chỉ hiển thị, không bấm được — giữ tương thích ngược. */
  onSelectStatus?: (key: FilterableBucketKey | null) => void;
}

interface KpiCardDef {
  key: 'total' | FilterableBucketKey;
  title: string;
  value: number;
  subtext: string;
  subtextColor: string;
  pct: number;
  pctSuffix?: string;
  color: string;
  trackColor: string;
  ringColor: string;
  accentHex: string;
  icon: React.ReactNode;
}

export function AppointmentKpiCards({
  role,
  kpis,
  viewMode,
  timeRange,
  activeType,
  activeStatusFilter = null,
  onSelectStatus
}: AppointmentKpiCardsProps) {
  const { total, choXacNhan, daXacNhan, daCheckin, dangKham, hoanThanh, daHuy, khongDen } = kpis;

  // Calculate percentages for circular rings
  const getPercentage = (value: number, base: number) => {
    if (base <= 0) return 0;
    return Math.min(Math.round((value / base) * 100), 100);
  };

  const radius = 16;
  const circumference = 2 * Math.PI * radius;

  const cardVariants = {
    initial: { opacity: 0, y: 15 },
    animate: (idx: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 260,
        damping: 20,
        delay: idx * 0.08
      }
    })
  };

  // Determine active dynamic subtitle label based on view mode and time range selection
  const rangeLabel =
    viewMode === 'timeline'
      ? 'ngày này'
      : timeRange === 'month'
        ? 'tháng này'
        : 'tuần này';

  const isKham = activeType === 'kham';
  const isStaff = role === 'doctor' || role === 'technician';

  // Định nghĩa đủ 8 thẻ theo đúng 8 nhóm trạng thái dùng chung (utils/appointmentKpi.ts) — mỗi
  // actor chỉ chọn hiển thị 1 tập con (xem `stats` bên dưới), giữ nguyên màu/icon khớp với
  // appointmentStatusConfig.ts để nhất quán với badge trạng thái ở mọi nơi khác trong app.
  const allCards: Record<'total' | FilterableBucketKey, KpiCardDef> = {
    total: {
      key: 'total',
      title: isStaff
        ? (isKham ? 'Tổng ca khám phụ trách' : 'Tổng ca điều trị phụ trách')
        : (isKham ? 'Tổng ca khám' : 'Tổng ca điều trị'),
      value: total,
      subtext: isStaff ? `Tổng ca được giao ${rangeLabel}` : (isKham ? `Tổng ca khám ${rangeLabel}` : `Tổng ca điều trị ${rangeLabel}`),
      subtextColor: 'text-[#0D9488]',
      pct: 100,
      color: 'from-[#0D9488] to-[#14B8A6]',
      trackColor: 'stroke-teal-500/10',
      ringColor: 'stroke-[#0D9488]',
      accentHex: '#0D9488',
      icon: <Calendar className="text-[#0D9488]" size={18} />
    },
    choXacNhan: {
      key: 'choXacNhan',
      title: 'Chờ xác nhận',
      value: choXacNhan,
      subtext: 'Thiếu 1 trong 2: nhân sự hoặc xác nhận',
      subtextColor: 'text-amber-500',
      pct: getPercentage(choXacNhan, total),
      color: 'from-[#F59E0B] to-[#FBBF24]',
      trackColor: 'stroke-amber-500/10',
      ringColor: 'stroke-[#F59E0B]',
      accentHex: '#F59E0B',
      icon: <AlertCircle className="text-[#F59E0B]" size={18} />
    },
    daXacNhan: {
      key: 'daXacNhan',
      title: 'Đã xác nhận',
      value: daXacNhan,
      subtext: 'Đã gán nhân sự và xác nhận',
      subtextColor: 'text-blue-500',
      pct: getPercentage(daXacNhan, total),
      color: 'from-[#3B82F6] to-[#60A5FA]',
      trackColor: 'stroke-blue-500/10',
      ringColor: 'stroke-[#3B82F6]',
      accentHex: '#3B82F6',
      icon: <CalendarCheck className="text-[#3B82F6]" size={18} />
    },
    daCheckin: {
      key: 'daCheckin',
      title: 'Đã check-in',
      value: daCheckin,
      subtext: 'Đã đến, chờ gọi vào phòng',
      subtextColor: 'text-teal-600',
      pct: getPercentage(daCheckin, total),
      color: 'from-[#0F766E] to-[#2DD4BF]',
      trackColor: 'stroke-teal-600/10',
      ringColor: 'stroke-[#0F766E]',
      accentHex: '#0F766E',
      icon: <MapPin className="text-[#0F766E]" size={18} />
    },
    dangKham: {
      key: 'dangKham',
      title: isKham ? 'Đang khám' : 'Đang điều trị',
      value: dangKham,
      subtext: isKham ? 'Đang trong phòng khám' : 'Đang trong phòng trị liệu',
      subtextColor: 'text-emerald-500',
      pct: getPercentage(dangKham, total),
      color: 'from-[#10B981] to-[#34D399]',
      trackColor: 'stroke-emerald-500/10',
      ringColor: 'stroke-[#10B981]',
      accentHex: '#10B981',
      icon: <Stethoscope className="text-[#10B981]" size={18} />
    },
    hoanThanh: {
      key: 'hoanThanh',
      title: 'Hoàn thành',
      value: hoanThanh,
      subtext: isKham ? 'Khám xong' : 'Trị liệu xong',
      subtextColor: 'text-emerald-600',
      pct: getPercentage(hoanThanh, total),
      color: 'from-[#22C55E] to-[#4ADE80]',
      trackColor: 'stroke-emerald-500/10',
      ringColor: 'stroke-[#22C55E]',
      accentHex: '#22C55E',
      icon: <CheckCircle2 className="text-[#22C55E]" size={18} />
    },
    daHuy: {
      key: 'daHuy',
      title: 'Đã hủy',
      value: daHuy,
      subtext: 'Ca đã hủy',
      subtextColor: 'text-rose-500',
      pct: getPercentage(daHuy, total),
      pctSuffix: 'tổng số',
      color: 'from-[#EF4444] to-[#F87171]',
      trackColor: 'stroke-rose-500/10',
      ringColor: 'stroke-[#EF4444]',
      accentHex: '#EF4444',
      icon: <XCircle className="text-[#EF4444]" size={18} />
    },
    khongDen: {
      key: 'khongDen',
      title: 'Không đến',
      value: khongDen,
      subtext: 'Khách không đến',
      subtextColor: 'text-slate-500',
      pct: getPercentage(khongDen, total),
      pctSuffix: 'tổng số',
      color: 'from-[#94A3B8] to-[#CBD5E1]',
      trackColor: 'stroke-slate-500/10',
      ringColor: 'stroke-[#94A3B8]',
      accentHex: '#94A3B8',
      icon: <AlertTriangle className="text-[#94A3B8]" size={18} />
    }
  };

  // Admin/Lễ tân thấy đủ 8 nhóm. Bác sĩ/KTV chỉ thấy phần thuộc trách nhiệm cá nhân: không có
  // "Chờ xác nhận" (nếu chưa gán nhân sự thì chưa thuộc về họ) và không có "Đã hủy" (hủy giải
  // phóng nhân sự/phòng nên ca đó không còn thuộc về họ nữa — xem appointment.repository.ts).
  const cardKeys: Array<'total' | FilterableBucketKey> = isStaff
    ? ['total', 'daXacNhan', 'daCheckin', 'dangKham', 'hoanThanh', 'khongDen']
    : ['total', 'choXacNhan', 'daXacNhan', 'daCheckin', 'dangKham', 'hoanThanh', 'daHuy', 'khongDen'];

  const stats = cardKeys.map((key) => allCards[key]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {stats.map((stat, idx) => {
        const offset = circumference - (stat.pct / 100) * circumference;
        const isClickable = !!onSelectStatus && stat.key !== 'total';
        const isSelected = isClickable && stat.key === activeStatusFilter;
        const isDimmed = isClickable && !!activeStatusFilter && !isSelected;

        return (
          <motion.div
            key={idx}
            custom={idx}
            initial="initial"
            animate="animate"
            variants={cardVariants}
            whileHover={{ y: -5, scale: 1.015 }}
            onClick={isClickable ? () => onSelectStatus!(isSelected ? null : (stat.key as FilterableBucketKey)) : undefined}
            role={isClickable ? 'button' : undefined}
            tabIndex={isClickable ? 0 : undefined}
            onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectStatus!(isSelected ? null : (stat.key as FilterableBucketKey)); } } : undefined}
            style={isSelected ? { boxShadow: `0 0 0 2px white, 0 0 0 4px ${stat.accentHex}` } : undefined}
            className={`p-[1px] bg-gradient-to-br from-slate-200/60 dark:from-zinc-800 to-transparent hover:from-[#14B8A6]/30 dark:hover:from-[#14B8A6]/20 rounded-[24px] shadow-[0_4px_20px_-4px_rgba(15,23,42,0.02)] hover:shadow-[0_20px_35px_-8px_rgba(15,23,42,0.06)] transition-all duration-300 ${isClickable ? 'cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/50' : ''} ${isDimmed ? 'opacity-50' : ''}`}
          >
            <div className="bg-white dark:bg-zinc-900 rounded-[23px] p-5 h-full flex flex-col justify-between relative overflow-hidden group">
              {/* Subtle background glow */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#14B8A6]/2 rounded-full blur-2xl group-hover:bg-[#14B8A6]/5 transition-all duration-300 pointer-events-none" />

              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-slate-400 dark:text-zinc-500 text-[10px] font-black uppercase tracking-wider block">
                    {stat.title}
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl xl:text-4xl font-jakarta font-black text-slate-800 dark:text-zinc-100">
                      {stat.value}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold">ca</span>
                  </div>
                </div>

                {/* Circular Progress Ring */}
                <div className="relative size-10 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    {/* Background circle */}
                    <circle
                      cx="20"
                      cy="20"
                      r={radius}
                      className={stat.trackColor}
                      strokeWidth="3"
                      fill="transparent"
                    />
                    {/* Glowing progress stroke */}
                    <circle
                      cx="20"
                      cy="20"
                      r={radius}
                      className={stat.ringColor}
                      strokeWidth="3"
                      fill="transparent"
                      strokeDasharray={circumference}
                      strokeDashoffset={offset}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
                    />
                  </svg>
                  {/* Center Icon */}
                  <div className="absolute inset-0 flex items-center justify-center size-5 m-auto">
                    {stat.icon}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-50 dark:border-zinc-800/80 flex items-center justify-between">
                <span className={`text-[10px] font-black ${stat.subtextColor}`}>
                  {stat.subtext}
                </span>
                <span className="text-[9px] font-mono text-slate-400 dark:text-zinc-500 bg-slate-50 dark:bg-zinc-800/60 px-2 py-0.5 rounded border border-slate-100 dark:border-zinc-800/50">
                  {stat.pct}% {stat.pctSuffix ?? 'đạt'}
                </span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
