import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Sparkles, MapPin, CheckCircle, ArrowRight, Activity, Users, Award } from 'lucide-react';

export const Landing = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      
      {/* Hero Section */}
      <div className="relative overflow-hidden pt-12 pb-20">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-sky-600/20 via-indigo-600/20 to-purple-600/20 blur-[120px] rounded-full -z-10 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-sky-950/80 border border-sky-800/60 text-sky-400 text-xs font-semibold mb-8">
            <Sparkles className="w-4 h-4" />
            <span>AI-Driven Civic Infrastructure Reporting & Resolution</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight mb-6">
            Empowering Citizens & Authorities to Fix Cities <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-indigo-400">Faster with AI</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            Photograph infrastructure issues, automatically classify problems, detect duplicate reports, calculate priority scores, and verify resolution evidence using advanced Computer Vision & PyTorch models.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-base shadow-xl shadow-sky-600/25 flex items-center justify-center space-x-2 transition-all hover:scale-[1.02]"
            >
              <span>Report an Issue</span>
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-base border border-slate-800 flex items-center justify-center transition-colors"
            >
              <span>Authority Admin Login</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="glass-panel p-6">
            <div className="w-12 h-12 rounded-xl bg-sky-950 text-sky-400 border border-sky-800 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Automated AI Detection</h3>
            <p className="text-sm text-slate-400">
              YOLO object detection & OpenCV quality checks classify potholes, waste accumulation, streetlights, and water leaks instantly.
            </p>
          </div>

          <div className="glass-panel p-6">
            <div className="w-12 h-12 rounded-xl bg-indigo-950 text-indigo-400 border border-indigo-800 flex items-center justify-center mb-4">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">CLIP & FAISS Duplicate Prevention</h3>
            <p className="text-sm text-slate-400">
              Visual feature embeddings prevent duplicate work orders by suggesting open reports nearby to support.
            </p>
          </div>

          <div className="glass-panel p-6">
            <div className="w-12 h-12 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Before / After AI Verification</h3>
            <p className="text-sm text-slate-400">
              Authority repair evidence photos are visually compared against original reports with resolution confidence scoring.
            </p>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 bg-slate-950 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} CivicFix Infrastructure Platform. All rights reserved.</p>
      </footer>

    </div>
  );
};
