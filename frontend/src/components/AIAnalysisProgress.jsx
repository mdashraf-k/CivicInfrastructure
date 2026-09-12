import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Loader2, Sparkles, Image, ShieldAlert, Cpu, Database, Award } from 'lucide-react';

const STAGES = [
  { id: 1, title: 'Image Received', desc: 'Decoding image bytes & MIME metadata check', icon: Image },
  { id: 2, title: 'OpenCV Quality Validation', desc: 'Evaluating resolution, brightness & blur metrics', icon: Cpu },
  { id: 3, title: 'YOLO Problem Detection', desc: 'Identifying civic issue category & bounding boxes', icon: Sparkles },
  { id: 4, title: 'CLIP Visual Embeddings', desc: 'Extracting 512-dim visual feature vector', icon: Database },
  { id: 5, title: 'FAISS Duplicate Search', desc: 'Comparing against nearby open issues in vector index', icon: ShieldAlert },
  { id: 6, title: 'Priority Score Engine', desc: 'Calculating deterministic 0–100 urgency score', icon: Award },
];

const STAGE_DELAY_MS = 700; // Delay between each stage advancing

export const AIAnalysisProgress = ({ onComplete = null }) => {
  const [activeStage, setActiveStage] = useState(1);
  const intervalRef = useRef(null);
  const onCompleteRef = useRef(onComplete);

  // Keep ref updated so the interval callback always sees the latest callback
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setActiveStage((prev) => {
        if (prev < STAGES.length) {
          return prev + 1;
        }
        // Last stage reached — clear interval and fire completion callback
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        // Use setTimeout to fire onComplete after the last stage renders
        setTimeout(() => {
          if (onCompleteRef.current) {
            onCompleteRef.current();
          }
        }, 400);
        return prev;
      });
    }, STAGE_DELAY_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []); // Run only once on mount

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl max-w-lg mx-auto">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2.5 rounded-xl bg-sky-950 text-sky-400 border border-sky-800/50">
          <Sparkles className="w-6 h-6 animate-spin" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">AI Analysis Pipeline Running</h3>
          <p className="text-xs text-slate-400">Processing photo with PyTorch, YOLO & CLIP models</p>
        </div>
      </div>

      <div className="space-y-4">
        {STAGES.map((stage) => {
          const Icon = stage.icon;
          const isDone = activeStage > stage.id;
          const isCurrent = activeStage === stage.id;

          return (
            <div
              key={stage.id}
              className={`flex items-start space-x-4 p-3 rounded-xl border transition-all ${
                isDone
                  ? 'bg-emerald-950/20 border-emerald-800/40 text-slate-200'
                  : isCurrent
                  ? 'bg-sky-950/40 border-sky-500/50 text-white shadow-lg shadow-sky-950/50'
                  : 'bg-slate-950/40 border-slate-800/60 text-slate-500 opacity-60'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : isCurrent ? (
                  <Loader2 className="w-5 h-5 text-sky-400 animate-spin" />
                ) : (
                  <div className="w-5 h-5 rounded-full border border-slate-700 flex items-center justify-center text-[10px] text-slate-500 font-bold">
                    {stage.id}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-semibold ${isCurrent ? 'text-sky-300' : isDone ? 'text-emerald-300' : 'text-slate-400'}`}>
                    {stage.title}
                  </span>
                  {isCurrent && <span className="text-[10px] bg-sky-900 text-sky-300 px-2 py-0.5 rounded font-mono uppercase">In Progress</span>}
                  {isDone && <span className="text-[10px] text-emerald-400 font-mono">Completed ✓</span>}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{stage.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall progress bar */}
      <div className="mt-5">
        <div className="flex justify-between text-[11px] text-slate-500 mb-1">
          <span>Pipeline Progress</span>
          <span>{Math.min(Math.round(((activeStage - 1) / STAGES.length) * 100), 100)}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full transition-all duration-700"
            style={{ width: `${Math.min(((activeStage - 1) / STAGES.length) * 100, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
