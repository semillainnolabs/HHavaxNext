import { ethers } from "ethers"

export function getProvider(){

 return new ethers.JsonRpcProvider(
  process.env.NEXT_PUBLIC_RPC,
  Number(process.env.NEXT_PUBLIC_CHAIN_ID)
 )

}
