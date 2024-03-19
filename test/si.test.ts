import * as dotenv from "dotenv";
import { ethers, network } from "hardhat";
import { expect } from "chai";
import {
  StreamerInuToken,
  StreamerInuToken__factory,
} from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import {
  takeSnapshot,
  SnapshotRestorer,
} from "@nomicfoundation/hardhat-network-helpers";
let siFactory: StreamerInuToken__factory;
let si: StreamerInuToken;
let owner: SignerWithAddress;
let user1: SignerWithAddress;
let multisignatureWallet: SignerWithAddress;
let startSnapshot: SnapshotRestorer;
let name = "StreamerInu";
let symbol = "SI";
let shareDecimal = 8;
describe("StreamerInuToken", async () => {
  before(async () => {
    [owner, user1, multisignatureWallet] = await ethers.getSigners();
    siFactory = (await ethers.getContractFactory(
      "StreamerInuToken",
    )) as StreamerInuToken__factory;
    startSnapshot = await takeSnapshot();
  });
  afterEach(async () => {
    await startSnapshot.restore();
  });
  describe("initialMinting", async () => {
    it("must not mint token on not Polygon chain", async () => {
      si = await siFactory.deploy(
        name,
        symbol,
        shareDecimal,
        owner.address,
        multisignatureWallet.address,
      );
      console.log("getChainId", await si.getChainId());
      expect(await si.balanceOf(multisignatureWallet.address)).to.be.equal(
        ethers.parseUnits("15", 26),
      );
    });
  });
});
