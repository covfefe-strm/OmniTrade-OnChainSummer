import * as dotenv from "dotenv";
import { ethers, network } from "hardhat";
import { expect } from "chai";
import {
  StreamerInuToken,
  StreamerInuToken__factory,
  OftMock,
  OftMock__factory,
  SwapRouterMock,
  SwapRouterMock__factory,
} from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import {
  takeSnapshot,
  SnapshotRestorer,
} from "@nomicfoundation/hardhat-network-helpers";
let siFactory: StreamerInuToken__factory;
let si: StreamerInuToken;
let swapRouterFactory: SwapRouterMock__factory;
let swapRouter: SwapRouterMock;
let erc20Factory: OftMock__factory;
let usdc: OftMock;
let owner: SignerWithAddress;
let user1: SignerWithAddress;
let multisigWallet: SignerWithAddress;
let pair: SignerWithAddress;
let taxRecipient: SignerWithAddress;
let startSnapshot: SnapshotRestorer;
let name = "StreamerInu";
let symbol = "SI";
let shareDecimal = 8;
describe("StreamerInuToken", async () => {
  before(async () => {
    [owner, user1, multisigWallet, pair, taxRecipient] =
      await ethers.getSigners();
    siFactory = (await ethers.getContractFactory(
      "StreamerInuToken",
    )) as StreamerInuToken__factory;
    swapRouterFactory = (await ethers.getContractFactory(
      "SwapRouterMock",
    )) as SwapRouterMock__factory;
    erc20Factory = (await ethers.getContractFactory(
      "OftMock",
    )) as OftMock__factory;
    usdc = await erc20Factory.deploy("USD Coin", "USDC");
    swapRouter = await swapRouterFactory.deploy();
    si = await siFactory.deploy(
      name,
      symbol,
      shareDecimal,
      owner.address,
      multisigWallet.address,
      taxRecipient.address,
      await swapRouter.getAddress(),
      await usdc.getAddress(),
    );
    startSnapshot = await takeSnapshot();
  });
  afterEach(async () => {
    await startSnapshot.restore();
  });
  describe("transfer", async () => {
    it("must calculate taxes correctly", async () => {
      let eth1 = await ethers.parseEther("1");
      await si.setPair(pair.address, 100);
      await si.connect(multisigWallet).transfer(pair, eth1);
      await si.setTaxPercent(ethers.parseEther("0.05"));
      let tx = await si.connect(pair).transfer(user1.address, eth1);
      expect(await si.balanceOf(taxRecipient.address)).to.be.closeTo(
        ethers.parseEther("0.05"),
        ethers.parseEther("0.0000001"),
      );
      expect(await si.balanceOf(user1.address)).to.be.closeTo(
        ethers.parseEther("0.95"),
        ethers.parseEther("0.0000001"),
      );
    });
    it("must execute pass without taxes (with 0%)", async () => {
      let eth1 = await ethers.parseEther("1");
      await si.setPair(pair.address, 100);
      await si.connect(multisigWallet).transfer(pair, eth1);
      let tx = await si.connect(pair).transfer(user1.address, eth1);
      expect(await si.balanceOf(taxRecipient.address)).to.be.equal(0);
      expect(await si.balanceOf(user1.address)).to.be.equal(eth1);
    });
    it("must execute pass with tax percent 0.001", async () => {
      let eth1 = await ethers.parseEther("1");
      console.log("balance", await si.balanceOf(owner.address));
      await si.setPair(pair.address, 100);
      await si.connect(multisigWallet).transfer(pair, eth1);
      await si.setTaxPercent(ethers.parseEther("0.001"));
      let tx = await si.connect(pair).transfer(user1.address, eth1);
      expect(await si.balanceOf(taxRecipient.address)).to.be.closeTo(
        ethers.parseEther("0.001"),
        ethers.parseEther("0.0000001"),
      );
      expect(await si.balanceOf(user1.address)).to.be.closeTo(
        ethers.parseEther("0.999"),
        ethers.parseEther("0.0000001"),
      );
    });
  });
});
