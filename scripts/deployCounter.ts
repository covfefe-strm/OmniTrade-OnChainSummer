import { layerZeroEndpointsList } from "./helpers/constants";
import { ethers } from "hardhat";
import hardhat from "hardhat";
async function main() {
  const counterFactory = await ethers.getContractFactory("TestCounter");
  const counter = await counterFactory.deploy();
  await counter.waitForDeployment();
  console.log("Your counter deployed to:", await counter.getAddress());
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
