# API Reference

## Core Classes

### ChainGraph

```typescript
import { ChainGraph } from 'revy-engine';

const graph = new ChainGraph();
graph.getChains();                              // Chain[]
graph.getBridges();                             // Bridge[]
graph.getNeighbors('ethereum');                 // BridgeConnection[]
graph.bfsDistance('ethereum', 'solana');         // number
graph.cheapestDirectBridge('ethereum', 'arb');  // Bridge | null
```

### LevyFlightRouter

```typescript
import { LevyFlightRouter, ChainGraph } from 'revy-engine';

const graph = new ChainGraph();
const router = new LevyFlightRouter(graph);

const routes = router.findRoutes({
  fromChain: 'ethereum',
  toChain: 'solana',
  amountUsd: 10000,
});
```

## Cost Functions

```typescript
import { estimateRouteCost, estimateExecutionTime } from 'revy-engine';

const cost = estimateRouteCost(route, 10000);
// { gasUsd, bridgeFeeUsd, slippageUsd, protocolFeeUsd, totalUsd }

const seconds = estimateExecutionTime(route);
```

## Risk Assessment

```typescript
import { assessRouteRisk, calculateRiskMultiplier } from 'revy-engine';

const multiplier = calculateRiskMultiplier(3); // 3 hops
const risk = assessRouteRisk(route, costUsd);
// { multiplier, adjustedCostUsd, riskLevel, warnings }
```

## Route Optimization

```typescript
import { optimizeRoutes, getBestRoute } from 'revy-engine';

const optimized = optimizeRoutes(routes, request);
const best = getBestRoute(routes, request);
// { route, cost, risk, score, pathHash }
```

## Validation

```typescript
import { validateRouteRequest, validateLevyParams } from 'revy-engine';

const result = validateRouteRequest(request, graph);
// { valid: boolean, errors: string[] }
```

## Types

```typescript
interface RouteRequest {
  fromChain: string;
  toChain: string;
  amountUsd: number;
}

interface Route {
  hops: RouteHop[];
  totalFeePercent: number;
  totalFlatFeeUsd: number;
  totalGasUsd: number;
  totalCostUsd: number;
  hopCount: number;
}

interface RouteHop {
  fromChain: string;
  toChain: string;
  bridge: string;
  feePercent: number;
  flatFeeUsd: number;
  gasUsd: number;
}
```
