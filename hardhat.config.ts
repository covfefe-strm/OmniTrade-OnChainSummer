import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-verify";
import "solidity-coverage";
// the sequence of dotenv.config() is very important
dotenv.config();
const DEV_PRIVATE_KEY = process.env.DEV_PRIVATE_KEY
  ? process.env.DEV_PRIVATE_KEY
  : "0000000000000000000000000000000000000000000000000000000000000000";
const PROD_PRIVATE_KEY = process.env.PROD_PRIVATE_KEY
  ? process.env.PROD_PRIVATE_KEY
  : "0000000000000000000000000000000000000000000000000000000000000000";
const {
  ETHERSCAN_KEY,
  BSCSCAN_KEY,
  MUMBAISCAN_KEY,
  BASESCAN_KEY,
  CELOSCAN_KEY,
  ARBISCAN_KEY,
  FANTOMSCAN_KEY,
  OPSCAN_KEY,
  INFURA_API_KEY,
  QUICKNODE_KEY,
  COINMARKETCAP_KEY,
} = process.env;

const config: HardhatUserConfig = {
  // typechain: {
  //   target: "ethers-v5",
  // },
  solidity: {
    compilers: [
      {
        version: "0.8.23",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
          viaIR: true,
        },
      },
    ],
  },
  gasReporter: {
    currency: "USD",
    L1: "ethereum",
    coinmarketcap: COINMARKETCAP_KEY,
  },
  networks: {
    hardhat: {
      // VotingEscrow too big, that's why we need to use the property
      allowUnlimitedContractSize: true,
      chainId: 1, //changed 8453 to 1 for test purposes
      forking: {
        url: `https://polygon-mainnet.infura.io/v3/${INFURA_API_KEY}`,
        blockNumber: 56001748,
      },
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
    celoAlfajores: {
      url: `https://celo-alfajores.infura.io/v3/${INFURA_API_KEY}`,
      chainId: 44787,
      accounts: [`${DEV_PRIVATE_KEY}`],
    },
    avalanche: {
      url: `https://avalanche-mainnet.infura.io/v3/${INFURA_API_KEY}`,
      chainId: 43114,
      accounts: [`${PROD_PRIVATE_KEY}`],
    },
    arbitrum: {
      url: `https://arbitrum-mainnet.infura.io/v3/${INFURA_API_KEY}`,
      chainId: 42161,
      accounts: [`${PROD_PRIVATE_KEY}`],
    },
    celo: {
      url: `https://celo-mainnet.infura.io/v3/${INFURA_API_KEY}`,
      chainId: 42220,
      accounts: [`${DEV_PRIVATE_KEY}`],
    },
    polygon: {
      url: `https://polygon-mainnet.infura.io/v3/${INFURA_API_KEY}`,
      chainId: 137,
      accounts: [`${PROD_PRIVATE_KEY}`],
    },
    bsc: {
      url: `https://1rpc.io/bnb`,
      chainId: 56,
      gasPrice: 10000000000,
      accounts: [`${PROD_PRIVATE_KEY}`],
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
      chainId: 1,
      accounts: [`${PROD_PRIVATE_KEY}`],
      gasPrice: 35000000000, //35 gwei
    },
    optimisticEthereum: {
      url: `https://optimism-mainnet.infura.io/v3/${INFURA_API_KEY}`,
      chainId: 10,
      accounts: [`${PROD_PRIVATE_KEY}`],
    },
    base: {
      url: `https://base.meowrpc.com`,
      chainId: 8453,
      accounts: [`${PROD_PRIVATE_KEY}`],
    },
    fantom: {
      url: `https://rpcapi.fantom.network`,
      chainId: 250,
      accounts: [`${PROD_PRIVATE_KEY}`],
    },
    baseSepolia: {
      url: "https://public.stackup.sh/api/v1/node/base-sepolia",
      chainId: 84532,
      accounts: [`${DEV_PRIVATE_KEY}`],
    },
  },
  etherscan: {
    apiKey: {
      mainnet: ETHERSCAN_KEY,
      bsc: BSCSCAN_KEY,
      bscTestnet: BSCSCAN_KEY,
      polygonMumbai: MUMBAISCAN_KEY,
      celoAlfajores: CELOSCAN_KEY,
      celo: CELOSCAN_KEY,
      avalanche: `${DEV_PRIVATE_KEY}`,
      arbitrum: ARBISCAN_KEY,
      polygon: MUMBAISCAN_KEY,
      base: BASESCAN_KEY,
      baseSepolia: BASESCAN_KEY,
      optimisticEthereum: OPSCAN_KEY,
      fantom: FANTOMSCAN_KEY,
    },
    // apiKey: BSCSCAN_KEY,
    // apiKey: MUMBAISCAN_KEY,
    customChains: [
      {
        network: "arbitrum",
        chainId: 42161,
        urls: {
          apiURL: "https://api.arbiscan.io/api",
          browserURL: "https://arbiscan.io/",
        },
      },
      {
        network: "celo",
        chainId: 42220,
        urls: {
          apiURL: "https://api.celoscan.io/api",
          browserURL: "https://celoscan.io/",
        },
      },
      {
        network: "celoAlfajores",
        chainId: 44787,
        urls: {
          apiURL: "https://api-alfajores.celoscan.io/api",
          browserURL: "https://alfajores.celoscan.io/",
        },
      },
      {
        network: "base",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org/",
        },
      },
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org/",
        },
      },
      {
        network: "fantom",
        chainId: 250,
        urls: {
          apiURL: "https://api.ftmscan.com/api",
          browserURL: "https://ftmscan.com/",
        },
      },
    ],
  },
  sourcify: {
    enabled: false,
  },
};

export default config;
