import { describe, it, expect } from 'vitest';
import { levyStepLength, weightedRandomSelect, clamp, formatUsd, formatPercent, hashPath, uniqueBy, median, percentile, standardDeviation, shuffleArray } from '../src/utils.js';

describe('Utils', () => {
  describe('levyStepLength', () => {
    it('should return positive values', () => {
      for (let i = 0; i < 100; i++) {
        expect(levyStepLength(2.0)).toBeGreaterThan(0);
      }
    });

    it('should respect minimum step', () => {
      for (let i = 0; i < 100; i++) {
        expect(levyStepLength(2.0, 5)).toBeGreaterThanOrEqual(5);
      }
    });
  });

  describe('weightedRandomSelect', () => {
    it('should throw on empty array', () => {
      expect(() => weightedRandomSelect([], [])).toThrow();
    });

    it('should return item from array', () => {
      const items = ['a', 'b', 'c'];
      const weights = [1, 1, 1];
      const result = weightedRandomSelect(items, weights);
      expect(items).toContain(result);
    });

    it('should favor higher weights', () => {
      const items = ['a', 'b'];
      const weights = [0, 100];
      const counts = { a: 0, b: 0 };
      for (let i = 0; i < 1000; i++) {
        const r = weightedRandomSelect(items, weights) as 'a' | 'b';
        counts[r]++;
      }
      expect(counts.b).toBeGreaterThan(counts.a);
    });
  });

  describe('clamp', () => {
    it('should clamp below min', () => {
      expect(clamp(-5, 0, 10)).toBe(0);
    });

    it('should clamp above max', () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it('should not clamp within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });
  });

  describe('formatUsd', () => {
    it('should format with dollar sign', () => {
      expect(formatUsd(3.5)).toBe('$3.50');
    });
  });

  describe('formatPercent', () => {
    it('should convert bps to percent', () => {
      expect(formatPercent(250)).toBe('2.50%');
    });
  });

  describe('hashPath', () => {
    it('should join with arrow', () => {
      expect(hashPath(['eth', 'arb', 'sol'])).toBe('eth→arb→sol');
    });
  });

  describe('uniqueBy', () => {
    it('should remove duplicates by key', () => {
      const items = [{ id: 1, name: 'a' }, { id: 2, name: 'b' }, { id: 1, name: 'c' }];
      const result = uniqueBy(items, i => i.id);
      expect(result.length).toBe(2);
    });
  });

  describe('statistics', () => {
    it('median of odd array', () => {
      expect(median([3, 1, 2])).toBe(2);
    });

    it('median of even array', () => {
      expect(median([4, 1, 3, 2])).toBe(2.5);
    });

    it('percentile 50 should equal median', () => {
      const values = [1, 2, 3, 4, 5];
      expect(percentile(values, 50)).toBe(3);
    });

    it('standard deviation of identical values is 0', () => {
      expect(standardDeviation([5, 5, 5, 5])).toBe(0);
    });
  });

  describe('shuffleArray', () => {
    it('should preserve all elements', () => {
      const arr = [1, 2, 3, 4, 5];
      const shuffled = shuffleArray(arr);
      expect(shuffled.sort()).toEqual(arr.sort());
    });

    it('should not mutate original', () => {
      const arr = [1, 2, 3];
      shuffleArray(arr);
      expect(arr).toEqual([1, 2, 3]);
    });
  });
});
