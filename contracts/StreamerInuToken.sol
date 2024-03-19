// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "@layerzerolabs/solidity-examples/contracts/token/oft/v2/OFTV2.sol";

contract StreamerInuToken is OFTV2 {
  uint256 public constant MINT_CHAIN_ID = 137;
  error ZeroAddress();
  constructor(
    string memory _name,
    string memory _symbol,
    uint8 _sharedDecimals,
    address _lzEndpoint,
    address _recipient
  ) OFTV2(_name, _symbol, _sharedDecimals, _lzEndpoint) {
    if(getChainId() == MINT_CHAIN_ID){
      if(_recipient == address(0)){
        revert ZeroAddress();
      }
      _mint(_recipient, 1_500_000_000 ether);
    }
  }

  function getChainId() public view returns(uint256){
    uint256 chainId;
    assembly {
        chainId := chainid()
    }
    return chainId;
  }
}
