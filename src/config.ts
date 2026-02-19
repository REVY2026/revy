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
  arbitrum: 0.10,
  optimism: 0.10,
  base: 0.08,
  polygon: 0.02,
  bsc: 0.15,
  avalanche: 0.25,
  solana: 0.01,
  sui: 0.01,
  aptos: 0.01,
  scroll: 0.15,
  zksync: 0.12,
  linea: 0.12,
  manta: 0.10,
  celo: 0.01,
  gnosis: 0.01,
  near: 0.01,
  mantle: 0.10,
  blast: 0.10,
  fantom: 0.05,
};

export function getGasForChain(chain: string): number {
  return CHAIN_GAS_OVERRIDES[chain.toLowerCase()] ?? COST_DEFAULTS.defaultGasUsd;
}

export function getEffectiveFeeBps(bridgeName: string): number {
  const overrides: Record<string, number> = {
    wormhole: 25,
    stargate: 6,
    across: 10,
    hyperlane: 15,
    cbridge: 20,
    debridge: 12,
    mayan: 35,
    orbiter: 15,
  };
  return overrides[bridgeName.toLowerCase()] ?? COST_DEFAULTS.defaultFeeBps;
}
// rev: 4
