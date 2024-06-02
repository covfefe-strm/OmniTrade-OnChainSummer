import { ethers } from "ethers";
import { abi as SwapRouter02ABI } from "./helpers/SwapRouter02ABI";

const errorAbi = ["function CallFailed(uint256 callPosition, bytes reason)"];
const InterfaceSwapRouter02 = new ethers.Interface(SwapRouter02ABI);
const InterfaceCustom = new ethers.Interface(errorAbi);
const callBridgeCallABI = [
  "address",
  "uint256",
  "tuple(uint256, address, uint256, bytes, bytes)[]",
  "string",
  "string",
  "string",
  "bytes",
  "address",
  "bool",
];
const exactInputSingleABI = [
  "tuple(address, address, uint24, address, uint256, uint256, uint160)",
];
const axelarCallABI = [
  "tuple(uint256, address, uint256, bytes, bytes)[]",
  "address",
  "bytes32",
];
const correctAxelarPayload =
  "0x0000000000000000000000000000000000000000000000000000000000000060000000000000000000000000b5dad09f19e55ae8d8d7a052b7447775d90622010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000700000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000001e00000000000000000000000000000000000000000000000000000000000000360000000000000000000000000000000000000000000000000000000000000056000000000000000000000000000000000000000000000000000000000000006c000000000000000000000000000000000000000000000000000000000000007a00000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000eb466342c4d449bc9f53a865d5cb90586f4052150000000000000000000000000000000000000000000000000000000000000001000000000000000000000000eb466342c4d449bc9f53a865d5cb90586f405215000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000001200000000000000000000000000000000000000000000000000000000000000044095ea7b30000000000000000000000002626664c2603336e57b271c5c0b26f421741e48100000000000000000000000000000000000000000000000000000000000b0c77000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000040000000000000000000000000eb466342c4d449bc9f53a865d5cb90586f405215000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000002626664c2603336e57b271c5c0b26f421741e481000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000001e00000000000000000000000000000000000000000000000000000000000000104b858183f00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000080000000000000000000000000ea749fd6ba492dbc14c24fe8a3d08769229b896c000000000000000000000000000000000000000000000000000000000006767d0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002beb466342c4d449bc9f53a865d5cb90586f4052150001f4420000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000004200000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000242e1a7d4d00000000000000000000000000000000000000000000000000005640e313956f000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000040000000000000000000000000420000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000ea749fd6ba492dbc14c24fe8a3d08769229b896c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000002626664c2603336e57b271c5c0b26f421741e481000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000124b858183f0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000008000000000000000000000000035d2af9aae9046bc474e9d37752020bc2ed55eeb00000000000000000000000000000000000000000000000000000000000495fa00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000059eb466342c4d449bc9f53a865d5cb90586f4052150001f442000000000000000000000000000000000000060001f4833589fcd6edb6e08f4c7c32d4f71b54bda02913000bb8fe4717f60ac5603dc6863700cd8ecf805908688d00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000040000000000000000000000000eb466342c4d449bc9f53a865d5cb90586f4052150000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000000200000000000000000000000035d2af9aae9046bc474e9d37752020bc2ed55eeb000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000001c000000000000000000000000000000000000000000000000000000000000000e4eba670ef000000000000000000000000000000000000000000000000000000000000006d000000000000000000000000b5dad09f19e55ae8d8d7a052b7447775d9062201000000000000000000000000b5dad09f19e55ae8d8d7a052b7447775d90622010000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000002200010000000000000000000000000000000000000000000000000000000000030d40000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
const errorData1 =
  "0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000e45c0dee5d00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000006408c379a00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000353544600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
const errorData2 =
  "0x5c0dee5d00000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
const errorData3Uniswap =
  "0x08c379a0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000035354460000000000000000000000000000000000000000000000000000000000";
const updatedApproveCallData =
  "0x095ea7b30000000000000000000000002626664c2603336e57b271c5c0b26f421741e4810000000000000000000000000000000000000000000000000000000000000064";
const swapData =
  "0xb858183f0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000008000000000000000000000000035d2af9aae9046bc474e9d37752020bc2ed55eeb00000000000000000000000000000000000000000000000000000000000495fa00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000059eb466342c4d449bc9f53a865d5cb90586f4052150001f442000000000000000000000000000000000000060001f4833589fcd6edb6e08f4c7c32d4f71b54bda02913000bb8fe4717f60ac5603dc6863700cd8ecf805908688d00000000000000";
async function main() {
  const abiCoder = new ethers.AbiCoder();
  console.log(InterfaceCustom.decodeFunctionData("CallFailed", errorData2));
  console.log(
    "SwapRouter error",
    InterfaceSwapRouter02.parseError(errorData3Uniswap),
  );
  console.log("Payload", abiCoder.decode(axelarCallABI, correctAxelarPayload));
  console.log(
    "exactImput",
    InterfaceSwapRouter02.decodeFunctionData("exactInput", swapData),
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});