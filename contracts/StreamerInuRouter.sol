// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {IOFTV2} from "@layerzerolabs/solidity-examples/contracts/token/oft/v2/interfaces/IOFTV2.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {IOFTReceiverV2} from "@layerzerolabs/solidity-examples/contracts/token/oft/v2/interfaces/IOFTReceiverV2.sol";
import {IOAppComposer} from "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/interfaces/IOAppComposer.sol";
import { MessagingParams, MessagingFee, MessagingReceipt } from "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/ILayerZeroEndpointV2.sol";
import {OFTComposeMsgCodec} from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/libs/OFTComposeMsgCodec.sol";
import {ISquidRouter} from "./interfaces/squidRouter/ISquidRouter.sol";
import {IStreamerInuRouter, ISquidMulticall} from "./interfaces/IStreamerInuRouter.sol";
import {IStreamerInuVault} from "contracts/interfaces/IStreamerInuVault.sol";
import {SendParam, IOFT} from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/interfaces/IOFT.sol";
uint256 constant TAX_PERCENT = 2 * 10 ** 15; // 0.2%
uint256 constant TOTAL_PERCENT = 1 * 10 ** 18; // 100%
/*  _____ _                                    _____             _____             _            
  / ____| |                                  |_   _|           |  __ \           | |           
 | (___ | |_ _ __ ___  __ _ _ __ ___   ___ _ __| |  _ __  _   _| |__) |___  _   _| |_ ___ _ __ 
  \___ \| __| '__/ _ \/ _` | '_ ` _ \ / _ \ '__| | | '_ \| | | |  _  // _ \| | | | __/ _ \ '__|
  ____) | |_| | |  __/ (_| | | | | | |  __/ | _| |_| | | | |_| | | \ \ (_) | |_| | ||  __/ |   
 |_____/ \__|_|  \___|\__,_|_| |_| |_|\___|_||_____|_| |_|\__,_|_|  \_\___/ \__,_|\__\___|_|   
                                                                                               
*/
/// @title StreamerInuRouter
/// @notice The purpose of the contract send and receive OFT StreamInu token for safe crosschain trading.
contract StreamerInuRouter is IStreamerInuRouter, IOFTReceiverV2, IOAppComposer, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
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
    /// @notice stores version of si OFT token
    /// @return version of si OFT token
    OftVersion public version;
    /// @notice stores address of STRM Vault contract
    /// @return address of STRM Vault contract
    address public siVault;
    /// @notice stores address of LayerZero endpoint to support receiving messages from OFT V2
    /// @return address of LayerZero endpoint
    address public endpoint;
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

    constructor(address _si, OftVersion _version, address _squidRouter, address _squidMulticall) {
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
        version = _version;
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

    function setLzEndpoint(address _endpoint) external override onlyOwner{
        if (_endpoint == address(0)) {
            revert ZeroAddress();
        }
        endpoint = _endpoint;
    }

    /// @notice Set new address of StreamerInuVault contract
    /// @dev only Owner can call the function
    /// @dev new address can't be equal to zero address
    /// @param _siVault new address of StreamerInuVault contract
    function setSIVault(address _siVault) external override onlyOwner {
        if (_siVault == address(0)) {
            revert ZeroAddress();
        }
        siVault = _siVault;
    }
    
    /// FUNCTIONS FOR CONTRACT CALLS

    /// @notice send received STRM token to recipient on the source chain
    /// @dev only SquidMulticall can call the function
    /// @param _dstChainId endpoint id (chain Id)
    /// @param _toAddress address of tokens recipient
    /// @param _refundAddress recipient of gas refund
    function sendOFTTokenToOwner(
        uint16 _dstChainId,
        uint256 _amount,
        bytes32 _toAddress,
        address _refundAddress,
        bytes memory _adapterParams
    ) external payable override onlySquidMulticall {
        IERC20(si).safeTransferFrom(_msgSender(),address(this),_amount);
        uint256 amountToTransfer = _sendTaxes(_amount);
        _sendOFTV1(
            _dstChainId,
            _toAddress,
            _refundAddress,
            amountToTransfer,
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

    function lzCompose(
        address _oApp,
        bytes32 /*_guid*/,
        bytes calldata _message,
        address /*Executor*/,
        bytes calldata /*Executor Data*/
    ) external payable override {
        if (_oApp != si) {
            revert NotSIToken();
        }
        if (_msgSender() != endpoint) {
            revert NotLzEndpointToken();
        }
        // Extract the composed message from the delivered message using the MsgCodec
        bytes memory _composeMsgContent = OFTComposeMsgCodec.composeMsg(_message);
        // TODO test decode of composed message
        if(_composeMsgContent.length < 32){
            revert InvalidPayload();
        }
        // Decode the composed message, in this case, the uint256 amount and address receiver for the token swap
        // To make sure that user haven't manipulate with value of "_amountToReserve" 
        // we need to overrife OFT to add the value automatically
        (uint256 _amountToReserve, address _receiver) = abi.decode(_composeMsgContent, (uint256, address));

        reservedTokens[_receiver] += _amountToReserve;
        totalLocked += _amountToReserve;
        emit OFTV2TokensReceived(_receiver, _amountToReserve);
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
        _sendNative(_recipient, _amount);
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
    /// @param _bridgedTokenSymbol symbol of token for bridge, by default axlUSDC
    /// @param _destinationChain name of destination chain
    /// @param _destinationAddress recipient of axelar call, should be SquidRouter on destination chain
    /// @param _payload payload which describe instruction to execute on destination chain
    /// @param _refundAddress recipient of gas refund
    /// @param _amount amount of STRM tokens to swap
    function sellSI(
        ISquidMulticall.Call[] calldata _sqdCallsSourceChain,
        string calldata _bridgedTokenSymbol,
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
        address _si = si;
        uint256 amountToSell = _sendTaxes(_amount);
        if (!IERC20(_si).approve(squidRouter, amountToSell)) {
            revert ApproveFailed();
        }
        reservedTokens[_msgSender()] = reservedAmount - _amount;
        totalLocked -= _amount;
        ISquidRouter(squidRouter).callBridgeCall{value: msg.value}(
            _si,
            amountToSell,
            _sqdCallsSourceChain,
            _bridgedTokenSymbol,
            _destinationChain,
            _destinationAddress,
            _payload,
            _refundAddress,
            false
        );
    }

    function getRequiredValueToCoverOFTTransferV1(
        uint16 _dstChainId,
        bytes32 _toAddress,
        uint256 _amount,
        bytes memory _adapterParams
    ) external view override returns (uint256) {
        uint256 native = _estimateSendFee(
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

    function getRequiredValueToCoverOFTTransferV2(
        SendParam calldata _sendParam
    ) external view override returns (uint256){
        uint256 native = _quoteSend(_sendParam);
        address to = address(uint160(uint256(_sendParam.to)));
        uint256 nativeAmount = nativeBalance[to];
        if (nativeAmount >= native) {
            return 0;
        } else {
            return native - nativeAmount;
        }
    }

    function _sendOFTV1(
        uint16 _dstChainId,
        bytes32 _toAddress,
        address _refundAddress,
        uint256 _amount,
        bytes memory _adapterParams
    ) internal {
        address to = address(uint160(uint256(_toAddress)));
        uint256 tnLocked = totalNativeLocked;
        uint256 freeNative = address(this).balance - tnLocked;
        uint256 native = _estimateSendFee(
            _dstChainId,
            _toAddress,
            _amount,
            _adapterParams
        );
        if (freeNative < native) {
            uint256 reservedNative = nativeBalance[to];
            if ((freeNative + reservedNative) < native) {
                revert NotEnoughBalance();
            }
            uint256 spentNative = native - freeNative;
            nativeBalance[to] = reservedNative - spentNative;
            totalNativeLocked = tnLocked - spentNative;
        }

        if (freeNative > native) {
            _sendNative(payable(_refundAddress), freeNative - native);
        }
        IOFTV2.LzCallParams memory params;
        params.adapterParams = _adapterParams;
        params.refundAddress = payable(_refundAddress);
        params.zroPaymentAddress = address(0);
        IOFTV2(si).sendFrom{value: native}(
            address(this),
            _dstChainId,
            _toAddress,
            _amount,
            params
        );
    }

    function _sendOFTV2(
        SendParam calldata _sendParam,
        MessagingFee calldata _fee,
        address _refundAddress
    ) internal {
        address to = address(uint160(uint256(_sendParam.to)));
        uint256 tnLocked = totalNativeLocked;
        uint256 freeNative = address(this).balance - tnLocked;
        uint256 native = _quoteSend(_sendParam);
        if(_fee.nativeFee == 0 || _fee.nativeFee < native){
            revert InvalidPassedFee();
        }
        native = _fee.nativeFee > native ? _fee.nativeFee : native;
        if (freeNative < native) {
            uint256 reservedNative = nativeBalance[to];
            if ((freeNative + reservedNative) < native) {
                revert NotEnoughBalance();
            }
            uint256 spentNative = native - freeNative;
            nativeBalance[to] = reservedNative - spentNative;
            totalNativeLocked = tnLocked - spentNative;
        }

        if (freeNative > native) {
            _sendNative(payable(_refundAddress), freeNative - native);
        }
        IOFT(si).send{value: native}(_sendParam, _fee, _refundAddress);
    }

    function _sendNative(address payable _recipient, uint256 _amount) internal {
        emit NativeTokenTransferred(_recipient, _amount);
        (bool isSent, ) = _recipient.call{value: _amount}("");
        if (!isSent) {
            revert NativeTransferFailed();
        }
    }

    function _sendTaxes(uint256 _amount) internal returns (uint256 remainder) {
        if (siVault == address(0)) return _amount;
        uint256 tax = _getTaxAmount(_amount);
        IERC20(si).transfer(siVault, tax);
        IStreamerInuVault(siVault).receiveTax(tax);
        remainder = _amount - tax;
    }

    function _estimateSendFee(
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

    function _quoteSend(SendParam calldata _sendParam) internal view returns(uint256){
        MessagingFee memory fee = IOFT(si).quoteSend(_sendParam, false);
        return fee.nativeFee;
    }

    function _getTaxAmount(
        uint256 _amount
    ) internal pure returns (uint256 taxAmount) {
        taxAmount =
            ((_amount * TAX_PERCENT * TOTAL_PERCENT) / TOTAL_PERCENT) /
            TOTAL_PERCENT;
    }
}
