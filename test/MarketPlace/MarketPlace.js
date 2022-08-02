const chai = require("chai");
const expect = chai.expect;
const exchange = artifacts.require("Exchange");
// let exchange = await ethers.getContractFactory('Exchange');
const erc721 = artifacts.require("Warena721");
const erc20 = artifacts.require("RENA");
const erc1155 = artifacts.require("WarenaERC1155");

// instance
let Exchange;
let ERC721;

let creator;
let DAOAdd;
let burnAdd;
let revenueAdd;

let DAOFee = 10;
let burnFee = 20;
let revenueFee = 10;

contract("Exchange", (accounts) => {
    creator = accounts[0];
    DAOAdd = accounts[1];
    burnAdd = "0x000000000000000000000000000000000000dEaD";
    revenueAdd = accounts[3];

    before(async function () {
        Exchange = await exchange.new(
            [DAOAdd, burnAdd, revenueAdd],
            [DAOFee, burnFee, revenueFee]
        );
        console.log("contract", Exchange.address);

        ERC20 = await erc20.new();
        console.log("contract", ERC20.address);

        ERC721 = await erc721.new();
        console.log("contract", ERC721.address);

        ERC1155 = await erc1155.new();
        console.log("contract", ERC1155.address);
    });

    describe("Test case 1 :: protocol", () => {
        it("1.1 DAO address", async () => {
            expect(String(await Exchange.beneficiaryAddress(0))).equal(
                String(DAOAdd)
            );
        });

        it("1.2 Burn address", async () => {
            expect(String(await Exchange.beneficiaryAddress(1))).equal(
                String(burnAdd)
            );
        });

        it("1.3 Revenue address", async () => {
            expect(String(await Exchange.beneficiaryAddress(2))).equal(
                String(revenueAdd)
            );
        });

        it("1.4 DAO fee", async () => {
            expect(Number(await Exchange.protocolFee(0))).equal(Number(DAOFee));
        });

        it("1.5 Burn fee", async () => {
            expect(Number(await Exchange.protocolFee(1))).equal(
                Number(burnFee)
            );
        });

        it("1.6 Revenue fee", async () => {
            expect(Number(await Exchange.protocolFee(2))).equal(
                Number(revenueFee)
            );
        });

        it("1.7 Pause", async () => {
            expect(String(await Exchange.paused())).equal(String(false));
        });

        it("1.8 set address token receive open box", async () => {
            let setAddress = ERC721.setAddressReceiveTokenOpenBox(accounts[10]);
            console.log("setAddress", JSON.stringify(setAddress));
        });
    });

    describe("Test case 2 :: Mint tokens", () => {
        let accOne = accounts[4]; // Maker
        let accTwo = accounts[5]; // Taker

        it("2.1 mint ERC721 for accOne", async () => {
            let method = await ERC721.safeMint(String(accOne), 1);
            console.log(`safeMint :: gas used : ${method.receipt.gasUsed}`);

            let approve = await ERC721.approve(String(Exchange.address), 1, {
                from: accOne,
            });
            console.log(`approve :: gas used : ${approve.receipt.gasUsed}`);

            expect(Number(await ERC721.totalSupply())).equal(1);
            expect(Number(await ERC721.balanceOf(String(accOne)))).equal(1);
            expect(String(await ERC721.ownerOf(1))).equal(String(accOne));
        });

        it("2.2 mint RENA for accTwo", async () => {
            var _amount = String(100e18);

            var creatorBalance = await ERC20.balanceOf(String(creator)); // accTwo balance
            creatorBalance =
                Number(creatorBalance) / 1e18 - Number(_amount) / 1e18;
            console.log("Creator balance", Number(creatorBalance) / 1e18);

            var accTwoBalance = await ERC20.balanceOf(String(accTwo)); // accTwo balance
            accTwoBalance = Number(accTwoBalance) + Number(_amount);
            console.log("AccTwo Balance", Number(accTwoBalance) / 1e18);
            //transfer
            let method = await ERC20.transfer(String(accTwo), _amount);
            console.log(`transfer :: gas used : ${method.receipt.gasUsed}`);

            let approve = await ERC20.approve(
                String(Exchange.address),
                String(10e18),
                { from: accTwo }
            );
            console.log(`approve :: gas used : ${approve.receipt.gasUsed}`);

            expect(Number(await ERC20.balanceOf(String(creator))) / 1e18).equal(
                creatorBalance
            );
            expect(Number(await ERC20.balanceOf(String(accTwo))) / 1e18).equal(
                accTwoBalance / 1e18
            );
        });

        it("2.3: Mint ERC1155 for accOne", async () => {
            let method = await ERC1155.mint(
                String(accOne),
                1,
                Number(100),
                "0x"
            );
            console.log(`mint :: gas used : ${method.receipt.gasUsed}`);

            let approve = await ERC1155.setApprovalForAll(
                String(Exchange.address),
                true,
                { from: accOne }
            );
            console.log(`approve :: gas used : ${approve.receipt.gasUsed}`);

            expect(
                String(
                    await ERC1155.isApprovedForAll(
                        String(accOne),
                        String(Exchange.address)
                    )
                )
            ).equal(String(true));

            expect(Number(await ERC1155.balanceOf(String(accOne), 1))).equal(
                100
            );
        });
    });

    describe("Test case 3 :: Exchange", () => {
        it("3.1 Buy ERC721 order", async () => {
            const ASSET_TYPE_TYPEHASH = String(
                await Exchange.ASSET_TYPE_TYPEHASH()
            );
            const ASSET_TYPEHASH = String(await Exchange.ASSET_TYPEHASH());
            // const ORDER_TYPEHASH = String(await Exchange.ORDER_TYPEHASH());
            const maker = String(accounts[4]);
            const taker = String(accounts[5]);
            const makerAssetClass = String(await Exchange.ERC721_ASSET_CLASS());
            const makerAsset = String(ERC721.address);
            const makerAssetID = String(1);
            const makerAskAsset = String(await Exchange.ERC20_ASSET_CLASS());
            const makerValue = String(0);
            const makerAskValue = String(10e18);
            const makerAskAssetID = String(0);
            const makerOrderType = String(1);
            const takerAssetClass = String(await Exchange.ERC20_ASSET_CLASS());
            const takerAsset = String(ERC20.address);
            const takerAssetID = String(0);
            const takerAskAsset = String(await Exchange.ERC721_ASSET_CLASS());
            const takerValue = String(10e18);
            const takerAskValue = String(0);
            const takerAskAssetID = String(1);
            const takerOrderType = String(0);

            const salt = String(123);

            const end = String(new Date().getTime() + 1000000);

            let maker_type_typeHash = web3.utils.soliditySha3(
                ASSET_TYPE_TYPEHASH,
                makerAssetClass,
                makerAsset,
                makerAssetID
            );

            let taker_type_typeHash = web3.utils.soliditySha3(
                ASSET_TYPE_TYPEHASH,
                takerAssetClass,
                takerAsset,
                takerAssetID
            );

            let maker_asset_type_msgHash = web3.utils.soliditySha3(
                ASSET_TYPEHASH,
                String(maker_type_typeHash),
                makerAskAsset,
                makerValue,
                makerOrderType,
                makerAskValue,
                makerAskAssetID
            );

            let taker_asset_type_msgHash = web3.utils.soliditySha3(
                ASSET_TYPEHASH,
                String(taker_type_typeHash),
                takerAskAsset,
                takerValue,
                takerOrderType,
                takerAskValue,
                takerAskAssetID
            );

            //let order_msg_hash = web3.utils.soliditySha3(ORDER_TYPEHASH,String(maker),String(maker_asset_type_msgHash),String(taker),String(taker_asset_type_msgHash),salt,end);

            let signatureTaker = web3.eth.accounts.sign(
                String(taker_asset_type_msgHash),
                "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba"
            );

            let signatureMaker = web3.eth.accounts.sign(
                String(maker_asset_type_msgHash),
                "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a"
            );

            const vT = Number(signatureTaker.v);
            const rT = String(signatureTaker.r);
            const sT = String(signatureTaker.s);

            const vM = Number(signatureMaker.v);
            const rM = String(signatureMaker.r);
            const sM = String(signatureMaker.s);

            const info = String("objectid1234512");

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

            let authorizeRena = await Exchange.setTokenStatus(
                ERC20.address,
                true
            );
            console.log(
                `authorizeRena :: gas used : ${authorizeRena.receipt.gasUsed}`
            );
            expect(String(await Exchange.isAllowed(ERC20.address))).equal(
                String(true)
            );

            expect(
                String(await ERC20.allowance(accounts[5], Exchange.address))
            ).equal(takerValue);
            expect(String(await ERC20.balanceOf(accounts[5]))).equal(
                String(100e18)
            );
            expect(String(await ERC20.balanceOf(accounts[4]))).equal(String(0));
            expect(String(await ERC721.ownerOf(1))).equal(maker);
            expect(String(await ERC721.getApproved(1))).equal(
                String(Exchange.address)
            );

            let method = await Exchange.buy(order, { from: accounts[5] });
            console.log(`buy :: gas used : ${method.receipt.gasUsed}`);

            expect(
                String(await ERC20.allowance(accounts[5], ERC20.address))
            ).equal(String(0));
            expect(String(await ERC20.balanceOf(accounts[5]))).equal(
                String(90e18)
            );
            expect(String(await ERC20.balanceOf(accounts[4]))).equal(
                String(9.84e18)
            );
            expect(String(await ERC20.balanceOf(DAOAdd))).equal(
                String((takerValue * DAOFee * 4) / 10000)
            );
            expect(String(await ERC20.balanceOf(burnAdd))).equal(
                String((takerValue * burnFee * 4) / 10000)
            );
            expect(String(await ERC20.balanceOf(revenueAdd))).equal(
                String((takerValue * revenueFee * 4) / 10000)
            );
            expect(String(await ERC721.ownerOf(1))).equal(taker);
        });

        it("3.2 Sell ERC721 order", async () => {
            const ASSET_TYPE_TYPEHASH = String(
                await Exchange.ASSET_TYPE_TYPEHASH()
            );

            const ASSET_TYPEHASH = String(await Exchange.ASSET_TYPEHASH());
            const ORDER_TYPEHASH = String(await Exchange.ORDER_TYPEHASH());
            const maker = String(accounts[5]);
            const taker = String(accounts[4]);
            const makerAssetClass = String(await Exchange.ERC721_ASSET_CLASS());
            const makerAsset = String(ERC721.address);
            const makerAssetID = String(1);
            const makerAskAsset = String(await Exchange.ERC20_ASSET_CLASS());
            const makerValue = String(0);
            const makerAskValue = String(5e18);
            const makerAskAssetID = String(0);
            const makerOrderType = String(1);
            const takerAssetClass = String(await Exchange.ERC20_ASSET_CLASS());
            const takerAsset = String(ERC20.address);
            const takerAssetID = String(0);
            const takerAskAsset = String(await Exchange.ERC721_ASSET_CLASS());
            const takerValue = String(5e18);
            const takerAskValue = String(0);
            const takerAskAssetID = String(1);
            const takerOrderType = String(0);
            const salt = String(123);
            const end = String(new Date().getTime() + 1000000);
            const info = String("objectid1234512");

            let maker_type_typeHash = web3.utils.soliditySha3(
                ASSET_TYPE_TYPEHASH,
                makerAssetClass,
                makerAsset,
                makerAssetID
            );

            let taker_type_typeHash = web3.utils.soliditySha3(
                ASSET_TYPE_TYPEHASH,
                takerAssetClass,
                takerAsset,
                takerAssetID
            );

            let maker_asset_type_msgHash = web3.utils.soliditySha3(
                ASSET_TYPEHASH,
                String(maker_type_typeHash),
                makerAskAsset,
                makerValue,
                makerOrderType,
                makerAskValue,
                makerAskAssetID
            );

            let taker_asset_type_msgHash = web3.utils.soliditySha3(
                ASSET_TYPEHASH,
                String(taker_type_typeHash),
                takerAskAsset,
                takerValue,
                takerOrderType,
                takerAskValue,
                takerAskAssetID
            );

            //let order_msg_hash = web3.utils.soliditySha3(ORDER_TYPEHASH,String(maker),String(maker_asset_type_msgHash),String(taker),String(taker_asset_type_msgHash),salt,end);

            let signatureMaker = web3.eth.accounts.sign(
                String(maker_asset_type_msgHash),
                "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba"
            );
            let signatureTaker = web3.eth.accounts.sign(
                String(taker_asset_type_msgHash),
                "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a"
            );

            const vM = Number(signatureMaker.v);
            const rM = String(signatureMaker.r);
            const sM = String(signatureMaker.s);

            const vT = Number(signatureTaker.v);
            const rT = String(signatureTaker.r);
            const sT = String(signatureTaker.s);

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

            let approveERC721 = await ERC721.approve(
                String(Exchange.address),
                1,
                { from: maker }
            );
            console.log(
                `approveERC721 :: gas used : ${approveERC721.receipt.gasUsed}`
            );

            let approve = await ERC20.approve(
                String(Exchange.address),
                String(takerValue),
                { from: taker }
            );
            console.log(`approve :: gas used : ${approve.receipt.gasUsed}`);

            expect(
                String(await ERC20.allowance(accounts[4], Exchange.address))
            ).equal(takerValue);
            expect(String(await ERC20.balanceOf(accounts[4]))).equal(
                String(9.84e18)
            );
            expect(String(await ERC20.balanceOf(accounts[5]))).equal(
                String(90e18)
            );
            expect(String(await ERC721.ownerOf(1))).equal(maker);
            expect(String(await ERC721.getApproved(1))).equal(
                String(Exchange.address)
            );

            let DaoBal = Number(await ERC20.balanceOf(DAOAdd));
            let burnBal = Number(await ERC20.balanceOf(burnAdd));
            let revBal = Number(await ERC20.balanceOf(revenueAdd));
            //Exchange.connect(signature);
            let method = await Exchange.sell(order, { from: accounts[5] });
            console.log(`sell :: gas used : ${method.receipt.gasUsed}`);

            expect(
                String(await ERC20.allowance(accounts[4], ERC20.address))
            ).equal(String(0));
            expect(String(await ERC20.balanceOf(accounts[4]))).equal(
                String(4.84e18)
            );
            expect(String(await ERC20.balanceOf(accounts[5]))).equal(
                String(94.92e18)
            );
            expect(String(await ERC20.balanceOf(DAOAdd))).equal(
                String(DaoBal + Number((takerValue * DAOFee * 4) / 10000))
            );
            expect(String(await ERC20.balanceOf(burnAdd))).equal(
                String(burnBal + Number((takerValue * burnFee * 4) / 10000))
            );
            expect(String(await ERC20.balanceOf(revenueAdd))).equal(
                String(revBal + Number((takerValue * revenueFee * 4) / 10000))
            );
            expect(String(await ERC721.ownerOf(1))).equal(taker);
        });

        it("3.3: Buy ERC1155 order", async () => {
            const ASSET_TYPE_TYPEHASH = String(
                await Exchange.ASSET_TYPE_TYPEHASH()
            );
            const ASSET_TYPEHASH = String(await Exchange.ASSET_TYPEHASH());
            // const ORDER_TYPEHASH = String(await Exchange.ORDER_TYPEHASH());
            const maker = String(accounts[4]);
            const taker = String(accounts[5]);
            const makerAssetClass = String(
                await Exchange.ERC1155_ASSET_CLASS()
            );
            const makerAsset = String(ERC1155.address);
            const makerAssetID = String(1);
            const makerAskAsset = String(await Exchange.ERC20_ASSET_CLASS());
            const makerValue = String(10);
            const makerAskValue = String(10e18);
            const makerAskAssetID = String(0);
            const makerOrderType = String(1);

            const takerAssetClass = String(await Exchange.ERC20_ASSET_CLASS());
            const takerAsset = String(ERC20.address);
            const takerAssetID = String(0);
            const takerAskAsset = String(await Exchange.ERC1155_ASSET_CLASS());
            const takerValue = String(10e18);
            const takerAskValue = String(10);
            const takerAskAssetID = String(1);
            const takerOrderType = String(0);
            const salt = String(123);

            const end = String(new Date().getTime() + 1000000);

            let DaoBal = Number(await ERC20.balanceOf(DAOAdd));
            let burnBal = Number(await ERC20.balanceOf(burnAdd));
            let revBal = Number(await ERC20.balanceOf(revenueAdd));
            let maker_type_typeHash = web3.utils.soliditySha3(
                ASSET_TYPE_TYPEHASH,
                makerAssetClass,
                makerAsset,
                makerAssetID
            );

            console.log("maker_type_typeHash", maker_type_typeHash);

            let taker_type_typeHash = web3.utils.soliditySha3(
                ASSET_TYPE_TYPEHASH,
                takerAssetClass,
                takerAsset,
                takerAssetID
            );

            let maker_asset_type_msgHash = web3.utils.soliditySha3(
                ASSET_TYPEHASH,
                String(maker_type_typeHash),
                makerAskAsset,
                makerValue,
                makerOrderType,
                makerAskValue,
                makerAskAssetID
            );

            let taker_asset_type_msgHash = web3.utils.soliditySha3(
                ASSET_TYPEHASH,
                String(taker_type_typeHash),
                takerAskAsset,
                takerValue,
                takerOrderType,
                takerAskValue,
                takerAskAssetID
            );

            //let order_msg_hash = web3.utils.soliditySha3(ORDER_TYPEHASH,String(maker),String(maker_asset_type_msgHash),String(taker),String(taker_asset_type_msgHash),salt,end);

            let signatureTaker = web3.eth.accounts.sign(
                String(taker_asset_type_msgHash),
                "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba"
            );

            let signatureMaker = web3.eth.accounts.sign(
                String(maker_asset_type_msgHash),
                "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a"
            );

            const vT = Number(signatureTaker.v);
            const rT = String(signatureTaker.r);
            const sT = String(signatureTaker.s);

            const vM = Number(signatureMaker.v);
            const rM = String(signatureMaker.r);
            const sM = String(signatureMaker.s);

            const info = String("objectid1234512");

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
            let approve = await ERC20.approve(
                String(Exchange.address),
                String(10e18),
                { from: taker }
            );
            console.log(`approve :: gas used : ${approve.receipt.gasUsed}`);

            let authorizeRena = await Exchange.setTokenStatus(
                ERC20.address,
                true
            );
            console.log(
                `authorizeRena :: gas used : ${authorizeRena.receipt.gasUsed}`
            );
            expect(String(await Exchange.isAllowed(ERC20.address))).equal(
                String(true)
            );

            expect(
                String(await ERC20.allowance(accounts[5], Exchange.address))
            ).equal(takerValue);
            expect(String(await ERC20.balanceOf(accounts[5]))).equal(
                String(94.92e18)
            );
            expect(String(await ERC20.balanceOf(accounts[4]))).equal(
                String(4.84e18)
            );
            expect(String(await ERC1155.balanceOf(accounts[4], 1))).equal(
                String(100)
            );

            let method = await Exchange.buy(order, { from: accounts[5] });
            console.log(`buy :: gas used : ${method.receipt.gasUsed}`);

            expect(
                String(await ERC20.allowance(accounts[5], ERC20.address))
            ).equal(String(0));
            expect(String(await ERC20.balanceOf(accounts[5]))).equal(
                String(84.92e18)
            );
            expect(String(await ERC20.balanceOf(accounts[4]))).equal(
                String(14.68e18)
            );
            expect(String(await ERC20.balanceOf(DAOAdd))).equal(
                String(DaoBal + Number((takerValue * DAOFee * 4) / 10000))
            );
            expect(String(await ERC20.balanceOf(burnAdd))).equal(
                String(burnBal + Number((takerValue * burnFee * 4) / 10000))
            );
            expect(String(await ERC20.balanceOf(revenueAdd))).equal(
                String(revBal + Number((takerValue * revenueFee * 4) / 10000))
            );
            expect(Number(await ERC1155.balanceOf(accounts[4], 1))).equal(90);
        });

        it("3.4: Sell ERC1155 order", async () => {
            const ASSET_TYPE_TYPEHASH = String(
                await Exchange.ASSET_TYPE_TYPEHASH()
            );
            const ASSET_TYPEHASH = String(await Exchange.ASSET_TYPEHASH());
            // const ORDER_TYPEHASH = String(await Exchange.ORDER_TYPEHASH());
            console.log("ASSET_TYPE_TYPEHASH", ASSET_TYPE_TYPEHASH);
            console.log("ASSET_TYPEHASH", ASSET_TYPEHASH);

            const maker = String(accounts[5]);
            console.log(
                "Maker balance",
                Number(await ERC20.balanceOf(String(maker))) / 1e18
            );
            const taker = String(accounts[4]);
            console.log(
                "Taker balance",
                Number(await ERC20.balanceOf(String(taker))) / 1e18
            );
            const makerAssetClass = String(
                await Exchange.ERC1155_ASSET_CLASS()
            );
            const makerAsset = String(ERC1155.address);
            const makerAssetID = String(1);
            const makerAskAsset = String(await Exchange.ERC20_ASSET_CLASS());
            const makerValue = String(5);
            const makerAskValue = String(5e18);
            const makerAskAssetID = String(0);
            const makerOrderType = String(1);

            const takerAssetClass = String(await Exchange.ERC20_ASSET_CLASS());
            const takerAsset = String(ERC20.address);
            const takerAssetID = String(0);
            const takerAskAsset = String(await Exchange.ERC1155_ASSET_CLASS());
            const takerValue = String(5e18);
            const takerAskValue = String(5);
            const takerAskAssetID = String(1);
            const takerOrderType = String(0);
            const salt = String(123);

            const end = String(new Date().getTime() + 1000000);

            let DaoBal = Number(await ERC20.balanceOf(DAOAdd));
            let burnBal = Number(await ERC20.balanceOf(burnAdd));
            let revBal = Number(await ERC20.balanceOf(revenueAdd));
            let maker_type_typeHash = web3.utils.soliditySha3(
                ASSET_TYPE_TYPEHASH,
                makerAssetClass,
                makerAsset,
                makerAssetID
            );

            console.log("maker_type_typeHash", maker_type_typeHash);

            let taker_type_typeHash = web3.utils.soliditySha3(
                ASSET_TYPE_TYPEHASH,
                takerAssetClass,
                takerAsset,
                takerAssetID
            );

            let maker_asset_type_msgHash = web3.utils.soliditySha3(
                ASSET_TYPEHASH,
                String(maker_type_typeHash),
                makerAskAsset,
                makerValue,
                makerOrderType,
                makerAskValue,
                makerAskAssetID
            );

            let taker_asset_type_msgHash = web3.utils.soliditySha3(
                ASSET_TYPEHASH,
                String(taker_type_typeHash),
                takerAskAsset,
                takerValue,
                takerOrderType,
                takerAskValue,
                takerAskAssetID
            );

            //let order_msg_hash = web3.utils.soliditySha3(ORDER_TYPEHASH,String(maker),String(maker_asset_type_msgHash),String(taker),String(taker_asset_type_msgHash),salt,end);

            let signatureTaker = web3.eth.accounts.sign(
                String(taker_asset_type_msgHash),
                "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a"
            );

            let signatureMaker = web3.eth.accounts.sign(
                String(maker_asset_type_msgHash),
                "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba"
            );

            const vT = Number(signatureTaker.v);
            const rT = String(signatureTaker.r);
            const sT = String(signatureTaker.s);

            const vM = Number(signatureMaker.v);
            const rM = String(signatureMaker.r);
            const sM = String(signatureMaker.s);

            const info = String("objectid1234512");

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
            let approveERC1155 = await ERC1155.setApprovalForAll(
                String(Exchange.address),
                true,
                { from: maker }
            );
            console.log(
                `approveERC1155 :: gas used : ${approveERC1155.receipt.gasUsed}`
            );
            let approveERC20 = await ERC20.approve(
                String(Exchange.address),
                String(takerValue),
                { from: taker }
            );
            console.log(
                `approveERC20 :: gas used : ${approveERC20.receipt.gasUsed}`
            );
            let authorizeRena = await Exchange.setTokenStatus(
                ERC20.address,
                true
            );
            console.log(
                `authorizeRena :: gas used : ${authorizeRena.receipt.gasUsed}`
            );
            expect(String(await Exchange.isAllowed(ERC20.address))).equal(
                String(true)
            );

            expect(
                String(await ERC20.allowance(accounts[4], Exchange.address))
            ).equal(takerValue);
            expect(String(await ERC20.balanceOf(accounts[4]))).equal(
                String(14.68e18)
            );
            expect(String(await ERC20.balanceOf(accounts[5]))).equal(
                String(84.92e18)
            );
            expect(String(await ERC1155.balanceOf(accounts[4], 1))).equal(
                String(90)
            );
            expect(String(await ERC1155.balanceOf(accounts[5], 1))).equal(
                String(10)
            );
            let method = await Exchange.sell(order, { from: accounts[5] });
            console.log(`buy :: gas used : ${method.receipt.gasUsed}`);

            expect(
                String(await ERC20.allowance(accounts[4], ERC20.address))
            ).equal(String(0));
            expect(String(await ERC20.balanceOf(accounts[5]))).equal(
                String(89.84e18)
            );
            expect(String(await ERC20.balanceOf(accounts[4]))).equal(
                String(9.68e18)
            );
            expect(String(await ERC20.balanceOf(DAOAdd))).equal(
                String(DaoBal + Number((takerValue * DAOFee * 4) / 10000))
            );
            expect(String(await ERC20.balanceOf(burnAdd))).equal(
                String(burnBal + Number((takerValue * burnFee * 4) / 10000))
            );
            expect(String(await ERC20.balanceOf(revenueAdd))).equal(
                String(revBal + Number((takerValue * revenueFee * 4) / 10000))
            );
            expect(Number(await ERC1155.balanceOf(accounts[4], 1))).equal(95);
            expect(Number(await ERC1155.balanceOf(accounts[5], 1))).equal(5);
        });
    });

    describe("Test case 4: Failure case when when execute buy", () => {
        it("4.1: Failure test: Maker bid asset is not taker ask asset", async () => {
            const ASSET_TYPE_TYPEHASH = String(
                await Exchange.ASSET_TYPE_TYPEHASH()
            );
            const ASSET_TYPEHASH = String(await Exchange.ASSET_TYPEHASH());
            // const ORDER_TYPEHASH = String(await Exchange.ORDER_TYPEHASH());
            const maker = String(accounts[4]);
            console.log(
                "Maker balance",
                Number(await ERC20.balanceOf(String(accounts[4]))) / 1e18
            );
            const taker = String(accounts[5]);
            console.log(
                "Taker balance",
                Number(await ERC20.balanceOf(String(accounts[5]))) / 1e18
            );
            const makerAssetClass = String(await Exchange.ERC721_ASSET_CLASS());
            const makerAsset = String(ERC721.address);
            const makerAssetID = String(1);
            const makerAskAsset = String(await Exchange.ERC20_ASSET_CLASS());
            const makerValue = String(10e18);
            const makerAskValue = String(10e18);
            const makerAskAssetID = String(0);
            const makerOrderType = String(1);

            const takerAssetClass = String(
                await Exchange.ERC1155_ASSET_CLASS()
            );
            const takerAsset = String(ERC20.address);
            const takerAssetID = String(0);
            const takerAskAsset = String(await Exchange.ERC721_ASSET_CLASS());
            const takerValue = String(10e18);
            const takerAskValue = String(0);
            const takerAskAssetID = String(1);
            const takerOrderType = String(0);

            const salt = String(123);

            const end = String(new Date().getTime() + 1000000);

            let maker_type_typeHash = web3.utils.soliditySha3(
                ASSET_TYPE_TYPEHASH,
                makerAssetClass,
                makerAsset,
                makerAssetID
            );

            console.log("maker_type_typeHash", maker_type_typeHash);

            let taker_type_typeHash = web3.utils.soliditySha3(
                ASSET_TYPE_TYPEHASH,
                takerAssetClass,
                takerAsset,
                takerAssetID
            );

            let maker_asset_type_msgHash = web3.utils.soliditySha3(
                ASSET_TYPEHASH,
                String(maker_type_typeHash),
                makerAskAsset,
                makerValue,
                makerOrderType,
                makerAskValue,
                makerAskAssetID
            );

            let taker_asset_type_msgHash = web3.utils.soliditySha3(
                ASSET_TYPEHASH,
                String(taker_type_typeHash),
                takerAskAsset,
                takerValue,
                takerOrderType,
                takerAskValue,
                takerAskAssetID
            );

            //let order_msg_hash = web3.utils.soliditySha3(ORDER_TYPEHASH,String(maker),String(maker_asset_type_msgHash),String(taker),String(taker_asset_type_msgHash),salt,end);

            let signatureTaker = web3.eth.accounts.sign(
                String(taker_asset_type_msgHash),
                "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba"
            );

            let signatureMaker = web3.eth.accounts.sign(
                String(maker_asset_type_msgHash),
                "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a"
            );

            const vT = Number(signatureTaker.v);
            const rT = String(signatureTaker.r);
            const sT = String(signatureTaker.s);

            const vM = Number(signatureMaker.v);
            const rM = String(signatureMaker.r);
            const sM = String(signatureMaker.s);

            const info = String("objectid1234512");

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

            let authorizeRena = await Exchange.setTokenStatus(
                ERC20.address,
                true
            );
            console.log(
                `authorizeRena :: gas used : ${authorizeRena.receipt.gasUsed}`
            );

            let method = await Exchange.buy(order, { from: accounts[5] });
            console.log(`buy :: gas used : ${method.receipt.gasUsed}`);
        });
        it("4.2: Failure test: Taker bid asset is not maker ask asset", async () => {
            const ASSET_TYPE_TYPEHASH = String(
                await Exchange.ASSET_TYPE_TYPEHASH()
            );
            const ASSET_TYPEHASH = String(await Exchange.ASSET_TYPEHASH());
            // const ORDER_TYPEHASH = String(await Exchange.ORDER_TYPEHASH());
            const maker = String(accounts[4]);
            console.log(
                "Maker balance",
                Number(await ERC20.balanceOf(String(accounts[4]))) / 1e18
            );
            const taker = String(accounts[5]);
            console.log(
                "Taker balance",
                Number(await ERC20.balanceOf(String(accounts[5]))) / 1e18
            );
            const makerAssetClass = String(await Exchange.ERC721_ASSET_CLASS());
            const makerAsset = String(ERC721.address);
            const makerAssetID = String(1);
            const makerAskAsset = String(await Exchange.ERC20_ASSET_CLASS());
            const makerValue = String(10e18);
            const makerAskValue = String(10e18);
            const makerAskAssetID = String(0);
            const makerOrderType = String(1);

            const takerAssetClass = String(await Exchange.ERC20_ASSET_CLASS());
            const takerAsset = String(ERC20.address);
            const takerAssetID = String(1);
            const takerAskAsset = String(await Exchange.ERC1155_ASSET_CLASS());
            const takerValue = String(10e18);
            const takerAskValue = String(0);
            const takerAskAssetID = String(1);
            const takerOrderType = String(0);

            const salt = String(123);

            const end = String(new Date().getTime() + 1000000);

            let maker_type_typeHash = web3.utils.soliditySha3(
                ASSET_TYPE_TYPEHASH,
                makerAssetClass,
                makerAsset,
                makerAssetID
            );

            console.log("maker_type_typeHash", maker_type_typeHash);

            let taker_type_typeHash = web3.utils.soliditySha3(
                ASSET_TYPE_TYPEHASH,
                takerAssetClass,
                takerAsset,
                takerAssetID
            );

            let maker_asset_type_msgHash = web3.utils.soliditySha3(
                ASSET_TYPEHASH,
                String(maker_type_typeHash),
                makerAskAsset,
                makerValue,
                makerOrderType,
                makerAskValue,
                makerAskAssetID
            );

            let taker_asset_type_msgHash = web3.utils.soliditySha3(
                ASSET_TYPEHASH,
                String(taker_type_typeHash),
                takerAskAsset,
                takerValue,
                takerOrderType,
                takerAskValue,
                takerAskAssetID
            );

            //let order_msg_hash = web3.utils.soliditySha3(ORDER_TYPEHASH,String(maker),String(maker_asset_type_msgHash),String(taker),String(taker_asset_type_msgHash),salt,end);

            let signatureTaker = web3.eth.accounts.sign(
                String(taker_asset_type_msgHash),
                "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba"
            );

            let signatureMaker = web3.eth.accounts.sign(
                String(maker_asset_type_msgHash),
                "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a"
            );

            const vT = Number(signatureTaker.v);
            const rT = String(signatureTaker.r);
            const sT = String(signatureTaker.s);

            const vM = Number(signatureMaker.v);
            const rM = String(signatureMaker.r);
            const sM = String(signatureMaker.s);

            const info = String("objectid1234512");

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

            let authorizeRena = await Exchange.setTokenStatus(
                ERC20.address,
                true
            );
            console.log(
                `authorizeRena :: gas used : ${authorizeRena.receipt.gasUsed}`
            );

            let method = await Exchange.buy(order, { from: accounts[5] });
            console.log(`buy :: gas used : ${method.receipt.gasUsed}`);
        });

        it("4.3: Failure case: Tx signer must be a taker", async () => {
            const ASSET_TYPE_TYPEHASH = String(
                await Exchange.ASSET_TYPE_TYPEHASH()
            );
            const ASSET_TYPEHASH = String(await Exchange.ASSET_TYPEHASH());
            // const ORDER_TYPEHASH = String(await Exchange.ORDER_TYPEHASH());
            const maker = String(accounts[4]);
            console.log(
                "Maker balance",
                Number(await ERC20.balanceOf(String(accounts[4]))) / 1e18
            );
            const taker = String(accounts[5]);
            console.log(
                "Taker balance",
                Number(await ERC20.balanceOf(String(accounts[5]))) / 1e18
            );
            const makerAssetClass = String(await Exchange.ERC721_ASSET_CLASS());
            const makerAsset = String(ERC721.address);
            const makerAssetID = String(1);
            const makerAskAsset = String(await Exchange.ERC20_ASSET_CLASS());
            const makerValue = String(10e18);
            const makerAskValue = String(10e18);
            const makerAskAssetID = String(0);
            const makerOrderType = String(1);

            const takerAssetClass = String(await Exchange.ERC20_ASSET_CLASS());
            const takerAsset = String(ERC20.address);
            const takerAssetID = String(1);
            const takerAskAsset = String(await Exchange.ERC721_ASSET_CLASS());
            const takerValue = String(10e18);
            const takerAskValue = String(0);
            const takerAskAssetID = String(1);
            const takerOrderType = String(0);

            const salt = String(123);

            const end = String(new Date().getTime() + 1000000);

            let maker_type_typeHash = web3.utils.soliditySha3(
                ASSET_TYPE_TYPEHASH,
                makerAssetClass,
                makerAsset,
                makerAssetID
            );

            console.log("maker_type_typeHash", maker_type_typeHash);

            let taker_type_typeHash = web3.utils.soliditySha3(
                ASSET_TYPE_TYPEHASH,
                takerAssetClass,
                takerAsset,
                takerAssetID
            );

            let maker_asset_type_msgHash = web3.utils.soliditySha3(
                ASSET_TYPEHASH,
                String(maker_type_typeHash),
                makerAskAsset,
                makerValue,
                makerOrderType,
                makerAskValue,
                makerAskAssetID
            );

            let taker_asset_type_msgHash = web3.utils.soliditySha3(
                ASSET_TYPEHASH,
                String(taker_type_typeHash),
                takerAskAsset,
                takerValue,
                takerOrderType,
                takerAskValue,
                takerAskAssetID
            );

            //let order_msg_hash = web3.utils.soliditySha3(ORDER_TYPEHASH,String(maker),String(maker_asset_type_msgHash),String(taker),String(taker_asset_type_msgHash),salt,end);

            let signatureTaker = web3.eth.accounts.sign(
                String(taker_asset_type_msgHash),
                "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba"
            );

            let signatureMaker = web3.eth.accounts.sign(
                String(maker_asset_type_msgHash),
                "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a"
            );

            const vT = Number(signatureTaker.v);
            const rT = String(signatureTaker.r);
            const sT = String(signatureTaker.s);

            const vM = Number(signatureMaker.v);
            const rM = String(signatureMaker.r);
            const sM = String(signatureMaker.s);

            const info = String("objectid1234512");

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

            let authorizeRena = await Exchange.setTokenStatus(
                ERC20.address,
                true
            );
            console.log(
                `authorizeRena :: gas used : ${authorizeRena.receipt.gasUsed}`
            );

            let method = await Exchange.buy(order, { from: accounts[4] });
            console.log(`buy :: gas used : ${method.receipt.gasUsed}`);
        });

        it("4.4: Failure case: In correct signature, validation failed signer is not a taker", async () => {
            const ASSET_TYPE_TYPEHASH = String(
                await Exchange.ASSET_TYPE_TYPEHASH()
            );
            const ASSET_TYPEHASH = String(await Exchange.ASSET_TYPEHASH());
            // const ORDER_TYPEHASH = String(await Exchange.ORDER_TYPEHASH());
            const maker = String(accounts[4]);
            console.log(
                "Maker balance",
                Number(await ERC20.balanceOf(String(accounts[4]))) / 1e18
            );
            const taker = String(accounts[5]);
            console.log(
                "Taker balance",
                Number(await ERC20.balanceOf(String(accounts[5]))) / 1e18
            );
            const makerAssetClass = String(await Exchange.ERC721_ASSET_CLASS());
            const makerAsset = String(ERC721.address);
            const makerAssetID = String(1);
            const makerAskAsset = String(await Exchange.ERC20_ASSET_CLASS());
            const makerValue = String(0);
            const makerAskValue = String(10e18);
            const makerAskAssetID = String(0);
            const makerOrderType = String(1);

            const takerAssetClass = String(await Exchange.ERC20_ASSET_CLASS());
            const takerAsset = String(ERC20.address);
            const takerAssetID = String(1);
            const takerAskAsset = String(await Exchange.ERC721_ASSET_CLASS());
            const takerValue = String(10e18);
            const takerAskValue = String(0);
            const takerAskAssetID = String(1);
            const takerOrderType = String(0);

            const salt = String(123);

            const end = String(new Date().getTime() + 1000000);

            let maker_type_typeHash = web3.utils.soliditySha3(
                ASSET_TYPE_TYPEHASH,
                makerAssetClass,
                makerAsset,
                makerAssetID
            );

            let taker_type_typeHash = web3.utils.soliditySha3(
                ASSET_TYPE_TYPEHASH,
                takerAssetClass,
                takerAsset,
                takerAssetID
            );

            let maker_asset_type_msgHash = web3.utils.soliditySha3(
                ASSET_TYPEHASH,
                String(maker_type_typeHash),
                makerAskAsset,
                makerValue,
                makerOrderType,
                makerAskValue,
                makerAskAssetID
            );

            let taker_asset_type_msgHash = web3.utils.soliditySha3(
                ASSET_TYPEHASH,
                String(taker_type_typeHash),
                takerAskAsset,
                takerValue,
                takerOrderType,
                takerAskValue,
                takerAskAssetID
            );

            //let order_msg_hash = web3.utils.soliditySha3(ORDER_TYPEHASH,String(maker),String(maker_asset_type_msgHash),String(taker),String(taker_asset_type_msgHash),salt,end);

            let signatureTaker = web3.eth.accounts.sign(
                String(taker_asset_type_msgHash),
                "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba"
            );

            let signatureMaker = web3.eth.accounts.sign(
                String(maker_asset_type_msgHash),
                "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a"
            );

            const vT = Number(29);
            const rT = String(signatureTaker.r);
            const sT = String(signatureTaker.s);

            const vM = Number(signatureMaker.v);
            const rM = String(signatureMaker.r);
            const sM = String(signatureMaker.s);

            const info = String("objectid1234512");

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

            let authorizeRena = await Exchange.setTokenStatus(
                ERC20.address,
                true
            );
            console.log(
                `authorizeRena :: gas used : ${authorizeRena.receipt.gasUsed}`
            );

            let method = await Exchange.buy(order, { from: accounts[5] });
            console.log(`buy :: gas used : ${method.receipt.gasUsed}`);
        });

        it("4.5: Failure case: In correct token ID", async () => {
            const ASSET_TYPE_TYPEHASH = String(
                await Exchange.ASSET_TYPE_TYPEHASH()
            );
            const ASSET_TYPEHASH = String(await Exchange.ASSET_TYPEHASH());
            // const ORDER_TYPEHASH = String(await Exchange.ORDER_TYPEHASH());
            const maker = String(accounts[4]);
            const taker = String(accounts[5]);
            const makerAssetClass = String(await Exchange.ERC721_ASSET_CLASS());
            const makerAsset = String(ERC721.address);
            const makerAssetID = String(1);
            const makerAskAsset = String(await Exchange.ERC20_ASSET_CLASS());
            const makerValue = String(0);
            const makerAskValue = String(10e18);
            const makerAskAssetID = String(0);
            const makerOrderType = String(1);

            const takerAssetClass = String(await Exchange.ERC20_ASSET_CLASS());
            const takerAsset = String(ERC20.address);
            const takerAssetID = String(1);
            const takerAskAsset = String(await Exchange.ERC721_ASSET_CLASS());
            const takerValue = String(10e18);
            const takerAskValue = String(0);
            const takerAskAssetID = String(1);
            const takerOrderType = String(0);

            const salt = String(123);

            const end = String(new Date().getTime() + 1000000);

            let maker_type_typeHash = web3.utils.soliditySha3(
                ASSET_TYPE_TYPEHASH,
                makerAssetClass,
                makerAsset,
                makerAssetID
            );

            let taker_type_typeHash = web3.utils.soliditySha3(
                ASSET_TYPE_TYPEHASH,
                takerAssetClass,
                takerAsset,
                takerAssetID
            );

            let maker_asset_type_msgHash = web3.utils.soliditySha3(
                ASSET_TYPEHASH,
                String(maker_type_typeHash),
                makerAskAsset,
                makerValue,
                makerOrderType,
                makerAskValue,
                makerAskAssetID
            );

            let taker_asset_type_msgHash = web3.utils.soliditySha3(
                ASSET_TYPEHASH,
                String(taker_type_typeHash),
                takerAskAsset,
                takerValue,
                takerOrderType,
                takerAskValue,
                takerAskAssetID
            );

            //let order_msg_hash = web3.utils.soliditySha3(ORDER_TYPEHASH,String(maker),String(maker_asset_type_msgHash),String(taker),String(taker_asset_type_msgHash),salt,end);

            let signatureTaker = web3.eth.accounts.sign(
                String(taker_asset_type_msgHash),
                "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba"
            );

            let signatureMaker = web3.eth.accounts.sign(
                String(maker_asset_type_msgHash),
                "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a"
            );

            const vT = Number(signatureTaker.v);
            const rT = String(signatureTaker.r);
            const sT = String(signatureTaker.s);

            const vM = Number(signatureMaker.v);
            const rM = String(signatureMaker.r);
            const sM = String(signatureMaker.s);

            const info = String("objectid1234512");

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

            let authorizeRena = await Exchange.setTokenStatus(
                ERC20.address,
                true
            );
            console.log(
                `authorizeRena :: gas used : ${authorizeRena.receipt.gasUsed}`
            );

            let method = await Exchange.buy(order, { from: accounts[5] });
            console.log(`buy :: gas used : ${method.receipt.gasUsed}`);
        });

        it("4.6: Failure case: In correct value token", async () => {
            const ASSET_TYPE_TYPEHASH = String(
                await Exchange.ASSET_TYPE_TYPEHASH()
            );
            const ASSET_TYPEHASH = String(await Exchange.ASSET_TYPEHASH());
            // const ORDER_TYPEHASH = String(await Exchange.ORDER_TYPEHASH());
            const maker = String(accounts[4]);
            const taker = String(accounts[5]);
            const makerAssetClass = String(await Exchange.ERC721_ASSET_CLASS());
            const makerAsset = String(ERC721.address);
            const makerAssetID = String(1);
            const makerAskAsset = String(await Exchange.ERC20_ASSET_CLASS());
            const makerValue = String(0);
            const makerAskValue = String(10e18);
            const makerAskAssetID = String(0);
            const makerOrderType = String(1);

            const takerAssetClass = String(await Exchange.ERC20_ASSET_CLASS());
            const takerAsset = String(ERC20.address);
            const takerAssetID = String(0);
            const takerAskAsset = String(await Exchange.ERC721_ASSET_CLASS());
            const takerValue = String(10e18);
            const takerAskValue = String(2);
            const takerAskAssetID = String(1);
            const takerOrderType = String(0);

            const salt = String(123);

            const end = String(new Date().getTime() + 1000000);

            let maker_type_typeHash = web3.utils.soliditySha3(
                ASSET_TYPE_TYPEHASH,
                makerAssetClass,
                makerAsset,
                makerAssetID
            );

            let taker_type_typeHash = web3.utils.soliditySha3(
                ASSET_TYPE_TYPEHASH,
                takerAssetClass,
                takerAsset,
                takerAssetID
            );

            let maker_asset_type_msgHash = web3.utils.soliditySha3(
                ASSET_TYPEHASH,
                String(maker_type_typeHash),
                makerAskAsset,
                makerValue,
                makerOrderType,
                makerAskValue,
                makerAskAssetID
            );

            let taker_asset_type_msgHash = web3.utils.soliditySha3(
                ASSET_TYPEHASH,
                String(taker_type_typeHash),
                takerAskAsset,
                takerValue,
                takerOrderType,
                takerAskValue,
                takerAskAssetID
            );

            //let order_msg_hash = web3.utils.soliditySha3(ORDER_TYPEHASH,String(maker),String(maker_asset_type_msgHash),String(taker),String(taker_asset_type_msgHash),salt,end);

            let signatureTaker = web3.eth.accounts.sign(
                String(taker_asset_type_msgHash),
                "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba"
            );

            let signatureMaker = web3.eth.accounts.sign(
                String(maker_asset_type_msgHash),
                "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a"
            );

            const vT = Number(signatureTaker.v);
            const rT = String(signatureTaker.r);
            const sT = String(signatureTaker.s);

            const vM = Number(signatureMaker.v);
            const rM = String(signatureMaker.r);
            const sM = String(signatureMaker.s);

            const info = String("objectid1234512");

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

            let authorizeRena = await Exchange.setTokenStatus(
                ERC20.address,
                true
            );
            console.log(
                `authorizeRena :: gas used : ${authorizeRena.receipt.gasUsed}`
            );

            let method = await Exchange.buy(order, { from: accounts[5] });
            console.log(`buy :: gas used : ${method.receipt.gasUsed}`);
        });

        it("4.7: Failure case: In correct signature, validation failed maker", async () => {
            const ASSET_TYPE_TYPEHASH = String(
                await Exchange.ASSET_TYPE_TYPEHASH()
            );
            const ASSET_TYPEHASH = String(await Exchange.ASSET_TYPEHASH());
            // const ORDER_TYPEHASH = String(await Exchange.ORDER_TYPEHASH());
            const maker = String(accounts[4]);
            const taker = String(accounts[5]);
            const makerAssetClass = String(await Exchange.ERC721_ASSET_CLASS());
            const makerAsset = String(ERC721.address);
            const makerAssetID = String(1);
            const makerAskAsset = String(await Exchange.ERC20_ASSET_CLASS());
            const makerValue = String(0);
            const makerAskValue = String(10e18);
            const makerAskAssetID = String(0);
            const makerOrderType = String(1);

            const takerAssetClass = String(await Exchange.ERC20_ASSET_CLASS());
            const takerAsset = String(ERC20.address);
            const takerAssetID = String(1);
            const takerAskAsset = String(await Exchange.ERC721_ASSET_CLASS());
            const takerValue = String(10e18);
            const takerAskValue = String(0);
            const takerAskAssetID = String(1);
            const takerOrderType = String(0);

            const salt = String(123);

            const end = String(new Date().getTime() + 1000000);

            let maker_type_typeHash = web3.utils.soliditySha3(
                ASSET_TYPE_TYPEHASH,
                makerAssetClass,
                makerAsset,
                makerAssetID
            );

            let taker_type_typeHash = web3.utils.soliditySha3(
                ASSET_TYPE_TYPEHASH,
                takerAssetClass,
                takerAsset,
                takerAssetID
            );

            let maker_asset_type_msgHash = web3.utils.soliditySha3(
                ASSET_TYPEHASH,
                String(maker_type_typeHash),
                makerAskAsset,
                makerValue,
                makerOrderType,
                makerAskValue,
                makerAskAssetID
            );

            let taker_asset_type_msgHash = web3.utils.soliditySha3(
                ASSET_TYPEHASH,
                String(taker_type_typeHash),
                takerAskAsset,
                takerValue,
                takerOrderType,
                takerAskValue,
                takerAskAssetID
            );

            //let order_msg_hash = web3.utils.soliditySha3(ORDER_TYPEHASH,String(maker),String(maker_asset_type_msgHash),String(taker),String(taker_asset_type_msgHash),salt,end);

            let signatureTaker = web3.eth.accounts.sign(
                String(taker_asset_type_msgHash),
                "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba"
            );

            let signatureMaker = web3.eth.accounts.sign(
                String(maker_asset_type_msgHash),
                "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a"
            );

            const vT = Number(signatureTaker.v);
            const rT = String(signatureTaker.r);
            const sT = String(signatureTaker.s);

            const vM = Number(100);
            const rM = String(signatureMaker.r);
            const sM = String(signatureMaker.s);

            const info = String("objectid1234512");

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

            let authorizeRena = await Exchange.setTokenStatus(
                ERC20.address,
                true
            );
            console.log(
                `authorizeRena :: gas used : ${authorizeRena.receipt.gasUsed}`
            );

            let method = await Exchange.buy(order, { from: accounts[5] });
            console.log(`buy :: gas used : ${method.receipt.gasUsed}`);
        });
    });

    describe("Test case 5:: Set configuration", () => {
        it("5.1 setDAOFee", async () => {
            let method = await Exchange.setDAOFee(20, { from: creator });
            console.log(`setDAOFee :: gas used : ${method.receipt.gasUsed}`);
        });

        it("5.2 setBurnFee", async () => {
            let method = await Exchange.setBurnFee(30, { from: creator });
            console.log(`setBurnFee :: gas used : ${method.receipt.gasUsed}`);
        });

        it("5.3 setRevenueFee", async () => {
            let method = await Exchange.setRevenueFee(20, { from: creator });
            console.log(
                `setRevenueFee :: gas used : ${method.receipt.gasUsed}`
            );
        });

        it("5.4 setDAOAdd", async () => {
            let method = await Exchange.setDAOAdd(accounts[6], {
                from: creator,
            });
            console.log(`setDAOAdd :: gas used : ${method.receipt.gasUsed}`);
        });

        it("5.5 setBurnAdd", async () => {
            let method = await Exchange.setBurnAdd(accounts[7], {
                from: creator,
            });
            console.log(`setBurnAdd :: gas used : ${method.receipt.gasUsed}`);
        });

        it("5.6 setRevenueAdd", async () => {
            let method = await Exchange.setRevenueAdd(accounts[8], {
                from: creator,
            });
            console.log(
                `setRevenueAdd :: gas used : ${method.receipt.gasUsed}`
            );
        });

        it("5.7 pause", async () => {
            let method = await Exchange.pause({ from: creator });
            console.log(`pause :: gas used : ${method.receipt.gasUsed}`);
        });
    });
});
