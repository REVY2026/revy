import { describe, it, expect } from 'vitest';
import { estimateHopCost, estimateRouteCost, costSavingsPercent, estimateExecutionTime } from '../src/cost-model.js';
import { Route, RouteHop } from '../src/types.js';

describe('CostModel', () => {
  const mockHop: RouteHop = {
    fromChain: 'ethereum',
    toChain: 'arbitrum',
    bridge: 'stargate',
    feePercent: 0.06,
    flatFeeUsd: 0,
    gasUsd: 3.60,
  };

  describe('estimateHopCost', () => {
    it('should calculate gas cost from both chains', () => {
      const cost = estimateHopCost(mockHop, 10000);
      expect(cost.gasUsd).toBeGreaterThan(0);
    });

    it('should calculate bridge fee based on amount', () => {
      const cost = estimateHopCost(mockHop, 10000);
      expect(cost.bridgeFeeUsd).toBeGreaterThan(0);
    });

    it('should include slippage', () => {
      const cost = estimateHopCost(mockHop, 10000);
      expect(cost.slippageUsd).toBeGreaterThan(0);
    });

    it('should include protocol fee', () => {
      const cost = estimateHopCost(mockHop, 10000);
      expect(cost.protocolFeeUsd).toBeGreaterThan(0);
    });

    it('total should equal sum of components', () => {
      const cost = estimateHopCost(mockHop, 10000);
      const sum = cost.gasUsd + cost.bridgeFeeUsd + cost.slippageUsd + cost.protocolFeeUsd;
      expect(cost.totalUsd).toBeCloseTo(sum, 2);
    });
  });

  describe('estimateRouteCost', () => {
    it('should accumulate costs across hops', () => {
      const route: Route = {
        hops: [mockHop, { ...mockHop, fromChain: 'arbitrum', toChain: 'optimism' }],
        totalFeePercent: 0.12,
        totalFlatFeeUsd: 0,
        totalGasUsd: 7.20,
        totalCostUsd: 0,
        hopCount: 2,
      };
      const cost = estimateRouteCost(route, 10000);
      expect(cost.totalUsd).toBeGreaterThan(0);
    });
  });

  describe('costSavingsPercent', () => {
    it('should calculate savings correctly', () => {
      expect(costSavingsPercent(100, 90)).toBeCloseTo(10, 1);
    });

    it('should return 0 for zero direct cost', () => {
      expect(costSavingsPercent(0, 50)).toBe(0);
    });
  });

  describe('estimateExecutionTime', () => {
    it('should return positive seconds', () => {
      const route: Route = {
        hops: [mockHop],
        totalFeePercent: 0.06,
        totalFlatFeeUsd: 0,
        totalGasUsd: 3.60,
        totalCostUsd: 0,
        hopCount: 1,
      };
      const time = estimateExecutionTime(route);
      expect(time).toBeGreaterThan(0);
    });
  });
});
// rev: 1
