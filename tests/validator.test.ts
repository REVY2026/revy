import { describe, it, expect } from 'vitest';
import { validateRouteRequest, validateLevyParams, sanitizeChainName } from '../src/validator.js';
import { ChainGraph } from '../src/graph.js';

describe('Validator', () => {
  const graph = new ChainGraph();

  describe('validateRouteRequest', () => {
    it('should pass valid request', () => {
      const result = validateRouteRequest({
        fromChain: 'ethereum',
        toChain: 'arbitrum',
        amountUsd: 1000,
      }, graph);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject same chain', () => {
      const result = validateRouteRequest({
        fromChain: 'ethereum',
        toChain: 'ethereum',
        amountUsd: 1000,
      }, graph);
      expect(result.valid).toBe(false);
    });

    it('should reject negative amount', () => {
      const result = validateRouteRequest({
        fromChain: 'ethereum',
        toChain: 'arbitrum',
        amountUsd: -100,
      }, graph);
      expect(result.valid).toBe(false);
    });

    it('should reject amount over 10M', () => {
      const result = validateRouteRequest({
        fromChain: 'ethereum',
        toChain: 'arbitrum',
        amountUsd: 20_000_000,
      }, graph);
      expect(result.valid).toBe(false);
    });

    it('should reject unknown chain', () => {
      const result = validateRouteRequest({
        fromChain: 'mars',
        toChain: 'arbitrum',
        amountUsd: 1000,
      }, graph);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateLevyParams', () => {
    it('should pass valid params', () => {
      const result = validateLevyParams({ mu: 2.0, iterations: 300, maxHops: 5 });
      expect(result.valid).toBe(true);
    });

    it('should reject mu out of range', () => {
      expect(validateLevyParams({ mu: 0.5 }).valid).toBe(false);
      expect(validateLevyParams({ mu: 3.5 }).valid).toBe(false);
    });

    it('should reject excessive iterations', () => {
      expect(validateLevyParams({ iterations: 50000 }).valid).toBe(false);
    });
  });

  describe('sanitizeChainName', () => {
    it('should lowercase and trim', () => {
      expect(sanitizeChainName('  Ethereum  ')).toBe('ethereum');
    });

    it('should remove special characters', () => {
      expect(sanitizeChainName('zk-Sync Era')).toBe('zksyncera');
    });
  });
});
// rev: 1
