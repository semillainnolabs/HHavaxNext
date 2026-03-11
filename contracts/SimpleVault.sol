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
