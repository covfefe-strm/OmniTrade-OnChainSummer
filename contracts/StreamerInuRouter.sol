// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;
import {IOFTReceiverV2} from "@layerzerolabs/solidity-examples/contracts/token/oft/v2/interfaces/IOFTReceiverV2.sol";
import {IOFTV2} from "@layerzerolabs/solidity-examples/contracts/token/oft/v2/interfaces/IOFTV2.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {ISwapRouter} from "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import {IPancakeRouter02} from "./dex/pancakeswap/interfaces/IPancakeRouter02.sol";

contract StreamerInuRouter is IOFTReceiverV2, Ownable, ReentrancyGuard {
    struct Call {
        address target;
        uint256 value;
        bytes callData;
    }

    mapping(address => uint256) public reservedTokens;
    uint256 public totalLocked;
    address public si; // SI token
    address public squidMultical;
    bytes public adapterParams;

    error NotSquidMultical();
    error ZeroAddress();
    error NotEnoughBalance();
    error NotEnoughSiBalance();
    error ZeroSIBalance();
    error CallFailed(uint256 callIndex, bytes errorData);

    modifier onlySquidMultical() {
        if (_msgSender() != squidMultical) {
            revert NotSquidMultical();
        }
        _;
    }

    constructor(bytes memory _adapterParams, address _si) {
        if (_si == address(0)) {
            revert ZeroAddress();
        }
        adapterParams = _adapterParams;
        si = _si;
    }

    //  ADMIN
    function setAdapterParam(bytes calldata _adapterParams) external onlyOwner {
        adapterParams = _adapterParams;
    }

    function setSIToken(address _si) external onlyOwner {
        if (_si == address(0)) {
            revert ZeroAddress();
        }
        si = _si;
    }

    function sendOFTTokenToOwner(
        uint16 _dstChainId,
        bytes32 _toAddress,
        address _refundAddress
    ) public payable onlySquidMultical {
        uint256 siBalance = IERC20(si).balanceOf(address(this));
        uint256 amount;
        if (siBalance <= totalLocked) {
            revert NotEnoughSiBalance();
        }
        amount = siBalance - totalLocked;
        _sendFromOFT(_dstChainId, _toAddress, _refundAddress, amount);
    }

    function onOFTReceived(
        uint16 /*_srcChainId*/,
        bytes calldata /* _srcAddress */,
        uint64 /* _nonce */,
        bytes32 _from,
        uint _amount,
        bytes calldata /* _payload */
    ) external override {
        address from = address(uint160(uint256(_from)));
        reservedTokens[from] += _amount;
        totalLocked += _amount;
    }

    // to do it we can just use Calls similar to SquidMultisig
    function sellSI(
        Call[] calldata calls,
        uint16 _dstChainId,
        bytes32 _toAddress,
        address _refundAddress,
        uint256 amount
    ) external payable nonReentrant {
        if (reservedTokens[_msgSender()] == 0) {
            revert ZeroSIBalance();
        }
        _runSwap(calls);
        //call squidRouter to swap USDC to another token and transfer the token to original chain
    }

    function _runSwap(Call[] calldata calls) internal {
        for (uint256 i; i < calls.length; i++) {
            Call memory call = calls[i];
            (bool success, bytes memory data) = call.target.call{
                value: call.value
            }(call.callData);
            if (!success) revert CallFailed(i, data);
        }
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
