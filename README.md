![banner](assets/banner.png)

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-ff6600?style=flat-square)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-ff6600?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-ff6600?style=flat-square&logo=solidity&logoColor=white)](contracts/)
[![Chains](https://img.shields.io/badge/Chains-20+-ff6600?style=flat-square)](docs/architecture.md)
[![Arbitrum](https://img.shields.io/badge/Deployed-Arbitrum-ff6600?style=flat-square)](https://arbiscan.io/address/0x75da9759d9e0a22d9b8a77ec1ec57f99e6759255)
[![CI](https://img.shields.io/github/actions/workflow/status/REVY2026/revy/ci.yml?style=flat-square&label=CI&color=ff6600)](https://github.com/REVY2026/revy/actions)

**Cross-chain routing powered by the search algorithm apex predators use to hunt.**

[App](https://revy.fun) | [Docs](https://revy.fun/docs) | [Contract](https://arbiscan.io/address/0x75da9759d9e0a22d9b8a77ec1ec57f99e6759255) | [Twitter](https://x.com/revyfun)

</div>

---

## The Problem

Every bridge does the same thing:

> Check 3-5 direct routes. Return the cheapest. Done.

Nobody asks:
- What if routing through 2 intermediate chains is **40% cheaper**?
- What if the direct route **doesn't exist at all**?

```
You:        ETH ──────────────────── SOL     $3.03
Revy:       ETH → Base → Arbitrum → SOL     $2.68  (11.5% saved)
```

```
You:        SOL ──── Scroll          "no route found"
Revy:       SOL → Arbitrum → Scroll  $3.40   (route discovered)
```

---

## How It Works

Revy uses **Levy Flight** -- a power-law distributed random walk that models how apex predators search for prey. Published in *Nature* (1999), cited 3200+ times. Not a whitepaper buzzword. Peer-reviewed math.

```mermaid
graph LR
    A[Route Request] --> B[Chain Graph<br/>20 chains, 61 bridges]
    B --> C[Levy Flight Search<br/>300 iterations, mu=2.0]
    C --> D[Cost Simulation<br/>gas + fees + slippage]
    D --> E[Risk Scoring<br/>hop-count penalty]
    E --> F[Best Route]

    style A fill:#0a0a0a,stroke:#ff6600,color:#fff
    style B fill:#0a0a0a,stroke:#ff6600,color:#fff
    style C fill:#0a0a0a,stroke:#00ff41,color:#fff
    style D fill:#0a0a0a,stroke:#ff6600,color:#fff
    style E fill:#0a0a0a,stroke:#ff6600,color:#fff
    style F fill:#0a0a0a,stroke:#00ff41,color:#fff
```

**Short steps** scan nearby chains (L2s, same ecosystem).
**Long leaps** jump across ecosystem boundaries (EVM to Solana).
**Cost simulation** scores every candidate route.
**Risk scoring** penalizes excessive hops.
When direct is cheapest, we pick direct.

---

## Benchmarks

```
┌─────────────────────┬──────────┬───────────┬──────────────┐
│ Route               │ Direct   │ Dijkstra  │ Levy Flight  │
├─────────────────────┼──────────┼───────────┼──────────────┤
│ ETH → ARB ($10k)    │ $6.20    │ $6.20     │ $6.20        │
│ ETH → SOL ($50k)    │ $1,515   │ $1,350    │ $1,340    *  │
│ SOL → Scroll ($5k)  │ --       │ $270.50   │ $267.00   *  │
│ FTM → Sui ($20k)    │ --       │ $1,008    │ $988.60   *  │
│ OP → zkSync ($15k)  │ --       │ $307.50   │ $300.00   *  │
│ BSC → Aptos ($30k)  │ --       │ $1,614    │ $1,581    *  │
└─────────────────────┴──────────┴───────────┴──────────────┘
                                          * best route found
```

`--` = no route exists. Levy Flight finds multi-hop paths where direct bridges don't exist.

---

## Architecture

```
contracts/
├── RevyRouter.sol              Core router (2bp fee, Arbitrum)
├── RevyToken.sol               $REVY ERC-20 (1B supply, burn + permit)
├── RevyStaking.sol             Stake REVY → earn 70% protocol fees
├── RevyFeeCollector.sol        Fee distribution (70/20/10 split)
├── RevyGovernance.sol          On-chain governance + timelock
├── RevyVesting.sol             Cliff + linear vesting schedules
├── interfaces/
│   ├── IRevyRouter.sol         Router interface
│   └── IRevyStaking.sol        Staking interface
└── libraries/
    ├── RouteLib.sol             Route encoding/validation
    └── FeeLib.sol               Fee calculation + volume tiers

src/
├── graph.ts                    Chain graph (20 chains, 61 bridges)
├── levy-flight.ts              Core pathfinding algorithm
├── cost-model.ts               Cost simulation engine
├── risk-scorer.ts              Risk assessment
├── route-optimizer.ts          Deduplication + ranking
├── validator.ts                Input validation
├── config.ts                   Engine configuration
├── utils.ts                    Math utilities
├── logger.ts                   Structured logging
├── naive-search.ts             Baseline algorithms
├── types.ts                    Type definitions
└── index.ts                    Public API

benchmarks/                     Algorithm comparison + live API tests
tests/                          Unit tests (vitest)
docs/                           Architecture, algorithm, API reference
```

---

## Smart Contracts

**Deployed on Arbitrum One:**

| Contract | Address | Status |
|----------|---------|--------|
| RevyRouter | [`0x75da...9255`](https://arbiscan.io/address/0x75da9759d9e0a22d9b8a77ec1ec57f99e6759255) | Live |
| RevyToken | TBD | Pre-launch |
| RevyStaking | TBD | Pre-launch |
| RevyGovernance | TBD | Pre-launch |

**Protocol Fee:** 0.02% (2 basis points)
**Fee Distribution:** 70% stakers / 20% treasury / 10% buyback+burn

---

## Quick Start

```bash
git clone https://github.com/REVY2026/revy.git
cd revy
npm install
```

Run benchmarks:
```bash
npm run benchmark
```

Run tests:
```bash
npm test
```

---

## Usage

```typescript
import { ChainGraph, LevyFlightRouter, getBestRoute } from './src/index.js';

const graph = new ChainGraph();
const router = new LevyFlightRouter(graph);

// Find routes for an "impossible" pair
const routes = router.findRoutes({
  fromChain: 'solana',
  toChain: 'scroll',
  amountUsd: 5000,
});

// Get the optimal route with risk-adjusted scoring
const best = getBestRoute(routes, {
  fromChain: 'solana',
  toChain: 'scroll',
  amountUsd: 5000,
});

console.log(`${best.route.hopCount} hops, $${best.cost.totalUsd.toFixed(2)}`);
// → "2 hops, $267.00"
```

---

## Supported Chains

Ethereum, Arbitrum, Optimism, Base, Polygon, BSC, Avalanche, Solana, Sui, Aptos, Scroll, zkSync Era, Linea, Manta Pacific, Celo, Gnosis, NEAR, Mantle, Blast, Fantom

---

## Documentation

- [Architecture](docs/architecture.md)
- [Algorithm](docs/algorithm.md)
- [API Reference](docs/api-reference.md)
- [Changelog](CHANGELOG.md)
- [Contributing](CONTRIBUTING.md)
- [Security](SECURITY.md)

---

<div align="center">

**No route? We make one.**

[revy.fun](https://revy.fun) | [x.com/revyfun](https://x.com/revyfun)

</div>
