import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Send,
  Loader2,
  CheckCircle2,
  CheckSquare,
  Square,
  MessageSquare,
  Eye,
  Clock
} from 'lucide-react';
import { Feedback } from './FeedbackDetailModal';

interface FeedbackTableProps {
  loading: boolean;
  filteredFeedbacks: Feedback[];
  feedbacks: Feedback[];
  selectedIds: Set<string>;
  setSelectedIds: (ids: Set<string>) => void;
  onOpenDetail: (f: Feedback) => void;
  handleToggleSelect: (id: string, e: React.MouseEvent) => void;
  handleToggleSelectAll: () => void;
  analyzingId: string | null;
  handleAnalyzeOne: (f: Feedback) => void;
  handleBulkApprove: (ready: Feedback[]) => void;
  formatDateShort: (isoString: string) => string;
}

export function FeedbackTable({
  loading,
  filteredFeedbacks,
  feedbacks,
  selectedIds,
  setSelectedIds,
  onOpenDetail,
  handleToggleSelect,
  handleToggleSelectAll,
  analyzingId,
  handleAnalyzeOne,
  handleBulkApprove,
  formatDateShort
}: FeedbackTableProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-[28px] overflow-hidden shadow-xl shadow-slate-200/30 dark:shadow-none font-jakarta">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-teal-600 mb-2" size={28} />
          <span className="text-xs font-bold text-slate-400">Đang đồng bộ dữ liệu đánh giá...</span>
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        <div className="text-center py-20 px-4">
          <MessageSquare size={36} className="mx-auto text-slate-300 dark:text-zinc-600 mb-2.5" />
          <p className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400">Không tìm thấy đánh giá nào phù hợp</p>
          <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1 font-medium">Thử thay đổi từ khóa tìm kiếm hoặc bấm đặt lại bộ lọc.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-zinc-950/80 border-b border-slate-200/70 dark:border-zinc-800 text-slate-400 dark:text-zinc-500 font-black uppercase tracking-wider text-[10px] select-none">
                <th className="py-4 px-4 w-12 text-center">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {selectedIds.size === filteredFeedbacks.length && filteredFeedbacks.length > 0 ? (
                      <CheckSquare size={15} className="text-teal-600" />
                    ) : (
                      <Square size={15} />
                    )}
                  </button>
                </th>
                <th className="py-4 px-6 min-w-[240px]">Khách hàng</th>
                <th className="py-4 px-4 w-60 text-center">Cảm xúc</th>
                <th className="py-4 px-4 w-52 text-center">Trạng thái</th>
                <th className="py-4 px-4 w-40 text-center">Thời gian</th>
                <th className="py-4 px-4 w-32 text-center">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 font-sans">
              {filteredFeedbacks.map((f) => {
                const isSelected = selectedIds.has(f.id);
                const isNegative = f.cam_xuc === 'NEGATIVE';

                return (
                  <tr
                    key={f.id}
                    onClick={() => onOpenDetail(f)}
                    className={`group transition-all duration-150 cursor-pointer select-none ${
                      isSelected
                        ? 'bg-teal-50/50 dark:bg-teal-950/20'
                        : 'hover:bg-slate-50/90 dark:hover:bg-zinc-800/40'
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-4 px-4 text-center" onClick={(e) => handleToggleSelect(f.id, e)}>
                      <button type="button" className="text-slate-300 dark:text-zinc-600 group-hover:text-slate-500 cursor-pointer">
                        {isSelected ? <CheckSquare size={15} className="text-teal-600" /> : <Square size={15} />}
                      </button>
                    </td>

                    {/* Customer Name */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3.5">
                        <div className="size-10 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white font-black text-sm flex items-center justify-center shadow-sm shrink-0">
                          {f.ten_khach_hang ? f.ten_khach_hang.charAt(0).toUpperCase() : 'K'}
                        </div>
                        <span className="font-bold text-slate-800 dark:text-zinc-100 text-sm truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                          {f.ten_khach_hang || 'Khách hàng'}
                        </span>
                      </div>
                    </td>

                    {/* AI Sentiment */}
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center">
                        {f.cam_xuc === 'POSITIVE' ? (
                          <span className="inline-flex items-center gap-2 text-xs font-extrabold text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300/80 dark:border-emerald-800/80 px-3.5 py-1.5 rounded-2xl shadow-2xs">
                            <span className="text-base leading-none">😊</span>
                            <span>Tích cực</span>
                            {f.do_tin_cay && <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">({Math.round(f.do_tin_cay * 100)}%)</span>}
                          </span>
                        ) : f.cam_xuc === 'NEGATIVE' ? (
                          <span className="inline-flex items-center gap-2 text-xs font-extrabold text-rose-800 dark:text-rose-200 bg-rose-50 dark:bg-rose-950/50 border border-rose-300/80 dark:border-rose-800/80 px-3.5 py-1.5 rounded-2xl shadow-2xs animate-pulse">
                            <span className="text-base leading-none">🙁</span>
                            <span>Tiêu cực</span>
                            {f.do_tin_cay && <span className="text-[11px] font-black text-rose-600 dark:text-rose-400">({Math.round(f.do_tin_cay * 100)}%)</span>}
                          </span>
                        ) : f.cam_xuc === 'NEUTRAL' ? (
                          <span className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 border border-slate-300/80 dark:border-zinc-700 px-3.5 py-1.5 rounded-2xl shadow-2xs">
                            <span className="text-base leading-none">😐</span>
                            <span>Trung tính</span>
                            {f.do_tin_cay && <span className="text-[11px] font-black text-slate-500 dark:text-zinc-400">({Math.round(f.do_tin_cay * 100)}%)</span>}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAnalyzeOne(f);
                            }}
                            disabled={analyzingId === f.id}
                            className="inline-flex items-center gap-1.5 text-xs font-black text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 border border-teal-200/80 dark:border-teal-800/80 px-3 py-1.5 rounded-2xl shadow-2xs hover:bg-teal-100 transition-all cursor-pointer select-none"
                          >
                            {analyzingId === f.id ? (
                              <Loader2 size={13} className="animate-spin text-teal-600" />
                            ) : (
                              <Sparkles size={13} className="text-teal-600" />
                            )}
                            <span>Phân tích</span>
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center">
                        {f.phan_hoi_nhan_xet ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-teal-800 dark:text-teal-200 bg-teal-50 dark:bg-teal-950/50 border border-teal-300/80 dark:border-teal-800/80 px-3.5 py-1.5 rounded-2xl shadow-2xs">
                            <CheckCircle2 size={13} className="text-teal-600" />
                            <span>Đã phản hồi</span>
                          </span>
                        ) : isNegative ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-black text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-300/80 dark:border-rose-800/80 px-3.5 py-1.5 rounded-2xl shadow-2xs">
                            <span>Ưu tiên xử lý</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-300/80 dark:border-amber-800/80 px-3.5 py-1.5 rounded-2xl shadow-2xs">
                            <Clock size={13} className="text-amber-600" />
                            <span>Chưa phản hồi</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-4 px-4 text-center whitespace-nowrap text-slate-500 dark:text-zinc-400 font-semibold text-xs">
                      {formatDateShort(f.thoi_gian_danh_gia)}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenDetail(f)}
                          className="size-8 rounded-xl bg-slate-100 hover:bg-teal-50 hover:text-teal-600 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 flex items-center justify-center transition-colors cursor-pointer"
                          title="Xem chi tiết & Phản hồi"
                        >
                          <Eye size={15} />
                        </button>

                        {!f.cam_xuc && (
                          <button
                            type="button"
                            onClick={() => handleAnalyzeOne(f)}
                            disabled={analyzingId === f.id}
                            className="size-8 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-600 dark:bg-teal-950/60 dark:hover:bg-teal-900/60 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
                            title="Phân tích AI ngay"
                          >
                            {analyzingId === f.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Sparkles size={14} />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 dark:bg-zinc-800/95 backdrop-blur-xl text-white px-6 py-3.5 rounded-2xl shadow-2xl border border-slate-700/60 flex items-center gap-5 text-xs font-bold"
          >
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-teal-400 animate-pulse" />
              <span>Đã chọn <b>{selectedIds.size}</b> đánh giá</span>
            </div>

            <div className="h-4 w-px bg-slate-700" />

            <button
              type="button"
              onClick={() => {
                const selectedItems = feedbacks.filter(f => selectedIds.has(f.id));
                const ready = selectedItems.filter(f => !f.phan_hoi_nhan_xet && f.de_xuat_phan_hoi);
                if (ready.length > 0) {
                  handleBulkApprove(ready);
                }
              }}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-teal-600/20"
            >
              <Send size={13} />
              <span>Gửi phản hồi đã chọn</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer text-xs"
            >
              Bỏ chọn
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
