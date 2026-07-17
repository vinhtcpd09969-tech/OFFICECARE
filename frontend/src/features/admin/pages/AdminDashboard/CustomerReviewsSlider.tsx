import { useState, useEffect } from 'react';
import api from '../../../../api/axios';
import { MessageSquare, ChevronLeft, ChevronRight, Star } from 'lucide-react';

interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
}

export function CustomerReviewsSlider() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/analytics/reviews');
      setReviews(res.data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrev = () => {
    if (reviews.length === 0) return;
    setActiveIndex((prev) => (prev === 0 ? reviews.length - 1 : prev - 1));
  };

  const handleNext = () => {
    if (reviews.length === 0) return;
    setActiveIndex((prev) => (prev === reviews.length - 1 ? 0 : prev + 1));
  };

  const currentReview = reviews[activeIndex];

  return (
    <div 
      className="bg-white p-6 md:p-8 rounded-[32px] border border-zinc-100/80 shadow-soft-ui flex flex-col justify-between opacity-0 animate-slide-up h-full min-h-[300px]"
      style={{ animationDelay: '420ms' }}
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-6 border-b border-zinc-50 pb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="text-teal-600 shrink-0" size={18} />
            <h3 className="text-sm font-extrabold text-secondary">Đánh Giá Khách Hàng</h3>
          </div>
          
          {/* Navigation Controls */}
          {reviews.length > 1 && (
            <div className="flex items-center gap-1.5 bg-zinc-50 p-1 rounded-xl border border-zinc-200/50">
              <button
                onClick={handlePrev}
                className="size-6 rounded-lg hover:bg-white text-zinc-500 hover:text-secondary transition-all cursor-pointer flex items-center justify-center shadow-sm"
              >
                <ChevronLeft size={14} className="stroke-[2.5]" />
              </button>
              <button
                onClick={handleNext}
                className="size-6 rounded-lg hover:bg-white text-zinc-500 hover:text-secondary transition-all cursor-pointer flex items-center justify-center shadow-sm"
              >
                <ChevronRight size={14} className="stroke-[2.5]" />
              </button>
            </div>
          )}
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="text-zinc-400 text-xs font-bold animate-pulse text-center py-12">Đang tải nhận xét...</div>
        ) : reviews.length === 0 ? (
          <div className="text-zinc-400 text-xs italic text-center py-12 font-bold">Chưa có nhận xét nào từ khách hàng.</div>
        ) : (
          <div className="space-y-4 animate-fade-in" key={currentReview.id}>
            {/* Stars rating */}
            <div className="flex items-center gap-0.5 text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star 
                  key={i} 
                  size={14} 
                  className={i < currentReview.rating ? 'fill-amber-400 stroke-none' : 'text-zinc-200 fill-zinc-200 stroke-none'} 
                />
              ))}
            </div>

            {/* Comment Text */}
            <p className="text-xs text-zinc-550 leading-relaxed font-semibold italic min-h-[70px]">
              "{currentReview.comment || 'Khách hàng không để lại bình luận.'}"
            </p>

            {/* Reviewer Meta */}
            <div className="flex items-center gap-3 pt-3 border-t border-zinc-50">
              <div className="size-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-650 font-black text-xs">
                {currentReview.name?.charAt(0) || 'K'}
              </div>
              <div>
                <p className="font-extrabold text-secondary text-xs">{currentReview.name}</p>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">Khách hàng trị liệu</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
