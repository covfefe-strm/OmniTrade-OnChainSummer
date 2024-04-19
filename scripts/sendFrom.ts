import { constants, layerZeroEndpointsList } from "./helpers/constants";
import { ethers } from "hardhat";
import hardhat from "hardhat";
import { StreamerInuToken } from "../typechain-types";
async function main() {
  const STRM = await ethers.getContractFactory("StreamerInuToken");
  const [owner] = await ethers.getSigners();
  const strm = (await STRM.attach(
    "0x8162b5Bc8F651007cC38a09F557BaB2Bf4CEFb5b",
  )) as StreamerInuToken;
  let toAddress = ethers.zeroPadValue(owner.address, 32);
  console.log("toAddress", toAddress);
  let amount = ethers.parseEther("75000000");
  let callParams = {
    refundAddress: owner.address,
    zroPaymentAddress: constants.zeroAddress,
    adapterParams:
      "0x00010000000000000000000000000000000000000000000000000000000000019a28",
  };
  let fees = (
    await strm.estimateSendFee(
      184,
      toAddress,
      amount,
      false,
      callParams.adapterParams,
    )
  )[0];
  console.log("fees", fees);
  await strm.sendFrom.staticCall(
    owner.address,
    184,
    toAddress,
    amount,
    callParams,
    { value: fees },
  );
  let tx = await strm.sendFrom(
    owner.address,
    184,
    toAddress,
    amount,
    callParams,
    { value: fees },
  );
  console.log(tx);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
