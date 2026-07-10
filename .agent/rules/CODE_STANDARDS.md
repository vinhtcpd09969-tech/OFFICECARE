# Quy chuẩn phát triển phần mềm dự án PhysioFlow (CODE_STANDARDS.md)

Tài liệu này định nghĩa các tiêu chuẩn và nguyên tắc bắt buộc phải tuân thủ khi viết mã nguồn, thiết kế kiến trúc và phân quyền cho toàn bộ hệ thống dự án **PhysioFlow**. Mọi tác vụ phát triển phần mềm, sửa đổi hoặc thêm tính năng mới ở các phiên làm việc sau đều phải đối chiếu và tuân thủ nghiêm ngặt các quy chuẩn dưới đây.

---

## 🏗️ 1. Quy chuẩn kiến trúc & Tách biệt trách nhiệm trang (Single Responsibility Principle)

### Nguyên tắc cốt lõi:
Không được phép gộp chung các luồng giao diện, logic hiển thị hoặc phân quyền của nhiều Actor khác nhau (Admin, Lễ tân, Bác sĩ, Kỹ thuật viên) vào cùng một file Page Component (ví dụ: dùng các câu lệnh `if (roleView === 'receptionist')` để thay đổi toàn bộ bố cục trang).

### Tiêu chuẩn thư mục & trang (FSD - Feature-Sliced Design):
1. **Trang độc lập theo vai trò:** Mỗi Actor phải có một tệp Page riêng biệt nằm trong thư mục tính năng của chính vai trò đó:
   * **Admin / Quản lý:** `features/admin/pages/ManageAppointments.tsx`
   * **Lễ tân (Receptionist):** `features/receptionist/pages/ReceptionistAppointments.tsx`
   * **Bác sĩ (Doctor):** `features/doctor/pages/DoctorAppointments.tsx`
2. **Kế thừa và tái sử dụng (Shared Components):**
   * Các phần giao diện phức tạp giống nhau (ví dụ: Lịch trình, Bộ lọc ngày, Modal chi tiết, Modal đặt lịch) phải được tách thành các UI Component dùng chung (Shared Components) đặt trong thư mục con `/ui/` hoặc `/components/`.
   * Các trang độc lập của từng Actor sẽ import các Shared Component này và cấu hình thông qua các props (ví dụ: `isReceptionistOverride={true}`, `activeRole="doctor"`).

---

## ♻️ 2. Quy chuẩn tách biệt Logic & Trạng thái (Hooks Separation)

1. **Custom Hooks cho logic dữ liệu:**
   * Không được tự ý gọi API trực tiếp (`axios.get`, `axios.post`) trong các file Page lớn.
   * Toàn bộ logic gọi dữ liệu, đồng bộ hóa trạng thái lịch biểu phải được đóng gói vào các Custom Hook dùng chung (ví dụ: `useAppointmentsData`).
2. **Custom Hooks cho hành động (Action Hooks):**
   * Các hành động thay đổi dữ liệu (như cập nhật trạng thái, gán phòng khám, gán bác sĩ, lưu thông tin) phải được đóng gói vào các Hook hành động (ví dụ: `useAppointmentActions`).
   * Các Page Component chỉ việc import hook này, truyền các state cần thiết và sử dụng các hàm phản hồi (`onSave`, `onCheckIn`, `onCancel`).

---

## 🚦 3. Quy chuẩn Định tuyến & Layout (Route & Layout Synchronization)

1. **Đường dẫn URL riêng biệt:** 
   * Mỗi vai trò phải chạy trên một đường dẫn URL chuyên biệt để đồng bộ Layout Sidebar và Menu điều hướng riêng.
   * Lễ tân: `/receptionist/appointments`
   * Bác sĩ: `/doctor/appointments`
   * Quản lý/Admin: `/admin/appointments`
2. **Ngăn chặn trùng lặp route:** Không được khai báo các route đè lên nhau hoặc cùng một URL trỏ về nhiều Component khác nhau trong tệp `AppRoutes.tsx`.
3. **Đồng bộ hóa nút giả lập:** Khi Admin hoặc Quản lý click nút chuyển vai trò giả lập (để kiểm thử), hệ thống bắt buộc phải thực hiện lệnh chuyển hướng URL (`navigate('/receptionist/appointments')`) thay vì thay đổi Layout tại chỗ để đảm bảo URL luôn phản ánh đúng trang đang hiển thị.

---

## 🔐 4. Quy chuẩn phân quyền chi tiết (Fine-grained Authorization)

### Quy chuẩn Backend (API RBAC):
1. **Không sử dụng catch-all middleware chặn chung đầu file:** Hạn chế tối đa việc viết `router.use(authorizeRoles(5, 6))` ở đầu tệp route nếu tệp đó chứa các API mà nhân viên (Lễ tân, Bác sĩ) cần đọc thông tin.
2. **Phân quyền cụ thể trên từng Endpoint:**
   * Quyền đọc dữ liệu (`GET`): Cho phép Lễ tân (2), Bác sĩ (4), Kỹ thuật viên (3) truy cập đọc các thông tin cần thiết.
   * Quyền thay đổi dữ liệu (`POST`, `PUT`, `DELETE`): Bảo vệ nghiêm ngặt bằng middleware, giới hạn chỉ dành cho Quản lý (6) hoặc Admin (5) thực tế, trừ các nghiệp vụ đặc thù được cho phép (như Lễ tân đặt lịch vãng lai hoặc check-in).

---

## 🎨 5. Quy chuẩn Thiết kế UI/UX & Trực quan (Premium Aesthetics)

1. **Giao diện Glassmorphism & Gradient:**
   * Sử dụng màu nền mờ mịn kết hợp border siêu mảnh (`border-slate-100/80` hoặc `dark:border-zinc-800/60`) và hiệu ứng đổ bóng mờ nhẹ để tạo giao diện cao cấp.
   * Dùng hiệu ứng gradient tinh tế làm nổi bật các thẻ KPI chính hoặc thanh chỉ dẫn quy trình.
2. **Hiệu ứng Micro-animations:**
   * Các trạng thái chờ tải (loading) phải sử dụng bộ xương (skeleton) hoặc spinner đồng bộ của dự án.
   * Các hành động điều phối lịch hoặc cảnh báo quan trọng phải có chuyển động mượt mà (dùng Framer Motion như `AnimatePresence`, `motion.div`).
3. **Đồng bộ bảng màu trạng thái (Status Colors):**
   * Các màu trạng thái lâm sàng (Chờ khám, Đang khám, Hoàn thành, Đã hủy) phải đồng nhất trên tất cả các trang của mọi Actor để nhân viên không bị nhầm lẫn khi theo dõi.

---

## 🧠 6. Tư duy Lập trình Chủ động & Tối ưu hóa (Proactive Engineering & DRY Principle)

### 1. Chủ động phân tích khả năng tái sử dụng (DRY):
* Trước khi tiến hành viết hay sửa đổi bất kỳ đoạn mã nào, AI phải tự động đánh giá xem đoạn giao diện (UI) hoặc xử lý logic (Logic) đó có thể được đóng gói và tái sử dụng cho các Actor hoặc Module khác hay không.
* Tuyệt đối không copy-paste code thô hoặc tạo ra các component tương đồng nhưng nằm rải rác ở nhiều file khác nhau nếu có thể gộp chung thành Shared Component / Shared Hook.

### 2. Bắt buộc đề xuất phương án và so sánh Ưu/Nhược điểm trước khi lập trình:
* Khi nhận được yêu cầu phát triển hoặc tối ưu hóa từ người dùng, AI phải đóng vai trò là một **Lập trình viên / Kiến trúc sư phần mềm chuyên nghiệp**, trình bày hướng giải quyết cụ thể bao gồm:
  * **Hướng tiếp cận:** Mô tả cách tổ chức file, luồng xử lý và mối liên kết dữ liệu.
  * **Ưu điểm (Pros):** Khả năng tái sử dụng, hiệu năng tải trang, tính dễ bảo trì.
  * **Nhược điểm (Cons) / Đánh đổi (Trade-offs):** Mức độ phức tạp, tác động tới các phần code cũ, hoặc rủi ro phát sinh lỗi.
* Chỉ khi người dùng đồng ý với phương án đề xuất thì mới tiến hành thực thi code.

---

## 🚦 7. Quy chuẩn Nghiệp vụ Đặt lịch & Thanh toán Gói trị liệu (Package Booking & Installment Rules)

### 1. Nguyên tắc Đặt lịch Theo Thứ Tự (Sequential Session Booking):
* **Ràng buộc**: Bệnh nhân bắt buộc phải hoàn thành buổi trị liệu số $M - 1$ (`trang_thai = 'hoan_thanh'`) mới được đặt lịch hẹn cho buổi số $M$.
* **Frontend**: Nút "Đặt lịch" của buổi số $M$ phải bị vô hiệu hóa (disabled) và hiển thị cảnh báo yêu cầu hoàn thành buổi trước đó nếu buổi $M - 1$ chưa ở trạng thái hoàn thành.
* **Backend**: Kiểm tra chặn không cho đặt lịch buổi tiếp theo nếu khách hàng đang có lịch đặt hoạt động (`chua_xac_nhan`, `cho_xac_nhan`, `da_xac_nhan`, `da_checkin`, `dang_kham`) của phác đồ này.

### 2. Quy tắc Thanh toán Trả góp Đợt 2 (Installment Plan Cutoff Rule):
* **Nguyên tắc**: Để bảo vệ dòng tiền phòng khám và tránh thất thoát doanh thu, bệnh nhân thanh toán theo hình thức Trả góp 50% (`tra_gop`) bắt buộc phải thanh toán 50% còn lại (Đợt 2) trước khi bắt đầu thực hiện buổi trị liệu số $H$ (với $H = N / 2$, trong đó $N$ là tổng số buổi của gói).
* **Ví dụ cụ thể**:
  * Gói 10 buổi ($N=10, H=5$): Yêu cầu đóng tiền Đợt 2 ngay tại buổi số 5 (khi đã hoàn thành 4 buổi đầu).
  * Gói 8 buổi ($N=8, H=4$): Yêu cầu đóng tiền Đợt 2 ngay tại buổi số 4 (khi đã hoàn thành 3 buổi đầu).
  * Gói 12 buổi ($N=12, H=6$): Yêu cầu đóng tiền Đợt 2 ngay tại buổi số 6 (khi đã hoàn thành 5 buổi đầu).
* **Frontend**: 
  * Cảnh báo đóng tiền Đợt 2 sẽ xuất hiện ở bảng lịch hẹn và modal chi tiết khi buổi hẹn có thứ tự `so_thu_tu_buoi >= Math.floor(tong_so_buoi_goi / 2)`.
  * Nút bấm xác nhận trạng thái "Hoàn thành" của buổi đó sẽ bị chặn cho đến khi hóa đơn gói được thanh toán đầy đủ (`da_thanh_toan`).
  * Nhãn nút bấm thanh toán dưới chân modal chi tiết lịch hẹn của gói phải hiển thị rõ ràng: **"Vui lòng thanh toán liệu trình"** thay vì các từ dễ gây hiểu lầm là thanh toán lẻ.

### 3. Quy tắc Thanh toán Từng buổi (Pay-Per-Session Plan Rules):
* **Ràng buộc**: Bệnh nhân trả tiền theo từng buổi (`tung_buoi`) phải hoàn tất thanh toán cho buổi hiện tại mới được phép đặt lịch hẹn cho buổi kế tiếp.
* **Frontend**: 
  * Khi bệnh nhân hoàn tất thanh toán đợt đóng tiền của buổi trị liệu hiện tại (ví dụ buổi 4), màn hình thanh toán thành công phải hiển thị nút hành động nhanh **"Đặt lịch hẹn Buổi 5 ngay"** (truyền tham số `daDangKyGoiId` và `nextSessionNum` vào `paymentSuccessData`).
  * Danh sách hồ sơ điều trị sẽ chặn đặt lịch buổi tiếp theo (ví dụ Buổi 5) nếu số tiền đã trả thực tế tích lũy nhỏ hơn số tiền tích lũy của các buổi đã dùng.

### 4. Quy chuẩn Báo lỗi và Phản hồi Khách hàng (Client-Safe Error Propagation):
* **Backend**: 
  * Mọi lỗi ràng buộc nghiệp vụ (chưa thanh toán buổi trước, trùng lịch nhân sự, đã có lịch đặt đang hoạt động...) được ném ra từ Repository/Service dưới dạng `Error` phải được Controller kiểm tra và trả về dưới dạng mã `400 Bad Request` kèm theo thông điệp lỗi gốc (nếu là lỗi nghiệp vụ do em tự ném ra).
  * Không được phép nuốt lỗi nghiệp vụ rồi trả về lỗi chung chung `500 Lỗi server`.
