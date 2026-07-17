import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Clock, Phone, Loader2, Info, TrendingUp, Activity, ShieldCheck } from 'lucide-react';
import { getPublicPackages, getPublicCategories, getPublicSpecialists } from '../api/public.api';
import { resolveImageUrl } from '../../../utils/imageUrl';
import toast from 'react-hot-toast';

interface Package {
  id: string;
  ten_goi: string;
  loai_goi: string;
  tong_so_buoi: number;
  thoi_luong_phut: number;
  don_gia: number | string;
  don_gia_theo_buoi: number | string;
  quy_trinh?: string;
  muc_tieu?: string;
  anh_goi?: string;
  anh_gallery?: string[];
  mo_ta?: string;
  danh_muc_goi_id?: string;
  danh_muc_id?: string;
}

interface Category {
  id: string;
  ten_danh_muc: string;
}

const getPrescribedTech = (name: string) => {
  const lowercaseName = name.toLowerCase();
  if (lowercaseName.includes('xung kích') || lowercaseName.includes('shockwave')) {
    return {
      name: 'Máy sóng xung kích Shockwave Master (BTL - Vương Quốc Anh)',
      desc: 'Tạo sóng xung kích cường độ cao tác động vào mô xơ hóa sâu, kích thích sinh học tái tạo mô cơ xương khớp chấn thương.',
      specs: ['Năng lượng: Lên tới 5 Bar', 'Tần số xung: 1 - 22 Hz', 'Công nghệ nén khí nén piston điện']
    };
  }
  if (lowercaseName.includes('laser')) {
    return {
      name: 'Hệ thống máy Laser trị liệu cường độ cao 30W (Ý)',
      desc: 'Sử dụng chùm ánh sáng đơn sắc năng lượng cao tăng hoạt hóa ti thể tế bào, giải phóng chèn ép dây thần kinh tức thì.',
      specs: ['Công suất phát: 30W siêu xung', '3 bước sóng đồng thời: 810/980/1064nm', 'Độ xuyên thấu mô: 8 - 10 cm']
    };
  }
  if (lowercaseName.includes('điện xung') || lowercaseName.includes('ems')) {
    return {
      name: 'Thiết bị Điện xung trị liệu trung tần & giao thoa',
      desc: 'Dòng điện trị liệu tác động trực tiếp lên hệ cơ thần kinh, nới lỏng cơ co cứng cục bộ và cắt đứt luồng dẫn truyền đau.',
      specs: ['Hơn 40 dòng điện trị liệu tích hợp', 'Điều khiển qua màn hình cảm ứng', 'Tự động kiểm soát dòng an toàn']
    };
  }
  return {
    name: 'Hệ thống thiết bị lượng giá & vận động cơ học',
    desc: 'Bao gồm máy nén ép khí áp lực hơi, máy kéo giãn cột sống tự động kết hợp các dụng cụ tập vận động chức năng chuyên khoa.',
    specs: ['Chuẩn y tế phục hồi chuyên sâu', 'Kiểm soát lực căng bằng phản hồi sinh học', 'An toàn tuyệt đối cho người cao tuổi']
  };
};

export default function PackageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [pkg, setPkg] = useState<Package | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [specialists, setSpecialists] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [resPkgs, resCats, resSpecs] = await Promise.all([
          getPublicPackages(),
          getPublicCategories(),
          getPublicSpecialists()
        ]);

        const fetchedPackages: Package[] = resPkgs.data || [];
        const fetchedCategories: Category[] = resCats.data || [];
        setCategories(fetchedCategories);
        setSpecialists(resSpecs.data || []);

        const foundPkg = fetchedPackages.find(p => p.id.toString() === id?.toString());
        if (foundPkg) {
          setPkg(foundPkg);
          setSelectedImage(foundPkg.anh_goi || '');
        } else {
          setPkg(null);
        }
      } catch (e) {
        toast.error('Lỗi khi tải thông tin gói liệu trình.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  useEffect(() => {
    if (pkg) {
      document.title = `${pkg.ten_goi} - Liệu trình chuyên sâu | RehabFlow`;
    }
  }, [pkg]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center pt-24">
        <Loader2 className="animate-spin w-10 h-10 text-primary mb-3" />
        <p className="font-bold text-slate-400 text-sm">Đang tải thông tin liệu trình...</p>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center pt-24 text-center px-4">
        <div className="size-16 rounded-2xl bg-teal-50 flex items-center justify-center text-[#2EC4B6] border border-teal-100 mb-4">
          <Info size={30} />
        </div>
        <h2 className="text-[#0B1222] font-bold text-lg">Không tìm thấy chi tiết liệu trình</h2>
        <p className="text-slate-400 text-xs mt-1 max-w-sm">Liệu trình này không tồn tại hoặc đã ngừng cung cấp.</p>
        <Link to="/services" className="mt-6 px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-[#25A89C]">
          Quay lại danh mục
        </Link>
      </div>
    );
  }

  const getCategoryName = (): string => {
    const catId = pkg.danh_muc_goi_id || pkg.danh_muc_id;
    if (!catId) return 'Liệu trình';
    const cat = categories.find(c => c.id.toString() === catId.toString());
    return cat ? cat.ten_danh_muc : 'Liệu trình';
  };

  const formatPrice = (price: number | string | undefined): string => {
    if (price === undefined || price === null) return '';
    const numPrice = typeof price === 'string' ? parseInt(price, 10) : price;
    if (isNaN(numPrice)) return price.toString();
    if (numPrice === 0) return 'Liên hệ';
    return numPrice.toLocaleString('vi-VN') + ' đ';
  };

  const handleBooking = () => {
    navigate('/booking', {
      state: {
        bookingType: 'kham',
        packageId: pkg.id
      }
    });
  };

  const quyTrinhSteps = pkg.quy_trinh ? pkg.quy_trinh.split('\n').map((s: string) => s.trim()).filter(Boolean) : [];
  const mucTieuPoints = pkg.muc_tieu ? pkg.muc_tieu.split('\n').map((p: string) => p.trim()).filter(Boolean) : [];
  const galleryImages = pkg ? ([pkg.anh_goi, ...(pkg.anh_gallery || [])].filter(Boolean) as string[]) : [];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 pt-28 font-jakarta">
      {/* Visual background gradient */}
      <div className="absolute top-0 left-0 right-0 h-[450px] bg-gradient-to-b from-teal-50/20 via-transparent to-transparent pointer-events-none z-0"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Link to="/" className="hover:text-primary transition-colors">Trang chủ</Link>
            <span>/</span>
            <Link to="/services" className="hover:text-primary transition-colors">Danh mục dịch vụ</Link>
            <span>/</span>
            <span className="text-primary font-extrabold">{pkg.ten_goi}</span>
          </div>

          <Link
            to="/services"
            className="flex items-center gap-1.5 text-xs font-black uppercase text-slate-500 hover:text-slate-800 tracking-wider transition-colors bg-white border border-slate-200/60 px-4.5 py-2.5 rounded-xl shadow-xs"
          >
            ← Danh mục dịch vụ
          </Link>
        </div>

        {/* Unified Service Detail Card */}
        <div className="bg-white rounded-[24px] border border-slate-150 p-6 md:p-10 mb-12 shadow-[0_8px_30px_rgba(15,23,42,0.015)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative z-10">
            {/* Left Column: Image Showcase & Gallery Thumbnails */}
            <div className="lg:col-span-6 space-y-4">
              <div className="aspect-[4/3] w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-150 relative group">
                <img
                  src={resolveImageUrl(selectedImage || pkg.anh_goi || '/images/packages/wellness_hero.png')}
                  alt={pkg.ten_goi}
                  className="w-full h-full object-cover transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 to-transparent pointer-events-none"></div>
              </div>

              {/* Gallery Thumbnails */}
              {galleryImages.length > 1 && (
                <div className="flex flex-wrap gap-2.5">
                  {galleryImages.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImage(imgUrl)}
                      className={`size-16 rounded-xl overflow-hidden border-2 bg-slate-50 transition-all cursor-pointer ${
                        resolveImageUrl(selectedImage) === resolveImageUrl(imgUrl)
                          ? 'border-[#0D9488] shadow-sm'
                          : 'border-slate-200 hover:border-slate-350'
                      }`}
                    >
                      <img
                        src={resolveImageUrl(imgUrl)}
                        alt={`${pkg.ten_goi} thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Detailed Info Grid */}
            <div className="lg:col-span-6 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="bg-[#14B8A6]/10 text-[#0D9488] border border-primary/20 text-[9px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-inner">
                    {getCategoryName()}
                  </span>
                  <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-xs">
                    <span className="size-1.5 bg-emerald-500 rounded-full"></span>
                    Đạt chuẩn y khoa
                  </div>
                </div>

                <h1 className="text-2xl md:text-3xl font-heading font-black text-slate-900 tracking-tight leading-tight uppercase">
                  {pkg.ten_goi}
                </h1>

                <p className="text-slate-500 text-xs font-semibold leading-relaxed">
                  {pkg.mo_ta || 'Lộ trình phục hồi toàn diện cá nhân hóa theo phác đồ bác sĩ.'}
                </p>

                {/* Benefits (Mục tiêu & Lợi ích) */}
                {mucTieuPoints.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">🎯 Mục tiêu & Lợi ích:</p>
                    <ul className="space-y-1.5 pl-1">
                      {mucTieuPoints.map((point: string, idx: number) => (
                        <li key={idx} className="flex gap-2 items-start text-xs font-semibold text-slate-655 leading-relaxed">
                          <span className="text-[#0D9488] font-bold shrink-0 mt-0.5">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Conditions Treated / Category Pills */}
                <div className="space-y-2 pt-2">
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">🏷️ Chỉ định trị liệu:</p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="bg-slate-100 text-slate-600 text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md border border-slate-200">
                      Liệu trình chuyên sâu
                    </span>
                    <span className="bg-slate-100 text-slate-600 text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md border border-slate-200">
                      Phục hồi chức năng
                    </span>
                    <span className="bg-slate-100 text-slate-600 text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md border border-slate-200">
                      Tối ưu chi phí
                    </span>
                  </div>
                </div>

                {/* Key info / Quy trình trị liệu */}
                {quyTrinhSteps.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">📋 Quy trình các bước:</p>
                    <ul className="space-y-1.5 pl-1">
                      {quyTrinhSteps.map((step: string, idx: number) => (
                        <li key={idx} className="flex gap-2 items-start text-xs font-semibold text-slate-655 leading-relaxed">
                          <span className="size-4.5 rounded-full bg-[#14B8A6]/10 text-[#0D9488] flex items-center justify-center font-black text-[9px] shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Booking section */}
              <div className="pt-6 border-t border-slate-100 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[9px] text-slate-450 font-extrabold uppercase tracking-wider">Đơn giá trọn gói</p>
                    <p className="text-2xl font-black text-slate-900 mt-0.5">{formatPrice(pkg.don_gia)} <span className="text-xs font-bold text-slate-450">/ {pkg.tong_so_buoi} buổi</span></p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-450 font-extrabold uppercase tracking-wider">Thời lượng mỗi buổi</p>
                    <p className="text-sm font-black text-slate-700 mt-0.5 flex items-center gap-1.5"><Clock size={16} className="text-primary" /> {pkg.thoi_luong_phut} phút</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleBooking}
                    className="bg-primary hover:bg-[#25A89C] text-white font-extrabold py-3.5 rounded-xl text-[10px] uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer active:scale-98 shadow-md shadow-[#2EC4B6]/15"
                  >
                    Đăng ký thăm khám ngay <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform duration-300" />
                  </button>
                  <a
                    href="tel:19001234"
                    className="bg-white border border-slate-200 hover:border-primary text-slate-750 hover:text-primary font-extrabold py-3.5 rounded-xl text-[10px] uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <Phone size={12} /> Gọi hotline tư vấn
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recovery Efficacy Stats Section */}
        <div className="bg-white rounded-[24px] border border-slate-150 p-6 md:p-10 mb-12 shadow-[0_8px_30px_rgba(15,23,42,0.015)] space-y-8">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#0D9488] bg-[#14B8A6]/10 px-3 py-1 rounded-full">
              📈 Chỉ số lâm sàng
            </span>
            <h3 className="font-heading font-black text-secondary text-sm md:text-base uppercase tracking-tight">
              Hiệu Quả Phục Hồi Dự Kiến
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-[#0D9488]">
                <TrendingUp size={16} />
                <span className="text-2xl font-black font-heading">92%</span>
              </div>
              <p className="text-xs font-bold text-slate-800">Giảm đau rõ rệt</p>
              <p className="text-[10px] text-slate-450 font-semibold leading-relaxed">
                Bệnh nhân phản hồi mức độ đau giảm đáng kể chỉ sau 3 buổi trị liệu đầu tiên.
              </p>
            </div>

            <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <Activity size={16} />
                <span className="text-2xl font-black font-heading">95%</span>
              </div>
              <p className="text-xs font-bold text-slate-800">Khôi phục vận động</p>
              <p className="text-[10px] text-slate-450 font-semibold leading-relaxed">
                Cải thiện tầm vận động khớp khớp (ROM) tổn thương, giúp bệnh nhân quay lại sinh hoạt bình thường.
              </p>
            </div>

            <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-secondary">
                <ShieldCheck size={16} />
                <span className="text-2xl font-black font-heading">0%</span>
              </div>
              <p className="text-xs font-bold text-slate-800">Rủi ro biến chứng</p>
              <p className="text-[10px] text-slate-450 font-semibold leading-relaxed">
                Phương pháp vật lý trị liệu không xâm lấn, không dùng thuốc, an toàn tuyệt đối với mọi cơ địa.
              </p>
            </div>
          </div>
        </div>

        {/* Prescribed Technology Spotlight */}
        {(() => {
          const tech = getPrescribedTech(pkg.ten_goi);
          return (
            <div className="bg-white rounded-[24px] border border-slate-150 p-6 md:p-10 mb-12 shadow-[0_8px_30px_rgba(15,23,42,0.015)] grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-7 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#0D9488] bg-[#14B8A6]/10 px-3 py-1 rounded-full">
                    ⚡ CÔNG NGHỆ CHỈ ĐỊNH
                  </span>
                  <h3 className="font-heading font-black text-secondary text-sm md:text-base uppercase tracking-tight">
                    Thiết Bị Trị Liệu Chính Quy
                  </h3>
                </div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-snug">
                  {tech.name}
                </h4>
                <p className="text-slate-500 text-[11px] font-semibold leading-relaxed">
                  {tech.desc}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {tech.specs.map((spec, i) => (
                    <div key={i} className="flex items-center gap-2 text-[10px] text-slate-655 font-bold">
                      <span className="size-1.5 bg-[#0D9488] rounded-full shrink-0" />
                      <span>{spec}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="md:col-span-5 bg-slate-50 border border-slate-150 rounded-[20px] p-6 text-center space-y-4">
                <span className="text-4xl block">🔬</span>
                <p className="text-xs font-black text-slate-900 uppercase tracking-tight">FDA & CE APPROVED</p>
                <p className="text-[10px] text-slate-450 font-semibold leading-relaxed">
                  Thiết bị được chứng nhận an toàn bởi Cục quản lý Thực phẩm & Dược phẩm Hoa Kỳ (FDA) và đạt chứng chỉ Châu Âu (CE).
                </p>
              </div>
            </div>
          );
        })()}

        {/* Lead Specialists Section */}
        {specialists.length > 0 && (
          <div className="bg-white rounded-[24px] border border-slate-150 p-6 md:p-10 mb-12 shadow-[0_8px_30px_rgba(15,23,42,0.015)] space-y-8">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#0D9488] bg-[#14B8A6]/10 px-3 py-1 rounded-full">
                👨‍⚕️ Hội đồng chuyên môn
              </span>
              <h3 className="font-heading font-black text-secondary text-sm md:text-base uppercase tracking-tight">
                Chuyên Gia Phụ Trách Trị Liệu
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {specialists.slice(0, 3).map((spec) => (
                <div key={spec.id} className="bg-slate-50/50 border border-slate-150 rounded-2xl p-5 hover:border-[#14B8A6]/40 transition-all duration-300 flex flex-col justify-between h-full">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="size-12 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-150">
                        <img
                          src={spec.avatar_url || spec.anh_dai_dien || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(spec.ho_ten)}`}
                          alt={spec.ho_ten}
                          className="size-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-heading font-black text-xs text-slate-900 uppercase tracking-tight">{spec.ho_ten}</h4>
                        <p className="text-[9px] text-[#0D9488] font-black uppercase tracking-widest mt-0.5">
                          {spec.vai_tro_id === 3 ? 'Bác sĩ chuyên khoa' : 'Kỹ thuật viên phục hồi'}
                        </p>
                      </div>
                    </div>
                    {spec.ho_so_chuyen_gia?.so_nam_kinh_nghiem && (
                      <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">
                        ⏳ Kinh nghiệm: {spec.ho_so_chuyen_gia.so_nam_kinh_nghiem} năm lâm sàng
                      </p>
                    )}
                    {spec.ho_so_chuyen_gia?.the_manh && spec.ho_so_chuyen_gia.the_manh.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {spec.ho_so_chuyen_gia.the_manh.slice(0, 2).map((tm: string, i: number) => (
                          <span key={i} className="bg-slate-200/50 border border-slate-250 text-slate-600 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                            {tm}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/specialists/${spec.id}`)}
                    className="w-full mt-4 bg-white border border-slate-200 hover:border-[#0d9488] text-slate-655 hover:text-[#0d9488] text-[9px] font-extrabold uppercase tracking-widest py-2.5 rounded-xl transition-all text-center cursor-pointer"
                  >
                    Xem thông tin chi tiết
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
