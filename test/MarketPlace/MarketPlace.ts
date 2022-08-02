import { Contract, BigNumber } from "ethers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { beforeEach } from "mocha";
import { any } from "hardhat/internal/core/params/argumentTypes";

describe("Exchange", async function () {
  let signers: any;
  let metabaseAdmin: any;
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
  let exchange: any;

  before(async function () {
    signers = await ethers.getSigners();

    /* ----------------admin---------------- */
    metabaseAdmin = signers[0];
    gameStudioAdmin = signers[1];
    /* ---------------player---------------- */
    player_1 = signers[2];
    player_2 = signers[3];

    /* ------------protocol----------------- */
    DAO = signers[4];
    burn = signers[5];
    revenue = signers[6];

    DAOAdd = DAO.address;
    burnAdd = burn.address;
    revenueAdd = revenue.address;
    /* -------------deploy Exchange-------------- */

    const exchangeFactory = await ethers.getContractFactory(
      "Exchange",
      metabaseAdmin
    );

    exchange = await exchangeFactory.deploy(
      [DAOAdd, burnAdd, revenueAdd],
      [DAOFee, burnFee, revenueFee]
    );
    await exchange.deployed();

    /* ------------------deploy Erc20------------- */

    const erc20Factory = await ethers.getContractFactory("RENA");
    erc20 = await erc20Factory.deploy();
    await erc20.deployed();

    /* ----------------deploy ERC721---------------- */

    const erc721Factory = await ethers.getContractFactory(
      "ERC721Mintable",
      gameStudioAdmin
    );
    erc721 = await erc721Factory.deploy("codelight", "CLN");
    await erc721.deployed();
  });

  it("assign 500 erc20 to player 1", async function () {
    await erc20.transfer(player_1.address, String(500e18));
  });

  it("test mint nft", async function () {
    let tx = await erc721.batchMint(
      player_2.address,
      ["abcd", "sdf", "lksldkf"],
      {
        from: gameStudioAdmin.address,
      }
    );
    let uri = await erc721.tokenURI("0x02");
  });

  it("approve erc20", async function () {
    erc20 = await erc20.connect(player_1);
    await erc20.approve(exchange.address, String(10e18));

    let allowance = await erc20.allowance(player_1.address, exchange.address);
  });
  it("approve erc721", async function () {
    erc721 = await erc721.connect(player_2);
    await erc721.approve(exchange.address, String(1));

    let approvedAdd = await erc721.getApproved(String(1));

    expect(exchange.address == approvedAdd).to.be.true;
  });

  it("exchange", async function () {
    const ASSET_TYPE_TYPEHASH = String(await exchange.ASSET_TYPE_TYPEHASH());
    const ASSET_TYPEHASH = String(await exchange.ASSET_TYPEHASH());
    // const ORDER_TYPEHASH = String(await Exchange.ORDER_TYPEHASH());
    const maker = String(player_2.address);
    const taker = String(player_1.address);
    const makerAssetClass = String(await exchange.ERC721_ASSET_CLASS());
    const makerAsset = String(erc721.address);
    const makerAssetID = String(1);
    const makerAskAsset = String(await exchange.ERC20_ASSET_CLASS());
    const makerValue = String(0);
    const makerAskValue = String(10e18);
    const makerAskAssetID = String(0);
    const makerOrderType = String(1);
    const takerAssetClass = String(await exchange.ERC20_ASSET_CLASS());
    const takerAsset = String(erc20.address);
    const takerAssetID = String(0);
    const takerAskAsset = String(await exchange.ERC721_ASSET_CLASS());
    const takerValue = String(10e18);
    const takerAskValue = String(0);
    const takerAskAssetID = String(1);
    const takerOrderType = String(0);

    const salt = String(123);

    const end = String(new Date().getTime() + 1000000);

    let maker_type_typeHash = ethers.utils.solidityKeccak256(
      ["bytes32", "bytes4", "address", "uint"],
      [ASSET_TYPE_TYPEHASH, makerAssetClass, makerAsset, makerAssetID]
    );

    let taker_type_typeHash = ethers.utils.solidityKeccak256(
      ["bytes32", "bytes4", "address", "uint"],
      [ASSET_TYPE_TYPEHASH, takerAssetClass, takerAsset, takerAssetID]
    );

    let maker_asset_type_msgHash = ethers.utils.solidityKeccak256(
      [
        "bytes32",
        "bytes32",
        "bytes4",
        "uint256",
        "uint256",
        "uint256",
        "uint256",
      ],
      [
        ASSET_TYPEHASH,
        String(maker_type_typeHash),
        makerAskAsset,
        makerValue,
        makerOrderType,
        makerAskValue,
        makerAskAssetID,
      ]
    );

    let taker_asset_type_msgHash = ethers.utils.solidityKeccak256(
      [
        "bytes32",
        "bytes32",
        "bytes4",
        "uint256",
        "uint256",
        "uint256",
        "uint256",
      ],
      [
        ASSET_TYPEHASH,
        String(taker_type_typeHash),
        takerAskAsset,
        takerValue,
        takerOrderType,
        takerAskValue,
        takerAskAssetID,
      ]
    );

    let mesTakerArray = ethers.utils.arrayify(taker_asset_type_msgHash);

    let signatureTaker = await player_1.signMessage(mesTakerArray);

    let sigTakerSplit = ethers.utils.splitSignature(signatureTaker);

    let mesMakerArray = ethers.utils.arrayify(maker_asset_type_msgHash);

    let signatureMaker = await player_2.signMessage(mesMakerArray);

    let sigMakerSplit = ethers.utils.splitSignature(signatureMaker);

    const vT = sigTakerSplit.v;
    const rT = sigTakerSplit.r;
    const sT = sigTakerSplit.s;

    const vM = sigMakerSplit.v;
    const rM = sigMakerSplit.r;
    const sM = sigMakerSplit.s;

    const info = String("aaaaaaaaaaaaaaaaaaaaaadfdsf");
    // const info = String("objectid1234512");

    let order = [
      maker,
      [
        [makerAssetClass, makerAsset, makerAssetID],
        makerAskAsset,
        makerValue,
        makerOrderType,
        makerAskValue,
        makerAskAssetID,
        vM,
        rM,
        sM,
        salt,
        end,
      ],
      taker,
      [
        [takerAssetClass, takerAsset, takerAssetID],
        takerAskAsset,
        takerValue,
        takerOrderType,
        takerAskValue,
        takerAskAssetID,
        vT,
        rT,
        sT,
        salt,
        end,
      ],
      info,
    ];

    let authorizeRena = await exchange.setTokenStatus(erc20.address, true);
    /* ---------------------------------------------------------- */

    exchange = await exchange.connect(player_1);

    let method = await exchange.buy(order);
    // console.log(`buy :: gas used : ${method.receipt.gasUsed}`);

    expect((await erc721.ownerOf(String(1))) == taker).to.be.true;
  });
});
