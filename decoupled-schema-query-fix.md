# decoupled-schema-query-fix

## Goal
Fix 500 errors across all repository SQL queries caused by the decoupled schema, and remove the redundant Receptionist Quick Billing menu option from the Admin layout.

## Tasks
- [ ] Task 1: Remove "Thu ngân Gói (Lễ tân)" menu option from `frontend/src/layouts/AdminLayout.tsx` → Verify: Redundant sidebar item is hidden
- [ ] Task 2: Update `backend/src/repositories/receptionist.repository.ts` queries → Verify: No `nguoi_dung` joins remain for customers
- [ ] Task 3: Update `backend/src/repositories/doctor.repository.ts` queries → Verify: No `nguoi_dung` joins remain for customers
- [ ] Task 4: Update `backend/src/repositories/appointment.repository.ts` queries → Verify: No `nguoi_dung` joins remain for customers
- [ ] Task 5: Update `backend/src/repositories/admin.repository.ts` queries → Verify: No `nguoi_dung` joins remain for customers
- [ ] Task 6: Run full project compilation and check DB query → Verify: builds pass, `test_db.js` returns success

## Done When
- [ ] Redundant receptionist quick-billing sidebar item is removed for Admin
- [ ] All database queries function correctly with no 500 errors
