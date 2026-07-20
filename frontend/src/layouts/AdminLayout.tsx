import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useState, useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { MascotWidget } from '../components/MascotWidget';
import { isAwaitingPaymentForList } from '../utils/billing';
import { 
  LayoutDashboard, 
  Calendar, 
  Clock, 
  User, 
  FileText, 
  Users, 
  Package, 
  Key, 
  DollarSign, 
  Megaphone, 
  Star, 
  LogOut,
  HelpCircle,
  Sun,
  Moon,
  Cpu,
  Settings,
  Newspaper
} from 'lucide-react';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore(state => state.logout);
  const user = useAuthStore(state => state.user);
  
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  // State và Effect cho thông báo gán Bác sĩ & KTV (Alarm & Bouncing notification)
  const [pendingAppointmentsCount, setPendingAppointmentsCount] = useState<number>(0);
  const [pendingTreatmentsCount, setPendingTreatmentsCount] = useState<number>(0);
  const [earliestPending, setEarliestPending] = useState<{ id: string, type: 'appointment' | 'treatment', ngay_gio_bat_dau: string } | null>(null);
  const [activeRoleView, setActiveRoleView] = useState(
    localStorage.getItem('admin-test-role-view') || 'manager'
  );

  const [activeCheckIn, setActiveCheckIn] = useState<any>(null);

  // State cho Lễ tân (role 2) để phát hiện ca chưa xác nhận cần liên hệ, quá giờ check-in, và cần thanh toán
  const [pendingContactCount, setPendingContactCount] = useState<number>(0);
  const [earliestPendingId, setEarliestPendingId] = useState<string | null>(null);
  const [earliestPendingDate, setEarliestPendingDate] = useState<string | null>(null);

  const [overdueCheckinCount, setOverdueCheckinCount] = useState<number>(0);
  const [earliestOverdueId, setEarliestOverdueId] = useState<string | null>(null);
  const [earliestOverdueDate, setEarliestOverdueDate] = useState<string | null>(null);

  const [pendingPaymentCount, setPendingPaymentCount] = useState<number>(0);
  const [earliestPaymentId, setEarliestPaymentId] = useState<string | null>(null);
  const [earliestPaymentDate, setEarliestPaymentDate] = useState<string | null>(null);

  const seenCheckedInIds = useRef<Set<string>>(new Set());
  const seenUnconfirmedIds = useRef<Set<string>>(new Set());
  const seenOverdueIds = useRef<Set<string>>(new Set());
  const seenPaymentIds = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);

  // Sound chime notifier for receptionist
  const playNotificationSound = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const play = () => {
        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(1046.50, now);
        gain1.gain.setValueAtTime(0.12, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.4);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1567.98, now + 0.12);
        gain2.gain.setValueAtTime(0.12, now + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.12);
        osc2.stop(now + 0.65);
      };

      if (ctx.state === 'suspended') {
        ctx.resume().then(play).catch(e => console.warn(e));
      } else {
        play();
      }
    } catch (e) {
      console.warn('AudioContext playback failed:', e);
    }
  }, []);

  useEffect(() => {
    if (!user || Number(user.vai_tro_id) !== 2) return;

    const fetchPending = async () => {
      try {
        const res = await api.get('/admin/appointments');
        const appointments = res.data || [];

        // 1. Pending Contact (Lịch cần liên hệ)
        const graceTimeMs = 10 * 60 * 1000;
        const pendingApts = appointments.filter((apt: any) => {
          const createdAt = apt.thoi_gian_tao ? new Date(apt.thoi_gian_tao).getTime() : 0;
          const isGracePassed = createdAt > 0 && (createdAt + graceTimeMs <= Date.now());
          return apt.trang_thai === 'chua_xac_nhan' && isGracePassed;
        });
        setPendingContactCount(pendingApts.length);
        if (pendingApts.length > 0) {
          pendingApts.sort((a: any, b: any) => new Date(a.ngay_gio_bat_dau || '').getTime() - new Date(b.ngay_gio_bat_dau || '').getTime());
          setEarliestPendingId(pendingApts[0].id);
          const targetDate = pendingApts[0].ngay_gio_bat_dau ? pendingApts[0].ngay_gio_bat_dau.match(/^\d{4}-\d{2}-\d{2}/)?.[0] || '' : '';
          setEarliestPendingDate(targetDate);
        } else {
          setEarliestPendingId(null);
          setEarliestPendingDate(null);
        }

        // 2. Overdue Check-in (Quá giờ chưa check-in)
        const now = new Date();
        const todayStr = now.toDateString();
        const overdueApts = appointments.filter((apt: any) => {
          if (!['da_xac_nhan', 'cho_xac_nhan'].includes(apt.trang_thai)) {
            return false;
          }
          const start = new Date(apt.ngay_gio_bat_dau);
          const isToday = start.toDateString() === todayStr;
          return isToday && start.getTime() <= now.getTime();
        });
        setOverdueCheckinCount(overdueApts.length);
        if (overdueApts.length > 0) {
          overdueApts.sort((a: any, b: any) => new Date(a.ngay_gio_bat_dau || '').getTime() - new Date(b.ngay_gio_bat_dau || '').getTime());
          setEarliestOverdueId(overdueApts[0].id);
          const targetDate = overdueApts[0].ngay_gio_bat_dau ? overdueApts[0].ngay_gio_bat_dau.match(/^\d{4}-\d{2}-\d{2}/)?.[0] || '' : '';
          setEarliestOverdueDate(targetDate);
        } else {
          setEarliestOverdueId(null);
          setEarliestOverdueDate(null);
        }

        // 3. Pending Payment (Cần thanh toán)
        const paymentApts = appointments.filter(isAwaitingPaymentForList);
        setPendingPaymentCount(paymentApts.length);
        if (paymentApts.length > 0) {
          paymentApts.sort((a: any, b: any) => new Date(a.ngay_gio_bat_dau || '').getTime() - new Date(b.ngay_gio_bat_dau || '').getTime());
          setEarliestPaymentId(paymentApts[0].id);
          const targetDate = paymentApts[0].ngay_gio_bat_dau ? paymentApts[0].ngay_gio_bat_dau.match(/^\d{4}-\d{2}-\d{2}/)?.[0] || '' : '';
          setEarliestPaymentDate(targetDate);
        } else {
          setEarliestPaymentId(null);
          setEarliestPaymentDate(null);
        }

        // 4. Check-in notifications
        const checkedInApts = appointments.filter((apt: any) => apt.trang_thai === 'da_checkin');

        // Trigger notifications & sounds
        if (isFirstLoad.current) {
          pendingApts.forEach((apt: any) => seenUnconfirmedIds.current.add(String(apt.id)));
          overdueApts.forEach((apt: any) => seenOverdueIds.current.add(String(apt.id)));
          paymentApts.forEach((apt: any) => seenPaymentIds.current.add(String(apt.id)));
          checkedInApts.forEach((apt: any) => seenCheckedInIds.current.add(String(apt.id)));
          isFirstLoad.current = false;
        } else {
          let hasNewEvent = false;

          pendingApts.forEach((apt: any) => {
            const id = String(apt.id);
            if (!seenUnconfirmedIds.current.has(id)) {
              seenUnconfirmedIds.current.add(id);
              hasNewEvent = true;
              const name = apt.ten_khach_hang || 'Khách hàng';
              toast(`📞 Ca khám mới chờ liên hệ: ${name}`, {
                icon: '☎️',
                duration: 8000,
                style: { borderRadius: '16px', background: '#f59e0b', color: '#fff', fontWeight: 'bold' }
              });
            }
          });

          overdueApts.forEach((apt: any) => {
            const id = String(apt.id);
            if (!seenOverdueIds.current.has(id)) {
              seenOverdueIds.current.add(id);
              hasNewEvent = true;
              const name = apt.ten_khach_hang || 'Khách hàng';
              toast(`⏰ Lịch hẹn quá giờ chưa check-in: ${name}`, {
                icon: '⏰',
                duration: 8000,
                style: { borderRadius: '16px', background: '#e11d48', color: '#fff', fontWeight: 'bold' }
              });
            }
          });

          paymentApts.forEach((apt: any) => {
            const id = String(apt.id);
            if (!seenPaymentIds.current.has(id)) {
              seenPaymentIds.current.add(id);
              hasNewEvent = true;
              const name = apt.ten_khach_hang || 'Khách hàng';
              toast(`💵 Ca khám mới cần thanh toán: ${name}`, {
                icon: '💰',
                duration: 8000,
                style: { borderRadius: '16px', background: '#0d9488', color: '#fff', fontWeight: 'bold' }
              });
            }
          });

          checkedInApts.forEach((apt: any) => {
            const id = String(apt.id);
            if (!seenCheckedInIds.current.has(id)) {
              seenCheckedInIds.current.add(id);
              hasNewEvent = true;
              const name = apt.ten_khach_hang || 'Khách hàng';
              toast(`🎉 Bệnh nhân mới vừa check-in: ${name}`, {
                icon: '👏',
                duration: 8000,
                style: { borderRadius: '16px', background: '#0d9488', color: '#fff', fontWeight: 'bold' }
              });
            }
          });

          const totalCount = pendingApts.length + overdueApts.length + paymentApts.length;
          if (hasNewEvent || totalCount > 0) {
            playNotificationSound();
          }
        }

      } catch (err) {
        console.error('Lỗi khi tải dữ liệu Lễ tân:', err);
      }
    };

    fetchPending();
    const interval = setInterval(fetchPending, 10000);
    return () => clearInterval(interval);
  }, [user, playNotificationSound]);

  // Auto-acknowledge KTV/Doctor when they open the assess page
  useEffect(() => {
    const match = location.pathname.match(/\/(technician|doctor)\/appointments\/([a-f\d-]+)\/assess/);
    if (match && match[2]) {
      const aptId = match[2];
      const ackStr = localStorage.getItem('ack-checkins') || '[]';
      try {
        const acks = JSON.parse(ackStr);
        if (!acks.includes(aptId)) {
          acks.push(aptId);
          localStorage.setItem('ack-checkins', JSON.stringify(acks));
        }
      } catch (e) {
        localStorage.setItem('ack-checkins', JSON.stringify([aptId]));
      }
      if (activeCheckIn && activeCheckIn.id === aptId) {
        setActiveCheckIn(null);
      }
    }
  }, [location.pathname, activeCheckIn]);

  // Poll queue for KTV (role 3) or Doctor (role 4) checked-in appointments and play alert sound
  useEffect(() => {
    if (!user || (Number(user.vai_tro_id) !== 3 && Number(user.vai_tro_id) !== 4)) return;

    const checkQueue = async () => {
      try {
        const endpoint = Number(user.vai_tro_id) === 4 ? '/doctor/queue' : '/technician/queue';
        const res = await api.get(endpoint);
        const checkedInApts = res.data.filter((apt: any) => 
          (apt.trang_thai === 'da_checkin' || apt.trang_thai === 'check_in' || apt.trang_thai === 'cho_kham')
        );

        if (checkedInApts.length > 0) {
          const ackStr = localStorage.getItem('ack-checkins') || '[]';
          let acks = [];
          try { acks = JSON.parse(ackStr); } catch(e) {}

          const unack = checkedInApts.find((apt: any) => !acks.includes(String(apt.id)));
          if (unack) {
            setActiveCheckIn(unack);
            
            // Play notification chime
            try {
              const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
              if (AudioContextClass) {
                const ctx = new AudioContextClass();
                const now = ctx.currentTime;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, now);
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.35);
              }
            } catch (soundErr) {
              console.error('Quiet beep failed:', soundErr);
            }
            return;
          }
        }
        setActiveCheckIn(null);
      } catch (err) {
        console.error('Error fetching queue for notifications:', err);
      }
    };

    checkQueue();
    const timer = setInterval(checkQueue, 6000);
    return () => clearInterval(timer);
  }, [location.pathname, user]);

  const pendingAssignCount = pendingAppointmentsCount + pendingTreatmentsCount;

  let tooltipText = "Thông báo";
  if (pendingAppointmentsCount > 0 && pendingTreatmentsCount > 0) {
    tooltipText = `Có ${pendingAppointmentsCount} lịch khám & ${pendingTreatmentsCount} lịch điều trị chưa gán nhân sự!`;
  } else if (pendingAppointmentsCount > 0) {
    tooltipText = `Có ${pendingAppointmentsCount} lịch khám chưa gán Bác sĩ!`;
  } else if (pendingTreatmentsCount > 0) {
    tooltipText = `Có ${pendingTreatmentsCount} lịch điều trị chưa gán KTV!`;
  }

  useEffect(() => {
    const handleRoleViewChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      setActiveRoleView(customEvent.detail || localStorage.getItem('admin-test-role-view') || 'manager');
    };
    window.addEventListener('admin-test-role-view-change', handleRoleViewChange);
    return () => window.removeEventListener('admin-test-role-view-change', handleRoleViewChange);
  }, []);

  useEffect(() => {
    const isManagerOrAdmin = user?.vai_tro_id === 5 || user?.vai_tro_id === 6;
    if (!isManagerOrAdmin) {
      setPendingAppointmentsCount(0);
      setPendingTreatmentsCount(0);
      setEarliestPending(null);
      return;
    }

    const fetchPendingCount = async () => {
      try {
        const res = await api.get('/admin/analytics/summary');
        setPendingAppointmentsCount(Number(res.data.pending_appointments_need_assign || 0));
        setPendingTreatmentsCount(Number(res.data.pending_treatments || 0));
        setEarliestPending(res.data.earliest_pending || null);
      } catch (err) {
        console.error('Lỗi lấy số lượng lịch chờ gán:', err);
      }
    };

    fetchPendingCount();

    // Poll every 10 seconds to detect new bookings immediately
    const interval = setInterval(fetchPendingCount, 10000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const isManagerOrAdmin = user?.vai_tro_id === 5 || user?.vai_tro_id === 6;
    if (!isManagerOrAdmin || activeRoleView !== 'manager' || pendingAssignCount <= 0) return;

    const playAlarmSound = () => {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const now = ctx.currentTime;

        // Soft, professional double-chime (bell-like sound)
        const playChime = (freq: number, startTime: number, duration: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, startTime);
          
          // Gentle attack and exponential decay to avoid clicky sounds
          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(0.04, startTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(startTime);
          osc.stop(startTime + duration + 0.05);
        };

        // Play gentle major interval chime (C5 then E5)
        playChime(523.25, now, 0.4);        // C5 (523.25 Hz)
        playChime(659.25, now + 0.12, 0.4); // E5 (659.25 Hz)
      } catch (e) {
        console.error('Audio context alarm error:', e);
      }
    };

    playAlarmSound();

    // Repeat alarm beep every 4 seconds
    const soundInterval = setInterval(playAlarmSound, 4000);
    return () => clearInterval(soundInterval);
  }, [pendingAssignCount, user, activeRoleView]);

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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isDoctor = Number(user?.vai_tro_id) === 4;
  const isTechnician = Number(user?.vai_tro_id) === 3;
  const isReceptionist = Number(user?.vai_tro_id) === 2;

  const rawNavItems = [
    {
      name: 'Tổng quan',
      path: '/admin',
      icon: <LayoutDashboard size={18} />,
      roles: [5, 6]
    },
    { 
      name: 'Lịch hẹn', 
      path: isDoctor 
        ? '/doctor/appointments' 
        : (isReceptionist 
          ? '/receptionist/appointments' 
          : (isTechnician 
            ? '/technician/appointments' 
            : '/admin/appointments')), 
      icon: <Calendar size={18} />,
      roles: [2, 3, 4, 5, 6]
    },
    { name: 'Ca làm việc', path: '/admin/schedules', icon: <Clock size={18} />, roles: [5, 6] },
    { 
      name: 'Lịch trực cá nhân', 
      path: isReceptionist 
        ? '/receptionist/schedules' 
        : (isDoctor 
          ? '/doctor/schedules' 
          : '/technician/schedules'), 
      icon: <Clock size={18} />, 
      roles: [2, 3, 4] 
    },
    { 
      name: 'Khách hàng', 
      path: '/admin/customers', 
      icon: <User size={18} />,
      roles: [5, 6]
    },
    { 
      name: 'Hồ sơ điều trị', 
      path: isTechnician 
        ? '/technician/medical-records' 
        : (isDoctor 
          ? '/doctor/medical-records' 
          : '/admin/medical-records'), 
      icon: <FileText size={18} />,
      roles: [3, 4]
    },
    {
      name: 'Hóa đơn & Thanh toán',
      path: '/receptionist/billing',
      icon: <DollarSign size={18} />,
      roles: [2]
    },
    {
      name: 'Cài đặt tài khoản', 
      path: isReceptionist 
        ? '/receptionist/settings' 
        : (isDoctor 
          ? '/doctor/settings' 
          : (isTechnician 
            ? '/technician/settings' 
            : '/admin/settings')), 
      icon: <Settings size={18} />, 
      roles: [2, 3, 4, 5, 6] 
    },
    { name: 'Nhân sự', path: '/admin/staff', icon: <Users size={18} />, roles: [5] },
    { name: 'Gói Dịch Vụ', path: '/admin/packages', icon: <Package size={18} />, roles: [5, 6] },
    { name: 'Phòng trị liệu', path: '/admin/rooms', icon: <Key size={18} />, roles: [5, 6] },
    { name: 'Thiết bị y tế', path: '/admin/equipment', icon: <Cpu size={18} />, roles: [5, 6] },
    { name: 'Tài chính', path: '/admin/finance', icon: <DollarSign size={18} />, roles: [5, 6] },
    { name: 'Marketing', path: '/admin/marketing', icon: <Megaphone size={18} />, roles: [5, 6] },
    { name: 'Bài viết', path: '/admin/articles', icon: <Newspaper size={18} />, roles: [5, 6] },
    { name: 'Đánh giá', path: '/admin/feedback', icon: <Star size={18} />, roles: [5, 6] },
  ];

  const navItems = rawNavItems.filter(item => item.roles.includes(user?.vai_tro_id || 5));

  const currentItem = navItems.find(item => item.path === location.pathname || (item.path !== '/admin' && item.path !== '/receptionist' && item.path !== '/doctor' && location.pathname.startsWith(item.path + '/')));

  return (
    <div className="h-screen overflow-hidden bg-background dark:bg-zinc-950 flex font-body text-secondary dark:text-zinc-100 transition-colors duration-300">
      {/* Sidebar - Soft UI Light & Dark Theme */}
      <aside className="w-64 bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 flex flex-col shrink-0 border-r border-zinc-100 dark:border-zinc-800 shadow-sm z-30 transition-colors duration-300">
        <div className="h-16 flex items-center gap-3 px-6 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-colors duration-300">
          <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <span className="text-primary font-bold text-sm">🏥</span>
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-secondary dark:text-zinc-100 tracking-tight flex items-center gap-1.5">
              OFFICE CARE <span className="text-primary font-bold text-[9px] bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">2026</span>
            </h1>
            <p className="text-[8px] text-zinc-400 dark:text-zinc-500 font-extrabold tracking-widest uppercase mt-0.5">Phục hồi chức năng</p>
          </div>
        </div>
        
        <nav className="flex-1 py-4 overflow-y-auto pr-1 scrollbar-thin">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/admin' && item.path !== '/receptionist' && item.path !== '/doctor' && location.pathname.startsWith(item.path + '/'));
              return (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-[14px] transition-all duration-200 group border-l-4 ${
                      isActive 
                        ? 'bg-primary/5 dark:bg-primary/10 text-primary font-bold border-primary shadow-sm' 
                        : 'border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-secondary dark:hover:text-zinc-100'
                    }`}
                  >
                    <div className="flex items-center">
                      <span className={`mr-3 transition-transform group-hover:scale-110 duration-200 ${isActive ? 'text-primary' : 'text-zinc-400 dark:text-zinc-500 group-hover:text-secondary dark:group-hover:text-zinc-100'}`}>
                        {item.icon}
                      </span>
                      <span className="text-[11px] font-bold tracking-wide uppercase">{item.name}</span>
                    </div>
                    {item.path === '/receptionist/appointments' && pendingContactCount > 0 && (
                      <span className="animate-bounce inline-flex items-center justify-center w-5 h-5 text-[9px] font-black text-white bg-rose-500 rounded-full border border-rose-455">
                        {pendingContactCount}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-colors duration-300">
          <div className="flex items-center gap-3 mb-4">
            <img 
              src={user?.anh_dai_dien || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.ho_ten || 'Staff')}&backgroundType=gradientLinear&fontSize=45`} 
              alt="Avatar" 
              className="size-10 rounded-full object-cover border border-primary/20 shadow-inner shrink-0" 
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-secondary dark:text-zinc-100 truncate">{user?.ho_ten || user?.email || 'admin@officecare.com'}</p>
              <p className="text-[9px] text-zinc-400 dark:text-zinc-550 font-bold uppercase tracking-wider mt-0.5">
                {user?.vai_tro_id === 4 ? 'Bác sĩ chuyên khoa' : user?.vai_tro_id === 3 ? 'Kỹ thuật viên' : user?.vai_tro_id === 2 ? 'Lễ tân' : user?.vai_tro_id === 6 ? 'Quản lý' : 'Quản trị viên'}
              </p>
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
        {/* Top Header - Premium Design with Actions */}
        <header className="h-16 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between px-8 shrink-0 z-20 sticky top-0 transition-colors duration-300">
          <div className="flex items-center gap-6 flex-1 min-w-0">
            <h2 className="text-sm font-extrabold text-secondary dark:text-zinc-100 tracking-tight shrink-0">
              {currentItem?.name || 'Tổng quan'}
            </h2>
          </div>

          <div className="flex items-center gap-6 shrink-0">
            {/* Actions: Notification, Theme Toggle, & Help */}
            <div className="flex items-center gap-3 border-l border-zinc-100 dark:border-zinc-800 pl-6">
              {activeCheckIn && (
                <button
                  onClick={() => {
                    // Không tự ack ở đây nữa — chỉ điều hướng tới trang Lịch hẹn kèm ca cần mở, để
                    // modal "Xác nhận vào ca" có sẵn ở đó tự bật lên; ack thật sự xảy ra khi vào
                    // /assess (effect bên dưới), nên nếu Lễ tân/BS/KTV bấm Hủy ở modal thì banner
                    // này vẫn còn nguyên, không bị im lặng mất tiêu.
                    const listPath = Number(user?.vai_tro_id) === 4 ? '/doctor/appointments' : '/technician/appointments';
                    navigate(listPath, { state: { pendingConfirmAppointment: activeCheckIn } });
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider animate-bounce shadow-md mr-2"
                >
                  <span className="size-2 rounded-full bg-white animate-ping"></span>
                  {Number(user?.vai_tro_id) === 4 ? '🔔 Bắt đầu ngay!' : '🔔 Bắt đầu ngay!'}
                </button>
              )}

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
              
              {/* Old alarm bell button removed to avoid duplicates */}
              <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors">
                <HelpCircle size={18} />
              </button>
            </div>
 
            {/* Profile Avatar Card */}
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-secondary dark:text-zinc-100">{user?.ho_ten || 'Admin Physio'}</p>
                <p className="text-[9px] text-zinc-400 dark:text-zinc-555 font-bold uppercase tracking-wider mt-0.5">
                  {user?.vai_tro_id === 4 ? 'Bác sĩ' : user?.vai_tro_id === 3 ? 'Kỹ thuật viên' : user?.vai_tro_id === 2 ? 'Lễ tân' : user?.vai_tro_id === 6 ? 'Quản lý' : 'Quản trị viên'}
                </p>
              </div>
              <img 
                src={user?.anh_dai_dien || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.ho_ten || 'Staff')}&backgroundType=gradientLinear&fontSize=45`}
                alt="Admin Avatar"
                className="w-9 h-9 rounded-full object-cover border border-primary/20 shadow-sm"
              />
            </div>
          </div>
        </header>
 
        {/* Content Area */}
        <div className="flex-1 overflow-auto p-8 bg-background dark:bg-zinc-950 transition-colors duration-300">
          <div className="max-w-7xl mx-auto">
            {activeCheckIn && (
              <div className="mb-6 p-4 bg-gradient-to-r from-rose-500 to-red-600 text-white rounded-2xl shadow-xl flex items-center justify-between gap-4 animate-bounce border border-rose-400/20">
                <div className="flex items-center gap-3 text-left">
                  <span className="text-2xl animate-spin shrink-0">🔔</span>
                  <div>
                    <p className="text-sm font-black uppercase tracking-wider">
                      {Number(user?.vai_tro_id) === 4 
                        ? 'CÓ CA KHÁM MỚI CHECK-IN CHƯA VÀO PHÒNG KHÁM!' 
                        : 'CÓ CA TRỊ LIỆU MỚI CHECK-IN CHƯA VÀO PHÒNG TRỊ LIỆU!'}
                    </p>
                    <p className="text-xs font-bold opacity-90 mt-0.5">
                      Bệnh nhân: <span className="underline font-black">{activeCheckIn.ho_ten_khach || activeCheckIn.ten_khach_hang}</span> | Mã ca: {activeCheckIn.ma_lich_dat} | Khung giờ: {format(new Date(activeCheckIn.ngay_gio_bat_dau), 'HH:mm')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    // Cùng lý do như nút thu gọn ở header: không ack ngay, chỉ điều hướng kèm ca cần
                    // mở để modal xác nhận có sẵn ở trang Lịch hẹn tự bật lên trước khi vào bàn khám.
                    const listPath = Number(user?.vai_tro_id) === 4 ? '/doctor/appointments' : '/technician/appointments';
                    navigate(listPath, { state: { pendingConfirmAppointment: activeCheckIn } });
                  }}
                  className="bg-white text-rose-600 hover:bg-rose-50 px-4 py-2 rounded-xl text-xs font-black transition-colors uppercase tracking-widest shrink-0 shadow-md animate-pulse"
                >
                  Bắt đầu ngay ➜
                </button>
              </div>
            )}
            <Outlet />
          </div>
        </div>
      </main>
 
      {/* Floating Mascot Widget for all Admin/Manager pages */}
      {(Number(user?.vai_tro_id) === 5 || Number(user?.vai_tro_id) === 6) && (
        <MascotWidget
          count={pendingAssignCount}
          onClick={() => {
            if (earliestPending) {
              const targetDate = earliestPending.ngay_gio_bat_dau ? earliestPending.ngay_gio_bat_dau.match(/^\d{4}-\d{2}-\d{2}/)?.[0] || '' : '';
              const query = targetDate 
                ? `?date=${targetDate}&range=today&view=timeline&appointmentId=${earliestPending.id}&triggerFocus=true` 
                : `?appointmentId=${earliestPending.id}&triggerFocus=true`;
              navigate(`/admin/appointments${query}`);
            } else {
              navigate('/admin/appointments?triggerFocus=true');
            }
          }}
          tooltipText={tooltipText}
          badgeColor="emerald"
        />
      )}

      {/* Floating Mascot Widget for Receptionist */}
      {Number(user?.vai_tro_id) === 2 && (() => {
        const totalCount = pendingContactCount + overdueCheckinCount + pendingPaymentCount;
        if (totalCount <= 0) return null;

        let mascotTooltip = '';
        let mascotBadgeColor: 'rose' | 'emerald' | 'amber' = 'rose';
        let mascotOnClick = () => {};

        if (pendingContactCount > 0) {
          mascotTooltip = `Có ${pendingContactCount} ca khám chưa xác nhận quá 10 phút cần liên hệ!`;
          mascotBadgeColor = 'rose';
          mascotOnClick = () => {
            if (earliestPendingId && earliestPendingDate) {
              navigate(`/receptionist/appointments?date=${earliestPendingDate}&range=today&view=timeline&appointmentId=${earliestPendingId}&triggerFocus=true`);
            } else {
              navigate('/receptionist/appointments?triggerFocus=true');
            }
          };
        } else if (overdueCheckinCount > 0) {
          mascotTooltip = `Có ${overdueCheckinCount} ca quá giờ chưa check-in!`;
          mascotBadgeColor = 'rose';
          mascotOnClick = () => {
            if (earliestOverdueId && earliestOverdueDate) {
              navigate(`/receptionist/appointments?date=${earliestOverdueDate}&range=today&view=timeline&appointmentId=${earliestOverdueId}&triggerFocus=true`);
            } else {
              navigate('/receptionist/appointments?triggerFocus=true');
            }
          };
        } else if (pendingPaymentCount > 0) {
          mascotTooltip = `Có ${pendingPaymentCount} ca hẹn cần thanh toán!`;
          mascotBadgeColor = 'amber';
          mascotOnClick = () => {
            // Điều hướng tới ĐÚNG lịch hẹn đó để lễ tân tự xem & chọn cách thu tiền phù hợp (khám lẻ
            // hay đợt 2 của gói) — KHÔNG nhảy thẳng vào /receptionist/billing, vì cách đó luôn tự tạo
            // 1 hóa đơn khám mới bất kể ca đó thực chất đang nợ đợt 2 của gói (hóa đơn đã có sẵn).
            if (earliestPaymentId && earliestPaymentDate) {
              navigate(`/receptionist/appointments?date=${earliestPaymentDate}&range=today&view=timeline&appointmentId=${earliestPaymentId}&triggerFocus=true`);
            } else {
              navigate('/receptionist/appointments?triggerFocus=true');
            }
          };
        }

        return (
          <MascotWidget
            count={totalCount}
            onClick={mascotOnClick}
            tooltipText={mascotTooltip}
            badgeColor={mascotBadgeColor}
          />
        );
      })()}
    </div>
  );
}
