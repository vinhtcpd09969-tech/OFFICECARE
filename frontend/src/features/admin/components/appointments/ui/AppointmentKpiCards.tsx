import { motion } from 'framer-motion';
import { Calendar, AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react';

interface KpiData {
  total: number;
  waiting: number;
  completed: number;
  secondary: number;
}

interface AppointmentKpiCardsProps {
  role: 'admin' | 'receptionist' | 'doctor' | 'technician';
  kpis: KpiData;
  viewMode: 'timeline' | 'capacity';
  timeRange: 'today' | '7days' | 'month' | 'custom';
  activeType: 'kham' | 'dieu_tri';
}

export function AppointmentKpiCards({
  role,
  kpis,
  viewMode,
  timeRange,
  activeType
}: AppointmentKpiCardsProps) {
  const { total, waiting, completed, secondary } = kpis;

  // Calculate percentages for circular rings
  const getPercentage = (value: number, base: number) => {
    if (base <= 0) return 0;
    return Math.min(Math.round((value / base) * 100), 100);
  };

  const completedPct = getPercentage(completed, total);
  const waitingPct = getPercentage(waiting, total);
  const secondaryPct = getPercentage(secondary, total);

  // SVG Circular Ring Configuration
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

  // Build stats config based on role
  let stats: any[] = [];

  if (role === 'admin') {
    stats = [
      {
        title: isKham ? "Tổng ca khám" : "Tổng ca điều trị",
        value: total,
        subtext: isKham ? `Tổng ca khám ${rangeLabel}` : `Tổng ca điều trị ${rangeLabel}`,
        subtextColor: "text-[#0D9488]",
        pct: 100,
        color: "from-[#0D9488] to-[#14B8A6]",
        trackColor: "stroke-teal-500/10",
        ringColor: "stroke-[#0D9488]",
        icon: <Calendar className="text-[#0D9488]" size={18} />
      },
      {
        title: "Chưa xác nhận",
        value: waiting,
        subtext: "Chờ xác thực OTP hoặc duyệt",
        subtextColor: "text-amber-500",
        pct: waitingPct,
        color: "from-[#F59E0B] to-[#FBBF24]",
        trackColor: "stroke-amber-500/10",
        ringColor: "stroke-[#F59E0B]",
        icon: <AlertCircle className="text-[#F59E0B]" size={18} />
      },
      {
        title: "Đã hoàn thành",
        value: completed,
        subtext: isKham ? "Khám xong" : "Trị liệu xong",
        subtextColor: "text-emerald-500",
        pct: completedPct,
        color: "from-[#22C55E] to-[#4ADE80]",
        trackColor: "stroke-emerald-500/10",
        ringColor: "stroke-[#22C55E]",
        icon: <CheckCircle2 className="text-[#22C55E]" size={18} />
      },
      {
        title: "Hủy / Vắng mặt",
        value: secondary,
        subtext: "Ca đã hủy hoặc không đến",
        subtextColor: "text-rose-500",
        pct: secondaryPct,
        color: "from-[#EF4444] to-[#F87171]",
        trackColor: "stroke-rose-500/10",
        ringColor: "stroke-[#EF4444]",
        icon: <HelpCircle className="text-[#EF4444]" size={18} />
      }
    ];
  } else if (role === 'receptionist') {
    stats = [
      {
        title: isKham ? "Tổng ca khám" : "Tổng ca điều trị",
        value: total,
        subtext: `Tổng ca đặt lịch ${rangeLabel}`,
        subtextColor: "text-[#0D9488]",
        pct: 100,
        color: "from-[#0D9488] to-[#14B8A6]",
        trackColor: "stroke-teal-500/10",
        ringColor: "stroke-[#0D9488]",
        icon: <Calendar className="text-[#0D9488]" size={18} />
      },
      {
        title: "Chưa xác nhận",
        value: waiting,
        subtext: "Chờ liên hệ hoặc duyệt OTP",
        subtextColor: "text-amber-500",
        pct: waitingPct,
        color: "from-[#F59E0B] to-[#FBBF24]",
        trackColor: "stroke-amber-500/10",
        ringColor: "stroke-[#F59E0B]",
        icon: <AlertCircle className="text-[#F59E0B]" size={18} />
      },
      {
        title: "Chờ thanh toán",
        value: completed,
        subtext: "Ca hoàn thành chờ thu tiền",
        subtextColor: "text-blue-500",
        pct: completedPct,
        color: "from-[#3B82F6] to-[#60A5FA]",
        trackColor: "stroke-blue-500/10",
        ringColor: "stroke-[#3B82F6]",
        icon: <CheckCircle2 className="text-[#3B82F6]" size={18} />
      },
      {
        title: "Hủy / Không đến",
        value: secondary,
        subtext: "Ca bị hủy hoặc vắng mặt",
        subtextColor: "text-rose-500",
        pct: secondaryPct,
        color: "from-[#EF4444] to-[#F87171]",
        trackColor: "stroke-rose-500/10",
        ringColor: "stroke-[#EF4444]",
        icon: <HelpCircle className="text-[#EF4444]" size={18} />
      }
    ];
  } else {
    // doctor / technician
    stats = [
      {
        title: isKham ? "Tổng ca khám phụ trách" : "Tổng ca điều trị phụ trách",
        value: total,
        subtext: `Tổng ca được giao ${rangeLabel}`,
        subtextColor: "text-[#0D9488]",
        pct: 100,
        color: "from-[#0D9488] to-[#14B8A6]",
        trackColor: "stroke-teal-500/10",
        ringColor: "stroke-[#0D9488]",
        icon: <Calendar className="text-[#0D9488]" size={18} />
      },
      {
        title: "Chờ thực hiện",
        value: waiting,
        subtext: "Khách đã check-in / Đang chờ",
        subtextColor: "text-amber-500",
        pct: waitingPct,
        color: "from-[#F59E0B] to-[#FBBF24]",
        trackColor: "stroke-amber-500/10",
        ringColor: "stroke-[#F59E0B]",
        icon: <AlertCircle className="text-[#F59E0B]" size={18} />
      },
      {
        title: "Đang thực hiện",
        value: completed,
        subtext: "Đang trong phòng trị liệu",
        subtextColor: "text-emerald-500",
        pct: completedPct,
        color: "from-[#22C55E] to-[#4ADE80]",
        trackColor: "stroke-emerald-500/10",
        ringColor: "stroke-[#22C55E]",
        icon: <CheckCircle2 className="text-[#22C55E]" size={18} />
      },
      {
        title: "Ca trễ hẹn / Quá giờ",
        value: secondary,
        subtext: "Quá giờ bắt đầu nhưng chưa xong",
        subtextColor: "text-rose-500",
        pct: secondaryPct,
        color: "from-[#EF4444] to-[#F87171]",
        trackColor: "stroke-rose-500/10",
        ringColor: "stroke-[#EF4444]",
        icon: <HelpCircle className="text-[#EF4444]" size={18} />
      }
    ];
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {stats.map((stat, idx) => {
        const offset = circumference - (stat.pct / 100) * circumference;

        return (
          <motion.div
            key={idx}
            custom={idx}
            initial="initial"
            animate="animate"
            variants={cardVariants}
            whileHover={{ y: -5, scale: 1.015 }}
            className="p-[1px] bg-gradient-to-br from-slate-200/60 dark:from-zinc-800 to-transparent hover:from-[#14B8A6]/30 dark:hover:from-[#14B8A6]/20 rounded-[24px] shadow-[0_4px_20px_-4px_rgba(15,23,42,0.02)] hover:shadow-[0_20px_35px_-8px_rgba(15,23,42,0.06)] transition-all duration-300"
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
                  {stat.pct}% đạt
                </span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
