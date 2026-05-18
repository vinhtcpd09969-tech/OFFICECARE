# 🤖 CẨM NANG SỬ DỤNG BỘ CÔNG CỤ TRỢ LÝ ẨN (ANTIGRAVITY KIT - .AGENT GUIDE)

Chào mừng bạn đến với hướng dẫn vận hành bộ não AI tích hợp của dự án PhysioFlow. Thư mục ẩn **`.agent/`** trong dự án của bạn không phải là code của trang web, mà là **Antigravity Kit** — một hệ thống mở rộng năng lực AI cực kỳ mạnh mẽ bao gồm **20 Chuyên gia (Specialists)**, **36 Kỹ năng chuyên sâu (Skills)**, và **11 Quy trình công việc (Workflows)**.

Tài liệu này sẽ giúp bạn hiểu rõ từng tệp tin/thư mục trong `.agent` có vai trò gì và cách bạn "tag" (hoặc gọi tên) chúng để định hướng tôi (AI Agent) thực thi các tác vụ lập trình chuẩn xác nhất.

---

## 🗺️ 1. CƠ CHẾ HOẠT ĐỘNG CỦA AI AGENT THÔNG QUA THƯ MỤC `.agent`

Khi bạn gửi bất kỳ yêu cầu nào (Sửa lỗi, Code giao diện, Viết API...), tôi sẽ tự động kích hoạt các bộ lọc trong thư mục `.agent` theo quy trình 3 bước sau:

```
[User Request] ➔ [Phân loại & Tự động định tuyến (Intelligent Routing)] 
                      ➔ Chọn Agent phù hợp (trong .agent/agents/)
                      ➔ Tải Kỹ năng tương ứng (trong .agent/skills/)
                      ➔ Áp dụng Quy trình / Lệnh slash (trong .agent/workflows/)
```

*   **Định tuyến Tự động (Intelligent Routing):** Tự động phát hiện nghiệp vụ bạn yêu cầu để đóng vai chuyên gia phù hợp nhất.
*   **Tải Kỹ năng Modular (Skill Loading Protocol):** Chỉ nạp các hướng dẫn cần thiết từ kỹ năng được chỉ định để tối ưu trí nhớ và đưa ra giải pháp chuẩn mực cao nhất.
*   **Cổng Nghi vấn (Socratic Gate):** Quy tắc bắt buộc tôi phải dừng lại và hỏi bạn từ 2-3 câu hỏi làm rõ các trường hợp biên (edge cases) hoặc thiết kế trước khi thực sự viết code.

---

## 📁 2. PHÂN TÍCH VAI TRÒ CHI TIẾT TỪNG THƯ MỤC & FILE TRONG `.agent/`

### 📄 A. CÁC TỆP TIN Ở THƯ MỤC GỐC `.agent/`
*   [ARCHITECTURE.md](file:///d:/VLTT/VLTT/.agent/ARCHITECTURE.md): Bản đồ tổng thể của bộ não AI. Định nghĩa danh sách 20 chuyên gia, 36 kỹ năng, 11 quy trình, cách chạy các công cụ kiểm tra tự động và thống kê hệ thống.
*   [mcp_config.json](file:///d:/VLTT/VLTT/.agent/mcp_config.json): File cấu hình tích hợp các server MCP (Model Context Protocol) như Upstash Context7 và Shadcn MCP, mở rộng khả năng đọc dữ liệu hoặc tích hợp thư viện UI của AI Agent.

---

### 📂 B. THƯ MỤC `rules/` (Luật lệ Nền tảng)
*   **Tệp tin [rules/GEMINI.md](file:///d:/VLTT/VLTT/.agent/rules/GEMINI.md) (Quy tắc P0 - Bắt buộc tối cao):**
    *   **Vai trò:** Đây là file định hình "nhân cách" và cách làm việc cốt lõi của tôi trong toàn bộ workspace.
    *   **Nội dung:** Quy định phân loại yêu cầu người dùng, hướng dẫn ngôn ngữ giao tiếp, bộ lọc Socratic Gate (phải hỏi rõ trước khi làm), quy chuẩn Code Sạch (Clean Code), và quy trình chạy lệnh kiểm tra tự động trước khi bàn giao sản phẩm.

---

### 📂 C. THƯ MỤC `agents/` (20 Chuyên Gia Lĩnh Vực - AI Personas)
Thư mục này chứa 20 tệp cấu hình chuyên gia đóng vai trò như các nhân cách nghiệp vụ khác nhau của tôi:

*   [backend-specialist.md](file:///d:/VLTT/VLTT/.agent/agents/backend-specialist.md): Chuyên gia xây dựng hệ thống API, bảo mật máy chủ, tối ưu hóa các luồng xử lý dữ liệu Node.js.
*   [frontend-specialist.md](file:///d:/VLTT/VLTT/.agent/agents/frontend-specialist.md): Chuyên gia thiết kế UI/UX giao diện Web, xử lý state React, CSS, hiệu ứng mượt mà. Đặc biệt tuân thủ *Purple Ban* (cấm dùng màu tím cơ bản bừa bãi) và *Template Ban* (không dùng layout nhàm chán).
*   [database-architect.md](file:///d:/VLTT/VLTT/.agent/agents/database-architect.md): Kiến trúc sư cơ sở dữ liệu. Thiết kế bảng SQL tối ưu, quan hệ thực thể (ERD), lập chỉ mục (index), và xử lý di chuyển dữ liệu (migrations).
*   [debugger.md](file:///d:/VLTT/VLTT/.agent/agents/debugger.md): Chuyên gia phân tích nguyên nhân gốc rễ (Root Cause Analysis). Sửa lỗi có phương pháp khoa học, không đoán mò.
*   [devops-engineer.md](file:///d:/VLTT/VLTT/.agent/agents/devops-engineer.md): Kỹ sư hạ tầng, chuyên trách CI/CD, thiết lập Docker, Docker Compose, triển khai máy chủ.
*   [project-planner.md](file:///d:/VLTT/VLTT/.agent/agents/project-planner.md): Chuyên gia lập kế hoạch, phân tích yêu cầu nghiệp vụ và lập danh sách công việc cần làm chi tiết (TODO list).
*   [test-engineer.md](file:///d:/VLTT/VLTT/.agent/agents/test-engineer.md) & [qa-automation-engineer.md](file:///d:/VLTT/VLTT/.agent/agents/qa-automation-engineer.md): Thiết lập kịch bản test (Unit test, Integration, E2E Test với Playwright).
*   [security-auditor.md](file:///d:/VLTT/VLTT/.agent/agents/security-auditor.md) & [penetration-tester.md](file:///d:/VLTT/VLTT/.agent/agents/penetration-tester.md): Kiểm tra lỗ hổng bảo mật hệ thống, chống tấn công OWASP.
*   [code-archaeologist.md](file:///d:/VLTT/VLTT/.agent/agents/code-archaeologist.md): Chuyên khảo sát các khối code cũ, tối ưu hóa cấu trúc (Refactoring) giúp hệ thống dễ thở hơn.

---

### 📂 D. THƯ MỤC `skills/` (36 Mô-đun Kiến Thức Chuyên Sâu)
Đây là các thư viện tri thức đóng gói sẵn để các Agent nạp vào khi làm việc. Mỗi thư mục kỹ năng chứa file `SKILL.md` hướng dẫn chi tiết:

*   **Nhóm Frontend:** `frontend-design/` (Nguyên lý UX), `react-best-practices/` (Tối ưu React), `tailwind-patterns/` (Sử dụng CSS hiệu quả), `ui-ux-pro-max/` (Kho tàng 50 phong cách thiết kế đỉnh cao).
*   **Nhóm Backend & Database:** `api-patterns/` (Quy chuẩn REST API), `database-design/` (Tối ưu hóa bảng), `nodejs-best-practices/` (Lập trình bất đồng bộ an toàn).
*   **Nhóm Bổ trợ:** `clean-code/` (Viết code sạch), `systematic-debugging/` (Tìm và diệt bug theo quy trình), `brainstorming/` (Tư duy phản biện), `plan-writing/` (Viết kế hoạch hành động).

---

### 📂 E. THƯ MỤC `workflows/` (11 Quy Trình Xử Lý Nhanh - Slash Commands)
Chứa các quy trình từng bước khi bạn gõ phím tắt `/command` để yêu cầu tôi làm việc:

*   [debug.md](file:///d:/VLTT/VLTT/.agent/workflows/debug.md) (Lệnh `/debug`): Quy trình phân tích Triệu chứng ➔ Thu thập thông tin ➔ Giả thuyết ➔ Kiểm chứng ➔ Tìm nguyên nhân gốc ➔ Sửa đổi ➔ Phòng ngừa.
*   [ui-ux-pro-max.md](file:///d:/VLTT/VLTT/.agent/workflows/ui-ux-pro-max.md) (Lệnh `/ui-ux-pro-max`): Kích hoạt chế độ thiết kế giao diện chuyên nghiệp nhất, áp dụng bảng màu hài hòa, Typography cao cấp.
*   [plan.md](file:///d:/VLTT/VLTT/.agent/workflows/plan.md) (Lệnh `/plan`): Lập kế hoạch 4 giai đoạn chi tiết trước khi code.
*   [create.md](file:///d:/VLTT/VLTT/.agent/workflows/create.md) (Lệnh `/create`): Hướng dẫn AI cách xây dựng tính năng mới từ đầu đến cuối một cách an toàn.

---

### 📂 F. THƯ MỤC `scripts/` (Các Script Tự Động Kiểm Tra Code)
Chứa các đoạn mã Python để tự động quét lỗi dự án của bạn:
*   [checklist.py](file:///d:/VLTT/VLTT/.agent/scripts/checklist.py): Chạy các bài kiểm tra quan trọng (Bảo mật, Cú pháp Lint, Database Schema, Unit Tests, UX cơ bản) ngay trong quá trình code.
*   [verify_all.py](file:///d:/VLTT/VLTT/.agent/scripts/verify_all.py): Quét toàn bộ hệ thống chuyên sâu hơn (Lighthouse đo hiệu năng, Playwright E2E Test, Phân tích kích thước gói bundle) trước khi deploy lên production.

---

## 🛠️ 3. SỔ TAY "TAG" AGENT KIT NHƯ CÔNG CỤ HỖ TRỢ KHI LÀM VIỆC VỚI AI

Khi gửi yêu cầu cho tôi, bạn có thể chủ động **"tag"** (gõ tên) các file/thư mục này trong lời yêu cầu của mình. Tôi sẽ ngay lập tức nạp cấu hình và quy tắc của file đó để phục vụ bạn tốt nhất.

---

### 🐛 TÁC VỤ 1: SỬA LỖI (FIX BUG)
Khi hệ thống gặp lỗi (crash, lỗi API 500, lỗi giao diện hoặc logic nghiệp vụ sai):

*   **Cách bạn ra lệnh (Tag công cụ):**
    > *"Hãy đóng vai `@[debugger]` và sử dụng kỹ năng `@[skills/systematic-debugging]` để chạy quy trình `/debug` giải quyết lỗi không lưu được lịch hẹn lượng giá dưới đây..."*
*   **Hiệu quả mang lại:** Tôi sẽ không sửa mò mẫm hay vá code tạm bợ. Tôi sẽ phân tích rõ Triệu chứng ➔ Đưa ra 3 Giả thuyết ➔ Chứng minh từng giả thuyết ➔ Chỉ ra Nguyên nhân gốc (Root Cause) ➔ Đưa ra mã sửa chuẩn xác ➔ Cung cấp phương án Phòng ngừa (Prevent).
*   **Kiểm tra chất lượng sau khi sửa:**
    > *"Hãy chạy script `checklist.py` để đảm bảo lỗi đã được giải quyết triệt để và không gây ảnh hưởng chéo."*

---

### 🎨 TÁC VỤ 2: LÀM GIAO DIỆN MỚI HOẶC SỬA UI/UX
Khi bạn cần tạo một màn hình mới (ví dụ: màn hình Lễ tân in hóa đơn, dashboard phân tích tài chính):

*   **Cách bạn ra lệnh (Tag công cụ):**
    > *"Đóng vai `@[frontend-specialist]` áp dụng quy trình `/ui-ux-pro-max` kết hợp kỹ năng `@[skills/frontend-design]` để thiết kế một màn hình quản lý Voucher khuyến mãi cực đẹp cho Admin..."*
*   **Hiệu quả mang lại:** Tôi sẽ nạp toàn bộ tri thức về UX, bảng phối màu Sleek Dark Mode hoặc phối màu cao cấp, tối ưu hóa kích thước chữ (Typography), thêm các vi-hiệu ứng (micro-animations) sinh động, tạo giao diện sang trọng vượt bậc (WOW effect) thay vì thiết kế cơ bản tẻ nhạt.

---

### 🔌 TÁC VỤ 3: VIẾT API MỚI (BACKEND)
Khi bạn cần xây dựng các đầu kết nối dữ liệu mới giữa client và server:

*   **Cách bạn ra lệnh (Tag công cụ):**
    > *"Đóng vai `@[backend-specialist]` sử dụng kỹ năng `@[skills/api-patterns]` và tuân thủ nguyên tắc `@[skills/clean-code]` để viết API lấy danh sách ca trực của Bác sĩ..."*
*   **Hiệu quả mang lại:** Tôi sẽ thiết kế API chuẩn RESTful, viết mã an toàn (chống SQL Injection), viết logic tầng Service rạch ròi, tách biệt tầng Repository truy vấn dữ liệu SQL và đăng ký phân quyền JWT an toàn tại file Routes.

---

### 💾 TÁC VỤ 4: THIẾT KẾ & ĐIỀU CHỈNH DATABASE
Khi bạn cần thêm bảng mới hoặc sửa đổi cấu trúc cột dữ liệu trong PostgreSQL:

*   **Cách bạn ra lệnh (Tag công cụ):**
    > *"Đóng vai `@[database-architect]` nạp kỹ năng `@[skills/database-design]` để thiết kế bảng cơ sở dữ liệu `dang_ky_goi` hỗ trợ trạng thái dùng thử buổi tập..."*
*   **Hiệu quả mang lại:** Tôi sẽ cung cấp cấu trúc bảng được chuẩn hóa tối ưu (nhất quán khóa ngoại, chỉ mục index hiệu năng truy vấn nhanh), tạo file script SQL cập nhật an toàn và thiết lập cơ chế dữ liệu giả lập (seeder) hoàn hảo.

---

### 📋 TÁC VỤ 5: LẬP KẾ HOẠCH & KHẢO SÁT CHỨC NĂNG (PLANNING)
Khi bạn có một ý tưởng tính năng lớn nhưng chưa biết bắt đầu từ đâu và thiết kế thế nào:

*   **Cách bạn ra lệnh (Tag công cụ):**
    > *"Hãy đóng vai `@[project-planner]` sử dụng kỹ năng `@[skills/brainstorming]` và `/plan` để phân tích và lập kế hoạch triển khai tính năng gửi thông báo tự động qua Email khi khách hàng đặt lịch."*
*   **Hiệu quả mang lại:** Tôi sẽ kích hoạt chế độ **Plan Mode (4 giai đoạn)**. Tôi sẽ dừng lại phân tích sâu hệ thống, đặt câu hỏi làm rõ các trường hợp đặc biệt cho bạn duyệt, phác thảo kiến trúc giải pháp tối ưu trước khi bắt tay viết bất kỳ dòng code nào.

---

## 💡 LỜI KHUYÊN KHI TƯƠNG TÁC
Hãy coi thư mục `.agent` như một **bảng chọn menu tính năng nâng cấp** dành cho tôi. Khi bạn chủ động nhắc tên các Agent hoặc Skill này trong câu lệnh của mình, tôi sẽ lập tức áp dụng trọn vẹn sức mạnh từ bộ hướng dẫn tối mật đó để làm việc cùng bạn đạt hiệu quả cao nhất!

---

## 📊 4. PHÂN TÍCH DỰ ÁN PHYSIOFLOW & CÁC FILE TRONG AGENT ĐƯỢC TAG NHIỀU NHẤT

Dựa trên cấu trúc và định hướng hiện tại của phòng khám Vật lý trị liệu PhysioFlow (vận hành qua các phân hệ đặt lịch thông minh, khám bác sĩ, thanh toán lễ tân và portal khách hàng), dưới đây là phân tích các tệp tin trong `.agent/` sẽ được **tag và sử dụng nhiều nhất** trong quá trình phát triển tiếp theo của bạn:

### 🌟 TOP 1: Chuyên gia Giao diện - `@[frontend-specialist]` & Kỹ năng `@[skills/ui-ux-pro-max]`
*   **Tần suất sử dụng:** ~45% (Cao nhất)
*   **Lý do:** Dự án PhysioFlow sở hữu giao diện đồ sộ với hơn 15 trang Admin phức tạp, 3 trang Lễ tân check-in/billing nhanh, trang Landing page đặt lịch ngoài và Dashboard Khách hàng. Bạn sẽ liên tục cần tinh chỉnh giao diện, cấu hình Recharts thống kê doanh thu, tối ưu responsive và tạo các hiệu ứng mượt mà.
*   **Khi nào nên tag:** Khi thêm trang mới, thiết kế form đặt lịch, lập hóa đơn, vẽ biểu đồ thống kê tài chính hoặc làm đẹp UI/UX tổng thể.

### 🌟 TOP 2: Chuyên gia API & Server - `@[backend-specialist]` & Kỹ năng `@[skills/api-patterns]`
*   **Tần suất sử dụng:** ~25%
*   **Lý do:** Toàn bộ nghiệp vụ từ đặt lịch online, phân quyền Bác sĩ/Kỹ thuật viên, in hóa đơn của Lễ tân đến hoàn tiền cho khách đều được quản lý bởi hệ thống Express API chạy TypeScript ở `/backend`.
*   **Khi nào nên tag:** Khi bạn muốn viết các route API mới, bổ sung middleware xác thực, phân quyền truy cập nâng cao, hoặc tối ưu hóa các lớp logic nghiệp vụ (`services`). Tag tệp này giúp bảo đảm tôi luôn viết API chuẩn RESTful, rạch ròi 3 lớp và an toàn tuyệt đối.

### 🌟 TOP 3: Trình sửa lỗi khoa học - `@[debugger]` & Kỹ năng `@[skills/systematic-debugging]`
*   **Tần suất sử dụng:** ~15%
*   **Lý do:** Trong quá trình tích hợp phức tạp giữa các vai trò (Khách hàng đặt lịch ➔ Lễ tân check-in ➔ Bác sĩ khám ➔ Kỹ thuật viên ghi SOAP Note), việc phát sinh lỗi đồng bộ dữ liệu, lỗi kiểu dữ liệu DB PostgreSQL hoặc lỗi render UI là khó tránh khỏi.
*   **Khi nào nên tag:** Khi phát hiện lỗi API trả về trạng thái 500 (Internal Server Error), lỗi frontend crash, hoặc dữ liệu lưu sai lệch. Tag `@[debugger]` kích hoạt quy trình điều tra 6 bước để diệt cỏ tận gốc lỗi và phòng ngừa tái phát.

### 🌟 TOP 4: Kiến trúc sư Cơ sở dữ liệu - `@[database-architect]` & Kỹ năng `@[skills/database-design]`
*   **Tần suất sử dụng:** ~10%
*   **Lý do:** Dự án lưu trữ thông tin nhạy cảm của khách hàng, lịch trình điều trị chi tiết, hóa đơn thanh toán và voucher khuyến mãi. Cấu trúc DB cần được quản lý cực kỳ chặt chẽ trong `office_care_backup.sql` và `init_db.ts`.
*   **Khi nào nên tag:** Khi bạn cần thêm trường dữ liệu (như lý do khám, ảnh đính kèm), tạo bảng mới, cấu hình khóa ngoại hoặc thiết lập dữ liệu mẫu (seeding) để thử nghiệm chức năng mới.

