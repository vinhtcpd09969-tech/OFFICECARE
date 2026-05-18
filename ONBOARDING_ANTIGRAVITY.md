# CẨM NANG THIẾT LẬP DỰ ÁN & ĐỒNG BỘ ĐỒNG ĐỘI VỚI ANTIGRAVITY AI AGENT

> **DÀNH CHO THÀNH VIÊN MỚI THAM GIA DỰ ÁN OFFICE CARE.**
> Chào mừng bạn gia nhập đội ngũ phát triển hệ thống phòng khám **Office Care**! Tài liệu này sẽ hướng dẫn bạn từng bước thiết lập môi trường chạy dự án ở local và cách phối hợp làm việc đồng bộ với trợ lý AI chuyên nghiệp **Antigravity** để đạt hiệu suất cao nhất.

---

## 1. CƠ CHẾ ĐỒNG BỘ BỘ NÃO AI (ANTIGRAVITY AGENT KIT)

Dự án Office Care được cấu hình sẵn một bộ "não" AI chuyên nghiệp nằm tại thư mục ẩn **[`.agent/`](file:///d:/VLTT/VLTT/.agent/)** ở gốc dự án. Thư mục này chứa:
*   `agents/`: 20 Agent chuyên gia lập trình (Frontend, Backend, DB, Debugger...).
*   `skills/`: 36 Kỹ năng giải quyết bài toán nghiệp vụ chuyên sâu.
*   `workflows/`: 11 Quy trình nghiệp vụ tiêu chuẩn (lập kế hoạch `/plan`, sửa bug `/debug`...).
*   `rules/GEMINI.md`: Bộ quy tắc ứng xử cốt lõi của AI.

### 🔄 Cách đồng bộ hóa giữa các thành viên:
> [!IMPORTANT]
> **Toàn bộ thư mục `.agent/` ĐÃ ĐƯỢC COMMIT và quản lý bằng Git.**
> Do đó, khi bạn **Git Clone** dự án về máy tính của mình, **bạn lập tức sở hữu 100% sức mạnh của Antigravity** giống hệt như các thành viên khác trong nhóm mà không cần cấu hình thủ công gì thêm!

*   Để hiểu cách ra lệnh, gọi lệnh tắt và tag các chuyên gia AI hỗ trợ, bạn hãy đọc tệp cẩm nang **[AGENT_GUIDE.md](file:///d:/VLTT/VLTT/AGENT_GUIDE.md)** ở thư mục gốc. Nó sẽ hướng dẫn bạn cách tag (`@[frontend-specialist]`, `@[debugger]`, `/plan`, `/ui-ux-pro-max`...) để định hình tư duy cho Agent.

---

## 2. QUY TRÌNH THIẾT LẬP DỰ ÁN Ở LOCAL (ONBOARDING CHECKLIST)

Hãy thực hiện tuần tự các bước sau để khởi chạy dự án hoạt động trơn tru trên máy tính của bạn:

### 📋 Yêu cầu môi trường tiên quyết:
*   **Node.js** phiên bản LTS (Khuyến nghị v18 hoặc v20+).
*   **PostgreSQL** (Phiên bản v15 hoặc v16+) đang hoạt động ở máy local (hoặc chạy qua Docker).

---

### BƯỚC 1: Clone mã nguồn dự án
Mở terminal và clone repository dự án từ git server của nhóm:
```bash
git clone https://github.com/vinhtcpd09969-tech/PhysioFlow.git VLTT
cd VLTT
```

### BƯỚC 2: Cài đặt thư viện dependencies cho cả hai phân hệ
Dự án được thiết kế tách biệt hoàn toàn Frontend và Backend, bạn cần cài đặt thư viện cho cả hai:

1.  **Cài đặt thư viện Backend:**
    ```bash
    cd backend
    npm install
    ```
2.  **Cài đặt thư viện Frontend:**
    ```bash
    cd ../frontend
    npm install
    ```

### BƯỚC 3: Cấu hình biến môi trường (Environment Variables)
1.  Truy cập thư mục `backend/`.
2.  Tạo một tệp mới tên là **`.env`** (nếu chưa có).
3.  Cấu hình các tham số kết nối cơ sở dữ liệu PostgreSQL cục bộ (hoặc container Docker) như sau:
    ```env
    PORT=5000
    DATABASE_URL=postgresql://postgres:password@localhost:5432/office_care
    JWT_SECRET=super_secret_key_office_care_2026
    JWT_REFRESH_SECRET=refresh_secret_key_office_care_2026
    
    # Cấu hình gửi OTP Email (nếu cần test chức năng Auth)
    EMAIL_HOST=smtp.gmail.com
    EMAIL_PORT=587
    EMAIL_USER=your_email@gmail.com
    EMAIL_PASS=your_app_password
    ```

### BƯỚC 4: Khôi phục Cơ sở dữ liệu Chuẩn từ Bản sao lưu (`office_care_backup.sql`)

> [!WARNING]
> **QUY TẮC BẮT BUỘC:** Tuyệt đối KHÔNG chạy các script `init_db.ts` hay `seed.ts` khi bắt đầu vì chúng chứa dữ liệu hạt giống cũ của phiên bản trước và sẽ làm lệch database thực tế đang chạy. 
> Chúng ta sẽ khôi phục trực tiếp từ tệp sao lưu chuẩn **`office_care_backup.sql`** (ở thư mục gốc dự án) chứa đầy đủ cấu trúc 23 bảng và dữ liệu phòng khám thực tế 100%.

Tùy vào việc bạn chạy PostgreSQL ở Local hay dùng Docker Container, hãy chọn một trong hai phương án khôi phục dưới đây:

#### 🐳 PHƯƠNG ÁN A: Khôi phục qua Docker Container (physioflow_db)
Nếu bạn khởi chạy database PostgreSQL bằng Docker Desktop thông qua tệp `docker-compose.yml` ở gốc dự án (`docker-compose up -d`):
1.  **Tạo cơ sở dữ liệu `office_care` bên trong container:**
    ```bash
    docker exec -it physioflow_db psql -U postgres -c "CREATE DATABASE office_care;"
    ```
2.  **Sao chép tệp backup vào bên trong container:**
    *(Lệnh này giúp tránh lỗi mã hóa ký tự khi chuyển hướng dòng dữ liệu `<` trên Windows PowerShell)*
    ```bash
    docker cp office_care_backup.sql physioflow_db:/tmp/office_care_backup.sql
    ```
3.  **Khôi phục dữ liệu bên trong container:**
    ```bash
    docker exec -it physioflow_db psql -U postgres -d office_care -f /tmp/office_care_backup.sql
    ```

> [!TIP]
> **💡 TỰ ĐỘNG CÀI ĐẶT & KẾT NỐI PGADMIN:**
> Dự án đã cấu hình sẵn công cụ quản trị cơ sở dữ liệu trực quan **pgAdmin** chạy tự động song song qua Docker.
> *   **Cách truy cập:** Mở trình duyệt web và truy cập địa chỉ: `http://localhost:5050`
> *   **Tài khoản đăng nhập mặc định:**
>     *   Email: `admin@physioflow.com`
>     *   Mật khẩu: `admin`
> *   **Kết nối tự động (Pre-configured):** Nhóm phát triển đã cấu hình sẵn tệp `./docker/pgadmin/servers.json`. Do đó, khi bạn đăng nhập vào pgAdmin lần đầu, kết nối đến máy chủ PostgreSQL `physioflow_db` **đã tự động được thiết lập và đăng ký sẵn**! Bạn chỉ cần click chọn máy chủ là có thể trực tiếp làm việc với cơ sở dữ liệu `office_care` mà không cần điền IP/Port/Mật khẩu thủ công.

#### 💻 PHƯƠNG ÁN B: Khôi phục qua PostgreSQL cài trực tiếp trên máy (Host)
Nếu bạn sử dụng PostgreSQL cài đặt độc lập trên Windows/Mac/Linux (chạy trên cổng 5432):
1.  **Tạo cơ sở dữ liệu `office_care`:**
    Mở phần mềm quản trị (DBeaver, pgAdmin) hoặc chạy lệnh Terminal để tạo cơ sở dữ liệu mới tên là `office_care`.
2.  **Chạy lệnh khôi phục từ tệp SQL ở gốc dự án:**
    ```bash
    psql -U postgres -h localhost -p 5432 -d office_care -f office_care_backup.sql
    ```

### BƯỚC 5: Khởi chạy dự án local để lập trình
Bây giờ, bạn có thể chạy song song hai phân hệ ở môi trường phát triển:

*   **Chạy Máy chủ Backend:**
    ```bash
    cd backend
    npm run dev
    ```
    *API Server sẽ chạy tại địa chỉ: `http://localhost:5000` (Tài liệu Swagger API tại `http://localhost:5000/api-docs`)*

*   **Chạy Giao diện Frontend:**
    Mở một cửa sổ Terminal mới ở gốc dự án:
    ```bash
    cd frontend
    npm run dev
    ```
    *Giao diện Client sẽ chạy tại địa chỉ: `http://localhost:5173`*

---

## 3. QUY TẮC VÀNG PHỐI HỢP NHÓM KHI DÙNG ANTIGRAVITY

Để đảm bảo các thành viên không bị giẫm chân lên nhau và khai thác tối đa sức mạnh của AI, hãy tuân thủ 3 quy tắc vàng sau:

### 🥇 Quy tắc 1: Luôn dùng lệnh `/plan` trước khi làm việc
Khi bạn chuẩn bị code một tính năng mới hoặc sửa đổi cấu trúc lớn:
1.  Hãy ra lệnh cho Antigravity thiết lập kế hoạch trước bằng cú pháp: `/plan <Mô tả yêu cầu của bạn>`.
2.  Antigravity sẽ tạo ra một file kế hoạch có tên dạng `{task-slug}.md` tại thư mục gốc dự án (Ví dụ: `admin-finalization-phase6.md`).
3.  **Lợi ích:** Kế hoạch này được Commit lên Git. Các thành viên khác khi kéo code về sẽ lập tức biết bạn đang làm gì, kiến trúc ra sao, tránh xung đột logic y khoa.

### 🥈 Quy tắc 2: Tối ưu hóa Tag Chuyên gia & File nghiệp vụ
Để Antigravity hiểu sâu sắc nhất nghiệp vụ phòng khám, trong nội dung chat hãy luôn tận dụng cú pháp tag:
*   Tag chuyên gia phù hợp: `@[backend-specialist]` cho API Express, `@[frontend-specialist]` cho React/Tailwind, `@[debugger]` khi sửa lỗi.
*   Tag file cấu trúc nghiệp vụ làm gốc: ví dụ `@[PHYSIOFLOW_CONTEXT.md]` (Bối cảnh DB), `@[MODULE_ARCHITECTURE.md]` (Luồng nghiệp vụ) để Agent không bị đoán mò.

### 🥉 Quy tắc 3: Commit và Chia sẻ "Bộ não AI" lên Git
Nếu trong quá trình làm việc, bạn phát hiện ra một mẹo lập trình mới, một quy tắc y khoa đặc thù hoặc muốn bổ sung một chuyên gia mới vào `.agent/`:
1.  Hãy chỉnh sửa hoặc thêm tệp tương ứng trong thư mục `.agent/agents/` hoặc `.agent/skills/`.
2.  **Commit tệp đó lên Git cùng với code dự án.**
3.  **Lợi ích:** Ngày hôm sau, khi đồng nghiệp Git Pull về máy, bộ não AI Antigravity trên máy tính của họ sẽ lập tức thông thái hơn, hiểu đúng quy tắc mới của bạn!

Chúc bạn có những trải nghiệm lập trình tuyệt vời và tạo ra những giá trị y khoa to lớn cùng trợ lý AI **Antigravity** tại **Office Care**!
