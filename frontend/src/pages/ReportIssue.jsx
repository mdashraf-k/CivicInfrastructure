import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { issueApi } from '../api/client';
import { AIAnalysisProgress } from '../components/AIAnalysisProgress';
import { DuplicateModal } from '../components/DuplicateModal';
import { IssueMap } from '../components/IssueMap';
import { Upload, MapPin, Camera, AlertCircle, Check, ArrowRight, Cloud, Compass } from 'lucide-react';

const CATEGORIES = [
  { id: 'pothole', label: 'Pothole' },
  { id: 'garbage/waste accumulation', label: 'Garbage/Waste Accumulation' },
  { id: 'broken streetlight', label: 'Broken Streetlight' },
  { id: 'water leakage', label: 'Water Leakage' },
  { id: 'damaged footpath/road', label: 'Damaged Footpath/Road' },
  { id: 'fallen tree', label: 'Fallen Tree' },
  { id: 'damaged public infrastructure', label: 'Damaged Public Infrastructure' },
  { id: 'other', label: 'Other' },
];

export const ReportIssue = () => {
  const navigate = useNavigate();

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [category, setCategory] = useState('pothole');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [lat, setLat] = useState(37.7749);
  const [lng, setLng] = useState(-122.4194);
  const [locationStatus, setLocationStatus] = useState('Initializing location...');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAIProgress, setShowAIProgress] = useState(false);
  const [duplicateCandidate, setDuplicateCandidate] = useState(null);
  const [createdIssueId, setCreatedIssueId] = useState(null);
  const [error, setError] = useState('');

  // Refs to coordinate API response vs. animation completion
  const apiResultRef = useRef(null);     // stores {issueId, duplicate} once API responds
  const apiErrorRef = useRef(null);      // stores error message if API fails
  const animationDoneRef = useRef(false); // true once animation completes

  // Auto-fetch browser location on component mount
  useEffect(() => {
    if ('geolocation' in navigator) {
      setLocationStatus('Acquiring Browser Geolocation...');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
          setLocationStatus(`GPS Acquired: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        },
        (err) => {
          setLocationStatus('GPS Access Denied. Click map to set pin.');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setLocationStatus('Browser Geolocation not supported.');
    }
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('Image file size exceeds maximum limit of 10MB.');
      return;
    }

    setError('');
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleGetLocation = () => {
    if ('geolocation' in navigator) {
      setLocationStatus('Acquiring GPS location...');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
          setLocationStatus(`GPS Acquired: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        },
        (err) => {
          setLocationStatus('GPS access denied. Click map to set pin.');
        },
        { enableHighAccuracy: true }
      );
    }
  };

  // Called when the AI animation finishes all stages
  const handleAnimationComplete = () => {
    animationDoneRef.current = true;

    // If API already responded with an error
    if (apiErrorRef.current) {
      setError(apiErrorRef.current);
      setShowAIProgress(false);
      setIsSubmitting(false);
      return;
    }

    // If API already responded with success
    if (apiResultRef.current) {
      const { issueId, duplicate } = apiResultRef.current;
      setCreatedIssueId(issueId);
      if (duplicate) {
        setDuplicateCandidate(duplicate);
        setShowAIProgress(false);
        setIsSubmitting(false);
      } else {
        navigate(`/issues/${issueId}`);
      }
    }
    // If API hasn't responded yet, just wait — the API resolver will call navigate/setDuplicate
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile) {
      setError('Please upload a photo of the civic issue.');
      return;
    }

    setError('');
    apiResultRef.current = null;
    apiErrorRef.current = null;
    animationDoneRef.current = false;

    setIsSubmitting(true);
    setShowAIProgress(true);

    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('latitude', lat);
      formData.append('longitude', lng);
      formData.append('category', category);
      formData.append('title', title || `${category} report`);
      formData.append('description', description);

      const res = await issueApi.create(formData);
      const data = res.data;
      const issueId = data.issue.id;
      const duplicate = (data.duplicate_detected && data.likely_duplicates.length > 0)
        ? data.likely_duplicates[0]
        : null;

      // Store result; if animation already done, resolve immediately
      if (animationDoneRef.current) {
        setCreatedIssueId(issueId);
        if (duplicate) {
          setDuplicateCandidate(duplicate);
          setShowAIProgress(false);
          setIsSubmitting(false);
        } else {
          navigate(`/issues/${issueId}`);
        }
      } else {
        apiResultRef.current = { issueId, duplicate };
      }
    } catch (err) {
      const msg = err.response?.data?.detail?.message || err.response?.data?.detail || 'Failed to submit report. Please check image format and try again.';

      if (animationDoneRef.current) {
        setError(msg);
        setShowAIProgress(false);
        setIsSubmitting(false);
      } else {
        apiErrorRef.current = msg;
      }
    }
  };

  const handleSupportDuplicate = async (targetIssueId) => {
    try {
      await issueApi.support(targetIssueId);
      navigate(`/issues/${targetIssueId}`);
    } catch (err) {
      navigate('/dashboard');
    }
  };

  const handleContinueAnyway = () => {
    if (createdIssueId) {
      navigate(`/issues/${createdIssueId}`);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
          <span>Report a Civic Infrastructure Issue</span>
          <span className="px-2.5 py-0.5 rounded-full bg-sky-950 text-sky-400 border border-sky-800 text-[10px] uppercase font-bold flex items-center space-x-1">
            <Cloud className="w-3 h-3" />
            <span>Cloudinary Enabled</span>
          </span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">Upload a photo and set GPS location on map. Cloudinary & PyTorch AI will analyze your report.</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs font-medium flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {showAIProgress ? (
        <div className="py-8">
          <AIAnalysisProgress
            onComplete={handleAnimationComplete}
          />
          <p className="text-center text-xs text-slate-500 mt-4 animate-pulse">
            Uploading to Cloudinary & running AI pipeline… Please wait.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="glass-panel p-6 sm:p-8 space-y-6">
          
          {/* Photo Upload Area */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              1. Photograph the Issue *
            </label>
            <div className="border-2 border-dashed border-slate-700 hover:border-sky-500/50 rounded-2xl p-6 text-center transition-all bg-slate-950/40">
              {imagePreview ? (
                <div className="relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-64 rounded-xl mx-auto border border-slate-700 shadow-xl"
                  />
                  <button
                    type="button"
                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                    className="mt-3 px-3 py-1.5 rounded-lg bg-rose-900/60 text-rose-300 hover:bg-rose-800 text-xs font-semibold"
                  >
                    Remove &amp; Retake Photo
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center justify-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-sky-950 text-sky-400 border border-sky-800 flex items-center justify-center shadow-lg">
                    <Camera className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-sky-400 hover:underline">Click to upload photo</span>
                    <span className="text-xs text-slate-400 block mt-0.5">JPG, PNG or WEBP (Direct Cloudinary Storage)</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Issue Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              2. Select Problem Category *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                    category === cat.id
                      ? 'bg-sky-600/20 border-sky-500 text-sky-300 shadow-md shadow-sky-950/50'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Map & GPS Geolocation Picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Compass className="w-4 h-4 text-sky-400" />
                <span>3. Geotag Issue Location (Browser GPS &amp; Draggable Map Pin) *</span>
              </label>
              <button
                type="button"
                onClick={handleGetLocation}
                className="text-xs text-sky-400 hover:underline flex items-center space-x-1 font-semibold"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>My GPS Location</span>
              </button>
            </div>

            <div className="mb-3 p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
              <span>Selected GPS: <strong>{lat.toFixed(6)}</strong>, <strong>{lng.toFixed(6)}</strong></span>
              <span className="text-[11px] text-sky-400 font-mono font-semibold">{locationStatus}</span>
            </div>

            {/* Interactive Leaflet Location Picker Map */}
            <IssueMap
              center={[lat, lng]}
              zoom={15}
              selectedLocation={[lat, lng]}
              onLocationSelect={(newLat, newLng) => {
                setLat(newLat);
                setLng(newLng);
                setLocationStatus(`Pin Moved: ${newLat.toFixed(4)}, ${newLng.toFixed(4)}`);
              }}
              height="280px"
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              💡 <strong>Tip:</strong> Drag the blue pin or click anywhere on the map above to precisely mark the issue location.
            </p>
          </div>

          {/* Title & Description */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Issue Title (Optional)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Deep pothole outside 5th Avenue school gate"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-sky-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Description (Optional)
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide any additional details or safety hazards..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-sky-500 outline-none"
              />
            </div>
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={isSubmitting || !imageFile}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-base shadow-xl shadow-sky-600/30 flex items-center justify-center space-x-2 transition-all hover:scale-[1.01] disabled:opacity-50"
          >
            <span>Upload Image to Cloudinary &amp; Run AI Pipeline</span>
            <ArrowRight className="w-5 h-5" />
          </button>

        </form>
      )}

      {/* Duplicate Modal suggestion if detected */}
      {duplicateCandidate && (
        <DuplicateModal
          candidate={duplicateCandidate}
          onSupport={handleSupportDuplicate}
          onClose={() => setDuplicateCandidate(null)}
          onContinueAnyway={handleContinueAnyway}
        />
      )}

    </div>
  );
};
