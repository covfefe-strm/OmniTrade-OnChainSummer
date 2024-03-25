// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "@layerzerolabs/solidity-examples/contracts/token/oft/v2/OFTV2.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import {IStreamerInuToken} from "./interfaces/IStreamerInuToken.sol";

/// @title StreamerInu OFT token
contract StreamerInuToken is OFTV2, IStreamerInuToken {
    /// @dev Stores ID of Polygon network
    uint256 public constant MINT_CHAIN_ID = 137;
    /// @dev Uses for calculation of tax amount
    uint256 public constant PRECISION = 1 * 10 ** 18;
    /// @dev Stores max tax percent which equals 5%
    uint256 public constant MAX_TAX_PERCENT = 5 * 10 ** 16;
    /// @dev Stores address of Uniswap V3 Pool of SI and USDC tokens;
    address public siUsdcPair;
    /// @dev Stores fee of Uniswap V3 Pool of SI and USDC tokens;
    uint24 public pairFee;
    /// @dev Stores current tax percent, can be in range from 0% to 5%
    uint256 public taxPercent;
    /// @dev Stores address of taxes recipient, should me multisignature wallet
    address public taxRecipient;
    /// @dev address of Uniswap SwapRouter V3;
    address public uniswapRouter;
    /// @dev address of USDC token;
    address public usdc;
    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _sharedDecimals,
        address _lzEndpoint,
        address _recipient,
        address _uniswapRouter,
        address _usdc
    ) OFTV2(_name, _symbol, _sharedDecimals, _lzEndpoint) {
        if (_uniswapRouter == address(0) || _usdc == address(0)) {
            revert ZeroAddress();
        }
        if (getChainId() == MINT_CHAIN_ID) {
            if (_recipient == address(0)) {
                revert ZeroAddress();
            }
            _mint(_recipient, 1_500_000_000 ether);
        }
        uniswapRouter = _uniswapRouter;
        usdc = _usdc;
    }

    /// @notice Set new tax percent
    /// @dev only owner can call the function
    /// tax percent must be in range [0% - 5%]
    /// @param _taxPercent percent of tax
    function setPercent(uint256 _taxPercent) external onlyOwner {
        if (_taxPercent > MAX_TAX_PERCENT) {
            revert WrongTaxPercent();
        }
        taxPercent = _taxPercent;
        emit SetTaxPercent(_taxPercent);
    }
    /// @notice Set data of SI/USDC pair
    /// @dev only owner can call the function
    /// @param _pairAddress address of SI/USDC pair
    /// @param _fee pair's fee
    function setPair(address _pairAddress, uint24 _fee) external onlyOwner {
        if (_pairAddress == address(0)) {
            revert ZeroAddress();
        }
        if (_fee == 0) {
            revert ZeroValue();
        }
        siUsdcPair = _pairAddress;
        pairFee = _fee;
        emit SetPair(_pairAddress, _fee);
    }
    /// @notice Set new address of tax recipient
    /// @dev only owner can call the function
    /// @param _newRecipient new address of tax recipient
    function setTaxRecipient(address _newRecipient) external onlyOwner {
        if (_newRecipient == address(0)) {
            revert ZeroAddress();
        }
        taxRecipient = _newRecipient;
        emit SetTaxRecipient(_newRecipient);
    }

    /// @notice Set new address of tax recipient
    /// @dev only owner can call the function
    function getChainId() public view returns (uint256) {
        uint256 chainId;
        assembly {
            chainId := chainid()
        }
        return chainId;
    }

    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        if (from == siUsdcPair) {
            _transferWithTax(from, to, amount);
        } else {
            super._transfer(from, to, amount);
        }
    }

    function _transferWithTax(
        address from,
        address to,
        uint256 amount
    ) internal {
        uint256 tax = _getTaxAmount(amount);
        if (tax != 0) {
            _transfer(from, address(this), tax);
            _approve(address(this), uniswapRouter, tax);
            ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
                .ExactInputSingleParams(
                    address(this),
                    usdc,
                    pairFee,
                    taxRecipient,
                    block.timestamp + 60,
                    tax,
                    0,
                    0
                );
            ISwapRouter(uniswapRouter).exactInputSingle(params);
        }
        _transfer(from, to, amount - tax);
    }

    function _getTaxAmount(uint256 _amountIn) internal view returns (uint256) {
        uint256 percent = taxPercent;
        if (percent == 0) {
            return 0;
        } else {
            return (((_amountIn * percent * PRECISION) / PRECISION) /
                PRECISION);
        }
    }
}
