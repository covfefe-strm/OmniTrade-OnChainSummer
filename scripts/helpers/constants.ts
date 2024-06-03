// source of data https://docs.axelar.dev/dev/reference/testnet-contract-addresses
export const layerZeroEndpointsList = [
  {
    ChainID: 97,
    ChainName: "Binance Smart Chain Testnet",
    GatewayContract: "0x4d147dcb984e6affeec47e44293da442580a3ec0",
    GasServiceContract: "0xbe406f0189a0b4cf3a05c286473d23791dd44cc6",
    endpointId: 10102,
    endpoint: "0x6fcb97553d41516cb228ac03fdc8b9a0a9df04a1",
  },
  {
    ChainID: 44787,
    ChainName: "Celo Alfajores",
    GatewayContract: "",
    GasServiceContract: "",
    endpointId: 10125,
    endpoint: "0xae92d5aD7583AD66E49A0c67BAd18F6ba52dDDc1",
  },
  {
    ChainID: 137,
    ChainName: "Polygon",
    GatewayContract: "",
    GasServiceContract: "",
    endpointId: 109,
    endpoint: "0x3c2269811836af69497E5F486A85D7316753cf62",
  },
];
export const crossChainAddresses = {
  bscTestnet: {
    ChainID: 97,
    ChainName: "Binance Smart Chain Testnet",
    AxelarChainName: "binance",
    aUSDCSymbol: "aUSDC",
    SquidRouter: "0x4f193853Cc053e08405b6aBd003AEEEF3DD08cb8",
    SquidMulticall: "0xbacF8F076d46b38f39252498730387f549508831",
    SI: "0xd2eE4CC081ACC37dA499d16F050ebDaef74082b1", //oft contract
    aUSDC: "0xc2fA98faB811B785b81c64Ac875b31CC9E40F9D2",
    wETH: "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd", //w native currency
    dexes: {
      pancakeSwap: {
        pancakeRouter: "0xD99D1c33F9fC3444f8101754aBC46c52416550D1",
      },
      uniswap: {
        swapRouter: "",
        quoter: "",
      },
    },
  },
  mumbai: {
    ChainID: 80001,
    ChainName: "Polygon Mumbai",
    AxelarChainName: "polygon",
    aUSDCSymbol: "aUSDC",
    SquidRouter: "0x4f193853Cc053e08405b6aBd003AEEEF3DD08cb8",
    SquidMulticall: "0x25E6c6519b5eD521ddA2BD64cd99d5a90a5242BC",
    SI: "0x2F7c52B0Dad83f193890821aC72b40fA15DC4d34", //oft contract
    aUSDC: "0x2c852e740B62308c46DD29B982FBb650D063Bd07",
    wETH: "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889", //w native currency
    dexes: {
      pancakeSwap: {
        pancakeRouter: "",
      },
      uniswap: {
        swapRouter: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
        quoter: "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6",
      },
    },
  },
};
export const constants = {
  defAdaptParams:
    "0x00010000000000000000000000000000000000000000000000000000000000030d40",
  zeroAddress: "0x0000000000000000000000000000000000000000",
};

export const deployData = [
  {
    ChainID: 1,
    ChainName: "Ethereum",
    endpointId: 101,
    endpoint: "0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675",
    USDC: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    SwapRouter: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
  },
  {
    ChainID: 8453,
    ChainName: "Base",
    endpointId: 184,
    endpoint: "0xb6319cC6c8c27A8F5dAF0dD3DF91EA35C4720dd7",
    USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    SwapRouter: "0x2626664c2603336E57B271c5C0b26F421741e481",
  },
  {
    ChainID: 137,
    ChainName: "Polygon",
    endpointId: 109,
    endpoint: "0x3c2269811836af69497E5F486A85D7316753cf62",
    USDC: "",
    SwapRouter: "",
  },
  {
    ChainID: 56,
    ChainName: "BNB", //BSC
    endpointId: 102,
    endpoint: "0x3c2269811836af69497E5F486A85D7316753cf62",
    USDC: "",
    SwapRouter: "",
  },
  {
    ChainID: 42161,
    ChainName: "Arbitrum One",
    endpointId: 110,
    endpoint: "0x3c2269811836af69497E5F486A85D7316753cf62",
    USDC: "",
    SwapRouter: "",
  },
  {
    ChainID: 43114,
    ChainName: "Avalanche",
    endpointId: 106,
    endpoint: "0x3c2269811836af69497E5F486A85D7316753cf62",
    USDC: "",
    SwapRouter: "",
  },
  {
    ChainID: 10,
    ChainName: "optimism",
    endpointId: 111,
    endpoint: "0x3c2269811836af69497E5F486A85D7316753cf62",
    USDC: "",
    SwapRouter: "",
  },
  {
    ChainID: 250,
    ChainName: "fantom",
    endpointId: 112,
    endpoint: "0xb6319cC6c8c27A8F5dAF0dD3DF91EA35C4720dd7",
    USDC: "",
    SwapRouter: "",
  },
  {
    ChainID: 42220,
    ChainName: "Celo",
    endpointId: 125,
    endpoint: "0x3A73033C0b1407574C76BdBAc67f126f6b4a9AA9",
    USDC: "",
    SwapRouter: "",
  },
  {
    ChainID: 1284,
    ChainName: "Moonbeam",
    endpointId: 126,
    endpoint: "0x9740FF91F1985D8d2B71494aE1A2f723bb3Ed9E4",
    USDC: "",
    SwapRouter: "",
  },
  {
    ChainID: 2222,
    ChainName: "Kava",
    endpointId: 177,
    endpoint: "0xb6319cC6c8c27A8F5dAF0dD3DF91EA35C4720dd7",
    USDC: "",
    SwapRouter: "",
  },
  {
    ChainID: 5000,
    ChainName: "Mantle",
    endpointId: 181,
    endpoint: "0xb6319cC6c8c27A8F5dAF0dD3DF91EA35C4720dd7",
    USDC: "",
    SwapRouter: "",
  },
  {
    ChainID: 59144,
    ChainName: "Linea",
    endpointId: 183,
    endpoint: "0xb6319cC6c8c27A8F5dAF0dD3DF91EA35C4720dd7",
    USDC: "",
    SwapRouter: "",
  },
  {
    ChainID: 534352,
    ChainName: "Scroll",
    endpointId: 214,
    endpoint: "0xb6319cC6c8c27A8F5dAF0dD3DF91EA35C4720dd7",
    USDC: "",
    SwapRouter: "",
  },
  {
    ChainID: 252,
    ChainName: "Fraxtal",
    endpointId: 255,
    endpoint: "0xb6319cC6c8c27A8F5dAF0dD3DF91EA35C4720dd7",
    USDC: "",
    SwapRouter: "",
  },
];

export const listOfLzChainIds = [101, 184, 109, 102]; //TODO complete

export const listOfTrustedSigners = [
  {
    ChainID: 8453, //Base
    endpointId: 184,
    address: "0x53e2dfe5EbAb390a8f800A905479049f5B21a211",
  },
  {
    ChainID: 1, //Base
    endpointId: 101,
    address: "0x9186D4E828b286B077253fb685dd9b8657533468",
  },
];
