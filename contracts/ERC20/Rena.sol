// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract RENA is ERC20("Rena token", "RENA"),ERC20Burnable {
    constructor() {
        _mint(_msgSender(), 100000000 * 10 ** decimals()); // initial supply
    }
}