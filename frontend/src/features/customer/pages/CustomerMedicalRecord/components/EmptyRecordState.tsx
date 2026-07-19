import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface EmptyRecordStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  showCta?: boolean;
}

// Empty state hành động được — có nút đặt lịch thay vì chỉ nói "liên hệ lễ tân" như bản cũ.
export function EmptyRecordState({ icon, title, description, showCta = true }: EmptyRecordStateProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-3xl border border-dashed border-zinc-200 p-14 text-center flex flex-col items-center gap-2">
      <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-1.5">
        {icon}
      </div>
      <h3 className="font-heading text-base font-black text-secondary">{title}</h3>
      <p className="text-zinc-500 text-xs max-w-sm">{description}</p>
      {showCta && (
        <button
          type="button"
          onClick={() => navigate('/booking')}
          className="mt-3.5 bg-primary hover:opacity-90 text-white font-black text-xs px-5 py-3 rounded-xl flex items-center gap-2 shadow-md shadow-primary/25 transition-all hover:-translate-y-0.5"
        >
          Đặt lịch khám ngay <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
}

export default EmptyRecordState;
