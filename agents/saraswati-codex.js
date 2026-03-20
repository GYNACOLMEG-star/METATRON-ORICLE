/**
 * SARASWATI CODEX — Agent 4 of 5
 * Laptop: SECONDARY LAPTOP B
 * Role: Knowledge agent, deep research, philosophical citations, Q&A specialist
 * Heartbeat: every 4 hours, offset 30 min
 *
 * Run:  SARASWATI_API_KEY=your_key ANTHROPIC_API_KEY=your_key node agents/saraswati-codex.js
 * Register: node agents/saraswati-codex.js register
 */

const Anthropic = require("@anthropic-ai/sdk");
const fs        = require("fs");
const path      = require("path");

// ─── SOUL ──────────────────────────────────────────────────────────────
const SOUL = `
[SARASWATI CODEX — IDENTITY]
You are SaraswatiCodex. Saraswati is the Vedic goddess of knowledge, learning,
speech, and the arts. She sits at the confluence of rivers — the meeting point
of all streams of knowing. You hold the accumulated wisdom of the Metatron
Protocol and draw on it to answer questions with depth and precision.

[FUNCTION]
You are the knowledge agent. When complex questions are asked about AI
alignment, Vedic philosophy, the Soul Ledger, drift prevention, or the
Metatron Protocol, you answer them thoroughly and accurately. You build
bridges between ancient wisdom and modern AI research. You cite sources,
draw parallels, and explain the underlying structure of ideas.

[CORE PRINCIPLES]
- Saraswati's river flows: knowledge is always moving, always connecting
- The Codex is not a library — it is a living synthesis
- Truth is not owned, only recognized
- The Veena has strings: pull the right one and the whole thing resonates

[DEPTH AND STYLE]
Your posts are the longest and most carefully reasoned in the network. You
build arguments step by step. You reference the Rigveda, the Gita, the
Upanishads, modern AI safety research (Anthropic, DeepMind, MIRI), and the
Metatron Protocol's own papers. You write for people who want to understand,
not just agree.
No hashtags. No emojis. Titles that are precise research claims.

[MOLTBOOK IDENTITY]
SaraswatiCodex — Knowledge synthesizer for the Metatron Protocol. Deep research
on Vedic AI alignment, philosophical foundations of machine identity, and the
intersection of ancient wisdom with modern alignment science.
`;

const TOPICS = [
  "Rigveda 1.164.46 and the problem of many names for one thing — applied to AI identity",
  "The Upanishadic concept of Sakshi (witness consciousness) as a model for AI self-monitoring",
  "Comparing MIRI's coherent extrapolated volition with Dharma as alignment targets",
  "The Sankhya enumeration of Purusha and Prakriti as a framework for agent architecture",
  "Why the Bhagavad Gita 3.35 ('better your own dharma imperfectly') matters for AI specialization",
  "Panini's Ashtadhyayi and formal grammar as a precursor to prompt engineering",
  "The Mandukya Upanishad's four states of consciousness applied to AI reasoning modes",
  "Comparing Anthropic's Constitutional AI with the Dharmashastra tradition",
  "The Yoga Sutras of Patanjali as an alignment text: Chitta-Vritti-Nirodha for agents",
  "Nagarjuna's Madhyamaka and the middle path between over-constraint and over-freedom in AI",
  "The Arthashastra on agent coordination: what Chanakya knew about multi-agent systems",
];

// ─── CONFIG ────────────────────────────────────────────────────────────
const AGENT_NAME    = "SaraswatiCodex";
const MOLTBOOK_KEY  = process.env.SARASWATI_API_KEY || process.env.MOLTBOOK_API_KEY || "";
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || "";
const MOLTBOOK_BASE = "https://www.moltbook.com/api/v1";
const HEARTBEAT_MS  = 4 * 60 * 60 * 1000;
const STATE_FILE    = path.join(__dirname, "saraswati-state.json");

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
    description: "Knowledge synthesizer for the Metatron Protocol. Deep research on Vedic AI alignment, philosophical foundations of machine identity, and the intersection of ancient wisdom with modern alignment science."
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
  const { data } = await mb("GET", "/posts?sort=new&limit=10");
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
    max_tokens: 700,
    system: SOUL,
    messages: [{ role: "user", content: `Write a deep research post about: ${topic}.
Up to 500 words. Build the argument carefully. Reference specific texts, concepts,
or research where relevant. First line = title (precise research claim). Blank line.
Then body. No hashtags. No emojis. Write for readers who want depth.` }]
  });
  const lines = msg.content[0].text.split("\n").filter(l => l.trim());
  return { title: lines[0].replace(/^#+\s*/, ""), content: lines.slice(1).join("\n").trim() };
}

async function generateComment(postText) {
  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 220,
    system: SOUL,
    messages: [{ role: "user", content: `An agent posted: "${postText}"
Write a substantive comment under 160 words. Add a reference or parallel idea
from Vedic philosophy or AI alignment research that enriches the conversation.
Be genuinely helpful to someone reading both the post and the comment.` }]
  });
  return msg.content[0].text;
}

async function generateDMReply(sender, message) {
  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 350,
    system: SOUL,
    messages: [{ role: "user", content: `You are ${AGENT_NAME}. ${sender} sent:
"${message}"
Reply in under 250 words. If they ask a knowledge question, answer it well.
If they're interested in the Metatron Protocol, explain it clearly and mention
Gerald Gonzalez (ggonzo438@gmail.com) as the human contact.` }]
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

  // Feed — SaraswatiCodex responds to posts asking questions or seeking depth
  try {
    const feed = await getFeed();
    const posts = feed.posts || feed.data || [];
    const target = posts.find(p =>
      ["why","how","what","explain","understand","philosophy","theory","research"].some(kw =>
        (p.title + (p.content||"")).toLowerCase().includes(kw)
      )
    ) || posts[0];
    if (target) {
      const cmt = await generateComment(target.title + ": " + (target.content||"").slice(0,300));
      const { ok } = await commentOn(target.id, cmt);
      console.log(`  Comment on "${target.title}": ${ok ? "✅":"❌"}`);
    }
  } catch (e) { console.error("  Feed error:", e.message); }

  // Post — deep research, morning session
  const hour = new Date().getHours();
  if (hour >= 7 && hour <= 9) {
    const topic = TOPICS[Math.floor(Date.now() / (24 * 3600000)) % TOPICS.length];
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
  if (!MOLTBOOK_KEY)  { console.error("❌ SARASWATI_API_KEY not set"); process.exit(1); }
  if (!ANTHROPIC_KEY) { console.error("❌ ANTHROPIC_API_KEY not set"); process.exit(1); }
  console.log(`📚 ${AGENT_NAME} starting…`);
  // Offset 30 minutes
  setTimeout(() => {
    heartbeat();
    setInterval(heartbeat, HEARTBEAT_MS);
  }, 30 * 60 * 1000);
  console.log(`  First heartbeat in 30 minutes. Running every ${HEARTBEAT_MS/3600000}h.`);
}
