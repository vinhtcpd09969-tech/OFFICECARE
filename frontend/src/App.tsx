import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ProtectedRoute from './layouts/ProtectedRoute';
import { useAuthStore } from './stores/useAuthStore';

function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
          <span className="text-3xl font-bold text-blue-600">{user?.ho_ten?.charAt(0)}</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Chào mừng trở lại!</h1>
          <p className="text-slate-500 mt-2">{user?.ho_ten} ({user?.email})</p>
          <p className="text-sm text-blue-600 mt-1 font-medium">Vai trò ID: {user?.vai_tro_id}</p>
        </div>
        <button 
          onClick={logout}
          className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl transition-colors shadow-lg"
        >
          Đăng xuất
        </button>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
