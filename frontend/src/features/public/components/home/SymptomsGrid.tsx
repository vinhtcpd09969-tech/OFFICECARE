import { motion } from 'framer-motion';
import { Activity, Flame, Zap, User, ArrowRight } from 'lucide-react';
import ScrollReveal from '../shared/ScrollReveal';

export default function SymptomsGrid() {
  const symptoms = [
    {
      title: "Đau cổ vai gáy",
      desc: "Căng cứng vùng cơ vai cổ, mỏi buốt khi ngồi máy tính lâu.",
      icon: <Activity size={28} className="text-primary" />,
      tag: "Phổ biến nhất"
    },
    {
      title: "Đau thắt lưng",
      desc: "Đau nhức ê ẩm thắt lưng do ngồi sai tư thế, thiếu tựa lưng.",
      icon: <Flame size={28} className="text-primary" />,
      tag: "Cột sống"
    },
    {
      title: "Tê bì tay chân",
      desc: "Tê rần ngón tay, bàn tay do chèn ép thần kinh gõ bàn phím.",
      icon: <Zap size={28} className="text-primary" />,
      tag: "Thần kinh ngoại biên"
    },
    {
      title: "Gù lưng, lệch tư thế",
      desc: "Cột sống cong lệch, gù vai do thói quen rướn người về trước.",
      icon: <User size={28} className="text-primary" />,
      tag: "Cơ sinh học"
    }
  ];

  return (
    <section className="py-xxl bg-slate-50/50 border-y border-slate-100 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-primary font-black tracking-widest uppercase text-xs mb-3 font-jakarta">Bạn đang khó chịu?</h2>
            <h3 className="font-jakarta text-3xl md:text-4xl font-extrabold text-secondary mb-4 leading-tight">Triệu Chứng Của Bạn Là Gì?</h3>
            <div className="h-1.5 w-24 bg-primary mx-auto rounded-full"></div>
            <p className="text-slate-500 font-medium text-sm md:text-base mt-4">
              Nhận biết sớm các dấu hiệu quá tải cơ xương khớp do đặc thù ngồi làm việc văn phòng lâu ngày để có phương án điều trị kịp thời.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {symptoms.map((symptom, idx) => (
            <ScrollReveal key={idx} delay={idx * 100}>
              <motion.div 
                whileHover={{ 
                  y: -8,
                  scale: 1.02,
                  boxShadow: "0 20px 40px -15px rgba(46, 196, 182, 0.15)"
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="group h-full bg-white p-6 rounded-[32px] text-center border border-slate-100 hover:border-primary/30 transition-colors cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <motion.div 
                    whileHover={{ rotate: 15, scale: 1.1 }}
                    className="w-16 h-16 bg-[#F0FDFB] rounded-2xl flex items-center justify-center mx-auto mb-6 border border-primary/5 transition-transform duration-300"
                  >
                    {symptom.icon}
                  </motion.div>
                  <span className="text-[9px] bg-primary/10 text-primary font-black px-2.5 py-1 rounded-full uppercase tracking-wider mb-3 inline-block">
                    {symptom.tag}
                  </span>
                  <h4 className="font-jakarta font-extrabold text-base text-secondary mb-2">{symptom.title}</h4>
                  <p className="font-jakarta text-xs text-slate-400 font-medium leading-relaxed">
                    {symptom.desc}
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-50 flex items-center justify-center gap-1.5 text-xs font-black text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Tư vấn trị liệu <ArrowRight size={12} />
                </div>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
