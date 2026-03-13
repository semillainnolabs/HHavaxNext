// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title MockOracle
 * @notice Simple oracle that returns a fixed price for Morpho Blue integration
 * @dev
 * - Returns a constant price scaled by 1e36 (Morpho's required precision)
 *
 * Production oracle would use:
 * - Chainlink price feeds
 * - Uniswap TWAP
 * - Other decentralized price oracles
 */
contract MockOracle {
    /// @notice The fixed price returned by this oracle
    /// @dev Morpho requires price scaled by 1e36
    /// For our PoC: 1 USDC (6 decimals) = 17.6 MXNB (6 decimals)
    /// So price = 17.9 * 10^36 = 179 * 1e35
    uint256 private PRICE = 179 * 10**(6 - 6 + 35);

    function setPrice(uint256 p) external {
        PRICE = p;
    }

    /**
     * Formula for multi-decimal tokens:
     * price = price_in_usd * 10^(loan_decimals - collateral_decimals + 36)
     *
     * For decimals:
     * price = 17.9 * 10^(6 - 6 + 36) = 179 * 1e35
     */
    function price() external view returns (uint256) {
        return PRICE;
    }

    function priceView() external view returns (uint256) {
        return PRICE;
    }
}