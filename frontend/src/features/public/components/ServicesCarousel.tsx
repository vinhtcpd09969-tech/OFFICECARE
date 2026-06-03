import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import ScrollReveal from './ScrollReveal';

export default function ServicesCarousel() {
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const { scrollLeft } = carouselRef.current;
      const cardWidth = 320; // width of card
      const scrollTo = direction === 'left' 
        ? scrollLeft - cardWidth * 2 
        : scrollLeft + cardWidth * 2;
      
      carouselRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const services = [
    {
      title: "Trị liệu cổ vai gáy",
      desc: "Phối hợp siêu âm nhiệt sâu và kéo giãn cơ thang định vị giúp xóa tan cơn đau mỏi, căng thẳng vùng cổ.",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDH_Y4wZfGzOLdxSzw6KQbB1N9JDbhrOhXTX-MMcDmkwHLOBel3kRwtZnvatc7tJzbJNc2CkiBbiWv48EafvvSbmHuuVLrAAw5f9rnSVBB0bxfw1FDPNwU0pUlwKF1SwxLcFLJT0qv_VpB74hIETQiZMVDtz_FDo_cCGgz9UEaWUkn4-n13IPfJ5MzHZ9fWkzaxKhIVM4XFnrze7-q21wLzr-7bkURrhqlQaU-rcsnS9J-8bZnbPn8ARBVi68ACnIACYFd2kbzsXW0",
      price: "250.000đ",
      duration: "45 phút"
    },
    {
      title: "Trị liệu thoát vị đĩa đệm",
      desc: "Điều trị bảo tồn cột sống cổ & lưng không xâm lấn, giúp di động khớp giảm chèn áp rễ thần kinh.",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC9Y0TgPaBtVzqlaI3JmHXhDb2hRflR1qOGZIUzqh2znc6Xof_A21u3HdV63fSQGSE15l2Fp3Nu5Im56tx13B0qk5uc86YXynqw0rPYZRjuk1YvntH3LH1KqcOJyVrsurYYnaG28i94NBMUxAU0hbzsH4qv6DX7Q-hu56UWBLE3Jr5U8Q4Ag6mwnsmd1nUcSLnFt72ArvxpDNwPQpXYxn83yIPHTR7Ibnt5ytCL3qaoYgdM1aLF3QeL4u285lgXADfV8bYfX3PB8tY",
      price: "350.000đ",
      duration: "60 phút"
    },
    {
      title: "Phục hồi chức năng chấn thương",
      desc: "Dành cho khách hàng sau chấn thương thể thao hoặc phẫu thuật, giúp khôi phục biên độ vận động cơ khớp tối đa.",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAafct0nwGqFdLDDq2LmrKGlAbRy_AfLQbzLPuaZ8nVLkuw6YmX5RYn_x1sl8nSgHIUZtjsa5b_T_-b2ISZ_X_5SdVOurVFb7ThMRD7s_EDcDcBZY_lk0aFoJtNT5L2nCzFvoVDj_eZCUmYHvHiur-w21G4NdgHoHE_V90fAyTnzsBcDEMwmmu4qOQMjb9vDXsF9B115Pl9rcT5REVcirzktAVSWZfCf2kJ1v-5nTEVOfsmZJ13pO-9uIF3ffbrNzF5vSiFBEn5e9E",
      price: "400.000đ",
      duration: "60 phút"
    },
    {
      title: "Khám tầm soát & tư vấn cột sống",
      desc: "Kiểm tra cơ sinh học toàn diện, xác định điểm lệch tư thế và tư vấn lộ trình tập phục hồi chuyên biệt.",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuChY7AW6ev6J87eZLl2o4MoOD8BnBBtnPFSB4sYKHKTosht_wFuKieK_jt9CtkyD3kA167GUk8Yv-tUkVT4HN7Y30l1-IvGzK21MPHz2SivO1OybUi6n3NCCiMObQuKtnx2j3jPLLy02O1zGNlbH6Q2vUq-MIs7udDukLlJ6rq88bk56Zx9KQdrvKpHKuGS5t8GE28Cpn03TTkqWiO84_J2E0tCuwpNunaAl4gqM19_WXyeqvQDPUdzHpThmQ9l73Ch6AY7CGkNuv8",
      price: "Miễn phí",
      duration: "30 phút"
    }
  ];

  return (
    <section id="services" className="py-xxl bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
            <div>
              <h2 className="text-primary font-black tracking-widest uppercase text-xs mb-3 font-jakarta">Dịch vụ phục hồi</h2>
              <h3 className="font-jakarta text-3xl md:text-4xl font-extrabold text-secondary mb-2">Dịch Vụ Nổi Bật Tại Phòng Khám</h3>
              <p className="text-slate-500 font-medium text-sm md:text-base">Mỗi dịch vụ được thiết kế theo thời lượng y khoa để trị liệu dứt điểm cơn đau.</p>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => scrollCarousel('left')}
                className="w-12 h-12 border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 shadow-sm"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => scrollCarousel('right')}
                className="w-12 h-12 border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 shadow-sm"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={150}>
          <div 
            ref={carouselRef}
            className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory hide-scrollbar"
          >
            {services.map((service, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -6, boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.05)" }}
                className="min-w-[290px] md:min-w-[380px] snap-start bg-[#F9FAFB] rounded-[32px] overflow-hidden group border border-slate-200/50 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="h-48 md:h-56 overflow-hidden relative bg-slate-200">
                    <img 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter saturate-[1.05]" 
                      src={service.image} 
                      alt={service.title}
                    />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-primary font-black text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
                      {service.duration}
                    </div>
                  </div>
                  <div className="p-6 space-y-3">
                    <h4 className="font-jakarta font-black text-lg text-secondary leading-snug">{service.title}</h4>
                    <p className="font-jakarta text-xs text-slate-400 font-semibold leading-relaxed">
                      {service.desc}
                    </p>
                  </div>
                </div>
                <div className="p-6 pt-0 mt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] uppercase font-bold text-slate-400">Chi phí buổi lẻ</p>
                    <span className="text-primary font-jakarta font-black text-sm">{service.price}</span>
                  </div>
                  <Link 
                    to="/booking" 
                    className="text-xs font-black text-primary group-hover:underline flex items-center gap-1"
                  >
                    Đăng ký khám <ArrowRight size={12} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
