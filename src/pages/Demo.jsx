import { useState, useCallback, useMemo } from 'react';
import { Play, ChevronRight, RotateCcw, Sparkles, Shield, ArrowRight } from 'lucide-react';
import FleetMap from '../components/FleetMap.jsx';
import CoverageGuardian from '../components/CoverageGuardian.jsx';
import DispatchPanel from '../components/DispatchPanel.jsx';
import { createSimulator } from '../simulation/simulator.js';
import { SCORING_CONFIG } from '../simulation/scoring.js';
import { getQuadrantIdleCounts, simulateDispatch } from '../simulation/coverage.js';
import { rankCandidates, generateExplanation } from '../simulation/scoring.js';

const DEFAULT_SEED = 20260911;

const DEMO_STEPS = [
  { title: 'Generate Scenario', desc: '20 vehicles across 4 quadrants, 100 incidents with seeded randomness.' },
  { title: 'Incident Revealed', desc: 'A new emergency appears on the map. The dispatcher evaluates all idle vehicles.' },
  { title: 'Candidate Evaluation', desc: 'Each idle vehicle is scored on response time, coverage risk, and fleet balance.' },
  { title: 'Coverage Guardian Check', desc: 'What-if analysis: would dispatching this vehicle leave a quadrant uncovered?' },
  { title: 'RESQ-NET Selection', desc: 'The best-scored vehicle is selected with a plain-language explanation.' },
  { title: 'Dispatch & Update', desc: 'Vehicle is assigned, moves to incident, and fleet coverage updates live.' },
  { title: 'Continue Simulation', desc: 'Step through more decisions or run to completion.' },
];

export default function Demo() {
  const [seed] = useState(DEFAULT_SEED);
  const [simulator, setSimulator] = useState(null);
  const [simState, setSimState] = useState(null);
  const [demoStep, setDemoStep] = useState(0);
  const [selectedIncidentId, setSelectedIncidentId] = useState(null);
  const [selectedCandidateVehicle, setSelectedCandidateVehicle] = useState(null);
  const [stepLog, setStepLog] = useState([]);

  const handleGenerate = useCallback(() => {
    const sim = createSimulator(seed, 'resqnet', SCORING_CONFIG);
    setSimulator(sim);
    setSimState(sim.getState());
    setDemoStep(1);
    setSelectedIncidentId(null);
    setSelectedCandidateVehicle(null);
    setStepLog(['Scenario generated: 20 vehicles, 100 incidents, seed ' + seed]);
  }, [seed]);

  const handleNextDecision = useCallback(() => {
    if (!simulator) return;
    // Step until an assignment event happens or simulation ends
    let steps = 0;
    let lastEventCount = simState?.events?.length || 0;
    while (steps < 5) {
      const more = simulator.step();
      const state = simulator.getState();
      if (state.events.length > lastEventCount) {
        const newEvents = state.events.slice(lastEventCount);
        const assignEvent = newEvents.find((e) => e.type === 'ASSIGN');
        if (assignEvent) {
          setSelectedIncidentId(assignEvent.data.incidentId);
          setSelectedCandidateVehicle(assignEvent.data.vehicleId);
          setStepLog((prev) => [...prev, `[Min ${assignEvent.minute}] ${assignEvent.message}`]);
          setSimState(state);
          setDemoStep((prev) => Math.min(prev + 1, DEMO_STEPS.length - 1));
          return;
        }
        lastEventCount = state.events.length;
      }
      if (!more) {
        setSimState({ ...simulator.getState(), isComplete: true });
        setStepLog((prev) => [...prev, 'Simulation complete.']);
        return;
      }
      steps++;
    }
    setSimState(simulator.getState());
  }, [simulator, simState]);

  const handleReset = useCallback(() => {
    setSimulator(null);
    setSimState(null);
    setDemoStep(0);
    setSelectedIncidentId(null);
    setSelectedCandidateVehicle(null);
    setStepLog([]);
  }, []);

  const vehicles = simState?.vehicles || [];
  const revealedIncidents = simState?.revealedIncidents || [];
  const idleCounts = useMemo(() => getQuadrantIdleCounts(vehicles), [vehicles]);

  const selectedIncident = useMemo(() => {
    if (!selectedIncidentId) {
      const waiting = revealedIncidents.filter((i) => i.status === 'WAITING');
      return waiting.length > 0 ? waiting[waiting.length - 1] : null;
    }
    return revealedIncidents.find((i) => i.id === selectedIncidentId) || null;
  }, [selectedIncidentId, revealedIncidents]);

  const whatIfData = useMemo(() => {
    if (!selectedCandidateVehicle || !selectedIncident) return null;
    const vehicle = vehicles.find((v) => v.id === selectedCandidateVehicle);
    if (!vehicle) return null;
    return {
      before: getQuadrantIdleCounts(vehicles),
      after: simulateDispatch(vehicles, vehicle.id),
      quadrant: vehicle.quadrant,
    };
  }, [selectedCandidateVehicle, selectedIncident, vehicles]);

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Demo header */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-accent-cyan" />
          <h2 className="text-lg font-bold text-white">Judge Demo Mode</h2>
        </div>
        <p className="text-sm text-slate-400 mb-4">
          A guided walkthrough of the RESQ-NET AI dispatch system. Click "Next Decision" to step through real dispatch decisions.
        </p>

        {/* Step indicator */}
        <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
          {DEMO_STEPS.map((s, idx) => (
            <div key={idx} className="flex items-center gap-1 flex-shrink-0">
              <div
                className={`px-2.5 py-1 rounded text-[10px] font-medium whitespace-nowrap ${
                  idx === demoStep
                    ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/40'
                    : idx < demoStep
                    ? 'bg-green-500/10 text-green-400'
                    : 'bg-navy-800 text-slate-500'
                }`}
              >
                {idx < demoStep ? '✓' : idx + 1}. {s.title}
              </div>
              {idx < DEMO_STEPS.length - 1 && <ArrowRight className="w-3 h-3 text-slate-600 flex-shrink-0" />}
            </div>
          ))}
        </div>

        <div className="text-xs text-slate-300 bg-navy-800/50 rounded-lg p-3 mb-4">
          <span className="text-accent-cyan font-medium">Current Step: </span>
          {DEMO_STEPS[demoStep]?.title} — {DEMO_STEPS[demoStep]?.desc}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {!simulator && (
            <button
              onClick={handleGenerate}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-accent-cyan to-accent-blue text-white text-xs font-semibold rounded-lg hover:opacity-90"
            >
              <Play className="w-3.5 h-3.5" />
              Start Demo
            </button>
          )}
          {simulator && (
            <>
              <button
                onClick={handleNextDecision}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-accent-cyan to-accent-blue text-white text-xs font-semibold rounded-lg hover:opacity-90"
              >
                <ChevronRight className="w-3.5 h-3.5" />
                Next Decision
              </button>
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-2 bg-navy-800 hover:bg-navy-700 text-slate-200 text-xs font-medium rounded-lg border border-navy-600"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            </>
          )}
          <div className="ml-auto text-xs text-slate-400">
            Minute <span className="font-bold text-accent-cyan font-mono">{simState?.currentMinute || 0}</span> / 120
          </div>
        </div>
      </div>

      {simState && (
        <>
          {/* Map + panels */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-7">
              <div className="glass-card p-4">
                <FleetMap
                  simState={simState}
                  selectedIncidentId={selectedIncidentId}
                  setSelectedIncidentId={setSelectedIncidentId}
                  selectedCandidateVehicle={selectedCandidateVehicle}
                />
              </div>
            </div>
            <div className="lg:col-span-5 space-y-4">
              <CoverageGuardian
                idleCounts={idleCounts}
                beforeCounts={whatIfData?.before}
                afterCounts={whatIfData?.after}
                selectedVehicleId={selectedCandidateVehicle}
                selectedVehicleQuadrant={whatIfData?.quadrant}
              />
              <DispatchPanel
                incident={selectedIncident}
                vehicles={vehicles}
                selectedVehicleId={selectedCandidateVehicle}
                setSelectedCandidateVehicle={setSelectedCandidateVehicle}
                algorithm="resqnet"
              />
            </div>
          </div>

          {/* Decision log */}
          {stepLog.length > 0 && (
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-accent-cyan" />
                <h3 className="text-sm font-semibold text-white">Decision Log</h3>
              </div>
              <div className="space-y-1">
                {stepLog.map((log, idx) => (
                  <div key={idx} className="text-xs text-slate-300 font-mono py-1 px-2 rounded hover:bg-navy-800/50">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
