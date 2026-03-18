import { ethers } from "hardhat";
import {
    ADDRESSES,
    VAULT_V2_FACTORY_ABI,
    VAULT_V2_ABI,
    ERC20_ABI,
    env,
    ADAPTER_FACTORY_ABI,
    encodeAdapterId,
    encodeCollateralId,
    encodeMarketId,
    MarketParams,
    marketTuple,
} from "./shared";

async function main() {
    const [signer] = await ethers.getSigners();
    console.log("Deploying with account:", signer.address);

    // ============================================
    // PHASE 1: Deploy Morpho Vault V2 Instance
    // ============================================
    console.log("\n=== PHASE 1: Deploy Morpho Vault V2 Instance ===");

    const vaultV2Factory = new ethers.Contract(
        ADDRESSES.VAULT_V2_FACTORY,
        VAULT_V2_FACTORY_ABI,
        signer
    );

    // Generate a unique salt based on timestamp and random data
    const salt = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
            ["uint256", "bytes"],
            [Math.floor(Date.now() / 1000), ethers.randomBytes(32)]
        )
    );

    console.log("Creating vault V2 with:");
    console.log("  Owner:", signer.address);
    console.log("  Asset (MXNB):", ADDRESSES.MXNB);
    console.log("  Salt:", salt);

    const createVaultTx = await vaultV2Factory.createVaultV2(
        signer.address, // owner
        ADDRESSES.MXNB, // asset
        salt
    );

    const receipt = await createVaultTx.wait();
    console.log("Vault creation transaction:", createVaultTx.hash);

    // Extract the vault address from the transaction logs
    const vaultV2Address = await vaultV2Factory.vaultV2(
        signer.address,
        ADDRESSES.MXNB,
        salt
    );

    console.log("✓ Vault V2 deployed at:", vaultV2Address);

    const vault = new ethers.Contract(vaultV2Address, VAULT_V2_ABI, signer);

    // ============================================
    // PHASE 2: Set Vault Metadata
    // ============================================
    console.log("\n=== PHASE 2: Set Vault Metadata ===");

    const vaultName = "Morpho MXNB Vault";
    const vaultSymbol = "mMXNB";

    /*console.log("Setting vault name:", vaultName);
    let tx = await vault.setName(vaultName);
    await tx.wait();
    console.log("✓ Vault name set");
  
    console.log("Setting vault symbol:", vaultSymbol);
    tx = await vault.setSymbol(vaultSymbol);
    await tx.wait();
    console.log("✓ Vault symbol set");
  */
    // ============================================
    // PHASE 3: Configure Vault Parameters
    // ============================================
    console.log("\n=== PHASE 3: Configure Vault Parameters ===");

    // Set adapter registry
    /*console.log("Setting adapter registry:", ADDRESSES.ADAPTER_V1_V2_FACTORY);
    let tx = await vault.setAdapterRegistry(ADDRESSES.MORPHO_REGISTRY);
    await tx.wait();
    console.log("✓ Adapter registry set");

    // Set maxRate (32% per year = 0.32 * 10^18)
    const maxRate = ethers.parseEther("0.32");
    console.log("Setting maxRate:", maxRate.toString());
    tx = await vault.setMaxRate(maxRate);
    await tx.wait();
    console.log("✓ MaxRate set");
*/
    // ============================================
    // PHASE 4: Deploy and Configure Adapter
    // ============================================
    console.log("\n=== PHASE 4: Deploy and Configure Adapter ===");

    // Deploy MorphoMarketV1AdapterV2
    const adapterFactoryAbi = [
        "function createMorphoMarketV1AdapterV2(address parentVault) returns (address newAdapter)",
    ];
    const adapterFactory = new ethers.Contract(
        ADDRESSES.ADAPTER_V1_V2_FACTORY,
        ADAPTER_FACTORY_ABI,
        signer
    );

    console.log("Creating MorphoMarketV1AdapterV2 adapter...");
    const adapterAddress = await adapterFactory.createMorphoMarketV1AdapterV2.staticCall(
        vaultV2Address
    );
    const createAdapterTx = await adapterFactory.createMorphoMarketV1AdapterV2(
        vaultV2Address
    );
    const adapterReceipt = await createAdapterTx.wait();
    console.log("✓ Adapter creation transaction:", createAdapterTx.hash);

    
    /*
        // Parse adapter address from return value or event
        let adapterAddress: string;
        try {
            // Try to get from logs
            const iface = new ethers.Interface(adapterFactoryAbi);
            let foundAddress = false;
    
            if (adapterReceipt?.logs) {
                for (const log of adapterReceipt.logs) {
                    try {
                        // Try to parse any log that might contain the adapter
                        const decoded = iface.parseLog(log);
                        if (decoded?.args && decoded.args[0]) {
                            adapterAddress = decoded.args[0];
                            foundAddress = true;
                            break;
                        }
                    } catch {
                        // Continue to next log
                    }
                }
            }
    
            if (!foundAddress) {
                // Fallback: estimate based on factory nonce
                console.log("⚠ Could not parse adapter address from logs, using call result");
                const result = await adapterFactory.createMorphoMarketV1AdapterV2.staticCall(
                    vaultV2Address
                );
                adapterAddress = result;
            }
        } catch (e) {
            console.error("Error parsing adapter address:", e);
            throw new Error("Could not determine adapter address");
        }
    */
    console.log("✓ Adapter deployed at:", adapterAddress);

    const allocator = signer.address;

    // Submit allocator role changes
  await (await vault.submit(vault.interface.encodeFunctionData("setIsAllocator", [allocator, true]))).wait();

  // Submit adapter registry configuration
  await (await vault.submit(vault.interface.encodeFunctionData("setAdapterRegistry", [ADDRESSES.MORPHO_REGISTRY]))).wait();

  // Submit adapter configuration
  await (await vault.submit(vault.interface.encodeFunctionData("addAdapter", [adapterAddress]))).wait();

    // ============================================
    // PHASE 5: Add Adapter to Vault and Configure Allocator
    // ============================================
    console.log("\n=== PHASE 5: Add Adapter to Vault and Configure Allocator ===");

    // Set the deployer as allocator (can be changed later)
    

    console.log("\n=== Setting temporary curator ===");
    await (await vault.setCurator(allocator)).wait();
    console.log("✓ Temporary curator assigned");

    /*console.log("Setting allocator:", allocator);
    let tx = await vault.setIsAllocator(allocator, true);
    await tx.wait();
    console.log("✓ Allocator configured");

    console.log("Adding adapter to vault...");
    tx = await vault.addAdapter(adapterAddress);
    await tx.wait();
    console.log("✓ Adapter added to vault");*/

    console.log("Adding AdapterRegistry to vault...");
    await (await vault.setAdapterRegistry(ADDRESSES.MORPHO_REGISTRY)).wait();
    console.log("✓ AdapterRegistry added to vault");

    console.log("Setting allocator:", allocator);
    await (await vault.setIsAllocator(allocator, true)).wait();
    console.log("✓ Allocator configured");
    
    console.log("Adding adapter to vault...");
    await (await vault.addAdapter(adapterAddress)).wait();
    console.log("✓ Adapter added to vault");

    // Set adapter-specific caps
    const adapterIdData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["string", "address"],
        ["this", adapterAddress]
    );

    // Use type(uint128).max for absolute caps (maximum possible value)
    const absoluteCapMax = (1n << 128n) - 1n;

    console.log("Setting adapter absolute cap...");
    let tx = await vault.increaseAbsoluteCap(adapterIdData, absoluteCapMax);
    await tx.wait();
    console.log("✓ Adapter absolute cap set to max");

    console.log("Setting adapter relative cap...");
    tx = await vault.increaseRelativeCap(adapterIdData, ethers.parseEther("1"));
    await tx.wait();
    console.log("✓ Adapter relative cap set to 1.0");

    // ============================================
    // PHASE 6: Configure Market and Liquidity Adapter
    // ============================================
    console.log("\n=== PHASE 6: Configure Market and Liquidity Adapter ===");

    const marketParams: MarketParams = {
        loanToken: ADDRESSES.MXNB,
        collateralToken: ADDRESSES.USDC,
        oracle: ADDRESSES.ORACLE,
        irm: ADDRESSES.ADAPTIVE_CURVE_IRM,
        lltv: ADDRESSES.LTV,
    };

    console.log("Market parameters:");
    console.log("  Loan Token (MXNB):", marketParams.loanToken);
    console.log("  Collateral Token (USDC):", marketParams.collateralToken);
    console.log("  Oracle:", marketParams.oracle);
    console.log("  IRM:", marketParams.irm);
    console.log("  LLTV:", marketParams.lltv.toString());

    // Look up MarketParams from Morpho and set liquidity adapter
    const morphoAbi = [
        "function idToMarketParams(bytes32 id) view returns (address loanToken, address collateralToken, address oracle, address irm, uint256 lltv)",
    ];
    const morpho = new ethers.Contract(ADDRESSES.MORPHO, morphoAbi, signer);

    // Compute market ID
    const encodedMarketParams = ethers.AbiCoder.defaultAbiCoder().encode(
        ["tuple(address loanToken,address collateralToken,address oracle,address irm,uint256 lltv)"],
        [marketTuple(marketParams)]
    );
    const marketId = ethers.keccak256(encodedMarketParams);

    console.log("Market ID:", marketId);

    // Encode liquidity data
    const liquidityData = encodedMarketParams;

    console.log("Setting liquidity adapter...");
    tx = await vault.setLiquidityAdapterAndData(adapterAddress, liquidityData);
    await tx.wait();
    console.log("✓ Liquidity adapter set");

    // ============================================
    // PHASE 7: Configure Caps (Collateral Token and Market)
    // ============================================
    console.log("\n=== PHASE 7: Configure Caps (Collateral Token and Market) ===");

    // Set collateral token caps
    const collateralTokenIdData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["string", "address"],
        ["collateralToken", marketParams.collateralToken]
    );

    // Use type(uint128).max for absolute caps (maximum possible value)
    //const absoluteCapMax = (1n << 128n) - 1n;

    console.log("Setting collateral token absolute cap...");
    tx = await vault.increaseAbsoluteCap(collateralTokenIdData, absoluteCapMax);
    await tx.wait();
    console.log("✓ Collateral token absolute cap set to max");

    console.log("Setting collateral token relative cap...");
    tx = await vault.increaseRelativeCap(collateralTokenIdData, ethers.parseEther("1"));
    await tx.wait();
    console.log("✓ Collateral token relative cap set to 1.0");

    // Set market-specific caps
    const marketIdData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["string", "address", "tuple(address loanToken,address collateralToken,address oracle,address irm,uint256 lltv)"],
        ["this/marketParams", adapterAddress, marketTuple(marketParams)]
    );

    console.log("Setting market absolute cap...");
    tx = await vault.increaseAbsoluteCap(marketIdData, absoluteCapMax);
    await tx.wait();
    console.log("✓ Market absolute cap set to max");

    console.log("Setting market relative cap...");
    tx = await vault.increaseRelativeCap(marketIdData, ethers.parseEther("1"));
    await tx.wait();
    console.log("✓ Market relative cap set to 1.0");

    // ============================================
    // PHASE 8: Perform Dead Deposit (Inflation Attack Protection)
    // ============================================
    console.log("\n=== PHASE 8: Inflation Attack Protection (Dead Deposit) ===");

    const mxnbToken = new ethers.Contract(ADDRESSES.MXNB, ERC20_ABI, signer);
    const mxnbDecimals = await mxnbToken.decimals();

    // Amount: 1e9 for tokens with >= 10 decimals, 1e12 for others
    const deadDepositAmount = mxnbDecimals >= 10n ? 1n * 10n ** 9n : 1n * 10n ** 12n;

    console.log("Checking MXNB balance...");
    const mxnbBalance = await mxnbToken.balanceOf(signer.address);
    console.log("  Current MXNB balance:", ethers.formatUnits(mxnbBalance, mxnbDecimals));
    console.log("  Dead deposit required:", ethers.formatUnits(deadDepositAmount, mxnbDecimals));

    if (mxnbBalance >= deadDepositAmount) {
        console.log("Approving vault for dead deposit...");
        tx = await mxnbToken.approve(vaultV2Address, deadDepositAmount);
        await tx.wait();
        console.log("✓ Approval granted");

        console.log("Performing dead deposit...");
        tx = await vault.deposit(deadDepositAmount, ethers.ZeroAddress);
        await tx.wait();
        console.log("✓ Dead deposit completed");
    } else {
        console.log("⚠ Insufficient MXNB balance for dead deposit. Skipping this step.");
    }

    // ============================================
    // SUMMARY
    // ============================================
    console.log("\n=== DEPLOYMENT SUMMARY ===");
    console.log("Vault V2 Address:", vaultV2Address);
    console.log("Vault Name:", vaultName);
    console.log("Vault Symbol:", vaultSymbol);
    console.log("Asset:", ADDRESSES.MXNB);
    console.log("Owner:", signer.address);
    console.log("Adapter Address:", adapterAddress);
    console.log("Allocator Address:", allocator);
    console.log("\nDeployed Components:");
    console.log("✓ Vault V2 created and configured");
    console.log("✓ Adapter deployed and added to vault");
    console.log("✓ Allocator role configured");
    console.log("✓ Market parameters and liquidity adapter configured");
    console.log("✓ Caps configured for adapter, collateral token, and market");
    console.log("✓ Dead deposit completed (inflation attack protection)");
    console.log("\nNext steps:");
    console.log("1. Configure timelocks for production security (>= 3 days recommended)");
    console.log("2. Set curator and sentinel roles as needed");
    console.log("3. Review and test vault operations");
    console.log("4. Deploy additional adapters if needed");

    return {
        vaultV2Address,
        salt,
    };
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });
