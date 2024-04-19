import { ethers, network } from "hardhat";
import { expect } from "chai";
import {
  StreamerInuToken,
  StreamerInuToken__factory,
  OftMock,
  OftMock__factory,
  StreamerInuVault,
  StreamerInuVault__factory,
  SwapRouterMock,
  SwapRouterMock__factory,
  QuoterV2Mock,
  QuoterV2Mock__factory,
  NonfungiblePositionManagerMock,
  NonfungiblePositionManagerMock__factory,
  PoolFactoryMock,
  PoolFactoryMock__factory,
  StreamerInuRouter__factory,
  StreamerInuRouter,
} from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import {
  takeSnapshot,
  SnapshotRestorer,
  time,
} from "@nomicfoundation/hardhat-network-helpers";

import { errors } from "./testHelpers/constants";
let siFactory: StreamerInuToken__factory;
let si: StreamerInuToken;
let vaultFactory: StreamerInuVault__factory;
let siVault: StreamerInuVault;
let routerFactory: StreamerInuRouter__factory;
let router: StreamerInuRouter;
let swapRouterFactory: SwapRouterMock__factory;
let swapRouter: SwapRouterMock;
let quoterFactory: QuoterV2Mock__factory;
let quoter: QuoterV2Mock;
let positionManager: NonfungiblePositionManagerMock;
let positionManagerFactory: NonfungiblePositionManagerMock__factory;
let erc20Factory: OftMock__factory;
let usdc: OftMock;
let owner: SignerWithAddress;
let user1: SignerWithAddress;
let taxRecipient: SignerWithAddress;
let originalState: SnapshotRestorer;
let startSnapshot: SnapshotRestorer;
let name = "StreamerInu";
let symbol = "STRM";
let shareDecimal = 8;
// all addresses was taken from https://docs.uniswap.org/contracts/v3/reference/deployments/base-deployments
let SWAP_ROUTER = "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45";
let QUOTER = "0x61fFE014bA17989E743c5F6cB21bF9697530B21e";
let POSITION_MANAGER = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";
// all addresses was taken from https://docs.squidrouter.com/dev-resources/contract-addresses
let SQUID_ROUTER = "0xce16F69375520ab01377ce7B88f5BA8C48F8D666";
let SQUID_MULTICALL = "0xEa749Fd6bA492dbc14c24FE8A3d08769229b896c";
let pool: any;
describe("UniswapTaxTest", async () => {
  before(async () => {
    originalState = await takeSnapshot();
    [owner, user1, taxRecipient] = await ethers.getSigners();
    siFactory = (await ethers.getContractFactory(
      "StreamerInuToken",
    )) as StreamerInuToken__factory;
    vaultFactory = (await ethers.getContractFactory(
      "StreamerInuVault",
    )) as StreamerInuVault__factory;
    routerFactory = (await ethers.getContractFactory(
      "StreamerInuRouter",
    )) as StreamerInuRouter__factory;
    swapRouterFactory = (await ethers.getContractFactory(
      "SwapRouterMock",
    )) as SwapRouterMock__factory;
    quoterFactory = (await ethers.getContractFactory(
      "QuoterV2Mock",
    )) as QuoterV2Mock__factory;
    positionManagerFactory = (await ethers.getContractFactory(
      "NonfungiblePositionManagerMock",
    )) as NonfungiblePositionManagerMock__factory;
    erc20Factory = (await ethers.getContractFactory(
      "OftMock",
    )) as OftMock__factory;
    usdc = await erc20Factory.deploy("USD Coin", "USDC");
    swapRouter = (await swapRouterFactory.attach(
      SWAP_ROUTER,
    )) as SwapRouterMock;
    quoter = (await quoterFactory.attach(QUOTER)) as QuoterV2Mock;
    positionManager = (await positionManagerFactory.attach(
      POSITION_MANAGER,
    )) as NonfungiblePositionManagerMock;
    si = await siFactory.deploy(
      name,
      symbol,
      shareDecimal,
      owner.address, //_lzEndpoint
      owner.address, //_recipient
    );
    pool = (
      await positionManager.createAndInitializePoolIfNecessary.staticCallResult(
        await usdc.getAddress(),
        await si.getAddress(),
        500,
        79228162514264337593543950336n,
      )
    )[0];
    let tx1 = await positionManager.createAndInitializePoolIfNecessary(
      await usdc.getAddress(),
      await si.getAddress(),
      500,
      79228162514264337593543950336n,
    );
    let amount = ethers.parseEther("100");
    await usdc.approve(POSITION_MANAGER, amount);
    await si.approve(POSITION_MANAGER, amount);
    let mintParams = {
      token0: await usdc.getAddress(),
      token1: await si.getAddress(),
      fee: 500,
      tickLower: -10000,
      tickUpper: 10000,
      amount0Desired: amount,
      amount1Desired: amount,
      amount0Min: 0,
      amount1Min: 0,
      recipient: owner.address,
      deadline: (await time.latest()) + 60,
    };
    let res = await positionManager.mint.staticCallResult(mintParams);
    let tx2 = await positionManager.mint(mintParams);
    siVault = await vaultFactory.deploy(
      await si.getAddress(),
      await usdc.getAddress(),
      ethers.ZeroAddress,
      500,
      await swapRouter.getAddress(),
    );
    router = await routerFactory.deploy(
      await si.getAddress(),
      SQUID_ROUTER,
      SQUID_MULTICALL,
    );
    await si.setTaxPercent(ethers.parseEther("0.05"));
    await si.setPair(pool);
    await si.setSiVault(await siVault.getAddress());
    await si.turnOnTrading();
    startSnapshot = await takeSnapshot();
  });
  afterEach(async () => {
    await startSnapshot.restore();
  });
  after(async () => {
    await originalState.restore();
  });
  describe("swap tax", async () => {
    it("Must transfer tax to siVault contract", async () => {
      let eth1 = ethers.parseEther("1");
      await usdc.approve(await swapRouter.getAddress(), eth1);
      let exactInputSingleParams = {
        tokenIn: await usdc.getAddress(),
        tokenOut: await si.getAddress(),
        fee: 500n,
        recipient: user1.address,
        deadline: (await time.latest()) + 600,
        amountIn: eth1,
        amountOutMinimum: 0n,
        sqrtPriceLimitX96: 0n,
      };
      let swapTx = await swapRouter.exactInputSingle(exactInputSingleParams);
      expect(await siVault.lastSiBalance()).to.be.closeTo(
        ethers.parseEther("0.05"),
        ethers.parseEther("0.001"),
      );
      expect(await si.balanceOf(await siVault.getAddress())).to.be.closeTo(
        ethers.parseEther("0.05"),
        ethers.parseEther("0.001"),
      );
      expect(await si.balanceOf(user1.address)).to.be.closeTo(
        ethers.parseEther("0.95"),
        ethers.parseEther("0.01"),
      );
    });
    it("Must swap taxes to usdc", async () => {
      let eth1 = ethers.parseEther("1");
      await usdc.approve(await swapRouter.getAddress(), eth1);
      let exactInputSingleParams = {
        tokenIn: await usdc.getAddress(),
        tokenOut: await si.getAddress(),
        fee: 500n,
        recipient: user1.address,
        deadline: (await time.latest()) + 600,
        amountIn: eth1,
        amountOutMinimum: 0n,
        sqrtPriceLimitX96: 0n,
      };
      await swapRouter.exactInputSingle(exactInputSingleParams);
      let tx = await siVault.sellSi(0, taxRecipient.address, 0);
      expect(await usdc.balanceOf(taxRecipient.address)).to.be.closeTo(
        ethers.parseEther("0.049"),
        ethers.parseEther("0.002"),
      );
    });
  });
});
