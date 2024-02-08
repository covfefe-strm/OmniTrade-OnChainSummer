import { layerZeroEndpointsList } from "./deployHelpers/constants";
import { ethers } from "hardhat";
import hardhat from "hardhat";
async function main() {
  const myOFT = await ethers.getContractFactory("MyOFT");
  const endpointAddress = layerZeroEndpointsList.filter((obj) => {
    return obj.ChainID === hardhat.network.config.chainId;
  })[0].GatewayContract;
  const oft = await myOFT.deploy(
    "MyFirstOFT", // OFT name
    "MYOFT", // OFT symbol
    8, // shared decimals for your OFT
    endpointAddress, // chain endpoint address
  );
  // Wait for the deployment to finish
  await oft.waitForDeployment();
  console.log("Your OFT deployed to:", await oft.getAddress());
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
