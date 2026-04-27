const messagesEl  = document.getElementById('messages');
const userInput   = document.getElementById('userInput');
const codeContent = document.getElementById('codeContent');
const lineCount   = document.getElementById('lineCount');
const langBadge   = document.getElementById('langBadge');
const studioTabs  = document.getElementById('studioTabs');
const historyList = document.getElementById('historyList');
const langSelect  = document.getElementById('langSelect');

let sessionCount = 1;
let darkMode     = false;
let allSessions  = [];

// ── Auto-resize textarea ──────────────────
function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 140) + 'px';
}

// ── Entrée / Shift+Entrée ─────────────────
function handleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

// ── Ajouter un message ────────────────────
function addMessage(text, role) {
  const div = document.createElement('div');
  div.className = `message ${role}`;

  const avatar = document.createElement('div');
  avatar.className = `avatar ${role}-avatar`;
  avatar.textContent = role === 'bot' ? '🤖' : '🧑';

  const bubble = document.createElement('div');
  bubble.className = `bubble ${role}-bubble`;

  const p = document.createElement('p');
  p.innerHTML = text;

  const time = document.createElement('div');
  time.className = 'bubble-time';
  time.textContent = new Date().toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' });

  bubble.appendChild(p);
  bubble.appendChild(time);
  div.appendChild(avatar);
  div.appendChild(bubble);
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

// ── Extraire le code ──────────────────────
function extractCode(text) {
  const match = text.match(/