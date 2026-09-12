import {
  generateScenario,
  SIM_DURATION,
  BUSY_DURATION,
  VEHICLE_SPEED,
  getQuadrant,
} from './generator.js';
import {
  getQuadrantIdleCounts,
  getCoverageOutageCount,
} from './coverage.js';
import { createDispatcher } from './dispatcher.js';
import { calculateMetrics } from './metrics.js';
import { SCORING_CONFIG } from './scoring.js';

// ── Simulation Engine ─────────────────────────────────────
// The simulator generates the full scenario internally for local testing,
// but the dispatcher only receives incidents as they become observable.
// The dispatcher NEVER has access to future incidents.

export function createSimulator(seed, algorithm = 'resqnet', config = SCORING_CONFIG) {
  const scenario = generateScenario(seed);
  const vehicles = scenario.vehicles.map((v) => ({ ...v }));
  const allIncidents = scenario.incidents.map((i) => ({ ...i }));

  // Dispatcher-visible state — only past/present, never future
  let revealedIncidents = [];
  let waitingQueue = [];
  let assignments = [];
  let events = [];
  let currentMinute = 0;
  let coverageTimeSeries = [];
  let queueTimeSeries = [];
  let vehiclePositions = {}; // track animated positions

  // Incident reveal pointer
  let revealIndex = 0;

  const dispatcher = createDispatcher(algorithm, config);

  // ── Deep-copy vehicles for dispatcher-visible state ──────
  function getDispatcherVehicles() {
    // The dispatcher sees current vehicle states (position, status, quadrant)
    // but NOT future incidents or future RNG state.
    return vehicles.map((v) => ({
      id: v.id,
      x: v.x,
      y: v.y,
      quadrant: v.quadrant,
      status: v.status,
    }));
  }

  function logEvent(minute, type, message, data) {
    events.push({ minute, type, message, data, timestamp: Date.now() });
  }

  function recordCoverage(minute) {
    const counts = getQuadrantIdleCounts(vehicles);
    const outageCount = getCoverageOutageCount(counts);
    coverageTimeSeries.push({
      minute,
      Q1: counts.Q1,
      Q2: counts.Q2,
      Q3: counts.Q3,
      Q4: counts.Q4,
      outageCount,
    });
  }

  function recordQueue(minute) {
    queueTimeSeries.push({
      minute,
      queueLength: waitingQueue.length,
    });
  }

  // ── Process vehicle completions ─────────────────────────
  function processCompletions(minute) {
    for (const v of vehicles) {
      if (v.status === 'BUSY' && v.busyUntil <= minute) {
        v.status = 'IDLE';
        v.assignedIncidentId = null;
        v.busyUntil = null;
        // Vehicle is now located at the incident location
        // (position already updated when dispatched)
        logEvent(minute, 'COMPLETION', `${v.id} completed assignment`);
      }
    }
  }

  // ── Reveal incidents arriving at current minute ─────────
  function revealIncidents(minute) {
    while (revealIndex < allIncidents.length && allIncidents[revealIndex].arrivalTime <= minute) {
      const inc = allIncidents[revealIndex];
      revealedIncidents.push(inc);
      waitingQueue.push(inc);
      logEvent(minute, 'REVEAL', `Incident ${inc.id} revealed`, {
        incidentId: inc.id,
        priority: inc.priority,
        x: inc.x,
        y: inc.y,
        arrivalTime: inc.arrivalTime,
      });
      revealIndex++;
    }
  }

  // ── Process waiting incidents in priority order ─────────
  function processWaitingQueue(minute) {
    // Sort: priority descending (P3 > P2 > P1), arrival ascending, ID ascending
    waitingQueue.sort((a, b) => {
      if (b.priorityWeight !== a.priorityWeight) return b.priorityWeight - a.priorityWeight;
      if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
      return a.id.localeCompare(b.id);
    });

    const stillWaiting = [];
    for (const incident of waitingQueue) {
      const dispatcherVehicles = getDispatcherVehicles();
      const result = dispatcher(incident, dispatcherVehicles);

      if (!result) {
        // No vehicle available — stays queued
        stillWaiting.push(incident);
        if (minute <= SIM_DURATION) {
          logEvent(minute, 'QUEUE', `Incident ${incident.id} queued — no vehicle available`, {
            incidentId: incident.id,
            priority: incident.priority,
          });
        }
        continue;
      }

      // Assign vehicle
      const vehicle = vehicles.find((v) => v.id === result.vehicle.id);
      const distance = Math.sqrt((incident.x - vehicle.x) ** 2 + (incident.y - vehicle.y) ** 2);
      const travelTime = distance / VEHICLE_SPEED;
      const assignmentTime = minute;
      const responseTime = assignmentTime - incident.arrivalTime + travelTime;

      vehicle.status = 'BUSY';
      vehicle.assignedIncidentId = incident.id;
      vehicle.busyUntil = minute + travelTime + BUSY_DURATION;
      vehicle.lastAssignmentTime = minute;
      // Move vehicle to incident location
      vehicle.x = incident.x;
      vehicle.y = incident.y;
      vehicle.quadrant = getQuadrant(incident.x, incident.y);

      incident.status = 'ASSIGNED';
      incident.assignedVehicleId = vehicle.id;
      incident.assignmentTime = assignmentTime;
      incident.responseTime = responseTime;

      assignments.push({
        incidentId: incident.id,
        vehicleId: vehicle.id,
        priority: incident.priority,
        priorityWeight: incident.priorityWeight,
        arrivalTime: incident.arrivalTime,
        assignmentTime,
        responseTime,
        distance,
        travelTime,
      });

      const idleCount = dispatcherVehicles.filter((v) => v.status === 'IDLE').length;
      logEvent(minute, 'ASSIGN', `${vehicle.id} assigned to ${incident.id}`, {
        incidentId: incident.id,
        vehicleId: vehicle.id,
        priority: incident.priority,
        eta: travelTime.toFixed(2),
        responseTime: responseTime.toFixed(2),
        idleVehiclesEvaluated: idleCount + 1,
        candidates: result.candidates ? result.candidates.slice(0, 5).map((c) => ({
          vehicleId: c.vehicleId,
          responseTime: c.responseTime,
          coverageRiskLevel: c.coverageRiskLevel,
          totalCost: c.totalCost,
        })) : [],
      });
    }

    waitingQueue = stillWaiting;
  }

  // ── Step the simulation by one minute ────────────────────
  function step() {
    if (currentMinute > SIM_DURATION) return false;

    processCompletions(currentMinute);
    revealIncidents(currentMinute);
    processWaitingQueue(currentMinute);
    recordCoverage(currentMinute);
    recordQueue(currentMinute);

    currentMinute++;
    return currentMinute <= SIM_DURATION + 1;
  }

  // ── Run to completion ────────────────────────────────────
  function run() {
    const startTime = performance.now();
    while (currentMinute <= SIM_DURATION) {
      step();
    }
    // Process any remaining completions after sim end
    for (const v of vehicles) {
      if (v.status === 'BUSY') {
        v.status = 'IDLE';
        v.assignedIncidentId = null;
        v.busyUntil = null;
      }
    }
    const endTime = performance.now();
    const runtime = endTime - startTime;

    const metrics = calculateMetrics({
      vehicles,
      assignments,
      coverageTimeSeries,
      queueTimeSeries,
      finalWaitingQueue: waitingQueue,
    });

    return {
      vehicles,
      incidents: allIncidents,
      revealedIncidents,
      assignments,
      events,
      coverageTimeSeries,
      queueTimeSeries,
      metrics,
      runtime,
      seed,
      algorithm,
      finalWaitingQueue: waitingQueue,
    };
  }

  // ── Get current state (for live UI) ──────────────────────
  function getState() {
    return {
      currentMinute: Math.min(currentMinute, SIM_DURATION),
      vehicles: vehicles.map((v) => ({ ...v })),
      revealedIncidents: [...revealedIncidents],
      waitingQueue: [...waitingQueue],
      assignments: [...assignments],
      events: [...events],
      coverageTimeSeries: [...coverageTimeSeries],
      queueTimeSeries: [...queueTimeSeries],
      allIncidents,
    };
  }

  return { step, run, getState, processCompletions, revealIncidents, processWaitingQueue };
}

// ── Run a full simulation and return results ──────────────
export function runSimulation(seed, algorithm, config = SCORING_CONFIG) {
  const sim = createSimulator(seed, algorithm, config);
  return sim.run();
}

// ── Run both algorithms for comparison ────────────────────
export function runComparison(seed, config = SCORING_CONFIG) {
  const resqnetResult = runSimulation(seed, 'resqnet', config);
  const nearestResult = runSimulation(seed, 'nearest', config);
  return { resqnet: resqnetResult, nearest: nearestResult };
}
