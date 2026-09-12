import { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { BarChart3, TrendingDown, Clock, Shield, Layers, Trophy } from 'lucide-react';
import { compareMetrics } from '../simulation/metrics.js';

const tooltipStyle = {
  backgroundColor: '#0d1320',
  border: '1px solid #2d3a52',
  borderRadius: '8px',
  fontSize: '11px',
  color: '#e2e8f0',
};

export default function Analytics({ comparisonData, simState, onRunComparison }) {
  const resqnetMetrics = comparisonData?.resqnet?.metrics;
  const nearestMetrics = comparisonData?.nearest?.metrics;
  const comparison = useMemo(() => {
    if (!resqnetMetrics || !nearestMetrics) return null;
    return compareMetrics(resqnetMetrics, nearestMetrics);
  }, [resqnetMetrics, nearestMetrics]);

  // Time series data from the current simulation
  const coverageData = simState?.coverageTimeSeries || [];
  const queueData = simState?.queueTimeSeries || [];

  // Idle vehicles by quadrant over time
  const idleByQuadrant = coverageData.map((t) => ({
    minute: t.minute,
    Q1: t.Q1,
    Q2: t.Q2,
    Q3: t.Q3,
    Q4: t.Q4,
  }));

  // Response time by priority (from comparison)
  const responseByPriorityData = useMemo(() => {
    if (!resqnetMetrics || !nearestMetrics) return [];
    return [
      {
        priority: 'P1',
        'RESQ-NET': resqnetMetrics.responseByPriority.P1 || 0,
        'Nearest': nearestMetrics.responseByPriority.P1 || 0,
      },
      {
        priority: 'P2',
        'RESQ-NET': resqnetMetrics.responseByPriority.P2 || 0,
        'Nearest': nearestMetrics.responseByPriority.P2 || 0,
      },
      {
        priority: 'P3',
        'RESQ-NET': resqnetMetrics.responseByPriority.P3 || 0,
        'Nearest': nearestMetrics.responseByPriority.P3 || 0,
      },
    ];
  }, [resqnetMetrics, nearestMetrics]);

  // Assignments per vehicle
  const assignmentsPerVehicle = useMemo(() => {
    const data = resqnetMetrics?.assignmentsPerVehicle || {};
    const nearestData = nearestMetrics?.assignmentsPerVehicle || {};
    return Object.keys(data).map((vid) => ({
      vehicle: vid,
      'RESQ-NET': data[vid],
      'Nearest': nearestData[vid] || 0,
    }));
  }, [resqnetMetrics, nearestMetrics]);

  // Coverage outage timeline
  const outageTimeline = coverageData.map((t) => ({
    minute: t.minute,
    outages: t.outageCount,
  }));

  if (!simState || !simState.coverageTimeSeries?.length) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center max-w-md">
          <BarChart3 className="w-12 h-12 text-accent-cyan mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Analytics</h2>
          <p className="text-sm text-slate-400 mb-6">
            Run the simulation to generate analytics data. The comparison between RESQ-NET AI and Nearest Available will appear here.
          </p>
          <button
            onClick={onRunComparison}
            className="px-6 py-2.5 bg-gradient-to-r from-accent-cyan to-accent-blue text-white text-sm font-semibold rounded-lg hover:opacity-90"
          >
            Run Comparison
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 className="w-5 h-5 text-accent-cyan" />
        <h2 className="text-lg font-bold text-white">Analytics</h2>
      </div>

      {/* Comparison Table */}
      {comparison && (
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-accent-cyan" />
            <h3 className="text-sm font-semibold text-white">Algorithm Comparison</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-navy-700/50">
                  <th className="text-left py-2 px-3 text-slate-400 font-medium">Metric</th>
                  <th className="text-right py-2 px-3 text-slate-400 font-medium">Nearest Available</th>
                  <th className="text-right py-2 px-3 text-accent-cyan font-medium">RESQ-NET AI</th>
                  <th className="text-center py-2 px-3 text-slate-400 font-medium">Winner</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => {
                  const resqnetBetter = row.lowerIsBetter
                    ? parseFloat(row.resqnet) <= parseFloat(row.nearest)
                    : parseFloat(row.resqnet) >= parseFloat(row.nearest);
                  return (
                    <tr key={row.metric} className="border-b border-navy-800/50 hover:bg-navy-800/30">
                      <td className="py-2 px-3 text-slate-300">{row.metric}</td>
                      <td className="py-2 px-3 text-right text-slate-400 font-mono">{row.nearest}</td>
                      <td className="py-2 px-3 text-right text-accent-cyan font-mono font-bold">{row.resqnet}</td>
                      <td className="py-2 px-3 text-center">
                        {resqnetBetter ? (
                          <span className="text-green-400 text-[10px] font-bold">RESQ-NET</span>
                        ) : (
                          <span className="text-amber-400 text-[10px] font-bold">Nearest</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Queue Length over Time */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-accent-cyan" />
            <h3 className="text-sm font-semibold text-white">Queue Length Over Time</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={queueData}>
              <defs>
                <linearGradient id="queueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="minute" stroke="#64748b" fontSize={10} />
              <YAxis stroke="#64748b" fontSize={10} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="queueLength" stroke="#06b6d4" fill="url(#queueGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Idle Vehicles by Quadrant */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-accent-cyan" />
            <h3 className="text-sm font-semibold text-white">Idle Vehicles by Quadrant</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={idleByQuadrant}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="minute" stroke="#64748b" fontSize={10} />
              <YAxis stroke="#64748b" fontSize={10} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Line type="monotone" dataKey="Q1" stroke="#10b981" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="Q2" stroke="#06b6d4" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="Q3" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="Q4" stroke="#a78bfa" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Response Time by Priority */}
        {responseByPriorityData.length > 0 && (
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-accent-cyan" />
              <h3 className="text-sm font-semibold text-white">Response Time by Priority</h3>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={responseByPriorityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="priority" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Bar dataKey="Nearest" fill="#64748b" radius={[3, 3, 0, 0]} />
                <Bar dataKey="RESQ-NET" fill="#06b6d4" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Coverage Outage Timeline */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="w-4 h-4 text-accent-cyan" />
            <h3 className="text-sm font-semibold text-white">Coverage Outage Timeline</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={outageTimeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="minute" stroke="#64748b" fontSize={10} />
              <YAxis stroke="#64748b" fontSize={10} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="outages" fill="#ef4444" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Assignments per Vehicle */}
      {assignmentsPerVehicle.length > 0 && (
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-accent-cyan" />
            <h3 className="text-sm font-semibold text-white">Assignments per Vehicle</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={assignmentsPerVehicle}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="vehicle" stroke="#64748b" fontSize={9} />
              <YAxis stroke="#64748b" fontSize={10} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Bar dataKey="Nearest" fill="#64748b" radius={[3, 3, 0, 0]} />
              <Bar dataKey="RESQ-NET" fill="#06b6d4" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
