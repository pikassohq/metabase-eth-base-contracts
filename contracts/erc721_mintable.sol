//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract ERC721Mintable is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    constructor(string memory name_, string memory symbol_)
        ERC721(name_, symbol_)
    {}

    function mint(address to, string memory tokenURI) public onlyOwner {
        _tokenIds.increment();

        uint256 tokenId = _tokenIds.current();

        _mint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
    }

    function batchMint(address to, string[] memory tokenURIs) public onlyOwner {
        require(tokenURIs.length <= 500, "Can only mint 500 NFTs max");

        for (uint256 index = 0; index < tokenURIs.length; index++) {
            mint(to, tokenURIs[index]);
        }
    }
}
