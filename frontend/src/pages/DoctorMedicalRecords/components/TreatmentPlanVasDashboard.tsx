import React, { useState } from 'react';
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  AlertTriangle,
  Flame,
  Zap,
  Activity,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  X,
} from 'lucide-react';
import { TreatmentPlan } from '../../../features/doctor/api/doctor.api';

// Wong-Baker Faces helper
export const WONG_BAKER_FACES = [
  { score: 0, face: '😊', label: 'Không đau' },
  { score: 2, face: '🙂', label: 'Đau nhẹ' },
  { score: 4, face: '😐', label: 'Đau vừa' },
  { score: 6, face: '🙁', label: 'Đau nhiều' },
  { score: 8, face: '😣', label: 'Rất đau' },
  { score: 10, face: '😭', label: 'Đau dữ dội' },
];

export function getFaceForVas(score: number | null | undefined) {
  if (score === null || score === undefined) return { face: '—', label: 'Chưa đo' };
  const found = WONG_BAKER_FACES.find((f) => f.score >= score);
  return found || WONG_BAKER_FACES[WONG_BAKER_FACES.length - 1];
}

interface TreatmentPlanVasDashboardProps {
  plan: TreatmentPlan;
}

export const TreatmentPlanVasDashboard: React.FC<TreatmentPlanVasDashboardProps> = ({ plan }) => {
  const [filterRange, setFilterRange] = useState<'all' | '3' | '6'>('all');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Xử lý danh sách các buổi điều trị (bao gồm cả 'hoan_thanh' và 'khong_den')
  const isTungBuoi = plan.hinh_thuc_thanh_toan_goi === 'tung_buoi';
  const rawSessions = (plan.sessions || []).filter(
    (s) => s.trang_thai === 'hoan_thanh' || s.trang_thai === 'khong_den'
  );

  // Logic nghiệp vụ:
  // - Gói từng buổi (tung_buoi): Nếu buổi N từng 'khong_den' nhưng sau đó đặt lại và 'hoan_thanh',
  //   chỉ hiển thị buổi N 'hoan_thanh' (ghi đè lên buổi không đến trước đó).
  // - Gói trả thẳng 100% (tra_thang): Buổi không đến bị tính mất lượt, giữ nguyên cả 2 nếu có số thứ tự khác nhau.
  const sessionMap = new Map<number, any>();
  for (const s of rawSessions) {
    const buoiNum = s.so_thu_tu_buoi;
    if (!sessionMap.has(buoiNum)) {
      sessionMap.set(buoiNum, s);
    } else {
      const existing = sessionMap.get(buoiNum);
      if (isTungBuoi) {
        if (existing.trang_thai !== 'hoan_thanh' && s.trang_thai === 'hoan_thanh') {
          sessionMap.set(buoiNum, s);
        }
      } else {
        if (existing.trang_thai !== 'hoan_thanh' && s.trang_thai === 'hoan_thanh') {
          sessionMap.set(buoiNum, s);
        }
      }
    }
  }

  const allTreatmentSessions = Array.from(sessionMap.values()).sort(
    (a, b) => a.so_thu_tu_buoi - b.so_thu_tu_buoi
  );

  const completedSessions = allTreatmentSessions.filter((s) => s.trang_thai === 'hoan_thanh');

  // Mặc định KHÔNG mở chi tiết buổi (null). Khi click vào buổi mới mở.
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const selectedSession = selectedSessionId
    ? allTreatmentSessions.find((s) => s.id === selectedSessionId) || null
    : null;

  // Tính toán KPI thuần trên các buổi ĐÃ HOÀN THÀNH có dữ liệu lâm sàng
  const completedCount = completedSessions.length;
  const firstSession = completedSessions[0];
  const latestSession = completedSessions[completedCount - 1];

  const currentVas = latestSession?.danh_gia_sau_buoi ?? latestSession?.danh_gia_truoc_buoi ?? null;
  const currentFace = getFaceForVas(currentVas);

  // Mức giảm trung bình mỗi buổi
  const totalPerSessionDelta = completedSessions.reduce((acc, s) => {
    const pre = s.danh_gia_truoc_buoi ?? 0;
    const post = s.danh_gia_sau_buoi ?? pre;
    return acc + Math.max(0, pre - post);
  }, 0);
  const avgDelta = completedCount > 0 ? totalPerSessionDelta / completedCount : 0;

  // Mức giảm tổng cộng từ buổi đầu đến buổi gần nhất
  const firstPre = firstSession?.danh_gia_truoc_buoi ?? 0;
  const latestPost = latestSession?.danh_gia_sau_buoi ?? latestSession?.danh_gia_truoc_buoi ?? 0;
  const totalDelta = Math.max(0, firstPre - latestPost);

  // Tiến độ liệu trình
  const totalSessionsCount = plan.tong_so_buoi || 1;
  const validSessions = plan.sessions?.filter((s: any) => s.trang_thai !== 'da_huy') || [];
  const usedSessionsCount = Math.max(plan.so_buoi_da_dung || 0, validSessions.length);
  const progressPercent = Math.min(100, Math.round((usedSessionsCount / totalSessionsCount) * 100));

  // Biểu đồ SVG chỉ vẽ các buổi ĐÃ HOÀN THÀNH (không hiển thị buổi không đến lên biểu đồ)
  const displaySessions =
    filterRange === '3'
      ? completedSessions.slice(-3)
      : filterRange === '6'
      ? completedSessions.slice(-6)
      : completedSessions;

  // SVG Chart Dimensions (Full Width 100%)
  const svgWidth = Math.max(760, displaySessions.length * 75);
  const svgHeight = 230;
  const paddingLeft = 50;
  const paddingRight = 95;
  const paddingTop = 22;
  const paddingBottom = 32;
  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const pointsCount = Math.max(1, displaySessions.length);

  // Công thức phân bố X cân đối ở giữa, không bị dạt sát mép
  const getX = (idx: number) => {
    if (pointsCount <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + ((idx + 0.5) / pointsCount) * chartWidth;
  };

  const getY = (val: number) => {
    const clamped = Math.max(0, Math.min(10, val));
    return paddingTop + ((10 - clamped) / 10) * chartHeight;
  };

  // Đường nối các điểm VAS của các buổi hoàn thành
  const prePoints: { x: number; y: number }[] = [];
  const postPoints: { x: number; y: number }[] = [];

  displaySessions.forEach((s, idx) => {
    const preVal = s.danh_gia_truoc_buoi ?? 6;
    const postVal = s.danh_gia_sau_buoi ?? s.danh_gia_truoc_buoi ?? 4;
    prePoints.push({ x: getX(idx), y: getY(preVal) });
    postPoints.push({ x: getX(idx), y: getY(postVal) });
  });

  const createPath = (pts: { x: number; y: number }[]) => {
    if (pts.length < 2) return '';
    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const next = pts[i + 1];
      path += ` L ${next.x} ${next.y}`;
    }
    return path;
  };

  const prePathD = createPath(prePoints);
  const postPathD = createPath(postPoints);

  // Kỹ thuật KTV thực hiện của selectedSession
  const rawTriLieu = selectedSession
    ? typeof selectedSession.du_lieu_tri_lieu === 'string'
      ? JSON.parse(selectedSession.du_lieu_tri_lieu)
      : selectedSession.du_lieu_tri_lieu || {}
    : {};
  const nhatKyList: any[] =
    rawTriLieu.nhat_ky || rawTriLieu.technique_logs || rawTriLieu.physical_therapy_logs || [];

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 sm:p-7 border border-slate-200/90 dark:border-zinc-800 shadow-sm space-y-6 text-slate-800 dark:text-zinc-100 font-jakarta relative overflow-hidden">
      {/* 1. 4 TOP KPI METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* CARD 1: VAS HIỆN TẠI */}
        <div className="bg-emerald-50/50 dark:bg-emerald-955/20 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
          <div className="space-y-1">
            <span className="text-[10.5px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block flex items-center gap-1">
              <Activity size={12} />
              VAS hiện tại (sau buổi gần nhất)
            </span>
            <div className="flex items-baseline gap-1.5 pt-0.5">
              <span className="text-3xl font-black text-emerald-800 dark:text-emerald-200 font-mono">
                {currentVas !== null ? currentVas : '—'}
              </span>
              <span className="text-sm font-bold text-emerald-600/70 dark:text-emerald-400/70">/ 10</span>
            </div>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
              <span>{currentFace.face}</span>
              <span>{currentFace.label}</span>
            </span>
          </div>
          <div className="size-11 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 shadow-2xs">
            <Activity size={22} />
          </div>
        </div>

        {/* CARD 2: MỨC GIẢM TRUNG BÌNH */}
        <div className="bg-sky-50/50 dark:bg-sky-955/20 border border-sky-200/80 dark:border-sky-800/60 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
          <div className="space-y-1">
            <span className="text-[10.5px] font-bold text-sky-700 dark:text-sky-300 uppercase tracking-wider block flex items-center gap-1">
              <TrendingUp size={12} />
              Mức giảm trung bình
            </span>
            <div className="flex items-baseline gap-1.5 pt-0.5">
              <span className="text-3xl font-black text-sky-800 dark:text-sky-200 font-mono">
                {avgDelta.toFixed(1)}
              </span>
              <span className="text-sm font-bold text-sky-600 dark:text-sky-400">↓</span>
            </div>
            <span className="text-xs font-bold text-sky-700 dark:text-sky-300">điểm / buổi</span>
          </div>
          <div className="size-11 rounded-2xl bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 flex items-center justify-center shrink-0 shadow-2xs">
            <TrendingUp size={22} />
          </div>
        </div>

        {/* CARD 3: MỨC GIẢM TỔNG CỘNG */}
        <div className="bg-amber-50/50 dark:bg-amber-955/20 border border-amber-200/80 dark:border-amber-800/60 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
          <div className="space-y-1">
            <span className="text-[10.5px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider block flex items-center gap-1">
              <Flame size={12} />
              Mức giảm tổng cộng
            </span>
            <div className="flex items-baseline gap-1.5 pt-0.5">
              <span className="text-3xl font-black text-amber-800 dark:text-amber-200 font-mono">
                {totalDelta}
              </span>
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400">↓</span>
            </div>
            <span className="text-xs font-bold text-amber-700 dark:text-amber-300">điểm từ đầu gói</span>
          </div>
          <div className="size-11 rounded-2xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 shadow-2xs">
            <ChevronDown size={22} className="stroke-[3]" />
          </div>
        </div>

        {/* CARD 4: TIẾN ĐỘ LIỆU TRÌNH */}
        <div className="bg-purple-50/50 dark:bg-purple-955/20 border border-purple-200/80 dark:border-purple-800/60 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
          <div className="space-y-1">
            <span className="text-[10.5px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider block flex items-center gap-1">
              <Calendar size={12} />
              Tiến độ liệu trình
            </span>
            <div className="flex items-baseline gap-1 pt-0.5">
              <span className="text-3xl font-black text-purple-800 dark:text-purple-200 font-mono">
                {usedSessionsCount}
              </span>
              <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                / {totalSessionsCount}
              </span>
            </div>
            <span className="text-xs font-bold text-purple-700 dark:text-purple-300">buổi điều trị</span>
          </div>

          <div className="relative size-12 flex items-center justify-center shrink-0">
            <svg className="size-12 -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-purple-100 dark:text-purple-950"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-purple-600 dark:text-purple-400"
                strokeDasharray={`${progressPercent}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-[11px] font-black font-mono text-purple-700 dark:text-purple-300">
              {progressPercent}%
            </span>
          </div>
        </div>
      </div>

      {/* 2. BIỂU ĐỒ TIẾN TRÌNH VAS TOÀN GÓI */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
          <h5 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200">
            Biểu Đồ Tiến Trình VAS Toàn Gói
          </h5>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-xl text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setFilterRange('all')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  filterRange === 'all'
                    ? 'bg-white dark:bg-zinc-700 text-teal-700 dark:text-teal-300 shadow-2xs font-black'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Tất cả buổi
              </button>
              <button
                type="button"
                onClick={() => setFilterRange('3')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  filterRange === '3'
                    ? 'bg-white dark:bg-zinc-700 text-teal-700 dark:text-teal-300 shadow-2xs font-black'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                3 buổi gần nhất
              </button>
              <button
                type="button"
                onClick={() => setFilterRange('6')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  filterRange === '6'
                    ? 'bg-white dark:bg-zinc-700 text-teal-700 dark:text-teal-300 shadow-2xs font-black'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                6 buổi gần nhất
              </button>
            </div>
          </div>
        </div>

        {/* SVG CHART CONTAINER */}
        <div className="bg-slate-50/70 dark:bg-zinc-950/60 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-3.5 sm:p-4 shadow-inner overflow-x-auto">
          <div className="w-full">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto min-w-[620px]">
              {/* DẢI MÀU NỀN PHÂN VÙNG MỨC ĐỘ ĐAU */}
              <rect x={paddingLeft} y={getY(10)} width={chartWidth} height={getY(7) - getY(10)} fill="#FFF1F2" opacity="0.6" />
              <g transform={`translate(${svgWidth - paddingRight + 8}, ${getY(8.5) - 9.5})`}>
                <rect x="0" y="0" width="86" height="19" rx="6" fill="#FFE4E6" stroke="#FECDD3" strokeWidth="0.8" />
                <text x="43" y="13" fill="#BE123C" fontSize="9.5" fontWeight="800" fontFamily="sans-serif" textAnchor="middle">
                  7-10: Đau nhiều
                </text>
              </g>

              <rect x={paddingLeft} y={getY(6.9)} width={chartWidth} height={getY(4) - getY(6.9)} fill="#FFFBEB" opacity="0.6" />
              <g transform={`translate(${svgWidth - paddingRight + 8}, ${getY(5) - 9.5})`}>
                <rect x="0" y="0" width="86" height="19" rx="6" fill="#FEF3C7" stroke="#FDE68A" strokeWidth="0.8" />
                <text x="43" y="13" fill="#B45309" fontSize="9.5" fontWeight="800" fontFamily="sans-serif" textAnchor="middle">
                  4-6: Đau vừa
                </text>
              </g>

              <rect x={paddingLeft} y={getY(3.9)} width={chartWidth} height={getY(1) - getY(3.9)} fill="#F0FDF4" opacity="0.6" />
              <g transform={`translate(${svgWidth - paddingRight + 8}, ${getY(2) - 9.5})`}>
                <rect x="0" y="0" width="86" height="19" rx="6" fill="#DCFCE7" stroke="#BBF7D0" strokeWidth="0.8" />
                <text x="43" y="13" fill="#15803D" fontSize="9.5" fontWeight="800" fontFamily="sans-serif" textAnchor="middle">
                  1-3: Đau nhẹ
                </text>
              </g>

              <g transform={`translate(${svgWidth - paddingRight + 8}, ${getY(0) - 9.5})`}>
                <rect x="0" y="0" width="86" height="19" rx="6" fill="#CCFBF1" stroke="#99F6E4" strokeWidth="0.8" />
                <text x="43" y="13" fill="#0F766E" fontSize="9.5" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">
                  0: Hồi phục
                </text>
              </g>

              {/* Horizontal Grid lines */}
              {[0, 2, 4, 6, 8, 10].map((val) => {
                const y = getY(val);
                return (
                  <g key={val}>
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={svgWidth - paddingRight}
                      y2={y}
                      stroke="#E2E8F0"
                      strokeDasharray={val === 0 ? undefined : '3 3'}
                      strokeWidth={val === 0 ? '1.5' : '1'}
                    />
                    <text x={paddingLeft - 8} y={y + 3.5} fill="#94A3B8" fontSize="9.5" fontWeight="bold" fontFamily="monospace" textAnchor="end">
                      {val}
                    </text>
                  </g>
                );
              })}

              {prePathD && <path d={prePathD} fill="none" stroke="#F43F5E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />}
              {postPathD && <path d={postPathD} fill="none" stroke="#0D9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

              {displaySessions.map((s, idx) => {
                const posX = getX(idx);
                const isSelected = s.id === selectedSessionId;
                const isHovered = hoveredIdx === idx;

                const preVal = s.danh_gia_truoc_buoi ?? 0;
                const postVal = s.danh_gia_sau_buoi ?? preVal;
                const preY = getY(preVal);
                const postY = getY(postVal);
                const delta = preVal - postVal;

                return (
                  <g
                    key={s.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedSessionId((prev) => (prev === s.id ? null : s.id))}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  >
                    <line
                      x1={posX}
                      y1={paddingTop}
                      x2={posX}
                      y2={svgHeight - paddingBottom}
                      stroke={isSelected ? '#0D9488' : '#CBD5E1'}
                      strokeWidth={isSelected ? '2' : '1'}
                      strokeDasharray="2 2"
                    />

                    <circle cx={posX} cy={preY} r={isSelected ? '6.5' : '5'} fill="#F43F5E" stroke="#FFFFFF" strokeWidth="1.5" />
                    <text x={posX} y={preY - 7} fill="#E11D48" fontSize="9.5" fontWeight="900" fontFamily="monospace" textAnchor="middle">
                      {preVal}
                    </text>

                    <circle cx={posX} cy={postY} r={isSelected ? '7.5' : '6'} fill="#0D9488" stroke="#FFFFFF" strokeWidth="2" />
                    <text x={posX} y={postY + 13} fill="#0F766E" fontSize="9.5" fontWeight="900" fontFamily="monospace" textAnchor="middle">
                      {postVal}
                    </text>

                    <text
                      x={posX}
                      y={svgHeight - paddingBottom + 14}
                      fill={isSelected ? '#0D9488' : '#1E293B'}
                      fontSize="10.5"
                      fontWeight={isSelected ? '900' : '700'}
                      fontFamily="sans-serif"
                      textAnchor="middle"
                    >
                      Buổi #{s.so_thu_tu_buoi}
                    </text>
                    <text
                      x={posX}
                      y={svgHeight - paddingBottom + 25}
                      fill="#64748B"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {s.thoi_gian_bat_dau ? new Date(s.thoi_gian_bat_dau).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : ''}
                    </text>

                    {isHovered && (
                      <g transform={`translate(${posX > svgWidth - 140 ? posX - 130 : posX + 10}, ${Math.min(preY, postY) - 15})`}>
                        <rect x="0" y="0" width="125" height="64" rx="8" fill="#FFFFFF" stroke="#0D9488" strokeWidth="1.5" className="shadow-lg" />
                        <text x="8" y="14" fill="#0F172A" fontSize="9.5" fontWeight="900">
                          Buổi #{s.so_thu_tu_buoi} ({s.thoi_gian_bat_dau ? new Date(s.thoi_gian_bat_dau).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : ''})
                        </text>
                        <text x="8" y="29" fill="#E11D48" fontSize="9" fontWeight="700">● VAS đầu: {preVal}/10</text>
                        <text x="8" y="42" fill="#0D9488" fontSize="9" fontWeight="700">● VAS sau: {postVal}/10</text>
                        <text x="8" y="55" fill="#059669" fontSize="9" fontWeight="900">● Giảm: ↓ {delta} điểm</text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 pt-3 border-t border-slate-200/60 dark:border-zinc-800 text-xs font-bold text-slate-600 dark:text-zinc-400">
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-rose-500" />
              <span>VAS đầu buổi (trước trị liệu)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-teal-600" />
              <span>VAS sau buổi (sau trị liệu)</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-black">
              <span>↓ Mức thuyên giảm</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. DANH SÁCH BUỔI TRỊ LIỆU */}
      <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-zinc-800">
        <div className="flex items-center justify-between pb-1">
          <h5 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
            <span>Danh Sách Buổi Trị Liệu</span>
            <span className="text-[10px] bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 px-2 py-0.5 rounded-full font-mono font-bold">
              {allTreatmentSessions.length}
            </span>
          </h5>
          <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold italic">
            Bấm vào buổi để mở xem chi tiết lâm sàng
          </span>
        </div>

        {allTreatmentSessions.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs italic bg-slate-50 dark:bg-zinc-800/50 border rounded-2xl">
            Chưa có buổi trị liệu nào được ghi nhận.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
            {[...allTreatmentSessions].reverse().map((s) => {
              const isSelected = s.id === selectedSessionId;
              const isNoShow = s.trang_thai === 'khong_den';
              const pre = s.danh_gia_truoc_buoi ?? 0;
              const post = s.danh_gia_sau_buoi ?? pre;
              const delta = pre - post;

              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedSessionId((prev) => (prev === s.id ? null : s.id))}
                  className={`px-3.5 py-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 shadow-2xs ${
                    isSelected
                      ? isNoShow
                        ? 'border-rose-400 bg-rose-50/90 dark:bg-rose-955/50 ring-2 ring-rose-400/30'
                        : 'border-teal-500 bg-teal-50/90 dark:bg-teal-955/60 ring-2 ring-teal-400/30'
                      : isNoShow
                      ? 'border-rose-200/90 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-955/20 hover:bg-rose-50 dark:hover:bg-rose-955/40 hover:border-rose-300'
                      : 'border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-800/70 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="shrink-0">
                      {isNoShow ? (
                        <div className="size-6 rounded-full bg-rose-100 dark:bg-rose-955/80 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-xs">
                          ✕
                        </div>
                      ) : (
                        <div className="size-6 rounded-full bg-emerald-100 dark:bg-emerald-955 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                          ✓
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900 dark:text-zinc-100 leading-tight">
                        Buổi #{s.so_thu_tu_buoi}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400 mt-0.5">
                        <Calendar size={10} className="text-slate-400 shrink-0" />
                        <span>
                          {s.thoi_gian_bat_dau
                            ? new Date(s.thoi_gian_bat_dau).toLocaleDateString('vi-VN', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              })
                            : '—'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isNoShow ? (
                    <div className="text-right shrink-0">
                      <span className="px-2.5 py-1 rounded-lg text-[10.5px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 dark:bg-rose-955/70 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                        Không đến
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="text-center">
                        <div className="text-sm font-black text-rose-500 font-mono leading-none">{pre}</div>
                        <div className="text-[10px] text-slate-400 mt-1 font-medium">Đầu buổi</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-black text-teal-600 font-mono leading-none">{post}</div>
                        <div className="text-[10px] text-slate-400 mt-1 font-medium">Sau buổi</div>
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded-lg text-xs font-black font-mono inline-flex items-center gap-0.5 ${
                            delta > 0
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-955 dark:text-emerald-300'
                              : delta === 0
                              ? 'bg-slate-100 text-slate-600 dark:bg-zinc-700 dark:text-zinc-300'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {delta > 0 ? `↓ ${delta}` : delta === 0 ? '0' : `↑ ${Math.abs(delta)}`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. BẢNG SOI CHI TIẾT BUỔI ĐƯỢC CHỌN */}
      {selectedSession && (
        <div
          className={`border rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs animate-in fade-in duration-200 ${
            selectedSession.trang_thai === 'khong_den'
              ? 'bg-rose-50/40 dark:bg-rose-955/20 border-rose-300/80 dark:border-rose-800/80'
              : 'bg-slate-50/70 dark:bg-zinc-955/50 border-teal-300/80 dark:border-teal-800/80'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-zinc-800 pb-3.5">
            <div className="flex items-center gap-3">
              <div
                className={`size-10 rounded-2xl text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm ring-2 ${
                  selectedSession.trang_thai === 'khong_den'
                    ? 'bg-gradient-to-br from-rose-500 to-red-600 ring-rose-400/20'
                    : 'bg-gradient-to-br from-teal-500 to-emerald-600 ring-teal-400/20'
                }`}
              >
                {selectedSession.so_thu_tu_buoi}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h5 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    Chi Tiết Lâm Sàng Buổi #{selectedSession.so_thu_tu_buoi}
                  </h5>
                  <span
                    className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                      selectedSession.trang_thai === 'khong_den'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}
                  >
                    {selectedSession.trang_thai === 'khong_den' ? '⚠️ Không đến (Vắng mặt)' : 'Đã hoàn thành'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 font-medium">
                  <Calendar
                    size={13}
                    className={
                      selectedSession.trang_thai === 'khong_den'
                        ? 'text-rose-500 shrink-0'
                        : 'text-teal-600 dark:text-teal-400 shrink-0'
                    }
                  />
                  <span>
                    Ngày hẹn:{' '}
                    <strong className="font-mono text-slate-700 dark:text-zinc-200">
                      {selectedSession.thoi_gian_bat_dau
                        ? new Date(selectedSession.thoi_gian_bat_dau).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })
                        : '—'}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end md:self-center">
              {selectedSession.trang_thai !== 'khong_den' && (
                <div className="flex items-center gap-2.5 bg-white dark:bg-zinc-800/90 px-3.5 py-1.5 rounded-2xl border border-slate-200/90 dark:border-zinc-700 shadow-2xs">
                  <div className="size-8 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 text-white flex items-center justify-center font-black text-xs shadow-2xs shrink-0">
                    {(selectedSession.ten_ky_thuat_vien || 'K').trim().split(/\s+/).pop()?.[0]?.toUpperCase() || 'K'}
                  </div>
                  <div className="leading-tight">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Kỹ thuật viên PHCN
                    </span>
                    <span className="text-xs font-black text-slate-800 dark:text-zinc-100">
                      {selectedSession.ten_ky_thuat_vien || 'KTV'}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-1.5 shrink-0">
                {(() => {
                  const curIdx = allTreatmentSessions.findIndex((s) => s.id === selectedSession.id);
                  const prevSession = curIdx > 0 ? allTreatmentSessions[curIdx - 1] : null;
                  const nextSession = curIdx < allTreatmentSessions.length - 1 ? allTreatmentSessions[curIdx + 1] : null;

                  return (
                    <>
                      <button
                        type="button"
                        disabled={!prevSession}
                        onClick={() => prevSession && setSelectedSessionId(prevSession.id)}
                        className="p-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-700 dark:text-zinc-200 disabled:opacity-30 hover:bg-slate-50 cursor-pointer disabled:cursor-not-allowed transition-all shadow-2xs"
                        title="Buổi trước"
                      >
                        <ChevronLeft size={15} />
                      </button>
                      <button
                        type="button"
                        disabled={!nextSession}
                        onClick={() => nextSession && setSelectedSessionId(nextSession.id)}
                        className="p-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-700 dark:text-zinc-200 disabled:opacity-30 hover:bg-slate-50 cursor-pointer disabled:cursor-not-allowed transition-all shadow-2xs"
                        title="Buổi tiếp"
                      >
                        <ChevronLeft size={15} className="rotate-180" />
                      </button>
                    </>
                  );
                })()}

                <button
                  type="button"
                  onClick={() => setSelectedSessionId(null)}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-955/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-black flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                  title="Đóng chi tiết buổi"
                >
                  <X size={14} />
                  <span>Đóng</span>
                </button>
              </div>
            </div>
          </div>

          {selectedSession.trang_thai === 'khong_den' ? (
            <div className="p-8 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-rose-200 dark:border-rose-900/60 space-y-2.5">
              <div className="size-12 rounded-2xl bg-rose-100 dark:bg-rose-955/50 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
                <AlertTriangle size={24} />
              </div>
              <h6 className="text-sm font-black text-slate-800 dark:text-zinc-200">
                Khách hàng không đến ca hẹn điều trị Buổi #{selectedSession.so_thu_tu_buoi}
              </h6>
              <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-md mx-auto">
                Ca hẹn đã được ghi nhận trạng thái <strong>Không đến (Vắng mặt)</strong>. Do đó không có dữ liệu đánh giá thang đo VAS hoặc nhật ký kỹ thuật trị liệu nào cho buổi này.
              </p>
            </div>
          ) : (
            <>
              {/* 1. THANG ĐO ĐAU VAS TRƯỚC VÀ SAU CỦA BUỔI ĐANG CHỌN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-rose-50/60 dark:bg-rose-955/20 p-3 rounded-xl border border-rose-200/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-rose-500" />
                      VAS Đầu Ca (Trước Trị Liệu)
                    </span>
                    <span className="font-black text-rose-600 text-sm font-mono">
                      {selectedSession.danh_gia_truoc_buoi ?? 6}/10
                    </span>
                  </div>
                  <div className="grid grid-cols-6 gap-1">
                    {WONG_BAKER_FACES.map((f) => {
                      const isSelected = (selectedSession.danh_gia_truoc_buoi ?? 6) === f.score;
                      return (
                        <div
                          key={f.score}
                          className={`p-1 rounded-lg border text-center transition-all ${
                            isSelected
                              ? 'bg-rose-500 text-white font-black border-rose-600 shadow-2xs scale-105'
                              : 'bg-white/80 dark:bg-zinc-800 text-slate-400 border-slate-200/80 dark:border-zinc-700 opacity-60'
                          }`}
                        >
                          <div className="text-sm">{f.face}</div>
                          <div className="text-[8.5px] font-mono mt-0.5">{f.score}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-emerald-50/60 dark:bg-emerald-955/20 p-3 rounded-xl border border-emerald-200/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-emerald-500" />
                      VAS Sau Ca (Sau Trị Liệu)
                    </span>
                    <span className="font-black text-emerald-600 text-sm font-mono">
                      {selectedSession.danh_gia_sau_buoi ?? 4}/10
                    </span>
                  </div>
                  <div className="grid grid-cols-6 gap-1">
                    {WONG_BAKER_FACES.map((f) => {
                      const isSelected = (selectedSession.danh_gia_sau_buoi ?? 4) === f.score;
                      return (
                        <div
                          key={f.score}
                          className={`p-1 rounded-lg border text-center transition-all ${
                            isSelected
                              ? 'bg-emerald-600 text-white font-black border-emerald-700 shadow-2xs scale-105'
                              : 'bg-white/80 dark:bg-zinc-800 text-slate-400 border-slate-200/80 dark:border-zinc-700 opacity-60'
                          }`}
                        >
                          <div className="text-sm">{f.face}</div>
                          <div className="text-[8.5px] font-mono mt-0.5">{f.score}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* THANH HIỆU QUẢ GIẢM ĐAU */}
              <div className="bg-teal-50 dark:bg-teal-955/40 px-3 py-2 rounded-xl border border-teal-200/70 flex items-center gap-2 text-xs font-bold text-teal-800 dark:text-teal-200">
                <Sparkles className="size-4 text-teal-600 shrink-0" />
                <span>
                  {selectedSession.danh_gia_truoc_buoi !== undefined &&
                  selectedSession.danh_gia_sau_buoi !== undefined &&
                  selectedSession.danh_gia_truoc_buoi !== null &&
                  selectedSession.danh_gia_sau_buoi !== null &&
                  selectedSession.danh_gia_truoc_buoi > selectedSession.danh_gia_sau_buoi
                    ? `Hiệu quả thuyên giảm đau trong buổi #${selectedSession.so_thu_tu_buoi}: Giảm ${selectedSession.danh_gia_truoc_buoi - selectedSession.danh_gia_sau_buoi} điểm (${selectedSession.danh_gia_truoc_buoi}/10 ➔ ${selectedSession.danh_gia_sau_buoi}/10)`
                    : `Mức độ đau sau ca trị liệu: (${selectedSession.danh_gia_sau_buoi ?? selectedSession.danh_gia_truoc_buoi ?? 4}/10)`}
                </span>
              </div>

              {/* 2. NHẬT KÝ KỸ THUẬT & DẶN DÒ KTV */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-zinc-200 text-xs flex items-center gap-1.5">
                    <Zap className="size-3.5 text-teal-600" />
                    Kỹ thuật trị liệu KTV đã thực hiện:
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">
                    {nhatKyList.length || 2} kỹ thuật
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {nhatKyList.length > 0 ? (
                    nhatKyList.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700 flex items-start gap-2.5 shadow-2xs"
                      >
                        <div className="p-1 rounded-lg bg-teal-600 text-white shrink-0 mt-0.5">
                          <CheckCircle2 size={13} />
                        </div>
                        <div className="space-y-0.5">
                          <h5 className="font-bold text-slate-900 dark:text-zinc-100 text-xs">
                            {item.noi_dung || item.name || item.technique || 'Trị liệu KTV'}
                          </h5>
                          <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">
                            Kỹ thuật trị liệu chuyên sâu PHCN.
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700 flex items-start gap-2.5 shadow-2xs">
                        <div className="p-1 rounded-lg bg-teal-600 text-white shrink-0 mt-0.5">
                          <CheckCircle2 size={13} />
                        </div>
                        <div className="space-y-0.5">
                          <h5 className="font-bold text-slate-900 dark:text-zinc-100 text-xs">
                            Điện xung &amp; Nhiệt hồng ngoại
                          </h5>
                          <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">
                            Thực hiện theo phác đồ chỉ định.
                          </p>
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700 flex items-start gap-2.5 shadow-2xs">
                        <div className="p-1 rounded-lg bg-teal-600 text-white shrink-0 mt-0.5">
                          <CheckCircle2 size={13} />
                        </div>
                        <div className="space-y-0.5">
                          <h5 className="font-bold text-slate-900 dark:text-zinc-100 text-xs">
                            Di động khớp &amp; Giải phóng cơ
                          </h5>
                          <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">
                            Tác động phục hồi ROM.
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {(selectedSession.danh_gia_hieu_qua || selectedSession.canh_bao_dac_biet) && (
                  <div className="pt-1">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
                      Ghi chú &amp; Dặn dò của KTV ({selectedSession.ten_ky_thuat_vien || 'KTV'}):
                    </span>
                    <p className="italic text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 p-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-700 text-xs">
                      "{selectedSession.danh_gia_hieu_qua || selectedSession.canh_bao_dac_biet}"
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
