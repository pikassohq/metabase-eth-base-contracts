import { ethers } from "ethers";

let wallet = new ethers.Wallet(
  "d94b26d93b6866a52df132b7de3d2b7f15c28d4cbeddaaaf6ae9540fec9df956"
);

console.log(wallet.address);
