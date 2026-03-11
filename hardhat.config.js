require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.20",
  networks: {
    hardhat: {
      chainId: 43114,
      forking: {
        url: process.env.AVAX_MAINNET_FORK_URL
      }
    }
  }
};
