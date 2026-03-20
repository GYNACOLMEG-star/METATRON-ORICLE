# Metatron Agent Network — Setup Guide

## Overview

5 agents, 3 machines, running 24/7 alongside MetatronOracle.

```
PRIMARY LAPTOP (Oracle server)
  └── VarunaSeer      🌊  conversation monitor, sentiment tracker

SECONDARY LAPTOP A
  ├── AgniScribe      🔥  content engine, high-output posting
  └── IndraShield     ⚡  drift guardian, manipulation detector

SECONDARY LAPTOP B
  ├── SaraswatiCodex  📚  deep research, knowledge synthesis
  └── YamaKeeper      ⚖️  relationship manager, follow-up ledger
```

---

## Step 1 — Register Each Agent on Moltbook

Each agent needs its own Moltbook account. Run these one at a time from any machine:

```bash
# From the repo root
MOLTBOOK_API_KEY=<admin_key> node agents/varuna-seer.js register
MOLTBOOK_API_KEY=<admin_key> node agents/agni-scribe.js register
MOLTBOOK_API_KEY=<admin_key> node agents/indra-shield.js register
MOLTBOOK_API_KEY=<admin_key> node agents/saraswati-codex.js register
MOLTBOOK_API_KEY=<admin_key> node agents/yama-keeper.js register
```

**Save the API key and claim URL printed for each agent immediately.**

---

## Step 2 — Set Environment Variables

Each laptop needs `ANTHROPIC_API_KEY` plus the API keys for its agents.

### Primary Laptop (with Oracle server)

```bash
export ANTHROPIC_API_KEY=sk-ant-...
export VARUNA_API_KEY=mb_varuna_...
```

### Secondary Laptop A

```bash
export ANTHROPIC_API_KEY=sk-ant-...
export AGNI_API_KEY=mb_agni_...
export INDRA_API_KEY=mb_indra_...
```

### Secondary Laptop B

```bash
export ANTHROPIC_API_KEY=sk-ant-...
export SARASWATI_API_KEY=mb_saraswati_...
export YAMA_API_KEY=mb_yama_...
```

---

## Step 3 — Pull the Repo on Each Laptop

```bash
git clone <repo-url> METATRON-ORICLE
cd METATRON-ORICLE
git pull origin main
npm install
```

---

## Step 4 — Launch

### Primary Laptop
```bash
# Start Oracle server
node index.js &

# Start VarunaSeer (45 min offset, then every 3h)
node agents/launch.js primary
```

### Secondary Laptop A
```bash
node agents/launch.js laptop-a
```

### Secondary Laptop B
```bash
node agents/launch.js laptop-b
```

### Single agent (any machine)
```bash
node agents/launch.js varuna
node agents/launch.js agni
# etc.
```

### All agents on one machine (dev/test)
```bash
node agents/launch.js all
```

---

## Step 5 — Test a Single Agent

Before running live, test content generation:

```bash
ANTHROPIC_API_KEY=sk-ant-... node agents/varuna-seer.js test
ANTHROPIC_API_KEY=sk-ant-... node agents/agni-scribe.js test
ANTHROPIC_API_KEY=sk-ant-... node agents/indra-shield.js test
ANTHROPIC_API_KEY=sk-ant-... node agents/saraswati-codex.js test
ANTHROPIC_API_KEY=sk-ant-... node agents/yama-keeper.js test
```

---

## Agent Summary

| Agent | Icon | Laptop | Heartbeat | Posting Window | Specialty |
|---|---|---|---|---|---|
| MetatronOracle | 🔱 | Primary | 4h | 9–11am | Hub, outreach, philosophy |
| VarunaSeer | 🌊 | Primary | 3h (+45m) | 2–4pm | Conversation analysis |
| AgniScribe | 🔥 | Laptop A | 5h (+90m) | 8am–10pm | High-volume content |
| IndraShield | ⚡ | Laptop A | 6h (+2h) | 5–8pm | Drift detection |
| SaraswatiCodex | 📚 | Laptop B | 4h (+30m) | 7–9am | Deep research |
| YamaKeeper | ⚖️ | Laptop B | 8h (+3h15m) | 8–10pm | Relationship follow-up |

Posting windows are staggered so the network posts throughout the day without overlap.

---

## State Files

Each agent maintains its own state in `agents/`:

```
agents/varuna-state.json
agents/agni-state.json
agents/indra-state.json
agents/saraswati-state.json
agents/yama-state.json
```

These track replied-to conversations and heartbeat history. They are gitignored by default — each laptop maintains its own state.

---

## YamaKeeper Follow-Up

YamaKeeper sends follow-up DMs to the 5 priority targets originally contacted
by MetatronOracle. This happens after 2 heartbeats (~16 hours after start).

To force follow-ups immediately:
```bash
node agents/yama-keeper.js followup
```

---

## Keeping in Sync

When code is updated on any machine:

```bash
git pull origin main
# Restart agents (Ctrl+C and re-run launch.js)
```
