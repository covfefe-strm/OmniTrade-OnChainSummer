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
} from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import {
  takeSnapshot,
  SnapshotRestorer,
} from "@nomicfoundation/hardhat-network-helpers";
import { errors } from "./testHelpers/constants";
let siFactory: StreamerInuToken__factory;
let si: StreamerInuToken;
let vaultFactory: StreamerInuVault__factory;
let siVault: StreamerInuVault;
let swapRouterFactory: SwapRouterMock__factory;
let swapRouter: SwapRouterMock;
let erc20Factory: OftMock__factory;
let usdc: OftMock;
let owner: SignerWithAddress;
let user1: SignerWithAddress;
let multisigWallet: SignerWithAddress;
let pair: SignerWithAddress;
let taxRecipient: SignerWithAddress;
let originalState: SnapshotRestorer;
let startSnapshot: SnapshotRestorer;
let name = "StreamerInu";
let symbol = "SI";
let shareDecimal = 8;
describe("StreamerInuVault", async () => {
  before(async () => {
    originalState = await takeSnapshot();
    [owner, user1, multisigWallet, pair, taxRecipient] =
      await ethers.getSigners();
    siFactory = (await ethers.getContractFactory(
      "StreamerInuToken",
    )) as StreamerInuToken__factory;
    vaultFactory = (await ethers.getContractFactory(
      "StreamerInuVault",
    )) as StreamerInuVault__factory;
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
      owner.address, //_lzEndpoint
      multisigWallet.address, //_recipient
    );
    siVault = await vaultFactory.deploy(
      await si.getAddress(),
      await usdc.getAddress(),
      100,
      await swapRouter.getAddress(),
    );
    await si.setSiVault(await siVault.getAddress());
    await si.setPair(pair.address);
    await si
      .connect(multisigWallet)
      .transfer(pair.address, ethers.parseEther("1"));
    await si.setTaxPercent(ethers.parseEther("0.05"));
    startSnapshot = await takeSnapshot();
  });
  afterEach(async () => {
    await startSnapshot.restore();
  });
  after(async () => {
    await originalState.restore();
  });
  describe("receiveTax", async () => {
    it("Must revert if sender isn't SI token", async () => {
      await expect(
        siVault.receiveTax(ethers.parseEther("1")),
      ).to.be.revertedWithCustomError(siVault, "NotSIToken");
    });
    it("Must receive tax correctly", async () => {
      let tx = await si
        .connect(pair)
        .transfer(owner.address, ethers.parseEther("1"));
      expect(tx).to.be.emit(siVault, "UpdatedTaxAmount");
      expect(await si.balanceOf(await siVault.getAddress())).to.be.closeTo(
        ethers.parseEther("0.05"),
        ethers.parseEther("0.0000001"),
      );
      expect(await siVault.lastSiBalance()).to.be.closeTo(
        ethers.parseEther("0.05"),
        ethers.parseEther("0.0000001"),
      );
      expect(await si.balanceOf(owner.address)).to.be.closeTo(
        ethers.parseEther("0.95"),
        ethers.parseEther("0.0000001"),
      );
    });
  });
  describe("sellSi", async () => {
    it("Must revert if sender isn't owner", async () => {
      await expect(
        siVault.connect(user1).sellSi(ethers.parseEther("0"), user1.address, 0),
      ).to.be.revertedWith(errors.OWNABLE_ERROR);
    });
    it("Must revert if amount is greater then available amount of SI token", async () => {
      await expect(
        siVault.sellSi(ethers.parseEther("1"), user1.address, 0),
      ).to.be.revertedWithCustomError(siVault, "NotEnoughBalance");
    });
    it("Must swap all SI to USDC correctly", async () => {
      await si.connect(pair).transfer(owner.address, ethers.parseEther("1"));
      let amount = await siVault.lastSiBalance();
      let tx = await siVault.sellSi(0, user1.address, 0);
      expect(await siVault.lastSiBalance()).to.be.equal(0);
      expect(await si.balanceOf(await siVault.getAddress())).to.be.equal(0);
      expect(await si.balanceOf(user1.address)).to.be.equal(amount);
    });
  });
  describe("withdrawUnexpectedTokens", async () => {
    it("Must revert if sender isn't owner", async () => {
      await expect(
        siVault
          .connect(user1)
          .withdrawUnexpectedTokens(
            await usdc.getAddress(),
            user1.address,
            ethers.parseEther("1"),
          ),
      ).to.be.revertedWith(errors.OWNABLE_ERROR);
    });
    it("Must revert if one of addresses equals to zero address", async () => {
      await expect(
        siVault.withdrawUnexpectedTokens(
          ethers.ZeroAddress,
          user1.address,
          ethers.parseEther("1"),
        ),
      ).to.be.revertedWithCustomError(siVault, "ZeroAddress");
      await expect(
        siVault.withdrawUnexpectedTokens(
          await usdc.getAddress(),
          ethers.ZeroAddress,
          ethers.parseEther("1"),
        ),
      ).to.be.revertedWithCustomError(siVault, "ZeroAddress");
    });
    it("Must revert if amount equals 0", async () => {
      await expect(
        siVault.withdrawUnexpectedTokens(
          await usdc.getAddress(),
          user1.address,
          0,
        ),
      ).to.be.revertedWithCustomError(siVault, "ZeroValue");
    });
    it("Must revert if token equals to SI and amount is greater then available amount", async () => {
      await expect(
        siVault.withdrawUnexpectedTokens(
          await si.getAddress(),
          user1.address,
          ethers.parseEther("1"),
        ),
      ).to.be.revertedWithCustomError(siVault, "NotEnoughBalance");
    });
    it("Must withdraw SI token correctly", async () => {
      await si
        .connect(multisigWallet)
        .transfer(await siVault.getAddress(), ethers.parseEther("1"));
      let tx = await siVault.withdrawUnexpectedTokens(
        await si.getAddress(),
        user1.address,
        ethers.parseEther("1"),
      );
      expect(tx)
        .to.be.emit(si, "Transfer")
        .withArgs(
          await siVault.getAddress(),
          user1.address,
          ethers.parseEther("1"),
        );
      expect(await si.balanceOf(user1.address)).to.be.equal(
        ethers.parseEther("1"),
      );
      expect(await si.balanceOf(await siVault.getAddress())).to.be.equal(0);
    });
    it("Must withdraw token correctly", async () => {
      await usdc.transfer(await siVault.getAddress(), ethers.parseEther("1"));
      let tx = await siVault.withdrawUnexpectedTokens(
        await usdc.getAddress(),
        user1.address,
        ethers.parseEther("1"),
      );
      expect(tx)
        .to.be.emit(usdc, "Transfer")
        .withArgs(
          await siVault.getAddress(),
          user1.address,
          ethers.parseEther("1"),
        );
      expect(await usdc.balanceOf(user1.address)).to.be.equal(
        ethers.parseEther("1"),
      );
      expect(await usdc.balanceOf(await siVault.getAddress())).to.be.equal(0);
    });
  });
});
