import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
// import "@openzeppelin/contracts";
// import "tt-hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";

dotenv.config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  solidity: "0.8.4",
  networks: {
    mumbai: {
      url: `https://rpc-mumbai.matic.today`,
      accounts: [<string>process.env.PRIVATE_KEY],
    },
    ropsten: {
      url: process.env.ROPSTEN_URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    rinkeby: {
      url: process.env.RINKEBY_URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    goerli: {
      url: process.env.GOERLI_URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    oneTestnet: {
      url: `https://api.s0.b.hmny.io`,
      accounts: [`0x${process.env.PRIVATE_KEY_ONE}`],
    },
    bsct: {
      url: `https://speedy-nodes-nyc.moralis.io/7180c6b04212cccaf7fac2d1/bsc/testnet`,
      accounts: [`${process.env.PRIVATE_KEY_ONE}`],
      // gas: 8100000,
      gasPrice: 8000000000,
    },

    "thunder-testnet": {
      allowUnlimitedContractSize: true,
      url: "https://testnet-rpc.thundercore.com",
      chainId: 18,
      gas: 90000000,
      gasPrice: 15e9,
      gasMultiplier: 1,
      timeout: 20000,
      httpHeaders: {},
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },

    "thunder-mainnet": {
      allowUnlimitedContractSize: true,
      url: "https://mainnet-rpc.thundercore.com",
      chainId: 108,
      gas: 90000000,
      gasPrice: 15e9,
      gasMultiplier: 1,
      timeout: 20000,
      httpHeaders: {},
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: {
      goerli: <string>process.env.ETHERSCAN_API_KEY,
      harmonyTest: `${process.env.ETHERSCAN_KEY}`,
      polygonMumbai: `${process.env.MUMBAI_API_KEY}`,
      "thunder-testnet": "unused",
    },
    customChains: [
      {
        network: "thunder-testnet",
        chainId: 18,
        urls: {
          apiURL: "https://explorer-testnet.thundercore.com/api",
          browserURL: "https://explorer-testnet.thundercore.com",
        },
      },
    ],
  },
};

export default config;
