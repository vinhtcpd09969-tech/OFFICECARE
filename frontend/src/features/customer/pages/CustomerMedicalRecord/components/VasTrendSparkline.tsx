import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { TrendingDown, TrendingUp } from 'lucide-react';
import type { SessionEntry } from '../types';

interface VasTrendSparklineProps {
  sessions: SessionEntry[];
}

// Điểm nhấn riêng của trang: vẽ xu hướng thang đau (VAS sau buổi) qua các buổi đã có nhật ký —
// thay vì chỉ hiện 2 số tĩnh mỗi buổi, khách thấy được cả đường cong giảm đau theo thời gian.
// Buổi đã hoàn thành nhưng chưa có nhật ký (vas_sau null) bị loại khỏi đường vẽ, không giả số liệu.
export function VasTrendSparkline({ sessions }: VasTrendSparklineProps) {
  const points = sessions
    .filter((s) => s.vas_sau !== null && s.vas_sau !== undefined)
    .sort((a, b) => a.so_thu_tu_buoi - b.so_thu_tu_buoi)
    .map((s) => ({ buoi: s.so_thu_tu_buoi, val: Number(s.vas_sau) }));

  if (points.length < 2) {
    return (
      <div className="text-[11px] text-zinc-400 italic py-2">
        Cần ít nhất 2 buổi có nhật ký VAS để vẽ xu hướng.
      </div>
    );
  }

  const first = points[0].val;
  const last = points[points.length - 1].val;
  const improved = last < first;
  const deltaPercent = first > 0 ? Math.round((Math.abs(last - first) / first) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Xu hướng thang đau (VAS)</span>
        {deltaPercent > 0 && (
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 rounded ${
              improved ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'
            }`}
          >
            {improved ? <TrendingDown size={11} /> : <TrendingUp size={11} />}
            {improved ? 'giảm' : 'tăng'} {deltaPercent}%
          </span>
        )}
      </div>
      <div className="h-[46px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
            <defs>
              <linearGradient id="vasSparkFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2EC4B6" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#2EC4B6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="val" stroke="#2EC4B6" strokeWidth={2} dot={{ r: 3, fill: '#2EC4B6' }} fill="url(#vasSparkFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default VasTrendSparkline;
