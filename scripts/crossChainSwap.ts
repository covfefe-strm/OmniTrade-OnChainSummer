import * as dotenv from "dotenv";
dotenv.config();
import { ethers } from "hardhat";
import hardhat from "hardhat";
import {
  SquidMulticall,
  SquidMulticall__factory,
  SquidRouter,
  SquidRouter__factory,
} from "../typechain-types";
import { Contract, Provider } from "ethers";
// dev account
const devAddress = "0xC742385d01d590D7391E11Fe95E970B915203C18";
const DEV_PRIVATE_KEY = process.env.DEV_PRIVATE_KEY
  ? process.env.DEV_PRIVATE_KEY
  : "0000000000000000000000000000000000000000000000000000000000000000";
//test
const mockCounter = "0xa6fb676Abe115381a24F8523eD252deFef91068d";
//squid
const sqdRouterProxyBSC = "0x4f193853Cc053e08405b6aBd003AEEEF3DD08cb8";
const sqdRouterProxyMumbai = "0x4f193853Cc053e08405b6aBd003AEEEF3DD08cb8";
const sqdMulticalMumbai = "0x25E6c6519b5eD521ddA2BD64cd99d5a90a5242BC";
const sqdmulticalBSC = "0xbacF8F076d46b38f39252498730387f549508831";
//dexes
const dexRouterBSC = "0x9a489505a00cE272eAa5e07Dba6491314CaE3796"; //PancakeSwap
const factoryBSC = "0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865";
const dexRouterMumbai = ""; // Uniswap
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

async function main() {
  const bscProvider: Provider = new ethers.JsonRpcProvider(
    "https://data-seed-prebsc-1-s1.binance.org:8545/",
  );
  const mumbaiProvider: Provider = new ethers.JsonRpcProvider(
    "https://polygon-mumbai-bor.publicnode.com",
  );
  const bscWallet = new ethers.Wallet(DEV_PRIVATE_KEY, bscProvider);
  const mumbaiWallet = new ethers.Wallet(DEV_PRIVATE_KEY, mumbaiProvider);
  console.log(bscProvider);
  console.log(mumbaiProvider);
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
  // const calldataSwapWBNBtoaUSDC;


  
  // const tx = await sqdRouter.callBridgeCall(
  //   nativeCur,
  //   ethers.parseEther("0.0001"),
  //   [calldata for PancakeSwap swap ]
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
