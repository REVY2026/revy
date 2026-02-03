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