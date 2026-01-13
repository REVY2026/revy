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
