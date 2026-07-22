import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { LogOut, ChevronDown, Menu, X, Calendar, Facebook, Mail, Phone, MapPin, MessageCircle } from 'lucide-react';
import GlobalAuthModal from '../components/GlobalAuthModal';
import AIChatBubble from '../features/chat/components/AIChatBubble';

export default function LandingLayout() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showGlobalAuthModal, setShowGlobalAuthModal] = useState(false);

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
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm font-jakarta font-bold text-secondary hover:text-primary transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary hover:after:w-full after:transition-all">Trang chủ</Link>
            <Link to="/gioi-thieu" className="text-sm font-jakarta font-bold text-secondary hover:text-primary transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary hover:after:w-full after:transition-all">Giới thiệu</Link>
            <Link to="/services" className="text-sm font-jakarta font-bold text-secondary hover:text-primary transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary hover:after:w-full after:transition-all">Dịch vụ</Link>
            <Link to="/specialists" className="text-sm font-jakarta font-bold text-secondary hover:text-primary transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary hover:after:w-full after:transition-all">Chuyên gia</Link>
            <Link to="/tin-tuc" className="text-sm font-jakarta font-bold text-secondary hover:text-primary transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary hover:after:w-full after:transition-all">Bài viết</Link>
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
                    <img 
                      src={user.avatar_url || "https://i.pravatar.cc/150?img=11"} 
                      alt="Avatar" 
                      className="w-full h-full object-cover rounded-full"
                    />
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
            <Link to="/" className="text-sm font-jakarta font-bold text-secondary py-2.5 border-b border-slate-50" onClick={() => setIsMobileMenuOpen(false)}>Trang chủ</Link>
            <Link to="/gioi-thieu" className="text-sm font-jakarta font-bold text-secondary py-2.5 border-b border-slate-50" onClick={() => setIsMobileMenuOpen(false)}>Giới thiệu</Link>
            <Link to="/services" className="text-sm font-jakarta font-bold text-secondary py-2.5 border-b border-slate-50" onClick={() => setIsMobileMenuOpen(false)}>Dịch vụ</Link>
            <Link to="/specialists" className="text-sm font-jakarta font-bold text-secondary py-2.5 border-b border-slate-50" onClick={() => setIsMobileMenuOpen(false)}>Chuyên gia</Link>
            <Link to="/tin-tuc" className="text-sm font-jakarta font-bold text-secondary py-2.5 border-b border-slate-50" onClick={() => setIsMobileMenuOpen(false)}>Bài viết</Link>
            
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
      <footer className="bg-gradient-to-b from-[#E6F4F1] to-[#D5EDE9] text-slate-600 pt-14 pb-8 mt-auto text-xs font-sans border-t border-[#B3E0D8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
            
            {/* Brand & Mission Column */}
            <div className="md:col-span-4 space-y-4 text-left">
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
              <div className="flex items-center gap-2.5 pt-1">
                <a 
                  href="https://www.facebook.com/profile.php?id=61591064963268" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="size-9 rounded-xl bg-white/80 hover:bg-[#0D9488] text-slate-600 hover:text-white flex items-center justify-center transition-all duration-200 border border-[#B3E0D8] shadow-2xs"
                  title="Fanpage Facebook OfficeCare"
                >
                  <Facebook size={16} />
                </a>
                <a 
                  href="https://zalo.me/0398655332" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl bg-white/80 hover:bg-[#0D9488] text-[#0D9488] hover:text-white flex items-center gap-1.5 transition-all duration-200 border border-[#B3E0D8] shadow-2xs font-bold text-[11px]"
                  title="Zalo tư vấn 0398655332"
                >
                  <MessageCircle size={15} />
                  <span>Zalo: 0398655332</span>
                </a>
              </div>
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
            
            {/* Contact Details Column */}
            <div className="md:col-span-4 space-y-3 text-left">
              <h4 className="font-heading font-bold text-xs tracking-wider text-slate-800 uppercase">Vị Trí &amp; Liên Hệ</h4>
              <div className="space-y-2.5 text-slate-600 font-medium">
                <p className="flex items-start gap-2.5 leading-relaxed">
                  <MapPin size={15} className="shrink-0 mt-0.5 text-[#0D9488]" />
                  <span className="text-slate-700">Vinhomes Golden River, Bến Nghé, Quận 1, TP. Hồ Chí Minh</span>
                </p>
                <p className="flex items-center gap-2.5">
                  <Phone size={15} className="shrink-0 text-[#0D9488]" />
                  <a href="tel:0398655332" className="hover:text-[#0D9488] font-bold text-slate-700 transition-colors">Hotline &amp; Zalo: 0398655332</a>
                </p>
                <p className="flex items-center gap-2.5">
                  <Mail size={15} className="shrink-0 text-[#0D9488]" />
                  <a href="mailto:officecareclinic2026@gmail.com" className="hover:text-[#0D9488] font-semibold text-slate-700 transition-colors">officecareclinic2026@gmail.com</a>
                </p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-[#B3E0D8] pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-[11px] text-slate-500 font-medium">
            <p>© 2026 OfficeCare Clinic. Tất cả các quyền được bảo lưu. Đạt chuẩn y tế cao cấp.</p>
            <div className="flex items-center gap-4">
              <span>Hotline 24/7: 0398655332</span>
              <span>•</span>
              <a href="https://www.facebook.com/profile.php?id=61591064963268" target="_blank" rel="noopener noreferrer" className="hover:text-[#0D9488]">Facebook Chính Thức</a>
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
