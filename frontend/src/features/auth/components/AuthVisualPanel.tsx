import { ArrowLeft, ShieldCheck, Star, Heart } from 'lucide-react';

interface AuthVisualPanelProps {
  onBack?: () => void;
  showBack?: boolean;
  backText?: string;
}

export default function AuthVisualPanel({
  onBack,
  showBack = true,
  backText = 'Trở về trang trước',
}: AuthVisualPanelProps) {
  return (
    <div className="hidden lg:flex lg:w-[65%] h-screen relative flex-col justify-between p-16 xl:p-20 z-10 overflow-hidden select-none">
      
      {/* Top Header Row */}
      <div className="flex justify-between items-start z-20">
        <div className="flex flex-col gap-3">
          {showBack && onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-[#0F172A] font-semibold transition-colors focus:outline-none w-fit"
            >
              <ArrowLeft size={13} />
              <span>{backText}</span>
            </button>
          )}
          
          <div className="font-heading font-extrabold text-2xl text-[#0F172A] flex items-center gap-2.5 tracking-tight">
            {/* Elegant brand geometry mark */}
            <div className="size-5 rounded-full border-2 border-[#10B981] flex items-center justify-center relative bg-[#10B981]/5">
              <div className="size-1.5 rounded-full bg-[#10B981] animate-pulse"></div>
            </div>
            <span className="font-bold text-xl">office<span className="text-zinc-400 font-light">care</span></span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#0D9488] bg-[#10B981]/5 px-3.5 py-1.5 rounded-full border border-[#10B981]/10">
          <ShieldCheck size={13} className="text-[#10B981]" />
          <span>Hệ thống phục hồi y khoa</span>
        </div>
      </div>

      {/* Hero Headline */}
      <div className="my-auto z-20 max-w-xl pr-10">
        <div className="text-[11px] font-bold text-[#10B981] uppercase tracking-widest mb-4">OFFICARE REHABILITATION SYSTEM</div>
        <h1 className="font-heading font-black text-5xl xl:text-6xl text-[#0F172A] tracking-tighter leading-[1.05] mb-6">
          Rebuild Movement.<br />
          <span className="bg-gradient-to-r from-[#10B981] to-[#0D9488] bg-clip-text text-transparent font-jakarta">Restore Confidence.</span>
        </h1>
        <p className="text-zinc-500 text-sm font-medium leading-relaxed max-w-sm font-sans">
          Kiến tạo hành trình phục hồi cá nhân hóa bằng công nghệ định vị lập thể cột sống và giải pháp trị liệu lượng giá tối tân.
        </p>
      </div>

      {/* Floating Holographic Visual Elements on the Right of Left Section */}
      <div className="absolute right-[5%] top-1/2 -translate-y-1/2 w-[420px] h-[550px] pointer-events-none z-10 flex items-center justify-center">
        
        <div className="relative w-full h-full flex items-center justify-center">
          
          {/* Medical Anatomical Spine SVG Hologram */}
          <svg viewBox="0 0 100 200" className="w-[85%] h-[85%] opacity-90 z-10 filter drop-shadow-[0_10px_30px_rgba(16,185,129,0.06)]">
            <circle cx="50" cy="22" r="10" fill="none" stroke="url(#spineGrad)" strokeWidth="1" strokeDasharray="2 2" />
            <circle cx="50" cy="22" r="6" fill="none" stroke="#10B981" strokeWidth="0.8" />
            <circle cx="50" cy="22" r="2.5" fill="#10B981" />
            
            {/* Torso contour mapping */}
            <path d="M22 65 C 32 46, 38 48, 50 48 C 62 48, 68 46, 78 65 C 72 85, 75 140, 68 185 L 32 185 C 25 140, 28 85, 22 65 Z" 
                  fill="none" stroke="rgba(15, 23, 42, 0.03)" strokeWidth="1.2" />
            
            <path d="M50 48 L50 185" fill="none" stroke="url(#spineGrad)" strokeWidth="2" strokeLinecap="round" />
            
            {/* Neural flow animation */}
            <path d="M50 48 L50 185" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" 
                  strokeDasharray="10 80" strokeDashoffset="10" className="animate-neural-flow" />
            <path d="M50 48 L50 185" fill="none" stroke="#0D9488" strokeWidth="2" strokeLinecap="round" 
                  strokeDasharray="15 120" strokeDashoffset="50" className="animate-neural-flow-delayed" />
            
            {/* Vertebrae joints */}
            {[48, 60, 72, 84, 96, 108, 120, 132, 144, 156, 168, 180].map((y, idx) => (
              <g key={y}>
                <circle cx="50" cy={y} r="2" fill="#F8FAFC" stroke="#10B981" strokeWidth="1.5" />
                <circle cx="50" cy={y} r="4" fill="none" stroke="#0D9488" strokeWidth="0.6" 
                        className="animate-ping" style={{ animationDuration: `${3 + idx * 0.3}s` }} />
              </g>
            ))}

            <defs>
              <linearGradient id="spineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#34D399" />
                <stop offset="50%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#0D9488" />
              </linearGradient>
            </defs>
          </svg>

          {/* Apple Health Widget 1: Progress (Circular) */}
          <div className="absolute top-[6%] left-0 bg-white/70 backdrop-blur-xl border border-zinc-200/50 rounded-2xl p-4 shadow-[0_15px_30px_rgba(15,23,42,0.04)] animate-float min-w-[150px] hover:border-zinc-300 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="relative size-10 flex items-center justify-center">
                <svg className="size-full transform -rotate-90">
                  <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(15,23,42,0.03)" strokeWidth="3" />
                  <circle cx="20" cy="20" r="16" fill="none" stroke="#10B981" strokeWidth="3" 
                          strokeDasharray="100" strokeDashoffset="6" strokeLinecap="round" className="filter drop-shadow-[0_0_3px_rgba(16,185,129,0.3)]" />
                </svg>
                <span className="absolute text-[10px] font-bold text-[#0F172A]">94%</span>
              </div>
              <div>
                <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider font-sans">Tiến trình</p>
                <p className="text-xs font-bold text-[#0F172A]">Hồi Phục</p>
              </div>
            </div>
          </div>

          {/* Apple Health Widget 2: Rating (Stars) */}
          <div className="absolute bottom-[28%] -right-4 bg-white/70 backdrop-blur-xl border border-zinc-200/50 rounded-2xl p-4 shadow-[0_15px_30px_rgba(15,23,42,0.04)] animate-float stagger-delay-3 min-w-[160px] hover:border-zinc-300 transition-all duration-300">
            <div className="flex items-center gap-3 mb-1.5">
              <div className="size-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 filter drop-shadow-[0_0_3px_rgba(245,158,11,0.25)]">
                <Star size={16} fill="currentColor" />
              </div>
              <div>
                <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider font-sans">Đánh giá</p>
                <p className="text-xs font-bold text-[#0F172A]">4.9 ★ Quốc Tế</p>
              </div>
            </div>
            <p className="text-[10px] text-zinc-500 font-medium font-sans">100% hài lòng</p>
          </div>

          {/* Apple Health Widget 3: Successful Therapy wave */}
          <div className="absolute bottom-[4%] left-6 bg-white/70 backdrop-blur-xl border border-zinc-200/50 rounded-2xl p-4 shadow-[0_15px_30px_rgba(15,23,42,0.04)] animate-float stagger-delay-6 min-w-[180px] hover:border-zinc-300 transition-all duration-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="size-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-[#10B981] filter drop-shadow-[0_0_3px_rgba(16,185,129,0.25)]">
                <Heart size={16} fill="currentColor" />
              </div>
              <div>
                <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider font-sans">Trị liệu</p>
                <p className="text-xs font-bold text-[#0F172A]">12,000+ Ca</p>
              </div>
            </div>
            <svg viewBox="0 0 100 20" className="w-full h-5 stroke-[#10B981] opacity-80 filter drop-shadow-[0_0_2px_rgba(16,185,129,0.2)]">
              <path d="M0 10 L30 10 L34 2 L38 18 L42 8 L46 12 L50 10 L100 10" fill="none" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

        </div>
      </div>

      {/* Minimal Bottom Footer */}
      <div className="text-zinc-400 text-xs font-medium z-20 font-sans">
        © 2026 OfficeCare Inc. All rights reserved.
      </div>

      <style>{`
        @keyframes neural-flow {
          0% { stroke-dashoffset: 200; }
          100% { stroke-dashoffset: 0; }
        }
        .animate-neural-flow {
          animation: neural-flow 3.5s linear infinite;
        }
        .animate-neural-flow-delayed {
          animation: neural-flow 4.5s linear infinite;
          animation-delay: 2.2s;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(1deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .stagger-delay-3 {
          animation-delay: 1.8s;
        }
        .stagger-delay-6 {
          animation-delay: 3.5s;
        }
        .duration-7000 {
          animation-duration: 7s;
        }
        .duration-10000 {
          animation-duration: 10s;
        }
      `}</style>
      
    </div>
  );
}
