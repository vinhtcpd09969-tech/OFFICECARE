# AGENTS.md — Bộ não nghiệp vụ, Kiến trúc & Tiêu chuẩn UI/UX OfficeCare

> **Mục đích file này:** Đây là bản tổng hợp **DUY NHẤT, ĐẦY ĐỦ VÀ TOÀN DIỆN NHẤT** về nghiệp vụ y tế PHCN, kiến trúc hệ thống, các quyết định thiết kế và **Tiêu chuẩn Giao diện (Frontend Design System)** của dự án OfficeCare. AI Agent đọc file này để có đủ 100% ngữ cảnh làm việc mà không cần hỏi lại người dùng.
>
> **Quan hệ với các tài liệu khác:**
> - `CLAUDE.md` (gốc dự án) — quy tắc bất di bất dịch (Socratic Gate, không code mù, DRY chủ động...). File này **không** lặp lại, chỉ tham chiếu.
> - `docs/BUSINESS_RULES.md`, `docs/ARCHITECTURE_CONVENTIONS.md`, `docs/DESIGN_SYSTEM.md` — nguồn quy tắc chi tiết. ⚠️ **CẢNH BÁO:** `BUSINESS_RULES.md` mục 2 ("Chưa xác nhận"), mục 7-8 (mốc 8 tiếng), mục 9 (quy trình xác nhận điện thoại) **đã bị thay thế** bởi các quyết định trong file này — coi `AGENTS.md` là NGUỒN SỰ THẬT MỚI NHẤT.
> - **Skills bắt buộc áp dụng khi code UI:** `.agents/skills/frontend-design/SKILL.md` (Skills thiết kế UI/UX độc đáo, chuẩn accessibility, chuyển động tăng tốc phần cứng GPU).

---

## 0. Bối cảnh dự án (Bắt buộc hiểu trước khi làm bất kỳ việc gì)

**OfficeCare** là hệ thống quản lý phòng khám **Phục Hồi Chức Năng (PHCN)** cho dân văn phòng — đặt lịch, lượng giá chức năng, trị liệu, thanh toán, hồ sơ điều trị. 5 actor: **Admin/Quản lý**, **Lễ tân**, **Chuyên viên Vật lý trị liệu** (tên cột/route cũ: "Bác sĩ"), **Kỹ thuật viên (KTV)**, **Khách hàng**.

**Sự kiện gốc:** Ngày 04/08/2026, hội đồng bảo vệ đồ án **đánh gãy toàn bộ nghiệp vụ khám**, yêu cầu làm lại. Deadline bảo vệ lại: **02/09/2026**. Ba điểm hội đồng chê cụ thể:

1. **Khám quá sơ sài** — màn hình khám chỉ có 3 ô nhập (chẩn đoán/chống chỉ định/ghi chú), không giống quy trình khám thật.
2. **Thiếu màn hình hàng đợi** — không tìm/tra cứu được khách tiếp theo để gọi vào khám.
3. **Booking khóa cứng nhân sự theo slot 30 phút** — khách xong sớm thì nhân sự ngồi chờ lãng phí công suất; khách đi làm dịch vụ khác thì cả dây chuyền tắc.

**Chẩn đoán gốc rễ:** Hệ thống cũ mô phỏng mô hình đặt lịch kiểu phương Tây (mỗi khách một slot giờ chính xác, khóa nhân sự) trong khi phòng khám Việt Nam vận hành theo mô hình **lấy số – chờ gọi**. Toàn bộ đợt tái thiết kế là chuyển hệ thống sang đúng mô hình đó.

**Hai bẫy nghiệp vụ đã chủ động loại trừ**:

| Bẫy | Vì sao bị loại |
|---|---|
| Xây module cận lâm sàng nội bộ (X-quang/MRI/PACS) | **Lý do pháp lý, không phải lý do phạm vi:** chụp X-quang cần giấy phép an toàn bức xạ + KTV chẩn đoán hình ảnh có chứng chỉ riêng — phòng khám PHCN **không được phép** làm việc này, phải **chuyển tuyến** ra cơ sở ngoài. Bỏ nó còn giải quyết luôn bài toán "chuyên viên ngồi chờ" (điểm chê #3). |
| Bán gói liệu trình **trước khi** lượng giá | Tạo xung đột lợi ích — người ra chỉ định (bán hàng) mất vai trò quyết định chuyên môn. Trình tự bắt buộc: lượng giá xong → có chỉ định → mới bán gói. |

---

## 1. 🏦 TỔNG QUAN NGHIỆP VỤ & BẢN CHẤT HỆ THỐNG

### 1.1. Mô hình đặt lịch theo buổi & ngân sách phút

**Vì sao bỏ slot 30 phút cố định:** Slot cố định giả định mọi dịch vụ tốn đúng thời lượng dự kiến và không có công việc chen ngang — sai với thực tế PHCN, nơi một buổi trị liệu xen kẽ tay-đôi (hands-on, KTV bận hoàn toàn) và máy chạy (hands-off, KTV rảnh). Khóa cứng slot khiến khách xong sớm thì nhân sự ngồi không, còn khách cần đi làm việc khác (chụp chiếu ngoài) thì cả dây chuyền slot phía sau bị đẩy lùi.

**Mô hình mới — đơn vị đặt lịch là BUỔI, sức chứa tính bằng NGÂN SÁCH PHÚT:**

| Hạng mục | Giá trị |
|---|---|
| Buổi Sáng | 07:30 – 12:00 (270 phút) |
| Buổi Chiều | 12:00 – 19:30 (450 phút) |
| Giờ đóng cửa | **20:00** — mọi ca phải xong trước mốc này (tham số `GIO_DONG_CUA` trong `backend/src/domain/capacity.ts`) |
| Ca trực nhân sự | Giữ nguyên 2 ca: 7h–16h và 11h–20h |

**Công thức ngân sách phút của một (nhân sự × buổi):**
```
ngân_sách = (phần giao giữa ca trực và giờ nhận khách của buổi) × số_khách_song_song
```
- Trừ ngân sách **đúng bằng `thoi_luong_phut`** của dịch vụ khách chọn — không đếm lượt, vì các gói có thời lượng khác nhau (30/60/90/120 phút).
- **Hai tầng sức chứa:** Ngân sách RIÊNG của từng nhân sự, và ngân sách CHUNG = tổng ngân sách riêng **trong cùng một nhóm vai trò**.
- Số khách song song mặc định: **Chuyên viên VLTL = 1** (lượng giá cần tập trung), **KTV = 2** (xen kẽ khi khách nằm máy — cấu hình được).
- Song song thực tế = `min(cấu hình số khách song song của nhân sự, sức_chứa phòng đang trực)`.

**⚠️ Tách túi theo vai trò — quy tắc bắt buộc:**

| Loại buổi | Ai làm | Trừ vào túi |
|---|---|---|
| Buổi Lượng giá | Chuyên viên VLTL | **Túi Chuyên viên** |
| Dịch vụ lẻ | KTV | **Túi KTV** |
| Buổi gói liệu trình | KTV | **Túi KTV** (dùng chung với dịch vụ lẻ) |

Lượng giá **KHÔNG BAO GIỜ** trừ chung với trị liệu/dịch vụ lẻ. Hết chỗ lượng giá không có nghĩa hết chỗ trị liệu và ngược lại.

**Ba bẫy tính toán đã ghi nhận:**
1. **Bẫy hai hệ số nhân:** Công thức có CẢ số khách song song LẪN ngân sách riêng nhân với nhau.
2. **Bẫy hai nhân sự KHÔNG đóng góp bằng nhau:** Ca 7h–16h giao buổi sáng = 270 phút, ca 11h–20h chỉ giao 60 phút.
3. **Bẫy "Bất kỳ" phải kiểm tra ĐỦ HAI điều kiện:** `① Σ đã dùng + thời lượng mới ≤ ngân sách CHUNG` **VÀ** `② TỒN TẠI ít nhất 1 nhân sự còn đủ chỗ trong ngân sách RIÊNG`.

### 1.2. Luồng 3 bước: Đặt lịch → Check-in & Thu tiền linh hoạt → Hàng đợi

```
① ĐẶT LỊCH                    ② LỄ TÂN CHECK-IN & THU TIỀN         ③ HÀNG ĐỢI LƯỢNG GIÁ / TRỊ LIỆU
   chọn dịch vụ                   CHỈ Lễ tân được check-in             mô hình KÉO, không gán sẵn
   → ngày → buổi                  Thu tiền LINH HOẠT, tách rời          nhân sự bấm "Gọi vào" mới gán
   → nhân sự / "Bất kỳ"           khỏi tiến trình lâm sàng              → "Bắt đầu" mới chạy đồng hồ
   bắt buộc đăng nhập             (xem bảng thời điểm thu bên dưới)
```

**① Đặt lịch:**
- Bỏ hoàn toàn chọn giờ cụ thể — chỉ chọn buổi.
- **Bắt buộc đăng nhập** — đã bỏ luồng khách vãng lai đặt online.
- Giới hạn **3 lịch đang hoạt động cùng lúc, toàn thời gian** (không phân theo ngày).

**② Lễ tân Check-in & Thu tiền linh hoạt — quy tắc cốt lõi:**

| Loại buổi | Thời điểm thu | Chặn cứng? |
|---|---|---|
| **Buổi Lượng giá** (khám) | **BẮT BUỘC trước khi bắt đầu** | ✅ Khóa nút "Bắt đầu khám" nếu `trang_thai_thanh_toan = chua_thanh_toan` |
| **Dịch vụ lẻ** | Linh hoạt: online / lúc check-in / sau khi làm xong | ❌ Không chặn |
| **Buổi gói 100%** | Đã trả trước → `da_thanh_toan` ngay khi tạo lịch | — |
| **Buổi gói từng buổi** | Linh hoạt (như dịch vụ lẻ) | ❌ Không chặn |
| **Mua gói liệu trình** | Tại quầy, sau khi có chỉ định | — |

**Vì sao CHỈ buổi Lượng giá chặn cứng:** Lượng giá là con đường DUY NHẤT Chuyên viên có thể bấm "Chuyển tuyến" và khách rời khỏi phòng khám. Chưa thu tiền mà khách đi luôn thì mất trắng. Trị liệu thì khách quẩn quanh trong phòng khám từ đầu tới cuối buổi nên không thể thất thoát.

Chặn **mềm**: Khách chưa trả vẫn check-in, vào hàng đợi bình thường, chỉ hiện cảnh báo đỏ "⚠️ Chưa thanh toán" trong hàng đợi.

**③ Hàng đợi — mô hình KÉO, KHÔNG gán nhân sự lúc check-in:**
Khách không chọn ai → vào **hàng đợi chung**, `nhan_su_id` để trống. Ai xong ca trước thì bấm **"Gọi vào"**, hệ thống gán ngay lúc đó.

### 1.3. Ranh giới thẩm quyền: Chuyên viên PHCN vs Bác sĩ y khoa

| ❌ KHÔNG được làm | ✅ ĐƯỢC làm, là chuyên môn chính |
|---|---|
| Chẩn đoán bệnh lý y khoa (vd đọc kết luận MRI "thoát vị đĩa đệm") | **ROM** (tầm vận động khớp) |
| Kê đơn thuốc | **MMT** (cơ lực, thang 0–5) |
| — | **VAS** — thang đau (Wong-Baker mặt cười / Mô tả / Thang số) |
| — | **Kết luận lượng giá** — mô tả CHỨC NĂNG, không phải bệnh lý |
| — | **Chống chỉ định vận động/trị liệu** — bắt buộc phải có |
| — | **Chuyển tuyến** khi nghi ngờ vấn đề ngoài thẩm quyền |

⚠️ **Nội dung `chan_doan`:** Viết *"hạn chế xoay cổ trái 40°, yếu nhóm cơ thang dưới bậc 3/5"* (chức năng), không viết chẩn đoán bệnh lý y khoa.

**Nút "Chuyển tuyến":** KHÔNG chọn loại chụp, KHÔNG validation dữ liệu lâm sàng, hỏi **hạn quay lại** → ca sang `cho_tai_luong_gia` (nhãn "Chờ tái lượng giá"), **giải phóng chuyên viên NGAY**. Khách quay lại: Lễ tân bấm "Check-in ngay" trên CHÍNH lịch đó (không tạo lịch mới) → vào **đầu hàng đợi** chuyên viên cũ. Quá hạn không quay lại → ca **tự chuyển hoàn thành**, không hoàn tiền khám.

---

## 2. 📐 QUY TẮC KIẾN TRÚC & RÀNG BUỘC CODE

### 2.1. Cấu trúc trạng thái — 3 tầng, KHÔNG được trộn

**Tầng 1 — LÂM SÀNG (`cuoc_hen.trang_thai`): đúng 7 giá trị**
`da_xac_nhan` · `da_checkin` · `dang_kham` (Đang thực hiện) · `cho_tai_luong_gia` · `hoan_thanh` · `da_huy` · `khong_den`.

**Tầng 2 — THANH TOÁN (`cuoc_hen.trang_thai_thanh_toan`): đúng 3 giá trị**
`chua_thanh_toan` · `dang_cho_thanh_toan` · `da_thanh_toan` (đã bỏ `mien_phi`).

**Tầng 3 — GIAI ĐOẠN TRONG BUỔI (`phien_lam_viec.giai_doan_hien_tai`): 3 giá trị**
`dang_thuc_hien` · `dang_tren_may` · `cho_ktv` (chỉ sống ở bàn làm việc, KHÔNG xuất hiện ở bộ lọc danh sách).

**Nguồn cấu hình UI duy nhất:** `frontend/src/components/appointmentStatusConfig.ts`.

### 2.2. Hủy & Hoàn tiền — Mô hình 2 trạng thái

| | **CHƯA thanh toán** | **ĐÃ thanh toán** |
|---|---|---|
| Khách tự hủy | ✅ Trong **60 phút kể từ lúc đặt** (`thoi_gian_tao`) | ❌ Không có nút hủy |
| Hết cửa sổ | ❌ Khóa hủy → không đến thì tính no-show | — |
| Đổi buổi | Không cần (hủy rồi đặt lại) | ✅ **Không giới hạn số lần, CHỈ Lễ tân đổi** |
| Hoàn tiền | Không có gì để hoàn | ❌ Không hoàn |
| Không đến | Đếm no-show | Mất tiền; gói trả trước thì trừ 1 buổi |

🔒 **TOÀN HỆ THỐNG CHỈ CÒN ĐÚNG MỘT ĐƯỜNG HOÀN TIỀN: Hủy cả gói liệu trình trả 100%** (xử lý tay tại quầy).

### 2.3. Giao dịch PayOS & Khóa Lạc Quan
- `dang_cho_thanh_toan` phát sinh khi: (1) Khách thanh toán online web, (2) Lễ tân cho quét VietQR tại quầy, (3) Khách bị gắn cờ no-show.
- Webhook + Lazy sweep 15 phút tự đảo về `chua_thanh_toan` nếu không nhận được webhook.
- Khóa lạc quan: mọi thao tác cập nhật trạng thái nhạy cảm phải kiểm tra `WHERE id = X AND trang_thai = '...'`.

---

## 3. 🎨 TIÊU CHUẨN GIAO DIỆN (FRONTEND DESIGN SYSTEM - SKILL INTEGRATED)

> 🚨 **QUY TẮC BẤT DI BẤT DỊCH:** Khi làm mới (Create) hoặc sửa lỗi (Fix) bất kỳ giao diện UI nào trong dự án, **BẮT BUỘC** áp dụng đồng thời các nguyên tắc dưới đây từ skill `frontend-design` (`.agents/skills/frontend-design/SKILL.md`).

### 3.1. Bản sắc thị giác & Tính chất chuyên khoa PHCN (Grounding in Subject)
- **Bản sắc thương hiệu:** Phục Hồi Chức Năng Y Tế Hiện Đại (Modern Medical Tech). Tạo cảm giác tin cậy, tự tin, phục hồi, chuyên nghiệp.
- **Bảng màu Token chuẩn:**
  - **Primary**: `#2EC4B6` (Medical Teal) — Dùng cho điểm nhấn chính, brand hero.
  - **Secondary / Accent**: `#0284C7` (Clinical Cyan) — Dùng cho tab active, chỉ số lâm sàng, link chính.
  - **Success**: `#10B981` (Emerald Green) — Dùng cho trạng thái hoàn thành, chỉ số VAS cải thiện.
  - **Warning / Alert**: `#F59E0B` (Amber Gold) — Dùng cho cảnh báo chưa thanh toán, chờ thu.
  - **Background**: `#F8FAFC` (Slate 50 Light) / `#09090B` (Zinc 950 Dark).
  - **Surface**: Thẻ kính mờ `glass-card` (`rgba(255, 255, 255, 0.85)` + `backdrop-blur-md` + `border border-slate-200/80`).
- **Tránh màu AI generic:** Tuyệt đối không dùng nền trần xám tối mịt mờ, không dùng hiệu ứng chói mắt chói lọi gây nhiễu thị giác.

### 3.2. Hệ thống phông chữ & Thang kích thước (Typography System & Scale)
- **Khai báo Font:**
  - **Headings / Display**: `Plus Jakarta Sans` / `Outfit` (Font-weight: 700 - 800, Letter-spacing: `-0.01em`).
  - **Body / Content**: `Be Vietnam Pro` / `Inter` (Font-weight: 400 - 600, Line-height: 1.6).
- **Mềm hóa chữ đen (Font Weight Softening):**
  - Mọi lớp `.font-black` hoặc `.font-extrabold` tự động mềm hóa về `font-weight: 700` để tránh hiện tượng chữ đen xì chói mắt nặng nề trên màn hình y tế.
- **Thang kích thước Fluid:**
  - `text-xs` (11-12px), `text-sm` (13-14px), `text-base` (15-16px), `text-lg` (18px), `text-xl` (20px), `text-2xl` (24px), `text-3xl` (30px), `text-4xl` (36px+).

### 3.3. Bố cục & Mật độ thị giác (Comfortable Density & Top-to-Bottom Scanning)
- **Mật độ thị giác (`VISUAL DENSITY: Comfortable`):**
  - Mọi container, card phải có độ thở thích hợp (`p-5`, `p-6`, `gap-5`, `gap-6`). Không dồn nén các ô lặt vặt.
- **Luồng quét thông tin 1 cột dọc (Top-to-Bottom Flow):**
  - Đọc từ trên xuống dưới: **Khối 1: Tóm tắt tiến độ / Hero** $\rightarrow$ **Khối 2: Thanh Tab điều hướng** $\rightarrow$ **Khối 3: Timeline / Nội dung chính** $\rightarrow$ **Khối Footer: 1 Nút bấm Primary CTA duy nhất**.
- **Quy tắc Single Primary CTA:**
  - Gom các nút bấm lẻ rải rác lặp đi lặp lại thành **MỘT Nút bấm chính duy nhất** (Gradient Glow `#2EC4B6` to `#10B981`) ở vị trí góc dưới trực quan.

### 3.4. Chuyển động tăng tốc phần cứng & Tương tác (Hardware-Accelerated Motion)
- **Ràng buộc hiệu ứng GPU:**
  - Mọi micro-interaction (hover, active, press) **CHỈ ĐƯỢC PHÉP** thay đổi 2 thuộc tính GPU: `transform` (ví dụ: `translateY(-2px)`, `scale(0.98)`) và `opacity`.
  - **CẤM** animate `margin`, `padding`, `top`, `left`, `width`, `height` (gây layout thrashing và làm giảm FPS).
- **Tương tác mượt:**
  - Class chuyển động: `transition-all duration-200 ease-out`.
  - Nút bấm click physics: `active:scale-95 transition-all duration-200`.
  - Bàn phím focus: `focus-visible:ring-2 focus-visible:ring-cyan-500/50`.

### 3.5. Chuẩn tương phản & Viết nội dung (WCAG AA Accessibility & Clinical Copy)
- **Độ tương phản chữ (WCAG AA):**
  - Text chính: `#1E293B` (Slate 800) hoặc `#0F172A` (Slate 900).
  - Text phụ / Muted: `#475569` (Slate 600). Cấm dùng màu xám quá mờ (`#94A3B8` trở xuống) cho thông tin quan trọng.
- **Ngôn ngữ giao diện (Clinical Microcopy):**
  - Viết theo góc nhìn người dùng: "Xác nhận thu tiền & In hóa đơn", "Bắt đầu khám", "Đặt lịch hẹn buổi tiếp theo".
  - Giữ nhất quán thuật ngữ UI: *Chuyên viên Vật lý trị liệu*, *Buổi Lượng giá*, *Bàn lượng giá*, *Kết luận lượng giá*, *Kế hoạch trị liệu*, *Lịch sử điều trị*.

---

## 4. 🚀 KẾ HOẠCH TỔNG THỂ & THỜI GIAN THỰC THI (3-5 NGÀY)

### 4.1. Bản đồ tiến độ 5 ngày (Roadmap)

```
[NGÀY 1] Database Migration & Core Domain (Budgeting, Capacity, Sweeps)
   │
[NGÀY 2] Receptionist Booking, POS Checkout & Attendance Check-in Modal
   │
[NGÀY 3] Clinical Assessment Workspace (ROM, MMT, VAS, Indications, Referrals)
   │
[NGÀY 4] Customer Medical Record & 1-Column Timeline Clean UI Overhaul
   │
[NGÀY 5] E2E Integration Verification, Optimization & Council Defense Readiness
```

### 4.2. Danh mục kiểm tra chi tiết theo từng ngày:

- **NGÀY 1: Nền Tảng CSDL & Thuật Toán Sức Chứa (Capacity Domain)**
  - [x] Sweep tự động no-show (`noShowSweep.middleware.ts`) & Lazy sweep PayOS (`paymentPendingSweep.middleware.ts`).
  - [x] Cấu hình công thức Ngân sách phút (`capacity.ts`) & phân tách 2 túi Chuyên viên / KTV.

- **NGÀY 2: Lễ Tân Đặt Lịch, Thu Tiền POS & Check-in**
  - [x] Phác thảo & chuẩn hóa UI POS Checkout (`pos_checkout_ui.png`) & Quản lý Hóa đơn (`invoice_management_ui.png`).
  - [x] Bảng dòng chảy `TodayFlowBoard.tsx` (Chưa đến / Đang chờ / Đang làm / Xong) dùng chung Lễ tân & Admin.
  - [x] Modal Check-in đón tiếp (`WalkInBookingModal.tsx`) với cảnh báo giờ tan ca.

- **NGÀY 3: Bàn Khám Lâm Sàng & Hàng Đợi Nhân Sự (Clinical Desk & Queue)**
  - [ ] Nâng cấp màn hình Bàn lượng giá Chuyên viên: Thêm bảng chỉ số ROM, MMT, VAS mặt cười Wong-Baker, Chống chỉ định.
  - [ ] 2 nút bấm kết thúc: `Hoàn thành lượng giá` (có validation) & `Chuyển tuyến` (nhập hạn quay lại, giải phóng slot ngay).
  - [ ] Màn hình Hàng đợi kéo (Sidebar Hàng đợi) cho Chuyên viên & KTV với các nút `Gọi vào` / `Bắt đầu` / `Gọi không có mặt`.

- **NGÀY 4: Hồ Sơ Khách Hàng Timeline Clean UX**
  - [x] Refactor `CustomerMedicalRecord/index.tsx` theo chuẩn 1-column Timeline Clean UX.
  - [x] Khối Hero tóm tắt tiến độ gói, chỉ số thuyên giảm VAS (`8 ➔ 2`), Sparkline xu hướng đau.
  - [x] Thẻ buổi trị liệu tự chứa đầy đủ kỹ thuật chips, KTV & Bàn, VAS trước/sau, ghi chú.

- **NGÀY 5: Kiểm Thử Toàn Diện & Sẵn Sàng Bảo Vệ**
  - [ ] Chạy kiểm thử E2E không lỗi TypeScript (`npx tsc --noEmit`).
  - [ ] Kiểm tra toàn bộ 7+3 trạng thái, không để sót bất kỳ trường hợp crash hay kẹt dữ liệu nào.

---

## 5. 📂 THAM CHUYỂN FILE MÃ NGUỒN CHÍNH

| Mảng | Path File Chính |
|---|---|
| **Domain Logic & Billing** | `backend/src/domain/billing.ts`, `backend/src/domain/capacity.ts`, `backend/src/domain/appointmentStatus.ts` |
| **Middlewares Sweepers** | `backend/src/middlewares/noShowSweep.middleware.ts`, `backend/src/middlewares/paymentPendingSweep.middleware.ts` |
| **UI Design Tokens & CSS** | `frontend/src/index.css`, `frontend/tailwind.config.js`, `.agents/skills/frontend-design/SKILL.md` |
| **Receptionist & Admin Flow** | `frontend/src/components/appointments/ui/TodayFlowBoard.tsx`, `frontend/src/features/receptionist/pages/ReceptionistAppointments/` |
| **Customer Medical Record** | `frontend/src/features/customer/pages/CustomerMedicalRecord/`, `frontend/src/components/TreatmentSessionDetailBody.tsx` |
| **Doctor Assessment Workspace** | `frontend/src/pages/ClinicalAssessment/index.tsx` |
