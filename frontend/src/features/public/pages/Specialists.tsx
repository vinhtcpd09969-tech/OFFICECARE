import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Star, Briefcase, Phone, Users, User } from 'lucide-react';
import { getPublicSpecialists } from '../api/public.api';
import LoadingScreen from '../../../components/LoadingScreen';
import ScrollReveal from '../components/shared/ScrollReveal';

interface Specialist {
  id: number;
  ho_ten: string;
  email: string;
  so_dien_thoai: string;
  anh_dai_dien: string | null;
  vai_tro: string;
  so_nam_kinh_nghiem: number | null;
  bang_cap_chung_chi: string | null;
  mo_ta: string | null;
  the_manh?: string[] | null;
  trung_binh_sao?: number | string;
  tong_danh_gia?: number;
}

const isDoctorRole = (vaiTro: string) =>
  vaiTro.toLowerCase().includes('bác sĩ') || vaiTro.toLowerCase().includes('doctor');

export default function Specialists() {
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<'ALL' | 'DOCTOR' | 'TECH'>('ALL');

  useEffect(() => {
    async function fetchSpecialists() {
      try {
        const response = await getPublicSpecialists();
        setSpecialists(response.data);
      } catch (err) {
        console.error('Lỗi khi lấy danh sách chuyên gia:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSpecialists();
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  const filteredSpecialists = specialists.filter(s => {
    if (filterRole === 'DOCTOR') return isDoctorRole(s.vai_tro);
    if (filterRole === 'TECH') return !isDoctorRole(s.vai_tro);
    return true;
  });

  const allCount = specialists.length;
  const doctorCount = specialists.filter(s => isDoctorRole(s.vai_tro)).length;
  const techCount = specialists.filter(s => !isDoctorRole(s.vai_tro)).length;

  const PILLS: { key: 'ALL' | 'DOCTOR' | 'TECH'; label: string; count: number }[] = [
    { key: 'ALL', label: 'Tất cả chuyên gia', count: allCount },
    { key: 'DOCTOR', label: 'Bác sĩ chuyên khoa', count: doctorCount },
    { key: 'TECH', label: 'Kỹ thuật viên', count: techCount },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 pt-28 font-jakarta">
      <div className="max-w-7xl mx-auto px-6">

        {/* Centered Hero Header */}
        <div className="mb-10 max-w-3xl mx-auto text-center space-y-2">
          <span className="bg-[#0D9488]/10 text-[#0D9488] border border-[#0D9488]/20 text-[10px] font-semibold tracking-wider px-3.5 py-1.5 rounded-full inline-block shadow-2xs">
            Đội ngũ nhân sự y khoa
          </span>
          <h1 className="font-heading font-bold text-2xl sm:text-3xl md:text-[34px] text-slate-900 tracking-normal leading-snug">
            Đồng Hành Cùng <span className="text-[#0D9488]">Chuyên Gia Hàng Đầu</span>
          </h1>
          <p className="text-slate-600 font-normal text-xs md:text-sm leading-relaxed max-w-2xl mx-auto">
            Hội tụ các Bác sĩ chuyên khoa Phục hồi chức năng đầu ngành cùng đội ngũ Kỹ thuật viên trị liệu dày dặn kinh nghiệm, tận tâm và chuyên nghiệp.
          </p>
        </div>

        {/* Horizontal Pill Filter Row */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-12">
          {PILLS.map(pill => (
            <button
              key={pill.key}
              type="button"
              onClick={() => setFilterRole(pill.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-200 border ${
                filterRole === pill.key
                  ? 'bg-[#0D9488] border-[#0D9488] text-white shadow-sm shadow-teal-500/20'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-[#14B8A6]/40'
              }`}
            >
              {pill.label}
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                filterRole === pill.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}>{pill.count}</span>
            </button>
          ))}
        </div>

        {/* 3-Column Grid of Framed Portrait Cards */}
        {filteredSpecialists.length === 0 ? (
          <div className="text-center py-20 text-slate-400 font-semibold text-sm">
            Không có chuyên gia nào thuộc danh mục này.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredSpecialists.map((spec, idx) => {
              const isDoctor = isDoctorRole(spec.vai_tro);
              const excerpt = spec.mo_ta || 'Thông tin chi tiết đang được cập nhật...';
              return (
                <ScrollReveal key={spec.id} delay={(idx % 3) * 100}>
                  <motion.div
                    whileHover={{ y: -6, boxShadow: '0 20px 45px -15px rgba(15,23,42,0.08)' }}
                    className="bg-white rounded-[40px] border border-slate-100 p-6 shadow-sm transition-all duration-300 flex flex-col h-full"
                  >
                    {/* Framed Portrait */}
                    <div className="aspect-square w-full rounded-[28px] overflow-hidden border-2 border-[#14B8A6]/15 bg-slate-100 mb-5">
                      {spec.anh_dai_dien ? (
                        <img
                          src={spec.anh_dai_dien}
                          alt={spec.ho_ten}
                          className="w-full h-full object-cover object-center"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                          <User size={48} strokeWidth={1.5} />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col text-center">
                      <span className={`text-[9.5px] font-bold tracking-wider mb-1.5 ${
                        isDoctor ? 'text-[#0D9488]' : 'text-[#D97706]'
                      }`}>
                        {spec.vai_tro}
                      </span>
                      <h3 className="font-heading font-bold text-base text-slate-800 leading-tight mb-2">
                        {spec.ho_ten}
                      </h3>

                      <div className="flex items-center justify-center gap-3 text-[10px] font-bold text-slate-500 mb-3">
                        <span className="flex items-center gap-1">
                          <Star size={11} className="fill-amber-400 text-amber-400" />
                          {Number(spec.trung_binh_sao || 5).toFixed(1)} ({spec.tong_danh_gia || 0})
                        </span>
                        <span className="w-px h-3 bg-slate-200"></span>
                        <span className="flex items-center gap-1">
                          <Briefcase size={11} className="text-slate-400" />
                          {spec.so_nam_kinh_nghiem || 1} năm KN
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 font-semibold leading-relaxed line-clamp-2 mb-5 flex-1">
                        {excerpt}
                      </p>

                      <div className="grid grid-cols-2 gap-2.5 mt-auto">
                        <Link
                          to={`/specialists/${spec.id}`}
                          className="border border-slate-200 hover:border-[#14B8A6] text-slate-700 hover:text-[#0D9488] text-center font-bold py-2.5 rounded-xl text-[10px] uppercase tracking-wider transition-all duration-300"
                        >
                          Xem hồ sơ
                        </Link>
                        <Link
                          to="/booking"
                          state={{ selectedDoctorId: spec.id, isKtv: !isDoctor }}
                          className="bg-[#2EC4B6] hover:bg-[#25A89C] text-white text-center font-black py-2.5 rounded-xl text-[10px] uppercase tracking-wider transition-all duration-300 shadow-sm shadow-[#2EC4B6]/20"
                        >
                          Đặt lịch
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                </ScrollReveal>
              );
            })}
          </div>
        )}

        {/* Bottom CTA Band */}
        <ScrollReveal>
          <div className="mt-16 bg-gradient-to-br from-[#0D9488] to-[#14B8A6] rounded-[40px] p-8 md:p-12 text-white shadow-xl shadow-teal-500/10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
              <div className="size-14 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
                <Users size={26} />
              </div>
              <div>
                <h3 className="font-heading font-black text-xl md:text-2xl leading-tight mb-1.5">
                  Bạn chưa chắc chắn nên chọn ai?
                </h3>
                <p className="text-teal-50 text-xs md:text-sm font-semibold max-w-md">
                  Đội ngũ lễ tân của OfficeCare sẽ giúp bạn chọn đúng bác sĩ/kỹ thuật viên phù hợp nhất với tình trạng của bạn.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <a
                href="tel:19001234"
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-extrabold px-6 py-3.5 rounded-full text-xs uppercase tracking-widest transition-all duration-300"
              >
                <Phone size={14} /> Gọi tư vấn
              </a>
              <Link
                to="/booking"
                className="flex items-center gap-2 bg-white hover:bg-slate-50 text-[#0D9488] font-extrabold px-6 py-3.5 rounded-full text-xs uppercase tracking-widest transition-all duration-300 shadow-md"
              >
                Đặt lịch ngay <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </ScrollReveal>

      </div>
    </div>
  );
}
