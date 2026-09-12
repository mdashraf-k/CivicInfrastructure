import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { issueApi, getImageUrl } from '../api/client';
import { IssueMap } from '../components/IssueMap';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { PlusCircle, MapPin, FileText, CheckCircle2, AlertCircle, ArrowRight, Compass, Loader2 } from 'lucide-react';

export const CitizenDashboard = () => {
  const { user } = useAuth();
  const [myIssues, setMyIssues] = useState([]);
  const [nearbyIssues, setNearbyIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  // Geolocation state: null means "not yet resolved"
  const [center, setCenter] = useState(null);
  const [locationStatus, setLocationStatus] = useState('Acquiring GPS location...');
  const [locationResolved, setLocationResolved] = useState(false);

  // Step 1: Get browser geolocation first, then fall back to default
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setCenter([lat, lng]);
          setLocationStatus(`GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          setLocationResolved(true);
        },
        (err) => {
          // GPS denied or unavailable — use default coords (San Francisco)
          setCenter([37.7749, -122.4194]);
          setLocationStatus('Default location (GPS denied)');
          setLocationResolved(true);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
      );
    } else {
      setCenter([37.7749, -122.4194]);
      setLocationStatus('Geolocation not supported');
      setLocationResolved(true);
    }
  }, []);

  // Step 2: Fetch data ONLY after location is resolved
  useEffect(() => {
    if (!locationResolved || !center) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [myRes, nearbyRes] = await Promise.all([
          issueApi.getMyIssues(),
          issueApi.getNearby(center[0], center[1], 5000)
        ]);
        setMyIssues(myRes.data);
        setNearbyIssues(nearbyRes.data);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [locationResolved, center]);

  const activeReports = myIssues.filter(i => i.status !== 'RESOLVED' && i.status !== 'REJECTED');
  const resolvedReports = myIssues.filter(i => i.status === 'RESOLVED');

  return (
    <div className="space-y-8">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-900/60 via-indigo-900/60 to-slate-900 border border-sky-800/50 p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Welcome back, {user?.name || 'Citizen'}! 👋
            </h1>
            <p className="text-sm text-sky-200 mt-1 max-w-xl">
              Report civic infrastructure issues in your community. Our AI automatically analyzes, prioritizes, and routes your reports to city authorities.
            </p>
          </div>
          <Link
            to="/report"
            className="inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm shadow-lg shadow-sky-500/30 transition-all hover:scale-[1.02] shrink-0"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Report New Issue</span>
          </Link>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-sky-950 text-sky-400 border border-sky-800">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Reports</p>
            <p className="text-2xl font-bold text-white mt-0.5">{loading ? '—' : activeReports.length}</p>
          </div>
        </div>

        <div className="glass-panel p-5 flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Resolved Issues</p>
            <p className="text-2xl font-bold text-white mt-0.5">{loading ? '—' : resolvedReports.length}</p>
          </div>
        </div>

        <div className="glass-panel p-5 flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-amber-950 text-amber-400 border border-amber-800">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nearby Active Alerts</p>
            <p className="text-2xl font-bold text-white mt-0.5">{loading ? '—' : nearbyIssues.length}</p>
          </div>
        </div>
      </div>

      {/* Nearby Map Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Compass className="w-5 h-5 text-sky-400" />
              <span>Nearby Infrastructure Map</span>
            </h2>
            <p className="text-xs text-slate-400 flex items-center space-x-1.5 mt-0.5">
              <span>Live active civic issues around your location:</span>
              <span className="text-sky-400 font-semibold font-mono">[{locationStatus}]</span>
            </p>
          </div>
          <Link to="/nearby" className="text-xs font-semibold text-sky-400 hover:underline flex items-center space-x-1">
            <span>Explore Full Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {!locationResolved || !center ? (
          <div className="h-96 rounded-xl border border-slate-800 bg-slate-950/60 flex items-center justify-center">
            <div className="flex flex-col items-center space-y-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
              <p className="text-sm">Acquiring GPS location for map…</p>
            </div>
          </div>
        ) : (
          <IssueMap center={center} zoom={13} issues={nearbyIssues} height="400px" />
        )}
      </div>

      {/* My Recent Reports List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">My Recent Reports</h2>
          <Link to="/my-reports" className="text-xs font-semibold text-sky-400 hover:underline">
            View All Reports &rarr;
          </Link>
        </div>

        {loading ? (
          <div className="glass-panel p-8 flex items-center justify-center space-x-3 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin text-sky-500" />
            <span className="text-sm">Loading your reports…</span>
          </div>
        ) : myIssues.length === 0 ? (
          <div className="glass-panel p-8 text-center">
            <p className="text-slate-400 text-sm">You haven't submitted any civic reports yet.</p>
            <Link to="/report" className="mt-3 inline-block text-xs font-semibold text-sky-400 hover:underline">
              Submit your first report now
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myIssues.slice(0, 4).map((issue) => (
              <div key={issue.id} className="glass-card p-4 flex space-x-4">
                {issue.images && issue.images.length > 0 && (
                  <img
                    src={getImageUrl(issue.images[0].storage_path)}
                    alt={issue.category}
                    className="w-24 h-24 object-cover rounded-lg shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <StatusBadge status={issue.status} />
                    <PriorityBadge score={issue.priority_score} level={issue.priority_level} showScore={false} />
                  </div>
                  <h4 className="font-bold text-slate-100 text-sm truncate">
                    {issue.title || issue.category}
                  </h4>
                  <p className="text-xs text-slate-400 capitalize mb-2">
                    {issue.category}
                  </p>
                  <Link
                    to={`/issues/${issue.id}`}
                    className="text-xs font-semibold text-sky-400 hover:underline inline-flex items-center space-x-1"
                  >
                    <span>View Status Timeline</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
