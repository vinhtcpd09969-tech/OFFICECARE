# Quy chuẩn kiến trúc & quy trình làm việc — OfficeCare

> Hợp nhất từ `docs/DEVELOPMENT_STANDARDS.md` (cũ) và `.agent/rules/CODE_STANDARDS.md` (cũ). File này định nghĩa cách tổ chức code, tách logic/UI, phân quyền, và quy trình bắt buộc trước khi sửa code.

## 1. Quy trình phân tích trước khi code

1. **Không code mù:** đọc toàn bộ file cần sửa + ít nhất 2 file liên kết trực tiếp trước khi chỉnh. Vẽ bản đồ ảnh hưởng (đổi response backend → phải sửa type & call ở frontend).
2. **Socratic Gate:** nếu có 1% mơ hồ về nghiệp vụ hoặc giao diện hiện có, **hỏi lại trước**, cấm tự suy diễn.
3. **Đề xuất phương án trước khi code:** với yêu cầu phát triển/tối ưu, trình bày hướng tiếp cận + ưu điểm + nhược điểm/đánh đổi. Chỉ code khi người dùng đồng ý phương án.
4. **DRY chủ động:** trước khi viết/sửa UI hoặc logic, tự đánh giá có thể tái sử dụng cho actor/module khác không. Không copy-paste code tương đồng rải rác nhiều nơi — gộp thành Shared Component / Shared Hook.

## 2. Cấu trúc thư mục Frontend (`frontend/src/`)

```
frontend/src/
├── components/              # Shared components dùng chung toàn dự án (Button, Modal...)
├── features/                # Phân theo tính năng nghiệp vụ
│   ├── admin/                pages/, components/<module>/{hooks,ui}, constants.ts, types.ts
│   ├── receptionist/          features/receptionist/pages/ReceptionistAppointments.tsx
│   ├── doctor/                 features/doctor/pages/DoctorAppointments.tsx
│   ├── technician/
│   ├── customer/
│   └── public/                Landing, booking, chatbot cho khách vãng lai
├── stores/                  # Zustand state toàn cục — DÙNG BẢN NÀY, xem mục 5
├── utils/                   # Hàm tiện ích dùng chung — DÙNG BẢN NÀY, xem mục 5
├── api/                     # axios instance — DÙNG BẢN NÀY, xem mục 5
└── shared/                  # ⚠️ Di sản một lần migrate FSD dở dang, xem mục 5
```

## 3. Cấu trúc thư mục Backend (`backend/src/`)

```
backend/src/
├── controllers/   # Nhận HTTP request, gọi Service, trả JSON chuẩn (không chứa business logic)
├── routes/        # Định nghĩa endpoint + gắn middleware auth/role theo TỪNG route
├── services/       # Business logic chính (tính toán, xử lý phức tạp)
├── repositories/   # Tương tác DB (Prisma, SQL) — nơi ném Error nghiệp vụ
├── schemas/        # Zod validation
└── utils/          # Helper nội bộ
```

## 4. Tách biệt trách nhiệm theo Actor (Single Responsibility)

- **Không gộp** giao diện/logic/phân quyền của nhiều Actor (Admin, Lễ tân, Bác sĩ, KTV) vào cùng một Page Component bằng `if (roleView === 'x')`. Mỗi actor có Page riêng trong `features/<role>/pages/`.
- Phần UI phức tạp giống nhau (lịch, bộ lọc, modal chi tiết/đặt lịch) → tách thành Shared Component trong `/ui/` hoặc `/components/`, các Page riêng import và cấu hình qua props (vd `isReceptionistOverride`, `activeRole`).
- **Route riêng theo actor:** `/receptionist/appointments`, `/doctor/appointments`, `/admin/appointments`. Không khai báo route trùng/đè trong `AppRoutes.tsx`.
- Khi Admin dùng nút chuyển vai trò giả lập để test, phải `navigate('/receptionist/appointments')` (đổi URL thật), **không** đổi Layout tại chỗ giữ nguyên URL.

## 5. Tách biệt State và Giao diện (Hooks Separation)

- **Business logic** (API call, polling, validation, localStorage state) → **Custom Hooks** (vd `useBookingState.ts`, `useAppointmentsData.ts`, `useAppointmentActions.ts`). Page Component **không** gọi `axios.get/post` trực tiếp.
- **UI tĩnh** (`BookingStepCard.tsx`, `KpiCards.tsx`...) chỉ nhận props dữ liệu + handler, không tự fetch.
- Page chỉ import hook, truyền state cần thiết, dùng các hàm phản hồi (`onSave`, `onCheckIn`, `onCancel`).

### ⚠️ Known issue — file trùng lặp chưa dọn

`frontend/src/shared/{stores,utils,api}/...` là tàn dư của một lần migrate sang `shared/` bị bỏ dở — gần như mồ côi (0-2 import). Bản đang thực sự được dùng là top-level: `stores/authStore.ts` (~18 import), `utils/date.ts`, `api/axios.ts` (~23 import). **Luôn import từ bản top-level**, không thêm import mới trỏ vào `shared/`. Việc dọn/xóa các bản mồ côi này là một task riêng, chưa thực hiện.

## 6. Phân quyền chi tiết (Fine-grained Authorization — Backend RBAC)

1. **Không dùng catch-all middleware ở đầu file route** (vd `router.use(authorizeRoles(5, 6))`) nếu file đó có API mà Lễ tân/Bác sĩ cần đọc.
2. Khai báo quyền theo **từng endpoint**:
   - `GET` (đọc): cho phép Lễ tân (2), KTV (3), Bác sĩ (4).
   - `POST/PUT/DELETE` (ghi): giới hạn Quản lý (6)/Admin (5), trừ nghiệp vụ đặc thù được phép rõ ràng (Lễ tân đặt lịch vãng lai, check-in).

## 7. UI/UX kỹ thuật (state, loading, animation)

Xem chi tiết đầy đủ ở skill `design-system` / `docs/DESIGN_SYSTEM.md`. Tóm tắt bắt buộc:
- Skeleton loader theo đúng khung component, cấm spinner tròn giữa màn hình cho tải dữ liệu dài.
- Double confirmation (cảnh báo cam/vàng) khi khách chọn khung giờ trong vòng 2 tiếng.
- Trạng thái lâm sàng (Chờ khám, Đang khám, Hoàn thành, Đã hủy) phải đồng nhất màu trên mọi trang của mọi Actor.

## 8. Chuyển giao tri thức giữa các phiên làm việc

- Logic nghiệp vụ cốt lõi luôn được tài liệu hóa tại: `docs/BUSINESS_RULES.md`, `docs/ARCHITECTURE_CONVENTIONS.md` (file này), `docs/DESIGN_SYSTEM.md`, `docs/activity_diagrams.md`.
- Cuối phiên làm việc, chạy lệnh `/handover` để tự động tóm tắt file đã sửa + nghiệp vụ đã giải quyết + lệnh test đã chạy vào `walkthrough.md`.
