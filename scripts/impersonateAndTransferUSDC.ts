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
const WHALE_ADDR = process.env.NEXT_PUBLIC_WHALE_ADDRESS || "0x45d3D68F14038099530b1C4448Db8Ecdd78179B1";

async function main() {
  //const args = process.argv.slice(process.argv.indexOf("--") + 1);
  /*if (args.length < 1) {
    throw new Error("Usage: [amount]");
  }*/
  const whale = WHALE_ADDR;
  const recipient = (await ethers.getSigners())[0].address;
  const amountStr = "1000"; // default 100 USDC
  const decimals = 6;

  console.log("Whale:", whale);
  console.log("Recipient:", recipient);
  console.log("Amount (USDC):", amountStr);

  // 1) impersonate account
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [whale],
  });

  // 2) make sure whale has native balance to pay gas: set to 5 AVAX (in wei hex)
  const value = ethers.parseEther("5");
  await hre.network.provider.request({
    method: "hardhat_setBalance",
    params: [whale, ethers.toBeHex(value)],
  });

  // 3) get signer for whale
  const whaleSigner = await ethers.getSigner(whale);

  // 4) attach to existing USDC contract
  const erc20 = await ethers.getContractAt(
    [
      "function transfer(address to, uint256 amount) returns (bool)",
      "function decimals() view returns (uint8)",
      "function balanceOf(address) view returns (uint256)",
    ],
    USDC_ADDR,
    whaleSigner
  );

  // 5) build amount
  const amount = ethers.parseUnits(amountStr, decimals);

  // 6) send transfer
  console.log("Sending transfer from whale (impersonated)...");
  const tx = await erc20.transfer(recipient, amount);
  await tx.wait();
  console.log("Transfer tx hash:", tx.hash);

  // 7) show recipient balance
  const erc20Read = await ethers.getContractAt(
    ["function balanceOf(address) view returns (uint256)","function decimals() view returns (uint8)"],
    USDC_ADDR
  );
  const bal = await erc20Read.balanceOf(recipient);
  const d = await erc20Read.decimals();
  console.log(`Recipient USDC balance: ${ethers.formatUnits(bal, d)}`);

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