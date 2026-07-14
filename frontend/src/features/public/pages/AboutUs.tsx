import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, HeartPulse, Lock, Users, Calendar } from 'lucide-react';
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

      {/* Sứ mệnh / Câu chuyện */}
      <section className="py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <ScrollReveal direction="right">
            <div className="rounded-[32px] overflow-hidden shadow-lg border border-primary/10 aspect-[4/3]">
              <LazyImage
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuChY7AW6ev6J87eZLl2o4MoOD8BnBBtnPFSB4sYKHKTosht_wFuKieK_jt9CtkyD3kA167GUk8Yv-tUkVT4HN7Y30l1-IvGzK21MPHz2SivO1OybUi6n3NCCiMObQuKtnx2j3jPLLy02O1zGNlbH6Q2vUq-MIs7udDukLlJ6rq88bk56Zx9KQdrvKpHKuGS5t8GE28Cpn03TTkqWiO84_J2E0tCuwpNunaAl4gqM19_WXyeqvQDPUdzHpThmQ9l73Ch6AY7CGkNuv8"
                alt="Không gian điều trị Office Care"
                className="size-full object-cover"
                wrapperClassName="size-full"
              />
            </div>
          </ScrollReveal>
          <ScrollReveal direction="left" delay={100}>
            <div className="space-y-4">
              <h2 className="font-heading font-black text-2xl md:text-3xl text-secondary tracking-tight">Sứ mệnh của chúng tôi</h2>
              <p className="text-slate-500 text-sm leading-relaxed font-semibold">
                Chúng tôi tin rằng phục hồi chức năng hiệu quả không đến từ những bài tập đại trà, mà từ phác đồ được cá nhân hóa, theo sát bởi đội ngũ chuyên môn thật sự hiểu cơ thể bạn.
              </p>
              <p className="text-slate-500 text-sm leading-relaxed font-semibold">
                Từ phòng khám đầu tiên, OfficeCare tập trung giải quyết đúng vấn đề của người làm văn phòng: đau mỏi tích lũy do tư thế ngồi sai và ít vận động — kết hợp công nghệ trị liệu hiện đại với sự theo dõi tận tâm suốt hành trình điều trị.
              </p>
              <Link
                to="/services"
                className="inline-flex items-center gap-1.5 text-xs font-jakarta font-extrabold text-[#0D9488] hover:gap-2.5 transition-all pt-2"
              >
                Khám phá dịch vụ của chúng tôi <ArrowRight size={13} />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Stats bar */}
      <section className="py-12 bg-white border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '10+', label: 'Năm kinh nghiệm' },
            { value: '1.200+', label: 'Bệnh nhân phục hồi' },
            { value: '4.9/5', label: 'Đánh giá hài lòng' },
            { value: '7:30–20:30', label: 'Giờ hoạt động mỗi ngày' }
          ].map((stat, idx) => (
            <ScrollReveal key={stat.label} delay={idx * 80}>
              <p className="font-heading font-black text-2xl md:text-3xl text-primary">{stat.value}</p>
              <p className="text-[11px] md:text-xs text-slate-450 font-bold uppercase tracking-wide mt-1">{stat.label}</p>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Giá trị cốt lõi */}
      <section className="py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-6">
          <ScrollReveal>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-primary font-black tracking-widest uppercase text-xs mb-3">Giá trị cốt lõi</h2>
              <h3 className="font-heading text-2xl md:text-3xl font-black text-secondary tracking-tight">Điều làm nên sự khác biệt</h3>
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

      {/* Đội ngũ teaser */}
      <section className="py-16 md:py-20 bg-white border-y border-slate-100">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <ScrollReveal>
            <h2 className="font-heading font-black text-2xl md:text-3xl text-secondary tracking-tight mb-4">Đội ngũ chuyên gia đồng hành cùng bạn</h2>
            <p className="text-slate-500 text-sm leading-relaxed font-semibold max-w-xl mx-auto mb-7">
              Đội ngũ bác sĩ và kỹ thuật viên vật lý trị liệu có bằng cấp chuyên môn cao, hơn 10 năm kinh nghiệm điều trị các hội chứng cơ xương khớp văn phòng.
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

      {/* CTA */}
      <section className="py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-6">
          <ScrollReveal>
            <div className="bg-gradient-to-br from-[#0D9488] to-[#14B8A6] rounded-3xl p-10 text-center shadow-lg">
              <h3 className="font-heading font-black text-lg md:text-xl text-white mb-2">Sẵn sàng bắt đầu hành trình phục hồi?</h3>
              <p className="text-teal-50 text-xs md:text-sm font-semibold mb-6 max-w-md mx-auto">
                Đặt lịch khám ngay hôm nay để được chuyên gia OfficeCare tư vấn phác đồ phù hợp với bạn.
              </p>
              <Link
                to="/booking"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#0D9488] font-black text-xs rounded-xl shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                <Calendar size={14} /> Đặt lịch ngay <ArrowRight size={14} />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
