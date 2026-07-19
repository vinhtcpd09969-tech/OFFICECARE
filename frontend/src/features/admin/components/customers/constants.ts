import type { CustomerStatusTier, ReputationTier } from './types';

// Nhãn cho từng tier — 4 trạng thái liệu trình có tiền tố "Liệu trình" để không nhầm với trạng
// thái buổi hẹn/ca khám (cũng dùng chữ "Đang điều trị"/"Hoàn thành" ở nơi khác trong app).
export const TIER_META: Record<CustomerStatusTier, { label: string }> = {
  none: { label: 'Chưa có hồ sơ điều trị' },
  le: { label: 'Chỉ khám / DV lẻ' },
  pending: { label: 'Liệu trình chờ kích hoạt' },
  progress: { label: 'Liệu trình đang điều trị' },
  done: { label: 'Liệu trình hoàn thành' },
  cancel: { label: 'Liệu trình đã hủy' }
};

export const REPUTATION_TIER_OPTIONS: { value: ReputationTier | 'all'; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'low', label: '0–40' },
  { value: 'mid', label: '41–70' },
  { value: 'high', label: '71–100' }
];

export { getReputationTier } from '../../../../utils/reputation';

export const DEFAULT_PAGE_SIZE = 20;
