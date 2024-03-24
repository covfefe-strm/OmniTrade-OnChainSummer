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
let multisigWallet: SignerWithAddress;
let startSnapshot: SnapshotRestorer;
let name = "StreamerInu";
let symbol = "SI";
let shareDecimal = 8;
describe("StreamerInuToken", async () => {
  before(async () => {
    [owner, user1, multisigWallet] = await ethers.getSigners();
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
        multisigWallet.address,
      );
      console.log("getChainId", await si.getChainId());
      expect(await si.balanceOf(multisigWallet.address)).to.be.equal(0);
    });
  });
});
