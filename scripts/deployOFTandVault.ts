import { deployData, listOfLzChainIds } from "./helpers/constants";
import { ethers } from "hardhat";
import hardhat from "hardhat";
import { StreamerInuToken } from "../typechain-types";
async function main() {
  const STRM = await ethers.getContractFactory("StreamerInuToken");
  const Vault = await ethers.getContractFactory("StreamerInuVault");
  const chainId = hardhat.network.config.chainId;
  const chainData = deployData.filter((obj) => {
    return obj.ChainID === chainId;
  })[0];
  const [owner] = await ethers.getSigners();
  console.log("start");
  console.log("dev address", owner.address);
  const strm = await STRM.deploy(
    "StreamerInu", // OFT name
    "STRM", // OFT symbol
    8, // shared decimals for your OFT
    chainData.endpoint, // chain endpoint address
    owner.address,
  );
  // Wait for the deployment to finish
  await strm.waitForDeployment();
  console.log("strm", await strm.getAddress());
  setTimeout(() => {}, 10000);
  //   console.log("Your OFT deployed to:", await strm.getAddress());
  if (chainId == 1 || chainId == 8453) {
    const vault = await Vault.deploy(
      await strm.getAddress(),
      chainData.USDC,
      ethers.ZeroAddress,
      0,
      chainData.SwapRouter,
    );
    await vault.waitForDeployment();
    console.log("vault", await vault.getAddress());
    setTimeout(() => {}, 10000);
    await hardhat.run("verify:verify", {
      address: await vault.getAddress(),
      constructorArguments: [
        "0x9186D4E828b286B077253fb685dd9b8657533468",
        chainData.USDC,
        ethers.ZeroAddress,
        0,
        chainData.SwapRouter,
      ],
    });
  }
  await hardhat.run("verify:verify", {
    address: await strm.getAddress(),
    constructorArguments: [
      "StreamerInu",
      "STRM",
      8,
      chainData.endpoint,
      owner.address,
    ],
  });
  // console.log("  ");
  // for (let i = 0; i < listOfLzChainIds.length; i++) {
  //   if (chainData.endpointId == listOfLzChainIds[i]) continue;
  //   await strm.setMinDstGas(listOfLzChainIds[i], 0, 1);
  //   await strm.setMinDstGas(listOfLzChainIds[i], 1, 1);
  //   console.log("Set min dst gas for endpoint", listOfLzChainIds[i]);
  // }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
