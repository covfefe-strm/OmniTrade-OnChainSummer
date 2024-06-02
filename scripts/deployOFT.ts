import { deployData } from "./helpers/constants";
import { ethers } from "hardhat";
import hardhat from "hardhat";
async function main() {
  const myOFT = await ethers.getContractFactory("StreamerInuToken");
  const endpointAddress = deployData.filter((obj) => {
    return obj.ChainID === hardhat.network.config.chainId;
  })[0].endpoint;
  const [owner] = await ethers.getSigners();
  const oft = await myOFT.deploy(
    "StreamerInu", // OFT name
    "STRM", // OFT symbol
    8, // shared decimals for your OFT
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
      "StreamerInu",
      "STRM",
      8,
      endpointAddress,
      owner.address,
    ],
  });
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
