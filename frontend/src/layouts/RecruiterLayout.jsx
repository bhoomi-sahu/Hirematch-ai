import React from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { Sparkles, Briefcase, LogOut, Layers, Users, BarChart2, ScanSearch, ClipboardList } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';

const RecruiterLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkClasses = ({ isActive }) =>
    `inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-indigo-50 text-indigo-700 font-semibold'
        : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
    }`;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Recruiter Top Navigation */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Portal Badge */}
            <div className="flex items-center space-x-3">
              <Link to="/recruiter" className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="font-bold text-slate-900 text-lg">HireMatch AI</span>
              </Link>
              <span className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
                <Briefcase className="w-3 h-3" />
                <span>Recruiter Suite</span>
              </span>
            </div>

            {/* Navigation links */}
            <nav className="hidden md:flex items-center space-x-1">
              <NavLink to="/recruiter" end className={navLinkClasses}>
                <BarChart2 className="w-4 h-4" />
                <span>Overview</span>
              </NavLink>
              <NavLink to="/recruiter/jobs" className={navLinkClasses}>
                <Layers className="w-4 h-4" />
                <span>Jobs</span>
              </NavLink>
              <NavLink to="/recruiter/applications" className={navLinkClasses}>
                <ClipboardList className="w-4 h-4" />
                <span>Applications</span>
              </NavLink>
              <NavLink to="/recruiter/candidates" className={navLinkClasses}>
                <Users className="w-4 h-4" />
                <span>Candidates</span>
              </NavLink>
              <NavLink to="/recruiter/bulk-screening" className={navLinkClasses}>
                <ScanSearch className="w-4 h-4" />
                <span>Bulk Screening</span>
              </NavLink>
            </nav>

            {/* User Info & Logout Button */}
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-sm font-semibold text-slate-800">{user?.name}</span>
                <span className="text-xs text-slate-500">{user?.email}</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm border border-indigo-200">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'R'}
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center space-x-1 text-sm font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Sub-Navigation */}
        <div className="md:hidden flex items-center justify-around border-t border-slate-100 py-2 px-2 bg-slate-50 text-xs">
          <NavLink to="/recruiter" end className={navLinkClasses}>
            Overview
          </NavLink>
          <NavLink to="/recruiter/jobs" className={navLinkClasses}>
            Jobs
          </NavLink>
          <NavLink to="/recruiter/applications" className={navLinkClasses}>
            Apps
          </NavLink>
          <NavLink to="/recruiter/candidates" className={navLinkClasses}>
            Candidates
          </NavLink>
          <NavLink to="/recruiter/bulk-screening" className={navLinkClasses}>
            Screen
          </NavLink>
        </div>
      </header>

      {/* Main Page Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};

export default RecruiterLayout;
