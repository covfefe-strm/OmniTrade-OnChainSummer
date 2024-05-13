// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;
import {INonfungiblePositionManager} from "./interfaces/uniswapV3/INonfungiblePositionManager.sol";
import {IMulticall} from "@uniswap/v3-periphery/contracts/interfaces/IMulticall.sol";
contract NonfungiblePositionManagerMock is IMulticall, INonfungiblePositionManager {
    uint256 public counter;
    function positions(
        uint256 tokenId
    )
        external
        view
        returns (
            uint96 nonce,
            address operator,
            address token0,
            address token1,
            uint24 fee,
            int24 tickLower,
            int24 tickUpper,
            uint128 liquidity,
            uint256 feeGrowthInside0LastX128,
            uint256 feeGrowthInside1LastX128,
            uint128 tokensOwed0,
            uint128 tokensOwed1
        )
    {}
    function multicall(bytes[] calldata data) public payable override returns (bytes[] memory results) {
        counter++;
    }
    
    function mint(
        MintParams calldata params
    )
        external
        payable
        returns (
            uint256 tokenId,
            uint128 liquidity,
            uint256 amount0,
            uint256 amount1
        )
    {
        counter++;
    }

    function increaseLiquidity(
        IncreaseLiquidityParams calldata params
    )
        external
        payable
        returns (uint128 liquidity, uint256 amount0, uint256 amount1)
    {
        counter++;
    }

    function decreaseLiquidity(
        DecreaseLiquidityParams calldata params
    ) external payable returns (uint256 amount0, uint256 amount1) {
        counter++;
    }

    function collect(
        CollectParams calldata params
    ) external payable returns (uint256 amount0, uint256 amount1) {
        counter++;
    }

    function burn(uint256 tokenId) external payable {
        counter++;
    }

    function createAndInitializePoolIfNecessary(
        address token0,
        address token1,
        uint24 fee,
        uint160 sqrtPriceX96
    ) external payable returns (address pool) {
        counter++;
    }

    function unwrapWETH9(
        uint256 amountMinimum,
        address recipient
    ) external payable {
        counter++;
    }

    function refundETH() external payable {
        counter++;
    }
    function sweepToken(
        address token,
        uint256 amountMinimum,
        address recipient
    ) external payable {
        counter++;
    }

    function factory() external view returns (address) {}

    /// @return Returns the address of WETH9
    function WETH9() external view returns (address) {}

    function PERMIT_TYPEHASH() external pure returns (bytes32) {}
    function DOMAIN_SEPARATOR() external view returns (bytes32) {}

    function permit(
        address spender,
        uint256 tokenId,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external payable {
        counter++;
    }

    function balanceOf(address owner) external view returns (uint256 balance) {}

    function ownerOf(uint256 tokenId) external view returns (address owner) {}

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes calldata data
    ) external {}

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) external {}

    function transferFrom(address from, address to, uint256 tokenId) external {}

    function approve(address to, uint256 tokenId) external {}

    function setApprovalForAll(address operator, bool approved) external {}

    function getApproved(
        uint256 tokenId
    ) external view returns (address operator) {}

    function isApprovedForAll(
        address owner,
        address operator
    ) external view returns (bool) {}

    function name() external view returns (string memory) {}

    function symbol() external view returns (string memory) {}

    function tokenURI(uint256 tokenId) external view returns (string memory) {}

    function totalSupply() external view returns (uint256) {}

    function tokenOfOwnerByIndex(
        address owner,
        uint256 index
    ) external view returns (uint256) {}

    function tokenByIndex(uint256 index) external view returns (uint256) {}

    function supportsInterface(
        bytes4 interfaceId
    ) external view returns (bool) {}
}
