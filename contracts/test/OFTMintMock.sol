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
    ) StreamerInuToken(_name,_symbol,_sharedDecimals,_lzEndpoint,_recipient){}

    function mint(address recipient, uint256 amount) external onlyOwner() {
        _mint(recipient,amount);
    }
}
