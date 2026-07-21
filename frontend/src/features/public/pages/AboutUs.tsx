import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, HeartPulse, Lock, Users, Stethoscope, Award, MapPin, Phone, Mail, MessageCircle, Facebook } from 'lucide-react';
import LazyImage from '../../../components/LazyImage';
import ScrollReveal from '../components/shared/ScrollReveal';

const CORE_VALUES = [
  {
    icon: Stethoscope,
    title: 'Thăm khám 1:1 Bác sĩ CKI',
    desc: 'Mọi phác đồ phục hồi đều được Bác sĩ chuyên khoa chẩn đoán lâm sàng và giám sát trực tiếp.'
  },
  {
    icon: HeartPulse,
    title: 'Phác đồ cá nhân hóa 100%',
    desc: 'Không có công thức chung — mỗi bệnh nhân được thiết kế lộ trình riêng theo ngưỡng chịu đau và tính chất công việc.'
  },
  {
    icon: ShieldCheck,
    title: 'An toàn & không xâm lấn',
    desc: 'Phương pháp bảo tồn tự nhiên, giải phóng cơ khớp nhẹ nhàng không dùng thuốc giảm đau.'
  },
  {
    icon: Users,
    title: 'Đồng hành dài hạn',
    desc: 'Theo dõi chỉ số sinh học và biên độ khớp xuyên suốt liệu trình nhằm ngăn ngừa tái phát mạn tính.'
  }
];

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-slate-50/50 font-sans overflow-hidden">
      <Helmet>
        <title>Giới thiệu phòng khám | OfficeCare Clinic</title>
        <meta
          name="description"
          content="OfficeCare — Phòng khám phục hồi chức năng cột sống và cơ xương khớp chuyên sâu cho dân văn phòng. Tìm hiểu sứ mệnh, giá trị cốt lõi và đội ngũ y khoa của chúng tôi."
        />
      </Helmet>

      {/* Hero Banner Header */}
      <section className="relative pt-28 pb-16 lg:pt-32 lg:pb-20 bg-gradient-to-b from-teal-500/10 via-white to-slate-50/70 border-b border-slate-200/60">
        <div className="absolute top-1/4 left-10 w-72 h-72 bg-teal-400/10 rounded-full filter blur-[100px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#2EC4B6]/10 rounded-full filter blur-[120px] pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 text-center space-y-4">
          <ScrollReveal>
            <span className="bg-[#0D9488]/10 text-[#0D9488] border border-[#0D9488]/20 text-[10px] font-semibold tracking-wider px-3.5 py-1.5 rounded-full inline-block shadow-2xs">
              Về phòng khám OfficeCare
            </span>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <h1 className="font-heading font-bold text-2xl sm:text-3xl md:text-4xl lg:text-[40px] text-slate-800 leading-[1.3] tracking-normal">
              Đồng Hành Phục Hồi Chức Năng <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-[#0D9488] to-[#14B8A6] bg-clip-text text-transparent font-bold">
                Cùng Giới Văn Phòng Việt Nam
              </span>
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <p className="text-slate-600 text-xs md:text-sm leading-relaxed font-normal max-w-2xl mx-auto">
              OfficeCare ra đời từ sự thấu hiểu tình trạng đau mỏi cổ vai gáy &amp; thoát vị thắt lưng của người làm việc văn phòng. Chúng tôi xây dựng một môi trường y tế chuẩn hóa, cá nhân hóa phác đồ giúp bệnh nhân tìm lại sự thoải mái trong từng vận động.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Sứ mệnh & Câu chuyện sáng lập */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <ScrollReveal direction="right">
            <div className="rounded-3xl overflow-hidden shadow-lg border border-slate-200/80 aspect-[4/3] relative group bg-slate-100">
              <LazyImage
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuChY7AW6ev6J87eZLl2o4MoOD8BnBBtnPFSB4sYKHKTosht_wFuKieK_jt9CtkyD3kA167GUk8Yv-tUkVT4HN7Y30l1-IvGzK21MPHz2SivO1OybUi6n3NCCiMObQuKtnx2j3jPLLy02O1zGNlbH6Q2vUq-MIs7udDukLlJ6rq88bk56Zx9KQdrvKpHKuGS5t8GE28Cpn03TTkqWiO84_J2E0tCuwpNunaAl4gqM19_WXyeqvQDPUdzHpThmQ9l73Ch6AY7CGkNuv8"
                alt="Không gian điều trị y tế tại OfficeCare"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                wrapperClassName="w-full h-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-white/60">
                <p className="text-[10px] font-bold text-[#0D9488]">Không gian y tế hiện đại</p>
                <p className="text-xs text-slate-700 font-medium">Trị liệu riêng tư, mang lại cảm giác thư thái tối đa</p>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="left" delay={100}>
            <div className="space-y-4 text-left">
              <span className="text-[10px] font-semibold tracking-wider text-[#0D9488] bg-[#0D9488]/10 px-3 py-1 rounded-full inline-block">
                Câu chuyện sáng lập
              </span>
              <h2 className="font-heading font-bold text-2xl md:text-3xl text-slate-800 tracking-normal leading-snug">
                Giải cứu cột sống khỏi áp lực của "8 tiếng làm việc mỗi ngày"
              </h2>
              <p className="text-slate-600 text-xs md:text-sm leading-relaxed font-normal">
                Tại các đô thị lớn, giới văn phòng công sở phải ngồi liên tục 8–10 tiếng mỗi ngày, gõ máy tính sai tư thế và ít vận động. Điều này tích lũy dần thành những cơn đau mỏi mạn tính tàn phá sức khỏe cột sống từ rất sớm.
              </p>
              <p className="text-slate-600 text-xs md:text-sm leading-relaxed font-normal">
                OfficeCare xây dựng một trung tâm phục hồi chức năng chuyên biệt, nơi kỹ thuật trị liệu tay giải phóng điểm đau kết hợp cùng sóng trị liệu Châu Âu giúp triệt tiêu triệt để nguyên nhân gây đau không dùng thuốc.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Sứ mệnh & Tầm nhìn */}
      <section className="py-16 bg-slate-50/60 border-t border-slate-200/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <ScrollReveal direction="up">
            <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-2xs space-y-3 text-left">
              <div className="size-10 rounded-xl bg-teal-50 text-[#0D9488] flex items-center justify-center font-bold">
                🎯
              </div>
              <h3 className="font-heading font-bold text-lg text-slate-800">Sứ Mệnh Y Khoa</h3>
              <p className="text-slate-600 text-xs md:text-sm leading-relaxed font-normal">
                Cung cấp các giải pháp phục hồi chức năng cơ xương khớp an toàn, hiệu quả và cá nhân hóa. Chấm dứt các cơn đau cột sống mạn tính cho giới văn phòng mà không lạm dụng thuốc giảm đau hay phẫu thuật không cần thiết.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={100}>
            <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-2xs space-y-3 text-left">
              <div className="size-10 rounded-xl bg-teal-50 text-[#0D9488] flex items-center justify-center font-bold">
                👁️
              </div>
              <h3 className="font-heading font-bold text-lg text-slate-800">Tầm Nhìn Chiến Lược</h3>
              <p className="text-slate-600 text-xs md:text-sm leading-relaxed font-normal">
                Trở thành hệ thống phòng khám phục hồi chức năng uy tín hàng đầu tại Việt Nam trong lĩnh vực điều trị bảo tồn cột sống văn phòng, đồng hành kiến tạo môi trường làm việc khỏe mạnh tối ưu.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Metric Counters */}
      <section className="py-12 bg-white border-y border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: '+15.000', label: 'Bệnh nhân phục hồi' },
            { value: '100%', label: 'Bác sĩ CKI lượng giá' },
            { value: '4.9 / 5', label: 'Đánh giá hài lòng' },
            { value: '07:30 – 20:30', label: 'Mở cửa tất cả các ngày' }
          ].map((stat, idx) => (
            <ScrollReveal key={idx} delay={idx * 80}>
              <p className="font-heading font-bold text-2xl md:text-3xl text-[#0D9488]">{stat.value}</p>
              <p className="text-xs text-slate-500 font-medium mt-1">{stat.label}</p>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Giá trị cốt lõi */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="bg-teal-50 text-[#0D9488] border border-teal-500/20 font-bold tracking-wider uppercase text-[10px] px-3.5 py-1.5 rounded-full inline-block mb-2">
                Quy chuẩn y đức
              </span>
              <h2 className="font-heading font-bold text-2xl md:text-3xl text-slate-800">
                Giá Trị Cốt Lõi Tại OfficeCare
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CORE_VALUES.map((item, idx) => {
              const Icon = item.icon;
              return (
                <ScrollReveal key={idx} delay={idx * 100}>
                  <div className="bg-slate-50/70 hover:bg-white rounded-2xl p-6 border border-slate-200/70 hover:border-teal-500/40 hover:shadow-md transition-all duration-300 h-full flex flex-col justify-between text-left group">
                    <div className="space-y-3">
                      <div className="size-11 rounded-xl bg-teal-500/10 text-[#0D9488] group-hover:bg-[#0D9488] group-hover:text-white flex items-center justify-center transition-colors duration-300">
                        <Icon size={20} />
                      </div>
                      <h4 className="font-heading font-bold text-sm text-slate-800">{item.title}</h4>
                      <p className="text-xs text-slate-500 font-normal leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Facility Gallery */}
      <section className="py-16 bg-slate-50/60 border-t border-slate-200/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="bg-[#0D9488]/10 text-[#0D9488] border border-[#0D9488]/20 text-[10px] font-semibold tracking-wider px-3.5 py-1.5 rounded-full inline-block mb-2">
                Không gian phòng khám
              </span>
              <h2 className="font-heading font-bold text-2xl md:text-3xl text-slate-800">
                Trị Liệu Trong Không Gian Hiện Đại &amp; Riêng Tư
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { src: '/goi/images/kham_sang_loc.png', title: 'Phòng khám lượng giá 1:1' },
              { src: '/goi/images/laser_tri_lieu.png', title: 'Phòng laser cường độ cao 30W' },
              { src: '/goi/images/song_xung_kich.png', title: 'Máy sóng xung kích Shockwave' },
              { src: '/goi/images/giai_co_sau.png', title: 'Khu vực giải phóng cơ sâu' }
            ].map((facility, idx) => (
              <ScrollReveal key={idx} delay={idx * 100}>
                <div className="group rounded-2xl overflow-hidden border border-slate-200/80 shadow-2xs relative aspect-[4/3] bg-slate-100">
                  <LazyImage
                    src={facility.src}
                    alt={facility.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    wrapperClassName="w-full h-full"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-4">
                    <p className="text-white text-xs font-semibold">{facility.title}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Google Map & Contact Details Card */}
      <section className="relative w-full h-[450px] bg-slate-100 border-t border-slate-200/80">
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

        {/* Contact Overlay Card */}
        <div className="absolute top-1/2 left-4 md:left-16 -translate-y-1/2 z-10 w-full max-w-sm px-4 md:px-0">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-slate-200/80 space-y-4 text-left">
            <div className="space-y-1">
              <span className="bg-[#0D9488]/10 text-[#0D9488] border border-[#0D9488]/20 text-[9.5px] font-semibold px-3 py-1 rounded-full inline-block">
                📍 Vị trí &amp; Liên hệ
              </span>
              <h3 className="font-heading font-bold text-base text-slate-800 pt-1">Phòng Khám OfficeCare</h3>
            </div>
            
            <div className="space-y-2.5 text-xs text-slate-600 font-normal leading-relaxed">
              <div className="flex items-start gap-2.5">
                <MapPin className="text-[#0D9488] shrink-0 mt-0.5" size={15} />
                <p>Vinhomes Golden River, Bến Nghé, Quận 1, TP. Hồ Chí Minh</p>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="text-[#0D9488] shrink-0" size={15} />
                <a href="tel:0398655332" className="hover:text-[#0D9488] font-bold transition-colors">Hotline &amp; Zalo: 0398655332</a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="text-[#0D9488] shrink-0" size={15} />
                <a href="mailto:officecareclinic2026@gmail.com" className="hover:text-[#0D9488] transition-colors">officecareclinic2026@gmail.com</a>
              </div>
              <div className="flex items-center gap-2.5">
                <Facebook className="text-[#0D9488] shrink-0" size={15} />
                <a href="https://www.facebook.com/profile.php?id=61591064963268" target="_blank" rel="noopener noreferrer" className="hover:text-[#0D9488] transition-colors">Fanpage Facebook OfficeCare</a>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to="/booking"
                className="w-full bg-[#0D9488] hover:bg-[#0B7A70] text-white text-center font-bold py-3 rounded-xl text-xs transition-all block shadow-xs"
              >
                Đặt Lịch Hẹn Khám Bác Sĩ
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
