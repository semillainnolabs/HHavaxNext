// scripts/aaveWithdraw.ts
/**
 * Usage:
 * npx hardhat run scripts/aaveWithdraw.ts --network localhost -- <amountDecimals>
 *
 * Example:
 * npx hardhat run scripts/aaveWithdraw.ts --network localhost -- 100
 */

import hre from "hardhat";
import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config({ path: "./web/.env.local" });

const POOL_ADDRESSES_PROVIDER = process.env.NEXT_PUBLIC_AAVE_POOL_ADDRS_PROVIDER || "0x2f39d218133afab8f2b819b1066c7e434ad94e9e"; // official Aave Provider (Avalanche V3)
const USDC_ADDR = process.env.NEXT_PUBLIC_USDC_ADDRESS || "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E";

async function main() {
  const args = process.argv.slice(process.argv.indexOf("--") + 1);
  const amountStr = args[0] || "100"; // amount USDC to withdraw

  const signer = (await ethers.getSigners())[0];
  console.log("Using signer:", signer.address);

  const provider = await ethers.getContractAt(
    ["function getPool() view returns (address)", "function getAddress(bytes32 id) view returns (address)"],
    POOL_ADDRESSES_PROVIDER
  );

  let poolAddress: string;
  try {
    poolAddress = await provider.getPool();
  } catch {
    const id = ethers.id("POOL");
    poolAddress = await provider.getAddress(id);
  }
  console.log("Resolved Pool address:", poolAddress);

  const pool = await ethers.getContractAt(
    ["function withdraw(address asset, uint256 amount, address to) returns (uint256)"],
    poolAddress,
    signer
  );

  const usdc = await ethers.getContractAt(["function decimals() view returns (uint8)"], USDC_ADDR);
  const decimals = Number(await usdc.decimals());
  const amount = ethers.parseUnits(amountStr, decimals);

  console.log(`Withdrawing ${amountStr} USDC...`);
  const tx = await pool.withdraw(USDC_ADDR, amount, signer.address);
  await tx.wait();
  console.log("Withdraw complete. Tx:", tx.hash);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});