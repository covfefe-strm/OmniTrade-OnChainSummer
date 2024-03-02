import * as dotenv from "dotenv";
dotenv.config();
import { ethers } from "hardhat";
import hardhat from "hardhat";
import {
  MyOFT,
  MyOFT__factory,
  StreamerInuRouter,
  StreamerInuRouter__factory,
  QuoterMock,
  QuoterMock__factory,
} from "../typechain-types";
import { Contract, Provider } from "ethers";
import { abi as PancakeRouterABI } from "../artifacts/contracts/dex/pancakeswap/PancakeRouterMock.sol/PancakeRouterMock.json";
import { abi as MyOFTABI } from "../artifacts/contracts/MyOFT.sol/MyOFT.json";
import { abi as SwapRouter02ABI } from "../artifacts/contracts/dex/uniswap/SwapRouter02Mock.sol/SwapRouter02Mock.json";
import { abi as TestCounterABI } from "../artifacts/contracts/test/TestCounter.sol/TestCounter.json";
import {
  constants,
  crossChainAddresses,
  layerZeroEndpointsList,
} from "./helpers/constants";
// dev account
const devAddress = "0xC742385d01d590D7391E11Fe95E970B915203C18";
const DEV_PRIVATE_KEY = process.env.DEV_PRIVATE_KEY
  ? process.env.DEV_PRIVATE_KEY
  : "0000000000000000000000000000000000000000000000000000000000000000";

const InterfacePancakeRouter01 = new ethers.Interface(PancakeRouterABI);
const InterfaceOFTToken = new ethers.Interface(MyOFTABI);
const InterfaceSwapRouter = new ethers.Interface(SwapRouter02ABI);
const InterfaceTestCounter = new ethers.Interface(TestCounterABI);
//test
const SIRouterMumbai = "0x5Eb9940d9182B625c7516209F0Cf6e9BeDcaF360";
//contracts
const SWAP_ROUTER = "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45";
const PANCAKE_ROUTER = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1";
// tokens
const STR_BSC = "0xd2eE4CC081ACC37dA499d16F050ebDaef74082b1";
const STR_MUMBAI = "0x2F7c52B0Dad83f193890821aC72b40fA15DC4d34";
const nativeCur = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

async function main() {
  console.log("script started");
  const bscProvider: Provider = new ethers.JsonRpcProvider(
    "https://data-seed-prebsc-1-s1.binance.org:8545/",
  );
  const mumbaiProvider: Provider = new ethers.JsonRpcProvider(
    "https://polygon-mumbai-bor.publicnode.com",
  );
  const bscWallet = new ethers.Wallet(DEV_PRIVATE_KEY, bscProvider);
  const mumbaiWallet = new ethers.Wallet(DEV_PRIVATE_KEY, mumbaiProvider);
  const OFTFactoryMumbai: MyOFT__factory = (await ethers.getContractFactory(
    "MyOFT",
    mumbaiWallet,
  )) as MyOFT__factory;
  const SIRouterFactory: StreamerInuRouter__factory =
    (await ethers.getContractFactory(
      "StreamerInuRouter",
      mumbaiWallet,
    )) as StreamerInuRouter__factory;
  const QuoterMockFactory: QuoterMock__factory =
    (await ethers.getContractFactory(
      "QuoterMock",
      mumbaiWallet,
    )) as QuoterMock__factory;
  //   const oftBSC: MyOFT = (await OFTFactoryBSC.attach(STR_BSC)) as MyOFT;
  const oftMumbai: MyOFT = (await OFTFactoryMumbai.attach(STR_MUMBAI)) as MyOFT;
  const stramerInuRoter: StreamerInuRouter = (await SIRouterFactory.attach(
    SIRouterMumbai,
  )) as StreamerInuRouter;
  const quoterMock: QuoterMock = (await QuoterMockFactory.attach(
    crossChainAddresses.mumbai.dexes.uniswap.quoter,
  )) as QuoterMock;
  const abiCoder = new ethers.AbiCoder();
  const amountSiToSell = ethers.parseEther("0.001");
  // covering the axelar cross chain swap
  // axelar scan requested 4.6 matic for execution of the transaction
  // but in the end cost of the transaction cost ~2 matic -_-
  const transactionValue = ethers.parseEther("2.2");
  // Calls on Mumbai chain - swap SI to aUSDC
  /* 
    0x2F7c52B0Dad83f193890821aC72b40fA15DC4d34 STR
    000064 hex 100
    9c3C9283D3e44854697Cd22D3Faa240Cfb032889 WMATIC
    000064 hex 100
    0x2c852e740B62308c46DD29B982FBb650D063Bd07 aUSDC
  */
  const swapPathSIaUSDC =
    "0x2F7c52B0Dad83f193890821aC72b40fA15DC4d340000649c3C9283D3e44854697Cd22D3Faa240Cfb0328890000642c852e740B62308c46DD29B982FBb650D063Bd07";
  const aUSDCOut = (
    await quoterMock.quoteExactInput.staticCallResult(
      swapPathSIaUSDC,
      amountSiToSell,
    )
  )[0];
  console.log("Amount aUSDC after swap", aUSDCOut);
  if (aUSDCOut == 0n) {
    return;
  }
  const sqdCall0Data = InterfaceOFTToken.encodeFunctionData("approve", [
    crossChainAddresses.mumbai.dexes.uniswap.swapRouter,
    amountSiToSell,
  ]);
  const sqdCall0 = {
    callType: 0n,
    target: STR_MUMBAI,
    value: 0n,
    callData: sqdCall0Data,
    payload: "0x",
  };
  const sqdCall1Data = InterfaceSwapRouter.encodeFunctionData("exactInput", [
    {
      path: swapPathSIaUSDC,
      recipient: crossChainAddresses.mumbai.SquidRouter,
      amountIn: amountSiToSell,
      amountOutMinimum: 1,
    },
  ]);
  const sqdCall1 = {
    callType: 0n,
    target: SWAP_ROUTER,
    value: 0n,
    callData: sqdCall1Data,
    payload: "0x",
  };
  // Calls on Mumbai chain - swap aUSDC to choosed token
  /* 
    CALL#0 Sending aUSDC token from squidRouter to multisig
  */
  const call0payload = ethers.zeroPadValue(
    crossChainAddresses.mumbai.aUSDC,
    32,
  );
  const call0 = [
    3n,
    "0x0000000000000000000000000000000000000000",
    0n,
    "0x",
    call0payload,
  ];
  /* 
    CALL#1 Approve aUSDC to PancakeRouter SC
  */
  const call1data = InterfaceOFTToken.encodeFunctionData("approve", [
    PANCAKE_ROUTER,
    0,
  ]);
  const call1payload = abiCoder.encode(
    ["address", "uint256"],
    [crossChainAddresses.mumbai.aUSDC, 1n],
  );
  const call1 = [
    1n,
    crossChainAddresses.bscTestnet.aUSDC,
    0n,
    call1data,
    call1payload,
  ];
  /* 
    CALL#2 Swap aUSDC to choosed user token
  */
  const blockTimestamp = (
    await bscProvider.getBlock(await bscProvider.getBlockNumber())
  ).timestamp;
  const deadline = blockTimestamp + 60 * 20;
  const call2data = InterfacePancakeRouter01.encodeFunctionData(
    "swapExactTokensForTokens",
    [
      0,
      1,
      [
        crossChainAddresses.bscTestnet.aUSDC,
        crossChainAddresses.bscTestnet.wETH,
      ],
      devAddress,
      deadline,
    ],
  );
  const call2payload = abiCoder.encode(
    ["address", "uint256"],
    [crossChainAddresses.mumbai.aUSDC, 0n],
  );
  const call2 = [1n, PANCAKE_ROUTER, 0n, call2data, call2payload];
  const axelarCallABI = [
    "tuple(uint256, address, uint256, bytes, bytes)[]",
    "address",
    "bytes32",
  ];
  const payload = abiCoder.encode(axelarCallABI, [
    [call0, call1, call2],
    devAddress,
    "0x0000000000000000000000000000000000000000000000000000000000000000",
  ]);
  await stramerInuRoter.sellSI.staticCall(
    [sqdCall0, sqdCall1],
    payload,
    10102,
    devAddress,
    amountSiToSell,
    { value: transactionValue },
  );
  let tx = await stramerInuRoter.sellSI(
    [sqdCall0, sqdCall1],
    payload,
    10102,
    devAddress,
    amountSiToSell,
    { value: transactionValue },
  );
  await tx.wait();
  console.log(tx);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
