import { deployData } from "./helpers/constants";
import { ethers } from "hardhat";
import hardhat from "hardhat";
async function main() {
  // const [owner] = await ethers.getSigners();
  const oftV1 = await ethers.getContractFactory("OFTMintMock");
  const oftV2 = await ethers.getContractFactory("OFTV2Mock");
  // BSC network
  const endpointV2BSCTestnet = "0x6EDCE65403992e310A62460808c4b910D972f10f";
  const endpointV1BSCTestnet = "0x6Fcb97553D41516Cb228ac03FdC8B9a0a9df04A1";
  // Polygon network
  const endpointV2Amoy = "0x6EDCE65403992e310A62460808c4b910D972f10f";
  const endpointV1Amoy = "0x55370E0fBB5f5b8dAeD978BA1c075a499eB107B8";
  const [owner] = await ethers.getSigners();

  // deploying of OFT V1
  const tokenV1 = await oftV1.deploy(
    "Funny Test Token", // OFT name
    "FTT", // OFT symbol
    8,
    endpointV1Amoy, // chain endpoint address
    owner.address,
  );
  // Wait for the deployment to finish
  await tokenV1.waitForDeployment();
  console.log("Your OFT V1 deployed to:", await tokenV1.getAddress());

  // deploying of OFT V2
  const tokenV2 = await oftV2.deploy(
    "Funny Test Token", // OFT name
    "FTT", // OFT symbol
    endpointV2Amoy, // chain endpoint address
    owner.address,
  );
  // Wait for the deployment to finish
  await tokenV2.waitForDeployment();
  console.log("Your OFT V2 deployed to:", await tokenV2.getAddress());

  // verification
  setTimeout(() => {}, 1000);
  await hardhat.run("verify:verify", {
    address: await tokenV1.getAddress(),
    constructorArguments: [
      "Funny Test Token", // OFT name
      "FTT", // OFT symbol
      8,
      endpointV1Amoy, // chain endpoint address
      owner.address,
    ],
  });
  await hardhat.run("verify:verify", {
    address: await tokenV2.getAddress(),
    constructorArguments: [
      "Funny Test Token", // OFT name
      "FTT", // OFT symbol
      endpointV2Amoy, // chain endpoint address
      owner.address,
    ],
  });

  await tokenV1.turnOnTrading();
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
