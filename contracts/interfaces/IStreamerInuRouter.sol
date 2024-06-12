// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;
import {ISquidMulticall} from "./squidRouter/ISquidMulticall.sol";
import {SendParam} from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/interfaces/IOFT.sol";

interface IStreamerInuRouter {
    enum OftVersion{
        OFTV1, OFTV2
    }
    /// @dev Emits when the contract receive STRM token after cross chain transfer
    event OFTTokensReceived(address indexed recipient, uint256 amount);
    /// @dev Emits when the contract receive STRM V2 token after cross chain transfer
    event OFTV2TokensReceived(address indexed recipient, uint256 amount);
    /// @dev Emits when sender deposited native token;
    event NativeTokenDeposited(address indexed recipient, uint256 amount);
    /// @dev Emits when user withdraw native token;
    event NativeTokenTransferred(address indexed recipient, uint256 amount);
    /// @dev Throws if sender isn't SquidMultical contract
    error NotSquidMultical();
    /// @dev Throws if sender isn't STRM token
    error NotSIToken();
    /// @dev Throws if sender isn't LayerZero endpoint
    error NotLzEndpointToken();
    /// @dev Throws if composed message isn't correct
    error InvalidPayload();
    /// @dev Throws if user or owner pass zero address as param
    error ZeroAddress();
    /// @dev Throws if user or owner pass zero value as param
    error ZeroValue();
    /// @dev Throws if pass chainId which equals to 0
    error IncorrectChainId();
    /// @dev Throws if user want swap or transfer more STRM token than the contract has
    error NotEnoughBalance();
    /// @dev Throws if user has zero STRM token balance on the contract
    error ZeroSIBalance();
    /// @dev Throws if approve of STRM token failed
    error ApproveFailed();
    /// @dev Throws if transfer of STRM token failed
    error TransferFailed();
    /// @dev Throws if transfer of naitve token failed
    error NativeTransferFailed();
    /// @dev Throws if user tried to call function for another OFT version
    error IncorrectOFTVersion();
    /// @dev Throws if user pass fee struct with zero native value.
    error InvalidPassedFee();

    function deposit(address _recipient) external payable;

    function setSquidMulticall(address _squidMulticall) external;

    function setSquidRouter(address _squidRouter) external;

    function setLzEndpoint(address _endpoint) external;

    function setSIVault(address _siVault) external;

    function sendOFTTokenToOwner(
        uint16 _dstChainId,
        uint256 _amount,
        bytes32 _toAddress,
        address _refundAddress,
        bytes memory _adapterParams
    ) external payable;

    function withdrawNative(
        uint256 _amount,
        address payable _recipient
    ) external;

    function withdrawSI(uint256 _amount, address _recipient) external;

    function sellSI(
        ISquidMulticall.Call[] calldata _sqdCallsSourceChain,
        string calldata _bridgedTokenSymbol,
        string calldata _destinationChain,
        string calldata _destinationAddress,
        bytes calldata _payload,
        address _refundAddress,
        uint256 _amount
    ) external payable;

    function getRequiredValueToCoverOFTTransferV1(
        uint16 _dstChainId,
        bytes32 _toAddress,
        uint256 _amount,
        bytes memory _adapterParams
    ) external view returns (uint256);

    function getRequiredValueToCoverOFTTransferV2(
        SendParam memory _sendParam
    ) external view returns (uint256);
}
