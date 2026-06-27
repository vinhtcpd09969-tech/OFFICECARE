import { User, Clock, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import ScrollReveal from '../shared/ScrollReveal';

export default function ProcessTimeline() {
  const steps = [
    {
      title: "1. Chọn Chuyên Gia & Đặt Lịch",
      desc: "Thực hiện đăng ký trực tuyến nhanh chóng, tự do chọn chuyên gia bác sĩ và khung giờ thuận tiện.",
      icon: <User size={26} />
    },
    {
      title: "2. Thăm Khám & Trị Liệu",
      desc: "Được khám lượng giá miễn phí tại phòng khám Vip và trị liệu theo phác đồ cá nhân hóa chuẩn y khoa.",
      icon: <Clock size={26} />
    },
    {
      title: "3. Nhận Bài Tập & Theo Dõi",
      desc: "Nhận giáo trình tập phục hồi cơ tay, cổ tại nhà và hướng dẫn ngăn tái phát từ kỹ thuật viên.",
      icon: <CheckCircle2 size={26} />
    }
  ];

  return (
    <section className="py-xxl bg-primary/5 border-b border-primary/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <h2 className="font-jakarta text-3xl md:text-4xl font-extrabold text-secondary text-center mb-16">
            Quy Trình Đơn Giản Lấy Lại Sức Khỏe
          </h2>
        </ScrollReveal>
        
        <div className="relative flex flex-col md:flex-row justify-between items-stretch gap-8 md:gap-6">
          {/* Connector Line on Desktop */}
          <div className="hidden md:block absolute top-10 left-12 right-12 h-0.5 bg-primary/20 -z-10"></div>
          
          {steps.map((step, idx) => (
            <ScrollReveal key={idx} delay={idx * 150} className="flex-1">
              <motion.div 
                whileHover={{ y: -6, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)" }}
                className="bg-white p-6 rounded-3xl h-full border border-slate-150/60 shadow-sm text-center flex flex-col items-center space-y-4 transition-all duration-300"
              >
                <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center border-4 border-teal-50 shadow-md">
                  {step.icon}
                </div>
                <h5 className="font-jakarta font-extrabold text-base text-secondary">{step.title}</h5>
                <p className="font-jakarta text-xs text-slate-400 font-semibold leading-relaxed max-w-xs">
                  {step.desc}
                </p>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
