// scripts/impersonateAndTransferUSDC.ts
/**
 * Usage:
 * npx hardhat run scripts/impersonateAndTransferUSDC.ts --network localhost -- <amountDecimals>
 *
 * Example:
 * npx hardhat run scripts/impersonateAndTransferUSDC.ts --network localhost -- 100
 */

import hre from "hardhat";
import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config({ path: "./web/.env.local" }); // reads NEXT_PUBLIC_TOKEN / NEXT_PUBLIC_VAULT when needed

// The canonical Avalanche USDC address:
const USDC_ADDR = process.env.NEXT_PUBLIC_USDC_ADDRESS || "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E";
const MXNB_ADDR = process.env.NEXT_PUBLIC_MXNB_ADDRESS || "0xF197FFC28c23E0309B5559e7a166f2c6164C80aA";
const WHALE_ADDR = process.env.NEXT_PUBLIC_USD_WHALE_ADDRESS || "0x45d3D68F14038099530b1C4448Db8Ecdd78179B1";
const MXN_WHALE_ADDR = process.env.NEXT_PUBLIC_MXN_WHALE_ADDRESS || "0x817De19F19C39F59e6250Df590246e87e81B2bCB";

async function main() {
  //const args = process.argv.slice(process.argv.indexOf("--") + 1);
  /*if (args.length < 1) {
    throw new Error("Usage: [amount]");
  }*/
  const whale = WHALE_ADDR;
  const whaleMXN = MXN_WHALE_ADDR;
  const recipient = (await ethers.getSigners())[0].address;
  const amountStr = "1000"; // default 1000 USDC
  const MxnAmountStr = "17900"; // default 1000 USDC
  const decimals = 6;

  console.log("Whale:", whale);
  console.log("Whale MXN:", whaleMXN);
  console.log("Recipient:", recipient);
  console.log("Amount (USDC):", amountStr);
  console.log("Amount (MXN):", MxnAmountStr);

  // 1) impersonate account
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [whale],
  });

  // 2) make sure whale has native balance to pay gas: set to 5 AVAX (in wei hex)
  let value = ethers.parseEther("5");
  await hre.network.provider.request({
    method: "hardhat_setBalance",
    params: [whale, ethers.toBeHex(value)],
  });

  // 3) get signer for whale
  let whaleSigner = await ethers.getSigner(whale);

  // 4) attach to existing USDC contract
  let erc20 = await ethers.getContractAt(
    [
      "function transfer(address to, uint256 amount) returns (bool)",
      "function decimals() view returns (uint8)",
      "function balanceOf(address) view returns (uint256)",
    ],
    USDC_ADDR,
    whaleSigner
  );

  // 5) build amount
  let amount = ethers.parseUnits(amountStr, decimals);

  // 6) send transfer
  console.log("Sending transfer from whale (impersonated)...");
  let tx = await erc20.transfer(recipient, amount);
  await tx.wait();
  console.log("Transfer tx hash:", tx.hash);

  // 7) show recipient balance
  let erc20Read = await ethers.getContractAt(
    ["function balanceOf(address) view returns (uint256)","function decimals() view returns (uint8)"],
    USDC_ADDR
  );
  let bal = await erc20Read.balanceOf(recipient);
  let d = await erc20Read.decimals();
  console.log(`Recipient USDC balance: ${ethers.formatUnits(bal, d)}`);

  // 8) stop impersonating
  await hre.network.provider.request({
    method: "hardhat_stopImpersonatingAccount",
    params: [whale],
  });

  // MXNB IMPERSONATION

  // 1) impersonate account
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [whaleMXN],
  });

  // 2) make sure whale has native balance to pay gas: set to 5 AVAX (in wei hex)
  value = ethers.parseEther("5");
  await hre.network.provider.request({
    method: "hardhat_setBalance",
    params: [whaleMXN, ethers.toBeHex(value)],
  });

  // 3) get signer for whale
  whaleSigner = await ethers.getSigner(whaleMXN);

  // 4) attach to existing USDC contract
  erc20 = await ethers.getContractAt(
    [
      "function transfer(address to, uint256 amount) returns (bool)",
      "function decimals() view returns (uint8)",
      "function balanceOf(address) view returns (uint256)",
    ],
    MXNB_ADDR,
    whaleSigner
  );

  // 5) build amount
  amount = ethers.parseUnits(MxnAmountStr, decimals);

  // 6) send transfer
  console.log("Sending transfer from whale (impersonated)...");
  tx = await erc20.transfer(recipient, amount);
  await tx.wait();
  console.log("Transfer tx hash:", tx.hash);

  // 7) show recipient balance
  erc20Read = await ethers.getContractAt(
    ["function balanceOf(address) view returns (uint256)","function decimals() view returns (uint8)"],
    USDC_ADDR
  );
  bal = await erc20Read.balanceOf(recipient);
  d = await erc20Read.decimals();
  console.log(`Recipient MXNB balance: ${ethers.formatUnits(bal, d)}`);

  // 8) stop impersonating
  await hre.network.provider.request({
    method: "hardhat_stopImpersonatingAccount",
    params: [whale],
  });

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});