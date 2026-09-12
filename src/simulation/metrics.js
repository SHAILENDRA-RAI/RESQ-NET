import { PRIORITY_WEIGHTS, QUADRANTS } from './generator.js';
import { getQuadrantIdleCounts, getCoverageOutageCount } from './coverage.js';

// ── Calculate all metrics from a completed simulation run ─
export function calculateMetrics(run) {
  const assignments = run.assignments || [];
  const completed = assignments.filter((a) => a.responseTime != null);

  // Priority-weighted response time
  let weightedSum = 0;
  let weightedCount = 0;
  for (const a of completed) {
    const w = PRIORITY_WEIGHTS[a.priority] || 1;
    weightedSum += a.responseTime * w;
    weightedCount += w;
  }
  const priorityWeightedResponseTime = weightedCount > 0 ? weightedSum / weightedCount : 0;

  // P3 average response time
  const p3Assignments = completed.filter((a) => a.priority === 'P3');
  const p3ResponseTime = p3Assignments.length > 0
    ? p3Assignments.reduce((s, a) => s + a.responseTime, 0) / p3Assignments.length
    : 0;

  // Average response time
  const avgResponseTime = completed.length > 0
    ? completed.reduce((s, a) => s + a.responseTime, 0) / completed.length
    : 0;

  // Coverage outage minutes (from time series)
  const coverageOutageMinutes = (run.coverageTimeSeries || []).filter(
    (t) => t.outageCount > 0
  ).length;

  // Qmax — largest queue observed
  const qmax = (run.queueTimeSeries || []).reduce(
    (max, t) => Math.max(max, t.queueLength), 0
  );

  // Total assignments
  const totalAssignments = assignments.length;
  const completedCount = completed.length;
  const queuedCount = (run.finalWaitingQueue || []).length;

  // Per-vehicle assignment counts
  const assignmentsPerVehicle = {};
  for (const v of run.vehicles || []) {
    assignmentsPerVehicle[v.id] = v.completedAssignments || 0;
  }

  // Response time by priority
  const responseByPriority = {};
  for (const p of ['P1', 'P2', 'P3']) {
    const items = completed.filter((a) => a.priority === p);
    responseByPriority[p] = items.length > 0
      ? items.reduce((s, a) => s + a.responseTime, 0) / items.length
      : 0;
  }

  return {
    priorityWeightedResponseTime,
    p3ResponseTime,
    avgResponseTime,
    coverageOutageMinutes,
    qmax,
    totalAssignments,
    completedCount,
    queuedCount,
    assignmentsPerVehicle,
    responseByPriority,
  };
}

// ── Build comparison table ────────────────────────────────
export function compareMetrics(resqnetMetrics, nearestMetrics) {
  return [
    {
      metric: 'Priority-Weighted Response Time',
      resqnet: resqnetMetrics.priorityWeightedResponseTime.toFixed(2),
      nearest: nearestMetrics.priorityWeightedResponseTime.toFixed(2),
      lowerIsBetter: true,
    },
    {
      metric: 'P3 Response Time',
      resqnet: resqnetMetrics.p3ResponseTime.toFixed(2),
      nearest: nearestMetrics.p3ResponseTime.toFixed(2),
      lowerIsBetter: true,
    },
    {
      metric: 'Coverage Outage Minutes',
      resqnet: resqnetMetrics.coverageOutageMinutes,
      nearest: nearestMetrics.coverageOutageMinutes,
      lowerIsBetter: true,
    },
    {
      metric: 'Maximum Queue',
      resqnet: resqnetMetrics.qmax,
      nearest: nearestMetrics.qmax,
      lowerIsBetter: true,
    },
    {
      metric: 'Completed Assignments',
      resqnet: resqnetMetrics.completedCount,
      nearest: nearestMetrics.completedCount,
      lowerIsBetter: false,
    },
  ];
}
