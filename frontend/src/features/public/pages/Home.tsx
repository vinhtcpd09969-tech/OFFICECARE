import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Clock, Sparkles, Stethoscope, HeartPulse, Compass, ShieldAlert, BadgeCheck, ChevronRight } from 'lucide-react';
import LazyImage from '../../../components/LazyImage';
import { useAuthStore } from '../../../stores/authStore';

export default function Home() {
  const { isAuthenticated } = useAuthStore();

  const handleBookingClick = (e: React.MouseEvent) => {
    if (!isAuthenticated()) {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('trigger-global-auth-modal'));
    }
  };

  return (
    <div className="font-body bg-slate-50/50 overflow-hidden">
      
      {/* Hero Section - Light Clinical Canvas with Floating High-End Card */}
      <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-24 overflow-hidden min-h-[90vh] flex items-center bg-gradient-to-b from-slate-50 via-teal-50/20 to-white">
        {/* Subtle grid background pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          {/* Header above the card - clean and premium */}
          <div className="mb-6 animate-slide-up flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-primary font-bold text-xs uppercase tracking-widest flex items-center gap-1.5 mb-1">
                <Sparkles size={12} /> Office Care Premium Rehab Clinic
              </p>
              <h2 className="text-slate-800 font-extrabold text-sm">Hệ thống phục hồi cơ xương khớp đạt chuẩn y khoa 5 sao</h2>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-3.5 py-1.5 rounded-full text-xs font-bold w-fit shadow-xs">
              <span className="relative flex size-1.5">
                <span className="animate-ping absolute inline-flex size-full rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full size-1.5 bg-emerald-500"></span>
              </span>
              Đón tiếp bình thường
            </div>
          </div>

          {/* Main Card - Glassmorphic Premium Clinical Theme */}
          <div className="bg-white/85 backdrop-blur-md rounded-[32px] p-6 md:p-10 shadow-[0_20px_50px_rgba(15,23,42,0.04)] border border-slate-100 animate-slide-up relative overflow-hidden transition-all duration-500 hover:shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Left Side Content - Clinic Info */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-extrabold text-xs uppercase tracking-wider">
                  ⭐ TRUNG TÂM PHỤC HỒI CHỨC NĂNG DÀNH CHO DÂN VĂN PHÒNG
                </div>
                
                <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.1] tracking-tight">
                  Phục Hồi Cột Sống & <br />
                  <span className="text-primary bg-gradient-to-r from-primary to-teal-600 bg-clip-text text-transparent">Cơ Xương Khớp Chuyên Sâu</span>
                </h1>

                <div className="flex items-start gap-2.5 text-slate-500 font-bold text-sm bg-slate-50 p-3 rounded-2xl border border-slate-100 max-w-xl">
                  <span className="text-primary mt-0.5 animate-bounce">📍</span>
                  <span>40 Nguyễn Văn Linh, Bình Hiên, Hải Châu, Đà Nẵng</span>
                </div>

                <p className="text-slate-500 text-sm md:text-base leading-relaxed font-medium">
                  Không gian điều trị biệt lập, vô trùng tuyệt đối tại Đà Nẵng. Kết hợp hoàn hảo giữa công nghệ phục hồi tiên tiến Đức - Mỹ và phác đồ điều trị cá nhân hóa từ các Bác sĩ chuyên khoa y học thể thao đầu ngành.
                </p>

                {/* Unified Booking Capsule Widget */}
                <div className="flex pt-5 border-t border-slate-100/60">
                  <div className="inline-flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-slate-50 hover:bg-slate-100/60 border border-slate-200/50 p-2 rounded-2xl sm:rounded-full shadow-xs max-w-xl w-full gap-4 transition-all duration-300">
                    <div className="pl-4 pr-2 py-2 sm:py-0 text-left">
                      <p className="text-[10px] text-[#2EC4B6] font-extrabold uppercase tracking-widest mb-0.5">LƯỢNG GIÁ LÂM SÀNG BAN ĐẦU</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black text-slate-800">Miễn phí 100%</span>
                      </div>
                    </div>
                    <Link 
                      to="/booking" 
                      onClick={handleBookingClick}
                      className="bg-primary hover:bg-[#25A89C] text-white font-extrabold px-6 py-3.5 rounded-xl sm:rounded-full text-xs md:text-sm transition-all duration-300 shadow-md hover:shadow-primary/25 hover:-translate-y-0.5 active:translate-y-0 active:scale-98 flex items-center justify-center gap-2 shrink-0"
                    >
                      <Calendar size={16} />
                      Đặt lịch khám cùng Bác sĩ
                    </Link>
                  </div>
                </div>
              </div>

              {/* Right Side Image - Villa Clinic Photo */}
              <div className="lg:col-span-5 relative group">
                <div className="relative rounded-[24px] overflow-hidden aspect-[4/3] w-full shadow-lg border border-slate-100">
                  <LazyImage 
                    src="/images/physio_clinic_villa.png" 
                    alt="Office Care Premium Clinic" 
                    className="size-full object-cover group-hover:scale-103 transition-transform duration-700 filter saturate-105"
                    wrapperClassName="size-full"
                  />
                  {/* Subtle glass blur overlay on bottom */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/10 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4 bg-slate-900/40 backdrop-blur-md border border-white/10 p-4 rounded-xl text-white">
                    <p className="text-[9px] uppercase font-black text-primary mb-1 tracking-wider">Không gian điều trị</p>
                    <h4 className="text-xs font-bold leading-snug">Phòng khám chuyên khoa tiêu chuẩn 5 sao hiện đại, riêng tư tuyệt đối</h4>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Bar inside the Card (Light Theme clinical specs) */}
            <div className="mt-10 flex flex-col lg:flex-row gap-4 items-stretch">
              <div className="flex-1 bg-slate-50/50 border border-slate-100 rounded-2xl p-5 grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                <div className="flex items-center gap-3 md:border-r md:border-slate-200/60 pr-2">
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0"><Stethoscope size={18} /></div>
                  <div>
                    <h5 className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Chuyên gia</h5>
                    <p className="text-xs font-black text-slate-800">Bác sĩ đầu ngành</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 md:border-r md:border-slate-200/60 pr-2">
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0"><Compass size={18} /></div>
                  <div>
                    <h5 className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Không gian</h5>
                    <p className="text-xs font-black text-slate-800">Trị liệu biệt lập</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 md:border-r md:border-slate-200/60 pr-2">
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0"><HeartPulse size={18} /></div>
                  <div>
                    <h5 className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Công nghệ</h5>
                    <p className="text-xs font-black text-slate-800">Nhập khẩu Châu Âu</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0"><BadgeCheck size={18} className="text-primary" /></div>
                  <div>
                    <h5 className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Cam kết</h5>
                    <p className="text-xs font-black text-slate-800">Đạt chuẩn y khoa</p>
                  </div>
                </div>
              </div>
              
              {/* Highlight Badge */}
              <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 flex items-center gap-3.5 lg:w-64 shrink-0 justify-center lg:justify-start">
                <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-lg shrink-0"><Clock size={18} /></div>
                <div>
                  <h5 className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wider">Khám Không Đợi Chờ</h5>
                  <p className="text-xs font-semibold text-slate-400">Đúng giờ đặt lịch hẹn</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Highlight Preview Section - Staggered Asymmetric Layout */}
      <section className="py-24 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 animate-slide-up">
            <h2 className="text-primary font-bold tracking-wider uppercase text-xs mb-3 flex items-center justify-center gap-1.5">
              <span className="size-1.5 bg-primary rounded-full"></span> GIỚI THIỆU PHƯƠNG PHÁP ĐIỀU TRỊ
            </h2>
            <h3 className="font-heading text-3xl md:text-5xl font-black text-slate-900 mb-4 leading-tight">Y Khoa Phục Hồi Office Syndrome</h3>
            <p className="text-slate-500 font-semibold text-sm md:text-base">Chúng tôi tập trung phục hồi chuyển động tự nhiên cho cột sống và khớp của dân văn phòng bằng cách kết hợp cơ học trị liệu bằng tay và thiết bị công nghệ cao.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto mb-16">
            
            {/* Column 1: Diagnostic */}
            <div className="bg-slate-50 rounded-[24px] p-8 border border-slate-100 hover:border-slate-200 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform duration-300">
                  🩺
                </div>
                <h4 className="font-heading font-extrabold text-lg text-slate-900">Khám & Tầm Soát Ban Đầu</h4>
                <p className="text-slate-500 text-xs md:text-sm font-semibold leading-relaxed">
                  Bác sĩ chuyên khoa tiến hành tầm soát tư thế 4 chiều, đo tầm vận động của khớp vai/cổ/lưng để chẩn đoán chính xác nguyên nhân gốc rễ gây đau cơ xương khớp.
                </p>
              </div>
              <div className="pt-6 border-t border-slate-200/60 mt-6 flex items-center text-xs font-extrabold text-[#2EC4B6]">
                Tìm hiểu thêm <ChevronRight size={14} className="mt-0.5 ml-0.5" />
              </div>
            </div>

            {/* Column 2: Manual Therapy */}
            <div className="bg-slate-50 rounded-[24px] p-8 border border-slate-100 hover:border-slate-200 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform duration-300">
                  🏃‍♂️
                </div>
                <h4 className="font-heading font-extrabold text-lg text-slate-900">Kỹ Thuật Giải Cơ Chuyên Sâu</h4>
                <p className="text-slate-500 text-xs md:text-sm font-semibold leading-relaxed">
                  Kỹ thuật viên thực hiện xoa bóp mô sâu y học, di động mạc cơ (myofascial release) để phá vỡ xơ dính cơ và tháo xoắn cho các nhóm cơ bị co quắp mãn tính.
                </p>
              </div>
              <div className="pt-6 border-t border-slate-200/60 mt-6 flex items-center text-xs font-extrabold text-[#2EC4B6]">
                Tìm hiểu thêm <ChevronRight size={14} className="mt-0.5 ml-0.5" />
              </div>
            </div>

            {/* Column 3: High-tech Rehab */}
            <div className="bg-slate-50 rounded-[24px] p-8 border border-slate-100 hover:border-slate-200 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform duration-300">
                  ⚡
                </div>
                <h4 className="font-heading font-extrabold text-lg text-slate-900">Điện Xung & Siêu Âm Trị Liệu</h4>
                <p className="text-slate-500 text-xs md:text-sm font-semibold leading-relaxed">
                  Ứng dụng các bước sóng cơ học siêu âm đa tần tạo nhiệt sâu 3-5cm dưới da và dòng điện xung TENS cắt tín hiệu đau, đẩy lùi viêm sưng rễ thần kinh tại chỗ.
                </p>
              </div>
              <div className="pt-6 border-t border-slate-200/60 mt-6 flex items-center text-xs font-extrabold text-[#2EC4B6]">
                Tìm hiểu thêm <ChevronRight size={14} className="mt-0.5 ml-0.5" />
              </div>
            </div>

          </div>

          {/* Premium Call to Action (CTA) Banner to Services catalog */}
          <div className="max-w-5xl mx-auto bg-slate-900 rounded-[32px] p-8 md:p-12 relative overflow-hidden shadow-lg border border-slate-800">
            {/* Subtle light reflection graphic */}
            <div className="absolute -right-32 -bottom-32 size-96 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="space-y-3 flex-1 text-center lg:text-left">
                <span className="text-[10px] bg-primary/20 text-[#2EC4B6] border border-primary/30 font-black uppercase tracking-widest px-3 py-1 rounded-full">
                  ✦ DANH MỤC KHÁM & TRỊ LIỆU ✦
                </span>
                <h3 className="font-heading font-black text-2xl md:text-3xl text-white">Tra Cứu Bảng Giá & Lộ Trình Gói</h3>
                <p className="text-slate-400 text-xs md:text-sm font-medium leading-relaxed max-w-xl">
                  Xem chi tiết đơn giá cho từng buổi trị liệu lẻ hoặc các gói combo liệu trình dài ngày giúp cải thiện tư thế gù lưng gập cổ rùa và phục hồi chèn ép thần kinh cột sống.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto shrink-0">
                <Link
                  to="/services"
                  state={{ activeTab: 'services' }}
                  className="bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-center px-6 py-4 rounded-xl text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1 hover:shadow-md"
                >
                  Xem dịch vụ lẻ <ArrowRight size={13} />
                </Link>
                <Link
                  to="/services"
                  state={{ activeTab: 'packages' }}
                  className="bg-primary hover:bg-[#25A89C] text-white font-extrabold text-center px-6 py-4 rounded-xl text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 shadow-md shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Sparkles size={13} /> Xem gói combo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Facility Intro section - Staggered layout */}
      <section className="py-24 bg-slate-50/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Image block */}
            <div className="lg:col-span-5 relative group">
              <div className="relative rounded-[24px] overflow-hidden aspect-[4/3] w-full shadow-md border border-slate-100">
                <LazyImage 
                  src="/images/physio_treatment_room.png" 
                  alt="Phòng trị liệu" 
                  className="size-full object-cover group-hover:scale-103 transition-transform duration-700 filter saturate-105"
                  wrapperClassName="size-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent opacity-60"></div>
                <div className="absolute bottom-4 left-4 right-4 bg-white/10 backdrop-blur-md border border-white/20 p-3.5 rounded-xl text-white">
                  <p className="text-[10px] uppercase font-black text-primary mb-0.5">Tiêu chuẩn Đức</p>
                  <h4 className="text-xs font-bold leading-snug">Vật tư y tế nhập khẩu, khử trùng 100% sau mỗi buổi khám</h4>
                </div>
              </div>
            </div>

            {/* Right details block */}
            <div className="lg:col-span-7 space-y-6">
              <p className="text-primary font-bold text-xs uppercase tracking-widest flex items-center gap-1.5">
                <ShieldAlert size={14} className="text-primary" /> CAM KẾT KHÁM CHỮA BỆNH AN TOÀN
              </p>
              <h3 className="font-heading text-3xl md:text-4xl font-black text-slate-900 leading-tight">Môi Trường Điều Trị Chuyên Nghiệp & Tiện Nghi</h3>
              <p className="text-slate-500 text-sm md:text-base font-semibold leading-relaxed">
                Tại Office Care, chúng tôi xem việc phục hồi cơ xương khớp là một hành trình thư giãn. Không gian phòng khám được tối giản hóa giống như một spa nghỉ dưỡng, giúp xóa bỏ tâm lý e ngại bệnh viện của khách hàng văn phòng, mang lại hiệu quả trị liệu tối ưu nhất về cả thể chất lẫn tinh thần.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
                <div className="flex items-center gap-2.5 text-xs text-slate-700 font-bold">
                  <span className="size-2 bg-[#2EC4B6] rounded-full shrink-0"></span>
                  Bác sĩ/KTV 100% có chứng chỉ hành nghề y khoa.
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-700 font-bold">
                  <span className="size-2 bg-[#2EC4B6] rounded-full shrink-0"></span>
                  Thiết bị hiện đại nhập khẩu đạt chứng nhận FDA.
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-700 font-bold">
                  <span className="size-2 bg-[#2EC4B6] rounded-full shrink-0"></span>
                  Tuyệt đối không chèo kéo, cam kết theo đúng phác đồ.
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-700 font-bold">
                  <span className="size-2 bg-[#2EC4B6] rounded-full shrink-0"></span>
                  Không gian riêng tư, vô trùng sạch sẽ.
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
