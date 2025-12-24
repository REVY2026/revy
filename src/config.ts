/**
 * Revy Engine Configuration
 * Central configuration for routing parameters, chain defaults, and algorithm tuning.
 */

export const ENGINE_VERSION = '0.4.2';

export const LEVY_DEFAULTS = {
  mu: 2.0,
  iterations: 300,
  maxHops: 5,
  localThreshold: 2.5,
  minStep: 1,
} as const;

export const COST_DEFAULTS = {
  defaultGasUsd: 0.50,
  defaultFeeBps: 30,
  defaultFlatFeeUsd: 0,
  slippageBps: 50,
  protocolFeeBps: 2,
} as const;

export const RISK_DEFAULTS = {
  baseMultiplier: 1.0,
  hopPenalty: 0.08,
  hopPenaltyAcceleration: 0.02,
  maxAcceptableMultiplier: 2.0,
} as const;

export const SEARCH_LIMITS = {
  maxCandidates: 50,
  maxPathsPerIteration: 10,
  deduplicationWindow: 3,
  timeoutMs: 5000,
} as const;

export const CHAIN_GAS_OVERRIDES: Record<string, number> = {
  ethereum: 3.50,