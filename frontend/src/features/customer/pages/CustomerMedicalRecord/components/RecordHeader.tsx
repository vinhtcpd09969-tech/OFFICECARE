import { Phone, Mail, CheckCircle2, Activity, Calendar } from 'lucide-react';
import { formatPhone } from '../../../../../utils/format';
import type { RecordCustomer, PackageEntry, SingleTreatmentEntry, ExamEntry } from '../types';

interface RecordHeaderProps {
  khachHang: RecordCustomer;
  goiDieuTri: PackageEntry[];
  dieuTriLe?: SingleTreatmentEntry[];
  lichSuKham?: ExamEntry[];
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function RecordHeader({ khachHang, goiDieuTri = [], dieuTriLe = [], lichSuKham = [] }: RecordHeaderProps) {
  // 1. Tính tổng tất cả cuộc hẹn ĐÃ HOÀN THÀNH của khách hàng (gói + lẻ + khám)
  const packageCompletedCount = goiDieuTri.reduce(
    (acc, pkg) => acc + pkg.buoi_dieu_tri.filter((s) => s.trang_thai === 'hoan_thanh').length,
    0
  );
  const singleCompletedCount = dieuTriLe.length;
  const examCompletedCount = lichSuKham.length;
  const totalCompletedSessions = packageCompletedCount + singleCompletedCount + examCompletedCount;

  // 2. Số gói đang điều trị
  const activePackages = goiDieuTri.filter((pkg) => pkg.trang_thai_phac_do === 'dang_dieu_tri').length;

  // 3. Tìm buổi hoàn thành gần nhất trong tất cả các loại (gói + lẻ + khám)
  const packageDates = goiDieuTri
    .flatMap((pkg) => pkg.buoi_dieu_tri)
    .filter((s) => s.trang_thai === 'hoan_thanh' && s.ngay_gio_bat_dau)
    .map((s) => new Date(s.ngay_gio_bat_dau).getTime());

  const singleDates = dieuTriLe
    .filter((item) => item.ngay_dieu_tri)
    .map((item) => new Date(item.ngay_dieu_tri).getTime());

  const examDates = lichSuKham
    .filter((exam) => exam.ngay_kham)
    .map((exam) => new Date(exam.ngay_kham).getTime());

  const allDates = [...packageDates, ...singleDates, ...examDates].filter((t) => !isNaN(t));
  const latestTimestamp = allDates.length > 0 ? Math.max(...allDates) : null;
  const lastSessionDate = latestTimestamp ? new Date(latestTimestamp) : null;

  return (
    <div className="relative overflow-hidden rounded-[32px] p-7 md:p-9 text-white shadow-xl bg-gradient-to-r from-[#0D4B46] via-[#0F766E] to-[#115E59] border border-teal-600/30">
      {/* Background Ambient Orbs */}
      <div className="pointer-events-none absolute -top-24 -right-24 size-80 bg-teal-400/20 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 size-80 bg-emerald-500/15 rounded-full blur-3xl" />

      <div className="relative z-10 flex flex-wrap items-start justify-between gap-6">
        {/* Profile Info */}
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-2xl bg-white/10 backdrop-blur-md border-2 border-teal-300/40 text-teal-100 flex items-center justify-center font-heading font-black text-xl shrink-0 shadow-inner">
            {getInitials(khachHang.ho_ten || '?')}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-2xl md:text-3xl font-black tracking-tight text-white">{khachHang.ho_ten}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/10 text-teal-200 border border-white/15">
                Hồ Sơ Y Khoa
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-teal-100/80 font-medium">
              {khachHang.so_dien_thoai && (
                <span className="flex items-center gap-1.5"><Phone size={13} className="text-teal-300" /> {formatPhone(khachHang.so_dien_thoai)}</span>
              )}
              {khachHang.email && (
                <span className="flex items-center gap-1.5"><Mail size={13} className="text-teal-300" /> {khachHang.email}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3 Metric Glass Tiles */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
        <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4.5 flex items-center gap-4 transition-all hover:bg-white/15">
          <div className="size-11 rounded-xl bg-emerald-400/20 border border-emerald-300/30 text-emerald-300 flex items-center justify-center shrink-0">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className="font-heading text-2xl font-black tabular-nums text-white">{totalCompletedSessions}</div>
            <div className="text-[10.5px] font-bold uppercase tracking-wider text-teal-100/70 mt-0.5">Buổi đã hoàn thành</div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4.5 flex items-center gap-4 transition-all hover:bg-white/15">
          <div className="size-11 rounded-xl bg-teal-400/20 border border-teal-300/30 text-teal-200 flex items-center justify-center shrink-0">
            <Activity size={22} />
          </div>
          <div>
            <div className="font-heading text-2xl font-black tabular-nums text-white">{activePackages}</div>
            <div className="text-[10.5px] font-bold uppercase tracking-wider text-teal-100/70 mt-0.5">Liệu trình đang điều trị</div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4.5 flex items-center gap-4 transition-all hover:bg-white/15">
          <div className="size-11 rounded-xl bg-amber-400/20 border border-amber-300/30 text-amber-300 flex items-center justify-center shrink-0">
            <Calendar size={22} />
          </div>
          <div>
            <div className="font-heading text-2xl font-black tabular-nums text-white">
              {lastSessionDate ? lastSessionDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : '—'}
            </div>
            <div className="text-[10.5px] font-bold uppercase tracking-wider text-teal-100/70 mt-0.5">Buổi trị liệu gần nhất</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RecordHeader;
