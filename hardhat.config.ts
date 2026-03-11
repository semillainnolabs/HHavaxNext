import { HardhatUserConfig } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"
import * as dotenv from "dotenv"

dotenv.config()

const config: HardhatUserConfig = {

  solidity: "0.8.20",

  networks: {
    hardhat: {
      chainId: 43114,
      forking: {
        url: process.env.AVAX_MAINNET_FORK_URL || ""
      }
    }
  }

}

export default config