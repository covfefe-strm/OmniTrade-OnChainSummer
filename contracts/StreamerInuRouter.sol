// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {IOFTV2} from "@layerzerolabs/solidity-examples/contracts/token/oft/v2/interfaces/IOFTV2.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {ISquidRouter} from "./interfaces/squidRouter/ISquidRouter.sol";
import {IStreamerInuRouter, ISquidMulticall} from "./interfaces/IStreamerInuRouter.sol";
string constant BRIDER_TOKEN_SYMBOL = "aUSDC";

/*  _____ _                                    _____             _____             _            
  / ____| |                                  |_   _|           |  __ \           | |           
 | (___ | |_ _ __ ___  __ _ _ __ ___   ___ _ __| |  _ __  _   _| |__) |___  _   _| |_ ___ _ __ 
  \___ \| __| '__/ _ \/ _` | '_ ` _ \ / _ \ '__| | | '_ \| | | |  _  // _ \| | | | __/ _ \ '__|
  ____) | |_| | |  __/ (_| | | | | | |  __/ | _| |_| | | | |_| | | \ \ (_) | |_| | ||  __/ |   
 |_____/ \__|_|  \___|\__,_|_| |_| |_|\___|_||_____|_| |_|\__,_|_|  \_\___/ \__,_|\__\___|_|   
                                                                                               
*/
/// @title StreamerInuRouter
/// @notice The purpose of the contract send and receive OFT StreamInu token for safe crosschain trading.
contract StreamerInuRouter is IStreamerInuRouter, Ownable, ReentrancyGuard {
    /// @notice stores amount of STRM tokens reserved for sender or recipient
    /// @dev address of sender or recipient => amount of STRM token
    mapping(address => uint256) public reservedTokens;
    /// @notice stores amount of reserved native tokens which will be used to cover OFT transfer
    /// @dev address of sender or recipient => amount of researved native tokens
    mapping(address => uint256) public nativeBalance;
    /// @notice stores total amount of reserved STRM tokens
    /// @return total amount of reserved tokens
    uint256 public totalLocked;
    /// @notice stores total amount of reserved native tokens
    /// @return total amount of reserved tokens
    uint256 public totalNativeLocked;
    /// @notice stores address of STRM token
    /// @return address of STRM token
    address public si;
    /// @notice stores address of SquidRouter contract
    /// @return address of SquidRouter token
    address public squidRouter;
    /// @notice stores address of SquidMulticall contract
    /// @return address of SquidMulticall
    address public squidMulticall;

    modifier onlySquidMulticall() {
        if (_msgSender() != squidMulticall) {
            revert NotSquidMultical();
        }
        _;
    }

    modifier onlySIToken() {
        if (_msgSender() != si) {
            revert NotSIToken();
        }
        _;
    }

    constructor(address _si, address _squidRouter, address _squidMulticall) {
        if (
            _squidMulticall == address(0) ||
            _squidRouter == address(0) ||
            _si == address(0)
        ) {
            revert ZeroAddress();
        }
        squidMulticall = _squidMulticall;
        squidRouter = _squidRouter;
        si = _si;
    }

    //  ADMIN FUNCTIONS

    /// @notice Set new address of SquidMulticall contract
    /// @dev only Owner can call the function
    /// @dev new address can't be equal to zero address
    /// @param _squidMulticall new address of SquidMulticall contract
    function setSquidMulticall(
        address _squidMulticall
    ) external override onlyOwner {
        if (_squidMulticall == address(0)) {
            revert ZeroAddress();
        }
        squidMulticall = _squidMulticall;
    }

    /// @notice Set new address of SquidRouter contract
    /// @dev only Owner can call the function
    /// @dev new address can't be equal to zero address
    /// @param _squidRouter new address of SquidRouter contract
    function setSquidRouter(address _squidRouter) external override onlyOwner {
        if (_squidRouter == address(0)) {
            revert ZeroAddress();
        }
        squidRouter = _squidRouter;
    }

    /// FUNCTIONS FOR CONTRACT CALLS

    /// @notice send received STRM token to recipient on the source chain
    /// @dev only SquidMulticall can call the function
    /// @param _dstChainId endpoint id (chain Id)
    /// @param _toAddress address of tokens recipient
    /// @param _refundAddress recipient of gas refund
    function sendOFTTokenToOwner(
        uint16 _dstChainId,
        bytes32 _toAddress,
        address _refundAddress,
        bytes memory _adapterParams
    ) external payable override onlySquidMulticall {
        uint256 siBalance = IERC20(si).balanceOf(address(this));
        uint256 amount;
        if (siBalance <= totalLocked) {
            revert NotEnoughBalance();
        }
        amount = siBalance - totalLocked;
        _sendFromOFT(
            _dstChainId,
            _toAddress,
            _refundAddress,
            amount,
            _adapterParams
        );
    }

    /// @notice call by STRM token to register owner or recipient of the tokens
    /// @dev only STRM token can call the function
    /// @param _from sender of the tokens
    /// @param _amount amount of sended tokens
    /// @param _payload encoded address of recipient of the tokens
    /// can be equal to zero "0x", in this case recipient of the tokens will be sender
    function onOFTReceived(
        uint16 /*_srcChainId*/,
        bytes calldata /* _srcAddress */,
        uint64 /* _nonce */,
        bytes32 _from,
        uint _amount, // solhint-disable-line explicit-types
        bytes calldata _payload
    ) external override onlySIToken {
        address recipient = _payload.length < 32
            ? address(uint160(uint256(_from)))
            : abi.decode(_payload, (address));
        reservedTokens[recipient] += _amount;
        totalLocked += _amount;
        emit OFTTokensReceived(recipient, _amount);
    }

    // USER FUNCTIONS

    /// @notice Function for sending native currency to cover OFT transfer
    /// @param _recipient address of recipient of OFT tokens in future
    function deposit(address _recipient) external payable {
        uint256 msgValue = msg.value;
        nativeBalance[_recipient] += msgValue;
        totalNativeLocked += msgValue;
        emit NativeTokenDeposited(_recipient, msgValue);
    }

    function withdrawNative(
        uint256 _amount,
        address payable _recipient
    ) external override {
        uint256 reservedBalance = nativeBalance[_msgSender()];
        if (reservedBalance == 0 || _amount > reservedBalance) {
            revert NotEnoughBalance();
        }
        if (_recipient == address(0)) {
            revert ZeroAddress();
        }
        nativeBalance[_msgSender()] = reservedBalance - _amount;
        totalNativeLocked -= _amount;
        emit NativeTokenWithdrawn(_recipient, _amount);
        (bool isSent, ) = _recipient.call{value: _amount}("");
        if (!isSent) {
            revert NativeTransferFailed();
        }
    }

    function withdrawSI(uint256 _amount, address _recipient) external override {
        uint256 reservedBalance = reservedTokens[_msgSender()];
        if (reservedBalance == 0 || _amount > reservedBalance) {
            revert NotEnoughBalance();
        }
        if (_recipient == address(0)) {
            revert ZeroAddress();
        }
        reservedTokens[_msgSender()] = reservedBalance - _amount;
        totalLocked -= _amount;
        if (!IERC20(si).transfer(_recipient, _amount)) {
            revert TransferFailed();
        }
    }

    /// @notice execute swap of STRM token to another token and
    /// transfer to destination chain by using SquidRouter SCs
    /// @param _sqdCallsSourceChain array of Calls which describe instruction for swap
    /// @param _destinationChain sfsdf
    /// @param _destinationAddress fsdfsdf
    /// @param _payload payload which describe instruction to execute on destination chain
    /// @param _refundAddress recipient of gas refund
    /// @param _amount amount of STRM tokens to swap
    function sellSI(
        ISquidMulticall.Call[] calldata _sqdCallsSourceChain,
        string calldata _destinationChain,
        string calldata _destinationAddress,
        bytes calldata _payload,
        address _refundAddress,
        uint256 _amount
    ) external payable override nonReentrant {
        uint256 reservedAmount = reservedTokens[_msgSender()];
        if (reservedAmount == 0) {
            revert ZeroSIBalance();
        }
        if (reservedAmount < _amount) {
            revert NotEnoughBalance();
        }

        if (!IERC20(si).approve(squidRouter, _amount)) {
            revert ApproveFailed();
        }

        ISquidRouter(squidRouter).callBridgeCall{value: msg.value}(
            si,
            _amount,
            _sqdCallsSourceChain,
            BRIDER_TOKEN_SYMBOL,
            _destinationChain,
            _destinationAddress,
            _payload,
            _refundAddress,
            false
        );
    }

    function getRequiredValueToCoverOFTTransfer(
        uint16 _dstChainId,
        bytes32 _toAddress,
        uint256 _amount,
        bytes memory _adapterParams
    ) external view override returns (uint256) {
        uint256 native = _getCrossTransferGasCost(
            _dstChainId,
            _toAddress,
            _amount,
            _adapterParams
        );
        address to = address(uint160(uint256(_toAddress)));
        uint256 nativeAmount = nativeBalance[to];
        if (nativeAmount >= native) {
            return 0;
        } else {
            return native - nativeAmount;
        }
    }

    function _sendFromOFT(
        uint16 _dstChainId,
        bytes32 _toAddress,
        address _refundAddress,
        uint256 _amount,
        bytes memory _adapterParams
    ) internal {
        address to = address(uint160(uint256(_toAddress)));
        uint256 native = _getCrossTransferGasCost(
            _dstChainId,
            _toAddress,
            _amount,
            _adapterParams
        );

        if (
            (address(this).balance - (totalNativeLocked - nativeBalance[to])) <
            native
        ) {
            revert NotEnoughBalance();
        }
        IOFTV2.LzCallParams memory params;
        params.adapterParams = _adapterParams;
        params.refundAddress = payable(address(_refundAddress));
        params.zroPaymentAddress = address(0);
        IOFTV2(si).sendFrom{value: native}(
            address(this),
            _dstChainId,
            _toAddress,
            _amount,
            params
        );
    }

    function _getCrossTransferGasCost(
        uint16 _dstChainId,
        bytes32 _toAddress,
        uint256 _amount,
        bytes memory _adapterParams
    ) internal view returns (uint256 native) {
        (native, ) = IOFTV2(si).estimateSendFee(
            _dstChainId,
            _toAddress,
            _amount,
            false,
            _adapterParams
        );
    }
}
