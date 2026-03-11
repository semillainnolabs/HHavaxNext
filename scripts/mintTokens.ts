// npx hardhat run scripts/mintTokens.ts --network localhost

import { ethers } from "hardhat"

async function main(): Promise<void> {

  const tokenAddress = process.env.NEXT_PUBLIC_TOKEN as string

  const token = await ethers.getContractAt(
    "MockERC20",
    tokenAddress
  )

  const signers = await ethers.getSigners()

  for (const s of signers) {

    const amount = ethers.parseUnits("10000", 6)

    const tx = await token.mint(
      s.address,
      amount
    )

    await tx.wait()

    console.log("Minted tokens to", s.address)

  }

}

main().catch(console.error)