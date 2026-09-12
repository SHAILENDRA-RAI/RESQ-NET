import { Shield, Zap, Eye, GitBranch, Target, Layers } from 'lucide-react';

export default function About() {
  const flowSteps = [
    'Incident Revealed',
    'Candidate Vehicles (idle)',
    'ETA Calculation',
    'Coverage Guardian Check',
    'Fleet Balance Evaluation',
    'RESQ-NET Score',
    'Best Vehicle Selected',
    'Assignment',
    'Fleet Update',
  ];

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center py-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-cyan to-accent-blue flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">RESQ-NET AI</h1>
        <p className="text-sm text-slate-400">Coverage-Aware Emergency Fleet Intelligence</p>
        <p className="text-xs text-slate-500 mt-2">COC Hackathon — Problem Statement AI-01</p>
      </div>

      {/* Core Principle */}
      <div className="glass-card p-6 text-center">
        <p className="text-lg font-medium text-accent-cyan italic">
          "The nearest vehicle isn't always the best vehicle."
        </p>
      </div>

      {/* Problem */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-5 h-5 text-red-400" />
          <h2 className="text-sm font-semibold text-white">Problem</h2>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          Traditional dispatch systems assign the nearest available vehicle to each emergency.
          This greedy approach can drain coverage from a quadrant, leaving entire regions
          unprotected when the next incident arrives. The challenge is to minimize response
          time while preserving coverage across all quadrants of the service region.
        </p>
      </div>

      {/* Solution */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-5 h-5 text-accent-cyan" />
          <h2 className="text-sm font-semibold text-white">Solution</h2>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          RESQ-NET AI evaluates every candidate vehicle using a multi-factor scoring model
          that combines response time, incident priority, coverage risk, and fleet balance.
          The Coverage Guardian performs a what-if check before each assignment — if
          dispatching a vehicle would leave its quadrant with zero idle vehicles, a strong
          penalty is applied. This balances speed against coverage preservation.
        </p>
      </div>

      {/* USP */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-green-400" />
            <h2 className="text-sm font-semibold text-white">Coverage Guardian</h2>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            Before every dispatch, the system simulates the hypothetical fleet state.
            If a candidate would create a coverage outage (0 idle in its quadrant), it
            receives a heavy penalty. What-If Dispatch lets operators inspect the
            impact before committing.
          </p>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-5 h-5 text-accent-cyan" />
            <h2 className="text-sm font-semibold text-white">Explainability</h2>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            Every assignment is explained in plain language. The system generates
            reasons from actual state values — why a vehicle was chosen, what
            tradeoffs were made, and how coverage was preserved.
          </p>
        </div>
      </div>

      {/* Architecture Diagram */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <GitBranch className="w-5 h-5 text-accent-cyan" />
          <h2 className="text-sm font-semibold text-white">Dispatch Architecture</h2>
        </div>
        <div className="flex flex-col items-center gap-1">
          {flowSteps.map((step, idx) => (
            <div key={step} className="flex flex-col items-center w-full">
              <div
                className={`px-4 py-2 rounded-lg text-xs font-medium ${
                  idx === flowSteps.length - 1
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : idx === 3
                    ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30'
                    : 'bg-navy-800 text-slate-300 border border-navy-600'
                }`}
              >
                {step}
              </div>
              {idx < flowSteps.length - 1 && (
                <div className="w-px h-4 bg-navy-600" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Online Rule Compliance */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-5 h-5 text-amber-400" />
          <h2 className="text-sm font-semibold text-white">Online-Rule Compliance</h2>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          The dispatcher operates under strict online constraints. At simulation time t,
          it may only use already-revealed incidents, current vehicle states, and past
          assignment outcomes. The simulator generates the full scenario internally for
          local testing, but incidents are revealed to the dispatcher only when they
          become observable. The dispatcher never inspects future incidents, future RNG
          state, or pre-generated event arrays.
        </p>
      </div>

      {/* Metrics */}
      <div className="glass-card p-5">
        <h2 className="text-sm font-semibold text-white mb-3">Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan" />
            Priority-weighted response time (P1=1, P2=3, P3=7)
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan" />
            Coverage outage minutes (any quadrant at 0 idle)
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan" />
            P3 average response time
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan" />
            Qmax — largest queue observed
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan" />
            Simulation runtime
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan" />
            Seed reproducibility (default: 20260911)
          </div>
        </div>
      </div>
    </div>
  );
}
