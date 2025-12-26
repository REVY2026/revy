import { Chain, Bridge, DexPool } from './types';

// Real chain data with realistic gas costs
export const CHAINS: Chain[] = [
  { id: 'ethereum', name: 'Ethereum', type: 'evm', avgGasUsd: 8.50 },
  { id: 'arbitrum', name: 'Arbitrum', type: 'evm', avgGasUsd: 0.12 },
  { id: 'optimism', name: 'Optimism', type: 'evm', avgGasUsd: 0.15 },
  { id: 'base', name: 'Base', type: 'evm', avgGasUsd: 0.08 },
  { id: 'polygon', name: 'Polygon', type: 'evm', avgGasUsd: 0.02 },
  { id: 'bsc', name: 'BNB Chain', type: 'evm', avgGasUsd: 0.10 },
  { id: 'avalanche', name: 'Avalanche', type: 'evm', avgGasUsd: 0.25 },
  { id: 'fantom', name: 'Fantom', type: 'evm', avgGasUsd: 0.01 },
  { id: 'solana', name: 'Solana', type: 'solana', avgGasUsd: 0.003 },
  { id: 'sui', name: 'Sui', type: 'move', avgGasUsd: 0.005 },
  { id: 'aptos', name: 'Aptos', type: 'move', avgGasUsd: 0.004 },
  { id: 'scroll', name: 'Scroll', type: 'evm', avgGasUsd: 0.18 },
  { id: 'zksync', name: 'zkSync Era', type: 'evm', avgGasUsd: 0.20 },
  { id: 'linea', name: 'Linea', type: 'evm', avgGasUsd: 0.14 },
  { id: 'manta', name: 'Manta Pacific', type: 'evm', avgGasUsd: 0.06 },
  { id: 'celo', name: 'Celo', type: 'evm', avgGasUsd: 0.01 },
  { id: 'gnosis', name: 'Gnosis', type: 'evm', avgGasUsd: 0.005 },
  { id: 'near', name: 'NEAR', type: 'evm', avgGasUsd: 0.01 },
  { id: 'mantle', name: 'Mantle', type: 'evm', avgGasUsd: 0.05 },
  { id: 'blast', name: 'Blast', type: 'evm', avgGasUsd: 0.07 },
];

// Realistic bridge connections with actual fee structures
export const BRIDGES: Bridge[] = [
  // Wormhole routes
  { id: 'wormhole-eth-sol', name: 'Wormhole', from: 'ethereum', to: 'solana', feePercent: 0.04, flatFeeUsd: 5.0, avgLatencyMs: 15000, maxAmount: 5000000, minAmount: 10, reliability: 0.97 },
  { id: 'wormhole-sol-eth', name: 'Wormhole', from: 'solana', to: 'ethereum', feePercent: 0.04, flatFeeUsd: 5.0, avgLatencyMs: 15000, maxAmount: 5000000, minAmount: 10, reliability: 0.97 },
  { id: 'wormhole-eth-sui', name: 'Wormhole', from: 'ethereum', to: 'sui', feePercent: 0.05, flatFeeUsd: 6.0, avgLatencyMs: 18000, maxAmount: 2000000, minAmount: 10, reliability: 0.95 },
  { id: 'wormhole-eth-aptos', name: 'Wormhole', from: 'ethereum', to: 'aptos', feePercent: 0.05, flatFeeUsd: 6.0, avgLatencyMs: 18000, maxAmount: 2000000, minAmount: 10, reliability: 0.95 },
  { id: 'wormhole-sol-sui', name: 'Wormhole', from: 'solana', to: 'sui', feePercent: 0.03, flatFeeUsd: 2.0, avgLatencyMs: 12000, maxAmount: 3000000, minAmount: 5, reliability: 0.96 },
  { id: 'wormhole-eth-bsc', name: 'Wormhole', from: 'ethereum', to: 'bsc', feePercent: 0.04, flatFeeUsd: 4.0, avgLatencyMs: 14000, maxAmount: 5000000, minAmount: 10, reliability: 0.97 },
  { id: 'wormhole-eth-avax', name: 'Wormhole', from: 'ethereum', to: 'avalanche', feePercent: 0.04, flatFeeUsd: 4.5, avgLatencyMs: 14000, maxAmount: 3000000, minAmount: 10, reliability: 0.96 },

  // LayerZero / Stargate routes
  { id: 'stargate-eth-arb', name: 'Stargate', from: 'ethereum', to: 'arbitrum', feePercent: 0.06, flatFeeUsd: 3.0, avgLatencyMs: 900000, maxAmount: 10000000, minAmount: 1, reliability: 0.99 },
  { id: 'stargate-arb-eth', name: 'Stargate', from: 'arbitrum', to: 'ethereum', feePercent: 0.06, flatFeeUsd: 3.0, avgLatencyMs: 600000, maxAmount: 10000000, minAmount: 1, reliability: 0.99 },
  { id: 'stargate-eth-op', name: 'Stargate', from: 'ethereum', to: 'optimism', feePercent: 0.06, flatFeeUsd: 3.0, avgLatencyMs: 900000, maxAmount: 10000000, minAmount: 1, reliability: 0.99 },
  { id: 'stargate-eth-base', name: 'Stargate', from: 'ethereum', to: 'base', feePercent: 0.06, flatFeeUsd: 2.5, avgLatencyMs: 900000, maxAmount: 8000000, minAmount: 1, reliability: 0.99 },
  { id: 'stargate-arb-op', name: 'Stargate', from: 'arbitrum', to: 'optimism', feePercent: 0.03, flatFeeUsd: 0.5, avgLatencyMs: 60000, maxAmount: 8000000, minAmount: 1, reliability: 0.99 },
  { id: 'stargate-arb-base', name: 'Stargate', from: 'arbitrum', to: 'base', feePercent: 0.02, flatFeeUsd: 0.3, avgLatencyMs: 45000, maxAmount: 8000000, minAmount: 1, reliability: 0.99 },
  { id: 'stargate-op-base', name: 'Stargate', from: 'optimism', to: 'base', feePercent: 0.02, flatFeeUsd: 0.2, avgLatencyMs: 30000, maxAmount: 8000000, minAmount: 1, reliability: 0.99 },
  { id: 'stargate-base-op', name: 'Stargate', from: 'base', to: 'optimism', feePercent: 0.02, flatFeeUsd: 0.2, avgLatencyMs: 30000, maxAmount: 8000000, minAmount: 1, reliability: 0.99 },
  { id: 'stargate-eth-polygon', name: 'Stargate', from: 'ethereum', to: 'polygon', feePercent: 0.06, flatFeeUsd: 3.0, avgLatencyMs: 1800000, maxAmount: 10000000, minAmount: 1, reliability: 0.98 },
  { id: 'stargate-eth-avax', name: 'Stargate', from: 'ethereum', to: 'avalanche', feePercent: 0.06, flatFeeUsd: 3.5, avgLatencyMs: 900000, maxAmount: 5000000, minAmount: 1, reliability: 0.98 },
  { id: 'stargate-arb-polygon', name: 'Stargate', from: 'arbitrum', to: 'polygon', feePercent: 0.03, flatFeeUsd: 0.5, avgLatencyMs: 120000, maxAmount: 5000000, minAmount: 1, reliability: 0.98 },
  { id: 'stargate-arb-avax', name: 'Stargate', from: 'arbitrum', to: 'avalanche', feePercent: 0.04, flatFeeUsd: 1.0, avgLatencyMs: 120000, maxAmount: 5000000, minAmount: 1, reliability: 0.97 },
  { id: 'stargate-polygon-bsc', name: 'Stargate', from: 'polygon', to: 'bsc', feePercent: 0.03, flatFeeUsd: 0.5, avgLatencyMs: 90000, maxAmount: 5000000, minAmount: 1, reliability: 0.98 },
  { id: 'stargate-bsc-polygon', name: 'Stargate', from: 'bsc', to: 'polygon', feePercent: 0.03, flatFeeUsd: 0.5, avgLatencyMs: 90000, maxAmount: 5000000, minAmount: 1, reliability: 0.98 },

  // Across Protocol (fast L2 bridges)
  { id: 'across-eth-arb', name: 'Across', from: 'ethereum', to: 'arbitrum', feePercent: 0.04, flatFeeUsd: 1.0, avgLatencyMs: 120000, maxAmount: 5000000, minAmount: 1, reliability: 0.99 },
  { id: 'across-eth-op', name: 'Across', from: 'ethereum', to: 'optimism', feePercent: 0.04, flatFeeUsd: 1.0, avgLatencyMs: 120000, maxAmount: 5000000, minAmount: 1, reliability: 0.99 },
  { id: 'across-eth-base', name: 'Across', from: 'ethereum', to: 'base', feePercent: 0.03, flatFeeUsd: 0.8, avgLatencyMs: 90000, maxAmount: 5000000, minAmount: 1, reliability: 0.99 },
  { id: 'across-arb-op', name: 'Across', from: 'arbitrum', to: 'optimism', feePercent: 0.02, flatFeeUsd: 0.2, avgLatencyMs: 30000, maxAmount: 5000000, minAmount: 1, reliability: 0.99 },
  { id: 'across-arb-base', name: 'Across', from: 'arbitrum', to: 'base', feePercent: 0.015, flatFeeUsd: 0.15, avgLatencyMs: 20000, maxAmount: 5000000, minAmount: 1, reliability: 0.99 },
  { id: 'across-op-arb', name: 'Across', from: 'optimism', to: 'arbitrum', feePercent: 0.02, flatFeeUsd: 0.2, avgLatencyMs: 30000, maxAmount: 5000000, minAmount: 1, reliability: 0.99 },
  { id: 'across-eth-linea', name: 'Across', from: 'ethereum', to: 'linea', feePercent: 0.04, flatFeeUsd: 1.5, avgLatencyMs: 180000, maxAmount: 3000000, minAmount: 1, reliability: 0.97 },
  { id: 'across-eth-zksync', name: 'Across', from: 'ethereum', to: 'zksync', feePercent: 0.04, flatFeeUsd: 1.5, avgLatencyMs: 180000, maxAmount: 3000000, minAmount: 1, reliability: 0.97 },
  { id: 'across-eth-scroll', name: 'Across', from: 'ethereum', to: 'scroll', feePercent: 0.05, flatFeeUsd: 2.0, avgLatencyMs: 240000, maxAmount: 2000000, minAmount: 1, reliability: 0.96 },

  // Hyperlane
  { id: 'hyperlane-arb-base', name: 'Hyperlane', from: 'arbitrum', to: 'base', feePercent: 0.01, flatFeeUsd: 0.1, avgLatencyMs: 15000, maxAmount: 3000000, minAmount: 1, reliability: 0.98 },
  { id: 'hyperlane-base-arb', name: 'Hyperlane', from: 'base', to: 'arbitrum', feePercent: 0.01, flatFeeUsd: 0.1, avgLatencyMs: 15000, maxAmount: 3000000, minAmount: 1, reliability: 0.98 },
  { id: 'hyperlane-op-base', name: 'Hyperlane', from: 'optimism', to: 'base', feePercent: 0.01, flatFeeUsd: 0.1, avgLatencyMs: 15000, maxAmount: 3000000, minAmount: 1, reliability: 0.98 },
  { id: 'hyperlane-eth-scroll', name: 'Hyperlane', from: 'ethereum', to: 'scroll', feePercent: 0.04, flatFeeUsd: 2.0, avgLatencyMs: 300000, maxAmount: 2000000, minAmount: 5, reliability: 0.95 },

  // Celer cBridge
  { id: 'celer-eth-bsc', name: 'cBridge', from: 'ethereum', to: 'bsc', feePercent: 0.05, flatFeeUsd: 3.0, avgLatencyMs: 300000, maxAmount: 3000000, minAmount: 10, reliability: 0.96 },
  { id: 'celer-bsc-eth', name: 'cBridge', from: 'bsc', to: 'ethereum', feePercent: 0.05, flatFeeUsd: 3.0, avgLatencyMs: 300000, maxAmount: 3000000, minAmount: 10, reliability: 0.96 },
  { id: 'celer-polygon-avax', name: 'cBridge', from: 'polygon', to: 'avalanche', feePercent: 0.04, flatFeeUsd: 1.0, avgLatencyMs: 120000, maxAmount: 2000000, minAmount: 5, reliability: 0.96 },
  { id: 'celer-avax-polygon', name: 'cBridge', from: 'avalanche', to: 'polygon', feePercent: 0.04, flatFeeUsd: 1.0, avgLatencyMs: 120000, maxAmount: 2000000, minAmount: 5, reliability: 0.96 },
  { id: 'celer-bsc-avax', name: 'cBridge', from: 'bsc', to: 'avalanche', feePercent: 0.04, flatFeeUsd: 0.8, avgLatencyMs: 90000, maxAmount: 2000000, minAmount: 5, reliability: 0.96 },
  { id: 'celer-arb-bsc', name: 'cBridge', from: 'arbitrum', to: 'bsc', feePercent: 0.03, flatFeeUsd: 0.5, avgLatencyMs: 60000, maxAmount: 3000000, minAmount: 1, reliability: 0.97 },
  { id: 'celer-polygon-fantom', name: 'cBridge', from: 'polygon', to: 'fantom', feePercent: 0.03, flatFeeUsd: 0.3, avgLatencyMs: 60000, maxAmount: 1000000, minAmount: 1, reliability: 0.94 },
  { id: 'celer-fantom-polygon', name: 'cBridge', from: 'fantom', to: 'polygon', feePercent: 0.03, flatFeeUsd: 0.3, avgLatencyMs: 60000, maxAmount: 1000000, minAmount: 1, reliability: 0.94 },

  // debridge
  { id: 'debridge-sol-arb', name: 'deBridge', from: 'solana', to: 'arbitrum', feePercent: 0.04, flatFeeUsd: 1.5, avgLatencyMs: 30000, maxAmount: 5000000, minAmount: 5, reliability: 0.97 },
  { id: 'debridge-arb-sol', name: 'deBridge', from: 'arbitrum', to: 'solana', feePercent: 0.04, flatFeeUsd: 1.5, avgLatencyMs: 30000, maxAmount: 5000000, minAmount: 5, reliability: 0.97 },
  { id: 'debridge-sol-base', name: 'deBridge', from: 'solana', to: 'base', feePercent: 0.03, flatFeeUsd: 1.0, avgLatencyMs: 25000, maxAmount: 3000000, minAmount: 5, reliability: 0.97 },
  { id: 'debridge-sol-polygon', name: 'deBridge', from: 'solana', to: 'polygon', feePercent: 0.04, flatFeeUsd: 1.0, avgLatencyMs: 30000, maxAmount: 3000000, minAmount: 5, reliability: 0.96 },
  { id: 'debridge-eth-sol', name: 'deBridge', from: 'ethereum', to: 'solana', feePercent: 0.03, flatFeeUsd: 3.0, avgLatencyMs: 25000, maxAmount: 5000000, minAmount: 10, reliability: 0.97 },

  // Mayan (Solana focused)
  { id: 'mayan-sol-eth', name: 'Mayan', from: 'solana', to: 'ethereum', feePercent: 0.03, flatFeeUsd: 2.5, avgLatencyMs: 60000, maxAmount: 2000000, minAmount: 5, reliability: 0.95 },
  { id: 'mayan-sol-arb', name: 'Mayan', from: 'solana', to: 'arbitrum', feePercent: 0.02, flatFeeUsd: 0.8, avgLatencyMs: 30000, maxAmount: 2000000, minAmount: 5, reliability: 0.95 },
  { id: 'mayan-sol-bsc', name: 'Mayan', from: 'solana', to: 'bsc', feePercent: 0.03, flatFeeUsd: 1.0, avgLatencyMs: 45000, maxAmount: 2000000, minAmount: 5, reliability: 0.94 },
  { id: 'mayan-sol-avax', name: 'Mayan', from: 'solana', to: 'avalanche', feePercent: 0.03, flatFeeUsd: 1.0, avgLatencyMs: 45000, maxAmount: 1000000, minAmount: 5, reliability: 0.93 },

  // Misc L2-L2 / niche routes
  { id: 'orbiter-arb-scroll', name: 'Orbiter', from: 'arbitrum', to: 'scroll', feePercent: 0.02, flatFeeUsd: 0.3, avgLatencyMs: 30000, maxAmount: 1000000, minAmount: 1, reliability: 0.97 },
  { id: 'orbiter-arb-zksync', name: 'Orbiter', from: 'arbitrum', to: 'zksync', feePercent: 0.02, flatFeeUsd: 0.3, avgLatencyMs: 30000, maxAmount: 1000000, minAmount: 1, reliability: 0.97 },
  { id: 'orbiter-arb-linea', name: 'Orbiter', from: 'arbitrum', to: 'linea', feePercent: 0.02, flatFeeUsd: 0.3, avgLatencyMs: 30000, maxAmount: 1000000, minAmount: 1, reliability: 0.96 },
  { id: 'orbiter-base-scroll', name: 'Orbiter', from: 'base', to: 'scroll', feePercent: 0.02, flatFeeUsd: 0.2, avgLatencyMs: 25000, maxAmount: 1000000, minAmount: 1, reliability: 0.96 },
  { id: 'orbiter-base-zksync', name: 'Orbiter', from: 'base', to: 'zksync', feePercent: 0.02, flatFeeUsd: 0.2, avgLatencyMs: 25000, maxAmount: 1000000, minAmount: 1, reliability: 0.96 },
  { id: 'orbiter-base-linea', name: 'Orbiter', from: 'base', to: 'linea', feePercent: 0.015, flatFeeUsd: 0.15, avgLatencyMs: 20000, maxAmount: 1000000, minAmount: 1, reliability: 0.97 },