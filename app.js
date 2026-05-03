const menuToggle  = document.getElementById('menuToggle');
const sidebar     = document.getElementById('sidebar');
const overlay     = document.getElementById('overlay');
const sendBtn     = document.getElementById('sendBtn');
const chatInput   = document.getElementById('chatInput');
const chatWindow  = document.getElementById('chatWindow');
const attachBtn   = document.getElementById('attachBtn');
const attachMenu  = document.getElementById('attachMenu');
const attachWrapper = document.getElementById('attachWrapper');
const previewBar  = document.getElementById('previewBar');

// ─── FICHIERS EN ATTENTE ───
let pendingFiles = [];

// ══════════════════════════════
// TOGGLE MENU LATÉRAL
// ══════════════════════════════
menuToggle.addEventListener('click', () => {
  const isOpen = sidebar.classList.toggle('open');
  overlay.classList.toggle('active', isOpen);
  menuToggle.textContent = isOpen ? '✕' : '☰';
});

overlay.addEventListener('click', () => {
  sidebar.classList.remove('open');
  overlay.classList.remove('active');
  menuToggle.textContent = '☰';
});

// ══════════════════════════════
// TOGGLE MENU PIÈCES JOINTES
// ══════════════════════════════
attachBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const isOpen = attachMenu.classList.toggle('open');
  attachBtn.classList.toggle('active', isOpen);
});

// Fermer le menu si on clique ailleurs
document.addEventListener('click', (e) => {
  if (!attachWrapper.contains(e.target)) {
    attachMenu.classList.remove('open');
    attachBtn.classList.remove('active');
  }
});

// ══════════════════════════════
// GESTION DES FICHIERS
// ══════════════════════════════
function handleFileInput(inputId, type) {
  const input = document.getElementById(inputId);
  input.addEventListener('change', () => {
    const files = Array.from(input.files);
    files.forEach(file => addFileChip(file, type));
    input.value = '';
    attachMenu.classList.remove('open');
    attachBtn.classList.remove('active');
  });
}

handleFileInput('inputFichier', 'file');
handleFileInput('inputZip',     'zip');
handleFileInput('inputImage',   'image');

function addFileChip(file, type) {
  const id = Date.now() + Math.random();
  pendingFiles.push({ id, file, type });

  const chip = document.createElement('div');
  chip.classList.add('preview-chip');
  chip.dataset.id = id;

  let iconHTML = '';

  if (type === 'image') {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.classList.add('preview-thumb');
      chip.prepend(img);
    };
    reader.readAsDataURL(file);
    iconHTML = '';
  } else if (type === 'zip') {
    iconHTML = '🗜️ ';
  } else {
    iconHTML = '📄 ';
  }

  chip.innerHTML = `
    <span>${iconHTML}${escapeHTML(file.name)}</span>
    <span class="remove-chip" data-id="${id}">×</span>
  `;

  chip.querySelector('.remove-chip').addEventListener('click', () => {
    pendingFiles = pendingFiles.filter(f => f.id !== id);
    chip.remove();
  });

  previewBar.appendChild(chip);
}

// ══════════════════════════════
// AUTO-RESIZE TEXTAREA
// ══════════════════════════════
chatInput.addEventListener('input', () => {
  chatInput.style.height = 'auto';
  chatInput.style.height = chatInput.scrollHeight + 'px';
});

// ══════════════════════════════
// ENVOYER MESSAGE
// ══════════════════════════════
function sendMessage() {
  const text = chatInput.value.trim();
  if (!text && pendingFiles.length === 0) return;

  // ── Afficher les fichiers joints dans le chat ──
  if (pendingFiles.length > 0) {
    const attachMsg = document.createElement('div');
    attachMsg.classList.add('message', 'user');

    const filesList = pendingFiles.map(f => {
      if (f.type === 'image') {
        return `<img src="${URL.createObjectURL(f.file)}"
                     style="max-width:180px;border-radius:8px;display:block;margin-top:6px;" />`;
      }
      const icon = f.type === 'zip' ? '🗜️' : '📄';
      return `<div>${icon} ${escapeHTML(f.file.name)}</div>`;
    }).join('');

    attachMsg.innerHTML = filesList;
    chatWindow.appendChild(attachMsg);
    pendingFiles = [];
    previewBar.innerHTML = '';
  }

  // ── Afficher le texte ──
  if (text) {
    const userMsg = document.createElement('div');
    userMsg.classList.add('message', 'user');
    userMsg.innerHTML = `<span>${escapeHTML(text)}</span>`;
    chatWindow.appendChild(userMsg);
  }

  chatInput.value = '';
  chatInput.style.height = 'auto';
  scrollToBottom();

  // ── Réponse simulée ──
  setTimeout(() => {
    const botMsg = document.createElement('div');
    botMsg.classList.add('message', 'bot');
    botMsg.innerHTML = `<span>Chu en train de traiter ça... 🍁</span>`;
    chatWindow.appendChild(botMsg);
    scrollToBottom();
  }, 600);
}

chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

sendBtn.addEventListener('click', sendMessage);

// ══════════════════════════════
// SCROLL EN BAS
// ══════════════════════════════
function scrollToBottom() {
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// ══════════════════════════════
// ESCAPE HTML
// ══════════════════════════════
function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ══════════════════════════════
// ITEMS DISCUSSION
// ══════════════════════════════
document.querySelectorAll('.discussion-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.discussion-item')
      .forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
    menuToggle.textContent = '☰';
  });
});