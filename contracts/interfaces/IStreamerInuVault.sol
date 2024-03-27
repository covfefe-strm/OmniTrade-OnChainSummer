// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;
interface IStreamerInuVault {
    // todo transfer to separate interface
    event UpdatedTaxAmount(uint256 taxAmount);
    error ZeroAddress();
    error ZeroValue();
    error NotSIToken();
    error NotEnoughBalance();
    error ZeroSI();
    function receiveTax(uint256 _amount) external;
    function sellSi(
        uint256 _amount,
        address _recipient,
        uint256 _amountOutMin
    ) external;
    function withdrawUnexpectedTokens(address _token,address _recipient, uint256 _amount) external;
}
