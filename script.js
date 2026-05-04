// ========== STATE ==========
let conversations = JSON.parse(localStorage.getItem('codex_convs') || '[]');
let currentConvId = null;
let apiKey = localStorage.getItem('codex_api_key') || '';
let isStreaming = false;

// ========== DOM ==========
const sidebar           = document.getElementById('sidebar');
const toggleSidebar     = document.getElementById('toggleSidebar');
const mobileMenuBtn     = document.getElementById('mobileMenuBtn');
const newChatBtn        = document.getElementById('newChatBtn');
const conversationsList = document.getElementById('conversationsList');
const chatMessages      = document.getElementById('chatMessages');
const welcomeScreen     = document.getElementById('welcomeScreen');
const chatInput         = document.getElementById('chatInput');
const sendBtn           = document.getElementById('sendBtn');
const apiKeyInput       = document.getElementById('apiKeyInput');
const saveKeyBtn        = document.getElementById('saveKeyBtn');
const keyStatus         = document.getElementById('keyStatus');
const convTitle         = document.getElementById('convTitle');
const clearBtn          = document.getElementById('clearBtn');

// ========== INIT ==========
if (apiKey) {
  apiKeyInput.value = apiKey;
  keyStatus.textContent = '✓ Clé chargée';
  keyStatus.className = 'key-status ok';
}

renderConversationsList();

// ========== SIDEBAR TOGGLE ==========
toggleSidebar.addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
});

mobileMenuBtn.addEventListener('click', () => {
  sidebar.classList.toggle('mobile-open');
});

document.addEventListener('click', (e) => {
  if (window.innerWidth <= 640 &&
      !sidebar.contains(e.target) &&
      e.target !== mobileMenuBtn) {
    sidebar.classList.remove('mobile-open');
  }
});

// ========== API KEY ==========
saveKeyBtn.addEventListener('click', () => {
  const key = apiKeyInput.value.trim();
  if (!key.startsWith('sk-ant-')) {
    keyStatus.textContent = '✗ Format invalide (sk-ant-...)';
    keyStatus.className = 'key-status err';
    return;
  }
  apiKey = key;
  localStorage.setItem('codex_api_key', key);
  keyStatus.textContent = '✓ Clé sauvegardée!';
  keyStatus.className = 'key-status ok';
  setTimeout(() => {
    keyStatus.textContent = '✓ Clé chargée';
  }, 2000);
});

apiKeyInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') saveKeyBtn.click();
});

// ========== CONVERSATIONS ==========
function saveConversations() {
  localStorage.setItem('codex_convs', JSON.stringify(conversations));
}

function getCurrentConv() {
  return conversations.find(c => c.id === currentConvId) || null;
}

function createNewConversation() {
  const id = 'conv_' + Date.now();
  const conv = {
    id,
    title: 'Nouvelle conversation',
    messages: [],
    createdAt: Date.now()
  };
  conversations.unshift(conv);
  saveConversations();
  return conv;
}

function loadConversation(id) {
  currentConvId = id;
  const conv = getCurrentConv();
  if (!conv) return;

  convTitle.textContent = conv.title;

  // Vide les messages
  chatMessages.innerHTML = '';

  if (conv.messages.length === 0) {
    chatMessages.appendChild(welcomeScreen);
  } else {
    conv.messages.forEach(msg => {
      appendMessage(msg.role, msg.content, false);
    });
  }

  renderConversationsList();
  scrollToBottom();
}

function renderConversationsList() {
  conversationsList.innerHTML = '';

  if (conversations.length === 0) {
    conversationsList.innerHTML =
      '<div style="padding:12px;font-size:12px;color:var(--text-muted);text-align:center;">Aucune conversation</div>';
    return;
  }

  conversations.forEach(conv => {
    const item = document.createElement('div');
    item.className = 'conv-item' + (conv.id === currentConvId ? ' active' : '');
    item.innerHTML = `
      <span class="conv-icon">💬</span>
      <span class="conv-name">${escapeHtml(conv.title)}</span>
      <button class="conv-delete" title="Supprimer">✕</button>
    `;

    item.addEventListener('click', (e) => {
      if (e.target.classList.contains('conv-delete')) {
        deleteConversation(conv.id);
        return;
      }
      loadConversation(conv.id);
    });

    conversationsList.appendChild(item);
  });
}

function deleteConversation(id) {
  conversations = conversations.filter(c => c.id !== id);
  saveConversations();
  if (currentConvId === id) {
    currentConvId = null;
    chatMessages.innerHTML = '';
    chatMessages.appendChild(welcomeScreen);
    convTitle.textContent = 'Nouvelle conversation';
  }
  renderConversationsList();
}

// ========== NOUVEAU CHAT ==========
newChatBtn.addEventListener('click', () => {
  const conv = createNewConversation();
  loadConversation(conv.id);
});

clearBtn.addEventListener('click', () => {
  if (!currentConvId) return;
  const conv = getCurrentConv();
  if (!conv) return;
  if (!confirm('Effacer les messages de cette conversation?')) return;
  conv.messages = [];
  conv.title = 'Nouvelle conversation';
  saveConversations();
  loadConversation(currentConvId);
});

// ========== MESSAGES UI ==========
function appendMessage(role, content, animate = true) {
  // Cache welcome screen
  const ws = document.getElementById('welcomeScreen');
  if (ws) ws.remove();

  const row = document.createElement('div');
  row.className = `message-row ${role}`;
  if (!animate) row.style.animation = 'none';

  const avatarEmoji = role === 'bot' ? '🧠' : '👤';
  const bubble = document.createElement('div');
  bubble.className = `bubble ${role}`;
  bubble.innerHTML = formatContent(content);

  row.innerHTML = `<div class="avatar ${role}">${avatarEmoji}</div>`;
  row.appendChild(bubble);

  chatMessages.appendChild(row);
  scrollToBottom();
  return bubble;
}

function appendTypingIndicator() {
  const ws = document.getElementById('welcomeScreen');
  if (ws) ws.remove();

  const row = document.createElement('div');
  row.className = 'message-row bot';
  row.id = 'typingRow';
  row.innerHTML = `
    <div class="avatar bot">🧠</div>
    <div class="bubble bot">
      <div class="typing-indicator">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;
  chatMessages.appendChild(row);
  scrollToBottom();
  return row;
}

function removeTypingIndicator() {
  const el = document.getElementById('typingRow');
  if (el) el.remove();
}

function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function formatContent(text) {
  // Code blocks
  text = text.replace(/```([\s\S]*?)```/g, (_, code) => {
    return `<pre><code>${escapeHtml(code.trim())}</code></pre>`;
  });
  // Inline code
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Bold
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic
  text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Line breaks
  text = text.replace(/\n/g, '<br/>');
  return text;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ========== INPUT AUTO-RESIZE ==========
chatInput.addEventListener('input', () => {
  chatInput.style.height = 'auto';
  chatInput.style.height = Math.min(chatInput.scrollHeight, 180) + 'px';
  sendBtn.disabled = chatInput.value.trim() === '' || isStreaming;
});

chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (!sendBtn.disabled) sendMessage();
  }
});

sendBtn.addEventListener('click', sendMessage);

// Helper pour les chips de bienvenue
window.setInput = (text) => {
  chatInput.value = text;
  chatInput.dispatchEvent(new Event('input'));
  chatInput.focus();
};

// ========== ENVOYER MESSAGE ==========
async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text || isStreaming) return;

  if (!apiKey) {
    alert('Entre ta clé Anthropic dans le menu de gauche d\'abord! 🔑');
    return;
  }

  // Crée une conv si aucune
  if (!currentConvId) {
    const conv = createNewConversation();
    currentConvId = conv.id;
    renderConversationsList();
  }

  const conv = getCurrentConv();

  // Ajoute message user
  conv.messages.push({ role: 'user', content: text });
  appendMessage('user', text);

  // Update titre si premier message
  if (conv.messages.length === 1) {
    conv.title = text.slice(0, 40) + (text.length > 40 ? '...' : '');
    convTitle.textContent = conv.title;
  }

  saveConversations();
  renderConversationsList();

  // Reset input
  chatInput.value = '';
  chatInput.style.height = 'auto';
  sendBtn.disabled = true;

  // Indicateur de frappe
  appendTypingIndicator();
  isStreaming = true;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 2048,
        stream: true,
        system: 'Tu es Codex, un assistant IA intelligent, précis et convivial. Tu réponds en français québécois naturel quand l\'utilisateur parle français.',
        messages: conv.messages.map(m => ({
          role: m.role === 'bot' ? 'assistant' : 'user',
          content: m.content
        }))
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || `Erreur ${response.status}`);
    }

    removeTypingIndicator();
    const botBubble = appendMessage('bot', '', true);
    let fullText = '';

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'content_block_delta' &&
              parsed.delta?.type === 'text_delta') {
            fullText += parsed.delta.text;
            botBubble.innerHTML = formatContent(fullText);
            scrollToBottom();
          }
        } catch (_) {}
      }
    }

    // Sauvegarde réponse
    conv.messages.push({ role: 'bot', content: fullText });
    saveConversations();

  } catch (err) {
    removeTypingIndicator();
    appendMessage('bot', `❌ Erreur : ${err.message}\n\nVérifie ta clé API pis réessaie!`);
    console.error(err);
  } finally {
    isStreaming = false;
    sendBtn.disabled = chatInput.value.trim() === '';
  }
}
