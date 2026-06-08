import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { LogOut, LayoutDashboard, ChevronDown, Menu, X, Calendar, Facebook, Instagram, Youtube, Mail, Phone, MapPin, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlobalAuthModal from '../components/GlobalAuthModal';

export default function LandingLayout() {
  const { isAuthenticated, user, logout, showAuthModal, setShowAuthModal } = useAuthStore();
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

  const handleBookingClick = (e: React.MouseEvent) => {
    if (!isAuthenticated()) {
      e.preventDefault();
      setShowAuthModal(true);
    }
  };

  const handleRedirectToLogin = () => {
    setShowAuthModal(false);
    navigate('/login', { state: { from: '/booking' } });
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
    return () => window.removeEventListener('scroll', handleScroll);
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

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm font-jakarta font-bold text-secondary hover:text-primary transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary hover:after:w-full after:transition-all">Trang chủ</Link>
            <Link to="/services" state={{ activeTab: 'services' }} className="text-sm font-jakarta font-bold text-secondary hover:text-primary transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary hover:after:w-full after:transition-all">Dịch vụ</Link>
            <Link to="/services" state={{ activeTab: 'packages' }} className="text-sm font-jakarta font-bold text-secondary hover:text-primary transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary hover:after:w-full after:transition-all">Bảng giá</Link>
          </nav>

          {/* Auth Actions (Desktop) */}
          <div className="hidden md:flex items-center gap-4">
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
                      to="/dashboard" 
                      className="flex items-center gap-3 px-4 py-3 text-sm font-jakarta font-bold text-secondary hover:bg-slate-50 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <LayoutDashboard size={18} className="text-primary" />
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
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-sm font-jakarta font-bold text-secondary hover:text-primary transition-colors px-4 py-2">
                  Đăng nhập
                </Link>
                <Link to="/booking" onClick={handleBookingClick} className="bg-[#2EC4B6] hover:bg-[#25A89C] text-white text-xs font-jakarta font-extrabold px-5 py-3 rounded-full shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-1.5 animate-pulse-custom">
                  <Calendar size={14} />
                  Đặt lịch tư vấn chuyên sâu
                </Link>
              </div>
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
            <Link to="/services" state={{ activeTab: 'services' }} className="text-sm font-jakarta font-bold text-secondary py-2.5 border-b border-slate-50" onClick={() => setIsMobileMenuOpen(false)}>Dịch vụ</Link>
            <Link to="/services" state={{ activeTab: 'packages' }} className="text-sm font-jakarta font-bold text-secondary py-2.5 border-b border-slate-50" onClick={() => setIsMobileMenuOpen(false)}>Bảng giá</Link>
            
            <div className="mt-4 flex flex-col gap-2.5">
              {isAuthenticated() && user ? (
                <>
                  <Link to="/dashboard" className="flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-secondary text-sm font-jakarta font-bold px-6 py-3 rounded-[16px] transition-all" onClick={() => setIsMobileMenuOpen(false)}>
                    <LayoutDashboard size={18} /> Quản lý tài khoản
                  </Link>
                  <button onClick={handleLogout} className="flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-jakarta font-bold px-6 py-3 rounded-[16px] transition-all">
                    <LogOut size={18} /> Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="flex items-center justify-center text-secondary bg-slate-50 hover:bg-slate-100 text-sm font-jakarta font-bold px-6 py-3 rounded-[16px] transition-all" onClick={() => setIsMobileMenuOpen(false)}>
                    Đăng nhập
                  </Link>
                  <Link to="/booking" onClick={(e) => { setIsMobileMenuOpen(false); handleBookingClick(e); }} className="flex items-center justify-center bg-primary hover:bg-[#25A89C] text-white text-sm font-jakarta font-bold px-6 py-3 rounded-[16px] shadow-soft-button transition-all animate-pulse-custom">
                    Đặt lịch tư vấn chuyên sâu
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Premium Wave Footer */}
      <footer className="bg-primary text-white rounded-t-[40px] pt-16 pb-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-1 space-y-6">
              <Link to="/" className="flex items-center gap-3 hover:opacity-95 transition-opacity">
                <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-white/10 border border-white/20 text-white font-jakarta font-black text-xl shadow-inner">
                  O
                </div>
                <div className="flex flex-col">
                  <span className="font-jakarta font-black text-lg text-white tracking-tight leading-none uppercase">
                    Office Care
                  </span>
                  <span className="text-[9px] text-[#E6FFFA]/80 font-jakarta font-extrabold uppercase tracking-widest leading-none mt-1">
                    Premium Rehab
                  </span>
                </div>
              </Link>
              <p className="text-white/80 text-sm leading-relaxed font-jakarta">
                Therapeutic Precision for the Modern Professional.<br />
                Giải pháp phục hồi chức năng cột sống và cơ xương khớp chuyên sâu, xóa tan những cơn đau kéo dài của giới văn phòng.
              </p>
              <div className="flex gap-3 pt-2">
                <a href="#" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors text-white">
                  <Facebook size={18} />
                </a>
                <a href="#" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors text-white">
                  <Instagram size={18} />
                </a>
                <a href="#" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors text-white">
                  <Youtube size={18} />
                </a>
              </div>
            </div>
            
            <div className="space-y-6">
              <h4 className="font-jakarta font-bold text-base tracking-wider text-white border-b border-white/10 pb-2">Dịch Vụ</h4>
              <ul className="space-y-3 font-jakarta text-sm text-white/80">
                <li><Link to="/services" state={{ activeTab: 'services' }} className="hover:text-white hover:underline transition-all">Khám lượng giá ban đầu</Link></li>
                <li><Link to="/services" state={{ activeTab: 'services' }} className="hover:text-white hover:underline transition-all">Siêu âm trị liệu sâu</Link></li>
                <li><Link to="/services" state={{ activeTab: 'services' }} className="hover:text-white hover:underline transition-all">Điện xung giảm co thắt</Link></li>
                <li><Link to="/services" state={{ activeTab: 'services' }} className="hover:text-white hover:underline transition-all">Tập vận động với kỹ thuật viên</Link></li>
              </ul>
            </div>
            
            <div className="space-y-6">
              <h4 className="font-jakarta font-bold text-base tracking-wider text-white border-b border-white/10 pb-2">Hỗ Trợ</h4>
              <ul className="space-y-3 font-jakarta text-sm text-white/80">
                <li><a href="#" className="hover:text-white hover:underline transition-all">Chính sách bảo mật</a></li>
                <li><a href="#" className="hover:text-white hover:underline transition-all">Điều khoản sử dụng</a></li>
                <li><a href="#" className="hover:text-white hover:underline transition-all">Câu hỏi thường gặp</a></li>
                <li><a href="#" className="hover:text-white hover:underline transition-all">Liên hệ</a></li>
              </ul>
            </div>
            
            <div className="space-y-6">
              <h4 className="font-jakarta font-bold text-base tracking-wider text-white border-b border-white/10 pb-2">Vị Trí</h4>
              <div className="space-y-3 text-sm text-white/80 font-jakarta">
                <p className="flex items-start gap-2.5 leading-snug">
                  <MapPin size={16} className="shrink-0 mt-0.5 text-[#E6FFFA]" />
                  <span>Khu đô thị Vinhomes Golden River, Bến Nghé, Quận 1, TP. Hồ Chí Minh</span>
                </p>
                <p className="flex items-center gap-2.5">
                  <Phone size={16} className="shrink-0 text-[#E6FFFA]" />
                  <span>1900 1234</span>
                </p>
                <p className="flex items-center gap-2.5">
                  <Mail size={16} className="shrink-0 text-[#E6FFFA]" />
                  <span>hello@officecare.com</span>
                </p>
                {/* Grayscale map mockup */}
                <div className="h-28 w-full rounded-2xl overflow-hidden grayscale border border-white/10 shadow-inner mt-4">
                  <img 
                    alt="Map location" 
                    className="w-full h-full object-cover" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuC19wwZDJ3bkj3fOUT-vEV-QurnB0OHl7qH6L_HUzvkp8uX63sAR71u-pzHgTlNhGTY94FL9Pf6rjR6otkrrMv5A8RxAF5U2yDFq1aKrtx4tE_ggNBdW-hrZp9FKYmhhZUcd42hAej3GbzPBZnC2DEpOHNC7g4rmyt6EYbt-L_CdBn8S6s2C97Rqe5e-WrMwtiEmx_Pvne2MNcsmUZDyoUZBcmi0Sg6t1yUclAmAXO62ATJeNgjzUvzUyraeG-8u2-KZb-lYDQ19P4"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-8 text-center flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/60 text-xs font-jakarta">© 2026 Office Care. Đã đăng ký bản quyền. Phát triển với tiêu chuẩn y tế 5 sao.</p>
            <p className="text-white/60 text-xs font-jakarta">Therapeutic Precision for the Modern Professional.</p>
          </div>
        </div>
      </footer>

      {/* Global Authentication Interceptor Modal */}
      <GlobalAuthModal isOpen={showGlobalAuthModal} onClose={() => setShowGlobalAuthModal(false)} />
    </div>
  );
}
