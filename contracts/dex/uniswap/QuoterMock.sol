// SPDX-License-Identifier: MIT
pragma solidity =0.8.23;

contract QuoterMock {
    uint256 private val;

    function quoteExactInput(
        bytes memory path,
        uint256 amountIn
    ) external returns (uint256 amountOut) {
        val++;
    }

    function quoteExactOutput(
        bytes memory path,
        uint256 amountOut
    ) external returns (uint256 amountIn) {
        val++;
    }

    function quoteExactOutputSingle(
        address tokenIn,
        address tokenOut,
        uint24 fee,
        uint256 amountOut,
        uint160 sqrtPriceLimitX96
    ) public returns (uint256 amountIn) {
        val++;
    }

    function quoteExactInputSingle(
        address tokenIn,
        address tokenOut,
        uint24 fee,
        uint256 amountIn,
        uint160 sqrtPriceLimitX96
    ) public returns (uint256 amountOut) {
        val++;
    }
}
