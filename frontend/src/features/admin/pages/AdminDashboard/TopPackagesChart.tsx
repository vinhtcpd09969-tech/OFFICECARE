import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import api from '../../../../api/axios';
import { Package } from 'lucide-react';

export function TopPackagesChart() {
  const [data, setData] = useState<{ name: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopPackages();
  }, []);

  const fetchTopPackages = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/analytics/top-packages');
      setData(res.data || []);
    } catch (error) {
      console.error('Error fetching top packages:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="bg-white p-6 md:p-8 rounded-[32px] border border-zinc-100/80 shadow-soft-ui flex flex-col justify-between opacity-0 animate-slide-up"
      style={{ animationDelay: '350ms' }}
    >
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-lg font-extrabold text-secondary flex items-center gap-2">
              <Package size={20} className="text-teal-600 shrink-0" />
              Top 5 Gói Dịch Vụ
            </h3>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">Xếp hạng theo lượt khách chọn sử dụng</p>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-[280px] w-full flex items-center justify-center mt-2">
        {loading ? (
          <div className="text-zinc-400 text-xs font-bold animate-pulse">Đang tải biểu đồ...</div>
        ) : data.length === 0 ? (
          <div className="text-zinc-400 text-xs italic font-bold">Chưa ghi nhận dữ liệu sử dụng.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              layout="vertical"
              data={data} 
              margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="4 4" horizontal={false} stroke="#E2E8F0" />
              <XAxis 
                type="number"
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94A3B8', fontSize: 9, fontWeight: 'bold' }} 
              />
              <YAxis 
                type="category"
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#475569', fontSize: 9, fontWeight: 'black' }} 
                width={120}
                tickFormatter={(val) => val.length > 18 ? val.substring(0, 18) + '...' : val}
              />
              <Tooltip
                cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }}
                contentStyle={{ 
                  borderRadius: '16px', 
                  border: 'none', 
                  boxShadow: '0 20px 40px -15px rgba(0,0,0,0.08)', 
                  padding: '12px 16px', 
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(4px)'
                }}
                formatter={(val) => [val, 'Lượt chọn']}
              />
              <Bar 
                dataKey="count" 
                fill="#0D9488" 
                radius={[0, 8, 8, 0]} 
                barSize={16}
              >
                {data.map((_, index) => {
                  // Beautiful cascading opacities of Teal for premium look
                  const opacities = [1.0, 0.85, 0.7, 0.55, 0.4];
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill="#0D9488" 
                      fillOpacity={opacities[index % opacities.length]} 
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
