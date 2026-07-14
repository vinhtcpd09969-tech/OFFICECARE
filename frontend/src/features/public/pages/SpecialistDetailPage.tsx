import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Phone, Award, Calendar, Star, CheckCircle2, ShieldCheck, Newspaper, User } from 'lucide-react';
import { getPublicSpecialistById, getPublicSpecialists, getPublicArticles } from '../api/public.api';
import LoadingScreen from '../../../components/LoadingScreen';
import ScrollReveal from '../components/shared/ScrollReveal';
import { resolveImageUrl } from '../../../utils/imageUrl';

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
  the_manh: string[] | null;
  trung_binh_sao?: number | string;
  tong_danh_gia?: number;
}

interface ArticleSummary {
  id: string;
  slug: string;
  tieu_de: string;
  tom_tat: string;
  anh_bia: string | null;
  ngay_dang: string | null;
}

const isDoctorRole = (vaiTro: string) =>
  vaiTro.toLowerCase().includes('bác sĩ') || vaiTro.toLowerCase().includes('doctor');

export default function SpecialistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [specialist, setSpecialist] = useState<Specialist | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCert, setActiveCert] = useState<string | null>(null);
  const [otherSpecialists, setOtherSpecialists] = useState<Specialist[]>([]);
  const [latestArticles, setLatestArticles] = useState<ArticleSummary[]>([]);

  useEffect(() => {
    async function fetchDetails() {
      try {
        if (id) {
          const response = await getPublicSpecialistById(id);
          setSpecialist(response.data);
        }
      } catch (err) {
        console.error('Lỗi khi lấy chi tiết chuyên gia:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [id]);

  useEffect(() => {
    async function fetchExtras() {
      try {
        const [specRes, articleRes] = await Promise.all([
          getPublicSpecialists(),
          getPublicArticles(),
        ]);
        setOtherSpecialists((specRes.data || []).filter((s: Specialist) => s.id.toString() !== id?.toString()).slice(0, 4));
        setLatestArticles((articleRes.data || []).slice(0, 3));
      } catch (err) {
        console.error('Lỗi khi lấy dữ liệu liên quan:', err);
      }
    }
    fetchExtras();
  }, [id]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!specialist) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center font-jakarta bg-slate-50">
        <p className="text-slate-500 font-extrabold text-lg mb-4">Không tìm thấy chuyên gia y khoa.</p>
        <Link to="/specialists" className="bg-[#14B8A6] text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider">
          Trở lại danh sách
        </Link>
      </div>
    );
  }

  const isDoctor = isDoctorRole(specialist.vai_tro);

  // Định dạng chuẩn: chuỗi JSON { text: string, images: string[] } (đã chuẩn hóa toàn bộ dữ liệu DB).
  // Vẫn giữ try/catch phòng hờ dữ liệu chỉnh sửa tay không đúng định dạng.
  let certText = '';
  let certificates: string[] = [];

  if (specialist.bang_cap_chung_chi) {
    try {
      const parsed = JSON.parse(specialist.bang_cap_chung_chi);
      certText = parsed.text || '';
      certificates = Array.isArray(parsed.images) ? parsed.images : [];
    } catch {
      certText = specialist.bang_cap_chung_chi;
    }
  }

  const certItems = certText.split('\n').map(s => s.trim()).filter(Boolean);
  const specializations = specialist.the_manh && specialist.the_manh.length > 0 ? specialist.the_manh : [];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 pt-28 font-jakarta">
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        {/* Back Link */}
        <Link
          to="/specialists"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 text-xs font-black uppercase tracking-wider mb-8 transition-colors"
        >
          <ArrowLeft size={16} /> Quay lại danh sách chuyên gia
        </Link>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Portrait, Stats & Quick Actions */}
          <div className="lg:col-span-5 space-y-6">

            {/* Portrait Card */}
            <div className="bg-white rounded-[32px] p-5 border border-slate-100 shadow-[0_15px_40px_rgba(15,23,42,0.015)]">
              <div className="aspect-[4/5] w-full rounded-[24px] overflow-hidden bg-slate-100 relative mb-6">
                {specialist.anh_dai_dien ? (
                  <img
                    src={specialist.anh_dai_dien}
                    alt={specialist.ho_ten}
                    className="w-full h-full object-cover object-center"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                    <User size={64} strokeWidth={1.5} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent"></div>
              </div>

              <div className="space-y-4">
                <div>
                  <span className={`text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full border inline-block mb-2.5 ${
                    isDoctor
                      ? 'bg-[#14B8A6]/10 text-[#0D9488] border-teal-200'
                      : 'bg-[#FF9F1C]/10 text-[#D97706] border-amber-200'
                  }`}>
                    {specialist.vai_tro}
                  </span>
                  <h1 className="font-heading font-black text-2xl md:text-3xl text-slate-900 leading-tight">
                    {specialist.ho_ten}
                  </h1>
                </div>

                {/* Stats: Kinh nghiệm + Đánh giá */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <Award size={18} className="text-[#14B8A6] shrink-0" />
                    <span>{specialist.so_nam_kinh_nghiem || 1} năm kinh nghiệm</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <Star size={18} className="fill-amber-400 text-amber-400 shrink-0" />
                    <span>{Number(specialist.trung_binh_sao || 5).toFixed(1)} ({specialist.tong_danh_gia || 0} đánh giá)</span>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 pt-2 text-xs font-semibold text-slate-500">
                  <div className="flex items-center gap-2.5">
                    <Mail size={15} className="text-slate-400" />
                    <span>{specialist.email}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Phone size={15} className="text-slate-400" />
                    <span>{specialist.so_dien_thoai || '090 123 4567'}</span>
                  </div>
                </div>

                {/* Quick Action Row */}
                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  <a
                    href={`tel:${specialist.so_dien_thoai || '19001234'}`}
                    className="border border-slate-200 hover:border-[#14B8A6] text-slate-700 hover:text-[#0D9488] text-center font-bold py-3 rounded-xl text-[10px] uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5"
                  >
                    <Phone size={12} /> Gọi tư vấn
                  </a>
                  <Link
                    to="/booking"
                    state={{ selectedDoctorId: specialist.id, isKtv: !isDoctor }}
                    className="bg-[#2EC4B6] hover:bg-[#25A89C] text-white text-center font-black py-3 rounded-xl text-[10px] uppercase tracking-wider transition-all duration-300 shadow-sm shadow-[#2EC4B6]/20 flex items-center justify-center gap-1.5"
                  >
                    <Calendar size={12} /> Đặt lịch
                  </Link>
                </div>
              </div>
            </div>

            {/* Quick Booking Widget */}
            <div className="bg-gradient-to-br from-[#0D9488] to-[#14B8A6] rounded-[32px] p-8 text-white shadow-xl shadow-teal-500/10 hover:shadow-[0_20px_50px_rgba(20,184,166,0.25)] transition-all">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-teal-100 mb-1">
                    🗓️ Đặt Lịch Trực Tiếp
                  </p>
                  <h3 className="text-xl md:text-2xl font-black font-heading leading-tight">
                    Đặt Lịch Hẹn Ngay Với {specialist.ho_ten}
                  </h3>
                </div>
                <Calendar size={32} className="text-teal-200 shrink-0" />
              </div>

              <p className="text-teal-50 text-xs font-semibold leading-relaxed mb-6">
                Chọn bác sĩ/KTV trị liệu trực tiếp giúp tối ưu hóa phác đồ điều trị và đẩy nhanh tốc độ phục hồi cơ xương khớp của bạn.
              </p>

              <Link
                to="/booking"
                state={{ selectedDoctorId: specialist.id, isKtv: !isDoctor }}
                className="w-full bg-white hover:bg-slate-50 text-[#0D9488] text-center font-extrabold py-4 rounded-2xl text-xs uppercase tracking-widest transition-all duration-300 block shadow-md shadow-slate-900/10 cursor-pointer active:scale-99"
              >
                Đặt Lịch Khám / Trị Liệu Ngay
              </Link>
            </div>
          </div>

          {/* Right Column: Bio & Specializations/Certifications */}
          <div className="lg:col-span-7 space-y-6">

            {/* Bio */}
            <div className="bg-white rounded-[32px] p-6 md:p-8 border border-slate-100 shadow-[0_15px_40px_rgba(15,23,42,0.015)]">
              <h2 className="text-sm font-black uppercase tracking-widest text-[#14B8A6] mb-4">
                🔬 Hồ Sơ Chuyên Môn
              </h2>
              <p className="text-slate-700 text-sm md:text-base font-semibold leading-relaxed whitespace-pre-line">
                {specialist.mo_ta || 'Thông tin chi tiết đang được cập nhật...'}
              </p>
            </div>

            {/* Specializations & Certifications - 2 column */}
            <div className="bg-white rounded-[32px] border border-slate-100/80 shadow-[0_15px_40px_rgba(15,23,42,0.015)] p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-100">

                {/* Specializations */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#0D9488] bg-[#14B8A6]/10 px-3 py-1 rounded-full">
                      🛡 Specializations
                    </span>
                  </div>
                  {specializations.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {specializations.map((tag, idx) => (
                        <span key={idx} className="bg-[#14B8A6]/5 text-[#0D9488] border border-[#14B8A6]/10 px-3.5 py-2 rounded-xl text-xs font-bold">
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-xs font-semibold">Chưa cập nhật thế mạnh chuyên sâu.</p>
                  )}
                </div>

                {/* Certifications */}
                <div className="pt-6 md:pt-0 md:pl-8 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-500/10 px-3 py-1 rounded-full">
                      🩺 Certifications
                    </span>
                  </div>
                  {certItems.length > 0 ? (
                    <div className="space-y-2.5">
                      {certItems.map((item, idx) => (
                        <div key={idx} className="flex gap-2.5 items-start">
                          <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                          <p className="text-slate-600 text-xs font-semibold leading-relaxed">{item}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-xs font-semibold">Chưa cập nhật bằng cấp chứng chỉ.</p>
                  )}
                </div>
              </div>

              {/* Certificate Images (secondary) */}
              {certificates.length > 0 && (
                <div className="border-t border-slate-100 mt-8 pt-6">
                  <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-4">
                    📋 Hình ảnh bằng cấp
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {certificates.map((certPath, idx) => (
                      <div
                        key={idx}
                        onClick={() => setActiveCert(resolveImageUrl(certPath))}
                        className="aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 bg-slate-50 hover:border-[#14B8A6] cursor-pointer group relative shadow-xs"
                      >
                        <img
                          src={resolveImageUrl(certPath)}
                          alt={`Bằng cấp chứng chỉ ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/20 flex items-center justify-center transition-all">
                          <span className="opacity-0 group-hover:opacity-100 bg-white/95 backdrop-blur-md px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider text-[#0D9488] shadow-md transition-all">
                            🔍 Phóng to
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chuyên gia nổi bật */}
        {otherSpecialists.length > 0 && (
          <ScrollReveal>
            <div className="mt-16">
              <div className="flex items-center gap-2 mb-6">
                <ShieldCheck size={18} className="text-[#0D9488]" />
                <h2 className="font-heading font-black text-lg md:text-xl text-slate-900">Chuyên Gia Nổi Bật Khác</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {otherSpecialists.map((spec) => {
                  const specIsDoctor = isDoctorRole(spec.vai_tro);
                  return (
                    <motion.div
                      key={spec.id}
                      whileHover={{ y: -5 }}
                      className="bg-white rounded-[28px] border border-slate-100 p-4 shadow-sm transition-all duration-300"
                    >
                      <div className="aspect-square w-full rounded-2xl overflow-hidden border-2 border-[#14B8A6]/15 bg-slate-100 mb-3">
                        {spec.anh_dai_dien ? (
                          <img
                            src={spec.anh_dai_dien}
                            alt={spec.ho_ten}
                            className="w-full h-full object-cover object-center"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                            <User size={32} strokeWidth={1.5} />
                          </div>
                        )}
                      </div>
                      <span className={`text-[8px] font-black uppercase tracking-widest ${specIsDoctor ? 'text-[#0D9488]' : 'text-[#D97706]'}`}>
                        {spec.vai_tro}
                      </span>
                      <h3 className="font-heading font-black text-sm text-slate-900 leading-tight mb-3">{spec.ho_ten}</h3>
                      <Link
                        to={`/specialists/${spec.id}`}
                        className="block text-center border border-slate-200 hover:border-[#14B8A6] text-slate-700 hover:text-[#0D9488] font-bold py-2 rounded-xl text-[9px] uppercase tracking-wider transition-all duration-300"
                      >
                        Xem hồ sơ
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Nghiên cứu & Bài viết mới */}
        {latestArticles.length > 0 && (
          <ScrollReveal>
            <div className="mt-16">
              <div className="flex items-center gap-2 mb-6">
                <Newspaper size={18} className="text-[#0D9488]" />
                <h2 className="font-heading font-black text-lg md:text-xl text-slate-900">Nghiên Cứu & Bài Viết Mới</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {latestArticles.map((article) => (
                  <Link
                    key={article.id}
                    to={`/tin-tuc/${article.slug}`}
                    className="group bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="aspect-[16/9] bg-slate-100 overflow-hidden">
                      {article.anh_bia ? (
                        <img src={resolveImageUrl(article.anh_bia)} alt={article.tieu_de} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs font-bold">OfficeCare</div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-heading font-black text-xs text-slate-900 line-clamp-2 group-hover:text-[#0D9488] transition-colors">
                        {article.tieu_de}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </ScrollReveal>
        )}
      </div>

      {/* Lightbox Certificate Modal */}
      {activeCert && (
        <div
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setActiveCert(null)}
        >
          <div className="max-w-4xl max-h-[85vh] relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl flex items-center justify-center">
            <img
              src={activeCert}
              alt="Bằng cấp phóng to"
              className="max-w-full max-h-[80vh] object-contain"
            />
            <button
              onClick={() => setActiveCert(null)}
              className="absolute top-4 right-4 bg-slate-950/60 hover:bg-slate-950 text-white rounded-full p-2 border border-slate-800 hover:scale-105 transition-all text-xs font-black uppercase"
            >
              Đóng ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
