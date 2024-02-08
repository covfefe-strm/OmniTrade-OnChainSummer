// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { FixedOFTV2 } from "./FixedOFTV2.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyOFT is FixedOFTV2 {
    uint256 public someRandVariable;
    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _sharedDecimals,
        address _lzEndpoint
    ) FixedOFTV2 (_name, _symbol,_sharedDecimals,_lzEndpoint) {
        _mint(_msgSender(), 100 * 10**_sharedDecimals);
        someRandVariable = 1000;
    }
}