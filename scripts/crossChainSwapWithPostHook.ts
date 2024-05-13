import * as dotenv from "dotenv";
dotenv.config();
import { ethers } from "hardhat";
import hardhat from "hardhat";
import { BigNumberish } from "ethers";
import {
  layerZeroEndpointsList,
  crossChainAddresses,
  constants,
} from "./helpers/constants";
import {
  MyOFT,
  MyOFT__factory,
  SquidMulticall,
  SquidMulticall__factory,
  SquidRouter,
  SquidRouter__factory,
  PancakeRouterMock,
  PancakeRouterMock__factory,
  QuoterMock,
  QuoterMock__factory,
} from "../typechain-types";
import { Contract, Provider } from "ethers";
import { abi as PancakeRouterABI } from "../artifacts/contracts/dex/pancakeswap/PancakeRouterMock.sol/PancakeRouterMock.json";
import { abi as MyOFTABI } from "../artifacts/contracts/MyOFT.sol/MyOFT.json";
import { abi as SwapRouter02ABI } from "../artifacts/contracts/dex/uniswap/SwapRouter02Mock.sol/SwapRouter02Mock.json";
import { abi as TestCounterABI } from "../artifacts/contracts/test/TestCounter.sol/TestCounter.json";
import { abi as SIRouterABI } from "../artifacts/contracts/StreamerInuRouter.sol/StreamerInuRouter.json";
import { abi as QuoterABI } from "@uniswap/v3-periphery/artifacts/contracts/interfaces/IQuoter.sol/IQuoter.json";
// dev account
const devAddress = "0xC742385d01d590D7391E11Fe95E970B915203C18";
const DEV_PRIVATE_KEY = process.env.DEV_PRIVATE_KEY
  ? process.env.DEV_PRIVATE_KEY
  : "0000000000000000000000000000000000000000000000000000000000000000";

const InterfacePancakeRouter01 = new ethers.Interface(PancakeRouterABI);
const InterfaceOFTToken = new ethers.Interface(MyOFTABI);
const InterfaceSwapRouter = new ethers.Interface(SwapRouter02ABI);
const InterfaceTestCounter = new ethers.Interface(TestCounterABI);
const InterfaceSIRouter = new ethers.Interface(SIRouterABI);
const InterfaceQuoter = new ethers.Interface(QuoterABI);
//test
const testCounter = "0xa6fb676Abe115381a24F8523eD252deFef91068d";
const streamerInuRouterMumbai = "0xa33C33D74c0731080f8df325474427D2b85e0248";
//squid
const sqdRouterProxyBSC = "0x4f193853Cc053e08405b6aBd003AEEEF3DD08cb8";
const sqdRouterProxyMumbai = "0x4f193853Cc053e08405b6aBd003AEEEF3DD08cb8";
const sqdMulticalMumbai = "0x25E6c6519b5eD521ddA2BD64cd99d5a90a5242BC";
const sqdmulticalBSC = "0xbacF8F076d46b38f39252498730387f549508831";
//dexes
const dexRouterBSC = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1"; //PancakeSwap (PancakeRouter)
const factoryBSC = "0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865";
const dexRouterMumbai = ""; // Uniswap
const swapRouter02Mumbai = "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45";
const quoterUniswap = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6";
const factoryMumbai = "0x1F98431c8aD98523631AE4a59f267346ea31F984";
//pairs
const BNB_USDC_BSC = "0x3E9eB43FDcbC21790008AFc127AbE261F048ed58";
const WMATIC_aUSDC_MUMBAI = "0x47650544dd5194d191351bF4c095c17e5d54C538";
const WBNB_aUSDC_BSC = "0xa37f7f9e8753cC482E2807911816627E2eA62590";
const STR_MATIC_MUMBAI = "0xFbC32545401DA9eb734Fe009F975f8A0BE1ed754";
// tokens
const WMATIC = "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889";
const STR_MUMBAI = "0x2F7c52B0Dad83f193890821aC72b40fA15DC4d34";
const STR_BSC = "0xd2eE4CC081ACC37dA499d16F050ebDaef74082b1";
const USDC_BSC = "0x64544969ed7EBf5f083679233325356EbE738930";
const WBNB_BSC = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd";
const aUSDC_BSC = "0xc2fA98faB811B785b81c64Ac875b31CC9E40F9D2";
const aUSDC_Mumbai = "0x2c852e740B62308c46DD29B982FBb650D063Bd07";
const nativeCur = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const MIN = 60;

async function main() {
  const bscProvider: Provider = new ethers.JsonRpcProvider(
    "https://data-seed-prebsc-1-s1.binance.org:8545/",
  );
  const mumbaiProvider: Provider = new ethers.JsonRpcProvider(
    "https://polygon-mumbai-bor.publicnode.com",
  );
  const bscWallet = new ethers.Wallet(DEV_PRIVATE_KEY, bscProvider);
  const mumbaiWallet = new ethers.Wallet(DEV_PRIVATE_KEY, mumbaiProvider);
  const sqdRouterFactory: SquidRouter__factory =
    (await ethers.getContractFactory(
      "SquidRouter",
      bscWallet,
    )) as SquidRouter__factory;
  const sqdMulticallFactory: SquidMulticall__factory =
    (await ethers.getContractFactory(
      "SquidMulticall",
      bscWallet,
    )) as SquidMulticall__factory;
  const QuoterMockFactory: QuoterMock__factory =
    (await ethers.getContractFactory(
      "QuoterMock",
      mumbaiWallet,
    )) as QuoterMock__factory;

  const PancakeRouterFactory: PancakeRouterMock__factory =
    (await ethers.getContractFactory(
      "PancakeRouterMock",
      bscWallet,
    )) as PancakeRouterMock__factory;

  const OFTFactory: MyOFT__factory = (await ethers.getContractFactory(
    "MyOFT",
    mumbaiWallet,
  )) as MyOFT__factory;
  const sqdRouter: SquidRouter = (await sqdRouterFactory.attach(
    sqdRouterProxyBSC,
  )) as SquidRouter;
  const sqdMulticall: SquidMulticall = (await sqdMulticallFactory.attach(
    sqdmulticalBSC,
  )) as SquidMulticall;
  const quoter: QuoterMock = (await QuoterMockFactory.attach(
    crossChainAddresses.mumbai.dexes.uniswap.quoter,
  )) as QuoterMock;
  const pancakeRouter: PancakeRouterMock = (await PancakeRouterFactory.attach(
    crossChainAddresses.bscTestnet.dexes.pancakeSwap.pancakeRouter,
  )) as PancakeRouterMock;
  const myOFT: MyOFT = (await OFTFactory.attach(STR_MUMBAI)) as MyOFT;

  // estimation of aUSDC amount
  const devAddressBytes32 = ethers.zeroPadValue(devAddress, 32);
  const gasCostOfOFTTransf = (
    await myOFT.estimateSendFee.staticCallResult(
      layerZeroEndpointsList[0].endpointId,
      devAddressBytes32,
      ethers.parseEther("1"),
      false,
      constants.defAdaptParams,
    )
  )[0];
  console.log("gasCostOfOFTTransf", gasCostOfOFTTransf);
  const amountOfaUSDC = (
    await quoter.quoteExactOutputSingle.staticCallResult(
      crossChainAddresses.mumbai.aUSDC,
      crossChainAddresses.mumbai.wETH,
      100n,
      gasCostOfOFTTransf,
      0,
    )
  )[0];
  console.log("amountOfaUSDC", amountOfaUSDC);
  /* 
      Because the liquidity pool aUSDC->WBNB doesn't have enough liquidity to swap ~7 aUSDC
      I decided test it will available amount 1 aUSDC token
      On the mainnet you must request greater amount than "amountOfaUSDC"
  */
  const amountOfBNBToSwap = (
    await pancakeRouter.getAmountsIn.staticCallResult(
      ethers.parseUnits("1", 6), // + amountOfaUSDC
      [WBNB_BSC, aUSDC_BSC],
    )
  )[0][0];
  console.log("amountOfBNBToSwap", amountOfBNBToSwap);

  const blockTimestamp = (
    await bscProvider.getBlock(await bscProvider.getBlockNumber())
  ).timestamp;
  const deadline = blockTimestamp + MIN * 10;
  console.log("deadline", deadline);
  //swapExactETHForTokens
  // const decodedData = InterfacePancakeRouter01.decodeFunctionData(
  //   "swapExactETHForTokens",
  //   "0x7ff36ab5000000000000000000000000000000000000000000000000000000000000e75800000000000000000000000000000000000000000000000000000000000000800000000000000000000000004f193853cc053e08405b6abd003aeeef3dd08cb80000000000000000000000000000000000000000000000000000018dd6034ed20000000000000000000000000000000000000000000000000000000000000002000000000000000000000000ae13d989dac2f0debff460ac112a837c89baa7cd000000000000000000000000c2fa98fab811b785b81c64ac875b31cc9e40f9d2",
  // );
  // console.log(decodedData);

  const calldataSwapWBNBtoaUSDC = InterfacePancakeRouter01.encodeFunctionData(
    "swapExactETHForTokens",
    [
      1, //amountOutMin
      [WBNB_BSC, aUSDC_BSC],
      sqdRouterProxyBSC,
      deadline,
    ],
  );
  console.log("calldataSwapWBNBtoaUSDC", calldataSwapWBNBtoaUSDC);

  const abiCoder = new ethers.AbiCoder();
  /* 
    CALL#0 Sending aUSDC token from squidRouter to multisig
  */
  const call0Payload = ethers.zeroPadValue(aUSDC_Mumbai, 32);
  const call0 = [
    3n,
    "0x0000000000000000000000000000000000000000",
    0n,
    "0x",
    call0Payload,
  ];
  /* 
    CALL#1
    here you need transfer amount of aUSDC tokens which you want to swap for MATIC
    usualy it must be equal to "amountOfaUSDC" variable
    but in this example we will swap only 0.0001 aUSDC
  */
  const call1data = InterfaceOFTToken.encodeFunctionData("transfer", [
    swapRouter02Mumbai,
    ethers.parseUnits("1", 2),
  ]);
  const call1 = [0n, aUSDC_Mumbai, 0n, call1data, "0x"];
  /* 
    CALL#2
    after transfer we need to call function exactInputSingle
    to swap aUSDC->MATIC
  */
  const call2data = InterfaceSwapRouter.encodeFunctionData("exactInputSingle", [
    {
      tokenIn: aUSDC_Mumbai,
      tokenOut: WMATIC,
      fee: 100,
      recipient: crossChainAddresses.mumbai.SquidMulticall,
      amountIn: 0,
      amountOutMinimum: 0,
      sqrtPriceLimitX96: 0,
    },
  ]);
  const call2 = [0n, swapRouter02Mumbai, 0n, call2data, "0x"];
  /* 
    CALL#3 transfer remainder of STRM token to SwapRouter
  */
  const call3data = InterfaceOFTToken.encodeFunctionData("transfer", [
    swapRouter02Mumbai,
    0n,
  ]);
  const call3payload = abiCoder.encode(
    ["address", "uint256"],
    [aUSDC_Mumbai, 1n],
  );
  const call3 = [1n, aUSDC_Mumbai, 0n, call3data, call3payload];
  /* 
    CALL#4
    after we get MATIC, we can swap remainder of aUSDC tokens to STRM and transfer them to SIRouter SC
    We need to call function exactInputSingle
    One of parameters is encoded swap path, you can check example of the creation vai link below
    https://ethereum.stackexchange.com/questions/142406/uniswap-encode-path-in-typescript
    Example of our encoded path:
    0x2c852e740B62308c46DD29B982FBb650D063Bd07 aUSDC
    000064 hex 100
    9c3C9283D3e44854697Cd22D3Faa240Cfb032889 WMATIC
    000064 hex 100
    2F7c52B0Dad83f193890821aC72b40fA15DC4d34 STR
  */
  const encodedSwapPath =
    "0x2c852e740B62308c46DD29B982FBb650D063Bd070000649c3C9283D3e44854697Cd22D3Faa240Cfb0328890000642F7c52B0Dad83f193890821aC72b40fA15DC4d34";
  const call4data = InterfaceSwapRouter.encodeFunctionData("exactInput", [
    {
      path: encodedSwapPath,
      recipient: streamerInuRouterMumbai,
      amountIn: 0,
      amountOutMinimum: 0,
    },
  ]);
  const call4 = [0n, swapRouter02Mumbai, 0n, call4data, "0x"];
  /* 
    CALL#5 Triggering sendFrom OFT transfer and passing all native tokens
    we need encode recipient address to bytes32
  */
  const call5data = InterfaceSIRouter.encodeFunctionData(
    "sendOFTTokenToOwner",
    [
      layerZeroEndpointsList[0].endpointId,
      devAddressBytes32, // tokens recipient
      devAddress, //refund address
    ],
  );
  const call5 = [2n, streamerInuRouterMumbai, 0n, call5data, "0x"];
  // encoding calldata
  const axelarCallABI = [
    "tuple(uint256, address, uint256, bytes, bytes)[]",
    "address",
    "bytes32",
  ];
  const axelarCallData = abiCoder.encode(axelarCallABI, [
    [call0, call1, call2, call3, call4, call5],
    devAddress,
    "0x0000000000000000000000000000000000000000000000000000000000000000",
  ]);
  /* 
    Main structure of axelar call:
    struct Call {
      CallType callType;
      address target;
      uint256 value;
      bytes callData;
      bytes payload;
    }
  */
  console.log("static call start");
  console.log("devAddressBytes32", devAddressBytes32);
  await sqdRouter.callBridgeCall.staticCall(
    nativeCur,
    amountOfBNBToSwap,
    [
      {
        callType: 2n,
        target: dexRouterBSC,
        value: 0n,
        callData: calldataSwapWBNBtoaUSDC,
        payload: "0x",
      },
    ],
    "aUSDC",
    "Polygon",
    sqdRouterProxyMumbai,
    axelarCallData, //calldata for axelar
    devAddress,
    false,
    { value: ethers.parseEther("0.1") },
  );
  console.log("call start");
  /* const tx = await sqdRouter.callBridgeCall(
    nativeCur,
    amountOfBNBToSwap,
    [
      {
        callType: 2n,
        target: dexRouterBSC,
        value: 0n,
        callData: calldataSwapWBNBtoaUSDC,
        payload: "0x",
      },
    ],
    "aUSDC",
    "Polygon",
    sqdRouterProxyMumbai,
    axelarCallData, //calldata for axelar
    devAddress,
    false,
    { value: ethers.parseEther("0.1") },
  );

  console.log(tx); */
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
async function getGasCostOdOFTTransfer() {}
async function getAmountaUSDCToCoverOFTTransfer(
  provider: Provider,
  gasCost: bigint,
) {}
