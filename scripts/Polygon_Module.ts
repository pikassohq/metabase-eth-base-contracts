import * as fs from "fs";
import * as path from "path";

import { ethers, BigNumber, Wallet } from "ethers";
import * as dotenv from "dotenv";
import { promises } from "dns";

const compiledArgentAccount = JSON.parse(
  fs
    .readFileSync(
      path.join(
        __dirname,
        "../artifacts/contracts/erc721_mintable.sol/ERC721Mintable.json"
      )
    )
    .toString("ascii")
);

export function create_new_wallet() {
  return ethers.Wallet.createRandom();
}
/**
 * Function set token URI after mint by the account contract that owns this ERC721 contract
 *
 * @param NFTOnwerAccAdr - the Openzeppline account contract address which is the owner of the NFT
 * @param toAccAdr - the target account address that will receive the NFT
 * @param tkID - Token ID
 *
 *
 */
export async function transfer_by_NFT_owner(
  NFTOnwerAccAdr: string,
  ownerPrivateKey: string,
  toAccAdr: string,
  tkID: BigNumber
) {
  try {
    const ethersProvider = new ethers.providers.JsonRpcProvider(
      process.env.MUMBAI_URL
    );
    await ethersProvider.ready;

    // let wallet = new ethers.Wallet(<string>process.env.PRIVATE_KEY);
    let wallet = new ethers.Wallet(ownerPrivateKey);
    const account = wallet.connect(ethersProvider);

    let erc721 = new ethers.Contract(
      <string>process.env.ERC721_CONTRACT_MUMBAI,
      compiledArgentAccount.abi,
      account
    );

    console.log("erc721: ", await erc721.name());

    //safeTransferFrom is an overload so you have to call as the following statement
    //https://stackoverflow.com/questions/68289806/no-safetransferfrom-function-in-ethers-js-contract-instance
    let tx = await erc721["safeTransferFrom(address,address,uint256)"](
      NFTOnwerAccAdr,
      toAccAdr,
      tkID
    );
    console.log("tx", tx.hash);
    return await ethersProvider.waitForTransaction(tx.hash);
  } catch (error) {
    throw error;
  }
}

/**
 * Function set token URI after mint by the account contract that owns this ERC721 contract
 *
 * @param privateKey - private key of the Openzeppline account contract
 * @param accContract - the Openzeppline account contract address (master account contract) which is the owner of ERC721 contract
 * @param erc721Addr - the ERC721 contract address
 * @param _tokenID - Token ID
 * @param _mintTo - the target Openzeppline account contract address that will own this NFT
 *
 */
export async function mint_with_owner(
  _tokenURIs: string[],
  _mintTo: string,
  ownerPrivateKey: string
) {
  try {
    const ethersProvider = new ethers.providers.JsonRpcProvider(
      process.env.MUMBAI_URL
    );
    await ethersProvider.ready;

    // let wallet = new ethers.Wallet(<string>process.env.PRIVATE_KEY);
    let wallet = new ethers.Wallet(ownerPrivateKey);

    const account = wallet.connect(ethersProvider);

    let erc721 = new ethers.Contract(
      <string>process.env.ERC721_CONTRACT_MUMBAI,
      compiledArgentAccount.abi,
      account
    );

    console.log("erc721: ", await erc721.name());

    // //estimate gas
    let estimateGas = await erc721.estimateGas.batchMint(_mintTo, _tokenURIs);

    let tx = await erc721.batchMint(_mintTo, _tokenURIs, {
      gasLimit: Math.floor((estimateGas.toNumber() * 100) / 70),
    });
    // let tx = await erc721.batchMint(_mintTo, _tokenURIs);
    console.log("tx: ", tx.hash);
    return await ethersProvider.waitForTransaction(tx.hash);
  } catch (error) {
    throw error;
  }
}

/**
 * Function set token URI after mint by the account contract that owns this ERC721 contract
 *
 * @param onwerContractAdr - the Argent contract address that will be the ovner of ERC721 contract
 * @returns ERC721 contract address
 *
 */
export async function deploy_ERC721(ownerContractAdr: string): Promise<string> {
  try {
    const ethersProvider = new ethers.providers.JsonRpcProvider(
      process.env.MUMBAI_URL
    );

    await ethersProvider.ready;

    let wallet = new ethers.Wallet(<string>process.env.PRIVATE_KEY);
    const account = wallet.connect(ethersProvider);

    const ERC721 = new ethers.ContractFactory(
      compiledArgentAccount.abi,
      compiledArgentAccount.bytecode,
      account
    );

    const erc721 = await ERC721.deploy("Codelight", "CLN");

    await erc721.deployed();

    console.log("ERC721 deployed to:", erc721.address);

    //transfer ownership to gamestudio
    await erc721.transferOwnership(ownerContractAdr);
    return erc721.address;
  } catch (error) {
    throw error;
  }
}

/**
 * Function get token URI
 *
 * @param ERC721Addr - the ERC721 contract address
 * @param tkID - Token ID
 *
 */
export async function getTokenURI(tkID: BigNumber): Promise<string> {
  try {
    const ethersProvider = new ethers.providers.JsonRpcProvider(
      process.env.MUMBAI_URL
    );
    await ethersProvider.ready;

    let erc721 = new ethers.Contract(
      <string>process.env.ERC721_CONTRACT_MUMBAI,
      compiledArgentAccount.abi,
      ethersProvider
    );

    return await erc721.tokenURI(tkID);
  } catch (error) {
    throw error;
  }
}

/**
 * Function use to get mint ERC721 event
 *
 * @param txReceipt - receipt of transaction
 * @param smartContractAddress - the smart contract
 *
 */
export async function getMintEventTopic(
  txReceipt: ethers.providers.TransactionReceipt
) {
  //get event's topic
  let log = txReceipt.logs;

  let eventTopics: any;

  if (log.length != 0) {
    let event = log.find((obj) => {
      return (
        obj.topics[0] ==
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
      );
    });

    if (event) {
      eventTopics = event.topics;
      console.log("transaction event:", event);
    } else {
      throw new Error("Find no event!");
    }
    return { txReceipt, eventTopics };
  } else {
    eventTopics = [];
    return { txReceipt, eventTopics };
  }
}
