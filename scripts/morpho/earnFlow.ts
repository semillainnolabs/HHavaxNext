import { ethers } from "hardhat";
import {
  ADDRESSES,
  ERC20_ABI,
  ERC4626_ABI,
  env,
} from "./shared";

async function status(vault: any, token: any, account: string) {
  const shares = await vault.balanceOf(account);
  const assets = await vault.convertToAssets(shares);
  const totalAssets = await vault.totalAssets();
  console.log("Vault shares:", shares.toString());
  console.log("Vault assets (from shares):", ethers.formatUnits(assets, 18));
  console.log("Vault total assets:", ethers.formatUnits(totalAssets, 18));
}

async function main() {
  const [signer] = await ethers.getSigners();
  const action = (process.argv[2] ?? "status").toLowerCase();
  const amountStr = process.argv[3] ?? "100";

  const vaultAddress = env("MORPHO_VAULT_V2");
  const vault = new ethers.Contract(vaultAddress, ERC4626_ABI, signer);
  const assetAddress = await vault.asset();
  const token = new ethers.Contract(assetAddress, ERC20_ABI, signer);
  const decimals = Number(await token.decimals());
  const amount = ethers.parseUnits(amountStr, decimals);

  if (action === "deposit") {
    const preview = await vault.previewDeposit(amount);
    await (await token.approve(vaultAddress, amount)).wait();
    const tx = await vault.deposit(amount, signer.address);
    await tx.wait();
    console.log(`Deposited ${amountStr} ${await token.symbol?.().catch(() => "tokens")}`);
    console.log("Expected shares:", preview.toString());
    await status(vault, token, signer.address);
    return;
  }

  if (action === "withdraw") {
    const preview = await vault.previewWithdraw(amount);
    const tx = await vault.withdraw(amount, signer.address, signer.address);
    await tx.wait();
    console.log(`Withdrew ${amountStr} underlying assets`);
    console.log("Estimated shares burned:", preview.toString());
    await status(vault, token, signer.address);
    return;
  }

  await status(vault, token, signer.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});