/**
 * Utility functions for the Revy routing engine.
 */

export function levyStepLength(mu: number, minStep: number = 1): number {
  const u = Math.random();
  if (u === 0) return minStep;
  return minStep * Math.pow(u, -1 / (mu - 1));
}

export function powerLawSample(alpha: number, xMin: number = 1): number {
  const u = Math.random();
  return xMin * Math.pow(1 - u, -1 / (alpha - 1));
}

export function weightedRandomSelect<T>(
  items: T[],
  weights: number[]
): T {
  if (items.length === 0) throw new Error('Cannot select from empty array');
  if (items.length !== weights.length) throw new Error('Items and weights must have same length');

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  if (totalWeight <= 0) return items[Math.floor(Math.random() * items.length)];

  let random = Math.random() * totalWeight;
  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) return items[i];
  }
  return items[items.length - 1];
}

export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function uniqueBy<T, K>(array: T[], keyFn: (item: T) => K): T[] {
  const seen = new Set<K>();
  return array.filter(item => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function formatUsd(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function formatPercent(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`;
}

export function hashPath(path: string[]): string {
  return path.join('→');
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));