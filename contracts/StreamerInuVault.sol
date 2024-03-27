// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ISwapRouter} from "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import {IStreamerInuVault} from "./interfaces/IStreamerInuVault.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
/// @title StreamerInu Vault
contract StreamerInuVault is IStreamerInuVault, IERC165, Ownable {
    uint256 public lastSiBalance;
    address public si;
    address public usdc;
    uint24 public siUsdcPairFee;
    ISwapRouter public swapRouterV3;

    modifier onlySIToken() {
        if (_msgSender() != si) {
            revert NotSIToken();
        }
        _;
    }
    constructor(address _si, address _usdc, uint24 _fee, address _swapRouter) {
        if (
            _si == address(0) ||
            _usdc == address(0) ||
            _swapRouter == address(0)
        ) {
            revert ZeroAddress();
        }
        if (_fee == 0) {
            revert ZeroValue();
        }
        si = _si;
        usdc = _usdc;
        swapRouterV3 = ISwapRouter(_swapRouter);
        siUsdcPairFee = _fee;
    }

    function receiveTax(uint256 _amount) external onlySIToken {
        lastSiBalance += _amount;
        emit UpdatedTaxAmount(_amount);
    }

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

    function supportsInterface(bytes4 interfaceId) public pure override returns (bool) {
        return interfaceId == type(IERC165).interfaceId || interfaceId == type(IStreamerInuVault).interfaceId;
    }
}
