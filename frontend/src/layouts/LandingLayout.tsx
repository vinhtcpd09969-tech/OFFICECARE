import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { LogOut, ChevronDown, Menu, X, Calendar, Facebook, MapPin, User } from 'lucide-react';
import GlobalAuthModal from './GlobalAuthModal';
import AIChatBubble from '../features/chat/components/AIChatBubble';
import { resolveImageUrl } from '../utils/imageUrl';

export default function LandingLayout() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showGlobalAuthModal, setShowGlobalAuthModal] = useState(false);

  // Active Route Detector
  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    if (path === '/services') {
      return location.pathname.startsWith('/services') || location.pathname.startsWith('/package');
    }
    if (path === '/specialists') {
      return location.pathname.startsWith('/specialists');
    }
    if (path === '/tin-tuc') {
      return location.pathname.startsWith('/tin-tuc') || location.pathname.startsWith('/bai-viet') || location.pathname.startsWith('/articles');
    }
    if (path === '/gioi-thieu') {
      return location.pathname.startsWith('/gioi-thieu') || location.pathname.startsWith('/about');
    }
    return location.pathname.startsWith(path);
  };

  const getDesktopNavClass = (path: string) => {
    const active = isActive(path);
    return `text-sm font-jakarta transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:bg-[#0D9488] hover:after:w-full after:transition-all ${
      active 
        ? 'text-[#0D9488] after:w-full font-extrabold' 
        : 'text-secondary hover:text-[#0D9488] after:w-0 font-bold'
    }`;
  };

  const getMobileNavClass = (path: string) => {
    const active = isActive(path);
    return `text-sm font-jakarta py-2.5 border-b border-slate-50 transition-colors ${
      active 
        ? 'text-[#0D9488] font-extrabold px-3 bg-teal-50/60 rounded-xl border-l-4 border-l-[#0D9488]' 
        : 'text-secondary font-bold hover:text-[#0D9488]'
    }`;
  };

  useEffect(() => {
    const handleOpenModal = () => {
      setShowGlobalAuthModal(true);
    };
    window.addEventListener('trigger-global-auth-modal', handleOpenModal);
    return () => {
      window.removeEventListener('trigger-global-auth-modal', handleOpenModal);
    };
  }, []);

  const handleBookingClick = (e: React.MouseEvent) => {
    if (!isAuthenticated()) {
      e.preventDefault();
      setShowGlobalAuthModal(true);
      setIsMobileMenuOpen(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen font-body flex flex-col bg-background">
      {/* Floating Glassmorphic Header */}
      <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-4 sm:px-6 lg:px-8 ${isScrolled ? 'py-3' : 'py-5'}`}>
        <header className={`max-w-7xl mx-auto w-full px-6 h-16 sm:h-20 transition-all duration-500 rounded-full flex items-center justify-between ${
          isScrolled 
            ? 'bg-white/90 backdrop-blur-md border border-slate-100 shadow-lg' 
            : 'bg-white/40 backdrop-blur-sm border border-transparent shadow-none'
        }`}>
          
          {/* Logo */}
          <div className="flex items-center gap-3.5">
            <Link to="/" className="flex items-center gap-3 hover:opacity-95 transition-opacity">
              <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 text-primary font-jakarta font-black text-xl shadow-inner">
                O
              </div>
              <div className="flex flex-col">
                <span className="font-jakarta font-black text-base text-secondary tracking-tight leading-none uppercase">
                  Office Care
                </span>
                <span className="text-[9px] text-primary font-jakarta font-extrabold uppercase tracking-widest leading-none mt-1">
                  Premium Rehab
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-7">
            <Link to="/" className={getDesktopNavClass('/')}>Trang chủ</Link>
            <Link to="/services" className={getDesktopNavClass('/services')}>Gói Trị Liệu</Link>
            <Link to="/specialists" className={getDesktopNavClass('/specialists')}>Đội Ngũ</Link>
            <Link to="/tin-tuc" className={getDesktopNavClass('/tin-tuc')}>Kiến Thức Y Khoa</Link>
            <Link to="/gioi-thieu" className={getDesktopNavClass('/gioi-thieu')}>Về Chúng Tôi</Link>
          </nav>

          {/* Auth Actions (Desktop) */}
          <div className="hidden md:flex items-center gap-4">
            <Link 
              to="/booking" 
              onClick={handleBookingClick} 
              className="bg-[#0D9488] hover:bg-[#0b7a70] text-white text-xs font-jakarta font-extrabold px-6 py-2.5 rounded-full shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Calendar size={14} />
              Đặt lịch
            </Link>

            {isAuthenticated() && user ? (
              <div className="relative">
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-3 hover:bg-white/80 py-1.5 px-2.5 rounded-full border border-transparent hover:border-slate-100 transition-all"
                >
                  <div className="w-8 h-8 rounded-full border border-primary/20 p-0.5 overflow-hidden">
                    {user.avatar_url ? (
                      <img 
                        src={resolveImageUrl(user.avatar_url)} 
                        alt={user.ho_ten} 
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center rounded-full text-slate-400">
                        <User size={16} className="text-slate-400" />
                      </div>
                    )}
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-xs font-jakarta font-bold text-secondary leading-tight">{user.ho_ten}</p>
                    <p className="text-[10px] text-gray-400 font-jakarta font-bold">Cá nhân</p>
                  </div>
                  <ChevronDown size={14} className={`text-gray-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-[24px] shadow-soft-ui border border-slate-100 py-2 animate-slide-up">
                    <Link 
                      to="/appointments" 
                      className="flex items-center gap-3 px-4 py-3 text-sm font-jakarta font-bold text-secondary hover:bg-slate-50 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Calendar size={18} className="text-primary" />
                      Quản lý tài khoản
                    </Link>
                    <div className="h-px bg-slate-100 my-1"></div>
                    <button 
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm font-jakarta font-bold text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={18} />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="text-sm font-jakarta font-bold text-secondary hover:text-primary transition-colors px-4 py-2">
                Đăng nhập
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden text-secondary p-2 hover:bg-slate-100 rounded-full transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </header>

        {/* Mobile Menu Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden w-full mt-2 bg-white/95 backdrop-blur-md rounded-[24px] border border-slate-100 shadow-lg px-6 py-6 flex flex-col gap-3 animate-slide-up">
            <Link to="/" className={getMobileNavClass('/')} onClick={() => setIsMobileMenuOpen(false)}>Trang chủ</Link>
            <Link to="/services" className={getMobileNavClass('/services')} onClick={() => setIsMobileMenuOpen(false)}>Gói Trị Liệu</Link>
            <Link to="/specialists" className={getMobileNavClass('/specialists')} onClick={() => setIsMobileMenuOpen(false)}>Đội Ngũ</Link>
            <Link to="/tin-tuc" className={getMobileNavClass('/tin-tuc')} onClick={() => setIsMobileMenuOpen(false)}>Kiến Thức Y Khoa</Link>
            <Link to="/gioi-thieu" className={getMobileNavClass('/gioi-thieu')} onClick={() => setIsMobileMenuOpen(false)}>Về Chúng Tôi</Link>
            
            <div className="mt-4 flex flex-col gap-2.5">
              <Link 
                to="/booking" 
                onClick={(e) => { setIsMobileMenuOpen(false); handleBookingClick(e); }} 
                className="flex items-center justify-center bg-primary hover:bg-[#25A89C] text-white text-sm font-jakarta font-bold px-6 py-3 rounded-[16px] shadow-soft-button transition-all cursor-pointer"
              >
                Đặt lịch
              </Link>
              {isAuthenticated() && user ? (
                <>
                  <Link to="/appointments" className="flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-secondary text-sm font-jakarta font-bold px-6 py-3 rounded-[16px] transition-all" onClick={() => setIsMobileMenuOpen(false)}>
                    <Calendar size={18} /> Quản lý tài khoản
                  </Link>
                  <button onClick={handleLogout} className="flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-jakarta font-bold px-6 py-3 rounded-[16px] transition-all">
                    <LogOut size={18} /> Đăng xuất
                  </button>
                </>
              ) : (
                <Link to="/login" className="flex items-center justify-center text-secondary bg-slate-50 hover:bg-slate-100 text-sm font-jakarta font-bold px-6 py-3 rounded-[16px] transition-all" onClick={() => setIsMobileMenuOpen(false)}>
                  Đăng nhập
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Sleek Premium Compact Footer (Medical Light Mint Theme) */}
      <footer className="bg-gradient-to-b from-[#E6F4F1] to-[#D5EDE9] text-slate-600 pt-10 pb-8 mt-auto text-xs font-sans border-t border-[#B3E0D8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">


          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-10">
            
            {/* Brand & Mission Column */}
            <div className="md:col-span-4 space-y-3.5 text-left">
              <Link to="/" className="inline-flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-[#0D9488] text-white font-heading font-bold text-lg flex items-center justify-center shadow-md">
                  O
                </div>
                <div className="flex flex-col">
                  <span className="font-heading font-bold text-base text-slate-800 tracking-normal">
                    OfficeCare
                  </span>
                  <span className="text-[9px] text-[#0D9488] font-black uppercase tracking-wider">
                    Phục Hồi Chức Năng Y Khoa
                  </span>
                </div>
              </Link>
              <p className="text-slate-600 text-xs leading-relaxed max-w-sm font-medium">
                Giải pháp phục hồi chức năng cơ xương khớp &amp; cột sống văn phòng chuyên sâu. Kết hợp công nghệ trị liệu Châu Âu và phác đồ cá nhân hóa 1:1 từ Bác sĩ chuyên khoa.
              </p>
            </div>
            
            {/* Quick Links Column */}
            <div className="md:col-span-2 space-y-3 text-left">
              <h4 className="font-heading font-bold text-xs tracking-wider text-slate-800 uppercase">Dịch Vụ</h4>
              <ul className="space-y-2 text-slate-600 font-semibold">
                <li><Link to="/services" className="hover:text-[#0D9488] transition-colors">Khám Lâm Sàng 1:1</Link></li>
                <li><Link to="/services" className="hover:text-[#0D9488] transition-colors">Trị Liệu Sóng Xung Kích</Link></li>
                <li><Link to="/services" className="hover:text-[#0D9488] transition-colors">Giải Phóng Cơ Mô Mềm</Link></li>
                <li><Link to="/services" className="hover:text-[#0D9488] transition-colors">Liệu Trình Cột Sống</Link></li>
              </ul>
            </div>
            
            {/* Support Links Column */}
            <div className="md:col-span-2 space-y-3 text-left">
              <h4 className="font-heading font-bold text-xs tracking-wider text-slate-800 uppercase">Thông Tin</h4>
              <ul className="space-y-2 text-slate-600 font-semibold">
                <li><Link to="/gioi-thieu" className="hover:text-[#0D9488] transition-colors">Giới thiệu phòng khám</Link></li>
                <li><Link to="/specialists" className="hover:text-[#0D9488] transition-colors">Hội đồng chuyên gia</Link></li>
                <li><Link to="/tin-tuc" className="hover:text-[#0D9488] transition-colors">Kiến thức y khoa</Link></li>
                <li><Link to="/dieu-khoan-dich-vu" className="hover:text-[#0D9488] transition-colors">Điều khoản &amp; Bảo mật</Link></li>
              </ul>
            </div>
            
            {/* Contact Details & Action Buttons Column (Đúng vị trí dưới cột 4 như ảnh mẫu) */}
            <div className="md:col-span-4 space-y-4 text-left">
              <h4 className="font-heading font-bold text-xs tracking-wider text-slate-800 uppercase">Vị Trí &amp; Liên Hệ</h4>
              <div className="space-y-2 text-slate-600 font-medium">
                <p className="flex items-start gap-2 leading-relaxed">
                  <MapPin size={15} className="shrink-0 mt-0.5 text-[#0D9488]" />
                  <span className="text-slate-700">Vinhomes Golden River, Bến Nghé, Quận 1, TP. Hồ Chí Minh</span>
                </p>
              </div>

              {/* Action Buttons & Social Icons Row under Column 4 */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Link
                  to="/booking"
                  onClick={handleBookingClick}
                  className="inline-flex items-center gap-1.5 bg-[#0D9488] hover:bg-[#0b7a70] text-white text-xs font-jakarta font-extrabold px-4 py-2 rounded-xl shadow-sm hover:shadow transition-all cursor-pointer shrink-0"
                >
                  <Calendar size={14} />
                  <span>Đặt lịch khám</span>
                </Link>

                <a 
                  href="https://www.facebook.com/profile.php?id=61591064963268" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="size-8.5 rounded-full bg-[#1877F2] hover:bg-[#166fe5] text-white flex items-center justify-center transition-all duration-200 shadow-2xs shrink-0 font-bold"
                  title="Facebook Page OfficeCare"
                >
                  <Facebook size={15} />
                </a>

                <a 
                  href="https://zalo.me/0398655332" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="size-8.5 rounded-full bg-[#0068FF] hover:bg-[#005cdb] text-white flex items-center justify-center transition-all duration-200 shadow-2xs shrink-0 text-[10px] font-extrabold"
                  title="Zalo 0398655332"
                >
                  Zalo
                </a>
              </div>
            </div>
          </div>
          
          {/* Bottom Copyright & Sub-bar with Padding to avoid AI Chatbot Overlap */}
          <div className="border-t border-[#B3E0D8] pt-5 flex flex-col md:flex-row justify-between items-center gap-3 text-[11px] text-slate-500 font-medium pr-0 md:pr-24">
            <p>© 2026 OfficeCare Clinic. Tất cả các quyền được bảo lưu. Đạt chuẩn y tế cao cấp.</p>
            <div className="flex items-center gap-3">
              <span>Website: officecareclinic.com</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Global Authentication Interceptor Modal */}
      <GlobalAuthModal isOpen={showGlobalAuthModal} onClose={() => setShowGlobalAuthModal(false)} />
      <AIChatBubble />
    </div>
  );
}
