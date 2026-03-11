// npx hardhat run scripts/checkDeployment.ts --network localhost

import { ethers } from "hardhat"
import * as dotenv from "dotenv"

dotenv.config({ path: "./web/.env.local" })

async function main(): Promise<void> {

  const tokenAddress = process.env.NEXT_PUBLIC_TOKEN as string
  const vaultAddress = process.env.NEXT_PUBLIC_VAULT as string

  if (!tokenAddress || !vaultAddress) {
    throw new Error("Missing contract addresses in web/.env.local")
  }

  const token = await ethers.getContractAt(
    "MockERC20",
    tokenAddress
  )

  const vault = await ethers.getContractAt(
    "SimpleVault",
    vaultAddress
  )

  console.log("Checking deployment...\n")

  console.log("Token address:", tokenAddress)
  console.log("Vault address:", vaultAddress)

  const name = await token.name()
  const symbol = await token.symbol()
  const decimals = await token.decimals()

  console.log("\nToken Info")
  console.log("Name:", name)
  console.log("Symbol:", symbol)
  console.log("Decimals:", decimals)

  const asset = await vault.asset()

  console.log("\nVault Info")
  console.log("Asset:", asset)

  const totalAssets = await vault.totalAssets()

  console.log(
    "Vault assets:",
    ethers.formatUnits(totalAssets, decimals)
  )

  console.log("\nDeployment check completed")

}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})