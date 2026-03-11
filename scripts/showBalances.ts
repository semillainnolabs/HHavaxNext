// npx hardhat run scripts/showBalances.ts --network localhost

import { ethers } from "hardhat"
import * as dotenv from "dotenv"

dotenv.config({ path: "./web/.env.local" })

async function main(): Promise<void> {

    const tokenAddress = process.env.NEXT_PUBLIC_TOKEN as string
    const vaultAddress = process.env.NEXT_PUBLIC_VAULT as string

    const token = await ethers.getContractAt(
        "MockERC20",
        tokenAddress
    )

    const vault = await ethers.getContractAt(
        "SimpleVault",
        vaultAddress
    )

    const decimals = await token.decimals()

    const signers = await ethers.getSigners()

    console.log("mockUSDC Balances\n")

    const balance = await token.balanceOf(vaultAddress)

    console.log(
        vaultAddress,
        "→",
        ethers.formatUnits(balance, decimals) + " mockUSDC"
    )

    for (const s of signers) {

        const balance = await token.balanceOf(s.address)
        const shares = await vault.balanceOf(s.address)

        console.log(
            s.address,
            "→",
            ethers.formatUnits(balance, decimals) + " mockUSDC"
        )

        console.log(
            s.address,
            "→",
            ethers.formatUnits(shares, decimals) + " vSHARE"
        )

        console.log(
            s.address,
            "→",
            shares + " raw vSHARE"
        )

        break

    }

}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})