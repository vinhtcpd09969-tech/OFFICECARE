export type CheckinTimingState = 'upcoming' | 'due_soon' | 'overdue' | 'overdue_critical';

export interface CheckinTimingInfo {
  state: CheckinTimingState;
  label: string;
}

const DUE_SOON_THRESHOLD_MS = 10 * 60 * 1000;
const OVERDUE_CRITICAL_THRESHOLD_MS = 10 * 60 * 1000;

function formatDurationLong(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} ngày`);
  if (hours > 0) parts.push(`${hours} giờ`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes} phút`);
  return parts.join(' ');
}

function formatDurationShort(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (minutes > 0) parts.push(`${minutes} phút`);
  parts.push(`${seconds} giây`);
  return parts.join(' ');
}

// Chỉ áp dụng cho lịch đã xác nhận (da_xac_nhan), đang chờ khách đến check-in.
export function getCheckinTimingInfo(startIso: string, now: number = Date.now()): CheckinTimingInfo {
  const startMs = new Date(startIso).getTime();
  const diffMs = startMs - now;

  if (diffMs > DUE_SOON_THRESHOLD_MS) {
    return { state: 'upcoming', label: `Còn ${formatDurationLong(diffMs)}` };
  }

  if (diffMs > 0) {
    return { state: 'due_soon', label: `Vui lòng check-in · còn ${formatDurationShort(diffMs)}` };
  }

  const overdueMs = -diffMs;
  return {
    state: overdueMs > OVERDUE_CRITICAL_THRESHOLD_MS ? 'overdue_critical' : 'overdue',
    label: `Đã quá ${formatDurationShort(overdueMs)}`
  };
}
