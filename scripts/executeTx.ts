import { ethers } from "hardhat";
import { MyOFT, MyOFT__factory } from "../typechain-types";
async function performOFTTransfer() {
  // Connect to your OFT contract

  const oftContractFactory = (await ethers.getContractFactory(
    "MyOFT",
  )) as MyOFT__factory;
  const oftContract = oftContractFactory.attach(
    "0xd2eE4CC081ACC37dA499d16F050ebDaef74082b1",
  ) as MyOFT; // Replace with your OFT contract's address
  const myAddress = "0xC742385d01d590D7391E11Fe95E970B915203C18";
  // Define the destination endpoint ID and recipient address
  const dstEndpointId = "10109"; // Destination LayerZero Endpoint ID (example: 101)
  const toAddress = ethers.zeroPadValue(myAddress, 32); // Convert recipient's address to bytes32 format

  // Specify the amount of tokens to be transferred

  const transferAmount = ethers.parseUnits("1", 18); // Transferring 1 eth
  // Prepare adapter parameters for LayerZero

  const adapterParams = ethers.solidityPacked(
    ["uint16", "uint256"],
    [1, 200000],
  );
  console.log("adapterParams", adapterParams);
  // Estimate the fees for the cross-chain transfer
  const [nativeFee, zroFee] = await oftContract.estimateSendFee(
    dstEndpointId,
    toAddress,
    transferAmount,
    false, // false indicates no ZRO payment will be made
    adapterParams,
  );

  // Execute the cross-chain transfer
  const tx = await oftContract.sendFrom(
    myAddress, // Your address as the sender
    dstEndpointId,
    toAddress,
    transferAmount,
    {
      refundAddress: myAddress, // Address for refunded gas to be sent
      zroPaymentAddress: "0x0000000000000000000000000000000000000000", // Address for ZRO token payment, if used
      adapterParams: adapterParams,
    },
    { value: nativeFee },
  );

  console.log("Cross-chain OFT transfer completed", tx);
}

performOFTTransfer()
  .then(() => console.log("OFT Transfer completed successfully"))
  .catch((error) => console.error("Error in OFT transfer:", error));
