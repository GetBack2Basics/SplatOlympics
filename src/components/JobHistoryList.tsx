import React from 'react';
import { PipelineJob } from '../types';
import { Layers, Download, CheckCircle2, Clock, AlertTriangle, ExternalLink } from 'lucide-react';

interface JobHistoryListProps {
  jobs: PipelineJob[];
  activeJobId: string | null;
  onSelectJob: (id: string) => void;
  onStartNewJob?: () => void;
}

export const JobHistoryList: React.FC<JobHistoryListProps> = ({
  jobs,
  activeJobId,
  onSelectJob,
  onStartNewJob,
}) => {
  return (
    <div className="bg-splat-cardBg/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-full min-h-[380px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-splat-neonPurple/10 rounded-xl border border-splat-neonPurple/20 text-splat-neonPurple">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-wide uppercase text-slate-200">Reconstruction Jobs</h2>
            <p className="text-xs text-slate-400">Queue & Model Generation History ({jobs.length})</p>
          </div>
        </div>

        {onStartNewJob && (
          <button
            onClick={onStartNewJob}
            className="px-3 py-1.5 bg-splat-neonCyan hover:bg-cyan-400 text-black text-xs font-bold rounded-xl transition-all active:scale-95 shadow-md shadow-splat-neonCyan/20"
          >
            + New Job
          </button>
        )}
      </div>

      {/* Jobs List */}
      <div className="space-y-3 overflow-y-auto max-h-[340px] pr-1">
        {jobs.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs italic">
            No processing jobs queued. Trigger a 3D reconstruction job from Stage 1 photo dataset.
          </div>
        ) : (
          jobs.map((job) => {
            const isSelected = job.id === activeJobId;
            const isCompleted = job.status === 'completed';
            const isProcessing = job.status === 'processing';

            return (
              <div
                key={job.id}
                onClick={() => onSelectJob(job.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 border-splat-neonCyan ring-1 ring-splat-neonCyan/40 shadow-lg'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-slate-200">{job.id}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                        isCompleted
                          ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-300'
                          : isProcessing
                          ? 'bg-splat-neonCyan/10 border-splat-neonCyan/60 text-splat-neonCyan animate-pulse'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {job.currentStage}
                    </span>
                  </div>

                  {isCompleted && (
                    <div className="flex items-center space-x-1 text-emerald-400 text-xs font-bold font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{job.telemetry.psnr} dB</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{job.datasetName} ({job.photoCount} photos)</span>
                  <span className="font-mono">{job.progressPercent}%</span>
                </div>

                {/* Progress bar line */}
                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mt-2 border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isCompleted ? 'bg-emerald-400' : 'bg-splat-neonCyan'
                    }`}
                    style={{ width: `${Math.max(3, job.progressPercent)}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
