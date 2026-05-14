import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../stores/useAuthStore';
import { Activity, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('admin@physioflow.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { data } = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password,
      });

      setAuth(data.user, data.accessToken, data.refreshToken);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80')] opacity-10 mix-blend-overlay bg-cover bg-center"></div>
      
      <div className="relative w-full max-w-md p-8 bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-400 to-blue-500"></div>
        
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/20 text-cyan-400 mb-6 ring-1 ring-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.3)]">
            <Activity size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">PhysioFlow</h1>
          <p className="text-blue-200 mt-2 text-sm font-medium">Hệ thống quản lý vật lý trị liệu</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/50 text-red-200 text-sm flex items-center text-center justify-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-1">
            <label className="text-sm font-medium text-blue-200 ml-1">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-blue-400">
                <Mail size={18} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-900/50 border border-blue-500/30 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-white placeholder-blue-300/30 transition-all outline-none"
                placeholder="Nhập email của bạn"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-blue-200 ml-1">Mật khẩu</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-blue-400">
                <Lock size={18} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-900/50 border border-blue-500/30 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-white placeholder-blue-300/30 transition-all outline-none"
                placeholder="Nhập mật khẩu"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-400 focus:ring-offset-slate-900 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] transition-all disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
          >
            <span className="absolute inset-0 w-full h-full bg-white/20 group-hover:scale-x-100 scale-x-0 origin-left transition-transform duration-300 ease-out"></span>
            <span className="relative flex items-center">
              {isLoading ? (
                <Loader2 className="animate-spin -ml-1 mr-2" size={18} />
              ) : null}
              {isLoading ? 'Đang xác thực...' : 'Đăng nhập'}
              {!isLoading && <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />}
            </span>
          </button>
        </form>
        
        <div className="mt-8 text-center">
          <p className="text-xs text-blue-300/50">Bảo mật bởi PhysioFlow Enterprise</p>
        </div>
      </div>
    </div>
  );
}
