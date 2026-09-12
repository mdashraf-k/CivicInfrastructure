import React, { useState, useEffect } from 'react';
import { adminApi } from '../api/client';
import { BarChart3, PieChart, TrendingUp, ShieldCheck } from 'lucide-react';

export const Analytics = () => {
  const [categories, setCategories] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [catRes, statRes, prioRes] = await Promise.all([
          adminApi.getCategoryAnalytics(),
          adminApi.getStatusAnalytics(),
          adminApi.getPriorityAnalytics()
        ]);
        setCategories(catRes.data);
        setStatuses(statRes.data);
        setPriorities(prioRes.data);
      } catch (err) {
        console.error("Analytics fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-400">Loading analytics charts...</div>;

  return (
    <div className="space-y-8">
      
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
          <BarChart3 className="w-6 h-6 text-sky-400" />
          <span>Civic Analytics & Decision Support</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">Statistical Insights Across Municipal Infrastructure</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Category breakdown */}
        <div className="glass-panel p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <PieChart className="w-4 h-4 text-sky-400" />
            <span>Category Distribution</span>
          </h3>
          <div className="space-y-3">
            {categories.map((c) => (
              <div key={c.category} className="flex items-center justify-between text-xs">
                <span className="capitalize text-slate-300">{c.category}</span>
                <span className="font-bold text-sky-400">{c.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status breakdown */}
        <div className="glass-panel p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <span>Status Workflow Distribution</span>
          </h3>
          <div className="space-y-3">
            {statuses.map((s) => (
              <div key={s.status} className="flex items-center justify-between text-xs">
                <span className="capitalize text-slate-300">{s.status.replace(/_/g, ' ')}</span>
                <span className="font-bold text-indigo-400">{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Priority distribution */}
        <div className="glass-panel p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Priority Level Spread</span>
          </h3>
          <div className="space-y-3">
            {priorities.map((p) => (
              <div key={p.level} className="flex items-center justify-between text-xs">
                <span className="capitalize text-slate-300">{p.level} Priority</span>
                <span className="font-bold text-emerald-400">{p.count}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
