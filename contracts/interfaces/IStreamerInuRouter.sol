// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;
import {ISquidMulticall} from "../squidrouter/interfaces/ISquidMulticall.sol";
import {IOFTReceiverV2} from "@layerzerolabs/solidity-examples/contracts/token/oft/v2/interfaces/IOFTReceiverV2.sol";

interface IStreamerInuRouter is IOFTReceiverV2 {
    /// @dev Emits when the contract receive SI token after cross chain transfer
    event OFTTokensReceived(address indexed recipient, uint256 amount);
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

    function deposit() external payable;

    function setAdapterParam(bytes calldata _adapterParams) external;

    function setSIToken(address _si) external;

    function setSquidMulticall(address _squidMulticall) external;

    function setSquidRouter(address _squidRouter) external;

    function setChainData(
        uint16 _dstChainId,
        string calldata _chainName,
        string calldata _squidRouter
    ) external;

    function sendOFTTokenToOwner(
        uint16 _dstChainId,
        bytes32 _toAddress,
        address _refundAddress
    ) external payable;

    function sellSI(
        ISquidMulticall.Call[] calldata _sqdCallsSourceChain,
        bytes calldata _payload,
        uint16 _dstChainId,
        address _refundAddress,
        uint256 _amount
    ) external payable;
}
