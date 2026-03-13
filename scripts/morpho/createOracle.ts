import { ethers } from "hardhat";
import {
  ADDRESSES,
  ERC20_ABI,
  ORACLE_FACTORY_ABI,
  env,
} from "./shared";

async function main() {
  const [signer] = await ethers.getSigners();

  const factory = new ethers.Contract(
    ADDRESSES.ORACLE_FACTORY,
    ORACLE_FACTORY_ABI,
    signer
  );

  const mxnb = new ethers.Contract(ADDRESSES.MXNB, ERC20_ABI, signer);
  const usdc = new ethers.Contract(ADDRESSES.USDC, ERC20_ABI, signer);

  const mxnbDecimals = Number(await mxnb.decimals());
  const usdcDecimals = Number(await usdc.decimals());

  const mxnbUsdFeed = env("MXNB_USD_FEED");
  const usdcUsdFeed = env("USDC_USD_FEED", "0xF096872672F44d6EBA71458D74fe67F9a77a23B9");
  const salt = env("ORACLE_SALT", ethers.id("mxnb-usdc-oracle-v1"));

  const baseVault = ethers.ZeroAddress;
  const quoteVault = ethers.ZeroAddress;

  const baseFeed1 = usdcUsdFeed;  // collateral = USDC
  const baseFeed2 = ethers.ZeroAddress;
  const quoteFeed1 = mxnbUsdFeed;  // loan = MXNB
  const quoteFeed2 = ethers.ZeroAddress;

  const predicted = await factory.createMorphoChainlinkOracleV2.staticCall(
    baseVault,
    1,
    baseFeed1,
    baseFeed2,
    usdcDecimals,
    quoteVault,
    1,
    quoteFeed1,
    quoteFeed2,
    mxnbDecimals,
    salt
  );

  const tx = await factory.createMorphoChainlinkOracleV2(
    baseVault,
    1,
    baseFeed1,
    baseFeed2,
    usdcDecimals,
    quoteVault,
    1,
    quoteFeed1,
    quoteFeed2,
    mxnbDecimals,
    salt
  );

  await tx.wait();

  console.log("Oracle created:", predicted);
  console.log("Orientation: USDC (collateral) -> MXNB (loan)");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});