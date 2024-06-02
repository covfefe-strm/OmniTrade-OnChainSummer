import { constants, layerZeroEndpointsList } from "./helpers/constants";
import { ethers } from "hardhat";
import hardhat from "hardhat";
import { StreamerInuToken } from "../typechain-types";

// settings for current script:
const STRM_ADDRESS = "0xf77ad5c0598387f6F0D0a3e7d7c4016A2f09Ffd4"; // address of STRM OFT token on chain from which we will call
const ROUTER_ADDRESS = "0x449BE283980ae381555e9bC592F8Cac34416a711"; // address of StreamerInuRouter contract
const DESTINATION_LZ_ENDPOINT_ID = 184;
const GAS_FOR_CALL = 80000;
const GAS_LIMIT = 360000; // gas limit on destination chain, must be equal minDstGas + GAS_FOR_CALL, in out case 280k + 80k
const CALLDATA = "0x";

async function main() {
  const STRM = await ethers.getContractFactory("StreamerInuToken");
  const [owner] = await ethers.getSigners();
  const strm = (await STRM.attach(STRM_ADDRESS)) as StreamerInuToken;
  let toAddress = ethers.zeroPadValue(ROUTER_ADDRESS, 32);
  //   console.log("toAddress", toAddress);
  let amount = ethers.parseEther("10");
  const adapterParams = ethers.solidityPacked(
    ["uint16", "uint256"],
    [1, GAS_LIMIT],
  );
  let callParams = {
    refundAddress: owner.address,
    zroPaymentAddress: constants.zeroAddress,
    adapterParams: adapterParams,
  };
  let fees = (
    await strm.estimateSendAndCallFee(
      DESTINATION_LZ_ENDPOINT_ID,
      toAddress,
      amount,
      CALLDATA,
      GAS_FOR_CALL,
      false,
      callParams.adapterParams,
    )
  )[0];
  console.log("fees", fees);
  await strm.sendAndCall.staticCall(
    owner.address,
    DESTINATION_LZ_ENDPOINT_ID,
    toAddress,
    amount,
    CALLDATA,
    GAS_FOR_CALL,
    callParams,
    { value: fees },
  );
  let tx = await strm.sendAndCall(
    owner.address,
    DESTINATION_LZ_ENDPOINT_ID,
    toAddress,
    amount,
    CALLDATA,
    GAS_FOR_CALL,
    callParams,
    { value: fees },
  );
  console.log(tx);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
