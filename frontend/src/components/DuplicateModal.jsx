import React from 'react';
import { AlertTriangle, ThumbsUp, ArrowRight, X } from 'lucide-react';
import { getImageUrl } from '../api/client';
import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';

export const DuplicateModal = ({ candidate, onSupport, onClose, onContinueAnyway }) => {
  if (!candidate) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 text-amber-400 mb-4">
          <div className="p-2 rounded-xl bg-amber-950/80 border border-amber-800/50">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Similar Existing Report Found</h3>
            <p className="text-xs text-amber-300">FAISS visual search & distance check detected an active issue nearby</p>
          </div>
        </div>

        {/* Candidate Card */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 mb-6">
          {candidate.image_url && (
            <img
              src={getImageUrl(candidate.image_url)}
              alt="Existing report"
              className="w-full h-44 object-cover rounded-lg mb-3"
            />
          )}

          <div className="flex items-center justify-between gap-2 mb-2">
            <StatusBadge status={candidate.status} />
            <PriorityBadge score={candidate.priority_score} level={candidate.priority_level} />
          </div>

          <h4 className="font-bold text-slate-100 text-base mb-1">
            {candidate.title || candidate.category}
          </h4>

          <div className="flex items-center space-x-4 text-xs text-slate-300 mb-3">
            <span>📍 {Math.round(candidate.distance_meters)} meters away</span>
            <span>👁️ {Math.round(candidate.visual_similarity * 100)}% visual match</span>
          </div>

          <p className="text-xs bg-slate-900/80 text-amber-400 p-2.5 rounded-lg border border-amber-900/30">
            <strong>Reason:</strong> {candidate.reason}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => onSupport(candidate.issue_id)}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-sky-600/30 flex items-center justify-center space-x-2 transition-all hover:scale-[1.01]"
          >
            <ThumbsUp className="w-4 h-4" />
            <span>This Affects Me Too (Support Existing Issue)</span>
          </button>

          <button
            onClick={onContinueAnyway}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs border border-slate-700 flex items-center justify-center space-x-2 transition-colors"
          >
            <span>Proceed to Create Separate Report</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
