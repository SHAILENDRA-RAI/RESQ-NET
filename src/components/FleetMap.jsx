import { useMemo } from 'react';
import { getQuadrantIdleCounts, getQuadrantStatus } from '../simulation/coverage.js';
import { QUADRANTS } from '../simulation/generator.js';

const QUADRANT_BOUNDS = {
  Q1: { x: 0, y: 0 },
  Q2: { x: 50, y: 0 },
  Q3: { x: 0, y: 50 },
  Q4: { x: 50, y: 50 },
};

const PRIORITY_COLORS = {
  P1: '#f59e0b',
  P2: '#fb923c',
  P3: '#ef4444',
};

const PRIORITY_SIZES = {
  P1: 4,
  P2: 5,
  P3: 6,
};

export default function FleetMap({ simState, selectedIncidentId, setSelectedIncidentId, selectedCandidateVehicle }) {
  const vehicles = simState?.vehicles || [];
  const revealedIncidents = simState?.revealedIncidents || [];
  const assignments = simState?.assignments || [];
  const currentMinute = simState?.currentMinute || 0;

  const idleCounts = useMemo(() => getQuadrantIdleCounts(vehicles), [vehicles]);

  const toMapCoord = (x, y, size = 600) => ({
    cx: (x / 100) * size,
    cy: (y / 100) * size,
  });

  const MAP_SIZE = 600;

  // Active assignment lines (vehicle -> incident)
  const assignmentLines = useMemo(() => {
    return assignments
      .filter((a) => {
        const v = vehicles.find((vv) => vv.id === a.vehicleId);
        return v && v.status === 'BUSY' && v.assignedIncidentId === a.incidentId;
      })
      .map((a) => {
        const v = vehicles.find((vv) => vv.id === a.vehicleId);
        const inc = revealedIncidents.find((i) => i.id === a.incidentId);
        if (!v || !inc) return null;
        return { vehicle: v, incident: inc, assignment: a };
      })
      .filter(Boolean);
  }, [assignments, vehicles, revealedIncidents]);

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`}
        className="w-full h-auto rounded-xl"
        style={{ background: '#0d1320' }}
      >
        {/* Grid background */}
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#1e293b" strokeWidth="0.5" />
          </pattern>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect width={MAP_SIZE} height={MAP_SIZE} fill="url(#grid)" />

        {/* Quadrant dividers */}
        <line x1={MAP_SIZE / 2} y1={0} x2={MAP_SIZE / 2} y2={MAP_SIZE} stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
        <line x1={0} y1={MAP_SIZE / 2} x2={MAP_SIZE} y2={MAP_SIZE / 2} stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />

        {/* Quadrant labels and idle counts */}
        {QUADRANTS.map((q) => {
          const bounds = QUADRANT_BOUNDS[q];
          const labelX = (bounds.x + 25) / 100 * MAP_SIZE;
          const labelY = (bounds.y + 8) / 100 * MAP_SIZE;
          const status = getQuadrantStatus(idleCounts[q]);
          const statusColor = status === 'OUTAGE' ? '#ef4444' : status === 'AT RISK' ? '#f59e0b' : '#10b981';

          return (
            <g key={q}>
              <text
                x={labelX}
                y={labelY}
                textAnchor="middle"
                fill="#475569"
                fontSize="14"
                fontWeight="600"
                fontFamily="JetBrains Mono, monospace"
              >
                {q}
              </text>
              <text
                x={labelX}
                y={labelY + 16}
                textAnchor="middle"
                fill={statusColor}
                fontSize="10"
                fontWeight="500"
                fontFamily="JetBrains Mono, monospace"
              >
                {idleCounts[q]} idle
              </text>
            </g>
          );
        })}

        {/* Assignment lines */}
        {assignmentLines.map((line, idx) => {
          const vCoord = toMapCoord(line.vehicle.x, line.vehicle.y, MAP_SIZE);
          const iCoord = toMapCoord(line.incident.x, line.incident.y, MAP_SIZE);
          return (
            <line
              key={`line-${idx}`}
              x1={vCoord.cx}
              y1={vCoord.cy}
              x2={iCoord.cx}
              y2={iCoord.cy}
              stroke="#06b6d4"
              strokeWidth="1"
              strokeDasharray="3 3"
              opacity="0.5"
            />
          );
        })}

        {/* Incidents */}
        {revealedIncidents.map((inc) => {
          const coord = toMapCoord(inc.x, inc.y, MAP_SIZE);
          const isSelected = inc.id === selectedIncidentId;
          const color = PRIORITY_COLORS[inc.priority] || '#f59e0b';
          const size = PRIORITY_SIZES[inc.priority] || 4;
          const isWaiting = inc.status === 'WAITING';
          const isAssigned = inc.status === 'ASSIGNED';
          const isCompleted = inc.status === 'COMPLETED';

          return (
            <g key={inc.id} onClick={() => setSelectedIncidentId(inc.id)} style={{ cursor: 'pointer' }}>
              {isSelected && (
                <circle
                  cx={coord.cx}
                  cy={coord.cy}
                  r={size + 6}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2"
                  opacity="0.8"
                >
                  <animate attributeName="r" values={`${size + 4};${size + 8};${size + 4}`} dur="1.5s" repeatCount="indefinite" />
                </circle>
              )}
              {isWaiting && (
                <circle
                  cx={coord.cx}
                  cy={coord.cy}
                  r={size + 3}
                  fill="none"
                  stroke={color}
                  strokeWidth="1"
                  opacity="0.5"
                >
                  <animate attributeName="r" values={`${size};${size + 5};${size}`} dur="2s" repeatCount="indefinite" />
                </circle>
              )}
              <circle
                cx={coord.cx}
                cy={coord.cy}
                r={size}
                fill={isCompleted ? '#475569' : color}
                stroke={isCompleted ? '#64748b' : '#fff'}
                strokeWidth="0.5"
                opacity={isCompleted ? 0.4 : isAssigned ? 0.6 : 1}
              />
            </g>
          );
        })}

        {/* Vehicles */}
        {vehicles.map((v) => {
          const coord = toMapCoord(v.x, v.y, MAP_SIZE);
          const isIdle = v.status === 'IDLE';
          const isBusy = v.status === 'BUSY';
          const isSelected = v.id === selectedCandidateVehicle;
          const color = isIdle ? '#10b981' : '#ef4444';

          return (
            <g key={v.id}>
              {isIdle && (
                <circle
                  cx={coord.cx}
                  cy={coord.cy}
                  r={7}
                  fill={color}
                  opacity="0.15"
                >
                  <animate attributeName="r" values="5;9;5" dur="3s" repeatCount="indefinite" />
                </circle>
              )}
              <circle
                cx={coord.cx}
                cy={coord.cy}
                r={5}
                fill={color}
                stroke={isSelected ? '#06b6d4' : '#0d1320'}
                strokeWidth={isSelected ? 2 : 1}
                opacity={isBusy ? 0.5 : 1}
              />
              <text
                x={coord.cx}
                y={coord.cy - 8}
                textAnchor="middle"
                fill={isIdle ? '#94a3b8' : '#64748b'}
                fontSize="7"
                fontWeight="600"
                fontFamily="JetBrains Mono, monospace"
              >
                {v.id}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 flex gap-3 text-[10px] text-slate-400 bg-navy-900/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-navy-700/50">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Idle
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 opacity-50" /> Busy
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> P1
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-400" /> P2
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> P3
        </div>
      </div>

      {/* Current minute */}
      <div className="absolute top-3 right-3 bg-navy-900/80 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-navy-700/50">
        <span className="text-[10px] text-slate-400">Minute</span>
        <span className="ml-2 text-sm font-bold text-accent-cyan font-mono">{currentMinute}</span>
      </div>
    </div>
  );
}
