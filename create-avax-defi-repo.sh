#!/bin/bash

set -e

PROJECT="avax-fork-next"

echo "Creating project $PROJECT"

mkdir $PROJECT
cd $PROJECT

mkdir -p contracts scripts web/src/app web/src/components web/src/lib

#################################
# ROOT FILES
#################################

cat <<EOF > .env
AVAX_MAINNET_FORK_URL=https://api.avax.network/ext/bc/C/rpc
EOF


cat <<EOF > package.json
{
  "name": "avax-fork-next",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "node:fork": "hardhat node --hostname 127.0.0.1 --port 8545",
    "deploy:fork": "node scripts/deploy.js",
    "start:web": "cd web && npm run dev",
    "dev": "concurrently \\"npm:node:fork\\" \\"npm:start:web\\""
  },
  "devDependencies": {
    "@nomicfoundation/hardhat-toolbox": "^4.0.0",
    "concurrently": "^8.2.0",
    "dotenv": "^16.3.1",
    "hardhat": "^2.18.0"
  },
  "dependencies": {
    "@openzeppelin/contracts": "^4.9.3",
    "ethers": "^6.9.0"
  }
}
EOF


cat <<EOF > hardhat.config.js
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
EOF

#################################
# CONTRACTS
#################################

cat <<EOF > contracts/MockERC20.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockERC20 is ERC20, Ownable {

    constructor(string memory name, string memory symbol)
        ERC20(name, symbol)
    {}

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
EOF


cat <<EOF > contracts/SimpleVault.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SimpleVault is ERC20 {

    IERC20 public asset;

    constructor(IERC20 _asset)
        ERC20("Vault Share Token","vSHARE")
    {
        asset = _asset;
    }

    function totalAssets() public view returns (uint256) {
        return asset.balanceOf(address(this));
    }

    function deposit(uint256 assets) external {

        uint256 supply = totalSupply();

        asset.transferFrom(msg.sender,address(this),assets);

        uint256 shares;

        if(supply == 0){
            shares = assets;
        } else {
            shares = (assets * supply) / totalAssets();
        }

        _mint(msg.sender, shares);
    }

    function withdraw(uint256 shares) external {

        uint256 supply = totalSupply();
        uint256 assets = (shares * totalAssets()) / supply;

        _burn(msg.sender, shares);

        asset.transfer(msg.sender, assets);
    }
}
EOF

#################################
# DEPLOY SCRIPT
#################################

cat <<EOF > scripts/deploy.js
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

 const env = \`
NEXT_PUBLIC_RPC=http://127.0.0.1:8545
NEXT_PUBLIC_CHAIN_ID=43114
NEXT_PUBLIC_TOKEN=\${mock.target}
NEXT_PUBLIC_VAULT=\${vault.target}
\`

 fs.writeFileSync("./web/.env.local",env)

}

main()
EOF

#################################
# FRONTEND
#################################

cat <<EOF > web/package.json
{
 "name": "web",
 "private": true,
 "scripts": {
  "dev": "next dev"
 },
 "dependencies": {
  "next": "^16.0.0",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "ethers": "^6.9.0"
 },
 "devDependencies": {
  "typescript": "^5.6.0"
 }
}
EOF


cat <<EOF > web/tsconfig.json
{
 "compilerOptions": {
  "target": "ES2022",
  "module": "ESNext",
  "lib": ["DOM","ESNext"],
  "jsx": "react-jsx",
  "moduleResolution": "Node",
  "resolveJsonModule": true
 },
 "include": ["src"]
}
EOF


cat <<EOF > web/next.config.mjs
const nextConfig = { experimental:{ appDir:true } }
export default nextConfig
EOF


#################################
# PROVIDER
#################################

cat <<EOF > web/src/lib/provider.ts
import { ethers } from "ethers"

export function getProvider(){

 return new ethers.JsonRpcProvider(
  process.env.NEXT_PUBLIC_RPC,
  Number(process.env.NEXT_PUBLIC_CHAIN_ID)
 )

}
EOF


#################################
# VAULT UI
#################################

cat <<EOF > web/src/components/VaultUI.tsx
"use client"

import { useState } from "react"
import { ethers } from "ethers"

const ERC20 = [
"function balanceOf(address) view returns(uint256)",
"function approve(address,uint256)"
]

const VAULT = [
"function deposit(uint256)",
"function withdraw(uint256)"
]

export default function VaultUI(){

 const [amount,setAmount] = useState("100")

 async function connect(){

  const provider = new ethers.BrowserProvider(window.ethereum)

  const signer = await provider.getSigner()

  const token = new ethers.Contract(
   process.env.NEXT_PUBLIC_TOKEN,
   ERC20,
   signer
  )

  const vault = new ethers.Contract(
   process.env.NEXT_PUBLIC_VAULT,
   VAULT,
   signer
  )

  const value = ethers.parseUnits(amount,6)

  await token.approve(vault.target,value)

  await vault.deposit(value)

 }

 return (

  <div style={{padding:40}}>

   <h1>Simple DeFi Vault</h1>

   <input
    value={amount}
    onChange={(e)=>setAmount(e.target.value)}
   />

   <button onClick={connect}>
    Deposit
   </button>

  </div>

 )

}
EOF


#################################
# APP PAGE
#################################

cat <<EOF > web/src/app/page.tsx
import VaultUI from "../components/VaultUI"

export default function Page(){
 return <VaultUI/>
}
EOF


#################################
# INSTALL DEPENDENCIES
#################################

echo "Installing root dependencies..."
npm install

echo "Installing frontend dependencies..."
cd web
npm install
cd ..

echo ""
echo "Project created successfully."
echo ""
echo "Run the following:"
echo ""
echo "1) Start fork:"
echo "npm run node:fork"
echo ""
echo "2) Deploy contracts:"
echo "node scripts/deploy.js"
echo ""
echo "3) Start frontend:"
echo "cd web && npm run dev"
echo ""