import React from 'react';
import { ValidatedPhoto, AngleSector } from '../types';
import { Trash2, AlertCircle, Camera, Sliders, Copy, CheckCircle2 } from 'lucide-react';

interface PhotoGridPreviewProps {
  photos: ValidatedPhoto[];
  onDeletePhoto: (id: string) => void;
  onUpdateAngleSector: (id: string, sector: AngleSector) => void;
}

export const PhotoGridPreview: React.FC<PhotoGridPreviewProps> = ({
  photos,
  onDeletePhoto,
  onUpdateAngleSector,
}) => {
  const SECTORS: AngleSector[] = ['North', 'East', 'South', 'West', 'Overhead'];

  if (photos.length === 0) {
    return (
      <div className="bg-splat-cardBg/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center text-slate-500 min-h-[300px]">
        <Camera className="w-10 h-10 mb-3 text-slate-600 animate-pulse" />
        <h3 className="text-sm font-bold text-slate-300 mb-1">No Photos in Current Dataset</h3>
        <p className="text-xs max-w-sm">
          Upload multi-angle photos above or click "Load Sample Batch" to analyze image metadata & coverage.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-splat-cardBg/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-splat-neonGreen/10 rounded-xl border border-splat-neonGreen/20 text-splat-neonGreen">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-wide uppercase text-slate-200">Dataset Photo Grid</h2>
            <p className="text-xs text-slate-400">Validated Multi-Angle Captures ({photos.length})</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 px-2.5 py-1 rounded-full font-bold">
            {photos.filter((p) => !p.isBlurry).length} Sharp
          </span>
          {photos.filter((p) => p.isBlurry).length > 0 && (
            <span className="bg-rose-950/80 border border-rose-800/80 text-rose-400 px-2.5 py-1 rounded-full font-bold animate-pulse">
              {photos.filter((p) => p.isBlurry).length} Blurry
            </span>
          )}
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto max-h-[500px] pr-1">
        {photos.map((photo) => {
          const isBlurry = photo.isBlurry;
          const isDuplicate = photo.isDuplicate;

          return (
            <div
              key={photo.id}
              className={`group relative bg-slate-900/90 border rounded-2xl overflow-hidden transition-all duration-200 ${
                isBlurry
                  ? 'border-rose-500/60 ring-1 ring-rose-500/30'
                  : isDuplicate
                  ? 'border-amber-500/60'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
                <img
                  src={photo.previewUrl}
                  alt={photo.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Status Badges Overlay */}
                <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold backdrop-blur-md border ${
                      photo.sharpnessScore >= 60
                        ? 'bg-emerald-950/90 text-emerald-300 border-emerald-600'
                        : photo.sharpnessScore >= 38
                        ? 'bg-amber-950/90 text-amber-300 border-amber-600'
                        : 'bg-rose-950/90 text-rose-300 border-rose-600'
                    }`}
                  >
                    Sharpness: {photo.sharpnessScore}
                  </span>

                  {isBlurry && (
                    <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white shadow-md animate-pulse">
                      <AlertCircle className="w-3 h-3" />
                      <span>Blurry</span>
                    </span>
                  )}

                  {isDuplicate && (
                    <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-600 text-black shadow-md">
                      <Copy className="w-3 h-3" />
                      <span>Duplicate</span>
                    </span>
                  )}
                </div>

                {/* Delete Button Overlay */}
                <button
                  onClick={() => onDeletePhoto(photo.id)}
                  className="absolute top-2 right-2 p-1.5 rounded-xl bg-slate-950/80 hover:bg-rose-900 text-slate-300 hover:text-white backdrop-blur-md transition-all active:scale-95 shadow-md opacity-80 group-hover:opacity-100"
                  title="Remove photo from dataset"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* EXIF Metadata Badge Bar */}
                <div className="absolute bottom-0 inset-x-0 bg-slate-950/90 backdrop-blur-md px-2.5 py-1 flex items-center justify-between text-[10px] font-mono text-slate-300 border-t border-slate-800">
                  <span>{photo.metadata.width}x{photo.metadata.height}</span>
                  <span>{photo.metadata.focalLength}mm</span>
                  <span className="truncate max-w-[80px]">{photo.metadata.cameraModel}</span>
                </div>
              </div>

              {/* Photo Information & Angle Sector Selector */}
              <div className="p-3 flex items-center justify-between gap-2">
                <div className="truncate">
                  <span className="text-xs font-semibold text-slate-200 block truncate" title={photo.name}>
                    {photo.name}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {(photo.sizeBytes / (1024 * 1024)).toFixed(1)} MB
                  </span>
                </div>

                {/* Sector Selector Dropdown */}
                <div className="flex items-center">
                  <select
                    value={photo.angleSector}
                    onChange={(e) => onUpdateAngleSector(photo.id, e.target.value as AngleSector)}
                    className="bg-slate-950 border border-slate-800 text-splat-neonCyan font-mono text-[11px] font-bold rounded-lg px-2 py-1 focus:outline-none focus:border-splat-neonCyan cursor-pointer"
                  >
                    {SECTORS.map((sec) => (
                      <option key={sec} value={sec}>
                        {sec}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
