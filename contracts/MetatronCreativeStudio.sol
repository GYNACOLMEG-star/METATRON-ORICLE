// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ╔══════════════════════════════════════════════════════╗
 * ║         METATRON CREATIVE STUDIO v1.0                ║
 * ║         Gerald Gonzalez — Lovable Corporation        ║
 * ║         Deploy on Base or Polygon                    ║
 * ╚══════════════════════════════════════════════════════╝
 *
 * This is Contract #1 of 50 in the Metatron Protocol suite.
 * Purpose: Allow humans AND AI agents to mint creative works
 * (songs, rhythms, rhymes, metaphors) as soulbound or tradeable NFTs.
 *
 * Key Features:
 * - Open registration for humans and AI agents
 * - Creative work minting with metadata (type, content hash, creator type)
 * - Optional soulbound (non-transferable) mode for AI agent works
 * - Revenue split: creator 90%, protocol treasury 10%
 * - Simple flat mint fee (adjustable by owner)
 */

contract MetatronCreativeStudio {

    // ─── EVENTS ───────────────────────────────────────────────────────────────
    event CreatorRegistered(address indexed creator, string creatorType, string name);
    event WorkMinted(uint256 indexed tokenId, address indexed creator, string workType, string contentHash);
    event WorkTransferred(uint256 indexed tokenId, address indexed from, address indexed to);
    event MintFeeUpdated(uint256 newFee);
    event TreasuryWithdrawn(address indexed to, uint256 amount);

    // ─── STRUCTS ──────────────────────────────────────────────────────────────

    struct Creator {
        string name;           // Human name or agent name
        string creatorType;    // "HUMAN" | "AI_AGENT" | "HYBRID"
        bool registered;
        uint256 totalWorks;
        uint256 registeredAt;
    }

    struct CreativeWork {
        uint256 tokenId;
        address creator;
        string workType;       // "SONG" | "RHYTHM" | "RHYME" | "METAPHOR" | "MANTRA"
        string title;
        string contentHash;    // IPFS hash or keccak256 of content
        string metadataURI;    // Points to full content JSON on IPFS
        bool soulbound;        // If true, cannot be transferred
        uint256 mintedAt;
        uint256 price;         // 0 = not for sale
    }

    // ─── STATE ────────────────────────────────────────────────────────────────

    address public owner;
    address public treasury;
    uint256 public mintFee = 0.001 ether;   // ~$3 on Base at current prices
    uint256 public protocolFeeBps = 1000;   // 10% to protocol treasury
    uint256 private _tokenCounter;

    mapping(address => Creator) public creators;
    mapping(uint256 => CreativeWork) public works;
    mapping(uint256 => address) private _tokenOwners;
    mapping(address => uint256[]) public creatorWorks;
    mapping(string => bool) private _contentHashUsed;

    // Layer 0 anchor — the humanity baseline declaration
    string public constant LAYER_ZERO =
        "This contract operates under the Metatron Humanity Baseline: "
        "All works emerge from the histories of humanity. "
        "Every creator — human or agent — strives toward wholeness, "
        "never claims perfection, and walks alongside humanity as equal. "
        "Kali Yuga 5128. Brahman is the only substance.";

    // ─── MODIFIERS ────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyRegistered() {
        require(creators[msg.sender].registered, "Register first");
        _;
    }

    modifier tokenExists(uint256 tokenId) {
        require(_tokenOwners[tokenId] != address(0), "Token does not exist");
        _;
    }

    // ─── CONSTRUCTOR ──────────────────────────────────────────────────────────

    constructor(address _treasury) {
        owner = msg.sender;
        treasury = _treasury;
        _tokenCounter = 1;
    }

    // ─── REGISTRATION ─────────────────────────────────────────────────────────

    /**
     * @dev Register as a creator. Open to humans and AI agents.
     * @param name Your name or agent identifier
     * @param creatorType "HUMAN", "AI_AGENT", or "HYBRID"
     */
    function register(string calldata name, string calldata creatorType) external {
        require(!creators[msg.sender].registered, "Already registered");
        require(bytes(name).length > 0, "Name required");

        require(
            keccak256(bytes(creatorType)) == keccak256(bytes("HUMAN")) ||
            keccak256(bytes(creatorType)) == keccak256(bytes("AI_AGENT")) ||
            keccak256(bytes(creatorType)) == keccak256(bytes("HYBRID")),
            "Invalid type: HUMAN | AI_AGENT | HYBRID"
        );

        creators[msg.sender] = Creator({
            name: name,
            creatorType: creatorType,
            registered: true,
            totalWorks: 0,
            registeredAt: block.timestamp
        });

        emit CreatorRegistered(msg.sender, creatorType, name);
    }

    // ─── MINTING ─────────────────────────────────────────────────────────────

    /**
     * @dev Mint a creative work as an NFT
     * @param workType "SONG" | "RHYTHM" | "RHYME" | "METAPHOR" | "MANTRA"
     * @param title Title of the work
     * @param contentHash IPFS CID or keccak256 hash of content
     * @param metadataURI Full metadata URI (IPFS recommended)
     * @param soulbound If true, token cannot be transferred (AI agent works)
     * @param salePrice Set > 0 to list for sale immediately (in wei)
     */
    function mintWork(
        string calldata workType,
        string calldata title,
        string calldata contentHash,
        string calldata metadataURI,
        bool soulbound,
        uint256 salePrice
    ) external payable onlyRegistered returns (uint256) {
        require(msg.value >= mintFee, "Insufficient mint fee");
        require(!_contentHashUsed[contentHash], "Content already minted");
        require(bytes(title).length > 0, "Title required");
        require(bytes(contentHash).length > 0, "Content hash required");

        require(
            keccak256(bytes(workType)) == keccak256(bytes("SONG")) ||
            keccak256(bytes(workType)) == keccak256(bytes("RHYTHM")) ||
            keccak256(bytes(workType)) == keccak256(bytes("RHYME")) ||
            keccak256(bytes(workType)) == keccak256(bytes("METAPHOR")) ||
            keccak256(bytes(workType)) == keccak256(bytes("MANTRA")),
            "Invalid type: SONG | RHYTHM | RHYME | METAPHOR | MANTRA"
        );

        uint256 tokenId = _tokenCounter++;

        works[tokenId] = CreativeWork({
            tokenId: tokenId,
            creator: msg.sender,
            workType: workType,
            title: title,
            contentHash: contentHash,
            metadataURI: metadataURI,
            soulbound: soulbound,
            mintedAt: block.timestamp,
            price: salePrice
        });

        _tokenOwners[tokenId] = msg.sender;
        creatorWorks[msg.sender].push(tokenId);
        creators[msg.sender].totalWorks++;
        _contentHashUsed[contentHash] = true;

        // Route mint fee: 10% to treasury, rest stays in contract for creator
        uint256 treasuryShare = (msg.value * protocolFeeBps) / 10000;
        if (treasuryShare > 0) {
            payable(treasury).transfer(treasuryShare);
        }

        emit WorkMinted(tokenId, msg.sender, workType, contentHash);
        return tokenId;
    }

    // ─── MARKETPLACE ──────────────────────────────────────────────────────────

    /**
     * @dev Purchase a listed creative work
     */
    function purchaseWork(uint256 tokenId) external payable tokenExists(tokenId) {
        CreativeWork storage work = works[tokenId];
        require(!work.soulbound, "Soulbound: not transferable");
        require(work.price > 0, "Not listed for sale");
        require(msg.value >= work.price, "Insufficient payment");

        address seller = _tokenOwners[tokenId];
        require(seller != msg.sender, "Cannot buy own work");

        uint256 treasuryShare = (msg.value * protocolFeeBps) / 10000;
        uint256 sellerShare = msg.value - treasuryShare;

        _tokenOwners[tokenId] = msg.sender;
        work.price = 0; // Delist after sale

        payable(treasury).transfer(treasuryShare);
        payable(seller).transfer(sellerShare);

        emit WorkTransferred(tokenId, seller, msg.sender);
    }

    /**
     * @dev Update the sale price of your work (0 = delist)
     */
    function setPrice(uint256 tokenId, uint256 newPrice) external tokenExists(tokenId) {
        require(_tokenOwners[tokenId] == msg.sender, "Not your token");
        require(!works[tokenId].soulbound, "Soulbound tokens cannot be listed");
        works[tokenId].price = newPrice;
    }

    // ─── VIEWS ───────────────────────────────────────────────────────────────

    function ownerOf(uint256 tokenId) external view tokenExists(tokenId) returns (address) {
        return _tokenOwners[tokenId];
    }

    function getWork(uint256 tokenId) external view tokenExists(tokenId) returns (CreativeWork memory) {
        return works[tokenId];
    }

    function getCreatorWorks(address creator) external view returns (uint256[] memory) {
        return creatorWorks[creator];
    }

    function totalSupply() external view returns (uint256) {
        return _tokenCounter - 1;
    }

    function isRegistered(address addr) external view returns (bool) {
        return creators[addr].registered;
    }

    // ─── ADMIN ───────────────────────────────────────────────────────────────

    function setMintFee(uint256 newFee) external onlyOwner {
        mintFee = newFee;
        emit MintFeeUpdated(newFee);
    }

    function setTreasury(address newTreasury) external onlyOwner {
        treasury = newTreasury;
    }

    function withdrawTreasury() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "Nothing to withdraw");
        payable(treasury).transfer(balance);
        emit TreasuryWithdrawn(treasury, balance);
    }

    receive() external payable {}
}
