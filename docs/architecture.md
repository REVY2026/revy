# Architecture

## Overview

The Revy engine is structured as a 5-layer pipeline:

```
┌─────────────────────────────────────────────┐
│  Layer 1: Territory Mapping (Chain Graph)    │
│  20 chains, 61 bridges, gas/fee metadata    │
├─────────────────────────────────────────────┤
│  Layer 2: Levy Flight Pathfinding           │
│  Power-law random walk, 300 iterations      │
├─────────────────────────────────────────────┤
│  Layer 3: Cost Simulation                   │
│  Gas + bridge fees + slippage + protocol    │
├─────────────────────────────────────────────┤
│  Layer 4: Risk Scoring                      │
│  Hop-count penalty with acceleration        │
├─────────────────────────────────────────────┤
│  Layer 5: Route Optimization                │
│  Deduplication, filtering, ranking          │
└─────────────────────────────────────────────┘
```

## Module Map

```
src/
├── types.ts           Type definitions for Chain, Bridge, Route
├── config.ts          Engine configuration and defaults
├── graph.ts           Chain graph model with BFS
├── levy-flight.ts     Core pathfinding algorithm
├── naive-search.ts    Baseline algorithms for comparison
├── cost-model.ts      Cost simulation engine
├── risk-scorer.ts     Risk assessment and scoring
├── route-optimizer.ts Deduplication and ranking
├── validator.ts       Input validation
├── utils.ts           Math and utility functions
├── logger.ts          Structured logging
└── index.ts           Public API exports
```

## Data Flow

1. `RouteRequest` enters the engine
2. `validator` checks inputs
3. `ChainGraph` provides topology
4. `LevyFlightRouter` generates candidate routes
5. `cost-model` simulates execution costs
6. `risk-scorer` adjusts for hop-count risk
7. `route-optimizer` deduplicates and ranks
8. Best route returned

## Configuration

All tunable parameters are centralized in `config.ts`:
- Levy Flight: mu, iterations, maxHops
- Cost: gas overrides, fee defaults, slippage
- Risk: multiplier base, hop penalty, acceleration
- Search: candidate limits, timeout
