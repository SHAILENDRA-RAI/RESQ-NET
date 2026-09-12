import { useMemo, useState } from 'react';
import FleetMap from '../components/FleetMap.jsx';
import EventLog from '../components/EventLog.jsx';
import CoverageGuardian from '../components/CoverageGuardian.jsx';
import DispatchPanel from '../components/DispatchPanel.jsx';
import { getQuadrantIdleCounts, simulateDispatch } from '../simulation/coverage.js';
import { Play, Pause, StepForward, RotateCcw, FastForward, Layers } from 'lucide-react';

export default function Simulation({
  simState,
  simulator,
  onStep,
  onRun,
  onReset,
  onGenerate,
  seed,
  setSeed,
  algorithm,
  setAlgorithm,
  selectedIncidentId,
  setSelectedIncidentId,
}) {
  const [selectedCandidateVehicle, setSelectedCandidateVehicle] = useState(null);
  const [autoPlay, setAutoPlay] = useState(false);

  const vehicles = simState?.vehicles || [];
  const revealedIncidents = simState?.revealedIncidents || [];
  const events = simState?.events || [];
  const currentMinute = simState?.currentMinute || 0;

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

  if (!simState || !simulator) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center max-w-md">
          <Layers className="w-12 h-12 text-accent-cyan mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Simulation Control</h2>
          <p className="text-sm text-slate-400 mb-6">
            Generate a scenario with seed {seed || '20260911'} to start the simulation.
          </p>
          <button
            onClick={onGenerate}
            className="px-6 py-2.5 bg-gradient-to-r from-accent-cyan to-accent-blue text-white text-sm font-semibold rounded-lg hover:opacity-90"
          >
            Generate Scenario
          </button>
        </div>
      </div>
    );
  }

  const progress = (currentMinute / 120) * 100;

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Simulation Controls */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-3 flex-wrap mb-4">
          <h2 className="text-sm font-semibold text-white">Simulation Controls</h2>
          <div className="flex items-center gap-2 ml-auto">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400">Seed:</label>
              <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(Number(e.target.value))}
                className="w-28 bg-navy-800 border border-navy-600 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-accent-cyan"
              />
            </div>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              className="bg-navy-800 border border-navy-600 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-accent-cyan"
            >
              <option value="resqnet">RESQ-NET AI</option>
              <option value="nearest">Nearest Available</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onGenerate}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-navy-800 hover:bg-navy-700 text-slate-200 text-xs font-medium rounded-lg border border-navy-600 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Generate Scenario
          </button>
          <button
            onClick={onRun}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-accent-cyan to-accent-blue text-white text-xs font-semibold rounded-lg hover:opacity-90"
          >
            <FastForward className="w-3.5 h-3.5" />
            Run Full
          </button>
          <button
            onClick={onStep}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-navy-800 hover:bg-navy-700 text-slate-200 text-xs font-medium rounded-lg border border-navy-600 transition-colors"
          >
            <StepForward className="w-3.5 h-3.5" />
            Step
          </button>
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-navy-800 hover:bg-navy-700 text-slate-200 text-xs font-medium rounded-lg border border-navy-600 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>

        {/* Timeline */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-slate-400">Timeline</span>
            <span className="text-[10px] text-slate-400 font-mono">
              {currentMinute} / 120 min
            </span>
          </div>
          <div className="relative h-2 bg-navy-800 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-accent-cyan to-accent-blue rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-[9px] text-slate-600 font-mono">
            <span>0</span>
            <span>30</span>
            <span>60</span>
            <span>90</span>
            <span>120</span>
          </div>
        </div>
      </div>

      {/* Map + Side panels */}
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
            algorithm={algorithm}
          />
        </div>
      </div>

      <EventLog events={events} />
    </div>
  );
}
