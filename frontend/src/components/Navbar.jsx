import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, PlusCircle, Bell, User, LogOut, MapPin, Activity } from 'lucide-react';

export const Navbar = () => {
  const { user, logout, isAuthority, isCitizen, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <Link to={isAuthority ? '/admin/dashboard' : '/dashboard'} className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-sky-400">
                CivicFix
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-sky-400 border border-sky-500/30">
                AI Platform
              </span>
            </div>
          </Link>

          {/* Actions & Navigation */}
          {isAuthenticated ? (
            <div className="flex items-center space-x-4">
              
              {isCitizen && (
                <Link
                  to="/report"
                  className="hidden sm:inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-sm shadow-lg shadow-sky-600/30 transition-all hover:scale-[1.02]"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Report Issue</span>
                </Link>
              )}

              {/* In-app Notifications Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifs(!showNotifs)}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors relative"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-sky-400 ring-2 ring-slate-900 animate-pulse"></span>
                </button>

                {showNotifs && (
                  <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-2 z-50">
                    <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">Notifications</span>
                      <span className="text-[10px] bg-sky-950 text-sky-400 px-2 py-0.5 rounded-full border border-sky-800">In-App</span>
                    </div>
                    <div className="divide-y divide-slate-800/60 max-h-64 overflow-y-auto">
                      <div className="px-4 py-3 hover:bg-slate-800/50 transition-colors cursor-pointer">
                        <p className="text-xs text-sky-400 font-semibold">Report Status Update</p>
                        <p className="text-xs text-slate-300 mt-1">Your pothole report #3812 has been assigned to Road Maintenance Department.</p>
                        <span className="text-[10px] text-slate-500 mt-1 block">10 mins ago</span>
                      </div>
                      <div className="px-4 py-3 hover:bg-slate-800/50 transition-colors cursor-pointer">
                        <p className="text-xs text-emerald-400 font-semibold">AI Verification Passed</p>
                        <p className="text-xs text-slate-300 mt-1">Resolution photo verified with 92% confidence score.</p>
                        <span className="text-[10px] text-slate-500 mt-1 block">1 hour ago</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile info */}
              <div className="flex items-center space-x-3 pl-3 border-l border-slate-800">
                <Link to="/profile" className="flex items-center space-x-2 group">
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400 font-bold text-sm group-hover:border-sky-500 transition-colors">
                    {user?.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-medium text-slate-200 group-hover:text-sky-400 transition-colors">
                      {user?.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      {user?.role}
                    </div>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  title="Log out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>

            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link to="/login" className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">
                Sign In
              </Link>
              <Link to="/register" className="px-4 py-2 text-sm font-medium bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors shadow-md shadow-sky-600/20">
                Get Started
              </Link>
            </div>
          )}

        </div>
      </div>
    </header>
  );
};
