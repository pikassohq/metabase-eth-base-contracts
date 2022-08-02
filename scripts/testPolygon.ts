import { POSClient, use } from "@maticnetwork/maticjs";
// const maticjs = require("@maticnetwork/maticjs");
import { ethers, BigNumber } from "ethers";
import * as fs from "fs";
import * as path from "path";

import * as polygon from "./Polygon_Module";

import * as dotenv from "dotenv";
import { mainModule } from "process";

dotenv.config();

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

async function main() {
  // //estimate gas
  // let receipt = await polygon.mint_with_owner(
  //   [
  //     "QmbCdG1LEfn8udBhwhNc8VUAmQZUQKirUbfkXjiUqTjX6g",
  //     "QmbCdG1LEfn8udBhwhNc8VUAmQZUQKirUbfkXjiUqTjX6g",
  //     "QmbCdG1LEfn8udBhwhNc8VUAmQZUQKirUbfkXjiUqTjX6g",
  //     "QmbCdG1LEfn8udBhwhNc8VUAmQZUQKirUbfkXjiUqTjX6g",
  //     "QmbCdG1LEfn8udBhwhNc8VUAmQZUQKirUbfkXjiUqTjX6g",
  //     "QmbCdG1LEfn8udBhwhNc8VUAmQZUQKirUbfkXjiUqTjX6g",
  //     "QmbCdG1LEfn8udBhwhNc8VUAmQZUQKirUbfkXjiUqTjX6g",
  //     "QmbCdG1LEfn8udBhwhNc8VUAmQZUQKirUbfkXjiUqTjX6g",
  //     "QmbCdG1LEfn8udBhwhNc8VUAmQZUQKirUbfkXjiUqTjX6g",
  //     "QmbCdG1LEfn8udBhwhNc8VUAmQZUQKirUbfkXjiUqTjX6g",
  //     "QmbCdG1LEfn8udBhwhNc8VUAmQZUQKirUbfkXjiUqTjX6g",
  //     "QmbCdG1LEfn8udBhwhNc8VUAmQZUQKirUbfkXjiUqTjX6g",
  //     "QmbCdG1LEfn8udBhwhNc8VUAmQZUQKirUbfkXjiUqTjX6g",
  //     "QmbCdG1LEfn8udBhwhNc8VUAmQZUQKirUbfkXjiUqTjX6g",
  //     "QmbCdG1LEfn8udBhwhNc8VUAmQZUQKirUbfkXjiUqTjX6g",
  //     "QmbCdG1LEfn8udBhwhNc8VUAmQZUQKirUbfkXjiUqTjX6g",
  //     "QmbCdG1LEfn8udBhwhNc8VUAmQZUQKirUbfkXjiUqTjX6g",
  //     "QmbCdG1LEfn8udBhwhNc8VUAmQZUQKirUbfkXjiUqTjX6g",
  //     "QmbCdG1LEfn8udBhwhNc8VUAmQZUQKirUbfkXjiUqTjX6g",
  //     "QmbCdG1LEfn8udBhwhNc8VUAmQZUQKirUbfkXjiUqTjX6g",
  //     "QmbCdG1LEfn8udBhwhNc8VUAmQZUQKirUbfkXjiUqTjX6g",
  //     "QmbCdG1LEfn8udBhwhNc8VUAmQZUQKirUbfkXjiUqTjX6g",
  //     "QmbCdG1LEfn8udBhwhNc8VUAmQZUQKirUbfkXjiUqTjX6g",
  //     "QmbCdG1LEfn8udBhwhNc8VUAmQZUQKirUbfkXjiUqTjX6g",
  //     "QmbCdG1LEfn8udBhwhNc8VUAmQZUQKirUbfkXjiUqTjX6g",
  //     "QmbCdG1LEfn8udBhwhNc8VUAmQZUQKirUbfkXjiUqTjX6g",
  //     "QmbCdG1LEfn8udBhwhNc8VUAmQZUQKirUbfkXjiUqTjX6g",
  //     "QmbCdG1LEfn8udBhwhNc8VUAmQZUQKirUbfkXjiUqTjX6g",
  //     "QmbCdG1LEfn8udBhwhNc8VUAmQZUQKirUbfkXjiUqTjX6g",
  //     "QmbCdG1LEfn8udBhwhNc8VUAmQZUQKirUbfkXjiUqTjX6g",
  //     "QmbCdG1LEfn8udBhwhNc8VUAmQZUQKirUbfkXjiUqTjX6g",
  //     "QmbCdG1LEfn8udBhwhNc8VUAmQZUQKirUbfkXjiUqTjX6g",
  //     "QmbCdG1LEfn8udBhwhNc8VUAmQZUQKirUbfkXjiUqTjX6g",
  //     "QmbCdG1LEfn8udBhwhNc8VUAmQZUQKirUbfkXjiUqTjX6g",
  //     "QmbCdG1LEfn8udBhwhNc8VUAmQZUQKirUbfkXjiUqTjX6g",
  //     "QmbCdG1LEfn8udBhwhNc8VUAmQZUQKirUbfkXjiUqTjX6g",
  //     "QmbCdG1LEfn8udBhwhNc8VUAmQZUQKirUbfkXjiUqTjX6g",
  //     "QmbCdG1LEfn8udBhwhNc8VUAmQZUQKirUbfkXjiUqTjX6g",
  //     "QmbCdG1LEfn8udBhwhNc8VUAmQZUQKirUbfkXjiUqTjX6g",
  //     "QmbCdG1LEfn8udBhwhNc8VUAmQZUQKirUbfkXjiUqTjX6g",
  //     "QmbCdG1LEfn8udBhwhNc8VUAmQZUQKirUbfkXjiUqTjX6g",
  //     "QmbCdG1LEfn8udBhwhNc8VUAmQZUQKirUbfkXjiUqTjX6g",
  //     "QmbCdG1LEfn8udBhwhNc8VUAmQZUQKirUbfkXjiUqTjX6g",
  //     "QmbCdG1LEfn8udBhwhNc8VUAmQZUQKirUbfkXjiUqTjX6g",
  //     "QmbCdG1LEfn8udBhwhNc8VUAmQZUQKirUbfkXjiUqTjX6g",
  //   ],
  //   "0xF2843c5Cf5a435F37b927dBCA629f30454B65F3e",
  //   <string>process.env.PRIVATE_KEY
  // );

  // console.log("receipt: ", receipt.logs);
  // console.log("----------------------------------------------");
  // // console.log("receipt: ", receipt.logs[0].topics);
  // // console.log("receipt: ", receipt.logs[1].topics);

  // try {
  //   await polygon.getMintEventTopic(receipt);
  // } catch (error) {
  //   throw Error("get event fail");
  // }

  await polygon.transfer_by_NFT_owner(
    "0xF2843c5Cf5a435F37b927dBCA629f30454B65F3e",
    <string>process.env.PRIVATE_KEY,
    "0x8Ff429e2CFE39A595f90d4032C75cd4D5d94d1AA",
    BigNumber.from("0x17")
  );

  // console.log(await polygon.getTokenURI(BigNumber.from("0x15")));
}

export async function mint_with_owner(_tokenURIs: string[], _mintTo: string) {
  const ethersProvider = new ethers.providers.JsonRpcProvider(
    process.env.MUMBAI_URL
  );
  await ethersProvider.ready;

  let wallet = new ethers.Wallet(<string>process.env.PRIVATE_KEY);
  const account = wallet.connect(ethersProvider);

  let erc721 = new ethers.Contract(
    <string>process.env.ERC721_CONTRACT_MUMBAI,
    compiledArgentAccount.abi,
    account
  );

  // console.log(await erc721.owner());
  // let tx = await erc721.mint(_mintTo, _tokenURIs[0]);
  // console.log("tx", tx.hash);
  // await ethersProvider.waitForTransaction(tx.hash);

  // //estimate gas
  // let estimateGas = await erc721.estimateGas.batchMint(_mintTo, _tokenURIs);

  // let tx = await erc721.batchMint(_mintTo, _tokenURIs, {
  //   gasLimit: Math.floor((estimateGas.toNumber() * 100) / 70),
  // });
  // console.log("tx", tx.hash);
  // await ethersProvider.waitForTransaction(tx.hash);

  //estimate gas
  // let estimateGas = await erc721.estimateGas.batchMint(_mintTo, _tokenURIs);

  let tx = await erc721.batchMint(_mintTo, _tokenURIs);
  console.log("tx", tx.hash);
  await ethersProvider.waitForTransaction(tx.hash);
}

main();
