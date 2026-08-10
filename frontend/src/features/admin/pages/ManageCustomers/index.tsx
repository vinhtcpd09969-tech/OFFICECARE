import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, ClipboardList } from 'lucide-react';
import { ConfirmDialog } from '../../../../components/ConfirmDialog';
import { PatientDossierTimeline } from '../../../../pages/DoctorMedicalRecords/components/PatientDossierTimeline';
import { CustomerSummaryCards } from '../../components/customers/ui/CustomerSummaryCards';
import { CustomerFilterToolbar } from '../../components/customers/ui/CustomerFilterToolbar';
import { CustomerTable } from '../../components/customers/ui/CustomerTable';
import { CompletedSingleVisitTable } from '../../components/customers/ui/CompletedSingleVisitTable';
import { TreatmentPlanFilterToolbar } from '../../components/customers/ui/TreatmentPlanFilterToolbar';
import { TreatmentPlanTable } from '../../components/customers/ui/TreatmentPlanTable';
import { SectionHeading } from '../../components/customers/ui/SectionHeading';
import { EditCustomerModal } from '../../components/customers/ui/EditCustomerModal';
import { CustomerLockDialogMessage } from '../../components/customers/ui/CustomerLockDialogMessage';
import { useCustomerFilters } from '../../components/customers/hooks/useCustomerFilters';
import { useCustomerListData } from '../../components/customers/hooks/useCustomerListData';
import { useCustomerActions } from '../../components/customers/hooks/useCustomerActions';
import { useCustomerEmr } from '../../components/customers/hooks/useCustomerEmr';
import { useTreatmentPlanFilters } from '../../components/customers/hooks/useTreatmentPlanFilters';
import { useTreatmentPlanListData } from '../../components/customers/hooks/useTreatmentPlanListData';
import { useCompletedSingleVisitData } from '../../components/customers/hooks/useCompletedSingleVisitData';
import type { CustomerOverviewItem } from '../../components/customers/types';
import './recovery-arc-theme.css';

type ViewMode = 'customer' | 'plan';

export default function ManageCustomers() {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewMode>('customer');

  const filters = useCustomerFilters();
  const list = useCustomerListData({
    showLockedOnly: filters.showLockedOnly,
    recordFilter: filters.recordFilter,
    repTier: filters.repTier, search: filters.debouncedSearch
  });
  const actions = useCustomerActions(list.refetch);
  const emr = useCustomerEmr();

  // Tab "Hồ sơ điều trị" — tổng quan TOÀN BỘ hồ sơ điều trị mọi khách hàng, gồm 2 khối xếp chồng:
  // "Ca khám & dịch vụ lẻ hoàn thành" (không filter) + "Gói liệu trình" (lọc đúng trạng thái thật
  // từng gói) — khác tab "Theo khách hàng" (chỉ quản lý tài khoản: tìm kiếm/sửa/khóa).
  const planFilters = useTreatmentPlanFilters();
  const plans = useTreatmentPlanListData({ activeStatus: planFilters.activeStatus, search: planFilters.debouncedSearch });
  const planCounts = list.emrStats?.lieu_trinh || { dang_dieu_tri: 0, qua_han: 0, hoan_thanh: 0, huy: 0, cho_kich_hoat: 0, tong: 0 };
  const singleVisits = useCompletedSingleVisitData();

  // 3 điểm vào khác nhau (nút "Xem hồ sơ" ở tab khách hàng, click 1 dòng khám/dịch vụ lẻ hoặc 1 dòng
  // liệu trình ở tab hồ sơ điều trị) đều mở cùng 1 modal PatientEmrDetail qua cùng useCustomerEmr —
  // 2 cái sau còn kèm highlightTarget để tự cuộn tới + nhấp nháy đúng card vừa bấm.
  const handleViewProfile = (customer: CustomerOverviewItem) => emr.openCustomer(customer.id);
  const handleViewPlanProfile = (khachHangId: string, planId: string) =>
    emr.openCustomer(khachHangId, { type: 'plan', id: planId });
  const handleViewVisitProfile = (khachHangId: string, visitId: string) =>
    emr.openCustomer(khachHangId, { type: 'visit', id: visitId });

  return (
    <div className="recovery-arc-scope space-y-6">
      {!emr.patient ? (
        <div className="space-y-6 animate-fade-in">
          {/* HUD Header Đồng Nhất Toàn Hệ Thống Admin */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-[28px] border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/30 dark:shadow-none relative overflow-hidden font-jakarta">
            <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping"></span>
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-600 dark:text-teal-400">HÀNH TRÌNH PHỤC HỒI</span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">QUẢN LÝ KHÁCH HÀNG</h2>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                Theo dõi khách hàng theo đúng hành trình phục hồi thực tế — từ buổi khám đầu tiên đến khi hoàn thành liệu trình
              </p>
            </div>

            {/* Unified View Tab Switcher */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shrink-0">
              <button
                type="button"
                onClick={() => setView('customer')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  view === 'customer'
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Theo Khách Hàng
              </button>
              <button
                type="button"
                onClick={() => setView('plan')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  view === 'plan'
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Hồ Sơ Điều Trị
              </button>
            </div>
          </div>

          {view === 'customer' ? (
            <>
              <CustomerSummaryCards
                totalCustomers={list.totalCustomers}
                customersWithoutRecord={list.emrStats?.customers_without_record || 0}
                activeFilter={filters.recordFilter}
                onFilterChange={filters.toggleRecordFilter}
              />

              <CustomerFilterToolbar
                repTier={filters.repTier}
                onRepTierChange={filters.setRepTier}
                search={filters.searchInput}
                onSearchChange={filters.setSearchInput}
                showLockedOnly={filters.showLockedOnly}
                onToggleLockedOnly={filters.toggleLockedOnly}
              />

              <CustomerTable
                data={list.data}
                loading={list.loading}
                meta={list.meta}
                onPageChange={list.setPage}
                onViewProfile={handleViewProfile}
                onEdit={actions.startEdit}
                onToggleLock={actions.requestToggleLock}
              />
            </>
          ) : (
            <>
              <div className="space-y-4">
                <SectionHeading
                  icon={<Stethoscope size={16} />}
                  label="Ca khám & dịch vụ lẻ hoàn thành"
                  count={singleVisits.meta.total}
                  countLabel="ca"
                />
                <CompletedSingleVisitTable
                  data={singleVisits.data}
                  loading={singleVisits.loading}
                  meta={singleVisits.meta}
                  onPageChange={singleVisits.setPage}
                  onViewProfile={handleViewVisitProfile}
                />
              </div>

              <div className="space-y-4">
                <SectionHeading
                  icon={<ClipboardList size={16} />}
                  label="Gói liệu trình"
                  count={plans.meta.total}
                  countLabel="liệu trình"
                />
                <TreatmentPlanFilterToolbar
                  activeStatus={planFilters.activeStatus}
                  onStatusChange={planFilters.setActiveStatus}
                  counts={planCounts}
                  search={planFilters.searchInput}
                  onSearchChange={planFilters.setSearchInput}
                />

                <TreatmentPlanTable
                  data={plans.data}
                  loading={plans.loading}
                  meta={plans.meta}
                  onPageChange={plans.setPage}
                  onViewProfile={handleViewPlanProfile}
                />
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="animate-fade-in">
          {emr.loading || !emr.patientInfo ? (
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-16 text-center flex flex-col items-center justify-center gap-3">
              <div className="size-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 animate-pulse">
                Đang tải hồ sơ điều trị & dòng thời gian...
              </p>
            </div>
          ) : (
            <PatientDossierTimeline
              selectedPatient={emr.patientInfo}
              profile={emr.profile}
              onBack={emr.closeCustomer}
              highlightTarget={emr.highlightTarget}
              onBookNextSession={(plan) => {
                const nextSessionNum = (plan.so_buoi_da_dung || 0) + 1;
                navigate(`/admin/appointments?khach_hang_id=${emr.patientInfo?.id}&goi_dich_vu_id=${(plan as any).goi_dich_vu_id || ''}&phac_do_id=${plan.id}&buoi=${nextSessionNum}`);
              }}
            />
          )}
        </div>
      )}

      <EditCustomerModal
        isOpen={!!actions.editingCustomerId}
        form={actions.editForm}
        onChange={actions.setEditForm}
        onSave={actions.saveProfile}
        onCancel={actions.cancelEdit}
      />

      <ConfirmDialog
        isOpen={!!actions.lockTarget}
        type={actions.lockTarget?.isLocked ? 'danger' : 'success'}
        title={actions.lockTarget?.isLocked ? 'Khóa tài khoản khách hàng?' : 'Mở khóa tài khoản khách hàng?'}
        message={
          <CustomerLockDialogMessage
            hoTen={actions.lockTarget?.ho_ten || ''}
            willLock={!!actions.lockTarget?.isLocked}
            impactLoading={actions.lockImpactLoading}
            impact={actions.lockImpact}
          />
        }
        confirmLabel={actions.lockTarget?.isLocked ? 'Khóa tài khoản' : 'Mở khóa'}
        onConfirm={actions.confirmToggleLock}
        onCancel={actions.cancelToggleLock}
      />
    </div>
  );
}
