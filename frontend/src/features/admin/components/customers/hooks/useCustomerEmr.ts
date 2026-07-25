import { useCallback, useState } from 'react';
import { toast } from 'react-hot-toast';
import { getCustomerEmr } from '../../../api/admin.api';

export interface EmrHighlightTarget {
  type: 'plan' | 'visit';
  id: string;
}

// Lazy-load hồ sơ đầy đủ (plans + appointments + reminder) của 1 khách hàng — chỉ gọi khi Admin bấm
// "Xem hồ sơ", thay vì tải getMedicalRecords() toàn hệ thống như trang danh sách cũ.
export function useCustomerEmr() {
  const [patient, setPatient] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  // Đích cần cuộn tới + nhấn hiệu ứng khi mở hồ sơ từ 1 dòng cụ thể ở tab "Hồ sơ điều trị" (khác
  // nút "Xem hồ sơ" ở tab khách hàng, vốn không có đích cụ thể nào — highlight = undefined).
  const [highlightTarget, setHighlightTarget] = useState<EmrHighlightTarget | null>(null);

  const openCustomer = useCallback(async (customerId: string, highlight?: EmrHighlightTarget) => {
    try {
      setLoading(true);
      setHighlightTarget(highlight || null);
      const res = await getCustomerEmr(customerId);
      setPatient(res.data);
    } catch (error) {
      console.error('Error fetching customer emr:', error);
      toast.error('Không thể tải hồ sơ khách hàng.');
    } finally {
      setLoading(false);
    }
  }, []);

  const closeCustomer = () => {
    setPatient(null);
    setHighlightTarget(null);
  };

  const patchPatient = (partial: any) => {
    setPatient((prev: any) => (prev ? { ...prev, ...partial } : prev));
  };

  return { patient, loading, highlightTarget, openCustomer, closeCustomer, patchPatient };
}
