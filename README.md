![banner](assets/banner.png)

[![License: MIT](https://img.shields.io/badge/License-MIT-ff6600?style=flat-square)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-ff6600?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-ff6600?style=flat-square&logo=solidity&logoColor=white)](contracts/RevyRouter.sol)
[![Chains](https://img.shields.io/badge/Chains-20+-ff6600?style=flat-square)](docs/architecture.md)
[![Arbitrum](https://img.shields.io/badge/Deployed-Arbitrum-ff6600?style=flat-square)](https://arbiscan.io/address/0x75da9759d9e0a22d9b8a77ec1ec57f99e6759255)
[![CI](https://img.shields.io/github/actions/workflow/status/REVY2026/revy/ci.yml?style=flat-square&label=CI&color=ff6600)](https://github.com/REVY2026/revy/actions)

# REVY -- Levy Flight Cross-Chain Routing Engine

Cross-chain routing powered by the Levy Flight search algorithm -- a mathematically optimal foraging strategy observed in apex predators, now applied to discovering the cheapest token transfer paths across 20+ blockchain networks.

Every bridge checks 3-5 direct routes and returns the cheapest. Nobody asks: what if going through 2 intermediate chains is 40% cheaper? What if the direct route doesn't exist at all? Revy answers both questions.

---

## How It Works

```mermaid
graph LR
    A[Route Request] --> B[Chain Graph]
    B --> C[Levy Flight Search]
    C --> D[Cost Simulation]
    D --> E[Risk Scoring]
    E --> F[Best Route]
```

The engine implements a 5-layer pipeline:

1. **Territory Mapping** -- Chain graph with 20 chains, 61 bridge connections, gas and fee metadata
2. **Levy Flight Pathfinding** -- Power-law distributed random walk (mu=2.0, 300 iterations)
3. **Cost Simulation** -- Per-hop gas, bridge fees, slippage, and protocol fee calculation
4. **Risk Scoring** -- Hop-count penalty with non-linear acceleration
5. **Route Optimization** -- Deduplication, filtering, and risk-adjusted ranking

---

## Benchmark Results
