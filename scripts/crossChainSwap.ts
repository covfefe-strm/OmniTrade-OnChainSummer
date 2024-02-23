import * as dotenv from "dotenv";
dotenv.config();
import { ethers } from "hardhat";
import hardhat from "hardhat";
import {
  SquidMulticall,
  SquidMulticall__factory,
  SquidRouter,
  SquidRouter__factory,
  PancakeRouter,
  PancakeRouter__factory,
  IPancakeRouter01,
} from "../typechain-types";
import { Contract, Provider } from "ethers";
import { abi as PancakeRouterABI } from "../artifacts/contracts/dex/pancakeswap/PancakeRouterMock.sol/PancakeRouter.json";
import { abi as MyOFTABI } from "../artifacts/contracts/MyOFT.sol/MyOFT.json";
import { abi as SwapRouter02ABI } from "../artifacts/contracts/dex/uniswap/SwapRouter02Mock.sol/SwapRouter02Mock.json";
import { abi as TestCounterABI } from "../artifacts/contracts/test/TestCounter.sol/TestCounter.json";
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
const testCounter = "0xa6fb676Abe115381a24F8523eD252deFef91068d";
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
const STR = "0x2F7c52B0Dad83f193890821aC72b40fA15DC4d34";
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
  const sqdRouter: SquidRouter = (await sqdRouterFactory.attach(
    sqdRouterProxyBSC,
  )) as SquidRouter;
  const sqdMulticall: SquidMulticall = (await sqdMulticallFactory.attach(
    sqdmulticalBSC,
  )) as SquidMulticall;
  const blockTimestamp = (
    await bscProvider.getBlock(await bscProvider.getBlockNumber())
  ).timestamp;
  const deadline = blockTimestamp + MIN * 10;
  console.log("blockTimestamp", blockTimestamp);
  const pancakeRouterFacotry: PancakeRouter__factory =
    await ethers.getContractFactory("PancakeRouter", bscWallet);
  const pancakeRouter: PancakeRouter = (await pancakeRouterFacotry.attach(
    dexRouterBSC,
  )) as PancakeRouter;
  console.log("router test", await pancakeRouter.factory());
  //swapExactETHForTokens
  const decodedData = InterfacePancakeRouter01.decodeFunctionData(
    "swapExactETHForTokens",
    "0x7ff36ab5000000000000000000000000000000000000000000000000000000000000e75800000000000000000000000000000000000000000000000000000000000000800000000000000000000000004f193853cc053e08405b6abd003aeeef3dd08cb80000000000000000000000000000000000000000000000000000018dd6034ed20000000000000000000000000000000000000000000000000000000000000002000000000000000000000000ae13d989dac2f0debff460ac112a837c89baa7cd000000000000000000000000c2fa98fab811b785b81c64ac875b31cc9e40f9d2",
  );
  console.log(decodedData);
  const calldataSwapWBNBtoaUSDC = InterfacePancakeRouter01.encodeFunctionData(
    "swapExactETHForTokens",
    [1, [WBNB_BSC, aUSDC_BSC], sqdRouterProxyBSC, deadline],
  );
  console.log("calldataSwapWBNBtoaUSDC", calldataSwapWBNBtoaUSDC);
  const abiCoder = new ethers.AbiCoder();
  const call0Payload = ethers.zeroPadValue(aUSDC_Mumbai, 32);
  const call1data = InterfaceOFTToken.encodeFunctionData("transfer", [
    swapRouter02Mumbai,
    0n,
  ]);
  const call1payload = abiCoder.encode(
    ["address", "uint256"],
    [aUSDC_Mumbai, 1n],
  );
  // 0x2c852e740B62308c46DD29B982FBb650D063Bd07 aUSDC
  // 000064 hex 100
  // 9c3C9283D3e44854697Cd22D3Faa240Cfb032889 WMATIC
  // 000064 hex 100
  // 2F7c52B0Dad83f193890821aC72b40fA15DC4d34 STR
  const encodedSwapPath =
    "0x2c852e740B62308c46DD29B982FBb650D063Bd070000649c3C9283D3e44854697Cd22D3Faa240Cfb0328890000642F7c52B0Dad83f193890821aC72b40fA15DC4d34";
  const call2data = InterfaceSwapRouter.encodeFunctionData("exactInput", [
    {
      path: encodedSwapPath,
      recipient: devAddress,
      amountIn: 0,
      amountOutMinimum: 0,
    },
  ]);
  const call3data = InterfaceTestCounter.encodeFunctionData("incCounter", []);
  console.log("call0Payload", call0Payload);
  console.log("call1data", call1data);
  console.log("call1payload", call1payload);
  console.log("call3data", call3data);
  const axelarCallABI = [
    "tuple(uint256, address, uint256, bytes, bytes)[]",
    "address",
    "bytes32",
  ];
  const axelarCallData = abiCoder.encode(axelarCallABI, [
    [
      [
        3n,
        "0x0000000000000000000000000000000000000000",
        0n,
        "0x",
        call0Payload,
      ],
      [1n, aUSDC_Mumbai, 0n, call1data, call1payload],
      [0n, swapRouter02Mumbai, 0n, call2data, "0x"],
      [0n, testCounter, 0n, call3data, "0x"],
    ],
    devAddress,
    "0x0000000000000000000000000000000000000000000000000000000000000000",
  ]);
  // struct Call {
  //   CallType callType;
  //   address target;
  //   uint256 value;
  //   bytes callData;
  //   bytes payload;
  // }
  //call data for axelar transaction
  // the first call we transfer aUSDC from axelar to multisig
  // struct Call {
  //   CallType callType; 3n
  //   address target; '0x0000000000000000000000000000000000000000'
  //   uint256 value; 0n
  //   bytes callData; '0x'
  //   bytes payload; '0x0000000000000000000000002c852e740b62308c46dd29b982fbb650d063bd07'
  // }
  // at second we need to transfer aUSDC to SwapRouter02
  // struct Call {
  //   CallType callType; 1n
  //   address target; '0x2c852e740B62308c46DD29B982FBb650D063Bd07'
  //   uint256 value; 0n
  //   bytes callData; '0x' encode transfer(address, uint256)(swapRouter address, 0)
  //   bytes payload; '0x' ecnode (address, uint256) (token address , 1)
  // }
  // at third we need to swap aUSDC->WMatic->STR
  // struct Call {
  //   CallType callType; 0n
  //   address target; '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45'
  //   uint256 value; 0n
  //   bytes callData; '0x' encode exactInput(ExactInputParams memory params)(
  //       bytes path; aUSDC address + 000 + hex fee + WMATIC(without 0x) + hex fee + STR(without 0x)
  //       address recipient; devAddres
  //       uint256 amountIn; 0
  //       uint256 amountOutMinimum; 0
  //   )
  //   bytes payload; '0x'
  // }
  // struct ExactInputParams {
  //       bytes path;
  //       address recipient;
  //       uint256 amountIn;
  //       uint256 amountOutMinimum;
  // }
  // at last call to out testCounter
  // struct Call {
  //   CallType callType; 0n
  //   address target; testCounter
  //   uint256 value; 0n
  //   bytes callData; '0x' encode incCounter()
  //   bytes payload; '0x'
  // }

  const tx = await sqdRouter.callBridgeCall(
    nativeCur,
    ethers.parseEther("0.0001"),
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

  // const tx = await sqdRouter.callBridgeCall.staticCall(
  //   nativeCur,
  //   ethers.parseEther("0.0001"),
  //   [[2n, dexRouterBSC, 0n, calldataSwapWBNBtoaUSDC, "0x"]],
  //   "aUSDC",
  //   "Polygon",
  //   sqdRouterProxyMumbai,
  //   axelarCallData, //calldata for axelar
  //   devAddress,
  //   false,
  //   { value: ethers.parseEther("0.1") },
  // );

  // let QuouterFactory = new ethers.ContractFactory(
  //   QuoterABI,
  //   QuoterBytecode,
  //   mumbaiWallet,
  // );
  // const quouter = await QuouterFactory.attach(quoterUniswap);
  // await quouter.
  // console.log(quouter);
  // let res = await quouter.connect(mumbaiWallet);
  // console.log(await bscProvider.getBalance(devAddress));
  // console.log(await mumbaiProvider.getBalance(devAddress));
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
