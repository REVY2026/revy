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