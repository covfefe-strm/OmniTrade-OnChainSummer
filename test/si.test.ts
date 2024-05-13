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
// import { router } from "../typechain-types/contracts/squidrouter";
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
let router: SignerWithAddress;
let taxRecipient: SignerWithAddress;
let startSnapshot: SnapshotRestorer;
let originalState: SnapshotRestorer;
let name = "StreamerInu";
let symbol = "SI";
let shareDecimal = 8;
describe("StreamerInuToken", async () => {
  before(async () => {
    originalState = await takeSnapshot();
    [owner, user1, multisigWallet, pair, router, taxRecipient] =
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
      router.address,
      100,
      await swapRouter.getAddress(),
    );
    await si.setSiVault(await siVault.getAddress());
    // await si.setPair(pair.address);
    startSnapshot = await takeSnapshot();
  });
  afterEach(async () => {
    await startSnapshot.restore();
  });
  after(async () => {
    await originalState.restore();
  });
  describe("setTaxPercent", async () => {
    it("Must revert if sender isn't owner", async () => {
      await expect(
        si.connect(user1).setTaxPercent(ethers.parseEther("0")),
      ).to.be.revertedWith(errors.OWNABLE_ERROR);
    });
    it("Must revert if tax percent is incorrect", async () => {
      await expect(
        si.setTaxPercent(ethers.parseEther("1")),
      ).to.be.revertedWithCustomError(si, "WrongTaxPercent");
    });

    it("Must revert if tax percent is incorrect after first", async () => {
      await expect(
        si.setTaxPercent(ethers.parseEther("1")),
      ).to.be.revertedWithCustomError(si, "WrongTaxPercent");
    });
    it("Must set new tax percent correctly", async () => {
      let percent = ethers.parseEther("0.4");
      let tx = await si.setTaxPercent(percent);
      expect(await si.taxPercent()).to.be.equal(percent);
      expect(tx).to.be.emit(si, "SetTaxPercent").withArgs(percent);
    });
  });
  describe("setPair", async () => {
    it("Must revert if sender isn't owner", async () => {
      await expect(si.connect(user1).setPair(pair.address)).to.be.revertedWith(
        errors.OWNABLE_ERROR,
      );
    });
    it("Must revert if passed address if zero address", async () => {
      await expect(
        si.setPair(ethers.ZeroAddress),
      ).to.be.revertedWithCustomError(si, "ZeroAddress");
    });
    it("Must revert if SI/USDC pair is already set", async () => {
      await si.setPair(pair.address);
      await expect(si.setPair(pair.address)).to.be.revertedWithCustomError(
        si,
        "PairInitialized",
      );
    });
    it("Must set address of SI/USDC pair correctly", async () => {
      let tx = await si.setPair(pair.address);
      expect(await si.siUsdcPair()).to.be.equal(pair.address);
      expect(tx).to.be.emit(si, "SetPair").withArgs(pair.address);
    });
  });
  describe("setSiVault", async () => {
    it("Must revert if sender isn't owner", async () => {
      await expect(
        si.connect(user1).setSiVault(pair.address),
      ).to.be.revertedWith(errors.OWNABLE_ERROR);
    });
    it("Must revert if passed address if zero address", async () => {
      await expect(
        si.setSiVault(ethers.ZeroAddress),
      ).to.be.revertedWithCustomError(si, "ZeroAddress");
    });
    it("Must revert if passed address isn't supported IERC165", async () => {
      await expect(si.setSiVault(await usdc.getAddress())).to.be.reverted;
    });
    it("Must set address of StreamerInuVault correctly", async () => {
      let tx = await si.setSiVault(await siVault.getAddress());
      expect(await si.siVault()).to.be.equal(await siVault.getAddress());
      expect(tx)
        .to.be.emit(si, "SetSiVault")
        .withArgs(await siVault.getAddress());
    });
  });
  describe("transfer", async () => {
    it("must from owner if isTradable == false", async () => {
      await si.transferOwnership(multisigWallet.address);
      await si.connect(multisigWallet).transfer(user1.address, 100);
      expect(await si.balanceOf(user1.address)).to.be.equal(100);
    });
    it("must transfer by using transferFrom owner if isTradable == false", async () => {
      await si.transferOwnership(multisigWallet.address);
      await si.connect(multisigWallet).approve(owner.address, 100);
      await si.transferFrom(multisigWallet.address, user1.address, 100);
      expect(await si.balanceOf(user1.address)).to.be.equal(100);
    });
    it("must calculate taxes correctly (5%)", async () => {
      await si.turnOnTrading();
      let eth1 = await ethers.parseEther("1");
      await si.setPair(pair.address);
      await si.connect(multisigWallet).transfer(pair, eth1);
      await si.setTaxPercent(ethers.parseEther("0.05"));
      let tx = await si.connect(pair).transfer(user1.address, eth1);
      expect(await si.balanceOf(await siVault.getAddress())).to.be.closeTo(
        ethers.parseEther("0.05"),
        ethers.parseEther("0.0000001"),
      );
      expect(await siVault.lastSiBalance()).to.be.closeTo(
        ethers.parseEther("0.05"),
        ethers.parseEther("0.0000001"),
      );
      expect(await si.balanceOf(user1.address)).to.be.closeTo(
        ethers.parseEther("0.95"),
        ethers.parseEther("0.0000001"),
      );
    });
    it("must execute pass without taxes (with 0%)", async () => {
      await si.turnOnTrading();
      let eth1 = await ethers.parseEther("1");
      await si.setPair(pair.address);
      await si.connect(multisigWallet).transfer(pair, eth1);
      let tx = await si.connect(pair).transfer(user1.address, eth1);
      expect(await si.balanceOf(await siVault.getAddress())).to.be.equal(0);
      expect(await si.balanceOf(user1.address)).to.be.equal(eth1);
      expect(await siVault.lastSiBalance()).to.be.equal(0);
    });
    it("must execute pass with tax percent 0.1%", async () => {
      await si.turnOnTrading();
      let eth1 = await ethers.parseEther("1");
      await si.setPair(pair.address);
      await si.connect(multisigWallet).transfer(pair, eth1);
      await si.setTaxPercent(ethers.parseEther("0.001"));
      let tx = await si.connect(pair).transfer(user1.address, eth1);
      expect(await si.balanceOf(await siVault.getAddress())).to.be.closeTo(
        ethers.parseEther("0.001"),
        ethers.parseEther("0.0000001"),
      );
      expect(await siVault.lastSiBalance()).to.be.closeTo(
        ethers.parseEther("0.001"),
        ethers.parseEther("0.0000001"),
      );
      expect(await si.balanceOf(user1.address)).to.be.closeTo(
        ethers.parseEther("0.999"),
        ethers.parseEther("0.0000001"),
      );
    });
    it("must transfer taxes to Vault contract when STRM are transferred from pool (tax 2%)", async () => {
      await si.turnOnTrading();
      let eth1 = await ethers.parseEther("1");
      await si.setTaxPercent(ethers.parseEther("0.02"));
      await si.connect(multisigWallet).transfer(pair, eth1);
      await si.setPair(pair.address);
      await si.connect(pair).transfer(user1.address, eth1);
      expect(await si.balanceOf(await siVault.getAddress())).to.be.closeTo(
        ethers.parseEther("0.02"),
        ethers.parseEther("0.0000001"),
      );
      expect(await siVault.lastSiBalance()).to.be.closeTo(
        ethers.parseEther("0.02"),
        ethers.parseEther("0.0000001"),
      );
      expect(await si.balanceOf(user1.address)).to.be.closeTo(
        ethers.parseEther("0.98"),
        ethers.parseEther("0.0000001"),
      );
    });
  });
});
