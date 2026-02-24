/**
 * Risk scoring for multi-hop routes.
 * More hops = higher risk premium. Routes are penalized proportionally.
 */

import { Route } from './types.js';
import { RISK_DEFAULTS } from './config.js';

export interface RiskAssessment {
  multiplier: number;
  adjustedCostUsd: number;
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  hopCount: number;
  warnings: string[];
}

export function calculateRiskMultiplier(hopCount: number): number {
  if (hopCount <= 1) return RISK_DEFAULTS.baseMultiplier;

  const penalty = RISK_DEFAULTS.hopPenalty;
  const acceleration = RISK_DEFAULTS.hopPenaltyAcceleration;
  const extraHops = hopCount - 1;

  return RISK_DEFAULTS.baseMultiplier +
    extraHops * penalty * (1 + extraHops * acceleration);
}

export function getRiskLevel(multiplier: number): 'low' | 'medium' | 'high' | 'extreme' {
  if (multiplier <= 1.05) return 'low';
  if (multiplier <= 1.15) return 'medium';
  if (multiplier <= 1.30) return 'high';
  return 'extreme';
}

export function assessRouteRisk(
  route: Route,
  baseCostUsd: number
): RiskAssessment {
  const multiplier = calculateRiskMultiplier(route.hopCount);
  const adjustedCostUsd = baseCostUsd * multiplier;
  const riskLevel = getRiskLevel(multiplier);
  const warnings: string[] = [];

  if (route.hopCount >= 4) {
    warnings.push(`High hop count (${route.hopCount}): increased execution risk`);
  }

  if (multiplier > RISK_DEFAULTS.maxAcceptableMultiplier) {
    warnings.push('Risk multiplier exceeds safety threshold');
  }

  const chains = route.hops.map(h => h.fromChain);
  chains.push(route.hops[route.hops.length - 1]?.toChain ?? '');
  const uniqueChains = new Set(chains.filter(Boolean));
  if (uniqueChains.size < chains.filter(Boolean).length) {
    warnings.push('Route contains duplicate chain visits');
  }

  const hasSlowChain = chains.some(c =>
    ['ethereum', 'zksync', 'scroll'].includes(c.toLowerCase())
  );
  if (hasSlowChain && route.hopCount > 2) {
    warnings.push('Route includes slow-finality chain with multiple hops');
  }

  return {
    multiplier,
    adjustedCostUsd,
    riskLevel,
    hopCount: route.hopCount,
    warnings,
  };
}

export function rankRoutesByRiskAdjustedCost(
  routes: Array<{ route: Route; costUsd: number }>
): Array<{ route: Route; costUsd: number; riskAdjustedCostUsd: number; risk: RiskAssessment }> {
  const assessed = routes.map(({ route, costUsd }) => {
    const risk = assessRouteRisk(route, costUsd);
    return {
      route,
      costUsd,
      riskAdjustedCostUsd: risk.adjustedCostUsd,
      risk,
    };
  });

  return assessed.sort((a, b) => a.riskAdjustedCostUsd - b.riskAdjustedCostUsd);
}
// rev: 1
