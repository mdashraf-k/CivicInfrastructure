import React from 'react';

const STATUS_STYLES = {
  REPORTED: 'bg-blue-900/40 text-blue-400 border-blue-700/50',
  AI_ANALYZING: 'bg-purple-900/40 text-purple-400 border-purple-700/50 animate-pulse',
  PENDING_REVIEW: 'bg-amber-900/40 text-amber-400 border-amber-700/50',
  ASSIGNED: 'bg-cyan-900/40 text-cyan-400 border-cyan-700/50',
  IN_PROGRESS: 'bg-indigo-900/40 text-indigo-400 border-indigo-700/50',
  RESOLUTION_SUBMITTED: 'bg-teal-900/40 text-teal-400 border-teal-700/50',
  AI_VERIFYING: 'bg-fuchsia-900/40 text-fuchsia-400 border-fuchsia-700/50 animate-pulse',
  RESOLVED: 'bg-emerald-900/40 text-emerald-400 border-emerald-700/50',
  REJECTED: 'bg-rose-900/40 text-rose-400 border-rose-700/50',
  DUPLICATE: 'bg-slate-800 text-slate-400 border-slate-700',
  REOPENED: 'bg-orange-900/40 text-orange-400 border-orange-700/50',
};

export const StatusBadge = ({ status, className = '' }) => {
  const style = STATUS_STYLES[status] || 'bg-slate-800 text-slate-300 border-slate-700';
  const label = status ? status.replace(/_/g, ' ') : 'UNKNOWN';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border uppercase tracking-wider ${style} ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
      {label}
    </span>
  );
};
