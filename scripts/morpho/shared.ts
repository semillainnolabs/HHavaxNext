import { ethers } from "hardhat";

export const ADDRESSES = {
  VAULT_V2_FACTORY: "0xf7b1d9e43BAeA3705f2B303693766ACbcfec6A55",
  ADAPTER_V1_V2_FACTORY: "0x9633D22Bb8F42f6f70DbbBe34c11EB9209769b8b",
  MORPHO_REGISTRY: "0x66dC122CF454576684Ad78A2800a8Eb052b2E9a6",
  MORPHO: "0x895383274303AA19fe978AFB4Ac55C7f094f982C",
  ADAPTIVE_CURVE_IRM: "0xb6ac9477D574EE2a7BF32d2475b303fb70968AA4",
  ORACLE_FACTORY: "0xF0c1299D44b3803243d7c1eEC2042e9484Db13f2",
  ORACLE: "0x17f4B55A352Be71CC03856765Ad04147119Aa09B",
  MARKET_ID: "0xd6198907acdc7b7e54de4a60f0557ea49621a2252bc4f0fab1ecb4c727b9a81c",

  MXNB: "0xF197FFC28c23E0309B5559e7a166f2c6164C80aA",
  USDC: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
} as const;

export const ERC20_ABI = [
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
];

export const ERC4626_ABI = [
  "function asset() view returns (address)",
  "function totalAssets() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function convertToAssets(uint256 shares) view returns (uint256)",
  "function previewDeposit(uint256 assets) view returns (uint256)",
  "function previewWithdraw(uint256 assets) view returns (uint256)",
  "function deposit(uint256 assets, address receiver) returns (uint256 shares)",
  "function withdraw(uint256 assets, address receiver, address owner) returns (uint256 shares)",
  "function redeem(uint256 shares, address receiver, address owner) returns (uint256 assets)",
  "function approve(address spender, uint256 amount) returns (bool)",
];

export const MORPHO_ABI = [
  "tuple(address loanToken,address collateralToken,address oracle,address irm,uint256 lltv)",
  "function isIrmEnabled(address irm) view returns (bool)",
  "function isLltvEnabled(uint256 lltv) view returns (bool)",
  "function createMarket((address loanToken,address collateralToken,address oracle,address irm,uint256 lltv) marketParams)",
  "function idToMarketParams(bytes32 id) view returns (address loanToken,address collateralToken,address oracle,address irm,uint256 lltv)",
  "function market(bytes32 id) view returns (uint128 totalSupplyAssets,uint128 totalSupplyShares,uint128 totalBorrowAssets,uint128 totalBorrowShares,uint128 lastUpdate,uint128 fee)",
  "function position(bytes32 id, address user) view returns (uint256 supplyShares,uint128 borrowShares,uint128 collateral)",
  "function supplyCollateral((address loanToken,address collateralToken,address oracle,address irm,uint256 lltv) marketParams, uint256 assets, address onBehalf, bytes data)",
  "function borrow((address loanToken,address collateralToken,address oracle,address irm,uint256 lltv) marketParams, uint256 assets, uint256 shares, address onBehalf, address receiver) returns (uint256 assetsBorrowed, uint256 sharesBorrowed)",
  "function repay((address loanToken,address collateralToken,address oracle,address irm,uint256 lltv) marketParams, uint256 assets, uint256 shares, address onBehalf, bytes data) returns (uint256 assetsRepaid, uint256 sharesRepaid)",
  "function withdrawCollateral((address loanToken,address collateralToken,address oracle,address irm,uint256 lltv) marketParams, uint256 assets, address onBehalf, address receiver)",
  "function setAuthorization(address authorized, bool newIsAuthorized)",
];

export const VAULT_V2_FACTORY_ABI = [
  "function createVaultV2(address owner, address asset, bytes32 salt) returns (address newVaultV2)",
];

export const ADAPTER_FACTORY_ABI = [
  "function createMorphoMarketV1AdapterV2(address parentVault) returns (address newAdapter)",
];

export const ORACLE_FACTORY_ABI = [
  "function createMorphoChainlinkOracleV2(address baseVault,uint256 baseVaultConversionSample,address baseFeed1,address baseFeed2,uint256 baseTokenDecimals,address quoteVault,uint256 quoteVaultConversionSample,address quoteFeed1,address quoteFeed2,uint256 quoteTokenDecimals,bytes32 salt) returns (address oracle)",
];

export const VAULT_V2_ABI = [
  "function owner() view returns (address)",
  "function curator() view returns (address)",
  "function asset() view returns (address)",
  "function timelock(bytes4 selector) view returns (uint256)",
  "function setOwner(address newOwner)",
  "function setCurator(address newCurator)",
  "function setIsAllocator(address account, bool newIsAllocator)",
  "function setName(string newName)",
  "function setSymbol(string newSymbol)",
  "function submit(bytes data)",
  "function revoke(bytes data)",
  "function setAdapterRegistry(address newAdapterRegistry)",
  "function addAdapter(address account)",
  "function removeAdapter(address account)",
  "function increaseAbsoluteCap(bytes idData, uint256 newAbsoluteCap)",
  "function increaseRelativeCap(bytes idData, uint256 newRelativeCap)",
  "function setMaxRate(uint256 newMaxRate)",
  "function setPerformanceFee(uint256 newPerformanceFee)",
  "function setManagementFee(uint256 newManagementFee)",
  "function setPerformanceFeeRecipient(address newPerformanceFeeRecipient)",
  "function setManagementFeeRecipient(address newManagementFeeRecipient)",
  "function setLiquidityAdapterAndData(address newLiquidityAdapter, bytes newLiquidityData)",
  "function abdicate(bytes4 selector)",
  "function allocate(address adapter, bytes data, uint256 assets)",
  "function withdraw(uint256 assets, address receiver, address owner) returns (uint256 shares)",
  "function deposit(uint256 assets, address receiver) returns (uint256 shares)",
  "function balanceOf(address account) view returns (uint256)",
  "function totalAssets() view returns (uint256)",
  "function previewDeposit(uint256 assets) view returns (uint256)",
  "function previewWithdraw(uint256 assets) view returns (uint256)",
  "function redeem(uint256 shares, address receiver, address owner) returns (uint256 assets)",
];

export const coder = ethers.AbiCoder.defaultAbiCoder();
export const U128_MAX = (1n << 128n) - 1n;

export type MarketParams = {
  loanToken: string;
  collateralToken: string;
  oracle: string;
  irm: string;
  lltv: bigint;
};

export function env(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

export function marketTuple(m: MarketParams) {
  return [m.loanToken, m.collateralToken, m.oracle, m.irm, m.lltv] as const;
}

export function encodeMarketParams(m: MarketParams): string {
  return coder.encode(
    ["tuple(address loanToken,address collateralToken,address oracle,address irm,uint256 lltv)"],
    [marketTuple(m)]
  );
}

export function encodeAdapterId(adapter: string): string {
  return coder.encode(["string", "address"], ["this", adapter]);
}

export function encodeCollateralId(collateralToken: string): string {
  return coder.encode(["string", "address"], ["collateralToken", collateralToken]);
}

export function encodeMarketId(adapter: string, m: MarketParams): string {
  return coder.encode(
    ["string", "address", "tuple(address loanToken,address collateralToken,address oracle,address irm,uint256 lltv)"],
    ["this/marketParams", adapter, marketTuple(m)]
  );
}