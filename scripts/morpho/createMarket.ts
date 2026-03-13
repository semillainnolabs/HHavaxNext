import { ethers } from "hardhat";
import {
  ADDRESSES,
  MORPHO_ABI,
  env,
  encodeMarketParams,
} from "./shared";

async function main() {
  const [signer] = await ethers.getSigners();
  const morpho = new ethers.Contract(ADDRESSES.MORPHO, MORPHO_ABI, signer);

  const oracle = env("MORPHO_ORACLE");
  const lltv = ethers.parseUnits(env("MORPHO_LLTV", "0.80"), 18);

  const marketParams = {
    loanToken: ADDRESSES.MXNB,
    collateralToken: ADDRESSES.USDC,
    oracle,
    irm: ADDRESSES.ADAPTIVE_CURVE_IRM,
    lltv,
  } as const;

  const irmEnabled = await morpho.isIrmEnabled(marketParams.irm);
  const lltvEnabled = await morpho.isLltvEnabled(marketParams.lltv);

  if (!irmEnabled) {
    throw new Error(`IRM not enabled in Morpho: ${marketParams.irm}`);
  }
  if (!lltvEnabled) {
    throw new Error(`LLTV not enabled in Morpho: ${marketParams.lltv.toString()}`);
  }

  const marketId = ethers.keccak256(encodeMarketParams(marketParams));

  const tx = await morpho.createMarket([
    marketParams.loanToken,
    marketParams.collateralToken,
    marketParams.oracle,
    marketParams.irm,
    marketParams.lltv,
  ]);

  await tx.wait();

  const confirmed = await morpho.idToMarketParams(marketId);
  console.log("Market created:", marketId);
  console.log("Confirmed params:", confirmed);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});