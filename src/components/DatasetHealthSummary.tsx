import React from 'react';
import { DatasetHealthSummary as HealthSummaryType, QualityPreset } from '../types';
import { Activity, ShieldCheck, AlertCircle, ArrowRight, CheckCircle2, Sparkles, Sliders } from 'lucide-react';

interface DatasetHealthSummaryProps {
  summary: HealthSummaryType;
  selectedQuality: QualityPreset;
  onSelectQuality: (quality: QualityPreset) => void;
  onSubmitPipeline: () => void;
  isSubmitting?: boolean;
}

export const DatasetHealthSummary: React.FC<DatasetHealthSummaryProps> = ({
  summary,
  selectedQuality,
  onSelectQuality,
  onSubmitPipeline,
  isSubmitting,
}) => {
  const isReady = summary.isReadyForSplatting;
  const healthScore = summary.healthScore;

  const QUALITY_OPTIONS: { id: QualityPreset; label: string; splats: string; desc: string }[] = [
    { id: 'draft', label: 'Draft', splats: '142K Splats', desc: '10k steps (Fast test)' },
    { id: 'standard', label: 'Standard', splats: '464K Splats', desc: '30k steps (Balanced)' },
    { id: 'high', label: 'High', splats: '719K Splats', desc: '30k steps (Sharp details)' },
    { id: 'ultra', label: 'Ultra 8K', splats: '2.0M Splats', desc: 'Maximum photorealistic density' },
  ];

  return (
    <div className="bg-splat-cardBg/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-splat-neonCyan/10 rounded-xl border border-splat-neonCyan/20 text-splat-neonCyan">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wide uppercase text-slate-200">Splatting Readiness</h2>
              <p className="text-xs text-slate-400">3D Dataset Health & Quality Score</p>
            </div>
          </div>

          <div
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-full border text-xs font-bold ${
              isReady
                ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
                : 'bg-amber-950/80 border-amber-500/60 text-amber-300'
            }`}
          >
            {isReady ? <ShieldCheck className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5 animate-pulse" />}
            <span>{isReady ? '3D Pipeline Ready' : 'Incomplete Dataset'}</span>
          </div>
        </div>

        {/* Health Score Dial / Progress Meter */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex items-center justify-between mb-4">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block mb-0.5">
              Readiness Score
            </span>
            <div className="flex items-baseline space-x-1">
              <span
                className={`text-3xl font-black font-mono tracking-tight ${
                  healthScore >= 85
                    ? 'text-splat-neonGreen'
                    : healthScore >= 60
                    ? 'text-splat-neonCyan'
                    : 'text-amber-400'
                }`}
              >
                {healthScore}%
              </span>
              <span className="text-xs font-semibold text-slate-400">/ 100%</span>
            </div>
          </div>

          {/* Progress Circle Visual */}
          <div className="relative w-14 h-14 flex items-center justify-center">
            <svg className="w-14 h-14 transform -rotate-90">
              <circle cx="28" cy="28" r="22" stroke="currentColor" strokeWidth="5" className="text-slate-800" fill="transparent" />
              <circle
                cx="28"
                cy="28"
                r="22"
                stroke="currentColor"
                strokeWidth="5"
                className={healthScore >= 75 ? 'text-splat-neonGreen' : 'text-splat-neonCyan'}
                fill="transparent"
                strokeDasharray={138}
                strokeDashoffset={138 - (138 * healthScore) / 100}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-[11px] font-mono font-bold text-slate-200">{healthScore}%</span>
          </div>
        </div>

        {/* Quality Preset Selector Widget */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
              <Sliders className="w-3.5 h-3.5 text-splat-neonCyan" />
              <span>3D Reconstruction Quality</span>
            </span>
            <span className="text-[10px] font-mono text-splat-neonGreen font-bold bg-slate-900 border border-slate-700 px-2 py-0.5 rounded-md">
              {QUALITY_OPTIONS.find((q) => q.id === selectedQuality)?.splats}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {QUALITY_OPTIONS.map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={() => onSelectQuality(q.id)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  selectedQuality === q.id
                    ? 'bg-slate-900 border-splat-neonCyan text-white shadow-lg ring-1 ring-splat-neonCyan/40'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-bold font-mono">{q.label}</span>
                  <span className="text-[9px] font-mono font-extrabold text-splat-neonGreen">{q.splats}</span>
                </div>
                <p className="text-[10px] text-slate-500 truncate">{q.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Actionable Recommendations List */}
        <div className="space-y-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Quality Optimization Cues
          </span>

          {summary.recommendations.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl flex items-center space-x-2 text-xs text-emerald-400 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Optimal photo collection! Ready for COLMAP feature extraction and 3D Splatting.</span>
            </div>
          ) : (
            summary.recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl flex items-start space-x-2 text-xs text-slate-300"
              >
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>{rec}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={onSubmitPipeline}
        disabled={summary.totalPhotos === 0 || isSubmitting}
        className={`w-full py-4 px-6 rounded-xl font-extrabold text-xs sm:text-sm uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center space-x-2 shadow-2xl ${
          summary.totalPhotos > 0
            ? 'bg-gradient-to-r from-splat-neonCyan via-splat-neonPurple to-splat-neonGreen text-black shadow-splat-neonCyan/30 hover:brightness-110 ring-2 ring-splat-neonCyan/50 animate-pulse'
            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
        }`}
      >
        <span>{isSubmitting ? 'Ingesting Dataset into Pipeline...' : `Submit Dataset for 3D Splatting (${selectedQuality.toUpperCase()})`}</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
