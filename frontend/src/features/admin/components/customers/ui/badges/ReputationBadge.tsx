import { getReputationTier } from '../../constants';

const TIER_COLOR_VAR: Record<string, string> = {
  low: 'var(--rc-rust)',
  mid: 'var(--rc-amber)',
  high: 'var(--rc-sage)'
};

// Dial nửa hình tròn (conic-gradient cắt còn nửa trên) thay cho badge chữ — cùng ngôn ngữ hình học
// với "Đường cong Phục hồi" ở card thống kê phía trên trang.
export function ReputationBadge({ score }: { score: number }) {
  const tier = getReputationTier(score || 0);
  const displayScore = Math.min(100, score || 0);
  const color = TIER_COLOR_VAR[tier];

  return (
    <span className="recovery-arc-scope inline-flex items-center gap-2">
      <span className="relative shrink-0 overflow-hidden" style={{ width: 34, height: 18 }}>
        <span
          className="absolute top-0 left-0 rounded-full"
          style={{
            width: 34, height: 34,
            background: `conic-gradient(from 180deg, ${color} 0deg ${displayScore * 1.8}deg, var(--rc-track) 0deg)`
          }}
        />
        <span className="absolute rounded-full" style={{ top: 5, left: 5, width: 24, height: 24, background: 'var(--rc-card)' }} />
      </span>
      <span className="rc-mono font-semibold text-[12.5px]" style={{ color: 'var(--rc-ink)' }}>{displayScore}</span>
    </span>
  );
}
