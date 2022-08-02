pragma solidity 0.8.4;
//SPDX-License-Identifier: UNLICENSED

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

library BytesLibrary {
    function toString(bytes32 value) internal pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(64);
        for (uint256 i = 0; i < 32; i++) {
            str[i * 2] = alphabet[uint8(value[i] >> 4)];
            str[1 + i * 2] = alphabet[uint8(value[i] & 0x0f)];
        }
        return string(str);
    }

    function recover(
        bytes32 hash,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) internal pure returns (address) {
        bytes32 fullMessage = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", hash)
        );
        return ecrecover(fullMessage, v, r, s);
    }
}

contract ExchangeCore is Pausable {
    using BytesLibrary for bytes32;

    event ExecuteEvent(
        // Exchange event
        address maker, /* maker address */
        address indexed makeToken, /* taker ask token */
        uint256 indexed makeTokenId, /* taker ask token id */
        uint256 makeValue, /* maker bid token amount */
        address taker, /* taker address */
        address takeToken, /* maker ask token */
        uint256 takeValue, /* maker ask token value */
        string info
    );

    // event TransferSingle(
    //     address indexed operator,
    //     address indexed from,
    //     address indexed to,
    //     uint256[] ids,
    //     uint256[] values,
    //     string info
    // );

    // event TransferBatch(
    //     address indexed operator,
    //     address indexed from,
    //     address indexed to,
    //     uint256[] ids,
    //     uint256[] values,
    //     string info
    // );

    event Allow(
        address token, /* enable token address */
        bool status /* if true enabled, false disabled */
    );

    struct Order {
        address maker; /* maker address */
        Asset makeAsset; /* maker asset info */
        address taker; /* taker address */
        Asset takeAsset; /* taker asset info */
        string info;
        // uint salt; /* signature salt */
        // uint end; /* order expiry time */
        // move salt and end to asset
    }

    struct AssetType {
        bytes4 assetClass; /* bid token class ETH_ASSET_CLASS for ETH, ERC20_ASSET_CLASS for erc20, ERC721_ASSET_CLASS for erc721, and ERC1155_ASSET_CLASS for erc1155*/
        address asset; /* token address */
        uint256 assetID; /* token id need if bid is ERC721/1155. 0 for ERC20 and ETH */
    }

    struct Asset {
        AssetType assetType; /* Asset info */
        bytes4 askAsset; /* ask token class same as asset class*/
        uint256 value; /* bid amount need if bid is ERC20/1155 or ETH. 0 for ERC721 */
        uint256 orderType; /* 0- buy 1- sell */
        uint256 askAssetValue; /* ask amount if ask is ERC20/1155 or ETH. 0 for ERC721 */
        uint256 askAssetID; /* ask token ID if ask is ERC721/1155. 0 for ERC20 and ETH*/
        uint8 v;
        bytes32 r;
        bytes32 s;
        uint256 salt;
        uint256 end;
    }

    bytes4 public constant ETH_ASSET_CLASS = bytes4(keccak256("ETH"));
    bytes4 public constant ERC20_ASSET_CLASS = bytes4(keccak256("ERC20"));
    bytes4 public constant ERC721_ASSET_CLASS = bytes4(keccak256("ERC721"));
    bytes4 public constant ERC1155_ASSET_CLASS = bytes4(keccak256("ERC1155"));
    uint256 public feeRate = 4;

    bytes32 public constant ASSET_TYPE_TYPEHASH =
        keccak256("AssetType(bytes4 assetClass,address asset,uint assetID)");

    bytes32 public constant ASSET_TYPEHASH =
        keccak256(
            "Asset(AssetType assetType,bytes4 askAsset,uint256 value,uint orderType, uint askAssetValue, uint askAssetID,uint256 salt,uint256 end,uint8 v,bytes32 r,bytes32 s)AssetType(bytes4 assetClass,address asset,uint assetID)"
        );

    bytes32 public constant ORDER_TYPEHASH =
        keccak256(
            "Order(address maker,Asset makeAsset,address taker,Asset takeAsset)Asset(AssetType assetType,bytes4 askAsset,uint256 value,uint orderType, uint askAssetValue, uint askAssetID,uint256 salt,uint256 end,uint8 v,bytes32 r,bytes32 s)AssetType(bytes4 assetClass,address asset,uint assetID)"
        );

    uint256[3] public protocolFee; /* 0 - DAO, 1- burn, 2 - revenue. */

    address[3] public beneficiaryAddress; /* 0 - DAO address, 1- burn address, 2 - revenue address. */

    mapping(bytes32 => bool) public fills; /* signature fills Returns true if signature already signed */
    mapping(address => bool) public isAllowed; /* Allow ERC20 tokens to bid */

    /**
     * @notice calculates key for Order used to record fill of the order
     * @param order Order tuple
     * @return bytes32 fill key
     */
    function hashkey(Order memory order) public view returns (bytes32) {
        return
            keccak256(
                abi.encodePacked( /* Create fill key */
                    order.maker,
                    order.taker,
                    hash(order.makeAsset.assetType),
                    hash(order.takeAsset.assetType),
                    order.info,
                    block.timestamp
                )
            );
    }

    /**
     * @notice  calculates hash according to EIP-712 rules.
     * @param order Order tuple
     * @return bytes32 order key
     */
    function hash(Order memory order) public pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked( /* Create main order key */
                    ORDER_TYPEHASH,
                    order.maker,
                    hash(order.makeAsset),
                    order.taker,
                    hash(order.takeAsset),
                    order.info
                )
            );
    }

    /**
     * @notice calculates key for asset type.
     * @param assetType AssetType tuple
     * @return bytes32 AssetType key
     */
    function hash(AssetType memory assetType) public pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked( /* Create asset type key */
                    ASSET_TYPE_TYPEHASH,
                    assetType.assetClass,
                    assetType.asset,
                    assetType.assetID
                )
            );
    }

    /**
     * @notice calculates key for asset.
     * @param asset Asset tuple
     * @return bytes32 Asset key
     */
    function hash(Asset memory asset) public pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked( /* Create asset key */
                    ASSET_TYPEHASH,
                    hash(asset.assetType),
                    asset.askAsset,
                    asset.value,
                    asset.orderType,
                    asset.askAssetValue,
                    asset.askAssetID
                )
            );
    }

    /**
     * @notice validates main order parameters, checks if Order can be processed
     * @param order Order tuple
     */
    function validate(Order memory order) internal view {
        require(
            order.makeAsset.end > block.timestamp,
            "Order end validation failed"
        );
        require(
            order.makeAsset.askAsset == order.takeAsset.assetType.assetClass,
            "maker bid asset is not taker ask asset"
        );
        require(
            order.takeAsset.askAsset == order.makeAsset.assetType.assetClass,
            "taker bid asset is not maker ask asset"
        );
    }

    /**
     * @notice Execute buy and sell exchange
     * @param order Order tuple
     * @param _type 0 if buy, else sell.
     */
    function _executeInternal(Order calldata order, uint8 _type)
        internal
        whenNotPaused
    {
        require(!this.getFills(order), "Filled message hash"); // check if fill key signed already.

        if (_type == 0) {
            // buy
            require(msg.sender == order.taker, "Tx signer must be a taker");

            address orderSigner = hash(order.takeAsset).recover(
                order.takeAsset.v,
                order.takeAsset.r,
                order.takeAsset.s
            ); // validates signed message.
            require(
                orderSigner == order.taker,
                "In correct signature, validation failed signer is not a taker"
            );

            address orderMaker = hash(order.makeAsset).recover(
                order.makeAsset.v,
                order.makeAsset.r,
                order.makeAsset.s
            );
            require(
                orderMaker == order.maker,
                "In correct signature, validation failed maker"
            );

            require(
                ((order.makeAsset.value == order.takeAsset.askAssetValue) &&
                    (order.makeAsset.askAssetValue == order.takeAsset.value)),
                "In correct value token"
            );
            require(
                ((order.makeAsset.assetType.assetID ==
                    order.takeAsset.askAssetID) &&
                    (order.makeAsset.askAssetID ==
                        order.takeAsset.assetType.assetID)),
                "In correct token ID"
            );
        } else {
            // sell
            require(msg.sender == order.maker, "Tx signer must be a maker");

            address orderSigner = hash(order.makeAsset).recover(
                order.makeAsset.v,
                order.makeAsset.r,
                order.makeAsset.s
            ); // validates signed message.
            require(
                orderSigner == order.maker,
                "In correct signature, validation failed signer is not a maker"
            );

            address orderTaker = hash(order.takeAsset).recover(
                order.takeAsset.v,
                order.takeAsset.r,
                order.takeAsset.s
            );
            require(
                orderTaker == order.taker,
                "In correct signature, validation failed taker"
            );

            require(
                ((order.makeAsset.value == order.takeAsset.askAssetValue) &&
                    (order.makeAsset.askAssetValue == order.takeAsset.value)),
                "In correct value token"
            );
            require(
                ((order.makeAsset.assetType.assetID ==
                    order.takeAsset.askAssetID) &&
                    (order.makeAsset.askAssetID ==
                        order.takeAsset.assetType.assetID)),
                "In correct token ID"
            );
        }
        transferMakerAsk(order, _type); // executes maker bid order.
        transferTakerAsk(order); // executes taker ask order.

        fills[hashkey(order)] = true; // fills the order.

        emit ExecuteEvent(
            order.maker,
            order.makeAsset.assetType.asset,
            order.makeAsset.assetType.assetID,
            order.makeAsset.value,
            order.taker,
            order.takeAsset.assetType.asset,
            order.takeAsset.value,
            order.info
        );
    }

    /**
     * @notice Execute taker ask/bid.
     * @param _order Order tuple
     */
    function transferTakerAsk(Order calldata _order) internal {
        if (_order.makeAsset.assetType.assetClass == ERC721_ASSET_CLASS) {
            // execute taker ask order
            IERC721(_order.makeAsset.assetType.asset).safeTransferFrom(
                _order.maker,
                _order.taker,
                _order.makeAsset.assetType.assetID
            );
        } else if (
            _order.makeAsset.assetType.assetClass == ERC1155_ASSET_CLASS
        ) {
            IERC1155(_order.makeAsset.assetType.asset).safeTransferFrom(
                _order.maker,
                _order.taker,
                _order.makeAsset.assetType.assetID,
                _order.makeAsset.value,
                "0x"
            );
        } else revert("Invalid assest ");
    }

    /**
     * @notice Execute maker ask/bid.
     * @param _order Order tuple
     * @param _type 0 if buy, else sell.
     */
    function transferMakerAsk(Order calldata _order, uint256 _type) internal {
        if (_order.takeAsset.assetType.assetClass == ETH_ASSET_CLASS) {
            // execute maker ask order
            require(
                (msg.value == _order.takeAsset.value) && (_type != 1),
                "msg.value is invalid or bnb not accepted on sell exec, wbnb is acceptable"
            );
            transferBNB(_order.takeAsset.value, _order.maker);
        } else if (_order.takeAsset.assetType.assetClass == ERC20_ASSET_CLASS)
            transferErc20(
                IERC20(_order.takeAsset.assetType.asset),
                _order.takeAsset.value,
                _order.maker,
                _order.taker
            );
        else revert("Token is not acceptable");
    }

    /**
     * @notice Execute BNB transfer, if ask/bid is bnb.
     * @param _maker Order tuple
     * @param amount bnb value in 18 decimal.
     */
    function transferBNB(uint256 amount, address _maker) internal {
        (
            uint256 _DAO,
            uint256 _burn,
            uint256 _revenue,
            uint256 _tValue
        ) = computeProtocolFee(amount);
        if (_DAO > 0) payable(beneficiaryAddress[0]).transfer(_DAO);

        if (_burn > 0) payable(beneficiaryAddress[1]).transfer(_burn);

        if (_revenue > 0) payable(beneficiaryAddress[2]).transfer(_revenue);

        if (_tValue > 0) payable(_maker).transfer(_tValue);
    }

    /**
     * @notice Execute ERC20 transfer, if ask/bid is token.
     * @param _token ERC20 token address
     * @param _amount ask/bid amount in token decimals.
     */
    function transferErc20(
        IERC20 _token,
        uint256 _amount,
        address _maker,
        address _taker
    ) internal {
        require(isAllowed[address(_token)], "Not authorized token");

        (
            uint256 _DAO,
            uint256 _burn,
            uint256 _revenue,
            uint256 _tValue
        ) = computeProtocolFee(_amount);

        if (_DAO > 0)
            SafeERC20.safeTransferFrom(
                _token,
                _taker,
                beneficiaryAddress[0],
                _DAO
            );

        if (_burn > 0)
            SafeERC20.safeTransferFrom(
                _token,
                _taker,
                beneficiaryAddress[1],
                _burn
            );

        if (_revenue > 0)
            SafeERC20.safeTransferFrom(
                _token,
                _taker,
                beneficiaryAddress[2],
                _revenue
            );

        if (_tValue > 0)
            SafeERC20.safeTransferFrom(_token, _taker, _maker, _tValue);
    }

    /**
     * @notice Return fills true if fill exist
     * @param order Order tuple
     */
    function getFills(Order calldata order) external view returns (bool) {
        return fills[hashkey(order)];
    }

    /**
     * @notice calculates protocol fee
     * @param amount bid/ask amount/
     */
    function computeProtocolFee(uint256 amount)
        public
        view
        returns (
            uint256 _DAO,
            uint256 _burn,
            uint256 _revenue,
            uint256 _tValue
        )
    {
        if (feeRate <= 0) {
            (_DAO, _burn, _revenue, _tValue) = (0, 0, 0, amount);
        } else {
            uint256 _totalFee = (amount * feeRate) / 100;
            _DAO = (_totalFee * protocolFee[0]) / 100;
            _burn = (_totalFee * protocolFee[1]) / 100;
            _revenue = (_totalFee * protocolFee[2]) / 100;
            _tValue = amount - (_DAO + _burn + _revenue);
        }
    }
}

contract Exchange is ExchangeCore, AccessControl {
    /**
     * @notice Construct role for admin and set beneficiary informations
     * @param _beneficiaryAddress beneficiary addresses 0. DAO, 1. burn, 2. revenue
     * @param _protocolFee beneficiary fee 0. DAO fee, 1. burn fee, 2. revenue fee
     */
    constructor(
        address[3] memory _beneficiaryAddress,
        uint256[3] memory _protocolFee
    ) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);

        beneficiaryAddress = _beneficiaryAddress;
        protocolFee = _protocolFee;
    }

    receive() external payable {
        revert("No receive call");
    }

    fallback() external {
        revert("No fallback call");
    }

    /**
     * @notice Execute the order created by the seller, exchange bid and ask orders.
     * @param _order Order tuple - order info
     */
    function buy(Order calldata _order) external {
        validate(_order);

        _executeInternal(_order, 0);
    }

    /**
     * @notice Execute the order created by the buyer, exchange bid and ask orders.
     * @param _order Order tuple - order info
     */
    function sell(Order calldata _order) external {
        validate(_order);

        _executeInternal(_order, 1);
    }

    /**
     * @notice Setting DAO fee to deduct on buy/sell.
     * @param _DAO new DAO fee
     */
    function setDAOFee(uint256 _DAO) external onlyRole(DEFAULT_ADMIN_ROLE) {
        protocolFee[0] = _DAO;
    }

    /**
     * @notice Setting burn fee to deduct on buy/sell.
     * @param _burn new burn fee
     */
    function setBurnFee(uint256 _burn) external onlyRole(DEFAULT_ADMIN_ROLE) {
        protocolFee[1] = _burn;
    }

    /**
     * @notice Setting revenue fee to deduct on buy/sell.
     * @param _revenue new revenue fee
     */
    function setRevenueFee(uint256 _revenue)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        protocolFee[2] = _revenue;
    }

    /**
     * @notice Setting DAO address to send deducted DAO on buy/sell.
     * @param _DAO new DAO address
     */
    function setDAOAdd(address _DAO) external onlyRole(DEFAULT_ADMIN_ROLE) {
        beneficiaryAddress[0] = _DAO;
    }

    function setFeeRate(uint256 _feeRate) public onlyRole(DEFAULT_ADMIN_ROLE) {
        feeRate = _feeRate;
    }

    /**
     * @notice Setting burn address to send deducted burn on buy/sell.
     * @param _burn new burn address
     */
    function setBurnAdd(address _burn) external onlyRole(DEFAULT_ADMIN_ROLE) {
        beneficiaryAddress[1] = _burn;
    }

    /**
     * @notice Setting revenue address to send deducted revenue on buy/sell.
     * @param _revenue new DAO address
     */
    function setRevenueAdd(address _revenue)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        beneficiaryAddress[2] = _revenue;
    }

    /**
     * @notice Enable token to ask bid orders.
     * @param token token address to enable/disabled
     * @param status true if enable, false to disable
     */
    function setTokenStatus(address token, bool status)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(token != address(0x00), "Zero address");
        isAllowed[token] = status;
        emit Allow(token, status);
    }

    /**
     * @notice Pause buy/sell order execution.
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice UnPause buy/sell order execution.
     */
    function unPause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}
