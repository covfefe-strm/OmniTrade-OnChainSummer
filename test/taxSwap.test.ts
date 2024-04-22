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
  ERC20Mock,
  ERC20Mock__factory,
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
let erc20Factory: ERC20Mock__factory;
let usdc: ERC20Mock;
let owner: SignerWithAddress;
let user1: SignerWithAddress;
let taxRecipient: SignerWithAddress;
let originalState: SnapshotRestorer;
let startSnapshot: SnapshotRestorer;
let name = "StreamerInu";
let symbol = "STRM";
let shareDecimal = 8;
// all addresses was taken from https://docs.uniswap.org/contracts/v3/reference/deployments/base-deployments
const SWAP_ROUTER = "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45";
const QUOTER = "0x61fFE014bA17989E743c5F6cB21bF9697530B21e";
const POSITION_MANAGER = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";
const STRM = "0xCf3A1d88414a0B5215B4ff888E2312ceE3bE176e";
const USDC = "0x23Ac304E24a6c0FFBaB0d8b99f38c0b1FC3A724E";
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
      "ERC20Mock",
    )) as ERC20Mock__factory;
    usdc = (await erc20Factory.attach(USDC)) as ERC20Mock;
    swapRouter = (await swapRouterFactory.attach(
      SWAP_ROUTER,
    )) as SwapRouterMock;
    quoter = (await quoterFactory.attach(QUOTER)) as QuoterV2Mock;
    positionManager = (await positionManagerFactory.attach(
      POSITION_MANAGER,
    )) as NonfungiblePositionManagerMock;
    si = (await siFactory.attach(STRM)) as StreamerInuToken;
    pool = (
      await positionManager.createAndInitializePoolIfNecessary.staticCallResult(
        await usdc.getAddress(),
        await si.getAddress(),
        500,
        2855072739969992044888350098476n,
      )
    )[0];

    let tx1 = await positionManager.createAndInitializePoolIfNecessary(
      await usdc.getAddress(),
      await si.getAddress(),
      500,
      2855072739969992044888350098476n,
    );
    let amount = ethers.parseEther("1000000000000");
    await usdc.approve(pool, amount);
    await si.approve(pool, amount);
    let mintParams = {
      token0: await usdc.getAddress(),
      token1: await si.getAddress(),
      fee: 500,
      tickLower: -887270,
      tickUpper: 887270,
      amount0Desired: 7700604390715360903n,
      amount1Desired: 9999999999999999998907n,
      amount0Min: 0, //7681424773410002625n,
      amount1Min: 0, //9974968671630001664737n,
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
    await si.setTaxPercent(ethers.parseEther("0.4"));
    await si.setPair(pool);
    await si.setSiVault(await siVault.getAddress());
    // await si.turnOnTrading();
    startSnapshot = await takeSnapshot();
  });
  // afterEach(async () => {
  //   await startSnapshot.restore();
  // });
  after(async () => {
    await originalState.restore();
  });
  describe("swap tax", async () => {
    it("Must revert to trade if trading is off", async () => {
      await usdc.approve(SWAP_ROUTER, 1000000000000000n);
      let swapParams = {
        tokenIn: await usdc.getAddress(),
        tokenOut: await si.getAddress(),
        fee: 500,
        recipient: owner.address,
        amountIn: 1000000000000000n,
        amountOutMinimum: 0,
        sqrtPriceLimitX96: 0,
      };
      await expect(
        swapRouter.exactInputSingle(swapParams),
      ).to.be.revertedWithCustomError(si, "IsPaused");
    });
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
