import { motion } from 'framer-motion';
import { ShieldCheck, Home as HomeIcon, Calendar, Award } from 'lucide-react';
import ScrollReveal from '../shared/ScrollReveal';

export default function Benefits() {
  const benefits = [
    {
      title: "Trị liệu tận gốc",
      desc: "Thăm khám lượng giá tìm chính xác nguồn gốc cơn đau thắt cơ để điều trị lâu dài.",
      icon: <ShieldCheck size={36} className="text-primary" />
    },
    {
      title: "Linh hoạt không gian",
      desc: "Điều trị trực tiếp tại phòng khám VIP Quận 1 hoặc trị liệu viên hỗ trợ tại nhà.",
      icon: <HomeIcon size={36} className="text-primary" />
    },
    {
      title: "Đặt lịch 30 giây",
      desc: "Đặt lịch khám, chọn bác sĩ và thời gian mong muốn dễ dàng qua hệ thống trực tuyến.",
      icon: <Calendar size={36} className="text-primary" />
    },
    {
      title: "Chứng chỉ quốc tế",
      desc: "Đội ngũ kỹ thuật viên tốt nghiệp chuyên ngành phục hồi chức năng và được đào tạo chuyên sâu.",
      icon: <Award size={36} className="text-primary" />
    }
  ];

  return (
    <section className="py-xxl bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-6">
          {benefits.map((benefit, idx) => (
            <ScrollReveal key={idx} delay={idx * 100}>
              <motion.div 
                whileHover={{ 
                  y: -6, 
                  boxShadow: "0 15px 30px -10px rgba(0, 0, 0, 0.05)",
                  backgroundColor: "#F0FDFB"
                }}
                className="flex flex-col items-center text-center p-6 h-full rounded-3xl bg-slate-50 border border-slate-100/50 transition-colors duration-300"
              >
                <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 mb-4 text-primary">
                  {benefit.icon}
                </div>
                <h4 className="font-jakarta font-extrabold text-base text-secondary mb-2">{benefit.title}</h4>
                <p className="font-jakarta text-xs text-slate-400 font-semibold leading-relaxed">
                  {benefit.desc}
                </p>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
