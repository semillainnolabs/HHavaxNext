const hre = require("hardhat")
const fs = require("fs")

async function main(){

 const [deployer] = await hre.ethers.getSigners()

 console.log("Deploying with:", deployer.address)

 const Mock = await hre.ethers.getContractFactory("MockERC20")
 const mock = await Mock.deploy("Mock USDC","mUSDC")
 await mock.waitForDeployment()

 const mintAmount = hre.ethers.parseUnits("1000000",6)

 await mock.mint(deployer.address,mintAmount)

 const Vault = await hre.ethers.getContractFactory("SimpleVault")
 const vault = await Vault.deploy(mock.target)
 await vault.waitForDeployment()

 console.log("Token:",mock.target)
 console.log("Vault:",vault.target)

 const env = `
NEXT_PUBLIC_RPC=http://127.0.0.1:8545
NEXT_PUBLIC_CHAIN_ID=43114
NEXT_PUBLIC_TOKEN=${mock.target}
NEXT_PUBLIC_VAULT=${vault.target}
`

 fs.writeFileSync("./web/.env.local",env)

}

main()
