// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

contract SquidRouterMock {
    enum CallType {
        Default,
        FullTokenBalance,
        FullNativeBalance,
        CollectTokenBalance
    }
    struct Call {
        CallType callType;
        address target;
        uint256 value;
        bytes callData;
        bytes payload;
    }
    event CallBridgeCall(address token, uint256 amount, uint256 value);

    uint256 public lastValue;

    function callBridgeCall(
        address token,
        uint256 amount,
        Call[] calldata calls,
        string calldata bridgedTokenSymbol,
        string calldata destinationChain,
        string calldata destinationAddress,
        bytes calldata payload,
        address gasRefundRecipient,
        bool enableExpress
    ) external payable {
        lastValue = msg.value;
        emit CallBridgeCall(token, amount, msg.value);
    }
}
