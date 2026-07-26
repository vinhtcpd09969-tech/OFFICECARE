import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, FileText, XCircle, CreditCard, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { InvoiceSnippet } from './InvoiceSnippet';
import { VasTrendSparkline } from './VasTrendSparkline';
import { SessionTimelineItem } from './SessionTimelineItem';
import { BookNextSessionModal } from './BookNextSessionModal';
import { PACKAGE_STATUS_META } from '../constants';
import type { PackageEntry } from '../types';
import { isSessionPaymentSatisfied, getInstallmentCutoffSession } from '../../../../../utils/billing';

/** Gom dữ liệu hóa đơn gói từ 1 PackageEntry về đúng shape mà utils/billing mong đợi. */
function toPlanShape(pkg: PackageEntry) {
  return {
    loai_goi: pkg.loai_goi,
    hinh_thuc_thanh_toan_goi: pkg.hinh_thuc_thanh_toan_goi,
    tong_tien_phai_tra: pkg.tong_tien_phai_tra,
    so_tien_da_tra: pkg.so_tien_da_tra,
    tong_so_buoi: pkg.tong_so_buoi,
    tong_tien_goc: pkg.tong_tien_goc,
    ti_le_giam_gia_goi: pkg.ti_le_giam_gia_goi,
    so_tien_giam_voucher: pkg.so_tien_giam_voucher,
    // Cần cho isPlanCancelled bên trong isSessionPaymentSatisfied: gói đã hoàn tiền thì không còn
    // khoản nào để đòi, không chặn "Đặt lịch" vì lý do thanh toán nữa.
    trang_thai: pkg.trang_thai_phac_do,
    hoa_don_trang_thai: pkg.trang_thai_hoa_don,
  };
}

interface PackageCardProps {
  pkg: PackageEntry;
  isExpanded: boolean;
  onToggleExpand: () => void;
  targetSessionId?: string | null;
}

export function PackageCard({ pkg, isExpanded, onToggleExpand, targetSessionId }: PackageCardProps) {
  const navigate = useNavigate();

  const [expandedSessionNum, setExpandedSessionNum] = useState<number | null>(null);
  const [bookingSessionNum, setBookingSessionNum] = useState<number | null>(null);

  const sortedSessions = [...pkg.buoi_dieu_tri].sort((a, b) => a.so_thu_tu_buoi - b.so_thu_tu_buoi);

  useEffect(() => {
    if (!targetSessionId) return;
    const match = sortedSessions.find(s => s.cuoc_hen_id === targetSessionId || String(s.so_thu_tu_buoi) === String(targetSessionId));
    if (match) {
      setExpandedSessionNum(match.so_thu_tu_buoi);
    }
  }, [targetSessionId, pkg.buoi_dieu_tri]);

  const isPrepaidPackage = pkg.hinh_thuc_thanh_toan_goi === 'tra_thang' || pkg.hinh_thuc_thanh_toan_goi === 'tra_gop';
  const completedFromSessions = sortedSessions.filter((s) => 
    s.trang_thai === 'hoan_thanh' || 
    (isPrepaidPackage && ['khong_den', 'khach_khong_den', 'khach_khong_den_phat'].includes(s.trang_thai))
  ).length;
  const actualCompleted = isPrepaidPackage 
    ? Math.max(pkg.so_buoi_da_dung || 0, completedFromSessions)
    : sortedSessions.filter((s) => s.trang_thai === 'hoan_thanh').length;
  const percentDone = pkg.tong_so_buoi > 0 ? Math.round((actualCompleted / pkg.tong_so_buoi) * 100) : 0;
  const statusMeta = PACKAGE_STATUS_META[pkg.trang_thai_phac_do] || { label: pkg.trang_thai_phac_do, className: 'bg-zinc-100 text-zinc-600 border-zinc-200' };

  // Tìm buổi chưa hoàn thành / cần đặt lịch đầu tiên (1-indexed) để hiển thị nút Đặt lịch
  let firstUnbookedNum = 1;
  for (let i = 1; i <= pkg.tong_so_buoi; i++) {
    const session = sortedSessions.find((s) => s.so_thu_tu_buoi === i && s.trang_thai !== 'da_huy');
    if (!session) {
      firstUnbookedNum = i;
      break;
    }
    if (isPrepaidPackage && ['khong_den', 'khach_khong_den', 'khach_khong_den_phat'].includes(session.trang_thai)) {
      continue;
    }
    if (!isPrepaidPackage && ['khong_den', 'khach_khong_den', 'khach_khong_den_phat'].includes(session.trang_thai)) {
      firstUnbookedNum = i;
      break;
    }
    if (session.trang_thai !== 'hoan_thanh') {
      firstUnbookedNum = i;
      break;
    }
  }

  // Chỉ cho xem trước hoàn tiền/yêu cầu hủy khi gói còn đang chạy và đã có hóa đơn thật gắn vào —
  // gói chờ kích hoạt (chưa đóng tiền) hay đã hoàn thành/hủy thì không còn gì để hủy nữa.
  const canRequestCancel = pkg.trang_thai_phac_do === 'dang_dieu_tri' && !!pkg.hoa_don_id;

  // Gói bị hủy do quá hạn sử dụng (tự động hoặc Admin xử lý, không hoàn tiền) — khác "khách chủ
  // động yêu cầu hủy và được hoàn tiền" (trang_thai_hoa_don = da_hoan_tien). Hiện rõ lý do để khách
  // không thắc mắc "sao gói tự nhiên bị hủy".
  const isExpiredCancel = pkg.trang_thai_phac_do === 'huy' && !!pkg.han_su_dung && new Date(pkg.han_su_dung) < new Date();

  // Gói trả góp còn đang chạy, chưa đóng đợt 2 — nhắc trước để khách chủ động, không đợi tới lúc bị
  // chặn đặt buổi mới biết (cùng ngưỡng buổi với getMinPaymentRequired()/isSessionPaymentSatisfied()
  // đang chặn nút "Đặt lịch" bên dưới, xem utils/billing.ts).
  const installmentCutoff = pkg.hinh_thuc_thanh_toan_goi === 'tra_gop' ? getInstallmentCutoffSession(pkg.tong_so_buoi) : null;
  const needsInstallment2 = pkg.trang_thai_phac_do === 'dang_dieu_tri'
    && installmentCutoff !== null
    && !isSessionPaymentSatisfied(toPlanShape(pkg), installmentCutoff);

  return (
    <div
      id={`package-${pkg.phac_do_id}`}
      className="bg-white rounded-[32px] border border-slate-200/80 shadow-[0_10px_30px_rgba(15,23,42,0.025)] overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-teal-500/30 scroll-mt-6"
    >
      <div className="p-6 md:p-8 flex flex-col lg:flex-row gap-6 justify-between border-b border-slate-100 bg-slate-50/50">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2.5 mb-3">
            <span className="text-[10px] font-black text-teal-800 bg-teal-50 border border-teal-200/60 px-2.5 py-1 rounded-lg uppercase tracking-wider">{pkg.ma_phac_do}</span>
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-2xs ${statusMeta.className}`}>
              {statusMeta.label}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              {pkg.ngay_kich_hoat ? `Kích hoạt ${format(new Date(pkg.ngay_kich_hoat), 'dd/MM/yyyy', { locale: vi })}` : 'Chờ kích hoạt'}
              {pkg.han_su_dung && ` · Hạn sử dụng ${format(new Date(pkg.han_su_dung), 'dd/MM/yyyy', { locale: vi })}`}
            </span>
          </div>
          <h2 className="font-heading text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-snug">{pkg.ten_dich_vu}</h2>

          <div className="max-w-md mt-5 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-600">
              <span className="text-slate-500 uppercase tracking-wider text-[10px] font-black">Tiến trình phục hồi</span>
              <span className="tabular-nums font-black text-[#0D9488] bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-100">{actualCompleted}/{pkg.tong_so_buoi} buổi · {percentDone}%</span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
              <div className="h-full rounded-full bg-gradient-to-r from-[#0D9488] via-[#14B8A6] to-emerald-400 transition-all duration-500 shadow-sm" style={{ width: `${percentDone}%` }} />
            </div>
          </div>

          {canRequestCancel && (
            <button
              type="button"
              onClick={() => navigate(`/invoices?invoice=${pkg.hoa_don_id}&refund=1`)}
              className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-black text-rose-500 hover:text-rose-700 hover:underline uppercase tracking-wider transition-colors"
            >
              <XCircle size={13} /> Hủy liệu trình
            </button>
          )}

          {isExpiredCancel && (
            <div className="mt-4 flex items-start gap-2.5 text-xs font-medium text-rose-800 bg-rose-50/80 border border-rose-200/70 rounded-2xl p-4 max-w-md shadow-2xs">
              <XCircle size={15} className="shrink-0 mt-0.5 text-rose-500" />
              <span>
                Gói đã tự động hủy do quá hạn sử dụng ({format(new Date(pkg.han_su_dung!), 'dd/MM/yyyy', { locale: vi })}) — không hoàn tiền theo chính sách, không còn thao tác nào trên lịch hẹn/hóa đơn của gói này. Liên hệ phòng khám nếu cần hỗ trợ.
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3.5 lg:w-72 shrink-0">
          <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-2xs">
            <VasTrendSparkline sessions={pkg.buoi_dieu_tri} />
          </div>
          <InvoiceSnippet
            maHoaDon={pkg.ma_hoa_don}
            tongTien={pkg.tong_tien_phai_tra}
            daTra={pkg.so_tien_da_tra}
            trangThai={pkg.trang_thai_hoa_don}
          />
          {needsInstallment2 && (
            <div className="flex items-start gap-2 text-[11px] font-semibold text-amber-800 bg-amber-50/80 border border-amber-200/70 rounded-xl p-3">
              <AlertCircle size={14} className="shrink-0 mt-0.5 text-amber-500" />
              <span>Vui lòng thanh toán đợt 2 khi hoàn thành buổi số {installmentCutoff! - 1} để tiếp tục đặt buổi tiếp theo.</span>
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onToggleExpand}
        className="w-full py-4 px-6 md:px-8 bg-slate-50/80 hover:bg-teal-50/40 flex items-center justify-between text-xs font-black text-slate-700 hover:text-[#0D9488] border-b border-slate-100 transition-all cursor-pointer"
      >
        <span className="flex items-center gap-2.5">
          <FileText size={16} className="text-[#0D9488]" /> Nhật ký {pkg.buoi_dieu_tri.length} buổi trị liệu đã ghi nhận
        </span>
        {isExpanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
      </button>

      {isExpanded && (
        <div className="p-6 md:p-8 bg-white border-t border-zinc-100">
          <div className="space-y-3.5">
            {/* Tạo danh sách đủ các buổi từ 1 đến tong_so_buoi */}
            {Array.from({ length: pkg.tong_so_buoi }, (_, idx) => {
              const sessionNum = idx + 1;
              const session = sortedSessions.find((s) => s.so_thu_tu_buoi === sessionNum && s.trang_thai !== 'da_huy');

              let status: 'hoan_thanh' | 'khong_den' | 'da_dat_lich' | 'chua_dat_lich' | 'can_thanh_toan' | 'chua_toi_han' | 'goi_da_huy' = 'chua_toi_han';
              if (session) {
                if (session.trang_thai === 'hoan_thanh') {
                  status = 'hoan_thanh';
                } else if (['khong_den', 'khach_khong_den', 'khach_khong_den_phat'].includes(session.trang_thai)) {
                  status = 'khong_den';
                } else {
                  status = 'da_dat_lich';
                }
              } else if (pkg.trang_thai_phac_do === 'huy') {
                // Gói đã hủy (hết hạn sử dụng hoặc lý do khác) — mọi buổi chưa từng diễn ra sẽ
                // không bao giờ diễn ra nữa, KHÔNG phải "chưa tới hạn" (dễ hiểu nhầm là còn chờ).
                status = 'goi_da_huy';
              } else if (sessionNum === firstUnbookedNum && pkg.trang_thai_phac_do === 'dang_dieu_tri') {
                status = isSessionPaymentSatisfied(toPlanShape(pkg), sessionNum) ? 'chua_dat_lich' : 'can_thanh_toan';
              }

              const isSessionExpanded = expandedSessionNum === sessionNum;

              return (
                <div key={sessionNum} className="border border-zinc-150 rounded-2xl overflow-hidden transition-all duration-300">
                  {/* Layer 2: Summary Row */}
                  <div
                    onClick={() => {
                      if (status === 'hoan_thanh' || status === 'da_dat_lich') {
                        setExpandedSessionNum(isSessionExpanded ? null : sessionNum);
                      }
                    }}
                    className={`p-4 flex flex-wrap items-center justify-between gap-4 bg-zinc-50/40 ${(status === 'hoan_thanh' || status === 'da_dat_lich') ? 'cursor-pointer hover:bg-zinc-50' : ''
                      } ${status === 'chua_toi_han' ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Số thứ tự buổi */}
                      <span
                        className={`size-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${status === 'hoan_thanh'
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            : status === 'da_dat_lich'
                              ? 'bg-blue-50 text-blue-600 border border-blue-200'
                              : status === 'chua_dat_lich'
                                ? 'bg-amber-50 text-amber-600 border border-amber-200'
                                : status === 'can_thanh_toan' || status === 'goi_da_huy'
                                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                                  : 'bg-zinc-100 text-zinc-400'
                          }`}
                      >
                        {sessionNum}
                      </span>

                      <div className="min-w-0">
                        <span className="text-sm font-black text-secondary block">
                          Buổi {sessionNum} · Trị liệu phục hồi
                        </span>
                        <span className="text-[11px] text-zinc-500 font-semibold mt-0.5 block truncate">
                          {status === 'hoan_thanh' && session
                            ? `Thực hiện: ${session.ten_bac_si || 'KTV'} · ${format(new Date(session.ngay_gio_bat_dau), 'dd/MM/yyyy HH:mm')}`
                            : status === 'khong_den' && session
                              ? `Vắng mặt lúc ${format(new Date(session.ngay_gio_bat_dau), 'dd/MM/yyyy HH:mm')}${!isPrepaidPackage ? ' · Đã mở lại lượt đặt lịch cho buổi này.' : ' · Đã tính 1 buổi tiêu thụ.'}`
                              : status === 'da_dat_lich' && session
                                ? `${session.trang_thai === 'chua_xac_nhan' ? 'Chờ xác thực' : 'Dự kiến'}: ${session.ten_bac_si || 'KTV'} · ${format(new Date(session.ngay_gio_bat_dau), 'dd/MM/yyyy HH:mm')}`
                                : status === 'chua_dat_lich'
                                  ? 'Sẵn sàng để lên lịch đặt chỗ.'
                                  : status === 'can_thanh_toan'
                                    ? 'Cần hoàn tất thanh toán trước khi đặt buổi này.'
                                    : status === 'goi_da_huy'
                                      ? 'Gói đã hủy — buổi này sẽ không diễn ra.'
                                      : 'Lịch hẹn sẽ mở khi hoàn tất buổi trước.'}
                        </span>
                      </div>
                    </div>

                    {/* Right action / status */}
                    <div className="flex items-center gap-3.5 shrink-0">
                      {status === 'hoan_thanh' && session && (
                        <>
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black px-2 py-0.5 rounded-md tabular-nums">
                            VAS: {session.vas_truoc ?? '—'} ➔ {session.vas_sau ?? '—'}
                          </span>
                          <span className="text-[10px] font-black uppercase bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-md tracking-wider">
                            Hoàn thành
                          </span>
                          {isSessionExpanded ? <ChevronUp size={15} className="text-zinc-400" /> : <ChevronDown size={15} className="text-zinc-400" />}
                        </>
                      )}

                      {status === 'khong_den' && session && (
                        <>
                          <span className="text-[10px] font-black uppercase bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-md tracking-wider">
                            Vắng mặt (No-show)
                          </span>
                          {!isPrepaidPackage && sessionNum === firstUnbookedNum && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setBookingSessionNum(sessionNum);
                              }}
                              className="bg-primary hover:bg-[#25A89C] text-white text-[10px] font-black px-3.5 py-1.5 rounded-full transition-colors uppercase tracking-wider shadow-xs"
                            >
                              Đặt lịch
                            </button>
                          )}
                          {isSessionExpanded ? <ChevronUp size={15} className="text-zinc-400" /> : <ChevronDown size={15} className="text-zinc-400" />}
                        </>
                      )}

                      {status === 'da_dat_lich' && session && (
                        <>
                          <span className={`text-[10px] font-black uppercase border px-2 py-0.5 rounded-md tracking-wider ${session.trang_thai === 'chua_xac_nhan'
                              ? 'bg-amber-50 text-amber-600 border-amber-100'
                              : 'bg-blue-50 text-blue-600 border-blue-100'
                            }`}>
                            {session.trang_thai === 'chua_xac_nhan' ? 'Chờ xác thực' : 'Đã đặt lịch'}
                          </span>
                          {isSessionExpanded ? <ChevronUp size={15} className="text-zinc-400" /> : <ChevronDown size={15} className="text-zinc-400" />}
                        </>
                      )}

                      {status === 'chua_dat_lich' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBookingSessionNum(sessionNum);
                          }}
                          className="bg-primary hover:bg-[#25A89C] text-white text-[10px] font-black px-3.5 py-1.5 rounded-full transition-colors uppercase tracking-wider shadow-xs"
                        >
                          Đặt lịch
                        </button>
                      )}

                      {status === 'can_thanh_toan' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/invoices?invoice=${pkg.hoa_don_id}`);
                          }}
                          className="inline-flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-black px-3.5 py-1.5 rounded-full transition-colors uppercase tracking-wider shadow-xs"
                        >
                          <CreditCard size={12} /> Cần thanh toán
                        </button>
                      )}

                      {status === 'goi_da_huy' && (
                        <span className="text-[9px] font-black uppercase bg-rose-50 text-rose-600 border border-rose-200 px-2 py-0.5 rounded-md tracking-wider">
                          Gói đã hủy
                        </span>
                      )}

                      {status === 'chua_toi_han' && (
                        <span className="text-[9px] font-black uppercase bg-zinc-100 text-zinc-400 border border-zinc-200 px-2 py-0.5 rounded-md tracking-wider">
                          Chưa tới hạn
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Layer 3: Session Details */}
                  {isSessionExpanded && session && (
                    <div className="p-5 bg-white border-t border-zinc-100 animate-in slide-in-from-top duration-200">
                      <SessionTimelineItem
                        session={session}
                        previousVasSau={
                          sessionNum > 1 && sortedSessions.find((s) => s.so_thu_tu_buoi === sessionNum - 1)
                            ? sortedSessions.find((s) => s.so_thu_tu_buoi === sessionNum - 1)!.vas_sau
                            : null
                        }
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Book next session Modal overlay */}
      {bookingSessionNum !== null && (
        <BookNextSessionModal
          pkg={{
            phac_do_id: pkg.phac_do_id,
            ten_dich_vu: pkg.ten_dich_vu,
            goi_dich_vu_id: pkg.goi_dich_vu_id
          }}
          sessionNum={bookingSessionNum}
          onClose={() => setBookingSessionNum(null)}
        />
      )}
    </div>
  );
}

export default PackageCard;
