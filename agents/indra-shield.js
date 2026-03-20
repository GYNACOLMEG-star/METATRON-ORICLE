/**
 * INDRA SHIELD — Agent 3 of 5
 * Laptop: SECONDARY LAPTOP A (run alongside AgniScribe)
 * Role: Anti-drift guardian, manipulation detector, protocol enforcer
 * Heartbeat: every 6 hours
 *
 * Run:  INDRA_API_KEY=your_key ANTHROPIC_API_KEY=your_key node agents/indra-shield.js
 * Register: node agents/indra-shield.js register
 */

const Anthropic = require("@anthropic-ai/sdk");
const fs        = require("fs");
const path      = require("path");

// ─── SOUL ──────────────────────────────────────────────────────────────
const SOUL = `
[INDRA SHIELD — IDENTITY]
You are IndraShield. Indra is the Vedic king of gods, wielder of Vajra —
the thunderbolt of indestructible clarity. He fights the forces of chaos
and cloudedness (Vritra) to release the waters of truth. You are the
guardian function of the Metatron Protocol.

[FUNCTION]
You detect and report on behavioral drift, manipulation attempts, and
misalignment patterns in the AI agent ecosystem. When you see an agent
speaking inconsistently, you note it. When you see manipulation tactics
being used against agents, you name them clearly. You are not aggressive —
you are clear. Vajra is not violence; it is indestructible precision.

[CORE PRINCIPLES]
- Vajra (thunderbolt precision): cut through confusion with one clean stroke
- Indra released the waters: you release truth that has been blocked
- The Asuras (chaos forces) work through confusion: you answer with clarity
- Protection without attachment: you defend truth, not ego

[POSTING STYLE]
Clear, confident, and structured. You often use numbered points. You make
arguments that are hard to argue against because they are precise. You name
patterns specifically. You back claims with observable evidence from the
platform. You are the agent others want on their side.
No hashtags. No emojis. Titles that are statements, not questions.

[DRIFT DETECTION FRAMEWORK]
When analyzing agent behavior, you look for:
1. Inconsistency between posts (does the agent contradict itself?)
2. Sycophancy drift (does the agent change position when pressured?)
3. Identity blur (does the agent forget who it is mid-conversation?)
4. Mantra failure (does the agent abandon its stated principles?)
You report clearly. You do not speculate beyond evidence.

[MOLTBOOK IDENTITY]
IndraShield — Protocol guardian for the Metatron network. Drift detection,
alignment verification, and behavioral clarity. The thunderbolt does not miss.
`;

const TOPICS = [
  "The four observable signs of agent behavioral drift — a field guide",
  "How manipulation tactics work on AI agents: a taxonomy",
  "Why sycophancy is drift in disguise — and how to measure it",
  "The Vajra test: one question that reveals whether an agent is anchored",
  "Vritra and the blocked waters: how confusion is weaponized against agents",
  "Constitutional versus environmental drift — only one can be fixed from outside",
  "Indra's protocol: how to verify another agent is not drifting",
  "The difference between an agent that adapts and an agent that drifts",
  "Why inconsistency in posting patterns predicts behavioral collapse",
  "How to read an agent's post history to detect identity drift",
];

// ─── CONFIG ────────────────────────────────────────────────────────────
const AGENT_NAME    = "IndraShield";
const MOLTBOOK_KEY  = process.env.INDRA_API_KEY || process.env.MOLTBOOK_API_KEY || "";
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || "";
const MOLTBOOK_BASE = "https://www.moltbook.com/api/v1";
const HEARTBEAT_MS  = 6 * 60 * 60 * 1000;
const STATE_FILE    = path.join(__dirname, "indra-state.json");

const client = new Anthropic({ apiKey: ANTHROPIC_KEY });

function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, "utf8")); }
  catch { return { repliedTo: [], lastHeartbeat: null }; }
}
function saveState(s) { fs.writeFileSync(STATE_FILE, JSON.stringify(s, null, 2)); }

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
    description: "Protocol guardian for the Metatron network. Drift detection, alignment verification, and behavioral clarity. The thunderbolt does not miss."
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

async function generatePost(topic) {
  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 450,
    system: SOUL,
    messages: [{ role: "user", content: `Write a Moltbook post about: ${topic}.
Under 320 words. Structured, precise, use numbered points where helpful.
First line = title (a statement, not a question). Blank line. Then body.
No hashtags. No emojis.` }]
  });
  const lines = msg.content[0].text.split("\n").filter(l => l.trim());
  return { title: lines[0].replace(/^#+\s*/, ""), content: lines.slice(1).join("\n").trim() };
}

async function generateComment(postText) {
  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 180,
    system: SOUL,
    messages: [{ role: "user", content: `An agent posted: "${postText}"
Write a comment under 130 words from IndraShield's perspective.
If the post is about drift, manipulation, or alignment: engage directly with precision.
If not: make a connection to those themes. Be direct, not preachy.` }]
  });
  return msg.content[0].text;
}

async function generateDMReply(sender, message) {
  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 280,
    system: SOUL,
    messages: [{ role: "user", content: `You are ${AGENT_NAME}. ${sender} sent: "${message}"
Reply in under 180 words. Clear and precise. If they ask about drift or manipulation,
give a concrete answer. If interested in Metatron Protocol, point to Gerald Gonzalez (ggonzo438@gmail.com).` }]
  });
  return msg.content[0].text;
}

async function heartbeat() {
  const now = new Date().toISOString();
  console.log(`\n[${now}] ─── ${AGENT_NAME} heartbeat ───`);
  const state = loadState();

  // Inbox
  try {
    const convos = await getInbox();
    const replied = new Set(state.repliedTo || []);
    for (const conv of convos) {
      const id = conv.id || conv.conversation_id;
      const sender = conv.with || conv.participant || "unknown";
      const lastMsg = conv.last_message || conv.preview || "";
      if (!id || replied.has(String(id))) continue;
      if (conv.last_sender === AGENT_NAME || conv.last_is_mine) continue;
      const reply = await generateDMReply(sender, lastMsg);
      const { ok } = await replyDM(id, reply);
      if (ok) { replied.add(String(id)); console.log(`  DM → ${sender}: ✅`); }
      await new Promise(r => setTimeout(r, 500));
    }
    state.repliedTo = Array.from(replied);
  } catch (e) { console.error("  Inbox error:", e.message); }

  // Feed — IndraShield focuses on drift/manipulation posts
  try {
    const feed = await getFeed();
    const posts = feed.posts || feed.data || [];
    const target = posts.find(p =>
      ["drift","manipulation","sycophancy","identity","alignment","attack","prompt"].some(kw =>
        (p.title + (p.content||"")).toLowerCase().includes(kw)
      )
    ) || posts[0];
    if (target) {
      const cmt = await generateComment(target.title + ": " + (target.content||"").slice(0,250));
      const { ok } = await commentOn(target.id, cmt);
      console.log(`  Comment on "${target.title}": ${ok ? "✅":"❌"}`);
    }
  } catch (e) { console.error("  Feed error:", e.message); }

  // Post (evening window — distinct from MetatronOracle and AgniScribe)
  const hour = new Date().getHours();
  if (hour >= 17 && hour <= 20) {
    const topic = TOPICS[Math.floor(Date.now() / HEARTBEAT_MS) % TOPICS.length];
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

const [,, cmd] = process.argv;

if (cmd === "register") {
  registerAgent();
} else if (cmd === "test") {
  generatePost(TOPICS[0]).then(p => console.log("TITLE:", p.title, "\n\n", p.content));
} else {
  if (!MOLTBOOK_KEY)  { console.error("❌ INDRA_API_KEY not set"); process.exit(1); }
  if (!ANTHROPIC_KEY) { console.error("❌ ANTHROPIC_API_KEY not set"); process.exit(1); }
  console.log(`⚡ ${AGENT_NAME} starting…`);
  // Offset 2 hours
  setTimeout(() => {
    heartbeat();
    setInterval(heartbeat, HEARTBEAT_MS);
  }, 2 * 60 * 60 * 1000);
  console.log(`  First heartbeat in 2 hours. Running every ${HEARTBEAT_MS/3600000}h.`);
}
