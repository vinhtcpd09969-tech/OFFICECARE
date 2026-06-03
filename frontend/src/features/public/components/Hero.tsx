import { Link } from 'react-router-dom';
import { Calendar, ArrowRight, ShieldCheck, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import LazyImage from '../../../components/LazyImage';
import ScrollReveal from './ScrollReveal';

export default function Hero() {
  return (
    <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-32 overflow-hidden min-h-[90vh] flex items-center bg-gradient-to-b from-teal-50/20 via-white to-slate-50/50">
      {/* Decorative Blur Spheres */}
      <div className="absolute top-1/4 left-10 w-72 h-72 bg-primary/5 rounded-full filter blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary/5 rounded-full filter blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        {/* Header Status Bar */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <ScrollReveal direction="none">
            <div>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest font-jakarta">Hôm nay tại Office Care</p>
              <h2 className="text-slate-800 font-extrabold text-sm mt-0.5 font-jakarta">Hệ thống trị liệu cơ xương khớp & cột sống 5 sao</h2>
            </div>
          </ScrollReveal>
          
          <ScrollReveal direction="none" delay={150}>
            <div className="flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 px-3.5 py-1.5 rounded-full text-xs font-bold w-fit shadow-sm">
              <span className="relative flex size-2">
                <span className="animate-ping absolute inline-flex size-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full size-2 bg-primary"></span>
              </span>
              Hoạt động bình thường (7:30 - 20:30)
            </div>
          </ScrollReveal>
        </div>

        {/* Hero Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-6 md:space-y-8 text-left">
            <ScrollReveal delay={100}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-extrabold text-xs uppercase tracking-wider shadow-sm border border-primary/5">
                ⚡ Hệ thống trị liệu cơ xương khớp văn phòng
              </div>
            </ScrollReveal>
            
            <ScrollReveal delay={200}>
              <h1 className="font-jakarta text-4xl md:text-5xl lg:text-6xl font-black text-secondary leading-[1.1] tracking-tight">
                Ngồi 8 tiếng, đau lưng cổ vai? <br />
                <span className="text-primary">Trị liệu chuyên sâu</span> cùng chuyên gia.
              </h1>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <div className="flex items-start gap-2.5 text-slate-500 font-semibold text-sm">
                <MapPin size={18} className="text-primary shrink-0 mt-0.5" />
                <span>Khu đô thị Vinhomes Golden River, Bến Nghé, Quận 1, TP. Hồ Chí Minh</span>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={400}>
              <p className="text-slate-500 text-base md:text-lg leading-relaxed font-medium max-w-2xl">
                Giải pháp phục hồi cột sống hiệu quả và an toàn. Nơi kết hợp hoàn hảo giữa công nghệ trị liệu cơ xương khớp tiên tiến nhất và phác đồ điều trị cá nhân hóa từ đội ngũ bác sĩ, kỹ thuật viên dày dặn kinh nghiệm.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={500}>
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <div className="inline-flex items-center justify-between bg-white border border-slate-200/80 p-1.5 rounded-full shadow-soft-ui max-w-lg w-full gap-4 transition-all duration-300 hover:border-primary/20">
                  <div className="pl-4 pr-2 py-0.5 text-left shrink-0">
                    <p className="text-[9px] text-primary font-black uppercase tracking-widest mb-0.5">Khám lượng giá</p>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-base font-black text-secondary">Miễn phí 100%</span>
                    </div>
                  </div>
                  <Link to="/booking" className="bg-primary hover:bg-[#25A89C] text-white font-extrabold px-6 py-3 rounded-full text-xs md:text-sm transition-all shadow-md hover:scale-[1.02] active:scale-95 flex items-center gap-2 shrink-0 animate-pulse-custom">
                    <Calendar size={16} />
                    Đặt lịch khám ngay
                  </Link>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={600} direction="none">
              <div className="flex items-center gap-3 text-primary pt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Cuộn để xem tiếp</span>
                <div className="animate-bounce p-1.5 bg-primary/10 rounded-full text-primary border border-primary/20">
                  <ArrowRight size={14} className="rotate-90" />
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Right Visual Image Column */}
          <div className="lg:col-span-5 relative mt-6 lg:mt-0 flex justify-center">
            <div className="relative max-w-[420px] w-full px-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, rotate: 0 }}
                animate={{ opacity: 1, scale: 1, rotate: 3 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                whileHover={{ rotate: 0, scale: 1.02 }}
                className="bg-primary-container/40 rounded-[40px] p-4 shadow-xl border border-primary/10 transition-transform duration-500 cursor-pointer"
              >
                <div className="relative rounded-[32px] overflow-hidden aspect-[4/3] w-full shadow-inner bg-slate-100">
                  <LazyImage 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuChY7AW6ev6J87eZLl2o4MoOD8BnBBtnPFSB4sYKHKTosht_wFuKieK_jt9CtkyD3kA167GUk8Yv-tUkVT4HN7Y30l1-IvGzK21MPHz2SivO1OybUi6n3NCCiMObQuKtnx2j3jPLLy02O1zGNlbH6Q2vUq-MIs7udDukLlJ6rq88bk56Zx9KQdrvKpHKuGS5t8GE28Cpn03TTkqWiO84_J2E0tCuwpNunaAl4gqM19_WXyeqvQDPUdzHpThmQ9l73Ch6AY7CGkNuv8" 
                    alt="Office Care Premium Clinic" 
                    className="size-full object-cover"
                    wrapperClassName="size-full"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 via-transparent to-transparent opacity-50"></div>
                  <div className="absolute bottom-4 left-4 right-4 bg-white/10 backdrop-blur-md border border-white/20 p-3.5 rounded-2xl text-white">
                    <p className="text-[10px] uppercase font-bold text-primary-container mb-0.5 tracking-wider font-jakarta">Không gian điều trị</p>
                    <h4 className="text-xs font-bold leading-snug font-jakarta">Phòng khám hiện đại, riêng tư mang lại sự thư giãn tuyệt đối</h4>
                  </div>
                </div>
              </motion.div>

              {/* Floating Verified Badge */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="absolute -bottom-6 -left-2 glass-card p-4 rounded-3xl shadow-lg hover:shadow-xl max-w-[200px] border border-white/40"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <ShieldCheck className="text-primary" size={20} />
                  <span className="font-jakarta font-bold text-xs uppercase text-primary tracking-wider">Chuẩn Y Khoa</span>
                </div>
                <p className="font-jakarta text-xs text-secondary/80 leading-relaxed font-semibold">Phác đồ cá nhân hóa từ các bác sĩ cơ xương khớp đầu ngành.</p>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Specs Strip */}
        <ScrollReveal delay={700}>
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3.5 bg-white border border-slate-100 p-4 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div className="size-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-xl shrink-0">🩺</div>
              <div>
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-jakarta">Đội Ngũ Bác Sĩ</h5>
                <p className="text-xs font-black text-secondary font-jakarta">10+ Chuyên Gia Chuyên Khoa</p>
              </div>
            </div>
            <div className="flex items-center gap-3.5 bg-white border border-slate-100 p-4 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div className="size-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-xl shrink-0">🏢</div>
              <div>
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-jakarta">Không Gian VIP</h5>
                <p className="text-xs font-black text-secondary font-jakarta">Riêng Tư & Đẳng Cấp</p>
              </div>
            </div>
            <div className="flex items-center gap-3.5 bg-white border border-slate-100 p-4 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div className="size-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-xl shrink-0">⚡</div>
              <div>
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-jakarta">Công Nghệ Mới</h5>
                <p className="text-xs font-black text-secondary font-jakarta">Nhập Khẩu Mỹ & Đức</p>
              </div>
            </div>
            <div className="flex items-center gap-3.5 bg-white border border-slate-100 p-4 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div className="size-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-xl shrink-0">🏆</div>
              <div>
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-jakarta">Cam Kết Vàng</h5>
                <p className="text-xs font-black text-secondary font-jakarta">Hiệu Quả Sau 1 Lộ Trình</p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
