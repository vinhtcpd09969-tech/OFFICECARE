# AGENTS.md — Bộ não nghiệp vụ & kiến trúc OfficeCare

> **Mục đích file này:** đây là bản tổng hợp duy nhất, đầy đủ nhất về nghiệp vụ y tế PHCN, kiến trúc hệ thống, và các quyết định thiết kế của dự án OfficeCare — dành cho AI Agent đọc để có đủ ngữ cảnh làm việc mà không cần hỏi lại người dùng những gì đã quyết định.
>
> **Quan hệ với các tài liệu khác:**
> - `CLAUDE.md` (gốc dự án) — quy tắc bất di bất dịch (Socratic Gate, không code mù, DRY chủ động...). File này **không** lặp lại, chỉ tham chiếu.
> - `docs/BUSINESS_RULES.md`, `docs/ARCHITECTURE_CONVENTIONS.md`, `docs/DESIGN_SYSTEM.md` — vẫn là nguồn quy tắc chi tiết cho các mảng **chưa bị đợt tái thiết kế 04/08/2026 chạm tới** (sức chứa cũ theo giường/bác sĩ, đặt lịch tuần tự gói, trả góp, miễn phí khám, hủy gói/hoàn tiền, voucher). ⚠️ **CẢNH BÁO:** `BUSINESS_RULES.md` mục 2 ("Chưa xác nhận"/"cho_xac_nhan"), mục 7-8 (mốc 8 tiếng), mục 9 (quy trình xác nhận điện thoại) **đã bị thay thế** bởi các quyết định trong file này (xem §1.2, §2.1, §2.3) — coi file `AGENTS.md` này là nguồn sự thật mới nhất cho mọi thứ liên quan tới đặt lịch/trạng thái/hủy lịch, `BUSINESS_RULES.md` chỉ còn đúng cho phần **gói liệu trình/thanh toán/hoàn tiền** chưa đổi.
> - Kế hoạch chi tiết đầy đủ nhất (từng dòng quyết định, từng bảng ví dụ, từng luồng test) nằm ở plan gốc `smooth-tinkering-island` (đã dùng trong phiên làm việc tái thiết kế) — file này là bản **rút gọn có tổ chức lại** để AI đọc nhanh, không thay thế hoàn toàn plan gốc nếu cần tra cứu chi tiết cực nhỏ.
> - Skills tham chiếu khi code: `.claude/skills/business-rules/`, `.claude/skills/fsd-conventions/`, `.claude/skills/design-system/`.

---

## 0. Bối cảnh dự án (bắt buộc hiểu trước khi làm bất kỳ việc gì)

**OfficeCare** là hệ thống quản lý phòng khám **Phục Hồi Chức Năng (PHCN)** cho dân văn phòng — đặt lịch, lượng giá chức năng, trị liệu, thanh toán, hồ sơ điều trị. 5 actor: **Admin/Quản lý**, **Lễ tân**, **Chuyên viên Vật lý trị liệu** (tên cột/route cũ: "Bác sĩ"), **Kỹ thuật viên (KTV)**, **Khách hàng**.

**Sự kiện gốc:** Ngày 04/08/2026, hội đồng bảo vệ đồ án **đánh gãy toàn bộ nghiệp vụ khám**, yêu cầu làm lại. Deadline bảo vệ lại: **02/09/2026**. Ba điểm hội đồng chê cụ thể:

1. **Khám quá sơ sài** — màn hình khám chỉ có 3 ô nhập (chẩn đoán/chống chỉ định/ghi chú), không giống quy trình khám thật.
2. **Thiếu màn hình hàng đợi** — không tìm/tra cứu được khách tiếp theo để gọi vào khám.
3. **Booking khóa cứng nhân sự theo slot 30 phút** — khách xong sớm thì nhân sự ngồi chờ lãng phí công suất; khách đi làm dịch vụ khác thì cả dây chuyền tắc.

**Chẩn đoán gốc rễ:** hệ thống cũ mô phỏng mô hình đặt lịch kiểu phương Tây (mỗi khách một slot giờ chính xác, khóa nhân sự) trong khi phòng khám Việt Nam vận hành theo mô hình **lấy số – chờ gọi**. Toàn bộ đợt tái thiết kế là chuyển hệ thống sang đúng mô hình đó.

**Hai bẫy nghiệp vụ đã chủ động loại trừ** (từng cân nhắc rồi bác bỏ có chủ đích — nếu bị đề xuất lại, đây là lý do để từ chối):

| Bẫy | Vì sao bị loại |
|---|---|
| Xây module cận lâm sàng nội bộ (X-quang/MRI/PACS) | **Lý do pháp lý, không phải lý do phạm vi:** chụp X-quang cần giấy phép an toàn bức xạ + KTV chẩn đoán hình ảnh có chứng chỉ riêng — phòng khám PHCN **không được phép** làm việc này, phải **chuyển tuyến** ra cơ sở ngoài. Bỏ nó còn giải quyết luôn bài toán "chuyên viên ngồi chờ" (điểm chê #3). |
| Bán gói liệu trình **trước khi** lượng giá | Tạo xung đột lợi ích — người ra chỉ định (bán hàng) mất vai trò quyết định chuyên môn. Trình tự bắt buộc: lượng giá xong → có chỉ định → mới bán gói. |

---

## 1. 🏦 TỔNG QUAN NGHIỆP VỤ & BẢN CHẤT HỆ THỐNG

### 1.1. Mô hình đặt lịch theo buổi & ngân sách phút

**Vì sao bỏ slot 30 phút cố định:** slot cố định giả định mọi dịch vụ tốn đúng thời lượng dự kiến và không có công việc chen ngang — sai với thực tế PHCN, nơi một buổi trị liệu xen kẽ tay-đôi (hands-on, KTV bận hoàn toàn) và máy chạy (hands-off, KTV rảnh). Khóa cứng slot khiến khách xong sớm thì nhân sự ngồi không (lãng phí công suất thật), còn khách cần đi làm việc khác (chụp chiếu ngoài) thì cả dây chuyền slot phía sau bị đẩy lùi.

**Mô hình mới — đơn vị đặt lịch là BUỔI, sức chứa tính bằng NGÂN SÁCH PHÚT:**

| Hạng mục | Giá trị |
|---|---|
| Buổi Sáng | 07:30 – 12:00 (270 phút) |
| Buổi Chiều | 12:00 – 19:30 (450 phút) |
| Giờ đóng cửa | **20:00** — mọi ca phải xong trước mốc này (tham số `GIO_DONG_CUA` trong `backend/src/domain/capacity.ts`, hiện chưa được dùng ở đâu — xem §3 Pending) |
| Ca trực nhân sự | Giữ nguyên 2 ca: 7h–16h và 11h–20h |

**Công thức ngân sách phút của một (nhân sự × buổi):**
```
ngân_sách = (phần giao giữa ca trực và giờ nhận khách của buổi) × số_khách_song_song
```
- Trừ ngân sách **đúng bằng `thoi_luong_phut`** của dịch vụ khách chọn — không đếm lượt, vì các gói có thời lượng khác nhau (30/60/90/120 phút).
- **Hai tầng sức chứa:** ngân sách RIÊNG của từng nhân sự, và ngân sách CHUNG = tổng ngân sách riêng **trong cùng một nhóm vai trò** (xem tách túi bên dưới).
- Số khách song song mặc định: **Chuyên viên VLTL = 1** (lượng giá cần tập trung), **KTV = 2** (xen kẽ khi khách nằm máy — cấu hình được).
- Song song thực tế = `min(cấu hình số khách song song của nhân sự, sức_chứa phòng đang trực)`.

**⚠️ Tách túi theo vai trò — quy tắc dễ code sai nhất:**

| Loại buổi | Ai làm | Trừ vào túi |
|---|---|---|
| Buổi Lượng giá | Chuyên viên VLTL | **Túi Chuyên viên** |
| Dịch vụ lẻ | KTV | **Túi KTV** |
| Buổi gói liệu trình | KTV | **Túi KTV** (dùng chung với dịch vụ lẻ) |

Lượng giá **KHÔNG BAO GIỜ** trừ chung với trị liệu/dịch vụ lẻ. Hết chỗ lượng giá không có nghĩa hết chỗ trị liệu và ngược lại — mọi con số ngân sách phải nêu rõ đang nói về túi nào.

**Ba bẫy tính toán đã ghi nhận (đọc kỹ trước khi đụng code tính ngân sách):**

1. **Bẫy hai hệ số nhân:** công thức có CẢ số khách song song LẪN ngân sách riêng nhân với nhau. Ví dụ buổi sáng 270 phút: 1 Chuyên viên → 270 phút; 1 KTV bật song song 2 → 540 phút; 2 người CÙNG ca 7h–16h → 540 phút chung — không được nhầm các trường hợp này.
2. **Bẫy hai nhân sự KHÔNG đóng góp bằng nhau:** ca 7h–16h giao với buổi sáng 7h30→12h00 = 270 phút, nhưng ca 11h–20h chỉ giao 11h→12h00 = **60 phút**. Hai nhân sự mỗi người một ca khác nhau thì buổi sáng chỉ có 330 phút tổng, KHÔNG phải 540.
3. **Bẫy "Bất kỳ" phải kiểm tra ĐỦ HAI điều kiện:** `① Σ đã dùng + thời lượng mới ≤ ngân sách CHUNG` **VÀ** `② TỒN TẠI ít nhất 1 nhân sự còn đủ chỗ trong ngân sách RIÊNG`. Ví dụ: A dùng 250 phút, B dùng 250 phút (chung dùng 500/540, còn 40) — khách đặt 30 phút "Bất kỳ": điều kiện ① qua (530≤540) nhưng A và B đều chỉ còn 20 phút → không ai đủ 30 → **PHẢI CHẶN**. Chỉ kiểm tra ① thì hệ thống nhận ca mà tới nơi không ai làm được.

**Quy tắc chặn đặt lịch — theo THỜI LƯỢNG, không đếm số ca:**
```
CHẶN ⟺ thoi_luong_phut của dịch vụ > số phút còn lại trong ngân sách liên quan
```
Thông báo phải nói rõ **"Buổi sáng còn 60 phút — chỉ nhận dịch vụ ≤60 phút"**, tuyệt đối không báo "Hết chỗ" chung chung.

> ⚠️ `goi_dich_vu.thoi_luong_phut` là **MỐC KẾ HOẠCH**, không phải giới hạn cứng — dùng để tính ngân sách/dự báo, không thêm ràng buộc chặn nhân sự làm quá thời lượng đó (ca chạy dài hơn dự kiến là chuyện bình thường).

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
- **Bắt buộc đăng nhập** — đã bỏ luồng khách vãng lai đặt online (lý do: hồ sơ điều trị phải gắn đúng người được điều trị, xem §1.4).
- Giới hạn **3 lịch đang hoạt động cùng lúc, toàn thời gian** (không phân theo ngày) — khách được đặt nhiều lịch trong CÙNG một buổi (vd lượng giá xong làm trị liệu luôn), giới hạn duy nhất là tổng số lịch chưa kết thúc.
- Khách chọn nhân sự cụ thể → trừ ngân sách riêng người đó, biết trước tên + phòng (từ `lich_truc_nhan_su.phong_id`). Chọn "Bất kỳ" → trừ ngân sách chung, khuyến nghị (rải tải tốt hơn).

**② Lễ tân Check-in & Thu tiền linh hoạt — quy tắc cốt lõi:**

| Loại buổi | Thời điểm thu | Chặn cứng? |
|---|---|---|
| **Buổi Lượng giá** (khám) | **BẮT BUỘC trước khi bắt đầu** | ✅ Khóa nút "Bắt đầu khám" nếu `trang_thai_thanh_toan = chua_thanh_toan` |
| **Dịch vụ lẻ** | Linh hoạt: online / lúc check-in / sau khi làm xong | ❌ Không chặn |
| **Buổi gói 100%** | Đã trả trước → `da_thanh_toan` ngay khi tạo lịch | — |
| **Buổi gói từng buổi** | Linh hoạt (như dịch vụ lẻ) | ❌ Không chặn |
| **Mua gói liệu trình** | Tại quầy, sau khi có chỉ định | — |

**Vì sao CHỈ buổi Lượng giá chặn cứng** (không phải vì "lần đầu tiếp xúc" — khách cũ vẫn lượng giá lại được, lý do đó sai): **Lượng giá là con đường DUY NHẤT đưa khách ra khỏi trung tâm** — Chuyên viên có thể "Chuyển tuyến" và khách rời đi ngay, ngoài tầm kiểm soát. Chưa thu tiền mà khách không quay lại thì **mất trắng, không đòi được**. Trị liệu thì ngược lại — khách quẩn quanh trong trung tâm từ đầu tới cuối buổi, không có đường thất thoát, nên không cần chặn.

Chặn **mềm**: khách chưa trả vẫn check-in, vào hàng đợi bình thường, chỉ hiện cảnh báo đỏ "⚠️ Chưa thanh toán" trong hàng đợi để Chuyên viên báo Lễ tân — chỉ nút "Bắt đầu khám" bị khóa.

**Trạng thái lâm sàng TÁCH RỜI trạng thái thanh toán** (điều kiện kỹ thuật để có sự linh hoạt trên) — xem §2.1.

**③ Hàng đợi — mô hình KÉO, KHÔNG gán nhân sự lúc check-in:**

Lý do: gán theo "người ít ca nhất lúc check-in" là sai — ít ca nhất ≠ rảnh sớm nhất. Nếu gán khách cho nhân sự A lúc 9h rồi A nhận ngay ca 120 phút, trong khi nhân sự B xong lúc 9h15, khách bị "khóa" vào A dù B rảnh ngay cạnh.

Cách đúng: khách không chọn ai → vào **hàng đợi chung**, `nhan_su_id` để trống. Ai xong ca trước thì bấm **"Gọi vào"**, hệ thống gán ngay lúc đó.

**Phân biệt hai loại "rảnh":**

| Trạng thái | Ai quyết định gán |
|---|---|
| Đang thực hiện (tay-đôi) | — bận, không gán |
| **Rảnh tạm** (khách đang nằm máy) | **Nhân sự tự quyết** — hệ thống KHÔNG ép |
| **Rảnh hoàn toàn** (vừa xong ca, không còn khách nào) | ⭐ **Hệ thống TỰ GÁN** khách tiếp theo (ưu tiên: khách chọn đích danh > khách chờ lâu nhất), hiện nổi bật + nút "Gọi vào"; không bấm trong 5 phút thì trả về hàng đợi chung |

Hai nút tách biệt: **"Gọi vào khám"** (báo Lễ tân mời khách) → **"Bắt đầu khám"** (đồng hồ mới chạy).

Thứ tự hàng đợi theo `thoi_gian_checkin` (ai đến trước gọi trước), KHÔNG theo thời điểm đặt lịch.

### 1.3. Ranh giới thẩm quyền: Chuyên viên PHCN vs Bác sĩ y khoa

| ❌ KHÔNG được làm | ✅ ĐƯỢC làm, là chuyên môn chính |
|---|---|
| Chẩn đoán bệnh lý y khoa (vd đọc kết luận MRI "thoát vị đĩa đệm") | **ROM** (tầm vận động khớp) |
| Kê đơn thuốc | **MMT** (cơ lực, thang 0–5) |
| — | **VAS** — thang đau, xem 3 cách nhập bên dưới |
| — | **Kết luận lượng giá** — mô tả CHỨC NĂNG, không phải bệnh lý |
| — | **Chống chỉ định vận động/trị liệu** — bắt buộc phải có |
| — | **Chuyển tuyến** khi nghi ngờ vấn đề ngoài thẩm quyền |

⚠️ **Cột DB giữ tên `chan_doan` nhưng NỘI DUNG đổi bản chất:** không viết *"thoát vị đĩa đệm L4-L5"* (bệnh lý) mà viết *"hạn chế xoay cổ trái 40°, yếu nhóm cơ thang dưới bậc 3/5"* (chức năng). Nếu demo mà gõ một chẩn đoán bệnh lý vào ô này, hội đồng bắt lỗi ngay — toàn bộ việc đổi "Bác sĩ → Chuyên viên" mất tác dụng.

**VAS — 3 cách nhập, cùng ghi vào MỘT giá trị 0–10:**

| Cách | Mô tả | Mặc định |
|---|---|---|
| ⭐ **Thang mặt cười (Wong-Baker FACES)** | 6 khuôn mặt tươi→nhăn, tương ứng 0/2/4/6/8/10 | **MẶC ĐỊNH** — đa số khách chỉ cần chỉ tay |
| **Mô tả bằng lời** | Không đau · Nhẹ · Vừa · Nặng · Rất nặng · Không chịu nổi → tự quy đổi ra số | Khách quen mô tả bằng từ ngữ |
| **Thang số** | Thanh trượt 0–10 | Khách đã quen thang điểm |

Kèm câu hỏi neo chức năng khi khách lúng túng: *"Cơn đau có làm mất ngủ không? Có ảnh hưởng ngồi làm việc/lái xe không? Có phải uống thuốc giảm đau không?"*

**Nút "Chuyển tuyến":** KHÔNG chọn loại chụp (nói miệng ngoài đời), KHÔNG validation dữ liệu lâm sàng, chỉ hỏi **hạn quay lại** → ca sang trạng thái `cho_tai_luong_gia` (nhãn "Chờ tái lượng giá"), **giải phóng chuyên viên NGAY** (không chờ khách quay lại mới nhận khách mới). Khách quay lại: Lễ tân bấm "Check-in ngay" trên CHÍNH lịch đó (không tạo lịch mới, không thu tiền lần 2) → vào **đầu hàng đợi** của đúng chuyên viên cũ → mở lại CHÍNH bàn lượng giá cũ, nhập nốt ROM/chẩn đoán/chống chỉ định còn trống. Quá hạn không quay lại → ca **tự chuyển hoàn thành**, không hoàn tiền khám (vì chuyên viên đã lượng giá và đưa khuyến cáo kịp thời — đó là giá trị thật khách nhận được).

**Ảnh đính kèm:** chuyên viên CHỈ XEM (khách gửi ảnh lúc đặt lịch), KHÔNG có chức năng upload. Khách đi chụp chiếu về mang phim giấy đến, chuyên viên xem trực tiếp bằng mắt rồi nhập kết luận vào `chan_doan` — **không số hóa phim**.

### 1.4. Thuật ngữ hiển thị (chỉ đổi NHÃN UI, giữ nguyên tên bảng/cột/biến trong code)

| Hiện tại trong code | Hiển thị cho người dùng |
|---|---|
| Bác sĩ | **Chuyên viên Vật lý trị liệu** |
| Dịch vụ Khám | **Buổi Lượng giá** |
| Tái khám | **Lượng giá bổ sung** |
| Bàn khám | **Bàn lượng giá** |
| Chẩn đoán lâm sàng | **Kết luận lượng giá** |
| Phác đồ điều trị | **Kế hoạch trị liệu** |
| Hồ sơ bệnh án/điều trị | **Lịch sử điều trị** |
| Chuyển cận lâm sàng | **Chuyển tuyến** |
| `cho_tai_luong_gia` | **Chờ tái lượng giá** |
| Bệnh nhân | **Khách hàng** |
| Chống chỉ định | *giữ nguyên* (đúng thẩm quyền) |

> ⚠️ **KHÔNG** đổi thành "Tư vấn viên" — chức danh bán hàng không có thẩm quyền lâm sàng.

### 1.5. Vì sao bắt buộc đăng nhập, không cho nhập SĐT riêng từng lịch

Hai tình huống hay bị gộp nhầm:
- **Đổi sim** → sửa ở hồ sơ tài khoản, không phải từng lịch (sửa 1 lịch thì các lịch khác vẫn số cũ → loạn dữ liệu).
- **Đặt giùm người thân** → không phải vấn đề SĐT, mà là **hồ sơ y tế thuộc về ai**. Nếu A đặt cho mẹ mà chỉ đổi SĐT, kết luận lượng giá/VAS/chống chỉ định của mẹ bị ghi vào hồ sơ của A — lỗi nghiêm trọng về dữ liệu y tế.

→ **Mỗi người được điều trị phải có tài khoản riêng** (Lễ tân tạo giúp tại quầy nếu cần). *"Hệ thống bắt buộc đăng nhập vì hồ sơ điều trị phải gắn đúng người được điều trị — không thể dùng chung tài khoản, kể cả trong gia đình."*

---

## 2. 📐 QUY TẮC KIẾN TRÚC & RÀNG BUỘC CODE

### 2.1. Cấu trúc trạng thái — 3 tầng, KHÔNG được trộn

**Tầng 1 — LÂM SÀNG (`cuoc_hen.trang_thai`): đúng 7 giá trị**

| # | Giá trị | Nhãn |
|---|---|---|
| 1 | `da_xac_nhan` | Đã xác nhận (đặt xong vào thẳng đây, KHÔNG còn "chờ xác nhận") |
| 2 | `da_checkin` | Đã check-in (CHỈ Lễ tân bấm) |
| 3 | `dang_kham` | **Đang thực hiện** (đổi nhãn, giữ tên cột — dùng chung lượng giá lẫn trị liệu) |
| 4 | `cho_tai_luong_gia` | Chờ tái lượng giá |
| 5 | `hoan_thanh` | Hoàn thành |
| 6 | `da_huy` | Đã hủy (`loai_huy` là THUỘC TÍNH, không phải trạng thái riêng) |
| 7 | `khong_den` | Không đến (hệ thống tự quét) |

**Tầng 2 — THANH TOÁN (`cuoc_hen.trang_thai_thanh_toan`): đúng 3 giá trị**
`chua_thanh_toan` · `dang_cho_thanh_toan` · `da_thanh_toan` — **đã bỏ `mien_phi`** (buổi gói 100%/tái lượng giá cùng lịch/voucher 0đ đều quy về `da_thanh_toan`).

**Tầng 3 — GIAI ĐOẠN TRONG BUỔI (`phien_lam_viec.giai_doan_hien_tai`): 3 giá trị**
`dang_thuc_hien` · `dang_tren_may` · `cho_ktv` — ⚠️ **TUYỆT ĐỐI KHÔNG xuất hiện trong bộ lọc màn hình quản lý lịch hẹn**, chỉ sống ở bàn làm việc.

> **"Hoàn tất" KHÔNG phải trạng thái thứ 8** — tính động, một điều kiện duy nhất: `trang_thai = 'hoan_thanh'` **VÀ** `trang_thai_thanh_toan = 'da_thanh_toan'`. Không lưu cột thứ ba.

**Nguồn cấu hình UI duy nhất:** `frontend/src/components/appointmentStatusConfig.ts` — đã gộp 2 bảng lệch nhau (`statusConfig` 9 giá trị + `getClinicalStatusConfig` 8 giá trị có `cho_kham` không tồn tại trong DB) thành **1 bảng, 7 trạng thái**. Bất kỳ chuỗi nào ngoài 7 giá trị Tầng 1 xuất hiện trong bộ lọc lịch hẹn là lỗi.

### 2.2. Hủy & Hoàn tiền — mô hình 2 trạng thái (thay bảng nhiều nhánh cũ)

**Nguyên tắc gốc: tiền đã vào hệ thống thì không tự động đi ra.** Một câu hỏi duy nhất quyết định mọi nhánh: **lịch này đã thanh toán chưa?**

| | **CHƯA thanh toán** | **ĐÃ thanh toán** |
|---|---|---|
| Khách tự hủy | ✅ Trong **60 phút kể từ lúc đặt** (`thoi_gian_tao`) | ❌ Không có nút hủy |
| Hết cửa sổ | ❌ Khóa hủy → không đến thì tính no-show | — |
| Đổi buổi | Không cần (hủy rồi đặt lại) | ✅ **Không giới hạn số lần, CHỈ Lễ tân đổi** |
| Hoàn tiền | Không có gì để hoàn | ❌ Không hoàn |
| Không đến | Đếm no-show | Mất tiền; gói trả trước thì trừ 1 buổi |

> 🔒 **TOÀN HỆ THỐNG CHỈ CÒN ĐÚNG MỘT ĐƯỜNG HOÀN TIỀN: hủy cả gói liệu trình trả 100%** (xử lý tay tại quầy). Không hoàn tiền tự động cho bất kỳ ca đã thanh toán online nào — chỉ cho đổi lịch.

**Cửa sổ hủy 60 phút = VÀ của BA vế:** còn trong 60 phút từ lúc đặt **VÀ** chưa check-in **VÀ** buổi chưa kết thúc. Xóa **MỀM** (`trang_thai='da_huy'` + `loai_huy='khach_huy_som'`, KHÔNG phạt) — không xóa cứng, vì cần giữ dòng để chặn spam đặt→hủy→đặt lại vô hạn. **Trần 3 lần hủy-sớm/7 ngày.**

`loai_huy` (nullable): `khach_huy_som` (trong cửa sổ, không phạt) · `khach_huy` (Lễ tân hủy giúp) · `phong_kham_huy` (lỗi phòng khám → đổi buổi miễn phí, KHÔNG trừ hạn mức đổi của khách).

**Đổi buổi CHỈ Lễ tân, KHÔNG giới hạn số lần** — cố ý: nếu để khách tự đổi thì phải giới hạn số lần (chặn đẩy lịch vô hạn = hủy mềm trá hình), phát sinh cột đếm; giao Lễ tân thì con người là hạn mức, không cần cột đếm nào. Đổi buổi cho ca ĐÃ check-in phải đưa khách RA KHỎI hàng đợi trong CÙNG một `UPDATE` (đổi buổi + đưa `trang_thai` về `da_xac_nhan`), tránh khoảng hở với thao tác "Gọi vào" đang diễn ra song song — bảo vệ tầng cuối bằng khóa lạc quan: `UPDATE ... WHERE id=X AND trang_thai='da_checkin'`.

### 2.3. Giao dịch PayOS — webhook, idempotency, timeout 15 phút

**Trạng thái `dang_cho_thanh_toan` phát sinh trong đúng 3 tình huống** (điểm chung: mọi giao dịch qua cổng thanh toán, cổng trả kết quả bằng webhook không đồng bộ):
1. Khách bấm "Thanh toán online" trên web.
2. Lễ tân cho khách quét QR tại quầy qua PayOS.
3. Khách bị gắn cờ no-show buộc trả online.

> **KHÔNG phát sinh** khi Lễ tân thu tiền mặt/POS rồi bấm xác nhận — đi thẳng `chua_thanh_toan → da_thanh_toan`.

```
chua_thanh_toan
   │ tạo link PayOS
   ▼
dang_cho_thanh_toan   🔒 KHÓA nút Hủy · KHÓA tạo giao dịch thứ hai
   │
   ├─ webhook thành công ─────────▶ da_thanh_toan
   ├─ webhook thất bại/khách quay lại ─▶ chua_thanh_toan
   └─ quá 15 phút không webhook ──▶ chua_thanh_toan (TỰ ĐẢO — lazy sweep)
```

**Ba lớp bảo vệ:** (1) chặn hủy giữa chừng — hủy đúng lúc webhook đang bay sẽ ra `da_huy + da_thanh_toan` mà hệ thống không có đường hoàn tiền → tiền kẹt; (2) chặn trả 2 lần — khách mở 2 tab; (3) **nói thật với khách** — hiện *"Đang xác nhận thanh toán…"* thay vì báo sai "Chưa thanh toán" khiến khách hoảng và trả trùng.

**Ba nguồn được phép đảo trạng thái, theo độ tin cậy giảm dần:** webhook → tra cứu chủ động khi khách quay về `cancelUrl` (server gọi ngược PayOS tra trạng thái thật, **KHÔNG BAO GIỜ tin `cancelUrl` do client báo** — khách trả xong rồi bấm back trình duyệt mà tin client sẽ khiến hệ thống đảo nhầm về chưa-thanh-toán và khách trả lần 2) → timeout 15 phút lazy-sweep. **Client không nằm trong danh sách nguồn tin cậy.**

**Idempotent bắt buộc:** webhook về muộn SAU KHI đã tự đảo timeout vẫn phải xử lý đúng, không được làm mất tiền đã vào. Với tình huống 3 (khách bị gắn cờ no-show), hết 15 phút không trả → lịch **hủy mềm VÀ trả lại ngân sách phút**.

**Cửa sổ hủy 60 phút KHÔNG reset** khi vào/ra luồng thanh toán — tính cố định từ `thoi_gian_tao`, nếu không sẽ phá tầng chống spam.

**Cài đặt kỹ thuật:** cột `hoa_don.thoi_diem_tao_link_thanh_toan`; middleware `paymentPendingSweep.middleware.ts` theo đúng mẫu lazy-sweep đã dùng cho `packageExpirySweep`/`noShowSweep` (throttle tối đa 1 lần/60s/request qua module-level `lastSweepAt`/`sweepInFlight`, đăng ký global `app.use('/api', ...sweeps, apiRouter)` trong `index.ts`).

### 2.4. Thang chống spam 4 tầng cho lịch chưa thanh toán

> Cửa sổ 60 phút **KHÔNG phải "quyền được hủy"** — nó là ô sửa sai cho người bấm nhầm.

```
Đặt lịch, chọn trả tại quầy → da_xac_nhan + CHƯA THANH TOÁN
  │
  ├─ TẦNG 0 · lúc đặt: tối đa 3 lịch ĐANG HOẠT ĐỘNG cùng lúc (toàn thời gian, KHÔNG theo ngày)
  │
  ├─ TẦNG 1 · cửa sổ 60 phút: hủy = xóa mềm, KHÔNG phạt. Trần 3 lần hủy-sớm/7 ngày.
  │
  ├─ sau 60 phút → NÚT HỦY BIẾN MẤT
  │
  ├─ Đến ngày hẹn: có check-in → bình thường; KHÔNG đến → tự quét cuối buổi (+30 phút buffer) → +1 no-show
  │
  ├─ TẦNG 3 · đủ 2 no-show trong 60 ngày → gắn cờ BUỘC THANH TOÁN ONLINE
  │        (không trả tiền = không có lịch; trả rồi mà không đến = MẤT TIỀN, không đếm no-show tiếp — chống phạt kép)
  │
  └─ TẦNG 4 · sạch 60 ngày không no-show → tự gỡ cờ
```

**Vì sao bắt buộc có Tầng 3:** ba tầng đầu chỉ *làm chậm*, không chặn hẳn — chỉ Tầng 3 đổi bản chất trò chơi từ **miễn phí** sang **tốn tiền thật**.

**Thiệt hại thật của 1 lịch không-đến chưa-thanh-toán:** nó đã tiêu ngân sách phút của ca trong suốt thời gian tồn tại → khách khác bị báo hết chỗ. Mất doanh thu thật dù không mất tiền mặt.

> ❌ **Cố ý KHÔNG bịt:** khách tạo tài khoản mới né cờ — hệ thống đã bắt OTP xác thực email, ma sát đó đủ với quy mô 20–40 lịch/ngày. Chống sâu hơn (đối chiếu SĐT/thiết bị) không tương xứng chi phí.

### 2.5. Quy tắc backend/frontend chung (tham chiếu nhanh — chi tiết ở `docs/ARCHITECTURE_CONVENTIONS.md`)

- Backend: `controllers/` (nhận request, không business logic) → `services/` (logic) → `repositories/` (DB, nơi ném `Error` nghiệp vụ) → `schemas/` (Zod). RBAC khai báo **theo từng endpoint**, cấm catch-all middleware chặn đầu file nếu file có API mà Lễ tân/Chuyên viên/KTV cần đọc.
- Lỗi nghiệp vụ từ service/repository → controller trả `400` kèm message gốc — **cấm** nuốt lỗi thành `500` chung chung.
- Frontend: `features/<actor>/pages|components/{hooks,ui}` — mỗi actor 1 page riêng, route riêng. Logic API/state nằm trong custom hook, component UI chỉ nhận props. UI lặp lại giữa actor → tách Shared Component (không copy-paste).
- `frontend/src/shared/{stores,utils,api}/...` là nợ kỹ thuật đã biết (mồ côi từ 1 lần migrate dở dang) — **luôn dùng bản top-level** (`stores/authStore.ts`, `utils/date.ts`, `api/axios.ts`), không thêm import mới trỏ vào `shared/`.
- **Thay đổi schema CSDL: TUYỆT ĐỐI KHÔNG chạy `prisma migrate dev`** (gây reset dữ liệu). Dùng MCP `postgres` (`pg_manage_schema`) hoặc raw SQL, sau đó `npx prisma generate`.
- Test chạy bằng `npx vitest run`, KHÔNG dùng `npx jest` (lỗi ESM import trên codebase này).

---

## 3. ⚠️ NGUYÊN TẮC THIẾT KẾ GIAO DIỆN (UI/UX)

### 3.1. Bảng màu & chất liệu

- **Cấm tuyệt đối** tím/violet/indigo/magenta hoặc neon tím làm tông chủ đạo — cliché phổ biến nhất của giao diện AI thiếu sáng tạo.
- Palette chuẩn: **Primary Teal `#2EC4B6`** (xanh mòng két, chuẩn y khoa phục hồi) · **Secondary Slate `#0F172A`** (đáng tin cậy, vững chãi) · **Accent Amber/Emerald** (khẩn cấp/thành công).
- **Glassmorphism tươi sáng:** nền mờ mịn + border siêu mảnh (`border-slate-100/80` / `dark:border-zinc-800/60`) + đổ bóng mờ nhẹ. Gradient tinh tế cho thẻ KPI chính/thanh chỉ dẫn quy trình.
- Trạng thái lâm sàng (7 giá trị Tầng 1 ở §2.1) dùng **đúng 1 bảng màu duy nhất trên mọi trang của mọi actor** — nguồn: `appointmentStatusConfig.ts`.

### 3.2. Hình học

- **Cấm bo tròn mặc định `rounded-md`** lặp lại mọi nơi — nhàm chán kiểu template.
- Chọn rõ 1 trong 2 hướng theo ngữ cảnh: **nét sắc sảo 0–2px** (tối giản, kỹ thuật y khoa nghiêm túc) hoặc **bo tròn lớn 16–32px** (Bento Grid thân thiện, nút hành động nổi bật).

### 3.3. Chuyển động & trạng thái tải

- **Spring physics** (`type: "spring", stiffness: 300, damping: 20`), không easing tuyến tính cơ bản.
- **Stagger reveal** cho danh sách (bảng giá, danh sách nhân sự, danh sách ngày) — hiện so le, không đồng loạt.
- **Hover feedback vật lý:** nút/thẻ click được dịch `y: -4` đến `-6` + box-shadow lan tỏa.
- **Cấm spinner tròn giữa màn hình** cho tải dữ liệu dài → **Skeleton Loader** đúng khung component.
- Double confirmation (cảnh báo cam/vàng) khi khách chọn khung giờ cận (<2 tiếng).

### 3.4. Nguyên tắc màn hình vận hành — "1 màn hình dùng chung", không phân mảnh theo actor/ngày

**Bài học rút ra trong phiên tái thiết kế (chốt, áp dụng cho mọi màn hình vận hành mới):**

- Lễ tân và Admin xem cùng một loại dữ liệu (lịch hẹn), qua cùng permission scope backend (`authorizeRoles(2, 4, 5, 6)` cho phần đọc) — **không tạo 2 giao diện khác nhau cho cùng một nhu cầu xem chỉ vì khác actor**. Nếu Admin cần thêm quyền thao tác (đổi nhân sự, xem thống kê sâu hơn), thêm **prop tùy chọn** vào component dùng chung (vd `staffFilterOptions`/`onStaffFilterChange` chỉ Admin truyền), không tách file/component riêng.
- Cùng lý do: **không tạo giao diện khác nhau cho "hôm nay" so với "ngày khác"** nếu bản chất câu hỏi người dùng đặt ra giống nhau (xem danh sách lịch của 1 ngày). Component `TodayFlowBoard.tsx` (`frontend/src/components/appointments/ui/`) dùng CHUNG cho mọi ngày đơn lẻ và cả 2 actor Lễ tân/Admin — mọi tính toán "còn lại theo giờ hiện tại" bên trong nó (vd widget Sức khỏe ca) phải tự nhận biết đang xem hôm nay hay ngày khác (so `selectedDateStr` với ngày thực) để không tính sai khi tái sử dụng cho ngày không phải hôm nay.
- **Không dùng sidebar cố định chặn nội dung chính** nếu nội dung sidebar có thể gộp vào cùng hàng với widget đã có (vd dropdown lọc nhân sự gộp chung hàng với 2 ô "Sức khỏe ca Sáng/Chiều" thay vì làm card riêng trong sidebar phải) — ưu tiên nội dung chính full-width, mọi phần tử phụ trợ phải tự chứng minh nó thật sự cần một khu vực cố định riêng.
- Với các "tổng hợp theo khoảng ngày" (bảng công suất/KPI tuần), chỉ hiển thị các chỉ số **thật sự có ý nghĩa khi gộp theo khoảng thời gian dài** (Hoàn thành, Đã xác nhận/đang chờ, Đã hủy, Không đến) — loại bỏ các trạng thái vận hành trong-ngày (Đã check-in, Đang thực hiện, Chờ tái lượng giá) vì chúng chỉ có ý nghĩa tại một thời điểm, gộp theo tuần sẽ không actionable.

### 3.5. Timeline 1 cột cho Hồ sơ điều trị khách hàng (A18 — kiến trúc đã CHỐT, chưa code)

**Giữ nguyên kiến trúc thông tin hiện có** (`RecordTabs.tsx`) — 3 tab theo loại (Gói liệu trình/Dịch vụ lẻ/Khám lâm sàng) → mỗi tab là **timeline các buổi theo 1 cột dọc**, mỗi buổi tự chứa đầy đủ nội dung của chính nó (`SessionTimelineItem.tsx` render `TreatmentSessionDetailBody.tsx` trực tiếp — KHÔNG phải bảng phẳng + popup rời). Đây chính là "bấm vào lịch sử nào thì hiện nội dung của buổi đó" — **không đập đi xây lại cấu trúc này**.

**Vấn đề thật cần sửa không phải cấu trúc mà là NGÔN NGỮ THỊ GIÁC:**
- 🔴 **Bỏ "Điểm uy tín"** khỏi header khách hàng — đó là công cụ quản trị rủi ro no-show nội bộ, không phải thứ khách cần biết về sự hồi phục của chính họ. Thay 1 ô KPI bằng **"Mức đau đã giảm X%"** (tính từ VAS đầu so với VAS gần nhất).
- ⭐ **Nâng `VasTrendSparkline.tsx` thành "đường hành trình"** — mỗi buổi là 1 mốc trên tuyến ngang, buổi hiện tại nổi bật, buổi tương lai mờ. **CHỈ vẽ cho ĐÚNG MỘT gói liệu trình đang `dang_dieu_tri`** (nhiều gói active thì ưu tiên gói cập nhật gần nhất + nút chuyển gói) — KHÔNG gộp VAS của lượng giá (1 điểm chụp nhanh)/dịch vụ lẻ (từng lần độc lập)/nhiều gói khác nhau thành 1 biểu đồ, vì nối các nguồn khác bản chất là sai lâm sàng.
- Đổi icon ở điểm nhấn tiến độ sang ngôn ngữ vận động (dáng đi, tầm vận động khớp) thay vì check-mark/calendar hành chính — chỉ ở điểm nhấn, không đổi tràn lan.
- Nút **"Đặt lịch buổi tiếp theo"** phải là hành động CHÍNH của mỗi gói đang điều trị, hiện ngay ở trạng thái thu gọn của card gói — khi bị khóa (quy tắc đặt tuần tự) phải nói rõ lý do tại chỗ ("Cần hoàn thành buổi 4 trước"), không chỉ làm mờ nút.
- Tái dùng bắt buộc: `frontend/src/components/TreatmentSessionDetailBody.tsx` (đang phục vụ 6 vị trí ở 3 actor) — **mở rộng** component này (thêm khối "Kỹ thuật đã thực hiện" đọc từ JSONB `du_lieu_tri_lieu.nhat_ky`), không viết lại.

---

## 4. 📋 TRẠNG THÁI TRIỂN KHAI — ĐÃ LÀM / DANG DỞ / VIỆC TIẾP THEO

> Cập nhật tại thời điểm viết file này (phiên làm việc liên tục kể từ 04/08/2026, hôm nay theo hệ thống là 07/08/2026 — còn **~26 ngày** tới deadline 02/09/2026).

### 4.1. ✅ ĐÃ LÀM XONG

**Nền tảng trạng thái & thanh toán:**
- **A10 — Chuẩn hóa 7 trạng thái lâm sàng:** gộp 2 bảng cấu hình lệch nhau thành 1 (`appointmentStatusConfig.ts`), dọn sạch `chua_xac_nhan`/`cho_xac_nhan`/`giu_cho`/`cho_kham` khỏi toàn bộ backend (`appointment/admin/doctor/technician/receptionist.repository.ts`) và frontend. Bổ sung `cho_tai_luong_gia` vào các nơi kiểm tra "lịch đang hoạt động".
- **A10b — Tách trạng thái thanh toán khỏi trạng thái lâm sàng:** `processPayment` (cả thu quầy lẫn webhook PayOS) giờ ghi đúng `cuoc_hen.trang_thai_thanh_toan` (trước đây cột tồn tại nhưng không ai từng ghi); SELECT đọc thẳng cột thật thay vì suy luận qua hóa đơn liên kết.
- **A10c — Hiển thị 2 badge cạnh nhau:** DetailModal, nút "Thu tiền" nằm ngay cạnh badge trạng thái lâm sàng.
- **A12 — Giới hạn đặt lịch:** `checkCustomerActiveLimit` (3 lịch đang hoạt động, toàn thời gian). Đã xóa hẳn `checkCustomerOverlap`/`checkDoctorOverlap` (kể cả 1 call site sống sót gây lỗi thật "đã có lịch trong khung giờ này" chặn check-in khách thứ 2 trở đi cùng buổi — đã tìm và xóa). Vẫn giữ `checkCustomerHasClinicalExamOnDate` (tối đa 1 buổi Lượng giá/ngày).
- **A13/A14 — Mô hình hủy 60 phút:** thay hẳn gate "≥8 tiếng trước giờ hẹn" cũ. Xem §2.2.
- **A15 — `dang_cho_thanh_toan` + PayOS:** middleware sweep 15 phút, markLinkCreated/revertPending, badge "Đang xác nhận" ở UI. Xem §2.3.
- **A15b/A15c — Phạt hủy gói không hồi tố:** snapshot `ti_le_phat_huy_goi` vào hóa đơn lúc bán, đọc lại đúng số đó lúc hủy (không đổi theo cấu hình hiện hành); `giaThanhToanGoi` lấy thẳng `tong_tien_phai_tra` (đúng cả khi có voucher).
- **B10 — Tự động đánh dấu không đến:** lazy sweep (`noShowSweep.middleware.ts`), điều kiện `da_xac_nhan` + qua giờ nhận khách + đệm 30 phút. Tái dùng nguyên vẹn `updateAppointmentStatus`.

**Màn hình quản lý lịch hẹn (A5 — mảng vừa hoàn thành trong phiên gần nhất):**
- `TodayFlowBoard.tsx` — bảng 1 nhóm theo dòng chảy (Chưa đến/Đang chờ/Đang làm/Xong + Ngoại lệ thu gọn), thay hẳn `AppointmentCalendar` cũ (dạng slot-giờ cố định) cho **MỌI ngày đơn lẻ** (không chỉ "hôm nay" như bản đầu) và **CẢ HAI actor** Lễ tân + Admin dùng chung.
- Widget "Sức khỏe ca Sáng/Chiều" (B21 bản rút gọn) — đã sửa để nhận biết ngày đang xem có phải hôm nay không (tránh tính sai công suất khi xem ngày khác).
- Dropdown lọc theo nhân sự (thay hẳn card `DoctorWorkloadPanel` cũ) — gộp chung hàng với "Sức khỏe ca", chỉ Admin có (Lễ tân xem/lọc được, không có quyền phân bổ/đổi nhân sự cho lịch).
- Đã xóa hẳn sidebar phải chặn nội dung (cả 2 trang Admin/Lễ tân) — nội dung chính full-width. Đã xóa 2 component mồ côi phát sinh: `DoctorWorkloadPanel.tsx`, `PendingPaymentPanel.tsx`.
- Bảng công suất (7 ngày, `CapacityView`) — rút từ 8 thẻ KPI xuống **4 thẻ**: Hoàn thành, Đã xác nhận, Đã hủy, Không đến (bỏ các trạng thái vận hành trong-ngày không có ý nghĩa gộp tuần).
- B15 — Admin đổi nhân sự cho 1 ca: vá 3 điều kiện (status gate ca chưa bắt đầu/đang thực hiện, ngân sách phút, số bàn song song), tự thêm ghi chú "Không thể phân bổ vì..." dưới từng nhân sự bị chặn. Endpoint mới `GET /appointments/staff-budget`.
- Xác nhận trước khi Check-in (`ConfirmDialog`) ở TodayFlowBoard.
- Vá 3 chỗ badge "Sẵn sàng"/"Không khả dụng" coi nhầm nhân sự đang xếp hàng chờ (`da_checkin`) là đang bận — chỉ `dang_kham` mới tính chiếm chỗ thật.

### 4.2. ⚠️ DANG DỞ / CHƯA LÀM — theo mức độ ưu tiên

🔴 **ƯU TIÊN CAO NHẤT — chính là 2/3 điểm hội đồng chê, CHƯA giải quyết dứt điểm:**

| Hạng mục | Hiện trạng |
|---|---|
| **A11/A17/A17a — Bàn lượng giá** | Form khám **VẪN CÒN 3 ô nhập cũ** (chẩn đoán/chống chỉ định/ghi chú). Chưa thêm ROM/MMT/VAS 3-cách-nhập, chưa 2 nút kết thúc (Hoàn thành lượng giá / Chuyển tuyến), chưa tab Chỉ định gói. |
| **B1/A17 — Hàng đợi cho Chuyên viên/KTV** | Chưa tồn tại màn hình riêng. Theo kế hoạch, B1 hợp nhất làm sidebar của màn A17 (Bàn lượng giá) — cả 2 phải làm cùng lúc. |
| **A17b/A17c — Bàn trị liệu KTV** | Vẫn chỉ có VAS trước/sau + ghi chú tự do. Chưa có Nhật ký thao tác, chưa cơ chế "Đưa vào máy" + song song hóa, chưa trạng thái `cho_ktv`. |

Đây là **điểm nghẽn quan trọng nhất của toàn bộ kế hoạch** — càng để lâu càng rủi ro sát deadline (kế hoạch gốc xếp đây là Giai đoạn 4, 7 ngày, "điểm nghẽn lớn nhất").

**Còn lại theo nhóm (chưa làm, đúng như kế hoạch gốc):**

| Nhóm | Hạng mục | Ghi chú |
|---|---|---|
| Booking Lớp 2 | **B20/B20b** — công thức `MIN(tan ca, đóng cửa) − thời lượng − đệm`, đèn 3 màu tại quầy, modal 3 lựa chọn | Chỉ mới có 1 cảnh báo cam TĨNH ở `WalkInBookingModal` khi nhân sự tan ca sớm hơn buổi — chưa có công thức đầy đủ, chưa có đèn/modal |
| Hồ sơ khách hàng | **A18** — tái cấu trúc theo Timeline 1 cột (xem §3.5) | Kiến trúc đã CHỐT trong kế hoạch, code chưa động tới |
| Hàng đợi & gọi khám | B2–B9, B11, B14, B16, B18, B18b, B19, B22, B23 | Toàn bộ nhóm phụ thuộc B1/A17 xong trước |
| Thanh toán online cho khách | **B12** | PayOS đã có sẵn cho Lễ tân, chỉ cần mở rộng endpoint cho vai trò khách hàng |
| Voucher điều kiện | **B13** | Thêm 3 cột `tu_dong_ap_dung`/`kenh_ap_dung`/`loai_goi_ap_dung` vào `khuyen_mai_voucher` |
| Dọn dữ liệu | **C12** — cron dọn triệt để `refresh_tokens`/`otp_codes` | Hiện chỉ có dọn lười (delete-expired-on-write) |
| Cố ý giữ lại | **C9** — nút "Không đến" thủ công của Lễ tân | Giữ song song làm lưới an toàn cạnh sweep tự động (B10), chưa gỡ vì rủi ro nếu sweep có ca biên chưa lường hết — cần hỏi lại trước khi gỡ |
| Chưa chốt | **B24** — Check-in từ xa cho khách đã thanh toán | Đã đặc tả cơ chế đầy đủ trong kế hoạch nhưng **CHƯA CHỐT triển khai** — hỏi lại khi làm tới Phase 3/5, phụ thuộc Hàng đợi + B12 xong trước |

**Backlog kỹ thuật phát sinh trong lúc audit (chưa xử lý, cần quyết định riêng):**
- 3 endpoint `receptionist.repository.ts::getTodayAppointments/getReceptionistStats` (`GET /receptionist/today-appointments`, `/stats`, `/dashboard`) là code mồ côi từ kanban đời trước — grep frontend không còn nơi nào gọi. Chưa xóa vì là quyết định xóa hẳn API, cần hỏi lại trước.

### 4.3. Việc tiếp theo — thứ tự đề xuất

1. **A11 + A17 + A17a + B1 (Bàn lượng giá + Hàng đợi Chuyên viên)** — làm CÙNG LÚC theo đúng kế hoạch (B1 là sidebar của A17), vì đây là 2 trong 3 điểm hội đồng chê, deadline không còn nhiều. Cần bản mẫu giao diện tham chiếu (MediPlus) đã có sẵn trong kế hoạch gốc — lấy bố cục, không bê nguyên nội dung (nhiều khối như "dấu hiệu sinh tồn"/"đơn thuốc" ngoài thẩm quyền PHCN).
2. **A17b/A17c (Bàn trị liệu KTV)** — Nhật ký thao tác + cơ chế song song hóa máy. Có thể cắt A17c trước tiên nếu trễ tiến độ (đã đánh giá "ưu tiên thấp, có thể cắt" ngay trong kế hoạch gốc — điểm chê #3 đã giải quyết trọn vẹn bằng mô hình buổi, song song hóa chỉ là điểm cộng thêm).
3. **B20/B20b đầy đủ** — công thức thời gian thực + đèn 3 màu, vì hiện tại vẫn còn lỗ hổng đã xác nhận (khách đặt sát giờ đóng cửa với dịch vụ dài vẫn được nhận mà không cảnh báo đúng).
4. **A18 (Hồ sơ khách hàng)** — nên gộp cùng đợt với A17 vì cùng cần hiển thị dữ liệu lượng giá mới (ROM/MMT), tránh đụng lại cùng file 2 lần.
5. **B12/B13 (thanh toán online khách + voucher)** — xếp cuối vì độc lập nhất, trễ không ảnh hưởng luồng chính.
6. **C12** — việc nhỏ, làm xen kẽ bất kỳ lúc nào rảnh.

**Mốc kiểm tra:** nếu tới ngày 21 (theo lịch trình gốc, tính từ 04/08) chưa xong A17/A18, thứ tự cắt: (1) A17c trước tiên · (2) độ tinh chi tiết giao diện · **giữ bằng mọi giá** luồng chạy được trọn vẹn (A11, B4–B7) vì đó mới là điều hội đồng chê.

---

## 5. File tham chiếu nhanh khi code chạm các mảng trên

| Mảng | File chính |
|---|---|
| Công thức nghiệp vụ thuần (billing, phạt, hoàn tiền) | `backend/src/domain/billing.ts` (+ test `billing.test.ts`) |
| Ngân sách phút, giờ đóng cửa, buffer no-show | `backend/src/domain/capacity.ts` |
| Trạng thái lịch hẹn dùng chung | `backend/src/domain/appointmentStatus.ts` |
| Nguồn sự thật trạng thái UI | `frontend/src/components/appointmentStatusConfig.ts` |
| Ngân sách/booking/hủy lịch backend | `backend/src/repositories/appointment.repository.ts` |
| Thu tiền/PayOS/sweep thanh toán | `backend/src/repositories/receptionist.repository.ts`, `middlewares/paymentPendingSweep.middleware.ts` |
| Bảng dòng chảy dùng chung Lễ tân+Admin | `frontend/src/components/appointments/ui/TodayFlowBoard.tsx` |
| Trang quản lý lịch hẹn theo actor | `frontend/src/features/receptionist/pages/ReceptionistAppointments/`, `frontend/src/features/admin/pages/ManageAppointments/` |
| Bàn lượng giá/hàng đợi (CHƯA tái cấu trúc) | `frontend/src/pages/ClinicalAssessment/index.tsx` |
| Hồ sơ điều trị khách hàng (CHƯA tái cấu trúc) | `frontend/src/features/customer/pages/CustomerMedicalRecord/`, tái dùng `frontend/src/components/TreatmentSessionDetailBody.tsx` |
| Đặt lịch công khai | `frontend/src/features/public/components/booking/` |
| Đặt lịch tại quầy | `frontend/src/components/WalkInBookingModal.tsx` |

**MCP dùng khi làm việc trong các mảng trên:** `postgres` (chỉ đọc/kiểm tra dữ liệu dev, KHÔNG chạy migration) · `playwright` (test tay luồng UI phức tạp: đặt lịch, thanh toán, hàng đợi).
