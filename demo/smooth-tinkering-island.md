# Tái thiết kế nghiệp vụ Đặt lịch – Lượng giá – Thanh toán (OfficeCare)

## Context

Ngày 04/08/2026, hội đồng bảo vệ **đánh gãy toàn bộ nghiệp vụ khám** của đồ án và yêu cầu làm lại. Deadline bảo vệ lại: **02/09/2026 (29 ngày)**.

Ba điểm hội đồng chê cụ thể:
1. **Khám quá sơ sài** — màn hình bác sĩ chỉ có 3 ô nhập (chẩn đoán / chống chỉ định / ghi chú), không giống quy trình khám thật vốn phải qua nhiều bước.
2. **Thiếu màn hình hàng đợi** — bác sĩ không tìm/tra cứu được khách tiếp theo để gọi vào khám.
3. **Booking khóa cứng nhân sự theo slot 30 phút** — khách xong sớm thì bác sĩ ngồi chờ, lãng phí công suất; khách đi chụp chiếu thì cả dây chuyền tắc.

Sau khi phân tích, gốc rễ là hệ thống đang mô phỏng mô hình đặt lịch kiểu phương Tây (mỗi khách một slot giờ chính xác, khóa nhân sự) trong khi **thực tế phòng khám Việt Nam vận hành theo mô hình lấy số – chờ gọi**. Kế hoạch này chuyển hệ thống sang mô hình đúng, đồng thời chuẩn hóa lại nghiệp vụ lượng giá và thanh toán.

**Hai bẫy đã chủ động loại trừ** (từng được cân nhắc rồi bác bỏ):
- ❌ Xây module cận lâm sàng nội bộ (X-quang/MRI/PACS) — phình phạm vi khổng lồ; phòng khám PHCN nhỏ thực tế **chuyển tuyến ra ngoài**, nên bỏ nó còn giải quyết luôn bài toán "bác sĩ ngồi chờ".
- ❌ Bán gói liệu trình trước khi lượng giá — tạo xung đột lợi ích, người ra chỉ định mất vai trò quyết định chuyên môn.

---

## Các quyết định thiết kế đã chốt

### Mô hình đặt lịch
| Hạng mục | Quyết định |
|---|---|
| Đơn vị đặt lịch | **Theo buổi (ca)**, bỏ hoàn toàn chọn giờ |
| Ca trực nhân sự | Giữ nguyên 7h–16h và 11h–20h |
| Giờ nhận khách | **7h30 – 19h30** (tham số cấu hình, không viết cứng) — nhưng đây chỉ là **chốt thô**, chốt tinh là "giờ đến muộn nhất" theo từng dịch vụ |
| ⭐ **Giờ đóng cửa** | **20:00** — thời điểm mọi ca phải xong, trùng giờ tan ca muộn nhất (ca 11h–20h). Là số hạng thứ hai trong `MIN(tan ca, đóng cửa)` của Lớp 2 |
| Buổi khách chọn | **Sáng 7h30–12h00** · **Chiều 12h00–19h30** |
| Đơn vị sức chứa | **Ngân sách PHÚT**, không đếm lượt — vì gói có thời lượng khác nhau (30/60/90/120 phút) |
| Công thức ngân sách | `(phần giao giữa ca trực và giờ nhận khách) × số khách song song` |
| Trừ ngân sách | Đặt lịch trừ **đúng `thoi_luong_phut` của dịch vụ khách chọn** |
| Sức chứa | **Hai tầng**: ngân sách riêng từng nhân sự · ngân sách chung = Σ ngân sách riêng **TRONG CÙNG NHÓM VAI TRÒ** |
| ⭐ Tách túi theo vai trò | **Lượng giá trừ túi Chuyên viên** · **dịch vụ lẻ + buổi liệu trình trừ túi KTV** — hai túi độc lập, không bao giờ trừ lẫn nhau |
| Khách chọn người cụ thể | Trừ **ngân sách riêng** người đó |
| Khách chọn "Bất kỳ" | Trừ **ngân sách chung** (cần ít nhất 1 người còn đủ chỗ) |
| **Số khách song song** | **Chuyên viên VLTL = 1** (lượng giá cần tập trung) · **KTV = 2** (xen kẽ khi khách nằm máy; cấu hình được) |
| Ràng buộc phòng | `song song thực tế = min(cấu hình nhân sự, suc_chua phòng đang trực)` — dùng cột `phong_lam_viec.suc_chua` đã có |
| Chọn nhân sự | **Có** — chọn người cụ thể (trừ quota riêng) hoặc "Bất kỳ" (trừ quota chung, khuyến nghị) |
| Gán nhân sự | Lúc **gọi vào khám** (mô hình kéo), **KHÔNG gán lúc check-in** — xem lý do bên dưới |
| Quyền đổi nhân sự | **Quản lý / Admin** (Lễ tân không có quyền); chỉ với ca **chưa bắt đầu** hoặc **đang thực hiện**; người nhận phải còn ngân sách và chưa đủ số bàn song song |
| Bắt buộc đăng nhập | **Có** — bỏ luồng khách vãng lai đặt online |
| Giới hạn | **3 lịch đang hoạt động cùng lúc** (không phân loại, tính TOÀN THỜI GIAN — không theo ngày; chưa `hoan_thanh`/`khong_den`/`da_huy`). Sửa 06/08/2026 — thay cho "3 lịch/ngày + 3 lịch chờ" bản đầu, chặn được kiểu spam đặt-trải-nhiều-ngày mà giới hạn theo-ngày không chặn nổi |
| Rải tải | Hiển thị mức độ đông theo khung giờ khi đặt (gợi ý, không ép) |

### Thanh toán
| Hạng mục | Quyết định |
|---|---|
| Phương thức | **Hai lựa chọn**: online (PayOS) hoặc tại quầy |
| Ưu đãi online | **Mã giảm giá tự động** khi chọn thanh toán online (kích cầu + chống spam) — xem chi tiết điều kiện lọc bên dưới |

### Mã giảm giá — bổ sung thuộc tính lọc chi tiết ⭐
**Vấn đề:** "chuyển khoản" là *phương thức*, không phải *kênh* — Lễ tân tại quầy cũng cho khách quét QR chuyển khoản, nên không thể dùng phương thức để phân biệt online với tại quầy.

**Thuộc tính cần thêm vào `khuyen_mai_voucher`:**

| Thuộc tính | Kiểu | Giá trị | Giải quyết |
|---|---|---|---|
| `tu_dong_ap_dung` | boolean | true/false | Tự áp hay khách phải nhập mã |
| **`kenh_ap_dung`** | `String[]` | `online` · `tai_quay` · `tat_ca` | ⭐ Phân biệt khách tự thanh toán web với Lễ tân thu quầy |
| **`loai_goi_ap_dung`** | `String[]` | `KHAM` · `LE` · `LIEU_TRINH` · `tat_ca` | ⭐ Chặn áp vào buổi lượng giá / dịch vụ lẻ |
| `yeu_cau_thanh_toan` | `String[]` | `tron_goi` · `tung_buoi` · `tat_ca` | **ĐÃ CÓ SẴN** — chặn hình thức từng buổi |

> ❌ **ĐÃ CẮT `goi_dich_vu_ap_dung`** (mảng UUID nhắm tới từng gói cụ thể) — `loai_goi_ap_dung` đã đủ cho mọi nhu cầu đã nêu. Bớt 1 cột + 1 ô chọn nhiều trong màn hình Admin quản lý voucher.

**Ví dụ cấu hình mã người dùng muốn:** giảm 10% · tự động · `kenh_ap_dung=[online]` · `loai_goi_ap_dung=[LIEU_TRINH]` · `yeu_cau_thanh_toan=[tron_goi]` → chỉ áp khi khách thanh toán **trọn gói liệu trình qua website**; Lễ tân tại quầy, gói khám/lẻ, và hình thức từng buổi đều không áp được.

**Logic áp dụng tự động:** lọc `dang_kich_hoat` + còn hạn + `tu_dong_ap_dung` → khớp kênh → khớp loại gói → khớp hình thức thanh toán → khớp gói cụ thể → đạt đơn tối thiểu. Nhiều mã cùng thỏa → **chọn mã giảm nhiều nhất cho khách**. Khách nhập thêm mã tay → **chỉ áp một mã**, lấy cái có lợi hơn, hiện rõ lý do.

**Hiển thị cho khách:** *"Đã tự động giảm 10% do thanh toán trọn gói qua website"* — minh bạch và nhắc khéo lợi ích kênh online.
| Thời điểm thu (tại quầy) | **Linh hoạt theo loại dịch vụ** — xem bảng dưới. Nút "Thu tiền" tồn tại độc lập với tiến trình lâm sàng, Lễ tân bấm lúc nào cũng được |
| Hình thức gói liệu trình | Chỉ còn **100%** và **từng buổi** (ẩn trả góp 50% khỏi giao diện) |
| Hóa đơn gói "từng buổi" | Tạo **1 hóa đơn 0đ** ghi nhận hợp đồng gói, sau đó **mỗi buổi một phiếu thu riêng** — bỏ khái niệm nợ treo |
| Thanh toán buổi trong gói từng-buổi | **Linh hoạt** — online / lúc check-in / sau khi làm xong |
| ❌ **Bỏ TOÀN BỘ logic giảm giá hardcode** | Xem bảng phân biệt bên dưới — **mọi ưu đãi chỉ đi qua voucher** (B13) |

### Bỏ logic hardcode trong thanh toán — phân biệt 2 loại ⚠️
| Loại | Xử lý |
|---|---|
| **Ưu đãi / giảm giá** | ✅ **Bỏ hết hardcode, CHỈ qua voucher**: miễn phí khám khi gói ≥1 triệu (`isExamWaived`) · giảm theo hình thức thanh toán (`so_tien_giam_phuong_thuc`, `ti_le_giam_gia_goi`) · công thức trả góp |
| **Quy tắc phạt / hoàn tiền** | ⚠️ **Vẫn cần** (phạt hủy gói 10%) nhưng đưa vào **tham số cấu hình tập trung**, không viết cứng rải rác trong code |

> Voucher **không thay thế được** quy tắc phạt — đó là điều khoản hợp đồng, không phải khuyến mãi. Đừng bỏ nhầm.
| Chống spam | No-show **2 lần/30 ngày → buộc thanh toán online** mới đặt được (leo thang, không cấm) |

### Thời điểm thanh toán — linh hoạt theo loại dịch vụ ⭐
| Loại | Thời điểm | Ràng buộc |
|---|---|---|
| **Buổi Lượng giá** (khám) | **BẮT BUỘC trước khi bắt đầu** | Chặn cứng: `trang_thai_thanh_toan = chưa thanh toán` → **khóa nút "Bắt đầu khám"** |
| **Dịch vụ lẻ** | **Linh hoạt**: online · lúc check-in · sau khi làm xong | Không chặn |
| **Buổi gói 100%** | Đã trả từ trước → đánh dấu **`da_thanh_toan`** ngay khi tạo lịch | — |
| **Buổi gói từng buổi** | **Linh hoạt**: online · lúc check-in · sau khi làm xong | Không chặn |
| **Mua gói liệu trình** | Tại quầy, sau khi có chỉ định | — |

**Lý do buổi Lượng giá chặn cứng — KHÔNG phải vì "lần đầu tiếp xúc":** khách cũ vẫn có thể quay lại lượng giá bất cứ lúc nào, nên lý do đó sai. Lý do thật:

> **Lượng giá là con đường DUY NHẤT đưa khách ra khỏi trung tâm.** Chuyên viên có thể bấm "Chuyển tuyến" và khách đi chụp chiếu — rời khỏi tầm kiểm soát. Nếu chưa thu tiền mà khách đi luôn không quay lại thì **mất trắng, không đòi được**.
> **Trị liệu thì ngược lại:** khách quẩn quanh trong trung tâm từ đầu tới cuối buổi, không có đường thất thoát → **không cần chặn**, thu lúc nào cũng được.

⚠️ **Hệ quả cài đặt:** chặn áp cho **MỌI buổi Lượng giá**, không chỉ buổi đầu tiên của khách. Đừng viết điều kiện kiểu "nếu là khách mới".

**Chặn mềm, không tắc hàng đợi:** khách chưa trả vẫn check-in và vào hàng đợi bình thường, nhưng hiện cảnh báo đỏ *"⚠️ Chưa thanh toán"* trong màn hình Hàng đợi để Chuyên viên báo Lễ tân thu; chỉ nút "Bắt đầu khám" bị khóa.

### CHUẨN HÓA TRẠNG THÁI — 7 + 4, ba tầng không được trộn ⭐

**Hiện trạng (đọc từ `frontend/src/components/appointmentStatusConfig.ts`):** có **HAI bảng cấu hình lệch nhau** —
- `statusConfig` (9): `chua_xac_nhan` · `cho_xac_nhan` · `da_xac_nhan` · `da_checkin` · `dang_kham` · `hoan_thanh` · `da_huy` · `khong_den` · `giu_cho`
- `getClinicalStatusConfig` (8): thiếu 2 cái trên nhưng **thêm `cho_kham`** — trạng thái **không tồn tại trong DB**, chỉ sống ở tầng giao diện

→ Hợp lại **10 chuỗi**, trong đó `chua_xac_nhan`/`cho_xac_nhan` gần như trùng nhau. Phải gộp về **một bảng cấu hình duy nhất**.

**Tầng 1 — LÂM SÀNG (`cuoc_hen.trang_thai`): đúng 7**
| # | Giá trị | Nhãn hiển thị | Ghi chú |
|---|---|---|---|
| 1 | `da_xac_nhan` | Đã xác nhận | Đặt xong vào thẳng đây (A10) |
| 2 | `da_checkin` | Đã check-in | **Chỉ Lễ tân** bấm |
| 3 | `dang_kham` | **Đang thực hiện** | Giữ tên cột, **đổi nhãn** — dùng chung lượng giá lẫn trị liệu |
| 4 | `cho_tai_luong_gia` | Chờ tái lượng giá | Mới |
| 5 | `hoan_thanh` | Hoàn thành | |
| 6 | `da_huy` | Đã hủy | `loai_huy` là **thuộc tính**, KHÔNG phải trạng thái |
| 7 | `khong_den` | Không đến | Hệ thống tự quét |

**XÓA 4 trạng thái:** `chua_xac_nhan` + `cho_xac_nhan` (A10 bỏ khái niệm chờ xác nhận) · `giu_cho` (C2 bỏ `tam_giu_cho`) · `cho_kham` (thực chất là `da_checkin` nhìn từ phía nhân sự — không cần trạng thái riêng).

**Tầng 2 — THANH TOÁN (`trang_thai_thanh_toan`): đúng 3**
`chua_thanh_toan` · `dang_cho_thanh_toan` · `da_thanh_toan`

> ❌ **ĐÃ CẮT `mien_phi`** — mọi tình huống "không phải thu tiền" đều quy về `da_thanh_toan`: buổi thuộc gói 100% (tiền **đã trả** ở cấp gói) · buổi tái lượng giá (**cùng lịch hẹn**, đã thu lần check-in đầu) · voucher giảm về 0đ (hóa đơn 0đ **đã thanh toán**). Giữ nó chỉ khiến công thức "hoàn tất" phải viết hai nhánh. **Không mất gì về báo cáo** vì doanh thu đếm từ `hoa_don`, còn cột này thuần vận hành — chỉ trả lời *"có cần thu tiền không"*.

**Tầng 3 — GIAI ĐOẠN TRONG BUỔI (`phien_lam_viec.giai_doan_hien_tai`): 3**
`dang_thuc_hien` · `dang_tren_may` · `cho_ktv`

> ⚠️ **Tầng 3 TUYỆT ĐỐI KHÔNG xuất hiện trong bộ lọc màn hình quản lý lịch hẹn** — nó chỉ sống ở bàn làm việc. Trộn vào sẽ tái tạo đúng mớ hỗn độn `cho_kham` hiện tại.

> **"Hoàn tất" KHÔNG phải trạng thái thứ 8** — tính động, một nhánh duy nhất: `hoan_thanh` **VÀ** `da_thanh_toan`.

### Tách trạng thái lâm sàng khỏi trạng thái thanh toán ⭐
Đây là điều kiện kỹ thuật để có được sự linh hoạt trên: **nút "Thu tiền" phải tồn tại độc lập với tiến trình lâm sàng**, không gắn cứng vào một mốc nào. Đồng thời gỡ được mớ logic suy luận rối trong `isAwaitingPaymentForList` / `isPaymentDue`.

```
trang_thai (giữ tên, THU HẸP ý nghĩa → chỉ còn LÂM SÀNG)
    đã xác nhận → đã check-in → đang thực hiện → hoàn thành
                                              ↘ đã hủy / không đến

trang_thai_thanh_toan (THÊM MỚI)
    chưa thanh toán → (đang chờ thanh toán) → đã thanh toán
```

> **Lịch hẹn hoàn tất = lâm sàng `hoàn thành` VÀ thanh toán `đã thanh toán`** — tính động, **KHÔNG lưu cột thứ ba** (tránh ba cột lệch nhau).

| Lâm sàng | Thanh toán | Tình huống |
|---|---|---|
| Chưa check-in | Đã trả | Thanh toán online, chưa đến |
| Chưa check-in | Chưa trả | Chọn trả tại quầy |
| Đang thực hiện | Đã trả | Bình thường — thu lúc check-in |
| Hoàn thành | Đã trả | ✅ Hoàn tất |
| **Hoàn thành** | **Chưa trả** | ⚠️ Lễ tân sơ suất → **nút "Thu tiền" hiện ngay cạnh chỉ báo** |

**Giao diện:** hai chỉ báo nằm cạnh nhau; nút thu tiền chỉ hiện khi thanh toán chưa xong — Lễ tân xử lý ngay tại danh sách, không phải mở popup tìm chức năng.

**Lợi ích:** xóa phần lớn logic suy luận thanh toán · KPI đếm tách bạch "đã làm xong" và "đã thu tiền" · bộ lọc "hoàn thành nhưng chưa thu tiền" chính xác.

### Hủy & Hoàn tiền — MÔ HÌNH 2 TRẠNG THÁI ⭐ (thay thế toàn bộ bảng nhiều nhánh cũ)

**Nguyên tắc gốc: tiền đã vào hệ thống thì không tự động đi ra.** Bảng hủy cũ có 10 nhánh vì cố phân loại theo *loại dịch vụ × thời điểm hủy × hình thức thanh toán*. Mô hình mới rút về **một câu hỏi duy nhất — lịch này đã thanh toán chưa** — mọi nhánh còn lại tự rụng. Ăn khớp trực tiếp với A10b (đã tách `trang_thai_thanh_toan` thành cột riêng): luật hủy giờ đọc đúng **một cột**, không suy luận từ hóa đơn.

| | **CHƯA thanh toán** | **ĐÃ thanh toán** |
|---|---|---|
| Khách tự hủy | ✅ Trong **60 phút** kể từ lúc đặt | ❌ **Không có nút hủy** |
| Hết cửa sổ 60 phút | ❌ Khóa hủy → không đến thì **đếm no-show** | — |
| Đổi buổi | ❌ Không cần (hủy rồi đặt lại) | ✅ **Không giới hạn số lần, nhưng CHỈ Lễ tân đổi** — khách gọi trung tâm |
| Hoàn tiền | Không có gì để hoàn | ❌ **Không hoàn** |
| Không đến | Đếm no-show | **Mất tiền** · gói trả trước thì **trừ 1 buổi** |
| Muốn hủy thật | — | Gọi phòng khám → Lễ tân xử lý tay, ghi lý do |

> 🔒 **TOÀN HỆ THỐNG CHỈ CÒN ĐÚNG MỘT ĐƯỜNG HOÀN TIỀN: hủy cả gói liệu trình trả 100%.** Không có hoàn tiền tự động, không hoàn qua cổng thanh toán, không hoàn cho bất kỳ ca đã thanh toán online nào — **chỉ cho đổi lịch**. Lễ tân/Quản lý xử lý tại quầy. Mọi thiết kế bên dưới phải tuân theo dòng này.

Khám, dịch vụ lẻ, và từng buổi trong gói đều không hoàn. Gói **từng buổi** hủy giữa chừng cũng không hoàn gì — mỗi buổi trả riêng nên buổi chưa làm là buổi chưa thu tiền, mô hình tự sạch (đây là điểm nên chủ động nói trước hội đồng). Gói **trả góp** không bán mới nữa (C8) nhưng gói cũ trong DB vẫn đi luồng hoàn tiền hiện có.

#### Sáu ràng buộc bắt buộc — không có cái nào là tùy chọn ⚠️

**1. XÓA MỀM, không xóa cứng.** Ý định ban đầu là xóa hẳn dòng `cuoc_hen` cho "sạch". Không được, vì nó **làm sập chính cơ chế chống spam đang xây**: cửa sổ 60 phút **reset mỗi lần đặt lại**, nên khách đặt→hủy→đặt lại→hủy lặp vô hạn; mỗi vòng vẫn chiếm ngân sách phút của ca trong lúc chưa hủy, mà không bản ghi nào còn lại để giới hạn 3 lịch/ngày, bộ đếm no-show, hay bằng chứng lạm dụng bám vào.
→ Dùng `trang_thai = 'da_huy'` + cờ `huy_trong_cua_so` (không phạt điểm). **Với khách, UI ẩn hẳn nó** — trải nghiệm y hệt "biến mất", vẫn phải đặt lại từ đầu đúng như thiết kế mong muốn. Thêm luật: **tối đa 3 lần hủy-trong-cửa-sổ / 7 ngày**, vượt thì mất quyền hủy sớm.

> ⚠️ **Xác nhận (06/08/2026): trần này KHÔNG bị vô hiệu bởi A12 đổi từ "3 lịch/ngày" sang "3 lịch đang hoạt động toàn thời gian".** Hai bộ đếm độc lập, khác trục: A12 chặn SỐ LƯỢNG lịch mở cùng lúc, trần này chặn TẦN SUẤT hủy-rồi-đặt-lại trong tuần. Kịch bản kiểm chứng: khách đầy 3 lịch active → hủy 1 (giải phóng đúng 1 chỗ, tính là hủy sớm lần #1) → đặt lại lấp đầy 3 → hủy tiếp (#2) → đặt lại → hủy (#3) → đặt lại → **lần hủy thứ 4 trong tuần bị chặn hủy sớm**, dù vẫn đang giữ tối đa 3 lịch. A12 mới thực ra khiến hệ thống chặt hơn tổng thể (trước đây "3/ngày" cho phép gom tới 21 lịch active cùng lúc trong 1 tuần; giờ tối đa chỉ 3 bất kể ngày) — trần hủy-sớm vẫn cần, chỉ ít khi là ràng buộc quyết định vì A12 đã chặn từ sớm hơn.

**2. Khóa hủy khi có giao dịch thanh toán đang treo — trạng thái `dang_cho_thanh_toan`.**

**Phát sinh trong đúng 3 tình huống** — điểm chung là **mọi giao dịch đi qua cổng thanh toán**, vì cổng trả kết quả bằng webhook chứ không trả ngay:
| # | Tình huống | Ai kích hoạt |
|---|---|---|
| 1 | Khách bấm "Thanh toán online" trên web → tạo link PayOS | Khách |
| 2 | **Lễ tân cho khách quét QR tại quầy** qua PayOS | Lễ tân |
| 3 | Khách **bị gắn cờ no-show** buộc trả online | Khách |

> **KHÔNG phát sinh khi** Lễ tân thu tiền mặt / quẹt thẻ POS rồi bấm xác nhận — tức thời, đi thẳng `chua_thanh_toan` → `da_thanh_toan`.

```
chua_thanh_toan
      │ bấm thanh toán, tạo link PayOS
      ▼
dang_cho_thanh_toan   🔒 KHÓA nút Hủy · KHÓA tạo giao dịch thứ hai
      │
      ├─ webhook thành công ─────────────────▶ da_thanh_toan
      ├─ webhook thất bại / khách quay lại ──▶ chua_thanh_toan
      └─ quá 15 phút không webhook ──────────▶ chua_thanh_toan (TỰ ĐẢO)
```

**Ba lớp bảo vệ, mỗi lớp chặn một loại lỗi tiền thật:**
1. **Chặn hủy giữa chừng** — xóa mềm giữ được dòng dữ liệu, nhưng hủy đúng lúc webhook đang bay sẽ ra `da_huy` + `da_thanh_toan`: khách trả tiền cho lịch đã hủy, mà hệ thống **không có đường hoàn tiền nào** ngoài hủy gói → tiền kẹt, xử lý tay.
2. **Chặn trả hai lần** — khách mở 2 tab, sinh 2 link PayOS, trả 2 lần.
3. ⭐ **Nói thật với khách** — dễ vỡ nhất khi demo: khách trả xong quay về web, webhook chưa tới, màn hình vẫn ghi *"Chưa thanh toán"* → khách hoảng và trả lại. Có trạng thái này thì hiện *"Đang xác nhận thanh toán…"*.

#### Khách quay lại từ bước thanh toán
**Lịch được tạo TRƯỚC, thanh toán là bước rời** → quay lại **không mất lịch**, nó đã tồn tại với `da_xac_nhan` + `chua_thanh_toan`.

| Quay lại lúc nào | Trạng thái | Xử lý |
|---|---|---|
| Đang chọn phương thức, **chưa sang PayOS** | vẫn `chua_thanh_toan` | Chỉ điều hướng UI, **không gọi API gì** |
| **Đã sang PayOS** rồi back / bấm Hủy trên cổng | `dang_cho_thanh_toan` → `chua_thanh_toan` | Theo quy tắc dưới |

🔴 **TUYỆT ĐỐI KHÔNG tin `cancelUrl` từ client.** Phản xạ tự nhiên là để trang `cancelUrl` gọi API báo "khách hủy" → server đảo trạng thái. **Sai, và mất tiền thật:** khách **đã trả xong** rồi bấm back của trình duyệt → trình duyệt về `cancelUrl` → client báo hủy → server đảo về chưa thanh toán → khách **trả lần thứ hai**.

```
Khách về cancelUrl
   → server GỌI NGƯỢC API tra cứu trạng thái link của PayOS (không tin client)
        ├─ PAID       → da_thanh_toan    (dù khách bấm hủy)
        ├─ CANCELLED  → chua_thanh_toan  (đảo ngay, không phải chờ 15 phút)
        └─ PENDING    → giữ dang_cho_thanh_toan, hiện "Đang xác nhận…"
```
Ba nguồn được phép đảo trạng thái, theo độ tin cậy: **webhook** → **tra cứu chủ động khi khách quay về** → **timeout 15 phút**. Client **không** nằm trong danh sách.

⚠️ **Cửa sổ hủy 60 phút tính từ `thoi_gian_tao`, KHÔNG reset** khi vào/ra thanh toán — nếu reset, khách chỉ cần bấm thanh toán rồi quay lại là gia hạn quyền hủy vô hạn, phá đúng tầng 1 chống spam.

**Quy tắc tự đảo sau 15 phút (bắt buộc):** không có nó thì webhook thất lạc khiến lịch **kẹt vĩnh viễn** — không hủy được, không thu tiền được. Kèm 2 ràng buộc:
- Webhook về **muộn sau khi đã đảo vẫn phải xử lý được** (idempotent) — đảo trạng thái tuyệt đối không được làm mất tiền đã vào
- Với **tình huống 3** (khách bị gắn cờ): hết 15 phút không trả → lịch **bị hủy mềm và TRẢ LẠI ngân sách phút**, vì với nhóm này trả tiền là điều kiện để có lịch

**3. Cửa sổ 60 phút phải là VÀ của ba vế**, không chỉ mốc thời gian: `còn trong 60 phút kể từ lúc đặt` **VÀ** `chưa check-in` **VÀ** `buổi chưa kết thúc`. Thiếu vế 2 thì khách đã vào hàng đợi vẫn hủy được; thiếu vế 3 thì lịch đặt lúc 11h40 buổi sáng còn hủy được tới 12h40 dù buổi đã đóng lúc 12h.

**4. Phòng khám hủy → ĐỔI BUỔI MIỄN PHÍ, không hoàn tiền.** Nhân sự nghỉ đột xuất, mất điện, quá tải phải trả khách về → lịch chuyển sang buổi khác, **không tính vào hạn mức đổi 1 lần** (lỗi phòng khám thì khách không được tiêu mất quyền đổi của mình). Tiền vẫn nằm nguyên trong hệ thống — **không mở đường hoàn tiền tự động nào**. Khách nhất quyết đòi tiền thì Quản lý xử lý tay ngoài hệ thống. Vẫn phân loại nguồn hủy qua `loai_huy` để thống kê và để biết không trừ hạn mức.

**5. Buổi thuộc gói KHÔNG BAO GIỜ bị xóa, kể cả trong cửa sổ 60 phút.** Gói từng buổi có hóa đơn 0đ ghi nhận hợp đồng và mỗi buổi gắn `so_thu_tu_buoi` trong phác đồ — xóa sẽ thủng số thứ tự hoặc vỡ khóa ngoại. Buổi trong gói chỉ **bỏ lịch, buổi trả về gói**.

**6. Bộ đếm no-show có cửa sổ trượt và có đường thoát:** **2 lần / 60 ngày → buộc thanh toán online**; sạch 60 ngày thì **tự gỡ cờ**. Khi đang bị gắn cờ, mọi lịch đều đã trả tiền nên không đến là mất tiền — **không đếm no-show tiếp** để tránh phạt kép (cùng nguyên tắc `resolveNoShowOutcome` đang áp cho Nhóm B).

#### Đổi buổi: KHÔNG giới hạn số lần, nhưng CHỈ Lễ tân thao tác ⭐

**Hai quyết định này buộc phải đi cùng nhau.** Nếu để khách tự đổi mà không giới hạn số lần, khách đẩy lịch đi vô hạn — tiền vẫn trong hệ thống nhưng buổi không bao giờ diễn ra. Đó là **hủy mềm trá hình**, đúng thứ vừa khóa nút Hủy để chặn. Muốn chặn lại thì phải có hạn mức → phải có cột đếm → mất luôn cái lợi của "không giới hạn". Đưa cho Lễ tân thì **con người là hạn mức**, bỏ được cơ chế đếm một cách an toàn.

| | Khách tự đổi | **Lễ tân đổi (CHỌN)** |
|---|---|---|
| Cột DB phát sinh | `so_lan_doi_buoi` + logic hạn mức | **Không cần cột nào** |
| Công sức | Dựng lại màn hình chọn buổi phía khách + chạy lại kiểm tra ngân sách phút, giới hạn 3 lịch đang hoạt động, trạng thái thanh toán → **1–1.5 ngày** | ~2 giờ (tái dùng màn hình đổi lịch của Lễ tân) |
| Rủi ro đẩy lịch vô hạn | Có, phải chặn bằng hạn mức | Không |
| Giá trị vận hành | Mất điểm chạm chăm sóc khách | **Giữ được** — Lễ tân hỏi lý do, giữ khách, gợi ý buổi vắng để rải tải |

**Cài đặt:** đổi buổi = `UPDATE` `buoi` + `ngay_gio_bat_dau/ket_thuc`, lý do ghi vào **`ghi_chu_noi_bo`** (cột **đã có sẵn** trên `cuoc_hen`). Hệ thống **không có bảng lịch sử trạng thái** — `StatusHistoryModal` dựng từ các cột mốc thời gian sẵn có (`thoi_gian_tao`/`thoi_gian_huy`/`thoi_gian_hoan_thanh`/`thoi_gian_khong_den`), nên không phát sinh gì thêm.

> ⚠️ **Xung đột Lễ tân đổi buổi vs Nhân sự gọi vào cùng lúc (bổ sung 06/08/2026) — 3 lớp chặn:**
> 1. **Chặn ở nguồn:** "Đổi buổi" chỉ hợp lệ khi `trang_thai ∈ {da_xac_nhan, da_checkin}`. Không cho đổi khi `dang_kham` (đang trong phòng — đổi lúc này vô nghĩa) hay các trạng thái kết thúc.
> 2. **Đổi buổi cho ca ĐÃ check-in phải đưa khách RA KHỎI hàng đợi trong cùng 1 thao tác:** cùng lệnh `UPDATE` đổi `buoi`/ngày, đồng thời đưa `trang_thai` về lại `da_xac_nhan` — Lễ tân chỉ bấm 1 lần, không cần nhớ thêm bước "gỡ khỏi hàng đợi" riêng. Màn hình hàng đợi của nhân sự (tự làm mới định kỳ) sẽ không còn thấy khách đó ngay sau khi lưu.
> 3. **Khoảng hở cuối cùng (vài giây trước khi màn hình nhân sự tự làm mới) — chặn ở tầng dữ liệu bằng khóa lạc quan:** hành động "Gọi vào"/"Bắt đầu khám" phải kiểm tra đúng `trang_thai` NGAY trong câu lệnh cập nhật (`UPDATE ... WHERE id = X AND trang_thai = 'da_checkin'`), không tin dữ liệu nhân sự đang xem trên màn hình (có thể đã cũ vài giây). Ai lưu xuống DB trước thắng; người bấm sau bị từ chối rõ ràng — *"Lịch này vừa được đổi sang buổi khác, không còn trong hàng đợi hôm nay"* — thay vì âm thầm tạo dữ liệu sai.

**Chống UX cứng — bắt buộc có, chi phí ~0:** màn hình lịch của khách vẫn hiện nút **"Yêu cầu đổi lịch"**, nhưng nó chỉ mở hộp thoại hiện hotline + thông tin lịch, **không tự đổi gì**. Nếu không có nút này, khách đã trả tiền sẽ nhìn màn hình không có gì để bấm — hội đồng chê ngay.

> 💬 **Trả lời hội đồng nếu bị hỏi "sao không cho khách tự đổi":** *"Lịch đã thanh toán thì mọi thay đổi đều qua Lễ tân, vừa đảm bảo không thất thoát vừa là điểm chạm chăm sóc khách hàng — em cố ý không tự động hóa phần này."*

#### Đánh dấu không đến
**Hệ thống tự quét sau khi hết buổi 30 phút** (12h30 và 20h00 — buffer cho khách đến sát giờ), quét lười khi có request. Lễ tân/Admin không còn nút bấm tay (C9).

#### Thang chống spam cho lịch CHƯA thanh toán — 4 tầng ⭐

> **Cửa sổ 60 phút KHÔNG phải "quyền được hủy" — nó là ô sửa sai cho người bấm nhầm.** Hiểu đúng ý đồ này thì mọi ràng buộc bên dưới tự hợp lý.

```
Khách đặt lịch, chọn trả tại quầy  →  đã xác nhận + CHƯA THANH TOÁN
   │
   ├─ TẦNG 0 · chặn ngay lúc đặt
   │     tối đa 3 lịch ĐANG HOẠT ĐỘNG cùng lúc (toàn thời gian, không theo ngày)
   │     → chặn theo SỐ LƯỢNG, khách không ôm được 20 chỗ
   │
   ├─ TẦNG 1 · cửa sổ 60 phút — ô sửa sai
   │     có nút Hủy · hủy = xóa mềm, KHÔNG phạt gì
   │     ⚠️ trần 3 lần hủy sớm / 7 ngày
   │     → thiếu trần này thì đặt→hủy→đặt lại reset đồng hồ VÔ HẠN
   │
   ├─ sau 60 phút → NÚT HỦY BIẾN MẤT, khách dính với lịch đó
   │
   ├─ Đến ngày hẹn
   │     ├─ có check-in → bình thường
   │     └─ KHÔNG đến → tự quét cuối buổi → TẦNG 2 · +1 no-show
   │
   ├─ TẦNG 3 · đủ 2 no-show trong 60 ngày
   │     → gắn cờ BUỘC THANH TOÁN ONLINE
   │     → không trả tiền = không có lịch; trả rồi mà không đến = MẤT TIỀN
   │
   └─ TẦNG 4 · đường thoát
         sạch 60 ngày không no-show → tự gỡ cờ
```

**Vì sao bắt buộc phải có tầng 3:** ba tầng đầu chỉ *làm chậm*, không chặn — khách quyết tâm phá vẫn đặt đủ 3 lịch rồi không đến, xong lại lặp lại sau khi 1 lịch bị đánh dấu không đến (giải phóng chỗ). Chỉ tầng 3 đổi được bản chất trò chơi: spam từ **miễn phí** thành **tốn tiền thật**.

**Thiệt hại thật của một lịch không đến chưa thanh toán** (câu hội đồng hay hỏi ngược): nó **đã tiêu ngân sách phút của ca** suốt thời gian tồn tại → khách khác muốn đặt buổi đó bị báo hết chỗ. Mất doanh thu thật dù không mất tiền mặt nào.

> ❌ **Cố ý KHÔNG bịt:** khách tạo tài khoản mới để né cờ. Hệ thống đã bắt buộc email xác thực OTP nên mỗi lần né phải có email mới + qua OTP — với quy mô 20–40 lịch/ngày, ma sát đó là đủ. Chống sâu hơn (đối chiếu SĐT/thiết bị) không tương xứng chi phí.

### Tỉ lệ phạt hủy gói — cấu hình + snapshot, KHÔNG làm kiểu voucher ⭐

> 🔴 **Phát hiện khi khảo sát code:** tỉ lệ phạt hiện **không hardcode** như vẫn tưởng — `packageRefundSchema` (`backend/src/schemas/finance.schema.ts:17-23`) nhận `phi_phat` là **số tự do Admin gõ tay lúc hủy**, chỉ validate `>= 0`. Không trần, không mặc định, không đối chiếu chính sách nào. Con số 10% chỉ tồn tại trong tài liệu; code cho phép gõ 0% hoặc 500%. Đây là **lỗ hổng kiểm soát nội bộ**, phải bịt.

Voucher và tỉ lệ phạt là hai loại vật khác nhau — đừng dùng chung cơ chế:

| | Voucher | Tỉ lệ phạt hủy |
|---|---|---|
| Bản chất | Khuyến mãi (marketing) | **Điều khoản hợp đồng** |
| Tần suất đổi | Liên tục, nhiều chiến dịch song song | Hiếm, một giá trị toàn hệ thống |
| Cần điều kiện lọc? | Có (kênh, loại gói, hình thức) | Không |
| Yêu cầu cốt lõi | Chọn mã có lợi nhất cho khách | **Không được hồi tố** |

Xây bảng + CRUD + điều kiện lọc cho một con số duy nhất là thừa. Nhưng yêu cầu **không hồi tố** thì bắt buộc: Admin đổi 10% → 15% thì gói **đã bán trước đó vẫn phải chịu 10%**, vì đó là điều khoản khách đã đồng ý lúc ký. Đọc config tại thời điểm hủy = áp điều khoản mới lên hợp đồng cũ, sai về pháp lý.

**Cách làm (~2 giờ):**
1. Một tham số trong cấu hình hệ thống: `ti_le_phat_huy_goi = 10`
2. Thêm **1 cột** `hoa_don.ti_le_phat_huy_goi` — **snapshot tại thời điểm bán gói**
3. Lúc hủy đọc từ **hóa đơn**, không đọc config. Bỏ ô Admin gõ tay → chuyển thành hiển thị chỉ đọc kèm nguồn số.

> 💬 **Trả lời hội đồng:** *"Đổi chính sách thì sao?"* → có cấu hình. *"Khách ký 10% mà bị thu 15% thì sao?"* → có snapshot theo hợp đồng.

#### ⚠️ Xung đột phải sửa cùng lúc: `ti_le_giam_gia_goi`
C11 đánh dấu **ngừng dùng** `hoa_don.ti_le_giam_gia_goi`, nhưng cột đó đang là **đầu vào của công thức hoàn tiền** — `calculatePackageCancellationRefund` lấy `tiLeGiam` để dựng `giaThanhToanGoi`, rồi phạt % trên số đó. Gói mới bán qua voucher sẽ có `ti_le_giam_gia_goi = 0` → hệ thống coi giá chốt **bằng giá gốc chưa giảm** → khách bị phạt và bị trừ chi phí buổi đã dùng **cao hơn số họ thật sự đã trả**.
→ Sửa `calculatePackageCancellationRefund` lấy thẳng **`hoa_don.tong_tien_phai_tra`** (số net khách thật sự phải trả, đã trừ voucher) làm `giaThanhToanGoi`, bỏ hẳn bước tái tính từ `tongTienGoc × tiLeGiam`. Tự động đúng với mọi loại voucher, kể cả voucher giảm số tiền cố định (kiểu % không biểu diễn được chính xác).
> Cột `phi_kham_ap_dung` thì bỏ được an toàn: buổi Lượng giá giờ **luôn thu trước và thu riêng** → `hasPaidSeparateExam` luôn đúng → `examFeeToCharge` luôn = 0.

### Nhắc hẹn trong mô hình theo buổi 📧
Công thức cũ "gửi trước N tiếng" là di sản của mô hình đặt giờ — áp vào buổi sáng (7h30) sẽ ra **3h30 sáng**, vô lý. Nguyên tắc mới: **gửi vào thời điểm khách đọc được**, không theo công thức.

| Buổi | Gửi nhắc lúc | Lý do |
|---|---|---|
| **Sáng** (7h30–12h) | **19h00 tối hôm trước** | Sáng sớm khách đang ngủ / vội đi làm |
| **Chiều** (12h–19h30) | **08h00 sáng cùng ngày** | Khách đã dậy, đọc trước khi vào ngày làm việc |

**Nội dung email đổi trọng tâm** — không còn giờ cụ thể để nhắc, chuyển sang giúp khách chọn lúc đến:
- Buổi nào + khung giờ nhận khách
- Dịch vụ, buổi thứ mấy, chuyên viên (nếu đã chọn)
- ⭐ **Gợi ý khung giờ vắng, ít phải chờ** — vừa có ích cho khách, vừa **giúp trung tâm rải tải**; chỉ làm được nhờ mô hình theo buổi
- Cảnh báo nếu **chưa thanh toán**
- Nút đổi lịch / hủy lịch

**Lễ tân gọi điện — KHÔNG số hóa, để thủ công (quyết định cắt phạm vi có chủ đích):**

Thực tế Lễ tân gọi nhắc toàn bộ khách có lịch hôm sau, không phân biệt đã thanh toán hay chưa. Nhưng việc **theo dõi đã gọi ai** thì **không số hóa** vì:

| Tiêu chí | Đánh giá |
|---|---|
| Hội đồng có chê không? | **Không** — không nằm trong 3 điểm bị đánh gãy |
| Quy mô có cần không? | **Không** — 20–40 lịch/ngày, 1–2 Lễ tân giao ca trực tiếp, ghi giấy vẫn hiệu quả |
| Chi phí nếu làm | 1 bảng + 1 màn hình + logic ≈ **1–1.5 ngày** |
| Rủi ro | Thêm màn hình có thể lỗi khi demo, thêm dữ liệu mẫu phải chuẩn bị |

→ Lễ tân dùng **màn hình quản lý lịch hẹn đã có sẵn**, lọc theo ngày mai để lấy danh sách cần gọi. Không thêm bảng, không thêm màn hình.

> 💬 **Trả lời hội đồng nếu bị hỏi "làm sao biết đã gọi ai chưa":** *"Với quy mô 20–40 lịch/ngày và 1–2 lễ tân giao ca trực tiếp, theo dõi thủ công vẫn hiệu quả và linh hoạt hơn. Số hóa phần này chỉ có giá trị khi mở rộng nhiều chi nhánh hoặc lượng khách lớn hơn — em đã đưa vào hướng phát triển."* → cho thấy **đã cân nhắc và chủ động loại trừ**, không phải bỏ sót.

**Email nhắc tự động thì GIỮ** — khác với gọi điện, nó không tốn công vận hành (chạy tự động), hệ thống đã có sẵn bộ gửi mail, và thể hiện được chăm sóc khách hàng tự động khi demo. Chi phí thấp, giá trị cao.

> 💬 **Trả lời hội đồng:** *"Đặt lịch theo buổi nên nhắc hẹn chuyển từ nhắc-theo-giờ sang nhắc-theo-buổi, gửi vào giờ khách đọc được, kèm gợi ý khung giờ vắng để giảm ùn tắc."*

### Phân biệt rõ hai tình huống "không đến" ⚠️
Hai kịch bản khác hẳn nhau, đừng gộp:

| | **A. Khách không bao giờ đến** | **B. Khách check-in rồi biến mất** |
|---|---|---|
| Có check-in? | ❌ Không | ✅ Có |
| Có trong hàng đợi? | ❌ **Không** — Chuyên viên/KTV không nhìn thấy | ✅ Có |
| Ai xử lý? | **Không ai** — hệ thống tự quét cuối buổi | **Chuyên viên/KTV** bấm "Gọi không có mặt" |
| Kết quả | `không đến` | Lần 1 đẩy cuối hàng đợi · lần 2 → `không đến` |

> **Nút "Gọi không có mặt" chỉ tồn tại cho khách ĐÃ ở trong hàng đợi.** Không có chuyện gọi người chưa check-in.

> ⚠️ **Làm rõ cơ chế kích hoạt (bổ sung 06/08/2026) — KHÔNG tự động trên lần "Gọi vào" thứ 2.** "Gọi vào" (mời khách vào phòng) và "Không có mặt" (báo khách không xuất hiện) là **2 nút riêng biệt**; "Không có mặt" luôn do nhân sự **tự bấm** sau khi quan sát thực tế (gọi tên, chờ, không thấy) — không có timer tự động, vì chỉ người đứng đó mới biết khách có mặt hay không (có thể đang toilet, nghe điện thoại ngoài sảnh...).
>
> **Cơ sở để nhân sự biết đang ở lần gọi thứ mấy — đọc từ `phien_lam_viec.so_lan_goi_khong_co_mat` (cột đã có sẵn trong kế hoạch, xem mục Thay đổi CSDL):** thẻ khách trong hàng đợi phải hiện rõ số lần đã gọi hụt, ví dụ badge *"⚠️ Đã gọi 1 lần — bấm lần nữa sẽ chuyển Không đến"* khi count = 1, để nhân sự không phải nhớ nhẩm. Bấm "Không có mặt" lần đầu (count 0→1): chỉ tăng cột này + đẩy khách xuống cuối hàng đợi, `trang_thai` giữ nguyên `da_checkin`, không có popup xác nhận (thao tác nhẹ, thường xuyên). Bấm lần 2 (count 1→2): **bắt buộc popup xác nhận** — *"Xác nhận đánh dấu KHÔNG ĐẾN — khách sẽ mất tiền (nếu đã thanh toán) và bị cộng 1 lần no-show. Tiếp tục?"* — vì đây là hành động khó đảo ngược, cần 1 bước chặn tay nhỡ giống các popup xác nhận khác đã dùng ở A17a.

**Ai check-in:** **CHỈ Lễ tân.** Chuyên viên/KTV chỉ *nhìn thấy* trạng thái đã check-in qua hàng đợi — không có quyền check-in và cũng không biết khách đến lúc nào.

**Khách đến khi quỹ thời gian không còn đủ — xem mục riêng "Khả năng phục vụ tại thời điểm đến" bên dưới.** Nhóm tình huống lớn, không gói gọn trong một dòng cảnh báo.
| Trạng thái kết thúc bất thường | Gọn còn **2 loại**: `đã hủy` và `không đến` |

### Luồng lượng giá & tái khám
| Hạng mục | Quyết định |
|---|---|
| Nội dung buổi lượng giá | ROM (tầm vận động) · MMT (cơ lực 0–5) · VAS · **sàng lọc dấu hiệu cảnh báo** · kết luận · mục tiêu |
| Khi nghi ngờ bệnh lý | **Chuyển tuyến** ra cơ sở chẩn đoán hình ảnh bên ngoài, xuất phiếu |
| ⭐ **Tái khám = CÙNG một lịch hẹn** | **KHÔNG tạo lịch mới.** Lịch chuyển sang trạng thái `chờ tái khám`, khách quay lại thì **check-in lần 2** trên chính lịch đó → bỏ được cột `lich_hen_goc_id` và toàn bộ logic sinh phiếu hẹn mới |
| Giải phóng chuyên viên | **Ngay khi bấm "Chờ tái khám"** — nhận khách mới luôn, không chờ khách quay lại |
| Hạn quay lại | **Chuyên viên tự đặt** số ngày; quá hạn → khách phải đặt **lịch khám mới có thu phí** |
| Khách quay lại | Lễ tân mở đúng lịch đó (trạng thái `chờ tái khám`) → nút **"Check-in ngay"** |
| Ưu tiên khi quay lại | Lên **đầu hàng đợi của chuyên viên cũ**, nhưng **vẫn phải chờ** nếu người đó đang bận |
| Chỉ định gói | Cho phép **cả ở buổi 1** (ca đơn giản) **lẫn buổi bổ sung** (ca cần chụp chiếu) |
| Tách 2 nút | **"Gọi vào khám"** (báo Lễ tân mời khách) → **"Bắt đầu khám"** (đồng hồ mới chạy) |
| Gói chỉ định → thanh toán | Ca khám hoàn thành mà **có chỉ định gói** → chi tiết lịch hẹn hiện khối *"Gói đã chỉ định"* + nút **"Thanh toán gói này"** → sang màn hình thanh toán (100% / từng buổi, áp voucher) |

### Luồng khám (lượng giá) đầy đủ ⭐
```
Check-in → THANH TOÁN NGAY (bắt buộc) → Gọi vào → Bắt đầu lượng giá
    │
    │   ĐÚNG 2 NÚT KẾT THÚC (đặc tả đầy đủ ở A17a)
    │
    ├─ ① HOÀN THÀNH LƯỢNG GIÁ   → CÓ validation → popup xác nhận
    │      │
    │      ├─ tab Chỉ định: chọn GÓI          → HOÀN THÀNH (có chỉ định)
    │      │
    │      └─ tab Chỉ định: "KHÔNG chỉ định"  → HOÀN THÀNH (vượt khả năng
    │             ghi lý do vào kết luận         trung tâm · KHÔNG hoàn tiền)
    │             ↑ nhánh này KHÔNG có nút riêng, KHÔNG in phiếu
    │
    └─ ② CHUYỂN TUYẾN  → KHÔNG validation gì
           → popup nhỏ: nhập HẠN QUAY LẠI · [Xác nhận] / [Hủy]
           → trạng thái "Chờ tái lượng giá" · ⚡ GIẢI PHÓNG SLOT NGAY
           │
           ├─ Khách quay lại → Lễ tân mở đúng lịch đó → "Check-in ngay"
           │     → hàng đợi ƯU TIÊN ĐẦU với chuyên viên cũ
           │     → mở lại CHÍNH bàn lượng giá cũ: nhìn phim khách mang tới,
           │       nhập nốt ROM/chẩn đoán/chống chỉ định → bấm nút ①
           │
           └─ QUÁ HẠN không quay lại → ca TỰ HOÀN THÀNH, không ai phải nhập gì

Sau HOÀN THÀNH, nếu CÓ chỉ định gói:
   Chi tiết lịch hẹn hiện khối "Gói đã chỉ định" → Lễ tân bấm "Thanh toán gói này"
```

**Nhánh [C] — chi tiết:** xảy ra ở **cả hai thời điểm** — ngay lần khám đầu (dấu hiệu cảnh báo quá rõ) hoặc sau tái khám xem phim thấy nặng. **Không hoàn tiền khám** là đúng: chuyên viên đã lượng giá, phát hiện vấn đề và đưa khuyến cáo kịp thời — đó là giá trị thật khách nhận được. Nhánh này là **điểm ăn điểm trước hội đồng** vì thể hiện rõ ranh giới thẩm quyền: trung tâm biết cái gì mình KHÔNG được làm.

**Ảnh đính kèm — chuyên viên CHỈ XEM, không upload:**
Khách đã gửi ảnh lúc đặt lịch (ảnh bầm tím, hoặc phim X-quang/MRI có sẵn) → bàn lượng giá chỉ có **khung xem ảnh**, **không có chức năng upload**. Trường hợp khách đi chụp về sau chuyển tuyến: khách **mang phim giấy đến**, chuyên viên **xem trực tiếp bằng mắt** rồi nhập kết luận bằng chữ vào **`chan_doan`** (cột `ket_qua_can_lam_sang` **đã cắt** — chỉ lưu vào một cột chẩn đoán duy nhất). **Không số hóa phim.** → Bớt hẳn một mảng xử lý file, đúng tinh thần "không xây module cận lâm sàng".

**Đánh giá bất tiện:** khách phải quay lại 2 lần — **không tránh được**, đây là thực tế y tế. Rủi ro thật nằm ở chỗ khách **không biết hạn quay lại** rồi đến muộn, phải trả tiền lại → **bắt buộc hiển thị hạn rõ ràng** ở 3 nơi: chi tiết lịch hẹn, email nhắc, và Lễ tân nhắc miệng khi khách rời đi.
| Khách biến mất | Nút **"Gọi không có mặt"**: lần 1 đẩy xuống cuối hàng đợi, lần 2 kết thúc lượt |
| **Số bàn mở đồng thời** | Chuyên viên VLTL: **1 bàn** (giữ ràng buộc hiện có) · KTV: **tối đa 2 bàn** (nới `getActiveSessionForStaff`) |

### Vì sao KHÔNG gán nhân sự lúc check-in ⚠️
Gán theo "người ít ca nhất tại thời điểm check-in" nghe hợp lý nhưng sai: **ít ca nhất ≠ rảnh sớm nhất**. Nếu gán khách cho KTV Dương lúc 9h, rồi Dương nhận ngay ca 120 phút trong khi KTV Minh Anh xong ca lúc 9h15 → khách bị "khóa" vào Dương, chờ 2 tiếng dù có người rảnh ngay cạnh. Đây chính là bản chất của mô hình cũ đang muốn thoát ra.

**Cách đúng:** khách không chọn ai → vào **hàng đợi chung**, `nhan_su_id` để trống. Ai xong ca trước thì bấm "Gọi vào", hệ thống gán ngay lúc đó (mô hình **kéo**). Người rảnh thật mới kéo → luôn tối ưu.

**Cân bằng tải:** xảy ra tự nhiên (ai rảnh nhiều thì gọi nhiều). Để minh bạch, màn hình hàng đợi hiển thị **số ca đã làm hôm nay của từng nhân sự**.

**Rủi ro "không ai muốn gọi khách" — giải bằng cách phân biệt HAI LOẠI RẢNH ⭐**

Gộp chung "rảnh" làm một là sai. Phải tách:

| Trạng thái KTV | Ai quyết định | Lý do |
|---|---|---|
| **Đang thực hiện** (hands-on) | — bận, không gán | |
| **Rảnh tạm** (khách đang nằm máy) | **KTV tự quyết** — muốn kéo thêm thì chủ động, hệ thống **không ép** | Họ còn phải quay lại khách trên máy |
| **Rảnh hoàn toàn** (vừa xong ca, không còn khách nào) | ⭐ **HỆ THỐNG TỰ GÁN** | Logic dây chuyền: xong việc thì việc tiếp theo tự đến |

**Thứ tự ưu tiên khi tự gán:**
1. Khách đã **chọn đích danh** KTV đó — ưu tiên tuyệt đối, họ chờ đúng người này
2. Không có → khách **chờ lâu nhất** trong hàng đợi chung

**Gán nhưng KHÔNG tự gọi:**
```
✅ Đã xong ca với Trần Văn A
⭐ KHÁCH TIẾP THEO CỦA BẠN
   #12  Lê Thị B · Chờ 8 phút · Trị liệu vai gáy      [ GỌI VÀO ]
```
KTV vừa xong cần vài phút dọn giường, rửa tay, chuẩn bị. Nhưng khách **đã được giữ chỗ** — người khác không lấy mất, và KTV không phải tự tìm trong hàng đợi. Nếu **không bấm trong 5 phút** → khách trả về hàng đợi chung, tránh kẹt.

> ❌ **Đã bỏ cơ chế "cảnh báo leo thang khi chờ > 15 phút"** — vì nếu **tất cả nhân sự đều đang bận** thì cảnh báo chỉ gây nhiễu, không ai xử lý được. Thay bằng tự gán ở trên.

**Cảnh báo chờ lâu — giữ nhưng đổi mục đích:** không để thúc nhân sự (hệ thống đã tự gán), mà để **Lễ tân biết mà giải thích với khách**: *"Khách #12 đã chờ 25 phút — tất cả nhân sự đang bận"*. Là thông tin chăm sóc khách hàng, không phải yêu cầu hành động.

**"Mô hình kéo có thêm bước cho nhân sự không?"** — Không. `Đẩy: hệ thống gán → bấm "Bắt đầu"` vs `Kéo: bấm "Gọi vào" → bấm "Bắt đầu"`, chênh đúng một nút. Mà **dù mô hình nào cũng phải có người gọi khách từ sảnh vào phòng** — việc đó không tự động hóa được. Mô hình kéo chỉ tận dụng thao tác đó để gán nhân sự luôn, thay vì gán sớm rồi có thể sai.

**Khách biết làm với ai / phòng nào:**
| | Lúc check-in | Khi được gọi |
|---|---|---|
| Đã chọn nhân sự | **Biết cả tên và phòng ngay từ lúc đặt lịch** (ca trực đã gắn sẵn phòng — dùng `lich_truc_nhan_su.phong_id`, không cần thêm dữ liệu) | Xác nhận lại |
| Chọn "Bất kỳ" | Số thứ tự + buổi + dịch vụ; chưa biết phòng | Hiện rõ *"Mời Nguyễn Văn A vào Phòng Trị liệu 01 — KTV Lê Văn Dương"* |

Trường hợp thứ hai đúng cách bệnh viện vận hành (lấy số, chờ gọi tên kèm số phòng) — quen thuộc với khách Việt Nam.

### BA lớp kiểm soát sức chứa (bổ trợ nhau)
| Lớp | Kiểm soát lúc | Tác dụng |
|---|---|---|
| **Ngân sách phút của ca** | Khi **đặt lịch** | Tổng khối lượng công việc cả ca không vượt năng lực |
| ⭐ **Khả năng phục vụ tại thời điểm đến** | Khi **check-in** | Khách NÀY, đến GIỜ NÀY, có làm xong trước khi nhân sự tan ca / trung tâm đóng cửa không |
| **Giới hạn bàn song song** | Khi **gọi khách vào** | Kiểm soát tức thời — đủ 2 bàn thì phải hoàn thành 1 mới gọi tiếp |

> Khách đến đông cùng lúc vẫn check-in bình thường, chỉ chờ trong hàng đợi lâu hơn — hệ thống không vỡ.

### Ví dụ tính ngân sách phút — tài liệu tham chiếu lúc code ⭐

**Bối cảnh:** buổi sáng nhận khách 7h30–12h00 = **270 phút**.

> 🔴 **NGÂN SÁCH TÁCH THEO NHÓM VAI TRÒ — không phải một túi chung cho cả ca.**
> | Loại buổi | Ai làm | Trừ vào túi |
> |---|---|---|
> | **Buổi Lượng giá** | Chuyên viên VLTL | **Túi Chuyên viên** |
> | **Dịch vụ lẻ** | KTV | **Túi KTV** |
> | **Buổi gói liệu trình** | KTV | **Túi KTV** (dùng chung với dịch vụ lẻ) |
>
> Lượng giá **KHÔNG BAO GIỜ** trừ chung với lẻ/liệu trình. Hết chỗ lượng giá không có nghĩa hết chỗ trị liệu và ngược lại. Mọi con số dưới đây là **trong phạm vi MỘT nhóm vai trò**.
> Hệ quả kiểm tra hai tầng: điều kiện ② phải tìm nhân sự **đúng vai trò**, không phải bất kỳ ai còn rảnh.

**⚠️ Bẫy 1 — công thức có HAI hệ số nhân:**
| Vai trò | Song song | Ngân sách riêng | 2 người → chung |
|---|---|---|---|
| Chuyên viên VLTL | 1 | 270 | **540 phút** |
| KTV (mặc định an toàn) | 1 | 270 | **540 phút** |
| KTV (bật song song) | 2 | 540 | **1.080 phút** |

**⚠️ Bẫy 2 — hai nhân sự KHÔNG đóng góp bằng nhau:**
| Ca trực | Giao với buổi sáng | Đóng góp |
|---|---|---|
| 7h–16h | 7h30 → 12h00 | **270 phút** |
| 11h–20h | 11h00 → 12h00 | **chỉ 60 phút** |

→ 2 nhân sự **mỗi người một ca** thì buổi sáng chỉ có **330 phút**, không phải 540. Chỉ khi **cả hai cùng ca 7h–16h** mới ra 540. Kiểm tra kỹ khi seed lịch trực cho demo.

**Không có "số ca tối đa" cố định** — với 540 phút chung: toàn 30' → **18 ca** · toàn 60' → **9 ca** · toàn 90' → **6 ca** · toàn 120' → **4 ca** (dư 60 phút kẹt).

**Quy tắc chặn — KHÔNG đếm số ca:**
```
CHẶN ⟺ thoi_luong_phut của dịch vụ khách chọn > số phút còn lại
```
Cùng còn 60 phút: khách đặt 30' ✅ · khách đặt 90' ❌. → Màn hình đặt lịch phải báo **"Buổi sáng còn 60 phút — chỉ nhận dịch vụ từ 60 phút trở xuống"**, KHÔNG báo "hết chỗ" chung chung (B9).

**⚠️ Bẫy 3 — khách chọn "Bất kỳ" phải kiểm tra ĐỦ HAI điều kiện:**
```
① Σ đã dùng + thời lượng mới  ≤  ngân sách CHUNG
② TỒN TẠI ít nhất 1 nhân sự còn đủ chỗ trong ngân sách RIÊNG
```
> **Ví dụ chứng minh vì sao cần ②:** A bị đặt đích danh 250 phút, B cũng 250 → chung dùng 500, **còn 40**. Khách đặt dịch vụ **30 phút** chọn "Bất kỳ": ① 530 ≤ 540 **qua**, nhưng A còn 20 và B còn 20 → **không ai đủ 30** → **phải CHẶN**. Chỉ kiểm tra ① thì hệ thống nhận ca mà tới nơi không ai làm được.

> ⚠️ **`goi_dich_vu.thoi_luong_phut` là MỐC KẾ HOẠCH, không phải giới hạn cứng.** Nó dùng để tính ngân sách phút, dự báo hàng đợi và giờ đến muộn nhất — **tuyệt đối không thêm ràng buộc nào chặn nhân sự làm quá thời lượng đó**. Ca chạy dài hơn dự kiến là bình thường; hệ thống chỉ việc đẩy dự báo phía sau theo thời gian thực (B23).

### DANH SÁCH ĐẦY ĐỦ điều kiện chặn đặt lịch ⭐ (gom từ 6 chỗ rải rác)

**Chặn CỨNG — không cho đặt:**

| # | Điều kiện | Kiểm ở bước nào | Thông báo |
|---|---|---|---|
| 1 | Chưa đăng nhập | Vào trang | Bắt đăng nhập (đã bỏ khách vãng lai) |
| 2 | **Hết ngân sách phút của túi vai trò** | Chọn buổi | ⭐ *"Buổi sáng còn 60 phút — chỉ nhận dịch vụ ≤60 phút"*, **CẤM** báo "hết chỗ" chung chung |
| 3 | Chọn **"Bất kỳ"** mà không ai **cùng vai trò** còn đủ chỗ riêng | Chọn buổi | Bẫy hai tầng — chung còn nhưng riêng không ai đủ |
| 4 | Đã có **3 lịch đang hoạt động** (toàn thời gian, không theo ngày — sửa 06/08/2026, gộp 2 luật cũ "3/ngày" + "3 đang chờ" làm một) | Vào trang | *"Bạn đang có tối đa 3 lịch chưa hoàn thành/chưa hủy — cần hoàn thành hoặc hủy bớt trước khi đặt thêm"* |
| 5 | **Buổi đã qua** (đặt cho hôm nay, sau 12h với buổi sáng) | Chọn buổi | Buổi xám đi |
| 6 | ⭐ **Quá giờ đến muộn nhất CỦA CHÍNH DỊCH VỤ ĐÓ** | Chọn buổi, chỉ với hôm nay | Dịch vụ 120' chặn từ 17h50; dịch vụ 30' tới 19h30 vẫn đặt được |
| 7 | Nhân sự **không trực buổi đó** | Chọn nhân sự | Không hiện trong danh sách |
| 8 | **Buổi M-1 chưa hoàn thành** (gói liệu trình) | Đặt buổi tiếp | Quy tắc đặt lịch tuần tự đã có |
| 9 | Gói **hết buổi / hết hạn sử dụng** | Đặt buổi tiếp | — |
| 10 | Gói **từng buổi: chưa trả tiền buổi hiện tại** | Đặt buổi tiếp | `getMinPaymentRequired()` |
| 11 | ⭐ **Đang có lịch treo `cho_tai_luong_gia`** mà đặt buổi Lượng giá mới | Chọn dịch vụ | *"Bạn đang có lịch chờ tái lượng giá đến 20/08 — vui lòng quay lại dùng lịch đó, không cần đặt mới"* — tránh khách trả tiền 2 lần cho cùng một việc |

**Chặn MỀM — vẫn đặt được nhưng có ràng buộc:**

| Điều kiện | Hệ quả |
|---|---|
| Bị gắn cờ no-show (2 lần/60 ngày) | Vẫn đặt được nhưng **bắt buộc thanh toán online** mới xác nhận |
| Buổi đông | Chỉ hiện mức độ đông để gợi ý rải tải (B9), **không chặn** |
| Chưa thanh toán | **Không** chặn đặt lịch |

**⭐ KHÁCH ĐƯỢC ĐẶT NHIỀU LỊCH TRONG CÙNG MỘT BUỔI** (đã chốt):
`checkCustomerOverlap` **mất ý nghĩa** trong mô hình theo buổi (không còn giờ để so trùng) → **bỏ hẳn**, không thay bằng kiểm tra trùng buổi. Giới hạn **3 lịch đang hoạt động** (toàn thời gian) là ràng buộc duy nhất. Lý do: lượng giá xong làm trị liệu luôn trong cùng buổi sáng là kịch bản thật và hợp lý; hàng đợi tự xếp tuần tự nên không có xung đột.
> ⚠️ Nhưng **vẫn giữ `checkCustomerHasClinicalExamOnDate`** (tối đa 1 buổi Lượng giá/ngày) — đặt 2 buổi lượng giá trong một ngày là vô nghĩa về nghiệp vụ.

### Lớp 2 — Khả năng phục vụ tại thời điểm đến ⭐

> ⚠️ **BỎ HẲN từ "check-in muộn" khỏi toàn hệ thống.** Đó là từ vựng của mô hình cũ, chỉ có nghĩa khi biết trước giờ hẹn 8h để so sánh. Ở mô hình theo buổi **không tồn tại khái niệm "muộn"** — khách đến lúc nào cũng đúng. Câu hỏi duy nhất là **"còn kịp làm xong không"**, và đó là câu hỏi về *quỹ thời gian còn lại của trung tâm*, không phải về *hành vi của khách*. Nhãn UI phải nói "Không đủ thời gian phục vụ", tuyệt đối không nói "Khách đến muộn".

**Vì sao bắt buộc phải có lớp này.** Ngân sách phút nói *"cả ca gánh được 240 phút việc"* — nó **không** nói *"khách đến lúc 19h35 thì làm kịp"*. Đây là cái giá phải trả khi bỏ chọn giờ cụ thể, và phải trả ở quầy check-in chứ không lờ đi được.

**Hệ quả: không thể cảnh báo trước cho từng khách.** Hệ thống không biết khách đến lúc nào nên không có sự kiện nào để kích hoạt cảnh báo cá nhân — đúng lý do C6 ("thông báo quá giờ chưa check-in") bị xóa. Cảnh báo chỉ tồn tại ở **đúng hai thời điểm**: lúc khách bấm check-in (đèn 3 màu, phản ứng) và widget Sức khỏe ca (chủ động, nhưng về TỔNG chứ không về cá nhân).

> ⚠️ **"Giờ nhận khách 19h30" là chốt chặn quá thô.** Dịch vụ 30 phút đến 19h30 thì vừa; dịch vụ 120 phút đến 19h30 thì hỏng. Phải thay bằng chốt tinh theo từng (dịch vụ × nhân sự).

#### Một công thức duy nhất giải cả ba tình huống
Ba tình huống (sát giờ tan ca nhân sự · sát giờ đóng cửa · nhân sự đã chọn về ca sớm) **là cùng một phép tính**, chỉ khác vế nào trong `MIN()` bị vi phạm. **Không viết ba nhánh riêng.**

```
Đệm dọn dẹp = 10 phút (tham số cấu hình)

① Thời điểm nhân sự X rảnh:
     nếu (số ca X đang giữ) < (số bàn song song của X)  →  RẢNH NGAY
     ngược lại  →  MIN(dự kiến xong của các ca đang giữ)
                   ↑ MIN chứ không phải MAX — chỉ cần MỘT bàn trống ra

② Dự kiến bắt đầu = MAX( bây giờ,
                          thời điểm X rảnh,
                          thời điểm xong của hàng chờ đứng trước )

③ Dự kiến xong = ② + goi_dich_vu.thoi_luong_phut + đệm

✅ PHỤC VỤ ĐƯỢC ⟺ ③ ≤ MIN( lich_truc_nhan_su.gio_ket_thuc , giờ đóng cửa )
                              ↑ TH1 (tan ca) & TH3 (về sớm)   ↑ TH2 (đóng cửa)
```

**Giờ đến muộn nhất** (dùng cho nhắc hẹn + hiển thị lúc đặt) `= MIN(tan ca, đóng cửa) − thời lượng − đệm`. Với **giờ đóng cửa 20:00** và đệm 10 phút:

| Thời lượng dịch vụ | Giờ đến muộn nhất (nhân sự tan ca 20h) |
|---|---|
| 30 phút | **19:20** |
| 60 phút | **18:50** |
| 90 phút | **18:20** |
| 120 phút | **17:50** |

→ Thấy rõ vì sao "không nhận khách sau 19h30" là chốt quá thô: dịch vụ 120 phút đã phải dừng nhận từ **17h50**, sớm hơn gần 2 tiếng.

**Dự kiến xong của một ca đang chạy:** `thoi_gian_bat_dau + thoi_luong_phut`; nếu khách đang trên máy (A17c) thì lấy `phien_lam_viec.may_ket_thuc_du_kien`.

#### Xử lý ở quầy — đèn ba màu, KHÔNG chặn cứng
| Đèn | Điều kiện | Hành vi |
|---|---|---|
| 🟢 | Dự kiến xong ≤ cả hai mốc | Check-in bình thường + hiện "Dự kiến gọi ~15:40" |
| 🟡 | Vượt ca của **nhân sự đã chọn**, còn người khác kịp | Modal 3 lựa chọn ↓ |
| 🔴 | **Không ai** kịp trước giờ đóng cửa | Modal, nhấn mạnh "Dời buổi" |

```
⚠️  Buổi Lượng giá 60 phút · Chuyên viên Tùng tan ca lúc 16:00
    Bắt đầu bây giờ (15:30) sẽ kết thúc lúc 16:40 — trễ 40 phút

  ① Đổi chuyên viên còn đủ giờ
       ○ Chuyên viên Minh · tan ca 19:30 · dự kiến gọi ~15:35
       ○ Chuyên viên Hà   · tan ca 19:30 · dự kiến gọi ~16:10
  ② Dời sang buổi khác
       → Chuyên viên Tùng trực gần nhất: SÁNG MAI 7:30–12:00   ← đọc từ lich_truc_nhan_su
  ③ Vẫn tiếp nhận với Chuyên viên Tùng   [ BẮT BUỘC ghi lý do ]
```

**Khách quyết, không phải hệ thống quyết.** Không bao giờ chặn cứng kể cả đèn đỏ (đúng nguyên tắc "thực tế phòng khám vẫn làm quá giờ"), nhưng lựa chọn ③ **bắt ghi lý do** + đánh dấu ca ngoài giờ để Quản lý thấy — biến hành vi lách thành dữ liệu quản trị.

#### Danh sách "Chưa đến — hạn đến muộn nhất" cho Lễ tân ⭐
Hệ thống **không biết khách đến lúc nào**, nhưng **biết ai đã đặt buổi này mà chưa check-in** và **dịch vụ họ đặt dài bao nhiêu phút** → tính được hạn đến muộn nhất của **từng người**. Đây là thứ thay thế cho cảnh báo "quá giờ chưa check-in" đã xóa (C6), và có ích hơn hẳn vì nó **hành động được trước**:

```
┌─ CHƯA ĐẾN · CA CHIỀU ────────────── bây giờ 17:02 ─┐
│  Trần Văn A  · Trị liệu 90'  · đến trước 17:50  🟡 │
│  Lê Thị B    · Lượng giá 60' · đến trước 18:50  🟢 │
│  Phạm C      · Trị liệu 120' · đến trước 16:50  🔴 │ ← đã quá hạn
└────────────────────────────────────────────────────┘
```
Lễ tân gọi nhắc **chủ động lúc 17h** thay vì chờ khách xuất hiện lúc 19h20 rồi mới báo không kịp. Dòng đỏ = gọi ngay để dời buổi, đừng để khách đi tới nơi rồi bị từ chối.

#### Ba chốt PHÒNG BỆNH — rẻ hơn chữa cháy ở quầy rất nhiều
1. ⭐ **Lúc đặt lịch hiện giờ trực THẬT của nhân sự:** *"Chuyên viên Tùng nhận khách 12:00–16:00 buổi chiều"*. Hiện tại khách chọn Tùng cho "buổi chiều 12h–19h30" mà **không hề biết Tùng về lúc 16h** — đây chính là gốc rễ của tình huống 3.
2. **Email nhắc hẹn ghi giờ đến muộn nhất:** *"Vui lòng đến trước **15:00** để kịp buổi 60 phút với Chuyên viên Tùng"* — biến email nhắc từ thông báo thành công cụ (B16).
3. **Chốt thô theo thời lượng thay vì giờ cố định:** bỏ "không nhận sau 19h30", thay bằng "không nhận sau *giờ đến muộn nhất* của chính dịch vụ đó".

#### Thứ tự hàng đợi & hệ quả của việc chọn nhân sự
- **Thứ tự hàng đợi theo `cuoc_hen.thoi_gian_checkin`**, KHÔNG theo thời điểm đặt lịch. Ai đến trước gọi trước — công bằng, khách hiểu ngay, giống lấy số ở bệnh viện.
- Khách chọn đích danh xếp trong **hàng riêng của người đó**; hệ quả là có thể chờ lâu hơn người check-in sau nhưng chọn "Bất kỳ". **Bắt buộc hiện so sánh ở quầy để khách đổi ý:** *"Bạn chọn Chuyên viên Tùng — dự kiến chờ **45 phút**. Chọn 'Bất kỳ' sẽ được phục vụ sau **~10 phút**. Đổi không?"*
- Không có rủi ro "gán nhầm vào người đang bận" vì mô hình **kéo** không gán ai lúc check-in (`nhan_su_id` để trống).

#### Hiển thị thời gian chờ — tách hai mức
| Xem ở đâu | Hiển thị | Vì sao |
|---|---|---|
| Nội bộ (Lễ tân, nhân sự) | **Giờ cụ thể**: "Dự kiến gọi 15:40 · còn 22 phút" | Cần chính xác để điều phối |
| Nói với khách / màn hình khách | **Khoảng**: "khoảng 20 phút nữa" | Giờ cụ thể tạo cam kết hệ thống không giữ được → khách bắt bẻ |

#### Widget "Sức khỏe ca" cho Lễ tân ⭐ (đáng giá nhất để demo)
```
┌─ SỨC KHỎE CA CHIỀU ─────────────────────────────┐
│  Công suất còn lại   210 phút                   │
│  Hàng đợi đang cần   140 phút          🟢 Ổn    │
└─────────────────────────────────────────────────┘
```
`Công suất còn lại = Σ (phút còn lại tới tan ca của từng nhân sự đang trực × số bàn song song)` · `Nhu cầu = Σ thời lượng các ca đã check-in chưa xong`. Vượt → đỏ *"⚠️ Vượt 40 phút — cân nhắc mời khách cuối dời buổi"*. Lễ tân biết **trước 2 tiếng** thay vì phát hiện lúc 19h30. Đây là thứ trả lời lời chê #3 của hội đồng ở mức vận hành.

#### Bổ sung cho màn hình của Chuyên viên/KTV
Mỗi thẻ hàng đợi hiện thời lượng dịch vụ; nếu gọi vào sẽ vượt ca trực thì thẻ **chuyển vàng**: *"Ca 60 phút · bạn tan ca sau 40 phút"* — vẫn cho gọi, có bước xác nhận. Thanh trạng thái riêng: *"Bạn còn 85 phút trước khi tan ca"*.

> ✅ **Không cần thêm cột nào cho toàn bộ lớp này.** Đã có sẵn: `cuoc_hen.thoi_gian_checkin` · `cuoc_hen.thoi_gian_bat_dau` · `goi_dich_vu.thoi_luong_phut` · `lich_truc_nhan_su.gio_bat_dau/gio_ket_thuc` · `phong_lam_viec.suc_chua` · `phien_lam_viec.may_ket_thuc_du_kien` (bảng mới đã có trong kế hoạch). Chỉ thêm 2 tham số cấu hình: **đệm dọn dẹp** và **giờ đóng cửa**.

### Thuật ngữ hiển thị (chỉ đổi nhãn UI, **giữ nguyên tên bảng/cột/biến**)
| Hiện tại | Đổi thành |
|---|---|
| Bác sĩ | **Chuyên viên Vật lý trị liệu** |
| Dịch vụ Khám | **Buổi Lượng giá** |
| Tái khám | **Lượng giá bổ sung** |
| Bàn khám | **Bàn lượng giá** |
| Chẩn đoán lâm sàng | **Kết luận lượng giá** |
| Phác đồ điều trị | **Kế hoạch trị liệu** |
| Hồ sơ bệnh án / điều trị | **Lịch sử điều trị** |
| Chuyển cận lâm sàng | **Chuyển tuyến** |
| Chờ tái khám | **Chờ tái lượng giá** (`cho_tai_luong_gia`) |
| Bệnh nhân | **Khách hàng** |
| Chống chỉ định | *Giữ nguyên* (đúng thẩm quyền chuyên viên VLTL) |

> ⚠️ **KHÔNG** đổi thành "Tư vấn viên" — chức danh bán hàng không có thẩm quyền ra quyết định lâm sàng, sẽ bị đánh nặng hơn hiện tại.

---

## A. LÀM LẠI (sửa cái đang có)

| # | Hạng mục | Từ → Thành |
|---|---|---|
| A1 | Cơ chế sức chứa | Slot 30 phút cố định → **ngân sách phút theo ca, hai tầng, nhân số khách song song** |
| A1b | Ràng buộc số bàn mở đồng thời | Chặn cứng 1 bàn mọi vai trò → **KTV được mở tối đa 2 bàn**, Chuyên viên vẫn 1 |
| A2 | Màn hình đặt lịch khách | Ngày+giờ+nhân sự → **dịch vụ → ngày → buổi → nhân sự/bất kỳ** |
| A3 | Đặt lịch tại quầy (Lễ tân) | Theo giờ → theo buổi |
| A4 | Đặt buổi tiếp theo (trong liệu trình) | Theo giờ → theo buổi |
| A5 | **Màn hình quản lý lịch hẹn — tách theo actor** | 🔶 **Phần Lễ tân "Hôm nay" xong 07/08/2026, vá thêm 1 đợt cùng ngày sau phản hồi tay** — `TodayFlowBoard.tsx` + wiring trong `ReceptionistAppointments/index.tsx`. Đợt vá 2: tiêu đề cột thật (không còn tên khách trần trụi), avatar + tên phòng ngay dưới nhân sự, Sức khỏe ca lọc đúng túi vai trò theo tab đang xem (trước đó luôn hiện cả 2 túi bất kể tab), badge thanh toán trên từng dòng đổi từ `isAwaitingPaymentForList` (sai — luôn hiện "Đã thu" cho MỌI ca chưa hoàn thành, kể cả chưa thu đồng nào) sang `isPaymentDue` (đọc đúng trạng thái thật), nút "Thu tiền" giờ hiện ở mọi nhóm chưa xong (không chỉ nhóm Xong), card KPI-lọc phía trên ẩn khi xem "Hôm nay" (chúng set filter nhưng không hề tác động TodayFlowBoard, chỉ gây rối — đúng nguyên tắc "Lễ tân không lọc, họ theo dõi dòng chảy"), toast "Đang cập nhật..." tức thời + tên khách cụ thể khi Check-in. **Còn lại**: Hàng đợi 3 tab (Chuyên viên/KTV), Danh sách+lọc Admin, "Danh sách + tổng hợp" cho Lễ tân xem ngày khác (tạm dùng `AppointmentCalendar` cũ). Sức khỏe ca vẫn bản rút gọn — số khách song song mặc định = 1 (A1b chưa làm), chưa có "hạn đến muộn nhất" (B22 đầy đủ chưa làm — mới có 1 nhãn cảnh báo tĩnh ở form đặt lịch quầy, xem B20b). |
| A5b | **Bảng cấu hình trạng thái** | ✅ Xong 07/08/2026 — 2 bảng lệch nhau, 10 chuỗi → **1 bảng duy nhất, 7 trạng thái** (`frontend/src/components/appointmentStatusConfig.ts`) |
| A6 | Popup chi tiết lịch hẹn | Bỏ giờ chi tiết → thêm **số thứ tự, trạng thái hàng đợi, mốc thời gian thực tế** |
| A7 | Đổi lịch | Ngày+giờ → **chỉ ngày + buổi**, chỉ trước ngày hẹn |
| A8 | Thời điểm thu tiền | Cố định sau hoàn thành → **linh hoạt theo loại dịch vụ**; nút "Thu tiền" luôn sẵn từ check-in tới hoàn thành |
| A8b | Chặn bắt đầu buổi Lượng giá khi chưa thanh toán | Chưa có → **khóa nút "Bắt đầu khám"** + cảnh báo đỏ trong hàng đợi |
| A9 | Hóa đơn hình thức từng buổi | 1 hóa đơn tổng trừ dần → **mỗi buổi một phiếu** |
| A10 | Trạng thái lịch hẹn | ✅ **Xong 07/08/2026** — frontend + schema (đợt 1) rồi backend repositories/services (đợt 2, cùng ngày): dọn hết `chua_xac_nhan`/`cho_xac_nhan`/`giu_cho`/`cho_kham` còn sót trong `appointment/admin/doctor/technician/receptionist.repository.ts` + `ai/doctor/technician.service.ts`; nhân tiện bổ sung `cho_tai_luong_gia` vào 4 chỗ kiểm tra "lịch đang hoạt động" (đặt buổi tiếp theo, khóa khách hàng) — trước đó thiếu, khiến buổi đang chờ tái lượng giá không được coi là active. ⚠️ **Phát hiện phụ (chưa xử lý, cần quyết định riêng):** 3 endpoint `receptionist.repository.ts::getTodayAppointments/getReceptionistStats` (`GET /receptionist/today-appointments`, `/stats`, `/dashboard`) là code mồ côi từ kanban đời trước — grep toàn frontend không còn nơi nào gọi 3 route này. Chưa xóa vì là quyết định xóa hẳn API, không phải cleanup chuỗi trạng thái đơn thuần — hỏi lại trước khi xóa. |
| A10b | **Tách trạng thái thanh toán** khỏi trạng thái lâm sàng | ⚠️ **Khảo sát 07/08/2026 — nặng hơn dự tính, để làm riêng, không tiện tay khi đang sửa việc khác.** Cột `cuoc_hen.trang_thai_thanh_toan` **đã có sẵn trong DB** (migrate từ trước) và **được ghi đúng lúc TẠO lịch** (`appointment.repository.ts:709,746,766,971,986`), nhưng **KHÔNG có bất kỳ `UPDATE` nào sau đó** trong toàn backend — grep `trang_thai_thanh_toan\s*=` chỉ ra đúng 1 kết quả (chỗ tạo). Nghĩa là **thiếu hẳn write-side**: Lễ tân thu tiền xong, cột này vẫn mãi `chua_thanh_toan`. Đọc trạng thái thanh toán hiện tại (2 chỗ: `appointment.repository.ts:270`, `admin.repository.ts:918`) đang **né cột này**, lấy tạm qua `COALESCE(hd.trang_thai, 'chua_thanh_toan') AS trang_thai_thanh_toan` (trạng thái hóa đơn GÓI liên kết, không phải trạng thái thanh toán của chính lịch/buổi đó) — với buổi thuộc gói từng-buổi, hóa đơn gói có thể "đã thanh toán tổng" trong khi buổi cụ thể chưa thu. **Việc cần làm theo đúng thứ tự (không được đảo — sửa read trước sẽ khiến UI tệ hơn hiện tại, vĩnh viễn hiện "chưa thanh toán"):** (1) xác định chính xác nơi tiền thật sự được ghi nhận (`receptionist.repository.ts::processPayment`, webhook PayOS) → thêm `UPDATE cuoc_hen SET trang_thai_thanh_toan = ...` đúng lúc; (2) quyết định buổi-thuộc-gói thì cột này đại diện cho BUỔI hay GÓI (khác bản chất khám/dịch vụ lẻ); (3) mới sửa 2 câu SELECT đọc thẳng cột; (4) mới đơn giản hóa `isAwaitingPaymentForList`/`isPaymentDue` ở frontend (`utils/billing.ts`). Đây là vùng chạm thanh toán/hóa đơn — cân nhắc gọi `business-rule-guardian` trước khi chốt. |
| A10c | Hiển thị trạng thái ở danh sách & popup | ✅ Phần popup xong 07/08/2026 — `DetailModal/index.tsx`: badge thanh toán + nút "Thu tiền" giờ nằm **ngay cạnh** badge trạng thái lâm sàng trong khối "Trạng thái lịch hẹn" (trước đó nút thanh toán ở góc footer riêng, tách rời — đã bỏ nhánh đó trong `DetailFooter.tsx`, chỉ giữ 2 nhánh xử lý ca đã `hoan_thanh`). Phần danh sách (TodayFlowBoard) xem ở dòng A5. |
| A11 | Form khám của bác sĩ | 3 ô nhập → **phiếu Lượng giá PHCN** |
| A12 | Giới hạn đặt lịch | Không giới hạn → **3 lịch đang hoạt động cùng lúc** (toàn thời gian, không theo ngày — `checkCustomerActiveLimit`, đã code 06/08/2026, thay cho "3/ngày + 3 chờ" bản đầu); **bỏ hẳn `checkCustomerOverlap`**, **giữ `checkCustomerHasClinicalExamOnDate`**; thêm chặn khi đang có lịch treo `cho_tai_luong_gia`. Xem "Danh sách đầy đủ điều kiện chặn đặt lịch". ⚠️ **Bổ sung 07/08/2026 — phát hiện `checkCustomerOverlap`/`checkDoctorOverlap` CHƯA thực sự bị bỏ hẳn**: vẫn còn 1 call site sống sót trong `appointment.repository.ts::updateAppointmentStatus` (chạy trước MỌI đổi trạng thái không-hủy, kể cả check-in) — vì mọi lịch trong cùng buổi giờ dùng chung đúng 1 mốc giờ danh nghĩa, hàm này **luôn báo trùng giờ** cho 2 khách bất kỳ cùng nhân sự trong cùng buổi, chặn cứng check-in của khách thứ 2 trở đi (lỗi thật, đã tái hiện được: "Kỹ thuật viên đã có lịch trong khung giờ này"). **Đã xóa hẳn** 2 hàm + call site này (không còn caller nào khác). Đồng thời vá 3 chỗ **client-side** cùng bệnh trong `DetailModal/index.tsx` (`checkStaffAvailabilityForDate`, `overlappingApts`/`occupiedStaffIds`, `getSlotAvailabilityForDate`) — badge "Không khả dụng"/"Sẵn sàng" trên thẻ nhân sự trước đó coi MỌI lịch khác cùng buổi là chiếm chỗ; sửa thành chỉ coi `dang_kham` (đang thực hiện tay-đôi) là chiếm chỗ thật, còn `da_checkin`/`da_xac_nhan` (đang xếp hàng chờ) không tính. |
| A13 | Chính sách hủy | 10 nhánh (loại dịch vụ × thời điểm × hình thức) → **1 câu hỏi duy nhất: đã thanh toán chưa** |
| A14 | Hủy lịch | Gate 8 tiếng → **cửa sổ 60 phút kể từ lúc đặt, chỉ cho lịch chưa thanh toán**, kèm 3 vế điều kiện (chưa check-in, buổi chưa kết thúc) + xóa mềm + trần 3 lần/7 ngày |
| A15 | Lịch đã thanh toán | Bỏ nút hủy → khách chỉ có nút **"Yêu cầu đổi lịch"** (mở hộp thoại hotline, không tự đổi); **Lễ tân đổi buổi không giới hạn số lần**, tiền giữ nguyên |
| A15b | **Tỉ lệ phạt hủy gói** | Admin **gõ tay tự do** (`phi_phat`, chỉ validate ≥0) → **cấu hình tập trung + snapshot vào hóa đơn**, ô nhập thành chỉ đọc |
| A15c | Công thức hoàn tiền gói | `giaThanhToanGoi` tái tính từ `tongTienGoc × ti_le_giam_gia_goi` → lấy thẳng **`tong_tien_phai_tra`** (bắt buộc, vì C11 khai tử cột tỉ lệ giảm) |
| A16 | Thuật ngữ hiển thị | Đổi toàn bộ theo bảng trên |
| A17 | **Tái cấu trúc màn hình Bàn lượng giá** (Chuyên viên VLTL) | Giao diện hiện tại → **theo bản mẫu**, hợp nhất sidebar hàng đợi |
| A17b | **Bàn trị liệu KTV** | Chỉ có VAS + ghi chú → **VAS (3 cách nhập) · Nhật ký thao tác · Ghi chú** + **tab xem** riêng; **một màn hình duy nhất** cho cả dịch vụ lẻ lẫn buổi gói |
| A17c | **Cơ chế phục vụ song song** trong buổi trị liệu | Chưa có → **nút "Đưa vào máy" + chọn máy + hẹn giờ, 3 trạng thái con (thêm `cho_ktv`), cảnh báo sắp xong, chặn gọi mới khi có khách chờ, form chia 3 bước, quy tắc nhả máy** |
| A18 | **Tái cấu trúc Hồ sơ điều trị của khách hàng** | Giao diện hiện tại → **theo bản mẫu người dùng cung cấp** |

### A5 — Màn hình quản lý lịch hẹn: GIẢM 4 MÀN HÌNH XUỐNG 2 ⭐

| Actor | Câu hỏi cần trả lời | Màn hình |
|---|---|---|
| **Chuyên viên / KTV** | *Ai tiếp theo · ngày mai ai chọn tôi · tôi đã làm gì* | **Hàng đợi (A17) có 3 TAB** — không có màn hình lịch hẹn riêng |
| **Lễ tân** | *Ai ở quầy · ai chưa đến · ai chưa trả · mai bao nhiêu ca để gọi nhắc* | **Bảng điều hành, 2 CHẾ ĐỘ theo ngày** |
| **Admin / Quản lý** | *Công suất · phân bổ · ngoại lệ* | **Danh sách nhiều ngày + bộ lọc** |

> ⚠️ **Đính chính bản trước:** đã viết *"Chuyên viên/KTV không cần xem ngày khác"* — **sai**. Họ vẫn cần biết ngày mai ai chọn đích danh mình (để chuẩn bị) và xem lại ca đã làm. Nhưng lời giải là **thêm tab vào màn hình Hàng đợi họ đang đứng**, không phải khôi phục màn hình quản lý lịch hẹn cũ.

#### Hàng đợi của Chuyên viên / KTV — 3 tab
| Tab | Nội dung |
|---|---|
| **Hôm nay** (mặc định) | Hàng đợi + bàn làm việc |
| **Sắp tới** | Khách **đã chọn đích danh** tôi, theo ngày |
| **Lịch sử** | Ca tôi đã làm — **ĐÃ CÓ SẴN**, chính là tab "lịch sử hồ sơ" trong `ClinicalAssessment/index.tsx` |

⭐ **Thẻ khách trong tab "Hôm nay" — đặc tả cập nhật 06/08/2026 (đủ dữ liệu để nhân sự hành động, không cần đoán):**
```
┌─ #03 · Trần Văn A · Trị liệu vai gáy 60' · chờ 12 phút ──┐
│  ⚠️ Đã gọi 1 lần — bấm "Không có mặt" lần nữa sẽ         │
│     chuyển "Không đến" (mất tiền nếu đã thanh toán)      │
│                                                            │
│         [ Gọi vào ]        [ Không có mặt ]              │
└────────────────────────────────────────────────────────────┘
```
Dòng cảnh báo **chỉ hiện khi `phien_lam_viec.so_lan_goi_khong_co_mat = 1`** (đã bị gọi hụt 1 lần) — đây là cơ sở để nhân sự biết đang ở lần gọi thứ mấy mà không phải nhớ nhẩm (xem chi tiết cơ chế ở mục "Phân biệt rõ hai tình huống không đến"). Nếu Lễ tân vừa **đổi buổi** cho đúng khách này (khách gọi điện báo không tới kịp) trong lúc thẻ đang hiển thị, thẻ phải **tự biến mất khỏi hàng đợi** ở lần làm mới tiếp theo — không cần nhân sự tự nhận biết; nếu nhân sự trót bấm "Gọi vào"/"Không có mặt" đúng lúc đó (khoảng hở vài giây trước khi màn hình tự làm mới), hệ thống trả về lỗi rõ ràng thay vì âm thầm sai lệch (xem "Cài đặt: đổi buổi" mục Hủy & Hoàn tiền).

⭐ **Tab "Sắp tới" phải trung thực, nếu không nhân sự hiểu nhầm:**
```
📅 NGÀY MAI · CA SÁNG
   Khách đã chọn bạn (2)
     #  Nguyễn Văn A · Trị liệu vai gáy 60'
     #  Trần Thị B   · Trị liệu lưng 90'

   ℹ️ Ngoài ra còn 12 khách chưa chọn nhân sự
      — sẽ phân bổ theo hàng đợi chung
```
Con số 12 **chỉ hiện dạng ĐẾM, tuyệt đối không liệt kê** — chưa biết ai sẽ nhận; liệt kê ra thì nhân sự tưởng là lịch của mình.

#### Màn hình Lễ tân — 2 CHẾ ĐỘ theo ngày được chọn
| Ngày chọn | Chế độ | Vì sao |
|---|---|---|
| **Hôm nay** | **1 bảng, nhóm theo dòng chảy** (4 nhóm xếp dọc, mỗi nhóm tự cuộn) | Vận hành thời gian thực |
| Ngày mai / tương lai | **Danh sách + tổng hợp** | Nhóm theo dòng chảy vô nghĩa — mọi người đều "chưa đến" |
| Ngày cũ | **Danh sách** | Tra cứu, đối soát khiếu nại |

**Chế độ tổng hợp ngày mai — chính là công cụ gọi nhắc:**
```
📅 NGÀY MAI 07/08 · Tổng 17 lịch
   ☀ Sáng   9 lịch  ·  Chuyên viên 3 · KTV 6
   🌙 Chiều  8 lịch  ·  Chuyên viên 2 · KTV 6
   ⚠️ 4 khách chưa thanh toán
   [ Danh sách gọi nhắc ]   ← tên · SĐT · buổi · dịch vụ
```
Đây là chỗ Lễ tân lấy danh sách gọi nhắc thủ công (thay cho B17 đã cắt) — **không thêm bảng, không thêm màn hình**, chỉ là một chế độ hiển thị của màn hình đã có.

#### Chế độ HÔM NAY của Lễ tân — 1 BẢNG, xếp nhóm theo dòng chảy, KHÔNG chia cột vật lý ⭐ (chốt 06/08/2026, thay bản 4-cột kanban trước đó)

> ✅ **Đã cài đặt 07/08/2026** — `frontend/src/components/appointments/ui/TodayFlowBoard.tsx` + wiring trong `ReceptionistAppointments/index.tsx`. Đã test tay qua Playwright (check-in nhanh, KPI/Sức khỏe ca cập nhật, mở Chi tiết) — không phải chỉ code xong chưa chạy thử. Xem ghi chú giới hạn ở dòng A5 trong bảng "A. LÀM LẠI".

> **Lý do đổi khỏi bản 4-cột kanban:** 4 cột đặt cạnh nhau chỉ còn ~1/4 màn hình mỗi cột — không đủ chỗ cho một dòng đầy đủ thông tin (khách · dịch vụ/gói · nhân sự đã chọn · trạng thái thanh toán · thao tác). Tách 4 nhóm **xếp CHỒNG DỌC** thay vì **cạnh NGANG** thì mỗi nhóm vẫn full-width — đủ chỗ cho bảng nhiều cột — mà vẫn giữ được nguyên lý gốc (xem bên dưới). Đổi lại: nhóm nào phình to (vd "Chưa đến" giờ cao điểm) sẽ đẩy các nhóm sau xuống nếu cuộn chung một luồng — giải quyết bằng cách **mỗi nhóm tự giới hạn chiều cao + cuộn riêng bên trong**, giống một lane kanban nhưng full-width, xếp dọc thay vì ngang.

```
[ Hôm nay ▾ ]   ☀ SÁNG 7:30–12:00   │   🌙 CHIỀU 12:00–19:30      🔍 Tìm tên/SĐT...

┌ SỨC KHỎE CA (B21) ────────────────────────────────────────┐
│ Chuyên viên  còn 210'·cần 140' 🟢  │  KTV  còn 380'·cần 410' 🔴 │
└──────────────────────────────────────────────────────────────┘

┌ Chưa đến (32) ▾ ────────────────────────────── [ nhảy tới ▸ ] ┐
│ 🔴17:50 Phạm Văn C·Trị liệu vai 120'·Bất kỳ  ·⚠Chưa trả [..]  │
│ 🟡17:50 Trần Văn A·Trị liệu lưng 90'·KTV Dương·✓ Đã trả [..]  │
│ 🟢18:50 Lê Thị B ·Lượng giá 60'   ·Bất kỳ    ·⚠Chưa trả [..]  │
│ ⋮  (khung cao tối đa ~6 dòng, cuộn RIÊNG bên trong khung này) │
└──────────────────────────────────────────────────────────────┘
┌ Đang chờ (3) ▾ ─────────────────────────────────────────────┐
│ #03 Nguyễn Văn D·Buổi 3/12·KTV Minh Anh·✓ Đã trả·chờ 12' [..]│
└──────────────────────────────────────────────────────────────┘
┌ Đang làm (2) ▾ ─────────────────────────────────────────────┐
│ Vũ Văn F·Trị liệu cổ·CVien Tùng·Phòng 02·⏱ 00:22        [..]│
└──────────────────────────────────────────────────────────────┘
┌ Xong (8) ▸  (mặc định THU GỌN — ít actionable nhất)          │
│    ⚠ 1 chưa thu tiền — vẫn hiện cảnh báo ngay trên tiêu đề    │
└──────────────────────────────────────────────────────────────┘
                ▸ Ngoại lệ: đã hủy · không đến (thu gọn)
```

**Cột hiển thị trong mỗi dòng** (đầy đủ, không rút gọn như bản kanban cũ): Khách hàng (tên+SĐT) · Buổi/giờ hoặc hạn-đến-muộn-nhất (B22) hoặc số thứ tự hàng đợi tùy nhóm · Dịch vụ/Gói (ghi rõ "Buổi M/N — tên gói" nếu thuộc liệu trình) · Nhân sự đã chọn (rỗng = "Bất kỳ"; có tên khi đã gọi vào) · **2 badge thanh toán/lâm sàng tách riêng** (đúng A10b) · nút Thao tác theo ngữ cảnh.

| Nhóm | Gom trạng thái nào |
|---|---|
| Chưa đến | `da_xac_nhan` |
| Đang chờ | `da_checkin` |
| Đang làm | `dang_kham` + `cho_tai_luong_gia` |
| Xong | `hoan_thanh` |
| ▸ Ngoại lệ (thu gọn) | `da_huy` + `khong_den` |

⭐ **Vì sao vẫn không dùng dropdown lọc trạng thái (nguyên lý giữ nguyên từ bản cũ):** Lễ tân không *lọc*, họ *theo dõi dòng chảy*. Bộ lọc trạng thái là giao diện mang hình dạng **cơ sở dữ liệu**; xếp theo nhóm dòng chảy là giao diện mang hình dạng **công việc**. Đổi từ "4 cột ngang" sang "4 nhóm dọc, mỗi nhóm tự cuộn" chỉ đổi cách trình bày, không quay lại tư duy lọc. 7 trạng thái gói gọn thành 4 nhóm + 1 nhóm thu gọn, **không mất thông tin nào**. Nhóm "Chưa đến" đồng thời là B22, nhóm "Xong" đồng thời là chỗ thu tiền sót (A10c) — badge cảnh báo hiện ngay trên tiêu đề nhóm dù đang thu gọn, không cần mở ra mới thấy.

**Số đếm trên KPI/tiêu đề mỗi nhóm bấm được → cuộn trang tới đúng nhóm đó** (kiểu anchor nav) — cao điểm nhiều khách không phải dò bằng mắt qua từng nhóm.

#### Màn hình Admin / Quản lý — giữ danh sách + bộ lọc
Họ **thật sự cần lọc và phân tích** nên giữ dạng danh sách nhiều ngày. Bộ lọc đơn giản hơn: **7 trạng thái** thay vì 10, **thêm bộ lọc trạng thái thanh toán riêng**, và bộ lọc gộp **"hoàn thành nhưng chưa thu tiền"** (giờ chính xác nhờ A10b).

#### Số phận các panel hiện có
| Panel | Xử lý |
|---|---|
| `ui/OverdueCheckinPanel.tsx` | ❌ **Bỏ** — không còn giờ hẹn để "quá giờ" (C6) |
| `ui/PendingContactPanel.tsx` | ❌ **Bỏ** — không còn chờ xác nhận (C4) |
| `ui/UnassignedPanel.tsx` | ❌ **Bỏ** — không gán nhân sự là **trạng thái bình thường** (C10) |
| `ui/PendingPaymentPanel.tsx` | ✅ Giữ — đọc thẳng `trang_thai_thanh_toan`, bỏ hết logic suy luận |
| `ui/DoctorWorkloadPanel.tsx` | ✅ Giữ — đổi từ **đếm ca** sang **đếm phút** |
| `ui/AppointmentKpiCards.tsx` | ✅ Giữ — đổi công thức |
| `ui/CapacityView.tsx` | 🔄 **Viết lại** theo ngân sách phút **hai túi vai trò** |
| `AppointmentCalendar.tsx` | 🔄 **Viết lại** — bỏ timeline theo giờ |

### A17 / A18 — Tái cấu trúc giao diện (ĐÃ CÓ BẢN MẪU)

**Bản mẫu tham chiếu:** giao diện MediPlus (người dùng cung cấp), gồm 2 màn hình — *Giao diện khám bệnh* và *Hồ sơ điều trị bệnh nhân*.

> ⚠️ **Lấy BỐ CỤC và ngôn ngữ thị giác, KHÔNG bê nguyên nội dung.** Mẫu là phần mềm bệnh viện đa khoa; nhiều khối trong đó (dấu hiệu sinh tồn, đơn thuốc, xét nghiệm) **không thuộc thẩm quyền** của Chuyên viên VLTL — bê nguyên vào sẽ bị hội đồng bắt lỗi nặng hơn hiện tại.

**⭐ Phát hiện quan trọng — hợp nhất B1 vào A17:**
Sidebar trái của mẫu (*Đang chờ khám 3 · Đã khám 15*) **chính là màn hình Hàng đợi (B1)**. Vì vậy **B1 và A17 gộp làm một màn hình** thay vì hai màn hình riêng: sidebar hàng đợi + panel làm việc. Vừa tiết kiệm công, vừa cho phép Chuyên viên/KTV chuyển ca mà không phải quay về trang lịch hẹn.

#### Ánh xạ A17 — Bàn lượng giá / Bàn trị liệu

| Khối trong mẫu | OfficeCare | Xử lý |
|---|---|---|
| Sidebar hàng đợi + bộ đếm | Hàng đợi theo ca, số thứ tự, tìm kiếm | ✅ **Lấy** — đây là B1 |
| Card khách + ảnh, ID, tuổi, giới tính | Tương đương | ✅ Lấy |
| Lý do khám · Tiền sử | `ly_do_kham` + tiền sử khách tự khai | ✅ Lấy |
| **Dấu hiệu sinh tồn** (mạch, huyết áp, nhiệt độ) | ❌ Không đo — không phải cơ sở khám chữa bệnh | 🔄 **Thay bằng khối Chỉ số lượng giá**: ROM · MMT · VAS (VAS dùng chung cơ chế 3 cách nhập mô tả ở A17b) |
| Chẩn đoán sơ bộ | Đổi tên | 🔄 **Kết luận lượng giá** |
| **Chỉ định cận lâm sàng** (chips X-quang, xét nghiệm) | Không tự làm, chỉ chuyển đi | 🔄 **Nút Chuyển tuyến** — **KHÔNG chọn loại chụp** (nói miệng ngoài đời), xem đặc tả nút bên dưới |
| **Đơn thuốc** (bảng thuốc, số lượng, HDSD) | ❌ Không kê thuốc | 🔄 **Tab Chỉ định riêng**: chọn gói + số buổi, hoặc "Không chỉ định" |
| Ghi chú | Tương đương | ✅ Lấy |
| Nút *Kê đơn* / *Lưu* | Đổi nhãn | 🔄 **Hoàn thành lượng giá** (xem 2 nút bên dưới) |
| — | Bổ sung: nút **Gọi vào khám** · **Bắt đầu khám** · **Gọi không có mặt** (B2, B3, B11) | ➕ Thêm |
| — | Bổ sung: cảnh báo **⚠️ Chưa thanh toán** khóa nút bắt đầu (A8b) | ➕ Thêm |

#### A17a — Đặc tả CHỐT bàn lượng giá ⭐ (thay thế mọi mô tả trước đó)

**Nội dung panel — đúng 5 khối, không hơn:**
1. **Lý do đến khám + ảnh khách gửi** — chỉ đọc, chỉ hiện nếu khách nhập từ form đặt lịch. **KHÔNG có chức năng upload.**
2. **VAS** — 3 cách nhập (mặt cười / mô tả bằng lời / thang số), cùng cơ chế mô tả ở A17b
3. **ROM / MMT** — bảng rỗng, bấm **"+ Thêm"** mới hiện dòng; chỉ nhập khớp/nhóm cơ liên quan, **không bắt điền đủ**
4. **Kết luận lượng giá** (`chan_doan`) — nội dung phải là mô tả **CHỨC NĂNG**, không phải bệnh lý (xem "Ranh giới thẩm quyền")
5. **Chống chỉ định** (`chong_chi_dinh`)

**+ Tab "Chỉ định" riêng** — tách khỏi form lượng giá vì là hành động cuối, không phải dữ liệu lâm sàng.

> ❌ **ĐÃ BỎ khỏi thiết kế:** *Sàng lọc dấu hiệu cảnh báo (red flags)* — trùng chức năng với nút Chuyển tuyến, và mời hội đồng hỏi về thẩm quyền đào tạo · *Tư thế / dáng đi* · *Mục tiêu trị liệu* · *Ô `ket_qua_can_lam_sang`* (khách quay lại thì chuyên viên nhìn phim rồi nhập thẳng vào ROM/chẩn đoán/chống chỉ định như bình thường).

**ĐÚNG 2 NÚT KẾT THÚC — không có nút thứ ba:**

```
┌─ ① HOÀN THÀNH LƯỢNG GIÁ ────────────────────────────────┐
│  → CÓ validation các ô bắt buộc                          │
│  → Popup xác nhận:                                       │
│      "Xác nhận hoàn thành ca lượng giá                   │
│       + Chỉ định: <tên gói>  HOẶC  Không chỉ định gói"   │
│      [ Xác nhận ]  [ Hủy ]                               │
└──────────────────────────────────────────────────────────┘

┌─ ② CHUYỂN TUYẾN ────────────────────────────────────────┐
│  → KHÔNG validation gì cả                                │
│  → Popup nhỏ: nhập HẠN QUAY LẠI                          │
│      [ Xác nhận chuyển tuyến ]  [ Hủy ]                  │
│  → Ca sang trạng thái "Chờ tái lượng giá"                │
│  → GIẢI PHÓNG SLOT NGAY                                  │
└──────────────────────────────────────────────────────────┘
```

⭐ **Điều kiện bắt buộc KHÁC NHAU theo lối ra** — đây là điểm dễ code sai nhất: lúc chuyển tuyến, chuyên viên **chưa có đủ thông tin để kết luận**, nên không được validate gì ngoài hạn quay lại. Không dùng chung một bộ validate cho cả hai nút.

**Nhánh "vượt khả năng trung tâm" không cần nút riêng:** chọn **"Không chỉ định"** trong tab Chỉ định + ghi lý do vào kết luận → bấm nút ①. **Bỏ phiếu khuyến cáo in được** đã đề xuất trước đó.

**Khách quay lại sau chuyển tuyến:** đưa phim cho chuyên viên nhìn → nhập nốt các ô còn trống (ROM, chẩn đoán, chống chỉ định) → bấm nút ① hoàn thành bình thường. **Không có màn hình riêng, không có ô kết quả riêng.**

**Quá hạn quay lại → ca TỰ hoàn thành**, không bắt ai nhập gì thêm. Khách muốn quay lại phải đặt lịch mới có thu phí.

> 📌 Trạng thái mới đặt tên **`cho_tai_luong_gia`** (nhãn hiển thị "Chờ tái lượng giá") thay cho `cho_tai_kham` viết ở phần trước — đây là trạng thái tạo mới nên đặt đúng thuật ngữ luôn, không tốn gì.

#### Ranh giới thẩm quyền Chuyên viên VLTL ⚠️ (định hình nội dung A11)
| ❌ Không được | ✅ Được, và là chuyên môn chính |
|---|---|
| Chẩn đoán bệnh lý y khoa (đọc MRI kết luận thoát vị) | Lượng giá chức năng: ROM · MMT · VAS |
| Kê đơn thuốc | **Kết luận lượng giá** (chức năng, không phải bệnh lý) |
| — | **Chống chỉ định vận động/trị liệu** — bắt buộc phải có |
| — | Nghi ngờ vấn đề ngoài thẩm quyền → **chuyển tuyến** |

⚠️ **Cột DB giữ tên `chan_doan` nhưng NỘI DUNG đổi bản chất:** không phải *"thoát vị đĩa đệm L4-L5"* mà là *"hạn chế xoay cổ trái 40°, yếu nhóm cơ thang dưới bậc 3/5"*. Nếu lúc demo gõ một chẩn đoán bệnh lý vào đó thì toàn bộ việc đổi tên "Bác sĩ → Chuyên viên" mất tác dụng, hội đồng bắt được ngay. Placeholder của ô phải gợi ý đúng kiểu nội dung này.

> 💬 **Vì sao không làm X-quang nội bộ (đổi lập luận):** không phải vì "phình phạm vi" — mà vì **trung tâm PHCN không được phép**: chụp X-quang cần giấy phép an toàn bức xạ và KTV chẩn đoán hình ảnh có chứng chỉ. Lý do pháp lý mạnh hơn hẳn lý do kỹ thuật khi trả lời hội đồng.

#### A17b — Bàn trị liệu của KTV (bổ sung nội dung, không chỉ đổi giao diện)

Sidebar giống A17 nhưng chia **2 nhóm** (khách chỉ định riêng / hàng đợi chung), có chỉ báo **"Đang phục vụ 2/2"** khi đủ số bàn song song.

**Vấn đề hiện tại:** panel chỉ có VAS trước/sau + ghi chú tự do. Không trả lời được hai câu hỏi mà hội đồng nhiều khả năng sẽ hỏi: *"KTV dựa vào cơ sở gì để nhập điểm đau?"* và *"KTV dựa vào đâu để biết phải làm gì cho khách?"*

**Sửa cách thu thập VAS — khách TỰ đánh giá, và phải dễ trả lời:**

Vấn đề lâm sàng có thật: bệnh nhân thường **không tự ước lượng được** mình đau mấy điểm trên 10. Thanh trượt số trơ trọi như hiện tại là cách tệ nhất để hỏi. Giải pháp — cho KTV chọn **3 cách nhập**, cả ba ghi vào cùng một giá trị 0–10 (**không đổi cấu trúc dữ liệu**):

| Cách | Mô tả | Khi nào dùng |
|---|---|---|
| ⭐ **Thang mặt cười** (Wong-Baker FACES) — **mặc định** | 6 khuôn mặt tươi→nhăn, tương ứng 0/2/4/6/8/10 | Đa số khách; chỉ cần chỉ tay, không cần diễn đạt |
| **Mô tả bằng lời** | Không đau · Nhẹ · Vừa · Nặng · Rất nặng · Không chịu nổi → tự quy đổi ra số | Khách quen mô tả bằng từ ngữ |
| **Thang số** | Thanh trượt 0–10 như hiện tại | Khách đã quen thang điểm |

**Kèm gợi ý neo bằng câu hỏi chức năng** (hiện dạng nhắc nhỏ, không bắt buộc) để KTV dùng khi khách vẫn lúng túng:
- *"Cơn đau có làm anh/chị mất ngủ không?"*
- *"Có ảnh hưởng tới việc ngồi làm việc / lái xe không?"*
- *"Có phải uống thuốc giảm đau không?"*

Đổi nhãn khối → **"Mức đau khách hàng tự đánh giá (trước/sau trị liệu)"**. Giữ hàm `getVasDescription` đã có để hiển thị mô tả mức đau tương ứng sau khi chọn.

#### A17b-CHỐT — Bàn trị liệu, đặc tả cuối ⭐ (thay thế mọi mô tả trước)

**① MỘT màn hình duy nhất cho CẢ dịch vụ lẻ VÀ buổi gói liệu trình.** Không có biến thể, không ẩn/hiện theo loại buổi — cái nào cần thì nhập. Gói kiểu *"Giảm đau cấp tốc"* (dịch vụ lẻ) vì thế vẫn có VAS trước/sau đầy đủ như buổi liệu trình.

**② TÁCH bàn làm việc khỏi màn hình xem thông tin.** Bàn làm việc **chỉ chứa thao tác của buổi này**. Ba thứ ngữ cảnh — *tiến độ "Buổi 3/12"* · *buổi trước* · *kế hoạch trị liệu / kết luận / chống chỉ định* — **chuyển hẳn sang tab xem**, áp dụng cho **cả hai loại buổi**.
> **Lý do (do người dùng chỉ ra):** khách có thể có nhiều buổi lượng giá → hiện cái nào cũng mơ hồ. Tab xem để KTV tự chọn đúng buổi cần đọc.

**③ Thay dải cảnh báo chống chỉ định bằng một CON TRỎ.** Chỉ khi buổi thuộc gói liệu trình, hiện ghi chú nhỏ:
> *"Gói này được chỉ định từ chuyên viên — vui lòng xem nội dung buổi lượng giá"* **[ Xem ngay → ]**

Nút nhảy thẳng sang tab lịch sử điều trị **ngay trên màn hình đó**, không rời trang. Không nhân bản dữ liệu ra bàn làm việc.

**④ Nội dung nhập — CHỈ CÒN 3 KHỐI:** **VAS** (trước/sau) · **Kỹ thuật** · **Ghi chú**.

> ❌ **ĐÃ BỎ:** *Vùng điều trị* · *Phản ứng của khách* · *Bài tập về nhà* (bỏ luôn cả bảng danh mục bài tập + link video đã cân nhắc — không đáng 0.5–1 ngày ở giai đoạn nghẽn) · *Kế hoạch trị liệu hiện trên bàn* · *Buổi trước hiện trên bàn*.

#### ⭐ Nhật ký thao tác — thay cho "kỹ thuật tick sẵn"

> 🔴 **Sửa lỗi thiết kế:** bản trước ghi *"kỹ thuật + vùng điều trị được tick sẵn theo kế hoạch"*. **Không có nguồn nào để tick sẵn** — bàn lượng giá đã rút xuống còn ROM/MMT/chẩn đoán/chống chỉ định, không còn khối "kỹ thuật đề xuất". Thay bằng cơ chế dưới đây.

KTV **ghi tên bước ngay lúc làm**, không nhớ lại lúc cuối buổi:

```
▸ ĐANG LÀM · Trần Văn A · đã 12 phút
   [ + Ghi bước ]      nhập tay: "Xoa bóp mô mềm vai trái"
   [ Đưa vào máy ▾ ]   chọn máy + số phút

   Nhật ký thao tác:
    09:05  Xoa bóp mô mềm vai trái
    09:20  Kéo giãn cột sống · Máy DTS-01 · 20'   ← TỰ SINH
    09:40  — máy xong —
```

⭐ **Thao tác "Đưa vào máy" TỰ SINH một dòng nhật ký** kèm tên máy + thời lượng — KTV không phải gõ lại. Chỉ bước làm tay mới phải nhập. Tới bước 3, mục Kỹ thuật **đã đầy sẵn**, KTV chỉ xem lại.

**Đánh đổi đã cân nhắc:** bước 2 không còn "0 thao tác", nhưng bước 3 gần như trống. Tổng công sức tương đương, **dữ liệu chính xác hơn hẳn** vì ghi theo thời gian thực.

**Ba bước sau khi chốt:**

| Bước | Nội dung | Thao tác |
|---|---|---|
| 1 · Mở ca | VAS trước | ~10 giây |
| 2 · Đang làm | Ghi bước + nút máy + đồng hồ | Vài dòng ngắn |
| 3 · Kết thúc | Kỹ thuật (đã tự đầy) · VAS sau · ghi chú | ~30 giây |

#### A17c — Cơ chế phục vụ song song trong buổi trị liệu ⚠️ ƯU TIÊN THẤP, CÓ THỂ CẮT

> **Đánh giá mức độ quan trọng:** điểm hội đồng chê là **booking khóa cứng 30 phút** — đã giải quyết trọn vẹn bằng mô hình đặt theo buổi (A1–A4). Song song hóa chỉ là **điểm cộng thêm**. Nếu tới giai đoạn 4 thấy trễ tiến độ, **cắt mục này trước tiên**.
>
> **Cơ chế an toàn khi demo:** tham số `so_khach_song_song` **mặc định = 1** → hệ thống hoạt động y như hiện tại (một khách tại một thời điểm), không ai biết có tính năng này. Chỉ bật lên 2 khi đã test kỹ và muốn thể hiện thêm khi demo.

**Bản chất:** một buổi trị liệu **không liền mạch**, gồm hai loại giai đoạn xen kẽ:
- **Hands-on** (xoa bóp, nắn chỉnh, hướng dẫn tập) → KTV bận hoàn toàn
- **Hands-off** (kéo giãn, siêu âm, điện xung, nhiệt) → **máy chạy, KTV rảnh**

Song song hóa khả thi nhờ khoảng hands-off. Hệ thống chỉ cần biết **khách đang ở giai đoạn nào**.

**Trạng thái con trong buổi** — lưu ở `phien_lam_viec.giai_doan_hien_tai` (**không** đụng `trang_thai` của `cuoc_hen`):

```
dang_thuc_hien  ──[Đưa vào máy]──▶  dang_tren_may
                                          │ hết giờ (tự động)
                                          ▼
                                      cho_ktv          ⭐ TRẠNG THÁI THỨ BA
                                          │
                    ┌─────────────────────┴──────────────────────┐
              [Quay lại làm]                             [Hoàn thành buổi]
                    │                                             │
                    ▼                                             ▼
              dang_thuc_hien                                  form bước 3
```

⭐ **`cho_ktv` (máy đã xong, KTV chưa quay lại) là trạng thái bản kế hoạch trước còn thiếu** — và chính nó là nguồn của mọi lúng túng. Có nó rồi thì các quy tắc gọn hẳn, không phải tính ngưỡng phút:

| Quy tắc | Bản cũ (tính ngưỡng) | Bản chốt |
|---|---|---|
| Chặn gọi khách mới | "còn >15' cho gọi · <5' cảnh báo · xong thì chặn" | **Có khách ở `cho_ktv` → chặn.** Hết |
| Cảnh báo sắp xong | Còn 3 phút → chuông | Giữ nguyên |
| Bỏ quên khách | Không có | **Tự cưỡng chế** — có khách ở `cho_ktv` thì KTV không gọi được ai mới, buộc phải xử lý. Không báo cho ai khác |

**Chống xung đột tài nguyên MÁY MÓC (không chỉ nhân sự):**
Câu hỏi thật: *2 khách cùng cần máy kéo giãn mà trung tâm chỉ có 1 máy thì sao?* → Khi bấm "Đưa vào máy", thêm ô **chọn máy** từ danh sách thiết bị; máy đang có người dùng bị **mờ đi, không chọn được**; hệ thống đánh dấu máy bận tới thời điểm dự kiến xong.

**Tận dụng sẵn có:** bảng `thiet_bi` (5 dòng) và trang `ManageEquipment` của Admin **đã tồn tại** — chỉ cần thêm trạng thái đang-sử-dụng, **không thêm bảng mới**, không xây hệ thống đặt chỗ máy phức tạp. Chi phí ~nửa ngày.

**Nút theo từng trạng thái — đặc tả chốt:**
```
▸ Đang thực hiện
    [ + Ghi bước ]           ghi nhật ký thao tác làm tay
    [ Đưa vào máy ▾ ]        chọn máy (máy bận bị MỜ) + số phút
    [ Hoàn thành buổi ]

▸ Đang trên máy              ⏱ còn 12:45   → KTV RẢNH, gọi được khách khác
    [ Kết thúc máy sớm ]     khách kêu đau, dừng giữa chừng
    [ Đổi máy ▾ ]            nhả máy cũ, giữ máy mới — TUẦN TỰ, không giữ 2 máy
    ( tự chuyển sang "Chờ KTV" khi hết giờ · còn 3 phút thì chuông + nhấp nháy )

▸ Chờ KTV                    ⏰ khách đã xong máy 4 phút
    [ Quay lại làm ]
    [ Hoàn thành buổi ]      ⭐ KHÔNG bắt quay lại trước khi hoàn thành
```

⭐ **Không bắt "Quay lại làm" trước khi hoàn thành** — rất nhiều buổi kết thúc bằng máy (kéo giãn xong là khách về). Bắt bấm thêm một nút vô nghĩa chỉ để thỏa mãn máy trạng thái là thiết kế tồi.

#### 🔴 Vòng đời chiếm dụng máy — chỗ dễ sai nhất

**Máy KHÔNG nhả đúng lúc hết đồng hồ.** Hết 20 phút thì máy dừng chạy, nhưng **khách vẫn nằm trên máy** tới khi KTV quay lại tháo đai và đỡ xuống (thường 1–3 phút). Nhả đúng phút 20 thì KTV khác chọn máy đó rồi đi tới nơi thấy khách cũ còn nằm — va chạm thật, và rơi đúng vào lúc KTV bận nhất.

```
0 – 20'    máy chạy                  🔒 khóa
20'        sang "Chờ KTV"            🔒 VẪN khóa — khách còn trên máy
20 – 25'   ân hạn, hiện đếm ngược    "tự giải phóng sau 4:12"
25'        TỰ NHẢ → hiển thị "Sẵn sàng"
```

**Nhả NGAY** khi KTV bấm bất kỳ nút nào: Quay lại làm · Hoàn thành · Kết thúc sớm · Đổi máy.

> Ân hạn **5 phút** (không phải 15 như bản trước) — trung tâm chỉ có 5 máy, khóa một cái 15 phút vì KTV quên bấm là quá đắt.

> ❌ **KHÔNG báo cho Lễ tân khi khách nằm ở `cho_ktv` quá lâu.** Lễ tân không có quyền, không có mặt trong phòng trị liệu, và không thao tác được gì với thiết bị — báo cho họ là **nhiễu, không phải hành động** (đúng lý do đã cắt "cảnh báo leo thang khi chờ > 15 phút" ở mục Tự gán).
> **Cơ chế ép KTV quay lại đã có sẵn và mạnh hơn thông báo:** KTV **bị chặn không gọi được khách mới** khi có khách ở `cho_ktv` — muốn nhận việc tiếp thì buộc phải xử lý khách đang chờ. Cộng với chuông trước 3 phút và thẻ nhấp nháy, **người duy nhất có thể hành động đã biết rồi**.

> 📏 **Nguyên tắc chung, áp cho mọi cảnh báo trong hệ thống:** *chỉ cảnh báo cho người có thể hành động*. Cảnh báo gửi tới người không có lever chỉ tạo nhiễu và làm họ học cách phớt lờ mọi cảnh báo khác.

#### ⚠️ Tách `trang_thai` (vòng đời) khỏi chiếm dụng tức thời
Enum hiện có là `['san_sang','dang_su_dung','dang_bao_tri','hong']` (`admin.schema.ts:47`). **KHÔNG được để hệ thống tự ghi `dang_su_dung` vào `trang_thai`**: lúc nhả sẽ phải ghi lại `san_sang`, và nếu trong lúc khách đang nằm mà Admin đánh dấu máy `dang_bao_tri` thì thao tác tự nhả **ghi đè mất** → máy hỏng quay lại danh sách chọn được.

| | Ai quản | Giá trị |
|---|---|---|
| `trang_thai` — **vòng đời** | **Admin** | `san_sang` · `dang_bao_tri` · `hong` |
| `dang_su_dung_boi` + `ban_den_luc` — **chiếm dụng** | **Hệ thống** | FK `cuoc_hen` / NULL |

`dang_su_dung` **giữ trong enum nhưng ngừng ghi mới**; màn hình ManageEquipment **suy ra để hiển thị** (`dang_su_dung_boi IS NOT NULL` → nhãn "Đang sử dụng"). Admin vẫn thấy đúng thứ cần thấy, không có rủi ro ghi đè.

**Quy tắc chọn máy ở bàn trị liệu:**
```
Chọn được ⟺ trang_thai = 'san_sang'  VÀ  dang_su_dung_boi IS NULL

dang_bao_tri / hong      → KHÔNG hiện trong danh sách (hoặc xám kèm lý do)
san_sang nhưng bị chiếm  → mờ + đếm ngược "còn 4:12"
```

> ❌ **ĐÃ THAY THẾ:** bảng ngưỡng "còn >15' / <5' / đã xong" — nay chỉ cần **có khách ở `cho_ktv` thì chặn** (xem bảng quy tắc phía trên). Đơn giản và bền hơn.
> ❌ **ĐÃ BỎ:** *"điền sẵn theo kế hoạch — kỹ thuật + vùng điều trị tick sẵn"* — không có nguồn để tick sẵn, thay bằng **Nhật ký thao tác** ở A17b-CHỐT. Vùng điều trị và phản ứng khách cũng đã bỏ khỏi form.

**Giao diện nhiều khách song song — một khách mở rộng, còn lại thu gọn:**
```
┌─ ĐANG PHỤC VỤ (2/2) ────────────────────────┐
│ 🔵 Trần Văn A                                │
│    Kéo giãn cột sống · ⏱ còn 12:45          │
│                              [ Quay lại làm ]│
├─────────────────────────────────────────────┤
│ 🟢 Lê Thị B                    ← đang thao tác│
│    Xoa bóp mô mềm · đã 8 phút                │
│    [ Đưa vào máy ]  [ Hoàn thành buổi ]      │
└─────────────────────────────────────────────┘
```
Bấm "Quay lại làm" ở A → A mở rộng, B thu gọn. Chỉ một khách chiếm màn hình tại một thời điểm.

> ❌ **ĐÃ BỎ khỏi bàn trị liệu: toàn bộ khối "Kế hoạch trị liệu" (cấu trúc 2 tầng)** — chuyển hết sang **tab xem** theo A17b-CHỐT mục ②. Trên bàn làm việc chỉ còn **con trỏ một dòng** *"Gói này được chỉ định từ chuyên viên — [Xem ngay →]"* khi buổi thuộc gói liệu trình.
> `goi_dich_vu.muc_tieu` / `quy_trinh` vẫn **không** hiện ở bàn trị liệu (giữ nguyên kết luận cũ) — chỗ đúng của chúng là hồ sơ điều trị phía khách hàng (A18).

#### Ánh xạ A18 — Hồ sơ điều trị khách hàng (nguồn ý tưởng, KHÔNG phải cấu trúc nav cuối cùng)

| Tab trong mẫu | OfficeCare | Xử lý |
|---|---|---|
| Header thông tin khách + ảnh | Tương đương | ✅ Lấy |
| Tổng quan | Thông tin khách, gói đang dùng, tiến độ buổi | ✅ Lấy — xem A18-CHỐT để đổi nội dung hero |
| Lịch sử khám (bảng: ngày · chẩn đoán · bác sĩ · chi phí) | Nội dung đã có, **KHÔNG phải bảng phẳng** | ✅ **Đã đúng** — chính là category tab "Khám lâm sàng" hiện có, đổi nhãn "Lượng giá" |
| **Kết quả xét nghiệm** | ❌ Không có xét nghiệm | ✅ **Đã đúng** — chính là `VasTrendSparkline.tsx` đã có, xem A18-CHỐT để nâng thành hình ảnh chủ đạo |
| **Đơn thuốc** | ❌ Không kê thuốc | ❌ Không áp dụng |
| **Hình ảnh y tế · X-quang, MRI** | Không lưu ảnh, không có cột riêng | ❌ Không áp dụng — cột `ket_qua_can_lam_sang` **đã cắt**; nội dung nằm sẵn trong `chan_doan` của buổi lượng giá |
| Kế hoạch điều trị | Đổi tên | 🔄 **Kế hoạch trị liệu**: gói đang dùng, buổi còn lại, hạn sử dụng, **mục tiêu + quy trình của gói**. ⭐ Đây là **chỗ duy nhất** `goi_dich_vu.muc_tieu`/`quy_trinh` được hiển thị — **KHÔNG hiện ở bàn lượng giá, cũng KHÔNG hiện ở bàn trị liệu** |

> ⚠️ **ĐÍNH CHÍNH:** bản trước đề xuất "Bổ sung tab Buổi trị liệu" và "Tiến triển VAS" như 2 tab điều hướng phẳng riêng biệt — **SAI**, đi ngược kiến trúc đã có và đúng (xem A18-CHỐT). Đây từng chỉ là bảng đối chiếu với các tab của MediPlus, không phải quyết định UI cuối.

#### A18-CHỐT — Hồ sơ điều trị: GIỮ kiến trúc hiện có, đổi bản sắc thị giác ⭐

**Kiến trúc thông tin hiện tại ĐÃ ĐÚNG, không cần đập đi xây lại:** `RecordTabs.tsx` — 3 tab theo loại (Gói liệu trình / Dịch vụ lẻ / Khám lâm sàng) → mỗi tab là **timeline các buổi**, mỗi buổi **tự chứa đầy đủ nội dung của chính nó** (`SessionTimelineItem.tsx` render `TreatmentSessionDetailBody.tsx` trực tiếp, không phải bảng phẳng + popup rời). Đây chính xác là điều "bấm vào lịch sử nào thì hiện nội dung của buổi đó" mà người dùng mô tả — **giữ nguyên mô hình này**.

**Vấn đề thật hội đồng sẽ thấy: KHÔNG PHẢI cấu trúc, mà là NGÔN NGỮ THỊ GIÁC không giống PHCN.** Một phòng khám PHCN bán một câu chuyện duy nhất — *bạn đang tốt lên*. Mọi chỉ số hero, icon, câu chữ phải phục vụ câu chuyện đó thay vì liệt kê dữ kiện hành chính.

🔴 **Bỏ "Điểm uy tín" khỏi header khách hàng** (`RecordHeader.tsx:89-95`) — đây là chỉ số nội bộ đo rủi ro no-show (`getReputationTier`), công cụ quản trị của phòng khám, **không phải thứ khách cần biết về sự hồi phục của chính họ**. Đặt nó làm điểm nhấn hero khiến trang cảm giác như bảng chấm điểm khách hàng thân thiết, sai hoàn toàn tinh thần PHCN. Ba ô KPI (Buổi hoàn thành / Liệu trình đang điều trị / Buổi gần nhất) cũng thuần đếm hành chính — thay 1 ô bằng **"Mức đau đã giảm X%"** tính từ VAS đầu so với VAS gần nhất, đúng câu chuyện phục hồi.

⭐ **Nâng `VasTrendSparkline.tsx` thành hình ảnh chủ đạo** — vẽ lại thành dạng **"đường hành trình"**: mỗi buổi là một mốc trên tuyến ngang, buổi hiện tại nổi bật, buổi tương lai còn mờ.

> 🔴 **Chốt phạm vi dữ liệu — KHÔNG gộp VAS 3 nguồn thành 1 biểu đồ toàn trang.** Ba nguồn VAS bản chất khác nhau: VAS buổi Lượng giá là **một điểm chụp nhanh** lúc vào, không phải chuỗi; VAS buổi trong **một gói liệu trình cụ thể** là chuỗi liên tục thật (cùng một vấn đề, cùng một phác đồ) — đây là dữ liệu DUY NHẤT đáng vẽ xu hướng; VAS dịch vụ lẻ là từng lần độc lập, gộp thành đường là **vô nghĩa lâm sàng** (khách massage vai hôm nay, massage lưng tuần sau, nối VAS hai buổi đó thành một đường sai hoàn toàn). Khách có 2 gói liệu trình cho 2 vấn đề khác nhau thì càng không được nối chung.
> → **Hành trình phục hồi hero chỉ thuộc về ĐÚNG MỘT gói liệu trình đang `dang_dieu_tri`** (nếu có nhiều gói active, ưu tiên gói gần cập nhật nhất, có nút chuyển gói). Không có gói nào active (chỉ có lẻ/lượng giá) → **không vẽ biểu đồ hero giả**, thay bằng khối tóm tắt đơn giản (số buổi đã làm, buổi gần nhất). VAS dịch vụ lẻ **chỉ hiện trước/sau trong chính buổi đó**, không có biểu đồ xu hướng riêng.

Đặt ngay dưới header, trước khi vào 3 tab.

**Đổi icon ở các điểm nhấn tiến độ** sang ngôn ngữ vận động (dáng đi, tầm vận động khớp) thay cho check-mark/calendar hành chính — chỉ ở điểm nhấn, không đổi tràn lan.

⭐ **"Đặt lịch buổi tiếp theo" phải là hành động CHÍNH của mỗi gói đang điều trị** — hiện ngay trên `PackageCard.tsx` ở trạng thái thu gọn, không chờ mở rộng mới thấy (`BookNextSessionModal.tsx` đã có, chỉ cần nâng vị trí + độ nổi bật). Khi bị khóa bởi quy tắc đặt lịch tuần tự (`isSessionPaymentSatisfied`), nút phải **nói rõ lý do ngay tại chỗ** ("Cần hoàn thành buổi 4 trước" / "Buổi 4 chưa thanh toán"), không chỉ làm mờ nút.

🔴 **Vá khoảng trống dữ liệu:** `TreatmentSessionDetailBody.tsx` hiện chỉ render `chẩn đoán/ghi chú/chống chỉ định/VAS` — **KHÔNG có chỗ hiển thị "Kỹ thuật đã thực hiện"**, dữ liệu mà A17b-CHỐT (Nhật ký thao tác, `du_lieu_tri_lieu.nhat_ky`) vừa thiết kế. Không vá thì khách hàng không bao giờ thấy KTV đã làm gì cho mình dù dữ liệu đã ghi đầy đủ. **Mở rộng component này thêm 1 khối "Kỹ thuật đã thực hiện" dạng chip**, đọc từ JSONB mới.

**Không thêm tab "Hóa đơn & thanh toán" tách rời** — `InvoiceSnippet.tsx` đã nhúng đúng ngữ cảnh trong từng `PackageCard`/`ExamHistoryCard`. Muốn xem toàn bộ hóa đơn thì đã có ở trang riêng của khách, không cần nhân bản ở đây.

**Tái dùng bắt buộc:** nội dung từng buổi trong mọi tab phải render qua `frontend/src/components/TreatmentSessionDetailBody.tsx` (đã chuẩn hóa, đang phục vụ 6 vị trí ở 3 actor) — **mở rộng** component này (thêm khối Kỹ thuật), **không viết lại**.

**Nguyên tắc thực thi — làm một lượt, không tách:**
Màn hình bàn lượng giá dù sao cũng phải sửa nặng ở giai đoạn 4 để thêm phiếu lượng giá PHCN (A11). Vì vậy **tái cấu trúc giao diện + thêm nội dung mới phải gộp làm cùng lúc**, tránh đụng lại cùng một file hai lần. Hồ sơ điều trị cũng cần hiển thị dữ liệu lượng giá mới (ROM, MMT, dấu hiệu cảnh báo) nên gộp vào cùng giai đoạn.

**Phạm vi A17 — Bàn lượng giá / Bàn trị liệu:**
- `frontend/src/pages/ClinicalAssessment/index.tsx` (~1235 dòng) — dùng chung cho cả Chuyên viên VLTL và KTV, phân nhánh bằng cờ vai trò; gồm 2 tab (bàn làm việc / lịch sử hồ sơ), bố cục 2 cột, banner "buổi gần nhất liên quan", đồng hồ đếm ngược
- Các thành phần phụ trợ đang dùng: `VasSlider`, `getVasDescription` (nội bộ file), `StaffAvatar`, `PlanColumn`, `VisitColumn`, `PlanDetailModal`, `VisitDetailModal` trong `frontend/src/pages/DoctorMedicalRecords/components/`

**Phạm vi A18 — Hồ sơ điều trị khách hàng:**
- `frontend/src/features/customer/pages/CustomerMedicalRecord/` — các tab gói liệu trình / dịch vụ lẻ / lượng giá, cùng `SessionTimelineItem.tsx`, `SingleTreatmentCard.tsx`, `InvoiceSnippet`, `SessionRatingControl`
- **Tái dùng bắt buộc:** `frontend/src/components/TreatmentSessionDetailBody.tsx` — component chung đã chuẩn hóa, đang phục vụ 6 vị trí ở cả 3 actor. Bản mẫu mới nên mở rộng component này thay vì viết lại, để không phá vỡ tính đồng bộ giữa các màn hình
- Liên quan (nên đồng bộ theo): `frontend/src/features/admin/components/PatientEmrDetail.tsx` (Admin xem hồ sơ khách)

## B. LÀM THÊM (chưa từng có)

| # | Hạng mục | Giải quyết |
|---|---|---|
| B1 | **Hàng đợi** cho Chuyên viên/KTV — số thứ tự, tìm kiếm theo tên/mã/SĐT, xem hồ sơ trước khi gọi. **Hợp nhất thành sidebar của màn hình A17**, không làm màn hình riêng | ✅ Chê #2 |
| B2 | Nút **"Gọi vào khám"** + thông báo cho Lễ tân ra mời khách | ✅ Chê #2 |
| B3 | Nút **"Bắt đầu khám"** tách riêng (đồng hồ chỉ chạy khi khách đã vào phòng) | ✅ Chê #3 |
| B4 | Nút **"Chuyển tuyến"** — popup nhập **hạn quay lại** + [Xác nhận]/[Hủy], **KHÔNG chọn loại chụp**, **KHÔNG validation**, **KHÔNG phiếu in** | ✅ Chê #1 |
| B5 | **Trạng thái `cho_tai_luong_gia`** — **giải phóng chuyên viên ngay**; hiện hạn ở chi tiết lịch + email nhắc; **quá hạn thì ca tự hoàn thành** | ✅ Chê #1 |
| B6 | Nút **"Check-in ngay"** trên lịch đang `chờ tái lượng giá`; khách vào hàng đợi **ưu tiên đầu** với chuyên viên cũ | ✅ Chê #1 |
| B7 | **Khách quay lại dùng CHÍNH bàn lượng giá cũ** — không màn hình riêng: chuyên viên nhìn phim khách mang tới, nhập nốt ROM/chẩn đoán/chống chỉ định còn trống rồi bấm Hoàn thành | ✅ Chê #1 |
| B7d | ⭐ **Nhật ký thao tác** ở bàn trị liệu — KTV ghi bước lúc đang làm; "Đưa vào máy" **tự sinh một mục** kèm tên máy + thời lượng | ✅ Chê #1 |
| B7e | **Tab xem** trên bàn trị liệu — các buổi lượng giá · lịch sử dịch vụ đã dùng · các buổi trị liệu trước; + **con trỏ một dòng** dẫn sang tab khi buổi thuộc gói | ✅ Chê #1 |
| B7b | **Khối "Gói đã chỉ định"** trên chi tiết lịch hẹn sau khi hoàn thành + nút **"Thanh toán gói này"** dẫn sang màn hình thanh toán | ✅ Chê #1 |
| ~~B7c~~ | ~~Nhánh "Vượt khả năng trung tâm" có nút riêng + phiếu in~~ | ❌ **KHÔNG cần nút riêng** — chọn **"Không chỉ định"** trong tab Chỉ định + ghi lý do vào kết luận → bấm nút Hoàn thành. **Bỏ phiếu khuyến cáo in được** |
| B8 | **Chống spam**: giới hạn lịch chờ + đếm no-show + leo thang buộc thanh toán online | — |
| B9 | **Hiển thị mức độ đông** theo khung giờ khi đặt lịch | — |
| B10 | **Tự động đánh dấu không đến** cuối mỗi buổi | ✅ **Xong 07/08/2026, làm sớm hơn lịch trình** (Giai đoạn 3) vì phát sinh trực tiếp từ câu hỏi "lịch Chưa đến bị hủy/không đến thì đi đâu". `ReceptionistRepository::sweepNoShowAppointments()` — quét lười (cùng mẫu `packageExpirySweep.middleware.ts`, throttle 60s/request) qua `middlewares/noShowSweep.middleware.ts`, đăng ký global ở `index.ts`. Điều kiện: `da_xac_nhan` + buổi đã qua giờ nhận khách + đệm `NO_SHOW_SWEEP_BUFFER_MINUTES=30` (`domain/capacity.ts`). Gọi lại NGUYÊN VẸN `updateAppointmentStatus('khong_den', ...)` — không chép lại `resolveNoShowOutcome`/đếm buổi, nên hệ quả (phạt uy tín, trừ buổi gói Nhóm B...) giống hệt Lễ tân bấm tay. Đã verify công thức tính mốc giờ bằng SQL trực tiếp trên DB dev (đúng 12:30/20:00 theo giờ VN). **Cố ý CHƯA làm phần C9** (bỏ nút "Không đến" thủ công của Lễ tân) — giữ lại làm lưới an toàn song song với quét tự động, vì gỡ hẳn đường thủ công là quyết định rủi ro riêng (không có đường sửa tay nếu sweep có ca biên chưa lường hết), cần hỏi lại trước khi làm. |
| B11 | Nút **"Gọi không có mặt"** (2 lần thì kết thúc lượt) | — |
| B12 | **Thanh toán online cho khách** — mở rộng PayOS đã có | — |
| B13 | **Mã giảm giá có điều kiện lọc chi tiết** — thêm **3 cột**: `tu_dong_ap_dung`, `kenh_ap_dung`, `loai_goi_ap_dung` (đã cắt `goi_dich_vu_ap_dung`); logic tự động chọn mã có lợi nhất; màn hình Admin quản lý voucher cập nhật theo | — |
| B14 | **Thống kê phân bổ tải nhân sự** — số ca đã làm hôm nay của từng người, hiện ở màn hình hàng đợi + dashboard Quản lý (thay cho thông báo C10 đã gỡ) | — |
| B18 | ⭐ **Tự gán khách khi nhân sự rảnh hoàn toàn** — vừa xong ca và không còn khách nào → hệ thống gán khách tiếp theo (ưu tiên khách chọn đích danh, rồi tới người chờ lâu nhất), hiện nổi bật kèm nút "Gọi vào"; không bấm trong 5 phút thì trả về hàng đợi chung. **Rảnh tạm (khách đang nằm máy) thì KHÔNG tự gán** — KTV tự quyết | — |
| B18b | **Cảnh báo chờ lâu cho Lễ tân** — khách chờ > 25 phút thì báo để Lễ tân giải thích với khách (thông tin, không phải yêu cầu hành động) | — |
| B19 | **Hiển thị phòng khi gọi khách** — *"Mời [tên] vào [phòng] — [nhân sự]"*; khách đã chọn nhân sự thì **biết phòng ngay từ lúc đặt lịch** (suy từ `lich_truc_nhan_su.phong_id`) | — |
| B20 | ⭐ **Lớp 2 — kiểm tra khả năng phục vụ tại thời điểm check-in**: công thức dự-kiến-xong ≤ MIN(tan ca, đóng cửa) + **đèn 3 màu** + modal 3 lựa chọn (đổi nhân sự / dời buổi / vẫn tiếp nhận có ghi lý do). Một công thức cho cả 3 tình huống, không viết 3 nhánh | ✅ Chê #3 |
| B20b | **Hiện giờ trực THẬT của nhân sự lúc đặt lịch** (*"nhận khách 12:00–16:00"*) + **giờ đến muộn nhất** trong email nhắc | ✅ Chê #3 — 🔶 Phần "giờ trực thật lúc đặt lịch" đã có sẵn caption (`Trực HH:MM-HH:MM`) ở `WalkInBookingModal.tsx`; 07/08/2026 nâng cấp thành **cảnh báo cam nổi bật + viền thẻ đổi màu** khi nhân sự tan ca SỚM HƠN mốc kết thúc buổi (vd trực tới 16h nhưng buổi chiều tới 19h30) — chỉ là nhãn thông tin tĩnh, **KHÔNG kèm** công thức Lớp 2 đầy đủ (đèn 3 màu tại quầy check-in, modal 3 lựa chọn, giờ đến muộn nhất theo dịch vụ) — phần đó vẫn thuộc B20 full, chưa làm, để Giai đoạn 3. Email nhắc chưa làm. |
| B20c | **So sánh thời gian chờ ở quầy** — *"chọn Tùng chờ 45 phút · chọn Bất kỳ chờ ~10 phút"*, cho khách đổi ý tại chỗ | — |
| B21 | ⭐ **Widget "Sức khỏe ca"** cho Lễ tân — công suất còn lại vs nhu cầu hàng đợi, chuyển đỏ khi vượt | ✅ Chê #3 |
| B22 | **Danh sách "Chưa đến — hạn đến muộn nhất"** cho Lễ tân (thay cho cảnh báo C6 đã xóa) — gọi nhắc chủ động thay vì chờ khách tới rồi từ chối | — |
| B23 | **Dự kiến gọi vào lúc mấy giờ** trong hàng đợi — nội bộ hiện **giờ cụ thể**, nói với khách hiện **khoảng** · thẻ nhân sự cảnh báo vàng khi ca sắp gọi vượt giờ tan ca · ⭐ **tính từ thời gian ĐÃ TRÔI THỰC TẾ** (`NOW() − thoi_gian_bat_dau`), **không giả định ca kết thúc đúng hạn** — ca chạy quá giờ phải đẩy dự báo của cả hàng đợi phía sau | ✅ Chê #2 |
| B15 | **Đổi nhân sự cho một ca** — Quản lý/Admin, ca chưa bắt đầu hoặc đang thực hiện, kiểm tra ngân sách + số bàn song song của người nhận. ⚠️ Cùng lớp rủi ro xung đột với "Đổi buổi" (nhân sự cũ có thể đang bấm "Gọi vào" đúng lúc Admin đổi người) — áp **cùng khóa lạc quan theo `trang_thai`** đã đặc tả ở mục Hủy & Hoàn tiền, không cần cơ chế riêng | — |
| B16 | **Nhắc hẹn theo buổi** — email 19h tối trước (buổi sáng) / 8h sáng cùng ngày (buổi chiều), kèm **gợi ý khung giờ vắng** và cảnh báo chưa thanh toán | — |
| ~~B17~~ | ~~Màn hình "Gọi nhắc hẹn" cho Lễ tân~~ | ❌ **ĐÃ CẮT** — để thủ công, xem lý do ở mục Nhắc hẹn |
| B24 | ⚠️ **CHƯA CHỐT** — Check-in từ xa cho khách đã thanh toán (ưu tiên hàng đợi thật) — xem đặc tả đầy đủ bên dưới | — |

### B24 — Check-in từ xa cho khách đã thanh toán ⚠️ CHƯA CHỐT, hỏi lại khi làm tới Phase 3/5

**Vấn đề gốc:** hàng đợi hiện sắp theo `thoi_gian_checkin` thuần túy — khách đã thanh toán trước không có lợi ích gì hơn khách trả tại quầy ngoài việc không phải xếp hàng thu ngân. Với định vị "dịch vụ cho dân văn phòng", đây là điểm cọ xát thật.

**Đã cân nhắc và loại bỏ 2 phương án trung gian trước khi chốt cơ chế dưới:**
- ❌ Khóa vị trí tại **giờ khách tự khai sẽ đến** (không phải giờ bấm nút) — công bằng tuyệt đối nhưng vô giá trị: khách check-in từ xa lúc 10h20 hứa đến 10h50 vẫn thua khách check-in tại quầy thật lúc 10h25, không khác gì không bấm gì cả.
- ❌ Chặn nhân sự nhận ca dài nếu ca đó "có thể" đụng giờ của khách đã giữ chỗ — tái tạo đúng kiểu khóa cứng slot theo giờ mà cả kế hoạch đang thoát ra, và ép nhân sự ngồi không chờ 1 khách chưa chắc tới đúng giờ.

**Cơ chế đã chốt (nếu triển khai):**
1. Khách đã thanh toán (`trang_thai_thanh_toan = da_thanh_toan`) bấm "Check-in từ xa" → ghi `thoi_gian_checkin` = **đúng giờ bấm thật**, không giả lập tương lai → xếp đúng vị trí ưu tiên trong hàng riêng (đích danh) hoặc hàng chung — thắng cả khách check-in tại quầy sau đó. Đây là đặc quyền thật, đánh đổi có chủ đích với khách đang ngồi chờ tại chỗ.
2. Tính mốc **"sớm nhất có thể gọi"** = `thoi_gian_checkin + đệm cấu hình` (tham số hệ thống, ví dụ 30 phút — không bắt khách tự khai giờ đến).
3. Nhân sự chỉ được gọi khách này khi **CẢ HAI** đúng: đã rảnh **và** đã tới mốc trên. Nếu rảnh sớm hơn mốc → **không chặn, không ép ngồi không** — nhân sự gọi tiếp người khác phù hợp trong hàng đợi; khách giữ chỗ không mất gì, chỉ đợi tới lần nhân sự rảnh kế tiếp.
4. Tới mốc + nhân sự rảnh → gọi thật. Có mặt → vào bình thường. Không có mặt → dùng nguyên cơ chế **"Gọi không có mặt" (B11)**: lần 1 đẩy cuối hàng (không phạt), lần 2 → `khong_den` (mất tiền vì đã thanh toán + cộng no-show) — không cần luật phạt riêng nào mới.
5. Khách có nút **"Cập nhật giờ tới"** — dời mốc xa hơn nếu biết sẽ trễ (kẹt xe, hỏng xe...), không bị phạt gì miễn làm trước khi bị gọi.
6. Khi nhân sự/Lễ tân sắp nhận 1 ca dài có thể đẩy khách đã giữ chỗ đợi lâu hơn dự kiến → **cảnh báo mềm, không chặn cứng** (đúng nguyên tắc "khách/nhân sự quyết, hệ thống không chặn cứng" đã áp dụng ở B20).
7. Công thức dự báo Lớp 2 (B20) cần mở rộng thêm 1 số hạng: nếu nhân sự đang có khách đã giữ chỗ đứng đầu hàng, "thời điểm rảnh cho khách MỚI" = giờ rảnh ca hiện tại + thời lượng dịch vụ của người giữ chỗ + đệm.

**Không cần thêm cột DB nào** ngoài 1 tham số cấu hình "đệm sớm-nhất-có-thể-gọi" — mọi thứ khác tái dùng `thoi_gian_checkin`, B11, B23.

**Ưu điểm so với mô hình khóa giờ cũ (đã bị hội đồng đánh gãy):** không khóa cứng bất kỳ khung giờ nào cho bất kỳ ai — khách đã thanh toán thích lúc nào thì check-in trước rồi tới, không bị gò khung giờ; nhân sự vẫn giữ toàn quyền chọn khách muốn nhận tiếp theo (mô hình kéo nguyên vẹn, không ai bị ép chờ hay ép nhận).

**Phụ thuộc:** Hàng đợi + "Gọi không có mặt" (Phase 3) và thanh toán online cho khách hàng tự làm (B12, hiện Phase 5) phải xong trước — không làm sớm hơn được.

**Điểm còn mở, hỏi lại khi triển khai:**
- Phạm vi "đã thanh toán" đủ điều kiện: chỉ khách tự trả online qua web, hay tính luôn buổi thuộc gói đã trả 100% (dù có thể trả tại quầy)?
- Số phút đệm mặc định cho mốc "sớm nhất có thể gọi".

## C. XÓA / GỠ BỎ

| # | Hạng mục | Vì sao |
|---|---|---|
| C1 | **OTP xác nhận đặt lịch** | Đã bắt buộc đăng nhập, email xác thực từ lúc đăng ký |
| C2 | **Bảng giữ chỗ tạm** (`tam_giu_cho`) | Không còn tranh chấp slot |
| C3 | **Chọn giờ cụ thể** ở mọi màn hình đặt lịch | Đổi sang chọn buổi |
| C4 | Thông báo **"gọi điện sau 10 phút chưa xác nhận"** | Không còn trạng thái chưa xác nhận |
| C5 | Thông báo **"khám xong cần thanh toán"** | Đã thu trước khi khám |
| C6 | Thông báo **"quá giờ chưa check-in"** | Không còn giờ hẹn cố định |
| C7 | **Email nhắc lịch theo giờ** | Đổi sang nhắc theo buổi — xem mục "Nhắc hẹn trong mô hình theo buổi" |
| C8 | **Trả góp 50%** | Ẩn khỏi giao diện (giữ code, không xóa) |
| C9 | Nút **đổi trạng thái "không đến"** thủ công của Lễ tân | Hệ thống tự làm |
| C10 | **Thông báo "có N lịch chưa gán nhân sự"** của Quản lý/Admin (mascot widget) | Lịch không gán nhân sự giờ là **trạng thái bình thường có chủ đích**, không phải thiếu sót → báo động vô nghĩa. Thay bằng **thống kê phân bổ tải** trong dashboard |
| C11 | **Ngừng dùng** `cuoc_hen.so_dien_thoai`, `hoa_don.ti_le_giam_gia_goi`, `hoa_don.phi_kham_ap_dung` | Xem phần khảo sát dữ liệu — ngừng ghi mới, giữ cột đọc lịch sử, xóa hẳn sau bảo vệ. ⚠️ **Khai tử `ti_le_giam_gia_goi` BẮT BUỘC đi kèm A15c** — nếu không, gói bán qua voucher sẽ bị phạt trên giá gốc chưa giảm |
| C13 | **Ô Admin gõ tay `phi_phat`** lúc hủy gói | Không có trần/mặc định/đối chiếu chính sách → thay bằng snapshot từ hóa đơn (A15b) |
| C14 | **Gate 8 tiếng** ở `cancelCustomerAppointment` | Thay bằng cửa sổ 60 phút kể từ lúc đặt (A14) — mô hình theo buổi không còn "giờ hẹn" để đếm ngược |
| C15 | **`sessionStorage: booking_temp_hold_id`** (`useBookingState.ts:27`, `Booking.tsx:102,286,305`) | Phục vụ `tam_giu_cho` — đã bỏ theo C2 |
| C16 | 🔴 **`localStorage: active_appointment_id`** (`ClinicalAssessment/index.tsx:110,156,207,216,320`) | Lưu **MỘT id đơn lẻ** cho ca đang mở → A17c cho KTV mở **2 bàn**, id thứ hai sẽ **ghi đè** id thứ nhất và bàn đầu biến mất khi F5. Cùng họ với bug "KTV mở 2 bàn" đã sửa: **cache trạng thái quan trọng ở client rồi tin nó**. → **Bỏ hẳn khóa này**, đọc từ `getActiveSessionForStaff` (nay trả về mảng) |
| C12 | **Dọn triệt để `refresh_tokens` và `otp_codes`** | 143 + 46 dòng rác trên 21 khách hàng; cơ chế dọn lười hiện tại không hiệu quả |

> ⚠️ **GIỮ NGUYÊN bảng `otp_codes`** — vẫn phục vụ đăng ký tài khoản và quên mật khẩu.

## D. HOÃN SAU BẢO VỆ

- Xóa hẳn code trả góp 50%
- Hệ thống điểm uy tín đầy đủ (tạm thay bằng đếm no-show)
- Hoàn tiền tự động qua API cổng thanh toán (làm hoàn tại quầy trước)
- Voucher điều kiện nâng cao ngoài phạm vi "tự động cho thanh toán online"
- **"SĐT liên hệ khẩn" ở hồ sơ khách hàng** (nếu phát sinh nhu cầu) — đặt ở cấp khách hàng, dùng chung mọi lịch; **không** quay lại kiểu mỗi lịch một số
- **Số hóa việc gọi nhắc hẹn của Lễ tân** — chỉ có giá trị khi mở rộng nhiều chi nhánh hoặc lượng khách lớn hơn nhiều
- ⭐ **Dùng thời lượng THỰC TẾ trung bình để hiệu chỉnh dự báo hàng đợi** — nếu dịch vụ cấu hình 60 phút nhưng thực tế trung bình 75 thì mọi dự báo lệch có hệ thống. **Dữ liệu đã tự động được ghi sẵn** (`thoi_gian_bat_dau` + `thoi_gian_hoan_thanh`), nên sau bảo vệ làm được ngay không cần chuẩn bị gì
- **Danh mục bài tập về nhà + link video** — đã cắt khỏi phạm vi; nếu làm sau này thì chỉ lưu link, **không host video**
- **Ghi nhận riêng số phút hands-on / hands-off** để chấm công, đánh giá hiệu suất KTV — nằm trong nhóm KPI đã chốt không làm

---

## Thay đổi cơ sở dữ liệu

> ⚠️ **TUYỆT ĐỐI KHÔNG chạy `prisma migrate dev`** — lệnh này gây reset toàn bộ dữ liệu. Dùng `pg_manage_schema` (MCP postgres) hoặc raw SQL, sau đó chạy `npx prisma generate`.

> ⚠️ **Nguyên tắc chống phình bảng:** `cuoc_hen` đã 24 cột. Không nhồi mọi thứ vào đó. Phân loại theo vòng đời dữ liệu — thuộc tính lịch hẹn giữ lại, trạng thái vận hành trong ngày tách bảng riêng, nội dung chuyên môn nhiều trường dùng JSONB.

### Khảo sát dữ liệu thật (đã chạy trên DB dev) 📊

**Bằng chứng cho quyết định dùng JSONB** — `nhat_ky_buoi_dieu_tri` có 33 dòng:
| Cột | Có dữ liệu | Ghi chú |
|---|---|---|
| `chan_doan`, `chong_chi_dinh` | **16/33** | Chỉ buổi khám |
| `vas_truoc`, `vas_sau` | **18/33** | Chỉ buổi trị liệu |

→ Gần **một nửa số cột luôn NULL** tùy loại buổi. Thêm 9 cột rời nữa sẽ khiến tỷ lệ NULL tệ hơn hẳn.

**Cột BỎ ĐƯỢC (đánh dấu ngừng dùng, giữ đọc dữ liệu cũ, xóa hẳn sau bảo vệ):**
| Cột | Dữ liệu hiện tại | Lý do |
|---|---|---|
| `cuoc_hen.so_dien_thoai` | 14/39 | Chỉ để lưu SĐT **khách vãng lai**; giờ bắt buộc đăng nhập → luôn lấy từ hồ sơ khách, không mất dữ liệu. Xem thêm mục "Vì sao không cho nhập SĐT riêng cho từng lịch" |
| `hoa_don.ti_le_giam_gia_goi` | **1/23** khác 0 | Ưu đãi chuyển hết sang voucher có điều kiện (B13) |
| `hoa_don.phi_kham_ap_dung` | 8/23 khác 0 | Buổi lượng giá **bắt buộc thu trước** → không còn cơ chế miễn phí khám khi mua gói |

> Xóa cột ngay sẽ phải sửa nhiều chỗ trong `billing.ts` và repository thanh toán — rủi ro cao, lợi ích thấp. Chỉ **ngừng ghi mới**.

**Giữ lại dù đang trống:** `hoa_don.voucher_id`, `so_tien_giam_voucher` (0/23) — B13 sắp dùng tới.

**Xác nhận bảng bỏ được:** `tam_giu_cho` hiện **0 dòng** — chỉ chứa dữ liệu tạm 5 phút, bỏ không mất gì.

**Dữ liệu rác cần dọn:** `refresh_tokens` **143 dòng** và `otp_codes` **46 dòng** (trong khi chỉ có 21 khách hàng) — cơ chế dọn *lười* hiện tại không hiệu quả, cần dọn triệt để hơn.

**Cân đối cuối:** cột `cuoc_hen` 24 → **27** (+4 mới, −1 bỏ) · `hoa_don` +1 (`ti_le_phat_huy_goi`) · `nhat_ky_buoi_dieu_tri` 8 → **10** (+2 JSONB thay vì +9 rời) · `thiet_bi` +3 · số bảng giữ nguyên **22** (−`tam_giu_cho`, +`phien_lam_viec`). Tăng ròng **3 cột** ở bảng trung tâm. Cột duy nhất phát sinh ngoài dự tính ban đầu là `loai_huy`, đổi lại việc **bỏ được hoàn toàn bảng theo dõi hủy/hoàn tiền riêng** và giữ mô hình hủy ở đúng một cột trạng thái.

### Vì sao KHÔNG cho nhập SĐT riêng cho từng lịch ⚠️
Hai tình huống hay bị gộp làm một, nhưng bản chất khác hẳn:

**a) Khách đổi sim** → chỗ cần sửa là **hồ sơ tài khoản**, không phải từng lịch. Sửa một lịch thì các lịch khác vẫn số cũ → dữ liệu loạn.
→ Màn hình đặt lịch hiện SĐT **chỉ đọc** + dòng nhắc *"Cần đổi số? Vào Cài đặt tài khoản"* kèm link.

**b) Đặt giùm người thân** → **không phải vấn đề số điện thoại, mà là hồ sơ y tế thuộc về ai.** Nếu A đặt cho mẹ mà chỉ đổi SĐT, lịch vẫn gắn tài khoản A → kết luận lượng giá, VAS, chống chỉ định **của mẹ** bị ghi vào hồ sơ **của A**; gói liệu trình mua cho mẹ trừ vào tài khoản A. Đây là lỗi nghiêm trọng về dữ liệu y tế, và **cho phép đổi SĐT càng khiến nó dễ xảy ra** vì trông như hệ thống ngầm cho phép đặt hộ.
→ **Mỗi người được điều trị phải có tài khoản riêng.** Người thân không rành công nghệ thì khách giúp tạo, hoặc gọi Lễ tân tạo nhanh tại quầy (**chức năng đã có sẵn**).

> 💬 **Trả lời hội đồng:** *"Hệ thống bắt buộc đăng nhập vì hồ sơ điều trị phải gắn đúng người được điều trị — không thể dùng chung tài khoản, kể cả trong gia đình."*

**Nhu cầu "để số người nhà nghe máy hộ"** đã giảm mạnh vì mô hình mới bỏ gọi xác nhận sau 10 phút, không còn giờ hẹn cụ thể để nhắc, và thanh toán trước nên không phải gọi đòi tiền. Nếu sau này thật sự cần, giải pháp đúng là thêm **"SĐT liên hệ khẩn" vào hồ sơ khách hàng** (dùng chung mọi lịch), không phải mỗi lịch một số → xếp vào phần **hoãn sau bảo vệ**.

**Thêm vào `cuoc_hen` — 4 cột** (thuộc tính tồn tại suốt đời lịch hẹn, cần lọc/đếm thường xuyên):
- `buoi` — sáng/chiều
- `han_tai_kham` (date, nullable) — hạn quay lại do chuyên viên đặt khi chuyển sang `chờ tái khám`
- `trang_thai_thanh_toan` ⭐ — `chua_thanh_toan` / **`dang_cho_thanh_toan`** / `da_thanh_toan` (**3 giá trị**, đã cắt `mien_phi`)
- `loai_huy` (nullable) ⭐ — `khach_huy_som` (trong cửa sổ 60 phút, **không phạt**) / `khach_huy` / `phong_kham_huy` (**đổi buổi miễn phí, không trừ hạn mức**). Một cột gánh cả hai nhu cầu "hủy sớm có phạt không" và "lỗi thuộc về ai" — không tách 2 cột
> ❌ **Đã cân nhắc rồi loại: `so_lan_doi_buoi`.** Chỉ cần thiết nếu cho khách **tự** đổi buổi. Vì đổi buổi giao cho Lễ tân (con người là hạn mức), không cần đếm → tiết kiệm 1 cột. Lý do đầy đủ ở mục "Đổi buổi" phía trên.

> `dang_cho_thanh_toan` **không tốn cột nào** — chỉ là thêm một giá trị vào `trang_thai_thanh_toan`. Nhưng nó là chốt chặn duy nhất ngăn cuộc đua giữa nút Hủy và webhook PayOS.

> ❌ **Bỏ cột `lich_hen_goc_id`** đã đề xuất trước đó — không cần nữa, vì tái khám **dùng chính lịch hẹn cũ** chứ không tạo lịch mới.

**Thêm trạng thái lâm sàng mới:** **`cho_tai_luong_gia`** (nhãn *"Chờ tái lượng giá"*) — nằm giữa `đang thực hiện` và `hoàn thành`. Chuỗi đầy đủ:
`đã xác nhận → đã check-in → đang thực hiện → [chờ tái lượng giá → đã check-in → đang thực hiện] → hoàn thành`
> Trạng thái tạo mới nên đặt thẳng theo thuật ngữ đã chốt, không dùng `cho_tai_kham`.
> **Quá hạn quay lại → ca TỰ chuyển `hoàn thành`**, không bắt ai nhập gì thêm; khách muốn quay lại phải đặt lịch mới có thu phí.

> ❌ **Bỏ cột `mien_phi`** đã đề xuất trước đó — trùng lặp, suy được từ `trang_thai_thanh_toan = 'mien_phi'`.

**Bảng MỚI `phien_lam_viec`** — **1 lịch hẹn có thể có NHIỀU phiên** (khám lần 1 và tái khám là 2 phiên của cùng một lịch), **tạo dòng mỗi lần check-in**. Gom toàn bộ trạng thái vận hành chỉ có ý nghĩa lúc khách đang ở phòng khám:
- `cuoc_hen_id` (FK, **không unique** — cho phép nhiều phiên/lịch)
- `lan_thu` — 1 = khám lần đầu, 2 = tái khám
- `so_thu_tu_hang_doi`
- `thoi_gian_goi_vao` — mốc gọi khách vào (tách khỏi `thoi_gian_bat_dau`)
- `so_lan_goi_khong_co_mat`
- `giai_doan_hien_tai` — `dang_thuc_hien` / `dang_tren_may`
- `may_bat_dau_luc`, `may_ket_thuc_du_kien`, `thiet_bi_id` (máy đang dùng)

**Thêm 3 cột vào `thiet_bi` (A17c):** `dang_su_dung_boi` (FK `cuoc_hen`, nullable) + `ban_den_luc` — chặn 2 khách cùng chọn một máy · **`phong_id`** (FK `phong_lam_viec`, nullable) — hiện phòng của máy khi KTV chọn (*"Máy kéo giãn DTS-01 · Phòng Trị liệu 02"*) và xếp máy cùng phòng lên đầu, vì máy ở phòng khác nghĩa là **phải dắt khách sang phòng đó**. **Không thêm bảng mới**, tận dụng bảng thiết bị đã có.

> ⚠️ **`phong_id` CHỈ để hiển thị và lọc — TUYỆT ĐỐI không suy sức chứa từ số thiết bị trong phòng.** Sức chứa vẫn là `phong_lam_viec.suc_chua`. Đếm thiết bị để suy sức chứa sẽ tạo **hai nguồn sự thật cho cùng một con số** và chúng lệch nhau ngay lần đầu ai đó thêm một cái máy.
> **Chiến lược dữ liệu mẫu (đã chốt):** seed đủ số thiết bị cho mỗi phòng **bằng hoặc nhiều hơn `suc_chua`** để hai con số không mâu thuẫn khi hội đồng soi. Nhiều máy hơn số giường là bình thường ngoài đời.

**Thêm cột vào `phien_lam_viec`:** `giai_doan_hien_tai` bổ sung giá trị **`cho_ktv`** (máy đã xong, KTV chưa quay lại) — trạng thái thứ ba, nền cho quy tắc chặn gọi khách mới.

*Lợi ích:* `cuoc_hen` không phình · bảng này chỉ chứa buổi đang diễn ra trong ngày nên rất nhẹ, truy vấn hàng đợi nhanh · dọn dữ liệu cũ định kỳ được mà không đụng lịch hẹn. Chi phí: thêm 1 phép JOIN khi lấy hàng đợi — không đáng kể.

**Backfill `trang_thai_thanh_toan` cho dữ liệu cũ:** suy từ hóa đơn liên quan — có hóa đơn đã thanh toán **HOẶC** buổi thuộc gói 100% đã trả → `da_thanh_toan`; còn lại → `chua_thanh_toan`. Chỉ 2 nhánh. Chạy một lần bằng raw SQL.

**Thêm vào `nhat_ky_buoi_dieu_tri` — CHỈ 3 cột, dùng JSONB thay vì 9 cột rời:**

*Vấn đề nếu tách cột:* nhiều trường **luôn NULL tùy loại buổi** — buổi lượng giá không có kỹ thuật/vùng/phản ứng; buổi trị liệu không có ROM/MMT/dấu hiệu cảnh báo. Đây là anti-pattern.

| Cột | Kiểu | Nội dung |
|---|---|---|
| `du_lieu_luong_gia` | **JSONB** | `{ rom: [...], mmt: [...] }` (A11) |
| `du_lieu_tri_lieu` | **JSONB** | `{ nhat_ky: [ { luc, noi_dung, thiet_bi_id?, phut? } ] }` (A17b-CHỐT) |

> **Rút gọn so với bản trước — chỉ còn 2 cột, không phải 3:**
> - `du_lieu_luong_gia` bỏ `red_flags` (đã cắt sàng lọc dấu hiệu cảnh báo) và `muc_tieu` (đã cắt khỏi form)
> - `du_lieu_tri_lieu` bỏ `vung`, `phan_ung`, `bai_tap`; thay `ky_thuat: string[]` bằng **nhật ký thao tác có cấu trúc** (giờ · nội dung · máy · số phút) — thao tác "Đưa vào máy" tự sinh một mục
> - ❌ **BỎ HẲN cột `ket_qua_can_lam_sang`** — khách quay lại sau chuyển tuyến thì chuyên viên nhìn phim rồi nhập thẳng vào ROM/chẩn đoán/chống chỉ định, không cần ô riêng
>
> ⚠️ **Vẫn dùng JSONB cho `du_lieu_tri_lieu`, KHÔNG đổi sang `text[]`** — từng cân nhắc `text[]` khi tưởng chỉ là danh sách kỹ thuật phẳng, nhưng mỗi mục nhật ký nay có cấu trúc (thời điểm, máy, thời lượng) nên `text[]` sẽ mất liên kết tới thiết bị.

**Vẫn giữ cột riêng:** `vas_truoc`, `vas_sau` — cần vẽ biểu đồ tiến triển và thống kê thường xuyên, để trong JSONB sẽ bất tiện.

*Vì sao JSONB phù hợp:* dữ liệu này chủ yếu để **hiển thị lại**, không thống kê phức tạp · thêm chỉ số mới sau này **không phải đổi cấu trúc bảng** · PostgreSQL JSONB truy vấn và đánh chỉ mục (GIN) được nếu cần · **dự án đã dùng pattern này** ở cột `chi_tiet` của `giao_dich_thanh_toan`.

**Tổng kết chống phình:** cột thêm vào `cuoc_hen` từ **11 → 4** · cột thêm vào `nhat_ky_buoi_dieu_tri` từ **9 → 2** · đổi lại thêm 1 bảng phụ nhẹ và tự dọn được.

**Thêm cột vào `khuyen_mai_voucher` — CHỈ 3 cột:** `tu_dong_ap_dung` (boolean), `kenh_ap_dung` (String[]), `loai_goi_ap_dung` (String[]). Cột `yeu_cau_thanh_toan` **đã có sẵn**, chỉ cần chuẩn hóa lại giá trị (`tron_goi`/`tung_buoi`/`tat_ca`).
> ❌ **Đã cắt `goi_dich_vu_ap_dung`** — `loai_goi_ap_dung` đủ dùng.

**Bỏ bảng:** `tam_giu_cho`.

> ❌ **Đã cân nhắc rồi loại:** bảng `nhat_ky_goi_nhac` (theo dõi Lễ tân đã gọi nhắc ai) — quy mô nhỏ, thủ công vẫn hiệu quả, không phải điều hội đồng chê.

**Thêm cột cấu hình số khách song song:** vào `ho_so_chuyen_gia` (hoặc bảng cấu hình chung) — mặc định Chuyên viên VLTL = 1, KTV = 2.

**Cấu hình mới** (giờ nhận khách, giờ đóng cửa, mốc chia buổi, đệm dọn dẹp, ngưỡng no-show, số khách song song mặc định theo vai trò, tỉ lệ phạt hủy gói, timeout thanh toán 15 phút, ân hạn nhả máy 5 phút): đặt thành tham số tập trung, không viết cứng rải rác.

### Quy ước localStorage / sessionStorage ⚠️
> 🔒 **Nguyên tắc: KHÔNG lưu bất kỳ thứ gì liên quan tới TIỀN ở phía client.** Server là nguồn sự thật duy nhất — cache trạng thái thanh toán sẽ tạo ra màn hình nói "đã trả" trong khi DB nói chưa.

| Khóa | Xử lý |
|---|---|
| `sessionStorage: booking_temp_hold_id` | ❌ **Xóa** (C15) — phục vụ `tam_giu_cho` đã bỏ |
| `localStorage: temp_booking` | ✅ **Giữ, thu hẹp** — chỉ nháp form (dịch vụ · ngày · buổi · ghi chú), **xóa ngay khi tạo lịch thành công**; **không bao giờ** chứa id lịch hay id giao dịch |
| `localStorage: active_appointment_id` | ❌ **Xóa** (C16) — đọc từ server |
| — | ❌ **KHÔNG thêm khóa nào** cho trạng thái/link thanh toán. Khách đóng tab giữa chừng thì quay lại thấy nút "Tiếp tục thanh toán", link lấy **từ server** |

---

## Lịch trình 29 ngày (04/08 → 02/09)

| Giai đoạn | Ngày | Nội dung |
|---|---|---|
| **1. Nền booking** | 1–6 | A1, A1b, A2, A3, A4, C1, C2, C3 |
| **2. Lịch hẹn & thanh toán quầy** | 7–10 | A5, A6, A7, A8, A8b, A9, A10, A10b, A10c, A12, A13, A14, A15, **A15b, A15c**, C4–C9, **C11, C12, C13, C14** |
| **3. Hàng đợi & gọi khám** | 11–14 | B1 (backend + sidebar khung), B2, B3, B8, B9, B10, B11, **B14, B15, B16, B18, B19**, **B20, B20b, B20c, B21, B22, B23**, C10 |
| **4. Lượng giá + tái cấu trúc giao diện** | 15–21 | A11, **A17, A17a, A17b, A17c, A18**, B4, B5, B6, B7, **B7d, B7e** |
| **5. Thanh toán online** | 22–24 | B12 (PayOS đã có sẵn, chỉ mở rộng) + **B13** (mã giảm có điều kiện) |
| **6. Hoàn thiện** | 25–29 | A16 (đổi thuật ngữ) + kiểm thử + dữ liệu demo + **báo cáo & tập bảo vệ** |

**Mốc kiểm tra quan trọng — cuối ngày 10:** nếu booking + thanh toán quầy chưa chạy thông, phải cắt bớt độ chi tiết phiếu lượng giá ở giai đoạn 4 (giữ VAS + sàng lọc cảnh báo, giảm số nhóm khớp đo).

**⚠️ Giai đoạn 4 là điểm nghẽn lớn nhất — 7 ngày, ôm cả nội dung mới lẫn tái cấu trúc giao diện.** Nếu tới ngày 21 chưa xong, thứ tự cắt: **(1) A17c** — cơ chế song song, chỉ là điểm cộng thêm · **(2) độ tinh của giao diện** A17/A18 · **giữ bằng mọi giá** luồng chạy được trọn vẹn (A11, B4–B7), vì đó mới là điều hội đồng chê.

**Giai đoạn 6 chỉ còn 5 ngày, tuyệt đối không lấn sang code.**

**Điều kiện tiên quyết:** bản mẫu giao diện cho A17/A18 phải có **trước ngày 15**. Chưa có cũng không chặn giai đoạn 1–3.

**Vì sao thanh toán online xếp ở giai đoạn 5:** nó phụ thuộc cơ chế hóa đơn mới (giai đoạn 2) nên không làm sớm hơn được; đồng thời là phần độc lập nhất — trễ thì lùi mà không ảnh hưởng luồng chính.

---

## Critical Files

**Backend — lõi cần sửa nặng:**
- `backend/src/repositories/appointment.repository.ts` — `getBookedSlots()` (~dòng 1030–1270) là trung tâm của toàn bộ thay đổi A1; cũng chứa `checkCustomerOverlap`, `checkCustomerHasClinicalExamOnDate` (mở rộng cho A12), `createTempHold`/`releaseTempHold` (xóa cho C2)
- `backend/src/services/appointment.service.ts` — `createAppointment`/`createPublicAppointment` (bỏ OTP, C1), `confirmOTPAppointment`, `generateAndSaveOTP`, `sendOTPEmailAsync` (xóa)
- `backend/src/repositories/receptionist.repository.ts` — `processPayment`, tạo hóa đơn (A8, A9)
- `backend/src/repositories/doctor.repository.ts` — `getDoctorQueue()` (dòng ~73, nền cho B1), `getAppointmentDetail`, `startSession`, `getActiveSessionForStaff`
- `backend/src/repositories/technician.repository.ts` — `getTechnicianQueue()`, `startSession` (đã sửa gần đây, giữ nguyên guard)
- `backend/src/domain/billing.ts` — bỏ công thức trả góp, đơn giản hóa (A9); **sửa `calculatePackageCancellationRefund` lấy `giaThanhToanGoi` từ `tong_tien_phai_tra`** thay vì tái tính từ `tiLeGiam` (A15c) — nhớ cập nhật `billing.test.ts` kèm theo
- `backend/src/repositories/appointment.repository.ts::cancelCustomerAppointment` (~dòng 1575) — **thay gate 8 tiếng bằng cửa sổ 60 phút + 3 vế điều kiện**, chuyển sang xóa mềm có `loai_huy` (A14, C14)
- `backend/src/schemas/finance.schema.ts::packageRefundSchema` (dòng 17–23) — **bỏ `phi_phat` khỏi body**, đọc snapshot từ hóa đơn (A15b, C13)
- `backend/src/repositories/admin.repository.ts::handlePackageRefund` (~dòng 1901) — nhận tỉ lệ phạt từ `hoa_don.ti_le_phat_huy_goi`, không nhận từ request
- `frontend/src/utils/billing.ts` — `isAwaitingPaymentForList` (~dòng 277) và `isPaymentDue` (~dòng 168): **thay khối suy luận nhiều nhánh bằng kiểm tra `trang_thai_thanh_toan`** (A10b)
- `backend/src/routes/client.routes.ts` — route đặt lịch công khai, bỏ 2 route OTP
- `backend/prisma/schema.prisma` — thêm cột theo mục trên

**Backend — đã có sẵn, chỉ mở rộng (KHÔNG viết lại):**
- `backend/src/config/payos.ts` + `backend/src/controllers/payos_webhook.controller.ts` — PayOS **đã tích hợp**, hiện chỉ cho Lễ tân (`authorizeRoles(2,5)`); B12 chỉ cần thêm endpoint cho vai trò khách hàng
- Bảng `khuyen_mai_voucher` **đã có cột `yeu_cau_thanh_toan`** — dùng luôn cho mã giảm tự động

**Frontend — đặt lịch (A2, A3, A4, C3):**
- `frontend/src/features/public/components/booking/ui/steps/Step3DateTimeSpecialist.tsx`
- `frontend/src/features/public/components/booking/constants.ts` — `isSlotInPast`, `isSlotUrgent`, `MIN_BOOKING_BUFFER_MINUTES` (bỏ/thay)
- `frontend/src/components/WalkInBookingModal.tsx`
- `frontend/src/features/customer/pages/CustomerMedicalRecord/components/BookNextSessionModal.tsx`

**Frontend — quản lý lịch hẹn (A5, A6, A7, A14):**
- `frontend/src/components/appointmentStatusConfig.ts` — **gộp 2 bảng cấu hình lệch nhau thành 1**, từ 10 chuỗi xuống **7** (A5b). Đây là file gốc của mọi hiển thị trạng thái, sửa trước tiên
- `frontend/src/components/appointments/` — `AppointmentCalendar.tsx` (viết lại, bỏ timeline giờ), `DetailModal/`, `ui/CapacityView.tsx` (viết lại theo ngân sách phút 2 túi), `ui/AppointmentsFilterBar.tsx`
- `frontend/src/components/appointments/ui/` — **xóa** `OverdueCheckinPanel.tsx`, `PendingContactPanel.tsx`, `UnassignedPanel.tsx`; **giữ & sửa** `PendingPaymentPanel.tsx`, `DoctorWorkloadPanel.tsx`, `AppointmentKpiCards.tsx`
- `frontend/src/components/appointments/hooks/useAppointmentsData.ts` — gỡ thông báo C4–C6

**Frontend — bàn lượng giá & hàng đợi (A11, B1–B7):**
- `frontend/src/pages/ClinicalAssessment/index.tsx` — mở rộng thành phiếu lượng giá; đã có sẵn `VasSlider`, `getVasDescription` để tái dùng
- `frontend/src/layouts/AdminLayout.tsx` — cơ chế thông báo/chuông (dòng ~277–330 poll `/doctor/queue`), gỡ C4–C6, thêm B2
- Màn hình Hàng đợi mới — đặt tại `frontend/src/pages/` hoặc `features/doctor/pages/` theo FSD

**Tái dùng (không viết lại):**
- `frontend/src/components/TreatmentSessionDetailBody.tsx` — hiển thị VAS + ghi chú, đã dùng chung 6 nơi
- `frontend/src/utils/appointmentKpi.ts` — công thức KPI dùng chung 4 actor
- `frontend/src/components/ConfirmDialog.tsx`, `StatusHistoryModal.tsx`, `Pagination.tsx`

---

## Verification

**Sau mỗi giai đoạn:**
1. `cd backend && npx tsc --noEmit` và `cd frontend && npx tsc --noEmit` — phải sạch (trừ lỗi `LandingLayout.tsx` có sẵn, không liên quan)
2. Kiểm tra dữ liệu thật bằng MCP `postgres` — đặc biệt **giai đoạn 1 phải verify công thức ngân sách bằng SQL trước khi đụng frontend**, chạy đúng các kịch bản trong "Ví dụ tính ngân sách phút":
   - 2 nhân sự **cùng ca 7h–16h** → buổi sáng phải ra **540 phút**; **mỗi người một ca** (7h–16h + 11h–20h) → phải ra **330 phút**, không phải 540
   - Bật `so_khach_song_song = 2` cho KTV → ngân sách phải **gấp đôi**, không phải giữ nguyên
   - Đặt xen kẽ 30/60/90/120 phút → ngân sách riêng và chung trừ **đúng số phút** của từng dịch vụ
   - Còn 60 phút: đặt 30' **phải cho**, đặt 90' **phải chặn** — chặn theo thời lượng, KHÔNG theo số ca
   - **Bẫy hai tầng:** A đích danh 250' + B đích danh 250' (chung còn 40) → khách đặt 30' "Bất kỳ" **phải bị chặn** dù ngân sách chung còn đủ

**Kiểm thử luồng đầu-cuối (giai đoạn 6, dùng Playwright MCP + tài khoản quick-login sẵn có):**
- **Luồng A — Lượng giá đơn giản:** đặt lịch buổi sáng → check-in + thu tiền → hàng đợi → gọi vào → bắt đầu → lượng giá → chỉ định gói → thanh toán gói → đặt buổi 1 → trị liệu → hoàn thành
- **Luồng B — Có chuyển tuyến & tái khám:** check-in → **thu tiền khám** → lượng giá → bấm **"Chờ tái khám"** + đặt hạn 15 ngày → **chuyên viên phải được giải phóng ngay**, gọi được khách mới · lịch hiện trạng thái `chờ tái khám` kèm **hạn quay lại rõ ràng** → khách quay lại, Lễ tân mở đúng lịch đó bấm **"Check-in ngay"** (**không tạo lịch mới, không thu tiền lần 2**) → khách **lên đầu hàng đợi của đúng chuyên viên cũ** → mở lại **chính bàn lượng giá cũ** (không màn hình riêng, không ô "kết quả chụp chiếu"): chuyên viên nhìn phim khách mang tới, nhập nốt ROM/chẩn đoán/chống chỉ định còn trống + chỉ định gói → bấm Hoàn thành → **chi tiết lịch hiện khối "Gói đã chỉ định"** → Lễ tân bấm "Thanh toán gói này" → chọn 100% hoặc từng buổi (**từng buổi tạo hóa đơn 0đ**) → áp voucher nếu có
- **Luồng B3 — Vượt khả năng trung tâm (KHÔNG có nút riêng):** lượng giá thấy nặng → tab Chỉ định chọn **"Không chỉ định"** + ghi lý do vào kết luận → bấm **Hoàn thành** · popup xác nhận phải ghi rõ *"Không chỉ định gói liệu trình"* · **phải KHÔNG có khối "Gói đã chỉ định"** ở chi tiết lịch · **không hoàn tiền khám** · thử cả 2 thời điểm: lần lượng giá đầu và sau khi quay lại xem phim
- **Luồng B4 — Hai nút của bàn lượng giá:** bấm **Hoàn thành** khi để trống ô bắt buộc → **phải chặn và báo lỗi** · bấm **Chuyển tuyến** khi để trống TẤT CẢ (chưa nhập ROM/chẩn đoán/chống chỉ định) → **phải cho qua, không validation gì**, chỉ hỏi hạn quay lại · popup chuyển tuyến bấm **[Hủy]** → ẩn popup, ca giữ nguyên trạng thái đang thực hiện · bấm **[Xác nhận chuyển tuyến]** → ca sang `cho_tai_luong_gia` và **chuyên viên được giải phóng ngay**, gọi được khách mới · **popup KHÔNG được có chips chọn loại chụp**
- **Luồng B2 — Quá hạn tái khám:** để lịch `chờ tái khám` quá hạn → khách quay lại phải **bị chặn check-in**, hướng dẫn đặt lịch khám mới có thu phí
- **Luồng C — Chọn nhân sự cụ thể:** đặt lịch chỉ định KTV A → kiểm tra ngân sách riêng giảm đúng số phút → chỉ KTV A gọi được khách đó
- **Luồng G — KTV phục vụ song song:** KTV gọi khách 1 vào → gọi tiếp khách 2 (phải cho phép) → gọi khách 3 (phải bị chặn, báo "đang phục vụ 2/2") → hoàn thành 1 ca → gọi được khách 3
- **Luồng H — Hai trạng thái độc lập:** thanh toán online rồi chưa đến (đã trả + chưa check-in) · hoàn thành mà Lễ tân chưa thu tiền (hoàn thành + chưa trả → **nút Thu tiền phải hiện ngay cạnh**) · buổi trong gói 100% phải là **`da_thanh_toan` ngay từ lúc tạo lịch** (không có `mien_phi`) · lọc đúng nhóm "đã hoàn thành nhưng chưa thu tiền"
- **Luồng J — Bàn trị liệu KTV (đặc tả CHỐT):** mở buổi **dịch vụ lẻ** và buổi **gói liệu trình** → **hai màn hình phải GIỐNG HỆT nhau** · bàn làm việc **KHÔNG được hiện** kế hoạch trị liệu / buổi trước / tiến độ "Buổi 3/12" · buổi thuộc gói phải hiện **con trỏ một dòng** *"Gói này được chỉ định từ chuyên viên — [Xem ngay →]"*, bấm vào nhảy đúng sang tab lịch sử **không rời trang** · form chỉ còn **VAS · Kỹ thuật · Ghi chú** (không có vùng, phản ứng, bài tập) · **ba cách nhập VAS phải cho ra cùng một giá trị lưu xuống** · lưu xong dữ liệu hiện lại đúng ở hồ sơ điều trị
- **Luồng J2 — Nhật ký thao tác:** bấm **"+ Ghi bước"** nhập tay → xuất hiện đúng dòng kèm giờ · bấm **"Đưa vào máy"** → **TỰ SINH một dòng nhật ký** kèm tên máy + thời lượng, KTV không phải gõ lại · tới bước 3, mục Kỹ thuật **phải đã đầy sẵn** từ nhật ký
- **Luồng I — Linh hoạt thời điểm thanh toán:** buổi Lượng giá chưa trả → check-in được, vào hàng đợi được, **nhưng nút "Bắt đầu khám" phải bị khóa** + hiện cảnh báo đỏ → Lễ tân thu tiền → nút mở khóa ngay · dịch vụ lẻ thu **sau khi làm xong** phải thành công · buổi gói từng buổi thu **lúc check-in** phải thành công
- **Luồng D — Hủy (mô hình 2 trạng thái):** lịch **chưa thanh toán** → nút Hủy hiện, bấm trong 60 phút phải thành công (khách không còn thấy lịch, **nhưng DB vẫn còn dòng** `da_huy` + `loai_huy = khach_huy_som`) · quá 60 phút → **nút Hủy phải biến mất** · lịch **đã thanh toán** → **không có nút Hủy và không có nút tự đổi**, chỉ có **"Yêu cầu đổi lịch"** mở hộp thoại hotline · Lễ tân đổi buổi cho lịch đó **phải thành công nhiều lần liên tiếp** (không giới hạn), buổi đích phải bị **kiểm tra ngân sách phút** và bị chặn nếu hết chỗ, lý do ghi vào `ghi_chu_noi_bo` · hủy 1 buổi trong gói → **buổi vẫn còn trong gói, KHÔNG xóa dòng** · Lễ tân hủy giúp có ghi lý do, chọn `phong_kham_huy` → **đổi buổi miễn phí và KHÔNG trừ hạn mức đổi 1 lần** (khách sau đó vẫn tự đổi được thêm 1 lần) · **không màn hình nào được phép sinh giao dịch hoàn tiền ngoài luồng hủy gói 100%**
- **Luồng D5 — Ba lỗ hổng cửa sổ hủy (bắt buộc test, đây là chỗ dễ vỡ nhất):**
  1. **Đua với webhook:** bấm thanh toán online → lịch chuyển `dang_cho_thanh_toan` → **nút Hủy phải khóa ngay**, không chờ webhook · màn hình khách phải hiện *"Đang xác nhận thanh toán…"*, **KHÔNG được hiện "Chưa thanh toán"** · mở tab thứ hai bấm thanh toán lần nữa → **phải bị chặn**, không sinh link PayOS thứ hai · giả lập webhook về chậm, lịch phải lên `da_thanh_toan` đúng, không mồ côi · **để quá 15 phút không webhook → phải tự đảo về `chua_thanh_toan`**, rồi bắn webhook muộn vào → **vẫn phải lên `da_thanh_toan`** (idempotent, không mất tiền) · với khách **bị gắn cờ no-show**, hết 15 phút không trả → lịch **hủy mềm và ngân sách phút phải được trả lại**
  2. **Check-in trong cửa sổ:** đặt lịch → check-in sau 20 phút → **nút Hủy phải mất** dù còn trong 60 phút
  3. **Cửa sổ vượt qua buổi:** đặt lúc 11h40 cho buổi sáng → sau 12h00 **không hủy được** dù đồng hồ 60 phút chưa hết
- **Luồng D6 — Chống lạm dụng hủy sớm:** đặt→hủy→đặt lại lặp 3 lần trong 7 ngày → lần thứ 4 **phải mất quyền hủy sớm** · kiểm tra ngân sách phút của ca được **trả lại đúng** sau mỗi lần hủy
- **Luồng D7 — Phạt hủy gói không hồi tố:** bán gói khi cấu hình 10% → Admin đổi cấu hình thành 15% → hủy gói đó **phải vẫn tính 10%** (đọc snapshot từ hóa đơn) · gói bán sau khi đổi mới chịu 15% · **Admin không còn ô gõ tay tỉ lệ**
- **Luồng D8 — Hoàn tiền gói có voucher:** bán gói 5.000.000đ, áp voucher giảm 10% (còn 4.500.000đ), trả 100%, dùng 2/10 buổi rồi hủy → phạt và chi phí buổi đã dùng **phải tính trên 4.500.000đ**, không phải 5.000.000đ · thử lại với voucher giảm **số tiền cố định** để chắc chắn không còn phụ thuộc `ti_le_giam_gia_goi`
- **Luồng D2 — Không đến, tình huống A (chưa check-in):** đặt lịch buổi sáng rồi **không đến** → khách **không được xuất hiện trong hàng đợi** của bất kỳ ai → sau 12h30 hệ thống **tự** đánh dấu `không đến` (không ai bấm nút) → đếm no-show tăng 1
- **Luồng D3 — Không đến, tình huống B (đã check-in rồi biến mất):** Lễ tân check-in → khách vào hàng đợi → Chuyên viên bấm **"Gọi không có mặt"** lần 1 → khách bị đẩy xuống cuối hàng đợi → bấm lần 2 → `không đến` + đếm no-show
- **Luồng M — Phục vụ song song & cơ chế máy (A17c, đặc tả CHỐT):** KTV bắt đầu khách A → **"Đưa vào máy" 20 phút** → A sang `dang_tren_may`, **KTV phải về rảnh** → gọi khách B (phải cho phép) → A còn 3 phút **phải có chuông + nhấp nháy** → hết giờ A **tự sang `cho_ktv`** → thử gọi khách C → **phải bị chặn** vì có khách ở `cho_ktv` → từ `cho_ktv` bấm thẳng **"Hoàn thành buổi"** **phải được**, KHÔNG bắt "Quay lại làm" trước
- **Luồng M2 — Vòng đời chiếm dụng máy (chỗ dễ sai nhất):** đặt máy 20 phút → tới phút 20 máy **VẪN phải bị khóa** (khách còn nằm), hiện đếm ngược "tự giải phóng sau 4:xx" · tới phút **25 tự nhả** về hiển thị "Sẵn sàng" · bấm bất kỳ nút nào (Quay lại làm / Hoàn thành / Kết thúc sớm / Đổi máy) → **nhả ngay lập tức** · **"Đổi máy"** nhả máy cũ và giữ máy mới, **không giữ 2 máy** · trong suốt thời gian có khách ở `cho_ktv`, KTV **phải không gọi được khách mới** — đây là cơ chế cưỡng chế duy nhất, **không có thông báo nào gửi cho Lễ tân**
- **Luồng M3 — Trạng thái thiết bị không bị ghi đè:** khách đang nằm máy → Admin vào ManageEquipment đánh dấu máy đó **`dang_bao_tri`** → khi ca kết thúc / hết ân hạn, máy **PHẢI vẫn là `dang_bao_tri`**, tuyệt đối không bị ghi đè về `san_sang` · máy `dang_bao_tri` và `hong` **không được xuất hiện** trong danh sách chọn của KTV · máy `san_sang` nhưng đang bị chiếm **phải mờ kèm đếm ngược**, không mất khỏi danh sách · hệ thống **không ghi mới** giá trị `dang_su_dung` vào `trang_thai`, nhãn đó phải là **suy ra từ `dang_su_dung_boi`**
- **Luồng L — Phân bổ nhân sự tự động:** khách **không chọn nhân sự** → check-in → **`nhan_su_id` phải để trống**, khách xuất hiện ở hàng đợi chung của mọi nhân sự đủ điều kiện → KTV bất kỳ bấm "Gọi vào" → **gán đúng người đó** ngay lúc gọi, **hiện đúng phòng** trong thông báo gọi · số ca đã làm hôm nay cập nhật đúng · Quản lý đổi nhân sự cho ca đang thực hiện phải thành công, đổi cho ca đã hoàn thành phải bị chặn
- **Luồng N — Tự gán khi rảnh hoàn toàn:** KTV A đang làm khách 1 → **đưa vào máy** → A "rảnh tạm", **hệ thống KHÔNG được tự gán** (A tự quyết có kéo thêm không) → A **hoàn thành** khách 1, không còn khách nào → **hệ thống phải tự gán ngay** khách tiếp theo, hiện nổi bật kèm nút "Gọi vào" · nếu có khách **chọn đích danh A** thì phải gán khách đó trước, không phải người chờ lâu nhất · A **không bấm trong 5 phút** → khách phải quay lại hàng đợi chung
- **Luồng D4 — Không đủ thời gian phục vụ (3 tình huống, 1 công thức):**
  1. **Sát giờ tan ca nhân sự đã chọn:** khách chọn Chuyên viên tan ca 20:00, đến 19:20, dịch vụ 60' → **đèn 🟡**, modal phải liệt kê **đúng những người còn đủ giờ** kèm dự kiến gọi, và hiện **ca trực gần nhất của người đã chọn** (đọc `lich_truc_nhan_su`)
  2. **Sát giờ đóng cửa:** còn 20 phút tới giờ đóng, dịch vụ 30' → **đèn 🔴**, vẫn cho tiếp nhận nhưng **bắt buộc ghi lý do** và ca bị đánh dấu ngoài giờ
  3. **Nhân sự đã chọn về ca sớm:** khách chọn từ web Chuyên viên A (trực 12:00–16:00) cho buổi chiều, check-in 15:30, dịch vụ 60' → **đèn 🟡** đúng như TH1 · kiểm tra lúc **đặt lịch** đã hiện *"A nhận khách 12:00–16:00"* chưa
  - Kiểm tra thêm: nhân sự **đang giữ 1/2 bàn** phải tính là **rảnh ngay**; đang giữ 2/2 thì lấy **MIN** thời điểm xong (không phải MAX) · khách đang trên máy phải lấy `may_ket_thuc_du_kien`
  - **Không nhãn nào được hiện chữ "muộn"** — phải là "không đủ thời gian phục vụ"
- **Luồng D9 — Hàng đợi & dự kiến gọi:** thứ tự hàng đợi phải theo **`thoi_gian_checkin`**, không theo thời điểm đặt lịch · Lễ tân thấy **giờ cụ thể** ("gọi ~15:40"), màn hình/lời nói với khách chỉ hiện **khoảng** · khách chọn đích danh phải thấy **so sánh thời gian chờ** và đổi sang "Bất kỳ" được ngay tại quầy · widget **Sức khỏe ca** phải chuyển đỏ khi tổng nhu cầu hàng đợi vượt công suất còn lại · danh sách **"Chưa đến — hạn đến muộn nhất"** phải tính đúng theo thời lượng từng dịch vụ
- **Luồng O — Chuẩn hóa trạng thái & màn hình theo actor:** grep toàn frontend **không còn** chuỗi `chua_xac_nhan` · `cho_xac_nhan` · `giu_cho` · `cho_kham` · chỉ còn **MỘT** bảng cấu hình trạng thái (gộp `statusConfig` và `getClinicalStatusConfig`) · nhãn của `dang_kham` phải là **"Đang thực hiện"** ở cả bàn lượng giá lẫn bàn trị liệu · **tầng 3 (`dang_tren_may`/`cho_ktv`) KHÔNG được xuất hiện** trong bộ lọc màn hình lịch hẹn · `trang_thai_thanh_toan` chỉ còn **3 giá trị**, grep không còn `mien_phi` · buổi thuộc gói 100% phải là `da_thanh_toan` ngay khi tạo lịch · 3 panel đã bỏ (`OverdueCheckin`, `PendingContact`, `Unassigned`) **không còn render ở đâu**
- **Luồng O2 — Xem ngày khác theo từng vai trò:** Chuyên viên/KTV mở tab **"Sắp tới"** → chỉ liệt kê khách **đã chọn đích danh** mình, khách chưa chọn nhân sự **chỉ hiện dạng ĐẾM, không liệt kê** · tab **"Lịch sử"** xem lại ca đã làm ngày cũ · Lễ tân chọn **hôm nay** → **1 bảng xếp nhóm theo dòng chảy, mỗi nhóm tự cuộn riêng**; chọn **ngày mai** → **tự đổi sang danh sách + tổng hợp** (tổng lịch, tách theo buổi và theo vai trò, đếm chưa thanh toán, nút lấy danh sách gọi nhắc kèm SĐT); chọn **ngày cũ** → danh sách tra cứu
- **Luồng E0 — Chạy hết 11 điều kiện chặn đặt lịch:** ưu tiên các ca dễ sai — ngân sách còn 60' thì đặt 30' **phải cho**, đặt 90' **phải chặn** · chọn "Bất kỳ" khi chung còn nhưng không ai **cùng vai trò** đủ chỗ riêng → **phải chặn** · **túi Lượng giá và túi Trị liệu độc lập**: hết chỗ lượng giá vẫn đặt được trị liệu và ngược lại · dịch vụ 120' phải bị chặn từ **17h50** trong khi dịch vụ 30' tới 19h30 vẫn đặt được · đặt **2 lịch cùng buổi sáng phải THÀNH CÔNG** (đã bỏ `checkCustomerOverlap`) nhưng **2 buổi Lượng giá cùng ngày phải bị chặn** · đang có lịch `cho_tai_luong_gia` → đặt Lượng giá mới **phải bị chặn kèm hướng dẫn quay lại lịch cũ** · mọi thông báo hết chỗ **phải nói rõ số phút còn lại**, không được là "hết chỗ" chung chung
- **Luồng E — Chống spam, chạy đủ 4 tầng:** đang có 3 lịch hoạt động (bất kỳ ngày nào) → đặt lịch thứ 4 **phải bị chặn** (tầng 0, không phân biệt theo ngày) · hủy sớm lần 4 trong 7 ngày **phải mất quyền hủy sớm** (tầng 1) · để 2 lịch không đến trong 60 ngày → lần đặt kế tiếp **bắt buộc thanh toán online mới xác nhận được** (tầng 3) · khi đang bị gắn cờ mà không đến → **mất tiền nhưng KHÔNG cộng thêm no-show** (chống phạt kép) · lùi ngày giả lập sạch 60 ngày → **cờ tự gỡ** (tầng 4)
- **Luồng F — Thanh toán online:** đặt lịch → chọn online → PayOS → webhook → lịch xác nhận
- **Luồng F2 — Quay lại từ bước thanh toán (chỗ mất tiền thật):** đang chọn phương thức mà bấm quay lại → trạng thái **không đổi**, không gọi API nào · đã sang PayOS rồi bấm Hủy trên cổng → về `chua_thanh_toan`, đặt lại được ngay không phải chờ 15 phút · 🔴 **kịch bản nguy hiểm nhất:** trả tiền XONG rồi bấm **back trình duyệt** về `cancelUrl` → hệ thống **PHẢI tra cứu ngược PayOS** và cho ra `da_thanh_toan`, **TUYỆT ĐỐI không được** đảo về `chua_thanh_toan` khiến khách trả lần hai · bấm thanh toán rồi quay lại nhiều lần → **cửa sổ hủy 60 phút KHÔNG được reset** (vẫn tính từ `thoi_gian_tao`) · đóng tab giữa chừng rồi mở lại → thấy nút "Tiếp tục thanh toán", link lấy **từ server**, grep localStorage **không có** khóa nào về thanh toán
- **Luồng K — Mã giảm có điều kiện:** tạo mã 10% chỉ `online` + `LIEU_TRINH` + `tron_goi` → thanh toán trọn gói liệu trình online **phải áp tự động** · Lễ tân thu cùng gói đó tại quầy **phải KHÔNG áp** · thanh toán từng buổi **phải KHÔNG áp** · mua dịch vụ lẻ/buổi lượng giá online **phải KHÔNG áp** · hai mã cùng thỏa → chọn mã giảm nhiều hơn

**Dữ liệu demo:** chuẩn bị sẵn khách hàng, lịch sử điều trị, và các ca ở đủ trạng thái để demo trọn vẹn trong một ngày dữ liệu — tận dụng việc giới hạn 3 lịch đang hoạt động không tính theo ngày để chạy cả luồng khám lẫn trị liệu cùng ngày trước hội đồng (chỉ cần đảm bảo khách demo có <3 lịch đang hoạt động tại thời điểm demo).
