import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="glass-panel p-8 text-center space-y-6">
        
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center mx-auto text-3xl font-extrabold text-white shadow-xl shadow-sky-500/20">
          {user?.name ? user.name[0].toUpperCase() : 'U'}
        </div>

        <div>
          <h2 className="text-xl font-bold text-white">{user?.name}</h2>
          <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
          <span className="inline-block mt-2 px-3 py-1 rounded-full bg-sky-950 text-sky-400 border border-sky-800 text-xs font-semibold uppercase tracking-wider">
            {user?.role}
          </span>
        </div>

        <div className="border-t border-slate-800 pt-6 space-y-3">
          <button
            onClick={handleLogout}
            className="w-full py-3 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-400 border border-rose-800/60 text-sm font-semibold flex items-center justify-center space-x-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

      </div>
    </div>
  );
};
