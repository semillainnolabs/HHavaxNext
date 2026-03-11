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
