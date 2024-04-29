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
let strm: StreamerInuToken;
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
let tokenOwner: SignerWithAddress;
let user1: SignerWithAddress;
let taxRecipient: SignerWithAddress;
let originalState: SnapshotRestorer;
let startSnapshot: SnapshotRestorer;
let name = "StreamerInu";
let symbol = "STRM";
let shareDecimal = 8;
/* 
  Note: the test is using fork of Polygon network (you can check hardhat.config)
  To update the test to using another network fork, you need update addresses of UniswapV3 SCs
 */
// all addresses was taken from https://docs.uniswap.org/contracts/v3/reference/deployments/base-deployments
const SWAP_ROUTER = "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45";
const QUOTER = "0x61fFE014bA17989E743c5F6cB21bF9697530B21e";
const POSITION_MANAGER = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";
const STRM = "0xCf3A1d88414a0B5215B4ff888E2312ceE3bE176e";
const USDC = "0x23Ac304E24a6c0FFBaB0d8b99f38c0b1FC3A724E";
const TOKEN_OWNER = "0xC742385d01d590D7391E11Fe95E970B915203C18";
// all addresses was taken from https://docs.squidrouter.com/dev-resources/contract-addresses
const SQUID_ROUTER = "0xce16F69375520ab01377ce7B88f5BA8C48F8D666";
const SQUID_MULTICALL = "0xEa749Fd6bA492dbc14c24FE8A3d08769229b896c";

let pool: any;
describe("UniswapTaxTest", async () => {
  before(async () => {
    // snapshot of original state to not break logic of other test
    originalState = await takeSnapshot();
    // getting new generated addresses with eth
    [owner, user1, taxRecipient] = await ethers.getSigners();
    // unlock address fo tokens owner
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [TOKEN_OWNER],
    });
    tokenOwner = await ethers.getSigner(TOKEN_OWNER);
    // send some eth to enable tokenOwner to make transactions
    await owner.sendTransaction({
      to: tokenOwner.address,
      value: ethers.parseEther("10"),
    });
    // initializing factories of smart contracts
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
    // attaching contracts
    usdc = (await erc20Factory.attach(USDC)) as ERC20Mock;
    swapRouter = (await swapRouterFactory.attach(
      SWAP_ROUTER,
    )) as SwapRouterMock;
    quoter = (await quoterFactory.attach(QUOTER)) as QuoterV2Mock;
    positionManager = (await positionManagerFactory.attach(
      POSITION_MANAGER,
    )) as NonfungiblePositionManagerMock;
    strm = (await siFactory.attach(STRM)) as StreamerInuToken;
    // prepare for testing
    pool = (
      await positionManager.createAndInitializePoolIfNecessary.staticCallResult(
        await usdc.getAddress(),
        await strm.getAddress(),
        500,
        79228162514264337593543950336n,
      )
    )[0];
    await positionManager.createAndInitializePoolIfNecessary(
      await usdc.getAddress(),
      await strm.getAddress(),
      500,
      79228162514264337593543950336n,
    );
    let amount = ethers.parseEther("10000");
    let amountToAdd = ethers.parseEther("1000");
    console.log("pool", pool);
    await usdc.connect(tokenOwner).transfer(owner.address, amount);
    await strm.connect(tokenOwner).transfer(owner.address, amount);
    // transfer ownership of strm ot owner address
    await strm.connect(tokenOwner).transferOwnership(owner.address);
    await usdc.approve(await positionManager.getAddress(), amount);
    await strm.approve(await positionManager.getAddress(), amount);
    let mintParams = {
      token0: await usdc.getAddress(),
      token1: await strm.getAddress(),
      fee: 500,
      tickLower: -887270,
      tickUpper: 887270,
      amount0Desired: amountToAdd,
      amount1Desired: amountToAdd,
      amount0Min: 0,
      amount1Min: 0,
      recipient: owner.address,
      deadline: 1713521334,
    };
    await positionManager.mint.staticCallResult(mintParams);
    await positionManager.mint(mintParams);
    // await positionManager
    //   .connect(tokenOwner)
    //   .multicall([poolCreationCalldata, addingLiquidityCalldata]);
    siVault = await vaultFactory.deploy(
      await strm.getAddress(),
      await usdc.getAddress(),
      ethers.ZeroAddress,
      500,
      await swapRouter.getAddress(),
    );
    router = await routerFactory.deploy(
      await strm.getAddress(),
      SQUID_ROUTER,
      SQUID_MULTICALL,
    );
    await strm.setTaxPercent(ethers.parseEther("0.04"));
    await strm.setPair(pool);
    await strm.setSiVault(await siVault.getAddress());
    // await si.turnOnTrading();
    startSnapshot = await takeSnapshot();
  });
  afterEach(async () => {
    await startSnapshot.restore();
  });
  after(async () => {
    await originalState.restore();
  });
  describe("swap tax", async () => {
    it("Must revert to trade if trading is off", async () => {
      let amount = ethers.parseEther("1");
      await usdc.approve(SWAP_ROUTER, amount);
      let swapParams = {
        tokenIn: await usdc.getAddress(),
        tokenOut: await strm.getAddress(),
        fee: 500,
        recipient: owner.address,
        amountIn: amount,
        amountOutMinimum: 0,
        sqrtPriceLimitX96: 0,
      };
      await expect(swapRouter.exactInputSingle(swapParams)).to.be.revertedWith(
        "TF",
      );
    });
    it("Must transfer tax to siVault contract", async () => {
      await strm.turnOnTrading();
      let eth1 = ethers.parseEther("1");
      await usdc.approve(await swapRouter.getAddress(), eth1);
      let exactInputSingleParams = {
        tokenIn: await usdc.getAddress(),
        tokenOut: await strm.getAddress(),
        fee: 500n,
        recipient: user1.address,
        deadline: (await time.latest()) + 600,
        amountIn: eth1,
        amountOutMinimum: 0n,
        sqrtPriceLimitX96: 0n,
      };
      let swapTx = await swapRouter.exactInputSingle(exactInputSingleParams);
      expect(await siVault.lastSiBalance()).to.be.closeTo(
        ethers.parseEther("0.04"),
        ethers.parseEther("0.001"),
      );
      expect(await strm.balanceOf(await siVault.getAddress())).to.be.closeTo(
        ethers.parseEther("0.04"),
        ethers.parseEther("0.001"),
      );
      expect(await strm.balanceOf(user1.address)).to.be.closeTo(
        ethers.parseEther("0.96"),
        ethers.parseEther("0.01"),
      );
    });
    it("Must swap taxes to usdc", async () => {
      await strm.turnOnTrading();
      let eth1 = ethers.parseEther("1");
      await usdc.approve(await swapRouter.getAddress(), eth1);
      let exactInputSingleParams = {
        tokenIn: await usdc.getAddress(),
        tokenOut: await strm.getAddress(),
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
        ethers.parseEther("0.039"),
        ethers.parseEther("0.001"),
      );
    });
  });
});
