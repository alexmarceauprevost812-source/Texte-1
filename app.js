// ── DOM ──
const menuToggle    = document.getElementById('menuToggle');
const sidebar       = document.getElementById('sidebar');
const overlay       = document.getElementById('overlay');
const sendBtn       = document.getElementById('sendBtn');
const chatInput     = document.getElementById('chatInput');
const chatWindow    = document.getElementById('chatWindow');
const attachBtn     = document.getElementById('attachBtn');
const attachMenu    = document.getElementById('attachMenu');
const attachWrapper = document.getElementById('attachWrapper');
const previewBar    = document.getElementById('previewBar');
const clockEl       = document.getElementById('clock');
const keyBtn        = document.getElementById('keyBtn');
const keyPopup      = document.getElementById('keyPopup');
const keyWrapper    = document.getElementById('keyWrapper');
const apiKeyInput   = document.getElementById('apiKeyInput');
const keySave       = document.getElementById('keySave');
const keyClear      = document.getElementById('keyClear');
const keyEye        = document.getElementById('keyEye');
const keyStatus     = document.getElementById('keyStatus');
const keyField      = document.getElementById('keyField');
const keyDot        = document.getElementById('keyDot');

// ── ÉTAT ──
let pendingFiles = [];
let apiKey       = '';
let apiConnected = false;

// ══════════════════════════════════════
// HORLOGE EN TEMPS RÉEL
// ══════════════════════════════════════
function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  clockEl.textContent = `${h}:${m}:${s}`;
}
updateClock();
setInterval(updateClock, 1000);

// ══════════════════════════════════════
// POPUP CLÉ API
// ══════════════════════════════════════
keyBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  keyPopup.classList.toggle('open');
});

document.addEventListener('click', (e) => {
  if (!keyWrapper.contains(e.target)) {
    keyPopup.classList.remove('open');
  }
});

// Voir / cacher
keyEye.addEventListener('click', () => {
  const isPass = apiKeyInput.type === 'password';
  apiKeyInput.type = isPass ? 'text' : 'password';
  keyEye.textContent = isPass ? '🙈' : '👁️';
});

// Entrée clavier
apiKeyInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') keySave.click();
});

// Connecter
keySave.addEventListener('click', () => {
  if (apiConnected) { disconnectAPI(); return; }
  const key = apiKeyInput.value.trim();
  if (!key) { setStatus('❌ Entre une clé!', 'error'); return; }
  if (!key.startsWith('sk-ant-')) {
    setStatus('⚠️ Doit commencer par sk-ant-...', 'error');
    return;
  }
  setStatus('⏳ Connexion...', 'loading');
  setTimeout(() => {
    sessionStorage.setItem('anthropic_key', key);
    activateAPI(key);
  }, 700);
});

// Effacer
keyClear.addEventListener('click', () => {
  disconnectAPI();
  apiKeyInput.value = '';
});

// Charger clé sauvegardée
const savedKey = sessionStorage.getItem('anthropic_key');
if (savedKey) { apiKeyInput.value = savedKey; activateAPI(savedKey); }

function activateAPI(key) {
  apiKey = key;
  apiConnected = true;
  setStatus('✅ Connectée!', 'success');
  keyBtn.classList.add('connected');
  keyField.classList.add('connected');
  keyDot.classList.add('connected');
  keyDot.classList.remove('error');
  keySave.textContent = 'Déconnecter';
  keySave.classList.add('connected');
  chatInput.disabled = false;
  sendBtn.disabled = false;
  attachBtn.disabled = false;
  chatInput.placeholder = 'Écris ton message...';
  addBotMessage('🔑 Clé connectée! Chu prêt, lâche ta question! 🍁');
  setTimeout(() => keyPopup.classList.remove('open'), 1200);
}

function disconnectAPI() {
  apiKey = '';
  apiConnected = false;
  sessionStorage.removeItem('anthropic_key');
  keyBtn.classList.remove('connected');
  keyField.classList.remove('connected');
  keyDot.classList.remove('connected');
  keyDot.classList.add('error');
  keySave.textContent = 'Connecter';
  keySave.classList.remove('connected');
  setStatus('🔒 Déconnectée.', 'error');
  chatInput.disabled = true;
  sendBtn.disabled = true;
  attachBtn.disabled = true;
  chatInput.placeholder = 'Entre ta clé API 🔑 pour commencer...';
}

function setStatus(msg, type) {
  keyStatus.textContent = msg;
  keyStatus.className = 'key-status ' + type;
}

// ══════════════════════════════════════
// MENU LATÉRAL
// ══════════════════════════════════════
menuToggle.addEventListener('click', () => {
  const open = sidebar.classList.toggle('open');
  overlay.classList.toggle('active', open);
  menuToggle.textContent = open ? '✕' : '☰';
});

overlay.addEventListener('click', () => {
  sidebar.classList.remove('open');
  overlay.classList.remove('active');
  menuToggle.textContent = '☰';
});

// ══════════════════════════════════════
// MENU PIÈCES JOINTES
// ══════════════════════════════════════
attachBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const open = attachMenu.classList.toggle('open');
  attachBtn.classList.toggle('active', open);
});

document.addEventListener('click', (e) => {
  if (!attachWrapper.contains(e.target)) {
    attachMenu.classList.remove('open');
    attachBtn.classList.remove('active');
  }
});

function handleFileInput(inputId, type) {
  const input = document.getElementById(inputId);
  input.addEventListener('change', () => {
    Array.from(input.files).forEach(f => addFileChip(f, type));
    input.value = '';
    attachMenu.classList.remove('open');
    attachBtn.classList.remove('active');
  });
}
handleFileInput('inputFichier', 'file');
handleFileInput('inputZip', 'zip');
handleFileInput('inputImage', 'image');

function addFileChip(file, type) {
  const id = Date.now() + Math.random();
  pendingFiles.push({ id, file, type });
  const chip = document.createElement('div');
  chip.classList.add('preview-chip');
  chip.dataset.id = id;
  const icon = type === 'zip' ? '🗜️ ' : type === 'image' ? '' : '📄 ';
  if (type === 'image') {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.classList.add('preview-thumb');
      chip.prepend(img);
    };
    reader.readAsDataURL(file);
  }
  chip.innerHTML = `<span>${icon}${escapeHTML(file.name)}</span><span class="remove-chip">×</span>`;
  chip.querySelector('.remove-chip').addEventListener('click', () => {
    pendingFiles = pendingFiles.filter(f => f.id !== id);
    chip.remove();
  });
  previewBar.appendChild(chip);
}

// ══════════════════════════════════════
// CHAT
// ══════════════════════════════════════
chatInput.addEventListener('input', () => {
  chatInput.style.height = 'auto';
  chatInput.style.height = chatInput.scrollHeight + 'px';
});

function sendMessage() {
  const text = chatInput.value.trim();
  if (!text && pendingFiles.length === 0) return;
  if (!apiConnected) return;

  if (pendingFiles.length > 0) {
    const attachMsg = document.createElement('div');
    attachMsg.classList.add('message', 'user');
    attachMsg.innerHTML = pendingFiles.map(f => {
      if (f.type === 'image') return `<img src="${URL.createObjectURL(f.file)}" style="max-width:180px;border-radius:8px;display:block;margin-top:6px;" />`;
      return `<div>${f.type === 'zip' ? '🗜️' : '📄'} ${escapeHTML(f.file.name)}</div>`;
    }).join('');
    chatWindow.appendChild(attachMsg);
    pendingFiles = [];
    previewBar.innerHTML = '';
  }

  if (text) {
    const userMsg = document.createElement('div');
    userMsg.classList.add('message', 'user');
    userMsg.innerHTML = `<span>${escapeHTML(text)}</span>`;
    chatWindow.appendChild(userMsg);
  }

  chatInput.value = '';
  chatInput.style.height = 'auto';
  scrollToBottom();

  setTimeout(() => addBotMessage('Chu en train de traiter ça... 🍁'), 600);
}

chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});
sendBtn.addEventListener('click', sendMessage);

// ══════════════════════════════════════
// UTILITAIRES
// ══════════════════════════════════════
function addBotMessage(text) {
  const msg = document.createElement('div');
  msg.classList.add('message', 'bot');
  msg.innerHTML = `<span>${text}</span>`;
  chatWindow.appendChild(msg);
  scrollToBottom();
}

function scrollToBottom() { chatWindow.scrollTop = chatWindow.scrollHeight; }

function escapeHTML(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

document.querySelectorAll('.discussion-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.discussion-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
    menuToggle.textContent = '☰';
  });
});