// npx hardhat run scripts/showBalances.ts --network localhost

import { ethers } from "hardhat"
import * as dotenv from "dotenv"

dotenv.config({ path: "./web/.env.local" })

async function main(): Promise<void> {

    const tokenAddress = process.env.NEXT_PUBLIC_TOKEN as string
    const vaultAddress = process.env.NEXT_PUBLIC_VAULT as string
    const USDC_ADDR = process.env.NEXT_PUBLIC_USDC_ADDRESS || "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E"
    const MXNB_ADDR = process.env.NEXT_PUBLIC_MXNB_ADDRESS || "0xF197FFC28c23E0309B5559e7a166f2c6164C80aA"
    const AUSDC_ADDR = process.env.NEXT_PUBLIC_AAVE_AUSDC_ADDRESS as string

    /*const token = await ethers.getContractAt(
        "MockERC20",
        tokenAddress
    )

    const vault = await ethers.getContractAt(
        "SimpleVault",
        vaultAddress
    )

    const balance = await token.balanceOf(vaultAddress)

    console.log("Vault Balances\n")

    console.log(
        vaultAddress,
        "→",
        ethers.formatUnits(balance, decimals) + " mockUSDC"
    )

*/

    const usdc = await ethers.getContractAt(
        "MockERC20",
        USDC_ADDR
    )

    const ausdc = await ethers.getContractAt(
        "MockERC20",
        AUSDC_ADDR
    )

    const mxnb = await ethers.getContractAt(
        "MockERC20",
        MXNB_ADDR
    )


    const decimals = await usdc.decimals()

    const signers = await ethers.getSigners()

    console.log("\nUSER Balances\n")

    for (const s of signers) {

        /*const balance = await token.balanceOf(s.address)
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
        )*/

        const usdcBalance = await usdc.balanceOf(s.address)
        const ausdcBalance = await ausdc.balanceOf(s.address)
        const mxnbBalance = await mxnb.balanceOf(s.address)

        console.log(
            s.address,
            "→",
            ethers.formatUnits(usdcBalance, decimals) + " USDC"
        )

        console.log(
            s.address,
            "→",
            ethers.formatUnits(ausdcBalance, decimals) + " aaveUSDC"
        )

        console.log(
            s.address,
            "→",
            ethers.formatUnits(mxnbBalance, decimals) + " MXNB"
        )

        break

    }

}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})