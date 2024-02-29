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
  const squidMulticall = crossChainAddresses.mumbai.SquidMulticall;
  const adapterParams = ethers.solidityPacked(
    ["uint16", "uint256"],
    [1, 200000],
  );
  console.log("adapterParams", adapterParams);
  const streamerInuRouter = await StreamerInuRouter.deploy(
    adapterParams,
    si,
    squidMulticall,
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
