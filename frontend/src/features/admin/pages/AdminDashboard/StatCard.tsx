import React from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface StatCardProps {
  title: string;
  value: string | number;
  change: string;
  changeColor?: string;
  icon: React.ReactNode;
  color: string;
  delay: string;
  sparklineData?: { val: number }[];
  progressCircle?: { percent: number };
}

export function StatCard({ 
  title, 
  value, 
  change, 
  changeColor, 
  icon, 
  color, 
  delay,
  sparklineData,
  progressCircle
}: StatCardProps) {
  const badgeClass = changeColor || "text-emerald-500 bg-emerald-50/80";
  
  return (
    <div 
      className="bg-white p-6 rounded-3xl border border-zinc-100/80 shadow-soft-ui hover:shadow-soft-ui-hover hover:-translate-y-1 transition-all duration-300 opacity-0 animate-slide-up flex flex-col justify-between"
      style={{ animationDelay: delay }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`size-9 rounded-xl ${color} flex items-center justify-center text-sm shadow-inner`}>
            {icon}
          </div>
          <span className="text-zinc-400 text-[10px] font-black uppercase tracking-wider">{title}</span>
        </div>
        <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg ${badgeClass}`}>
          {change}
        </span>
      </div>

      <div className="flex items-end justify-between mt-2 gap-4">
        <div>
          <h3 className="text-xl font-black text-secondary tracking-tight">{value}</h3>
        </div>

        {/* Circular Progress Ring */}
        {progressCircle && (
          <div className="relative size-12 shrink-0 flex items-center justify-center">
            <svg className="size-full transform -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="18"
                stroke="#F1F5F9"
                strokeWidth="3.5"
                fill="transparent"
              />
              <circle
                cx="24"
                cy="24"
                r="18"
                stroke="#0D9488"
                strokeWidth="3.5"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 18}
                strokeDashoffset={2 * Math.PI * 18 * (1 - progressCircle.percent / 100)}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-[9px] font-black text-secondary">{progressCircle.percent}%</span>
          </div>
        )}

        {/* Mini Sparkline Area Chart */}
        {sparklineData && (
          <div className="w-[85px] h-[35px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData}>
                <defs>
                  <linearGradient id="colorSpark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D9488" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0D9488" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="val" 
                  stroke="#0D9488" 
                  strokeWidth={1.5} 
                  dot={false}
                  fill="url(#colorSpark)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
