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