import { useCallback, useState } from 'react';
import { toast } from 'react-hot-toast';
import { getCustomerEmr } from '../../../api/admin.api';

// Lazy-load hồ sơ đầy đủ (plans + appointments + reminder) của 1 khách hàng — chỉ gọi khi Admin bấm
// "Xem hồ sơ", thay vì tải getMedicalRecords() toàn hệ thống như trang danh sách cũ.
export function useCustomerEmr() {
  const [patient, setPatient] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const openCustomer = useCallback(async (customerId: string) => {
    try {
      setLoading(true);
      const res = await getCustomerEmr(customerId);
      setPatient(res.data);
    } catch (error) {
      console.error('Error fetching customer emr:', error);
      toast.error('Không thể tải hồ sơ khách hàng.');
    } finally {
      setLoading(false);
    }
  }, []);

  const closeCustomer = () => setPatient(null);

  const patchPatient = (partial: any) => {
    setPatient((prev: any) => (prev ? { ...prev, ...partial } : prev));
  };

  return { patient, loading, openCustomer, closeCustomer, patchPatient };
}
