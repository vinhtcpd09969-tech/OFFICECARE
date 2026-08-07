export type Buoi = 'sang' | 'chieu';

export const BUOI_INFO: Record<Buoi, { label: string; khung: string; batDau: string; ketThuc: string }> = {
  sang: { label: 'Buổi sáng', khung: '7:30 - 12:00', batDau: '07:30', ketThuc: '12:00' },
  chieu: { label: 'Buổi chiều', khung: '12:00 - 19:30', batDau: '12:00', ketThuc: '19:30' }
};

export const fullDateFormatter = new Intl.DateTimeFormat('vi-VN', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

export const formatLocalDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Generate available date list for the next 14 days
export const generateAvailableDates = (): Date[] => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const nextDate = new Date();
    nextDate.setDate(today.getDate() + i);
    dates.push(nextDate);
  }
  return dates;
};

/** Buổi đặt cho hôm nay đã trôi qua giờ nhận khách kết thúc — mirror `isBuoiDaQua` phía backend
 * (đặt buổi sáng sau 12h00 thì không đặt được nữa). Ngày trong quá khứ luôn coi là đã qua. */
export const isBuoiDaQua = (dateStr: string, buoi: Buoi): boolean => {
  const todayStr = formatLocalDate(new Date());
  if (dateStr < todayStr) return true;
  if (dateStr > todayStr) return false;
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const [h, m] = BUOI_INFO[buoi].ketThuc.split(':').map(Number);
  return nowMinutes >= h * 60 + m;
};

export const getVietnameseDay = (date: Date): string => {
  const day = date.getDay();
  if (day === 0) return 'CN';
  return `T${day + 1}`;
};

export const formatFullDate = (dateString: string): string => {
  if (!dateString) return '';
  try {
    return fullDateFormatter.format(new Date(dateString));
  } catch (e) {
    return dateString;
  }
};
