import { ChainGraph } from './graph';
import { Route, RouteHop, RouteRequest, SearchResult } from './types';

// Levy Flight step length sampled from power-law distribution
// P(L) ~ L^(-mu), where mu ≈ 2.0 is optimal (Viswanathan et al., Nature 1999)
function levyStepLength(mu: number): number {
  // Inverse CDF method for power-law distribution
  // L = L_min * u^(-1/(mu-1)) where u ~ Uniform(0,1)
  const u = Math.random();
  const Lmin = 1;
  return Lmin * Math.pow(u, -1 / (mu - 1));
}

// Classify a step as "local hop" or "long leap" based on Levy Flight
function classifyStep(stepLength: number): 'local' | 'leap' {
  return stepLength < 2.5 ? 'local' : 'leap';
}

function computeHopCost(
  graph: ChainGraph,
  fromChain: string,
  toChain: string,
  amountUsd: number
): RouteHop | null {
  const bridge = graph.cheapestDirectBridge(fromChain, toChain, amountUsd);
  if (!bridge) return null;

  const chain = graph.getChain(toChain);
  const gasUsd = chain ? chain.avgGasUsd : 0;

  return {
    type: 'bridge',
    bridgeId: bridge.id,
    fromChain,
    toChain,
    feePercent: bridge.feePercent,
    flatFeeUsd: bridge.flatFeeUsd,
    gasUsd,
    latencyMs: bridge.avgLatencyMs,
  };
}

function buildRoute(hops: RouteHop[], amountUsd: number): Route {
  let totalFeePercent = 0;
  let totalFlatFeeUsd = 0;
  let totalGasUsd = 0;
  let totalLatencyMs = 0;

  for (const hop of hops) {
    totalFeePercent += hop.feePercent;
    totalFlatFeeUsd += hop.flatFeeUsd;
    totalGasUsd += hop.gasUsd;
    totalLatencyMs += hop.latencyMs;
  }

  const totalCostUsd = amountUsd * (totalFeePercent / 100) + totalFlatFeeUsd + totalGasUsd;

  return {
    hops,
    totalFeePercent,
    totalFlatFeeUsd,
    totalGasUsd,
    totalCostUsd,
    totalLatencyMs,
    hopCount: hops.length,
  };
}

export interface LevyFlightConfig {
  mu: number;           // Levy exponent (optimal ≈ 2.0)
  maxHops: number;      // Truncation (Mantegna & Stanley, 1994)
  iterations: number;   // Number of search walks
  maxRoutes: number;    // Max routes to keep
}

const DEFAULT_CONFIG: LevyFlightConfig = {
  mu: 2.0,
  maxHops: 5,
  iterations: 200,
  maxRoutes: 50,
};

// Core Levy Flight pathfinding
export function levyFlightSearch(
  graph: ChainGraph,
  request: RouteRequest,
  config: Partial<LevyFlightConfig> = {}
): SearchResult {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const startTime = performance.now();
  const allRoutes: Route[] = [];
  let routesExplored = 0;

  const allChains = graph.getAllChains().map(c => c.id);

  for (let iter = 0; iter < cfg.iterations; iter++) {
    const path: string[] = [request.fromChain];
    const visited = new Set<string>([request.fromChain]);
    let current = request.fromChain;
    const hops: RouteHop[] = [];

    for (let hop = 0; hop < cfg.maxHops; hop++) {
      if (current === request.toChain) break;

      const stepLength = levyStepLength(cfg.mu);
      const stepType = classifyStep(stepLength);

      let nextChain: string | null = null;

      if (stepType === 'local') {
        // Local hop: pick from direct neighbors, weighted by cost
        const neighbors = graph.getNeighbors(current).filter(n => !visited.has(n));
        if (neighbors.length === 0) break;

        // Prefer neighbors closer to destination
        const scored = neighbors.map(n => ({
          chain: n,
          dist: graph.bfsDistance(n, request.toChain),
          directCost: computeHopCost(graph, current, n, request.amountUsd),
        })).filter(s => s.directCost !== null);

        if (scored.length === 0) break;

        // Weighted selection: lower distance = higher weight, with randomness
        const weights = scored.map(s => {
          const distWeight = 1 / (s.dist + 1);
          const costWeight = 1 / (s.directCost!.flatFeeUsd + s.directCost!.feePercent * request.amountUsd / 100 + 0.01);
          return distWeight * costWeight * (0.5 + Math.random());
        });
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let r = Math.random() * totalWeight;
        let chosen = scored[0];
        for (let i = 0; i < weights.length; i++) {
          r -= weights[i];
          if (r <= 0) { chosen = scored[i]; break; }
        }

        nextChain = chosen.chain;
      } else {
        // Long leap: jump to a non-adjacent chain (Levy Flight's signature move)
        // Pick a chain that is NOT a direct neighbor but is reachable
        const neighbors = new Set(graph.getNeighbors(current));
        const leapCandidates = allChains.filter(
          c => c !== current && !visited.has(c) && !neighbors.has(c)
        );

        if (leapCandidates.length === 0) {
          // Fall back to neighbors if no leap targets
          const fallback = graph.getNeighbors(current).filter(n => !visited.has(n));
          if (fallback.length === 0) break;
          nextChain = fallback[Math.floor(Math.random() * fallback.length)];
        } else {
          // Weight leaps toward destination
          const scored = leapCandidates.map(c => ({
            chain: c,
            dist: graph.bfsDistance(c, request.toChain),
          }));
          const weights = scored.map(s => 1 / (s.dist + 1) * (0.3 + Math.random()));
          const totalWeight = weights.reduce((a, b) => a + b, 0);
          let r = Math.random() * totalWeight;
          let chosen = scored[0];
          for (let i = 0; i < weights.length; i++) {
            r -= weights[i];
            if (r <= 0) { chosen = scored[i]; break; }
          }

          // For a leap, we need to find an actual bridge path to get there
          // Check if there's a 2-hop path through any intermediate
          const intermediates = graph.getNeighbors(current).filter(n => !visited.has(n));
          let foundLeap = false;

          for (const mid of intermediates) {
            if (graph.getNeighbors(mid).includes(chosen.chain)) {
              // 2-hop leap: current -> mid -> chosen
              const hop1 = computeHopCost(graph, current, mid, request.amountUsd);
              const hop2 = computeHopCost(graph, mid, chosen.chain, request.amountUsd);
              if (hop1 && hop2) {
                hops.push(hop1, hop2);
                visited.add(mid);
                visited.add(chosen.chain);
                path.push(mid, chosen.chain);
                current = chosen.chain;
                foundLeap = true;
                break;
              }
            }
          }

          if (!foundLeap) {
            // Direct bridge if available
            const direct = computeHopCost(graph, current, chosen.chain, request.amountUsd);
            if (direct) {
              nextChain = chosen.chain;
            } else {
              // Fall back to any neighbor
              const fb = graph.getNeighbors(current).filter(n => !visited.has(n));
              if (fb.length === 0) break;
              nextChain = fb[Math.floor(Math.random() * fb.length)];
            }
          } else {
            nextChain = null; // Already handled in leap
          }
        }
      }

      if (nextChain) {
        const hop = computeHopCost(graph, current, nextChain, request.amountUsd);
        if (!hop) break;
        hops.push(hop);
        visited.add(nextChain);
        path.push(nextChain);
        current = nextChain;
      }
    }

    // If we haven't reached destination, try one more direct hop
    if (current !== request.toChain && hops.length < cfg.maxHops) {
      const finalHop = computeHopCost(graph, current, request.toChain, request.amountUsd);
      if (finalHop) {
        hops.push(finalHop);
        current = request.toChain;
      }
    }

    routesExplored++;

    if (current === request.toChain && hops.length > 0) {
      allRoutes.push(buildRoute(hops, request.amountUsd));
    }
  }

  // Sort by total cost
  allRoutes.sort((a, b) => a.totalCostUsd - b.totalCostUsd);

  // Deduplicate (same hop sequence)
  const seen = new Set<string>();
  const uniqueRoutes = allRoutes.filter(r => {
    const key = r.hops.map(h => h.bridgeId || h.poolId).join('->');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, cfg.maxRoutes);

  const timeMs = performance.now() - startTime;

  return {
    algorithm: `Levy Flight (mu=${cfg.mu}, iter=${cfg.iterations}, maxHops=${cfg.maxHops})`,
    bestRoute: uniqueRoutes[0] || null,
    routesExplored,
    timeMs,
    allRoutes: uniqueRoutes,
  };
}
// rev: 1
