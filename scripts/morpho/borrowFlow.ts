import { ethers } from "hardhat";
import {
  ADDRESSES,
  ERC20_ABI,
  MORPHO_ABI,
  MarketParams,
  env,
  encodeMarketParams,
} from "./shared";

async function main() {
  const [signer] = await ethers.getSigners();
  const action = (process.argv[2] ?? "status").toLowerCase();
  const amountStr = process.argv[3] ?? "100";

  const oracle = env("MORPHO_ORACLE");
  const lltv = ethers.parseUnits(env("MORPHO_LLTV", "0.80"), 18);

  const marketParams: MarketParams = {
    loanToken: ADDRESSES.MXNB,
    collateralToken: ADDRESSES.USDC,
    oracle,
    irm: ADDRESSES.ADAPTIVE_CURVE_IRM,
    lltv,
  };

  const morpho = new ethers.Contract(ADDRESSES.MORPHO, MORPHO_ABI, signer);
  const collateralToken = new ethers.Contract(ADDRESSES.USDC, ERC20_ABI, signer);
  const loanToken = new ethers.Contract(ADDRESSES.MXNB, ERC20_ABI, signer);

  const collateralDecimals = Number(await collateralToken.decimals());
  const loanDecimals = Number(await loanToken.decimals());
  const amountCollateral = ethers.parseUnits(amountStr, collateralDecimals);
  const amountLoan = ethers.parseUnits(amountStr, loanDecimals);

  const marketId = ethers.keccak256(encodeMarketParams(marketParams));

  if (action === "supply-collateral") {
    await (await collateralToken.approve(ADDRESSES.MORPHO, amountCollateral)).wait();
    const tx = await morpho.supplyCollateral(
      [marketParams.loanToken, marketParams.collateralToken, marketParams.oracle, marketParams.irm, marketParams.lltv],
      amountCollateral,
      signer.address,
      "0x"
    );
    await tx.wait();
    console.log(`Supplied ${amountStr} USDC collateral`);
    return;
  }

  if (action === "borrow") {
    const tx = await morpho.borrow(
      [marketParams.loanToken, marketParams.collateralToken, marketParams.oracle, marketParams.irm, marketParams.lltv],
      amountLoan,
      0,
      signer.address,
      signer.address
    );
    await tx.wait();
    console.log(`Borrowed ${amountStr} MXNB`);
    return;
  }

  if (action === "repay") {
    await (await loanToken.approve(ADDRESSES.MORPHO, amountLoan)).wait();
    const tx = await morpho.repay(
      [marketParams.loanToken, marketParams.collateralToken, marketParams.oracle, marketParams.irm, marketParams.lltv],
      amountLoan,
      0,
      signer.address,
      "0x"
    );
    await tx.wait();
    console.log(`Repaid ${amountStr} MXNB`);
    return;
  }

  if (action === "withdraw-collateral") {
    const tx = await morpho.withdrawCollateral(
      [marketParams.loanToken, marketParams.collateralToken, marketParams.oracle, marketParams.irm, marketParams.lltv],
      amountCollateral,
      signer.address,
      signer.address
    );
    await tx.wait();
    console.log(`Withdrew ${amountStr} USDC collateral`);
    return;
  }

  const [supplyShares, borrowShares, collateral] = await morpho.position(marketId, signer.address);
  const [totalSupplyAssets, totalSupplyShares, totalBorrowAssets, totalBorrowShares] = await morpho.market(marketId);

  console.log("Market ID:", marketId);
  console.log("Position supply shares:", supplyShares.toString());
  console.log("Position borrow shares:", borrowShares.toString());
  console.log("Position collateral:", collateral.toString());
  console.log("Market total supply assets:", totalSupplyAssets.toString());
  console.log("Market total borrow assets:", totalBorrowAssets.toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});