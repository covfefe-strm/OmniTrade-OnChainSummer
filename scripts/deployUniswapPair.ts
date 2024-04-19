import { layerZeroEndpointsList } from "./helpers/constants";
import BN from "bn.js";
import { abi as ManagerABI } from "../artifacts/contracts/test/NonfungiblePositionManagerMock.sol/NonfungiblePositionManagerMock.json";
import { ethers } from "hardhat";
import hardhat from "hardhat";
import { NonfungiblePositionManagerMock } from "../typechain-types";
import { BigNumber, FixedNumber } from "@ethersproject/bignumber";
import { formatFixed, parseFixed } from "@ethersproject/bignumber";
let calldata =
  "0x13ead56200000000000000000000000053e2dfe5ebab390a8f800a905479049f5b21a211000000000000000000000000833589fcd6edb6e08f4c7c32d4f71b54bda029130000000000000000000000000000000000000000000000000000000000000bb800000000000000000000000000000000000000000000007706495c97c53e6730";
const MANAGER_ETH = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";
const MANAGER_BASE = "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1";
async function main() {
  const InterfaceManager = new ethers.Interface(ManagerABI);
  console.log(
    "decoded data",
    InterfaceManager.decodeFunctionData(
      "createAndInitializePoolIfNecessary",
      calldata,
    ),
  );
  const [owner] = await ethers.getSigners();
  const ManagerV3 = await ethers.getContractFactory(
    "NonfungiblePositionManagerMock",
  );
  // const Erc20 = await ethers.getContractFactory("ERC20Mock");
  // const OFT = await ethers.getContractFactory("StreamerInuToken");
  //tokenB per tokenA
  //first token must be STRM!!!!!!!!!!!!
  //second token must be USDC!!!!!!!!!!!!
  //second token must be MATIC
  let constPrice = 2198468647038062176764044359n;
  let constPrice2 = 2195615539815883106096n;
  // let celoEndpoint = "0xae92d5aD7583AD66E49A0c67BAd18F6ba52dDDc1";
  //   const token1 = await Erc20.deploy("TTA", "TestTokenA");
  //   const oft = await OFT.deploy(
  //     "STRM Test",
  //     "STRM",
  //     8,
  //     celoEndpoint,
  //     owner.address,
  //   );
  //   await token1.waitForDeployment();
  //   await oft.waitForDeployment();
  // const token1 = await Erc20.attach(
  //   "0x33FADE06385EE78f4429C2fb86696C98d3042A12",
  // );
  // const oft = await OFT.attach("0x73142c86353011e973413d7cF458912cD3473078");
  const manager = (await ManagerV3.attach(
    MANAGER_BASE,
  )) as NonfungiblePositionManagerMock;
  //   setTimeout(() => {}, 1000);
  // await hardhat.run("verify:verify", {
  //   address: await oft.getAddress(),
  //   constructorArguments: ["STRM Test", "STRM", 8, celoEndpoint, owner.address],
  // });
  //   console.log("sqrtPriceX96", sqrtPriceX96.toString());
  let tx = await manager.createAndInitializePoolIfNecessary(
    "0xfE4717F60Ac5603dC6863700Cd8ECF805908688D",
    "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    500,
    constPrice,
  );
  console.log(tx);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
