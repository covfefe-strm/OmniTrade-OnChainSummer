import { deployData, listOfLzChainIds } from "./helpers/constants";
import { ethers } from "hardhat";
import hardhat from "hardhat";
// these addresses ofr Base-sepolia network!!!
const SWAP_ROUTER = "0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4";
const LZ_ENDPOINT = "0x55370E0fBB5f5b8dAeD978BA1c075a499eB107B8";
import { StreamerInuToken } from "../typechain-types";
async function main() {
  const oftFactory = await ethers.getContractFactory("OFTMintMock");
  const erc20Factory = await ethers.getContractFactory("ERC20Mock");
  const Vault = await ethers.getContractFactory("StreamerInuVault");
  const chainId = hardhat.network.config.chainId;
  const chainData = deployData.filter((obj) => {
    return obj.ChainID === chainId;
  })[0];
  const [owner] = await ethers.getSigners();

  const strm = await oftFactory.deploy(
    "OFTT",
    "OFTTEST",
    8,
    LZ_ENDPOINT,
    owner.address,
  );
  await strm.waitForDeployment();
  console.log("strm", await strm.getAddress());
  await hardhat.run("verify:verify", {
    address: await strm.getAddress(),
    constructorArguments: ["OFTT", "OFTTEST", 8, LZ_ENDPOINT, owner.address],
  });

  const usdc = await erc20Factory.deploy("USDCT", "USDC test");
  await usdc.waitForDeployment();
  console.log("usdc", await usdc.getAddress());
  await hardhat.run("verify:verify", {
    address: await usdc.getAddress(),
    constructorArguments: ["USDCT", "USDC test"],
  });

  const vault = await Vault.deploy(
    await strm.getAddress(),
    await usdc.getAddress(),
    ethers.ZeroAddress,
    100,
    SWAP_ROUTER,
  );
  await vault.waitForDeployment();
  console.log("vault", await vault.getAddress());
  await hardhat.run("verify:verify", {
    address: await vault.getAddress(),
    constructorArguments: [
      await strm.getAddress(),
      await usdc.getAddress(),
      ethers.ZeroAddress,
      100,
      SWAP_ROUTER,
    ],
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
