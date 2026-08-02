# Activity Diagrams — OfficeCare

Thay thế `docs/activity_diagrams.md` cũ (đã xóa — mô tả luồng xác nhận qua Email và check thiết bị y khoa, cả 2 đều không còn đúng với code hiện tại). Các sơ đồ dưới đây được vẽ **trực tiếp từ code đang chạy**, không suy đoán theo thiết kế ban đầu.

Mỗi sơ đồ gồm 1 file nguồn `.puml` (PlantUML, cú pháp swimlane theo Actor: `|Khách hàng|`, `|Hệ thống|`...) + 1 file `.png` đã render. Sửa sơ đồ thì sửa `.puml` rồi render lại — không sửa tay `.png`.

**Cách render lại** (dùng server public plantuml.com — nội dung gửi lên chỉ là mô tả luồng nghiệp vụ chung, không có dữ liệu khách hàng thật):

```bash
node -e "console.log(require('fs').readFileSync('01_dat_lich_hen.puml','utf8'))" > /dev/null # (kiểm tra file tồn tại)
HEX=$(node -e "console.log(Buffer.from(require('fs').readFileSync('01_dat_lich_hen.puml','utf8'),'utf8').toString('hex'))")
curl -s -o 01_dat_lich_hen.png "https://www.plantuml.com/plantuml/png/~h${HEX}"
```

Nếu cần render local không phụ thuộc mạng: cài Java rồi dùng `plantuml.jar` (`java -jar plantuml.jar 01_dat_lich_hen.puml`).

Mỗi file `.puml` có sẵn khối `skinparam` ở đầu để chữ đủ lớn và các khối không dính sát nhau khi chèn báo cáo (`dpi 200`, `ActivityFontSize 16`, `SwimlaneWidth 280`...) — **không thêm `skinparam Padding`**, PlantUML không hỗ trợ thuộc tính này cho activity diagram và sẽ tự chèn banner cảnh báo màu vàng vào ảnh render.

## 1. Đặt lịch hẹn (khám lâm sàng / buổi trị liệu)

File: [`01_dat_lich_hen.puml`](01_dat_lich_hen.puml) / [`01_dat_lich_hen.png`](01_dat_lich_hen.png)

Nguồn đối chiếu: `backend/src/repositories/appointment.repository.ts::createAppointment()` (các bước kiểm tra sức chứa/trùng lịch/thanh toán buổi trước) + `backend/src/services/appointment.service.ts::confirmOTPAppointment()`/`generateAndSaveOTP()` (luồng OTP).

Điểm quan trọng khác với bản thiết kế cũ:
- **Xác nhận bằng OTP 6 số qua Email, hạn 10 phút** — không phải link xác nhận Email như tài liệu cũ.
- OTP hết hạn/sai **không tự động hủy lịch** — chỉ hiển thị lên màn hình Lễ tân để gọi điện xác nhận thủ công; Lễ tân tự quyết định hủy sau nhiều lần gọi không được (hệ thống không đếm số lần gọi, đây là quy trình thủ công của Lễ tân, không phải logic code).
- Khi khách/Lễ tân **chưa chỉ định nhân sự cụ thể** (đặt công khai hoặc chờ Quản lý gán), hệ thống vẫn chặn giữ chỗ bằng đúng công thức sức chứa `min(nhân sự trực ca, giường sẵn sàng) − lịch đang giữ chỗ cùng khung giờ` — tránh tình huống 2 khách cùng chọn 1 khung giờ chỉ còn 1 nhân sự trực, cả 2 đều đặt được rồi Quản lý không đủ người phân bổ.
- Nếu là buổi tiếp theo của 1 phác đồ điều trị: chặn khi buổi trước còn active, buổi mới phải sau buổi trước về thời gian, và (trừ gói `LE`) phải đóng đủ mức tối thiểu theo hình thức thanh toán trước khi đặt được buổi tiếp theo.

## 2. Hủy lịch hẹn / Không đến

File: [`02_huy_lich_khong_den.puml`](02_huy_lich_khong_den.puml) / [`02_huy_lich_khong_den.png`](02_huy_lich_khong_den.png)

Nguồn đối chiếu: `backend/src/domain/billing.ts::resolveNoShowOutcome()` (có test `billing.test.ts`) + `backend/src/repositories/appointment.repository.ts::cancelCustomerAppointment()` (gate 8 tiếng).

Điểm quan trọng:
- **Hủy** (`da_huy`): trừ 10 điểm uy tín, **không bao giờ mất buổi**, áp dụng như nhau cho mọi loại gói.
- **Không đến** (`khong_den`) tách theo nhóm gói:
  - Nhóm B (gói trả trước — trả thẳng 100%/trả góp): không trừ điểm uy tín (tránh phạt kép vì đã đóng tiền), nhưng **mất buổi** — buổi đó tính là đã dùng vào gói.
  - Nhóm A (khám lẻ, dịch vụ lẻ, gói tính từng buổi): trừ 20 điểm uy tín, buổi **không** bị trừ vào gói.
- Khách tự hủy qua Client chỉ được khi còn **≥ 8 tiếng** trước giờ hẹn; dưới mốc này phải gọi Lễ tân/Admin hủy giúp (2 vai trò này không bị giới hạn thời gian).
- Chỉ **Hủy** mới giải phóng nhân sự/phòng đã gán; **Không đến** giữ nguyên để vẫn truy được ai phụ trách ca đó.

## 3. Thanh toán gói liệu trình

File: [`03_thanh_toan_goi.puml`](03_thanh_toan_goi.puml) / [`03_thanh_toan_goi.png`](03_thanh_toan_goi.png)

Nguồn đối chiếu: `backend/src/domain/billing.ts::isExamWaived()` / `getMinPaymentRequired()`.

Điểm quan trọng:
- 3 hình thức thanh toán: **Trả thẳng 100%** (đóng đủ ngay), **Trả góp** (cọc Đợt 1 = 50%, đóng Đợt 2 khi tới buổi mốc), **Từng buổi** (không đóng trước, thu theo buổi thực hiện). Lưu ý `tra_thang` = "Trả thẳng", **không phải** "trả tháng" — dễ nhầm vì chính tả gần giống.
- Miễn phí khám lâm sàng chỉ áp dụng khi: gói loại **Liệu trình** (không áp dụng dịch vụ lẻ `LE`), giá gói ≥ 1.000.000đ, và hình thức là Trả thẳng hoặc Trả góp.
- Mốc bắt buộc đóng Đợt 2 của Trả góp = buổi thứ `floor(tổng số buổi × 40%) + 1` — không phải cố định giữa gói (`floor(N/2)`), biên độ 40% được chọn để cọc 50% luôn dư ít nhất bằng mức phạt hủy gói (10%).

## 4. Hủy gói liệu trình / Hoàn tiền

File: [`04_huy_goi_hoan_tien.puml`](04_huy_goi_hoan_tien.puml) / [`04_huy_goi_hoan_tien.png`](04_huy_goi_hoan_tien.png)

Nguồn đối chiếu: `backend/src/domain/billing.ts::calculatePackageCancellationRefund()` + `backend/src/repositories/admin.repository.ts::handlePackageRefund()` (endpoint `POST /admin/invoices/:id/refund-package`, chỉ Admin/Quản lý — vai trò 5, 6).

Điểm quan trọng:
- Gói đã quá hạn sử dụng đi theo luồng **khác hẳn** (`expirePackageNoRefund` — giữ nguyên toàn bộ tiền đã thu, không hoàn), tuyệt đối không áp dụng công thức phạt 10% + hoàn phần dư của luồng hủy giữa chừng thông thường.
- Phí phạt 10% tính trên **giá đã chốt theo hình thức thanh toán** (`giaThanhToanGoi`) — cố định theo hợp đồng, không đổi theo số tiền đã đóng thực tế hay cách xử lý phí khám.
- Phí khám thu hồi lại chỉ phát sinh khi khách **được miễn phí lúc mua nhưng chưa từng đóng riêng** — ưu tiên tuyệt đối số tiền đã snapshot vào hóa đơn lúc bán gói (không dùng giá khám hiện hành, tránh sai lệch nếu Admin đổi giá sau đó).
