import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../api/client';
import { 
  FileText, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  UserCheck, 
  TrendingUp, 
  ArrowRight,
  BarChart3
} from 'lucide-react';

export const AuthorityDashboard = () => {
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [dashRes, catRes] = await Promise.all([
          adminApi.getDashboard(),
          adminApi.getCategoryAnalytics()
        ]);
        setStats(dashRes.data);
        setCategories(catRes.data);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading Authority KPI dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center space-x-2">
            <ShieldAlert className="w-7 h-7 text-amber-400" />
            <span>Authority Dispatch & Analytics Dashboard</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Real-time civic work order control center</p>
        </div>

        <Link
          to="/admin/issues"
          className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-600/30 flex items-center space-x-2 shrink-0"
        >
          <FileText className="w-4 h-4" />
          <span>Manage All Issues</span>
        </Link>
      </div>

      {/* KPI Counters Grid (8 metrics as per spec) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        <div className="glass-panel p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Reports</p>
          <p className="text-3xl font-extrabold text-white mt-1">{stats?.total_reports || 0}</p>
        </div>

        <div className="glass-panel p-5">
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Pending Review</p>
          <p className="text-3xl font-extrabold text-amber-400 mt-1">{stats?.pending_reports || 0}</p>
        </div>

        <div className="glass-panel p-5">
          <p className="text-xs font-semibold text-rose-400 uppercase tracking-wider">High / Critical</p>
          <p className="text-3xl font-extrabold text-rose-400 mt-1">{stats?.high_critical_reports || 0}</p>
        </div>

        <div className="glass-panel p-5">
          <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Assigned</p>
          <p className="text-3xl font-extrabold text-cyan-400 mt-1">{stats?.assigned_reports || 0}</p>
        </div>

        <div className="glass-panel p-5">
          <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">In Progress</p>
          <p className="text-3xl font-extrabold text-indigo-400 mt-1">{stats?.in_progress_reports || 0}</p>
        </div>

        <div className="glass-panel p-5">
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Resolved</p>
          <p className="text-3xl font-extrabold text-emerald-400 mt-1">{stats?.resolved_reports || 0}</p>
        </div>

        <div className="glass-panel p-5">
          <p className="text-xs font-semibold text-sky-400 uppercase tracking-wider">Avg Resolution Time</p>
          <p className="text-3xl font-extrabold text-sky-400 mt-1">{stats?.average_resolution_hours || 0} hrs</p>
        </div>

        <div className="glass-panel p-5">
          <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Duplicates Prevented</p>
          <p className="text-3xl font-extrabold text-purple-400 mt-1">{stats?.duplicates_prevented || 0}</p>
        </div>

      </div>

      {/* Category Distribution Breakdown */}
      <div className="glass-panel p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-sky-400" />
            <span>Reports Distribution by Category</span>
          </h3>
          <Link to="/admin/analytics" className="text-xs font-semibold text-sky-400 hover:underline">
            View Analytics Charts &rarr;
          </Link>
        </div>

        <div className="space-y-3 pt-2">
          {categories.map((cat) => {
            const maxVal = Math.max(...categories.map(c => c.count), 1);
            const percentage = Math.round((cat.count / maxVal) * 100);

            return (
              <div key={cat.category} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="capitalize text-slate-200">{cat.category}</span>
                  <span className="text-slate-400 font-mono">{cat.count} reports ({percentage}%)</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
