import React from 'react';

const LEVEL_STYLES = {
  Low: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60',
  Medium: 'bg-amber-950/60 text-amber-400 border-amber-800/60',
  High: 'bg-orange-950/60 text-orange-400 border-orange-800/60',
  Critical: 'bg-rose-950/60 text-rose-400 border-rose-800/60 font-bold shadow-rose-950/50 shadow-sm animate-pulse',
};

export const PriorityBadge = ({ score, level, showScore = true, className = '' }) => {
  const currentLevel = level || (score >= 85 ? 'Critical' : score >= 70 ? 'High' : score >= 40 ? 'Medium' : 'Low');
  const style = LEVEL_STYLES[currentLevel] || 'bg-slate-800 text-slate-300 border-slate-700';

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs border font-medium ${style} ${className}`}>
      {currentLevel.toUpperCase()}
      {showScore && score !== undefined && (
        <span className="ml-1.5 px-1.5 py-0.5 rounded bg-slate-900/60 text-[10px]">
          {Math.round(score)}/100
        </span>
      )}
    </span>
  );
};
