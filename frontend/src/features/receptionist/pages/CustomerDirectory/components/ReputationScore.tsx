import { getReputationTier } from '../../../../../utils/reputation';

const TIER_STYLE: Record<string, string> = {
  low: 'bg-rose-50 text-rose-700 border-rose-150',
  mid: 'bg-amber-50 text-amber-700 border-amber-150',
  high: 'bg-emerald-50 text-emerald-700 border-emerald-150',
};

export function ReputationScore({ score }: { score: number }) {
  const tier = getReputationTier(score || 0);
  const displayScore = Math.min(100, score || 0);

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-black font-mono ${TIER_STYLE[tier]}`}>
      {displayScore}
      <span className="text-[9px] font-bold opacity-70">/100</span>
    </span>
  );
}
