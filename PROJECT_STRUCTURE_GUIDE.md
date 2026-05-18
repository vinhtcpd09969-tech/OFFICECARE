# BẢN ĐỒ CẤU TRÚC DỰ ÁN & HƯỚNG DẪN VẬN HÀNH DÀNH CHO DEVELOPER (PHYSIOFLOW SYSTEM)

Tài liệu này là cẩm nang toàn diện giúp bạn hiểu rõ cấu trúc dự án PhysioFlow, vai trò của từng tệp tin/thư mục, và cung cấp các quy trình chuẩn (workflows) khi bạn thực hiện các tác vụ phát triển hệ thống như: **Sửa lỗi (Fix Bug)**, **Làm giao diện (UI/UX)**, **Viết API mới (Backend)** hay **Điều chỉnh Cơ sở dữ liệu (PostgreSQL)**.

---

## 🗺️ 1. TỔNG QUAN KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE OVERVIEW)

Hệ thống được thiết kế theo triết lý hiện đại, rạch ròi giữa Client-side và Server-side nhằm tối đa khả năng mở rộng, bảo trì và đảm bảo hiệu năng cao:

### 🔹 Backend: Kiến Trúc 3 Lớp (3-Tier Architecture)
*   **Controller (Lớp Kiểm soát):** Nhận request từ HTTP, gọi Schema để kiểm tra tính hợp lệ dữ liệu, gọi Service để xử lý nghiệp vụ, và trả về Response (JSON, Mã lỗi).
*   **Service (Lớp Nghiệp vụ):** Nơi chứa toàn bộ Logic nghiệp vụ cốt lõi của phòng khám (ví dụ: tính toán số tiền hoàn trả theo công thức 50% số buổi chưa tập, kiểm tra lịch trực của kỹ thuật viên).
*   **Repository (Lớp Truy xuất Dữ liệu):** Trực tiếp viết các câu lệnh SQL (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) thuần túy để tương tác với cơ sở dữ liệu PostgreSQL. Không dùng ORM cồng kềnh giúp đạt hiệu năng tối đa.

### 🔸 Frontend: Kiến Trúc Theo Chức Năng (Feature-Based Architecture)
*   Thay vì chia nhỏ folder theo kiểu truyền thống (tất cả pages vào một nơi, tất cả components vào một nơi), dự án chia theo các phân hệ nghiệp vụ chính (**Features**).
*   Mỗi Feature (Ví dụ: `admin`, `receptionist`, `auth`, `customer`) sẽ tự quản lý các **Components** (thành phần giao diện nhỏ chỉ dùng trong feature đó) và **Pages** (màn hình hoàn chỉnh) của riêng nó. Điều này giúp code gọn gàng, tránh xung đột chéo.

---

## 📁 2. CHI TIẾT VAI TRÒ CỦA TỪNG THƯ MỤC VÀ TỆP TIN

### 📂 A. THƯ MỤC GỐC (ROOT DIRECTORY)
*   [docker-compose.yml](file:///d:/VLTT/VLTT/docker-compose.yml): Cấu hình chạy các container Docker bao gồm cơ sở dữ liệu PostgreSQL và giao diện quản lý cơ sở dữ liệu PgAdmin.
*   [office_care_backup.sql](file:///d:/VLTT/VLTT/office_care_backup.sql): Bản sao lưu cơ sở dữ liệu SQL mới nhất của hệ thống, chứa cấu trúc bảng (schema) và dữ liệu hạt giống gốc để khôi phục nhanh.
*   [MODULE_ARCHITECTURE.md](file:///d:/VLTT/VLTT/MODULE_ARCHITECTURE.md): *(Tham khảo)* Bản phác thảo luồng nghiệp vụ phòng khám (Bác sĩ, Lễ tân, Kỹ thuật viên, Khách hàng).
*   [project-memory/](file:///d:/VLTT/VLTT/project-memory/): Nơi lưu trữ trạng thái hiện tại của dự án (`CURRENT_STATE.md`), nhật ký phiên làm việc (`SESSION_LOG.md`), và các nhiệm vụ kế tiếp (`TASKS.md`). Đây là bộ não lưu trữ thông tin cho AI khi tiếp quản code.

---

### 📂 B. PHÂN HỆ BACKEND (`/backend`)
Nơi chứa toàn bộ mã nguồn máy chủ Node.js (Express + TypeScript).

*   **`backend/src/config/`**: Chứa cấu hình hệ thống bao gồm kết nối cơ sở dữ liệu [db.ts](file:///d:/VLTT/VLTT/backend/src/config/db.ts) và sinh Swagger API Docs [swagger.ts](file:///d:/VLTT/VLTT/backend/src/config/swagger.ts).
*   **`backend/src/controllers/`**: Xử lý HTTP Request/Response. Chịu trách nhiệm nhận tham số từ client, kiểm tra hợp lệ sơ bộ qua schema và phản hồi JSON thích hợp.
    *   [auth.controller.ts](file:///d:/VLTT/VLTT/backend/src/controllers/auth.controller.ts): Đăng ký, đăng nhập, gửi/xác minh mã OTP.
    *   [admin.controller.ts](file:///d:/VLTT/VLTT/backend/src/controllers/admin.controller.ts): Điều phối các hoạt động CRUD cho toàn bộ tài nguyên hệ thống từ Admin.
    *   [receptionist.controller.ts](file:///d:/VLTT/VLTT/backend/src/controllers/receptionist.controller.ts): Quản lý tiếp nhận lịch hẹn, hóa đơn thanh toán trực tiếp tại phòng khám.
    *   [appointment.controller.ts](file:///d:/VLTT/VLTT/backend/src/controllers/appointment.controller.ts): Quản lý tạo lịch hẹn khám trực tuyến và tại chỗ.
*   **`backend/src/services/`**: Nơi chứa toàn bộ Logic nghiệp vụ cốt lõi (Business Logic). Đây là tầng quan trọng nhất của server xử lý cách thức hoạt động của các nghiệp vụ.
    *   [auth.service.ts](file:///d:/VLTT/VLTT/backend/src/services/auth.service.ts) | [admin.service.ts](file:///d:/VLTT/VLTT/backend/src/services/admin.service.ts) | [receptionist.service.ts](file:///d:/VLTT/VLTT/backend/src/services/receptionist.service.ts) | [appointment.service.ts](file:///d:/VLTT/VLTT/backend/src/services/appointment.service.ts)
*   **`backend/src/repositories/`**: Trực tiếp viết các câu truy vấn SQL (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) thuần túy để tương tác với cơ sở dữ liệu PostgreSQL.
    *   [auth.repository.ts](file:///d:/VLTT/VLTT/backend/src/repositories/auth.repository.ts) | [admin.repository.ts](file:///d:/VLTT/VLTT/backend/src/repositories/admin.repository.ts) | [receptionist.repository.ts](file:///d:/VLTT/VLTT/backend/src/repositories/receptionist.repository.ts) | [appointment.repository.ts](file:///d:/VLTT/VLTT/backend/src/repositories/appointment.repository.ts)
*   **`backend/src/routes/`**: Các đầu endpoint định tuyến API Express. Gắn kết URL với Middlewares và Controller tương ứng.
    *   [auth.routes.ts](file:///d:/VLTT/VLTT/backend/src/routes/auth.routes.ts) | [admin.routes.ts](file:///d:/VLTT/VLTT/backend/src/routes/admin.routes.ts) | [receptionist.routes.ts](file:///d:/VLTT/VLTT/backend/src/routes/receptionist.routes.ts) | [client.routes.ts](file:///d:/VLTT/VLTT/backend/src/routes/client.routes.ts)
*   **`backend/src/schemas/`**: Định nghĩa Schema Zod để kiểm tra hợp lệ dữ liệu đầu vào (Validation) từ phía client gửi lên trước khi chuyển sâu hơn vào logic máy chủ.
    *   [auth.schema.ts](file:///d:/VLTT/VLTT/backend/src/schemas/auth.schema.ts) | [admin.schema.ts](file:///d:/VLTT/VLTT/backend/src/schemas/admin.schema.ts) | [appointment.schema.ts](file:///d:/VLTT/VLTT/backend/src/schemas/appointment.schema.ts) | [finance.schema.ts](file:///d:/VLTT/VLTT/backend/src/schemas/finance.schema.ts)
*   **`backend/src/middlewares/`**: Các bộ lọc trung gian.
    *   [auth.middleware.ts](file:///d:/VLTT/VLTT/backend/src/middlewares/auth.middleware.ts): Middleware xác thực JWT Token và kiểm tra phân quyền người dùng (Role-Based Access Control - RBAC).
*   **`backend/src/utils/`**: Các hàm tiện ích dùng chung.
    *   [mailer.ts](file:///d:/VLTT/VLTT/backend/src/utils/mailer.ts): Cấu hình gửi OTP Email qua Nodemailer.
    *   [audit.util.ts](file:///d:/VLTT/VLTT/backend/src/utils/audit.util.ts): Ghi nhật ký lịch sử thao tác của các thành viên trên hệ thống (Audit Log).
*   **`backend/src/scripts/`**: Các script quản trị tiện lợi cho nhà phát triển để cài đặt và chạy thử hệ thống.
    *   [init_db.ts](file:///d:/VLTT/VLTT/backend/src/scripts/init_db.ts): Khởi tạo lại tất cả bảng trong Database theo đúng cấu trúc chuẩn.
    *   [seed.ts](file:///d:/VLTT/VLTT/backend/src/scripts/seed.ts): Seeder nạp dữ liệu mẫu phong phú tự động để thử nghiệm ứng dụng.
    *   [drop_old_db.ts](file:///d:/VLTT/VLTT/backend/src/scripts/drop_old_db.ts): Dọn dẹp các bảng cũ.
*   **`backend/src/index.ts`**: Tệp tin khởi chạy server Express chính. Đăng ký các Middleware cơ bản (Cors, JSON) và tích hợp các module API.

---

### 📂 C. PHÂN HỆ FRONTEND (`/frontend`)
Ứng dụng giao diện người dùng SPA sử dụng React + TypeScript + TailwindCSS được bundler bởi Vite.

*   **`frontend/src/api/`**: Cấu hình Axios Client gọi API Backend, thiết lập token tự động cho mỗi request.
*   **`frontend/src/components/`**: Các React Component dùng chung toàn cục (Nút bấm, ô tìm kiếm, modal xác nhận dùng lại nhiều nơi).
*   **`frontend/src/features/`**: Tổ chức giao diện và nghiệp vụ theo phân hệ chức năng:
    *   📂 **`admin/`**: Các màn hình phức tạp quản lý tất cả các khía cạnh của phòng khám:
        *   `pages/AdminDashboard.tsx`: Thống kê doanh thu, số liệu lịch hẹn qua biểu đồ Recharts.
        *   `pages/ManageStaff.tsx`: CRUD nhân viên phòng khám (bác sĩ, kỹ thuật viên, lễ tân), khóa/mở khóa tài khoản.
        *   `pages/ManageServices.tsx` & `ManagePackages.tsx`: Thiết lập danh mục dịch vụ và gói điều trị.
        *   `pages/ManageAppointments.tsx` & `ManageSchedules.tsx`: Master View lịch hẹn toàn hệ thống và xếp ca làm việc cho nhân viên.
        *   `pages/ManageFinance.tsx` & `ManageVouchers.tsx`: Theo dõi hóa đơn, kích hoạt tính năng hoàn tiền và Voucher khuyến mãi.
    *   📂 **`receptionist/`**: Các màn hình tác vụ nhanh của Lễ tân:
        *   `pages/ReceptionistDashboard.tsx`: Check-in nhanh khi khách hàng đến phòng khám.
        *   `pages/WalkInBooking.tsx`: Đặt lịch trực tiếp tại quầy cho khách vãng lai.
        *   `pages/QuickBilling.tsx`: Lập hóa đơn và in biên nhận thanh toán ngay lập tức.
    *   📂 **`customer/`**: Cổng thông tin (Portal) riêng của khách hàng:
        *   `pages/Dashboard.tsx`: Xem lịch trình điều trị cá nhân, số buổi còn lại của gói, đánh giá Kỹ thuật viên.
    *   📂 **`public/`**: Trang công cộng dành cho khách chưa đăng nhập:
        *   `pages/Home.tsx`: Trang chủ Landing Page giới thiệu dịch vụ và chính sách.
        *   `pages/Booking.tsx`: Form thông minh đặt lịch hẹn khám lượng giá ban đầu.
    *   📂 **`auth/`**: Các trang liên quan đến vòng đời tài khoản:
        *   `pages/Login.tsx` | `pages/Register.tsx` | `pages/VerifyEmail.tsx` (Xác thực OTP Email).
*   **`frontend/src/layouts/`**: Các bộ khung giao diện chính cho từng vai trò:
    *   [AdminLayout.tsx](file:///d:/VLTT/VLTT/frontend/src/layouts/AdminLayout.tsx): Sidebar và thanh trạng thái điều hướng cho Admin.
    *   [ReceptionistLayout.tsx](file:///d:/VLTT/VLTT/frontend/src/layouts/ReceptionistLayout.tsx): Layout riêng cho Lễ tân.
    *   [LandingLayout.tsx](file:///d:/VLTT/VLTT/frontend/src/layouts/LandingLayout.tsx): Layout trang Landing ngoài cùng của khách hàng.
    *   [ProtectedRoute.tsx](file:///d:/VLTT/VLTT/frontend/src/layouts/ProtectedRoute.tsx): Lớp bảo mật bảo vệ các trang yêu cầu vai trò quyền hạn cụ thể.
*   **`frontend/src/routes/AppRoutes.tsx`**: Khai báo toàn bộ đường dẫn trên trang web và liên kết chúng với các Layout cùng các Page bảo mật.
*   **`frontend/src/stores/authStore.ts`**: Quản lý trạng thái đăng nhập, lưu trữ token JWT và thông tin tài khoản phiên làm việc của người dùng bằng Zustand.
*   **`frontend/src/index.css`** & **`tailwind.config.js`**: Cấu hình CSS nền tảng và bộ thiết kế của Tailwind CSS.

---

## 🛠️ 3. SỔ TAY HƯỚNG DẪN TAG & CHỈNH SỬA FILE THEO TỪNG TÁC VỤ (DEVELOPER CHEAT SHEET)

Khi làm việc với dự án hoặc khi ra lệnh cho AI, bạn hãy sử dụng bảng tra cứu nhanh dưới đây để mở chính xác những file cần sửa, tránh sửa lan man gây lỗi hệ thống.

---

### 🐛 TÁC VỤ 1: SỬA LỖI (FIX BUG)

> [!NOTE]
> Để tìm lỗi nhanh, bạn cần xác định lỗi đang xảy ra ở lớp nào: Cơ sở dữ liệu, API Logic hay Giao diện hiển thị.

| Loại lỗi | Biểu hiện | Những File/Folder bạn cần Tag và chỉnh sửa |
| :--- | :--- | :--- |
| **Lỗi SQL / Truy vấn** | Lỗi 500, dữ liệu load thiếu, sai kiểu dữ liệu của PostgreSQL. | 📂 `backend/src/repositories/` (Sửa các file `.repository.ts` tương ứng)<br>📄 [office_care_backup.sql](file:///d:/VLTT/VLTT/office_care_backup.sql) (Cập nhật schema gốc)<br>📂 `docker/` (Cấu hình khởi tạo DB) |
| **Lỗi nghiệp vụ Backend** | Bị sai thuật toán tính tiền, sai phân cấp phân quyền, sai điều kiện logic khi thực hiện hành động. | 📂 `backend/src/services/` (Sửa logic nghiệp vụ tương ứng)<br>📂 `backend/src/controllers/` (Kiểm tra thứ tự gọi các service) |
| **Lỗi Validate dữ liệu** | Báo lỗi khi submit form (nhập sai định dạng ngày, thiếu trường dữ liệu, lỗi Zod validation). | 📂 `backend/src/schemas/` (Sửa các file Zod `.schema.ts` tương ứng)<br>📂 `frontend/src/features/*/components/` (Sửa Form nhập liệu ở Frontend) |
| **Lỗi Đăng nhập / Token hết hạn** | Không thể đăng nhập, bị đẩy ra trang đăng nhập đột ngột, lỗi giải mã JWT token. | 📄 [backend/src/middlewares/auth.middleware.ts](file:///d:/VLTT/VLTT/backend/src/middlewares/auth.middleware.ts)<br>📂 `backend/src/routes/auth.routes.ts` & `controllers/auth.controller.ts`<br>📄 [frontend/src/stores/authStore.ts](file:///d:/VLTT/VLTT/frontend/src/stores/authStore.ts) |
| **Lỗi Giao diện hiển thị** | Component hiển thị sai thông số, biểu đồ bị vỡ, nút bấm không hoạt động, UI bị lệch. | 📂 `frontend/src/features/*/pages/` (Các tệp TSX chứa giao diện trang chính)<br>📂 `frontend/src/features/*/components/` (Các UI modal, calendar nhỏ) |

---

### 🎨 TÁC VỤ 2: LÀM GIAO DIỆN MỚI HOẶC SỬA UI/UX

> [!TIP]
> Hãy tận dụng các layout có sẵn để tiết kiệm thời gian phát triển và giữ giao diện nhất quán.

*   **Nếu thiết lập/sửa đổi trang cấu hình hoàn toàn mới:**
    1.  Tạo file trang mới trong: `frontend/src/features/[tên_feature]/pages/[TênPageMới].tsx`.
    2.  Khai báo đường dẫn URL và cấu hình quyền truy cập (nếu có) trong file [AppRoutes.tsx](file:///d:/VLTT/VLTT/frontend/src/routes/AppRoutes.tsx).
    3.  Thêm liên kết điều hướng (Link) vào Sidebar tương ứng trong thư mục `frontend/src/layouts/` (Ví dụ: [AdminLayout.tsx](file:///d:/VLTT/VLTT/frontend/src/layouts/AdminLayout.tsx) hoặc [ReceptionistLayout.tsx](file:///d:/VLTT/VLTT/frontend/src/layouts/ReceptionistLayout.tsx)).
*   **Nếu muốn thiết kế các component dùng chung (Nút bấm, Hộp thoại xác nhận, Ô nhập liệu đặc biệt):**
    *   Tạo hoặc chỉnh sửa tại: `frontend/src/components/` (để dùng chung toàn bộ dự án).
    *   Tạo hoặc chỉnh sửa tại: `frontend/src/features/[tên_feature]/components/` (chỉ dùng riêng cho phân hệ đó).
*   **Nếu muốn sửa đổi bảng màu, phong cách, hiệu ứng animation:**
    *   Mở file cấu hình Tailwind: [tailwind.config.js](file:///d:/VLTT/VLTT/frontend/tailwind.config.js).
    *   Mở file CSS nền tảng: [frontend/src/index.css](file:///d:/VLTT/VLTT/frontend/index.css).

---

### 🔌 TÁC VỤ 3: VIẾT MỘT API MỚI (BACKEND)

> [!IMPORTANT]
> Quy trình 5 bước chuẩn khi phát triển API mới giúp tránh bỏ sót bảo mật và đồng bộ hóa:
> 1. **Zod Schema** (Validate đầu vào) ➔ 2. **Repository** (Truy vấn SQL) ➔ 3. **Service** (Xử lý nghiệp vụ) ➔ 4. **Controller** (Điều phối HTTP) ➔ 5. **Route** (Định tuyến và bảo mật)

1.  **Bước 1: Validate đầu vào**
    *   Tạo/cập nhật schema Zod tại `backend/src/schemas/[tên_module].schema.ts` (ví dụ định nghĩa các trường bắt buộc của lịch hẹn mới).
2.  **Bước 2: Viết câu lệnh truy vấn dữ liệu**
    *   Mở `backend/src/repositories/[tên_module].repository.ts` để viết truy vấn SQL thao tác dữ liệu (VD: chèn dòng mới vào bảng `lich_dat`).
3.  **Bước 3: Xử lý logic nghiệp vụ**
    *   Mở `backend/src/services/[tên_module].service.ts` để viết xử lý nghiệp vụ liên quan (VD: kiểm tra phòng khám có trống không trước khi lưu lịch hẹn).
4.  **Bước 4: Nhận yêu cầu và đóng gói dữ liệu phản hồi**
    *   Mở `backend/src/controllers/[tên_module].controller.ts` gọi Schema Validate dữ liệu đầu vào -> Gọi Service -> Đóng gói mã trạng thái và JSON trả lại Client.
5.  **Bước 5: Đăng ký Endpoint URL**
    *   Mở `backend/src/routes/[tên_module].routes.ts` để gắn Controller vào URL cụ thể và cấu hình Middleware xác thực phân quyền (ví dụ: chỉ lễ tân mới gọi được API này).

---

### 💾 TÁC VỤ 4: ĐIỀU CHỈNH & PHÁT TRIỂN CƠ SỞ DỮ LIỆU (DATABASE MIGRATE & SEEDING)

Khi bạn muốn thêm bảng mới, chỉnh sửa cột dữ liệu hoặc thay đổi trạng thái mặc định của các bảng:

1.  **Cập nhật cấu trúc DB gốc:**
    *   Chỉnh sửa tệp sao lưu [office_care_backup.sql](file:///d:/VLTT/VLTT/office_care_backup.sql) hoặc file khởi tạo `docker/init.sql` để lưu trữ kiến trúc mới nhất của bạn.
2.  **Cập nhật tập lệnh khởi tạo tự động:**
    *   Mở file [backend/src/scripts/init_db.ts](file:///d:/VLTT/VLTT/backend/src/scripts/init_db.ts) để thêm định nghĩa bảng hoặc cột mới nếu bạn muốn reset database tự động thông qua script NPM.
3.  **Tạo thêm dữ liệu mẫu:**
    *   Cập nhật tệp [backend/src/scripts/seed.ts](file:///d:/VLTT/VLTT/backend/src/scripts/seed.ts) để sinh dữ liệu ngẫu nhiên cho bảng mới của bạn khi test dự án.

---

## 💡 4. LỜI KHUYÊN PHÁT TRIỂN THỰC TẾ (BEST PRACTICES)

1.  **Luôn tuân thủ luồng phân tầng dữ liệu:** Tuyệt đối không viết trực tiếp SQL (`client.query`) trong file Controller hoặc Service. SQL bắt buộc phải nằm ở tầng Repository để code luôn sáng sủa và dễ bảo trì.
2.  **Sử dụng Zod Schema nghiêm ngặt:** Mọi API nhận dữ liệu từ client (`req.body`, `req.query`, `req.params`) bắt buộc phải đi qua lớp Zod Schema validation để ngăn chặn triệt để tấn công SQL Injection và lỗi định dạng dữ liệu đầu vào.
3.  **Phân quyền chặt chẽ:** Khi viết Route mới ở Backend, luôn bọc endpoint bằng `authenticateToken` và kiểm tra vai trò người dùng nếu đó là API nội bộ để tránh lộ lọt dữ liệu y khoa nhạy cảm.

---
*Tài liệu này được biên soạn độc quyền cho dự án PhysioFlow. Hãy sử dụng nó làm bản đồ định hướng mỗi khi bạn bắt đầu một phiên làm việc mới!*
