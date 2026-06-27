import { Link } from 'react-router-dom';
import ScrollReveal from '../shared/ScrollReveal';

interface FooterCtaProps {
  setIsChatOpen: (isOpen: boolean) => void;
}

export default function FooterCta({ setIsChatOpen }: FooterCtaProps) {
  return (
    <section className="mt-16">
      <div className="wave-container flex items-center justify-center px-4 md:px-margin-desktop text-center">
        <div className="wave"></div>
        <ScrollReveal direction="none" delay={100}>
          <div className="relative z-10 flex flex-col md:flex-row gap-6 md:gap-12 items-center">
            <h2 className="font-jakarta text-2xl md:text-3xl font-black text-white">
              Sẵn Sàng Xóa Bỏ Cơn Đau Cơ Khớp?
            </h2>
            <div className="flex gap-3">
              <Link 
                to="/booking" 
                className="px-6 py-3 bg-white text-primary font-jakarta font-extrabold rounded-full shadow-lg hover:bg-teal-50 hover:scale-105 active:scale-95 transition-all text-xs md:text-sm"
              >
                Đặt Lịch Khám Miễn Phí
              </Link>
              <button 
                onClick={() => setIsChatOpen(true)}
                className="px-6 py-3 border-2 border-white text-white font-jakarta font-extrabold rounded-full hover:bg-white/10 active:scale-95 transition-all text-xs md:text-sm"
              >
                Chat Với Bác Sĩ AI
              </button>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
