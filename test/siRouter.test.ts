import * as dotenv from "dotenv";
import { ethers, network } from "hardhat";
import { expect } from "chai";
import {
  StreamerInuRouter,
  StreamerInuRouter__factory,
  StreamerInuVault,
  StreamerInuVault__factory,
  OftMock,
  OftMock__factory,
  OFTV2TestMock,
  OFTV2TestMock__factory,
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
import { AddressLike, ZeroAddress } from "ethers";
let oftV1Factory: OftMock__factory;
let oftV1: OftMock;
let oftV2Factory: OFTV2TestMock__factory;
let oftV2: OFTV2TestMock;
let sqdRouter: SquidRouterMock;
let sqdRouterFactroy: SquidRouterMock__factory;
let siRouter: StreamerInuRouter;
let siRouterFactroy: StreamerInuRouter__factory;
let vault: StreamerInuVault;
let vaultFactory: StreamerInuVault__factory;
let owner: SignerWithAddress;
let user1: SignerWithAddress;
let squidMulticall: SignerWithAddress;
let lzEndpoint: SignerWithAddress;
let startSnapshot: SnapshotRestorer;
let originalState: SnapshotRestorer;
let name = "StreamerInu";
let symbol = "SI";
// because for test we use fork of Polygon network we can use address of true LZ V2 endpoint
let PolygonEndpointV2 = "0x1a44076050125825900e736c501f859c50fE728c";
describe("StreamerInuRouter", async () => {
  before(async () => {
    originalState = await takeSnapshot();
    [owner, user1, squidMulticall, lzEndpoint] = await ethers.getSigners();
    oftV1Factory = (await ethers.getContractFactory(
      "OftMock",
    )) as OftMock__factory;
    oftV2Factory = (await ethers.getContractFactory(
      "OFTV2TestMock",
    )) as OFTV2TestMock__factory;
    oftV1 = await oftV1Factory.deploy(name, symbol);
    oftV2 = await oftV2Factory.deploy(
      name,
      symbol,
      PolygonEndpointV2,
      owner.address,
    );
    sqdRouterFactroy = (await ethers.getContractFactory(
      "SquidRouterMock",
    )) as SquidRouterMock__factory;
    sqdRouter = await sqdRouterFactroy.deploy();
    siRouterFactroy = (await ethers.getContractFactory(
      "StreamerInuRouter",
    )) as StreamerInuRouter__factory;
    siRouter = await siRouterFactroy.deploy(
      await sqdRouter.getAddress(),
      squidMulticall.address,
    );
    vaultFactory = (await ethers.getContractFactory(
      "StreamerInuVault",
    )) as StreamerInuVault__factory;
    vault = await vaultFactory.deploy(
      await oftV1.getAddress(), //strm
      await oftV1.getAddress(), //usdc
      await siRouter.getAddress(), // si router
      100, // pair fee
      owner.address, //swap router
    );
    await siRouter.setOFT(await oftV1.getAddress(), 1);
    await siRouter.setOFT(await oftV2.getAddress(), 2);
    startSnapshot = await takeSnapshot();
  });
  after(async () => {
    await originalState.restore();
  });
  describe("deployment", async () => {
    it("must deploy correctly", async () => {
      expect(await siRouter.owner()).to.be.equal(owner.address);
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
  describe("setLzEndpointV2", async () => {
    after(async () => {
      await startSnapshot.restore();
    });
    it("must revert if sender isn't owner", async () => {
      await expect(
        siRouter.connect(user1).setLzEndpointV2(user1.address),
      ).to.be.revertedWith(errors.OWNABLE_ERROR);
    });
    it("must revert if passed address is zero address", async () => {
      await expect(
        siRouter.setLzEndpointV2(ethers.ZeroAddress),
      ).to.be.revertedWithCustomError(siRouter, "ZeroAddress");
    });
    it("must set new endpoint address correctly", async () => {
      await siRouter.setLzEndpointV2(user1.address);
      expect(await siRouter.endpointV2()).to.be.equal(user1.address);
    });
  });
  describe("setSIVault", async () => {
    after(async () => {
      await startSnapshot.restore();
    });
    it("must revert if sender isn't owner", async () => {
      await expect(
        siRouter
          .connect(user1)
          .setSIVault(await oftV1.getAddress(), user1.address),
      ).to.be.revertedWith(errors.OWNABLE_ERROR);
    });
    it("must revert if passed address of oft is zero address", async () => {
      await expect(
        siRouter.setSIVault(ethers.ZeroAddress, user1.address),
      ).to.be.revertedWithCustomError(siRouter, "NotActiveOFT");
    });
    it("must revert if passed address of vault is zero address", async () => {
      await expect(
        siRouter.setSIVault(await oftV1.getAddress(), ethers.ZeroAddress),
      ).to.be.revertedWithCustomError(siRouter, "ZeroAddress");
    });
    it("must set new address of squidRouter correctly", async () => {
      await siRouter.setSIVault(await oftV1.getAddress(), user1.address);
      expect(await siRouter.vaults(await oftV1.getAddress())).to.be.equal(
        user1.address,
      );
    });
  });
  describe("setOFT", async () => {
    after(async () => {
      await startSnapshot.restore();
    });
    it("must revert if sender isn't owner", async () => {
      await expect(
        siRouter.connect(user1).setOFT(await oftV1.getAddress(), 1),
      ).to.be.revertedWith(errors.OWNABLE_ERROR);
    });
    it("must revert if passed address is zero address", async () => {
      await expect(
        siRouter.setOFT(ethers.ZeroAddress, 1),
      ).to.be.revertedWithCustomError(siRouter, "ZeroAddress");
    });
    it("must set new endpoint address correctly", async () => {
      await siRouter.setOFT(await oftV1.getAddress(), 1);
      expect(await siRouter.oftsVersion(await oftV1.getAddress())).to.be.equal(
        1,
      );
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
      const from = addressToBytes32(owner.address);
      await oftV1.transfer(await siRouter.getAddress(), eth1);
      await oftV1.sendToSIRouter(await siRouter.getAddress(), from, eth1, "0x");
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
        siRouter
          .connect(user1)
          .withdrawOFT(await oftV1.getAddress(), eth1, user1.address),
      ).to.be.revertedWithCustomError(siRouter, "NotEnoughBalance");
    });
    it("must revert if sender doesn't have enough reserved tokens", async () => {
      await expect(
        siRouter.withdrawOFT(
          await oftV1.getAddress(),
          ethers.parseEther("2"),
          user1.address,
        ),
      ).to.be.revertedWithCustomError(siRouter, "NotEnoughBalance");
    });
    it("must revert if oft isn't active or zero address", async () => {
      await expect(
        siRouter.withdrawOFT(
          ethers.ZeroAddress,
          ethers.parseEther("2"),
          user1.address,
        ),
      ).to.be.revertedWithCustomError(siRouter, "NotActiveOFT");
    });
    it("must revert if recipient address is zero address", async () => {
      await expect(
        siRouter.withdrawOFT(
          await oftV1.getAddress(),
          eth1,
          ethers.ZeroAddress,
        ),
      ).to.be.revertedWithCustomError(siRouter, "ZeroAddress");
    });
    xit("must revert if transfer of STRM token failed", async () => {});
    it("must withdraw STRM token correctly", async () => {
      expect(await siRouter.totalLocked(await oftV1.getAddress())).to.be.equal(
        eth1,
      );
      expect(
        await siRouter.reservedTokens(await oftV1.getAddress(), owner.address),
      ).to.be.equal(eth1);
      expect(await oftV1.balanceOf(await siRouter.getAddress())).to.be.equal(
        eth1,
      );
      let tx = await siRouter.withdrawOFT(
        await oftV1.getAddress(),
        eth1,
        user1.address,
      );
      expect(await siRouter.totalLocked(await oftV1.getAddress())).to.be.equal(
        0,
      );
      expect(
        await siRouter.reservedTokens(await oftV1.getAddress(), owner.address),
      ).to.be.equal(0);
      expect(await oftV1.balanceOf(await siRouter.getAddress())).to.be.equal(0);
      expect(tx)
        .to.be.emit(oftV1, "Transfer")
        .withArgs(await siRouter.getAddress(), user1.address, eth1);
      expect(await oftV1.balanceOf(user1.address)).to.be.equal(eth1);
    });
  });
  describe("getRequiredValueToCoverOFTTransferV1", async () => {
    let eth1 = ethers.parseEther("1");
    let toBytes32: string;
    before(async () => {
      toBytes32 = addressToBytes32(owner.address);
      await oftV1.setSendFee(eth1, eth1);
      await siRouter.deposit(owner.address, { value: eth1 });
    });
    after(async () => {
      await startSnapshot.restore();
    });
    it("must return zero if user deposited enough native tokens", async () => {
      expect(
        await siRouter.getRequiredValueToCoverOFTTransferV1(
          await oftV1.getAddress(),
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
          .getRequiredValueToCoverOFTTransferV1(
            await oftV1.getAddress(),
            0,
            user1Bytes32,
            eth1,
            "0x",
          ),
      ).to.be.equal(eth1);
    });
  });
  describe("getRequiredValueToCoverOFTTransferV2", async () => {
    let eth1 = ethers.parseEther("1");
    let toBytes32: string;
    let sendParam: any;
    before(async () => {
      toBytes32 = addressToBytes32(owner.address);
      await oftV2.setSendFee(eth1);
      await siRouter.deposit(owner.address, { value: eth1 });
      const ownerBytes32 = addressToBytes32(owner.address);
      await oftV2.setPeer(30102, ownerBytes32);
      sendParam = {
        dstEid: 30102,
        to: ownerBytes32,
        amountLD: eth1,
        minAmountLD: eth1,
        extraOptions: "0x00030100110100000000000000000000000000030d40",
        composeMsg: "0x",
        oftCmd: "0x",
      };
      // console.log("sendParam.to", sendParam.to);
    });
    after(async () => {
      await startSnapshot.restore();
    });
    it("must return zero if user deposited enough native tokens", async () => {
      const sendFee = await siRouter.getRequiredValueToCoverOFTTransferV2(
        await oftV2.getAddress(),
        sendParam,
      );
      // console.log(sendFee);
      expect(sendFee).to.be.equal(0);
    });
    it("must return sendFee - depositedNativeTokens", async () => {
      let user1Bytes32 = addressToBytes32(user1.address);
      sendParam.to = user1Bytes32;
      // console.log("sendParam.to", sendParam.to);
      const sendFee = await siRouter.getRequiredValueToCoverOFTTransferV2(
        await oftV2.getAddress(),
        sendParam,
      );
      // console.log(sendFee);
      expect(sendFee).to.be.equal(eth1);
    });
  });
  describe("onOFTReceived", async () => {
    let eth1 = ethers.parseEther("1");
    let toBytes32: string;
    let localSnapshot: SnapshotRestorer;
    before(async () => {
      toBytes32 = addressToBytes32(owner.address);
      await oftV1.setSendFee(eth1, eth1);
      await siRouter.deposit(owner.address, { value: eth1 });
      localSnapshot = await takeSnapshot();
    });
    afterEach(async () => {
      await localSnapshot.restore();
    });
    after(async () => {
      await startSnapshot.restore();
    });
    it("must revert if sender isn't STRM token", async () => {
      await expect(
        siRouter.onOFTReceived(0, "0x", 0, toBytes32, eth1, "0x"),
      ).to.be.revertedWithCustomError(siRouter, "NotActiveOFT");
    });
    it("must receive STRM token correctly to _from address", async () => {
      let tx = await oftV1.sendToSIRouter(
        await siRouter.getAddress(),
        toBytes32,
        eth1,
        "0x",
      );
      expect(await siRouter.totalLocked(await oftV1.getAddress())).to.be.equal(
        eth1,
      );
      expect(
        await siRouter.reservedTokens(await oftV1.getAddress(), owner.address),
      ).to.be.equal(eth1);
      expect(tx)
        .to.be.emit(siRouter, "OFTTokensReceived")
        .withArgs(await oftV1.getAddress(), owner.address, eth1);
    });
    it("must receive STRM token correctly to address from payload", async () => {
      const payload = addressToBytes32(user1.address);
      let tx = await oftV1.sendToSIRouter(
        await siRouter.getAddress(),
        toBytes32,
        eth1,
        payload,
      );
      expect(await siRouter.totalLocked(await oftV1.getAddress())).to.be.equal(
        eth1,
      );
      expect(
        await siRouter.reservedTokens(await oftV1.getAddress(), user1.address),
      ).to.be.equal(eth1);
      expect(
        await siRouter.reservedTokens(await oftV1.getAddress(), owner.address),
      ).to.be.equal(0);
      expect(tx)
        .to.be.emit(siRouter, "OFTTokensReceived")
        .withArgs(await oftV1.getAddress(), user1.address, eth1);
    });
  });
  describe("lzCompose", async () => {
    let eth1 = ethers.parseEther("1");
    let ownerBytes32: string;
    let sendParam: any;
    let localSnapshot: SnapshotRestorer;
    before(async () => {
      ownerBytes32 = addressToBytes32(owner.address);
      await oftV2.setSendFee(eth1);
      await siRouter.deposit(owner.address, { value: eth1 });
      await oftV2.setPeer(30102, ownerBytes32);
      sendParam = {
        dstEid: 30102,
        to: ownerBytes32,
        amountLD: eth1,
        minAmountLD: eth1,
        extraOptions: "0x00030100110100000000000000000000000000030d40",
        composeMsg: ownerBytes32,
        oftCmd: "0x",
      };
      await siRouter.setLzEndpointV2(lzEndpoint.address);
      await siRouter.setOFT(owner.address, 2);
      await siRouter.setOFT(lzEndpoint.address, 2);
      localSnapshot = await takeSnapshot();
    });
    afterEach(async () => {
      await localSnapshot.restore();
    });
    after(async () => {
      await startSnapshot.restore();
    });
    it("must revert if sender isn't LZ endpoint", async () => {
      const encodedComposedMessage = await oftV2.encodedMsg(
        ownerBytes32,
        eth1,
        ownerBytes32,
      );
      // console.log("encodedComposedMessage", encodedComposedMessage);
      await expect(
        siRouter.lzCompose(
          owner.address,
          ownerBytes32,
          encodedComposedMessage,
          owner.address,
          "0x",
        ),
      ).to.be.revertedWithCustomError(siRouter, "NotLzEndpointToken");
    });
    xit("must execute composed message correctly", async () => {
      const encodedComposedMessage = await oftV2.encodedMsg(
        ownerBytes32,
        eth1,
        ownerBytes32,
      );
      console.log("ownerBytes32", ownerBytes32); // 0x000000000000000000000000f39Fd6e51aad88F6F4ce6aB8827279cffFb92266
      console.log("encodedComposedMessage", encodedComposedMessage);
      await siRouter
        .connect(lzEndpoint)
        .lzCompose(
          owner.address,
          ownerBytes32,
          encodedComposedMessage,
          owner.address,
          "0x",
        );
      expect(await siRouter.totalLocked(lzEndpoint.address)).to.be.equal(eth1);
      expect(
        await siRouter.reservedTokens(lzEndpoint.address, owner.address),
      ).to.be.equal(eth1);
    });
  });
  describe("sendOFTTokenToOwnerV1", async () => {
    let eth1 = ethers.parseEther("1");
    let toBytes32: string;
    let localSnapshot: SnapshotRestorer;
    before(async () => {
      toBytes32 = addressToBytes32(user1.address);
      await oftV1.transfer(squidMulticall.address, eth1);
      await oftV1.setSendFee(eth1, eth1);
      await siRouter.deposit(user1.address, {
        value: eth1,
      });
      await oftV1
        .connect(squidMulticall)
        .approve(await siRouter.getAddress(), eth1);
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
        siRouter[
          "sendOFTTokenToOwner(address,uint16,uint256,bytes32,address,bytes)"
        ](await oftV1.getAddress(), 0, eth1, toBytes32, user1.address, "0x"),
      ).to.be.revertedWithCustomError(siRouter, "NotSquidMultical");
    });
    it("must revert if balance of STRM token <= total reserved amount", async () => {
      // send all tokens
      await siRouter
        .connect(squidMulticall)
        [
          "sendOFTTokenToOwner(address,uint16,uint256,bytes32,address,bytes)"
        ](await oftV1.getAddress(), 0, eth1, toBytes32, user1.address, "0x");
      await expect(
        siRouter
          .connect(squidMulticall)
          [
            "sendOFTTokenToOwner(address,uint16,uint256,bytes32,address,bytes)"
          ](await oftV1.getAddress(), 0, eth1, toBytes32, user1.address, "0x"),
      ).to.be.revertedWith("ERC20: insufficient allowance");
    });
    it("must revert if balance of native token isn't enough", async () => {
      await oftV1.setSendFee(ethers.parseEther("2"), eth1);
      await expect(
        siRouter
          .connect(squidMulticall)
          [
            "sendOFTTokenToOwner(address,uint16,uint256,bytes32,address,bytes)"
          ](await oftV1.getAddress(), 0, eth1, toBytes32, user1.address, "0x"),
      ).to.be.revertedWithCustomError(siRouter, "NotEnoughBalance");
    });
    it("must send OFT token correctly without taxes", async () => {
      let tx = await siRouter
        .connect(squidMulticall)
        [
          "sendOFTTokenToOwner(address,uint16,uint256,bytes32,address,bytes)"
        ](await oftV1.getAddress(), 0, eth1, toBytes32, user1.address, "0x");
      expect(tx)
        .to.be.emit(oftV1, "SentFrom")
        .withArgs(await siRouter.getAddress(), toBytes32, eth1, eth1);
      expect(await oftV1.balanceOf(await siRouter.getAddress())).to.be.equal(0);
    });
    it("must send OFT token correctly with taxes", async () => {
      await siRouter.setSIVault(
        await oftV1.getAddress(),
        await vault.getAddress(),
      );
      let tx = await siRouter
        .connect(squidMulticall)
        [
          "sendOFTTokenToOwner(address,uint16,uint256,bytes32,address,bytes)"
        ](await oftV1.getAddress(), 0, eth1, toBytes32, user1.address, "0x");
      expect(await oftV1.balanceOf(await vault.getAddress())).to.be.closeTo(
        ethers.parseEther("0.002"),
        ethers.parseEther("0.000001"),
      );
      expect(await vault.lastSiBalance()).to.be.closeTo(
        ethers.parseEther("0.002"),
        ethers.parseEther("0.000001"),
      );
    });
  });
  describe("sendOFTTokenToOwnerV2", async () => {
    let eth1 = ethers.parseEther("1");
    let ownerBytes32: string;
    let sendParam: any;
    let sendFee: any;
    let localSnapshot: SnapshotRestorer;
    before(async () => {
      ownerBytes32 = addressToBytes32(owner.address);
      await oftV2.setSendFee(eth1);
      await siRouter.deposit(owner.address, { value: eth1 });
      await oftV2.setPeer(30102, ownerBytes32);
      sendParam = {
        dstEid: 30102,
        to: ownerBytes32,
        amountLD: eth1,
        minAmountLD: eth1,
        extraOptions: "0x00030100110100000000000000000000000000030d40",
        composeMsg: ownerBytes32,
        oftCmd: "0x",
      };
      sendFee = {
        nativeFee: eth1,
        lzTokenFee: 0,
      };
      await siRouter.setLzEndpointV2(lzEndpoint.address);
      // await siRouter.setOFT(awit , 2);
      // await siRouter.setOFT(lzEndpoint.address, 2);
      localSnapshot = await takeSnapshot();
    });
    afterEach(async () => {
      await localSnapshot.restore();
    });
    after(async () => {
      await startSnapshot.restore();
    });
    it("must revert if sender doesn't have tokens", async () => {
      await expect(
        oftV2.connect(lzEndpoint).send(sendParam, sendFee, owner.address, {
          value: eth1,
        }),
      ).to.be.revertedWith("ERC20: burn amount exceeds balance");
    });
    it("must revert if passed peer is empty", async () => {
      const localSendParam = {
        dstEid: 10102,
        to: ownerBytes32,
        amountLD: eth1,
        minAmountLD: eth1,
        extraOptions: "0x00030100110100000000000000000000000000030d40",
        composeMsg: ownerBytes32,
        oftCmd: "0x",
      };
      await expect(
        oftV2.send(localSendParam, sendFee, owner.address, {
          value: eth1,
        }),
      ).to.be.revertedWithCustomError(oftV2, "NoPeer");
    });
    it("must send oft token correctly", async () => {
      const lastOwnerBalance = await oftV2.balanceOf(owner.address);
      expect(lastOwnerBalance).to.be.greaterThan(eth1);
      let tx = await oftV2.send(sendParam, sendFee, owner.address, {
        value: eth1,
      });
      expect(await oftV2.balanceOf(owner.address)).to.be.equal(
        lastOwnerBalance - eth1,
      );
    });
    xit("must send oft token correctly via Router", async () => {});
  });
  describe("sellSI", async () => {
    let eth1 = ethers.parseEther("1");
    let toBytes32: string;
    let localSnapshot: SnapshotRestorer;
    before(async () => {
      toBytes32 = addressToBytes32(user1.address);
      await oftV1.transfer(await siRouter.getAddress(), eth1);
      await oftV1.setSendFee(eth1, eth1);
      await siRouter.deposit(user1.address, {
        value: eth1,
      });
      await oftV1.sendToSIRouter(
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
    it("must revert if sender doesn't have reserved STRM tokens", async () => {
      await expect(
        siRouter.sellSI(
          await oftV1.getAddress(),
          [],
          "axlUSDC",
          "Polygon",
          owner.address,
          "0x",
          owner.address,
          eth1,
        ),
      ).to.be.revertedWithCustomError(siRouter, "ZeroSIBalance");
    });
    it("must revert if sender doesn't have enough reserved STRM tokens", async () => {
      await expect(
        siRouter
          .connect(user1)
          .sellSI(
            await oftV1.getAddress(),
            [],
            "axlUSDC",
            "Polygon",
            owner.address,
            "0x",
            owner.address,
            ethers.parseEther("2"),
          ),
      ).to.be.revertedWithCustomError(siRouter, "NotEnoughBalance");
    });
    xit("must revert if approve of STRM tokens failed", async () => {});
    it("must call callBridgeCall correctly", async () => {
      let tx = await siRouter
        .connect(user1)
        .sellSI(
          await oftV1.getAddress(),
          [],
          "axlUSDC",
          "Polygon",
          owner.address,
          "0x",
          owner.address,
          eth1,
        );
      expect(tx)
        .to.be.emit(oftV1, "Approval")
        .withArgs(
          await siRouter.getAddress(),
          await sqdRouter.getAddress(),
          eth1,
        );
      expect(tx)
        .to.be.emit(sqdRouter, "CallBridgeCall")
        .withArgs(await oftV1.getAddress(), eth1, eth1);
    });
    it("must call callBridgeCall correctly with taxes", async () => {
      await siRouter.setSIVault(
        await oftV1.getAddress(),
        await vault.getAddress(),
      );
      let tx = await siRouter
        .connect(user1)
        .sellSI(
          await oftV1.getAddress(),
          [],
          "axlUSDC",
          "Polygon",
          owner.address,
          "0x",
          owner.address,
          eth1,
        );
      expect(await vault.lastSiBalance()).to.be.closeTo(
        ethers.parseEther("0.002"),
        ethers.parseEther("0.000001"),
      );
      expect(await oftV1.balanceOf(await vault.getAddress())).to.be.closeTo(
        ethers.parseEther("0.002"),
        ethers.parseEther("0.000001"),
      );
    });
  });
});
