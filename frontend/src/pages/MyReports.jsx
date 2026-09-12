import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { issueApi, getImageUrl } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { FileText, ArrowRight, Clock, PlusCircle } from 'lucide-react';

export const MyReports = () => {
  const [issues, setIssues] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyIssues = async () => {
      try {
        const res = await issueApi.getMyIssues();
        setIssues(res.data);
      } catch (err) {
        console.error("Fetch my reports error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyIssues();
  }, []);

  const filteredIssues = issues.filter(issue => {
    if (filter === 'ACTIVE') return issue.status !== 'RESOLVED' && issue.status !== 'REJECTED';
    if (filter === 'RESOLVED') return issue.status === 'RESOLVED';
    if (filter === 'REJECTED') return issue.status === 'REJECTED';
    return true;
  });

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <FileText className="w-6 h-6 text-sky-400" />
            <span>My Submitted Reports</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Track lifecycle progress and resolution evidence</p>
        </div>

        <Link
          to="/report"
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-600/30 flex items-center space-x-2 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Report</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        {['ALL', 'ACTIVE', 'RESOLVED', 'REJECTED'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              filter === tab
                ? 'bg-sky-600/20 text-sky-400 border border-sky-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Reports List */}
      {filteredIssues.length === 0 ? (
        <div className="glass-panel p-12 text-center">
          <p className="text-slate-400 text-sm">No reports found matching your filter selection.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredIssues.map((issue) => (
            <div key={issue.id} className="glass-card p-5 space-y-4">
              
              <div className="flex items-start space-x-4">
                {issue.images && issue.images.length > 0 && (
                  <img
                    src={getImageUrl(issue.images[0].storage_path)}
                    alt={issue.category}
                    className="w-28 h-28 object-cover rounded-xl shrink-0"
                  />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <StatusBadge status={issue.status} />
                    <PriorityBadge score={issue.priority_score} level={issue.priority_level} showScore={false} />
                  </div>

                  <h3 className="font-bold text-slate-100 text-base line-clamp-1">
                    {issue.title || issue.category}
                  </h3>

                  <p className="text-xs text-slate-400 capitalize mb-2">
                    Category: {issue.category}
                  </p>

                  <div className="flex items-center space-x-3 text-[11px] text-slate-500">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(issue.created_at).toLocaleDateString()}</span>
                    </span>
                    <span>👍 {issue.support_count} support</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-700/50 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">ID: #{issue.id.slice(0, 8)}</span>
                <Link
                  to={`/issues/${issue.id}`}
                  className="text-xs font-semibold text-sky-400 hover:underline flex items-center space-x-1"
                >
                  <span>View Timeline & Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
