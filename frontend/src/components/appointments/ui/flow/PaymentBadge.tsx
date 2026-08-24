import { User2 } from 'lucide-react';
import { Appointment, Staff } from '../../types';
import { isPaymentDue } from '../../../../utils/billing';
import { resolveImageUrl } from '../../../../utils/imageUrl';

export function PaymentBadge({ apt }: { apt: Appointment }) {
  if (apt.trang_thai_thanh_toan === 'dang_cho_thanh_toan') {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-955/20 text-amber-700 dark:text-amber-450 border border-amber-150 dark:border-amber-900/30 whitespace-nowrap">
        ⏳ Đang xác nhận
      </span>
    );
  }
  const due = isPaymentDue(apt);
  if (due) {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-955/20 text-rose-700 dark:text-rose-455 border border-rose-150 dark:border-rose-900/30 whitespace-nowrap">
        ⚠ Chưa thu
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-955/20 text-emerald-700 dark:text-emerald-450 border border-emerald-150 dark:border-emerald-900/30 whitespace-nowrap">
      ✓ Đã thu
    </span>
  );
}

export function StaffCell({ apt, staffList }: { apt: Appointment; staffList: Staff[] }) {
  const name = apt.ten_ky_thuat_vien;
  if (!name) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="size-6 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
          <User2 size={11} className="text-slate-350 dark:text-zinc-600" />
        </div>
        <span className="text-[10px] text-slate-400 dark:text-zinc-550 italic">Bất kỳ</span>
      </div>
    );
  }
  const staff = staffList.find((s) => String(s.id) === String(apt.bac_si_id));
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      {staff?.anh_dai_dien ? (
        <img
          src={resolveImageUrl(staff.anh_dai_dien)}
          alt={name}
          className="size-6 rounded-full object-cover shrink-0 border border-slate-200 dark:border-zinc-700"
        />
      ) : (
        <div className="size-6 rounded-full bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 flex items-center justify-center text-[9px] font-black shrink-0">
          {(name.trim().split(/\s+/).pop() || name)[0]}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-slate-700 dark:text-zinc-300 truncate">{name}</p>
        {apt.ten_phong && (
          <p className="text-[9px] text-slate-400 dark:text-zinc-550 truncate">{apt.ten_phong}</p>
        )}
      </div>
    </div>
  );
}
