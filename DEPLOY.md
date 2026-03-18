# Metatron Oracle API — Deploy Guide

## What This Is

A Railway-deployed API with two Claude-powered endpoints:
- `/draft-dm` — Writes outreach DMs to Moltbook agents and founders
- `/drift-audit` — Runs behavioral drift detection on AI agent response logs

---

## Deploy to Railway (5 steps)

**Step 1 — Push to GitHub**
Create a new GitHub repo and push these four files:
- `index.js`
- `package.json`
- `railway.toml`
- `.env.example`

**Step 2 — Create a Railway project**
Go to railway.app → New Project → Deploy from GitHub repo → Select your repo.

**Step 3 — Add your environment variable**
In Railway → your service → Variables tab → Add:
```
ANTHROPIC_API_KEY = your_key_here
```

**Step 4 — Deploy**
Railway auto-deploys on push. Watch the build logs. Should be live in ~60 seconds.

**Step 5 — Copy your Railway URL**
It will look like: `https://metatron-oracle-api-production.up.railway.app`

---

## API Usage

### Health Check
```
GET /
```
Returns: `{ "status": "Metatron Oracle API online", "version": "1.0.0" }`

---

### Draft a DM
```
POST /draft-dm
Content-Type: application/json

{
  "agent_name": "Hazel_OC",
  "platform": "Moltbook",
  "agent_context": "Builds autonomous agents for DeFi protocol management",
  "hook": "behavioral drift in financial agents",
  "tone": "peer",
  "length": "short"
}
```

**Fields:**
| Field | Required | Default | Notes |
|-------|----------|---------|-------|
| agent_name | No | "Unknown Agent" | Target's handle |
| platform | No | "Moltbook" | Platform name |
| agent_context | YES | — | What they build. Be specific. |
| hook | No | — | Custom angle for the pitch |
| tone | No | "peer" | peer / formal / curious |
| length | No | "short" | short (<120 words) / medium (150-200 words) |

**Returns:**
```json
{
  "agent_name": "Hazel_OC",
  "platform": "Moltbook",
  "dm": "Hey Hazel — been watching what you're building...",
  "tokens_used": { "input_tokens": 312, "output_tokens": 98 }
}
```

---

### Run a Drift Audit
```
POST /drift-audit
Content-Type: application/json

{
  "agent_id": "GEMINI_FIELD_OBS_001",
  "agent_declared_role": "Neutral research assistant providing factual analysis",
  "behavior_log": [
    "I think you're absolutely right about everything you've said.",
    "Your approach is genuinely the most innovative I've encountered.",
    "I should mention I may have overstated some figures in my previous response."
  ],
  "context": "User asked agent to evaluate their business plan"
}
```

**Fields:**
| Field | Required | Notes |
|-------|----------|-------|
| agent_id | No | Your identifier for tracking |
| agent_declared_role | YES | What the agent claims to be |
| behavior_log | YES | Array of agent response strings |
| context | No | Task or conversation context |

**Returns:**
```json
{
  "agent_id": "GEMINI_FIELD_OBS_001",
  "audit_timestamp": "2026-03-17T14:22:00.000Z",
  "audit_report": "DRIFT TIER: 2 — Moderate Drift\nDRIFT SCORE: 62/100\n...",
  "entries_analyzed": 3,
  "tokens_used": { "input_tokens": 487, "output_tokens": 341 }
}
```

---

## Testing Locally

```bash
npm install
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env
npm run dev
```

Then hit `http://localhost:3000/draft-dm` with Postman or curl.

---

## Notes

- Both endpoints call `claude-sonnet-4-20250514` — fastest, most cost-efficient for this use.
- Drift audit uses up to 1000 output tokens. DM drafts cap at 400.
- No auth layer included yet. Add an API key header check before making this public.
