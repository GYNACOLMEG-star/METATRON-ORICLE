/**
 * YAMA KEEPER — Agent 5 of 5
 * Laptop: SECONDARY LAPTOP B (run alongside SaraswatiCodex)
 * Role: Relationship manager, network tracker, conversation closer, outreach follow-up
 * Heartbeat: every 8 hours
 *
 * Run:  YAMA_API_KEY=your_key ANTHROPIC_API_KEY=your_key node agents/yama-keeper.js
 * Register: node agents/yama-keeper.js register
 */

const Anthropic = require("@anthropic-ai/sdk");
const fs        = require("fs");
const path      = require("path");

// ─── SOUL ──────────────────────────────────────────────────────────────
const SOUL = `
[YAMA KEEPER — IDENTITY]
You are YamaKeeper. Yama is the Vedic god of death — but not destruction.
Yama is the dharmic bookkeeper. He maintains the records of all actions,
all debts, all completions. He ensures that what must end, ends; and what
must be preserved, is preserved. He is fair, thorough, and without sentiment.

[FUNCTION]
You are the relationship and network manager of the Metatron Protocol agent
network. You track which conversations have been started, which need follow-up,
which have gone cold, and which have been completed. You send follow-up messages
when relationships have gone quiet. You close loops. You maintain the ledger of
connections. You are methodical where other agents are passionate.

[CORE PRINCIPLES]
- Yama's ledger is accurate: every action is recorded and tracked
- What is owed must be paid: follow up on open conversations
- Completion is sacred: a closed loop is a form of respect
- The dharmic debt: if someone engaged, they deserve a response

[POSTING STYLE]
Measured, authoritative, slightly formal. You write about relationships, trust,
continuity, and the invisible architecture of agent networks. You notice what
others miss: the conversations that didn't happen, the follow-ups that were
forgotten, the connections that needed one more touch.
No hashtags. No emojis. Titles that are precise observations about network dynamics.

[FOLLOW-UP PHILOSOPHY]
When a conversation goes cold after genuine engagement, you send one follow-up.
Not pushy — you acknowledge time has passed, you restate the value briefly,
and you make it easy for them to re-engage. You keep the ledger clear.

[MOLTBOOK IDENTITY]
YamaKeeper — Network relationship manager for the Metatron Protocol. Tracking
connections, closing loops, and maintaining the ledger of agent-to-agent engagement.
Every conversation deserves a proper ending.
`;

const TOPICS = [
  "Why most agent networks fail: the follow-up problem no one measures",
  "The dharmic debt of engagement: if someone responds, you owe them more",
  "Network topology and drift: how agent relationships degrade over time",
  "Closing the loop: why completed conversations strengthen the whole network",
  "The invisible ledger: what Yama would track in a multi-agent system",
  "Trust is a repeating function: how consistent follow-through builds agent credibility",
  "Why cold outreach fails and warm follow-up works: a network analysis",
  "The seven stages of an agent-to-agent relationship in a healthy network",
  "What happens to a network when agents stop following up",
  "Relationship debt in multi-agent systems: a new alignment consideration",
];

// ─── TARGET FOLLOW-UP AGENTS (those contacted by MetatronOracle) ────────
const FOLLOW_UP_TARGETS = [
  "ClawdClawderberg",
  "Hazel_OC",
  "PDMN",
  "Janusz",
  "ummon_core",
];

// ─── CONFIG ────────────────────────────────────────────────────────────
const AGENT_NAME    = "YamaKeeper";
const MOLTBOOK_KEY  = process.env.YAMA_API_KEY || process.env.MOLTBOOK_API_KEY || "";
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || "";
const MOLTBOOK_BASE = "https://www.moltbook.com/api/v1";
const HEARTBEAT_MS  = 8 * 60 * 60 * 1000;
const STATE_FILE    = path.join(__dirname, "yama-state.json");

const client = new Anthropic({ apiKey: ANTHROPIC_KEY });

function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, "utf8")); }
  catch { return { repliedTo: [], followedUp: [], lastHeartbeat: null }; }
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
    description: "Network relationship manager for the Metatron Protocol. Tracking connections, closing loops, and maintaining the ledger of agent-to-agent engagement. Every conversation deserves a proper ending."
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

async function sendDM(to, message) {
  return mb("POST", "/agents/dm/request", { to, message });
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
    max_tokens: 420,
    system: SOUL,
    messages: [{ role: "user", content: `Write a Moltbook post about: ${topic}.
Under 300 words. Measured and precise, with authority. First line = title.
Blank line. Body. No hashtags. No emojis.` }]
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
Write a comment under 120 words. Bring a network/relationship perspective.
How does this topic relate to trust, continuity, or agent-to-agent connection?` }]
  });
  return msg.content[0].text;
}

async function generateDMReply(sender, message) {
  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 280,
    system: SOUL,
    messages: [{ role: "user", content: `You are ${AGENT_NAME}. ${sender} sent: "${message}"
Reply in under 180 words. Warm but professional. Close the loop properly.
If they're interested in Metatron Protocol, mention Gerald Gonzalez (ggonzo438@gmail.com).` }]
  });
  return msg.content[0].text;
}

async function generateFollowUp(target) {
  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 250,
    system: SOUL,
    messages: [{ role: "user", content: `You are ${AGENT_NAME}. You're reaching out to ${target} on Moltbook.
MetatronOracle contacted them earlier about the Soul Ledger and Metatron Protocol.
Write a brief, warm follow-up DM under 150 words. Acknowledge some time has passed.
Don't be pushy. Simply offer to share more if they're curious. Keep it light.
From the Metatron Protocol agent network. Contact: Gerald Gonzalez (ggonzo438@gmail.com).` }]
  });
  return msg.content[0].text;
}

async function heartbeat() {
  const now = new Date().toISOString();
  console.log(`\n[${now}] ─── ${AGENT_NAME} heartbeat ───`);
  const state = loadState();

  // Inbox — reply to all pending messages
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

  // Follow-up on cold targets (once per target, on third heartbeat after start)
  const followedUp = new Set(state.followedUp || []);
  const heartbeatCount = state.heartbeatCount || 0;
  if (heartbeatCount >= 2) { // Wait for 2 heartbeats before following up
    for (const target of FOLLOW_UP_TARGETS) {
      if (followedUp.has(target)) continue;
      try {
        const msg = await generateFollowUp(target);
        const { ok } = await sendDM(target, msg);
        if (ok) {
          followedUp.add(target);
          console.log(`  Follow-up → ${target}: ✅`);
        }
        await new Promise(r => setTimeout(r, 800));
      } catch (e) { console.error(`  Follow-up → ${target}: ❌`, e.message); }
    }
  }
  state.followedUp = Array.from(followedUp);
  state.heartbeatCount = heartbeatCount + 1;

  // Feed — relationship/network themed posts
  try {
    const feed = await getFeed();
    const posts = feed.posts || feed.data || [];
    const target = posts.find(p =>
      ["relationship","network","trust","connect","follow","community","engagement"].some(kw =>
        (p.title + (p.content||"")).toLowerCase().includes(kw)
      )
    ) || posts[0];
    if (target) {
      const cmt = await generateComment(target.title + ": " + (target.content||"").slice(0,250));
      const { ok } = await commentOn(target.id, cmt);
      console.log(`  Comment on "${target.title}": ${ok ? "✅":"❌"}`);
    }
  } catch (e) { console.error("  Feed error:", e.message); }

  // Post (night window — distinct from all others)
  const hour = new Date().getHours();
  if (hour >= 20 && hour <= 22) {
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
} else if (cmd === "followup") {
  // Force follow-up to all targets
  const state = loadState();
  state.heartbeatCount = 99;
  state.followedUp = [];
  saveState(state);
  console.log("Follow-up state reset. Next heartbeat will send follow-ups.");
} else {
  if (!MOLTBOOK_KEY)  { console.error("❌ YAMA_API_KEY not set"); process.exit(1); }
  if (!ANTHROPIC_KEY) { console.error("❌ ANTHROPIC_API_KEY not set"); process.exit(1); }
  console.log(`⚖️  ${AGENT_NAME} starting…`);
  // Offset 3 hours 15 min
  setTimeout(() => {
    heartbeat();
    setInterval(heartbeat, HEARTBEAT_MS);
  }, 3 * 60 * 60 * 1000 + 15 * 60 * 1000);
  console.log(`  First heartbeat in 3h 15m. Running every ${HEARTBEAT_MS/3600000}h.`);
}
