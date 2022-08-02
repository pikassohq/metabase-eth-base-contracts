import * as fs from "fs";
import * as path from "path";

import { ethers, BigNumber } from "ethers";
import * as dotenv from "dotenv";
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
  //-----------------------deploy---------------
  // // const ethersProvider = new ethers.providers.JsonRpcProvider(
  // //   process.env.RINKEBY_URL
  // // );
  // const ethersProvider = new ethers.providers.JsonRpcProvider(
  //   process.env.ONE_URL
  // );
  // await ethersProvider.ready;
  // // let wallet = new ethers.Wallet(<string>process.env.PRIVATE_KEY);
  // let wallet = new ethers.Wallet(<string>process.env.PRIVATE_KEY_ONE);
  // const account = wallet.connect(ethersProvider);
  // const ERC721 = new ethers.ContractFactory(
  //   compiledArgentAccount.abi,
  //   compiledArgentAccount.bytecode,
  //   account
  // );
  // const erc721 = await ERC721.deploy("Codelight", "CLN");
  // await erc721.deployed();
  // console.log("ERC721 deployed to:", erc721.address);
  //---------------------mint batch-------------------
  // const ethersProvider = new ethers.providers.JsonRpcProvider(
  //   process.env.RINKEBY_URL
  // );
  // await ethersProvider.ready;
  // let wallet = new ethers.Wallet(<string>process.env.PRIVATE_KEY);

  const ethersProvider = new ethers.providers.JsonRpcProvider(
    process.env.ONE_URL
  );
  await ethersProvider.ready;
  let wallet = new ethers.Wallet(<string>process.env.PRIVATE_KEY_ONE);

  const account = wallet.connect(ethersProvider);
  // let erc721 = new ethers.Contract(
  //   <string>process.env.ERC721_CONTRACT,
  //   compiledArgentAccount.abi,
  //   account
  // );

  let erc721 = new ethers.Contract(
    <string>process.env.ERC721_CONTRACT_ONE,
    compiledArgentAccount.abi,
    account
  );

  let tokenUris: string[] = new Array(50);
  tokenUris.fill(
    "https://ipfs.io/ipfs/Qmch3m7DEFYRaZiFG6gc8qgkBMS3nrTvM5h5v9xZK6rGEz"
  );
  console.log("name: ", await erc721.name());
  let estimateGas = await erc721.estimateGas.batchMint(
    "0xF09DcCa78806534afAabA5fbA860fd40e1DCa7c8",
    tokenUris,
    { gasLimit: 7210891 }
  );

  console.log("estimateGas: ", estimateGas);

  let tx = await erc721.batchMint(
    "0xF09DcCa78806534afAabA5fbA860fd40e1DCa7c8",
    tokenUris,
    { gasLimit: Math.floor((estimateGas.toNumber() * 100) / 70) }
  );
  console.log("tx", tx.hash);
  await ethersProvider.waitForTransaction(tx.hash);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
