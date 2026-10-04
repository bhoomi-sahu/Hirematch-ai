import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Users, Briefcase, ShieldCheck, LogOut, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { APP_NAME } from '../utils/constants';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const portalRoute = user
    ? user.role === 'recruiter'
      ? '/recruiter'
      : user.role === 'admin'
      ? '/admin'
      : '/candidate'
    : '/login';

  return (
    <header className="sticky top-0 z-50 bg-[#0c1211]/90 backdrop-blur-md border-b border-[#283632]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold text-[#e9f1eb]">
                {APP_NAME}
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <a
              href="/#candidates"
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-emerald-300 hover:bg-white/5 transition-colors"
            >
              <Users className="w-4 h-4 text-blue-500" />
              <span>For Candidates</span>
            </a>
            <a
              href="/#recruiters"
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-emerald-300 hover:bg-white/5 transition-colors"
            >
              <Briefcase className="w-4 h-4 text-indigo-500" />
              <span>For Recruiters</span>
            </a>
            <a
              href="/#admin"
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:text-emerald-300 hover:bg-white/5 transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-violet-500" />
              <span>Admin Portal</span>
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center space-x-3">
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-3">
                <Link
                  to={portalRoute}
                  className="inline-flex items-center space-x-1.5 text-xs font-semibold text-emerald-200 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-800 px-3 py-2 rounded-lg transition-colors"
                >
                  <span className="capitalize">{user.role} Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center space-x-1 text-sm font-medium text-slate-300 hover:text-rose-300 hover:bg-rose-950/40 px-2.5 py-1.5 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-slate-300 hover:text-emerald-300 px-3 py-1.5 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-semibold text-[#102018] bg-[#9bd8be] hover:bg-[#b0e7cf] px-4 py-2 rounded-lg transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
