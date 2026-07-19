// Định dạng tiền tệ/số điện thoại dùng chung — KHÔNG import từ frontend/src/shared/utils/ (bản mồ
// côi từ lần migrate FSD dở dang, xem CLAUDE.md mục "Nợ kỹ thuật đã biết").
export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return '0đ';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0đ';
  return `${num.toLocaleString('vi-VN')}đ`;
}

export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}
