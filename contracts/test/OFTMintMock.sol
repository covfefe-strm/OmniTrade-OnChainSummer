// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;
import {StreamerInuToken} from "../StreamerInuToken.sol";

contract OFTMintMock is StreamerInuToken {
    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _sharedDecimals,
        address _lzEndpoint,
        address _recipient
    ) StreamerInuToken(_name,_symbol,_sharedDecimals,_lzEndpoint,_recipient){
        _mint(_recipient,1_000_000 ether);
    }

    function mint(address recipient, uint256 amount) external onlyOwner() {
        _mint(recipient,amount);
    }
}
