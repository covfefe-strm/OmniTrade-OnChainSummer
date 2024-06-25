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
    /// oft -> holder -> amount
    /// @notice stores amount of STRM tokens reserved for sender or recipient
    /// @dev address of sender or recipient => amount of STRM token
    mapping(address => mapping(address => uint256)) public reservedTokens;
    /// @notice stores amount of reserved native tokens which will be used to cover OFT transfer
    /// @dev address of sender or recipient => amount of researved native tokens
    mapping(address => uint256) public nativeBalance;
    /// @notice stores total amount of reserved STRM tokens
    /// @return total amount of reserved tokens
    mapping(address => uint256) public totalLocked;
    /// @notice stores total amount of reserved native tokens
    /// @return total amount of reserved tokens
    uint256 public totalNativeLocked;
    /// oft -> version
    /// @notice stores version of OFT tokens
    mapping(address => OftVersion) public oftsVersion;
    /// oft -> vault
    /// @notice stores Vault address for OFT token;
    mapping(address => address) public vaults;
    /// @notice stores address of LayerZero endpoint to support receiving messages from OFT V2
    /// @return address of LayerZero endpoint
    address public endpointV2;
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

    modifier oftVersionCheck(OftVersion _version, address _oft) {
        if (oftsVersion[_oft] != _version) {
            revert VersionMismatch();
        }
        _;
    }

    modifier onlyActiveOFT(address _oft){
        if (!_isOftActive(_oft)) {
            revert NotActiveOFT();
        }
        _;
    }

    constructor(address _squidRouter, address _squidMulticall) {
        squidMulticall = _squidMulticall;
        squidRouter = _squidRouter;
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

    function setLzEndpointV2(address _endpoint) external override onlyOwner{
        if (_endpoint == address(0)) {
            revert ZeroAddress();
        }
        endpointV2 = _endpoint;
    }

    /// @notice Set new address of StreamerInuVault contract
    /// @dev only Owner can call the function
    /// @dev new address can't be equal to zero address
    /// @param _siVault new address of StreamerInuVault contract
    function setSIVault(address _oft,address _siVault) external override onlyOwner onlyActiveOFT(_oft) {
        if (_siVault == address(0) || _oft == address(0)) {
            revert ZeroAddress();
        }
        // TODO add check for vault.si == _oft
        // TODO update IStreamerInuVault interface
        vaults[_oft] = _siVault;
    }

    function setOFT(address _oft, OftVersion version) external override onlyOwner {
        if (_oft == address(0)) {
            revert ZeroAddress();
        }
        oftsVersion[_oft] = version;
    }
    
    /// FUNCTIONS FOR CONTRACT CALLS

    /// @notice send received STRM token to recipient on the source chain
    /// @dev only SquidMulticall can call the function
    /// @param _dstChainId endpoint id (chain Id)
    /// @param _toAddress address of tokens recipient
    /// @param _refundAddress recipient of gas refund
    function sendOFTTokenToOwner(
        address _oft,
        uint16 _dstChainId,
        uint256 _amount,
        bytes32 _toAddress,
        address _refundAddress,
        bytes memory _adapterParams
    ) external payable override onlySquidMulticall oftVersionCheck(OftVersion.OFTV1,_oft) {
        IERC20(_oft).safeTransferFrom(_msgSender(),address(this),_amount);
        uint256 amountToTransfer = _sendTaxes(_oft,_amount);
        _sendOFTV1(
            _oft,
            _dstChainId,
            _toAddress,
            _refundAddress,
            amountToTransfer,
            _adapterParams
        );
    }

    function sendOFTTokenToOwner(
        address _oft,
        SendParam calldata _sendParam,
        MessagingFee calldata _fee,
        address _refundAddress
    ) external payable override onlySquidMulticall oftVersionCheck(OftVersion.OFTV2,_oft) {
        IERC20(_oft).safeTransferFrom(_msgSender(),address(this),_sendParam.amountLD);
        uint256 amountToTransfer = _sendTaxes(_oft,_sendParam.amountLD);
        _sendOFTV2(
            _oft,
            _sendParam,
            _fee,
            _refundAddress
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
    ) external override onlyActiveOFT(_msgSender()){
        address recipient = _payload.length < 32
            ? address(uint160(uint256(_from)))
            : abi.decode(_payload, (address));
        reservedTokens[_msgSender()][recipient] += _amount;
        totalLocked[_msgSender()] += _amount;
        emit OFTTokensReceived(_msgSender(),recipient, _amount);
    }

    function lzCompose(
        address _oApp,
        bytes32 /*_guid*/,
        bytes calldata _message,
        address /*Executor*/,
        bytes calldata /*Executor Data*/
    ) external payable override onlyActiveOFT(_oApp){
        if (_msgSender() != endpointV2) {
            revert NotLzEndpointToken();
        }
        // Extract the composed message from the delivered message using the MsgCodec
        bytes memory _composeMsgContent = OFTComposeMsgCodec.composeMsg(_message);
        uint256 _amountToReserve = OFTComposeMsgCodec.amountLD(_message);
        // TODO test decode of composed message
        if(_composeMsgContent.length < 32){
            revert InvalidPayload();
        }
        // Decode the composed message, in this case, the uint256 amount and address receiver for the token swap
        // To make sure that user haven't manipulate with value of "_amountToReserve" 
        // we need to overrife OFT to add the value automatically
        (address _receiver) = abi.decode(_composeMsgContent, (address));

        reservedTokens[_oApp][_receiver] += _amountToReserve;
        totalLocked[_oApp] += _amountToReserve;
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

    function withdrawOFT(address _oft,uint256 _amount, address _recipient) external override onlyActiveOFT(_oft){
        uint256 reservedBalance = reservedTokens[_oft][_msgSender()];
        if (reservedBalance == 0 || _amount > reservedBalance) {
            revert NotEnoughBalance();
        }
        if (_recipient == address(0)) {
            revert ZeroAddress();
        }
        reservedTokens[_oft][_msgSender()] = reservedBalance - _amount;
        totalLocked[_oft] -= _amount;
        if (!IERC20(_oft).transfer(_recipient, _amount)) {
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
        address _oft,
        ISquidMulticall.Call[] calldata _sqdCallsSourceChain,
        string calldata _bridgedTokenSymbol,
        string calldata _destinationChain,
        string calldata _destinationAddress,
        bytes calldata _payload,
        address _refundAddress,
        uint256 _amount
    ) external payable override nonReentrant onlyActiveOFT(_oft){
        uint256 reservedAmount = reservedTokens[_oft][_msgSender()];
        if (reservedAmount == 0) {
            revert ZeroSIBalance();
        }
        if (reservedAmount < _amount) {
            revert NotEnoughBalance();
        }
        uint256 amountToSell = _sendTaxes(_oft,_amount);
        if (!IERC20(_oft).approve(squidRouter, amountToSell)) {
            revert ApproveFailed();
        }
        reservedTokens[_oft][_msgSender()] = reservedAmount - _amount;
        totalLocked[_oft] -= _amount;
        ISquidRouter(squidRouter).callBridgeCall{value: msg.value}(
            _oft,
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
        address _oft,
        uint16 _dstChainId,
        bytes32 _toAddress,
        uint256 _amount,
        bytes memory _adapterParams
    ) external view override returns (uint256) {
        uint256 native = _estimateSendFee(
            _oft,
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
        address _oft,
        SendParam calldata _sendParam
    ) external view override returns (uint256){
        uint256 native = _quoteSend(_oft,_sendParam);
        address to = address(uint160(uint256(_sendParam.to)));
        uint256 nativeAmount = nativeBalance[to];
        if (nativeAmount >= native) {
            return 0;
        } else {
            return native - nativeAmount;
        }
    }

    function _sendOFTV1(
        address _oft,
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
            _oft,
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
        IOFTV2(_oft).sendFrom{value: native}(
            address(this),
            _dstChainId,
            _toAddress,
            _amount,
            params
        );
    }

    function _sendOFTV2(
        address _oft,
        SendParam calldata _sendParam,
        MessagingFee calldata _fee,
        address _refundAddress
    ) internal {
        address to = address(uint160(uint256(_sendParam.to)));
        uint256 tnLocked = totalNativeLocked;
        uint256 freeNative = address(this).balance - tnLocked;
        uint256 native = _quoteSend(_oft,_sendParam);
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
        IOFT(_oft).send{value: native}(_sendParam, _fee, _refundAddress);
    }

    function _sendNative(address payable _recipient, uint256 _amount) internal {
        emit NativeTokenTransferred(_recipient, _amount);
        (bool isSent, ) = _recipient.call{value: _amount}("");
        if (!isSent) {
            revert NativeTransferFailed();
        }
    }

    function _sendTaxes(address _oft,uint256 _amount) internal returns (uint256 remainder) {
        address vault = vaults[_oft];
        if (vault == address(0)) return _amount;
        uint256 tax = _getTaxAmount(_amount);
        IERC20(_oft).transfer(vault, tax);
        IStreamerInuVault(vault).receiveTax(tax);
        remainder = _amount - tax;
    }

    function _estimateSendFee(
        address _oft,
        uint16 _dstChainId,
        bytes32 _toAddress,
        uint256 _amount,
        bytes memory _adapterParams
    ) internal view returns (uint256 native) {
        (native, ) = IOFTV2(_oft).estimateSendFee(
            _dstChainId,
            _toAddress,
            _amount,
            false,
            _adapterParams
        );
    }

    function _quoteSend(address _oft,SendParam calldata _sendParam) internal view returns(uint256){
        MessagingFee memory fee = IOFT(_oft).quoteSend(_sendParam, false);
        return fee.nativeFee;
    }

    function _isOftActive(address _oft) internal view returns (bool){
        return oftsVersion[_oft] == OftVersion.EMPTY ? false : true;
    }

    function _getTaxAmount(
        uint256 _amount
    ) internal pure returns (uint256 taxAmount) {
        taxAmount =
            ((_amount * TAX_PERCENT * TOTAL_PERCENT) / TOTAL_PERCENT) /
            TOTAL_PERCENT;
    }
}
