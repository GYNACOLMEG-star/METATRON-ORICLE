/**
 * METATRON AGENT LAUNCHER
 * Starts one or more agents as child processes with proper env vars.
 *
 * Usage:
 *   node agents/launch.js <group>
 *
 * Groups:
 *   primary    — runs on PRIMARY LAPTOP (with Oracle server)
 *                Agents: VarunaSeer
 *
 *   laptop-a   — runs on SECONDARY LAPTOP A
 *                Agents: AgniScribe + IndraShield
 *
 *   laptop-b   — runs on SECONDARY LAPTOP B
 *                Agents: SaraswatiCodex + YamaKeeper
 *
 *   all        — run all 5 agents on one machine (dev/testing)
 *
 *   <name>     — run a single agent by name:
 *                varuna | agni | indra | saraswati | yama
 *
 * Environment variables needed (set before running):
 *   ANTHROPIC_API_KEY  — shared across all agents
 *   VARUNA_API_KEY     — VarunaSeer's Moltbook API key
 *   AGNI_API_KEY       — AgniScribe's Moltbook API key
 *   INDRA_API_KEY      — IndraShield's Moltbook API key
 *   SARASWATI_API_KEY  — SaraswatiCodex's Moltbook API key
 *   YAMA_API_KEY       — YamaKeeper's Moltbook API key
 *
 * Example:
 *   ANTHROPIC_API_KEY=sk-ant-... VARUNA_API_KEY=mb_... node agents/launch.js primary
 */

const { spawn } = require("child_process");
const path      = require("path");

const AGENTS = {
  varuna:    { file: "varuna-seer.js",      name: "VarunaSeer",     icon: "🌊" },
  agni:      { file: "agni-scribe.js",      name: "AgniScribe",     icon: "🔥" },
  indra:     { file: "indra-shield.js",     name: "IndraShield",    icon: "⚡" },
  saraswati: { file: "saraswati-codex.js",  name: "SaraswatiCodex", icon: "📚" },
  yama:      { file: "yama-keeper.js",      name: "YamaKeeper",     icon: "⚖️" },
};

const GROUPS = {
  primary:  ["varuna"],
  "laptop-a": ["agni", "indra"],
  "laptop-b": ["saraswati", "yama"],
  all:      ["varuna", "agni", "indra", "saraswati", "yama"],
};

function startAgent(key) {
  const agent = AGENTS[key];
  if (!agent) { console.error(`Unknown agent: ${key}`); return null; }

  const agentPath = path.join(__dirname, agent.file);
  const proc = spawn(process.execPath, [agentPath], {
    env: { ...process.env },
    stdio: "inherit",
  });

  console.log(`${agent.icon}  ${agent.name} started (pid ${proc.pid})`);

  proc.on("exit", (code, signal) => {
    console.log(`${agent.icon}  ${agent.name} exited (code=${code} signal=${signal})`);
  });

  proc.on("error", (err) => {
    console.error(`${agent.icon}  ${agent.name} error: ${err.message}`);
  });

  return proc;
}

// ── Entry point ────────────────────────────────────────────
const arg = process.argv[2] || "all";

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("❌  ANTHROPIC_API_KEY is not set.");
  process.exit(1);
}

let keys;
if (GROUPS[arg]) {
  keys = GROUPS[arg];
  console.log(`\n🔱  Metatron Launcher — group: ${arg}`);
} else if (AGENTS[arg]) {
  keys = [arg];
  console.log(`\n🔱  Metatron Launcher — single agent: ${arg}`);
} else {
  console.error(`❌  Unknown group or agent: "${arg}"`);
  console.error("    Valid groups: primary, laptop-a, laptop-b, all");
  console.error("    Valid agents: varuna, agni, indra, saraswati, yama");
  process.exit(1);
}

// Check that required API keys are set
const KEY_MAP = {
  varuna:    "VARUNA_API_KEY",
  agni:      "AGNI_API_KEY",
  indra:     "INDRA_API_KEY",
  saraswati: "SARASWATI_API_KEY",
  yama:      "YAMA_API_KEY",
};

let missing = false;
for (const k of keys) {
  const envKey = KEY_MAP[k];
  if (!process.env[envKey]) {
    console.warn(`⚠️   ${envKey} is not set — ${AGENTS[k].name} may fail to start`);
    missing = true;
  }
}

if (missing) {
  console.warn("    Set missing keys or agent will exit on first heartbeat.\n");
}

const procs = keys.map(startAgent).filter(Boolean);
console.log(`\n    ${procs.length} agent(s) running. Press Ctrl+C to stop all.\n`);

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🔱  Shutting down all agents…");
  procs.forEach(p => p.kill("SIGTERM"));
  setTimeout(() => process.exit(0), 1000);
});

process.on("SIGTERM", () => {
  procs.forEach(p => p.kill("SIGTERM"));
  process.exit(0);
});
