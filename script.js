(\w+)?\n([\s\S]*?)```/);
  if (match) return { lang: match[1] || 'txt', code: match[2].trim() };
  return null;
}

// ── Afficher le code dans le studio ──────
function displayCode(lang, code) {
  codeContent.textContent = code;
  langBadge.textContent   = '🌐 ' + lang.toUpperCase();
  const lines = code.split('\n').length;
  lineCount.textContent   = `📄 ${lines} ligne${lines > 1 ? 's' : ''}`;
  addStudioTab(lang);
}

// ── Onglets studio ────────────────────────
function addStudioTab(lang) {
  const tab = document.createElement('button');
  tab.className = 'tab active';
  tab.textContent = `📄 ${lang.toUpperCase()}`;