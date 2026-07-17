import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, HeartPulse, Lock, Users } from 'lucide-react';
import LazyImage from '../../../components/LazyImage';
import ScrollReveal from '../components/shared/ScrollReveal';

const CORE_VALUES = [
  {
    icon: ShieldCheck,
    title: 'An toàn y khoa',
    desc: 'Mọi phác đồ đều được bác sĩ chuyên khoa xây dựng và giám sát trong suốt quá trình điều trị.'
  },
  {
    icon: HeartPulse,
    title: 'Cá nhân hóa phác đồ',
    desc: 'Không có công thức chung — mỗi khách hàng có lộ trình phục hồi riêng theo cơ địa và mức độ đau.'
  },
  {
    icon: Lock,
    title: 'Riêng tư tuyệt đối',
    desc: 'Hồ sơ bệnh án điện tử được bảo mật nghiêm ngặt, chỉ đội ngũ y tế trực tiếp phụ trách được truy cập.'
  },
  {
    icon: Users,
    title: 'Đồng hành dài hạn',
    desc: 'Theo dõi tiến độ phục hồi xuyên suốt liệu trình, không chỉ dừng lại ở một buổi điều trị đơn lẻ.'
  }
];

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-slate-50/50 font-jakarta overflow-hidden">
      <Helmet>
        <title>Về chúng tôi | OfficeCare</title>
        <meta
          name="description"
          content="OfficeCare — phòng khám phục hồi chức năng cột sống và cơ xương khớp chuyên sâu cho dân văn phòng. Tìm hiểu sứ mệnh, giá trị cốt lõi và đội ngũ chuyên gia của chúng tôi."
        />
      </Helmet>

      {/* Hero */}
      <section className="relative pt-28 pb-16 lg:pt-32 lg:pb-20 bg-gradient-to-b from-teal-55/20 via-white to-slate-50/50">
        <div className="absolute top-1/4 left-10 w-72 h-72 bg-primary/5 rounded-full filter blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary/5 rounded-full filter blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6 relative z-10 text-center">
          <ScrollReveal>
            <span className="bg-[#14B8A6]/10 text-[#0D9488] border border-[#14B8A6]/20 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-4 shadow-sm">
              Về chúng tôi
            </span>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <h1 className="font-heading font-black text-3xl md:text-4xl lg:text-5xl text-secondary tracking-tight leading-[1.15] mb-5">
              Đồng hành phục hồi cùng <span className="text-primary">dân văn phòng</span>
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <p className="text-slate-500 text-sm md:text-base leading-relaxed font-semibold max-w-2xl mx-auto">
              OfficeCare ra đời từ một quan sát đơn giản: dân văn phòng ngồi 8 tiếng mỗi ngày, và cơn đau lưng, cổ, vai gáy âm thầm trở thành gánh nặng sức khỏe lâu dài. Chúng tôi xây dựng một nơi trị liệu chuyên sâu, cá nhân hóa và đáng tin cậy cho riêng nhóm khách hàng này.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Sứ mệnh / Câu chuyện sáng lập */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <ScrollReveal direction="right">
            <div className="rounded-[32px] overflow-hidden shadow-lg border border-teal-500/10 aspect-[4/3] relative group">
              <LazyImage
                src="/images/physio_clinic_villa.png"
                alt="Không gian điều trị biệt thự sang trọng tại Office Care"
                className="size-full object-cover group-hover:scale-102 transition-transform duration-700"
                wrapperClassName="size-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 to-transparent pointer-events-none"></div>
            </div>
          </ScrollReveal>
          <ScrollReveal direction="left" delay={100}>
            <div className="space-y-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#0D9488] bg-[#14B8A6]/10 px-3 py-1 rounded-full inline-block">
                Câu chuyện sáng lập
              </span>
              <h2 className="font-heading font-black text-2xl md:text-3xl lg:text-4xl text-secondary tracking-tight">
                Giải cứu cột sống khỏi áp lực của "8 tiếng ngồi văn phòng"
              </h2>
              <p className="text-slate-500 text-xs md:text-sm leading-relaxed font-semibold">
                Tại các đô thị hiện đại, giới văn phòng công sở đang phải đối mặt với một cuộc khủng hoảng sức khỏe âm thầm. Ngồi liên tục 8-10 tiếng mỗi ngày, gõ máy tính sai tư thế, ít vận động... tích lũy qua từng năm tháng đã tàn phá trục cột sống tự nhiên, sinh ra các bệnh lý cơ xương khớp mạn tính từ rất sớm.
              </p>
              <p className="text-slate-500 text-xs md:text-sm leading-relaxed font-semibold">
                OfficeCare ra đời từ sự thấu hiểu sâu sắc đó. Chúng tôi không chỉ xây dựng một phòng khám y khoa đơn thuần, mà kiến tạo nên một không gian phục hồi chức năng và trị liệu cột sống chuyên biệt, cao cấp dành riêng cho dân công sở. Nơi các phương pháp trị liệu bằng tay Manual Therapy tinh tế kết hợp hoàn hảo cùng công nghệ y học vật lý tối tân nhất để đẩy lùi cơn đau mạn tính tận gốc.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Sứ mệnh & Tầm nhìn (Mới) */}
      <section className="py-16 md:py-24 bg-slate-50/50 border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-10">
          <ScrollReveal direction="up">
            <div className="bg-white rounded-[32px] p-8 md:p-10 border border-slate-100 shadow-[0_15px_40px_rgba(15,23,42,0.015)] space-y-4 h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl pointer-events-none"></div>
              <h3 className="font-heading font-black text-lg md:text-xl text-secondary flex items-center gap-2">
                <span className="text-[#0D9488] text-2xl">🎯</span> Sứ Mệnh Của Chúng Tôi
              </h3>
              <p className="text-slate-500 text-xs md:text-sm leading-relaxed font-semibold">
                Cung cấp các giải pháp phục hồi chức năng và trị liệu cơ xương khớp cột sống chủ động, an toàn và cá nhân hóa. Chúng tôi cam kết giúp giới văn phòng Việt Nam chấm dứt các cơn đau cơ khớp mạn tính mà không lạm dụng thuốc giảm đau hay can thiệp phẫu thuật không cần thiết.
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={100}>
            <div className="bg-white rounded-[32px] p-8 md:p-10 border border-slate-100 shadow-[0_15px_40px_rgba(15,23,42,0.015)] space-y-4 h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
              <h3 className="font-heading font-black text-lg md:text-xl text-secondary flex items-center gap-2">
                <span className="text-emerald-600 text-2xl">👁️</span> Tầm Nhìn Chiến Lược
              </h3>
              <p className="text-slate-500 text-xs md:text-sm leading-relaxed font-semibold">
                Trở thành hệ thống phòng khám Premium Rehab dẫn đầu tại Việt Nam trong lĩnh vực trị liệu bảo tồn cột sống văn phòng, đồng hành cùng các doanh nghiệp công nghệ và tài chính kiến tạo nên môi trường làm việc khỏe mạnh, tối ưu hiệu suất lao động.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Stats bar */}
      <section className="py-12 bg-white border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '12+', valueColor: 'text-[#0D9488]', label: 'Chuyên gia y tế' },
            { value: '2.500+', valueColor: 'text-[#0D9488]', label: 'Khách hàng phục hồi thành công' },
            { value: '4.95 / 5', valueColor: 'text-amber-500', label: 'Đánh giá hài lòng y khoa' },
            { value: '07:30–20:30', valueColor: 'text-[#0D9488]', label: 'Giờ mở cửa phục vụ' }
          ].map((stat, idx) => (
            <ScrollReveal key={stat.label} delay={idx * 80}>
              <p className={`font-heading font-black text-2xl md:text-3xl ${stat.valueColor}`}>{stat.value}</p>
              <p className="text-[11px] md:text-xs text-slate-450 font-bold uppercase tracking-wide mt-1">{stat.label}</p>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Giá trị cốt lõi */}
      <section className="py-16 md:py-24 bg-slate-50/50">
        <div className="max-w-6xl mx-auto px-6">
          <ScrollReveal>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-[#0D9488] font-black tracking-widest uppercase text-xs mb-3">Quy chuẩn y đức</h2>
              <h3 className="font-heading text-2xl md:text-3xl font-black text-secondary tracking-tight">Giá Trị Cốt Lõi Tại OfficeCare</h3>
            </div>
          </ScrollReveal>
 
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CORE_VALUES.map((item, idx) => (
              <ScrollReveal key={item.title} delay={idx * 100}>
                <motion.div
                  whileHover={{ y: -6, boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.08)' }}
                  className="bg-white rounded-[28px] p-6 h-full border border-slate-100 shadow-sm transition-all duration-300"
                >
                  <div className="size-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                    <item.icon size={20} />
                  </div>
                  <h4 className="font-heading font-black text-sm text-secondary mb-2">{item.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">{item.desc}</p>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Không gian trị liệu Premium Gallery (Mới) */}
      <section className="py-16 md:py-24 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <ScrollReveal>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="bg-[#14B8A6]/10 text-[#0D9488] border border-[#14B8A6]/20 text-[9px] font-black uppercase tracking-widest px-3.5 py-1.5 rounded-full inline-block mb-3 shadow-sm">
                Cơ sở vật chất
              </span>
              <h2 className="font-heading text-2xl md:text-3xl font-black text-secondary tracking-tight">
                Không Gian Trị Liệu Chuẩn Premium Clinic
              </h2>
              <p className="text-slate-500 text-xs md:text-sm font-semibold mt-2">
                Không gian thiết kế theo phong cách villa nghỉ dưỡng biệt lập, mang lại sự riêng tư và cảm giác thư thái tối đa cho khách hàng trong suốt thời gian trị liệu.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { src: '/images/physio_clinic_villa.png', title: 'Khuôn viên ngoài trời biệt lập' },
              { src: '/images/physio_premium_facility.png', title: 'Phòng tập PHCN Kinetic Rehab' },
              { src: '/images/physio_treatment_room.png', title: 'Phòng trị liệu công nghệ cao' },
              { src: '/images/therapist_treatment_banner.png', title: 'Phòng nắn chỉnh cột sống chuyên biệt' }
            ].map((facility, idx) => (
              <ScrollReveal key={facility.title} delay={idx * 100}>
                <div className="group rounded-2xl overflow-hidden border border-slate-100 shadow-sm relative aspect-[4/3] cursor-pointer">
                  <img
                    src={facility.src}
                    alt={facility.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <p className="text-white text-xs font-black uppercase tracking-wider">{facility.title}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Đội ngũ teaser */}
      <section className="py-16 md:py-24 bg-slate-50/50 border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <ScrollReveal>
            <h2 className="font-heading font-black text-2xl md:text-3xl text-secondary tracking-tight mb-4">Đội ngũ chuyên gia đồng hành cùng bạn</h2>
            <p className="text-slate-500 text-sm leading-relaxed font-semibold max-w-xl mx-auto mb-7">
              Đội ngũ bác sĩ chuyên khoa I PHCN và kỹ thuật viên y học thể thao được đào tạo bài bản từ Đại học Y Dược, có hơn 10 năm kinh nghiệm xử lý đau vai gáy cột sống văn phòng.
            </p>
            <Link
              to="/specialists"
              className="inline-flex items-center gap-1.5 px-6 py-3 border-2 border-[#2EC4B6]/20 hover:border-[#2EC4B6]/40 text-[#0D9488] font-jakarta font-extrabold rounded-xl hover:bg-[#14B8A6]/5 transition-all text-xs"
            >
              Xem đội ngũ chuyên gia <ArrowRight size={13} />
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* Bản đồ Google Map & Thẻ thông tin liên hệ nổi (Mới) */}
      <section className="relative w-full h-[480px] bg-slate-100 border-t border-slate-150">
        {/* Google Maps Iframe */}
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.2217631388835!2d106.70617309999999!3d10.7943265!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3919221763138883%3A0x123456789abcdef!2sVinhomes%20Golden%20River!5e0!3m2!1svi!2s!4v1700000000000!5m2!1svi!2s"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen={true}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Google Map OfficeCare"
          className="absolute inset-0 z-0"
        ></iframe>

        {/* Floating Contact Card overlay */}
        <div className="absolute top-1/2 left-4 md:left-20 -translate-y-1/2 z-10 w-full max-w-sm px-4 md:px-0">
          <div className="bg-white/95 backdrop-blur-md rounded-[32px] p-8 shadow-2xl border border-slate-150/80 space-y-5 animate-float">
            <div className="space-y-1">
              <span className="bg-[#14B8A6]/10 text-[#0D9488] border border-[#14B8A6]/20 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full inline-block">
                📍 Vị trí & Liên hệ
              </span>
              <h3 className="font-heading font-black text-lg text-slate-900 pt-1">Phòng Khám OfficeCare</h3>
            </div>
            
            <div className="space-y-3.5 text-xs text-slate-600 font-semibold leading-relaxed">
              <div className="flex items-start gap-3">
                <span className="text-[#0D9488] shrink-0 mt-0.5">🏢</span>
                <p>Khu đô thị Vinhomes Golden River, Bến Nghé, Quận 1, TP. Hồ Chí Minh</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[#0D9488] shrink-0">📞</span>
                <p>Hotline: 1900 1234</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[#0D9488] shrink-0">✉️</span>
                <p>Email: hello@officecare.vn</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[#0D9488] shrink-0">🕒</span>
                <p>Thời gian mở cửa: 07:30 - 20:30 (Thứ 2 - Chủ Nhật)</p>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to="/booking"
                className="w-full bg-[#2EC4B6] hover:bg-[#25A89C] text-white text-center font-black py-3.5 rounded-xl text-xs uppercase tracking-widest transition-all duration-300 block shadow-md shadow-[#2EC4B6]/25 active:scale-98"
              >
                Đặt Lịch Hẹn Khám Ngay
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
