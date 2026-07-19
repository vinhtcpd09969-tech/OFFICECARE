import { Eye, Calendar, Pencil, Ban, RotateCcw } from 'lucide-react';
import { resolveImageUrl } from '../../../../utils/imageUrl';

const DANH_MUC_LABELS: Record<string, string> = {
  suc_khoe: 'Sức khỏe',
  dieu_tri: 'Điều trị',
  tin_tuc: 'Tin tức',
  khuyen_mai: 'Khuyến mãi',
  phong_ngua: 'Phòng ngừa'
};

interface ArticleRowProps {
  article: any;
  onEdit: (article: any) => void;
  onDelete: (article: any) => void;
  onRestore?: (article: any) => void;
}

export function ArticleRow({ article, onEdit, onDelete, onRestore }: ArticleRowProps) {
  const isPublished = article.trang_thai === 'xuat_ban';
  const isSuspended = article.trang_thai === 'ngung_su_dung';

  return (
    <div
      className={`group relative bg-gradient-to-b from-white to-zinc-50/30 border border-zinc-200/90 rounded-2xl p-6 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-teal-250 hover:shadow-[0_20px_50px_rgba(46,196,182,0.06)] hover:-translate-y-1.5 cursor-pointer ${
        isSuspended ? 'opacity-65 grayscale-[30%]' : ''
      }`}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('button')) return;
        if (isSuspended) return; // Không cho sửa bài đang ngưng sử dụng trực tiếp, phải khôi phục trước
        onEdit(article);
      }}
    >
      <div className="absolute left-0 top-4 bottom-4 w-1.5 rounded-r-2xl scale-y-50 group-hover:scale-y-100 opacity-0 group-hover:opacity-100 transition-all duration-300 origin-center shadow-sm bg-teal-500 shadow-teal-400/50" />

      <div className="flex flex-col lg:grid lg:grid-cols-12 lg:items-center gap-6 lg:gap-4">
        <div className="col-span-12 lg:col-span-6 min-w-0 flex gap-4">
          <div className="w-16 h-16 rounded-xl border border-zinc-150 overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center">
            {article.anh_bia ? (
              <img src={resolveImageUrl(article.anh_bia)} className="w-full h-full object-cover" alt={article.tieu_de} />
            ) : (
              <span className="text-slate-300 text-[9px] font-bold">Chưa có ảnh</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[9px] text-teal-850 font-black bg-teal-50 border border-teal-150/60 px-2 py-0.5 rounded-lg uppercase tracking-wider">
              {DANH_MUC_LABELS[article.danh_muc] || article.danh_muc}
            </span>
            <h4 className="font-heading font-black text-[13.5px] text-secondary tracking-tight mt-1.5 leading-snug line-clamp-1">
              {article.tieu_de}
            </h4>
            <p className="text-[11px] text-zinc-455 mt-1 font-medium line-clamp-1">{article.tom_tat}</p>
          </div>
        </div>

        <div className="col-span-6 lg:col-span-2 flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
          <Eye size={13} className="text-slate-400" /> {article.luot_xem} lượt xem
        </div>

        <div className="col-span-6 lg:col-span-2 flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
          <Calendar size={13} className="text-slate-400" />
          {article.ngay_dang ? new Date(article.ngay_dang).toLocaleDateString('vi-VN') : 'Chưa đăng'}
        </div>

        <div className="col-span-6 lg:col-span-1">
          <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-wider ${
            isPublished 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
              : isSuspended
                ? 'bg-zinc-100 text-zinc-500 border border-zinc-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            {isPublished ? 'Đã đăng' : isSuspended ? 'Ngưng dùng' : 'Nháp'}
          </span>
        </div>

        <div className="col-span-6 lg:col-span-1 flex items-center justify-end gap-2">
          {!isSuspended ? (
            <>
              <button
                type="button"
                onClick={() => onEdit(article)}
                className="p-2 rounded-lg bg-slate-50 hover:bg-teal-50 text-slate-500 hover:text-teal-600 border border-zinc-150 transition-all cursor-pointer"
                title="Sửa bài viết"
              >
                <Pencil size={13} />
              </button>
              <button
                type="button"
                onClick={() => onDelete(article)}
                className="p-2 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-zinc-150 transition-all cursor-pointer"
                title="Ngưng sử dụng"
              >
                <Ban size={13} />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => onRestore && onRestore(article)}
              className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-250 transition-all cursor-pointer"
              title="Khôi phục bài viết"
            >
              <RotateCcw size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
