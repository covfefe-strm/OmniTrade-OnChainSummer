// SPDX-License-Identifier: MIT
pragma solidity =0.8.23;

contract QuoterMock {
    uint256 private val;

    function quoteExactInput(bytes memory path, uint256 amountIn) external returns (uint256 amountOut) {
        val++;
    }
}
