import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminApi, getImageUrl } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { ResolutionVerificationModal } from '../components/ResolutionVerificationModal';
import { IssueMap } from '../components/IssueMap';
import { 
  ShieldAlert, 
  UserCheck, 
  Upload, 
  CheckCircle, 
  RefreshCw, 
  ArrowLeft, 
  Edit3, 
  Layers, 
  Send 
} from 'lucide-react';

export const AuthorityIssueDetail = () => {
  const { id } = useParams();

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);

  // Override AI states
  const [overrideCategory, setOverrideCategory] = useState('');
  const [overrideSeverity, setOverrideSeverity] = useState('');

  // Assignment states
  const [department, setDepartment] = useState('Road Maintenance');
  const [assigneeName, setAssigneeName] = useState('John Construction Team');
  const [assignNote, setAssignNote] = useState('');

  // Upload after photo
  const [afterFile, setAfterFile] = useState(null);

  // Verification modal state
  const [verificationData, setVerificationData] = useState(null);

  const fetchDetails = async () => {
    try {
      const res = await adminApi.getDetails(id);
      setIssue(res.data);
      setOverrideCategory(res.data.category);
      setOverrideSeverity(res.data.ai_severity || 25);
    } catch (err) {
      console.error("Fetch detail error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleUpdateStatus = async (targetStatus) => {
    try {
      await adminApi.updateStatus(id, {
        status: targetStatus,
        note: `Status changed to ${targetStatus} by Authority Admin`,
        override_category: overrideCategory !== issue.category ? overrideCategory : undefined,
        override_severity: overrideSeverity !== issue.ai_severity ? Number(overrideSeverity) : undefined
      });
      fetchDetails();
    } catch (err) {
      alert("Status update failed: " + (err.response?.data?.detail?.message || err.message));
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    try {
      await adminApi.assign(id, {
        department,
        assignee_name: assigneeName,
        note: assignNote
      });
      fetchDetails();
      alert("Successfully assigned issue!");
    } catch (err) {
      alert("Assignment failed.");
    }
  };

  const handleUploadAfterPhoto = async (e) => {
    e.preventDefault();
    if (!afterFile) return;
    try {
      await adminApi.uploadResolutionPhoto(id, afterFile);
      setAfterFile(null);
      fetchDetails();
      alert("Resolution photo uploaded! Proceeding to AI verification.");
    } catch (err) {
      alert("Photo upload failed.");
    }
  };

  const handleRunVerification = async () => {
    try {
      const res = await adminApi.verifyResolution(id);
      setVerificationData(res.data);
    } catch (err) {
      alert("AI Verification failed: " + (err.response?.data?.detail?.message || err.message));
    }
  };

  const handleConfirmResolved = async () => {
    await handleUpdateStatus('RESOLVED');
    setVerificationData(null);
  };

  const handleRequestRework = async () => {
    await handleUpdateStatus('REOPENED');
    setVerificationData(null);
  };

  if (loading) return <div className="p-8 text-center text-slate-400">Loading issue inspection details...</div>;
  if (!issue) return <div className="p-8 text-center text-rose-400">Issue not found.</div>;

  const beforeImg = issue.images?.find(i => i.image_type === 'BEFORE');
  const afterImg = issue.images?.find(i => i.image_type === 'AFTER');

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      <Link to="/admin/issues" className="inline-flex items-center space-x-2 text-xs font-semibold text-sky-400 hover:underline">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Queue</span>
      </Link>

      {/* Header Info */}
      <div className="glass-panel p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <StatusBadge status={issue.status} />
            <PriorityBadge score={issue.priority_score} level={issue.priority_level} />
          </div>
          <span className="text-xs font-mono text-slate-500">ID: {issue.id}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          Inspection & Work Order: {issue.title || issue.category}
        </h1>
      </div>

      {/* AI Findings & Category Correction Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Original Photo & AI Detection */}
        <div className="glass-panel p-6 space-y-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-sky-400 block">
            AI Vision Model Findings
          </span>
          {beforeImg && (
            <img
              src={getImageUrl(beforeImg.storage_path)}
              alt="Before"
              className="w-full h-56 object-cover rounded-xl border border-slate-800"
            />
          )}

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs text-slate-300">
            <div>YOLO Classification: <strong>{issue.ai_category || issue.category}</strong></div>
            <div>Model Confidence: <strong>{Math.round((issue.ai_confidence || 0.85) * 100)}%</strong></div>
            <div>Computed Priority: <strong>{issue.priority_level} ({Math.round(issue.priority_score)}/100)</strong></div>
          </div>
        </div>

        {/* Authority Category/Severity Override Form */}
        <div className="glass-panel p-6 space-y-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center space-x-2">
            <Edit3 className="w-4 h-4" />
            <span>Authority Category & Severity Correction</span>
          </span>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Override Category</label>
              <select
                value={overrideCategory}
                onChange={(e) => setOverrideCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none"
              >
                <option value="pothole">pothole</option>
                <option value="garbage/waste accumulation">garbage/waste accumulation</option>
                <option value="broken streetlight">broken streetlight</option>
                <option value="water leakage">water leakage</option>
                <option value="damaged footpath/road">damaged footpath/road</option>
                <option value="fallen tree">fallen tree</option>
                <option value="damaged public infrastructure">damaged public infrastructure</option>
                <option value="other">other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Override AI Severity (0 to 40 pts): {overrideSeverity}
              </label>
              <input
                type="range"
                min="0"
                max="40"
                value={overrideSeverity}
                onChange={(e) => setOverrideSeverity(e.target.value)}
                className="w-full accent-sky-500 cursor-pointer"
              />
            </div>

            <button
              onClick={() => handleUpdateStatus(issue.status)}
              className="w-full py-2.5 rounded-xl bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white font-semibold text-xs border border-amber-500/40 transition-all"
            >
              Apply AI Correction & Recalculate Priority
            </button>
          </div>
        </div>

      </div>

      {/* Assignment & Status Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Department Assignment Form */}
        <form onSubmit={handleAssign} className="glass-panel p-6 space-y-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center space-x-2">
            <UserCheck className="w-4 h-4" />
            <span>Assign Department Work Order</span>
          </span>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-300 mb-1">Target Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1">Assignee / Crew Name</label>
              <input
                type="text"
                value={assigneeName}
                onChange={(e) => setAssigneeName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all"
            >
              Dispatch & Transition to ASSIGNED
            </button>
          </div>
        </form>

        {/* Status Transition Control Buttons */}
        <div className="glass-panel p-6 space-y-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-sky-400 block">
            Status Transition Controls
          </span>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => handleUpdateStatus('IN_PROGRESS')}
              className="py-2.5 px-3 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 font-semibold text-xs"
            >
              Start Repair (IN_PROGRESS)
            </button>

            <button
              onClick={() => handleUpdateStatus('REJECTED')}
              className="py-2.5 px-3 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-rose-300 font-semibold text-xs"
            >
              Reject Report
            </button>
          </div>

          {/* After Photo Upload & Resolution Verification */}
          <div className="border-t border-slate-800 pt-4 space-y-3">
            <label className="block text-xs font-semibold text-emerald-400">
              Upload After-Repair Photo & Run AI Verification
            </label>

            {afterImg ? (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span className="text-xs text-emerald-400 font-semibold">✓ After Photo Uploaded</span>
                <button
                  onClick={handleRunVerification}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                >
                  Run AI Verification
                </button>
              </div>
            ) : (
              <form onSubmit={handleUploadAfterPhoto} className="flex items-center space-x-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAfterFile(e.target.files[0])}
                  className="text-xs text-slate-400 file:py-2 file:px-3 file:rounded-xl file:bg-slate-800 file:text-slate-300 file:border-0 hover:file:bg-slate-700"
                />
                <button
                  type="submit"
                  disabled={!afterFile}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shrink-0 disabled:opacity-50"
                >
                  Upload Photo
                </button>
              </form>
            )}
          </div>
        </div>

      </div>

      {/* Verification Modal */}
      {verificationData && (
        <ResolutionVerificationModal
          verificationData={verificationData}
          onConfirmResolved={handleConfirmResolved}
          onRequestRework={handleRequestRework}
          onClose={() => setVerificationData(null)}
        />
      )}

    </div>
  );
};
