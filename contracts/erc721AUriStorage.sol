//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract ERC721AURIStorage is ERC721A, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
     // Optional mapping for token URIs
    mapping(uint256 => string) private _tokenURIs;

    constructor(string memory name_, string memory symbol_)
        ERC721A(name_, symbol_)
    {}

     /**
     * @dev See {IERC721Metadata-tokenURI}.
     */
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "ERC721URIStorage: URI query for nonexistent token");

        string memory _tokenURI = _tokenURIs[tokenId];
        string memory base = _baseURI();

        // If there is no base URI, return the token URI.
        if (bytes(base).length == 0) {
            return _tokenURI;
        }
        // If both are set, concatenate the baseURI and tokenURI (via abi.encodePacked).
        if (bytes(_tokenURI).length > 0) {
            return string(abi.encodePacked(base, _tokenURI));
        }

        return super.tokenURI(tokenId);
    }

     /**
     * @dev Sets `_tokenURI` as the tokenURI of `tokenId`.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     */
    function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal virtual {
        require(_exists(tokenId), "ERC721URIStorage: URI set of nonexistent token");
        _tokenURIs[tokenId] = _tokenURI;
    }

    function mint(address _to, string memory _tokenURI) public onlyOwner {
        _tokenIds.increment();

        uint256 tokenId = _tokenIds.current();

        _mint(_to, tokenId);
        _setTokenURI(tokenId, _tokenURI);        
    }

    function batchMint(address to, string[] memory tokenURIs) public onlyOwner {
        require(tokenURIs.length <= 500, "Can only mint 500 NFTs max");

        for (uint256 index = 0; index < tokenURIs.length; index++) {
            mint(to, tokenURIs[index]);
        }
    }
}
