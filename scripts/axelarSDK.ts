import {
  AxelarGMPRecoveryAPI,
  Environment,
} from "@axelar-network/axelarjs-sdk";
import { ethers } from "hardhat";
import hardhat from "hardhat";
const sdk = new AxelarGMPRecoveryAPI({
  environment: Environment.TESTNET,
});

async function main() {}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
