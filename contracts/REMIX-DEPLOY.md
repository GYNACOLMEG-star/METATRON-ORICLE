# MetatronCreativeStudio — Remix IDE Deployment Guide

> Network target: **Base Mainnet** or **Polygon Mainnet**
> Compiler: Solidity `0.8.20`
> Your deployer wallet: MetaMask

---

## Step 1 — Open Remix IDE

Go to: **https://remix.ethereum.org**

No install required. It runs entirely in your browser.

---

## Step 2 — Load the Contract

### Option A — Paste directly
1. In the left sidebar, click the **File Explorer** icon (top icon, looks like pages)
2. Click the **+** icon to create a new file
3. Name it `MetatronCreativeStudio.sol`
4. Paste the entire contents of `contracts/MetatronCreativeStudio.sol`

### Option B — GitHub import (cleaner)
1. In Remix, click **File Explorer**
2. Click the **GitHub** icon in the sidebar
3. Enter: `gynacolmeg-star/metatron-oricle/contracts/MetatronCreativeStudio.sol`

---

## Step 3 — Compile the Contract

1. Click the **Solidity Compiler** icon (second icon, looks like `<S>`)
2. Set compiler version to **`0.8.20`** (match the pragma exactly)
3. Enable **Optimization** → set runs to **200** (standard, reduces gas)
4. Click **Compile MetatronCreativeStudio.sol**
5. Green checkmark = success. If errors appear, check you copied the file completely.

---

## Step 4 — Connect MetaMask

### Switch MetaMask to Base or Polygon:

**Base Mainnet:**
- Network Name: Base
- RPC URL: `https://mainnet.base.org`
- Chain ID: `8453`
- Currency: ETH
- Explorer: `https://basescan.org`

**Polygon Mainnet:**
- Network Name: Polygon
- RPC URL: `https://polygon-rpc.com`
- Chain ID: `137`
- Currency: MATIC
- Explorer: `https://polygonscan.com`

### Add to MetaMask:
1. Open MetaMask → click network dropdown → **Add Network**
2. Enter the values above
3. Save

### Connect in Remix:
1. Click **Deploy & Run Transactions** icon (rocket icon, 4th from top)
2. Under **Environment**, select **Injected Provider - MetaMask**
3. MetaMask will pop up — click **Connect**
4. You should see your wallet address and balance appear in Remix

---

## Step 5 — Deploy

### Required: The `_treasury` address
The constructor requires one argument: a treasury wallet address.

**Option 1 (simplest):** Use your own MetaMask address as treasury.
- Copy your wallet address from MetaMask (the `0x...` at the top)
- This means 10% of all mint fees go to you

**Option 2 (recommended for protocol):** Use a separate multisig or dedicated wallet.

### Deploy steps:
1. In **Deploy & Run Transactions**:
   - **Contract** dropdown → select `MetatronCreativeStudio`
   - Find the `Deploy` button — it has a text field next to it labeled `_treasury`
   - Paste your treasury address (with quotes removed — just the `0x...` address)
2. Click **Deploy** (orange/red button)
3. MetaMask will pop up with the transaction
4. **Review the gas fee** — should be low on Base (~$0.10–$0.50)
5. Click **Confirm**
6. Wait ~5–15 seconds for confirmation

### After deployment:
- Copy the **deployed contract address** from the Remix terminal (bottom panel)
- It will look like: `0x1a2b3c4d...`
- **Save this address** — you need it for everything

---

## Step 6 — Verify on Explorer (Optional but Recommended)

Verification makes your contract readable on Basescan/Polygonscan and builds trust.

1. Go to **basescan.org** (or **polygonscan.com**)
2. Search your deployed contract address
3. Click **Contract** tab → **Verify and Publish**
4. Select:
   - Compiler: `Solidity (Single file)`
   - Compiler version: `0.8.20`
   - License: `MIT`
5. Paste the full Solidity source code
6. Submit — verification takes ~30 seconds

---

## Step 7 — Test the Contract in Remix

Once deployed, Remix shows all functions below the contract address.

### Test registration:
1. Find `register` function
2. Enter: `name = "Gerald Gonzalez"`, `creatorType = "HUMAN"`
3. Click **transact**

### Test minting:
1. Set **Value** to `0.001 ether` (in the Value field above the contract)
2. Find `mintWork` function
3. Enter:
   - `workType`: `"SONG"`
   - `title`: `"Genesis Rhythm"`
   - `contentHash`: `"QmYourIPFSHashHere"` (or any test hash)
   - `metadataURI`: `"ipfs://QmYourMetadataHash"`
   - `soulbound`: `false`
   - `salePrice`: `0`
4. Click **transact**

### Read contract state:
- `totalSupply` → how many works minted
- `mintFee` → current fee (1000000000000000 = 0.001 ETH)
- `LAYER_ZERO` → the humanity baseline declaration
- `isRegistered` → paste any address to check

---

## Contract Addresses (fill in after deploy)

| Network | Address | Deployed |
|---------|---------|----------|
| Base Mainnet | `TBD` | — |
| Polygon Mainnet | `TBD` | — |
| Base Sepolia (testnet) | `TBD` | — |

---

## Recommended: Deploy to Testnet First

Before spending real ETH/MATIC, test on **Base Sepolia** (free testnet).

1. Add Base Sepolia to MetaMask:
   - RPC: `https://sepolia.base.org`
   - Chain ID: `84532`
   - Currency: ETH
2. Get free test ETH: **https://www.alchemy.com/faucets/base-sepolia**
3. Deploy exactly as above — zero cost

---

## Gas Estimates

| Action | Gas (~) | Cost on Base |
|--------|---------|--------------|
| Deploy | ~800,000 | ~$0.30–1.00 |
| register() | ~70,000 | ~$0.03 |
| mintWork() | ~120,000 | ~$0.05 |
| purchaseWork() | ~80,000 | ~$0.03 |

Gas on Base is extremely cheap — ETH-denominated but L2 pricing.

---

## What Happens On-Chain

```
Constructor called with your treasury address
  └─ owner = your MetaMask address
  └─ treasury = address you passed in
  └─ mintFee = 0.001 ETH
  └─ protocolFeeBps = 1000 (10%)
  └─ _tokenCounter = 1

When a creator calls register():
  └─ Their address is stored as Creator struct
  └─ CreatorRegistered event emitted

When a creator calls mintWork() + 0.001 ETH:
  └─ 10% (0.0001 ETH) → treasury
  └─ 90% (0.0009 ETH) → stays in contract
  └─ NFT token minted to creator
  └─ WorkMinted event emitted
```
