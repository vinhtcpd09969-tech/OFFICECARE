import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getCustomerMedicalRecord } from '../../../api/customer.api';
import type { MedicalRecordData, RecordTab } from '../types';

export function useMedicalRecord() {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<MedicalRecordData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<RecordTab>('goi');
  const [expandedPackages, setExpandedPackages] = useState<Record<string, boolean>>({});

  // Điều hướng sâu từ nút "Chi tiết buổi" ở trang Lịch hẹn (?phac_do_id=...&buoi=...) — tự mở
  // đúng gói và cuộn tới đúng buổi, chỉ áp dụng 1 lần lúc data vừa tải xong.
  const deepLinkApplied = useRef(false);

  const fetchRecord = async () => {
    try {
      setLoading(true);
      const res = await getCustomerMedicalRecord();
      setData(res.data);

      if (res.data?.goi_dieu_tri?.length > 0) {
        setExpandedPackages({ [res.data.goi_dieu_tri[0].phac_do_id]: true });
      }
    } catch (err) {
      console.error('Lỗi khi tải hồ sơ trị liệu:', err);
      toast.error('Không thể tải thông tin hồ sơ trị liệu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecord();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (deepLinkApplied.current || !data) return;
    const phacDoId = searchParams.get('phac_do_id');
    const buoiId = searchParams.get('buoi');
    if (!phacDoId) return;

    deepLinkApplied.current = true;
    setActiveTab('goi');
    setExpandedPackages((prev) => ({ ...prev, [phacDoId]: true }));

    const targetId = buoiId ? `session-${buoiId}` : `package-${phacDoId}`;
    // Chờ DOM render xong khối vừa mở rộng rồi mới cuộn tới.
    setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  }, [data, searchParams]);

  const togglePackage = (id: string) => {
    setExpandedPackages((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Bấm "Xem liệu trình" từ 1 thẻ ca khám đã chỉ định ra phác đồ — nhảy sang tab Gói liệu trình,
  // mở đúng thẻ và cuộn tới, dùng chung cơ chế deep-link ở trên.
  const jumpToPackage = (phacDoId: string) => {
    setActiveTab('goi');
    setExpandedPackages((prev) => ({ ...prev, [phacDoId]: true }));
    setTimeout(() => {
      document.getElementById(`package-${phacDoId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  };

  return {
    data,
    loading,
    activeTab,
    setActiveTab,
    expandedPackages,
    togglePackage,
    jumpToPackage,
    refetch: fetchRecord,
  };
}
