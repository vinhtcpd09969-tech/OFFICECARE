import { useEffect, useState } from 'react';
import api from '../../../../api/axios';
import { Crown, DollarSign } from 'lucide-react';

interface VipCustomer {
  id: string;
  name: string;
  phone: string;
  total_paid: number;
}

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0
});

export function TopVipCustomers() {
  const [data, setData] = useState<VipCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVipCustomers();
  }, []);

  const fetchVipCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/analytics/top-vip-customers');
      setData(res.data || []);
    } catch (error) {
      console.error('Error fetching VIP customers:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="bg-white p-6 md:p-8 rounded-[32px] border border-zinc-100/80 shadow-soft-ui flex flex-col justify-between opacity-0 animate-slide-up h-full min-h-[300px]"
      style={{ animationDelay: '380ms' }}
    >
      <div>
        <div className="flex items-center justify-between mb-6 border-b border-zinc-50 pb-4">
          <div className="flex items-center gap-2">
            <Crown className="text-teal-650 shrink-0 animate-pulse" size={18} />
            <h3 className="text-sm font-extrabold text-secondary">Top 5 Khách Hàng VIP</h3>
          </div>
          <span className="text-[9px] font-black uppercase text-teal-650 bg-teal-50 px-2 py-0.5 rounded-md">
            Doanh số đóng góp
          </span>
        </div>

        {loading ? (
          <div className="text-zinc-400 text-xs font-bold animate-pulse text-center py-12">Đang tải danh sách...</div>
        ) : data.length === 0 ? (
          <div className="text-zinc-400 text-xs italic text-center py-12 font-bold">Chưa có dữ liệu thanh toán.</div>
        ) : (
          <div className="space-y-3.5">
            {data.map((cust, idx) => {
              const rank = idx + 1;
              const rankColor = 
                rank === 1 
                  ? 'text-amber-500 bg-amber-50' 
                  : rank === 2 
                    ? 'text-slate-500 bg-slate-50' 
                    : rank === 3 
                      ? 'text-orange-500 bg-orange-50/50' 
                      : 'text-zinc-400 bg-zinc-50';

              return (
                <div 
                  key={cust.id} 
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-zinc-50/50 transition-colors duration-200"
                >
                  <div className="flex items-center gap-3">
                    {/* Rank Circle */}
                    <div className={`size-7 rounded-lg flex items-center justify-center font-extrabold text-[10px] shrink-0 ${rankColor}`}>
                      {rank === 1 ? '👑' : rank}
                    </div>

                    <div className="min-w-0">
                      <p className="font-extrabold text-secondary text-xs truncate max-w-[110px]">{cust.name}</p>
                      <p className="text-[10px] text-zinc-400 font-bold mt-0.5">{cust.phone || 'Không có SĐT'}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-teal-650 flex items-center justify-end gap-0.5">
                      <DollarSign size={10} className="stroke-[2.5]" />
                      {currencyFormatter.format(cust.total_paid).replace('₫', 'đ')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
