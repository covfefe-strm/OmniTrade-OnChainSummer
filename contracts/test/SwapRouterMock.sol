// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;
import {IV3SwapRouter} from "../interfaces/uniswap/IV3SwapRouter.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
contract SwapRouterMock is IV3SwapRouter {
    address public factory;
    uint256 public counter;
    function uniswapV3SwapCallback(
        int256 amount0Delta,
        int256 amount1Delta,
        bytes calldata data
    ) external{
        counter++;
    }

    function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut){
        IERC20(params.tokenIn).transferFrom(msg.sender, params.recipient, params.amountIn);
        amountOut = params.amountIn;
    }
    function exactInput(ExactInputParams calldata params) external payable returns (uint256 amountOut){
        counter++;
    }
    function exactOutputSingle(ExactOutputSingleParams calldata params) external payable returns (uint256 amountIn){
        counter++;
    }
    function exactOutput(ExactOutputParams calldata params) external payable returns (uint256 amountIn){
        counter++;
    }
}
