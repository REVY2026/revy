import { createConfig, getRoutes } from '@lifi/sdk';
import type { RoutesRequest } from '@lifi/sdk';

createConfig({ integrator: 'revy-benchmark' });

const USDC: Record<number, string> = {
  1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  42161: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  10: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
  8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  137: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
  56: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
  43114: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
};

// Large amounts where fee % matters more than flat gas
const SCENARIOS = [
  { from: 1, to: 42161, name: 'ETH → ARB', amountUsd: 10000 },
  { from: 1, to: 10, name: 'ETH → OP', amountUsd: 10000 },
  { from: 1, to: 56, name: 'ETH → BSC', amountUsd: 50000 },
  { from: 1, to: 137, name: 'ETH → MATIC', amountUsd: 50000 },
  { from: 42161, to: 8453, name: 'ARB → BASE', amountUsd: 25000 },
  { from: 56, to: 43114, name: 'BSC → AVAX', amountUsd: 20000 },
];

const INTERMEDIATES = [1, 42161, 10, 8453, 137, 56, 43114];

async function getQuote(from: number, to: number, amount: string, fromToken: string, toToken: string) {
  try {
    const result = await getRoutes({
      fromChainId: from,
      toChainId: to,
      fromTokenAddress: fromToken,
      toTokenAddress: toToken,
      fromAmount: amount,
      options: { slippage: 0.005, order: 'CHEAPEST' },
    });
    if (!result.routes || result.routes.length === 0) return null;

    const best = result.routes[0];
    let cost = 0;
    const tools: string[] = [];
    for (const step of best.steps) {
      cost += (step.estimate?.gasCosts?.reduce((s, c) => s + parseFloat(c.amountUSD || '0'), 0) || 0);
      cost += (step.estimate?.feeCosts?.reduce((s, c) => s + parseFloat(c.amountUSD || '0'), 0) || 0);
      tools.push(step.toolDetails?.name || step.tool);
    }
    return { cost, tools: tools.join('+'), hops: best.steps.length, toAmount: best.toAmountUSD };
  } catch { return null; }
}

async function run() {
  console.log('\n🦖 REVY Large Amount Benchmark — USDC Transfers\n');
  console.log('═'.repeat(80));

  for (const s of SCENARIOS) {
    const fromToken = USDC[s.from];
    const toToken = USDC[s.to];
    if (!fromToken || !toToken) continue;

    const amount = (s.amountUsd * 1e6).toString(); // USDC has 6 decimals
    console.log(`\n  ${s.name} — $${s.amountUsd.toLocaleString()} USDC`);

    // Direct
    const direct = await getQuote(s.from, s.to, amount, fromToken, toToken);
    console.log(`    Direct: ${direct ? `$${direct.cost.toFixed(2)} via ${direct.tools}` : 'No route'}`);

    // Multi-hop via 1 intermediate
    let bestMH: { cost: number; path: string; tools: string } | null = null;
    const mids = INTERMEDIATES.filter(c => c !== s.from && c !== s.to);

    for (const mid of mids.slice(0, 3)) {
      const midToken = USDC[mid];
      if (!midToken) continue;

      const h1 = await getQuote(s.from, mid, amount, fromToken, midToken);
      if (!h1) { await new Promise(r => setTimeout(r, 500)); continue; }

      const h2 = await getQuote(mid, s.to, amount, midToken, toToken);
      if (!h2) { await new Promise(r => setTimeout(r, 500)); continue; }

      const total = h1.cost + h2.cost;
      if (!bestMH || total < bestMH.cost) {
        bestMH = { cost: total, path: `${s.from}→${mid}→${s.to}`, tools: `${h1.tools} → ${h2.tools}` };
      }
      await new Promise(r => setTimeout(r, 500));
    }

    console.log(`    Multi:  ${bestMH ? `$${bestMH.cost.toFixed(2)} via ${bestMH.tools}` : 'No route'}`);

    if (direct && bestMH) {
      const diff = direct.cost - bestMH.cost;
      const pct = (diff / direct.cost * 100);
      if (diff > 0) {
        console.log(`    ✅ Multi-hop saves $${diff.toFixed(2)} (${pct.toFixed(1)}%)`);
      } else {
        console.log(`    Direct is $${Math.abs(diff).toFixed(2)} cheaper`);
      }
    }

    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('\n' + '═'.repeat(80) + '\n');
}

run().catch(console.error);
