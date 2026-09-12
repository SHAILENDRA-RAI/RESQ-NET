import { createRng } from './rng.js';

// ── Constants ──────────────────────────────────────────────
export const REGION_SIZE = 100;
export const NUM_VEHICLES = 20;
export const NUM_INCIDENTS = 100;
export const SIM_DURATION = 120;
export const BUSY_DURATION = 8; // minutes busy after reaching incident
export const VEHICLE_SPEED = 1;  // 1 coord unit / minute

export const PRIORITY_WEIGHTS = { P1: 1, P2: 3, P3: 7 };
export const PRIORITY_LABELS = ['P1', 'P2', 'P3'];
export const PRIORITY_DIST = [
  { label: 'P1', weight: 1, prob: 0.6 },
  { label: 'P2', weight: 3, prob: 0.3 },
  { label: 'P3', weight: 7, prob: 0.1 },
];

// ── Quadrant helpers ───────────────────────────────────────
export function getQuadrant(x, y) {
  if (x < 50 && y < 50) return 'Q1';
  if (x >= 50 && y < 50) return 'Q2';
  if (x < 50 && y >= 50) return 'Q3';
  return 'Q4';
}

export const QUADRANTS = ['Q1', 'Q2', 'Q3', 'Q4'];

// ── Vehicle generation ─────────────────────────────────────
export function generateVehicles(rng) {
  const vehicles = [];
  // 5 per quadrant, placed at random positions within each quadrant
  const quadBounds = {
    Q1: { xMin: 0, xMax: 50, yMin: 0, yMax: 50 },
    Q2: { xMin: 50, xMax: 100, yMin: 0, yMax: 50 },
    Q3: { xMin: 0, xMax: 50, yMin: 50, yMax: 100 },
    Q4: { xMin: 50, xMax: 100, yMin: 50, yMax: 100 },
  };

  let id = 1;
  for (const q of QUADRANTS) {
    const b = quadBounds[q];
    for (let i = 0; i < 5; i++) {
      const x = rng.float(b.xMin, b.xMax);
      const y = rng.float(b.yMin, b.yMax);
      vehicles.push({
        id: `V${String(id).padStart(2, '0')}`,
        x,
        y,
        homeX: x,
        homeY: y,
        initialQuadrant: q,
        quadrant: q,
        status: 'IDLE',
        assignedIncidentId: null,
        busyUntil: null,
        lastAssignmentTime: null,
        completedAssignments: 0,
      });
      id++;
    }
  }
  return vehicles;
}

// ── Incident generation ────────────────────────────────────
export function generateIncidents(rng) {
  const incidents = [];
  for (let i = 1; i <= NUM_INCIDENTS; i++) {
    const x = rng.float(0, 100);
    const y = rng.float(0, 100);
    const arrivalTime = rng.int(0, 59);
    const priority = samplePriority(rng);
    incidents.push({
      id: `I${String(i).padStart(2, '0')}`,
      arrivalTime,
      x,
      y,
      priority: priority.label,
      priorityWeight: priority.weight,
      quadrant: getQuadrant(x, y),
      assignedVehicleId: null,
      assignmentTime: null,
      responseTime: null,
      status: 'WAITING', // WAITING | ASSIGNED | COMPLETED
    });
  }
  // Sort by arrival time for efficient reveal
  incidents.sort((a, b) => a.arrivalTime - b.arrivalTime || a.id.localeCompare(b.id));
  return incidents;
}

function samplePriority(rng) {
  const r = rng();
  let cum = 0;
  for (const p of PRIORITY_DIST) {
    cum += p.prob;
    if (r < cum) return p;
  }
  return PRIORITY_DIST[PRIORITY_DIST.length - 1];
}

// ── Scenario generation ────────────────────────────────────
export function generateScenario(seed) {
  const rng = createRng(seed);
  return {
    vehicles: generateVehicles(rng),
    incidents: generateIncidents(rng),
    seed,
  };
}
