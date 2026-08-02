import React from 'react';
import { Box, ShieldCheck, Layers, Sparkles } from 'lucide-react';

interface BentoGridProps {
  children: React.ReactNode;
}

export const BentoGrid: React.FC<BentoGridProps> = ({ children }) => {
  return (
    <div className="min-h-screen w-full bg-splat-darkBg bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-splat-darkBg to-black text-slate-100 p-4 sm:p-6 md:p-8 font-sans">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-splat-cardBg/80 backdrop-blur-xl border border-slate-800 p-4 rounded-2xl shadow-2xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-splat-neonCyan via-splat-neonPurple to-splat-neonGreen p-0.5 shadow-lg shadow-splat-neonCyan/20 flex items-center justify-center">
            <div className="w-full h-full bg-splat-darkBg rounded-[10px] flex items-center justify-center">
              <Box className="w-5 h-5 text-splat-neonCyan animate-pulse" />
            </div>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-splat-neonCyan bg-clip-text text-transparent">
              SplatOlympics <span className="text-xs font-mono text-splat-neonCyan px-2 py-0.5 rounded-full bg-splat-neonCyan/10 border border-splat-neonCyan/30 ml-1">Gaussian Splat Arena</span>
            </h1>
            <p className="text-xs text-slate-400">Multi-Angle Photo Ingestion, EXIF Metadata & 360° Angle Validation</p>
          </div>
        </div>

        {/* Cloud & Pipeline Badges */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-medium text-slate-300">
            <Layers className="w-3.5 h-3.5 text-splat-neonCyan" />
            <span>COLMAP & 3D GS Ready</span>
          </div>
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-medium text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-splat-neonGreen" />
            <span>Google Cloud Hosted</span>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {children}
      </main>
    </div>
  );
};
