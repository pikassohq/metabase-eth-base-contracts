// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  // const ERC721 = await ethers.getContractFactory("ERC721Mintable");
  // const erc721 = await ERC721.deploy("Codelight", "CLN");

  // await erc721.deployed();

  // console.log("Greeter deployed to:", erc721.address);

  let tokenUris: string[] = new Array(3);
  tokenUris.fill(
    "https://ipfs.io/ipfs/QmWVq4bi1ccWgM5sXLP6ezZxhQmdgk2EjadMTuFxJXujoL"
  );

  let erc721 = await ethers.getContractAt(
    "contracts/factory.sol:ERC721Mintable",
    "0x0ab8521Cb0e491bF47f5f93C902001e2cEc810Ee"
  );

  console.log("name: ", await erc721.name());

  let tx = await erc721.batchMint(
    "0xF2843c5Cf5a435F37b927dBCA629f30454B65F3e",
    tokenUris,
    { gasLimit: 30000000 }
  );
  console.log("tx", tx.hash);
  await ethers.provider.waitForTransaction(tx.hash);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
