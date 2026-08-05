import React from 'react';
import { AngleCoverage } from '../types';
import { Compass, CheckCircle, AlertCircle } from 'lucide-react';

interface AngleCoverageRadarProps {
  coverage: AngleCoverage;
}

export const AngleCoverageRadar: React.FC<AngleCoverageRadarProps> = ({ coverage }) => {
  const sectors = [
    { name: 'North', count: coverage.North || 0, pos: 'top-2 left-1/2 -translate-x-1/2' },
    { name: 'East', count: coverage.East || 0, pos: 'top-1/2 right-2 -translate-y-1/2' },
    { name: 'South', count: coverage.South || 0, pos: 'bottom-2 left-1/2 -translate-x-1/2' },
    { name: 'West', count: coverage.West || 0, pos: 'top-1/2 left-2 -translate-y-1/2' },
    { name: 'Overhead', count: coverage.Overhead || 0, pos: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' },
  ];

  const totalShots = Object.values(coverage).reduce((a, b) => a + b, 0);
  const coveredSectorsCount = Object.values(coverage).filter((c) => c > 0).length;

  return (
    <div className="bg-splat-cardBg/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-splat-neonPurple/10 rounded-xl border border-splat-neonPurple/20 text-splat-neonPurple">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-wide uppercase text-slate-200">Camera Angle Radar</h2>
            <p className="text-xs text-slate-400">360° Viewpoint Distribution</p>
          </div>
        </div>

        <div className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-slate-300">
          {coveredSectorsCount}/5 Sectors Covered
        </div>
      </div>

      {/* Radar Graphic Container */}
      <div className="relative w-full h-52 my-3 bg-slate-950/80 rounded-2xl border border-slate-800/80 flex items-center justify-center overflow-hidden">
        {/* Concentric Radar Rings & Three Donuts Elevation Guides */}
        <div className="absolute w-44 h-44 rounded-full border border-slate-800/60 animate-ping opacity-25" />
        {/* Upper Donut Ring */}
        <div className="absolute w-40 h-40 rounded-full border border-dashed border-splat-neonCyan/40 flex items-start justify-center pt-1">
          <span className="text-[9px] font-mono text-splat-neonCyan/70 font-bold bg-slate-950 px-1 rounded">Upper Donut</span>
        </div>
        {/* Mid Donut Ring */}
        <div className="absolute w-28 h-28 rounded-full border border-slate-700/80 flex items-start justify-center pt-0.5">
          <span className="text-[9px] font-mono text-slate-400 font-bold bg-slate-950 px-1 rounded">Mid Donut</span>
        </div>
        {/* Base Donut Ring */}
        <div className="absolute w-16 h-16 rounded-full border border-dashed border-splat-neonPurple/50 flex items-start justify-center">
          <span className="text-[8px] font-mono text-splat-neonPurple/80 font-bold bg-slate-950 px-0.5 rounded">Base Donut</span>
        </div>

        {/* Crosshair Axes */}
        <div className="absolute inset-x-6 top-1/2 border-b border-slate-800/80" />
        <div className="absolute inset-y-6 left-1/2 border-r border-slate-800/80" />

        {/* Sector Nodes */}
        {sectors.map((s) => {
          const hasShots = s.count > 0;
          return (
            <div key={s.name} className={`absolute ${s.pos} z-10`}>
              <div
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold shadow-lg transition-transform ${
                  hasShots
                    ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-300 shadow-emerald-950'
                    : 'bg-rose-950/90 border-rose-500/60 text-rose-300 shadow-rose-950 animate-pulse'
                }`}
              >
                {hasShots ? (
                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-3 h-3 text-rose-400" />
                )}
                <span>{s.name}:</span>
                <span className="font-mono text-white">{s.count}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Frame Overlap & Pattern Indicator */}
      <div className="mb-3 px-3 py-2 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-splat-neonCyan animate-pulse" />
          <span className="text-slate-300 font-medium">Est. Frame Overlap:</span>
          <span className={`font-mono font-bold ${totalShots >= 12 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {totalShots >= 12 ? '≥ 45% (Optimal)' : totalShots >= 6 ? '33% (Min NYT Standard)' : '< 25% (Sparse)'}
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
          3-Donuts Orbit
        </span>
      </div>

      {/* Footer Sector Counts */}
      <div className="grid grid-cols-5 gap-1 pt-3 border-t border-slate-800 text-center">
        {sectors.map((s) => (
          <div key={s.name} className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-1.5">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">{s.name}</span>
            <span className={`text-xs font-mono font-bold ${s.count > 0 ? 'text-splat-neonCyan' : 'text-slate-500'}`}>
              {s.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
