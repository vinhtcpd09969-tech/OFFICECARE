import { ConfirmDialog } from '../../../../components/ConfirmDialog';
import PatientEmrDetail from '../../components/PatientEmrDetail';
import { CustomerJourneyArc } from '../../components/customers/ui/CustomerJourneyArc';
import { CustomerFilterToolbar } from '../../components/customers/ui/CustomerFilterToolbar';
import { CustomerTable } from '../../components/customers/ui/CustomerTable';
import { EditCustomerModal } from '../../components/customers/ui/EditCustomerModal';
import { useCustomerFilters } from '../../components/customers/hooks/useCustomerFilters';
import { useCustomerListData } from '../../components/customers/hooks/useCustomerListData';
import { useCustomerActions } from '../../components/customers/hooks/useCustomerActions';
import { useCustomerEmr } from '../../components/customers/hooks/useCustomerEmr';
import type { CustomerOverviewItem } from '../../components/customers/types';
import './recovery-arc-theme.css';

export default function ManageCustomers() {
  const filters = useCustomerFilters();
  const list = useCustomerListData({
    activeTier: filters.activeTier, showLockedOnly: filters.showLockedOnly,
    repTier: filters.repTier, search: filters.debouncedSearch
  });
  const actions = useCustomerActions(list.refetch);
  const emr = useCustomerEmr();

  const handleViewProfile = (customer: CustomerOverviewItem) => emr.openCustomer(customer.id);

  return (
    <div className="recovery-arc-scope space-y-6">
      {!emr.patient ? (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="rc-display text-2xl font-semibold tracking-tight" style={{ color: 'var(--rc-ink)' }}>Quản lý Khách hàng</h2>
            <p className="text-xs font-semibold mt-1" style={{ color: 'var(--rc-taupe)' }}>
              Theo dõi khách hàng theo đúng hành trình phục hồi thực tế — từ buổi khám đầu tiên đến khi hoàn thành liệu trình.
            </p>
          </div>

          <CustomerJourneyArc
            totalCustomers={list.totalCustomers}
            newThisMonth={list.newThisMonth}
            tierCounts={list.emrStats?.customer_tiers || { pending: 0, progress: 0, le: 0, cancel: 0, done: 0, none: 0 }}
            khamHoanThanh={list.emrStats?.kham_hoan_thanh || 0}
            dichVuLeHoanThanh={list.emrStats?.dich_vu_le_hoan_thanh || 0}
            totalRevenue={list.totalRevenue}
            activeTier={filters.activeTier}
            onFilterChange={filters.setActiveTier}
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
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm animate-fade-in">
          {emr.loading ? (
            <div className="py-20 text-center text-slate-400 font-semibold text-xs animate-pulse">Đang tải hồ sơ khách hàng...</div>
          ) : (
            <PatientEmrDetail patient={emr.patient} onBack={emr.closeCustomer} showAdminInfo={false} />
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
          actions.lockTarget?.isLocked
            ? `Khách hàng "${actions.lockTarget?.ho_ten}" sẽ không thể đăng nhập vào hệ thống nữa.`
            : `Khách hàng "${actions.lockTarget?.ho_ten}" sẽ có thể đăng nhập lại bình thường.`
        }
        confirmLabel={actions.lockTarget?.isLocked ? 'Khóa tài khoản' : 'Mở khóa'}
        onConfirm={actions.confirmToggleLock}
        onCancel={actions.cancelToggleLock}
      />
    </div>
  );
}
