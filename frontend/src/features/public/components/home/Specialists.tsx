import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Award, ChevronRight, User } from 'lucide-react';
import { motion } from 'framer-motion';
import ScrollReveal from '../shared/ScrollReveal';
import { getPublicSpecialists } from '../../api/public.api';

interface Specialist {
  id: number;
  ho_ten: string;
  vai_tro: string;
  anh_dai_dien: string | null;
  so_nam_kinh_nghiem: number | null;
}

export default function Specialists() {
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSpecialists() {
      try {
        const response = await getPublicSpecialists();
        setSpecialists(response.data.slice(0, 3));
      } catch (err) {
        console.error('Lỗi khi lấy danh sách chuyên gia:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSpecialists();
  }, []);

  const getRating = (id: number) => {
    const seed = (id * 7) % 5;
    if (seed === 0) return "5.0 (85+ Đánh giá)";
    if (seed === 1) return "4.9 (120+ Đánh giá)";
    if (seed === 2) return "4.8 (95+ Đánh giá)";
    return "4.9 (110+ Đánh giá)";
  };

  if (loading || specialists.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="bg-[#0D9488]/10 text-[#0D9488] border border-[#0D9488]/20 font-semibold tracking-wider text-[10px] px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 mb-2 shadow-2xs">
              <Award size={12} /> Đội ngũ y tế uy tín
            </span>
            <h3 className="font-heading font-bold text-2xl md:text-3xl text-slate-800 mb-2 tracking-normal">
              Hội Đồng Chuyên Gia Hàng Đầu
            </h3>
            <p className="text-slate-500 font-normal text-xs md:text-sm leading-relaxed">
              Các Bác sĩ chuyên khoa và Kỹ thuật viên trị liệu nhiều năm kinh nghiệm, luôn tận tâm đồng hành trong từng ca phục hồi.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {specialists.map((specialist, idx) => {
            const isDoctor = specialist.vai_tro.toLowerCase().includes('bác sĩ') || specialist.vai_tro.toLowerCase().includes('doctor');
            return (
              <ScrollReveal key={specialist.id} delay={idx * 100}>
                <motion.div 
                  whileHover={{ y: -6, boxShadow: "0 20px 40px -12px rgba(15, 23, 42, 0.06)" }}
                  className="bg-white rounded-3xl p-6 shadow-2xs border border-slate-200/80 transition-all duration-300 flex flex-col justify-between h-full hover:border-teal-500/40 group"
                >
                  <div>
                    <div className="relative mb-5 rounded-2xl overflow-hidden aspect-[4/3] bg-slate-100 border border-slate-200/60">
                      {specialist.anh_dai_dien ? (
                        <img 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          src={specialist.anh_dai_dien} 
                          alt={specialist.ho_ten}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                          <User size={48} strokeWidth={1.5} />
                        </div>
                      )}
                      <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md text-white px-3 py-1 rounded-xl text-[9.5px] font-semibold flex items-center gap-1 shadow-md border border-white/10">
                        <Star size={11} className="fill-amber-400 text-amber-400" />
                        <span>{getRating(specialist.id)}</span>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold tracking-wider block mb-1 ${
                      isDoctor ? 'text-[#0D9488]' : 'text-amber-600'
                    }`}>
                      {specialist.vai_tro} • {specialist.so_nam_kinh_nghiem ? `${specialist.so_nam_kinh_nghiem} năm kinh nghiệm` : 'Chuyên gia y tế'}
                    </span>

                    <h4 className="font-heading font-bold text-base md:text-lg text-slate-800 mb-2 leading-snug">
                      {specialist.ho_ten}
                    </h4>
                    
                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {isDoctor ? (
                        <>
                          <span className="px-2.5 py-0.5 bg-teal-50 text-[#0D9488] font-semibold text-[9.5px] rounded-md border border-teal-500/15">#Cột_sống</span>
                          <span className="px-2.5 py-0.5 bg-teal-50 text-[#0D9488] font-semibold text-[9.5px] rounded-md border border-teal-500/15">#Cơ_xương_khớp</span>
                          <span className="px-2.5 py-0.5 bg-teal-50 text-[#0D9488] font-semibold text-[9.5px] rounded-md border border-teal-500/15">#Lượng_giá</span>
                        </>
                      ) : (
                        <>
                          <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 font-semibold text-[9.5px] rounded-md border border-amber-500/15">#Trị_liệu_tay</span>
                          <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 font-semibold text-[9.5px] rounded-md border border-amber-500/15">#Giải_cơ_sâu</span>
                          <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 font-semibold text-[9.5px] rounded-md border border-amber-500/15">#Vật_lý_trị_liệu</span>
                        </>
                      )}
                    </div>
                  </div>

                  <Link 
                    to="/booking" 
                    state={{ 
                      selectedDoctorId: specialist.id,
                      isKtv: !isDoctor
                    }}
                    className="w-full text-center py-3 bg-[#0D9488] hover:bg-[#0B7A70] text-white font-bold rounded-xl transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <span>Đặt lịch khám với chuyên gia</span>
                    <ChevronRight size={13} />
                  </Link>
                </motion.div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
