import { ethers } from "hardhat"
import fs from "fs"

async function main(): Promise<void> {

  const [deployer] = await ethers.getSigners()

  console.log("Deploying with:", deployer.address)

  /*
  Deploy token
  */

  const MockOracle = await ethers.getContractFactory("MockOracle")

  const oracle = await MockOracle.deploy()

  await oracle.waitForDeployment()

  const oracleAddress = await oracle.getAddress()

  console.log("Oracle deployed:", oracleAddress)
  console.log("Orientation: USDC (collateral) -> MXNB (loan)")

}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})