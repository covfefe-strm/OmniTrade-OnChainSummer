import { deployData, listOfLzChainIds } from "./helpers/constants";
import { ethers } from "hardhat";
import hardhat from "hardhat";
import { StreamerInuToken } from "../typechain-types";
async function main() {
  const STRM_BASE = "0xfE4717F60Ac5603dC6863700Cd8ECF805908688D";
  const STRM = await ethers.getContractFactory("StreamerInuToken");
  const Vault = await ethers.getContractFactory("StreamerInuVault");
  const chainId = hardhat.network.config.chainId;
  const chainData = deployData.filter((obj) => {
    return obj.ChainID === chainId;
  })[0];
  const [owner] = await ethers.getSigners();
  const strm = await STRM.attach(STRM_BASE);
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
      await strm.getAddress(),
      chainData.USDC,
      ethers.ZeroAddress,
      0,
      chainData.SwapRouter,
    ],
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
