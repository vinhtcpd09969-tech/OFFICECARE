import { ClipboardCheck, Stethoscope, Zap, HeartHandshake } from 'lucide-react';
import ScrollReveal from '../effects/ScrollReveal';

const PROCESS_STEPS = [
  {
    step: '01',
    icon: ClipboardCheck,
    title: 'Tiếp Đón & Khai Tháo Tiền Sử Y Khoa',
    desc: 'Bệnh nhân được đón tiếp chu đáo, lắng nghe thói quen sinh hoạt và tầm soát ban đầu các chỉ số cơ quan vận động.',
    tag: 'Tầm soát ban đầu'
  },
  {
    step: '02',
    icon: Stethoscope,
    title: 'Bác Sĩ CKI Thăm Khám & Lượng Giá 1:1',
    desc: 'Bác sĩ chuyên khoa đo biên độ vận động (ROM), đánh giá thang điểm đau (VAS) và siêu âm vị trí mô cơ tổn thương.',
    tag: 'Chẩn đoán chính xác'
  },
  {
    step: '03',
    icon: Zap,
    title: 'Trị Liệu Công Nghệ Cao Chuẩn Y Khoa',
    desc: 'Ứng dụng sóng xung kích Shockwave, Laser 30W và di động khớp thủ công giải phóng hoàn toàn điểm đau (Trigger points).',
    tag: 'Trị liệu chuyên sâu'
  },
  {
    step: '04',
    icon: HeartHandshake,
    title: 'Đánh Giá Lại & Hướng Dẫn Bài Tập Tại Nhà',
    desc: 'Kiểm tra độ cải thiện ngay sau buổi làm việc, tư vấn phác đồ phòng ngừa tái phát và hướng dẫn bài tập tư thế chuẩn.',
    tag: 'Theo dõi đồng hành'
  }
];

export default function MedicalProcessSection() {
  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-white via-slate-50/50 to-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <span className="bg-[#0D9488]/10 text-[#0D9488] border border-[#0D9488]/20 font-extrabold tracking-wider uppercase text-[10px] px-3.5 py-1.5 rounded-full inline-block">
              Quy Trình Tiếp Đón Chuẩn Y Khoa
            </span>
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
              4 Bước Trải Nghiệm Thăm Khám &amp; Phục Hồi Tại OfficeCare
            </h2>
            <p className="text-slate-500 font-normal text-xs sm:text-sm leading-relaxed">
              Áp dụng cho toàn bộ bệnh nhân khi đến thăm khám - từ buổi tư vấn đầu tiên tới các gói phác đồ trị liệu chuyên sâu.
            </p>
          </div>
        </ScrollReveal>

        {/* 4-Step Grid with Connecting Flow */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {PROCESS_STEPS.map((stepItem, idx) => {
            const Icon = stepItem.icon;
            return (
              <ScrollReveal key={stepItem.step} delay={idx * 100}>
                <div className="bg-white rounded-[24px] p-6 border border-slate-200/80 hover:border-[#0D9488]/40 hover:shadow-lg transition-all duration-300 h-full flex flex-col justify-between group relative overflow-hidden text-left">
                  <div className="space-y-4">
                    
                    {/* Header Step Badge & Icon */}
                    <div className="flex items-center justify-between">
                      <div className="size-12 rounded-2xl bg-teal-50 text-[#0D9488] group-hover:bg-[#0D9488] group-hover:text-white flex items-center justify-center transition-colors duration-300 shadow-2xs">
                        <Icon size={22} />
                      </div>
                      <span className="font-heading font-black text-2xl text-slate-200 group-hover:text-[#0D9488] transition-colors">
                        {stepItem.step}
                      </span>
                    </div>

                    {/* Step Title & Tag */}
                    <div>
                      <span className="text-[9.5px] font-black uppercase tracking-wider text-[#0D9488] bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-100 inline-block mb-1.5">
                        {stepItem.tag}
                      </span>
                      <h3 className="font-heading font-black text-sm text-slate-900 leading-snug">
                        {stepItem.title}
                      </h3>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-600 font-normal leading-relaxed">
                      {stepItem.desc}
                    </p>

                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>

      </div>
    </section>
  );
}
