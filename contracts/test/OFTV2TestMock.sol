// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;
import { OFTV2Mock } from "./OFTV2Mock.sol";
import { SendParam, MessagingFee } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/interfaces/IOFT.sol";
import { OFTMsgCodec } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/libs/OFTMsgCodec.sol";
import { OFTComposeMsgCodec } from "@layerzerolabs/lz-evm-oapp-v2/contracts/oft/libs/OFTComposeMsgCodec.sol";
/// @dev the contract is used only for testing, don't use it for production purposes
contract OFTV2TestMock is OFTV2Mock {
    using OFTMsgCodec for bytes;
    using OFTMsgCodec for bytes32;
    uint256 public sendFee;
    constructor(
        string memory _name,
        string memory _symbol,
        address _lzEndpoint,
        address _delegate
    ) OFTV2Mock(_name, _symbol, _lzEndpoint, _delegate) {}

    function mint(address recipient, uint256 amount) external onlyOwner() {
        _mint(recipient, amount);
    }

    function setSendFee(uint256 _fee) external {
        sendFee = _fee;
    }

    function quoteSend(SendParam calldata _sendParam, bool _payInLzToken) external view override returns(MessagingFee memory fee){
        fee.nativeFee = sendFee;
    }

    function encodedMsg(bytes32 _to, uint256 _amountToReserve, bytes memory _composeMsg) external view returns(bytes memory message){
        (bytes memory message, ) = OFTMsgCodec.encode(
            _to,
            _toSD(_amountToReserve),
            _composeMsg
        );
    }

}