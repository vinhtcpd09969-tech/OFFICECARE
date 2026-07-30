import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Phone, Award, Calendar, Star, CheckCircle2, ShieldCheck, Newspaper, User, ArrowLeft } from 'lucide-react';
import { getPublicSpecialistById, getPublicSpecialists, getPublicArticles, getPublicSpecialistReviews } from '../api/public.api';
import LoadingScreen from '../../../components/LoadingScreen';
import ScrollReveal from '../components/effects/ScrollReveal';
import { resolveImageUrl } from '../../../utils/imageUrl';
import { censorText } from '../../../utils/profanity';

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
  const navigate = useNavigate();
  const [specialist, setSpecialist] = useState<Specialist | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCert, setActiveCert] = useState<string | null>(null);
  const [otherSpecialists, setOtherSpecialists] = useState<Specialist[]>([]);
  const [latestArticles, setLatestArticles] = useState<ArticleSummary[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when specialist id changes
  useEffect(() => {
    setCurrentPage(1);
  }, [id]);

  const paginatedReviews = useMemo(() => {
    const startIndex = (currentPage - 1) * 5;
    return reviews.slice(startIndex, startIndex + 5);
  }, [reviews, currentPage]);

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
    async function fetchReviews() {
      try {
        if (id) {
          setReviewsLoading(true);
          const response = await getPublicSpecialistReviews(id);
          setReviews(response.data || []);
        }
      } catch (err) {
        console.error('Lỗi khi lấy đánh giá:', err);
      } finally {
        setReviewsLoading(false);
      }
    }
    fetchReviews();
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
        {/* Nút Quay lại trang trước Thông Minh */}
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/specialists'))}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200/90 shadow-sm hover:shadow transition-all duration-300 group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#0D9488] group-hover:-translate-x-1 transition-transform" />
            <span>Quay lại trang trước</span>
          </button>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full hidden sm:inline-block">
            Chuyên gia Phục hồi Chức năng
          </span>
        </div>

        {/* Compact & Unified Hero Header Card */}
        <div className="bg-white rounded-[28px] border border-slate-200/80 shadow-[0_10px_35px_rgba(15,23,42,0.03)] p-6 md:p-7 mb-8 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-72 h-72 bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="flex flex-col md:flex-row gap-6 md:gap-7 items-center md:items-start relative z-10">
            
            {/* Compact Portrait Container */}
            <div className="w-52 h-64 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 relative shadow-2xs">
              {specialist.anh_dai_dien ? (
                <img
                  src={specialist.anh_dai_dien}
                  alt={specialist.ho_ten}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                  <User size={56} strokeWidth={1.5} />
                </div>
              )}
            </div>

            {/* Core Info & Merged Bio/Strengths */}
            <div className="flex-1 space-y-3.5 text-center md:text-left">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <span className={`text-[9.5px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border inline-block ${
                    isDoctor
                      ? 'bg-[#0D9488]/10 text-[#0D9488] border-[#0D9488]/20'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {specialist.vai_tro}
                  </span>

                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-50 px-2.5 py-0.5 rounded-md border border-slate-200">
                    <Star size={12} className="fill-amber-400 text-amber-400" />
                    <span>{Number(specialist.trung_binh_sao || 5).toFixed(1)} ({specialist.tong_danh_gia || 0} đánh giá)</span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-50 px-2.5 py-0.5 rounded-md border border-slate-200">
                    <Award size={12} className="text-[#0D9488]" />
                    <span>{specialist.so_nam_kinh_nghiem || 1} năm kinh nghiệm</span>
                  </div>
                </div>

                <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-slate-900 leading-snug pt-1">
                  {specialist.ho_ten}
                </h1>
              </div>

              {/* Specialty Strengths Tags */}
              {specializations.length > 0 && (
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 pt-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Thế mạnh:</span>
                  {specializations.map((tag, idx) => (
                    <span key={idx} className="bg-[#0D9488]/8 text-[#0D9488] border border-[#0D9488]/15 px-2.5 py-0.5 rounded-md text-[11px] font-bold">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Bio Summary inside Hero */}
              <p className="text-xs text-slate-650 font-normal leading-relaxed whitespace-pre-line line-clamp-3 pt-0.5">
                {specialist.mo_ta || 'Bác sĩ chuyên khoa Phục hồi chức năng &amp; Cơ xương khớp, nhiều năm kinh nghiệm chẩn đoán lâm sàng và thiết kế phác đồ trị liệu bảo tồn cho bệnh nhân văn phòng.'}
              </p>

              {/* Contacts & Compact Action Buttons */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                <div className="flex items-center gap-3 text-xs font-medium text-slate-500 mr-2">
                  <span className="flex items-center gap-1.5"><Mail size={13} className="text-slate-400" /> {specialist.email}</span>
                  <span className="flex items-center gap-1.5"><Phone size={13} className="text-slate-400" /> {specialist.so_dien_thoai || '0901 000 106'}</span>
                </div>

                <a
                  href={`tel:${specialist.so_dien_thoai || '0398655332'}`}
                  className="border border-slate-200 hover:border-[#0D9488] text-slate-700 hover:text-[#0D9488] px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 bg-slate-50"
                >
                  <Phone size={13} />
                  <span>Gọi tư vấn</span>
                </a>
                
                <Link
                  to="/booking"
                  state={{ selectedDoctorId: specialist.id, isKtv: !isDoctor }}
                  className="bg-[#0D9488] hover:bg-[#0b7a70] text-white px-5 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 shadow-sm shadow-teal-500/20 flex items-center gap-1.5"
                >
                  <Calendar size={13} />
                  <span>Đặt lịch hẹn ngay</span>
                </Link>
              </div>
            </div>

          </div>
        </div>

        {/* Streamlined Certifications & Degrees Card */}
        {certItems.length > 0 && (
          <div className="bg-white rounded-[24px] p-5 md:p-6 border border-slate-200/80 shadow-2xs mb-8 space-y-4 text-left">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#0D9488] bg-[#0D9488]/10 px-3 py-1 rounded-full inline-block">
              🩺 Bằng Cấp &amp; Chứng Chỉ Hành Nghề
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {certItems.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-start bg-slate-50 p-3 rounded-xl border border-slate-150">
                  <CheckCircle2 size={16} className="text-[#0D9488] shrink-0 mt-0.5" />
                  <p className="text-slate-700 text-xs font-semibold leading-relaxed">{item}</p>
                </div>
              ))}
            </div>

            {/* Certificate Images Gallery */}
            {certificates.length > 0 && (
              <div className="border-t border-slate-100 pt-4 mt-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                  📋 Hình ảnh chứng nhận thực tế
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {certificates.map((certPath, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActiveCert(resolveImageUrl(certPath))}
                      className="aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 bg-slate-50 hover:border-[#0D9488] cursor-pointer group relative shadow-2xs transition-all duration-200"
                    >
                      <img
                        src={resolveImageUrl(certPath)}
                        alt={`Chứng chỉ ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/20 flex items-center justify-center transition-all">
                        <span className="opacity-0 group-hover:opacity-100 bg-white px-2.5 py-1 rounded-md text-[9px] font-bold text-[#0D9488] shadow-xs">
                          🔍 Xem ảnh
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Static Credibility Banner: Tiêu chuẩn nhân sự y khoa OfficeCare */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 rounded-[28px] p-6 md:p-8 text-white shadow-xl mb-8 border border-slate-800">
          <div className="text-center space-y-1 mb-6 max-w-2xl mx-auto">
            <span className="bg-[#0D9488]/20 text-[#2EC4B6] border border-[#2EC4B6]/20 text-[10px] font-bold tracking-wider px-3 py-1 rounded-full uppercase">
              Tiêu chuẩn nhân sự y khoa OfficeCare
            </span>
            <h3 className="font-heading font-extrabold text-lg md:text-xl text-white">
              Cam Kết Chất Lượng &amp; Năng Lực Trị Liệu 1:1
            </h3>
            <p className="text-slate-400 text-xs font-normal">
              Đảm bảo 100% nhân sự chuyên khoa tuân thủ quy chuẩn y tế nghiêm ngặt, mang đến kết quả phục hồi tối ưu cho bệnh nhân.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-2">
              <div className="size-8 rounded-xl bg-[#0D9488]/20 text-[#2EC4B6] flex items-center justify-center font-bold text-xs">01</div>
              <h4 className="font-bold text-xs md:text-sm text-white">100% Chứng Chỉ Hành Nghề</h4>
              <p className="text-slate-300 text-xs leading-relaxed font-normal">
                Tất cả Bác sĩ CKI và Kỹ thuật viên đều tốt nghiệp chính quy Đại học Y Dược và sở hữu chứng chỉ hành nghề chính thức do Bộ Y Tế cấp.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-2">
              <div className="size-8 rounded-xl bg-[#0D9488]/20 text-[#2EC4B6] flex items-center justify-center font-bold text-xs">02</div>
              <h4 className="font-bold text-xs md:text-sm text-white">Đào Tạo Công Nghệ Châu Âu</h4>
              <p className="text-slate-300 text-xs leading-relaxed font-normal">
                Được tập huấn định kỳ kỹ thuật giải phóng điểm đau IASTM, vận hành máy sóng xung kích Shockwave và Laser cường độ cao 30W.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-2">
              <div className="size-8 rounded-xl bg-[#0D9488]/20 text-[#2EC4B6] flex items-center justify-center font-bold text-xs">03</div>
              <h4 className="font-bold text-xs md:text-sm text-white">Bảo Mật &amp; Tận Tâm 1:1</h4>
              <p className="text-slate-300 text-xs leading-relaxed font-normal">
                Bệnh nhân được 1 Bác sĩ và 1 KTV trực tiếp theo dõi chỉ số phục hồi xuyên suốt phác đồ, bảo mật 100% thông tin bệnh án y khoa.
              </p>
            </div>
          </div>
        </div>

        {/* Full-width Reviews Section */}
        <div className="bg-white rounded-[32px] p-6 md:p-8 border border-slate-100 shadow-[0_15px_40px_rgba(15,23,42,0.015)] space-y-6 mt-8">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#14B8A6] bg-[#14B8A6]/10 px-3 py-1 rounded-full">
              💬 Phản Hồi Từ Bệnh Nhân
            </span>
            <span className="text-xs font-bold text-slate-500">
              {reviews.length} đánh giá
            </span>
          </div>

          {reviewsLoading ? (
            <div className="text-center py-6 text-xs font-bold text-slate-400 animate-pulse">
              Đang tải đánh giá...
            </div>
          ) : reviews.length === 0 ? (
            <p className="text-slate-400 text-xs font-semibold py-4">Chưa có phản hồi nào cho chuyên gia này.</p>
          ) : (
            <div className="space-y-4">
              <div className="space-y-4 divide-y divide-slate-100">
                {paginatedReviews.map((rev) => (
                  <div key={rev.id} className="pt-4 first:pt-0 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="size-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-650 font-black text-xs">
                          {rev.name?.charAt(0) || 'K'}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-800 text-xs">{rev.name}</p>
                          <p className="text-[9px] text-slate-400 font-bold">
                            {new Date(rev.date).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-0.5 text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            size={12} 
                            className={i < rev.rating ? 'fill-amber-400 stroke-none' : 'text-zinc-200 fill-zinc-200 stroke-none'} 
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-slate-655 text-xs font-medium leading-relaxed italic bg-slate-50 p-4 rounded-xl border border-slate-100">
                      "{censorText(rev.comment)}"
                    </p>
                    {rev.reply && (
                      <div className="bg-emerald-50/55 border-l-2 border-[#0D9488] rounded-r-2xl p-4 mt-2 text-xs space-y-1 ml-4">
                        <p className="font-extrabold text-slate-800">
                          Phản hồi từ OfficeCare:
                        </p>
                        <p className="text-slate-600 italic">"{rev.reply}"</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination controls */}
              {(() => {
                const totalPages = Math.ceil(reviews.length / 5);
                if (totalPages <= 1) return null;
                return (
                  <div className="flex items-center justify-center gap-2 pt-6 mt-4 border-t border-slate-100/60">
                    <button
                      type="button"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl border border-slate-200 hover:border-[#0D9488] hover:text-[#0D9488] text-slate-500 disabled:opacity-30 disabled:hover:border-slate-200 disabled:hover:text-slate-500 transition-all cursor-pointer select-none"
                    >
                      Trước
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }).map((_, i) => {
                        const pageNum = i + 1;
                        const isActive = currentPage === pageNum;
                        return (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-7 h-7 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                              isActive
                                ? 'bg-primary text-white shadow-md shadow-teal-500/10 scale-105'
                                : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-600'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl border border-slate-200 hover:border-[#0D9488] hover:text-[#0D9488] text-slate-500 disabled:opacity-30 disabled:hover:border-slate-200 disabled:hover:text-slate-500 transition-all cursor-pointer select-none"
                    >
                      Sau
                    </button>
                  </div>
                );
              })()}
            </div>
          )}
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
