import { useMemo } from 'react';
import KpiCards from '../components/KpiCards.jsx';
import FleetMap from '../components/FleetMap.jsx';
import CoverageGuardian from '../components/CoverageGuardian.jsx';
import DispatchPanel from '../components/DispatchPanel.jsx';
import EventLog from '../components/EventLog.jsx';
import { getQuadrantIdleCounts, simulateDispatch } from '../simulation/coverage.js';
import { rankCandidates } from '../simulation/scoring.js';
import { SCORING_CONFIG } from '../simulation/scoring.js';
import { Play, StepForward, RotateCcw } from 'lucide-react';

export default function Dashboard({
  simState,
  simulator,
  onStep,
  onGenerate,
  seed,
  algorithm,
  selectedIncidentId,
  setSelectedIncidentId,
  selectedCandidateVehicle,
  setSelectedCandidateVehicle,
}) {
  const vehicles = simState?.vehicles || [];
  const revealedIncidents = simState?.revealedIncidents || [];
  const events = simState?.events || [];
  const currentMinute = simState?.currentMinute || 0;

  const idleCounts = useMemo(() => getQuadrantIdleCounts(vehicles), [vehicles]);

  const selectedIncident = useMemo(() => {
    if (!selectedIncidentId) {
      // Pick the most recent waiting incident by default
      const waiting = revealedIncidents.filter((i) => i.status === 'WAITING');
      return waiting.length > 0 ? waiting[waiting.length - 1] : null;
    }
    return revealedIncidents.find((i) => i.id === selectedIncidentId) || null;
  }, [selectedIncidentId, revealedIncidents]);

  // Compute what-if data for selected candidate
  const whatIfData = useMemo(() => {
    if (!selectedCandidateVehicle || !selectedIncident) return null;
    const vehicle = vehicles.find((v) => v.id === selectedCandidateVehicle);
    if (!vehicle) return null;
    const before = getQuadrantIdleCounts(vehicles);
    const after = simulateDispatch(vehicles, vehicle.id);
    return { before, after, quadrant: vehicle.quadrant };
  }, [selectedCandidateVehicle, selectedIncident, vehicles]);

  // For coverage guardian display
  const selectedVehicle = selectedCandidateVehicle
    ? vehicles.find((v) => v.id === selectedCandidateVehicle)
    : null;

  if (!simState || !simulator) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-cyan to-accent-blue flex items-center justify-center mx-auto mb-4">
            <Play className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">RESQ-NET AI Command Center</h2>
          <p className="text-sm text-slate-400 mb-6">
            Coverage-Aware Emergency Fleet Intelligence. Generate a scenario to begin monitoring the 100×100 service region.
          </p>
          <button
            onClick={onGenerate}
            className="px-6 py-2.5 bg-gradient-to-r from-accent-cyan to-accent-blue text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            Generate Scenario
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* KPI Cards */}
      <KpiCards simState={simState} />

      {/* Control bar */}
      <div className="flex items-center gap-2">
        <button
          onClick={onStep}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-navy-800 hover:bg-navy-700 text-slate-200 text-xs font-medium rounded-lg border border-navy-600 transition-colors"
        >
          <StepForward className="w-3.5 h-3.5" />
          Step
        </button>
        <button
          onClick={onGenerate}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-navy-800 hover:bg-navy-700 text-slate-200 text-xs font-medium rounded-lg border border-navy-600 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
        <div className="ml-auto text-xs text-slate-400">
          Minute <span className="font-bold text-accent-cyan font-mono">{currentMinute}</span> / 120
          {simState.isComplete && (
            <span className="ml-2 text-green-400">· Complete</span>
          )}
        </div>
      </div>

      {/* Main grid: Map + right panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Fleet Map */}
        <div className="lg:col-span-7">
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-white">Service Region Map</h2>
              <div className="text-[10px] text-slate-500">100 × 100 coordinate grid</div>
            </div>
            <FleetMap
              simState={simState}
              selectedIncidentId={selectedIncidentId}
              setSelectedIncidentId={setSelectedIncidentId}
              selectedCandidateVehicle={selectedCandidateVehicle}
            />
          </div>
        </div>

        {/* Right column: Coverage Guardian + Dispatch Panel */}
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
            algorithm={algorithm}
          />
        </div>
      </div>

      {/* Event Log */}
      <div className="grid grid-cols-1">
        <EventLog events={events} />
      </div>
    </div>
  );
}
