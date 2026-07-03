import { Link } from 'react-router-dom';
import ScrollReveal from '../shared/ScrollReveal';

interface FooterCtaProps {
  setIsChatOpen: (isOpen: boolean) => void;
}

export default function FooterCta({ setIsChatOpen }: FooterCtaProps) {
  return (
    <section className="bg-[#E6F4F1]/60 text-slate-800 border-t border-[#2EC4B6]/15 py-16 px-6 text-center font-jakarta">
      <ScrollReveal direction="none" delay={100}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6 md:gap-12 items-center justify-between">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 text-left">
            Sẵn Sàng Xóa Bỏ Cơn Đau Cơ Khớp?
          </h2>
          <div className="flex gap-4">
            <Link 
              to="/booking" 
              className="px-6 py-3.5 bg-primary hover:bg-[#25A89C] text-white font-extrabold rounded-2xl shadow-md hover:scale-[1.02] active:scale-98 transition-all text-xs md:text-sm cursor-pointer"
            >
              Đặt lịch
            </Link>
            <button 
              onClick={() => setIsChatOpen(true)}
              className="px-6 py-3.5 border-2 border-primary/20 hover:border-primary/40 text-primary font-extrabold rounded-2xl hover:bg-primary/5 hover:scale-[1.02] active:scale-98 transition-all text-xs md:text-sm cursor-pointer"
            >
              Chat Với Bác Sĩ AI
            </button>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
