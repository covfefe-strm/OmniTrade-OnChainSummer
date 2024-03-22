// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IStreamerInuRouter} from "../interfaces/IStreamerInuRouter.sol";

contract OftMock is ERC20 {
    struct LzCallParams {
        address payable refundAddress;
        address zroPaymentAddress;
        bytes adapterParams;
    }

    event SentFrom(address from, bytes32 to, uint256 amount, uint256 value);

    uint256 public nativeSendFee;
    uint256 public zroSendFee;
    uint256 public counter;

    constructor(
        string memory _name,
        string memory _symbol
    ) ERC20(_name, _symbol) {
        _mint(msg.sender, 1_000_000 ether);
    }

    function setSendFee(uint256 _nativeFee, uint256 _zroSendFee) external {
        nativeSendFee = _nativeFee;
        zroSendFee = _zroSendFee;
    }

    function estimateSendFee(
        uint16 _dstChainId,
        bytes32 _toAddress,
        uint _amount,
        bool _useZro,
        bytes calldata _adapterParams
    ) public view returns (uint nativeFee, uint zroFee) {
        return (nativeSendFee, zroSendFee);
    }

    function sendFrom(
        address _from,
        uint16 _dstChainId,
        bytes32 _toAddress,
        uint _amount,
        LzCallParams calldata _callParams
    ) public payable {
        counter += msg.value;
        _transfer(_from, address(this), _amount);
        emit SentFrom(_from, _toAddress, _amount, msg.value);
    }

    function sendToSIRouter(
        address target,
        bytes32 _from,
        uint _amount,
        bytes calldata _payload
    ) external payable {
        IStreamerInuRouter(target).onOFTReceived(
            0,
            "0x",
            0,
            _from,
            _amount,
            _payload
        );
    }
}
