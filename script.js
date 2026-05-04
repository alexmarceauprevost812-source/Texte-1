// ============================================================
//  CODEX — script.js  (streaming lettre par lettre + thème)
// ============================================================

let conversations = JSON.parse(localStorage.getItem('codex_convs') || '[]');
let currentConvId = null;
let apiKey        = localStorage.getItem('codex_api_key')  || '';
let githubToken   = localStorage.getItem('codex_gh_token') || '';
let githubRepo    = localStorage.getItem('codex_gh_repo')  || '';
let supabaseUrl   = localStorage.getItem('codex_sb_url')   || '';
let supabaseKey   = localStorage.getItem('codex_sb_key')   || '';
let isStreaming   = false;
let sidebarOpen   = false;

const $  = id => document.getElementById(id);

// DOM refs
const sidebarToggle    = $('sidebarToggle');
const overlay          = $('overlay');
const newChatBtn       = $('newChatBtn');
const convsList        = $('conversationsList');
const chatMessages     = $('chatMessages');
const chatInput        = $('chatInput');
const sendBtn          = $('sendBtn');
const convTitle        = $('convTitle');
const clearBtn         = $('clearBtn');
const githubBtn        = $('githubBtn');
const githubDropdown   = $('githubDropdown');
const githubTokenInput = $('githubToken');
const githubRepoInput  = $('githubRepo');
const githubSave       = $('githubSave');
const githubStatus     = $('githubStatus');
const githubLabel      = $('githubLabel');
const supabaseBtn      = $('supabaseBtn');
const supabaseDropdown = $('supabaseDropdown');
const supabaseUrlInput = $('supabaseUrl');
const supabaseKeyInput = $('supabaseAnonKey');
const supabaseSave     = $('supabaseSave');
const supabaseStatus   = $('supabaseStatus');
const supabaseLabel    = $('supabaseLabel');
const apiBtn           = $('apiBtn');
const apiDropdown      = $('apiDropdown');
const apiKeyInput      = $('apiKeyInput');
const saveKeyBtn       = $('saveKeyBtn');
const keyStatus        = $('keyStatus');
const apiLabel         = $('apiLabel');

// ========== INIT ==========
function init() {
  if (apiKey)      { apiKeyInput.value = apiKey; setStatus(keyStatus,'✓ Clé chargée','ok'); apiBtn.classList.add('connected'); apiLabel.textContent='✓ API'; }
  if (githubToken) { githubTokenInput.value=githubToken; githubRepoInput.value=githubRepo; setGHConnected(); }
  if (supabaseUrl) { supabaseUrlInput.value=supabaseUrl; supabaseKeyInput.value=supabaseKey; setSBConnected(); }
  renderConvList();
  if (window.innerWidth > 640) openSidebar();
}
init();

// ========== SIDEBAR ==========
function openSidebar()  { sidebarOpen=true;  document.body.classList.add('sidebar-open'); }
function closeSidebar() { sidebarOpen=false; document.body.classList.remove('sidebar-open'); }
sidebarToggle.addEventListener('click', () => sidebarOpen ? closeSidebar() : openSidebar());
overlay.addEventListener('click', closeSidebar);

// ========== DROPDOWNS ==========
const DDS = [
  { btn: githubBtn,   dd: githubDropdown },
  { btn: supabaseBtn, dd: supabaseDropdown },
  { btn: apiBtn,      dd: apiDropdown },
];
DDS.forEach(({btn,dd}) => {
  btn.addEventListener('click', e => {
    e.stopPropagation();
    const open = dd.classList.contains('open');
    closeAllDD();
    if (!open) { dd.classList.add('open'); btn.classList.add('active'); }
  });
});
document.addEventListener('click', closeAllDD);
function closeAllDD() {
  DDS.forEach(({btn,dd}) => { dd.classList.remove('open'); btn.classList.remove('active'); });
}
document.querySelectorAll('.dropdown').forEach(d => d.addEventListener('click', e => e.stopPropagation()));

// ========== ANTHROPIC KEY ==========
saveKeyBtn.addEventListener('click', () => {
  const k = apiKeyInput.value.trim();
  if (!k.startsWith('sk-ant-')) { setStatus(keyStatus,'✗ Format invalide (sk-ant-...)','err'); return; }
  apiKey = k;
  localStorage.setItem('codex_api_key', k);
  setStatus(keyStatus,'✓ Clé sauvegardée!','ok');
  apiBtn.classList.add('connected');
  apiLabel.textContent = '✓ API';
  setTimeout(closeAllDD, 1200);
});
apiKeyInput.addEventListener('keydown', e => { if(e.key==='Enter') saveKeyBtn.click(); });

// ========== GITHUB ==========
githubSave.addEventListener('click', async () => {
  const token = githubTokenInput.value.trim();
  const repo  = githubRepoInput.value.trim();
  if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
    setStatus(githubStatus,'✗ Token invalide (ghp_... ou github_pat_...)','err'); return;
  }
  setStatus(githubStatus,'⏳ Vérification...','');
  try {
    const res  = await fetch('https://api.github.com/user', { headers:{ Authorization:`Bearer ${token}`, Accept:'application/vnd.github+json' } });
    if (!res.ok) throw new Error('Token refusé');
    const user = await res.json();
    githubToken = token; githubRepo = repo;
    localStorage.setItem('codex_gh_token', token);
    localStorage.setItem('codex_gh_repo', repo);
    setStatus(githubStatus,`✓ Connecté comme @${user.login}`,'ok');
    setGHConnected(user.login);
    setTimeout(closeAllDD, 1500);
  } catch(err) { setStatus(githubStatus,`✗ ${err.message}`,'err'); }
});
function setGHConnected(login='') {
  githubBtn.classList.add('connected');
  githubLabel.textContent = login ? `@${login}` : '✓ GitHub';
}

// ========== SUPABASE ==========
supabaseSave.addEventListener('click', async () => {
  const url = supabaseUrlInput.value.trim().replace(/\/$/, '');
  const key = supabaseKeyInput.value.trim();
  if (!url.includes('supabase.co') || !key.startsWith('eyJ')) {
    setStatus(supabaseStatus,'✗ URL ou clé invalide','err'); return;
  }
  setStatus(supabaseStatus,'⏳ Vérification...','');
  try {
    const res = await fetch(`${url}/rest/v1/`, { headers:{ apikey:key, Authorization:`Bearer ${key}` } });
    if (res.status === 401) throw new Error('Clé refusée par Supabase');
    supabaseUrl = url; supabaseKey = key;
    localStorage.setItem('codex_sb_url', url);
    localStorage.setItem('codex_sb_key', key);
    setStatus(supabaseStatus,'✓ Supabase connecté!','ok');
    setSBConnected();
    setTimeout(closeAllDD, 1500);
  } catch(err) { setStatus(supabaseStatus,`✗ ${err.message}`,'err'); }
});
function setSBConnected() {
  supabaseBtn.classList.add('connected');
  supabaseLabel.textContent = '✓ Supabase';
}

function setStatus(el, msg, type) {
  el.textContent = msg;
  el.className   = 'connect-status' + (type ? ` ${type}` : '');
}

// ========== CONVERSATIONS ==========
function saveConvs() { localStorage.setItem('codex_convs', JSON.stringify(conversations)); }
function getConv()   { return conversations.find(c => c.id === currentConvId) || null; }

function createConv() {
  const c = { id:'conv_'+Date.now(), title:'Nouvelle conversation', messages:[], createdAt:Date.now() };
  conversations.unshift(c);
  saveConvs();
  return c;
}

function loadConv(id) {
  currentConvId = id;
  const conv = getConv();
  if (!conv) return;
  convTitle.textContent  = conv.title;
  chatMessages.innerHTML = '';
  if (conv.messages.length === 0) {
    chatMessages.appendChild(makeWelcome());
  } else {
    conv.messages.forEach(m => appendMessage(m.role, m.content, false));
  }
  renderConvList();
  scrollBottom();
}

function makeWelcome() {
  const d = document.createElement('div');
  d.id = 'welcomeScreen';
  d.className = 'welcome-screen';
  d.innerHTML = `
    <div class="welcome-icon">🧠</div>
    <h1>Bienvenue dans Codex</h1>
    <p>Propulsé par <strong>Claude d'Anthropic</strong>.<br/>Entre ta clé API en haut à droite pour commencer.</p>
    <div class="chips">
      <button class="chip" onclick="setInput('Explique-moi le machine learning simplement')">💡 Machine learning</button>
      <button class="chip" onclick="setInput('Écris un composant React avec un formulaire')">⚛️ Composant React</button>
      <button class="chip" onclick="setInput('Aide-moi à déboguer ce code JavaScript')">🐛 Debug JS</button>
      <button class="chip" onclick="setInput('Rédige-moi un README pour mon projet GitHub')">📄 README GitHub</button>
    </div>`;
  return d;
}

function renderConvList() {
  convsList.innerHTML = '';
  if (conversations.length === 0) {
    convsList.innerHTML = '<div class="empty-list">Aucune conversation encore</div>';
    return;
  }
  conversations.forEach(conv => {
    const item = document.createElement('div');
    item.className = 'conv-item' + (conv.id === currentConvId ? ' active' : '');
    item.innerHTML = `
      <span class="conv-icon">💬</span>
      <span class="conv-name">${escH(conv.title)}</span>
      <button class="conv-delete" title="Supprimer">✕</button>`;
    item.addEventListener('click', e => {
      if (e.target.classList.contains('conv-delete')) { deleteConv(conv.id); return; }
      loadConv(conv.id);
      if (window.innerWidth <= 640) closeSidebar();
    });
    convsList.appendChild(item);
  });
}

function deleteConv(id) {
  conversations = conversations.filter(c => c.id !== id);
  saveConvs();
  if (currentConvId === id) {
    currentConvId = null;
    chatMessages.innerHTML = '';
    chatMessages.appendChild(makeWelcome());
    convTitle.textContent = 'Nouvelle conversation';
  }
  renderConvList();
}

newChatBtn.addEventListener('click', () => {
  const c = createConv();
  loadConv(c.id);
  if (window.innerWidth <= 640) closeSidebar();
});

clearBtn.addEventListener('click', () => {
  if (!currentConvId) return;
  const conv = getConv();
  if (!conv || !confirm('Effacer les messages?')) return;
  conv.messages = []; conv.title = 'Nouvelle conversation';
  saveConvs();
  loadConv(currentConvId);
});

// ========== MESSAGES UI ==========
function appendMessage(role, content, animate=true) {
  const ws = document.getElementById('welcomeScreen');
  if (ws) ws.remove();

  const row = document.createElement('div');
  row.className = `message-row ${role}`;
  if (!animate) row.style.animation = 'none';

  const bubble = document.createElement('div');
  bubble.className = `bubble ${role}`;
  bubble.innerHTML = renderContent(content);

  row.innerHTML = `<div class="avatar ${role}">${role==='bot'?'🧠':'👤'}</div>`;
  row.appendChild(bubble);
  chatMessages.appendChild(row);
  scrollBottom();
  return bubble;
}

function appendTyping() {
  const ws = document.getElementById('welcomeScreen');
  if (ws) ws.remove();
  const row = document.createElement('div');
  row.className = 'message-row bot';
  row.id = 'typingRow';
  row.innerHTML = `<div class="avatar bot">🧠</div><div class="bubble bot"><div class="typing-indicator"><span></span><span></span><span></span></div></div>`;
  chatMessages.appendChild(row);
  scrollBottom();
}
function removeTyping() { const el=$('typingRow'); if(el) el.remove(); }
function scrollBottom()  { chatMessages.scrollTop = chatMessages.scrollHeight; }

// ===== RENDER CONTENT (markdown léger) =====
function renderContent(text) {
  // On extrait les blocs de code pour les traiter séparément
  let out = '';
  let lastIdx = 0;
  const codeRx = /```(\w*)\n?([\s\S]*?)```/g;
  let m;
  while ((m = codeRx.exec(text)) !== null) {
    // Texte avant le bloc code
    out += renderInline(text.slice(lastIdx, m.index));
    const lang = m[1] || 'code';
    const code = escH(m[2].trim());
    out += `
      <div class="code-header">
        <span>${lang}</span>
        <button class="copy-btn" onclick="copyCode(this)">Copier</button>
      </div>
      <pre><code>${code}</code></pre>`;
    lastIdx = m.index + m[0].length;
  }
  out += renderInline(text.slice(lastIdx));
  return out;
}

function renderInline(text) {
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
  text = text.replace(/\n/g, '<br/>');
  return text;
}

function escH(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

window.copyCode = (btn) => {
  const code = btn.closest('.code-header').nextElementSibling?.querySelector('code')?.innerText || '';
  navigator.clipboard.writeText(code).then(() => {
    btn.textContent = '✓ Copié!';
    setTimeout(() => { btn.textContent = 'Copier'; }, 2000);
  });
};

// ========== INPUT ==========
chatInput.addEventListener('input', () => {
  chatInput.style.height = 'auto';
  chatInput.style.height = Math.min(chatInput.scrollHeight, 200) + 'px';
  sendBtn.disabled = !chatInput.value.trim() || isStreaming;
});
chatInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (!sendBtn.disabled) sendMessage(); }
});
sendBtn.addEventListener('click', sendMessage);

window.setInput = (text) => {
  chatInput.value = text;
  chatInput.dispatchEvent(new Event('input'));
  chatInput.focus();
};

// ========== STREAMING LETTRE PAR LETTRE ==========
// Queue de caractères à afficher
let charQueue  = [];
let renderTimer = null;
let currentBubble = null;
let fullAccumulated = '';

function startLetterStream(bubble) {
  currentBubble = bubble;
  charQueue = [];
  fullAccumulated = '';
  scheduleRender();
}

function pushChars(text) {
  for (const ch of text) charQueue.push(ch);
}

function scheduleRender() {
  if (renderTimer) return;
  renderTimer = setInterval(flushChars, 18); // vitesse d'écriture : 18ms par caractère
}

function flushChars() {
  if (!currentBubble) return;

  // On sort jusqu'à 3 chars par tick pour garder une vitesse lisible
  const batch = Math.min(3, charQueue.length);
  for (let i = 0; i < batch; i++) {
    if (charQueue.length === 0) break;
    fullAccumulated += charQueue.shift();
  }

  // Curseur clignotant pendant l'écriture
  currentBubble.innerHTML = renderContent(fullAccumulated) + '<span class="cursor-blink"></span>';
  scrollBottom();

  // Fini
  if (charQueue.length === 0 && !isStreaming) {
    clearInterval(renderTimer);
    renderTimer = null;
    currentBubble.innerHTML = renderContent(fullAccumulated);
    currentBubble = null;
    scrollBottom();
  }
}

// ========== SEND → CLAUDE ==========
async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text || isStreaming) return;

  if (!apiKey) {
    alert('Entre ta clé Anthropic en haut à droite! 🔑');
    return;
  }

  if (!currentConvId) {
    const c = createConv();
    currentConvId = c.id;
    renderConvList();
  }

  const conv = getConv();
  conv.messages.push({ role:'user', content:text });
  appendMessage('user', text);

  if (conv.messages.length === 1) {
    conv.title = text.slice(0,44) + (text.length>44?'…':'');
    convTitle.textContent = conv.title;
  }

  saveConvs();
  renderConvList();

  chatInput.value = '';
  chatInput.style.height = 'auto';
  sendBtn.disabled = true;
  isStreaming = true;
  appendTyping();

  let systemExtra = '';
  if (githubToken) systemExtra += `\nL'utilisateur est connecté à GitHub${githubRepo?` (repo: ${githubRepo})`:'.'}`;
  if (supabaseUrl) systemExtra += `\nL'utilisateur est connecté à Supabase (${supabaseUrl}).`;

  const system = `Tu es Codex, un assistant développeur expert, précis et direct. Tu réponds en français québécois naturel. Quand tu écris du code, tu l'expliques clairement.${systemExtra}`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 4096,
        stream: true,
        system,
        messages: conv.messages.map(m => ({
          role: m.role === 'bot' ? 'assistant' : 'user',
          content: m.content
        }))
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || `Erreur ${res.status}`);
    }

    removeTyping();

    // Crée la bulle bot vide pis démarre le stream lettre par lettre
    const ws = document.getElementById('welcomeScreen');
    if (ws) ws.remove();
    const row = document.createElement('div');
    row.className = 'message-row bot';
    const botBubble = document.createElement('div');
    botBubble.className = 'bubble bot';
    row.innerHTML = `<div class="avatar bot">🧠</div>`;
    row.appendChild(botBubble);
    chatMessages.appendChild(row);
    scrollBottom();

    startLetterStream(botBubble);
    let fullText = '';

    const reader  = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const lines = decoder.decode(value).split('\n');
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
            const chunk = parsed.delta.text;
            fullText += chunk;
            pushChars(chunk); // alimente la queue lettre par lettre
          }
        } catch(_) {}
      }
    }

    // Signale la fin du stream — flushChars va terminer proprement
    isStreaming = false;
    conv.messages.push({ role:'bot', content:fullText });
    saveConvs();

    // Attend que la queue soit vidée avant de re-enable le bouton
    const waitFlush = setInterval(() => {
      if (charQueue.length === 0 && !renderTimer) {
        clearInterval(waitFlush);
        sendBtn.disabled = !chatInput.value.trim();
      }
    }, 50);

  } catch(err) {
    isStreaming = false;
    if (renderTimer) { clearInterval(renderTimer); renderTimer=null; }
    removeTyping();
    appendMessage('bot', `❌ Erreur : ${err.message}\n\nVérifie ta clé API pis réessaie!`);
    console.error(err);
    sendBtn.disabled = !chatInput.value.trim();
  }
}
