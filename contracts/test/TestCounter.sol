// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

contract TestCounter {
  address public owner;
  uint256 public counter;
  address public squidMulticall;
  constructor() {
    owner = msg.sender;
  }
  function setSquidRouterMultCallAddress(address sqd) public {
    require(owner == msg.sender, "Not Owner");
    squidMulticall = sqd;
  }

  function incCounter() public {
    require(squidMulticall == msg.sender, "Not Squid Multicall");
    counter++;
  }
}
