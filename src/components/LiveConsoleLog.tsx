import React, { useEffect, useRef, useState } from 'react';
import { LogMessage } from '../types';
import { Terminal, Search, Trash2 } from 'lucide-react';

interface LiveConsoleLogProps {
  logs: LogMessage[];
  onClearLogs?: () => void;
}

export const LiveConsoleLog: React.FC<LiveConsoleLogProps> = ({ logs, onClearLogs }) => {
  const [filterText, setFilterText] = useState('');
  const logEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const filteredLogs = logs.filter(
    (l) =>
      l.message.toLowerCase().includes(filterText.toLowerCase()) ||
      l.stage.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="bg-splat-cardBg/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-full min-h-[380px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-slate-900 rounded-xl border border-slate-800 text-slate-300">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-wide uppercase text-slate-200">Live Console Log</h2>
            <p className="text-xs text-slate-400">COLMAP & Splatting Iteration Telemetry</p>
          </div>
        </div>

        {/* Filter Input */}
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Filter logs..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-300 focus:outline-none focus:border-splat-neonCyan font-mono"
            />
          </div>
        </div>
      </div>

      {/* Terminal Viewport */}
      <div className="flex-1 bg-slate-950/95 rounded-xl border border-slate-900 p-4 font-mono text-xs overflow-y-auto max-h-[320px] space-y-1.5 selection:bg-slate-800">
        {filteredLogs.length === 0 ? (
          <div className="text-slate-600 italic py-8 text-center">
            Waiting for COLMAP feature matching logs & iteration telemetry...
          </div>
        ) : (
          filteredLogs.map((log) => {
            const levelClass =
              log.level === 'success'
                ? 'text-emerald-400 font-bold'
                : log.level === 'error'
                ? 'text-rose-400 font-bold'
                : log.level === 'warn'
                ? 'text-amber-400'
                : 'text-slate-300';

            return (
              <div key={log.id} className="flex items-start space-x-2 leading-relaxed">
                <span className="text-slate-500 text-[11px] font-semibold">{log.timestamp}</span>
                <span className="text-splat-neonCyan font-bold">[{log.stage}]</span>
                <span className={levelClass}>{log.message}</span>
              </div>
            );
          })
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
};
