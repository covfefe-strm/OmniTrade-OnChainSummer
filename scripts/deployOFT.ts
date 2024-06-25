import { deployData } from "./helpers/constants";
import { ethers } from "hardhat";
import hardhat from "hardhat";
async function main() {
  const myOFT = await ethers.getContractFactory("OFTV2Mock");
  const endpointAddress = "0x6EDCE65403992e310A62460808c4b910D972f10f";
  // const endpointAddress = deployData.filter((obj) => {
  //   return obj.ChainID === hardhat.network.config.chainId;
  // })[0].endpoint;
  const [owner] = await ethers.getSigners();
  const oft = await myOFT.deploy(
    "Funny Test Token", // OFT name
    "FTT", // OFT symbol
    endpointAddress, // chain endpoint address
    owner.address,
  );
  // Wait for the deployment to finish
  await oft.waitForDeployment();
  console.log("Your OFT deployed to:", await oft.getAddress());
  setTimeout(() => {}, 1000);
  await hardhat.run("verify:verify", {
    address: await oft.getAddress(),
    constructorArguments: [
      "Funny Test Token", // OFT name
      "FTT", // OFT symbol
      endpointAddress, // chain endpoint address
      owner.address,
    ],
  });
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
