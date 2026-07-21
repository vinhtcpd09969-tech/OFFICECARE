import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, ArrowRight, ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LazyImage from '../../../../components/LazyImage';
import ScrollReveal from '../shared/ScrollReveal';

const HERO_SLIDES = [
  {
    id: 1,
    tag: 'Lượng giá chuyên sâu',
    title: 'Thăm Khám & Lượng Giá Lâm Sàng 1:1 Với Bác Sĩ CKI',
    subtitle: 'Đánh giá tầm vận động khớp và siêu âm chẩn đoán chính xác vị trí cơ xương khớp tổn thương.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuChY7AW6ev6J87eZLl2o4MoOD8BnBBtnPFSB4sYKHKTosht_wFuKieK_jt9CtkyD3kA167GUk8Yv-tUkVT4HN7Y30l1-IvGzK21MPHz2SivO1OybUi6n3NCCiMObQuKtnx2j3jPLLy02O1zGNlbH6Q2vUq-MIs7udDukLlJ6rq88bk56Zx9KQdrvKpHKuGS5t8GE28Cpn03TTkqWiO84_J2E0tCuwpNunaAl4gqM19_WXyeqvQDPUdzHpThmQ9l73Ch6AY7CGkNuv8',
    badge: 'Phác Đồ Cá Nhân Hóa'
  },
  {
    id: 2,
    tag: 'Công nghệ tiên tiến',
    title: 'Trị Liệu Sóng Xung Kích & Laser Cường Độ Cao 30W',
    subtitle: 'Phá vỡ mô xơ hóa, giảm co thắt cơ và đẩy nhanh phục hồi tái tạo tế bào.',
    image: '/goi/images/laser_tri_lieu.png',
    badge: 'Đạt Chuẩn FDA Hoa Kỳ'
  },
  {
    id: 3,
    tag: 'Kỹ thuật chuyên khoa',
    title: 'Giải Phóng Cơ Mô Mềm Tận Gốc Điểm Đau (Trigger Points)',
    subtitle: 'Kỹ thuật viên chính quy đứng máy kết hợp thao tác nắn chỉnh di động khớp thủ công.',
    image: '/goi/images/giai_co_sau.png',
    badge: '+15.000 Ca Hồi Phục'
  }
];

const SYMPTOM_TAGS = [
  { label: 'Đau cổ vai gáy', type: 'kham' },
  { label: 'Đau thắt lưng & thoát vị', type: 'dich_vu' },
  { label: 'Đau mỏi khớp gối', type: 'dich_vu' },
  { label: 'Tê bì tay chân', type: 'kham' },
  { label: 'Khám lượng giá cột sống', type: 'kham' }
];

export default function Hero() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % HERO_SLIDES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % HERO_SLIDES.length);
  };

  return (
    <section className="relative pt-24 pb-12 lg:pt-28 lg:pb-16 bg-gradient-to-b from-teal-500/10 via-white to-slate-50/70 overflow-hidden font-sans">
      {/* Decorative Subtle Background Aura */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-teal-400/10 rounded-full filter blur-[100px] pointer-events-none" />
      <div className="absolute bottom-4 right-10 w-[450px] h-[450px] bg-[#2EC4B6]/10 rounded-full filter blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Text Column */}
          <div className="lg:col-span-6 space-y-4 text-left">
            <ScrollReveal delay={100}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 text-[#0D9488] font-semibold text-xs border border-teal-500/20 shadow-2xs">
                <span className="size-2 rounded-full bg-[#0D9488] animate-pulse" />
                <span>Hệ thống phục hồi chức năng cơ xương khớp văn phòng</span>
              </div>
            </ScrollReveal>
            
            <ScrollReveal delay={200}>
              <h1 className="font-heading font-bold text-2xl sm:text-3xl md:text-[34px] text-slate-900 leading-[1.3] tracking-normal">
                Giải Pháp Phục Hồi Cột Sống Cổ Vai Gáy <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-[#0D9488] to-[#14B8A6] bg-clip-text text-transparent font-bold">
                  Chuẩn Y Khoa Toàn Diện
                </span>
              </h1>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <p className="text-slate-600 text-xs md:text-sm leading-relaxed font-normal max-w-lg">
                Thăm khám 1:1 cùng Bác sĩ chuyên khoa, trị liệu chuẩn phác đồ y tế kết hợp công nghệ sóng Châu Âu giúp giải phóng đau mỏi an toàn không dùng thuốc.
              </p>
            </ScrollReveal>

            {/* Standardized Call-To-Action Buttons */}
            <ScrollReveal delay={400}>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link 
                  to="/booking" 
                  className="px-6 py-3.5 bg-[#0D9488] hover:bg-[#0B7A70] text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all text-xs cursor-pointer flex items-center gap-2"
                >
                  <Calendar size={15} />
                  <span>Đặt Lịch Khám Bác Sĩ</span>
                </Link>
                <button 
                  onClick={() => navigate('/services')}
                  className="px-6 py-3.5 bg-white border border-slate-200 hover:border-teal-500/50 text-slate-700 hover:text-[#0D9488] font-bold rounded-xl transition-all text-xs cursor-pointer flex items-center gap-2 shadow-2xs"
                >
                  <span>Xem Chi Tiết Dịch Vụ</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </ScrollReveal>

            {/* Medical Metrics Row */}
            <ScrollReveal delay={500}>
              <div className="pt-5 border-t border-slate-200/80 grid grid-cols-3 gap-4 text-left">
                <div>
                  <p className="text-lg font-bold text-slate-900 font-heading">+15.000</p>
                  <p className="text-[10px] text-slate-500 font-normal">Bệnh nhân đã điều trị</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-[#0D9488] font-heading">4.9 / 5.0</p>
                  <p className="text-[10px] text-slate-500 font-normal">Đánh giá hài lòng</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900 font-heading">100%</p>
                  <p className="text-[10px] text-slate-500 font-normal">Bác sĩ CKI lượng giá 1:1</p>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Right Banner Slider Container */}
          <div className="lg:col-span-6 relative mt-4 lg:mt-0">
            <div className="relative rounded-[28px] overflow-hidden shadow-xl border border-white/80 bg-white aspect-[16/11]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                  className="relative w-full h-full"
                >
                  <LazyImage 
                    src={HERO_SLIDES[currentSlide].image} 
                    alt={HERO_SLIDES[currentSlide].title} 
                    className="w-full h-full object-cover"
                    wrapperClassName="w-full h-full"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />

                  {/* Banner Content Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white text-left space-y-1.5">
                    <span className="bg-[#0D9488] text-white text-[9.5px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider inline-block">
                      {HERO_SLIDES[currentSlide].badge}
                    </span>
                    <h3 className="font-heading font-bold text-base md:text-lg leading-snug">
                      {HERO_SLIDES[currentSlide].title}
                    </h3>
                    <p className="text-xs text-slate-200 font-normal line-clamp-2">
                      {HERO_SLIDES[currentSlide].subtitle}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Slider Navigation Arrows */}
              <button
                type="button"
                onClick={prevSlide}
                className="absolute left-3 top-1/2 -translate-y-1/2 size-9 rounded-full bg-slate-900/40 hover:bg-slate-900/70 backdrop-blur-md text-white flex items-center justify-center transition-colors cursor-pointer border border-white/20"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={nextSlide}
                className="absolute right-3 top-1/2 -translate-y-1/2 size-9 rounded-full bg-slate-900/40 hover:bg-slate-900/70 backdrop-blur-md text-white flex items-center justify-center transition-colors cursor-pointer border border-white/20"
              >
                <ChevronRight size={18} />
              </button>

              {/* Slide Indicators */}
              <div className="absolute top-4 right-4 flex items-center gap-1.5 z-10">
                {HERO_SLIDES.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      currentSlide === idx ? 'w-6 bg-[#0D9488]' : 'w-2 bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Symptoms Quick Action Bar */}
        <div className="mt-12 p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-[#0D9488]" />
            <span className="text-xs font-bold text-slate-800">Bạn đang bị đau vị trí nào?</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {SYMPTOM_TAGS.map((tag, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => navigate('/booking', { state: { bookingType: tag.type } })}
                className="px-3.5 py-1.5 bg-slate-50 hover:bg-teal-50 hover:text-[#0D9488] text-slate-600 rounded-xl text-xs font-semibold border border-slate-200 transition-all cursor-pointer"
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
