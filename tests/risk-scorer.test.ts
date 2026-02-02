import { describe, it, expect } from 'vitest';
import { calculateRiskMultiplier, getRiskLevel, assessRouteRisk } from '../src/risk-scorer.js';
import { Route } from '../src/types.js';

describe('RiskScorer', () => {
  describe('calculateRiskMultiplier', () => {
    it('should return 1.0 for single hop', () => {
      expect(calculateRiskMultiplier(1)).toBe(1.0);
    });

    it('should increase with more hops', () => {
      const twoHop = calculateRiskMultiplier(2);
      const threeHop = calculateRiskMultiplier(3);
      expect(twoHop).toBeGreaterThan(1.0);
      expect(threeHop).toBeGreaterThan(twoHop);
    });

    it('should accelerate non-linearly', () => {
      const diff12 = calculateRiskMultiplier(2) - calculateRiskMultiplier(1);
      const diff23 = calculateRiskMultiplier(3) - calculateRiskMultiplier(2);
      expect(diff23).toBeGreaterThan(diff12);
    });
  });

  describe('getRiskLevel', () => {
    it('should return low for multiplier near 1', () => {
      expect(getRiskLevel(1.02)).toBe('low');
    });

    it('should return medium for moderate multiplier', () => {
      expect(getRiskLevel(1.10)).toBe('medium');
    });

    it('should return high for elevated multiplier', () => {
      expect(getRiskLevel(1.20)).toBe('high');
    });

    it('should return extreme for very high multiplier', () => {
      expect(getRiskLevel(1.50)).toBe('extreme');
    });
  });

  describe('assessRouteRisk', () => {
    it('should add warnings for high hop count', () => {
      const route: Route = {
        hops: [
          { fromChain: 'ethereum', toChain: 'arbitrum', bridge: 'stargate', feePercent: 0.06, flatFeeUsd: 0, gasUsd: 3.6 },
          { fromChain: 'arbitrum', toChain: 'optimism', bridge: 'stargate', feePercent: 0.06, flatFeeUsd: 0, gasUsd: 0.2 },
          { fromChain: 'optimism', toChain: 'base', bridge: 'across', feePercent: 0.1, flatFeeUsd: 0, gasUsd: 0.2 },
          { fromChain: 'base', toChain: 'solana', bridge: 'wormhole', feePercent: 0.25, flatFeeUsd: 0, gasUsd: 0.1 },
        ],
        totalFeePercent: 0.47,
        totalFlatFeeUsd: 0,
        totalGasUsd: 4.1,
        totalCostUsd: 0,
        hopCount: 4,
      };

      const risk = assessRouteRisk(route, 100);
      expect(risk.warnings.length).toBeGreaterThan(0);
      expect(risk.hopCount).toBe(4);
    });
  });
});
