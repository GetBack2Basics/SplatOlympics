import React from 'react';
import { PipelineJob, JobStage } from '../types';
import { Cpu, Download, CheckCircle2, Play, Square, Layers, Flame, Gauge, Eye } from 'lucide-react';
import { JobLocationBadge } from './JobLocationBadge';

interface PipelineJobMonitorProps {
  job: PipelineJob | null;
  onCancelJob: (jobId: string) => void;
  onInspectModel?: (job: PipelineJob) => void;
}

export const PipelineJobMonitor: React.FC<PipelineJobMonitorProps> = ({ job, onCancelJob, onInspectModel }) => {
  if (!job) {
    return (
      <div className="bg-splat-cardBg/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center text-slate-500 min-h-[360px]">
        <Cpu className="w-12 h-12 mb-3 text-slate-600 animate-pulse" />
        <h3 className="text-sm font-bold text-slate-300 mb-1">No Active 3D Reconstruction Job</h3>
        <p className="text-xs max-w-sm">
          Select or upload a validated photo dataset in Stage 1 to launch a 3D Gaussian Splatting job.
        </p>
      </div>
    );
  }

  const STAGES: { stage: JobStage; label: string; desc: string }[] = [
    { stage: 'QUEUED', label: 'Queued', desc: 'Awaiting Pipeline Slot' },
    { stage: 'COLMAP_MATCHING', label: 'COLMAP Matching', desc: 'SIFT Feature Extraction & SfM' },
    { stage: 'POINT_CLOUD_INIT', label: 'Point Cloud Init', desc: 'Sparse Centroids & Poses' },
    { stage: 'SPLAT_TRAINING', label: 'Gaussian Splatting', desc: '30,000 Iterations & SH L=3' },
    { stage: 'COMPLETE', label: 'Reconstruction Complete', desc: 'PLY & SPLAT Assets Ready' },
  ];

  const getStageIndex = (stage: JobStage) => {
    switch (stage) {
      case 'QUEUED':
        return 0;
      case 'COLMAP_MATCHING':
        return 1;
      case 'POINT_CLOUD_INIT':
        return 2;
      case 'SPLAT_TRAINING':
        return 3;
      case 'COMPLETE':
        return 4;
      case 'FAILED':
        return -1;
    }
  };

  const currentIdx = getStageIndex(job.currentStage);
  const isCompleted = job.status === 'completed';

  return (
    <div className="bg-splat-cardBg/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-splat-neonCyan/10 rounded-xl border border-splat-neonCyan/20 text-splat-neonCyan">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold text-splat-neonCyan">{job.id}</span>
                <span className="text-[10px] text-slate-500 font-mono">({job.photoCount} Photos)</span>
              </div>
              <div className="mt-0.5">
                <JobLocationBadge
                  jobId={job.id}
                  datasetName={job.datasetName}
                  qualityPreset={job.qualityPreset}
                  plyFileUrl={job.plyFileUrl}
                  showQuality={true}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold font-mono border ${
                isCompleted
                  ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
                  : job.status === 'failed'
                  ? 'bg-rose-950/80 border-rose-500/60 text-rose-300'
                  : 'bg-splat-neonCyan/10 border-splat-neonCyan/40 text-splat-neonCyan animate-pulse'
              }`}
            >
              {job.status.toUpperCase()}
            </span>

            {job.status === 'processing' && (
              <button
                onClick={() => onCancelJob(job.id)}
                className="flex items-center space-x-1 px-3 py-1 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800 text-xs font-bold rounded-xl transition-all active:scale-95"
                title="Cancel processing job"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Cancel</span>
              </button>
            )}
          </div>
        </div>

        {/* Stage Timeline Stepper */}
        <div className="grid grid-cols-5 gap-2 mb-4">
          {STAGES.map((s, idx) => {
            const isActive = currentIdx === idx;
            const isPassed = currentIdx > idx || isCompleted;

            return (
              <div
                key={s.stage}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  isActive
                    ? 'bg-splat-neonCyan/10 border-splat-neonCyan text-splat-neonCyan ring-1 ring-splat-neonCyan/30'
                    : isPassed
                    ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-400'
                    : 'bg-slate-900/50 border-slate-800 text-slate-500'
                }`}
              >
                <span className="text-[10px] font-mono font-bold block mb-0.5">Stage 0{idx + 1}</span>
                <span className="text-xs font-bold block truncate" title={s.label}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Overall Progress Bar */}
        <div className="space-y-1.5 mb-4">
          <div className="flex justify-between text-xs font-mono text-slate-300 font-semibold">
            <span>Overall Progress</span>
            <span className="text-splat-neonCyan">{job.progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-splat-neonCyan via-splat-neonPurple to-splat-neonGreen"
              style={{ width: `${Math.max(2, job.progressPercent)}%` }}
            />
          </div>
        </div>

        {/* Real-time Iteration Telemetry Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {/* Iteration Counter */}
          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
            <div className="flex items-center space-x-1 text-[10px] text-slate-400 font-bold uppercase mb-1">
              <Play className="w-3 h-3 text-splat-neonCyan" />
              <span>Iterations</span>
            </div>
            <span className="text-sm font-black font-mono text-slate-100">
              {job.telemetry.iteration.toLocaleString()} / 30k
            </span>
          </div>

          {/* PSNR Quality Metric */}
          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
            <div className="flex items-center space-x-1 text-[10px] text-slate-400 font-bold uppercase mb-1">
              <Flame className="w-3 h-3 text-splat-neonGreen" />
              <span>Fidelity PSNR</span>
            </div>
            <span className="text-sm font-black font-mono text-splat-neonGreen">
              {job.telemetry.psnr > 0 ? `${job.telemetry.psnr} dB` : '---'}
            </span>
          </div>

          {/* Active 3D Gaussians Density */}
          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
            <div className="flex items-center space-x-1 text-[10px] text-slate-400 font-bold uppercase mb-1">
              <Layers className="w-3 h-3 text-splat-neonPurple" />
              <span>Gaussians</span>
            </div>
            <span className="text-sm font-black font-mono text-slate-100">
              {job.telemetry.activeGaussians > 0 ? `${(job.telemetry.activeGaussians / 1000).toFixed(0)}k` : '---'}
            </span>
          </div>

          {/* Loss Metric */}
          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
            <div className="flex items-center space-x-1 text-[10px] text-slate-400 font-bold uppercase mb-1">
              <Gauge className="w-3 h-3 text-amber-400" />
              <span>Loss Rate</span>
            </div>
            <span className="text-sm font-black font-mono text-slate-100">
              {job.telemetry.loss.toFixed(4)}
            </span>
          </div>
        </div>
      </div>

      {/* Model Download & 3D Inspection Buttons Footer */}
      {isCompleted && (
        <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center gap-3">
          {onInspectModel && (
            <button
              onClick={() => onInspectModel(job)}
              className="flex-1 w-full py-2.5 px-4 bg-gradient-to-r from-splat-neonGreen via-emerald-500 to-splat-neonCyan hover:brightness-110 text-black font-extrabold text-xs rounded-xl flex items-center justify-center space-x-2 transition-all shadow-lg shadow-splat-neonGreen/20 animate-pulse"
            >
              <Eye className="w-4 h-4 text-black" />
              <span>Inspect 3D Model in Viewport</span>
            </button>
          )}

          {job.plyFileUrl && (
            <a
              href={job.plyFileUrl}
              download
              className="flex-1 w-full py-2.5 px-4 bg-splat-neonCyan hover:bg-cyan-400 text-black font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition-all shadow-lg shadow-splat-neonCyan/20"
            >
              <Download className="w-4 h-4" />
              <span>Download (.PLY)</span>
            </a>
          )}

          {job.splatFileUrl && (
            <a
              href={job.splatFileUrl}
              download
              className="flex-1 w-full py-2.5 px-4 bg-splat-neonPurple hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition-all shadow-lg shadow-splat-neonPurple/20"
            >
              <Download className="w-4 h-4" />
              <span>Download (.SPLAT)</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
};
