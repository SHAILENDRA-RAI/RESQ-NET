# RESQ-NET AI — Coverage-Aware Emergency Fleet Intelligence

**COC Hackathon — Problem Statement AI-01: Emergency Fleet Assignment with Coverage Preservation**

## Overview

RESQ-NET AI is an online emergency-vehicle dispatcher that proves a simple idea: **"The nearest vehicle isn't always the best vehicle."**

For every revealed emergency incident, the system evaluates available vehicles using response time, incident priority, quadrant coverage risk, and fleet balance — then selects the best vehicle while protecting emergency coverage across the service region.

## Problem Statement

Traditional dispatch assigns the nearest available vehicle. This greedy approach can drain coverage from a quadrant, leaving entire regions unprotected. RESQ-NET balances response speed against coverage preservation.

- 100×100 coordinate service region, 4 quadrants
- 20 emergency vehicles (5 per quadrant), speed = 1 unit/min
- 100 incidents with priorities P1 (60%), P2 (30%), P3 (10%)
- Simulation runs minutes 0–120
- Vehicles busy for 8 minutes after reaching an incident

## Features

- **Live Fleet Map** — 100×100 grid with vehicles, incidents, quadrant labels, assignment lines
- **Coverage Guardian** — what-if analysis before every dispatch; warns of coverage outages
- **Dispatch Intelligence Panel** — ranked candidate vehicles with ETA, coverage risk, and score
- **Explainability** — plain-language reasons generated from actual state values
- **Event Log** — scrolling log of all simulation events
- **Simulation Controls** — seed, algorithm selection, step/run/reset, timeline
- **Analytics** — Recharts visualizations and RESQ-NET vs Nearest Available comparison table
- **Judge Demo Mode** — guided walkthrough for 30–60 second understanding
- **About Page** — architecture diagram and solution explanation

## Algorithm

### RESQ-NET Dispatch Engine

For each waiting incident:

1. Find all idle vehicles
2. For each candidate, calculate:
   - Euclidean response time (distance / speed)
   - Coverage risk (what-if: idle count in candidate's quadrant after dispatch)
   - Fleet balance (std dev of quadrant idle counts)
3. Score: `totalCost = responseTimeCost + coverageRiskPenalty + fleetBalancePenalty`
4. Select the lowest-cost vehicle

Priority weights: P1=1, P2=3, P3=7. Higher priority gets stronger response-time preference.

### Coverage Guardian

Before assigning a vehicle, the system checks: "What happens to fleet coverage if this vehicle is dispatched?"

- If dispatching leaves a quadrant with 0 idle → **CRITICAL** penalty (50.0)
- If dispatching leaves a quadrant with 1 idle → **HIGH/MEDIUM** penalty (10.0)
- Otherwise → **LOW** risk

All scoring coefficients are centralized in `src/simulation/scoring.js` (`SCORING_CONFIG`).

### Baseline: Nearest Available

Simply selects the idle vehicle with the smallest Euclidean distance. Used for comparison.

## Online-Rule Compliance

The dispatcher operates under strict online constraints:
- At time t, it may only use already-revealed incidents, current vehicle states, and past outcomes
- The simulator generates the full scenario internally for local testing
- Incidents are revealed to the dispatcher only when they become observable (arrival time ≤ current minute)
- The dispatcher never inspects future incidents, future RNG state, or pre-generated event arrays
- Simulator state is separated from dispatcher-visible state

## Metrics

- **Priority-weighted response time** — weighted by P1=1, P2=3, P3=7
- **Coverage outage minutes** — minutes where any quadrant has 0 idle vehicles
- **P3 response time** — average response time for priority-3 incidents
- **Qmax** — largest queue observed during the run
- **Runtime** — simulation execution time
- **Reproducibility** — deterministic seeded randomness

## How to Run

```bash
npm install
npm run dev
```

The app runs entirely locally with no external API or backend.

## Development Seed

Default seed: **20260911**

Enter any seed in the top bar or Simulation page to generate a different (but reproducible) scenario.

## Demo Instructions

1. Open the app — Dashboard shows the command center
2. Click **Run Simulation** in the top bar to run to completion
3. Use **Step** to advance one minute at a time
4. Visit **Judge Demo** for a guided walkthrough:
   - Click **Start Demo** to generate the scenario
   - Click **Next Decision** to step through each dispatch decision
   - Watch the Coverage Guardian and Dispatch Panel update in real time
5. Visit **Analytics** to see charts and the algorithm comparison table
6. Visit **About** for the architecture diagram and solution explanation

## Tech Stack

- React + Vite (JavaScript, no TypeScript)
- Tailwind CSS
- Lucide React (icons)
- Recharts (charts)
- No backend, no external API, no authentication
