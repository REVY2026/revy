import { describe, it, expect } from 'vitest';
import { ChainGraph } from '../src/graph.js';

describe('ChainGraph', () => {
  const graph = new ChainGraph();

  describe('chain data', () => {
    it('should have at least 20 chains', () => {
      const chains = graph.getChains();
      expect(chains.length).toBeGreaterThanOrEqual(20);
    });

    it('should include major EVM chains', () => {
      const names = graph.getChains().map(c => c.name.toLowerCase());
      expect(names).toContain('ethereum');
      expect(names).toContain('arbitrum');
      expect(names).toContain('optimism');
      expect(names).toContain('base');
      expect(names).toContain('polygon');
    });

    it('should include non-EVM chains', () => {
      const names = graph.getChains().map(c => c.name.toLowerCase());
      expect(names).toContain('solana');
      expect(names).toContain('sui');
      expect(names).toContain('aptos');
    });
  });

  describe('bridge data', () => {
    it('should have at least 50 bridge connections', () => {
      const bridges = graph.getBridges();
      expect(bridges.length).toBeGreaterThanOrEqual(50);
    });

    it('should have known bridge protocols', () => {
      const bridges = graph.getBridges();
      const protocols = new Set(bridges.map(b => b.bridge.toLowerCase()));
      expect(protocols.has('stargate')).toBe(true);
      expect(protocols.has('wormhole')).toBe(true);