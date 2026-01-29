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
    });
  });

  describe('bfsDistance', () => {
    it('should return 0 for same chain', () => {
      expect(graph.bfsDistance('ethereum', 'ethereum')).toBe(0);
    });

    it('should return 1 for directly connected chains', () => {
      expect(graph.bfsDistance('ethereum', 'arbitrum')).toBe(1);
    });

    it('should return > 1 for indirectly connected chains', () => {
      const dist = graph.bfsDistance('fantom', 'sui');
      expect(dist).toBeGreaterThan(1);
    });

    it('should return -1 for unreachable chains', () => {
      const dist = graph.bfsDistance('ethereum', 'nonexistent');
      expect(dist).toBe(-1);
    });
  });

  describe('getNeighbors', () => {
    it('should return neighbors for ethereum', () => {
      const neighbors = graph.getNeighbors('ethereum');
      expect(neighbors.length).toBeGreaterThan(0);
    });

    it('should return empty for unknown chain', () => {
      const neighbors = graph.getNeighbors('nonexistent');
      expect(neighbors.length).toBe(0);
    });
  });

  describe('cheapestDirectBridge', () => {
    it('should find direct bridge between ETH and ARB', () => {
      const bridge = graph.cheapestDirectBridge('ethereum', 'arbitrum');
      expect(bridge).not.toBeNull();
    });

    it('should return null for unconnected chains', () => {
      const bridge = graph.cheapestDirectBridge('fantom', 'sui');
      expect(bridge).toBeNull();
    });
  });
});
