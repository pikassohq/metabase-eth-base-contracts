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

  const ownerAddress = await ethers.provider.getSigner().getAddress();

  // We get the contract to deploy
  const CodelightFactory = await ethers.getContractFactory("PikassoFactory");
  const codelightFactory = await CodelightFactory.deploy("Pikasso Factory");

  const factoryContract = await codelightFactory.deployed();

  console.log("Factory deployed to:", codelightFactory.address);

  //deploy an nft contract

  const tx1 = await factoryContract.deployErc721([ownerAddress]);
  await tx1.wait();
  const erc721ContractAddress = await factoryContract.getErc721ContractAddress([
    ownerAddress,
  ]);

  console.log("erc721ContractAddress :>> ", erc721ContractAddress);

  // We get the contract to deploy
  const CodelightMultiSender = await ethers.getContractFactory("MultiSender");
  const codelightMultiSender = await CodelightMultiSender.deploy();

  await codelightMultiSender.deployed();

  console.log("Multisender deployed to:", codelightMultiSender.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
