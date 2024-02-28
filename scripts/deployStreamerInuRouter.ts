import {
  layerZeroEndpointsList,
  crossChainAddresses,
} from "./helpers/constants";
import { ethers } from "hardhat";
import hardhat from "hardhat";
async function main() {
  const StreamerInuRouter =
    await ethers.getContractFactory("StreamerInuRouter");
  const si = crossChainAddresses.mumbai.SI;
  // console.log(contractAddresses);
  const adapterParams = ethers.solidityPacked(
    ["uint16", "uint256"],
    [1, 200000],
  );
  console.log("adapterParams", adapterParams);
  const streamerInuRouter = await StreamerInuRouter.deploy(
    adapterParams,
    si,
    "0x25E6c6519b5eD521ddA2BD64cd99d5a90a5242BC",
  );
  // Wait for the deployment to finish
  await streamerInuRouter.waitForDeployment();
  console.log(
    "Your StreamerInuRouter deployed to:",
    await streamerInuRouter.getAddress(),
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
