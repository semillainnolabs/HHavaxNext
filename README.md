# HHavaxNext
Hardhat project running a forked Avalanche Mainnet interacting with a next.js app

## 1) Important constants / addresses (used in scripts & frontend)

* Aave PoolAddressesProvider (Avalanche V3): `0x2f39d218133afab8f2b819b1066c7e434ad94e9e` (we’ll read the Pool address from this provider on-chain). ([aave.com][1])
* USDC (Avalanche mainnet underlying): `0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E` (this is the canonical USDC address on Avalanche). ([snowtrace.io][2])

> We will not hardcode the Pool address — we’ll resolve it by calling the `PoolAddressesProvider` on the fork so the code works if Aave upgrades proxies. The provider address above is the official one for the Avalanche market. ([aave.com][1])

---

## 2) Aave Component
* The Aave component resolves the Pool address from the on-chain PoolAddressesProvider so it will be correct even if Aave uses proxies.
* Shows a status string for each step: resolving pool, approving, tx submitted, waiting for confirmation, confirmed, or error.
* Connect to MetaMask (make sure MetaMask is pointed to your local fork RPC, chainId `43114`).


---

## 3) Helper env var

Put this in `web/.env.local` (the deploy script writes addresses; add USDC address too):

```
NEXT_PUBLIC_RPC=http://127.0.0.1:8545
NEXT_PUBLIC_CHAIN_ID=43114
NEXT_PUBLIC_USDC_ADDRESS=0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E
```
---

## 4) Run order — step by step

1. Start Hardhat node (fork Avalanche mainnet):

```bash
npm run node:fork
```

**Deploy local contracts**

```bash
npx hardhat run scripts/deploy.ts --network localhost
```

**Get USDC and MXNB**

```bash
npm run fork:setup
```

**Check Initial Balances** 

```bash
npm run balances
```

2. 

3. **Running Morpho Borrow operations**

```bash
npx hardhat run scripts/morpho/deployOracle.ts --network localhost
npx hardhat run scripts/morpho/createMarket.ts --network localhost
npx hardhat run scripts/morpho/createVaultV2.ts --network localhost
npx hardhat run scripts/morpho/earnFlow.ts --network localhost -- deposit 100
```

```bash
npx hardhat run scripts/morpho/borrowFlow.ts --network localhost -- status
npx hardhat run scripts/morpho/borrowFlow.ts --network localhost -- supply-collateral 1000
npx hardhat run scripts/morpho/borrowFlow.ts --network localhost -- borrow 100
npx hardhat run scripts/morpho/borrowFlow.ts --network localhost -- repay 100
npx hardhat run scripts/morpho/borrowFlow.ts --network localhost -- withdraw-collateral 1000
```

**Impersonate a USDC whale and fund a local account** (pick a whale address that actually holds USDC on Avalanche mainnet — you can find top holders on Snowtrace):

```bash
# Example (replace with a real whale address and recipient)
npx hardhat run scripts/impersonateAndTransferUSDC.ts --network localhost -- 1000
```

* The script will impersonate `0xWhaleAddress`, top it with AVAX to pay gas, and transfer `1000` USDC to your local signer.

4. Start the frontend (inside `web/`):

```bash
cd web
npm run dev
```

5. In MetaMask:

   * Add custom RPC: `http://127.0.0.1:8545`, Chain ID `43114`, name `Avalanche Fork (Local)`.
   * Import the Hardhat private key for the account you used (Hardhat prints the private keys when the node starts).
   * Make sure the imported account is the recipient from step 3 (the one that received USDC).

6. On the frontend, open the Aave supply component, connect MetaMask, enter amount (e.g. `100`), click "Supply to Aave". Approve + supply confirmations will appear from MetaMask and status will be shown in the UI.

7. Check balances via script or UI:

```bash
npx hardhat run scripts/showBalances.ts --network localhost
```

Or use `scripts/aaveSupply.ts` and `aaveWithdraw.ts` to do the same programmatically from the Hardhat node (useful for automated tests).

---

## 5) Why this works on a fork

* The Hardhat fork gives you a live copy of mainnet contract code and storage at the fork block. The Aave Pool and PoolAddressesProvider contracts are present and will behave the same as mainnet for on-chain logic. ([aave.com][1])
* By impersonating a real USDC holder on mainnet, you can move real USDC balances on the fork to your test account. That’s the standard approach used by teams to test integrations with real liquidity and protocol state.

---

## 6) Security & caveats

* **Only run these scripts on your local fork** — `hardhat_impersonateAccount` and `hardhat_setBalance` will not work on public networks.
* Choose the whale address carefully (large exchange wallets often have many tokens and are safe to impersonate for tests). I didn’t embed a specific whale account to avoid recommending a stale address — I can point to a recent holder if you want.
* The frontend uses the injected wallet for signing. Make sure MetaMask is connected to the local RPC and the correct account.
* Aave Pool ABI and method signatures must match the deployed version; we used the canonical v3 ABIs (supply/withdraw) — resolving the Pool via the provider reduces risk of using a wrong Pool address.

---

## Sources

[1]: https://aave.com/docs/resources/addresses "Addresses Dashboard | Aave Protocol Documentation"
[2]: https://snowtrace.io/token/0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e?utm_source=chatgpt.com "Token Tracker - Snowtrace Multichain Blockchain Explorer"
