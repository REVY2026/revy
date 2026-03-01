/**
 * Route optimization — deduplication, filtering, and ranking.
 */

import { Route, RouteRequest } from './types.js';
import { estimateRouteCost, CostBreakdown } from './cost-model.js';
import { assessRouteRisk, RiskAssessment } from './risk-scorer.js';
import { hashPath, uniqueBy } from './utils.js';
import { SEARCH_LIMITS } from './config.js';

export interface OptimizedRoute {
  route: Route;
  cost: CostBreakdown;
  risk: RiskAssessment;
  score: number;
  pathHash: string;
}

export function deduplicateRoutes(routes: Route[]): Route[] {
  return uniqueBy(routes, route => {
    const chains = route.hops.map(h => h.fromChain);
    if (route.hops.length > 0) {
      chains.push(route.hops[route.hops.length - 1].toChain);
    }
    return hashPath(chains);
  });
}

export function filterValidRoutes(
  routes: Route[],
  request: RouteRequest
): Route[] {
  return routes.filter(route => {
    if (route.hops.length === 0) return false;

    const firstHop = route.hops[0];
    const lastHop = route.hops[route.hops.length - 1];

    if (firstHop.fromChain.toLowerCase() !== request.fromChain.toLowerCase()) return false;
    if (lastHop.toChain.toLowerCase() !== request.toChain.toLowerCase()) return false;

    const chains = route.hops.map(h => h.fromChain.toLowerCase());
    chains.push(lastHop.toChain.toLowerCase());
    const uniqueChains = new Set(chains);
    if (uniqueChains.size !== chains.length) return false;

    return true;
  });
}

export function scoreRoute(
  route: Route,
  amountUsd: number
): OptimizedRoute {
  const cost = estimateRouteCost(route, amountUsd);
  const risk = assessRouteRisk(route, cost.totalUsd);

  const chains = route.hops.map(h => h.fromChain);
  if (route.hops.length > 0) {
    chains.push(route.hops[route.hops.length - 1].toChain);
  }
  const pathHash = hashPath(chains);

  const score = risk.adjustedCostUsd;

  return { route, cost, risk, score, pathHash };
}

export function optimizeRoutes(
  routes: Route[],
  request: RouteRequest
): OptimizedRoute[] {
  const valid = filterValidRoutes(routes, request);
  const unique = deduplicateRoutes(valid);

  const scored = unique.map(route => scoreRoute(route, request.amountUsd));

  scored.sort((a, b) => a.score - b.score);

  return scored.slice(0, SEARCH_LIMITS.maxCandidates);
}

export function getBestRoute(
  routes: Route[],
  request: RouteRequest
): OptimizedRoute | null {
  const optimized = optimizeRoutes(routes, request);
  return optimized.length > 0 ? optimized[0] : null;
}

export function calculateSavings(
  directCostUsd: number | null,
  bestCostUsd: number
): { absoluteUsd: number; percentSaved: number } {
  if (directCostUsd === null || directCostUsd <= 0) {
    return { absoluteUsd: 0, percentSaved: 0 };
  }

  const absoluteUsd = directCostUsd - bestCostUsd;
  const percentSaved = (absoluteUsd / directCostUsd) * 100;

  return {
    absoluteUsd: Math.max(0, absoluteUsd),
    percentSaved: Math.max(0, percentSaved),
  };
}
// rev: 1
