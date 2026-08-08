import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function ProtectedRoute({ roles, loginPath = '/login' }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-navy">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={loginPath} replace state={{ from: location.pathname }} />;
  }

  const role = user?.role === 'dealer' ? 'corporate' : user?.role;

  if (roles && !roles.includes(role) && !(roles.includes('corporate') && role === 'dealer')) {
    const redirect =
      role === 'admin' ? '/admin' : role === 'corporate' || role === 'customer' ? '/account' : '/';
    return <Navigate to={redirect} replace />;
  }

  return <Outlet />;
}
