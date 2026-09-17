import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { Role } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-25">
        <div className="h-6 w-6 border-2 border-neutral-200 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    if (allowedRoles?.includes('customer')) {
      return <Navigate to="/customer/login" replace />;
    }
    if (allowedRoles?.includes('admin')) {
      return <Navigate to="/admin/login" replace />;
    }
    if (allowedRoles?.includes('waiter')) {
      return <Navigate to="/waiter/login" replace />;
    }
    if (allowedRoles?.includes('cook')) {
      return <Navigate to="/cook/login" replace />;
    }
    return <Navigate to="/manager/login" replace />;
  }

  // Role authorization check
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    if (user.role === 'manager') {
      return <Navigate to="/manager/dashboard" replace />;
    }
    if (user.role === 'waiter') {
      return <Navigate to="/waiter/dashboard" replace />;
    }
    if (user.role === 'cook') {
      return <Navigate to="/cook/dashboard" replace />;
    }
    if (user.role === 'customer') {
      return <Navigate to="/customer/dashboard" replace />;
    }
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
