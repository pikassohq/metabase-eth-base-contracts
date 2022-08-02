//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CodelightFactory is Ownable {
    mapping(address => ERC721Mintable) public _erc721Mintables;

    constructor(string memory name_, string memory symbol_) {}

    function deployErc721(address[] calldata collections) public onlyOwner {
        uint256 collectionLength = collections.length;
        require(collectionLength > 0, "have not any collection address");

        for (uint256 index; index < collectionLength; index++) {
            _erc721Mintables[collections[index]] = new ERC721Mintable(
                "Codelight",
                "CLN"
            );

            _erc721Mintables[collections[index]].transferOwnership(
                collections[index]
            );
        }
    }

    function getErc721ContractAddress(address[] calldata collections)
        public
        view
        returns (address[] memory)
    {
        uint256 length = collections.length;

        address[] memory erc721 = new address[](length);
        for (uint256 index; index < length; index++) {
            erc721[index] = address(_erc721Mintables[collections[index]]);
        }

        return erc721;
    }
}

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
