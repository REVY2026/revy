import { createDefaultGraph } from './graph';
import { levyFlightSearch } from './levy-flight';
import { naiveDirectSearch, dijkstraSearch } from './naive-search';
import { RouteRequest, SearchResult, Route } from './types';

function formatRoute(route: Route): string {
  const path = route.hops.map((h, i) => {
    const bridge = h.bridgeId?.split('-').slice(0, -2).join('-') || h.bridgeId || '?';
    return i === 0
      ? `${h.fromChain} --[${bridge}]--> ${h.toChain}`
      : `--[${bridge}]--> ${h.toChain}`;
  });
  return path.join(' ');
}

function formatResult(result: SearchResult, amountUsd: number): string {
  const lines: string[] = [];
  lines.push(`\n  Algorithm: ${result.algorithm}`);
  lines.push(`  Routes explored: ${result.routesExplored}`);
  lines.push(`  Time: ${result.timeMs.toFixed(2)}ms`);
  lines.push(`  Unique routes found: ${result.allRoutes.length}`);

  if (result.bestRoute) {
    const r = result.bestRoute;
    lines.push(`\n  BEST ROUTE (${r.hopCount} hop${r.hopCount > 1 ? 's' : ''}):`);
    lines.push(`    Path: ${formatRoute(r)}`);
    lines.push(`    Fee: ${r.totalFeePercent.toFixed(3)}% + $${r.totalFlatFeeUsd.toFixed(2)} flat + $${r.totalGasUsd.toFixed(2)} gas`);
    lines.push(`    Total cost on $${amountUsd.toLocaleString()}: $${r.totalCostUsd.toFixed(2)}`);
    lines.push(`    Latency: ${(r.totalLatencyMs / 1000).toFixed(0)}s`);
  } else {
    lines.push(`\n  No route found.`);
  }

  return lines.join('\n');
}

function runComparison(request: RouteRequest) {
  const graph = createDefaultGraph();

  console.log('═'.repeat(70));
  console.log(`  ROUTE: ${request.fromChain.toUpperCase()} → ${request.toChain.toUpperCase()}`);
  console.log(`  AMOUNT: $${request.amountUsd.toLocaleString()}`);
  console.log('═'.repeat(70));

  // 1. Naive (direct bridges only)
  const naive = naiveDirectSearch(graph, request);
  console.log(formatResult(naive, request.amountUsd));

  // 2. Dijkstra (exhaustive shortest path)
  const dijkstra = dijkstraSearch(graph, request);
  console.log(formatResult(dijkstra, request.amountUsd));

  // 3. Levy Flight
  const levy = levyFlightSearch(graph, request, {
    mu: 2.0,
    iterations: 300,
    maxHops: 5,
  });
  console.log(formatResult(levy, request.amountUsd));

  // Comparison
  if (naive.bestRoute && levy.bestRoute) {
    const saving = naive.bestRoute.totalCostUsd - levy.bestRoute.totalCostUsd;
    const savingPct = (saving / naive.bestRoute.totalCostUsd * 100);
    if (saving > 0) {
      console.log(`\n  💰 LEVY FLIGHT SAVES $${saving.toFixed(2)} (${savingPct.toFixed(1)}%) vs naive direct bridge`);
    }
  }
  if (dijkstra.bestRoute && levy.bestRoute) {
    const diff = levy.bestRoute.totalCostUsd - dijkstra.bestRoute.totalCostUsd;
    const diffPct = Math.abs(diff / dijkstra.bestRoute.totalCostUsd * 100);
    if (Math.abs(diff) < 0.01) {
      console.log(`  ✅ Levy Flight matched Dijkstra optimal (within $0.01)`);
    } else if (diff > 0) {
      console.log(`  📊 Levy Flight within ${diffPct.toFixed(1)}% of Dijkstra optimal ($${diff.toFixed(2)} more)`);
    } else {
      console.log(`  🎯 Levy Flight found a route $${Math.abs(diff).toFixed(2)} CHEAPER than Dijkstra`);
    }
  }
  console.log('');
}

// Test scenarios
const scenarios: RouteRequest[] = [
  // Easy: direct bridges exist
  { fromChain: 'ethereum', toChain: 'arbitrum', amountUsd: 10000 },

  // Medium: multi-hop might be cheaper
  { fromChain: 'ethereum', toChain: 'solana', amountUsd: 50000 },

  // Hard: no obvious direct path
  { fromChain: 'solana', toChain: 'scroll', amountUsd: 5000 },

  // Large amount: fee % matters more
  { fromChain: 'ethereum', toChain: 'solana', amountUsd: 500000 },

  // Small amount: flat fees matter more
  { fromChain: 'ethereum', toChain: 'solana', amountUsd: 100 },

  // Obscure route
  { fromChain: 'fantom', toChain: 'sui', amountUsd: 20000 },

  // L2 to L2
  { fromChain: 'optimism', toChain: 'zksync', amountUsd: 15000 },

  // Cross-ecosystem
  { fromChain: 'bsc', toChain: 'aptos', amountUsd: 30000 },
];

console.log('\n🦖 REVY — Levy Flight Cross-Chain Routing Engine\n');
console.log(`Chains: ${createDefaultGraph().getAllChains().length}`);
console.log(`Bridges: ${createDefaultGraph().getAllBridges().length}`);
console.log('');

for (const scenario of scenarios) {
  runComparison(scenario);
}
