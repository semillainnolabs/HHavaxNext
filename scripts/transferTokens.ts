// npx hardhat run scripts/transferTokens.ts --network localhost

import { ethers } from "hardhat"
import * as dotenv from "dotenv"

dotenv.config({ path: "./web/.env.local" })

async function main(): Promise<void> {

  const tokenAddress = process.env.NEXT_PUBLIC_TOKEN as string

  const token = await ethers.getContractAt(
    "MockERC20",
    tokenAddress
  )

  const signers = await ethers.getSigners()

  const sender = signers[0]
  const receiver = signers[1]

  const amount = ethers.parseUnits("500", 6)

  console.log("Sending tokens...")
  console.log("From:", sender.address)
  console.log("To:", receiver.address)

  const tx = await token
    .connect(sender)
    .transfer(receiver.address, amount)

  await tx.wait()

  console.log(
    "Transfer complete:",
    ethers.formatUnits(amount, 6),
    "tokens"
  )

}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})