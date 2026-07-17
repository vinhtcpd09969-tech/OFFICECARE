import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { getCustomersOverview, getDashboardSummary } from '../../../api/admin.api';
import { DEFAULT_PAGE_SIZE } from '../constants';
import type { CustomerOverviewItem, CustomerStatusFilter, EmrStats, ReputationTier } from '../types';

interface UseCustomerListDataParams {
  activeTier: CustomerStatusFilter | 'all';
  showLockedOnly: boolean;
  repTier: ReputationTier | 'all';
  search: string;
}

export function useCustomerListData({ activeTier, showLockedOnly, repTier, search }: UseCustomerListDataParams) {
  const [data, setData] = useState<CustomerOverviewItem[]>([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: DEFAULT_PAGE_SIZE, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [totalCustomers, setTotalCustomers] = useState(0);
  const [newThisMonth, setNewThisMonth] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [emrStats, setEmrStats] = useState<EmrStats | null>(null);

  const statusKey = [activeTier !== 'all' ? activeTier : null, showLockedOnly ? 'locked' : null].filter(Boolean).join(',');

  // Đổi filter/search thì luôn quay về trang 1.
  useEffect(() => {
    setPage(1);
  }, [statusKey, repTier, search]);

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      const status: string[] = [];
      if (activeTier !== 'all') status.push(activeTier);
      if (showLockedOnly) status.push('locked');
      const res = await getCustomersOverview({
        page,
        pageSize: DEFAULT_PAGE_SIZE,
        search: search || undefined,
        status: status.length ? status : undefined,
        repTier: repTier !== 'all' ? repTier : undefined
      });
      setData(res.data.data || []);
      setMeta(res.data.meta || { page: 1, pageSize: DEFAULT_PAGE_SIZE, total: 0, totalPages: 1 });
    } catch (error) {
      console.error('Error fetching customers overview:', error);
      toast.error('Không thể tải danh sách khách hàng.');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, statusKey, repTier]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    getDashboardSummary()
      .then(res => {
        setTotalCustomers(Number(res.data?.total_customers || 0));
        setNewThisMonth(Number(res.data?.customers_this_month || 0));
        setTotalRevenue(Number(res.data?.total_revenue || 0));
        setEmrStats(res.data?.emr_stats || null);
      })
      .catch(err => console.error('Error fetching customer stat cards:', err));
  }, []);

  return {
    data, meta, page, setPage, loading, refetch: fetchList,
    totalCustomers, newThisMonth, totalRevenue, emrStats
  };
}
