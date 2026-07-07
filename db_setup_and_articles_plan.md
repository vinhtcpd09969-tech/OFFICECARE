# Kế hoạch Thiết lập Database & Phát triển Tính năng Quản lý Bài viết Chuẩn SEO

Tài liệu này hướng dẫn cách thiết lập nhanh cơ sở dữ liệu từ bản sao lưu mới nhất và lập kế hoạch xây dựng tính năng Quản lý Bài viết (Blog) chuẩn SEO cho hệ thống PhysioFlow.

---

## ⚡ PHẦN 1: HƯỚNG DẪN CLONE CODE VÀ KHỞI TẠO DATABASE (Dành cho AI Vibe Coding / Developer)

Để bắt đầu chạy dự án ngay lập tức sau khi clone mã nguồn về máy, hãy thực hiện theo các bước sau:

### Bước 1: Thiết lập biến môi trường (.env)
1. Copy file `.env.example` thành file `.env` ở cả thư mục `backend/` và `frontend/`.
2. Cập nhật URL kết nối cơ sở dữ liệu PostgreSQL của bạn vào biến `DATABASE_URL` trong file `backend/.env`.
   Ví dụ:
   ```env
   DATABASE_URL=postgresql://postgres:user_password@localhost:5432/physioflow_db?options=-c%20timezone=UTC
   ```

### Bước 2: Cài đặt thư viện dependencies
Chạy lệnh sau tại thư mục gốc của dự án:
```bash
# Cài đặt thư viện cho Backend
cd backend && npm install

# Cài đặt thư viện cho Frontend
cd ../frontend && npm install
```

### Bước 3: Đồng bộ hóa cấu trúc bảng Database (Prisma Schema)
Khởi tạo cấu trúc bảng từ file `schema.prisma` lên cơ sở dữ liệu PostgreSQL của bạn:
```bash
cd ../backend
npx prisma db push
```
*Lưu ý: Lệnh `db push` sẽ tạo trực tiếp cấu trúc bảng mà không ghi nhận lịch sử migration phức tạp, rất phù hợp cho việc setup nhanh môi trường local.*

### Bước 4: Nạp dữ liệu từ bản Backup (`office_care_backup_new.sql`)
Sau khi các bảng đã được khởi tạo thành công, tiến hành import dữ liệu kiểm thử (bao gồm tài khoản admin, gói dịch vụ, dữ liệu hóa đơn demo) từ file backup:
* **Cách 1: Sử dụng Command Line (psql)**
  ```bash
  psql -U postgres -d physioflow_db -f ../database/office_care_backup_new.sql
  ```
* **Cách 2: Sử dụng TablePlus hoặc pgAdmin**
  1. Mở kết nối tới database `physioflow_db` bằng TablePlus / pgAdmin.
  2. Mở cửa sổ SQL Query Editor.
  3. Kéo thả file `database/office_care_backup_new.sql` vào editor và chọn **Run/Execute** để nạp dữ liệu.

*Lưu ý quan trọng: File SQL backup đã được thiết lập lệnh `SET session_replication_role = 'replica';` ở đầu để tạm thời vô hiệu hóa kiểm tra khóa ngoại (foreign key constraints), tránh mọi lỗi xung đột thứ tự bảng khi import dữ liệu.*

### Bước 5: Chạy dự án
Mở 2 terminal chạy đồng thời:
* **Backend:** `cd backend && npm run dev` (chạy trên cổng `5001`)
* **Frontend:** `cd frontend && npm run dev` (chạy trên cổng `3000`)

---

## 📝 PHẦN 2: KẾ HOẠCH PHÁT TRIỂN CHỨC NĂNG QUẢN LÝ BÀI VIẾT CHUẨN SEO

Để xây dựng một trang tin tức/bài viết y khoa chuyên nghiệp và chuẩn SEO nhằm thu hút lượt truy cập tự nhiên (Organic Traffic) từ Google, chúng ta cần triển khai các phần sau:

### 1. Cấu trúc bảng Database Mới (`bai_viet`)
Chúng ta sẽ thêm mô hình `bai_viet` vào file `backend/prisma/schema.prisma`. 

```prisma
model bai_viet {
  id               String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tieu_de          String      @db.VarChar(200)
  slug             String      @unique @db.VarChar(255) // URL thân thiện SEO (Ví dụ: phuc-hoi-cot-song-dau-vai-gay)
  tom_tat          String      @db.Text
  noi_dung         String      @db.Text
  anh_bia          String?     @db.Text
  danh_muc         String      @db.VarChar(50)         // Loại: "suc_khoe", "dieu_tri", "tin_tuc", "khuyen_mai"
  trang_thai       String      @default("nhap") @db.VarChar(20) // Trạng thái: "nhap" (Draft), "xuat_ban" (Published)
  
  // Các cột Meta phục vụ SEO
  meta_title       String?     @db.VarChar(150)        // Tiêu đề SEO hiển thị trên tab trình duyệt
  meta_description String?     @db.VarChar(255)        // Mô tả ngắn hiển thị trên kết quả tìm kiếm Google
  meta_keywords    String?     @db.VarChar(255)        // Từ khóa phụ (Tùy chọn)
  
  luot_xem         Int         @default(0)
  nguoi_viet_id    Int
  ngay_dang        DateTime?   @db.Timestamptz(6)
  ngay_tao         DateTime    @default(now()) @db.Timestamptz(6)
  ngay_cap_nhat    DateTime    @default(now()) @db.Timestamptz(6)

  nguoi_dung       nguoi_dung  @relation(fields: [nguoi_viet_id], references: [id], onDelete: NoAction, onUpdate: NoAction)
}
```

*Lưu ý: Bạn cần thêm quan hệ ngược `bai_viet bai_viet[]` vào mô hình `nguoi_dung` trong file `schema.prisma`.*

---

### 2. Quy chuẩn SEO Y khoa (YMYL - Your Money Your Life)
Bài viết thuộc lĩnh vực sức khỏe chịu sự kiểm duyệt cực kỳ gắt gao của Google. Chúng ta cần triển khai chuẩn SEO theo các tiêu chí sau:

#### A. Tối ưu hóa On-Page & URL
* **URL Slugs thân thiện:** Slug dạng `/tin-tuc/phuc-hoi-dau-vai-gay-tai-nha`. Không sử dụng ID số dài ngoằng trên URL.
* **Heading Hierarchy:** Bài viết xuất bản phải tự động tuân thủ cấu trúc HTML5:
  * Tiêu đề chính là thẻ duy nhất `<h1>`.
  * Các mục lớn là thẻ `<h2>`, mục con là `<h3>`. Không lạm dụng hoặc nhảy cóc thẻ tiêu đề.
* **Hình ảnh chuẩn SEO:** Thẻ ảnh `<img>` bắt buộc phải có thuộc tính `alt` mô tả nội dung ảnh có chứa từ khóa mục tiêu, hỗ trợ tính năng lazy loading (`loading="lazy"`) để tăng điểm Core Web Vitals.

#### B. SEO Meta Tags & Open Graph (Chia sẻ mạng xã hội)
* **Title & Meta Description:** Thêm các trường nhập liệu Title (tối đa 60 ký tự) và Meta Description (tối đa 160 ký tự) riêng biệt để Google hiển thị snippet đẹp mắt nhất.
* **Open Graph (OG) & Twitter Cards:** Tự động chèn các thẻ meta như `og:title`, `og:description`, `og:image`, `og:type="article"` vào thẻ `<head>` của trang để khi chia sẻ liên kết lên Facebook, Zalo hay Twitter, card xem trước hiển thị vô cùng premium.

#### C. Dữ liệu cấu trúc JSON-LD (Schema Markup)
Tích hợp Schema `Article` hoặc `MedicalWebPage` vào mã HTML để Google hiểu rõ nội dung, tác giả (Bác sĩ chuyên môn) và ngày xuất bản.
Ví dụ cấu trúc JSON-LD tự động chèn:
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "MedicalWebPage",
  "headline": "Phương pháp phục hồi đau vai gáy hiệu quả",
  "image": ["https://physioflow.com/images/cover.jpg"],
  "datePublished": "2026-07-08T00:00:00Z",
  "author": {
    "@type": "Person",
    "name": "Bác sĩ Nguyễn Văn A"
  }
}
</script>
```

#### D. Dynamic Sitemap (`sitemap.xml`)
Xây dựng một API route tại Backend để sinh tự động file `/sitemap.xml` theo thời gian thực, liệt kê toàn bộ các bài viết có trạng thái là `"xuat_ban"`, giúp Google Bot lập chỉ mục (index) bài viết mới nhanh nhất.

---

### 3. Đề xuất UX/UI Trang Bài viết & Quản trị

#### 💻 Giao diện Trang Quản trị (Admin/Marketing Panel)
* **Trình soạn thảo văn bản (Rich Text Editor):** Tích hợp TipTap hoặc Editor.js hỗ trợ định dạng trực quan (Bold, Italic, Bullet points, chèn ảnh kéo thả).
* **Bảng cấu hình SEO Sidebar:** Thiết kế thanh bên cạnh trình soạn thảo để nhập tiêu đề SEO, mô tả SEO và tự động hiển thị bản xem trước (Google Search Preview) trực quan của bài viết khi lên Google.
* **Tự động sinh Slug:** Khi người dùng nhập tiêu đề bài viết, hệ thống tự tạo slug gợi ý không dấu, phân tách bằng dấu gạch ngang (nhưng vẫn cho phép người dùng sửa thủ công).

#### 🌐 Giao diện Trang Client (Người dùng xem)
* **Trang danh sách bài viết:** Bố cục dạng Grid (lưới ảnh bìa + tiêu đề + tóm tắt ngắn + thời lượng đọc ước tính). Hỗ trợ bộ lọc nhanh theo Danh mục ("Mẹo sức khỏe", "Phương pháp trị liệu",...).
* **Trang chi tiết bài viết:** 
  * Cột nội dung chính rộng rãi, căn lề thoáng, font chữ dễ đọc (như Inter / Roboto, size 16px-18px).
  * Mục lục bài viết (Table of Contents) tự động tạo dựa trên các thẻ `<h2>`, `<h3>` của bài viết và có tính năng cuộn mượt (Smooth scroll).
  * **Hộp CTA Đăng ký Lịch hẹn:** Đặt ở cuối mỗi bài viết dịch vụ để chuyển hướng người đọc thành khách hàng thực tế (tối ưu hóa tỷ lệ chuyển đổi - CRO).
