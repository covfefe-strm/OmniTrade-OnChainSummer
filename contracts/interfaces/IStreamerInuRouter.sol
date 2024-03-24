// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;
import {ISquidMulticall} from "./squidRouter/ISquidMulticall.sol";
import {IOFTReceiverV2} from "@layerzerolabs/solidity-examples/contracts/token/oft/v2/interfaces/IOFTReceiverV2.sol";

interface IStreamerInuRouter is IOFTReceiverV2 {
    /// @dev Emits when the contract receive SI token after cross chain transfer
    event OFTTokensReceived(address indexed recipient, uint256 amount);
    /// @dev Emits when sender deposited native token;
    event NativeTokenDeposited(address indexed recipient, uint256 amount);
    /// @dev Emits when user withdraw native token;
    event NativeTokenWithdrawn(address indexed recipient, uint256 amount);
    /// @dev Throws if sender isn't SquidMultical contract
    error NotSquidMultical();
    /// @dev Throws if sender isn't SI token
    error NotSIToken();
    /// @dev Throws if user or owner pass zero address as param
    error ZeroAddress();
    /// @dev Throws if user or owner pass zero value as param
    error ZeroValue();
    /// @dev Throws if pass chainId which equals to 0
    error IncorrectChainId();
    /// @dev Throws if user want swap or transfer more SI token than the contract has
    error NotEnoughBalance();
    /// @dev Throws if user has zero SI token balance on the contract
    error ZeroSIBalance();
    /// @dev Throws if approve of SI token failed
    error ApproveFailed();
    /// @dev Throws if transfer of SI token failed
    error TransferFailed();
    /// @dev Throws if transfer of naitve token failed
    error NativeTransferFailed();

    function deposit(address _recipient) external payable;

    function setSquidMulticall(address _squidMulticall) external;

    function setSquidRouter(address _squidRouter) external;

    function sendOFTTokenToOwner(
        uint16 _dstChainId,
        bytes32 _toAddress,
        address _refundAddress,
        bytes memory _adapterParams
    ) external payable;

    function withdrawNative(uint256 _amount, address payable _recipient) external;

    function withdrawSI(uint256 _amount, address _recipient) external;

    function sellSI(
        ISquidMulticall.Call[] calldata _sqdCallsSourceChain,
        string calldata _destinationChain,
        string calldata _destinationAddress,
        bytes calldata _payload,
        address _refundAddress,
        uint256 _amount
    ) external payable;

    function getRequiredValueToCoverOFTTransfer(
        uint16 _dstChainId,
        bytes32 _toAddress,
        uint256 _amount,
        bytes memory _adapterParams
        ) external view returns(uint256);
}
