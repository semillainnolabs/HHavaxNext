import hre from "hardhat"
import { ethers } from "hardhat"
import { ADDRESSES } from "../constants/addresses"

async function main() {

  const [user] = await ethers.getSigners()

  console.log("Setting up fork environment")
  console.log("User:", user.address)

  /*
  impersonate whale
  */

  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [ADDRESSES.USDC_WHALE]
  })

  const whale = await ethers.getSigner(
    ADDRESSES.USDC_WHALE
  )

  /*
  give whale gas
  */
  // 2) make sure whale has native balance to pay gas: set to 5 AVAX (in wei hex)
  const value = ethers.parseEther("5")
  await hre.network.provider.request({
    method: "hardhat_setBalance",
    params: [ADDRESSES.USDC_WHALE, ethers.toBeHex(value)],
  })
  /*await hre.network.provider.send(
    "hardhat_setBalance",
    [
      ADDRESSES.USDC_WHALE,
      "0x3635C9ADC5DEA00000"
    ]
  )*/

  const usdc = await ethers.getContractAt(
    [
      "function transfer(address,uint256) returns(bool)",
      "function balanceOf(address) view returns(uint256)",
      "function decimals() view returns(uint8)"
    ],
    ADDRESSES.USDC,
    whale
  )

  const decimals = await usdc.decimals()

  const amount = ethers.parseUnits(
    "10000",
    decimals
  )

  console.log("Funding user with USDC")

  const tx = await usdc.transfer(
    user.address,
    amount
  )

  await tx.wait()

  const balance = await usdc.balanceOf(
    user.address
  )

  console.log(
    "User USDC:",
    ethers.formatUnits(balance, decimals)
  )

}

main().catch(console.error)