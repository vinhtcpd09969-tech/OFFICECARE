import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { getCompletedSingleVisits } from '../../../api/admin.api';
import { SINGLE_VISIT_PAGE_SIZE } from '../constants';
import type { CompletedSingleVisitItem } from '../types';

// Khối "Ca khám & dịch vụ lẻ hoàn thành" (tab Hồ sơ điều trị) — không filter, chỉ phân trang.
export function useCompletedSingleVisitData() {
  const [data, setData] = useState<CompletedSingleVisitItem[]>([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: SINGLE_VISIT_PAGE_SIZE, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getCompletedSingleVisits({ page, pageSize: SINGLE_VISIT_PAGE_SIZE });
      setData(res.data.data || []);
      setMeta(res.data.meta || { page: 1, pageSize: SINGLE_VISIT_PAGE_SIZE, total: 0, totalPages: 1 });
    } catch (error) {
      console.error('Error fetching completed single visits:', error);
      toast.error('Không thể tải danh sách ca khám lẻ hoàn thành.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  return { data, meta, page, setPage, loading, refetch: fetchList };
}
