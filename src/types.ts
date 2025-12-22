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
