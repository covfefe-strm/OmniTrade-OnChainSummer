import * as dotenv from "dotenv";
import { ethers, network } from "hardhat";
import { expect } from "chai";
import {
  StreamerInuRouter,
  StreamerInuRouter__factory,
  OftMock,
  OftMock__factory,
  SquidRouterMock,
  SquidRouterMock__factory,
  NotNativeRecipient,
  NotNativeRecipient__factory,
} from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import {
  takeSnapshot,
  SnapshotRestorer,
} from "@nomicfoundation/hardhat-network-helpers";
import { errors } from "./testHelpers/constants";
import { addressToBytes32 } from "./testHelpers/utils";
import { wordlists } from "ethers";
let siFactory: OftMock__factory;
let si: OftMock;
let sqdRouter: SquidRouterMock;
let sqdRouterFactroy: SquidRouterMock__factory;
let siRouter: StreamerInuRouter;
let siRouterFactroy: StreamerInuRouter__factory;
let owner: SignerWithAddress;
let user1: SignerWithAddress;
let squidMulticall: SignerWithAddress;
let startSnapshot: SnapshotRestorer;
let originalState: SnapshotRestorer;
let name = "StreamerInu";
let symbol = "SI";
describe("StreamerInuRouter", async () => {
  before(async () => {
    originalState = await takeSnapshot();
    [owner, user1, squidMulticall] = await ethers.getSigners();
    siFactory = (await ethers.getContractFactory(
      "OftMock",
    )) as OftMock__factory;
    si = await siFactory.deploy(name, symbol);
    sqdRouterFactroy = (await ethers.getContractFactory(
      "SquidRouterMock",
    )) as SquidRouterMock__factory;
    sqdRouter = await sqdRouterFactroy.deploy();
    siRouterFactroy = (await ethers.getContractFactory(
      "StreamerInuRouter",
    )) as StreamerInuRouter__factory;
    siRouter = await siRouterFactroy.deploy(
      await si.getAddress(),
      await sqdRouter.getAddress(),
      squidMulticall.address,
    );
    startSnapshot = await takeSnapshot();
  });
  after(async () => {
    await originalState.restore();
  });
  describe("deployment", async () => {
    it("must deploy correctly", async () => {
      expect(await siRouter.owner()).to.be.equal(owner.address);
      expect(await siRouter.si()).to.be.equal(await si.getAddress());
      expect(await siRouter.squidRouter()).to.be.equal(
        await sqdRouter.getAddress(),
      );
      expect(await siRouter.squidMulticall()).to.be.equal(
        squidMulticall.address,
      );
    });
  });
  describe("setSquidMulticall", async () => {
    after(async () => {
      await startSnapshot.restore();
    });
    it("must revert if sender isn't owner", async () => {
      await expect(
        siRouter.connect(user1).setSquidMulticall(user1.address),
      ).to.be.revertedWith(errors.OWNABLE_ERROR);
    });
    it("must revert if passed address is zero address", async () => {
      await expect(
        siRouter.setSquidMulticall(ethers.ZeroAddress),
      ).to.be.revertedWithCustomError(siRouter, "ZeroAddress");
    });
    it("must set new address of squidMulticall correctly", async () => {
      await siRouter.setSquidMulticall(user1.address);
      expect(await siRouter.squidMulticall()).to.be.equal(user1.address);
    });
  });
  describe("setSquidRouter", async () => {
    after(async () => {
      await startSnapshot.restore();
    });
    it("must revert if sender isn't owner", async () => {
      await expect(
        siRouter.connect(user1).setSquidRouter(user1.address),
      ).to.be.revertedWith(errors.OWNABLE_ERROR);
    });
    it("must revert if passed address is zero address", async () => {
      await expect(
        siRouter.setSquidRouter(ethers.ZeroAddress),
      ).to.be.revertedWithCustomError(siRouter, "ZeroAddress");
    });
    it("must set new address of squidRouter correctly", async () => {
      await siRouter.setSquidRouter(user1.address);
      expect(await siRouter.squidRouter()).to.be.equal(user1.address);
    });
  });
  describe("deposit", async () => {
    after(async () => {
      await startSnapshot.restore();
    });
    it("must deposit native tokens correctly", async () => {
      let eth1 = ethers.parseEther("1");
      let tx = await siRouter.deposit(user1.address, {
        value: eth1,
      });
      expect(tx)
        .to.be.emit(siRouter, "NativeTokenDeposited")
        .withArgs(user1.address, eth1);
      expect(await siRouter.nativeBalance(user1.address)).to.be.equal(eth1);
      expect(await siRouter.nativeBalance(owner.address)).to.be.equal(
        ethers.parseEther("0"),
      );
      expect(await siRouter.totalNativeLocked()).to.be.equal(eth1);
    });
  });
  describe("withdrawNative", async () => {
    let eth1 = ethers.parseEther("1");
    let localSnapshot: SnapshotRestorer;
    let noNativeRecipient: NotNativeRecipient;
    before(async () => {
      console.log("withdrawNative");
      await siRouter.deposit(user1.address, {
        value: eth1,
      });
      let noNativeRecipientFactory = (await ethers.getContractFactory(
        "NotNativeRecipient",
      )) as NotNativeRecipient__factory;
      noNativeRecipient = await noNativeRecipientFactory.deploy();
      localSnapshot = await takeSnapshot();
    });
    afterEach(async () => {
      await localSnapshot.restore();
    });
    after(async () => {
      await startSnapshot.restore();
    });
    it("must revert if sender doesn't have reserved tokens", async () => {
      await expect(
        siRouter.withdrawNative(eth1, owner.address),
      ).to.be.revertedWithCustomError(siRouter, "NotEnoughBalance");
    });
    it("must revert if sender doesn't have enough reserved tokens", async () => {
      await expect(
        siRouter
          .connect(user1)
          .withdrawNative(ethers.parseEther("2"), owner.address),
      ).to.be.revertedWithCustomError(siRouter, "NotEnoughBalance");
    });
    it("must revert if recipient address is zero address", async () => {
      await expect(
        siRouter
          .connect(user1)
          .withdrawNative(ethers.parseEther("0.5"), ethers.ZeroAddress),
      ).to.be.revertedWithCustomError(siRouter, "ZeroAddress");
    });
    it("must revert if sending of native token failed", async () => {
      await expect(
        siRouter
          .connect(user1)
          .withdrawNative(
            ethers.parseEther("0.5"),
            await noNativeRecipient.getAddress(),
          ),
      ).to.be.revertedWithCustomError(siRouter, "NativeTransferFailed");
    });
    it("must withdraw native token correctly", async () => {
      let tx = await siRouter
        .connect(user1)
        .withdrawNative(eth1, owner.address);
      expect(tx)
        .to.be.emit(siRouter, "NativeTokenWithdrawn")
        .withArgs(owner.address, eth1);
    });
  });
  describe("withdrawSI", async () => {
    let eth1 = ethers.parseEther("1");
    let localSnapshot: SnapshotRestorer;
    before(async () => {
      console.log("withdrawSI");
      const from = addressToBytes32(owner.address);
      await si.transfer(await siRouter.getAddress(), eth1);
      await si.sendToSIRouter(await siRouter.getAddress(), from, eth1, "0x");
      localSnapshot = await takeSnapshot();
    });
    afterEach(async () => {
      await localSnapshot.restore();
    });
    after(async () => {
      await startSnapshot.restore();
    });
    it("must revert if sender doesn't have reserved tokens", async () => {
      await expect(
        siRouter.connect(user1).withdrawSI(eth1, user1.address),
      ).to.be.revertedWithCustomError(siRouter, "NotEnoughBalance");
    });
    it("must revert if sender doesn't have enough reserved tokens", async () => {
      await expect(
        siRouter.withdrawSI(ethers.parseEther("2"), user1.address),
      ).to.be.revertedWithCustomError(siRouter, "NotEnoughBalance");
    });
    it("must revert if recipient address is zero address", async () => {
      await expect(
        siRouter.withdrawSI(eth1, ethers.ZeroAddress),
      ).to.be.revertedWithCustomError(siRouter, "ZeroAddress");
    });
    xit("must revert if transfer of SI token failed", async () => {});
    it("must withdraw SI token correctly", async () => {
      expect(await siRouter.totalLocked()).to.be.equal(eth1);
      expect(await siRouter.reservedTokens(owner.address)).to.be.equal(eth1);
      expect(await si.balanceOf(await siRouter.getAddress())).to.be.equal(eth1);
      let tx = await siRouter.withdrawSI(eth1, user1.address);
      expect(await siRouter.totalLocked()).to.be.equal(0);
      expect(await siRouter.reservedTokens(owner.address)).to.be.equal(0);
      expect(await si.balanceOf(await siRouter.getAddress())).to.be.equal(0);
      expect(tx)
        .to.be.emit(si, "Transfer")
        .withArgs(await siRouter.getAddress(), user1.address, eth1);
      expect(await si.balanceOf(user1.address)).to.be.equal(eth1);
    });
  });
  describe("getRequiredValueToCoverOFTTransfer", async () => {
    let eth1 = ethers.parseEther("1");
    let toBytes32: string;
    before(async () => {
      toBytes32 = addressToBytes32(owner.address);
      await si.setSendFee(eth1, eth1);
      await siRouter.deposit(owner.address, { value: eth1 });
    });
    after(async () => {
      await startSnapshot.restore();
    });
    it("must return zero if user deposited enough native tokens", async () => {
      expect(
        await siRouter.getRequiredValueToCoverOFTTransfer(
          0,
          toBytes32,
          eth1,
          "0x",
        ),
      ).to.be.equal(0);
    });
    it("must return sendFee - depositedNativeTokens", async () => {
      let user1Bytes32 = addressToBytes32(user1.address);
      expect(
        await siRouter
          .connect(user1)
          .getRequiredValueToCoverOFTTransfer(0, user1Bytes32, eth1, "0x"),
      ).to.be.equal(eth1);
    });
  });
  describe("onOFTReceived", async () => {
    let eth1 = ethers.parseEther("1");
    let toBytes32: string;
    let localSnapshot: SnapshotRestorer;
    before(async () => {
      toBytes32 = addressToBytes32(owner.address);
      await si.setSendFee(eth1, eth1);
      await siRouter.deposit(owner.address, { value: eth1 });
      localSnapshot = await takeSnapshot();
    });
    afterEach(async () => {
      await localSnapshot.restore();
    });
    after(async () => {
      await startSnapshot.restore();
    });
    it("must revert if sender isn't SI token", async () => {
      await expect(
        siRouter.onOFTReceived(0, "0x", 0, toBytes32, eth1, "0x"),
      ).to.be.revertedWithCustomError(siRouter, "NotSIToken");
    });
    it("must receive SI token correctly to _from address", async () => {
      let tx = await si.sendToSIRouter(
        await siRouter.getAddress(),
        toBytes32,
        eth1,
        "0x",
      );
      expect(await siRouter.totalLocked()).to.be.equal(eth1);
      expect(await siRouter.reservedTokens(owner.address)).to.be.equal(eth1);
      expect(tx)
        .to.be.emit(siRouter, "OFTTokensReceived")
        .withArgs(owner.address, eth1);
    });
    it("must receive SI token correctly to address from payload", async () => {
      const payload = addressToBytes32(user1.address);
      let tx = await si.sendToSIRouter(
        await siRouter.getAddress(),
        toBytes32,
        eth1,
        payload,
      );
      expect(await siRouter.totalLocked()).to.be.equal(eth1);
      expect(await siRouter.reservedTokens(user1.address)).to.be.equal(eth1);
      expect(await siRouter.reservedTokens(owner.address)).to.be.equal(0);
      expect(tx)
        .to.be.emit(siRouter, "OFTTokensReceived")
        .withArgs(user1.address, eth1);
    });
  });
  describe("sendOFTTokenToOwner", async () => {
    let eth1 = ethers.parseEther("1");
    let toBytes32: string;
    let localSnapshot: SnapshotRestorer;
    before(async () => {
      toBytes32 = addressToBytes32(user1.address);
      await si.transfer(await siRouter.getAddress(), eth1);
      await si.setSendFee(eth1, eth1);
      await siRouter.deposit(user1.address, {
        value: eth1,
      });
      localSnapshot = await takeSnapshot();
    });
    afterEach(async () => {
      await localSnapshot.restore();
    });
    after(async () => {
      await startSnapshot.restore();
    });
    it("must revert if sender isn't squidMulticall", async () => {
      await expect(
        siRouter.sendOFTTokenToOwner(0, toBytes32, user1.address, "0x"),
      ).to.be.revertedWithCustomError(siRouter, "NotSquidMultical");
    });
    it("must revert if balance of SI token <= total reserved amount", async () => {
      await siRouter
        .connect(squidMulticall)
        .sendOFTTokenToOwner(0, toBytes32, user1.address, "0x");
      await expect(
        siRouter
          .connect(squidMulticall)
          .sendOFTTokenToOwner(0, toBytes32, user1.address, "0x"),
      ).to.be.revertedWithCustomError(siRouter, "NotEnoughBalance");
    });
    it("must revert if balance of native token isn't enough", async () => {
      await si.setSendFee(ethers.parseEther("2"), eth1);
      await expect(
        siRouter
          .connect(squidMulticall)
          .sendOFTTokenToOwner(0, toBytes32, user1.address, "0x"),
      ).to.be.revertedWithCustomError(siRouter, "NotEnoughBalance");
    });
    it("must send OFT token correctly", async () => {
      let tx = await siRouter
        .connect(squidMulticall)
        .sendOFTTokenToOwner(0, toBytes32, user1.address, "0x");
      expect(tx)
        .to.be.emit(si, "SentFrom")
        .withArgs(await siRouter.getAddress(), toBytes32, eth1, eth1);
      expect(await si.balanceOf(await siRouter.getAddress())).to.be.equal(0);
    });
  });
  describe("sellSI", async () => {
    let eth1 = ethers.parseEther("1");
    let toBytes32: string;
    let localSnapshot: SnapshotRestorer;
    before(async () => {
      toBytes32 = addressToBytes32(user1.address);
      await si.transfer(await siRouter.getAddress(), eth1);
      await si.setSendFee(eth1, eth1);
      await siRouter.deposit(user1.address, {
        value: eth1,
      });
      await si.sendToSIRouter(
        await siRouter.getAddress(),
        toBytes32,
        eth1,
        "0x",
      );
      localSnapshot = await takeSnapshot();
    });
    afterEach(async () => {
      await localSnapshot.restore();
    });
    after(async () => {
      await startSnapshot.restore();
    });
    it("must revert if sender doesn't have reserved SI tokens", async () => {
      await expect(
        siRouter.sellSI(
          [],
          "Polygon",
          owner.address,
          "0x",
          owner.address,
          eth1,
        ),
      ).to.be.revertedWithCustomError(siRouter, "ZeroSIBalance");
    });
    it("must revert if sender doesn't have enough reserved SI tokens", async () => {
      await expect(
        siRouter
          .connect(user1)
          .sellSI(
            [],
            "Polygon",
            owner.address,
            "0x",
            owner.address,
            ethers.parseEther("2"),
          ),
      ).to.be.revertedWithCustomError(siRouter, "NotEnoughBalance");
    });
    xit("must revert if approve of SI tokens failed", async () => {});
    it("must call callBridgeCall correctly", async () => {
      let tx = siRouter
        .connect(user1)
        .sellSI([], "Polygon", owner.address, "0x", owner.address, eth1);
      expect(tx)
        .to.be.emit(si, "Approval")
        .withArgs(
          await siRouter.getAddress(),
          await sqdRouter.getAddress(),
          eth1,
        );
      expect(tx)
        .to.be.emit(sqdRouter, "CallBridgeCall")
        .withArgs(await si.getAddress(), eth1, eth1);
    });
  });
});
