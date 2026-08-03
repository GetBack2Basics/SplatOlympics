import React from 'react';
import { FolderOpen, ArrowRight, Sparkles, Check, Trash2 } from 'lucide-react';
import { QualityPreset } from '../types';
import { JobLocationBadge } from './JobLocationBadge';

export interface ProjectItem {
  id: string;
  name: string;
  photoCount: number;
  createdAt: number;
  lastJobId?: string;
  lastPlyUrl?: string;
}

interface ProjectSelectorBarProps {
  projects: ProjectItem[];
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
  onDeleteProject?: (id: string) => void;
  selectedQuality: QualityPreset;
  onSelectQuality: (quality: QualityPreset) => void;
  onGenerateModel: () => void;
  isGenerating?: boolean;
}

export const ProjectSelectorBar: React.FC<ProjectSelectorBarProps> = ({
  projects,
  selectedProjectId,
  onSelectProject,
  onDeleteProject,
  selectedQuality,
  onSelectQuality,
  onGenerateModel,
  isGenerating = false,
}) => {
  const activeProject = projects.find((p) => p.id === selectedProjectId) || projects[0] || null;

  const QUALITY_OPTIONS: { id: QualityPreset; label: string; splats: string; desc: string }[] = [
    { id: 'draft', label: 'Draft', splats: '142K Splats', desc: '10k steps (Fast test)' },
    { id: 'standard', label: 'Standard', splats: '464K Splats', desc: '30k steps (Balanced)' },
    { id: 'high', label: 'High', splats: '719K Splats', desc: '30k steps (Sharp details)' },
    { id: 'ultra', label: 'Ultra 8K', splats: '2.0M Splats', desc: 'Maximum photorealistic density' },
  ];

  return (
    <div className="bg-splat-cardBg/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-splat-neonPurple/10 border border-splat-neonPurple/30 text-splat-neonPurple rounded-xl">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-200">
              Stage 2: Select Project & Create 3D Model
            </h2>
            <p className="text-xs text-slate-400">Choose active project (continued from Stage 1 or open existing) & select quality</p>
          </div>
        </div>

        {/* Project Selector Dropdown & Delete Button */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-400 uppercase font-mono">Select Project:</span>
          <select
            value={activeProject ? activeProject.id : ''}
            onChange={(e) => onSelectProject(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-splat-neonCyan text-xs font-bold font-mono px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-splat-neonCyan transition-all cursor-pointer"
          >
            {projects.length === 0 && <option value="">No projects available</option>}
            {projects.map((p) => (
              <option key={p.id} value={p.id} className="bg-slate-950 text-slate-200">
                {p.name} ({p.photoCount} Photos)
              </option>
            ))}
          </select>

          {onDeleteProject && activeProject && (
            <button
              onClick={() => onDeleteProject(activeProject.id)}
              className="p-2 bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-rose-300 hover:text-white rounded-xl transition-all shadow-md active:scale-95 flex items-center space-x-1 text-xs font-bold"
              title={`Delete project "${activeProject.name}" and its 3D model files`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Delete Project</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Project Info Card */}
      {activeProject && (
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Active Project:</span>
              <JobLocationBadge
                jobId={activeProject.lastJobId}
                datasetName={activeProject.name}
                plyFileUrl={activeProject.lastPlyUrl}
              />
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Dataset ID: {activeProject.id} • {activeProject.photoCount} Photos Ingested
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-1 rounded-full font-bold">
              Ready for 3D Reconstruction
            </span>
          </div>
        </div>
      )}

      {/* Quality Preset Selection Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
            <Sparkles className="w-4 h-4 text-splat-neonCyan" />
            <span>Select 3D Reconstruction Quality Tier</span>
          </span>
          <span className="text-xs font-mono font-bold text-splat-neonGreen bg-slate-900 border border-slate-700 px-2.5 py-0.5 rounded-lg">
            Target: {QUALITY_OPTIONS.find((q) => q.id === selectedQuality)?.splats}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {QUALITY_OPTIONS.map((q) => (
            <button
              key={q.id}
              type="button"
              onClick={() => onSelectQuality(q.id)}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                selectedQuality === q.id
                  ? 'bg-slate-900 border-splat-neonCyan text-white shadow-lg ring-2 ring-splat-neonCyan/40'
                  : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold font-mono uppercase">{q.label}</span>
                {selectedQuality === q.id && <Check className="w-3.5 h-3.5 text-splat-neonCyan" />}
              </div>
              <span className="text-[11px] font-mono font-extrabold text-splat-neonGreen block mb-1">
                {q.splats}
              </span>
              <p className="text-[10px] text-slate-400">{q.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Action Button: Generate 3D PLY/SPLAT Model */}
      <button
        onClick={onGenerateModel}
        disabled={!activeProject || isGenerating}
        className={`w-full py-3.5 px-6 rounded-xl font-extrabold text-xs sm:text-sm uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center space-x-2 shadow-2xl ${
          activeProject
            ? 'bg-gradient-to-r from-splat-neonCyan via-splat-neonPurple to-splat-neonGreen text-black shadow-splat-neonCyan/30 hover:brightness-110 ring-2 ring-splat-neonCyan/50'
            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
        }`}
      >
        <span>
          {isGenerating
            ? 'Processing 3D Gaussian Splatting Reconstruction...'
            : `Create 3D PLY/SPLAT Model (${activeProject ? activeProject.name : 'Project'} [${selectedQuality.toUpperCase()}])`}
        </span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
