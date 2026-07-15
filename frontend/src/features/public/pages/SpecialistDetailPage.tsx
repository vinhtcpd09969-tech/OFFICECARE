import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Mail, Phone, Award, Calendar, Star, CheckCircle2, ShieldCheck, Newspaper, User } from 'lucide-react';
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

        {/* Split Hero Header Card */}
        <div className="bg-white rounded-[32px] border border-slate-100/80 shadow-[0_15px_40px_rgba(15,23,42,0.015)] p-6 md:p-8 mb-10 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start relative z-10">
            
            {/* Portrait Container */}
            <div className="w-64 h-80 rounded-2xl overflow-hidden bg-slate-100 shrink-0 shadow-sm border border-slate-150 relative">
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
            </div>

            {/* Core Info */}
            <div className="flex-1 space-y-5 text-center md:text-left">
              <div>
                <span className={`text-[9px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full border inline-block mb-3 ${
                  isDoctor
                    ? 'bg-[#14B8A6]/10 text-[#0D9488] border-teal-200'
                    : 'bg-[#FF9F1C]/10 text-[#D97706] border-amber-200'
                }`}>
                  {specialist.vai_tro}
                </span>
                <h1 className="font-heading font-black text-3xl md:text-4xl text-slate-900 leading-tight">
                  {specialist.ho_ten}
                </h1>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100">
                  <Award size={16} className="text-[#14B8A6] shrink-0" />
                  <span>{specialist.so_nam_kinh_nghiem || 1} năm kinh nghiệm</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100">
                  <Star size={16} className="fill-amber-400 text-amber-400 shrink-0" />
                  <span>{Number(specialist.trung_binh_sao || 5).toFixed(1)} ({specialist.tong_danh_gia || 0} đánh giá)</span>
                </div>
              </div>

              {/* Contacts */}
              <div className="space-y-2 text-xs font-semibold text-slate-500 max-w-sm mx-auto md:mx-0">
                <div className="flex items-center justify-center md:justify-start gap-2.5">
                  <Mail size={15} className="text-slate-400" />
                  <span>{specialist.email}</span>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-2.5">
                  <Phone size={15} className="text-slate-400" />
                  <span>{specialist.so_dien_thoai || '090 123 4567'}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                <a
                  href={`tel:${specialist.so_dien_thoai || '19001234'}`}
                  className="border border-slate-200 hover:border-[#14B8A6] text-slate-700 hover:text-[#0D9488] px-6 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 bg-white"
                >
                  <Phone size={14} /> Gọi tư vấn
                </a>
                <Link
                  to="/booking"
                  state={{ selectedDoctorId: specialist.id, isKtv: !isDoctor }}
                  className="bg-[#2EC4B6] hover:bg-[#25A89C] text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-md shadow-[#2EC4B6]/25 flex items-center gap-2"
                >
                  <Calendar size={14} /> Đặt lịch hẹn ngay
                </Link>
              </div>
            </div>

          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Bio & Certifications (col-span 8) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Bio */}
            <div className="bg-white rounded-[32px] p-6 md:p-8 border border-slate-100 shadow-[0_15px_40px_rgba(15,23,42,0.015)]">
              <h2 className="text-sm font-black uppercase tracking-widest text-[#14B8A6] mb-4">
                🔬 Hồ Sơ Chuyên Môn
              </h2>
              <p className="text-slate-700 text-sm md:text-base font-semibold leading-relaxed whitespace-pre-line">
                {specialist.mo_ta || 'Thông tin chi tiết đang được cập nhật...'}
              </p>
            </div>

            {/* Certifications & Degrees Card */}
            <div className="bg-white rounded-[32px] p-6 md:p-8 border border-slate-100 shadow-[0_15px_40px_rgba(15,23,42,0.015)] space-y-6">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-500/10 px-3 py-1 rounded-full">
                  🩺 Bằng Cấp & Chứng Chỉ
                </span>
              </div>
              
              {certItems.length > 0 ? (
                <div className="space-y-3">
                  {certItems.map((item, idx) => (
                    <div key={idx} className="flex gap-2.5 items-start">
                      <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-slate-650 text-xs md:text-sm font-semibold leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-xs font-semibold">Chưa cập nhật bằng cấp chứng chỉ.</p>
              )}

              {/* Certificate Images Gallery */}
              {certificates.length > 0 && (
                <div className="border-t border-slate-100 pt-6 mt-6">
                  <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-4">
                    📋 Hình ảnh chứng nhận thực tế
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {certificates.map((certPath, idx) => (
                      <div
                        key={idx}
                        onClick={() => setActiveCert(resolveImageUrl(certPath))}
                        className="aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 bg-slate-50 hover:border-[#14B8A6] cursor-pointer group relative shadow-xs transition-all duration-300"
                      >
                        <img
                          src={resolveImageUrl(certPath)}
                          alt={`Bằng cấp chứng chỉ ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/25 flex items-center justify-center transition-all">
                          <span className="opacity-0 group-hover:opacity-100 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider text-[#0D9488] shadow-md transition-all">
                            🔍 Xem ảnh lớn
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Specializations & Working Schedule (col-span 4) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Specializations */}
            <div className="bg-white rounded-[32px] p-6 md:p-8 border border-slate-100 shadow-[0_15px_40px_rgba(15,23,42,0.015)] space-y-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#0D9488] bg-[#14B8A6]/10 px-3 py-1 rounded-full inline-block">
                🛡️ Thế mạnh chuyên sâu
              </span>
              {specializations.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-2">
                  {specializations.map((tag, idx) => (
                    <span key={idx} className="bg-[#14B8A6]/5 text-[#0D9488] border border-[#14B8A6]/10 px-3 py-1.5 rounded-xl text-xs font-bold">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-xs font-semibold">Chưa cập nhật thế mạnh chuyên sâu.</p>
              )}
            </div>

            {/* Availability / Working Hours */}
            <div className="bg-white rounded-[32px] p-6 md:p-8 border border-slate-100 shadow-[0_15px_40px_rgba(15,23,42,0.015)] space-y-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-secondary bg-slate-100 px-3 py-1 rounded-full inline-block">
                🕒 Lịch làm việc
              </span>
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-500">Thứ Hai - Thứ Bảy:</span>
                  <span className="text-slate-800 font-extrabold">07:30 - 20:30</span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-500">Chủ Nhật:</span>
                  <span className="text-slate-800 font-extrabold">08:00 - 17:00</span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold border-t border-slate-100 pt-2 mt-2">
                  <span className="text-slate-500">Trạng thái:</span>
                  <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2.5 py-0.5 rounded-md font-bold text-[10px]">Đang mở cửa</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full-width CTA booking banner */}
        <div className="mt-12 bg-gradient-to-br from-[#0D9488] to-[#14B8A6] rounded-[32px] p-10 md:p-14 text-white text-center shadow-xl shadow-teal-500/10 relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/5 rounded-full pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-white/5 rounded-full pointer-events-none"></div>
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-teal-100 bg-white/10 px-4 py-1.5 rounded-full inline-block">
              🗓️ Đăng ký khám chủ động
            </span>
            <h2 className="text-2xl md:text-4xl font-black font-heading leading-tight">
              Đăng ký lịch hẹn trực tiếp với {specialist.ho_ten}
            </h2>
            <p className="text-teal-50 text-xs md:text-sm font-semibold leading-relaxed max-w-lg mx-auto">
              Chỉ mất 1 phút để chọn lịch hẹn phù hợp nhất. Chuyên gia sẽ trực tiếp lượng giá và điều trị theo phác đồ cá nhân hóa tối ưu cho riêng bạn.
            </p>
            <div className="pt-4">
              <Link
                to="/booking"
                state={{ selectedDoctorId: specialist.id, isKtv: !isDoctor }}
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#0D9488] font-black text-xs md:text-sm rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all"
              >
                <Calendar size={16} /> ĐẶT LỊCH HẸN TRỊ LIỆU NGAY <ArrowRight size={16} />
              </Link>
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
