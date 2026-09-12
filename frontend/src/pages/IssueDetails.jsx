import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { issueApi, getImageUrl } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { IssueMap } from '../components/IssueMap';
import {
  ThumbsUp, Clock, MapPin, ArrowLeft, AlertTriangle, Loader2,
  CheckCircle2, RefreshCw
} from 'lucide-react';

export const IssueDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [issue, setIssue]   = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [issueError, setIssueError] = useState(null);
  const [historyError, setHistoryError] = useState(null);
  const [supportMsg, setSupportMsg] = useState('');
  const [hasSupported, setHasSupported] = useState(false);

  /* ── helpers ── */
  const parseError = (err) => {
    if (!err.response) return 'Cannot reach the backend server. Check it is running on port 8000.';
    const s = err.response.status;
    const msg = err.response?.data?.detail?.message || err.response?.data?.detail;
    if (s === 404) return 'Issue not found — it may have been deleted.';
    if (s === 401) return 'You must be logged in.';
    if (s === 422) return `Invalid issue ID format (${id}).`;
    return msg || `Server error (HTTP ${s}).`;
  };

  /* ── load issue & history independently so a history 500 never hides the issue ── */
  const loadIssue = async () => {
    setIssueError(null);
    try {
      const res = await issueApi.getDetails(id);
      setIssue(res.data);
    } catch (err) {
      console.error('[IssueDetails] getDetails failed:', err);
      setIssueError(parseError(err));
    }
  };

  const loadHistory = async () => {
    setHistoryError(null);
    try {
      const res = await issueApi.getHistory(id);
      setHistory(res.data);
    } catch (err) {
      console.error('[IssueDetails] getHistory failed:', err);
      // Non-fatal: just show a warning inside the history section
      setHistoryError('Could not load status history right now.');
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    await loadIssue();   // sequential so loading state makes sense
    await loadHistory(); // history failure is non-fatal
    setLoading(false);
  };

  useEffect(() => {
    if (!id) { setIssueError('No issue ID in URL.'); setLoading(false); return; }
    fetchAll();
  }, [id]);

  /* ── support ── */
  const handleSupport = async () => {
    try {
      await issueApi.support(id);
      setHasSupported(true);
      setSupportMsg('Thank you! Your support has been recorded.');
      loadIssue(); // refresh count
    } catch (err) {
      setSupportMsg(
        err.response?.data?.detail?.message ||
        'Could not record support — you may have already supported this.'
      );
    }
  };

  /* ── render: loading ── */
  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center space-y-4 text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-sky-500" />
        <p className="text-sm">Loading issue details…</p>
      </div>
    );
  }

  /* ── render: issue fetch failed (critical) ── */
  if (issueError) {
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-6">
        <Link to="/dashboard" className="inline-flex items-center space-x-2 text-xs font-semibold text-sky-400 hover:underline">
          <ArrowLeft className="w-4 h-4" /><span>Back to Dashboard</span>
        </Link>
        <div className="glass-panel p-10 flex flex-col items-center text-center space-y-5">
          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/40">
            <AlertTriangle className="w-10 h-10 text-rose-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Could Not Load Issue</h2>
          <p className="text-sm text-slate-400 max-w-md">{issueError}</p>
          <p className="text-[11px] text-slate-600 font-mono">Issue ID: {id}</p>
          <div className="flex items-center space-x-3 pt-2">
            <button
              onClick={fetchAll}
              className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" /><span>Retry</span>
            </button>
            <button
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!issue) return null;

  const beforeImg = issue.images?.find(i => i.image_type === 'BEFORE');
  const afterImg  = issue.images?.find(i => i.image_type === 'AFTER');

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      {/* Back link */}
      <Link
        to="/dashboard"
        className="inline-flex items-center space-x-2 text-xs font-semibold text-sky-400 hover:underline"
      >
        <ArrowLeft className="w-4 h-4" /><span>Back to Dashboard</span>
      </Link>

      {/* ── Header banner ── */}
      <div className="glass-panel p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <StatusBadge status={issue.status} />
            <PriorityBadge score={issue.priority_score} level={issue.priority_level} />
          </div>
          <span className="text-[11px] font-mono text-slate-500 select-all">ID: {issue.id}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          {issue.title || issue.category}
        </h1>

        <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400 border-t border-slate-800 pt-4">
          <span className="capitalize">
            Category: <strong className="text-slate-200">{issue.category}</strong>
          </span>
          <span>
            Reported: <strong className="text-slate-200">{new Date(issue.created_at).toLocaleString()}</strong>
          </span>
          <span>
            GPS: <strong className="text-slate-200">
              {Number(issue.latitude).toFixed(5)}, {Number(issue.longitude).toFixed(5)}
            </strong>
          </span>
        </div>
      </div>

      {/* ── Before / After photos ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">
            📷 Report Photo (Before)
          </p>
          {beforeImg ? (
            <img
              src={getImageUrl(beforeImg.storage_path)}
              alt="Before"
              className="w-full h-64 object-cover rounded-xl border border-slate-800"
            />
          ) : (
            <div className="w-full h-64 rounded-xl bg-slate-950 flex items-center justify-center text-xs text-slate-500">
              No photo available
            </div>
          )}
        </div>

        <div className="glass-panel p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            📸 Resolution Photo (After)
          </p>
          {afterImg ? (
            <img
              src={getImageUrl(afterImg.storage_path)}
              alt="After"
              className="w-full h-64 object-cover rounded-xl border border-slate-800"
            />
          ) : (
            <div className="w-full h-64 rounded-xl bg-slate-950 flex flex-col items-center justify-center space-y-2 text-xs text-slate-500 p-6 text-center">
              <Clock className="w-8 h-8 text-slate-700" />
              <span>Pending repair completion photo from authority inspector</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Description + Community support ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 glass-panel p-6 space-y-4">
          <h3 className="text-base font-bold text-white">Description &amp; AI Insights</h3>
          <p className="text-sm text-slate-300">
            {issue.description || 'No detailed description provided.'}
          </p>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
              AI Detection &amp; Priority Metrics
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
              <div>Detected Class: <strong>{issue.ai_category || issue.category}</strong></div>
              <div>Confidence: <strong>{Math.round((issue.ai_confidence || 0.85) * 100)}%</strong></div>
              <div>AI Severity: <strong>{issue.ai_severity || 25}/40</strong></div>
              <div>Priority: <strong>{issue.priority_level} ({Math.round(issue.priority_score)}/100)</strong></div>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-base font-bold text-white mb-2">Community Support</h3>
            <p className="text-xs text-slate-400 mb-4">
              More upvotes raise this issue's priority for city crews.
            </p>
            <div className="text-3xl font-extrabold text-white mb-1">
              👍 {issue.support_count}
            </div>
            <p className="text-xs text-slate-400">citizens affected</p>
            {supportMsg && (
              <p className="text-xs text-emerald-400 font-semibold mt-3">{supportMsg}</p>
            )}
          </div>
          <button
            onClick={handleSupport}
            disabled={hasSupported}
            className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-sm shadow-lg shadow-sky-600/30 flex items-center justify-center space-x-2 transition-all"
          >
            <ThumbsUp className="w-4 h-4" />
            <span>{hasSupported ? 'Supported ✓' : 'This Affects Me Too'}</span>
          </button>
        </div>
      </div>

      {/* ── Status history timeline ── */}
      <div className="glass-panel p-6 sm:p-8 space-y-5">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <Clock className="w-5 h-5 text-sky-400" />
          <span>Status Lifecycle History</span>
        </h3>

        {historyError ? (
          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-300 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{historyError}</span>
            <button onClick={loadHistory} className="ml-auto text-sky-400 hover:underline font-semibold">
              Retry
            </button>
          </div>
        ) : history.length === 0 ? (
          <p className="text-sm text-slate-500 italic">
            No status changes recorded yet. History is tracked after the AI analysis pipeline completes.
          </p>
        ) : (
          <div className="relative border-l-2 border-slate-800 ml-4 space-y-6">
            {history.map((log) => (
              <div key={log.id} className="relative pl-6">
                <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-sky-500 ring-4 ring-slate-900" />
                <div className="flex items-center space-x-3 mb-1.5">
                  <StatusBadge status={log.new_status} />
                  <span className="text-xs text-slate-500">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-mono bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  {log.note || `Status changed: ${log.old_status || 'NEW'} → ${log.new_status}`}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Map ── */}
      <div className="glass-panel p-6 space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <MapPin className="w-5 h-5 text-sky-400" />
          <span>Report GPS Location</span>
        </h3>
        <IssueMap
          center={[Number(issue.latitude), Number(issue.longitude)]}
          zoom={15}
          issues={[issue]}
          height="350px"
        />
      </div>

    </div>
  );
};
