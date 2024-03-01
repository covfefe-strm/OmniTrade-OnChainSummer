// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {IOFTV2} from "@layerzerolabs/solidity-examples/contracts/token/oft/v2/interfaces/IOFTV2.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {ISwapRouter} from "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import {IPancakeRouter02} from "./dex/pancakeswap/interfaces/IPancakeRouter02.sol";
import {ISquidRouter} from "./squidrouter/interfaces/ISquidRouter.sol";
import {IStreamerInuRouter, ISquidMulticall} from "./interfaces/IStreamerInuRouter.sol";
string constant BRIDER_TOKEN_SYMBOL = "aUSDC";

/*    _____ _                                    _____             _____             _            
  / ____| |                                  |_   _|           |  __ \           | |           
 | (___ | |_ _ __ ___  __ _ _ __ ___   ___ _ __| |  _ __  _   _| |__) |___  _   _| |_ ___ _ __ 
  \___ \| __| '__/ _ \/ _` | '_ ` _ \ / _ \ '__| | | '_ \| | | |  _  // _ \| | | | __/ _ \ '__|
  ____) | |_| | |  __/ (_| | | | | | |  __/ | _| |_| | | | |_| | | \ \ (_) | |_| | ||  __/ |   
 |_____/ \__|_|  \___|\__,_|_| |_| |_|\___|_||_____|_| |_|\__,_|_|  \_\___/ \__,_|\__\___|_|   
                                                                                               
*/
/// @title StreamerInuRouter
/// @notice The purpose of the contract send and receive OFT StreamInu token for safe crosschain trading.
contract StreamerInuRouter is IStreamerInuRouter, Ownable, ReentrancyGuard {
    /// @dev destinationChainId => chain name;
    mapping(uint16 => string) public chainIdName;
    /// @dev destinationChainId => squidRouter address;
    mapping(uint16 => string) public chainIdSquidRouter;
    /// @notice stores amount of SI tokens reserved for sender or recipient
    /// @dev address of sender or recipient => amount of SI token
    mapping(address => uint256) public reservedTokens;
    /// @notice stores total amount of reserved tokens
    /// @return total amount of reserved tokens
    uint256 public totalLocked;
    /// @notice stores address of SI token
    /// @return address of SI token
    address public si;
    /// @notice stores address of SquidRouter contract
    /// @return address of SquidRouter token
    address public squidRouter;
    /// @notice stores address of SquidMulticall contract
    /// @return address of SquidMulticall
    address public squidMulticall;
    /// @notice stores encoded adapter params for OFT cross chain transfers
    /// @dev It is defualt adapter params only for call function "sendFrom"
    /// @return adapter params
    bytes public adapterParams;

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

    constructor(
        bytes memory _adapterParams,
        address _si,
        address _squidRouter,
        address _squidMulticall
    ) {
        if (
            _squidMulticall == address(0) ||
            _squidRouter == address(0) ||
            _si == address(0)
        ) {
            revert ZeroAddress();
        }
        squidMulticall = _squidMulticall;
        squidRouter = _squidRouter;
        adapterParams = _adapterParams;
        si = _si;
    }

    /// @notice Function for sending native currency to cover OFT transfer
    function deposit() external payable {}

    //  ADMIN FUNCTIONS

    /// @notice Set new adapter params
    /// @dev only Owner can call the function
    /// @dev throws error ZeroValue if owner pass empty bytes array
    /// @param _adapterParams new adapter params
    function setAdapterParam(
        bytes calldata _adapterParams
    ) external override onlyOwner {
        if (_adapterParams.length == 0) {
            revert ZeroValue();
        }
        adapterParams = _adapterParams;
    }

    /// @notice Set new SI token address
    /// @dev only Owner can call the function
    /// @dev SI token address can't be equal to zero address
    /// @param _si new address of SI token
    function setSIToken(address _si) external override onlyOwner {
        if (_si == address(0)) {
            revert ZeroAddress();
        }
        si = _si;
    }

    /// @notice Set new address of SquidMulticall contract
    /// @dev only Owner can call the function
    /// @dev new address can't be equal to zero address
    /// @param _squidMulticall new address of SquidMulticall contract
    function setSquidMulticall(address _squidMulticall) external onlyOwner {
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

    /// @notice Set chain name and address of SquidRouter contract on the chain
    /// @dev only Owner can call the function
    /// @dev chainId must be in format 101**
    /// @dev check layer zero docs
    /// @dev https://layerzero.gitbook.io/docs/technical-reference/testnet/testnet-addresses
    /// @param _dstChainId endpoint id (chain Id)
    /// @param _chainName name of the network
    /// @param _squidRouter address of SquidRouter on the network
    function setChainData(
        uint16 _dstChainId,
        string calldata _chainName,
        string calldata _squidRouter
    ) external override onlyOwner {
        if (_dstChainId == 0) {
            revert IncorrectChainId();
        }
        chainIdName[_dstChainId] = _chainName;
        chainIdSquidRouter[_dstChainId] = _squidRouter;
    }

    /// FUNCTIONS FOR CONTRACT CALLS

    /// @notice send received SI token to recipient on the source chain
    /// @dev only SquidMulticall can call the function
    /// @param _dstChainId endpoint id (chain Id)
    /// @param _toAddress address of tokens recipient
    /// @param _refundAddress recipient of gas refund
    function sendOFTTokenToOwner(
        uint16 _dstChainId,
        bytes32 _toAddress,
        address _refundAddress
    ) external payable override onlySquidMulticall {
        uint256 siBalance = IERC20(si).balanceOf(address(this));
        uint256 amount;
        if (siBalance <= totalLocked) {
            revert NotEnoughBalance();
        }
        amount = siBalance - totalLocked;
        _sendFromOFT(_dstChainId, _toAddress, _refundAddress, amount);
    }

    /// @notice call by SI token to register owner or recipient of the tokens
    /// @dev only SI token can call the function
    /// @param _from sender of the tokens
    /// @param _amount amount of sended tokens
    /// @param _payload encoded address of recipient of the tokens
    /// can be equal to zero "0x", in this case recipient of the tokens will be sender
    function onOFTReceived(
        uint16 /*_srcChainId*/,
        bytes calldata /* _srcAddress */,
        uint64 /* _nonce */,
        bytes32 _from,
        uint _amount,
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

    /// @notice execute swap of SI token to another toker and
    /// transfer to destination chain by using SquidRouter SC
    /// @param _sqdCallsSourceChain array of Calls which describe instruction for swap
    /// @param _payload payload which describe instruction to execute on destination chain
    /// @param _dstChainId destination chain id
    /// @param _refundAddress recipient of gas refund
    /// @param _amount amount of SI tokens to swap
    function sellSI(
        ISquidMulticall.Call[] calldata _sqdCallsSourceChain,
        bytes calldata _payload,
        uint16 _dstChainId,
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
        IERC20(si).approve(squidRouter, _amount);
        ISquidRouter(squidRouter).callBridgeCall{value: msg.value}(
            si,
            _amount,
            _sqdCallsSourceChain,
            BRIDER_TOKEN_SYMBOL,
            chainIdName[_dstChainId],
            chainIdSquidRouter[_dstChainId],
            _payload,
            _refundAddress,
            false
        );
    }

    function _sendFromOFT(
        uint16 _dstChainId,
        bytes32 _toAddress,
        address _refundAddress,
        uint256 _amount
    ) internal {
        uint256 native = _getCrossTransferGasCost(
            _dstChainId,
            _toAddress,
            _amount
        );
        if (address(this).balance < native) {
            revert NotEnoughBalance();
        }
        IOFTV2.LzCallParams memory params;
        params.adapterParams = adapterParams;
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
        uint256 amount
    ) internal view returns (uint256 native) {
        (native, ) = IOFTV2(si).estimateSendFee(
            _dstChainId,
            _toAddress,
            amount,
            false,
            adapterParams
        );
    }
}
