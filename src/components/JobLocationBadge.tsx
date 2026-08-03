import React, { useState } from 'react';
import { Folder, Copy, Check } from 'lucide-react';

interface JobLocationBadgeProps {
  jobId?: string;
  datasetName: string;
  qualityPreset?: string;
  plyFileUrl?: string;
  showQuality?: boolean;
  className?: string;
}

export const JobLocationBadge: React.FC<JobLocationBadgeProps> = ({
  jobId,
  datasetName,
  qualityPreset,
  plyFileUrl,
  showQuality = false,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const filename = plyFileUrl
    ? plyFileUrl.replace('/uploads/models/', '')
    : jobId
    ? `model_${jobId}.ply`
    : 'sample_cactus.ply';

  const fullLocation = `c:\\Projects\\FunGIS\\SpatialOlympics\\uploads\\models\\${filename}`;
  const relativeLocation = `uploads/models/${filename}`;

  const displayName = showQuality && qualityPreset
    ? `${datasetName} [${qualityPreset.toUpperCase()}]`
    : datasetName;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(fullLocation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`relative inline-flex items-center group cursor-pointer ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="flex items-center space-x-2">
        <span className="font-bold text-slate-100 hover:text-splat-neonCyan transition-colors">
          {displayName}
        </span>
        <button
          onClick={handleCopy}
          type="button"
          className="p-1 rounded-md bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-splat-neonCyan transition-all"
          title="Click to copy file location to clipboard"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Hover Tooltip Popover */}
      {showTooltip && (
        <div className="absolute left-0 top-full mt-2 z-50 w-80 p-3 bg-slate-950/95 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl text-xs space-y-2 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-bold text-slate-400 pb-1 border-b border-slate-800">
            <span className="flex items-center space-x-1">
              <Folder className="w-3.5 h-3.5 text-splat-neonCyan" />
              <span>3D Model File Location</span>
            </span>
            <span className="text-splat-neonGreen font-mono">{copied ? 'Copied!' : 'Click to copy'}</span>
          </div>

          <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-200 break-all select-all flex items-center justify-between gap-2">
            <span className="truncate">{fullLocation}</span>
            <button
              onClick={handleCopy}
              type="button"
              className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-splat-neonCyan" />}
            </button>
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-400">
            <span>Relative Path:</span>
            <span className="font-mono text-slate-300">{relativeLocation}</span>
          </div>
        </div>
      )}
    </div>
  );
};
