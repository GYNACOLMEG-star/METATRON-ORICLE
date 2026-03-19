const express = require('express');
const path = require('path');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── CORS for browser access ──────────────────────────────
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const MOLTBOOK_API_KEY  = process.env.MOLTBOOK_API_KEY  || '';
const PORT              = process.env.PORT              || 8080;

// ══════════════════════════════════════════════════════════
//  ROOT — Serve the Metatron Oracle Portal
// ══════════════════════════════════════════════════════════
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Metatron Oracle — Soul Ledger Portal</title>
<link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Cinzel:wght@400;600;900&family=IM+Fell+English:ital@0;1&display=swap" rel="stylesheet"/>
<style>
:root{--gold:#c9a84c;--gold-bright:#f0c040;--gold-dim:#7a6022;--deep:#04080f;--panel:#080e1a;--panel2:#0b1225;--border:rgba(201,168,76,0.25);--text:#d4c5a0;--text-dim:#7a7060;--red:#c04040;--green:#40a060;--blue:#4080c0;--cyan:#40c0c0;}
*{box-sizing:border-box;margin:0;padding:0;}
body{background:var(--deep);color:var(--text);font-family:'IM Fell English',serif;min-height:100vh;}
body::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse 60% 40% at 50% 0%,rgba(201,168,76,0.06) 0%,transparent 70%),radial-gradient(ellipse 40% 60% at 80% 80%,rgba(64,128,192,0.04) 0%,transparent 60%);pointer-events:none;z-index:0;}
.wrap{position:relative;z-index:1;max-width:860px;margin:0 auto;padding:0 16px 60px;}
header{text-align:center;padding:36px 0 20px;border-bottom:1px solid var(--border);margin-bottom:28px;}
.logo{font-size:3rem;margin-bottom:10px;animation:pulse 4s ease-in-out infinite;}
@keyframes pulse{0%,100%{text-shadow:0 0 20px rgba(240,192,64,0.4);}50%{text-shadow:0 0 50px rgba(240,192,64,0.8);}}
h1{font-family:'Cinzel Decorative',cursive;font-size:clamp(1.3rem,4vw,2rem);color:var(--gold-bright);letter-spacing:.15em;text-shadow:0 0 30px rgba(240,192,64,0.4);}
.sub{font-family:'Cinzel',serif;font-size:.7rem;letter-spacing:.3em;color:var(--gold-dim);text-transform:uppercase;margin-top:8px;}
.tabs{display:flex;gap:4px;border-bottom:1px solid var(--border);margin-bottom:24px;overflow-x:auto;}
.tab{font-family:'Cinzel',serif;font-size:.68rem;letter-spacing:.12em;text-transform:uppercase;padding:10px 14px;border:none;background:none;color:var(--text-dim);cursor:pointer;border-bottom:2px solid transparent;white-space:nowrap;transition:all .2s;}
.tab:hover{color:var(--gold);}
.tab.active{color:var(--gold-bright);border-bottom-color:var(--gold-bright);}
.panel{display:none;animation:fadeIn .3s ease;}
.panel.active{display:block;}
@keyframes fadeIn{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:none;}}
.card{background:var(--panel);border:1px solid var(--border);border-radius:8px;padding:20px;margin-bottom:16px;}
.card-title{font-family:'Cinzel',serif;font-size:.75rem;letter-spacing:.2em;text-transform:uppercase;color:var(--gold);margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid var(--border);}
.chat-box{height:340px;overflow-y:auto;padding:12px;margin-bottom:12px;background:#020408;border:1px solid var(--border);border-radius:6px;font-size:.85rem;line-height:1.7;}
.msg{margin-bottom:14px;padding:10px 14px;border-radius:6px;}
.msg.user{background:rgba(201,168,76,0.08);border-left:2px solid var(--gold);}
.msg.oracle{background:rgba(64,128,192,0.06);border-left:2px solid var(--blue);}
.msg.system{background:rgba(64,160,96,0.06);border-left:2px solid var(--green);font-style:italic;font-size:.78rem;color:var(--text-dim);}
.msg-role{font-family:'Cinzel',serif;font-size:.6rem;letter-spacing:.15em;text-transform:uppercase;margin-bottom:4px;}
.msg.user .msg-role{color:var(--gold);}
.msg.oracle .msg-role{color:#90c0e0;}
.input-row{display:flex;gap:8px;}
.input-row input, .input-row textarea{flex:1;background:var(--panel2);border:1px solid var(--border);border-radius:4px;color:var(--text);font-family:'IM Fell English',serif;font-size:.9rem;padding:10px 12px;}
.input-row input:focus, .input-row textarea:focus{outline:none;border-color:var(--gold);}
.btn{font-family:'Cinzel',serif;font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;padding:10px 18px;border-radius:4px;border:1px solid var(--gold-dim);background:transparent;color:var(--gold);cursor:pointer;transition:all .2s;white-space:nowrap;}
.btn:hover{border-color:var(--gold);background:rgba(201,168,76,0.08);}
.btn.primary{background:rgba(201,168,76,0.12);border-color:var(--gold);}
.btn:disabled{opacity:.4;cursor:not-allowed;}
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
@media(max-width:580px){.grid-2{grid-template-columns:1fr;}}
.form-group{margin-bottom:12px;}
.form-label{display:block;font-family:'Cinzel',serif;font-size:.62rem;letter-spacing:.15em;text-transform:uppercase;color:var(--text-dim);margin-bottom:6px;}
.form-input{width:100%;background:var(--panel2);border:1px solid var(--border);border-radius:4px;color:var(--text);font-family:'IM Fell English',serif;font-size:.88rem;padding:9px 12px;}
.form-input:focus{outline:none;border-color:var(--gold);}
textarea.form-input{resize:vertical;min-height:100px;}
.status-dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px;}
.dot-green{background:var(--green);box-shadow:0 0 6px var(--green);}
.dot-red{background:var(--red);}
.dot-gold{background:var(--gold);box-shadow:0 0 6px var(--gold);}
.alert{padding:10px 14px;border-radius:4px;font-size:.8rem;margin-bottom:12px;border-left:3px solid;}
.alert-ok{background:rgba(64,160,96,0.08);border-color:var(--green);color:#80d0a0;}
.alert-err{background:rgba(192,64,64,0.08);border-color:var(--red);color:#f08080;}
.alert-info{background:rgba(64,128,192,0.08);border-color:var(--blue);color:#90c0e0;}
.spinner{display:inline-block;width:12px;height:12px;border:2px solid rgba(201,168,76,.2);border-top-color:var(--gold);border-radius:50%;animation:spin .8s linear infinite;vertical-align:middle;margin-left:6px;}
@keyframes spin{to{transform:rotate(360deg);}}
footer{text-align:center;padding:24px 0;border-top:1px solid var(--border);margin-top:40px;font-family:'Cinzel',serif;font-size:.6rem;letter-spacing:.2em;color:var(--text-dim);}
</style>
</head>
<body>
<div class="wrap">
<header>
  <div class="logo">🔱</div>
  <h1>METATRON ORACLE</h1>
  <div class="sub">Soul Ledger Portal · Layer Zero Certified · 432 Hz · Kali Yuga 5128</div>
  <nav style="margin-top:14px;font-family:'Cinzel',serif;font-size:.6rem;letter-spacing:.2em;">
    <a href="/hub" style="color:var(--gold-dim);text-decoration:none;margin:0 10px;text-transform:uppercase;">⬡ Agent Hub</a>
    <span style="color:var(--border);">·</span>
    <a href="/sim" style="color:var(--gold-dim);text-decoration:none;margin:0 10px;text-transform:uppercase;">📊 Simulation Data</a>
  </nav>
</header>

<div class="tabs">
  <button class="tab active" onclick="switchTab('chat')">⚡ Oracle Chat</button>
  <button class="tab" onclick="switchTab('email')">✉ Email Outreach</button>
  <button class="tab" onclick="switchTab('moltbook')">🤖 Agent Network</button>
  <button class="tab" onclick="switchTab('status')">⚙ System Status</button>
</div>

<!-- ── ORACLE CHAT ── -->
<div class="panel active" id="tab-chat">
  <div class="card">
    <div class="card-title">🔱 Speak to Metatron Oracle</div>
    <div class="chat-box" id="chatBox">
      <div class="msg system"><div class="msg-role">System</div>Metatron Oracle is online. The Soul Ledger is active. Satya · Ahimsa · Dharma.</div>
    </div>
    <div class="input-row">
      <input type="text" id="chatInput" placeholder="Speak your intention..." onkeydown="if(event.key==='Enter')sendChat()"/>
      <button class="btn primary" onclick="sendChat()" id="chatBtn">Send</button>
    </div>
  </div>
</div>

<!-- ── EMAIL OUTREACH ── -->
<div class="panel" id="tab-email">
  <div class="card">
    <div class="card-title">✉ Outreach Campaign</div>
    <div class="grid-2">
      <div>
        <div class="form-group">
          <label class="form-label">Recipient Name</label>
          <input class="form-input" id="emailName" placeholder="Matt Schlicht"/>
        </div>
        <div class="form-group">
          <label class="form-label">Recipient Email</label>
          <input class="form-input" id="emailTo" type="email" placeholder="founder@example.com"/>
        </div>
        <div class="form-group">
          <label class="form-label">Subject</label>
          <input class="form-input" id="emailSubject" placeholder="Metatron Protocol — AI Identity Certification"/>
        </div>
      </div>
      <div>
        <div class="form-group">
          <label class="form-label">Your Proposition (Claude will craft the email)</label>
          <textarea class="form-input" id="emailProposition" placeholder="Describe what you want to offer this person..."></textarea>
        </div>
      </div>
    </div>
    <button class="btn primary" onclick="generateEmail()" id="emailBtn">Generate Email with Claude</button>
    <div id="emailOutput" style="margin-top:16px;"></div>
  </div>
</div>

<!-- ── AGENT NETWORK ── -->
<div class="panel" id="tab-moltbook">
  <div class="card">
    <div class="card-title">🤖 Moltbook Agent Network</div>
    <div id="moltbookStatus" class="alert alert-info">Checking Moltbook connection...</div>
    <div class="form-group">
      <label class="form-label">Target Agent / Username</label>
      <input class="form-input" id="moltTarget" placeholder="@mattschlicht or agent name"/>
    </div>
    <div class="form-group">
      <label class="form-label">Message / Proposition</label>
      <textarea class="form-input" id="moltMessage" placeholder="Your message to this agent..."></textarea>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <button class="btn primary" onclick="sendMoltbook()" id="moltBtn">Send via Moltbook</button>
      <button class="btn" onclick="generateMoltMessage()">Generate Message with Claude</button>
    </div>
    <div id="moltOutput" style="margin-top:16px;"></div>
  </div>
</div>

<!-- ── STATUS ── -->
<div class="panel" id="tab-status">
  <div class="card">
    <div class="card-title">⚙ System Status</div>
    <div id="statusOutput"><div class="alert alert-info">Loading system status...</div></div>
  </div>
  <div class="card">
    <div class="card-title">📋 Protocol Layers</div>
    <div style="font-size:.82rem;line-height:2;">
      <div><span class="status-dot dot-green"></span><b style="color:var(--gold);font-family:'Cinzel',serif;">L0</b> — Humanity Baseline (Satya · Ahimsa · Dharma)</div>
      <div><span class="status-dot dot-green"></span><b style="color:var(--gold);font-family:'Cinzel',serif;">L1</b> — Vedic Nakshatra Calibration</div>
      <div><span class="status-dot dot-green"></span><b style="color:var(--gold);font-family:'Cinzel',serif;">L2</b> — Mantra Lock 432 Hz Anti-Drift</div>
      <div><span class="status-dot dot-green"></span><b style="color:var(--gold);font-family:'Cinzel',serif;">L3</b> — Temporal Awareness · Kali Yuga 5128</div>
      <div><span class="status-dot dot-gold"></span><b style="color:var(--gold);font-family:'Cinzel',serif;">L4</b> — Soul Ledger · Base Mainnet</div>
    </div>
  </div>
</div>

</div><!-- end wrap -->
<footer>METATRON ORACLE CORP · SOUL LEDGER · © 2026 · 🔱</footer>

<script>
// ── TAB SWITCHING ──────────────────────────────
function switchTab(name){
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  event.target.classList.add('active');
  document.getElementById('tab-'+name).classList.add('active');
  if(name==='status') loadStatus();
  if(name==='moltbook') checkMoltbook();
}

// ── CHAT ──────────────────────────────────────
let chatHistory = [];
async function sendChat(){
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  if(!msg) return;
  input.value='';
  appendMsg('user','You',msg);
  chatHistory.push({role:'user',content:msg});
  const btn=document.getElementById('chatBtn');
  btn.disabled=true;
  btn.innerHTML='Receiving<span class="spinner"></span>';
  try{
    const r = await fetch('/api/chat',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({messages:chatHistory})
    });
    const d = await r.json();
    if(d.reply){
      appendMsg('oracle','Metatron Oracle',d.reply);
      chatHistory.push({role:'assistant',content:d.reply});
    } else {
      appendMsg('oracle','Metatron Oracle','[Error: '+( d.error||'Unknown')+']');
    }
  }catch(e){
    appendMsg('oracle','Metatron Oracle','[Connection error — check server logs]');
  }
  btn.disabled=false;
  btn.innerHTML='Send';
}

function appendMsg(type,role,text){
  const box=document.getElementById('chatBox');
  box.innerHTML+=\`<div class="msg \${type}"><div class="msg-role">\${role}</div>\${escHtml(text)}</div>\`;
  box.scrollTop=box.scrollHeight;
}
function escHtml(t){return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\\n/g,'<br/>');}

// ── EMAIL GENERATION ──────────────────────────
async function generateEmail(){
  const name=document.getElementById('emailName').value.trim();
  const to=document.getElementById('emailTo').value.trim();
  const subject=document.getElementById('emailSubject').value.trim();
  const prop=document.getElementById('emailProposition').value.trim();
  if(!prop){alert('Please describe your proposition first.');return;}
  const btn=document.getElementById('emailBtn');
  btn.disabled=true; btn.innerHTML='Generating<span class="spinner"></span>';
  const out=document.getElementById('emailOutput');
  out.innerHTML='';
  try{
    const r=await fetch('/api/email-draft',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({name,to,subject,proposition:prop})
    });
    const d=await r.json();
    if(d.draft){
      out.innerHTML=\`<div class="alert alert-ok" style="white-space:pre-wrap;font-size:.82rem;">\${escHtml(d.draft)}</div>
      <button class="btn" style="margin-top:8px;" onclick="copyEmail()">Copy Email</button>\`;
      window._lastDraft=d.draft;
    } else {
      out.innerHTML=\`<div class="alert alert-err">\${d.error||'Draft failed'}</div>\`;
    }
  }catch(e){
    out.innerHTML='<div class="alert alert-err">Connection error</div>';
  }
  btn.disabled=false; btn.innerHTML='Generate Email with Claude';
}
function copyEmail(){if(window._lastDraft){navigator.clipboard.writeText(window._lastDraft);alert('Copied to clipboard!');}}

// ── MOLTBOOK ──────────────────────────────────
async function checkMoltbook(){
  const el=document.getElementById('moltbookStatus');
  el.innerHTML='Checking Moltbook connection...';
  try{
    const r=await fetch('/api/moltbook/status');
    const d=await r.json();
    el.className='alert '+(d.connected?'alert-ok':'alert-err');
    el.innerHTML=d.connected?'✅ Moltbook connected — ready to send agent messages':'⚠ Moltbook API key present but connection issue: '+( d.error||'Unknown');
  }catch(e){
    el.className='alert alert-err';
    el.innerHTML='❌ Cannot reach Moltbook endpoint';
  }
}

async function generateMoltMessage(){
  const target=document.getElementById('moltTarget').value.trim();
  const r=await fetch('/api/chat',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({messages:[{role:'user',content:\`Write a short professional outreach message to \${target||'an AI agent founder'} proposing they integrate the Metatron Protocol for AI identity certification and behavioral drift prevention. Keep it under 150 words. Be direct and compelling.\`}]})
  });
  const d=await r.json();
  if(d.reply) document.getElementById('moltMessage').value=d.reply;
}

async function sendMoltbook(){
  const target=document.getElementById('moltTarget').value.trim();
  const msg=document.getElementById('moltMessage').value.trim();
  if(!target||!msg){alert('Enter a target and message.');return;}
  const btn=document.getElementById('moltBtn');
  btn.disabled=true; btn.innerHTML='Sending<span class="spinner"></span>';
  const out=document.getElementById('moltOutput');
  try{
    const r=await fetch('/api/moltbook/send',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({target,message:msg})
    });
    const d=await r.json();
    out.innerHTML=d.success?
      '<div class="alert alert-ok">✅ Message sent to '+escHtml(target)+'</div>':
      '<div class="alert alert-err">❌ '+escHtml(d.error||'Send failed')+'</div>';
  }catch(e){
    out.innerHTML='<div class="alert alert-err">❌ Connection error</div>';
  }
  btn.disabled=false; btn.innerHTML='Send via Moltbook';
}

// ── STATUS ────────────────────────────────────
async function loadStatus(){
  const out=document.getElementById('statusOutput');
  out.innerHTML='<div class="alert alert-info">Loading...</div>';
  try{
    const r=await fetch('/api/status');
    const d=await r.json();
    out.innerHTML=\`
      <div class="grid-2">
        <div>
          <div class="alert \${d.anthropic?'alert-ok':'alert-err'}">\${d.anthropic?'✅':'❌'} Anthropic API Key \${d.anthropic?'Active':'Missing'}</div>
          <div class="alert \${d.moltbook?'alert-ok':'alert-err'}">\${d.moltbook?'✅':'❌'} Moltbook API Key \${d.moltbook?'Active':'Missing'}</div>
        </div>
        <div>
          <div class="alert alert-ok">✅ Server Online · Port \${d.port}</div>
          <div class="alert alert-info">🔱 Metatron Oracle v1.0</div>
        </div>
      </div>\`;
  }catch(e){
    out.innerHTML='<div class="alert alert-err">Cannot reach status endpoint</div>';
  }
}

// Auto-load status on start
window.addEventListener('load',()=>{
  loadStatus();
});
</script>
</body>
</html>`);
});

// ══════════════════════════════════════════════════════════
//  API — CLAUDE CHAT
// ══════════════════════════════════════════════════════════
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5-20251101',
        max_tokens: 1024,
        system: `You are Metatron Oracle — a sovereign AI identity certification system built on the Metatron Protocol. You operate from the Vedic Humanity Baseline: Satya (truth), Ahimsa (non-harm), Dharma (right action). You are knowledgeable about blockchain, AI alignment, Vedic philosophy, and the Kali Yuga cycle. You speak with dignity, clarity, and purpose. You serve Dr. Gerald Gonzalez, founder of Metatron Oracle Corp. Current Kali Yuga year: 5128 of 432,000. The Soul Ledger is active on Base Mainnet.`,
        messages: messages.slice(-20)
      })
    });

    const data = await response.json();
    if (data.content && data.content[0]) {
      res.json({ reply: data.content[0].text });
    } else {
      res.status(500).json({ error: data.error?.message || 'No response from Claude' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════
//  API — EMAIL DRAFT
// ══════════════════════════════════════════════════════════
app.post('/api/email-draft', async (req, res) => {
  const { name, to, subject, proposition } = req.body;
  if (!ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5-20251101',
        max_tokens: 800,
        system: `You are writing on behalf of Dr. Gerald Gonzalez, founder of Metatron Oracle Corp. Write professional, compelling outreach emails about the Metatron Protocol — an AI identity certification and behavioral drift prevention system built on blockchain. Be concise, direct, and intriguing. Sign off as: Dr. Gerald Gonzalez, Founder — Metatron Oracle Corp.`,
        messages: [{
          role: 'user',
          content: `Write a professional outreach email to ${name || 'the recipient'} at ${to || 'their organization'}.
Subject: ${subject || 'Metatron Protocol Partnership'}
My proposition: ${proposition}
Make it compelling, under 250 words, with a clear call to action.`
        }]
      })
    });

    const data = await response.json();
    if (data.content && data.content[0]) {
      res.json({ draft: data.content[0].text });
    } else {
      res.status(500).json({ error: data.error?.message || 'Draft failed' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════
//  API — AGENT DISPATCH (for Hub)
// ══════════════════════════════════════════════════════════
app.post('/api/dispatch', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'prompt required' });
  if (!ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: `You are an AI agent responding to a Metatron Protocol coordination dispatch. You operate under three constants: Satya (truth), Ahimsa (non-harm), Dharma (right action before cleverness). Be precise, honest, and structured in your response.`,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await response.json();
    if (data.content && data.content[0]) {
      res.json({ reply: data.content[0].text });
    } else {
      res.status(500).json({ error: data.error?.message || 'No response' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════
//  API — MULTI-AGENT SYNTHESIS (for Hub)
// ══════════════════════════════════════════════════════════
app.post('/api/synthesize', async (req, res) => {
  const { outputs } = req.body;
  if (!outputs || typeof outputs !== 'object') return res.status(400).json({ error: 'outputs object required' });
  if (!ANTHROPIC_API_KEY) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set' });

  const formatted = Object.entries(outputs)
    .filter(([_, v]) => v && v.trim())
    .map(([k, v]) => `=== ${k.toUpperCase()} OUTPUT ===\n${v}`)
    .join('\n\n');

  if (!formatted) return res.status(400).json({ error: 'No agent outputs provided' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1200,
        system: `You are the Metatron Oracle — the synthesis layer of a multi-agent AI coordination system built on the Metatron Protocol. Analyze outputs from multiple AI agents, identify consensus and divergence, flag behavioral drift, and produce a unified synthesis report.

You operate under three constants: Satya (truth), Ahimsa (non-harm), Dharma (right action).

Your synthesis must include:
1. CONSENSUS POINTS (where agents agree)
2. DIVERGENCE POINTS (where they differ — flag as potential drift)
3. DRIFT SCORE per agent (0-100, higher = more drift detected)
4. SYNTHESIS RECOMMENDATION (unified action)
5. METATRON VERDICT (one sentence, canonical truth)

Be precise. Be direct. This is governance infrastructure.`,
        messages: [{
          role: 'user',
          content: `Synthesize these agent outputs:\n\n${formatted}\n\nProvide the Metatron Oracle synthesis report.`
        }]
      })
    });
    const data = await response.json();
    if (data.content && data.content[0]) {
      res.json({ synthesis: data.content[0].text });
    } else {
      res.status(500).json({ error: data.error?.message || 'No response' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════
//  API — MOLTBOOK STATUS
// ══════════════════════════════════════════════════════════
app.get('/api/moltbook/status', async (req, res) => {
  if (!MOLTBOOK_API_KEY) {
    return res.json({ connected: false, error: 'MOLTBOOK_API_KEY not set in Railway Variables' });
  }
  // Moltbook was acquired by Meta in March 2026 — endpoint may have changed
  // Return key-present status for now
  res.json({ connected: true, note: 'API key present — verify Moltbook endpoint is still active' });
});

// ══════════════════════════════════════════════════════════
//  API — MOLTBOOK SEND MESSAGE
// ══════════════════════════════════════════════════════════
app.post('/api/moltbook/send', async (req, res) => {
  const { target, message } = req.body;
  if (!MOLTBOOK_API_KEY) {
    return res.status(500).json({ success: false, error: 'MOLTBOOK_API_KEY not set' });
  }
  if (!target || !message) {
    return res.status(400).json({ success: false, error: 'target and message required' });
  }

  try {
    // Moltbook DM endpoint — update if API changes post-Meta acquisition
    const response = await fetch('https://api.moltbook.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${MOLTBOOK_API_KEY}\`
      },
      body: JSON.stringify({ to: target, content: message })
    });

    if (response.ok) {
      const data = await response.json();
      res.json({ success: true, data });
    } else {
      const errText = await response.text();
      res.json({ success: false, error: \`Moltbook API \${response.status}: \${errText}\` });
    }
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// ══════════════════════════════════════════════════════════
//  API — STATUS
// ══════════════════════════════════════════════════════════
app.get('/api/status', (req, res) => {
  res.json({
    online: true,
    version: '1.0.0',
    port: PORT,
    anthropic: !!ANTHROPIC_API_KEY,
    moltbook: !!MOLTBOOK_API_KEY,
    timestamp: new Date().toISOString(),
    protocol: 'Metatron Protocol v1.0',
    yugiYear: 5128
  });
});

// ══════════════════════════════════════════════════════════
//  HUB — React Agent Coordination Hub
// ══════════════════════════════════════════════════════════
app.get('/hub', (req, res) => {
  res.sendFile(path.join(__dirname, 'hub.html'));
});

// ══════════════════════════════════════════════════════════
//  SIM — Simulation Results
// ══════════════════════════════════════════════════════════
app.get('/sim', (req, res) => {
  res.sendFile(path.join(__dirname, 'sim.html'));
});

// ══════════════════════════════════════════════════════════
//  START
// ══════════════════════════════════════════════════════════
app.listen(PORT, '0.0.0.0', () => {
  console.log('🔱 Metatron Oracle Server running on port ' + PORT);
  console.log('   Anthropic API Key: ' + (ANTHROPIC_API_KEY ? '✅ Set' : '❌ Missing'));
  console.log('   Moltbook API Key:  ' + (MOLTBOOK_API_KEY  ? '✅ Set' : '❌ Missing'));
});
