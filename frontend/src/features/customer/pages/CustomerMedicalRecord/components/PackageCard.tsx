import { useState } from 'react';
import { ChevronDown, ChevronUp, FileText, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { InvoiceSnippet } from './InvoiceSnippet';
import { VasTrendSparkline } from './VasTrendSparkline';
import { SessionTimelineItem } from './SessionTimelineItem';
import { BookNextSessionModal } from './BookNextSessionModal';
import { PACKAGE_STATUS_META } from '../constants';
import { isSessionPaymentSatisfied, isPlanCancelled } from '../../../../../utils/billing';
import type { PackageEntry } from '../types';

interface PackageCardProps {
  pkg: PackageEntry;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function PackageCard({ pkg, isExpanded, onToggleExpand }: PackageCardProps) {
  const navigate = useNavigate();

  const [expandedSessionNum, setExpandedSessionNum] = useState<number | null>(null);
  const [bookingSessionNum, setBookingSessionNum] = useState<number | null>(null);

  // KHÔNG dùng thẳng pkg.so_buoi_da_dung — đây là cột lưu cache trên phac_do_dieu_tri, có thể lệch
  // với số buổi thật sự đã hoàn thành (đã xác nhận qua DB: có phác đồ so_buoi_da_dung=1 nhưng thực
  // tế 2 cuoc_hen đã hoan_thanh). Chính vì lệch này mà admin.repository.ts cũng phải tính lại trực
  // tiếp từ COUNT(cuoc_hen) ở nhiều nơi thay vì tin cột cache — áp dụng lại đúng cách đó ở đây.
  const sortedSessions = [...pkg.buoi_dieu_tri].sort((a, b) => a.so_thu_tu_buoi - b.so_thu_tu_buoi);
  const actualCompleted = sortedSessions.filter((s) => s.trang_thai === 'hoan_thanh').length;
  const percentDone = pkg.tong_so_buoi > 0 ? Math.round((actualCompleted / pkg.tong_so_buoi) * 100) : 0;
  const statusMeta = PACKAGE_STATUS_META[pkg.trang_thai_phac_do] || { label: pkg.trang_thai_phac_do, className: 'bg-zinc-100 text-zinc-600 border-zinc-200' };

  // Tìm buổi chưa đặt lịch đầu tiên (1-indexed) để hiển thị nút Đặt lịch
  let firstUnbookedNum = 1;
  for (let i = 1; i <= pkg.tong_so_buoi; i++) {
    const exists = sortedSessions.some((s) => s.so_thu_tu_buoi === i && s.trang_thai !== 'da_huy');
    if (!exists) {
      firstUnbookedNum = i;
      break;
    }
  }

  // Chỉ cho xem trước hoàn tiền/yêu cầu hủy khi gói còn đang chạy và đã có hóa đơn thật gắn vào —
  // gói chờ kích hoạt (chưa đóng tiền) hay đã hoàn thành/hủy thì không còn gì để hủy nữa.
  const canRequestCancel = pkg.trang_thai_phac_do === 'dang_dieu_tri' && !!pkg.hoa_don_id;

  return (
    <div
      id={`package-${pkg.phac_do_id}`}
      className="bg-white rounded-3xl border border-zinc-150 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md scroll-mt-6"
    >
      <div className="p-6 md:p-7 flex flex-col lg:flex-row gap-6 justify-between border-b border-zinc-100 bg-zinc-50/40">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2.5 mb-2.5">
            <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 px-2 py-1 rounded-md">{pkg.ma_phac_do}</span>
            <span className={`px-2.5 py-1 rounded-lg text-[9.5px] font-black uppercase tracking-wider border ${statusMeta.className}`}>
              {statusMeta.label}
            </span>
            <span className="text-[11px] font-semibold text-zinc-400">
              {pkg.ngay_kich_hoat ? `Kích hoạt ${format(new Date(pkg.ngay_kich_hoat), 'dd/MM/yyyy', { locale: vi })}` : 'Chờ kích hoạt'}
            </span>
          </div>
          <h2 className="font-heading text-lg md:text-xl font-black text-secondary tracking-tight">{pkg.ten_dich_vu}</h2>

          <div className="max-w-md mt-4 space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-zinc-600">
              <span>Tiến trình phục hồi</span>
              <span className="tabular-nums">{actualCompleted}/{pkg.tong_so_buoi} buổi · {percentDone}%</span>
            </div>
            <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-primary to-teal-400 transition-all duration-500" style={{ width: `${percentDone}%` }} />
            </div>
          </div>

          {canRequestCancel && (
            <button
              type="button"
              onClick={() => navigate(`/invoices?invoice=${pkg.hoa_don_id}&refund=1`)}
              className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-black text-rose-500 hover:text-rose-600 hover:underline uppercase tracking-wider"
            >
              <XCircle size={13} /> Hủy liệu trình
            </button>
          )}
        </div>

        <div className="flex flex-col gap-3.5 lg:w-72 shrink-0">
          <div className="bg-white border border-zinc-100 rounded-2xl p-3.5">
            <VasTrendSparkline sessions={pkg.buoi_dieu_tri} />
          </div>
          <InvoiceSnippet
            maHoaDon={pkg.ma_hoa_don}
            tongTien={pkg.tong_tien_phai_tra}
            daTra={pkg.so_tien_da_tra}
            trangThai={pkg.trang_thai_hoa_don}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onToggleExpand}
        className="w-full py-3.5 px-6 md:px-7 bg-zinc-50 flex items-center justify-between text-xs font-bold text-zinc-600 hover:text-primary hover:bg-zinc-100/60 border-b border-zinc-100 transition-colors"
      >
        <span className="flex items-center gap-2">
          <FileText size={15} /> Nhật ký {pkg.buoi_dieu_tri.length} buổi trị liệu đã ghi nhận
        </span>
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {isExpanded && (
        <div className="p-6 md:p-8 bg-white border-t border-zinc-100">
          <div className="space-y-3.5">
            {/* Tạo danh sách đủ các buổi từ 1 đến tong_so_buoi */}
            {Array.from({ length: pkg.tong_so_buoi }, (_, idx) => {
              const sessionNum = idx + 1;
              const session = sortedSessions.find((s) => s.so_thu_tu_buoi === sessionNum && s.trang_thai !== 'da_huy');

              const isCancelled = isPlanCancelled({
                trang_thai: pkg.trang_thai_phac_do,
                hoa_don_trang_thai: pkg.trang_thai_hoa_don,
                trang_thai_hoa_don_goi: pkg.trang_thai_hoa_don
              });

              const isPaySatisfied = isSessionPaymentSatisfied({
                hinh_thuc_thanh_toan_goi: pkg.hinh_thuc_thanh_toan_goi,
                tong_tien_phai_tra: pkg.tong_tien_phai_tra,
                so_tien_da_tra: pkg.so_tien_da_tra,
                tong_so_buoi: pkg.tong_so_buoi,
                trang_thai: pkg.trang_thai_phac_do,
                hoa_don_trang_thai: pkg.trang_thai_hoa_don,
                trang_thai_hoa_don_goi: pkg.trang_thai_hoa_don
              }, sessionNum);

              let status: 'hoan_thanh' | 'da_dat_lich' | 'chua_dat_lich' | 'can_thanh_toan' | 'chua_toi_han' = 'chua_toi_han';
              if (session) {
                status = session.trang_thai === 'hoan_thanh' ? 'hoan_thanh' : 'da_dat_lich';
              } else if (sessionNum === firstUnbookedNum && pkg.trang_thai_phac_do === 'dang_dieu_tri') {
                if (isCancelled || !isPaySatisfied) {
                  status = 'can_thanh_toan';
                } else {
                  status = 'chua_dat_lich';
                }
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
                    className={`p-4 flex flex-wrap items-center justify-between gap-4 bg-zinc-50/40 ${
                      (status === 'hoan_thanh' || status === 'da_dat_lich') ? 'cursor-pointer hover:bg-zinc-50' : ''
                    } ${status === 'chua_toi_han' ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Số thứ tự buổi */}
                      <span
                        className={`size-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                          status === 'hoan_thanh'
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            : status === 'da_dat_lich'
                            ? 'bg-blue-50 text-blue-600 border border-blue-200'
                            : status === 'chua_dat_lich'
                            ? 'bg-amber-50 text-amber-600 border border-amber-200'
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
                            : status === 'da_dat_lich' && session
                            ? `${session.trang_thai === 'chua_xac_nhan' ? 'Chờ xác thực' : 'Dự kiến'}: ${session.ten_bac_si || 'KTV'} · ${format(new Date(session.ngay_gio_bat_dau), 'dd/MM/yyyy HH:mm')}`
                            : status === 'chua_dat_lich'
                            ? 'Sẵn sàng để lên lịch đặt chỗ.'
                            : status === 'can_thanh_toan'
                            ? (pkg.hinh_thuc_thanh_toan_goi === 'tung_buoi'
                                ? '⚠️ Vui lòng hoàn tất thanh toán buổi trước để mở khóa đặt lịch buổi này.'
                                : pkg.hinh_thuc_thanh_toan_goi === 'tra_gop'
                                ? '⚠️ Vui lòng thanh toán Đợt 2 của gói trả góp để mở khóa đặt lịch.'
                                : '⚠️ Vui lòng hoàn tất thanh toán để mở khóa đặt lịch.')
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

                      {status === 'da_dat_lich' && session && (
                        <>
                          <span className={`text-[10px] font-black uppercase border px-2 py-0.5 rounded-md tracking-wider ${
                            session.trang_thai === 'chua_xac_nhan'
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
                          className="bg-primary hover:bg-[#25A89C] text-white text-[10px] font-black px-3.5 py-1.5 rounded-full transition-colors uppercase tracking-wider shadow-xs cursor-pointer"
                        >
                          Đặt lịch
                        </button>
                      )}

                      {status === 'can_thanh_toan' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/invoices${pkg.hoa_don_id ? `?invoice=${pkg.hoa_don_id}` : ''}`);
                          }}
                          className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black px-3 py-1.5 rounded-full transition-all uppercase tracking-wider shadow-xs cursor-pointer flex items-center gap-1"
                        >
                          💳 {pkg.hinh_thuc_thanh_toan_goi === 'tra_gop' ? 'Thanh toán Đợt 2' : 'Cần thanh toán'}
                        </button>
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
