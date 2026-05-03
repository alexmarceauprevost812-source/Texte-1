const menuToggle = document.getElementById('menuToggle');
const sidebar    = document.getElementById('sidebar');
const overlay    = document.getElementById('overlay');
const sendBtn    = document.getElementById('sendBtn');
const chatInput  = document.getElementById('chatInput');
const chatWindow = document.getElementById('chatWindow');

// ─── TOGGLE MENU ───
menuToggle.addEventListener('click', () => {
  const isOpen = sidebar.classList.toggle('open');
  overlay.classList.toggle('active', isOpen);
  menuToggle.textContent = isOpen ? '✕' : '☰';
});

// ─── FERMER EN CLIQUANT SUR L'OVERLAY ───
overlay.addEventListener('click', () => {
  sidebar.classList.remove('open');
  overlay.classList.remove('active');
  menuToggle.textContent = '☰';
});

// ─── AUTO-RESIZE TEXTAREA ───
chatInput.addEventListener('input', () => {
  chatInput.style.height = 'auto';
  chatInput.style.height = chatInput.scrollHeight + 'px';
});

// ─── ENVOYER MESSAGE ───
function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  // Message de l'usager
  const userMsg = document.createElement('div');
  userMsg.classList.add('message', 'user');
  userMsg.innerHTML = `<span>${escapeHTML(text)}</span>`;
  chatWindow.appendChild(userMsg);

  chatInput.value = '';
  chatInput.style.height = 'auto';
  scrollToBottom();

  // Réponse simulée du bot
  setTimeout(() => {
    const botMsg = document.createElement('div');
    botMsg.classList.add('message', 'bot');
    botMsg.innerHTML = `<span>Chu en train de traiter ça... 🍁</span>`;
    chatWindow.appendChild(botMsg);
    scrollToBottom();
  }, 600);
}

// ─── ENVOI AVEC TOUCHE ENTRÉE (SHIFT+ENTER = saut de ligne) ───
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

sendBtn.addEventListener('click', sendMessage);

// ─── SCROLL EN BAS ───
function scrollToBottom() {
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// ─── SÉCURITÉ : ESCAPE HTML ───
function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── ITEMS DE DISCUSSION ───
document.querySelectorAll('.discussion-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.discussion-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    // Fermer le menu sur mobile
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
    menuToggle.textContent = '☰';
  });
});