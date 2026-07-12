# Quy tắc nghiệp vụ khóa — OfficeCare

> Nguồn sự thật duy nhất cho các quy tắc nghiệp vụ bắt buộc của hệ thống đặt lịch & thanh toán. Hợp nhất từ `docs/DEVELOPMENT_STANDARDS.md` (cũ), `.agent/rules/CODE_STANDARDS.md` (cũ) và các quyết định đã áp dụng trong `walkthrough.md`. Bất kỳ thay đổi nào đụng tới đặt lịch/thanh toán/hóa đơn phải đối chiếu với file này trước khi code; nếu có 1% mơ hồ thì hỏi lại người dùng trước, không tự suy diễn.
>
> **Cập nhật quan trọng:** các công thức ở mục 3, 4, 5 đã được xác minh lại bằng cách đọc trực tiếp code thật (không chỉ suy từ tài liệu cũ) và cài đặt thành pure function trong `backend/src/domain/billing.ts` — coi file code đó là nguồn sự thật kỹ thuật, tài liệu này chỉ mô tả lại cho dễ đọc. Khi phát hiện sai lệch giữa tài liệu và `billing.ts`, tin theo `billing.ts` và sửa lại tài liệu này.

## 1. Sức chứa khả dụng (Capacity)

- Sức chứa tối đa của 1 khung giờ = `min(Số bác sĩ trực ca đó, Tổng sức chứa giường của các phòng khám sẵn sàng)`.
- Sức chứa khả dụng = Sức chứa tối đa − Tổng số lịch hẹn trùng ca đang hoạt động.
- Khi khách đặt lịch, hệ thống phải trừ sức chứa khả dụng **ngay lập tức**. Không cho phép overbooking nếu vượt số này.
- Nếu sức chứa khả dụng ≤ 0: ẩn khung giờ hoặc hiển thị "Đầy". Xem chi tiết luồng trong `docs/activity_diagrams.md`.

## 2. Đặt lịch tuần tự (Sequential Session Booking)

- Bệnh nhân bắt buộc phải hoàn thành buổi trị liệu số `M-1` (`trang_thai = 'hoan_thanh'`) mới được đặt lịch cho buổi số `M`.
- **Frontend:** nút "Đặt lịch" của buổi `M` phải disabled + cảnh báo nếu buổi `M-1` chưa hoàn thành.
- **Backend:** chặn đặt buổi tiếp theo nếu khách đang có lịch hoạt động (`chua_xac_nhan`, `cho_xac_nhan`, `da_xac_nhan`, `da_checkin`, `dang_kham`) của cùng phác đồ.

## 3. Thanh toán trả góp 50% (Installment Plan Cutoff)

- Khách trả góp (`tra_gop`) phải đóng 50% còn lại (Đợt 2) **trước khi bắt đầu buổi số `H`**, với
  `H = floor(N × (%cọc − %phạt) / 100) + 1` (N = tổng số buổi của gói, %cọc = 50, %phạt = 10 —
  xem `TRA_GOP_DEPOSIT_PERCENT`/`DEFAULT_CANCELLATION_PENALTY_PERCENT` trong `billing.ts`).
  Đây là công thức **biên độ an toàn**: đảm bảo cọc 50% luôn còn dư ít nhất bằng mức phạt hủy gói
  sau khi trừ chi phí các buổi đã làm — không cố định `floor(N/2)`, vì gói càng nhiều buổi thì
  công thức cũ càng để dư biên độ mỏng dần (có thể âm với gói lớn).
  - Gói 8 buổi (N=8) → H=4.
  - Gói 10 buổi (N=10) → H=5.
  - Gói 12 buổi (N=12) → H=5 (khác `floor(12/2)=6` — bắt đóng sớm hơn 1 buổi để đủ an toàn).
  - Gói 15 buổi (N=15) → H=7 (trùng `floor(15/2)` ở trường hợp này).
  - Gói 16 buổi (N=16) → H=7 (khác `floor(16/2)=8`).
- **Frontend:** cảnh báo đóng Đợt 2 hiện khi `so_thu_tu_buoi >= H` theo đúng công thức trên (không hardcode `floor(N/2)`). Nút "Hoàn thành" của buổi đó bị chặn tới khi hóa đơn gói `da_thanh_toan`. Nhãn nút thanh toán phải ghi **"Vui lòng thanh toán liệu trình"**, không dùng từ ngữ gây hiểu lầm là thanh toán lẻ.

## 4. Thanh toán từng buổi (Pay-Per-Session)

- Khách trả `tung_buoi` phải thanh toán xong buổi hiện tại mới được đặt buổi kế tiếp.
- Sau khi thanh toán xong buổi hiện tại (vd buổi 4), màn hình thành công phải có nút nhanh **"Đặt lịch hẹn Buổi 5 ngay"** (truyền `daDangKyGoiId` và `nextSessionNum` vào `paymentSuccessData`).
- Chặn đặt buổi tiếp theo nếu tổng tiền đã trả thực tế nhỏ hơn tổng tiền tích lũy của các buổi đã dùng.

## 5. Miễn phí khám lâm sàng (Exam Fee Waiver)

- Khách được miễn phí khám lâm sàng khi mua gói bằng hình thức `tra_thang` hoặc `tra_gop` **và** giá gói (không tính phí khám, xem `resolvePackageBasePrice`) **≥ 1.000.000đ**. Không quan tâm loại gói (`LE`/`LIEU_TRINH`).
- Gói trả `tung_buoi` **không bao giờ** được miễn phí khám, dù giá cao.
- Cài đặt chuẩn: `isExamWaived()` trong `backend/src/domain/billing.ts`. **Trước đây có 4 bản cài đặt lệch nhau ở `admin.repository.ts` và `receptionist.service.ts`** (một số bản theo loại gói, một số theo ngưỡng giá, một số theo cả hai) — đã hợp nhất về đúng 1 quy tắc này.

## 6. Hủy gói & Hoàn tiền (Cancellation & Refund)

- **Phí phạt hủy gói = 10% trên tổng giá trị hợp đồng gói đã chốt theo hình thức thanh toán** (`gia_thanh_toan_goi`), **không phải** 10% trên số tiền khách đã đóng thực tế (`so_tien_da_dong`). Đây là giá trị **cố định theo hợp đồng**, không đổi theo tiến độ đóng tiền.
  ```ts
  const phi_phat_thuc_te = Math.round((gia_thanh_toan_goi * phi_phat_percent) / 100);
  ```
  Cài đặt chuẩn: `calculatePackageCancellationRefund()` trong `backend/src/domain/billing.ts`.
- Chi phí khám lâm sàng bị trừ trong hoàn tiền phải lấy **giá động** từ `goi_dich_vu.don_gia` thông qua `cuoc_hen → goi_dich_vu` tương ứng — **cấm hardcode** con số cố định (vd không được gán cứng `-200.000đ`).
- Nếu khách đã thanh toán hóa đơn khám riêng trước đó: chỉ trừ phí khám **đúng 1 lần**, không trừ lặp trong hoàn tiền gói.
- Khi truy vấn danh sách/chi tiết hóa đơn, cột chi phí khám phải tính động qua join với bảng dịch vụ, không trả cứng một con số.

## 7. Phạt điểm uy tín khi hủy/không đến (No-Show Penalty)

- Gói `tra_thang`/`tra_gop`: vi phạm lần đầu (hủy hoặc không đến) được **ân xá**, không trừ điểm. Từ lần vi phạm thứ 2 trở đi, chuyển trạng thái sang `da_huy_phat`/`khach_khong_den_phat`.
- Gói `tung_buoi` hoặc buổi lẻ không thuộc gói: **luôn trừ 10 điểm uy tín** mỗi lần vi phạm, không có "ân xá" lần đầu.
- Cài đặt chuẩn: `resolveNoShowOutcome()` trong `backend/src/domain/billing.ts`.

## 8. Quy trình tiếp đón của Lễ tân (Receptionist Confirmation Flow)

- Trạng thái mặc định khi khách đặt lịch: `Chưa xác nhận`.
- Lễ tân gọi điện xác nhận. Nếu khách không nghe máy **≥ 3 cuộc**, Lễ tân hủy lịch **bằng tay**.
- Hệ thống **không tự động hủy** lịch chưa xác nhận — giữ tính nhân văn và linh hoạt cho nghiệp vụ phòng khám.

## 9. Báo lỗi nghiệp vụ an toàn cho client

- Mọi lỗi ràng buộc nghiệp vụ (chưa thanh toán buổi trước, trùng lịch nhân sự, đã có lịch đang hoạt động...) ném ra từ Repository/Service dưới dạng `Error` phải được Controller bắt và trả về `400 Bad Request` kèm message gốc.
- **Cấm** nuốt lỗi nghiệp vụ rồi trả về `500 Lỗi server` chung chung — khách/nhân viên cần thấy đúng lý do bị chặn.
