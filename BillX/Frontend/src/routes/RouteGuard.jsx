import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export const RouteGuard = ({ allowedRoles = [], children }) => {
  const { user, token, status } = useSelector((state) => state.auth);

  // If token is missing, redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If status is loading and user is not hydrated, show loading spinner
  if (status === 'loading' && !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="w-10 h-10 text-brand-green animate-spin" />
        <span className="mt-3 text-sm text-gray-500 dark:text-gray-400 font-medium">Loading session...</span>
      </div>
    );
  }

  // If user is loaded, check permissions
  if (user) {
    const isAuthorized = allowedRoles.includes(user.role);
    if (isAuthorized) {
      return children ? children : <Outlet />;
    }

    // Role mismatch: redirect to default path according to their actual role
    if (user.role === 'CASHIER') {
      return <Navigate to="/cashier/pos" replace />;
    } else if (user.role === 'MANAGER') {
      return <Navigate to="/manager/dashboard" replace />;
    }
  }

  // Fallback to login
  return <Navigate to="/login" replace />;
};

export default RouteGuard;
