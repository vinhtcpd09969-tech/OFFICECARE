import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Briefcase, User, Search, X } from 'lucide-react';
import { getPublicSpecialists } from '../api/public.api';
import LoadingScreen from '../../../components/LoadingScreen';
import ScrollReveal from '../components/effects/ScrollReveal';

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

  const [searchQuery, setSearchQuery] = useState('');

  if (loading) {
    return <LoadingScreen />;
  }

  const filteredSpecialists = specialists.filter(s => {
    if (filterRole === 'DOCTOR' && !isDoctorRole(s.vai_tro)) return false;
    if (filterRole === 'TECH' && isDoctorRole(s.vai_tro)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = s.ho_ten.toLowerCase().includes(q);
      const matchDegree = s.bang_cap_chung_chi && s.bang_cap_chung_chi.toLowerCase().includes(q);
      const matchDesc = s.mo_ta && s.mo_ta.toLowerCase().includes(q);
      return matchName || matchDegree || matchDesc;
    }
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
    <div className="min-h-screen bg-slate-50/50 pb-20 pt-6 font-jakarta">
      <div className="max-w-7xl mx-auto px-6">

        {/* Centered Hero Header */}
        <div className="mb-10 max-w-3xl mx-auto text-center space-y-2">
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl md:text-[32px] text-slate-900 tracking-tight leading-snug">
            Đồng Hành Cùng <span className="text-[#0D9488]">Chuyên Gia Hàng Đầu</span>
          </h1>
          <p className="text-slate-600 font-normal text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto">
            Hội tụ các Bác sĩ chuyên khoa Phục hồi chức năng đầu ngành cùng đội ngũ Kỹ thuật viên trị liệu dày dặn kinh nghiệm, tận tâm và chuyên nghiệp.
          </p>
        </div>

        {/* Search & Segmented Filter Control Bar */}
        <div className="bg-white rounded-[28px] border border-slate-200/80 p-4 md:p-5 mb-12 shadow-[0_10px_35px_rgba(15,23,42,0.03)] space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Realtime Search Input */}
            <div className="relative w-full lg:w-80 shrink-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Tìm tên bác sĩ, chuyên môn..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#0D9488] focus:bg-white rounded-2xl text-xs text-slate-800 font-semibold placeholder-slate-400 outline-none transition-all duration-200"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Segmented Filter Pills */}
            <div className="w-full lg:w-auto bg-slate-100/90 p-1.5 rounded-2xl flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {PILLS.map(pill => {
                const isActive = filterRole === pill.key;
                return (
                  <button
                    key={pill.key}
                    type="button"
                    onClick={() => setFilterRole(pill.key)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-[#0D9488] text-white shadow-md shadow-teal-500/20 font-extrabold scale-[1.02]'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                    }`}
                  >
                    {pill.label}
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
                    }`}>{pill.count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3-Column Grid of Balanced Portrait Cards */}
        {filteredSpecialists.length === 0 ? (
          <div className="text-center py-20 text-slate-400 font-semibold text-sm">
            Không có chuyên gia nào thuộc danh mục này.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {filteredSpecialists.map((spec, idx) => {
              const isDoctor = isDoctorRole(spec.vai_tro);
              const excerpt = spec.mo_ta || 'Thông tin chi tiết đang được cập nhật...';
              return (
                <ScrollReveal key={spec.id} delay={(idx % 3) * 80}>
                  <motion.div
                    whileHover={{ y: -6, boxShadow: '0 20px 45px -15px rgba(13,148,136,0.12)' }}
                    className="bg-white rounded-[28px] border border-slate-200/80 p-5 md:p-6 shadow-sm hover:border-[#0D9488]/40 transition-all duration-300 flex flex-col h-full"
                  >
                    {/* Balanced Framed Portrait Aspect Ratio (4/3) */}
                    <div className="aspect-[4/3] w-full rounded-2xl overflow-hidden border border-slate-200/70 bg-slate-100 mb-4 shrink-0 relative group">
                      {spec.anh_dai_dien ? (
                        <img
                          src={spec.anh_dai_dien}
                          alt={spec.ho_ten}
                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                          <User size={48} strokeWidth={1.5} />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col text-left space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border inline-block ${
                          isDoctor
                            ? 'bg-[#0D9488]/10 text-[#0D9488] border-[#0D9488]/20'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {spec.vai_tro}
                        </span>

                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-150">
                          <Star size={12} className="fill-amber-400 text-amber-400" />
                          <span>{Number(spec.trung_binh_sao || 5).toFixed(1)}</span>
                        </div>
                      </div>

                      <h3 className="font-heading font-extrabold text-base text-slate-900 leading-snug pt-0.5">
                        {spec.ho_ten}
                      </h3>

                      <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
                        <Briefcase size={13} className="text-[#0D9488] shrink-0" />
                        <span>{spec.so_nam_kinh_nghiem || 1} năm kinh nghiệm điều trị</span>
                      </div>

                      <p className="text-xs text-slate-600 font-normal leading-relaxed line-clamp-2 pt-1 flex-1">
                        {excerpt}
                      </p>

                      <div className="grid grid-cols-2 gap-2 pt-3 mt-auto">
                        <Link
                          to={`/specialists/${spec.id}`}
                          className="bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-[#0D9488] text-slate-700 hover:text-[#0D9488] text-center font-bold py-2.5 rounded-xl text-xs transition-all duration-200 flex items-center justify-center gap-1"
                        >
                          <span>Xem hồ sơ</span>
                        </Link>
                        <Link
                          to="/booking"
                          state={{ selectedDoctorId: spec.id, isKtv: !isDoctor }}
                          className="bg-[#0D9488] hover:bg-[#0b7a70] text-white text-center font-extrabold py-2.5 rounded-xl text-xs transition-all duration-200 shadow-sm shadow-teal-500/20 flex items-center justify-center gap-1"
                        >
                          <span>Đặt lịch</span>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                </ScrollReveal>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
