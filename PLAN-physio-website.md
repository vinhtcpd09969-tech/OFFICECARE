# KẾ HOẠCH PHÁT TRIỂN HỆ THỐNG PHÒNG KHÁM OFFICE CARE

> [!IMPORTANT]
> **TÀI LIỆU KẾ HOẠCH PHÁT TRIỂN CHÍNH THỨC CỦA DỰ ÁN OFFICE CARE.**
> Tài liệu này mô tả chi tiết kiến trúc phân bổ mã nguồn thực tế và kế hoạch thực hiện các Task cốt lõi giúp đưa hệ thống phòng khám vào hoạt động ổn định.

---

## 1. TỔNG QUAN DỰ ÁN

Mục tiêu của dự án **Office Care** là xây dựng một nền tảng quản trị thông tin lâm sàng và điều phối vận hành phòng khám Vật lý trị liệu tinh gọn. Hệ thống bao gồm một Server Backend (Express API) hiệu năng cao kết nối PostgreSQL và một ứng dụng Client Dashboard (React SPA) chia đúng phân quyền bảo mật cho 5 vai trò tương tác.

---

## 2. KIẾN TRÚC MÃ NGUỒN THỰC TẾ (DIRECTORY TREE MAP)

Cấu trúc thư mục của dự án được tổ chức khoa học, tách biệt rõ rệt trách nhiệm của từng phân hệ:

```
/
├── backend/                  # PHÂN HỆ MÁY CHỦ (EXPRESS + TYPESCRIPT)
│   ├── src/
│   │   ├── config/           # Cấu hình kết nối DB (db.ts), Swagger API (swagger.ts)
│   │   ├── controllers/      # Tầng nhận HTTP Request, gọi Services và phản hồi JSON
│   │   ├── middlewares/      # Chặn kiểm tra JWT Auth, validate dữ liệu đầu vào
│   │   ├── repositories/     # Tầng TRUY VẤN RAW SQL (pg pool) - Tuyệt đối không dùng ORM!
│   │   ├── routes/           # Định tuyến API Endpoint Express
│   │   ├── schemas/          # Zod validation schemas kiểm tra dữ liệu đầu vào
│   │   ├── services/         # TẦNG NGHIỆP VỤ CỐT LÕI (Business Logic)
│   │   ├── scripts/          # Scripts khởi tạo DB (init_db.ts) và hạt giống dữ liệu (seed.ts)
│   │   └── utils/            # Helper functions dùng chung
│   └── package.json
│
├── frontend/                 # PHÂN HỆ CLIENT DASHBOARD (REACT + VITE + TAILWIND)
│   ├── src/
│   │   ├── api/              # Axios Client instance và các hàm kết nối API tập trung
│   │   ├── components/       # Các UI Components dùng chung (Button, Table, Inputs...)
│   │   ├── features/         # CẤU TRÚC PHÂN HỆ CHỨC NĂNG (FEATURES-BASED)
│   │   │   ├── admin/        # Trang quản trị nhân sự, thiết bị, tài chính của Admin
│   │   │   ├── auth/         # Giao diện đăng ký, đăng nhập, xác minh mã OTP Email
│   │   │   ├── customer/     # Portal cá nhân theo dõi liệu trình của Khách hàng
│   │   │   ├── public/       # Landing page giới thiệu và Form đặt lịch Smart Booking
│   │   │   └── receptionist/ # Dashboard điều phối, check-in, thanh toán của Lễ tân
│   │   ├── hooks/            # Custom React Hooks
│   │   ├── layouts/          # Giao diện bố cục khung (AdminLayout, CustomerLayout)
│   │   ├── routes/           # React Router v6 điều hướng và bảo vệ Route (`AppRoutes.tsx`)
│   │   ├── stores/           # Zustand global state (authStore.ts quản lý phiên đăng nhập)
│   │   └── types/            # TypeScript Interfaces và định nghĩa kiểu dữ liệu
│   └── package.json
```

---

## 3. PHÂN RÃ HỆ THỐNG TASK (TASK BREAKDOWN - EXECUTED)

Hệ thống đã trải qua 4 giai đoạn phát triển cốt lõi và tích hợp nghiệm thu:

### ⚙️ Giai đoạn 1: Nền tảng Cơ sở dữ liệu & API Backend (Executed)
*   **Task 1.1: Khởi tạo Cấu trúc DB PostgreSQL**
    *   *Mô tả:* Thực hiện chạy script `init_db.ts` tạo 23 bảng dữ liệu quan hệ, thiết lập khóa ngoại và ràng buộc Exclusion chống trùng lịch hẹn.
    *   *Kiểm tra:* Truy vấn PostgreSQL CLI xác nhận các bảng và index hoạt động chính xác.
*   **Task 1.2: Thiết lập Express TypeScript Skeleton**
    *   *Mô tả:* Khởi tạo server Express, kết nối Database Pool qua `pg` driver, cấu hình middleware bắt lỗi tập trung và Swagger API Docs (`/api-docs`).
    *   *Kiểm tra:* Server khởi chạy thành công trên Port 5000, kết nối DB không có lỗi.
*   **Task 1.3: API Xác thực & Người dùng (JWT + OTP)**
    *   *Mô tả:* Viết các endpoint đăng ký, đăng nhập, gửi mã OTP Email qua Nodemailer, phát sinh JWT (Access Token & Refresh Token) an toàn.
    *   *Kiểm tra:* Xác nhận phân quyền chính xác cho 5 vai trò qua middleware `authenticateToken` và `requireRole`.

### 🩺 Giai đoạn 2: Tầng Logic Nghiệp vụ & Dữ liệu y khoa (Executed)
*   **Task 2.1: API Quản lý dịch vụ, Phòng & Thiết bị y tế**
    *   *Mô tả:* Viết các lớp Controller-Service-Repository xử lý CRUD Dịch vụ lẻ, Phòng trị liệu và Thiết bị y tế chuyên dụng (`thiet_bi_y_te`).
    *   *Kiểm tra:* Lễ tân có thể gán thiết bị y tế vào phòng, tìm phòng trống dựa trên yêu cầu thiết bị của dịch vụ qua View `v_phong_san_sang_theo_dich_vu`.
*   **Task 2.2: API Đặt lịch thông minh & Phác đồ điều trị**
    *   *Mô tả:* Xây dựng API đặt lịch khám lâm sàng `lich_dat`. Bác sĩ khám lâm sàng ghi nhận chẩn đoán `chan_doan`, chống chỉ định `chong_chi_dinh` và chỉ định gói điều trị `khuyen_nghi_goi_id`.
    *   *Kiểm tra:* Đảm bảo không thể đặt lịch trùng giờ đối với chuyên gia hoặc phòng, trả về 409 Conflict.
*   **Task 2.3: API Liệu trình & Nhật ký SOAP**
    *   *Mô tả:* Quản lý vòng đời gói điều trị `lich_dieu_tri` của khách. Kỹ thuật viên tạo `buoi_tri_lieu`, ghi chép SOAP note sau mỗi buổi tập.
    *   *Kiểm tra:* Cột `so_buoi_da_dung` tự động cộng 1 và cập nhật trạng thái khi hoàn thành buổi trị liệu.

### 💻 Giai đoạn 3: Phát triển Giao diện Client Dashboard React (Executed)
*   **Task 3.1: Khởi tạo React Client với Tailwind CSS & Router**
    *   *Mô tả:* Cấu hình Vite, Tailwind CSS, cài đặt React Router v6 bảo vệ tuyến đường bằng phân quyền lưu trong Zustand Store (`authStore.ts`).
    *   *Kiểm tra:* Ứng dụng chạy mượt mà trên Port 5173, tự động chuyển hướng người dùng về đúng phân hệ Dashboard sau khi đăng nhập.
*   **Task 3.2: Landing Page & Smart Booking**
    *   *Mô tả:* Giao diện Landing page chuyên nghiệp giới thiệu dịch vụ và Form đặt lịch khám nhanh không cần đăng nhập cho khách vãng lai.
    *   *Kiểm tra:* Người dùng đặt lịch thành công, hệ thống tự động sinh tài khoản nháp và đính kèm triệu chứng/ảnh đau.
*   **Task 3.3: Giao diện Lễ tân & Quản lý Hóa đơn Tài chính**
    *   *Mô tả:* Màn hình Lễ tân quản lý danh sách cuộc hẹn, check-in quét thông tin cá nhân, lập hóa đơn, đối soát trạng thái chuyển đổi gói dùng thử ở buổi thứ 4 và hủy gói hoàn tiền 50%.
    *   *Kiểm tra:* Áp dụng công thức hoàn tiền tự động chính xác từng đồng VNĐ.

### 🌟 Giai đoạn 4: Nghiệm thu & Tối ưu hóa (Executed)
*   **Task 4.1: Kết nối Ghép nối API & Interceptors**
    *   *Mô tả:* Ghép nối Axios HTTP Client với Interceptor tự động refresh token khi access token hết hạn mà không gây gián đoạn trải nghiệm.
    *   *Kiểm tra:* Luồng đăng nhập hoạt động trơn tru 100%.
*   **Task 4.2: Tích hợp AI Assistant & Nhật ký bảo mật**
    *   *Mô tả:* Hệ thống AI sinh tóm tắt bệnh án ngắn gọn hiển thị kèm biểu tượng **"✦ AI"**. Thực hiện ghi `system_audit_log` khi KTV sửa đổi nội dung AI.
    *   *Kiểm tra:* Màn hình hiển thị nhãn AI đẹp mắt, nhật ký bảo mật lưu chuẩn xác IP và payload.

---

## 4. PHASE X: TIÊU CHÍ VERIFICATION CHẤT LƯỢNG (DEFINITION OF DONE)

Hệ thống chỉ được coi là hoàn thiện và sẵn sàng chuyển giao khi vượt qua toàn bộ các bước kiểm thử tự động sau:
- [x] **Linting & Compilation:** Không còn lỗi cú pháp hoặc lỗi kiểu dữ liệu TypeScript khi build (`npm run build`).
- [x] **Database Constraint Validation:** Kiểm tra bằng script các ràng buộc chống trùng lịch và phòng trống hoạt động chính xác.
- [x] **No Purple / Violet Hex Code (Purple Ban):** Tuân thủ tuyệt đối quy tắc cấm sử dụng các mã màu tím cơ bản bừa bãi trong giao diện.
- [x] **Authentication Integrity:** Phân quyền cứng, tài khoản `khach_hang` tuyệt đối không thể truy cập API `/api/v1/admin/*`.
- [x] **Mathematical Accuracy:** Công thức hoàn trả tiền 50% chạy chính xác không gặp sai sót làm tròn số thập phân.
- [x] **Raw SQL Assurance:** 100% mã nguồn backend truy vấn qua `pg` pool, không tồn tại bất kỳ thư viện ORM nào (Prisma, Sequelize).
