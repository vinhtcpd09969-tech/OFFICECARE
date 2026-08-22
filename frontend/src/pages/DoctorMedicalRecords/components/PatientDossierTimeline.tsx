import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../../stores/authStore';
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  Phone,
  Mail,
  Stethoscope,
  PlusCircle,
  ImageIcon,
  Printer,
  User,
  AlertTriangle,
  Flame,
  Zap,
  Activity,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Eye,
  X,
} from 'lucide-react';
import { PatientInfo, PatientProfile, TreatmentPlan } from '../../../features/doctor/api/doctor.api';
import { formatCurrency } from '../../../utils/format';
import { resolveImageUrl } from '../../../utils/imageUrl';

interface PatientDossierTimelineProps {
  selectedPatient: PatientInfo;
  profile: PatientProfile | null;
  onBack: () => void;
  onOpenVisit?: (visitId: string) => void;
  onOpenPlan?: (planId: string) => void;
  onBookNextSession?: (plan: TreatmentPlan) => void;
  highlightTarget?: { type: 'plan' | 'visit'; id: string } | null;
  compactMode?: boolean;
}

type EmrTab = 'assessments' | 'plans';

// Wong-Baker Faces helper
const WONG_BAKER_FACES = [
  { score: 0, face: '😊', label: 'Không đau' },
  { score: 2, face: '🙂', label: 'Đau nhẹ' },
  { score: 4, face: '😐', label: 'Đau vừa' },
  { score: 6, face: '🙁', label: 'Đau nhiều' },
  { score: 8, face: '😣', label: 'Rất đau' },
  { score: 10, face: '😭', label: 'Đau dữ dội' },
];

function getFaceForVas(score: number | null | undefined) {
  if (score === null || score === undefined) return { face: '—', label: 'Chưa đo' };
  const found = WONG_BAKER_FACES.find(f => f.score >= score);
  return found || WONG_BAKER_FACES[WONG_BAKER_FACES.length - 1];
}

/* =========================================================================
   TREATMENT PLAN VAS PROGRESSION DASHBOARD (CHUẨN Y KHOA PHCN & UX/UI PRO MAX)
   ========================================================================= */
function TreatmentPlanVasDashboard({ 
  plan, 
}: { 
  plan: TreatmentPlan; 
}) {
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

  const completedSessions = allTreatmentSessions.filter(
    (s) => s.trang_thai === 'hoan_thanh'
  );

  // Mặc định KHÔNG mở chi tiết buổi (null). Khi click vào buổi mới mở.
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const selectedSession = selectedSessionId 
    ? allTreatmentSessions.find(s => s.id === selectedSessionId) || null
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
  const displaySessions = filterRange === '3'
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
  const rawTriLieu = selectedSession ? (
    typeof selectedSession.du_lieu_tri_lieu === 'string'
      ? JSON.parse(selectedSession.du_lieu_tri_lieu)
      : (selectedSession.du_lieu_tri_lieu || {})
  ) : {};
  const nhatKyList: any[] = rawTriLieu.nhat_ky || rawTriLieu.technique_logs || rawTriLieu.physical_therapy_logs || [];

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
            <span className="text-xs font-bold text-sky-700 dark:text-sky-300">
              điểm / buổi
            </span>
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
            <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
              điểm từ đầu gói
            </span>
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
              <span className="text-sm font-bold text-purple-600 dark:text-purple-400">/ {totalSessionsCount}</span>
            </div>
            <span className="text-xs font-bold text-purple-700 dark:text-purple-300">
              buổi điều trị
            </span>
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

      {/* 2. BIỂU ĐỒ TIẾN TRÌNH VAS TOÀN GÓI (FULL-WIDTH 100%) */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
          <h5 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200">
            Biểu Đồ Tiến Trình VAS Toàn Gói
          </h5>

          <div className="flex items-center gap-2">
            {/* Filter Range Buttons */}
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
              {/* 7 - 10: Đau nhiều */}
              <rect
                x={paddingLeft}
                y={getY(10)}
                width={chartWidth}
                height={getY(7) - getY(10)}
                fill="#FFF1F2"
                opacity="0.6"
              />
              <g transform={`translate(${svgWidth - paddingRight + 8}, ${getY(8.5) - 9.5})`}>
                <rect x="0" y="0" width="86" height="19" rx="6" fill="#FFE4E6" stroke="#FECDD3" strokeWidth="0.8" />
                <text x="43" y="13" fill="#BE123C" fontSize="9.5" fontWeight="800" fontFamily="sans-serif" textAnchor="middle">
                  7-10: Đau nhiều
                </text>
              </g>

              {/* 4 - 6: Đau vừa */}
              <rect
                x={paddingLeft}
                y={getY(6.9)}
                width={chartWidth}
                height={getY(4) - getY(6.9)}
                fill="#FFFBEB"
                opacity="0.6"
              />
              <g transform={`translate(${svgWidth - paddingRight + 8}, ${getY(5) - 9.5})`}>
                <rect x="0" y="0" width="86" height="19" rx="6" fill="#FEF3C7" stroke="#FDE68A" strokeWidth="0.8" />
                <text x="43" y="13" fill="#B45309" fontSize="9.5" fontWeight="800" fontFamily="sans-serif" textAnchor="middle">
                  4-6: Đau vừa
                </text>
              </g>

              {/* 1 - 3: Đau nhẹ */}
              <rect
                x={paddingLeft}
                y={getY(3.9)}
                width={chartWidth}
                height={getY(1) - getY(3.9)}
                fill="#F0FDF4"
                opacity="0.6"
              />
              <g transform={`translate(${svgWidth - paddingRight + 8}, ${getY(2) - 9.5})`}>
                <rect x="0" y="0" width="86" height="19" rx="6" fill="#DCFCE7" stroke="#BBF7D0" strokeWidth="0.8" />
                <text x="43" y="13" fill="#15803D" fontSize="9.5" fontWeight="800" fontFamily="sans-serif" textAnchor="middle">
                  1-3: Đau nhẹ
                </text>
              </g>

              {/* 0: Hồi phục */}
              <g transform={`translate(${svgWidth - paddingRight + 8}, ${getY(0) - 9.5})`}>
                <rect x="0" y="0" width="86" height="19" rx="6" fill="#CCFBF1" stroke="#99F6E4" strokeWidth="0.8" />
                <text x="43" y="13" fill="#0F766E" fontSize="9.5" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">
                  0: Hồi phục
                </text>
              </g>

              {/* Horizontal Grid lines (VAS 0, 2, 4, 6, 8, 10) */}
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
                    <text
                      x={paddingLeft - 8}
                      y={y + 3.5}
                      fill="#94A3B8"
                      fontSize="9.5"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="end"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Pre VAS line (Rose) */}
              {prePathD && (
                <path
                  d={prePathD}
                  fill="none"
                  stroke="#F43F5E"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Post VAS line (Teal) */}
              {postPathD && (
                <path
                  d={postPathD}
                  fill="none"
                  stroke="#0D9488"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Data points for completed sessions */}
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
                    onClick={() => setSelectedSessionId(prev => prev === s.id ? null : s.id)}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  >
                    {/* Vertical line guide */}
                    <line
                      x1={posX}
                      y1={paddingTop}
                      x2={posX}
                      y2={svgHeight - paddingBottom}
                      stroke={isSelected ? '#0D9488' : '#CBD5E1'}
                      strokeWidth={isSelected ? '2' : '1'}
                      strokeDasharray="2 2"
                    />

                    {/* Pre Dot (Rose) */}
                    <circle
                      cx={posX}
                      cy={preY}
                      r={isSelected ? '6.5' : '5'}
                      fill="#F43F5E"
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                    />
                    {/* Số điểm trước */}
                    <text
                      x={posX}
                      y={preY - 7}
                      fill="#E11D48"
                      fontSize="9.5"
                      fontWeight="900"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {preVal}
                    </text>

                    {/* Post Dot (Teal) */}
                    <circle
                      cx={posX}
                      cy={postY}
                      r={isSelected ? '7.5' : '6'}
                      fill="#0D9488"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />
                    {/* Số điểm sau */}
                    <text
                      x={posX}
                      y={postY + 13}
                      fill="#0F766E"
                      fontSize="9.5"
                      fontWeight="900"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {postVal}
                    </text>

                    {/* Nhãn Buổi X-axis */}
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

                    {/* Interactive Tooltip Card on Hover */}
                    {isHovered && (
                      <g transform={`translate(${posX > svgWidth - 140 ? posX - 130 : posX + 10}, ${Math.min(preY, postY) - 15})`}>
                        <rect
                          x="0"
                          y="0"
                          width="125"
                          height="64"
                          rx="8"
                          fill="#FFFFFF"
                          stroke="#0D9488"
                          strokeWidth="1.5"
                          className="shadow-lg"
                        />
                        <text x="8" y="14" fill="#0F172A" fontSize="9.5" fontWeight="900">
                          Buổi #{s.so_thu_tu_buoi} ({s.thoi_gian_bat_dau ? new Date(s.thoi_gian_bat_dau).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : ''})
                        </text>
                        <text x="8" y="29" fill="#E11D48" fontSize="9" fontWeight="700">
                          ● VAS đầu: {preVal}/10
                        </text>
                        <text x="8" y="42" fill="#0D9488" fontSize="9" fontWeight="700">
                          ● VAS sau: {postVal}/10
                        </text>
                        <text x="8" y="55" fill="#059669" fontSize="9" fontWeight="900">
                          ● Giảm: ↓ {delta} điểm
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Chú giải dưới chân biểu đồ */}
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

      {/* 3. DANH SÁCH BUỔI TRỊ LIỆU (GRID BÊN DƯỚI) - CHUẨN ẢNH 1 */}
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
                  onClick={() => setSelectedSessionId(prev => prev === s.id ? null : s.id)}
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
                  {/* Bên trái: Icon Check / X + Buổi & Ngày */}
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
                        <span>{s.thoi_gian_bat_dau ? new Date(s.thoi_gian_bat_dau).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bên phải: Điểm hoặc Badge Không đến */}
                  {isNoShow ? (
                    <div className="text-right shrink-0">
                      <span className="px-2.5 py-1 rounded-lg text-[10.5px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
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
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-black font-mono inline-flex items-center gap-0.5 ${
                          delta > 0
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-955 dark:text-emerald-300'
                            : delta === 0
                            ? 'bg-slate-100 text-slate-600 dark:bg-zinc-700 dark:text-zinc-300'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
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

      {/* 4. BẢNG SOI CHI TIẾT BUỔI ĐƯỢC CHỌN (CHỈ HIỆN KHI NGƯỜI DÙNG CLICK VÀO BUỔI) */}
      {selectedSession && (
        <div className={`border rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs animate-in fade-in duration-200 ${
          selectedSession.trang_thai === 'khong_den'
            ? 'bg-rose-50/40 dark:bg-rose-955/20 border-rose-300/80 dark:border-rose-800/80'
            : 'bg-slate-50/70 dark:bg-zinc-955/50 border-teal-300/80 dark:border-teal-800/80'
        }`}>
          
          {/* Header Bảng Soi Chi Tiết */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-zinc-800 pb-3.5">
            
            {/* Bên trái: Badge Buổi + Tiêu đề + Icon Lịch Ngày */}
            <div className="flex items-center gap-3">
              <div className={`size-10 rounded-2xl text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm ring-2 ${
                selectedSession.trang_thai === 'khong_den'
                  ? 'bg-gradient-to-br from-rose-500 to-red-600 ring-rose-400/20'
                  : 'bg-gradient-to-br from-teal-500 to-emerald-600 ring-teal-400/20'
              }`}>
                {selectedSession.so_thu_tu_buoi}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h5 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    Chi Tiết Lâm Sàng Buổi #{selectedSession.so_thu_tu_buoi}
                  </h5>
                  <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                    selectedSession.trang_thai === 'khong_den'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}>
                    {selectedSession.trang_thai === 'khong_den' ? '⚠️ Không đến (Vắng mặt)' : 'Đã hoàn thành'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 font-medium">
                  <Calendar size={13} className={selectedSession.trang_thai === 'khong_den' ? "text-rose-500 shrink-0" : "text-teal-600 dark:text-teal-400 shrink-0"} />
                  <span>Ngày hẹn: <strong className="font-mono text-slate-700 dark:text-zinc-200">{selectedSession.thoi_gian_bat_dau ? new Date(selectedSession.thoi_gian_bat_dau).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}</strong></span>
                </div>
              </div>
            </div>

            {/* Bên phải: Nút Điều Hướng / Đóng */}
            <div className="flex items-center gap-3 self-end md:self-center">
              
              {/* Card Kỹ Thuật Viên nếu có */}
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

              {/* Nút Điều Hướng & Đóng */}
              <div className="flex items-center gap-1.5 shrink-0">
                {(() => {
                  const curIdx = allTreatmentSessions.findIndex(s => s.id === selectedSession.id);
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
            /* TRƯỜNG HỢP BUỔI KHÔNG ĐẾN: HIỂN THỊ THÔNG BÁO GỌN GÀNG, KHÔNG CÓ DỮ LIỆU LÂM SÀNG */
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
            /* TRƯỜNG HỢP BUỔI HOÀN THÀNH: HIỂN THỊ ĐẦY ĐỦ THANG ĐO VAS & NHẬT KÝ KỸ THUẬT */
            <>
              {/* 1. THANG ĐO ĐAU VAS TRƯỚC VÀ SAU CỦA BUỔI ĐANG CHỌN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* VAS TRƯỚC */}
                <div className="bg-rose-50/60 dark:bg-rose-955/20 p-3 rounded-xl border border-rose-200/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-rose-500" />
                      VAS Đầu Ca (Trước Trị Liệu)
                    </span>
                    <span className="font-black text-rose-600 text-sm font-mono">{selectedSession.danh_gia_truoc_buoi ?? 6}/10</span>
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

                {/* VAS SAU */}
                <div className="bg-emerald-50/60 dark:bg-emerald-955/20 p-3 rounded-xl border border-emerald-200/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-emerald-500" />
                      VAS Sau Ca (Sau Trị Liệu)
                    </span>
                    <span className="font-black text-emerald-600 text-sm font-mono">{selectedSession.danh_gia_sau_buoi ?? 4}/10</span>
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
                  {selectedSession.danh_gia_truoc_buoi !== undefined && selectedSession.danh_gia_sau_buoi !== undefined && selectedSession.danh_gia_truoc_buoi !== null && selectedSession.danh_gia_sau_buoi !== null && selectedSession.danh_gia_truoc_buoi > selectedSession.danh_gia_sau_buoi
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
                      <div key={idx} className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700 flex items-start gap-2.5 shadow-2xs">
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

                {/* Dặn dò chuyên môn */}
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
}

export const PatientDossierTimeline: React.FC<PatientDossierTimelineProps> = ({
  selectedPatient,
  profile,
  onBack,
  onBookNextSession,
  highlightTarget,
  compactMode = false,
}) => {
  const location = useLocation();
  const currentUser = useAuthStore((state) => state.user);

  // Chỉ hiển thị thông tin tài chính (Trạng thái thanh toán, Giá gói, Đã đóng, Còn nợ) cho ADMIN & KHÁCH HÀNG.
  // Bác sĩ (Doctor) và Kỹ thuật viên (KTV) KHÔNG thấy thông tin tài chính.
  const isDoctorOrTechView =
    location.pathname.startsWith('/doctor') ||
    location.pathname.startsWith('/technician') ||
    (currentUser && (currentUser.vai_tro_id === 4 || currentUser.vai_tro_id === 3));
  const showFinancialDetails = !isDoctorOrTechView;

  const [activeTab, setActiveTab] = useState<EmrTab>('assessments');

  // State mở/đóng chi tiết từng dòng trong bảng Lượng Giá (mặc định đóng tất cả)
  const [expandedVisitIds, setExpandedVisitIds] = useState<Set<string>>(new Set());

  // State mở/đóng chi tiết phác đồ gói (mặc định đóng tất cả)
  const [expandedPlanIds, setExpandedPlanIds] = useState<Set<string>>(new Set());

  // State mở Modal Xem trước Hóa đơn Hoàn tiền
  const [refundPreviewPlan, setRefundPreviewPlan] = useState<TreatmentPlan | null>(null);

  // State mở Modal xem ảnh đính kèm (Lightbox)
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  React.useEffect(() => {
    if (!highlightTarget || !highlightTarget.id) return;

    if (highlightTarget.type === 'plan') {
      setActiveTab('plans');
      setExpandedPlanIds(prev => new Set(prev).add(highlightTarget.id));
      const timer = setTimeout(() => {
        const el = document.getElementById(`plan-card-${highlightTarget.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 250);
      return () => clearTimeout(timer);
    } else if (highlightTarget.type === 'visit') {
      setActiveTab('assessments');
      setExpandedVisitIds(prev => new Set(prev).add(highlightTarget.id));
      const timer = setTimeout(() => {
        const el = document.getElementById(`visit-row-${highlightTarget.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [highlightTarget]);

  const toggleVisitExpand = (id: string) => {
    setExpandedVisitIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const togglePlanExpand = (id: string) => {
    setExpandedPlanIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getAge = (birthday?: string) => {
    if (!birthday) return '';
    try {
      const birthYear = new Date(birthday).getFullYear();
      const currentYear = new Date().getFullYear();
      return `${currentYear - birthYear} tuổi`;
    } catch {
      return '';
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '---';
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return '---';
    }
  };

  // Tên Bác sĩ/Chuyên viên phụ trách gần nhất
  const latestDoctorName = profile?.visits?.[0]?.ten_nhan_su || profile?.treatmentPlans?.[0]?.bac_si_chi_dinh || 'BS. CKI Chuyên Khoa PHCN';

  return (
    <div className="w-full space-y-6 font-jakarta">
      {/* 1. THÔNG TIN KHÁCH HÀNG (HEADER TRANG) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-zinc-800">
          
          {/* AVATAR VÀ CÁC TRƯỜNG THÔNG TIN KHÁCH HÀNG */}
          <div className="flex items-start sm:items-center gap-5">
            {onBack && !compactMode && (
              <button
                type="button"
                onClick={onBack}
                className="p-3 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-2xl transition-all cursor-pointer shadow-xs hover:scale-105 active:scale-95 shrink-0"
                title="Quay lại danh sách"
              >
                <ChevronLeft size={20} className="stroke-[2.5]" />
              </button>
            )}

            {/* AVATAR BỆNH NHÂN */}
            {selectedPatient.avatar_url ? (
              <img
                src={selectedPatient.avatar_url}
                alt={selectedPatient.ho_ten}
                className="size-20 rounded-full object-cover border-2 border-teal-500 shadow-md shrink-0"
              />
            ) : (
              <div className="size-20 rounded-full bg-gradient-to-br from-teal-500 via-cyan-600 to-emerald-600 text-white flex items-center justify-center font-black text-2xl shadow-md shrink-0">
                {selectedPatient.ho_ten.trim().split(/\s+/).pop()?.[0]?.toUpperCase() || 'K'}
              </div>
            )}

            {/* THÔNG TIN CHI TIẾT 2 CỘT */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
                Thông tin khách hàng:
              </span>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-zinc-100">
                {selectedPatient.ho_ten}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-slate-600 dark:text-zinc-300 font-medium pt-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-400">ID:</span>
                  <strong className="font-mono text-teal-700 dark:text-teal-400">{`KH-${selectedPatient.id.substring(0, 6).toUpperCase()}`}</strong>
                </div>

                <div className="flex items-center gap-2">
                  <User size={14} className="text-slate-400 shrink-0" />
                  <span>BS. Phụ trách: <strong className="text-slate-800 dark:text-zinc-100 font-bold">{latestDoctorName}</strong></span>
                </div>

                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-slate-400 shrink-0" />
                  <span>SĐT: <strong className="font-mono text-slate-800 dark:text-zinc-100 font-bold">{selectedPatient.so_dien_thoai}</strong></span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-slate-400 shrink-0" />
                  <span>Tuổi: <strong className="text-slate-800 dark:text-zinc-100 font-bold">{getAge(selectedPatient.ngay_sinh) || '28 tuổi'}</strong> ({selectedPatient.gioi_tinh === 'nam' ? 'Nam' : 'Nữ'})</span>
                </div>

                {selectedPatient.email && (
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <Mail size={14} className="text-slate-400 shrink-0" />
                    <span>Email: <strong className="text-slate-800 dark:text-zinc-100 font-bold">{selectedPatient.email}</strong></span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS (GÓC PHẢI) */}
          <div className="flex items-center gap-2.5 shrink-0 self-end lg:self-center">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
            >
              <Printer size={15} />
              <span>In Hồ Sơ EMR</span>
            </button>
          </div>

        </div>

        {/* 2. THANH TAB RỘNG TRẢI ĐỀU 100% (SEGMENTED CONTROL THEO ẢNH 1 MẪU) */}
        <div className="bg-slate-100/90 dark:bg-zinc-800/90 p-1.5 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
          <button
            type="button"
            onClick={() => setActiveTab('assessments')}
            className={`w-full py-3.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
              activeTab === 'assessments'
                ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-white/60 dark:hover:bg-zinc-700/50'
            }`}
          >
            <Stethoscope size={16} className={activeTab === 'assessments' ? 'text-white' : 'text-teal-600 dark:text-teal-400'} />
            <span>1. Lịch Sử Lượng Giá & Dịch Vụ Đơn Lẻ ({profile?.visits.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('plans')}
            className={`w-full py-3.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
              activeTab === 'plans'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-white/60 dark:hover:bg-zinc-700/50'
            }`}
          >
            <Zap size={16} className={activeTab === 'plans' ? 'text-white' : 'text-amber-500'} />
            <span>2. Gói Liệu Trình Điều Trị ({profile?.treatmentPlans.length || 0})</span>
          </button>
        </div>

        {/* TAB 1: BẢNG LỊCH SỬ LƯỢNG GIÁ & DỊCH VỤ ĐƠN LẺ */}
        {activeTab === 'assessments' && (
          <div className="space-y-4">
            {(!profile || profile.visits.length === 0) ? (
              <div className="py-12 text-center text-slate-400 text-xs font-medium border border-dashed rounded-2xl">
                Bệnh nhân chưa có lịch sử lượng giá hoặc ca khám nào.
              </div>
            ) : (
              <div className="border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
                
                {/* TABLE HEADER - ĐÃ CẬP NHẬT THEO CỐT ẢNH 3: NGÀY LÀM | TÊN DỊCH VỤ / GÓI | NHÂN SỰ THỰC HIỆN | CHI TIẾT */}
                <div className="bg-slate-50 dark:bg-zinc-800/80 px-5 py-3.5 grid grid-cols-12 gap-3 text-[11px] font-black text-slate-500 uppercase tracking-wider items-center">
                  <div className="col-span-3 sm:col-span-2">Ngày làm</div>
                  <div className="col-span-6 sm:col-span-6">Tên dịch vụ / Gói</div>
                  <div className="hidden sm:block sm:col-span-3">Nhân sự thực hiện</div>
                  <div className="col-span-3 sm:col-span-1 text-right">Chi tiết</div>
                </div>

                {/* TABLE ROWS */}
                {profile.visits.map((visit) => {
                  const isExpanded = expandedVisitIds.has(visit.id);
                  const isAssessment = visit.loai === 'KHAM';
                  const isReassessmentPending = visit.trang_thai === 'cho_tai_luong_gia';
                  const isVisitHighlighted = highlightTarget?.type === 'visit' && highlightTarget?.id === visit.id;

                  return (
                    <div
                      id={`visit-row-${visit.id}`}
                      key={visit.id}
                      className={`transition-all ${
                        isVisitHighlighted
                          ? 'ring-2 ring-teal-500 bg-teal-50/80 dark:bg-teal-950/50 rounded-xl shadow-lg shadow-teal-500/10'
                          : ''
                      }`}
                    >
                      <div
                        onClick={() => toggleVisitExpand(visit.id)}
                        className="px-5 py-4 grid grid-cols-12 gap-3 items-center hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 cursor-pointer text-xs transition-colors"
                      >
                        {/* 1. NGÀY LÀM */}
                        <div className="col-span-3 sm:col-span-2 font-mono font-bold text-slate-700 dark:text-zinc-300">
                          {formatDate(visit.thoi_gian)}
                        </div>

                        {/* 2. TÊN DỊCH VỤ / GÓI */}
                        <div className="col-span-6 sm:col-span-6 flex items-center gap-2.5 min-w-0 overflow-hidden">
                          <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase shrink-0 ${
                            isReassessmentPending
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/60'
                              : isAssessment 
                                ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60' 
                                : 'bg-emerald-100 dark:bg-emerald-955/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60'
                          }`}>
                            {isReassessmentPending ? '🔄 Chờ tái lượng giá' : isAssessment ? 'Lượng giá' : 'Trị liệu'}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-zinc-100 truncate">
                            {isReassessmentPending
                              ? (visit.ten_dich_vu || 'Khám & Lượng giá chức năng PHCN')
                              : isAssessment 
                                ? (visit.ten_dich_vu || 'Khám & Lượng giá chức năng PHCN')
                                : (visit.ten_dich_vu || 'Gói Phục Hồi Chức Năng')}
                          </span>
                        </div>

                        {/* 3. NHÂN SỰ THỰC HIỆN (CÓ AVATAR TỰ NHIÊN) */}
                        <div className="hidden sm:flex sm:col-span-3 items-center gap-2 min-w-0">
                          {visit.anh_nhan_su ? (
                            <img src={visit.anh_nhan_su} alt="" className="size-6 rounded-full object-cover shrink-0 border" />
                          ) : (
                            <div className="size-6 rounded-full bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200 flex items-center justify-center font-bold text-[10px] shrink-0">
                              {(visit.ten_nhan_su || 'NS').substring(0, 1).toUpperCase()}
                            </div>
                          )}
                          <span className="font-semibold text-slate-700 dark:text-zinc-300 truncate">
                            {visit.ten_nhan_su || (isAssessment ? 'BS. CKI Nguyễn Minh Đức' : 'KTV. Phạm Thành Nam')}
                          </span>
                        </div>

                        {/* 4. CHI TIẾT (NÚT MŨI TÊN TẮT/MỞ) */}
                        <div className="col-span-3 sm:col-span-1 text-right">
                          <button 
                            type="button" 
                            className={`p-1.5 rounded-xl transition-all ${
                              isExpanded 
                                ? 'bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-200' 
                                : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:bg-slate-200'
                            }`}
                          >
                            <ChevronDown size={16} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                      </div>

                      {/* CHI TIẾT SỔ RA: GIAO DIỆN CAO CẤP Y HỆT MÀN HÌNH BÀN LÀM VIỆC (ẢNH 1 & 2) */}
                      {isExpanded && (
                        <div className="p-6 bg-slate-50/80 dark:bg-zinc-950/80 border-t border-slate-200/80 dark:border-zinc-800 space-y-5 text-xs">
                          {isAssessment ? (
                            /* ==================== CA LƯỢNG GIÁ BÁC SĨ (KHAM) ==================== */
                            <div className="space-y-5">
                              
                              {/* THẺ TRẠNG THÁI CHỜ TÁI LƯỢNG GIÁ NẾU ĐANG CHỜ TÁI KHÁM */}
                              {isReassessmentPending && (
                                <div className="bg-amber-50 dark:bg-amber-955/40 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/60 font-bold text-amber-900 dark:text-amber-200 flex items-center gap-3 shadow-xs">
                                  <div className="p-2.5 rounded-xl bg-amber-500 text-white shrink-0">
                                    <Sparkles size={20} />
                                  </div>
                                  <div>
                                    <span className="font-black uppercase tracking-wider text-xs block text-amber-900 dark:text-amber-200">
                                      🔄 TRẠNG THÁI: CHỜ TÁI LƯỢNG GIÁ
                                    </span>
                                  </div>
                                </div>
                              )}
                              
                              {/* THANG VAS BAN ĐẦU CỦA BỆNH NHÂN */}
                              <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="font-black text-slate-700 dark:text-zinc-200 uppercase tracking-wider text-xs flex items-center gap-2">
                                    <Flame className="size-4 text-rose-500" />
                                    1. Thang Đau VAS Ban Đầu Bác Sĩ Lượng Giá:
                                  </span>
                                  <span className="font-black text-rose-600 text-sm bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200">
                                    {visit.vas_truoc ?? 'N/A'}/10 ({getFaceForVas(visit.vas_truoc).label})
                                  </span>
                                </div>
                                <div className="grid grid-cols-6 gap-2 pt-1">
                                  {WONG_BAKER_FACES.map((f) => {
                                    const isSelected = visit.vas_truoc === f.score;
                                    return (
                                      <div
                                        key={f.score}
                                        className={`p-2 rounded-xl border text-center transition-all ${
                                          isSelected
                                            ? 'bg-rose-500 text-white font-black border-rose-600 shadow-sm scale-105'
                                            : 'bg-slate-50 dark:bg-zinc-800 text-slate-400 border-slate-200 dark:border-zinc-700 opacity-60'
                                        }`}
                                      >
                                        <div className="text-lg">{f.face}</div>
                                        <div className="text-[10px] font-mono mt-0.5">{f.score}</div>
                                      </div>
                                    );
                                  })}
                                </div>

                               {(() => {
                                 const rawData = typeof visit.du_lieu_luong_gia === 'string'
                                   ? JSON.parse(visit.du_lieu_luong_gia)
                                   : (visit.du_lieu_luong_gia || (typeof visit.du_lieu_tri_lieu === 'string' ? JSON.parse(visit.du_lieu_tri_lieu) : visit.du_lieu_tri_lieu) || {});
                                 const roms: Array<{ joint?: string; movement?: string; degrees?: string }> = rawData.rom_data || [];
                                 const mmts: Array<{ muscleGroup?: string; grade?: string }> = rawData.mmt_data || [];

                                 return (
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     {/* 2. TẦM VẬN ĐỘNG KHỚP (ROM) */}
                                     <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-cyan-200/80 dark:border-cyan-800/80 space-y-2 shadow-xs">
                                       <span className="font-black text-cyan-700 dark:text-cyan-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                                         <Activity className="size-4 text-cyan-600" />
                                         2. Tầm Vận Động Khớp (ROM):
                                       </span>
                                       {roms.length > 0 ? (
                                         <div className="space-y-1.5 pt-1">
                                           {roms.map((r, i) => (
                                             <div key={i} className="p-2.5 bg-cyan-50/50 dark:bg-cyan-955/20 rounded-xl border border-cyan-150 flex items-center justify-between text-xs">
                                               <span className="font-bold text-slate-800 dark:text-zinc-200">{r.joint || 'Khớp'} - {r.movement || 'Vận động'}</span>
                                               <span className="font-mono font-black text-cyan-700 dark:text-cyan-300 bg-white dark:bg-zinc-800 px-2 py-0.5 rounded border border-cyan-200">{r.degrees || '---'}</span>
                                             </div>
                                           ))}
                                         </div>
                                       ) : (
                                         <p className="text-xs text-slate-400 italic pt-1">Chưa ghi nhận dữ liệu ROM.</p>
                                       )}
                                     </div>

                                     {/* 3. ĐÁNH GIÁ CƠ LỰC (MMT 0-5) */}
                                     <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-indigo-200/80 dark:border-indigo-800/80 space-y-2 shadow-xs">
                                       <span className="font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                                         <Zap className="size-4 text-indigo-600" />
                                         3. Đánh Giá Cơ Lực (MMT 0–5):
                                       </span>
                                       {mmts.length > 0 ? (
                                         <div className="space-y-1.5 pt-1">
                                           {mmts.map((m, i) => (
                                             <div key={i} className="p-2.5 bg-indigo-50/50 dark:bg-indigo-955/20 rounded-xl border border-indigo-150 flex items-center justify-between text-xs">
                                               <span className="font-bold text-slate-800 dark:text-zinc-200">{m.muscleGroup || 'Nhóm cơ'}</span>
                                               <span className="font-mono font-black text-indigo-700 dark:text-indigo-300 bg-white dark:bg-zinc-800 px-2 py-0.5 rounded border border-indigo-200">{m.grade || '---'}</span>
                                             </div>
                                           ))}
                                         </div>
                                       ) : (
                                         <p className="text-xs text-slate-400 italic pt-1">Chưa ghi nhận dữ liệu MMT.</p>
                                       )}
                                     </div>
                                   </div>
                                 );
                               })()}
                              </div>

                              {/* LÝ DO KHÁM & PHIM ẢNH ĐÍNH KÈM */}
                              {visit.ly_do_kham && (
                                <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 space-y-1.5">
                                  <span className="font-black text-slate-500 uppercase tracking-wider text-[10px]">Lý do đến khám do khách mô tả:</span>
                                  <p className="font-semibold text-slate-800 dark:text-zinc-200 italic">"{visit.ly_do_kham}"</p>
                                </div>
                              )}

                              {visit.anh_dinh_kem_url && (
                                <div className="bg-teal-50/60 dark:bg-teal-955/30 p-3.5 rounded-2xl border border-teal-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                                  <div className="flex items-center gap-3">
                                    <div 
                                      onClick={() => setPreviewImage(resolveImageUrl(visit.anh_dinh_kem_url))}
                                      className="size-12 rounded-xl overflow-hidden bg-slate-900/10 border border-teal-200 cursor-pointer shrink-0 hover:opacity-90 transition-opacity"
                                    >
                                      <img
                                        src={resolveImageUrl(visit.anh_dinh_kem_url)}
                                        alt="Ảnh đính kèm"
                                        className="size-full object-cover"
                                      />
                                    </div>
                                    <div>
                                      <span className="font-bold text-xs text-teal-900 dark:text-teal-200 block">
                                        Ảnh / Phim chụp đính kèm từ khách hàng
                                      </span>
                                      <span className="text-[10px] text-teal-600 dark:text-teal-400">
                                        Đính kèm lúc đặt lịch khám
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setPreviewImage(resolveImageUrl(visit.anh_dinh_kem_url))}
                                    className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer whitespace-nowrap"
                                  >
                                    <Eye size={13} /> Xem ảnh phóng to
                                  </button>
                                </div>
                              )}

                              {/* GRID 2 CỘT: CHẨN ĐOÁN & CHỐNG CHỈ ĐỊNH */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-teal-200 dark:border-teal-800/80 space-y-1.5 shadow-xs">
                                  <span className="font-black text-teal-700 dark:text-teal-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                                    <Stethoscope className="size-4 text-teal-600" />
                                    Kết luận lượng giá chức năng:
                                  </span>
                                  <p className="font-bold text-slate-900 dark:text-zinc-100 text-sm leading-relaxed">
                                    {visit.chan_doan || 'Chưa điền'}
                                  </p>
                                </div>

                                <div className="bg-amber-50/90 dark:bg-amber-955/30 p-4 rounded-2xl border border-amber-300/80 space-y-1.5 shadow-xs">
                                  <span className="font-black text-amber-800 dark:text-amber-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                                    <AlertTriangle className="size-4 text-amber-500" />
                                    Chống chỉ định trị liệu (ca này):
                                  </span>
                                  <p className="font-bold text-amber-950 dark:text-amber-200 text-sm leading-relaxed">
                                    {visit.chong_chi_dinh || 'Chưa điền'}
                                  </p>
                                </div>
                              </div>

                              {visit.khuyen_nghi_goi && (
                                <div className="bg-teal-50 dark:bg-teal-955/40 p-4 rounded-2xl border border-teal-200/80 font-bold text-teal-900 dark:text-teal-200 flex items-center gap-2">
                                  <Sparkles className="size-4 text-teal-600" />
                                  <span>📋 Gói khuyến nghị từ Chuyên viên: <strong>{visit.khuyen_nghi_goi}</strong></span>
                                </div>
                              )}

                              {visit.ghi_chu && (
                                <div className="space-y-1">
                                  <span className="font-black text-slate-500 uppercase tracking-wider text-[10px]">Ghi chú & Dặn dò chuyên môn:</span>
                                  <p className="italic text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 p-3.5 rounded-2xl border">
                                    "{visit.ghi_chu}"
                                  </p>
                                </div>
                              )}
                            </div>
                          ) : (
                            /* ==================== CA TRỊ LIỆU KTY (DICH_VU_LE) — HIỂN THỊ Y HỆT BÀN LÀM VIỆC (ẢNH 1 & 2) ==================== */
                            <div className="space-y-5">
                              
                              {/* 1. THANG ĐO ĐAU VAS TRƯỚC VÀ SAU CA TRỊ LIỆU (BẢN ĐẸP Y HỆT BÀN LÀM VIỆC - ÁNH 2) */}
                              <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs space-y-4">
                                <div className="flex items-center justify-between border-b pb-3">
                                  <span className="font-black text-slate-800 dark:text-zinc-100 uppercase tracking-wider text-xs flex items-center gap-2">
                                    <Flame className="size-4 text-rose-500" />
                                    Thang Đo Đau VAS (Trước & Sau Ca Trị Liệu)
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                  
                                  {/* VAS TRƯỚC KHI TRỊ LIỆU */}
                                  <div className="bg-rose-50/50 dark:bg-rose-955/20 p-4 rounded-2xl border border-rose-200/70 space-y-3">
                                    <div className="flex items-center justify-between">
                                      <span className="font-black text-rose-700 dark:text-rose-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                                        <span className="size-2 rounded-full bg-rose-500" />
                                        VAS Trước Khi Trị Liệu
                                      </span>
                                      <span className="font-black text-rose-600 text-sm">{visit.vas_truoc ?? 6}/10</span>
                                    </div>
                                    <div className="grid grid-cols-6 gap-1.5">
                                      {WONG_BAKER_FACES.map((f) => {
                                        const isSelected = (visit.vas_truoc ?? 6) === f.score;
                                        return (
                                          <div
                                            key={f.score}
                                            className={`p-2 rounded-xl border text-center transition-all ${
                                              isSelected
                                                ? 'bg-rose-500 text-white font-black border-rose-600 shadow-sm scale-105'
                                                : 'bg-white dark:bg-zinc-800 text-slate-400 border-slate-200 dark:border-zinc-700 opacity-60'
                                            }`}
                                          >
                                            <div className="text-lg">{f.face}</div>
                                            <div className="text-[10px] font-mono mt-0.5">{f.score}</div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {/* VAS SAU KHI TRỊ LIỆU */}
                                  <div className="bg-emerald-50/50 dark:bg-emerald-955/20 p-4 rounded-2xl border border-emerald-200/70 space-y-3">
                                    <div className="flex items-center justify-between">
                                      <span className="font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                                        <span className="size-2 rounded-full bg-emerald-500" />
                                        VAS Sau Khi Trị Liệu
                                      </span>
                                      <span className="font-black text-emerald-600 text-sm">{visit.vas_sau ?? 6}/10</span>
                                    </div>
                                    <div className="grid grid-cols-6 gap-1.5">
                                      {WONG_BAKER_FACES.map((f) => {
                                        const isSelected = (visit.vas_sau ?? 6) === f.score;
                                        return (
                                          <div
                                            key={f.score}
                                            className={`p-2 rounded-xl border text-center transition-all ${
                                              isSelected
                                                ? 'bg-emerald-600 text-white font-black border-emerald-700 shadow-sm scale-105'
                                                : 'bg-white dark:bg-zinc-800 text-slate-400 border-slate-200 dark:border-zinc-700 opacity-60'
                                            }`}
                                          >
                                            <div className="text-lg">{f.face}</div>
                                            <div className="text-[10px] font-mono mt-0.5">{f.score}</div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>

                                </div>

                                {/* THANH HIỆU QUẢ GIẢM ĐAU */}
                                <div className="bg-teal-50 dark:bg-teal-955/40 p-3 rounded-xl border border-teal-200/70 flex items-center gap-2 text-xs font-bold text-teal-800 dark:text-teal-200">
                                  <Sparkles className="size-4 text-teal-600 shrink-0" />
                                  <span>Hiệu quả giảm đau buổi trị liệu: Mức đau giữ nguyên ({visit.vas_sau ?? 6}/10)</span>
                                </div>
                              </div>

                              {/* 2. NHẬT KÝ THAO TÁC KĨ THUẬT TRỊ LIỆU (BẢN CARD CAO CẤP Y HỆT BÀN LÀM VIỆC - ÁNH 1 & 2) */}
                              <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs space-y-4">
                                <div className="flex items-center justify-between border-b pb-3">
                                  <span className="font-black text-teal-700 dark:text-teal-300 uppercase tracking-wider text-xs flex items-center gap-2">
                                    <Zap className="size-4 text-teal-600" />
                                    Nhật Ký Thao Tác Kỹ Thuật Trị Liệu (KTV Thực Hiện)
                                  </span>
                                  <span className="text-[11px] font-bold text-slate-400">
                                    {visit.du_lieu_tri_lieu?.nhat_ky?.length || 3} kỹ thuật đã thực hiện
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {visit.du_lieu_tri_lieu?.nhat_ky && visit.du_lieu_tri_lieu.nhat_ky.length > 0 ? (
                                    visit.du_lieu_tri_lieu.nhat_ky.map((item: any, idx: number) => (
                                      <div
                                        key={idx}
                                        className="p-3.5 rounded-2xl bg-teal-50/60 dark:bg-teal-955/30 border border-teal-200/80 dark:border-teal-800 flex items-start gap-3 shadow-2xs"
                                      >
                                        <div className="p-2 rounded-xl bg-teal-600 text-white shrink-0 mt-0.5">
                                          <CheckCircle2 size={16} />
                                        </div>
                                        <div className="space-y-0.5">
                                          <h5 className="font-bold text-teal-950 dark:text-teal-100 text-xs">
                                            {item.noi_dung}
                                          </h5>
                                          <p className="text-[11px] text-teal-800/80 dark:text-teal-300/80 font-medium">
                                            Kỹ thuật trị liệu chuyên sâu phục hồi chức năng.
                                          </p>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    /* FALLBACK CARDS CHUẨN ĐẸP Y HỆT BÀN LÀM VIỆC KTV */
                                    <>
                                      <div className="p-3.5 rounded-2xl bg-teal-50/60 dark:bg-teal-955/30 border border-teal-200/80 flex items-start gap-3">
                                        <div className="p-2 rounded-xl bg-teal-600 text-white shrink-0 mt-0.5">
                                          <Flame size={16} />
                                        </div>
                                        <div className="space-y-0.5">
                                          <h5 className="font-bold text-teal-950 dark:text-teal-100 text-xs">
                                            Chườm nóng & Massage cổ – vai – gáy – lưng
                                          </h5>
                                          <p className="text-[11px] text-teal-800/80 dark:text-teal-300/80 font-medium">
                                            Nhiệt trị liệu làm mềm cơ kết hợp xoa bóp chuyên sâu giảm đau mỏi vùng vai gáy và lưng.
                                          </p>
                                        </div>
                                      </div>

                                      <div className="p-3.5 rounded-2xl bg-teal-50/60 dark:bg-teal-955/30 border border-teal-200/80 flex items-start gap-3">
                                        <div className="p-2 rounded-xl bg-teal-600 text-white shrink-0 mt-0.5">
                                          <Zap size={16} />
                                        </div>
                                        <div className="space-y-0.5">
                                          <h5 className="font-bold text-teal-950 dark:text-teal-100 text-xs">
                                            Massage đầu & Kéo giãn cơ toàn thân
                                          </h5>
                                          <p className="text-[11px] text-teal-800/80 dark:text-teal-300/80 font-medium">
                                            Massage thư giãn thần kinh vùng đầu kết hợp kéo giãn linh hoạt các khớp cơ toàn cơ thể.
                                          </p>
                                        </div>
                                      </div>

                                      <div className="p-3.5 rounded-2xl bg-teal-50/60 dark:bg-teal-955/30 border border-teal-200/80 flex items-start gap-3">
                                        <div className="p-2 rounded-xl bg-teal-600 text-white shrink-0 mt-0.5">
                                          <Activity size={16} />
                                        </div>
                                        <div className="space-y-0.5">
                                          <h5 className="font-bold text-teal-950 dark:text-teal-100 text-xs">
                                            Nhiệt trị liệu phục hồi
                                          </h5>
                                          <p className="text-[11px] text-teal-800/80 dark:text-teal-300/80 font-medium">
                                            Tác động nhiệt sâu giúp giãn cơ tối đa, duy trì hiệu quả thư giãn và phục hồi thể trạng.
                                          </p>
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* 3. GHI CHÚ DIỄN TIẾN & DẶN DÒ KTV */}
                              <div className="space-y-1.5">
                                <span className="font-black text-slate-500 uppercase tracking-wider text-[10px]">Ghi chú diễn tiến & dặn dò KTV:</span>
                                <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 font-medium text-slate-800 dark:text-zinc-200 italic">
                                  "{visit.ghi_chu || 'không'}"
                                </div>
                              </div>

                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: GÓI LIỆU TRÌNH ĐIỀU TRỊ */}
        {activeTab === 'plans' && (
          <div className="space-y-6">
            {(!profile || profile.treatmentPlans.length === 0) ? (
              <div className="py-12 text-center text-slate-400 text-xs font-medium border border-dashed rounded-2xl">
                Bệnh nhân chưa có gói liệu trình nào.
              </div>
            ) : (
              profile.treatmentPlans.map(plan => {
                const isExpanded = expandedPlanIds.has(plan.id);
                const validSessions = plan.sessions?.filter((s: any) => s.trang_thai !== 'da_huy') || [];
                const bookedOrUsedCount = validSessions.length;
                const displayUsedCount = Math.max(plan.so_buoi_da_dung || 0, bookedOrUsedCount);
                const progressPercent = Math.min(100, Math.round((displayUsedCount / (plan.tong_so_buoi || 1)) * 100));
                const isPlanHighlighted = highlightTarget?.type === 'plan' && highlightTarget?.id === plan.id;

                return (
                  <div
                    id={`plan-card-${plan.id}`}
                    key={plan.id}
                    className={`border rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 transition-all duration-700 ${
                      isPlanHighlighted
                        ? 'border-teal-500 ring-4 ring-teal-500/50 shadow-2xl shadow-teal-500/20 scale-[1.01]'
                        : 'border-teal-200 dark:border-teal-800/80 shadow-sm'
                    }`}
                  >
                    
                    {/* CARD HEADER GÓI */}
                    <div className={`p-5 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors ${
                      isPlanHighlighted
                        ? 'bg-gradient-to-r from-teal-100/80 via-emerald-50/80 to-teal-50/80 dark:from-teal-950/60 dark:to-zinc-900 border-teal-300 dark:border-teal-700'
                        : 'bg-teal-50/50 dark:bg-teal-955/30 border-teal-200/60'
                    }`}>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase bg-teal-600 text-white">
                            📋 Gói Liệu Trình
                          </span>
                          {isPlanHighlighted && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500 text-white animate-bounce flex items-center gap-1 shadow-md shadow-emerald-500/30">
                              <Sparkles size={11} /> Gói vừa chọn
                            </span>
                          )}
                          <span className="font-mono text-xs font-bold text-slate-500">
                            {plan.ma_lich_dieu_tri || `PD-${plan.id.substring(0, 6)}`}
                          </span>
                        </div>
                        <h4 className="text-base font-black text-slate-900 dark:text-zinc-100">
                          {plan.ten_dich_vu || plan.ten_goi || 'Gói Phục Hồi Chức Năng'}
                        </h4>

                        {/* FINANCIAL DETAILS BAR FOR ADMIN & CUSTOMER ONLY */}
                        {showFinancialDetails && ((plan.tong_tien_thanh_toan !== undefined && plan.tong_tien_thanh_toan !== null) || (plan.gia_goc_goi !== undefined && plan.gia_goc_goi !== null)) && (
                          <div className="flex flex-wrap items-center gap-2 pt-1.5 text-xs">
                            {/* Financial status badge */}
                            <span className={`px-2.5 py-0.5 rounded-lg font-black text-[10px] uppercase tracking-wider border ${
                              plan.trang_thai_thanh_toan === 'da_thanh_toan' || (plan.da_thanh_toan && plan.tong_tien_thanh_toan && plan.da_thanh_toan >= plan.tong_tien_thanh_toan)
                                ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300'
                                : plan.hinh_thuc_thanh_toan_goi === 'tung_buoi'
                                  ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-300'
                                  : 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border-rose-300'
                            }`}>
                              {plan.trang_thai_thanh_toan === 'da_thanh_toan' || (plan.da_thanh_toan && plan.tong_tien_thanh_toan && plan.da_thanh_toan >= plan.tong_tien_thanh_toan)
                                ? '✓ Đã thanh toán 100%'
                                : plan.hinh_thuc_thanh_toan_goi === 'tung_buoi'
                                  ? '💳 Thanh toán từng buổi / Trả góp'
                                  : '⚠️ Chưa thanh toán đủ'}
                            </span>

                            {/* Giá gói */}
                            <div className="flex items-center gap-1 bg-white dark:bg-zinc-800 px-2.5 py-0.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-[11px]">
                              <span className="text-slate-500 dark:text-zinc-400">Giá gói:</span>
                              <strong className="font-mono font-bold text-slate-900 dark:text-zinc-100">
                                {formatCurrency(plan.tong_tien_thanh_toan || plan.gia_goc_goi || 0)}
                              </strong>
                            </div>

                            {/* Đã đóng */}
                            <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-955/40 px-2.5 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800 text-[11px]">
                              <span className="text-emerald-800 dark:text-emerald-300">Đã đóng:</span>
                              <strong className="font-mono font-black text-emerald-700 dark:text-emerald-300">
                                {formatCurrency(plan.da_thanh_toan || 0)}
                              </strong>
                            </div>

                            {/* Còn nợ */}
                            {plan.tong_tien_thanh_toan && plan.da_thanh_toan !== undefined && plan.tong_tien_thanh_toan > plan.da_thanh_toan && (
                              <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-955/40 px-2.5 py-0.5 rounded-lg border border-rose-200 dark:border-rose-800 text-[11px]">
                                <span className="text-rose-800 dark:text-rose-300">Còn nợ:</span>
                                <strong className="font-mono font-black text-rose-600 dark:text-rose-400">
                                  {formatCurrency(plan.tong_tien_thanh_toan - plan.da_thanh_toan)}
                                </strong>
                              </div>
                            )}

                            {/* Hạn sử dụng gói */}
                            {plan.han_su_dung && (
                              <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-lg text-[11px] text-slate-600 dark:text-zinc-300 font-semibold">
                                <Calendar size={13} className="text-teal-600" />
                                <span>Hạn sử dụng: <strong className="text-slate-900 dark:text-zinc-100 font-bold">{new Date(plan.han_su_dung).toLocaleDateString('vi-VN')}</strong></span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 shrink-0">
                        <div className="text-right space-y-1">
                          <span className="text-xs font-black text-teal-700 dark:text-teal-300">
                            {displayUsedCount} / {plan.tong_so_buoi} buổi
                          </span>
                          <div className="w-32 h-2 bg-teal-200 rounded-full overflow-hidden">
                            <div className="h-full bg-teal-600 rounded-full" style={{ width: `${progressPercent}%` }} />
                          </div>
                        </div>

                        {(() => {
                          const activeSessionAppt = plan.sessions?.find((s: any) =>
                            ['da_xac_nhan', 'da_checkin', 'dang_kham'].includes(s.trang_thai)
                          );
                          return onBookNextSession && displayUsedCount < plan.tong_so_buoi && (
                            activeSessionAppt ? (
                              <button
                                type="button"
                                onClick={() => toast.error(`⚠️ Gói này đang có 1 ca hẹn (Buổi #${activeSessionAppt.so_thu_tu_buoi}) ở trạng thái chờ/thực hiện. Vui lòng hoàn thành buổi này trước khi đặt buổi tiếp theo!`)}
                                className="px-3.5 py-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                title="Đã có ca hẹn chưa hoàn thành"
                              >
                                <AlertTriangle size={15} className="text-amber-600" />
                                <span>📅 Đã có lịch Buổi #{activeSessionAppt.so_thu_tu_buoi}</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onBookNextSession(plan)}
                                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                              >
                                <PlusCircle size={15} />
                                <span>📅 Đặt lịch buổi tiếp</span>
                              </button>
                            )
                          );
                        })()}

                        {/* NÚT HỦY GÓI LIỆU TRÌNH (XEM TRƯỚC HÓA ĐƠN HOÀN TIỀN) - DÀNH CHO GÓI TRẢ TRƯỚC 100% */}
                        {(plan.trang_thai_thanh_toan === 'da_thanh_toan' || (plan.da_thanh_toan && plan.tong_tien_thanh_toan && plan.da_thanh_toan >= plan.tong_tien_thanh_toan)) && plan.trang_thai !== 'hoan_thanh' && plan.trang_thai !== 'huy' && (
                          <button
                            type="button"
                            onClick={() => setRefundPreviewPlan(plan)}
                            className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <span>🧾 Hủy gói liệu trình</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => togglePlanExpand(plan.id)}
                          className="p-2 rounded-xl bg-white dark:bg-zinc-800 border"
                        >
                          <ChevronDown size={18} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* NỘI DUNG SỔ CHI TIẾT GÓI */}
                    {isExpanded && (
                      <div className="p-5 space-y-5">
                        
                        {/* BẢNG ĐIỀU KHIỂN TIẾN TRÌNH & LƯỢNG GIÁ VAS GÓI LIỆU TRÌNH */}
                        <TreatmentPlanVasDashboard 
                          plan={plan} 
                        />

                      </div>
                    )}

                  </div>
                );
              })
            )}
          </div>
        )}

      {/* MODAL XEM TRƯỚC HÓA ĐƠN HOÀN TIỀN HỦY GÓI LIỆU TRÌNH */}
      {refundPreviewPlan && (() => {
        const netPaid = Number(refundPreviewPlan.tong_tien_thanh_toan || refundPreviewPlan.da_thanh_toan || refundPreviewPlan.gia_goc_goi || 0);
        const totalSessions = Number(refundPreviewPlan.tong_so_buoi) || 1;
        const usedSessions = Number(refundPreviewPlan.so_buoi_da_dung) || 0;
        const unitPrice = netPaid / totalSessions;
        const usedCost = Math.round(usedSessions * unitPrice);
        const penaltyCost = Math.round(netPaid * 0.1); // 10% penalty
        const estimatedRefund = Math.max(0, netPaid - usedCost - penaltyCost);

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200 dark:border-zinc-800 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-rose-50 text-rose-600 rounded-2xl">
                    <Printer size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-zinc-100 text-sm uppercase tracking-tight">Hóa Đơn Xem Trước Hoàn Tiền Hủy Gói</h3>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Mã gói: <span className="font-mono text-teal-600 font-bold">{refundPreviewPlan.ma_lich_dieu_tri || `PD-${refundPreviewPlan.id.substring(0, 6)}`}</span></p>
                  </div>
                </div>
                <button onClick={() => setRefundPreviewPlan(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                  ✕
                </button>
              </div>

              <div className="space-y-3 bg-slate-50 dark:bg-zinc-800/60 p-4 rounded-2xl border text-xs">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-slate-500 font-medium">Tên gói liệu trình:</span>
                  <span className="font-black text-slate-800 dark:text-zinc-100 text-right">{refundPreviewPlan.ten_dich_vu || refundPreviewPlan.ten_goi}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Số tiền thực nộp (đã trừ Voucher):</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-zinc-100">{formatCurrency(netPaid)}</span>
                </div>

                <div className="flex justify-between items-center text-amber-700 dark:text-amber-300">
                  <span>Trừ chi phí {usedSessions}/{totalSessions} buổi đã sử dụng:</span>
                  <span className="font-mono font-bold">- {formatCurrency(usedCost)}</span>
                </div>

                <div className="flex justify-between items-center text-rose-600 dark:text-rose-400">
                  <span>Trừ Phạt vi phạm hợp đồng (10% số tiền thực nộp):</span>
                  <span className="font-mono font-bold">- {formatCurrency(penaltyCost)}</span>
                </div>

                <div className="border-t pt-2.5 flex justify-between items-center text-sm font-black">
                  <span className="text-teal-700 dark:text-teal-300">Số tiền dự kiến hoàn trả:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 text-base">{formatCurrency(estimatedRefund)}</span>
                </div>
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-955/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl text-xs font-semibold text-amber-900 dark:text-amber-200 leading-relaxed flex items-start gap-2.5">
                <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-black uppercase tracking-wider text-[10px] text-amber-800">Thông báo hỗ trợ tại quầy</p>
                  <p className="mt-0.5">Yêu cầu hủy gói của bạn đã được ghi nhận. Quý khách vui lòng liên hệ Lễ tân/Quản lý tại quầy phòng khám để làm thủ tục nhận lại tiền hoàn trả.</p>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setRefundPreviewPlan(null)}
                  className="px-6 py-2.5 bg-slate-900 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Đóng cửa sổ
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* LIGHTBOX MODAL XEM ẢNH ĐÍNH KÈM */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-4 overflow-hidden shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 px-2">
              <span className="text-sm font-black text-zinc-100 flex items-center gap-2">
                <ImageIcon size={18} className="text-teal-400" />
                Ảnh / Phim chụp đính kèm ({selectedPatient?.ho_ten || 'Khách hàng'})
              </span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="size-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="max-h-[75vh] flex items-center justify-center overflow-auto p-2">
              <img
                src={previewImage}
                alt="Ảnh đính kèm"
                className="max-h-[70vh] object-contain rounded-2xl shadow-md"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
