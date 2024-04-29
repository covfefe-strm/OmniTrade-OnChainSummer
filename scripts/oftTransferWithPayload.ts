import * as dotenv from "dotenv";
dotenv.config();
import { ethers } from "hardhat";
import hardhat from "hardhat";
// import { MyOFT, MyOFT__factory } from "../typechain-types";
import { Contract, Provider } from "ethers";
// import { abi as PancakeRouterABI } from "../artifacts/contracts/dex/pancakeswap/PancakeRouterMock.sol/PancakeRouterMock.json";
// import { abi as MyOFTABI } from "../artifacts/contracts/MyOFT.sol/MyOFT.json";
// import { abi as SwapRouter02ABI } from "../artifacts/contracts/dex/uniswap/SwapRouter02Mock.sol/SwapRouter02Mock.json";
import { abi as TestCounterABI } from "../artifacts/contracts/test/TestCounter.sol/TestCounter.json";
import { constants, layerZeroEndpointsList } from "./helpers/constants";
// dev account
const devAddress = "0xC742385d01d590D7391E11Fe95E970B915203C18";
const devAddress2 = "0x6168387e85D0aC5b718EFCD5D2e28833D6e3D4d9";
const DEV_PRIVATE_KEY = process.env.DEV_PRIVATE_KEY
  ? process.env.DEV_PRIVATE_KEY
  : "0000000000000000000000000000000000000000000000000000000000000000";

// const InterfacePancakeRouter01 = new ethers.Interface(PancakeRouterABI);
// const InterfaceOFTToken = new ethers.Interface(MyOFTABI);
// const InterfaceSwapRouter = new ethers.Interface(SwapRouter02ABI);
const InterfaceTestCounter = new ethers.Interface(TestCounterABI);
//test
const SIRouterMumbai = "0x5Eb9940d9182B625c7516209F0Cf6e9BeDcaF360";
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
  /* const OFTFactoryBSC: MyOFT__factory = (await ethers.getContractFactory(
    "MyOFT",
    bscWallet,
  )) as MyOFT__factory;
  const OFTFactoryMumbai: MyOFT__factory = (await ethers.getContractFactory(
    "MyOFT",
    mumbaiWallet,
  )) as MyOFT__factory;
  const oftBSC: MyOFT = (await OFTFactoryBSC.attach(STR_BSC)) as MyOFT;
  const oftMumbai: MyOFT = (await OFTFactoryMumbai.attach(STR_MUMBAI)) as MyOFT; */
  let toAddress = ethers.zeroPadValue(
    "0x23Ac304E24a6c0FFBaB0d8b99f38c0b1FC3A724E",
    32,
  );
  console.log("toAddress", toAddress);
  // gas cost of the function "onOFTReceived" = ~83000 gas
  let amountOfGas = 360000; // total amoutn of gas for execution on destination chain
  let postHookGas = 85000; // amount of gas for post hook transaction execution
  const adapterParams = ethers.solidityPacked(
    ["uint16", "uint256"],
    [1, amountOfGas],
  );
  console.log("adapterParams", adapterParams);
  /* const abiCoder = new ethers.AbiCoder();
  const recipientPayload = "0x"; //abiCoder.encode(["address"], [devAddress2]);
  console.log("recipientPayload", recipientPayload);
  let callParams = {
    refundAddress: devAddress,
    zroPaymentAddress: constants.zeroAddress,
    adapterParams: adapterParams,
  };
  let amountToTransfer = ethers.parseEther("1");

  let transactionGasCost = (
    await oftBSC.estimateSendAndCallFee(
      layerZeroEndpointsList[1].endpointId,
      toAddress,
      amountToTransfer,
      recipientPayload,
      amountOfGas,
      false,
      adapterParams,
    )
  )[0];
  console.log("transactionGasCost", transactionGasCost);
  // to ensure that transaction will not fail
  await oftBSC.sendAndCall.staticCall(
    devAddress,
    layerZeroEndpointsList[1].endpointId,
    toAddress,
    ethers.parseEther("1"), //amount
    recipientPayload,
    postHookGas, //must be amountOfGas>=(postHookGas + minDstGas)
    callParams,
    { value: transactionGasCost },
  );
  // executing the transaction
  let tx = await oftBSC.sendAndCall(
    devAddress,
    layerZeroEndpointsList[1].endpointId,
    toAddress,
    ethers.parseEther("1"), //amount
    recipientPayload,
    postHookGas, //must be amountOfGas>=(postHookGas + minDstGas)
    callParams,
    { value: transactionGasCost },
  );
  await tx.wait();
  console.log("tx", tx); */
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
