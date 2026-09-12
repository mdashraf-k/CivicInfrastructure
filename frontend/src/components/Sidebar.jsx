import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Map, 
  FileText, 
  User, 
  CheckSquare, 
  BarChart3, 
  ShieldAlert 
} from 'lucide-react';

export const Sidebar = () => {
  const { isAuthority, isCitizen } = useAuth();

  const citizenLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/report', label: 'Report Issue', icon: PlusCircle },
    { to: '/nearby', label: 'Nearby Map', icon: Map },
    { to: '/my-reports', label: 'My Reports', icon: FileText },
    { to: '/profile', label: 'Profile', icon: User },
  ];

  const authorityLinks = [
    { to: '/admin/dashboard', label: 'Authority Overview', icon: LayoutDashboard },
    { to: '/admin/issues', label: 'Manage Issues', icon: CheckSquare },
    { to: '/admin/map', label: 'Live City Map', icon: Map },
    { to: '/admin/analytics', label: 'Analytics & KPIs', icon: BarChart3 },
    { to: '/profile', label: 'Profile Settings', icon: User },
  ];

  const links = isAuthority ? authorityLinks : citizenLinks;

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 shrink-0 hidden md:block min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-6">
        
        {/* Role Banner */}
        <div className="px-3 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center space-x-3">
          <div className={`p-2 rounded-md ${isAuthority ? 'bg-amber-950/60 text-amber-400' : 'bg-sky-950/60 text-sky-400'}`}>
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-200">
              {isAuthority ? 'Authority Mode' : 'Citizen Portal'}
            </p>
            <p className="text-[10px] text-slate-400">
              {isAuthority ? 'Resolution & Assignee Workflow' : 'Report & Support Civic Issues'}
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-sky-600/20 text-sky-400 border border-sky-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>

      </div>
    </aside>
  );
};
