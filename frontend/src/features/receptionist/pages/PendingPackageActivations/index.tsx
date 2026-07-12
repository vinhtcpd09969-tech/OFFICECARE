import { useEffect, useState } from 'react';
import { Search, Loader2, Package, Clock } from 'lucide-react';
import { format, differenceInCalendarDays } from 'date-fns';
import { searchCustomers, getPendingPackageActivations } from '../../api/receptionist.api';

interface Customer {
  id: string;
  ho_ten: string;
  so_dien_thoai: string | null;
}

interface PendingActivation {
  cuoc_hen_id: string;
  ngay_kham: string;
  han_kich_hoat: string;
  goi_dich_vu_id: string;
  ten_goi: string;
  loai_goi: string;
  gia_tien: number;
  tong_so_buoi: number;
}

export default function PendingPackageActivations() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [activations, setActivations] = useState<PendingActivation[]>([]);
  const [loadingActivations, setLoadingActivations] = useState(false);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await searchCustomers(searchQuery);
        setSearchResults(res.data || []);
      } catch (err) {
        console.error('Lỗi tìm kiếm khách hàng:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleSelectCustomer = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setSearchQuery('');
    setSearchResults([]);
    setLoadingActivations(true);
    try {
      const res = await getPendingPackageActivations(customer.id);
      setActivations(res.data || []);
    } catch (err) {
      console.error('Lỗi tải danh sách chỉ định chờ kích hoạt:', err);
      setActivations([]);
    } finally {
      setLoadingActivations(false);
    }
  };

  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    setActivations([]);
  };

  const handleActivate = (cuocHenId: string) => {
    window.location.href = `/receptionist/billing?lich_dat_id=${cuocHenId}&dang_ky_goi=true`;
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-semibold text-secondary tracking-tight">Chỉ định gói chờ kích hoạt</h1>
        <p className="text-zinc-500 mt-1">
          Tra cứu khách hàng đã được bác sĩ chỉ định gói liệu trình/dịch vụ lẻ trong buổi khám nhưng chưa thanh toán để kích hoạt.
        </p>
      </div>

      <div className="bg-white border border-zinc-100 rounded-2xl p-5 shadow-sm max-w-xl">
        {!selectedCustomer ? (
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search size={16} />
            </div>
            <input
              type="text"
              placeholder="Tìm khách hàng bằng Tên hoặc Số điện thoại (tối thiểu 2 ký tự)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold"
            />
            {searchLoading && (
              <div className="absolute inset-y-0 right-3 flex items-center">
                <Loader2 className="animate-spin text-slate-400" size={16} />
              </div>
            )}
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-150 rounded-2xl shadow-xl max-h-56 overflow-y-auto z-50 divide-y divide-slate-100">
                {searchResults.map((cust) => (
                  <div
                    key={cust.id}
                    onClick={() => handleSelectCustomer(cust)}
                    className="p-3 hover:bg-slate-55 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div>
                      <p className="text-xs font-black text-slate-800">{cust.ho_ten}</p>
                      <p className="text-[10px] text-slate-455 font-mono mt-0.5">{cust.so_dien_thoai || 'Không có SĐT'}</p>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Chọn</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-black text-slate-800">{selectedCustomer.ho_ten}</p>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">{selectedCustomer.so_dien_thoai || 'Không có SĐT'}</p>
            </div>
            <button
              onClick={handleClearCustomer}
              className="text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors"
            >
              Đổi khách hàng
            </button>
          </div>
        )}
      </div>

      {selectedCustomer && (
        <div className="space-y-4 max-w-2xl">
          {loadingActivations ? (
            <div className="text-zinc-500 text-sm p-4">Đang tải...</div>
          ) : activations.length === 0 ? (
            <div className="bg-white border border-dashed border-zinc-200 rounded-2xl p-6 text-center text-sm text-zinc-500">
              Khách hàng này không có chỉ định gói nào đang chờ kích hoạt (hoặc đã hết hạn kích hoạt).
            </div>
          ) : (
            activations.map((item) => {
              const daysLeft = differenceInCalendarDays(new Date(item.han_kich_hoat), new Date());
              const urgent = daysLeft <= 3;
              return (
                <div
                  key={item.cuoc_hen_id}
                  className="bg-white border border-amber-200 bg-gradient-to-r from-amber-50/70 via-amber-50/30 to-white rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="size-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm bg-amber-100 text-amber-700">
                      <Package size={18} className="stroke-[2.5]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-800">
                        {item.ten_goi} {item.tong_so_buoi > 1 ? `(${item.tong_so_buoi} buổi)` : ''}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                        Giá {formatCurrency(item.gia_tien)} • Khám ngày {format(new Date(item.ngay_kham), 'dd/MM/yyyy')}
                      </p>
                      <p className={`text-[10px] font-bold mt-1 flex items-center gap-1 ${urgent ? 'text-red-600' : 'text-amber-700'}`}>
                        <Clock size={11} />
                        {daysLeft > 0 ? `Còn ${daysLeft} ngày để kích hoạt` : 'Hết hạn hôm nay'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleActivate(item.cuoc_hen_id)}
                    className="px-4.5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black shadow-md shadow-amber-500/10 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <span>💵 Thanh toán & Kích hoạt gói</span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
