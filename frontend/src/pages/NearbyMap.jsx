import React, { useState, useEffect } from 'react';
import { issueApi } from '../api/client';
import { IssueMap } from '../components/IssueMap';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { Map, Filter, RefreshCw, Loader2, MapPin } from 'lucide-react';

export const NearbyMap = () => {
  const [issues, setIssues] = useState([]);
  const [radius, setRadius] = useState(5000);
  const [category, setCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // null = GPS not yet resolved; will show spinner, not the USA default
  const [center, setCenter] = useState(null);
  const [locationResolved, setLocationResolved] = useState(false);
  const [locationLabel, setLocationLabel] = useState('Acquiring GPS…');

  // Step 1: Acquire GPS — wait before fetching map data
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCenter([pos.coords.latitude, pos.coords.longitude]);
          setLocationLabel(`GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
          setLocationResolved(true);
        },
        () => {
          // GPS denied — fall back to a neutral default but label it clearly
          setCenter([20.5937, 78.9629]); // India center as a neutral default
          setLocationLabel('GPS denied — showing default region');
          setLocationResolved(true);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
      );
    } else {
      setCenter([20.5937, 78.9629]);
      setLocationLabel('Geolocation not supported');
      setLocationResolved(true);
    }
  }, []);

  // Step 2: Fetch nearby issues only after GPS resolves
  const fetchNearby = async () => {
    if (!center) return;
    setLoading(true);
    try {
      const res = await issueApi.getNearby(center[0], center[1], radius, category, statusFilter);
      setIssues(res.data);
    } catch (err) {
      console.error('Map fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!locationResolved || !center) return;
    fetchNearby();
  }, [locationResolved, center, radius, category, statusFilter]);

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <Map className="w-6 h-6 text-sky-400" />
            <span>Interactive Nearby Civic Map</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center space-x-1.5">
            <MapPin className="w-3 h-3 text-sky-500" />
            <span>{locationLabel}</span>
          </p>
        </div>

        <button
          onClick={fetchNearby}
          disabled={!locationResolved || loading}
          className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white flex items-center space-x-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Loading…' : 'Refresh Map'}</span>
        </button>
      </div>

      {/* Filter Controls Bar */}
      <div className="glass-panel p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Search Radius: {radius / 1000} km
          </label>
          <input
            type="range"
            min="1000"
            max="10000"
            step="1000"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="w-full accent-sky-500 cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Category Filter
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
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
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Status Filter
          </label>
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
      </div>

      {/* Map Display — show spinner while GPS not yet resolved */}
      {!locationResolved || !center ? (
        <div className="h-[550px] rounded-xl border border-slate-800 bg-slate-950/60 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-3 text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin text-sky-500" />
            <p className="text-sm font-medium">Acquiring your GPS location…</p>
            <p className="text-xs text-slate-600">Map will load automatically once location is ready</p>
          </div>
        </div>
      ) : (
        <div className="relative">
          <IssueMap center={center} zoom={13} issues={issues} radiusMeters={radius} height="550px" />
          {loading && (
            <div className="absolute inset-0 bg-slate-950/50 rounded-xl flex items-center justify-center z-20">
              <div className="flex items-center space-x-3 bg-slate-900/90 px-5 py-3 rounded-xl border border-slate-800 shadow-xl">
                <Loader2 className="w-5 h-5 animate-spin text-sky-400" />
                <span className="text-sm text-slate-300 font-medium">Loading issues…</span>
              </div>
            </div>
          )}
          <div className="absolute bottom-3 left-3 z-20 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 shadow-xl">
            <span className="font-semibold text-sky-400">{issues.length}</span> issue{issues.length !== 1 ? 's' : ''} found within {radius / 1000} km
          </div>
        </div>
      )}
    </div>
  );
};
