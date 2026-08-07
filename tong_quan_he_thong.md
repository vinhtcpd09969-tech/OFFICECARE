# 🏛️ TỔNG QUAN KIẾN TRÚC VÀ CÔNG NGHỆ HỆ THỐNG PHYSIOFLOW (OFFICECARE)

---

## 🗄️ 1. Cơ sở dữ liệu (Database Layer)

* **Hệ quản trị CSDL:** **PostgreSQL** (chạy local trên cổng mặc định `5432`).
* **Vị trí lưu trữ dữ liệu:**
  * Dữ liệu hoạt động thực tế nằm trong CSDL PostgreSQL tên là `office_care`.
  * Bản sao lưu CSDL hoàn chỉnh 100% (22 bảng dữ liệu) lưu tại file SQL tĩnh: [`database/office_care_backup_new.sql`](file:///d:/VLTT/VLTT/database/office_care_backup_new.sql).

* **Hai công cụ thao tác & tương tác với CSDL:**
  1. ⚡ **Viết câu lệnh Raw SQL trực tiếp (qua thư viện `pg` / Connection Pool):**
     * **Nơi sử dụng:** Các file Repository (`backend/src/repositories/*.repository.ts`).
     * **Vai trò:** Thực thi các truy vấn SQL thuần (`SELECT ... JOIN ... GROUP BY ... ORDER BY`) trực tiếp với hiệu năng tối đa, linh hoạt trong xử lý dữ liệu phức tạp (`JSONB`, mảng, múi giờ `TIMESTAMPTZ` UTC/ICT, phân trang, thống kê).
  2. 🛠️ **Prisma ORM (`@prisma/client` & Prisma CLI):**
     * **Nơi sử dụng:** File sơ đồ CSDL tập trung [`backend/prisma/schema.prisma`](file:///d:/VLTT/VLTT/backend/prisma/schema.prisma).
     * **Vai trò:** Định nghĩa cấu trúc các bảng/cột/khóa ngoại, tự động quản lý phiên bản thay đổi CSDL (**Migrations** via `npx prisma migrate dev`), và **tự động sinh ra Kiểu dữ liệu (TypeScript Interfaces)** giúp code autocomplete chính xác tuyệt đối ở Backend.

* **Công cụ GUI đề xuất:** TablePlus, DBeaver, pgAdmin hoặc VSCode Database Client.

---

## ⚙️ 2. Kiến trúc Backend (Backend Service Layer)

* **Nền tảng công nghệ:** **Node.js (v20+)** phát triển hoàn toàn bằng **TypeScript**.
* **Framework:** **Express.js** thiết kế theo chuẩn **RESTful API**.
* **Mô hình kiến trúc 5 tầng (Layered Architecture):**
  1. **Router Layer (`src/routes/`):** Tiếp nhận và phân luồng URL request (GET, POST, PUT, DELETE, PATCH).
  2. **Middleware Layer (`src/middlewares/`):**
     * Xác thực phiên đăng nhập bằng **JWT Bearer Token** (`auth.middleware.ts`).
     * Phân quyền truy cập theo Vai trò ID (`allowedRoles`: Admin, Manager, Doctor, Receptionist, KTV, Customer).
     * Xử lý tải file/ảnh lên qua `multer` & tích hợp Cloudinary.
     * Bắt lỗi toàn cục (Global Error Handler).
  3. **Controller Layer (`src/controllers/`):** Tiếp nhận payload, kiểm tra hợp lệ tham số đầu vào bằng **Zod Schema**, và đóng gói JSON response chuẩn cho Client.
  4. **Service Layer (`src/services/`):** Xử lý toàn bộ logic nghiệp vụ (tính khung giờ khả dụng nhân sự, khấu trừ ca gói điều trị, hoàn trả hóa đơn, tạo mã VietQR/PayOS, kết nối AI tư vấn y khoa Gemini API).
  5. **Repository Layer (`src/repositories/` & `src/config/db.ts`):** Thao tác trực tiếp với cơ sở dữ liệu PostgreSQL qua Raw SQL Pool.

---

## 🎨 3. Kiến trúc Frontend (Frontend Web Application)

* **Nền tảng công nghệ:** **React 18** + **Vite** (Web bundler tốc độ cực nhanh) + **TypeScript**.
* **Giao diện & Style (CSS):**
  * Sử dụng **Tailwind CSS** tùy biến theo hệ màu Y tế Cao cấp (**Emerald / Teal chủ đạo**).
  * Tích hợp **Glassmorphic UI**, hiệu ứng chuyển động mượt mà (Micro-animations) và **Phân vùng Dark Mode thông minh** (Dark Mode chỉ kích hoạt cho giao diện Nhân sự/Admin hệ thống, tự động tắt về Light Mode ở trang khách hàng và Đăng nhập/Đăng ký).
* **Quản lý trạng thái (State Management):**
  * **Zustand (`authStore.ts`):** Quản lý trạng thái đăng nhập, User Profile và Access/Refresh Token đồng bộ `localStorage`.
  * Local React States (`useState`, `useReducer`, `useMemo`, `useCallback`) quản lý state cục bộ của từng trang/modal.

---

## 🔄 4. Luồng truyền dữ liệu giữa Frontend và Backend (Data Flow)

```text
[ Người dùng tương tác trên UI React ]
                 │
                 ▼
[ Call API Layer (src/api/ hoặc Axios) ] ── (Gửi HTTP Request: JSON / FormData + Bearer Token) ──►
                                                                                                │
◄── (Trả kết quả JSON Response: { success: true, data: ... }) ──────────────────────────────────┘
                 │
                 ▼
[ Controller / Service Node.js ] ── (Truy vấn CSDL qua Raw SQL pg / Prisma) ──► [ CSDL PostgreSQL ]
```

1. **Khởi tạo Yêu cầu (Request):** Người dùng thực hiện thao tác trên Frontend (đặt lịch, đăng ký, thanh toán hóa đơn...).
2. **Đóng gói dữ liệu:**
   * Dữ liệu thông thường: Gửi dạng **JSON (`application/json`)**.
   * Dữ liệu tệp tin/hình ảnh: Gửi dạng **`FormData` (`multipart/form-data`)**.
3. **Xác thực phiên:** Mọi request bảo mật đều đính kèm Header `Authorization: Bearer <accessToken>`.
4. **Backend Xử lý & Phản hồi:** Backend nhận request -> Middleware kiểm tra Token/Quyền -> Controller & Service xử lý logic + truy vấn DB -> Trả về JSON Response.
5. **Cập nhật UI:** Frontend nhận Response -> Cập nhật State Component / Zustand -> Render lại UI ngay tức thì (Single Page Application - SPA).

---

## 🛠️ 5. Quản lý Sao lưu & Bảo trì CSDL (Database Backup)

* **Bản sao lưu SQL chính thức:** [`database/office_care_backup_new.sql`](file:///d:/VLTT/VLTT/database/office_care_backup_new.sql)
* **Đặc điểm bản sao lưu:**
  * Xuất đầy đủ 100% dữ liệu của 22 bảng trong hệ thống.
  * Tự động bật `SET session_replication_role = 'replica';` tránh lỗi khóa ngoại khi restore.
  * Tự động cập nhật `setval` cho ID sequences đảm bảo ID sinh mới không bị trùng.
* **Quy trình Khôi phục (Restore):**
  * Chạy file SQL trực tiếp vào PostgreSQL qua công cụ GUI (TablePlus/DBeaver) hoặc lệnh:
    ```bash
    psql -U postgres -d office_care -f database/office_care_backup_new.sql
    ```
