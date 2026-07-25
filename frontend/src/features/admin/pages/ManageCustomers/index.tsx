import { useState } from 'react';
import { Stethoscope, ClipboardList } from 'lucide-react';
import { ConfirmDialog } from '../../../../components/ConfirmDialog';
import PatientEmrDetail from '../../components/PatientEmrDetail';
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
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="rc-display text-2xl font-semibold tracking-tight" style={{ color: 'var(--rc-ink)' }}>Quản lý Khách hàng</h2>
              <p className="text-xs font-semibold mt-1" style={{ color: 'var(--rc-taupe)' }}>
                Theo dõi khách hàng theo đúng hành trình phục hồi thực tế — từ buổi khám đầu tiên đến khi hoàn thành liệu trình.
              </p>
            </div>
            <div className="inline-flex items-center gap-1 p-1 rounded-[11px] shrink-0" style={{ background: 'var(--rc-track)' }}>
              <button
                type="button"
                onClick={() => setView('customer')}
                className="px-3.5 py-2 rounded-[8px] text-[12px] font-bold transition-all"
                style={view === 'customer'
                  ? { background: 'var(--rc-card)', color: 'var(--rc-ink)', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }
                  : { color: 'var(--rc-taupe)' }}
              >
                Theo khách hàng
              </button>
              <button
                type="button"
                onClick={() => setView('plan')}
                className="px-3.5 py-2 rounded-[8px] text-[12px] font-bold transition-all"
                style={view === 'plan'
                  ? { background: 'var(--rc-card)', color: 'var(--rc-ink)', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }
                  : { color: 'var(--rc-taupe)' }}
              >
                Hồ sơ điều trị
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
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm animate-fade-in">
          {emr.loading ? (
            <div className="py-20 text-center text-slate-400 font-semibold text-xs animate-pulse">Đang tải hồ sơ khách hàng...</div>
          ) : (
            <PatientEmrDetail patient={emr.patient} onBack={emr.closeCustomer} showAdminInfo={false} highlightTarget={emr.highlightTarget} />
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
