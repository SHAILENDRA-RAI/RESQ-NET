import { rankCandidates } from './scoring.js';
import { euclideanDistance } from './scoring.js';

// ── RESQ-NET AI Dispatcher ─────────────────────────────────
// Uses the coverage-aware scoring model to select the best vehicle.
export function resqnetDispatch(incident, vehicles, config) {
  const candidates = rankCandidates(incident, vehicles, config);
  if (candidates.length === 0) return null;
  return candidates[0];
}

// ── Nearest Available Baseline ────────────────────────────
// Simply picks the idle vehicle with the smallest Euclidean distance.
export function nearestAvailableDispatch(incident, vehicles) {
  const idleVehicles = vehicles.filter((v) => v.status === 'IDLE');
  if (idleVehicles.length === 0) return null;

  let best = null;
  let bestDist = Infinity;
  for (const v of idleVehicles) {
    const d = euclideanDistance(incident, v);
    if (d < bestDist) {
      bestDist = d;
      best = v;
    }
  }
  return best;
}

// ── Dispatcher factory ────────────────────────────────────
export function createDispatcher(algorithm, config) {
  if (algorithm === 'resqnet') {
    return (incident, vehicles) => {
      const result = resqnetDispatch(incident, vehicles, config);
      if (!result) return null;
      return { vehicle: result.vehicle, candidate: result, candidates: rankCandidates(incident, vehicles, config) };
    };
  }
  // nearest
  return (incident, vehicles) => {
    const vehicle = nearestAvailableDispatch(incident, vehicles);
    if (!vehicle) return null;
    // Also compute candidates for the dispatch intelligence panel (for comparison display)
    const candidates = rankCandidates(incident, vehicles, config);
    return { vehicle, candidate: null, candidates };
  };
}
