import { ChainGraph } from './graph';
import { Route, RouteHop, RouteRequest, SearchResult } from './types';

// Naive search: only checks direct bridges (what most aggregators do)
export function naiveDirectSearch(
  graph: ChainGraph,
  request: RouteRequest
): SearchResult {
  const startTime = performance.now();
  const routes: Route[] = [];

  const bridges = graph.getBridgesFrom(request.fromChain).filter(
    b => b.to === request.toChain &&
         request.amountUsd >= b.minAmount &&
         request.amountUsd <= b.maxAmount
  );

  for (const bridge of bridges) {
    const destChain = graph.getChain(request.toChain);
    const hop: RouteHop = {
      type: 'bridge',
      bridgeId: bridge.id,
      fromChain: request.fromChain,
      toChain: request.toChain,
      feePercent: bridge.feePercent,
      flatFeeUsd: bridge.flatFeeUsd,
      gasUsd: destChain ? destChain.avgGasUsd : 0,
      latencyMs: bridge.avgLatencyMs,
    };

    const totalCostUsd = request.amountUsd * (hop.feePercent / 100) + hop.flatFeeUsd + hop.gasUsd;

    routes.push({
      hops: [hop],
      totalFeePercent: hop.feePercent,
      totalFlatFeeUsd: hop.flatFeeUsd,
      totalGasUsd: hop.gasUsd,
      totalCostUsd,
      totalLatencyMs: hop.latencyMs,
      hopCount: 1,
    });
  }

  routes.sort((a, b) => a.totalCostUsd - b.totalCostUsd);

  return {
    algorithm: 'Naive Direct (1-hop only)',
    bestRoute: routes[0] || null,
    routesExplored: bridges.length,
    timeMs: performance.now() - startTime,
    allRoutes: routes,
  };
}

// Dijkstra: shortest path by cost (exhaustive graph search)
export function dijkstraSearch(
  graph: ChainGraph,
  request: RouteRequest,
  maxHops: number = 5
): SearchResult {
  const startTime = performance.now();
  let routesExplored = 0;

  interface DijkstraNode {
    chain: string;
    cost: number;
    hops: RouteHop[];
    visited: Set<string>;
  }

  const queue: DijkstraNode[] = [{
    chain: request.fromChain,
    cost: 0,
    hops: [],
    visited: new Set([request.fromChain]),
  }];

  const completedRoutes: Route[] = [];
  const bestCostTo = new Map<string, number>();
  bestCostTo.set(request.fromChain, 0);

  while (queue.length > 0) {
    // Sort by cost (priority queue)
    queue.sort((a, b) => a.cost - b.cost);
    const current = queue.shift()!;
    routesExplored++;

    if (current.chain === request.toChain) {
      const totalFeePercent = current.hops.reduce((s, h) => s + h.feePercent, 0);
      const totalFlatFeeUsd = current.hops.reduce((s, h) => s + h.flatFeeUsd, 0);
      const totalGasUsd = current.hops.reduce((s, h) => s + h.gasUsd, 0);

      completedRoutes.push({
        hops: current.hops,
        totalFeePercent,
        totalFlatFeeUsd,
        totalGasUsd,
        totalCostUsd: current.cost,
        totalLatencyMs: current.hops.reduce((s, h) => s + h.latencyMs, 0),
        hopCount: current.hops.length,
      });
      continue;
    }

    if (current.hops.length >= maxHops) continue;

    const bridges = graph.getBridgesFrom(current.chain);
    for (const bridge of bridges) {
      if (current.visited.has(bridge.to)) continue;
      if (request.amountUsd < bridge.minAmount || request.amountUsd > bridge.maxAmount) continue;

      const destChain = graph.getChain(bridge.to);
      const gasUsd = destChain ? destChain.avgGasUsd : 0;
      const hopCost = request.amountUsd * (bridge.feePercent / 100) + bridge.flatFeeUsd + gasUsd;
      const newCost = current.cost + hopCost;

      // Pruning: skip if we already found a cheaper way to this chain
      const knownBest = bestCostTo.get(bridge.to);
      if (knownBest !== undefined && newCost >= knownBest) continue;
      bestCostTo.set(bridge.to, newCost);

      const hop: RouteHop = {
        type: 'bridge',
        bridgeId: bridge.id,
        fromChain: current.chain,
        toChain: bridge.to,
        feePercent: bridge.feePercent,
        flatFeeUsd: bridge.flatFeeUsd,
        gasUsd,
        latencyMs: bridge.avgLatencyMs,
      };

      const newVisited = new Set(current.visited);
      newVisited.add(bridge.to);

      queue.push({
        chain: bridge.to,
        cost: newCost,
        hops: [...current.hops, hop],
        visited: newVisited,
      });
    }
  }

  completedRoutes.sort((a, b) => a.totalCostUsd - b.totalCostUsd);

  return {
    algorithm: `Dijkstra (maxHops=${maxHops})`,
    bestRoute: completedRoutes[0] || null,
    routesExplored,
    timeMs: performance.now() - startTime,
    allRoutes: completedRoutes.slice(0, 50),
  };
}
