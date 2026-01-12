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