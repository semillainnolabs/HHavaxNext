// web/src/components/AaveSupply.tsx
"use client";

import React, { useEffect, useState } from "react";
import { ethers } from "ethers";

const POOL_ADDRESSES_PROVIDER = (process.env.NEXT_PUBLIC_AAVE_POOL_ADDRS_PROVIDER || "0x2f39d218133afab8f2b819b1066c7e434ad94e9e").toLowerCase();
const USDC_ADDR = (process.env.NEXT_PUBLIC_USDC_ADDRESS || "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E").toLowerCase();

export default function AaveSupply() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [amount, setAmount] = useState<string>("100");

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      const p = new ethers.BrowserProvider((window as any).ethereum);
      setProvider(p);
    }
  }, []);

  async function connectWallet() {
    if (!provider) return alert("No injected wallet.");
    await (provider as any).send("eth_requestAccounts", []);
    const s = await provider.getSigner();
    const address = await s.getAddress();
    setSigner(s as any);
    setAccount(address);
  }

  async function resolvePoolAddress(): Promise<string> {
    // try getPool(), fallback to getAddress(keccak256("POOL"))
    const providerRead = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC || "http://127.0.0.1:8545");
    const providerContract = new ethers.Contract(
      POOL_ADDRESSES_PROVIDER,
      ["function getPool() view returns (address)", "function getAddress(bytes32 id) view returns (address)"],
      providerRead
    );
    try {
      const pool = await providerContract.getPool();
      return pool;
    } catch {
      const id = ethers.id("POOL");
      const pool = await providerContract.getAddress(id);
      return pool;
    }
  }

  async function supply() {
    if (!signer) return alert("Connect wallet first");
    setStatus("Resolving pool...");
    try {
      const poolAddr = await resolvePoolAddress();
      setStatus(`Pool: ${poolAddr}`);

      const usdc = new ethers.Contract(USDC_ADDR, ["function approve(address,uint256) returns (bool)", "function decimals() view returns (uint8)", "function balanceOf(address) view returns (uint256)"], signer);
      const decimals = (await usdc.decimals()).toString() ? Number(await usdc.decimals()) : 6;
      const amt = ethers.parseUnits(amount || "0", decimals);

      setStatus("Approving pool to spend USDC...");
      const approveTx = await usdc.approve(poolAddr, amt);
      setStatus("Waiting for approve confirmation...");
      await approveTx.wait();

      setStatus("Calling pool.supply(...)");
      const pool = new ethers.Contract(poolAddr, ["function supply(address,uint256,address,uint16)"], signer);
      const tx = await pool.supply(USDC_ADDR, amt, account, 0);
      setStatus("Transaction submitted. Waiting for confirmation...");
      await tx.wait();
      setStatus("Supply confirmed ✅");
    } catch (e: any) {
      console.error(e);
      setStatus("Error: " + (e?.message || e?.toString()));
    }
  }

  async function withdraw() {
    if (!signer) return alert("Connect wallet first");
    setStatus("Resolving pool...");
    try {
      const poolAddr = await resolvePoolAddress();
      const pool = new ethers.Contract(poolAddr, ["function withdraw(address,uint256,address) returns (uint256)"], signer);
      const usdc = new ethers.Contract(USDC_ADDR, ["function decimals() view returns (uint8)"], signer);
      const decimals = Number(await usdc.decimals());
      const amt = ethers.parseUnits(amount || "0", decimals);

      setStatus("Calling pool.withdraw(...)");
      const tx = await pool.withdraw(USDC_ADDR, amt, account);
      setStatus("Waiting for withdrawal confirmation...");
      await tx.wait();
      setStatus("Withdraw confirmed ✅");
    } catch (e: any) {
      console.error(e);
      setStatus("Error: " + (e?.message || e?.toString()));
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Aave V3 supply (Avalanche fork)</h2>
      <div>Provider RPC: {process.env.NEXT_PUBLIC_RPC}</div>
      <div>USDC: {USDC_ADDR}</div>
      <div style={{ marginTop: 12 }}>
        {!account ? <button onClick={connectWallet}>Connect MetaMask</button> : <div>Connected: {account}</div>}
      </div>

      <div style={{ marginTop: 12 }}>
        <label>Amount (USDC): </label>
        <input value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>

      <div style={{ marginTop: 12 }}>
        <button onClick={supply}>Supply to Aave</button>
        <button onClick={withdraw} style={{ marginLeft: 8 }}>
          Withdraw from Aave
        </button>
      </div>

      <div style={{ marginTop: 12 }}>
        <strong>Status:</strong> {status}
      </div>
    </div>
  );
}