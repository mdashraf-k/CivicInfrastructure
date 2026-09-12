import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi, getImageUrl } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { CheckSquare, Search, Filter, ArrowRight, UserPlus, RefreshCw } from 'lucide-react';

export const IssueManagementTable = () => {
  const [issues, setIssues] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getIssues({
        status_filter: statusFilter,
        category_filter: categoryFilter,
        priority_level: priorityFilter,
        search
      });
      setIssues(res.data);
    } catch (err) {
      console.error("Fetch admin issues error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [statusFilter, categoryFilter, priorityFilter, search]);

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <CheckSquare className="w-6 h-6 text-sky-400" />
            <span>Civic Issue Management Queue</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Sorted by AI priority score descending</p>
        </div>

        <button
          onClick={fetchIssues}
          className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white flex items-center space-x-2 shrink-0"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel p-4 grid grid-cols-1 sm:grid-cols-4 gap-4">
        
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title/desc..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none"
          >
            <option value="">All Statuses</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLUTION_SUBMITTED">Resolution Submitted</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none"
          >
            <option value="">All Categories</option>
            <option value="pothole">Pothole</option>
            <option value="garbage/waste accumulation">Garbage/Waste</option>
            <option value="broken streetlight">Broken Streetlight</option>
            <option value="water leakage">Water Leakage</option>
            <option value="damaged footpath/road">Damaged Road</option>
            <option value="fallen tree">Fallen Tree</option>
            <option value="damaged public infrastructure">Public Infra</option>
          </select>
        </div>

        <div>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none"
          >
            <option value="">All Priorities</option>
            <option value="Critical">Critical (85-100)</option>
            <option value="High">High (70-84)</option>
            <option value="Medium">Medium (40-69)</option>
            <option value="Low">Low (0-39)</option>
          </select>
        </div>

      </div>

      {/* Issues Table */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Photo</th>
                <th className="px-4 py-3">Issue Title & Category</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Reported</th>
                <th className="px-4 py-3">Support</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {issues.map((issue) => {
                const imgPath = issue.images && issue.images.length > 0 ? issue.images[0].storage_path : null;

                return (
                  <tr key={issue.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3">
                      {imgPath ? (
                        <img
                          src={getImageUrl(imgPath)}
                          alt={issue.category}
                          className="w-12 h-12 object-cover rounded-lg border border-slate-700"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-slate-950 flex items-center justify-center text-[10px]">
                          No Photo
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-bold text-white text-sm line-clamp-1">
                        {issue.title || issue.category}
                      </div>
                      <div className="text-slate-400 text-xs capitalize mt-0.5">
                        {issue.category}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <PriorityBadge score={issue.priority_score} level={issue.priority_level} />
                    </td>

                    <td className="px-4 py-3">
                      <StatusBadge status={issue.status} />
                    </td>

                    <td className="px-4 py-3 text-slate-400">
                      {new Date(issue.created_at).toLocaleDateString()}
                    </td>

                    <td className="px-4 py-3 font-bold text-white">
                      👍 {issue.support_count}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/admin/issues/${issue.id}`}
                        className="px-3 py-1.5 rounded-lg bg-sky-600/20 hover:bg-sky-600 text-sky-300 hover:text-white font-semibold text-xs border border-sky-500/30 transition-all inline-flex items-center space-x-1"
                      >
                        <span>Inspect & Dispatch</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
