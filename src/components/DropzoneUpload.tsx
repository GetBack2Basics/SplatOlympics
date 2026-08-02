import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, Sparkles, CheckCircle2, AlertTriangle, Camera } from 'lucide-react';

interface DropzoneUploadProps {
  onFilesSelected: (files: File[]) => void;
  isAnalyzing: boolean;
  onLoadSampleBatch?: () => void;
  onOpenCamera?: () => void;
}

export const DropzoneUpload: React.FC<DropzoneUploadProps> = ({
  onFilesSelected,
  isAnalyzing,
  onLoadSampleBatch,
  onOpenCamera,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const validFiles = Array.from(e.dataTransfer.files).filter((f) =>
        /\.(jpg|jpeg|png|webp)$/i.test(f.name)
      );
      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const validFiles = Array.from(e.target.files).filter((f) =>
        /\.(jpg|jpeg|png|webp)$/i.test(f.name)
      );
      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    }
  };

  return (
    <div className="bg-splat-cardBg/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-splat-neonCyan/10 rounded-xl border border-splat-neonCyan/20 text-splat-neonCyan">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wide uppercase text-slate-200">Dataset Collector</h2>
              <p className="text-xs text-slate-400">Multi-Angle Photo Ingestion Engine</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onOpenCamera && (
              <button
                onClick={onOpenCamera}
                disabled={isAnalyzing}
                className="flex items-center space-x-1.5 bg-splat-neonCyan/20 hover:bg-splat-neonCyan/30 text-splat-neonCyan border border-splat-neonCyan/40 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                title="Open live web camera to take photos"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Use Live Camera</span>
              </button>
            )}

            {onLoadSampleBatch && (
              <button
                onClick={onLoadSampleBatch}
                disabled={isAnalyzing}
                className="flex items-center space-x-1.5 bg-splat-neonPurple/20 hover:bg-splat-neonPurple/30 text-splat-neonPurple border border-splat-neonPurple/40 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                title="Load sample multi-angle dataset for testing"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Sample Batch</span>
              </button>
            )}
          </div>
        </div>

        {/* Drop Zone Box */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${
            isDragOver
              ? 'border-splat-neonCyan bg-splat-neonCyan/10 scale-[1.01]'
              : 'border-slate-700 hover:border-slate-500 bg-slate-900/60 hover:bg-slate-900/90'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-splat-neonCyan/20 via-splat-neonPurple/20 to-splat-neonGreen/20 border border-slate-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <ImageIcon className="w-7 h-7 text-splat-neonCyan" />
          </div>

          <h3 className="text-sm font-extrabold text-slate-200 mb-1">
            Drag & Drop or Take Photos
          </h3>
          <p className="text-xs text-slate-400 max-w-xs mb-3">
            Select or capture 12–36 photos taken around your subject from all cardinal directions and overhead angles.
          </p>

          <div className="flex flex-wrap justify-center items-center gap-2 text-[11px] font-mono text-slate-400">
            {onOpenCamera && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenCamera();
                }}
                className="bg-splat-neonCyan/20 border border-splat-neonCyan/40 text-splat-neonCyan px-2.5 py-1 rounded-lg font-bold flex items-center space-x-1 hover:bg-splat-neonCyan/30 transition-all"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Snap via Camera</span>
              </button>
            )}

            {onLoadSampleBatch && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onLoadSampleBatch();
                }}
                className="bg-amber-400/20 border border-amber-400/50 text-amber-300 px-2.5 py-1 rounded-lg font-bold flex items-center space-x-1 hover:bg-amber-400/30 transition-all"
                title="Import 15 sample photos from Box Cactus GS dataset"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load Sample Box Photos</span>
              </button>
            )}

            <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">JPEG / PNG</span>
            <span className="text-slate-500">• Max 25MB/img</span>
          </div>

          {isAnalyzing && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-4">
              <div className="w-8 h-8 border-4 border-splat-neonCyan border-t-transparent rounded-full animate-spin mb-2" />
              <span className="text-xs font-bold text-splat-neonCyan animate-pulse">
                Analyzing EXIF metadata, sharpness & angle coverage...
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Guidelines Footer */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-medium">
        <div className="flex items-center space-x-1.5 text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Automatic Blur & EXIF Validation</span>
        </div>
        <div className="flex items-center space-x-1 text-amber-400">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Min 70% Overlap Recommended</span>
        </div>
      </div>
    </div>
  );
};
