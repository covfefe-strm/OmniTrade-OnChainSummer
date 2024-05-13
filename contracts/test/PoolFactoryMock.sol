// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;
import {IUniswapV3Factory} from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
contract PoolFactoryMock is IUniswapV3Factory {
    uint256 public counter;
    

    function createPool(
        address tokenA,
        address tokenB,
        uint24 fee
    ) external returns (address pool){
        counter++;
    }

    function setOwner(address _owner) external{
        counter++;
    }

    function enableFeeAmount(uint24 fee, int24 tickSpacing) external{
        counter++;
    }

    function owner() external view returns (address){}

    function feeAmountTickSpacing(uint24 fee) external view returns (int24){}

    function getPool(
        address tokenA,
        address tokenB,
        uint24 fee
    ) external view returns (address pool){}
}