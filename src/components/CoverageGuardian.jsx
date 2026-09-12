import { Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { QUADRANTS } from '../simulation/generator.js';
import { getQuadrantStatus } from '../simulation/coverage.js';

export default function CoverageGuardian({ idleCounts, beforeCounts, afterCounts, selectedVehicleId, selectedVehicleQuadrant }) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-4 h-4 text-accent-cyan" />
        <h3 className="text-sm font-semibold text-white">Coverage Guardian</h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {QUADRANTS.map((q) => {
          const count = idleCounts[q];
          const status = getQuadrantStatus(count);
          const isAffected = selectedVehicleQuadrant === q && selectedVehicleId;
          const afterCount = afterCounts ? afterCounts[q] : count;

          const statusColor =
            status === 'OUTAGE' ? 'text-red-400' :
            status === 'AT RISK' ? 'text-amber-400' :
            'text-green-400';

          const bgColor =
            status === 'OUTAGE' ? 'bg-red-500/10 border-red-500/30' :
            status === 'AT RISK' ? 'bg-amber-500/10 border-amber-500/30' :
            'bg-green-500/10 border-green-500/30';

          return (
            <div key={q} className={`rounded-lg p-2.5 border ${bgColor} ${isAffected ? 'ring-1 ring-accent-cyan' : ''}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-300 font-mono">{q}</span>
                {status === 'OUTAGE' ? (
                  <XCircle className="w-3.5 h-3.5 text-red-400" />
                ) : status === 'AT RISK' ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                )}
              </div>
              <div className={`text-lg font-bold ${statusColor} font-mono`}>
                {count}
                {isAffected && afterCounts && (
                  <span className="text-xs text-slate-500 ml-1">→ {afterCount}</span>
                )}
              </div>
              <div className={`text-[10px] ${statusColor}`}>
                {status === 'OUTAGE' ? 'OUTAGE' : status === 'AT RISK' ? 'AT RISK' : 'COVERED'}
              </div>
            </div>
          );
        })}
      </div>

      {/* What-If section */}
      {selectedVehicleId && beforeCounts && afterCounts && (
        <div className="mt-3 pt-3 border-t border-navy-700/50">
          <div className="text-[10px] text-slate-400 mb-2 font-medium">WHAT-IF: Dispatch {selectedVehicleId}</div>
          <div className="flex items-center gap-2 text-[10px] font-mono">
            <div className="flex-1 bg-navy-800/50 rounded p-2">
              <div className="text-slate-500 mb-1">Before</div>
              <div className="text-slate-300">
                {QUADRANTS.map((q) => `${q}:${beforeCounts[q]}`).join(' | ')}
              </div>
            </div>
            <div className="text-slate-500">→</div>
            <div className="flex-1 bg-navy-800/50 rounded p-2">
              <div className="text-slate-500 mb-1">After</div>
              <div className="text-slate-300">
                {QUADRANTS.map((q) => {
                  const changed = afterCounts[q] !== beforeCounts[q];
                  return changed ? (
                    <span key={q} className={afterCounts[q] === 0 ? 'text-red-400 font-bold' : 'text-amber-400'}>
                      {q}:{afterCounts[q]}{' '}
                    </span>
                  ) : (
                    <span key={q} className="text-slate-400">{q}:{afterCounts[q]}{' '}</span>
                  );
                })}
              </div>
            </div>
          </div>
          {afterCounts[selectedVehicleQuadrant] === 0 && (
            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-red-400 font-medium">
              <AlertTriangle className="w-3 h-3" />
              Creates coverage outage in {selectedVehicleQuadrant}
            </div>
          )}
          {afterCounts[selectedVehicleQuadrant] === 1 && beforeCounts[selectedVehicleQuadrant] > 1 && (
            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-amber-400 font-medium">
              <AlertTriangle className="w-3 h-3" />
              Leaves {selectedVehicleQuadrant} at risk (1 idle)
            </div>
          )}
        </div>
      )}
    </div>
  );
}
