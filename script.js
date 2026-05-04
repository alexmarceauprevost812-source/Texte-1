const chatMessages   = document.getElementById('chatMessages');
const userInput      = document.getElementById('userInput');
const btnSend        = document.getElementById('btnSend');
const btnPlus        = document.getElementById('btnPlus');
const attachMenu     = document.getElementById('attachMenu');
const fileInput      = document.getElementById('fileInput');
const zipInput       = document.getElementById('zipInput');
const filePreviewBar = document.getElementById('filePreviewBar');

let pendingFiles = [];

// === MENU + ===
btnPlus.addEventListener('click', (e) => {
  e.stopPropagation();
  const isOpen = attachMenu.classList.toggle('visible');
  btnPlus.classList.toggle('open', isOpen);
});

document.addEventListener('click', () => {
  attachMenu.classList.remove('visible');
  btnPlus.classList.remove('open');
});

attachMenu.addEventListener('click', (e) => e.stopPropagation());

// === GESTION FICHIERS ===
function handleFiles(files) {
  Array.from(files).forEach(file => {
    if (pendingFiles.find(f => f.name === file.name && f.size === file.size)) return;
    pendingFiles.push(file);
    addFileChip(file);
  });
  attachMenu.classList.remove('visible');
  btnPlus.classList.remove('open');
}

fileInput.addEventListener('change', () => handleFiles(fileInput.files));
zipInput.addEventListener('change',  () => handleFiles(zipInput.files));

function getFileIcon(file) {
  const n = file.name.toLowerCase();
  if (/\.(zip|tar|gz|rar|7z)$/.test(n)) return '🗜️';
  if (/\.(jpg|jpeg|png|gif|webp|svg)$/.test(n)) return '🖼️';
  if (/\.(pdf)$/.test(n)) return '📕';
  if (/\.(mp4|mov|avi)$/.test(n)) return '🎬';
  if (/\.(mp3|wav)$/.test(n)) return '🎵';
  if (/\.(doc|docx)$/.test(n)) return '📝';
  if (/\.(xls|xlsx|csv)$/.test(n)) return '📊';
  return '📄';
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' o';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
  return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
}

function addFileChip(file) {
  const chip = document.createElement('div');
  chip.className = 'file-chip';

  const icon   = document.createElement('span');
  icon.textContent = getFileIcon(file);

  const name   = document.createElement('span');
  name.textContent = file.name;
  name.title = file.name;

  const size   = document.createElement('span');
  size.textContent = formatSize(file.size);
  size.style.opacity = '0.6';

  const remove = document.createElement('span');
  remove.className = 'chip-remove';
  remove.textContent = '✕';
  remove.title = 'Retirer';
  remove.addEventListener('click', () => {
    pendingFiles = pendingFiles.filter(f => !(f.name === file.name && f.size === file.size));
    chip.remove();
    fileInput.value = '';
    zipInput.value  = '';
  });

  chip.append(icon, name, size, remove);
  filePreviewBar.appendChild(chip);
}

// === ENVOI ===
function sendMessage() {
  const text = userInput.value.trim();
  if (!text && pendingFiles.length === 0) return;

  pendingFiles.forEach(file => {
    addMessage('user', `${getFileIcon(file)} ${file.name} (${formatSize(file.size)})`, true);
  });

  if (text) addMessage('user', text);

  const hasFiles = pendingFiles.length > 0;
  setTimeout(() => {
    if (hasFiles && text) {
      addMessage('bot', `Reçu : ${pendingFiles.length} fichier(s) et ton message !`);
    } else if (hasFiles) {
      addMessage('bot', `Reçu : ${pendingFiles.length} fichier(s). Je les regarde !`);
    } else {
      addMessage('bot', 'Message reçu 👍');
    }
    pendingFiles = [];
    filePreviewBar.innerHTML = '';
    fileInput.value = '';
    zipInput.value  = '';
  }, 500);

  userInput.value = '';
  userInput.style.height = 'auto';
}

function addMessage(role, text, isFile = false) {
  const div    = document.createElement('div');
  div.className = `message ${role}`;
  const bubble = document.createElement('span');
  bubble.className = 'bubble' + (isFile ? ' file-bubble' : '');
  bubble.textContent = text;
  div.appendChild(bubble);
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// === EVENTS ===
btnSend.addEventListener('click', sendMessage);

userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

userInput.addEventListener('input', () => {
  userInput.style.height = 'auto';
  userInput.style.height = Math.min(userInput.scrollHeight, 100) + 'px';
});
