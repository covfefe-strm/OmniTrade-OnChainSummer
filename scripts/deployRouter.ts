import { deployData, listOfLzChainIds } from "./helpers/constants";
import { ethers } from "hardhat";
import hardhat from "hardhat";
const STRM = "0xfE4717F60Ac5603dC6863700Cd8ECF805908688D"; //address of strm on deployed chain
// source of the addresses https://docs.squidrouter.com/dev-resources/contract-addresses
const SQD_ROUTER = "0xce16F69375520ab01377ce7B88f5BA8C48F8D666";
const SQD_MULTICALL = "0xEa749Fd6bA492dbc14c24FE8A3d08769229b896c";
async function main() {
  const Router = await ethers.getContractFactory("StreamerInuRouter");
  const [owner] = await ethers.getSigners();
  const router = await Router.deploy(STRM, SQD_ROUTER, SQD_MULTICALL);
  await router.waitForDeployment();
  console.log("router", await router.getAddress());
  setTimeout(() => {}, 10000);
  await hardhat.run("verify:verify", {
    address: await router.getAddress(),
    constructorArguments: [STRM, SQD_ROUTER, SQD_MULTICALL],
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
