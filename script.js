// SKILLER CODEX AI
const S = {
  key: localStorage.getItem('sk_key') || '',
  model: localStorage.getItem('sk_model') || 'claude-sonnet-4-5',
  ghConn: false,
  msgs: [],
  busy: false,
  convs: [
    { id: 0, name: 'Codex AI', prev: 'Bonjour !', time: 'maintenant', msgs: [] }
  ],
  activeConv: 0
};

const $ = id => document.getElementById(id);
const now = () => { const d = new Date(); return d.getHours() + 'h' + String(d.getMinutes()).padStart(2,'0'); };

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initChat();
  initSettings();
  initGH();
  renderConvs();
  initRightPanel();
  animBars();
  addMsg('in', S.key
    ? 'Cle API chargee ! Je suis Claude, ton Codex AI. Comment puis-je t aider ? 🚀'
    : 'Bienvenue ! Va dans Parametres (engrenage) pour entrer ta cle API Anthropic et activer Claude. 🔑',
    'Claude');
});

// ── NAV SIDEBAR ──
function initNav() {
  document.querySelectorAll('.nb[data-p]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nb').forEach(b => b.classList.remove('on'));
      btn.classList.add('on');
      document.querySelectorAll('.pview').forEach(p => p.classList.remove('on'));
      const t = document.getElementById('p-' + btn.dataset.p);
      if (t) t.classList.add('on');
    });
  });
}

// ── CONVERSATIONS ──
function renderConvs(filter = '') {
  const list = $('clist');
  if (!list) return;
  list.innerHTML = '';
  S.convs.filter(c => c.name.toLowerCase().includes(filter.toLowerCase())).forEach(c => {
    const li = document.createElement('li');
    li.className = 'ci' + (c.id === S.activeConv ? ' on' : '');
    li.innerHTML = `<div class="cav">${c.name.substring(0,2).toUpperCase()}</div><div class="cinfo"><span class="cname">${c.name}</span><span class="cprev">${c.prev}</span></div><span class="ctime">${c.time}</span>`;
    li.onclick = () => selectConv(c.id);
    list.appendChild(li);
  });
}

function selectConv(id) {
  S.activeConv = id;
  S.msgs = S.convs.find(c => c.id === id)?.msgs || [];
  renderConvs();
  const msgEl = $('msgs');
  if (msgEl) {
    msgEl.innerHTML = '';
    S.msgs.forEach(m => msgEl.appendChild(makeMsgEl(m)));
    msgEl.scrollTop = msgEl.scrollHeight;
  }
}

// ── CHAT ──
function initChat() {
  const inp = $('inp');
  const send = $('btnSend');
  const clr = $('btnClrChat');
  const newBtn = $('btnNew');
  const srch = $('srchInp');

  if (send) send.onclick = sendMsg;
  if (inp) inp.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } };
  if (clr) clr.onclick = () => { $('msgs').innerHTML = ''; S.msgs = []; addMsg('in', 'Chat efface. Nouvelle conversation ! 🧹', 'Claude'); };
  if (newBtn) newBtn.onclick = newConv;
  if (srch) srch.oninput = e => renderConvs(e.target.value);
}

function newConv() {
  const name = prompt('Nom de la conversation:');
  if (!name || !name.trim()) return;
  const id = S.convs.length;
  S.convs.unshift({ id, name: name.trim(), prev: 'Nouvelle conversation', time: now(), msgs: [] });
  S.convs.forEach((c, i) => c.id = i);
  S.activeConv = 0;
  S.msgs = [];
  $('msgs').innerHTML = '';
  renderConvs();
  addMsg('in', 'Bienvenue dans ' + name.trim() + ' ! 👋', 'Claude');
}

async function sendMsg() {
  const inp = $('inp');
  const txt = inp?.value.trim();
  if (!txt || S.busy) return;
  addMsg('out', txt);
  S.msgs.push({ role: 'user', content: txt });
  inp.value = '';

  const conv = S.convs.find(c => c.id === S.activeConv);
  if (conv) { conv.prev = txt; conv.time = now(); renderConvs(); }

  if (!S.key) {
    addMsg('in', 'Aucune cle API ! Va dans Parametres (engrenage) pour entrer ta cle Anthropic. 🔑', 'Claude');
    return;
  }
  await callClaude();
}

async function callClaude() {
  S.busy = true;
  const send = $('btnSend');
  if (send) { send.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; send.disabled = true; }

  const tid = addTyping();

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': S.key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-allow-browser': 'true'
      },
      body: JSON.stringify({
        model: S.model,
        max_tokens: 1024,
        system: 'Tu es Codex AI, assistant de developpement integre dans Skiller. Tu aides avec le code, debug, architecture. Reponds en francais, clair et concis.',
        messages: S.msgs
      })
    });

    removeTyping(tid);

    if (!res.ok) {
      const e = await res.json();
      addMsg('in', 'Erreur API: ' + (e.error?.message || 'Erreur inconnue'), 'Claude');
      return;
    }

    const data = await res.json();
    const reply = data.content[0].text;
    S.msgs.push({ role: 'assistant', content: reply });

    const conv = S.convs.find(c => c.id === S.activeConv);
    if (conv) { conv.prev = reply.substring(0, 40) + '...'; conv.msgs = [...S.msgs]; renderConvs(); }

    addMsg('in', reply, 'Claude');

  } catch(e) {
    removeTyping(tid);
    addMsg('in', 'Erreur de connexion. Verifie ta cle API et ta connexion. ❌', 'Claude');
  } finally {
    S.busy = false;
    if (send) { send.innerHTML = '<i class="fa-solid fa-paper-plane"></i>'; send.disabled = false; }
  }
}

function addMsg(type, text, sender) {
  const el = makeMsgEl({ type, text, sender, time: now() });
  const container = $('msgs');
  if (!container) return;
  container.appendChild(el);
  container.scrollTop = container.scrollHeight;
  return el;
}

function makeMsgEl(m) {
  const d = document.createElement('div');
  d.className = 'msg ' + (m.type === 'out' ? 'out' : 'in');
  if (m.type === 'in') {
    d.innerHTML = `<div class="mav">${(m.sender||'AI').substring(0,2).toUpperCase()}</div><div class="mc"><span class="msnd">${m.sender||'Claude'}</span><p>${esc(m.text)}</p><span class="mt">${m.time}</span></div>`;
  } else {
    d.innerHTML = `<div class="mc"><p>${esc(m.text)}</p><span class="mt">${m.time} <i class="fa-solid fa-check-double" style="color:var(--a);font-size:.55rem"></i></span></div>`;
  }
  d.style.opacity = '0';
  d.style.transform = m.type === 'out' ? 'translateX(16px)' : 'translateX(-16px)';
  requestAnimationFrame(() => {
    d.style.transition = 'all .22s ease';
    d.style.opacity = '1';
    d.style.transform = 'none';
  });
  return d;
}

function addTyping() {
  const id = 'typ-' + Date.now();
  const container = $('msgs');
  if (!container) return id;
  const d = document.createElement('div');
  d.id = id;
  d.className = 'msg in';
  d.innerHTML = `<div class="mav">AI</div><div class="mc"><span class="msnd">Claude</span><p style="display:flex;gap:5px;align-items:center;padding:8px 14px"><span class="dot"></span><span class="dot"></span><span class="dot"></span></p></div>`;
  container.appendChild(d);
  container.scrollTop = container.scrollHeight;
  return id;
}

function removeTyping(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function esc(t) {
  return t
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/\n/g,'<br/>');
}

// ── SETTINGS ──
function initSettings() {
  const keyInp = $('apiKey');
  const btnSave = $('btnSave');
  const btnClr = $('btnClr');
  const btnEye = $('btnEye');
  const kst = $('kst');
  const msel = $('msel');

  if (S.key && keyInp) {
    keyInp.value = S.key;
    showKst('ok', 'Cle chargee — Claude est actif !');
  }
  if (msel) {
    msel.value = S.model;
    msel.onchange = () => { S.model = msel.value; localStorage.setItem('sk_model', S.model); };
  }
  if (btnEye) btnEye.onclick = () => {
    const show = keyInp.type === 'password';
    keyInp.type = show ? 'text' : 'password';
    btnEye.innerHTML = show ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
  };
  if (btnSave) btnSave.onclick = () => {
    const v = keyInp?.value.trim();
    if (!v) { showKst('err', 'Entre une cle valide.'); return; }
    if (!v.startsWith('sk-ant-')) { showKst('err', 'La cle doit commencer par sk-ant-...'); return; }
    S.key = v;
    localStorage.setItem('sk_key', v);
    showKst('ok', 'Cle sauvegardee ! Claude est actif.');
    addMsg('in', 'Cle API activee ! Je suis Claude, pret a t aider. 🔑', 'Claude');
  };
  if (btnClr) btnClr.onclick = () => {
    S.key = '';
    localStorage.removeItem('sk_key');
    if (keyInp) keyInp.value = '';
    showKst('err', 'Cle effacee.');
    setTimeout(() => { if (kst) kst.className = 'kst'; }, 2000);
  };

  function showKst(type, msg) {
    if (!kst) return;
    kst.textContent = msg;
    kst.className = 'kst ' + type;
  }

  // Settings GitHub button
  const btnGH3 = $('btnGH3');
  const ghst3 = $('ghst3');
  if (btnGH3) btnGH3.onclick = () => connectGH(btnGH3, ghst3);
}

// ── GITHUB ──
function initGH() {
  const pairs = [[$('btnGH'), $('ghst')], [$('btnGH2'), $('ghst2')]];
  pairs.forEach(([btn, st]) => {
    if (!btn) return;
    btn.onclick = () => connectGH(btn, st);
  });
}

function connectGH(btn, st) {
  if (S.ghConn) return;
  if (btn) { btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Connexion...'; btn.disabled = true; }
  setTimeout(() => {
    S.ghConn = true;
    // Mettre a jour tous les boutons GH
    [$('btnGH'), $('btnGH2'), $('btnGH3')].forEach(b => {
      if (!b) return;
      b.innerHTML = '<i class="fa-brands fa-github"></i> Connecte ✓';
      b.classList.add('ok');
      b.disabled = false;
    });
    [$('ghst'), $('ghst2'), $('ghst3')].forEach(s => {
      if (!s) return;
      s.textContent = '@Alexmarceauprevost812';
      s.classList.add('on');
    });
    loadRepos();
    addMsg('in', 'GitHub connecte ! Repos charges dans le panneau. 🐙', 'Claude');
  }, 1500);
}

function loadRepos() {
  const repos = [
    { name: 'texte-1', lang: 'JS', branch: 'Alex', stars: 2 },
    { name: 'portfolio', lang: 'HTML', branch: 'main', stars: 5 },
    { name: 'skiller-app', lang: 'JS', branch: 'dev', stars: 1 },
    { name: 'api-rest', lang: 'Node', branch: 'main', stars: 3 }
  ];
  ['rlist2', 'rrepos'].forEach(lid => {
    const el = $(lid);
    if (!el) return;
    el.innerHTML = '';
    repos.forEach(r => {
      const d = document.createElement('div');
      d.className = lid === 'rrepos' ? 'rri' : 'ri';
      d.innerHTML = `<i class="fa-solid fa-code-branch"></i><div class="${lid==='rrepos'?'rrdet':'rdet'}"><span class="${lid==='rrepos'?'rrn':'rn'}">${r.name}</span><span class="${lid==='rrepos'?'rrb':'rb'}"><i class="fa-solid fa-code-branch" style="font-size:.55rem"></i> ${r.branch}</span></div><span class="${lid==='rrepos'?'rrl':'rlng'}">${r.lang}</span>`;
      d.onclick = () => window.open('https://github.com/Alexmarceauprevost812/' + r.name, '_blank');
      el.appendChild(d);
    });
  });
  const rc = $('repoCount');
  if (rc) rc.textContent = repos.length;
}

// ── RIGHT PANEL ──
function initRightPanel() {
  const ref = $('btnRefresh');
  if (ref) ref.onclick = () => { if (S.ghConn) loadRepos(); };
}

// ── SKILL BARS ANIMATION ──
function animBars() {
  document.querySelectorAll('.skfill, .rfill').forEach(b => {
    const w = b.style.width;
    b.style.width = '0%';
    setTimeout(() => { b.style.transition = 'width 1s cubic-bezier(.4,0,.2,1)'; b.style.width = w; }, 500);
  });
}
