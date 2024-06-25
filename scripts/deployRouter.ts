import { deployData, listOfLzChainIds } from "./helpers/constants";
import { ethers } from "hardhat";
import hardhat from "hardhat";
const ENDPOINT = "0x6EDCE65403992e310A62460808c4b910D972f10f";
const SQD_ROUTER = "0xC3468a191Fe51815b26535ED1F82C1f79e6Ec37D";
const SQD_MULTICALL = "0x7a4F2BCdDf68C98202cbad13c4f3a04FF2405681";
async function main() {
  const Router = await ethers.getContractFactory("StreamerInuRouter");
  const [owner] = await ethers.getSigners();
  const router = await Router.deploy(SQD_ROUTER, SQD_MULTICALL);
  await router.waitForDeployment();
  console.log("router", await router.getAddress());
  setTimeout(() => {}, 1000);
  await hardhat.run("verify:verify", {
    address: await router.getAddress(),
    constructorArguments: [SQD_ROUTER, SQD_MULTICALL],
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
