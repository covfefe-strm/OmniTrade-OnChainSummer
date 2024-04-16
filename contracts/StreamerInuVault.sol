// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ISwapRouter} from "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import {IStreamerInuVault} from "./interfaces/IStreamerInuVault.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
/// @title StreamerInu Vault
contract StreamerInuVault is IStreamerInuVault, IERC165, Ownable {
    /// @dev Stores STRM balance which describe reserved tokens for swap
    uint256 public lastSiBalance;
    /// @dev Stores address of STRM token
    address public si;
    /// @dev Stores address of StreamerInuRouter contract
    address public siRouter;
    /// @dev Stores address of USDC token
    address public usdc;
    /// @dev Stores fee of SI/USDC pool
    uint24 public siUsdcPairFee;
    /// @dev Stores address of Uniswap Swap Router V3
    ISwapRouter public swapRouterV3;
    constructor(address _si, address _usdc,address _siRouter, uint24 _fee, address _swapRouter) {
        if (
            _si == address(0) ||
            _siRouter == address(0) ||
            _usdc == address(0) ||
            _swapRouter == address(0)
        ) {
            revert ZeroAddress();
        }
        if (_fee == 0) {
            revert ZeroValue();
        }
        si = _si;
        siRouter = _siRouter;
        usdc = _usdc;
        swapRouterV3 = ISwapRouter(_swapRouter);
        siUsdcPairFee = _fee;
    }
    /// @notice Update amount of reserved STRM tokens for swap
    /// @dev only STRM token can call the function
    /// @param _amount amount of received STRM tokens
    function receiveTax(uint256 _amount) external {
        if (_msgSender() != si && _msgSender() != siRouter) {
            revert AccessDenied();
        }
        lastSiBalance += _amount;
        emit UpdatedTaxAmount(_amount);
    }

    /// @notice Swap reserved STRM tokens to USDC and transfer them to recipient
    /// @dev only owner can call the function
    /// @param _amount amount of STRM tokens to swap
    /// 0 - all available STRM tokens
    /// if amount is greater then available amount, revert with error "NotEnoughBalance"
    /// @param _recipient address of USDC recipient
    /// @param _amountOutMin minimum amount of USDC tokens after swap 
    function sellSi(
        uint256 _amount,
        address _recipient,
        uint256 _amountOutMin
    ) external onlyOwner{
        IERC20 siToken = IERC20(si);
        if (_amount == 0) {
            _amount = lastSiBalance;
        } else if (_amount > lastSiBalance) {
            revert NotEnoughBalance();
        }
        siToken.approve(address(swapRouterV3), _amount);
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
            .ExactInputSingleParams(
                address(siToken),
                usdc,
                siUsdcPairFee,
                _recipient,
                block.timestamp + 60,
                _amount,
                _amountOutMin,
                0
            );
        swapRouterV3.exactInputSingle(params);
        lastSiBalance-=_amount;
    }

    /// @notice Admin function in case then some one transfer ERC20 token to the contract
    /// @dev only owner can call the function
    /// if _token equals to STRM token, makes check for reservedAmount and current balance
    /// if _amount > currentBalance - reservedTokens, then revert with error "NotEnoughBalance"
    /// @param _token address of token to withdraw
    /// @param _recipient address of tokens recipient
    /// @param _amount amount to withdraw
    function withdrawUnexpectedTokens(address _token,address _recipient, uint256 _amount) external onlyOwner(){
        if(_token == address(0) || _recipient == address(0)){
            revert ZeroAddress();
        }
        if(_amount == 0){
            revert ZeroValue();
        }
        IERC20 token = IERC20(_token);
        uint256 currentBalance = token.balanceOf(address(this));
        if(_token == si){
            if(_amount > (currentBalance - lastSiBalance)){
                revert NotEnoughBalance();
            }
        }
        token.transfer(_recipient, _amount);
    }
    
    /// @inheritdoc IERC165
    function supportsInterface(bytes4 interfaceId) public pure override returns (bool) {
        return interfaceId == type(IERC165).interfaceId || interfaceId == type(IStreamerInuVault).interfaceId;
    }
}
