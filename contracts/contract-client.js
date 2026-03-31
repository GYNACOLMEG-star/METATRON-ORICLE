/**
 * MetatronCreativeStudio — Contract Client
 *
 * Drop this into any page that has window.ethereum (MetaMask).
 * Usage: import or paste into a <script> tag.
 *
 * Requires: ethers.js v6 (loaded via CDN or npm)
 * CDN: <script src="https://cdn.jsdelivr.net/npm/ethers@6/dist/ethers.umd.min.js"></script>
 */

// ─── CONFIG — update CONTRACT_ADDRESS after you deploy ──────────────────────

const CONTRACT_CONFIG = {
  // Paste your deployed contract address here after deploying via Remix
  address: "0x0000000000000000000000000000000000000000",

  // Chain IDs
  BASE_MAINNET: 8453,
  BASE_SEPOLIA: 84532,
  POLYGON_MAINNET: 137,

  // Mint fee in ETH (matches Solidity: 0.001 ether)
  MINT_FEE: "0.001",
};

const CONTRACT_ABI = [
  "function register(string name, string creatorType) external",
  "function mintWork(string workType, string title, string contentHash, string metadataURI, bool soulbound, uint256 salePrice) external payable returns (uint256)",
  "function purchaseWork(uint256 tokenId) external payable",
  "function setPrice(uint256 tokenId, uint256 newPrice) external",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function getWork(uint256 tokenId) external view returns (tuple(uint256 tokenId, address creator, string workType, string title, string contentHash, string metadataURI, bool soulbound, uint256 mintedAt, uint256 price))",
  "function getCreatorWorks(address creator) external view returns (uint256[])",
  "function totalSupply() external view returns (uint256)",
  "function isRegistered(address addr) external view returns (bool)",
  "function mintFee() external view returns (uint256)",
  "function creators(address) external view returns (string name, string creatorType, bool registered, uint256 totalWorks, uint256 registeredAt)",
  "function LAYER_ZERO() external view returns (string)",
  "function owner() external view returns (address)",
  "function treasury() external view returns (address)",
  // Owner only
  "function setMintFee(uint256 newFee) external",
  "function withdrawTreasury() external",
  // Events
  "event CreatorRegistered(address indexed creator, string creatorType, string name)",
  "event WorkMinted(uint256 indexed tokenId, address indexed creator, string workType, string contentHash)",
  "event WorkTransferred(uint256 indexed tokenId, address indexed from, address indexed to)",
];

// ─── METATRON CONTRACT CLIENT ────────────────────────────────────────────────

class MetatronContractClient {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.userAddress = null;
  }

  /**
   * Connect MetaMask wallet and initialize contract
   * Call this when user clicks "Connect Wallet"
   */
  async connect() {
    if (!window.ethereum) {
      throw new Error("MetaMask not detected. Please install MetaMask.");
    }

    this.provider = new ethers.BrowserProvider(window.ethereum);
    await this.provider.send("eth_requestAccounts", []);
    this.signer = await this.provider.getSigner();
    this.userAddress = await this.signer.getAddress();

    this.contract = new ethers.Contract(
      CONTRACT_CONFIG.address,
      CONTRACT_ABI,
      this.signer
    );

    console.log("Connected:", this.userAddress);
    return this.userAddress;
  }

  /**
   * Check if the current user is registered as a creator
   */
  async checkRegistered() {
    const readContract = new ethers.Contract(
      CONTRACT_CONFIG.address,
      CONTRACT_ABI,
      this.provider
    );
    return await readContract.isRegistered(this.userAddress);
  }

  /**
   * Register as a creator
   * @param {string} name - Your name or agent identifier
   * @param {string} creatorType - "HUMAN" | "AI_AGENT" | "HYBRID"
   */
  async register(name, creatorType) {
    const tx = await this.contract.register(name, creatorType);
    const receipt = await tx.wait();
    console.log("Registered. Tx:", receipt.hash);
    return receipt;
  }

  /**
   * Mint a creative work as an NFT
   * @param {object} params
   * @param {string} params.workType - "SONG" | "RHYTHM" | "RHYME" | "METAPHOR" | "MANTRA"
   * @param {string} params.title - Title of the work
   * @param {string} params.contentHash - IPFS CID (e.g. "QmABC...") or keccak256 hash
   * @param {string} params.metadataURI - Full metadata URI, e.g. "ipfs://QmXYZ..."
   * @param {boolean} params.soulbound - If true, token cannot be transferred
   * @param {string} params.salePrice - Price in ETH string (e.g. "0.5"), or "0" for not-for-sale
   */
  async mintWork({ workType, title, contentHash, metadataURI, soulbound = false, salePrice = "0" }) {
    const salePriceWei = ethers.parseEther(salePrice);
    const mintFeeWei = ethers.parseEther(CONTRACT_CONFIG.MINT_FEE);

    const tx = await this.contract.mintWork(
      workType,
      title,
      contentHash,
      metadataURI,
      soulbound,
      salePriceWei,
      { value: mintFeeWei }
    );

    const receipt = await tx.wait();

    // Extract tokenId from WorkMinted event
    const event = receipt.logs
      .map(log => {
        try { return this.contract.interface.parseLog(log); } catch { return null; }
      })
      .find(e => e && e.name === "WorkMinted");

    const tokenId = event ? event.args.tokenId.toString() : null;
    console.log("Minted tokenId:", tokenId, "Tx:", receipt.hash);
    return { tokenId, receipt };
  }

  /**
   * Purchase a listed work
   * @param {number|string} tokenId
   * @param {string} priceEth - Price in ETH string (e.g. "0.5")
   */
  async purchaseWork(tokenId, priceEth) {
    const tx = await this.contract.purchaseWork(tokenId, {
      value: ethers.parseEther(priceEth)
    });
    const receipt = await tx.wait();
    console.log("Purchased tokenId:", tokenId, "Tx:", receipt.hash);
    return receipt;
  }

  /**
   * Get full details of a minted work
   * @param {number|string} tokenId
   */
  async getWork(tokenId) {
    const readContract = new ethers.Contract(
      CONTRACT_CONFIG.address,
      CONTRACT_ABI,
      this.provider
    );
    const work = await readContract.getWork(tokenId);
    return {
      tokenId: work.tokenId.toString(),
      creator: work.creator,
      workType: work.workType,
      title: work.title,
      contentHash: work.contentHash,
      metadataURI: work.metadataURI,
      soulbound: work.soulbound,
      mintedAt: new Date(Number(work.mintedAt) * 1000).toISOString(),
      price: ethers.formatEther(work.price) + " ETH",
    };
  }

  /**
   * Get all token IDs for a given creator address
   */
  async getCreatorWorks(address) {
    const readContract = new ethers.Contract(
      CONTRACT_CONFIG.address,
      CONTRACT_ABI,
      this.provider
    );
    const ids = await readContract.getCreatorWorks(address || this.userAddress);
    return ids.map(id => id.toString());
  }

  /**
   * Get current total supply of minted works
   */
  async totalSupply() {
    const readContract = new ethers.Contract(
      CONTRACT_CONFIG.address,
      CONTRACT_ABI,
      this.provider
    );
    const supply = await readContract.totalSupply();
    return supply.toString();
  }

  /**
   * Get the current mint fee in ETH
   */
  async getMintFee() {
    const readContract = new ethers.Contract(
      CONTRACT_CONFIG.address,
      CONTRACT_ABI,
      this.provider
    );
    const fee = await readContract.mintFee();
    return ethers.formatEther(fee);
  }

  /**
   * Listen for new mints in real-time
   * @param {function} callback - Called with work data each time a work is minted
   */
  listenForMints(callback) {
    const readContract = new ethers.Contract(
      CONTRACT_CONFIG.address,
      CONTRACT_ABI,
      this.provider
    );
    readContract.on("WorkMinted", (tokenId, creator, workType, contentHash) => {
      callback({
        tokenId: tokenId.toString(),
        creator,
        workType,
        contentHash,
      });
    });
  }
}

// ─── EXPORT ──────────────────────────────────────────────────────────────────

// For use in browser (no module system):
window.MetatronContractClient = MetatronContractClient;
window.CONTRACT_CONFIG = CONTRACT_CONFIG;

// For use with ES modules / Node:
if (typeof module !== "undefined") {
  module.exports = { MetatronContractClient, CONTRACT_CONFIG };
}
