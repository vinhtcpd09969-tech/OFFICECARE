import { useEffect, useState } from 'react';
import type { CustomerStatusFilter, ReputationTier } from '../types';

// State thuần cho filter — không gọi API, chỉ debounce search để hook fetch dữ liệu dùng.
// Tier trạng thái giờ là SINGLE-SELECT (bấm 1 trạm trên "Đường cong Phục hồi"), khác với chip đa
// chọn cũ; "khóa tài khoản" là 1 trục độc lập (checkbox riêng, không thuộc hành trình điều trị).
export function useCustomerFilters() {
  const [activeTier, setActiveTier] = useState<CustomerStatusFilter | 'all'>('all');
  const [showLockedOnly, setShowLockedOnly] = useState(false);
  const [repTier, setRepTier] = useState<ReputationTier | 'all'>('all');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const toggleLockedOnly = () => setShowLockedOnly(prev => !prev);

  return {
    activeTier, setActiveTier,
    showLockedOnly, toggleLockedOnly,
    repTier, setRepTier,
    searchInput, setSearchInput,
    debouncedSearch
  };
}
