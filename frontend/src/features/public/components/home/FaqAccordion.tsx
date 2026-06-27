import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ScrollReveal from '../shared/ScrollReveal';

export default function FaqAccordion() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "Chi phí liệu trình trị liệu tại nhà dao động khoảng bao nhiêu?",
      a: "Dịch vụ trị liệu cơ xương khớp tại nhà của Office Care dao động từ 400.000đ - 600.000đ mỗi buổi tùy thuộc vào gói dịch vụ và kỹ thuật chuyên môn. Chúng tôi khuyến khích đăng ký theo lộ trình combo để tối ưu 20-25% chi phí."
    },
    {
      q: "Bác sĩ AI hỗ trợ như thế nào trong quá trình chẩn đoán?",
      a: "Bác sĩ AI giúp sàng lọc nhanh các thói quen ngồi làm việc và xác định tạm thời vùng cơ căng cứng, đưa ra các bài tập tự giãn cơ tức thì. Để có phác đồ điều trị dứt điểm lâu dài, chuyên gia của Office Care sẽ trực tiếp tiến hành khám lượng giá cơ sinh học tại phòng khám."
    },
    {
      q: "Phòng khám có cung cấp bảo hiểm y tế tư nhân không?",
      a: "Chúng tôi hỗ trợ xuất hóa đơn VAT đầy đủ theo mã dịch vụ Phục hồi chức năng & Vật lý trị liệu để quý khách hàng làm thủ tục giải quyết thanh toán bảo hiểm y tế tư nhân (PVI, Bảo Việt, Liberty...)."
    }
  ];

  return (
    <section className="py-xxl max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <ScrollReveal>
        <h2 className="font-jakarta text-3xl font-black text-center mb-12 text-secondary">
          Câu Hỏi Thường Gặp
        </h2>
      </ScrollReveal>
      
      <div className="space-y-4">
        {faqs.map((faq, idx) => (
          <ScrollReveal key={idx} delay={idx * 100}>
            <div 
              className="bg-white p-5 rounded-3xl border border-slate-200/80 cursor-pointer transition-all duration-300 hover:border-primary/30 hover:shadow-sm overflow-hidden"
              onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
            >
              <div className="flex justify-between items-center font-jakarta font-extrabold text-sm md:text-base text-secondary select-none text-left gap-4">
                <span>{faq.q}</span>
                <ChevronRight 
                  size={18} 
                  className={`text-slate-400 shrink-0 transition-transform duration-300 ${
                    openFaq === idx ? 'rotate-90 text-primary' : ''
                  }`} 
                />
              </div>
              
              <AnimatePresence initial={false}>
                {openFaq === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="pt-4 font-jakarta text-xs md:text-sm text-slate-400 font-semibold leading-relaxed border-t border-slate-50 mt-4 text-left">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
