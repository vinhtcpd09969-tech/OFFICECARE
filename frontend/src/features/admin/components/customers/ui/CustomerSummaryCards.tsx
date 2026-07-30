import { Users, ClipboardX, X, Sparkles } from 'lucide-react';
import type { CustomerRecordFilter } from '../hooks/useCustomerFilters';

interface CustomerSummaryCardsProps {
  totalCustomers: number;
  customersWithoutRecord: number;
  activeFilter: CustomerRecordFilter;
  onFilterChange: (filter: CustomerRecordFilter) => void;
}

export function CustomerSummaryCards({
  totalCustomers,
  customersWithoutRecord,
  activeFilter,
  onFilterChange,
}: CustomerSummaryCardsProps) {
  const isNoRecordActive = activeFilter === 'no_record';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 font-jakarta">
      {/* 1. Card Tổng Khách Hàng */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-6 rounded-[28px] border border-slate-200/80 dark:border-slate-800/80 shadow-xl shadow-slate-200/40 dark:shadow-none flex items-center justify-between transition-all duration-300 hover:border-teal-500/40">
        <div className="flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 flex items-center justify-center shrink-0 shadow-sm">
            <Users size={24} />
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
              TỔNG KHÁCH HÀNG TÀI KHOẢN
            </span>
            <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
              {totalCustomers}
              <span className="text-xs font-bold text-slate-400 ml-1.5 font-normal">hồ sơ</span>
            </div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <Sparkles size={11} className="text-teal-500" />
              Tất cả tài khoản khách hàng trong hệ thống
            </p>
          </div>
        </div>
      </div>

      {/* 2. Card Chưa Có Hồ Sơ Điều Trị */}
      <div
        onClick={() => {
          if (!isNoRecordActive) {
            onFilterChange('no_record');
          }
        }}
        className={`relative bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-6 rounded-[28px] border transition-all duration-300 flex items-center justify-between select-none ${
          isNoRecordActive
            ? 'border-amber-500/80 ring-4 ring-amber-500/10 shadow-xl shadow-amber-500/10'
            : 'border-slate-200/80 dark:border-slate-800/80 hover:border-amber-500/40 shadow-xl shadow-slate-200/40 dark:shadow-none hover:-translate-y-0.5 cursor-pointer'
        }`}
      >
        {/* Nút X bỏ lọc */}
        {isNoRecordActive && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFilterChange('all');
            }}
            title="Bỏ lọc, quay về tất cả khách hàng"
            className="absolute top-4 right-4 size-7 rounded-full flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-all cursor-pointer shadow-sm active:scale-90"
          >
            <X size={14} className="stroke-[2.5]" />
          </button>
        )}

        <div className="flex items-center gap-4 pr-6">
          <div className="w-13 h-13 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0 shadow-sm">
            <ClipboardX size={24} />
          </div>
          <div>
            <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest block">
              CHƯA TẠO HỒ SƠ ĐIỀU TRỊ
            </span>
            <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
              {customersWithoutRecord}
              <span className="text-xs font-bold text-slate-400 ml-1.5 font-normal">khách hàng</span>
            </div>
            <p className={`text-[11px] font-bold mt-1 ${isNoRecordActive ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>
              {isNoRecordActive ? '⚡ Đang lọc danh sách — Bấm ✖ để xem tất cả' : 'Nhấp để xem danh sách khách hàng mới chưa tạo hồ sơ'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
