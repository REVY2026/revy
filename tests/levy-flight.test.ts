import { describe, it, expect } from 'vitest';
import { LevyFlightRouter } from '../src/levy-flight.js';
import { ChainGraph } from '../src/graph.js';

describe('LevyFlightRouter', () => {
  const graph = new ChainGraph();
  const router = new LevyFlightRouter(graph);

  describe('findRoutes', () => {
    it('should find routes for ETH → ARB (easy, direct exists)', () => {
      const routes = router.findRoutes({
        fromChain: 'ethereum',
        toChain: 'arbitrum',
        amountUsd: 10000,
      });
      expect(routes.length).toBeGreaterThan(0);
      expect(routes[0].hops[0].fromChain.toLowerCase()).toBe('ethereum');
    });

    it('should find routes for SOL → Scroll (hard, no direct)', () => {
      const routes = router.findRoutes({
        fromChain: 'solana',
        toChain: 'scroll',
        amountUsd: 5000,
      });
      expect(routes.length).toBeGreaterThan(0);
      expect(routes[0].hopCount).toBeGreaterThan(1);
    });

    it('should find routes for Fantom → Sui (cross-ecosystem)', () => {
      const routes = router.findRoutes({
        fromChain: 'fantom',
        toChain: 'sui',
        amountUsd: 20000,
      });
      expect(routes.length).toBeGreaterThan(0);
    });

    it('should return routes sorted by cost', () => {
      const routes = router.findRoutes({
        fromChain: 'ethereum',
        toChain: 'solana',
        amountUsd: 50000,
      });
      for (let i = 1; i < routes.length; i++) {
        expect(routes[i].totalCostUsd).toBeGreaterThanOrEqual(routes[i - 1].totalCostUsd);
      }
    });

    it('should not return routes with duplicate chains', () => {
      const routes = router.findRoutes({
        fromChain: 'ethereum',
        toChain: 'solana',
        amountUsd: 1000,
      });
      for (const route of routes) {
        const chains = route.hops.map(h => h.fromChain);
        chains.push(route.hops[route.hops.length - 1].toChain);
        const unique = new Set(chains);
        expect(unique.size).toBe(chains.length);
      }
    });

    it('should respect maxHops limit', () => {
      const routes = router.findRoutes({
        fromChain: 'ethereum',
        toChain: 'sui',
        amountUsd: 10000,
      });
      for (const route of routes) {
        expect(route.hopCount).toBeLessThanOrEqual(5);
      }
    });
  });

  describe('performance', () => {
    it('should complete within 2 seconds', () => {
      const start = performance.now();
      router.findRoutes({
        fromChain: 'fantom',
        toChain: 'sui',
        amountUsd: 20000,
      });
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(2000);
    });
  });
});
// rev: 2
