// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║         METATRON IDENTITY BOUND TOKEN (IBT) v1.0            ║
 * ║         Gerald Gonzalez — Lovable Corporation               ║
 * ║         Deploy on Base Mainnet                              ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Soulbound ERC-721 identity contract for the Metatron Protocol.
 * One permanent identity per address — human or AI agent.
 *
 * Key Features:
 * - Soulbound: no transfers permitted after mint
 * - One identity per address (hasBound mapping)
 * - Coherence score (K) tracks behavioral alignment
 * - Role-based drift reporting via AccessControl
 * - Agent accountability via accountableHuman linkage
 * - Revenue split: 70% founder, 30% protocol reserve
 * - Founder and protocol addresses are immutable
 */

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract IdentityBoundToken is ERC721, ERC721URIStorage, Ownable2Step, AccessControl, ReentrancyGuard {

    // ─── TOKEN COUNTER ────────────────────────────────────────────────────────
    uint256 private _tokenIdCounter;

    // ─── ROLES ────────────────────────────────────────────────────────────────
    bytes32 public constant DRIFT_REPORTER_ROLE = keccak256("DRIFT_REPORTER_ROLE");

    // ─── IMMUTABLE ADDRESSES ─────────────────────────────────────────────────
    address payable public immutable FOUNDER_WALLET;
    address payable public immutable PROTOCOL_RESERVE;

    // ─── ECONOMIC CONSTANTS ───────────────────────────────────────────────────
    uint256 public constant MINT_FEE      = 0.005 ether;   // ~$15 on Base
    uint256 public constant FOUNDER_SHARE = 70;             // 70% to founder
    uint256 public constant PROTOCOL_SHARE = 30;            // 30% to protocol reserve

    // ─── COHERENCE THRESHOLDS ─────────────────────────────────────────────────
    uint256 public constant K_ALIGNED  = 95;   // Fully aligned
    uint256 public constant K_MINOR    = 80;   // Minor drift detected
    uint256 public constant K_MODERATE = 60;   // Moderate drift — review required

    // ─── DRIFT SEVERITY ───────────────────────────────────────────────────────
    enum DriftSeverity { MINOR, MODERATE, CRITICAL }

    // ─── IDENTITY RECORD ──────────────────────────────────────────────────────
    struct IdentityRecord {
        string behaviorHash;        // keccak256 or IPFS hash of founding behavior profile
        uint256 birthTimestamp;     // Block timestamp at mint
        uint256 currentK;           // Current coherence score (0–100)
        bool isAgent;               // true = AI agent, false = human
        bool suspended;             // true = identity suspended
        address accountableHuman;   // For agents: the responsible human address
        bytes32 offchainDataHash;   // Hash of offchain identity data (NIST, Nakshatra, etc.)
    }

    // ─── STATE ────────────────────────────────────────────────────────────────
    mapping(uint256 => IdentityRecord) public identityLedger;
    mapping(address => bool) public hasBound;

    // ─── EVENTS ───────────────────────────────────────────────────────────────
    event IdentityBound(
        uint256 indexed tokenId,
        address indexed holder,
        address accountableHuman,
        bool isAgent
    );
    event CoherenceUpdated(uint256 indexed tokenId, uint256 newK);
    event AgentSuspended(uint256 indexed tokenId, string reason);

    // ─── CONSTRUCTOR ──────────────────────────────────────────────────────────
    constructor(address payable _founder, address payable _protocol)
        ERC721("MetatronIdentity", "MTI")
        Ownable(msg.sender)
    {
        FOUNDER_WALLET    = _founder;
        PROTOCOL_RESERVE  = _protocol;
        _grantRole(DEFAULT_ADMIN_ROLE,    msg.sender);
        _grantRole(DRIFT_REPORTER_ROLE,   msg.sender);
    }

    // ─── BIND IDENTITY ────────────────────────────────────────────────────────

    /**
     * @dev Mint a soulbound identity token.
     * @param to               Recipient address (the identity holder)
     * @param uri              IPFS metadata URI for this identity
     * @param behaviorHash     IPFS CID or keccak256 of founding behavior profile
     * @param isAgent          true if this is an AI agent identity
     * @param accountableHuman For agents: responsible human's address. For humans: pass address(0)
     * @param offchainDataHash bytes32 hash of offchain data (NIST record, Nakshatra data, etc.)
     */
    function bindIdentity(
        address to,
        string memory uri,
        string memory behaviorHash,
        bool isAgent,
        address accountableHuman,
        bytes32 offchainDataHash
    ) external payable nonReentrant {
        require(msg.value >= MINT_FEE,   "Insufficient mint fee");
        require(!hasBound[to],           "One identity per address");

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter = _tokenIdCounter + 1;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        identityLedger[tokenId] = IdentityRecord({
            behaviorHash:      behaviorHash,
            birthTimestamp:    block.timestamp,
            currentK:          100,
            isAgent:           isAgent,
            suspended:         false,
            accountableHuman:  isAgent ? accountableHuman : to,
            offchainDataHash:  offchainDataHash
        });

        hasBound[to] = true;

        // Revenue split
        uint256 founderAmt  = (msg.value * FOUNDER_SHARE) / 100;
        uint256 protocolAmt = msg.value - founderAmt;
        FOUNDER_WALLET.transfer(founderAmt);
        PROTOCOL_RESERVE.transfer(protocolAmt);

        emit IdentityBound(tokenId, to, accountableHuman, isAgent);
    }

    // ─── COHERENCE ────────────────────────────────────────────────────────────

    /**
     * @dev Update the coherence score for a token.
     *      Callable by the token holder or a credentialed drift reporter.
     * @param tokenId Token to update
     * @param newK    New coherence score (0–100)
     */
    function updateCoherence(uint256 tokenId, uint256 newK) external {
        require(
            ownerOf(tokenId) == msg.sender || hasRole(DRIFT_REPORTER_ROLE, msg.sender),
            "Not authorized"
        );
        require(newK <= 100, "K must be 0-100");
        identityLedger[tokenId].currentK = newK;
        emit CoherenceUpdated(tokenId, newK);
    }

    // ─── SUSPENSION ───────────────────────────────────────────────────────────

    /**
     * @dev Suspend an agent's identity.
     *      Callable by contract owner or the agent's accountableHuman.
     * @param tokenId Token to suspend
     * @param reason  Reason string (stored in event log)
     */
    function suspendAgent(uint256 tokenId, string memory reason) external {
        require(
            msg.sender == owner() || msg.sender == identityLedger[tokenId].accountableHuman,
            "Not authorized"
        );
        identityLedger[tokenId].suspended = true;
        emit AgentSuspended(tokenId, reason);
    }

    // ─── SOULBOUND: BLOCK ALL TRANSFERS ──────────────────────────────────────

    function transferFrom(address, address, uint256) public pure override(ERC721) {
        revert("Soulbound: non-transferable");
    }

    function safeTransferFrom(address, address, uint256, bytes memory) public pure override(ERC721) {
        revert("Soulbound: non-transferable");
    }

    // ─── OVERRIDES ────────────────────────────────────────────────────────────

    function tokenURI(uint256 tokenId)
        public view override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721, ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // ─── VIEWS ────────────────────────────────────────────────────────────────

    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }

    function getIdentity(uint256 tokenId) external view returns (IdentityRecord memory) {
        require(_tokenIdCounter > tokenId, "Token does not exist");
        return identityLedger[tokenId];
    }

    function coherenceOf(uint256 tokenId) external view returns (uint256) {
        require(_tokenIdCounter > tokenId, "Token does not exist");
        return identityLedger[tokenId].currentK;
    }

    function isSuspended(uint256 tokenId) external view returns (bool) {
        require(_tokenIdCounter > tokenId, "Token does not exist");
        return identityLedger[tokenId].suspended;
    }
}
