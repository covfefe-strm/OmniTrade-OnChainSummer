import { deployData, listOfLzChainIds } from "./helpers/constants";
import { ethers } from "hardhat";
import hardhat from "hardhat";
import { StreamerInuToken, StreamerInuVault } from "../typechain-types";
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
  const strm = (await STRM.attach(
    "0x53e2dfe5EbAb390a8f800A905479049f5B21a211",
  )) as StreamerInuToken; //base strm address
  console.log("totalSupply", await strm.totalSupply());
  const vault = (await Vault.attach(
    "0x9186D4E828b286B077253fb685dd9b8657533468",
  )) as StreamerInuVault; //base strm address
  console.log("taxPercent", await strm.taxPercent());
  // await strm.taxPercent();
  // console.log("strm.setSiVault");
  // await strm.setSiVault("0x9186D4E828b286B077253fb685dd9b8657533468");
  // console.log("vault.setPairFee");
  // await vault.setPairFee(500);
  // console.log("strm.turnOnTrading");
  // await strm.turnOnTrading();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
