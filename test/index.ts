import { Contract } from "ethers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { beforeEach } from "mocha";

describe("deploy erc721", async function () {
  let signers;
  let adminSigner: any;

  let erc721Mintable: any;

  before(async function () {
    signers = await ethers.getSigners();
    adminSigner = signers[0];
  });

  it("Should deploy", async function () {
    // console.log(adminSigner.address);
    let ERC721Mintable = await ethers.getContractFactory("ERC721Mintable");
    ERC721Mintable = ERC721Mintable.connect(adminSigner);
    erc721Mintable = await ERC721Mintable.deploy("Codelight", "CLN");
    await erc721Mintable.deployed();
  });

  it("test mint batch", async function () {
    let tokenUris: string[] = new Array(300);
    tokenUris.fill("QmWVq4bi1ccWgM5sXLP6ezZxhQmdgk2EjadMTuFxJXujoL");

    [
      "QmWVq4bi1ccWgM5sXLP6ezZxhQmdgk2EjadMTuFxJXujoL",
      "QmWVq4bi1ccWgM5sXLP6ezZxhQmdgk2EjadMTuFxJXujoL",
      "QmWVq4bi1ccWgM5sXLP6ezZxhQmdgk2EjadMTuFxJXujoL",
      "QmWVq4bi1ccWgM5sXLP6ezZxhQmdgk2EjadMTuFxJXujoL",
      "QmWVq4bi1ccWgM5sXLP6ezZxhQmdgk2EjadMTuFxJXujoL",
      "QmWVq4bi1ccWgM5sXLP6ezZxhQmdgk2EjadMTuFxJXujoL",
      "QmWVq4bi1ccWgM5sXLP6ezZxhQmdgk2EjadMTuFxJXujoL",
      "QmWVq4bi1ccWgM5sXLP6ezZxhQmdgk2EjadMTuFxJXujoL",
      "QmWVq4bi1ccWgM5sXLP6ezZxhQmdgk2EjadMTuFxJXujoL",
      "QmWVq4bi1ccWgM5sXLP6ezZxhQmdgk2EjadMTuFxJXujoL",
      "QmWVq4bi1ccWgM5sXLP6ezZxhQmdgk2EjadMTuFxJXujoL",
      "QmWVq4bi1ccWgM5sXLP6ezZxhQmdgk2EjadMTuFxJXujoL",
      "QmWVq4bi1ccWgM5sXLP6ezZxhQmdgk2EjadMTuFxJXujoL",
      "QmWVq4bi1ccWgM5sXLP6ezZxhQmdgk2EjadMTuFxJXujoL",
      "QmWVq4bi1ccWgM5sXLP6ezZxhQmdgk2EjadMTuFxJXujoL",
      "QmWVq4bi1ccWgM5sXLP6ezZxhQmdgk2EjadMTuFxJXujoL",
      "QmWVq4bi1ccWgM5sXLP6ezZxhQmdgk2EjadMTuFxJXujoL",
      "QmWVq4bi1ccWgM5sXLP6ezZxhQmdgk2EjadMTuFxJXujoL",
      "QmWVq4bi1ccWgM5sXLP6ezZxhQmdgk2EjadMTuFxJXujoL",
      "QmWVq4bi1ccWgM5sXLP6ezZxhQmdgk2EjadMTuFxJXujoL",
      "QmWVq4bi1ccWgM5sXLP6ezZxhQmdgk2EjadMTuFxJXujoL",
      "QmWVq4bi1ccWgM5sXLP6ezZxhQmdgk2EjadMTuFxJXujoL",
      "QmWVq4bi1ccWgM5sXLP6ezZxhQmdgk2EjadMTuFxJXujoL",
      "QmWVq4bi1ccWgM5sXLP6ezZxhQmdgk2EjadMTuFxJXujoL",
      "QmWVq4bi1ccWgM5sXLP6ezZxhQmdgk2EjadMTuFxJXujoL",
      "QmWVq4bi1ccWgM5sXLP6ezZxhQmdgk2EjadMTuFxJXujoL",
      "QmWVq4bi1ccWgM5sXLP6ezZxhQmdgk2EjadMTuFxJXujoL",
      "QmWVq4bi1ccWgM5sXLP6ezZxhQmdgk2EjadMTuFxJXujoL",
      "QmWVq4bi1ccWgM5sXLP6ezZxhQmdgk2EjadMTuFxJXujoL",
      "QmWVq4bi1ccWgM5sXLP6ezZxhQmdgk2EjadMTuFxJXujoL",
      "QmWVq4bi1ccWgM5sXLP6ezZxhQmdgk2EjadMTuFxJXujoL",
      "QmWVq4bi1ccWgM5sXLP6ezZxhQmdgk2EjadMTuFxJXujoL",
      "QmWVq4bi1ccWgM5sXLP6ezZxhQmdgk2EjadMTuFxJXujoL",
      "QmWVq4bi1ccWgM5sXLP6ezZxhQmdgk2EjadMTuFxJXujoL",
      "QmWVq4bi1ccWgM5sXLP6ezZxhQmdgk2EjadMTuFxJXujoL",
      "QmWVq4bi1ccWgM5sXLP6ezZxhQmdgk2EjadMTuFxJXujoL",
      "QmWVq4bi1ccWgM5sXLP6ezZxhQmdgk2EjadMTuFxJXujoL",
      "QmWVq4bi1ccWgM5sXLP6ezZxhQmdgk2EjadMTuFxJXujoL",
      "QmWVq4bi1ccWgM5sXLP6ezZxhQmdgk2EjadMTuFxJXujoL",
      "QmWVq4bi1ccWgM5sXLP6ezZxhQmdgk2EjadMTuFxJXujoL",
      "QmWVq4bi1ccWgM5sXLP6ezZxhQmdgk2EjadMTuFxJXujoL",
      "QmWVq4bi1ccWgM5sXLP6ezZxhQmdgk2EjadMTuFxJXujoL",
      "QmWVq4bi1ccWgM5sXLP6ezZxhQmdgk2EjadMTuFxJXujoL",
      "QmWVq4bi1ccWgM5sXLP6ezZxhQmdgk2EjadMTuFxJXujoL",
      "QmWVq4bi1ccWgM5sXLP6ezZxhQmdgk2EjadMTuFxJXujoL",
    ];

    console.log("admin balance before: ", await adminSigner.getBalance());
    let estimateGas = await erc721Mintable.estimateGas.batchMint(
      adminSigner.address,
      tokenUris
    );
    console.log("estimateGas: ", estimateGas);
    await erc721Mintable.batchMint(adminSigner.address, tokenUris);

    console.log("owner of: ", await erc721Mintable.tokenURI(300));
    console.log("admin balance after: ", await adminSigner.getBalance());
  });

  // it("Should return the new greeting once it's changed", async function () {
  //   const Greeter = await ethers.getContractFactory("Greeter");
  //   const greeter = await Greeter.deploy("Hello, world!");
  //   await greeter.deployed();

  //   expect(await greeter.greet()).to.equal("Hello, world!");

  //   const setGreetingTx = await greeter.setGreeting("Hola, mundo!");

  //   // wait until the transaction is mined
  //   await setGreetingTx.wait();

  //   expect(await greeter.greet()).to.equal("Hola, mundo!");
  // });
});
