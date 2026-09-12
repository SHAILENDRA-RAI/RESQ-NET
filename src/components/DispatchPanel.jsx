import { Radio, MapPin, Clock, Shield, Award } from 'lucide-react';
import { generateExplanation } from '../simulation/scoring.js';
import { rankCandidates } from '../simulation/scoring.js';
import { SCORING_CONFIG } from '../simulation/scoring.js';

const RISK_COLORS = {
  CRITICAL: 'text-red-400 bg-red-500/10',
  HIGH: 'text-amber-400 bg-amber-500/10',
  MEDIUM: 'text-yellow-400 bg-yellow-500/10',
  LOW: 'text-green-400 bg-green-500/10',
};

export default function DispatchPanel({ incident, vehicles, selectedVehicleId, setSelectedCandidateVehicle, algorithm }) {
  if (!incident) {
    return (
      <div className="glass-card p-4 h-full flex items-center justify-center">
        <div className="text-center text-slate-500 text-sm">
          <Radio className="w-6 h-6 mx-auto mb-2 opacity-50" />
          Select an incident to see dispatch intelligence
        </div>
      </div>
    );
  }

  const idleVehicles = vehicles.filter((v) => v.status === 'IDLE');
  const candidates = rankCandidates(incident, vehicles, SCORING_CONFIG);
  const best = candidates[0];
  const explanation = generateExplanation(incident, best, candidates);

  return (
    <div className="glass-card p-4 flex flex-col h-full overflow-hidden">
      {/* Incident header */}
      <div className="mb-3 pb-3 border-b border-navy-700/50">
        <div className="flex items-center gap-2 mb-2">
          <div className={`px-2 py-0.5 rounded text-xs font-bold ${
            incident.priority === 'P3' ? 'bg-red-500/20 text-red-400' :
            incident.priority === 'P2' ? 'bg-orange-500/20 text-orange-400' :
            'bg-amber-500/20 text-amber-400'
          }`}>
            {incident.priority}
          </div>
          <span className="text-sm font-bold text-white">Incident {incident.id}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            ({incident.x.toFixed(1)}, {incident.y.toFixed(1)})
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Arrived: min {incident.arrivalTime}
          </div>
        </div>
        {incident.assignedVehicleId && (
          <div className="mt-2 text-[11px] text-accent-cyan">
            Assigned: {incident.assignedVehicleId} · Response: {incident.responseTime?.toFixed(1)} min
          </div>
        )}
      </div>

      {/* Candidate ranking */}
      <div className="flex-1 overflow-auto">
        <div className="text-[10px] text-slate-500 mb-2 font-medium uppercase tracking-wide">
          Candidate Vehicles ({idleVehicles.length} idle)
        </div>
        <div className="space-y-1.5">
          {candidates.slice(0, 8).map((c, idx) => {
            const isSelected = selectedVehicleId === c.vehicleId;
            const isBest = idx === 0;
            return (
              <button
                key={c.vehicleId}
                onClick={() => setSelectedCandidateVehicle(c.vehicleId)}
                className={`w-full text-left rounded-lg p-2 border transition-all ${
                  isSelected
                    ? 'border-accent-cyan bg-accent-cyan/10'
                    : isBest
                    ? 'border-green-500/30 bg-green-500/5'
                    : 'border-navy-700/50 bg-navy-800/30 hover:border-navy-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {isBest && <Award className="w-3 h-3 text-green-400" />}
                    <span className="text-xs font-bold text-slate-200 font-mono">{c.vehicleId}</span>
                    <span className="text-[9px] text-slate-500">{c.vehicle.quadrant}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-300 font-mono">
                    {c.totalCost.toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-slate-400">
                  <span>ETA {c.responseTime.toFixed(1)}m</span>
                  <span className={`px-1.5 py-0.5 rounded ${RISK_COLORS[c.coverageRiskLevel] || RISK_COLORS.LOW}`}>
                    {c.coverageRiskLevel}
                  </span>
                  <span className="text-slate-500">Q:{c.idleInQuadrantAfter}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Explanation */}
      {best && (
        <div className="mt-3 pt-3 border-t border-navy-700/50">
          <div className="text-[10px] text-slate-500 mb-1 font-medium uppercase tracking-wide">
            {algorithm === 'resqnet' ? 'Why this vehicle?' : 'Nearest Available Selection'}
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">{explanation}</p>
        </div>
      )}
    </div>
  );
}
