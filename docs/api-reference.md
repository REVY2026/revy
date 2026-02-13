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
