import { CodelightFactory } from "./../../typechain/CodelightFactory.d";
import { Contract, BigNumber } from "ethers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { beforeEach } from "mocha";
import { any } from "hardhat/internal/core/params/argumentTypes";
import { clearConfigCache } from "prettier";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("Exchange", async function () {
  let signers: SignerWithAddress[];
  let metabaseAdmin: SignerWithAddress;
  let collection_1: SignerWithAddress;
  let collection_2: SignerWithAddress;
  let collection_3: SignerWithAddress;
  let gameStudioAdmin: any;
  let player_1: any;
  let player_2: any;
  let DAO: any;
  let burn: any;
  let revenue: any;

  let DAOFee = 10;
  let burnFee = 20;
  let revenueFee = 10;
  let DAOAdd: any;
  let burnAdd: any;
  let revenueAdd: any;
  let erc721: any;
  let erc20: any;
  let codelightFactory: CodelightFactory;

  before(async function () {
    signers = await ethers.getSigners();

    metabaseAdmin = signers[0];
    collection_1 = signers[1];
    collection_2 = signers[2];
    collection_3 = signers[3];

    /* -------------deploy factory-------------- */

    const CodelightFactoryFactory = await ethers.getContractFactory(
      "CodelightFactory",
      metabaseAdmin
    );

    codelightFactory = await CodelightFactoryFactory.deploy("codelight", "CLN");
    await codelightFactory.deployed();
  });

  it("deploy erc721 contract", async function () {
    console.log("codelightFactory", codelightFactory.address);
    await codelightFactory.deployErc721([
      collection_1.address,
      collection_2.address,
      collection_3.address,
    ]);

    // codelightFactory = codelightFactory.connect(collection_2);

    let erc721Contract = await codelightFactory.getErc721ContractAddress([
      collection_1.address,
      collection_2.address,
      collection_3.address,
    ]);
    console.log(erc721Contract);
  });
});
