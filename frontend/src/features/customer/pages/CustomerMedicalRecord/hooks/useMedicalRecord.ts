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
  const [targetSessionId, setTargetSessionId] = useState<string | null>(null);

  // Điều hướng sâu từ nút "Chi tiết buổi" ở trang Lịch hẹn (?phac_do_id=...&buoi=...) — tự mở
  // đúng tab, mở rộng thẻ gói, tự động bật/sổ nội dung buổi và cuộn tới kèm hiệu ứng highlight nhẹ.
  const deepLinkApplied = useRef(false);

  const fetchRecord = async () => {
    try {
      setLoading(true);
      const res = await getCustomerMedicalRecord();
      setData(res.data);
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
    const tabParam = searchParams.get('tab') as RecordTab | null;
    const phacDoId = searchParams.get('phac_do_id');
    const buoiId = searchParams.get('buoi') || searchParams.get('buoi_id');
    const cuocHenId = searchParams.get('cuoc_hen_id');

    const targetId = buoiId || cuocHenId;
    if (targetId) setTargetSessionId(targetId);

    // 1. Phác đồ / Buổi thuộc gói liệu trình
    if (phacDoId || (targetId && data.goi_dieu_tri?.some((pkg) => pkg.buoi_dieu_tri.some((s) => s.cuoc_hen_id === targetId)))) {
      deepLinkApplied.current = true;
      setActiveTab('goi');

      let targetPkgId = phacDoId;
      if (!targetPkgId && targetId && data.goi_dieu_tri) {
        const foundPkg = data.goi_dieu_tri.find((pkg) => pkg.buoi_dieu_tri.some((s) => s.cuoc_hen_id === targetId));
        if (foundPkg) targetPkgId = foundPkg.phac_do_id;
      }

      if (targetPkgId) {
        setExpandedPackages((prev) => ({ ...prev, [targetPkgId!]: true }));
      }

      const elementId = targetId ? `session-${targetId}` : `package-${targetPkgId}`;
      setTimeout(() => {
        const el = document.getElementById(elementId) || document.getElementById(`package-${targetPkgId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-2', 'ring-[#0D9488]', 'ring-offset-2', 'transition-all', 'duration-500', 'rounded-3xl');
          setTimeout(() => {
            el.classList.remove('ring-2', 'ring-[#0D9488]', 'ring-offset-2');
          }, 2500);
        }
      }, 250);
      return;
    }

    // 2. Dịch vụ lẻ
    if (tabParam === 'le' || (targetId && data.dieu_tri_le?.some((item) => item.cuoc_hen_id === targetId))) {
      deepLinkApplied.current = true;
      setActiveTab('le');
      if (targetId) {
        setTimeout(() => {
          const el = document.getElementById(`appointment-${targetId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('ring-2', 'ring-[#0D9488]', 'ring-offset-2', 'transition-all', 'duration-500');
            setTimeout(() => {
              el.classList.remove('ring-2', 'ring-[#0D9488]', 'ring-offset-2');
            }, 2500);
          }
        }, 250);
      }
      return;
    }

    // 3. Khám lâm sàng
    if (tabParam === 'kham' || (targetId && data.lich_su_kham?.some((item) => item.cuoc_hen_id === targetId))) {
      deepLinkApplied.current = true;
      setActiveTab('kham');
      if (targetId) {
        setTimeout(() => {
          const el = document.getElementById(`appointment-${targetId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('ring-2', 'ring-[#0D9488]', 'ring-offset-2', 'transition-all', 'duration-500');
            setTimeout(() => {
              el.classList.remove('ring-2', 'ring-[#0D9488]', 'ring-offset-2');
            }, 2500);
          }
        }, 250);
      }
      return;
    }
  }, [data, searchParams]);

  const togglePackage = (id: string) => {
    setExpandedPackages((prev) => ({ ...prev, [id]: !prev[id] }));
  };

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
    targetSessionId,
    togglePackage,
    jumpToPackage,
    refetch: fetchRecord,
  };
}
