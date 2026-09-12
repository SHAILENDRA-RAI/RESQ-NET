import { QUADRANTS, getQuadrant } from './generator.js';

// ── Coverage state ──────────────────────────────────────────
// Returns idle vehicle counts per quadrant for a given vehicle list.
export function getQuadrantIdleCounts(vehicles) {
  const counts = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
  for (const v of vehicles) {
    if (v.status === 'IDLE') {
      counts[v.quadrant]++;
    }
  }
  return counts;
}

// Count quadrants with zero idle vehicles.
export function getCoverageOutageCount(counts) {
  let outages = 0;
  for (const q of QUADRANTS) {
    if (counts[q] === 0) outages++;
  }
  return outages;
}

// Number of quadrants currently covered (>= 1 idle vehicle).
export function getCoveredQuadrants(counts) {
  let covered = 0;
  for (const q of QUADRANTS) {
    if (counts[q] > 0) covered++;
  }
  return covered;
}

// Status label for a quadrant based on idle count.
export function getQuadrantStatus(count) {
  if (count === 0) return 'OUTAGE';
  if (count <= 1) return 'AT RISK';
  return 'COVERED';
}

// Fleet balance: standard deviation of quadrant idle counts.
// Lower = more balanced.
export function getFleetBalance(counts) {
  const vals = QUADRANTS.map((q) => counts[q]);
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length;
  return Math.sqrt(variance);
}

// Simulate the what-if: remove a specific vehicle and recompute counts.
export function simulateDispatch(vehicles, vehicleId) {
  const counts = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };
  for (const v of vehicles) {
    if (v.status === 'IDLE' && v.id !== vehicleId) {
      counts[v.quadrant]++;
    }
  }
  return counts;
}
