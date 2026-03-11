# Changelog

All notable changes to the Revy engine are documented here.

## [0.4.2] - 2026-03-15

### Added
- Risk scorer with configurable multiplier acceleration
- Route optimizer with deduplication and filtering
- Input validator for route requests and levy parameters
- Structured logger with module namespacing
- Comprehensive test suite (graph, levy-flight, cost-model, risk-scorer, utils, validator)
- CI/CD pipeline with GitHub Actions
- Live benchmark scripts with Li.Fi API integration

### Changed
- Refactored cost model to support per-chain gas overrides
- Improved route sorting with risk-adjusted scoring

## [0.3.0] - 2026-02-05

### Added
- RevyRouter smart contract (Solidity 0.8.20)
- Deploy script for Arbitrum via Viem
- Cost model with gas, bridge fee, slippage, and protocol fee simulation
- Execution time estimation per route

### Changed
- Expanded chain graph to 20 chains and 61 bridges

## [0.2.0] - 2026-01-10

### Added
- Levy Flight pathfinding algorithm (mu=2.0, 300 iterations, max 5 hops)
- Naive and Dijkstra search for benchmarking comparison
- CLI benchmark runner with 8 test scenarios
- Utility functions (power-law sampling, weighted random, statistics)

## [0.1.0] - 2025-12-20

### Added
- Initial project setup
- Chain and bridge type definitions
- Chain graph model with BFS distance calculation
- Configuration module with defaults
// rev: 1
