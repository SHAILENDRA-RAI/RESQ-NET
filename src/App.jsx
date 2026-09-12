import { useState, useCallback, useMemo } from 'react';
import { Shield, Activity, BarChart3, Info, Play, RotateCcw, Zap, Sparkles } from 'lucide-react';
import Dashboard from './pages/Dashboard.jsx';
import Simulation from './pages/Simulation.jsx';
import Analytics from './pages/Analytics.jsx';
import About from './pages/About.jsx';
import Demo from './pages/Demo.jsx';
import { createSimulator, runComparison } from './simulation/simulator.js';
import { SCORING_CONFIG } from './simulation/scoring.js';
import { calculateMetrics } from './simulation/metrics.js';

const DEFAULT_SEED = 20260911;

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [seed, setSeed] = useState(DEFAULT_SEED);
  const [algorithm, setAlgorithm] = useState('resqnet');
  const [simulator, setSimulator] = useState(null);
  const [simState, setSimState] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [comparisonData, setComparisonData] = useState(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState(null);
  const [selectedCandidateVehicle, setSelectedCandidateVehicle] = useState(null);

  const generateNewSimulator = useCallback((seedVal, algo) => {
    const sim = createSimulator(seedVal, algo, SCORING_CONFIG);
    setSimulator(sim);
    setSimState(sim.getState());
    setComparisonData(null);
    setSelectedIncidentId(null);
    setSelectedCandidateVehicle(null);
    setIsRunning(false);
  }, []);

  const handleGenerate = useCallback(() => {
    generateNewSimulator(seed, algorithm);
  }, [seed, algorithm, generateNewSimulator]);

  const handleRun = useCallback(() => {
    let sim = simulator;
    if (!sim) {
      sim = createSimulator(seed, algorithm, SCORING_CONFIG);
      setSimulator(sim);
    }
    const result = sim.run();
    setSimState({
      ...sim.getState(),
      metrics: result.metrics,
      runtime: result.runtime,
      isComplete: true,
    });
    setIsRunning(false);

    // Run comparison
    const comp = runComparison(seed, SCORING_CONFIG);
    setComparisonData(comp);
  }, [simulator, seed, algorithm]);

  const handleStep = useCallback(() => {
    if (!simulator) return;
    simulator.step();
    setSimState(simulator.getState());
  }, [simulator]);

  const handleReset = useCallback(() => {
    generateNewSimulator(seed, algorithm);
  }, [seed, algorithm, generateNewSimulator]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Shield },
    { id: 'demo', label: 'Judge Demo', icon: Sparkles },
    { id: 'simulation', label: 'Simulation', icon: Activity },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'about', label: 'About', icon: Info },
  ];

  return (
    <div className="min-h-screen bg-navy-950 flex">
      {/* Left Navigation */}
      <nav className="w-16 lg:w-56 bg-navy-900 border-r border-navy-700/50 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-navy-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-cyan to-accent-blue flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            {page !== 'dashboard' && (
              <div className="hidden lg:block">
                <div className="text-sm font-bold text-white tracking-tight">RESQ-NET AI</div>
                <div className="text-[10px] text-slate-400">Fleet Intelligence</div>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all relative ${
                  active
                    ? 'text-accent-cyan bg-accent-cyan/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-navy-800'
                }`}
              >
                {active && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent-cyan rounded-r-full" />
                )}
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="hidden lg:inline">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-navy-700/50">
          <div className="hidden lg:block text-[10px] text-slate-500 leading-relaxed">
            COC Hackathon<br />AI-01 Problem
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Status Bar */}
        <header className="bg-navy-900/80 backdrop-blur-md border-b border-navy-700/50 px-6 py-3 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="status-dot bg-green-400 animate-pulse" />
              <span className="text-xs font-medium text-slate-300">
                {simState?.isComplete ? 'Simulation Complete' : simulator ? 'Simulation Ready' : 'No Scenario'}
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <Zap className="w-3.5 h-3.5 text-accent-cyan" />
              <span>Algorithm:</span>
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

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400">Seed:</label>
              <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(Number(e.target.value))}
                className="w-24 bg-navy-800 border border-navy-600 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-accent-cyan"
              />
            </div>
            {!simulator && (
              <button
                onClick={handleGenerate}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-navy-700 hover:bg-navy-600 text-slate-200 text-xs font-medium rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Generate
              </button>
            )}
            <button
              onClick={handleRun}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-accent-cyan to-accent-blue hover:opacity-90 text-white text-xs font-semibold rounded-lg transition-opacity shadow-lg shadow-accent-cyan/20"
            >
              <Play className="w-3.5 h-3.5" />
              Run Simulation
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {page === 'dashboard' && (
            <Dashboard
              simState={simState}
              simulator={simulator}
              onStep={handleStep}
              onGenerate={handleGenerate}
              seed={seed}
              algorithm={algorithm}
              selectedIncidentId={selectedIncidentId}
              setSelectedIncidentId={setSelectedIncidentId}
              selectedCandidateVehicle={selectedCandidateVehicle}
              setSelectedCandidateVehicle={setSelectedCandidateVehicle}
            />
          )}
          {page === 'simulation' && (
            <Simulation
              simState={simState}
              simulator={simulator}
              onStep={handleStep}
              onRun={handleRun}
              onReset={handleReset}
              onGenerate={handleGenerate}
              seed={seed}
              setSeed={setSeed}
              algorithm={algorithm}
              setAlgorithm={setAlgorithm}
              selectedIncidentId={selectedIncidentId}
              setSelectedIncidentId={setSelectedIncidentId}
            />
          )}
          {page === 'demo' && <Demo />}
          {page === 'analytics' && (
            <Analytics comparisonData={comparisonData} simState={simState} onRunComparison={handleRun} />
          )}
          {page === 'about' && <About />}
        </main>
      </div>
    </div>
  );
}
