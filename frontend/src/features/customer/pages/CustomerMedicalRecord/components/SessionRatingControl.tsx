import { Star } from 'lucide-react';
import { censorText } from '../../../../../utils/profanity';

interface SessionRatingControlProps {
  stars: number | null;
  comment: string | null;
  reply?: string | null;
}

// Chỉ hiển thị đánh giá ĐÃ CÓ (read-only) — nút "Gửi đánh giá" theo từng buổi đã bỏ vì trang Lịch
// hẹn đã có luồng nhắc đánh giá riêng (getPendingRatingAppointments), tránh trùng 2 nơi.
export function SessionRatingControl({ stars, comment, reply }: SessionRatingControlProps) {
  if (!stars) return null;

  return (
    <div className="space-y-2">
      <div className="bg-teal-50/45 border border-teal-100/60 rounded-xl p-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-black uppercase text-teal-700 tracking-wider">Đánh giá của bạn:</span>
          <div className="flex text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={12} fill={i < stars ? 'currentColor' : 'none'} />
            ))}
          </div>
        </div>
        {comment && <p className="text-xs text-zinc-500 italic mt-1 leading-relaxed">"{censorText(comment)}"</p>}
      </div>

      {reply && (
        <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 ml-4 border-l-2 border-l-[#0D9488]">
          <p className="text-[10px] font-black uppercase text-[#0D9488] tracking-wider">Phản hồi từ OfficeCare:</p>
          <p className="text-xs text-slate-655 italic mt-1 leading-relaxed">"{reply}"</p>
        </div>
      )}
    </div>
  );
}

export default SessionRatingControl;
