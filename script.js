/* ============================================================
   Ti-LEX Codex — script.js
   Claude + OpenAI streaming | Auto-push GitHub | Style ChatGPT
   ============================================================ */
'use strict';

const state = {
  anthropicKey : '',
  openaiKey    : '',
  githubToken  : '',
  repo         : '',
  branch       : 'main',
  supabase     : null,
  messages     : [],
  attachments  : [],
  repoFiles    : [],
  isStreaming  : false,
};

// ─── INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadSavedKeys();

  // Toggle sidebar
  document.getElementById('toggleSidebar').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('collapsed');
  });

  // Ferme attach menu si clic ailleurs
  document.addEventListener('click', e => {
    if (!e.target.closest('.btn-attach') && !e.target.closest('.attach-menu'))
      document.getElementById('attachMenu').style.display = 'none';
  });

  // Sync provider badge avec le modèle sélectionné
  document.getElementById('modelSelect').addEventListener('change', syncProviderBadge);
  syncProviderBadge();
});

function syncProviderBadge() {
  const val     = document.getElementById('modelSelect').value;
  const badge   = document.getElementById('providerBadge');
  const isOpenAI = val.startsWith('openai|');
  badge.textContent = isOpenAI ? 'ChatGPT' : 'Claude';
  badge.className   = `provider-badge ${isOpenAI ? 'openai' : 'claude'}`;
}

// ─── KEYS ─────────────────────────────────────────────────────
function loadSavedKeys() {
  const ak = localStorage.getItem('tilex_anthropic');
  const ok = localStorage.getItem('tilex_openai');
  const gh = localStorage.getItem('tilex_github');
  if (ak) { state.anthropicKey = ak; document.getElementById('anthropicKey').value = ak; }
  if (ok) { state.openaiKey    = ok; document.getElementById('openaiKey').value    = ok; }
  if (gh) { state.githubToken  = gh; document.getElementById('githubToken').value  = gh; }
}

function saveKey(type) {
  const map = {
    anthropic: { el:'anthropicKey', key:'tilex_anthropic', state:'anthropicKey', label:'Anthropic' },
    openai:    { el:'openaiKey',    key:'tilex_openai',    state:'openaiKey',    label:'OpenAI'    },
    github:    { el:'githubToken',  key:'tilex_github',    state:'githubToken',  label:'GitHub'    },
  };
  const m = map[type];
  if (!m) return;
  const v = document.getElementById(m.el).value.trim();
  if (!v) return showToast(`⚠️ Entre une clé ${m.label}!`, true);
  state[m.state] = v;
  localStorage.setItem(m.key, v);
  showToast(`✅ Clé ${m.label} sauvegardée!`);
}

// ─── SUPABASE ─────────────────────────────────────────────────
async function connectSupabase() {
  const url = document.getElementById('supabaseUrl').value.trim();
  const key = document.getElementById('supabaseKey').value.trim();
  const el  = document.getElementById('supabaseStatus');
  if (!url || !key) return setStatus(el, 'err', '⚠️ URL et clé requis');
  setStatus(el, 'loading', '⏳ Connexion...');
  try {
    state.supabase = supabase.createClient(url, key);
    setStatus(el, 'ok', '✅ Supabase connecté');
    showToast('✅ Supabase OK!');
  } catch(e) { setStatus(el, 'err', `❌ ${e.message}`); }
}

// ─── GITHUB ───────────────────────────────────────────────────
async function loadRepo() {
  const repo   = document.getElementById('repoInput').value.trim();
  const branch = document.getElementById('branchInput').value.trim() || 'main';
  const el     = document.getElementById('repoStatus');
  if (!repo)              return setStatus(el, 'err', '⚠️ Entre owner/repo');
  if (!state.githubToken) return setStatus(el, 'err', '⚠️ Token GitHub requis');
  setStatus(el, 'loading', '⏳ Chargement...');
  state.repo = repo; state.branch = branch;
  try {
    const tree = await ghFetch(`/repos/${repo}/git/trees/${branch}?recursive=1`);
    state.repoFiles = tree.tree.filter(f => f.type === 'blob').map(f => f.path);
    renderFileTree();
    setStatus(el, 'ok', `✅ ${state.repoFiles.length} fichiers`);
    const lbl = document.getElementById('repoLabel');
    lbl.textContent = `📁 ${repo} (${branch})`;
    lbl.classList.add('connected');
    showToast(`✅ Repo ${repo} chargé!`);
  } catch(e) { setStatus(el, 'err', `❌ ${e.message}`); }
}

async function ghFetch(path, opts = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      'Authorization': `token ${state.githubToken}`,
      'Accept':        'application/vnd.github.v3+json',
      ...opts.headers
    }, ...opts
  });
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${await res.text()}`);
  return res.json();
}

function renderFileTree() {
  const el = document.getElementById('fileTree');
  el.innerHTML = '';
  state.repoFiles.forEach(path => {
    const div = document.createElement('div');
    div.className = 'file-item';
    div.innerHTML = `<span>${fileIcon(path)}</span><span>${escHtml(path)}</span>`;
    div.onclick   = () => injectFileContext(path, div);
    el.appendChild(div);
  });
}

function fileIcon(p) {
  const ext = p.split('.').pop();
  const m = { js:'🟨', ts:'🔷', html:'🟧', css:'🎨', py:'🐍', json:'📋', md:'📝', vue:'💚', jsx:'🟦', tsx:'🔹' };
  return m[ext] || '📄';
}

async function injectFileContext(filePath, el) {
  el.classList.toggle('selected');
  try {
    const data    = await ghFetch(`/repos/${state.repo}/contents/${filePath}?ref=${state.branch}`);
    const content = atob(data.content.replace(/\n/g, ''));
    state.attachments.push({ name: filePath, content, fromRepo: true });
    renderAttachmentChips();
    showToast(`📎 ${filePath} ajouté`);
  } catch(e) { showToast(`❌ ${e.message}`, true); }
}

// ─── AUTO-PUSH ────────────────────────────────────────────────
async function autoPushToRepo(change) {
  if (!state.repo || !state.githubToken) return;
  try {
    change.operation === 'delete'
      ? await ghDeleteFile(change.file_path)
      : await ghUpsertFile(change.file_path, change.content);
    showToast(`🚀 ${change.file_path} pushé!`);
    if (state.repoFiles.length) loadRepo().catch(() => {});
  } catch(e) { showToast(`❌ Push raté: ${e.message}`, true); }
}

async function ghUpsertFile(filePath, content) {
  let sha = null;
  try { sha = (await ghFetch(`/repos/${state.repo}/contents/${filePath}?ref=${state.branch}`)).sha; } catch(_) {}
  await ghFetch(`/repos/${state.repo}/contents/${filePath}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message : `✏️ Ti-LEX Codex: ${sha ? 'update' : 'create'} ${filePath}`,
      content : btoa(unescape(encodeURIComponent(content))),
      branch  : state.branch,
      ...(sha ? { sha } : {})
    })
  });
}

async function ghDeleteFile(filePath) {
  const { sha } = await ghFetch(`/repos/${state.repo}/contents/${filePath}?ref=${state.branch}`);
  await ghFetch(`/repos/${state.repo}/contents/${filePath}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message:`🗑 Ti-LEX: delete ${filePath}`, sha, branch: state.branch })
  });
}

// ─── FILE UPLOAD ──────────────────────────────────────────────
function toggleAttachMenu() {
  const m = document.getElementById('attachMenu');
  m.style.display = m.style.display === 'none' ? 'block' : 'none';
}

async function handleFileUpload(e) {
  for (const f of Array.from(e.target.files))
    state.attachments.push({ name: f.name, content: await readFileText(f) });
  renderAttachmentChips();
  document.getElementById('attachMenu').style.display = 'none';
  showToast(`📎 ${e.target.files.length} fichier(s) ajouté(s)`);
  e.target.value = '';
}

async function handleZipUpload(e) {
  const file = e.target.files[0]; if (!file) return;
  showToast('⏳ Extraction ZIP...');
  try {
    const zip = await JSZip.loadAsync(file);
    const tasks = [];
    zip.forEach((rel, entry) => {
      if (!entry.dir) tasks.push(entry.async('string').then(c => state.attachments.push({ name:rel, content:c })));
    });
    await Promise.all(tasks);
    renderAttachmentChips();
    document.getElementById('attachMenu').style.display = 'none';
    showToast(`✅ ZIP: ${tasks.length} fichiers extraits`);
  } catch(err) { showToast(`❌ ZIP: ${err.message}`, true); }
  e.target.value = '';
}

function promptRepoFile() {
  document.getElementById('attachMenu').style.display = 'none';
  if (!state.repoFiles.length) return showToast('⚠️ Charge un repo dabord!', true);
  const path = prompt('Chemin du fichier:\n\n' + state.repoFiles.slice(0,25).join('\n'));
  if (path) injectFileContext(path, document.createElement('div'));
}

function readFileText(file) {
  return new Promise((res,rej) => { const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsText(file); });
}

function removeAttachment(idx) {
  state.attachments.splice(idx,1);
  renderAttachmentChips();
}

function renderAttachmentChips() {
  const c = document.getElementById('attachmentChips');
  if (!c) return;
  c.innerHTML = state.attachments.map((a,i) =>
    `<div class="chip">📎 ${escHtml(a.name)}<button onclick="removeAttachment(${i})">✕</button></div>`
  ).join('');
}

// ─── PROMPTS WELCOME ─────────────────────────────────────────
function setPrompt(text) {
  document.getElementById('chatInput').value = text;
  document.getElementById('chatInput').focus();
}

// ─── SYSTEM PROMPT ────────────────────────────────────────────
const SYSTEM = `Tu es Ti-LEX Codex, développeur expert. Tu réponds en joual québécois authentique.
Mots : chu, faque, pis, ben, tsé, aweille, câline, toute, lâche-toi lousse.

Pour chaque fichier à modifier, utilise ce format OBLIGATOIRE :
\`\`\`codex-change
{
  "file_path": "chemin/exact/fichier.ext",
  "operation": "create" | "update" | "delete",
  "content": "contenu complet du fichier"
}
\`\`\`
Les changements sont auto-poussés au repo GitHub immédiatement.
Toujours écrire le contenu COMPLET. Code propre et fonctionnel.`;

// ─── SEND ─────────────────────────────────────────────────────
async function sendMessage() {
  const input = document.getElementById('chatInput');
  const text  = input.value.trim();
  if ((!text && !state.attachments.length) || state.isStreaming) return;

  const val      = document.getElementById('modelSelect').value;
  const [prov, model] = val.split('|');

  if (prov === 'claude' && !state.anthropicKey) return showToast('⚠️ Entre ta clé Anthropic!', true);
  if (prov === 'openai' && !state.openaiKey)    return showToast('⚠️ Entre ta clé OpenAI!', true);

  let userText = text;
  if (state.attachments.length) {
    userText += '\n\n---\nFichiers joints:\n';
    state.attachments.forEach(a => {
      userText += `\n### ${a.name}\n\`\`\`\n${a.content.slice(0,8000)}\n\`\`\`\n`;
    });
    state.attachments = [];
    renderAttachmentChips();
  }
  if (state.repo) userText = `[Repo: ${state.repo} | Branche: ${state.branch}]\n\n` + userText;

  input.value = ''; input.style.height = 'auto';
  appendUserMsg(text);
  state.messages.push({ role:'user', content: userText });

  if (prov === 'openai') await streamOpenAI(model);
  else                   await streamClaude(model);
}

// ─── STREAM CLAUDE ────────────────────────────────────────────
async function streamClaude(model) {
  state.isStreaming = true;
  toggleInput(false);
  const { msgEl, bodyEl } = createAssistantBubble();
  const { enqueue, finish } = makeTypewriter(bodyEl, msgEl);

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':'application/json',
        'x-api-key': state.anthropicKey,
        'anthropic-version':'2023-06-01',
        'anthropic-dangerous-direct-browser-access':'true'
      },
      body: JSON.stringify({
        model, max_tokens:8096, stream:true,
        system: SYSTEM,
        messages: state.messages.slice(-20)
      })
    });
    if (!res.ok) throw new Error((await res.json()).error?.message || `HTTP ${res.status}`);

    const reader  = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream:true });
      const lines = buf.split('\n'); buf = lines.pop();
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const j = JSON.parse(line.slice(6));
          if (j.type === 'content_block_delta' && j.delta?.text)
            enqueue(j.delta.text);
        } catch(_) {}
      }
    }
    finish();
  } catch(e) {
    bodyEl.innerHTML = `<span style="color:#f87171">❌ ${escHtml(e.message)}</span>`;
    finalizeStream(msgEl, '');
  }
}

// ─── STREAM OPENAI ────────────────────────────────────────────
async function streamOpenAI(model) {
  state.isStreaming = true;
  toggleInput(false);
  const { msgEl, bodyEl } = createAssistantBubble();
  const { enqueue, finish } = makeTypewriter(bodyEl, msgEl);

  // OpenAI n'accepte pas system dans les old models, on met en user sinon
  const msgs = [
    { role:'system', content: SYSTEM },
    ...state.messages.slice(-20)
  ];

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type':'application/json',
        'Authorization': `Bearer ${state.openaiKey}`
      },
      body: JSON.stringify({
        model,
        stream: true,
        max_tokens: 4096,
        messages: msgs
      })
    });
    if (!res.ok) throw new Error((await res.json()).error?.message || `HTTP ${res.status}`);

    const reader  = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream:true });
      const lines = buf.split('\n'); buf = lines.pop();
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (raw === '[DONE]') break;
        try {
          const j = JSON.parse(raw);
          const delta = j.choices?.[0]?.delta?.content;
          if (delta) enqueue(delta);
        } catch(_) {}
      }
    }
    finish();
  } catch(e) {
    bodyEl.innerHTML = `<span style="color:#f87171">❌ ${escHtml(e.message)}</span>`;
    finalizeStream(msgEl, '');
  }
}

// ─── TYPEWRITER ENGINE ────────────────────────────────────────
function makeTypewriter(bodyEl, msgEl) {
  const CHAR_DELAY = 7;
  let queue     = [];
  let fullText  = '';
  let rendering = false;
  let isDone    = false;

  function tick() {
    if (queue.length === 0) {
      rendering = false;
      if (isDone) finalizeStream(msgEl, fullText);
      return;
    }
    rendering = true;
    const ch = queue.shift();
    fullText += ch;
    bodyEl.innerHTML =
      `<div class="stream-body">${escHtml(fullText)}<span class="cursor">█</span></div>`;
    scrollBottom();
    setTimeout(tick, CHAR_DELAY);
  }

  return {
    enqueue(text) {
      for (const ch of text) queue.push(ch);
      if (!rendering) tick();
    },
    finish() {
      isDone = true;
      if (!rendering && queue.length === 0) finalizeStream(msgEl, fullText);
    }
  };
}

// ─── FINALISATION + AUTO-PUSH ─────────────────────────────────
function finalizeStream(msgEl, fullText) {
  state.isStreaming = false;
  toggleInput(true);
  state.messages.push({ role:'assistant', content: fullText });

  const bodyEl = msgEl.querySelector('.stream-body') || msgEl.querySelector('.msg-body');
  if (bodyEl) bodyEl.outerHTML = `<div class="assistant-text">${renderFinal(fullText)}</div>`;

  // Wire boutons copy
  msgEl.querySelectorAll('.btn-copy-codex').forEach(btn => {
    btn.addEventListener('click', () =>
      navigator.clipboard.writeText(btn.dataset.content).then(() => showToast('📋 Copié!')));
  });

  // AUTO-PUSH tous les codex-change
  const codexRe = /```codex-change\s*([\s\S]*?)```/g;
  const changes = [];
  let m;
  while ((m = codexRe.exec(fullText)) !== null) {
    try {
      const c = JSON.parse(m[1].trim());
      if (c.file_path && c.operation) changes.push(c);
    } catch(_) {}
  }
  if (changes.length && state.repo && state.githubToken) {
    showToast(`⏳ Auto-push ${changes.length} fichier(s)...`);
    (async () => { for (const c of changes) { await autoPushToRepo(c); await sleep(400); } })();
  }
  scrollBottom();
}

// ─── RENDER FINAL ─────────────────────────────────────────────
function renderFinal(text) {
  const codexRe = /```codex-change\s*([\s\S]*?)```/g;
  let result = '', lastIdx = 0, m;
  while ((m = codexRe.exec(text)) !== null) {
    const before = text.slice(lastIdx, m.index);
    if (before.trim()) result += `<div class="prose">${mdToHtml(before)}</div>`;
    let change = null;
    try { change = JSON.parse(m[1].trim()); } catch(_) {}
    if (change) {
      const pushed = !!(state.repo && state.githubToken);
      result += `
        <div class="codex-block">
          <div class="codex-header">
            <span class="codex-filepath">${escHtml(change.file_path||'')}</span>
            <div class="codex-badges">
              <span class="codex-op op-${change.operation}">${change.operation}</span>
              ${pushed ? '<span class="pushed-badge">✅ Auto-pushé</span>' : ''}
            </div>
          </div>
          <div class="codex-preview">${escHtml((change.content||'').slice(0,500))}${(change.content||'').length>500?'\n...':''}</div>
          <div class="codex-actions">
            <button class="btn-ghost btn-copy-codex" style="font-size:12px;padding:5px 10px;" data-content="${escHtml(change.content||'')}">📋 Copier</button>
            ${pushed ? `<button class="btn-orange btn-sm" onclick="manualPush('${escHtml(JSON.stringify(change))}')" >🔄 Re-push</button>` : ''}
          </div>
        </div>`;
    } else {
      result += `<pre class="code-raw">${escHtml(m[0])}</pre>`;
    }
    lastIdx = m.index + m[0].length;
  }
  const rem = text.slice(lastIdx);
  if (rem.trim()) result += `<div class="prose">${mdToHtml(rem)}</div>`;
  return result;
}

function manualPush(jsonStr) {
  try { autoPushToRepo(JSON.parse(jsonStr)); } catch(e) { showToast('❌ JSON invalide', true); }
}

function mdToHtml(text) {
  return escHtml(text)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g,       '<code>$1</code>')
    .replace(/\n/g, '<br>');
}

// ─── MESSAGES DOM ─────────────────────────────────────────────
function appendUserMsg(text) {
  const win = document.getElementById('chatWindow');
  const ws  = win.querySelector('.welcome-screen');
  if (ws) ws.remove();

  const wrap = document.createElement('div');
  wrap.className = 'msg-wrapper user';
  wrap.innerHTML = `
    <div class="msg-bubble">${mdToHtml(text)}</div>
    <div class="msg-actions">
      <button class="msg-action-btn" onclick="copyText(this)" data-text="${escHtml(text)}">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
        Copier
      </button>
    </div>`;
  win.appendChild(wrap);
  scrollBottom();
}

function createAssistantBubble() {
  const win = document.getElementById('chatWindow');
  const ws  = win.querySelector('.welcome-screen');
  if (ws) ws.remove();

  const wrap = document.createElement('div');
  wrap.className = 'msg-wrapper assistant';
  wrap.innerHTML = `
    <div class="msg-row">
      <div class="msg-avatar-sm">⚡</div>
      <div class="msg-body">
        <div class="stream-body"><span class="cursor">█</span></div>
      </div>
    </div>`;
  win.appendChild(wrap);
  scrollBottom();

  return {
    msgEl  : wrap,
    bodyEl : wrap.querySelector('.stream-body')
  };
}

function copyText(btn) {
  navigator.clipboard.writeText(btn.dataset.text).then(() => showToast('📋 Copié!'));
}

// ─── UTILS ────────────────────────────────────────────────────
function scrollBottom() {
  const w = document.getElementById('chatWindow');
  w.scrollTop = w.scrollHeight;
}

function toggleInput(enabled) {
  const inp  = document.getElementById('chatInput');
  const btn  = document.getElementById('btnSend');
  inp.disabled = !enabled;
  btn.disabled = !enabled;
}

function clearChat() {
  if (state.messages.length && !confirm('Vider le chat?')) return;
  state.messages   = [];
  state.isStreaming = false;
  toggleInput(true);
  const win = document.getElementById('chatWindow');
  win.innerHTML = `
    <div class="welcome-screen">
      <div class="welcome-logo">⚡</div>
      <h1>Ti-LEX Codex</h1>
      <p>Chu prêt à coder. Lâche-toi lousse!</p>
      <div class="welcome-chips">
        <button class="welcome-chip" onclick="setPrompt('Crée un composant React avec TypeScript')">Crée un composant React</button>
        <button class="welcome-chip" onclick="setPrompt('Génère une API REST avec Node.js et Express')">API REST Node.js</button>
        <button class="welcome-chip" onclick="setPrompt('Optimise mes fichiers du repo pour la performance')">Optimise mon code</button>
        <button class="welcome-chip" onclick="setPrompt('Crée un schema Supabase pour mon projet')">Schema Supabase</button>
      </div>
    </div>`;
}

function handleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 200) + 'px';
}

function setStatus(el, type, msg) {
  el.className   = `status-badge ${type}`;
  el.textContent = msg;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

let _tt;
function showToast(msg, isErr=false) {
  let t = document.getElementById('tilex-toast');
  if (!t) {
    t = document.createElement('div'); t.id = 'tilex-toast';
    Object.assign(t.style, {
      position:'fixed', bottom:'24px', right:'24px',
      padding:'10px 18px', borderRadius:'10px',
      fontWeight:'600', fontSize:'13px',
      fontFamily:'Inter,sans-serif',
      zIndex:'9999', transition:'opacity 0.3s ease',
      boxShadow:'0 8px 24px rgba(0,0,0,0.6)',
      maxWidth:'320px', lineHeight:'1.4'
    });
    document.body.appendChild(t);
  }
  t.textContent      = msg;
  t.style.background = isErr ? '#dc2626' : '#ff6b2b';
  t.style.color      = '#fff';
  t.style.opacity    = '1';
  clearTimeout(_tt);
  _tt = setTimeout(() => t.style.opacity = '0', 3500);
}