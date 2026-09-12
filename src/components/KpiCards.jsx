import { Truck, CircleDot, AlertCircle, Shield, Clock, Activity } from 'lucide-react';
import { getQuadrantIdleCounts, getCoveredQuadrants } from '../simulation/coverage.js';
import { useMemo } from 'react';

export default function KpiCards({ simState }) {
  const vehicles = simState?.vehicles || [];
  const waitingQueue = simState?.waitingQueue || [];
  const assignments = simState?.assignments || [];
  const coverageTimeSeries = simState?.coverageTimeSeries || [];

  const idleCount = vehicles.filter((v) => v.status === 'IDLE').length;
  const idleCounts = useMemo(() => getQuadrantIdleCounts(vehicles), [vehicles]);
  const covered = getCoveredQuadrants(idleCounts);

  const completed = assignments.filter((a) => a.responseTime != null);
  const avgResponse = completed.length > 0
    ? completed.reduce((s, a) => s + a.responseTime, 0) / completed.length
    : 0;

  const outageMinutes = coverageTimeSeries.filter((t) => t.outageCount > 0).length;

  const cards = [
    {
      label: 'Total Vehicles',
      value: vehicles.length || 20,
      icon: Truck,
      color: 'text-slate-300',
      bg: 'bg-navy-700/50',
    },
    {
      label: 'Idle Vehicles',
      value: idleCount,
      icon: CircleDot,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
    },
    {
      label: 'Waiting Incidents',
      value: waitingQueue.length,
      icon: AlertCircle,
      color: waitingQueue.length > 0 ? 'text-amber-400' : 'text-slate-300',
      bg: waitingQueue.length > 0 ? 'bg-amber-500/10' : 'bg-navy-700/50',
    },
    {
      label: 'Coverage Status',
      value: `${covered}/4`,
      icon: Shield,
      color: covered === 4 ? 'text-green-400' : covered >= 3 ? 'text-amber-400' : 'text-red-400',
      bg: covered === 4 ? 'bg-green-500/10' : 'bg-amber-500/10',
    },
    {
      label: 'Avg Response Time',
      value: avgResponse > 0 ? `${avgResponse.toFixed(1)}m` : '—',
      icon: Clock,
      color: 'text-accent-cyan',
      bg: 'bg-accent-cyan/10',
    },
    {
      label: 'Coverage Outage Min',
      value: outageMinutes,
      icon: Activity,
      color: outageMinutes > 0 ? 'text-red-400' : 'text-green-400',
      bg: outageMinutes > 0 ? 'bg-red-500/10' : 'bg-green-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="glass-card glass-card-hover p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">
                {card.label}
              </span>
              <div className={`w-7 h-7 rounded-lg ${card.bg} flex items-center justify-center`}>
                <Icon className={`w-3.5 h-3.5 ${card.color}`} />
              </div>
            </div>
            <div className={`text-xl font-bold ${card.color} font-mono`}>
              {card.value}
            </div>
          </div>
        );
      })}
    </div>
  );
}
