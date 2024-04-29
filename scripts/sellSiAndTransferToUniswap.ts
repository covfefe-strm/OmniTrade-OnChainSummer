import * as dotenv from "dotenv";
dotenv.config();
import { ethers } from "hardhat";
import hardhat from "hardhat";
import {
  StreamerInuRouter,
  StreamerInuRouter__factory,
} from "../typechain-types";
import { Contract, Provider } from "ethers";
import { abi as StreamerInuTokenABI } from "../artifacts/contracts/StreamerInuToken.sol/StreamerInuToken.json";
import { abi as SwapRouterABI } from "../artifacts/contracts/interfaces/uniswap/IV3SwapRouter.sol/IV3SwapRouter.json";
import {
  constants,
  crossChainAddresses,
  layerZeroEndpointsList,
} from "./helpers/constants";
import { encodePath } from "./helpers/utils";

const InterfaceSwapRouter = new ethers.Interface(SwapRouterABI);
const InterfaceStreamerInuToken = new ethers.Interface(StreamerInuTokenABI);
// settings:
const ROUTER = "0x449BE283980ae381555e9bC592F8Cac34416a711"; // adress of StreamerInuRouter SC
const STRM = "0x97AD37c588BfE8ddBDFc907222da247b608627f6";
const SWAP_ROUTER = "0x2626664c2603336E57B271c5C0b26F421741e481"; // address of Swap Router
const SQD_ROUTER = "0xce16F69375520ab01377ce7B88f5BA8C48F8D666";
const amountToSell = "1"; // in eth
const axelarFee = "0.0008"; // in eth
const bridgeToken = "axlUSDC";
const destinationNetwork = "polygon";
const SWAP_PATH_MAIN = [
  "0x97AD37c588BfE8ddBDFc907222da247b608627f6",
  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  "0x4200000000000000000000000000000000000006",
  "0xEB466342C4d449BC9f53A865D5Cb90586f405215",
];
const SWAP_FEE_MAIN = [3000, 500, 500];
const AXL_USDC_DESTINATION = "0x750e4C4984a9e0f12978eA6742Bc1c5D248f40ed"; // address of axlUSDC on destination(source) chain
const SWAP_ROUTER_DST = "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45"; // address of Uniswap V3 swap router on destination chain
const SWAP_PATH_DST = [
  "0x750e4C4984a9e0f12978eA6742Bc1c5D248f40ed",
  "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
];
const SWAP_FEE_DST = [100];
//[[1,"0x97AD37c588BfE8ddBDFc907222da247b608627f6",0,"0x095ea7b30000000000000000000000002626664c2603336e57b271c5c0b26f421741e4810000000000000000000000000000000000000000000000000000000000000000","0x"],[1,"0x2626664c2603336E57B271c5C0b26F421741e481",0,"0xb858183f00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000080000000000000000000000000ce16f69375520ab01377ce7b88f5ba8c48f8d66600000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000005997ad37c588bfe8ddbdfc907222da247b608627f6000bb8833589fcd6edb6e08f4c7c32d4f71b54bda029130001f442000000000000000000000000000000000000060001f4eb466342c4d449bc9f53a865d5cb90586f40521500000000000000","0x00000000000000000000000097ad37c588bfe8ddbdfc907222da247b608627f60000000000000000000000000000000000000000000000000000000000000002"]]
async function main() {
  console.log("script started");
  const [owner] = await ethers.getSigners();
  const SIRouterFactory: StreamerInuRouter__factory =
    (await ethers.getContractFactory(
      "StreamerInuRouter",
    )) as StreamerInuRouter__factory;
  const stramerInuRoter: StreamerInuRouter = (await SIRouterFactory.attach(
    ROUTER,
  )) as StreamerInuRouter;
  const abiCoder = new ethers.AbiCoder();
  const amountStrmToSell = ethers.parseEther(amountToSell);
  const transactionValue = ethers.parseEther(axelarFee);
  const encodePathMain = encodePath(SWAP_PATH_MAIN, SWAP_FEE_MAIN);
  console.log("encodePathMain", encodePathMain);
  // approve all STRM token to SwapRouter Uniswap
  const sqdCall0Data = InterfaceStreamerInuToken.encodeFunctionData("approve", [
    SWAP_ROUTER,
    0,
  ]);
  const sqdCall0payload = abiCoder.encode(["address", "uint256"], [STRM, 1n]);
  const sqdCall0 = {
    callType: 1n,
    target: STRM,
    value: 0n,
    callData: sqdCall0Data,
    payload: sqdCall0payload,
  };
  console.log("1");
  // swap tokens with swap router
  const sqdCall1Data = InterfaceSwapRouter.encodeFunctionData("exactInput", [
    {
      path: encodePathMain,
      recipient: SQD_ROUTER,
      amountIn: 0n,
      amountOutMinimum: 1n,
    },
  ]);
  const sqdCall1payload = abiCoder.encode(["address", "uint256"], [STRM, 3n]);
  const sqdCall1 = {
    callType: 1n,
    target: SWAP_ROUTER,
    value: 0n,
    callData: sqdCall1Data,
    payload: sqdCall1payload,
  };
  console.log("2");
  // Calls on destination chain
  /* 
    CALL#0 Sending aUSDC token from squidRouter to multisig
  */
  const call0payload = ethers.zeroPadValue(AXL_USDC_DESTINATION, 32);
  const call0 = [
    3n,
    "0x0000000000000000000000000000000000000000",
    0n,
    "0x",
    call0payload,
  ];
  console.log("3");
  /* 
    CALL#1 Approve aUSDC to SwapRouter SC
  */
  const call1data = InterfaceStreamerInuToken.encodeFunctionData("approve", [
    SWAP_ROUTER_DST,
    0,
  ]);
  const call1payload = abiCoder.encode(
    ["address", "uint256"],
    [AXL_USDC_DESTINATION, 1n],
  );
  const call1 = [1n, AXL_USDC_DESTINATION, 0n, call1data, call1payload];
  console.log("4");
  /* 
    CALL#2 Swap aUSDC to choosed user token
  */
  const encodePathDst = encodePath(SWAP_PATH_DST, SWAP_FEE_DST);
  const call2Data = InterfaceSwapRouter.encodeFunctionData("exactInput", [
    {
      path: encodePathDst,
      recipient: owner.address,
      amountIn: 0n,
      amountOutMinimum: 1n,
    },
  ]);
  const call2payload = abiCoder.encode(
    ["address", "uint256"],
    [AXL_USDC_DESTINATION, 2n],
  );
  const call2 = [1n, SWAP_ROUTER, 0n, call2Data, call2payload];
  console.log("5");

  const axelarCallABI = [
    "tuple(uint256, address, uint256, bytes, bytes)[]",
    "address",
    "bytes32",
  ];
  const payload = abiCoder.encode(axelarCallABI, [
    [call0, call1, call2],
    owner.address,
    "0x0000000000000000000000000000000000000000000000000000000000000000",
  ]);
  console.log("6");
  console.log("call data for Router", [
    [sqdCall0, sqdCall1],
    bridgeToken,
    destinationNetwork,
    owner.address,
    payload,
    owner.address,
    amountStrmToSell,
    { value: transactionValue },
  ]);
  await stramerInuRoter.sellSI.staticCall(
    [sqdCall0, sqdCall1],
    bridgeToken,
    destinationNetwork,
    owner.address,
    payload,
    owner.address,
    amountStrmToSell,
    { value: transactionValue },
  );
  console.log("7");
  let tx = await stramerInuRoter.sellSI(
    [sqdCall0, sqdCall1],
    bridgeToken,
    destinationNetwork,
    owner.address,
    payload,
    owner.address,
    amountStrmToSell,
    { value: transactionValue },
  );
  await tx.wait();
  console.log(tx);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
