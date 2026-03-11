// npx hardhat run scripts/deploy.ts --network localhost

import { ethers } from "hardhat"
import fs from "fs"

async function main(): Promise<void> {

  const [deployer] = await ethers.getSigners()

  console.log("Deploying with:", deployer.address)

  /*
  Deploy token
  */

  const Mock = await ethers.getContractFactory("MockERC20")

  const mock = await Mock.deploy(
    "Mock USDC",
    "mUSDC"
  )

  await mock.waitForDeployment()

  const tokenAddress = await mock.getAddress()

  console.log("Token deployed:", tokenAddress)

  /*
  Mint tokens
  */

  const mintAmount = ethers.parseUnits("1000000", 6)

  const mintTx = await mock.mint(
    deployer.address,
    mintAmount
  )

  await mintTx.wait()

  console.log("Minted test tokens")

  /*
  Deploy vault
  */

  const Vault = await ethers.getContractFactory("SimpleVault")

  const vault = await Vault.deploy(tokenAddress)

  await vault.waitForDeployment()

  const vaultAddress = await vault.getAddress()

  console.log("Vault deployed:", vaultAddress)

  /*
  Write frontend env
  */

  const env = `
NEXT_PUBLIC_RPC=http://127.0.0.1:8545
NEXT_PUBLIC_CHAIN_ID=43114
NEXT_PUBLIC_TOKEN=${tokenAddress}
NEXT_PUBLIC_VAULT=${vaultAddress}
`

  fs.writeFileSync("./web/.env.local", env)

  console.log("Frontend env updated")

}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})