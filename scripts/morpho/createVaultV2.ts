import { ethers } from "hardhat";
import {
  ADDRESSES,
  ADAPTER_FACTORY_ABI,
  VAULT_V2_ABI,
  VAULT_V2_FACTORY_ABI,
  MarketParams,
  env,
  encodeAdapterId,
  encodeCollateralId,
  encodeMarketId,
  encodeMarketParams,
  U128_MAX,
} from "./shared";

async function main() {
  const [signer] = await ethers.getSigners();

  const owner = signer.address;
  const salt = env("VAULT_SALT", ethers.id("mxnb-vault-v2"));
  const maxRate = ethers.parseUnits(env("VAULT_MAX_RATE", "1.0"), 18);

  const oracle = env("MORPHO_ORACLE");
  const lltv = ethers.parseUnits(env("MORPHO_LLTV", "0.80"), 18);

  const marketParams: MarketParams = {
    loanToken: ADDRESSES.MXNB,
    collateralToken: ADDRESSES.USDC,
    oracle,
    irm: ADDRESSES.ADAPTIVE_CURVE_IRM,
    lltv,
  };

  const vaultFactory = new ethers.Contract(
    ADDRESSES.VAULT_V2_FACTORY,
    VAULT_V2_FACTORY_ABI,
    signer
  );

  const predictedVault = await vaultFactory.createVaultV2.staticCall(
    owner,
    ADDRESSES.MXNB,
    salt
  );

  const vaultTx = await vaultFactory.createVaultV2(owner, ADDRESSES.MXNB, salt);
  await vaultTx.wait();

  const vault = new ethers.Contract(predictedVault, VAULT_V2_ABI, signer);

  await (await vault.setName("MXNB Yield Vault")).wait();
  await (await vault.setSymbol("yvMXNB")).wait();
  await (await vault.setCurator(owner)).wait();
  await (await vault.setIsAllocator(owner, true)).wait();

  await (await vault.setPerformanceFee(0)).wait();
  await (await vault.setManagementFee(0)).wait();
  await (await vault.setPerformanceFeeRecipient(owner)).wait();
  await (await vault.setManagementFeeRecipient(owner)).wait();

  await (await vault.submit(vault.interface.encodeFunctionData("setAdapterRegistry", [ADDRESSES.MORPHO_REGISTRY]))).wait();
  await (await vault.setAdapterRegistry(ADDRESSES.MORPHO_REGISTRY)).wait();

  const adapterFactory = new ethers.Contract(
    ADDRESSES.ADAPTER_V1_V2_FACTORY,
    ADAPTER_FACTORY_ABI,
    signer
  );

  const predictedAdapter = await adapterFactory.createMorphoMarketV1AdapterV2.staticCall(predictedVault);
  const adapterTx = await adapterFactory.createMorphoMarketV1AdapterV2(predictedVault);
  await adapterTx.wait();

  await (await vault.submit(vault.interface.encodeFunctionData("addAdapter", [predictedAdapter]))).wait();
  await (await vault.addAdapter(predictedAdapter)).wait();

  const adapterIdData = encodeAdapterId(predictedAdapter);
  const collateralIdData = encodeCollateralId(ADDRESSES.USDC);
  const marketIdData = encodeMarketId(predictedAdapter, marketParams);
  const marketData = encodeMarketParams(marketParams);

  await (await vault.submit(vault.interface.encodeFunctionData("increaseAbsoluteCap", [adapterIdData, U128_MAX]))).wait();
  await (await vault.increaseAbsoluteCap(adapterIdData, U128_MAX)).wait();

  await (await vault.submit(vault.interface.encodeFunctionData("increaseRelativeCap", [adapterIdData, ethers.parseUnits("1.0", 18)]))).wait();
  await (await vault.increaseRelativeCap(adapterIdData, ethers.parseUnits("1.0", 18))).wait();

  await (await vault.submit(vault.interface.encodeFunctionData("increaseAbsoluteCap", [collateralIdData, U128_MAX]))).wait();
  await (await vault.increaseAbsoluteCap(collateralIdData, U128_MAX)).wait();

  await (await vault.submit(vault.interface.encodeFunctionData("increaseRelativeCap", [collateralIdData, ethers.parseUnits("1.0", 18)]))).wait();
  await (await vault.increaseRelativeCap(collateralIdData, ethers.parseUnits("1.0", 18))).wait();

  await (await vault.submit(vault.interface.encodeFunctionData("increaseAbsoluteCap", [marketIdData, U128_MAX]))).wait();
  await (await vault.increaseAbsoluteCap(marketIdData, U128_MAX)).wait();

  await (await vault.submit(vault.interface.encodeFunctionData("increaseRelativeCap", [marketIdData, ethers.parseUnits("1.0", 18)]))).wait();
  await (await vault.increaseRelativeCap(marketIdData, ethers.parseUnits("1.0", 18)).wait());

  await (await vault.setLiquidityAdapterAndData(predictedAdapter, marketData)).wait();

  await (await vault.submit(vault.interface.encodeFunctionData("setMaxRate", [maxRate]))).wait();
  await (await vault.setMaxRate(maxRate)).wait();

  await (await vault.submit(vault.interface.encodeFunctionData("abdicate", [vault.interface.getFunction("setAdapterRegistry").selector]))).wait();
  await (await vault.abdicate(vault.interface.getFunction("setAdapterRegistry").selector)).wait();

  console.log("Vault created:", predictedVault);
  console.log("Adapter created:", predictedAdapter);
  console.log("Liquidity adapter configured for market:", marketParams);
  console.log("Registry locked.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});