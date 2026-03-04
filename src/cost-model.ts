/**
 * Cost simulation for cross-chain routes.
 * Calculates total cost including gas, bridge fees, slippage, and protocol fees.
 */

import { RouteHop, Route } from './types.js';
import { COST_DEFAULTS, getGasForChain, getEffectiveFeeBps } from './config.js';

export interface CostBreakdown {
  gasUsd: number;
  bridgeFeeUsd: number;
  slippageUsd: number;
  protocolFeeUsd: number;
  totalUsd: number;
}

export function estimateHopCost(
  hop: RouteHop,
  amountUsd: number
): CostBreakdown {
  const gasUsd = getGasForChain(hop.fromChain) + getGasForChain(hop.toChain);

  const feeBps = hop.bridge
    ? getEffectiveFeeBps(hop.bridge)
    : COST_DEFAULTS.defaultFeeBps;
  const bridgeFeeUsd = (amountUsd * feeBps) / 10000;

  const slippageUsd = (amountUsd * COST_DEFAULTS.slippageBps) / 10000;
  const protocolFeeUsd = (amountUsd * COST_DEFAULTS.protocolFeeBps) / 10000;

  return {
    gasUsd,
    bridgeFeeUsd,
    slippageUsd,
    protocolFeeUsd,
    totalUsd: gasUsd + bridgeFeeUsd + slippageUsd + protocolFeeUsd,
  };
}

export function estimateRouteCost(
  route: Route,
  initialAmountUsd: number
): CostBreakdown {
  let totalGas = 0;
  let totalBridgeFee = 0;
  let totalSlippage = 0;
  let totalProtocolFee = 0;
  let remainingAmount = initialAmountUsd;

  for (const hop of route.hops) {
    const hopCost = estimateHopCost(hop, remainingAmount);
    totalGas += hopCost.gasUsd;
    totalBridgeFee += hopCost.bridgeFeeUsd;
    totalSlippage += hopCost.slippageUsd;
    totalProtocolFee += hopCost.protocolFeeUsd;
    remainingAmount -= hopCost.totalUsd;
  }

  return {
    gasUsd: totalGas,
    bridgeFeeUsd: totalBridgeFee,
    slippageUsd: totalSlippage,
    protocolFeeUsd: totalProtocolFee,
    totalUsd: totalGas + totalBridgeFee + totalSlippage + totalProtocolFee,
  };
}

export function compareRouteCosts(
  routes: Route[],
  amountUsd: number
): Array<{ route: Route; cost: CostBreakdown; rank: number }> {
  const withCosts = routes.map(route => ({
    route,
    cost: estimateRouteCost(route, amountUsd),
    rank: 0,
  }));

  withCosts.sort((a, b) => a.cost.totalUsd - b.cost.totalUsd);
  withCosts.forEach((item, index) => {
    item.rank = index + 1;
  });

  return withCosts;
}

export function costSavingsPercent(
  directCostUsd: number,
  optimizedCostUsd: number
): number {
  if (directCostUsd <= 0) return 0;
  return ((directCostUsd - optimizedCostUsd) / directCostUsd) * 100;
}

export function estimateExecutionTime(route: Route): number {
  const timePerHop: Record<string, number> = {
    ethereum: 180,
    arbitrum: 5,
    optimism: 5,
    base: 5,
    polygon: 10,
    bsc: 15,
    avalanche: 10,
    solana: 2,
    sui: 2,
    aptos: 3,
    scroll: 15,
    zksync: 20,
    linea: 15,
    fantom: 5,
  };

  let totalSeconds = 0;
  for (const hop of route.hops) {
    const fromTime = timePerHop[hop.fromChain.toLowerCase()] ?? 30;
    const toTime = timePerHop[hop.toChain.toLowerCase()] ?? 30;
    totalSeconds += Math.max(fromTime, toTime) + 60;
  }
  return totalSeconds;
}
// rev: 2
