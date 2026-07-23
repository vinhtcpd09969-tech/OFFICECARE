/**
 * @deprecated Import from '@/shared/utils/date' instead.
 * This file re-exports for backward compatibility.
 */
export { convertToVietnamUtcIso, formatLocalDate, getVietnameseDay, getMonthYearString } from '../shared/utils/date';

/**
 * Format khoảng cách thời gian tới 1 mốc ISO thành nhãn tương đối (Hôm nay/Hôm qua/N ngày trước).
 * Dùng chung cho các cột "Lần cuối dùng dịch vụ" ở bảng danh sách khách hàng/bệnh nhân.
 */
export function formatDaysAgo(isoDate: string | null | undefined): string {
  if (!isoDate) return 'Chưa từng sử dụng';
  const days = Math.floor((Date.now() - new Date(isoDate).getTime()) / 86400000);
  if (days <= 0) return 'Hôm nay';
  if (days === 1) return 'Hôm qua';
  return `${days} ngày trước`;
}
