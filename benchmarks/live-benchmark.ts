import { createConfig, getRoutes } from '@lifi/sdk';
import type { RoutesRequest } from '@lifi/sdk';

createConfig({ integrator: 'revy-benchmark' });

interface BenchResult {
  route: string;
  amount: string;
  directCost: string | null;
  directBridge: string | null;
  levyCost: string | null;
  levyPath: string | null;
  levyHops: number;
  savings: string;
}

const NATIVE = '0x0000000000000000000000000000000000000000';

// Test scenarios
const SCENARIOS = [
  { from: 1, to: 42161, name: 'ETH → ARB', amount: '10000000000000000', amountLabel: '0.01 ETH' },
  { from: 1, to: 10, name: 'ETH → OP', amount: '10000000000000000', amountLabel: '0.01 ETH' },
  { from: 1, to: 8453, name: 'ETH → BASE', amount: '10000000000000000', amountLabel: '0.01 ETH' },
  { from: 42161, to: 10, name: 'ARB → OP', amount: '10000000000000000', amountLabel: '0.01 ETH' },
  { from: 42161, to: 8453, name: 'ARB → BASE', amount: '10000000000000000', amountLabel: '0.01 ETH' },
  { from: 1, to: 56, name: 'ETH → BSC', amount: '10000000000000000', amountLabel: '0.01 ETH' },
  { from: 1, to: 137, name: 'ETH → MATIC', amount: '10000000000000000', amountLabel: '0.01 ETH' },
  { from: 56, to: 43114, name: 'BSC → AVAX', amount: '10000000000000000', amountLabel: '0.01 BNB' },
];

const INTERMEDIATES = [1, 42161, 10, 8453, 137, 56, 43114];

async function getQuote(from: number, to: number, amount: string): Promise<{ cost: number; bridge: string; hops: number; path: string } | null> {
  try {
    const req: RoutesRequest = {
      fromChainId: from,
      toChainId: to,
      fromTokenAddress: NATIVE,
      toTokenAddress: NATIVE,
      fromAmount: amount,
      options: { slippage: 0.005, order: 'CHEAPEST' },
    };

    const result = await getRoutes(req);
    if (!result.routes || result.routes.length === 0) return null;

    const best = result.routes[0];
    let cost = 0;
    const bridges: string[] = [];

    for (const step of best.steps) {
      const gas = step.estimate?.gasCosts?.reduce((s, c) => s + parseFloat(c.amountUSD || '0'), 0) || 0;
      const fee = step.estimate?.feeCosts?.reduce((s, c) => s + parseFloat(c.amountUSD || '0'), 0) || 0;
      cost += gas + fee;
      bridges.push(step.toolDetails?.name || step.tool);
    }

    const path = best.steps.map(s => `${s.action.fromChainId}→${s.action.toChainId}`).join(' ');

    return { cost, bridge: bridges.join(' + '), hops: best.steps.length, path };
  } catch {
    return null;
  }
}

async function runBenchmark() {
  console.log('\n🦖 REVY Live Benchmark — Real Li.Fi API Data\n');
  console.log('═'.repeat(80));

  const results: BenchResult[] = [];

  for (const scenario of SCENARIOS) {
    console.log(`\n  Testing: ${scenario.name} (${scenario.amountLabel})`);

    // 1. Direct quote
    console.log('    → Querying direct route...');
    const direct = await getQuote(scenario.from, scenario.to, scenario.amount);

    // 2. Multi-hop via intermediates (Levy Flight style)
    console.log('    → Scanning multi-hop paths...');
    let bestMultiHop: { cost: number; bridge: string; hops: number; path: string } | null = null;

    const intermediates = INTERMEDIATES.filter(c => c !== scenario.from && c !== scenario.to);

    for (const mid of intermediates.slice(0, 3)) { // limit to avoid rate limits
      try {
        const hop1 = await getQuote(scenario.from, mid, scenario.amount);
        if (!hop1) continue;

        // For hop2, we'd need the output amount from hop1, but approximate with same amount
        const hop2 = await getQuote(mid, scenario.to, scenario.amount);
        if (!hop2) continue;

        const totalCost = hop1.cost + hop2.cost;
        if (!bestMultiHop || totalCost < bestMultiHop.cost) {
          bestMultiHop = {
            cost: totalCost,
            bridge: `${hop1.bridge} → ${hop2.bridge}`,
            hops: 2,
            path: `${scenario.from}→${mid}→${scenario.to}`,
          };
        }
      } catch {
        continue;
      }

      // Rate limit protection
      await new Promise(r => setTimeout(r, 500));
    }

    // Compare
    const directCost = direct ? direct.cost : null;
    const levyCost = bestMultiHop && direct && bestMultiHop.cost < direct.cost
      ? bestMultiHop.cost
      : direct ? direct.cost : bestMultiHop ? bestMultiHop.cost : null;

    const levyResult = bestMultiHop && direct && bestMultiHop.cost < direct.cost
      ? bestMultiHop
      : direct || bestMultiHop;

    let savings = '—';
    if (direct && bestMultiHop) {
      const diff = ((direct.cost - bestMultiHop.cost) / direct.cost * 100);
      if (diff > 0) savings = `${diff.toFixed(1)}% cheaper via multi-hop`;
      else savings = `Direct is ${Math.abs(diff).toFixed(1)}% cheaper`;
    } else if (!direct && bestMultiHop) {
      savings = 'Only multi-hop route found';
    }

    const result: BenchResult = {
      route: scenario.name,
      amount: scenario.amountLabel,
      directCost: direct ? `$${direct.cost.toFixed(4)} (${direct.bridge})` : 'No route',
      directBridge: direct ? direct.bridge : null,
      levyCost: levyResult ? `$${levyResult.cost.toFixed(4)} (${levyResult.hops} hops)` : 'No route',
      levyPath: levyResult ? levyResult.path : null,
      levyHops: levyResult ? levyResult.hops : 0,
      savings,
    };

    results.push(result);

    console.log(`    Direct: ${result.directCost}`);
    console.log(`    Levy:   ${result.levyCost}`);
    console.log(`    Result: ${savings}`);

    // Rate limit
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('\n' + '═'.repeat(80));
  console.log('\n  SUMMARY\n');
  console.log('  Route            | Direct          | Multi-hop       | Result');
  console.log('  ' + '─'.repeat(76));
  for (const r of results) {
    const direct = r.directCost?.padEnd(16) || 'No route'.padEnd(16);
    const levy = r.levyCost?.padEnd(16) || 'No route'.padEnd(16);
    console.log(`  ${r.route.padEnd(18)}| ${direct}| ${levy}| ${r.savings}`);
  }
  console.log('');
}

runBenchmark().catch(console.error);
