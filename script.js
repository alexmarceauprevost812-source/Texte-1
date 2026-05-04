// ─── CONFIG ───────────────────────────────────────────
const SPEED_MS = 45;   // délai entre chaque lettre (ms)

// Réponses automatiques du bot
const BOT_REPLIES = [
  "Salut! Comment ça va aujourd'hui?",
  "C'est une bonne question, je réfléchis...",
  "Faque t'as besoin d'aide avec quoi exactement?",
  "OK je comprends, laisse-moi regarder ça!",
  "C'est parfait, on continue de même!",
  "Bonne idée, on peut faire ça pour sûr!",
  "Hm, intéressant... T'as pensé à une autre approche?",
  "Roger ça, je vais chercher la meilleure solution.",
];

let botReplyIndex = 0;
let isTyping = false;

// ─── ÉLÉMENTS DOM ─────────────────────────────────────
const chatMessages = document.getElementById('chatMessages');
const userInput    = document.getElementById('userInput');
const sendBtn      = document.getElementById('sendBtn');

// ─── INIT : message de bienvenue ──────────────────────
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    addMessage('Allo! Écris quelque chose pis je vais répondre lettre par lettre 😄', 'bot');
  }, 600);
});

// ─── EVENTS ───────────────────────────────────────────
sendBtn.addEventListener('click', handleSend);
userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleSend();
});

// ─── HANDLE SEND ──────────────────────────────────────
function handleSend() {
  const text = userInput.value.trim();
  if (!text || isTyping) return;

  userInput.value = '';

  // Message de l'utilisateur — typewriter aussi!
  addMessage(text, 'user');

  // Réponse du bot après un délai
  const reply = BOT_REPLIES[botReplyIndex % BOT_REPLIES.length];
  botReplyIndex++;

  // Délai avant que le bot réponde (simule qu'il "réfléchit")
  const botDelay = text.length * SPEED_MS + 400;

  setTimeout(() => {
    addMessage(reply, 'bot');
  }, botDelay);
}

// ─── AJOUTER UNE BULLE AVEC TYPEWRITER ────────────────
function addMessage(text, sender) {
  isTyping = true;

  // Créer la rangée
  const row = document.createElement('div');
  row.classList.add('message-row', sender);

  // Avatar (seulement pour le bot)
  if (sender === 'bot') {
    const av = document.createElement('div');
    av.classList.add('bubble-avatar');
    av.textContent = 'AL';
    row.appendChild(av);
  }

  // Bulle
  const bubble = document.createElement('div');
  bubble.classList.add('bubble');

  // Curseur clignotant
  const cursor = document.createElement('span');
  cursor.classList.add('cursor');
  bubble.appendChild(cursor);

  row.appendChild(bubble);
  chatMessages.appendChild(row);
  scrollToBottom();

  // Typewriter lettre par lettre
  let i = 0;
  const interval = setInterval(() => {
    if (i < text.length) {
      // Insère la lettre AVANT le curseur
      bubble.insertBefore(document.createTextNode(text[i]), cursor);
      i++;
      scrollToBottom();
    } else {
      // Fin — retire le curseur
      clearInterval(interval);
      cursor.remove();
      isTyping = false;
    }
  }, SPEED_MS);
}

// ─── SCROLL EN BAS ────────────────────────────────────
function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}