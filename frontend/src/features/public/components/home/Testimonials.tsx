import { Star } from 'lucide-react';
import ScrollReveal from '../shared/ScrollReveal';

export default function Testimonials() {
  const testimonials = [
    {
      name: "Trần Minh",
      role: "Kỹ sư Phần mềm",
      text: "Tôi đã giảm hẳn triệu chứng đau mỏi cổ vai gáy kéo dài sau 3 buổi Siêu âm trị liệu sâu kết hợp di động khớp. Đặt lịch rất linh hoạt!",
      initial: "M"
    },
    {
      name: "Lan Anh",
      role: "Quản lý Marketing",
      text: "Sử dụng Bác sĩ AI tư vấn trước rồi qua phòng khám lượng giá trực tiếp. Đội ngũ y bác sĩ cực kỳ chu đáo và phòng khám sạch sẽ, biệt lập.",
      initial: "A"
    },
    {
      name: "Hải Nam",
      role: "Doanh nhân",
      text: "Các kỹ thuật viên trị liệu cơ xương khớp tay nghề rất cao. Gói trị liệu thắt lưng đã giúp tôi trở lại chạy bộ bình thường.",
      initial: "N"
    },
    // Duplicates for infinite scrolling carousel
    {
      name: "Trần Minh",
      role: "Kỹ sư Phần mềm",
      text: "Tôi đã giảm hẳn triệu chứng đau mỏi cổ vai gáy kéo dài sau 3 buổi Siêu âm trị liệu sâu kết hợp di động khớp. Đặt lịch rất linh hoạt!",
      initial: "M"
    },
    {
      name: "Lan Anh",
      role: "Quản lý Marketing",
      text: "Sử dụng Bác sĩ AI tư vấn trước rồi qua phòng khám lượng giá trực tiếp. Đội ngũ y bác sĩ cực kỳ chu đáo và phòng khám sạch sẽ, biệt lập.",
      initial: "A"
    },
    {
      name: "Hải Nam",
      role: "Doanh nhân",
      text: "Các kỹ thuật viên trị liệu cơ xương khớp tay nghề rất cao. Gói trị liệu thắt lưng đã giúp tôi trở lại chạy bộ bình thường.",
      initial: "N"
    }
  ];

  return (
    <section className="py-xxl overflow-hidden bg-primary/5 border-b border-primary/10 relative">
      {/* Left/Right fading gradient overlays */}
      <div className="absolute left-0 top-0 h-full w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none"></div>
      <div className="absolute right-0 top-0 h-full w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 text-center relative z-10">
        <ScrollReveal>
          <h2 className="font-jakarta text-3xl font-black text-secondary">
            Khách Hàng Nói Về Office Care
          </h2>
        </ScrollReveal>
      </div>

      <div className="flex marquee space-x-6 relative z-0">
        {testimonials.map((testimonial, idx) => (
          <div 
            key={idx} 
            className="min-w-[340px] md:min-w-[400px] bg-white p-6 rounded-[32px] border border-slate-200/60 shadow-sm space-y-4"
          >
            <div className="flex gap-1 text-accent">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={15} fill="#FF9F1C" className="text-accent border-none" />
              ))}
            </div>
            <p className="font-jakarta text-xs md:text-sm text-secondary/80 font-semibold leading-relaxed text-left">
              "{testimonial.text}"
            </p>
            <div className="flex items-center gap-3 border-t border-slate-50 pt-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center font-black text-primary font-jakarta text-sm">
                {testimonial.initial}
              </div>
              <div className="text-left">
                <p className="font-jakarta font-extrabold text-sm leading-none text-secondary">{testimonial.name}</p>
                <p className="font-jakarta text-[10px] text-slate-400 font-bold mt-1">{testimonial.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
