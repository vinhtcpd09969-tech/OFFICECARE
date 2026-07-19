// Điểm uy tín (khach_hang.diem_uy_tin) → 1 trong 3 hạng — dùng chung cho cả Admin (badge trong
// bảng khách hàng) và Customer (hiển thị trên hồ sơ của chính khách). Cap hiển thị ở 100 (điểm
// >100 vẫn hiện hạng cao nhất do admin có thể nhập tay vượt mốc).
export type ReputationTier = 'low' | 'mid' | 'high';

export function getReputationTier(score: number): ReputationTier {
  const v = Math.min(100, score);
  if (v <= 40) return 'low';
  if (v <= 70) return 'mid';
  return 'high';
}
