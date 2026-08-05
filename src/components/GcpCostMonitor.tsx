import React, { useEffect, useState } from 'react';
import { DollarSign, ShieldAlert, Cpu, Sparkles, Layers, RefreshCw, Settings, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

export interface CostSummaryData {
  dailySpentUsd: number;
  dailyRemainingUsd: number;
  weeklySpentUsd: number;
  weeklyRemainingUsd: number;
  monthlySpentUsd: number;
  limits: {
    dailyLimitUsd: number;
    weeklyLimitUsd: number;
    monthlyLimitUsd: number;
  };
  items: {
    timestamp: number;
    jobId?: string;
    resourceType: string;
    description: string;
    costUsd: number;
  }[];
}

export const GcpCostMonitor: React.FC = () => {
  const [summary, setSummary] = useState<CostSummaryData | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(true); // Collapsed by default
  const [isEditingLimits, setIsEditingLimits] = useState(false);
  const [dailyLimitInput, setDailyLimitInput] = useState('10.00');
  const [weeklyLimitInput, setWeeklyLimitInput] = useState('50.00');
  const [isLoading, setIsLoading] = useState(false);

  const fetchSummary = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/cost/summary');
      const data = await res.json();
      if (data) {
        setSummary(data);
        setDailyLimitInput(data.limits.dailyLimitUsd.toString());
        setWeeklyLimitInput(data.limits.weeklyLimitUsd.toString());
      }
    } catch (err) {
      console.error('Failed to fetch GCP cost summary:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const handleSaveLimits = async () => {
    try {
      const res = await fetch('/api/cost/limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dailyLimitUsd: parseFloat(dailyLimitInput) || 10.0,
          weeklyLimitUsd: parseFloat(weeklyLimitInput) || 50.0,
        }),
      });
      const data = await res.json();
      if (data.summary) {
        setSummary(data.summary);
        setIsEditingLimits(false);
      }
    } catch (err) {
      console.error('Failed to update cost limits:', err);
    }
  };

  if (!summary) {
    return null;
  }

  const dailyPct = Math.min(100, (summary.dailySpentUsd / summary.limits.dailyLimitUsd) * 100);
  const weeklyPct = Math.min(100, (summary.weeklySpentUsd / summary.limits.weeklyLimitUsd) * 100);
  const isHighUsage = dailyPct >= 80 || weeklyPct >= 80;

  return (
    <div className="bg-splat-cardBg/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3 transition-all">
      {/* Header Bar with Collapse Toggle */}
      <div className="flex items-center justify-between cursor-pointer select-none" onClick={() => setIsCollapsed(!isCollapsed)}>
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 rounded-xl">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold tracking-wide uppercase text-slate-200 flex items-center gap-2">
              GCP Credit & Cost Monitor
              <span className="text-[10px] font-mono text-emerald-400">
                (${summary.dailySpentUsd.toFixed(2)} / ${summary.limits.dailyLimitUsd.toFixed(2)} Daily Limit)
              </span>
            </h2>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditingLimits(!isEditingLimits);
              if (isCollapsed) setIsCollapsed(false);
            }}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-[11px] flex items-center space-x-1 transition-all"
            title="Configure budget limits"
          >
            <Settings className="w-3 h-3" />
            <span>Limits</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed(!isCollapsed);
            }}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-xs flex items-center space-x-1 font-mono transition-all"
          >
            <span>{isCollapsed ? 'Expand' : 'Collapse'}</span>
            {isCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
          </button>
        </div>
      </div>

      {/* Expanded Content View */}
      {!isCollapsed && (
        <div className="pt-3 border-t border-slate-800 space-y-4">
          {/* Alert Banner if Budget Exceeded or High Usage */}
          {isHighUsage && (
            <div className="p-3 bg-amber-950/90 border border-amber-500/60 rounded-xl flex items-center space-x-3 text-xs text-amber-300">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
              <span>
                <strong>Budget Threshold Alert:</strong> GCP credit consumption has reached{' '}
                {dailyPct.toFixed(1)}% of your daily limit (${summary.limits.dailyLimitUsd.toFixed(2)}/day).
              </span>
            </div>
          )}

          {/* Budget Limit Configurator Modal / Inline Panel */}
          {isEditingLimits && (
            <div className="p-4 bg-slate-900 border border-slate-700 rounded-xl space-y-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                Configure Google Cloud Budget & Credit Limits
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 font-mono block mb-1">Daily Limit ($ USD)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={dailyLimitInput}
                    onChange={(e) => setDailyLimitInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-splat-neonCyan"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 font-mono block mb-1">Weekly Limit ($ USD)</label>
                  <input
                    type="number"
                    step="1"
                    value={weeklyLimitInput}
                    onChange={(e) => setWeeklyLimitInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-splat-neonCyan"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-1">
                <button
                  onClick={() => setIsEditingLimits(false)}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveLimits}
                  className="px-3 py-1 bg-splat-neonCyan text-black text-xs rounded-lg font-bold hover:bg-cyan-400"
                >
                  Save Limits
                </button>
              </div>
            </div>
          )}

          {/* Gauges Grid: Daily & Weekly Credit Gauges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Daily Credit Meter */}
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-300 uppercase tracking-wider">Daily Credit Usage</span>
                <span className="font-mono text-emerald-400 font-bold">
                  ${summary.dailySpentUsd.toFixed(4)} / ${summary.limits.dailyLimitUsd.toFixed(2)}
                </span>
              </div>

              <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    dailyPct > 80 ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.max(3, dailyPct)}%` }}
                />
              </div>

              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>Remaining Credits:</span>
                <span className="text-slate-200 font-bold">${summary.dailyRemainingUsd.toFixed(2)}</span>
              </div>
            </div>

            {/* Weekly Credit Meter */}
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-300 uppercase tracking-wider">Weekly Credit Usage</span>
                <span className="font-mono text-splat-neonCyan font-bold">
                  ${summary.weeklySpentUsd.toFixed(4)} / ${summary.limits.weeklyLimitUsd.toFixed(2)}
                </span>
              </div>

              <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    weeklyPct > 80 ? 'bg-amber-400' : 'bg-splat-neonCyan'
                  }`}
                  style={{ width: `${Math.max(3, weeklyPct)}%` }}
                />
              </div>

              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>Remaining Credits:</span>
                <span className="text-slate-200 font-bold">${summary.weeklyRemainingUsd.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Itemized Usage Ledger */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide">
              Recent Credit Deductions ({summary.items.length})
            </h3>
            <div className="bg-slate-950/90 border border-slate-900 rounded-xl p-3 max-h-[160px] overflow-y-auto space-y-1.5 font-mono text-xs">
              {summary.items.length === 0 ? (
                <div className="text-slate-600 italic text-center py-4">No credit usage recorded yet today.</div>
              ) : (
                summary.items.slice(0, 10).map((item, idx) => {
                  const timeStr = new Date(item.timestamp).toLocaleTimeString();
                  const badgeColor =
                    item.resourceType === 'GPU_COMPUTE'
                      ? 'text-splat-neonPurple bg-purple-950/60 border-purple-800/60'
                      : item.resourceType === 'ANALYSIS_API'
                      ? 'text-splat-neonCyan bg-cyan-950/60 border-cyan-800/60'
                      : 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60';

                  return (
                    <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-900/60 text-[11px]">
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-500">{timeStr}</span>
                        <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold ${badgeColor}`}>
                          {item.resourceType}
                        </span>
                        <span className="text-slate-300 truncate max-w-[220px] sm:max-w-[340px]">{item.description}</span>
                      </div>
                      <span className="text-emerald-400 font-bold">-${item.costUsd.toFixed(4)}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
