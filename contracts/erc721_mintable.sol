//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ERC721Mintable is ERC721URIStorage, Ownable {
    uint256 private _currentTokenId = 0;

    constructor(string memory name_, string memory symbol_)
        ERC721(name_, symbol_)
    {}

    function mint(address to, string memory tokenURI) public onlyOwner {
        _currentTokenId += 1;
        _mint(to, _currentTokenId);
        _setTokenURI(_currentTokenId, tokenURI);
    }

    function batchMint(address to, string[] memory tokenURIs) public onlyOwner {
        require(tokenURIs.length <= 500, "Can only mint 500 NFTs max");

        for (uint256 index = 0; index < tokenURIs.length; index++) {
            mint(to, tokenURIs[index]);
        }
    }
}
