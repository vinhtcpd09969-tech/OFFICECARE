import { Star, MessageSquareQuote } from 'lucide-react';
import { censorText } from '../../../../../utils/profanity';

interface SessionRatingControlProps {
  stars: number | null;
  comment: string | null;
  reply?: string | null;
}

export function SessionRatingControl({ stars, comment, reply }: SessionRatingControlProps) {
  if (!stars) return null;

  const emotionMap: Record<number, string> = {
    5: '😍 Tuyệt vời',
    4: '😊 Hài lòng',
    3: '😐 Đạt yêu cầu',
    2: '🙁 Chưa hài lòng',
    1: '😡 Rất thất vọng'
  };

  return (
    <div className="space-y-2.5">
      <div className="bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-2xl p-3.5 shadow-2xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black uppercase text-amber-800 dark:text-amber-300 tracking-wider">
              {emotionMap[stars] || 'Đánh giá của bạn'}
            </span>
          </div>
          <div className="flex text-amber-400 gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={13} className={i < stars ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-zinc-700'} />
            ))}
          </div>
        </div>
        {comment && (
          <p className="text-xs text-slate-600 dark:text-zinc-300 italic mt-2 leading-relaxed bg-white/60 dark:bg-zinc-900/60 p-2.5 rounded-xl border border-amber-100 dark:border-zinc-800">
            "{censorText(comment)}"
          </p>
        )}
      </div>

      {reply && (
        <div className="bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-900/40 rounded-2xl p-3.5 border-l-4 border-l-teal-600 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-teal-800 dark:text-teal-300">
            <MessageSquareQuote size={13} className="text-teal-600" />
            <span className="text-[10px] font-black uppercase tracking-wider">Phản hồi từ Trung tâm OfficeCare:</span>
          </div>
          <p className="text-xs text-slate-700 dark:text-zinc-200 italic leading-relaxed pl-1">"{reply}"</p>
        </div>
      )}
    </div>
  );
}

export default SessionRatingControl;
