import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowRight, Loader2 } from 'lucide-react';

/**
 * ProtectedRoute Guard
 * @param {Array} allowedRoles - List of authorized roles (e.g. ['candidate'], ['recruiter'], ['admin'])
 */
const ProtectedRoute = ({ allowedRoles, children }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // 1. Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-600">
          Verifying authentication & role permissions...
        </p>
      </div>
    );
  }

  // 2. Unauthenticated State -> Redirect to Login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Role-Based Access Enforcement
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const roleRoutes = {
      candidate: '/candidate',
      recruiter: '/recruiter',
      admin: '/admin',
    };

    const targetRoute = roleRoutes[user.role] || '/';

    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border border-amber-200 rounded-2xl p-8 shadow-sm text-center">
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-5 text-amber-600 border border-amber-100">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Access Restricted
          </h2>
          <p className="text-sm text-slate-600 mb-6">
            Your current account role is{' '}
            <span className="font-semibold text-slate-800 capitalize">
              {user.role}
            </span>
            . You do not have authorization to view the requested resource.
          </p>
          <Link
            to={targetRoute}
            className="inline-flex items-center justify-center space-x-2 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors"
          >
            <span>Go to My {user.role.charAt(0).toUpperCase() + user.role.slice(1)} Portal</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
