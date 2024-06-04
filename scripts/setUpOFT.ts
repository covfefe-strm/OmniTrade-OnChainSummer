import { listOfTrustedSigners } from "./helpers/constants";
import { ethers } from "hardhat";
import hardhat from "hardhat";
import { StreamerInuToken } from "../typechain-types";
async function main() {
  const currentChainId = hardhat.network.config.chainId;
  console.log("currentChainId", currentChainId);
  const OFT = await ethers.getContractFactory("StreamerInuToken");
  const strmAddress = listOfTrustedSigners.filter((obj) => {
    return obj.ChainID === currentChainId;
  })[0].address;
  console.log("strmAddress", strmAddress);
  // const [owner] = await ethers.getSigners();
  const oft = (await OFT.attach(strmAddress)) as StreamerInuToken;
  const isTradeTurnedOn = await oft.isTradable();
  console.log("isTradeTurnedOn", isTradeTurnedOn);
  if (!isTradeTurnedOn) {
    const tx = await oft.turnOnTrading();
    await tx.wait();
    console.log("Trading turned on", tx.hash);
  }
  for (let i = 0; i < listOfTrustedSigners.length; i++) {
    if (listOfTrustedSigners[i].ChainID == currentChainId) continue;
    let trustedRemoteAddress;
    try {
      trustedRemoteAddress = await oft.getTrustedRemoteAddress(
        listOfTrustedSigners[i].endpointId,
      );
    } catch (error) {}
    if (!trustedRemoteAddress) {
      const minDstGas = 200000;
      const endpointId = listOfTrustedSigners[i].endpointId;
      const addingTrustRemote = await oft.setTrustedRemoteAddress(
        endpointId,
        listOfTrustedSigners[i].address,
      );
      await addingTrustRemote.wait();
      const setMinGas0 = await oft.setMinDstGas(endpointId, 0, minDstGas);
      await setMinGas0.wait();
      const setMinGas1 = await oft.setMinDstGas(endpointId, 1, minDstGas);
      await setMinGas1.wait();
      console.log("setTrustedRemoteAddress", addingTrustRemote.hash);
      console.log("setMinDstGas for sendFrom", setMinGas0.hash);
      console.log("setMinDstGas for sendFromAndCall", setMinGas1.hash);
    } else {
      console.log(
        "endpoint and min dst gas are set for chain",
        listOfTrustedSigners[i].ChainID,
      );
    }
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
