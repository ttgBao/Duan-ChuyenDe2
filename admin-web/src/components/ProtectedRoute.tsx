import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const token = localStorage.getItem('admin_token');
  const userString = localStorage.getItem('admin_user');
  const location = useLocation();

  if (!token || !userString) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  try {
    const user = JSON.parse(userString);
    // roleId 1 is admin based on admin.guard.ts check: Number(user.roleId) === 1
    // We also support 'admin' role name just in case
    const isUserAdmin = Number(user.roleId) === 1 || user.role === 'admin' || user.role === 'Admin';
    if (!isUserAdmin) {
      // Clear storage if not admin to prevent loop
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      return <Navigate to="/login" state={{ error: 'Chỉ Admin mới có quyền truy cập' }} replace />;
    }
  } catch (e) {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
