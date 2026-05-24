import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

interface ProtectedRouteProps {
  allowedRoles?: number[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuthStore((state) => state);

  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (location.pathname === '/dashboard' && user) {
    const roleId = Number(user.vai_tro_id);
    if (roleId === 5) {
      console.log('ProtectedRoute: Redirecting Admin from /dashboard to /admin');
      return <Navigate to="/admin" replace />;
    }
    if (roleId === 2) {
      console.log('ProtectedRoute: Redirecting Receptionist from /dashboard to /receptionist');
      return <Navigate to="/receptionist" replace />;
    }
    if (roleId === 3) {
      console.log('ProtectedRoute: Redirecting Technician from /dashboard to /technician/workspace');
      return <Navigate to="/technician/workspace" replace />;
    }
  }


  if (allowedRoles && user && !allowedRoles.map(Number).includes(Number(user.vai_tro_id))) {
    console.log('ProtectedRoute: Access denied. User role:', user.vai_tro_id, 'Allowed roles:', allowedRoles);
    return <Navigate to="/dashboard" replace />;
  }


  console.log('ProtectedRoute: Access granted. User role:', user?.vai_tro_id, 'Path:', location.pathname);
  return <Outlet />;
};

