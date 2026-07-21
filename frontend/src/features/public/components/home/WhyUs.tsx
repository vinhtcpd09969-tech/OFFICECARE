import { ShieldCheck, Stethoscope, Zap, HeartPulse } from 'lucide-react';
import ScrollReveal from '../shared/ScrollReveal';

const FEATURES = [
  {
    icon: Stethoscope,
    title: 'Khám 1:1 cùng Bác sĩ CKI',
    desc: 'Lượng giá biên độ khớp và siêu âm chẩn đoán vị trí tổn thương chính xác trước khi lên phác đồ.',
    tag: 'Chuyên môn cao'
  },
  {
    icon: Zap,
    title: 'Công nghệ Y tế FDA Châu Âu',
    desc: 'Sóng xung kích Shockwave & Laser 30W giúp cắt cơn đau cấp tính và phục hồi tái tạo mô xơ.',
    tag: 'Công nghệ 2026'
  },
  {
    icon: ShieldCheck,
    title: 'Không phẫu thuật - Không dùng thuốc',
    desc: 'Phương pháp điều trị cơ học & vật lý trị liệu an toàn tuyệt đối, triệt tiêu tận gốc nguyên nhân.',
    tag: 'An toàn 100%'
  },
  {
    icon: HeartPulse,
    title: 'Phác đồ cá nhân hóa 100%',
    desc: 'Thiết kế riêng theo tính chất công việc văn phòng, ngưỡng chịu đau và thể trạng của từng bệnh nhân.',
    tag: 'Chuẩn y khoa'
  }
];

export default function WhyUs() {
  return (
    <section className="py-16 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="bg-teal-50 text-[#0D9488] border border-teal-500/20 font-bold tracking-wider uppercase text-[10px] px-3.5 py-1.5 rounded-full inline-block mb-2">
              Ưu thế vượt trội
            </span>
            <h2 className="font-heading font-extrabold text-2xl md:text-3xl text-slate-900 tracking-normal">
              Tại Sao Hơn 15.000 Bệnh Nhân Tin Chọn OfficeCare?
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <ScrollReveal key={idx} delay={idx * 80}>
                <div className="bg-slate-50/70 hover:bg-white rounded-2xl p-6 border border-slate-200/70 hover:border-teal-500/40 hover:shadow-lg transition-all duration-300 h-full flex flex-col justify-between text-left group">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="size-11 rounded-xl bg-teal-500/10 group-hover:bg-[#0D9488] text-[#0D9488] group-hover:text-white flex items-center justify-center transition-colors duration-300">
                        <Icon size={20} />
                      </div>
                      <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-200/60">
                        {feat.tag}
                      </span>
                    </div>

                    <h3 className="font-heading font-bold text-sm text-slate-900 leading-snug">
                      {feat.title}
                    </h3>

                    <p className="text-xs text-slate-500 font-normal leading-relaxed">
                      {feat.desc}
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
