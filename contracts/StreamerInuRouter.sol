// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;
import {IOFTReceiverV2} from "@layerzerolabs/solidity-examples/contracts/token/oft/v2/interfaces/IOFTReceiverV2.sol";
import {IOFTV2} from "@layerzerolabs/solidity-examples/contracts/token/oft/v2/interfaces/IOFTV2.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract StreamerInuRouter is IOFTReceiverV2, Ownable{
    mapping(address=>uint256) public reservedTokens;
    uint256 public locked;
    address public trustedDEX;
    bytes public adapterParams;

    function sendOFTTokenToOwner(uint16 _dstChainId, bytes32 _toAddress, uint _amount) public {
    }
    function onOFTReceived(uint16 _srcChainId, bytes calldata _srcAddress, uint64 _nonce, bytes32 _from, uint _amount, bytes calldata _payload) external override{}
}
