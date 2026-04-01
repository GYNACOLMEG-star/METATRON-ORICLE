/**
 * IdentityBoundToken — Contract Client
 *
 * Drop into any page with window.ethereum (MetaMask).
 * Requires ethers.js v6:
 *   <script src="https://cdn.jsdelivr.net/npm/ethers@6/dist/ethers.umd.min.js"></script>
 *
 * Usage:
 *   const client = new IdentityClient();
 *   await client.connect();
 *   await client.bindIdentity({ to: "0x...", uri: "ipfs://...", ... });
 */

// ─── CONFIG — paste contract address here after deploying ────────────────────
const IBT_CONFIG = {
  address: "0x0000000000000000000000000000000000000000", // <-- fill after deploy
  BASE_MAINNET:  8453,
  BASE_SEPOLIA:  84532,
  MINT_FEE_ETH:  "0.005",
};

// Human-readable ABI (ethers.js v6 format)
const IBT_ABI = [
  // Write
  "function bindIdentity(address to, string uri, string behaviorHash, bool isAgent, address accountableHuman, bytes32 offchainDataHash) external payable",
  "function updateCoherence(uint256 tokenId, uint256 newK) external",
  "function suspendAgent(uint256 tokenId, string reason) external",
  "function grantRole(bytes32 role, address account) external",
  "function revokeRole(bytes32 role, address account) external",
  "function transferOwnership(address newOwner) external",
  "function acceptOwnership() external",
  // Read
  "function hasBound(address) external view returns (bool)",
  "function identityLedger(uint256) external view returns (string behaviorHash, uint256 birthTimestamp, uint256 currentK, bool isAgent, bool suspended, address accountableHuman, bytes32 offchainDataHash)",
  "function getIdentity(uint256 tokenId) external view returns (tuple(string behaviorHash, uint256 birthTimestamp, uint256 currentK, bool isAgent, bool suspended, address accountableHuman, bytes32 offchainDataHash))",
  "function coherenceOf(uint256 tokenId) external view returns (uint256)",
  "function isSuspended(uint256 tokenId) external view returns (bool)",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function tokenURI(uint256 tokenId) external view returns (string)",
  "function totalSupply() external view returns (uint256)",
  "function owner() external view returns (address)",
  "function MINT_FEE() external view returns (uint256)",
  "function FOUNDER_WALLET() external view returns (address)",
  "function PROTOCOL_RESERVE() external view returns (address)",
  "function DRIFT_REPORTER_ROLE() external view returns (bytes32)",
  "function hasRole(bytes32 role, address account) external view returns (bool)",
  // Events
  "event IdentityBound(uint256 indexed tokenId, address indexed holder, address accountableHuman, bool isAgent)",
  "event CoherenceUpdated(uint256 indexed tokenId, uint256 newK)",
  "event AgentSuspended(uint256 indexed tokenId, string reason)",
];

// ─── IDENTITY CLIENT ──────────────────────────────────────────────────────────

class IdentityClient {
  constructor() {
    this.provider     = null;
    this.signer       = null;
    this.contract     = null;
    this.readContract = null;
    this.userAddress  = null;
  }

  /**
   * Connect MetaMask. Call this on wallet-connect button click.
   * @returns {string} Connected wallet address
   */
  async connect() {
    if (!window.ethereum) throw new Error("MetaMask not found. Please install it.");

    this.provider    = new ethers.BrowserProvider(window.ethereum);
    await this.provider.send("eth_requestAccounts", []);
    this.signer      = await this.provider.getSigner();
    this.userAddress = await this.signer.getAddress();

    this.contract     = new ethers.Contract(IBT_CONFIG.address, IBT_ABI, this.signer);
    this.readContract = new ethers.Contract(IBT_CONFIG.address, IBT_ABI, this.provider);

    console.log("[IBT] Connected:", this.userAddress);
    return this.userAddress;
  }

  // ─── WRITE ────────────────────────────────────────────────────────────────

  /**
   * Bind a new soulbound identity.
   *
   * @param {object} params
   * @param {string}  params.to               — Recipient wallet address
   * @param {string}  params.uri              — IPFS metadata URI (e.g. "ipfs://Qm...")
   * @param {string}  params.behaviorHash     — IPFS CID or keccak256 of behavior profile
   * @param {boolean} params.isAgent          — true = AI agent, false = human
   * @param {string}  params.accountableHuman — For agents: responsible human address.
   *                                            For humans: pass ethers.ZeroAddress
   * @param {string}  params.offchainDataHash — hex string bytes32, e.g. ethers.id("data")
   * @returns {{ tokenId: string, txHash: string }}
   */
  async bindIdentity({ to, uri, behaviorHash, isAgent, accountableHuman, offchainDataHash }) {
    const human   = accountableHuman || ethers.ZeroAddress;
    const dataHash = offchainDataHash || ethers.ZeroHash;

    const tx = await this.contract.bindIdentity(
      to,
      uri,
      behaviorHash,
      isAgent,
      human,
      dataHash,
      { value: ethers.parseEther(IBT_CONFIG.MINT_FEE_ETH) }
    );

    const receipt = await tx.wait();

    // Extract tokenId from IdentityBound event
    const event = receipt.logs
      .map(log => { try { return this.contract.interface.parseLog(log); } catch { return null; } })
      .find(e => e && e.name === "IdentityBound");

    const tokenId = event ? event.args.tokenId.toString() : null;
    console.log("[IBT] Identity bound. tokenId:", tokenId, "tx:", receipt.hash);
    return { tokenId, txHash: receipt.hash };
  }

  /**
   * Update the coherence (K) score for a token.
   * @param {string|number} tokenId
   * @param {number} newK — 0 to 100
   */
  async updateCoherence(tokenId, newK) {
    if (newK < 0 || newK > 100) throw new Error("K must be 0–100");
    const tx = await this.contract.updateCoherence(tokenId, newK);
    const receipt = await tx.wait();
    console.log("[IBT] Coherence updated. tokenId:", tokenId, "K:", newK);
    return receipt;
  }

  /**
   * Suspend an agent identity.
   * @param {string|number} tokenId
   * @param {string} reason
   */
  async suspendAgent(tokenId, reason) {
    const tx = await this.contract.suspendAgent(tokenId, reason);
    const receipt = await tx.wait();
    console.log("[IBT] Agent suspended. tokenId:", tokenId);
    return receipt;
  }

  /**
   * Grant DRIFT_REPORTER_ROLE to an address.
   * Only callable by contract owner.
   */
  async grantDriftReporter(address) {
    const role = await this.readContract.DRIFT_REPORTER_ROLE();
    const tx   = await this.contract.grantRole(role, address);
    return await tx.wait();
  }

  // ─── READ ─────────────────────────────────────────────────────────────────

  /**
   * Get full identity record for a tokenId.
   * @param {string|number} tokenId
   * @returns {object} IdentityRecord
   */
  async getIdentity(tokenId) {
    const r = await this.readContract.getIdentity(tokenId);
    return {
      behaviorHash:     r.behaviorHash,
      birthTimestamp:   new Date(Number(r.birthTimestamp) * 1000).toISOString(),
      currentK:         Number(r.currentK),
      isAgent:          r.isAgent,
      suspended:        r.suspended,
      accountableHuman: r.accountableHuman,
      offchainDataHash: r.offchainDataHash,
    };
  }

  /**
   * Check if an address has already bound an identity.
   * @param {string} address
   * @returns {boolean}
   */
  async hasBound(address) {
    return await this.readContract.hasBound(address || this.userAddress);
  }

  /**
   * Get the current coherence score.
   * @param {string|number} tokenId
   * @returns {number} 0–100
   */
  async coherenceOf(tokenId) {
    const k = await this.readContract.coherenceOf(tokenId);
    return Number(k);
  }

  /**
   * Get total identities minted.
   * @returns {string}
   */
  async totalSupply() {
    const n = await this.readContract.totalSupply();
    return n.toString();
  }

  /**
   * Get current mint fee in ETH.
   * @returns {string} e.g. "0.005"
   */
  async getMintFee() {
    const fee = await this.readContract.MINT_FEE();
    return ethers.formatEther(fee);
  }

  // ─── HELPERS ──────────────────────────────────────────────────────────────

  /**
   * Hash a string to bytes32 for offchainDataHash.
   * @param {string} data — e.g. "Gerald Gonzalez|1967-04-25|Taurus"
   * @returns {string} bytes32 hex
   */
  static hashOffchainData(data) {
    return ethers.id(data);
  }

  /**
   * Listen for new identity bindings in real-time.
   * @param {function} callback — called with { tokenId, holder, accountableHuman, isAgent }
   */
  listenForBindings(callback) {
    this.readContract.on("IdentityBound", (tokenId, holder, accountableHuman, isAgent) => {
      callback({
        tokenId: tokenId.toString(),
        holder,
        accountableHuman,
        isAgent,
      });
    });
  }

  /**
   * Listen for coherence updates in real-time.
   * @param {function} callback — called with { tokenId, newK }
   */
  listenForCoherenceUpdates(callback) {
    this.readContract.on("CoherenceUpdated", (tokenId, newK) => {
      callback({ tokenId: tokenId.toString(), newK: Number(newK) });
    });
  }
}

// ─── EXPORT ──────────────────────────────────────────────────────────────────

// Browser (no module system):
window.IdentityClient = IdentityClient;
window.IBT_CONFIG     = IBT_CONFIG;

// ES modules / Node:
if (typeof module !== "undefined") {
  module.exports = { IdentityClient, IBT_CONFIG };
}
