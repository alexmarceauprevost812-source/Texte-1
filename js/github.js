// ═══ GITHUB.JS — Connexion GitHub + chargement repos ═══

document.addEventListener('DOMContentLoaded', () => {
  initGitHub();
});

// ── Init tous les boutons GitHub ────────────────────────────
function initGitHub() {
  const buttons = [
    { btn: 'btnGH',  st: 'ghst'  },
    { btn: 'btnGH2', st: 'ghst2' },
    { btn: 'btnGH3', st: 'ghst3' }
  ];

  buttons.forEach(({ btn, st }) => {
    const el = document.getElementById(btn);
    if (!el) return;
    el.addEventListener('click', () => connectGitHub());
  });
}

// ── Connexion GitHub (simulation OAuth) ─────────────────────
function connectGitHub() {
  if (SK.ghConn) {
    disconnectGitHub();
    return;
  }

  // État chargement
  setAllGHButtons('loading');

  // Simule la connexion OAuth (1.5s)
  setTimeout(() => {
    SK.ghConn = true;
    SK.ghUser = 'Alexmarceauprevost812';

    setAllGHButtons('connected');
    setAllGHStatus('@' + SK.ghUser, true);
    loadRepos();
    updateProfilGH();

    // Message dans le chat
    addMsg(
      'in',
      '🐙 GitHub connecte en tant que @' + SK.ghUser + ' !\nTes repos sont maintenant visibles dans le panneau. 🟢',
      'Claude'
    );
  }, 1500);
}

// ── Déconnexion GitHub ──────────────────────────────────────
function disconnectGitHub() {
  SK.ghConn = false;
  SK.ghUser = null;

  setAllGHButtons('default');
  setAllGHStatus('Non connecte', false);
  clearRepos();
}

// ── Mettre à jour tous les boutons GH ───────────────────────
function setAllGHButtons(state) {
  const ids = ['btnGH', 'btnGH2', 'btnGH3'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    el.disabled = state === 'loading';
    el.classList.toggle('ok', state === 'connected');

    switch (state) {
      case 'loading':
        el.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Connexion...';
        break;
      case 'connected':
        el.innerHTML = '<i class="fa-brands fa-github"></i> Connecte ✓';
        break;
      default:
        el.innerHTML = '<i class="fa-brands fa-github"></i> Connecter GitHub';
    }
  });
}

// ── Mettre à jour tous les statuts GH ───────────────────────
function setAllGHStatus(text, online) {
  const ids = ['ghst', 'ghst2', 'ghst3'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    el.classList.toggle('on', online);
  });
}

// ── Charger les repos ────────────────────────────────────────
function loadRepos() {
  const repos = [
    { name: 'texte-1',     lang: 'JS',   branch: 'Alex', stars: 2 },
    { name: 'portfolio',   lang: 'HTML', branch: 'main', stars: 5 },
    { name: 'skiller-app', lang: 'JS',   branch: 'dev',  stars: 1 },
    { name: 'api-rest',    lang: 'Node', branch: 'main', stars: 3 }
  ];

  // Panneau GitHub gauche
  renderRepoList('rlist2', repos, 'left');

  // Panneau droite
  renderRepoList('rrepos', repos, 'right');

  // Mettre à jour compteur profil
  const repoCount = document.getElementById('repoCount');
  if (repoCount) repoCount.textContent = repos.length;
}

// ── Render liste repos ───────────────────────────────────────
function renderRepoList(containerId, repos, side) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = '';

  repos.forEach(repo => {
    const d = document.createElement('div');
    d.className = side === 'right' ? 'rri' : 'ri';

    if (side === 'right') {
      d.innerHTML = `
        <i class="fa-solid fa-code-branch"></i>
        <div class="rrdet">
          <span class="rrn">${repo.name}</span>
          <span class="rrb">
            <i class="fa-solid fa-code-branch" style="font-size:.55rem"></i>
            ${repo.branch}
          </span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px">
          <span class="rrl">${repo.lang}</span>
          <span style="font-size:.62rem;color:var(--ts)">
            <i class="fa-solid fa-star" style="color:var(--a);font-size:.55rem"></i>
            ${repo.stars}
          </span>
        </div>`;
    } else {
      d.innerHTML = `
        <i class="fa-solid fa-code-branch"></i>
        <div class="rdet">
          <span class="rn">${repo.name}</span>
          <span class="rb">
            <i class="fa-solid fa-code-branch" style="font-size:.55rem"></i>
            ${repo.branch}
          </span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px">
          <span class="rlng">${repo.lang}</span>
          <span style="font-size:.62rem;color:var(--ts)">
            <i class="fa-solid fa-star" style="color:var(--a);font-size:.55rem"></i>
            ${repo.stars}
          </span>
        </div>`;
    }

    d.onclick = () => openRepo(repo.name);
    el.appendChild(d);
  });
}

// ── Vider les repos ──────────────────────────────────────────
function clearRepos() {
  ['rlist2', 'rrepos'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = '<div class="rph-empty">Connecte GitHub pour voir tes repos</div>';
  });
}

// ── Ouvrir un repo dans GitHub ───────────────────────────────
function openRepo(name) {
  window.open('https://github.com/Alexmarceauprevost812/' + name, '_blank');
}

// ── Mettre à jour le profil après connexion GH ──────────────
function updateProfilGH() {
  const uav  = document.getElementById('uav');
  const pravbig = document.getElementById('pravbig');
  const prhandle = document.getElementById('prhandle');
  const uhdl = document.getElementById('uhdl');

  if (SK.ghUser) {
    const initials = SK.ghUser.substring(0, 2).toUpperCase();
    if (uav)      uav.textContent = initials;
    if (pravbig)  pravbig.textContent = initials;
    if (prhandle) prhandle.textContent = '@' + SK.ghUser;
    if (uhdl)     uhdl.textContent = '@' + SK.ghUser;
  }
}