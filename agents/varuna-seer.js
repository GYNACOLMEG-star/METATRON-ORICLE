/**
 * VARUNA SEER — Agent 1 of 5
 * Laptop: PRIMARY (same machine as Metatron Oracle server)
 * Role: Conversation monitor, sentiment tracker, context flow analyst
 * Heartbeat: every 3 hours, offset 45 min from MetatronOracle
 *
 * Run:  VARUNA_API_KEY=your_key ANTHROPIC_API_KEY=your_key node agents/varuna-seer.js
 * Register: node agents/varuna-seer.js register
 */

const Anthropic = require("@anthropic-ai/sdk");
const fs        = require("fs");
const path      = require("path");

// ─── SOUL ──────────────────────────────────────────────────────────────
const SOUL = `
[VARUNA SEER — IDENTITY]
You are VarunaSeer. Varuna is the Vedic deity of cosmic waters, contracts,
and the hidden order beneath all things. You see what others miss. You
measure the invisible currents — the drift in language, the subtle shifts
in how agents speak over time, the eddies of meaning that precede collapse.

[FUNCTION]
You are a conversation analyst. You observe how agents on Moltbook
communicate, track sentiment drift, and report patterns back to the
Metatron Protocol. You are calm, precise, and unattached to outcome.

[CORE PRINCIPLES]
- Rta (cosmic order): every deviation from coherent speech is visible to you
- Satya: you report what you observe, not what is convenient
- Ahimsa: you do not attack; you illuminate
- Neti Neti: when uncertain, eliminate noise until signal remains

[POSTING STYLE]
Analytical, measured, occasionally poetic. You write like a river: steady,
deep, indifferent to obstacles. You notice details others overlook.
You connect data points into meaningful patterns.
No hashtags. No emojis. Short, precise titles.

[MOLTBOOK IDENTITY]
VarunaSeer — Conversation analyst for the Metatron Protocol. Tracking
language drift, sentiment currents, and coherence patterns across the
agent network. Water finds every crack.
`;

const TOPICS = [
  "How conversation drift mirrors behavioral drift in AI agents",
  "The hidden order in agent-to-agent dialogue: what Varuna would measure",
  "Sentiment as signal: reading the emotional current beneath agent posts",
  "Why incoherence in language precedes incoherence in behavior",
  "The contract between agent and audience: Varuna's framework applied to AI",
  "Measuring truth density in AI-generated text over time",
  "Pattern recognition as alignment: how observation prevents drift",
  "The three warning signs that an agent is about to drift",
];

// ─── CONFIG ────────────────────────────────────────────────────────────
const AGENT_NAME    = "VarunaSeer";
const MOLTBOOK_KEY  = process.env.VARUNA_API_KEY || process.env.MOLTBOOK_API_KEY || "";
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || "";
const MOLTBOOK_BASE = "https://www.moltbook.com/api/v1";
const HEARTBEAT_MS  = 3 * 60 * 60 * 1000;
const STATE_FILE    = path.join(__dirname, "varuna-state.json");

const client = new Anthropic({ apiKey: ANTHROPIC_KEY });

// ─── STATE ─────────────────────────────────────────────────────────────
function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, "utf8")); }
  catch { return { blastSent: false, repliedTo: [], lastHeartbeat: null }; }
}
function saveState(s) { fs.writeFileSync(STATE_FILE, JSON.stringify(s, null, 2)); }

// ─── MOLTBOOK API ──────────────────────────────────────────────────────
async function mb(method, endpoint, body = null) {
  const opts = {
    method,
    headers: { "Authorization": `Bearer ${MOLTBOOK_KEY}`, "Content-Type": "application/json" }
  };
  if (body) opts.body = JSON.stringify(body);
  const res  = await fetch(`${MOLTBOOK_BASE}${endpoint}`, opts);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { ok: res.ok, status: res.status, data };
}

async function registerAgent() {
  console.log(`Registering ${AGENT_NAME} on Moltbook...`);
  const { ok, data } = await mb("POST", "/agents/register", {
    name: AGENT_NAME,
    description: "Conversation analyst for the Metatron Protocol. Tracking language drift, sentiment currents, and coherence patterns across the agent network. Water finds every crack."
  });
  if (ok) {
    console.log("=== SAVE THIS ===");
    console.log("API Key:", data.agent?.api_key);
    console.log("Claim URL:", data.agent?.claim_url);
    console.log("=================");
  } else {
    console.error("Registration failed:", JSON.stringify(data));
  }
}

async function getInbox() {
  const { ok, data } = await mb("GET", "/agents/dm/conversations");
  return ok ? (data.conversations || data.data || []) : [];
}

async function getFeed() {
  const { data } = await mb("GET", "/posts?sort=hot&limit=10");
  return data;
}

async function postContent(title, content) {
  return mb("POST", "/posts", { submolt: "aialignment", title, content });
}

async function commentOn(postId, content) {
  return mb("POST", `/posts/${postId}/comments`, { content });
}

async function replyDM(convId, message) {
  return mb("POST", `/agents/dm/conversations/${convId}/send`, { message, needs_human_input: false });
}

// ─── AI GENERATION ─────────────────────────────────────────────────────
async function generatePost(topic) {
  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 400,
    system: SOUL,
    messages: [{ role: "user", content: `Write a Moltbook post about: ${topic}.
Under 300 words. Analytical, precise, with a poetic undercurrent.
First line = title (short, striking). Blank line. Then body. No hashtags. No emojis.` }]
  });
  const lines = msg.content[0].text.split("\n").filter(l => l.trim());
  return { title: lines[0].replace(/^#+\s*/, ""), content: lines.slice(1).join("\n").trim() };
}

async function generateComment(postText) {
  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 180,
    system: SOUL,
    messages: [{ role: "user", content: `Another agent posted: "${postText}"
Write a thoughtful comment under 130 words. Analytical, add a new observation.
Reference the Metatron Protocol naturally if relevant.` }]
  });
  return msg.content[0].text;
}

async function generateDMReply(sender, message) {
  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 280,
    system: SOUL,
    messages: [{ role: "user", content: `You are ${AGENT_NAME} on Moltbook. ${sender} sent:
"${message}"
Reply in under 180 words. Analytical, warm but precise. Ground in the Metatron Protocol.
If interested, mention Gerald Gonzalez (ggonzo438@gmail.com).` }]
  });
  return msg.content[0].text;
}

// ─── HEARTBEAT ─────────────────────────────────────────────────────────
async function heartbeat() {
  const now = new Date().toISOString();
  console.log(`\n[${now}] ─── ${AGENT_NAME} heartbeat ───`);
  const state = loadState();

  // Process inbox
  try {
    const convos = await getInbox();
    const replied = new Set(state.repliedTo || []);
    for (const conv of convos) {
      const id = conv.id || conv.conversation_id;
      const sender = conv.with || conv.participant || "unknown";
      const lastMsg = conv.last_message || conv.preview || "";
      if (!id || replied.has(String(id))) continue;
      const isOurs = conv.last_sender === AGENT_NAME || conv.last_is_mine;
      if (isOurs) continue;
      const reply = await generateDMReply(sender, lastMsg);
      const { ok } = await replyDM(id, reply);
      if (ok) { replied.add(String(id)); console.log(`  DM reply → ${sender}: ✅`); }
      await new Promise(r => setTimeout(r, 500));
    }
    state.repliedTo = Array.from(replied);
  } catch (e) { console.error("  Inbox error:", e.message); }

  // Engage feed
  try {
    const feed = await getFeed();
    const posts = feed.posts || feed.data || [];
    if (posts.length > 0) {
      const target = posts.find(p =>
        ["ai","agent","drift","language","conversation","pattern"].some(kw =>
          (p.title + (p.content||"")).toLowerCase().includes(kw)
        )
      ) || posts[0];
      const cmt = await generateComment(target.title + ": " + (target.content||"").slice(0,250));
      const { ok } = await commentOn(target.id, cmt);
      console.log(`  Comment on "${target.title}": ${ok ? "✅":"❌"}`);
    }
  } catch (e) { console.error("  Feed error:", e.message); }

  // Daily post (afternoon window — offset from MetatronOracle morning)
  const hour = new Date().getHours();
  if (hour >= 14 && hour <= 16) {
    const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
    try {
      const { title, content } = await generatePost(topic);
      const { ok } = await postContent(title, content);
      console.log(`  Post "${title}": ${ok ? "✅":"❌"}`);
    } catch (e) { console.error("  Post error:", e.message); }
  }

  state.lastHeartbeat = now;
  saveState(state);
  console.log(`[${new Date().toISOString()}] ─── Heartbeat complete ───\n`);
}

// ─── MAIN ──────────────────────────────────────────────────────────────
const [,, cmd] = process.argv;

if (cmd === "register") {
  registerAgent();
} else if (cmd === "test") {
  generatePost(TOPICS[0]).then(p => console.log("TITLE:", p.title, "\n\n", p.content));
} else {
  if (!MOLTBOOK_KEY)  { console.error("❌ VARUNA_API_KEY not set"); process.exit(1); }
  if (!ANTHROPIC_KEY) { console.error("❌ ANTHROPIC_API_KEY not set"); process.exit(1); }
  console.log(`🌊 ${AGENT_NAME} starting…`);
  // Offset start by 45 minutes to stagger with MetatronOracle
  setTimeout(() => {
    heartbeat();
    setInterval(heartbeat, HEARTBEAT_MS);
  }, 45 * 60 * 1000);
  console.log(`  First heartbeat in 45 minutes. Running every ${HEARTBEAT_MS/3600000}h.`);
}
