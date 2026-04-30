---

## ⚙️ `js/accueil.js`

```javascript
// ================================
// 🍁 TI-CODEX — ACCUEIL JS
// ================================

// ── MATRIX EFFECT ──
(function initMatrix() {
  const canvas = document.getElementById('matrix');
  const ctx    = canvas.getContext('2d');

  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%<>{}[]|/\\;:'.split('');
  const fontSize = 14;
  const cols   = Math.floor(canvas.width / fontSize);
  const drops  = Array(cols).fill(1);

  function drawMatrix() {
    ctx.fillStyle = 'rgba(6,6,6,0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Alterne lime et orange
    drops.forEach((y, i) => {
      const char = chars[Math.floor(Math.random() * chars.length)];
      ctx.fillStyle = i % 3 === 0 ? '#ff8c00' : '#a6e300';
      ctx.font      = `${fontSize}px Share Tech Mono`;
      ctx.fillText(char, i * fontSize, y * fontSize);

      if (y * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    });
  }

  setInterval(drawMatrix, 50);

  window.addEventListener('resize', () => {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  });
})();

// ── USERS SIMULÉS (localStorage en prod) ──
function getUsers() {
  const u = localStorage.getItem('codex_users');
  return u ? JSON.parse(u) : [
    { pseudo:'Admin',   courriel:'admin@codex.ca',    mdp:'1234' },
    { pseudo:'Ti-Coder',courriel:'ticoder@codex.ca',  mdp:'leboute' }
  ];
}

function saveUsers(users) {
  localStorage.setItem('codex_users', JSON.stringify(users));
}

// ── MODALS ──
function ouvrirConnexion() {
  document.getElementById('modalConnexion').classList.remove('hidden');
}

function ouvrirInscription() {
  document.getElementById('modalInscription').classList.remove('hidden');
}

function fermerModals() {
  document.getElementById('modalConnexion').classList.add('hidden');
  document.getElementById('modalInscription').classList.add('hidden');
  // Clear
  ['lCourriel','lMdp','rPseudo','rCourriel','rMdp','rConfirm']
    .forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
  ['lErr','rErr','rOk']
    .forEach(id => document.getElementById(id)?.classList.add('hidden'));
}

function switchModal(vers) {
  fermerModals();
  setTimeout(() => {
    vers === 'connexion' ? ouvrirConnexion() : ouvrirInscription();
  }, 150);
}

// ── CONNEXION ──
function seConnecter() {
  const courriel = document.getElementById('lCourriel').value.trim().toLowerCase();
  const mdp      = document.getElementById('lMdp').value.trim();
  const err      = document.getElementById('lErr');

  if (!courriel || !mdp) {
    err.textContent = '⚠️ Remplis tous les champs, câline!';
    err.classList.remove('hidden');
    return;
  }

  const users = getUsers();
  const user  = users.find(u =>
    u.courriel.toLowerCase() === courriel && u.mdp === mdp
  );

  if (user) {
    // Sauvegarde session
    sessionStorage.setItem('codex_user', JSON.stringify(user));
    fermerModals();
    toast(`✅ Allô ${user.pseudo}! Connexion réussie! 🍁`);
    // Redirige vers le codex
    setTimeout(() => { window.location.href = 'codex.html'; }, 1200);
  } else {
    err.textContent = '❌ Courriel ou mot de passe incorrect!';
    err.classList.remove('hidden');
    // Shake
    const modal = err.closest('.modal');
    modal.style.animation = 'none';
    setTimeout(() => modal.style.animation = '', 10);
  }
}

// ── INSCRIPTION ──
function sInscrire() {
  const pseudo   = document.getElementById('rPseudo').value.trim();
  const courriel = document.getElementById('rCourriel').value.trim().toLowerCase();
  const mdp      = document.getElementById('rMdp').value.trim();
  const confirm  = document.getElementById('rConfirm').value.trim();
  const err      = document.getElementById('rErr');
  const ok       = document.getElementById('rOk');

  err.classList.add('hidden');