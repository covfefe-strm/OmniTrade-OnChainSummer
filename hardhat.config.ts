import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-verify";
import "solidity-coverage";
// the sequence of dotenv.config() is very important
dotenv.config();
// const PROD_PRIVATE_KEY = process.env.PROD_PRIVATE_KEY
//   ? process.env.PROD_PRIVATE_KEY
//   : "0000000000000000000000000000000000000000000000000000000000000000";
const DEV_PRIVATE_KEY = process.env.DEV_PRIVATE_KEY
  ? process.env.DEV_PRIVATE_KEY
  : "0000000000000000000000000000000000000000000000000000000000000000";
const { BSCSCAN_KEY, MUMBAISCAN_KEY } = process.env;

const config: HardhatUserConfig = {
  // typechain: {
  //   target: "ethers-v5",
  // },
  solidity: {
    version: "0.8.23",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
      viaIR: true,
    },
  },
  networks: {
    hardhat: {
      // VotingEscrow too big, that's why we need to use the property
      allowUnlimitedContractSize: true,
    },
    coverage: {
      gas: 0xfffffffffff,
      gasPrice: 0x01,
      url: "http://localhost:8545/",
      chainId: 1337,
    },
    bscTestnet: {
      url: `https://data-seed-prebsc-1-s1.binance.org:8545/`,
      chainId: 97,
      accounts: [`${DEV_PRIVATE_KEY}`],
    },
    polygonMumbai: {
      url: `https://polygon-mumbai-bor.publicnode.com`,
      chainId: 80001,
      accounts: [`${DEV_PRIVATE_KEY}`],
    },
  },
  etherscan: {
    apiKey: {
      bscTestnet: BSCSCAN_KEY,
      polygonMumbai: MUMBAISCAN_KEY,
    },
    // apiKey: BSCSCAN_KEY,
    // apiKey: MUMBAISCAN_KEY,
  },
  sourcify: {
    enabled: false,
  },
};

export default config;
