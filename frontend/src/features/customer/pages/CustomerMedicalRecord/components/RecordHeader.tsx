import { Phone, Mail } from 'lucide-react';
import { formatPhone } from '../../../../../utils/format';
import { getReputationTier } from '../../../../../utils/reputation';
import type { RecordCustomer, PackageEntry } from '../types';

interface RecordHeaderProps {
  khachHang: RecordCustomer;
  goiDieuTri: PackageEntry[];
}

const TIER_META: Record<string, { label: string; dot: string }> = {
  low: { label: 'Cần lưu ý', dot: '#FB7185' },
  mid: { label: 'Ổn định', dot: '#F0A93B' },
  high: { label: 'Xuất sắc', dot: '#34D399' },
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Thay banner "Khách Hàng Thân Thiết / VIP" (text cứng, không đọc dữ liệu thật) bằng dữ liệu thật:
// điểm uy tín (khach_hang.diem_uy_tin) đặt nhỏ gọn làm phụ, và 3 chỉ số hành trình phục hồi thật
// làm trọng tâm — đúng thứ khách quan tâm nhất khi mở trang, thay vì 1 badge trang trí vô nghĩa.
export function RecordHeader({ khachHang, goiDieuTri }: RecordHeaderProps) {
  const tier = getReputationTier(khachHang.diem_uy_tin || 0);
  const tierMeta = TIER_META[tier];

  const completedSessions = goiDieuTri.reduce(
    (acc, pkg) => acc + pkg.buoi_dieu_tri.filter((s) => s.trang_thai === 'hoan_thanh').length,
    0
  );
  const activePackages = goiDieuTri.filter((pkg) => pkg.trang_thai_phac_do === 'dang_dieu_tri').length;
  const lastSessionDate = goiDieuTri
    .flatMap((pkg) => pkg.buoi_dieu_tri)
    .filter((s) => s.trang_thai === 'hoan_thanh')
    .map((s) => new Date(s.ngay_gio_bat_dau))
    .sort((a, b) => b.getTime() - a.getTime())[0];

  return (
    <div className="relative overflow-hidden rounded-[28px] p-7 md:p-8 text-white shadow-lg bg-gradient-to-br from-secondary via-[#16223D] to-secondary">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(480px 260px at 88% -10%, rgba(46,196,182,0.25), transparent 70%)' }}
      />

      <div className="relative flex flex-wrap items-start justify-between gap-5">
        <div className="flex items-center gap-3.5">
          <div className="size-12 rounded-2xl bg-primary/15 border border-primary/35 text-primary flex items-center justify-center font-heading font-black text-lg shrink-0">
            {getInitials(khachHang.ho_ten || '?')}
          </div>
          <div>
            <h1 className="font-heading text-xl md:text-2xl font-black tracking-tight">{khachHang.ho_ten}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/60 font-semibold mt-1">
              {khachHang.so_dien_thoai && (
                <span className="flex items-center gap-1.5"><Phone size={13} /> {formatPhone(khachHang.so_dien_thoai)}</span>
              )}
              {khachHang.email && (
                <span className="flex items-center gap-1.5"><Mail size={13} /> {khachHang.email}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white/8 border border-white/10 rounded-full pl-2 pr-3.5 py-1.5 shrink-0">
          <span className="size-2 rounded-full shrink-0" style={{ background: tierMeta.dot, boxShadow: `0 0 0 3px ${tierMeta.dot}40` }} />
          <span className="text-[11px] font-bold text-white/85">
            Điểm uy tín <strong className="text-white font-black">{Math.min(100, khachHang.diem_uy_tin || 0)}</strong>/100 · {tierMeta.label}
          </span>
        </div>
      </div>

      <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-px mt-6 bg-white/8 rounded-2xl overflow-hidden">
        <div className="bg-white/[0.03] px-4.5 py-4">
          <div className="font-heading text-xl font-black tabular-nums">{completedSessions}</div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-white/45 mt-0.5">Buổi đã hoàn thành</div>
        </div>
        <div className="bg-white/[0.03] px-4.5 py-4">
          <div className="font-heading text-xl font-black tabular-nums">{activePackages}</div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-white/45 mt-0.5">Liệu trình đang điều trị</div>
        </div>
        <div className="bg-white/[0.03] px-4.5 py-4">
          <div className="font-heading text-xl font-black tabular-nums">
            {lastSessionDate ? lastSessionDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : '—'}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-white/45 mt-0.5">Buổi trị liệu gần nhất</div>
        </div>
      </div>
    </div>
  );
}

export default RecordHeader;
