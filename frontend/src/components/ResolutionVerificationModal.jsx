import React from 'react';
import { CheckCircle, AlertCircle, X, ShieldCheck, RefreshCw } from 'lucide-react';
import { getImageUrl } from '../api/client';

export const ResolutionVerificationModal = ({
  verificationData,
  onConfirmResolved,
  onRequestRework,
  onClose
}) => {
  if (!verificationData) return null;

  const { resolution_score, recommendation, before_image_url, after_image_url, explanation } = verificationData;

  const isHighConf = recommendation === 'LIKELY_RESOLVED';
  const isReview = recommendation === 'NEEDS_REVIEW';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2.5 rounded-xl bg-sky-950 text-sky-400 border border-sky-800">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">AI Repair Resolution Verification</h3>
            <p className="text-xs text-slate-400">Comparing original problem photo with submitted after-repair evidence</p>
          </div>
        </div>

        {/* Side-by-side Before/After Photos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2 block">
              📷 Before Repair (Original Report)
            </span>
            <img
              src={getImageUrl(before_image_url)}
              alt="Before Repair"
              className="w-full h-48 object-cover rounded-lg"
            />
          </div>

          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2 block">
              📸 After Repair Evidence
            </span>
            <img
              src={getImageUrl(after_image_url)}
              alt="After Repair"
              className="w-full h-48 object-cover rounded-lg"
            />
          </div>
        </div>

        {/* AI Analysis Summary */}
        <div className={`p-4 rounded-xl border mb-6 ${
          isHighConf
            ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300'
            : isReview
            ? 'bg-amber-950/30 border-amber-800/50 text-amber-300'
            : 'bg-rose-950/30 border-rose-800/50 text-rose-300'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span className="font-bold text-base">
                AI Resolution Assessment: {recommendation.replace(/_/g, ' ')}
              </span>
            </div>
            <span className="text-sm font-bold font-mono px-3 py-1 rounded-lg bg-slate-900 border border-current">
              Score: {Math.round(resolution_score * 100)}%
            </span>
          </div>
          <p className="text-xs text-slate-300">{explanation}</p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={onRequestRework}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 font-semibold text-sm border border-rose-900/40 flex items-center justify-center space-x-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Request Rework</span>
          </button>

          <button
            onClick={onConfirmResolved}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all hover:scale-[1.02]"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Confirm Resolution & Mark Resolved</span>
          </button>
        </div>

      </div>
    </div>
  );
};
