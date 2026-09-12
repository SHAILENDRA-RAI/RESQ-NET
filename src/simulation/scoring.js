import { PRIORITY_WEIGHTS } from './generator.js';
import { getQuadrantIdleCounts, simulateDispatch, getFleetBalance } from './coverage.js';

// ── Centralized scoring configuration ─────────────────────
export const SCORING_CONFIG = {
  // Response time is the dominant factor (official metric rewards fast response)
  responseTimeWeight: 1.0,
  // Coverage risk penalty — strong enough to discourage zero-coverage
  coverageRiskWeight: 15.0,
  // Fleet balance penalty — secondary factor
  fleetBalanceWeight: 3.0,
  // Priority multiplier — P3 gets stronger response-time preference
  priorityMultiplier: true,
  // Threshold for "AT RISK" quadrant (1 idle = at risk, 0 = outage)
  atRiskThreshold: 1,
  // Extra penalty when dispatch creates an outage (0 idle in quadrant)
  outagePenalty: 50.0,
  // Extra penalty when dispatch creates an at-risk state (1 idle left)
  atRiskPenalty: 10.0,
};

// ── Euclidean distance ────────────────────────────────────
export function euclideanDistance(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

// ── Candidate evaluation ──────────────────────────────────
// For a given incident and candidate vehicle, compute all scoring factors.
export function evaluateCandidate(incident, vehicle, allVehicles, config = SCORING_CONFIG) {
  const distance = euclideanDistance(incident, vehicle);
  const responseTime = distance / 1; // speed = 1 unit/min

  const beforeCounts = getQuadrantIdleCounts(allVehicles);
  const afterCounts = simulateDispatch(allVehicles, vehicle.id);

  const vehicleQuadrant = vehicle.quadrant;
  const idleInQuadrantBefore = beforeCounts[vehicleQuadrant];
  const idleInQuadrantAfter = afterCounts[vehicleQuadrant];

  // Coverage risk assessment
  let coverageRiskPenalty = 0;
  let coverageRiskLevel = 'LOW';

  if (idleInQuadrantAfter === 0) {
    coverageRiskPenalty = config.outagePenalty;
    coverageRiskLevel = 'CRITICAL';
  } else if (idleInQuadrantAfter === 1 && idleInQuadrantBefore <= 2) {
    coverageRiskPenalty = config.atRiskPenalty;
    coverageRiskLevel = 'HIGH';
  } else if (idleInQuadrantAfter === 1) {
    coverageRiskPenalty = config.atRiskPenalty * 0.5;
    coverageRiskLevel = 'MEDIUM';
  }

  // Fleet balance
  const balanceBefore = getFleetBalance(beforeCounts);
  const balanceAfter = getFleetBalance(afterCounts);
  const fleetBalanceDelta = Math.max(0, balanceAfter - balanceBefore);
  const fleetBalancePenalty = fleetBalanceDelta * config.fleetBalanceWeight;

  // Priority-weighted response time
  const priorityWeight = incident.priorityWeight || PRIORITY_WEIGHTS[incident.priority] || 1;
  let responseTimeCost = responseTime * config.responseTimeWeight;
  if (config.priorityMultiplier) {
    // Higher priority => response time matters more (divide by weight to favor P3)
    responseTimeCost = responseTimeCost / priorityWeight;
  }

  const totalCost =
    responseTimeCost +
    coverageRiskPenalty +
    fleetBalancePenalty;

  return {
    vehicleId: vehicle.id,
    vehicle,
    distance,
    responseTime,
    responseTimeCost,
    coverageRiskPenalty,
    coverageRiskLevel,
    fleetBalancePenalty,
    fleetBalanceDelta,
    totalCost,
    beforeCounts,
    afterCounts,
    idleInQuadrantBefore,
    idleInQuadrantAfter,
  };
}

// ── Rank all candidates for an incident ────────────────────
export function rankCandidates(incident, vehicles, config = SCORING_CONFIG) {
  const idleVehicles = vehicles.filter((v) => v.status === 'IDLE');
  if (idleVehicles.length === 0) return [];

  const candidates = idleVehicles.map((v) =>
    evaluateCandidate(incident, v, vehicles, config)
  );
  candidates.sort((a, b) => a.totalCost - b.totalCost);
  return candidates;
}

// ── Generate explanation ───────────────────────────────────
export function generateExplanation(incident, best, alternatives) {
  if (!best) return 'No idle vehicles available — incident remains queued.';

  const parts = [];
  const priorityStr = incident.priority;

  // Response time reasoning
  const fastest = alternatives.reduce((min, c) =>
    c.responseTime < min.responseTime ? c : min, alternatives[0]);

  if (best.vehicleId === fastest.vehicleId) {
    parts.push(
      `${best.vehicleId} provides the fastest response (${best.responseTime.toFixed(1)} min) for this ${priorityStr} incident`
    );
  } else {
    parts.push(
      `${best.vehicleId} has a slightly longer ETA (${best.responseTime.toFixed(1)} min vs ${fastest.responseTime.toFixed(1)} min for ${fastest.vehicleId})`
    );
  }

  // Coverage reasoning
  if (best.coverageRiskLevel === 'CRITICAL') {
    parts.push('but dispatching it would create a coverage outage in its quadrant');
  } else if (best.coverageRiskLevel === 'HIGH') {
    parts.push('while leaving only 1 idle vehicle in its quadrant (at-risk)');
  } else if (best.idleInQuadrantAfter >= 3) {
    parts.push(`while preserving ${best.idleInQuadrantAfter} idle vehicles in ${best.vehicle.quadrant}`);
  } else {
    parts.push('without creating a coverage risk');
  }

  // Comparison with fastest alternative
  if (best.vehicleId !== fastest.vehicleId) {
    const etaDiff = (best.responseTime - fastest.responseTime).toFixed(1);
    if (best.coverageRiskLevel === 'LOW' && fastest.coverageRiskLevel !== 'LOW') {
      parts.push(
        `${fastest.vehicleId} was faster but had ${fastest.coverageRiskLevel.toLowerCase()} coverage risk`
      );
    } else {
      parts.push(
        `selected over ${fastest.vehicleId} to preserve coverage (ETA penalty: ${etaDiff} min)`
      );
    }
  }

  // Priority reasoning
  if (priorityStr === 'P3') {
    parts.push('P3 priority gives response time the strongest weight');
  }

  return parts.join(', ') + '.';
}
