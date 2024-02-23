// SPDX-License-Identifier: MIT
pragma solidity =0.8.23;

contract SwapRouter02Mock {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }
    
    uint256 private val;

    function exactInputSingle(ExactInputSingleParams memory params)
        external
        payable
        returns (uint256 amountOut)
    {
        val++;
    }
}
