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