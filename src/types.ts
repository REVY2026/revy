export interface Chain {
  name: string;
  chainId?: number;
  ecosystem: "evm" | "solana" | "sui" | "aptos" | "near";
  gasUsd: number;
}

export interface Bridge {
  fromChain: string;
  toChain: string;
  bridge: string;
  feePercent: number;
  flatFeeUsd: number;
  gasUsd: number;
}

export interface RouteHop {
  fromChain: string;
  toChain: string;
  bridge: string;
  feePercent: number;
  flatFeeUsd: number;
  gasUsd: number;
}

export interface Route {
  hops: RouteHop[];
  totalFeePercent: number;
  totalFlatFeeUsd: number;
  totalGasUsd: number;
  totalCostUsd: number;
  hopCount: number;
}

export interface RouteRequest {
  fromChain: string;
  toChain: string;
  amountUsd: number;
}

export interface LevyParams {
  mu: number;
  iterations: number;
  maxHops: number;
  localThreshold: number;
}
// rev: 1
