// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "@layerzerolabs/solidity-examples/contracts/token/oft/v2/OFTV2.sol";

contract MyOFT is OFTV2 {
  constructor(
    string memory _name,
    string memory _symbol,
    uint8 _sharedDecimals,
    address _lzEndpoint
  ) OFTV2(_name, _symbol, _sharedDecimals, _lzEndpoint) {
    _mint(_msgSender(), 1 ether * 10 ** _sharedDecimals);
  }

  function mint(address recipient, uint256 amount) public onlyOwner {
    require(recipient != address(0), "Must not be zero address");
    require(amount > 0, "Zero amount");
    _mint(recipient, amount);
  }
}
