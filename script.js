// ============================================================
//  CODEX — script.js
// ============================================================

// ========== STATE ==========
let conversations = JSON.parse(localStorage.getItem('codex_convs') || '[]');
let currentConvId = null;
let apiKey        = localStorage.getItem('codex_api_key')    || '';
let githubToken   = localStorage.getItem('codex_gh_token')   || '';
let githubRepo    = localStorage.getItem('codex_gh_repo')    || '';
let supabaseUrl   = localStorage.getItem('codex_sb_url')     || '';
let supabaseKey   = localStorage.getItem('codex_sb_key')     || '';
let isStreaming   = false;
let sidebarOpen   = false;

// ========== DOM ==========
const $  = id => document.getElementById(id);

const sidebarEl          = $('sidebar');
const sidebarToggle      = $('sidebarToggle');
const overlay            = $('overlay');
const newChatBtn         = $('newChatBtn');
const convsList          = $('conversationsList');
const chatMessages       = $('chatMessages');
const chatInput          = $('chatInput');
const sendBtn            = $('sendBtn');
const convTitle          = $('convTitle');
const clearBtn           = $('clearBtn');

// Dropdowns
const githubBtn          = $('githubBtn');
const githubDropdown     = $('githubDropdown');
const githubTokenInput   = $('githubToken');
const githubRepoInput    = $('githubRepo');
const githubSave         = $('githubSave');
const githubStatus       = $('githubStatus');
const githubLabel        = $('githubLabel');

const supabaseBtn        = $('supabaseBtn');
const supabaseDropdown   = $('supabaseDropdown');
const supabaseUrlInput   = $('supabaseUrl');
const supabaseKeyInput   = $('supabaseAnonKey');
const supabaseSave       = $('supabaseSave');
const supabaseStatus     = $('supabaseStatus');
const supabaseLabel      = $('supabaseLabel');

const apiBtn             = $('apiBtn');
const apiDropdown        = $('apiDropdown');
const apiKeyInput        = $('apiKeyInput');
const saveKeyBtn         = $('saveKeyBtn');
const keyStatus          = $('keyStatus');
const apiLabel           = $('apiLabel');

// ========== INIT ==========
function init() {
  // Restaure clés
  if (apiKey)      { apiKeyInput.value = apiKey; setStatus(keyStatus, '✓ Clé chargée', 'ok'); apiBtn.classList.add('connected'); apiLabel.textContent = '✓ API'; }
  if (githubToken) { githubTokenInput.value = githubToken; githubRepoInput.value = githubRepo; setGithubConnected(); }
  if (supabaseUrl) { supabaseUrlInput.value = supabaseUrl; supabaseKeyInput.value = supabaseKey; setSupabaseConnected(); }

  renderConvList();
  // Ouvre sidebar par défaut si desktop
  if (window.innerWidth > 640) openSidebar();
}

init();

// ========== SIDEBAR ==========
function openSidebar()  { sidebarOpen = true;  document.body.classList.add('sidebar-open'); }
function closeSidebar() { sidebarOpen = false; document.body.classList.remove('sidebar-open'); }
function toggleSidebarFn() { sidebarOpen ? closeSidebar() : openSidebar(); }

sidebarToggle.addEventListener('click', toggleSidebarFn);
overlay.addEventListener('click', closeSidebar);

// ========== DROPDOWNS ==========
const dropdowns = [
  { btn: githubBtn,   dd: githubDropdown },
  { btn: supabaseBtn, dd: supabaseDropdown },
  { btn: apiBtn,      dd: apiDropdown },
];

dropdowns.forEach(({ btn, dd }) => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = dd.classList.contains('open');
    closeAllDropdowns();
    if (!isOpen) { dd.classList.add('open'); btn.classList.add('active'); }
  });
});

document.addEventListener('click', closeAllDropdowns);

function closeAllDropdowns() {
  dropdowns.forEach(({ btn, dd }) => {
    dd.classList.remove('open');
    btn.classList.remove('active');
  });
}

// Stop propagation dans les dropdowns
document.querySelectorAll('.dropdown').forEach(d => d.addEventListener('click', e => e.stopPropagation()));

// ========== ANTHROPIC KEY ==========
saveKeyBtn.addEventListener('click', () => {
  const key = apiKeyInput.value.trim();
  if (!key.startsWith('sk-ant-')) {
    setStatus(keyStatus, '✗ Format invalide (sk-ant-...)', 'err');
    return;
  }
  apiKey = key;
  localStorage.setItem('codex_api_key', key);
  setStatus(keyStatus, '✓ Clé sauvegardée!', 'ok');
  apiBtn.classList.add('connected');
  apiLabel.textContent = '✓ API';
  setTimeout(() => closeAllDropdowns(), 1200);
});

apiKeyInput.addEventListener('keydown', e => { if (e.key === 'Enter') saveKeyBtn.click(); });

// ========== GITHUB ==========
githubSave.addEventListener('click', async () => {
  const token = githubTokenInput.value.trim();
  const repo  = githubRepoInput.value.trim();

  if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
    setStatus(githubStatus, '✗ Token invalide (ghp_... ou github_pat_...)', 'err');
    return;
  }

  setStatus(githubStatus, '⏳ Vérification...', '');

  try {
    const res = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' }
    });
    if (!res.ok) throw new Error('Token refusé');
    const user = await res.json();

    githubToken = token;
    githubRepo  = repo;
    localStorage.setItem('codex_gh_token', token);
    localStorage.setItem('codex_gh_repo',  repo);

    setStatus(githubStatus, `✓ Connecté comme @${user.login}`, 'ok');
    setGithubConnected(user.login);
    setTimeout(() => closeAllDropdowns(), 1500);
  } catch (err) {
    setStatus(githubStatus, `✗ ${err.message}`, 'err');
  }
});

function setGithubConnected(login = '') {
  githubBtn.classList.add('connected');
  githubLabel.textContent = login ? `@${login}` : '✓ GitHub';
}

// ========== SUPABASE ==========
supabaseSave.addEventListener('click', async () => {
  const url = supabaseUrlInput.value.trim().replace(/\/$/, '');
  const key = supabaseKeyInput.value.trim();

  if (!url.includes('supabase.co') || !key.startsWith('eyJ')) {
    setStatus(supabaseStatus, '✗ URL ou clé invalide', 'err');
    return;
  }

  setStatus(supabaseStatus, '⏳ Vérification...', '');

  try {
    // Ping l'endpoint REST Supabase
    const res = await fetch(`${url}/rest/v1/`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`
      }
    });

    // 200 ou 404 (table inexistante) = connexion OK
    if (res.status === 200 || res.status === 404 || res.status === 401) {
      if (res.status === 401) throw new Error('Clé refusée par Supabase');
    }

    supabaseUrl = url;
    supabaseKey = key;
    localStorage.setItem('codex_sb_url', url);
    localStorage.setItem('codex_sb_key', key);

    setStatus(supabaseStatus, '✓ Supabase connecté!', 'ok');
    setSupabaseConnected();
    setTimeout(() => closeAllDropdowns(), 1500);
  } catch (err) {
    setStatus(supabaseStatus, `✗ ${err.message}`, 'err');
  }
});

function setSupabaseConnected() {
  supabaseBtn.classList.add('connected');
  supabaseLabel.textContent = '✓ Supabase';
}

// Helpers
function setStatus(el, msg, type) {
  el.textContent = msg;
  el.className   = 'connect-status' + (type ? ` ${type}` : '');
}

// ========== CONVERSATIONS ==========
function saveConvs() { localStorage.setItem('codex_convs', JSON.stringify(conversations)); }
function getConv()   { return conversations.find(c => c.id === currentConvId) || null; }

function createConv() {
  const conv = { id: 'conv_' + Date.now(), title: 'Nouvelle conversation', messages: [], createdAt: Date.now() };
  conversations.unshift(conv);
  saveConvs();
  return conv;
}

function loadConv(id) {
  currentConvId = id;
  const conv = getConv();
  if (!conv) return;

  convTitle.textContent = conv.title;
  chatMessages.innerHTML = '';

  if (conv.messages.length === 0) {
    chatMessages.appendChild($('welcomeScreen') || makeWelcome());
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
    convsList.innerHTML = '<div class="empty-list">Aucune conversation</div>';
    return;
  }
  conversations.forEach(conv => {
    const item = document.createElement('div');
    item.className = 'conv-item' + (conv.id === currentConvId ? ' active' : '');
    item.innerHTML = `
      <span class="conv-icon">💬</span>
      <span class="conv-name">${escHtml(conv.title)}</span>
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
  const conv = createConv();
  loadConv(conv.id);
  if (window.innerWidth <= 640) closeSidebar();
});

clearBtn.addEventListener('click', () => {
  if (!currentConvId) return;
  const conv = getConv();
  if (!conv || !confirm('Effacer les messages?')) return;
  conv.messages = [];
  conv.title = 'Nouvelle conversation';
  saveConvs();
  loadConv(currentConvId);
});

// ========== MESSAGES UI ==========
function appendMessage(role, content, animate = true) {
  const ws = document.getElementById('welcomeScreen');
  if (ws) ws.remove();

  const row    = document.createElement('div');
  row.className = `message-row ${role}`;
  if (!animate) row.style.animation = 'none';

  const bubble = document.createElement('div');
  bubble.className = `bubble ${role}`;
  bubble.innerHTML = fmtContent(content);

  row.innerHTML = `<div class="avatar ${role}">${role === 'bot' ? '🧠' : '👤'}</div>`;
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

function removeTyping() { const el = $('typingRow'); if (el) el.remove(); }
function scrollBottom() { chatMessages.scrollTop = chatMessages.scrollHeight; }

function fmtContent(text) {
  text = text.replace(/```([\s\S]*?)```/g, (_, c) => `<pre><code>${escHtml(c.trim())}</code></pre>`);
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
  text = text.replace(/\n/g, '<br/>');
  return text;
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ========== INPUT ==========
chatInput.addEventListener('input', () => {
  chatInput.style.height = 'auto';
  chatInput.style.height = Math.min(chatInput.scrollHeight, 180) + 'px';
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

// ========== SEND → CLAUDE API ==========
async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text || isStreaming) return;

  if (!apiKey) {
    alert('Entre ta clé Anthropic en haut à droite! 🔑');
    return;
  }

  if (!currentConvId) {
    const conv = createConv();
    currentConvId = conv.id;
    renderConvList();
  }

  const conv = getConv();
  conv.messages.push({ role: 'user', content: text });
  appendMessage('user', text);

  if (conv.messages.length === 1) {
    conv.title = text.slice(0, 42) + (text.length > 42 ? '…' : '');
    convTitle.textContent = conv.title;
  }

  saveConvs();
  renderConvList();

  chatInput.value = '';
  chatInput.style.height = 'auto';
  sendBtn.disabled = true;
  isStreaming = true;
  appendTyping();

  // Contexte système enrichi selon les connexions
  let systemExtra = '';
  if (githubToken) systemExtra += `\nL'utilisateur est connecté à GitHub${githubRepo ? ` (repo: ${githubRepo})` : ''}.`;
  if (supabaseUrl) systemExtra += `\nL'utilisateur est connecté à Supabase (${supabaseUrl}).`;

  const systemPrompt = `Tu es Codex, un assistant IA développeur expert, précis et convivial. Tu réponds en français québécois naturel quand l'utilisateur parle français. Tu es spécialisé en code, architecture logicielle et développement web.${systemExtra}`;

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
        system: systemPrompt,
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
    const botBubble = appendMessage('bot', '', true);
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
            fullText += parsed.delta.text;
            botBubble.innerHTML = fmtContent(fullText);
            scrollBottom();
          }
        } catch (_) {}
      }
    }

    conv.messages.push({ role: 'bot', content: fullText });
    saveConvs();

  } catch (err) {
    removeTyping();
    appendMessage('bot', `❌ Erreur : ${err.message}\n\nVérifie ta clé API pis réessaie!`);
    console.error(err);
  } finally {
    isStreaming = false;
    sendBtn.disabled = !chatInput.value.trim();
  }
}
