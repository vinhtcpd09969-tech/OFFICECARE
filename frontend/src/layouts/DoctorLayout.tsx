import { Link, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Clock, 
  FileText, 
  LogOut,
  Search,
  Bell,
  HelpCircle,
  Sun,
  Moon
} from 'lucide-react';

export default function DoctorLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const logout = useAuthStore(state => state.logout);
  const user = useAuthStore(state => state.user);
  
  const [searchValue, setSearchValue] = useState(searchParams.get('q') || '');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    const handleThemeChange = () => {
      setTheme(localStorage.getItem('theme') || 'light');
    };
    window.addEventListener('theme-change', handleThemeChange);
    return () => window.removeEventListener('theme-change', handleThemeChange);
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Đồng bộ searchValue khi truy vấn URL thay đổi
  useEffect(() => {
    setSearchValue(searchParams.get('q') || '');
  }, [searchParams]);

  const handleSearchChange = (val: string) => {
    setSearchValue(val);
    if (val.trim()) {
      setSearchParams({ q: val });
    } else {
      searchParams.delete('q');
      setSearchParams(searchParams);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Tổng quan', path: '/doctor', icon: <LayoutDashboard size={18} /> },
    { name: 'Lịch khám của tôi', path: '/doctor/appointments', icon: <Calendar size={18} />, searchPlaceholder: 'Tìm kiếm ca khám...' },
    { name: 'Hồ sơ bệnh án', path: '/doctor/medical-records', icon: <FileText size={18} />, searchPlaceholder: 'Tìm kiếm hồ sơ bệnh nhân...' },
    { name: 'Lịch trực cá nhân', path: '/doctor/schedules', icon: <Clock size={18} /> },
  ];

  const currentItem = navItems.find(item => item.path === location.pathname || location.pathname.startsWith(item.path + '/'));

  return (
    <div className="h-screen overflow-hidden bg-background dark:bg-zinc-950 flex font-body text-secondary dark:text-zinc-100 transition-colors duration-300">
      {/* Sidebar dành cho Bác sĩ */}
      <aside className="w-64 bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 flex flex-col shrink-0 border-r border-zinc-100 dark:border-zinc-800 shadow-sm z-30 transition-colors duration-300">
        <div className="h-16 flex items-center gap-3 px-6 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-colors duration-300">
          <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <span className="text-primary font-bold text-sm">👨‍⚕️</span>
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-secondary dark:text-zinc-100 tracking-tight flex items-center gap-1.5">
              PHYSIOFLOW <span className="text-primary font-bold text-[9px] bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">DOCTOR</span>
            </h1>
            <p className="text-[8px] text-zinc-400 dark:text-zinc-500 font-extrabold tracking-widest uppercase mt-0.5">Phân hệ Bác sĩ lâm sàng</p>
          </div>
        </div>
        
        <nav className="flex-1 py-4 overflow-y-auto pr-1 scrollbar-thin">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/doctor' && location.pathname.startsWith(item.path));
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center px-4 py-2.5 rounded-[14px] transition-all duration-200 group border-l-4 ${
                      isActive 
                        ? 'bg-primary/5 dark:bg-primary/10 text-primary font-bold border-primary shadow-sm' 
                        : 'border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-secondary dark:hover:text-zinc-100'
                    }`}
                  >
                    <span className={`mr-3 transition-transform group-hover:scale-110 duration-200 ${isActive ? 'text-primary' : 'text-zinc-400 dark:text-zinc-500 group-hover:text-secondary dark:group-hover:text-zinc-100'}`}>
                      {item.icon}
                    </span>
                    <span className="text-[11px] font-bold tracking-wide uppercase">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-colors duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold shadow-inner">
              {user?.email?.charAt(0).toUpperCase() || 'D'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-secondary dark:text-zinc-100 truncate">{user?.ho_ten || user?.email || 'Bác sĩ chuyên khoa'}</p>
              <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider mt-0.5">Bác sĩ chuyên khoa</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full py-2.5 px-4 rounded-[14px] bg-zinc-50 dark:bg-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 border border-zinc-100 dark:border-zinc-800 hover:border-rose-200 text-xs font-bold transition-all flex items-center justify-center gap-2 text-zinc-650 dark:text-zinc-400"
          >
            <LogOut size={14} /> Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-background dark:bg-zinc-950 transition-colors duration-300">
        {/* Header */}
        <header className="h-16 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between px-8 shrink-0 z-20 sticky top-0 transition-colors duration-300">
          <div className="flex items-center gap-6 flex-1 min-w-0">
            <h2 className="text-sm font-extrabold text-secondary dark:text-zinc-100 tracking-tight shrink-0">
              {currentItem?.name || 'Khám lâm sàng'}
            </h2>
            
            {/* Dynamic Search Bar */}
            {currentItem?.searchPlaceholder && (
              <div className="relative max-w-md w-full hidden md:block group animate-fade-in">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500 group-focus-within:text-primary transition-colors">
                  <Search size={14} />
                </span>
                <input 
                  type="text" 
                  value={searchValue}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder={currentItem.searchPlaceholder}
                  className="w-full pl-10 pr-4 py-2 text-xs bg-zinc-50 dark:bg-zinc-855 border border-zinc-200 dark:border-zinc-800 rounded-full focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white dark:focus:bg-zinc-900 outline-none transition-all font-semibold text-secondary dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-6 shrink-0">
            <span className="text-xs text-zinc-400 dark:text-zinc-500 font-semibold hidden lg:inline-flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-800 px-2.5 py-1 rounded-full border border-zinc-100 dark:border-zinc-800">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Phòng khám: <span className="font-bold text-primary">PhysioFlow</span>
            </span>

            {/* Actions */}
            <div className="flex items-center gap-3 border-l border-zinc-100 dark:border-zinc-800 pl-6">
              <button 
                onClick={() => {
                  const nextTheme = theme === 'dark' ? 'light' : 'dark';
                  setTheme(nextTheme);
                  localStorage.setItem('theme', nextTheme);
                  window.dispatchEvent(new Event('theme-change'));
                }}
                title={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              
              <button className="relative w-8 h-8 rounded-full flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors">
                <Bell size={18} />
                <span className="absolute top-1 right-1 size-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-zinc-900"></span>
              </button>
              <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors">
                <HelpCircle size={18} />
              </button>
            </div>

            {/* Profile Avatar Card */}
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-secondary dark:text-zinc-100">{user?.ho_ten || 'BS. Trần Văn Khám'}</p>
                <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider mt-0.5">Bác sĩ chuyên khoa</p>
              </div>
              <img 
                src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=120&h=120"
                alt="Doctor Avatar"
                className="w-9 h-9 rounded-full object-cover border border-primary/20 shadow-sm"
              />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-8 bg-background dark:bg-zinc-950 transition-colors duration-300">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
