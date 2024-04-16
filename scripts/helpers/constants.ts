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
    ChainID: 80001,
    ChainName: "Polygon Mumbai",
    GatewayContract: "0xbf62ef1486468a6bd26dd669c06db43ded5b849b",
    GasServiceContract: "0xbe406f0189a0b4cf3a05c286473d23791dd44cc6",
    endpointId: 10109,
    endpoint: "0xf69186dfba60ddb133e91e9a4b5673624293d8f8",
  },
  {
    ChainID: 44787,
    ChainName: "Celo Alfajores",
    GatewayContract: "",
    GasServiceContract: "",
    endpointId: 10125,
    endpoint: "0xae92d5aD7583AD66E49A0c67BAd18F6ba52dDDc1",
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
