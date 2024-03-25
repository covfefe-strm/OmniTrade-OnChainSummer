// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;
interface IStreamerInuToken {
    /// @dev Emits when the contract owner set new percent of taxes
    event SetTaxPercent(uint256 _newTaxPercent);
    /// @dev Emits when the contract owner set SI/USDC pair
    event SetPair(address _pairAddress, uint24 _fee);
    /// @dev Emits when the contract owner set recipient of taxes
    event SetTaxRecipient(address _newRecip);
    /// @dev Throws if owner pass zero address
    error ZeroAddress();
    /// @dev Throws if owner pass zero value
    error ZeroValue();
    /// @dev Throws if owner pass tax percent which is greater then 5%
    error WrongTaxPercent();
    function setPercent(uint256 _taxPercent) external;
    function setPair(address _pairAddress, uint24 _fee) external;
    function setTaxRecipient(address _newRecipient) external;
}
