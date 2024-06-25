// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;
import { OFT } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/OFT.sol";

contract OFTV2Mock is OFT {
    constructor(
        string memory _name,
        string memory _symbol,
        address _lzEndpoint,
        address _delegate
    ) OFT(_name, _symbol, _lzEndpoint, _delegate) {
        transferOwnership(_delegate);
        _mint(_delegate,1_000_000 ether);
    }

}