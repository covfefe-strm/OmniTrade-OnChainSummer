import { ethers } from "hardhat";

async function performOFTTransfer() {
  // Connect to your OFT contract

  const oftContractFactory = await ethers.getContractFactory("MyOFT");
  const oftContract = oftContractFactory.attach(
    "0x7fB25f2587678f1f315a1923eea929be95b5F334",
  ); // Replace with your OFT contract's address
  const myAddress = "0xC742385d01d590D7391E11Fe95E970B915203C18";
  // Define the destination endpoint ID and recipient address
  const dstEndpointId = "10109"; // Destination LayerZero Endpoint ID (example: 101)
  const toAddress = ethers.zeroPadValue(myAddress, 32); // Convert recipient's address to bytes32 format

  // Specify the amount of tokens to be transferred

  const transferAmount = ethers.parseUnits("100", 8); // Transferring 10 tokens with 8 decimals (shared decimals amount)

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
