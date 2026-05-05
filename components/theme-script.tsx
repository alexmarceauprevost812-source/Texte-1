/**
 * Inline script that runs before React hydrates so the user's stored
 * theme + background preferences are applied to <html> before first
 * paint (avoids a flash of default styles).
 */
export function ThemeScript() {
  const code = `
(function () {
  try {
    var COLORS = {
      orange: ['#f97316', '#000000'],
      blue: ['#3b82f6', '#ffffff'],
      yellow: ['#eab308', '#000000'],
      pink: ['#ec4899', '#ffffff'],
      purple: ['#8b5cf6', '#ffffff'],
      red: ['#ef4444', '#ffffff'],
      green: ['#22c55e', '#000000'],
      gray: ['#6b7280', '#ffffff'],
      white: ['#ffffff', '#000000']
    };
    var root = document.documentElement;
    var accent = localStorage.getItem('codex-accent');
    if (accent && COLORS[accent]) {
      root.style.setProperty('--accent', COLORS[accent][0]);
      root.style.setProperty('--accent-text', COLORS[accent][1]);
    }
    var bgMode = localStorage.getItem('codex-bg-mode');
    if (bgMode === 'black' || bgMode === 'white') {
      root.setAttribute('data-bg-mode', bgMode);
    } else {
      root.setAttribute('data-bg-mode', 'black');
    }
    var sidebarStored = localStorage.getItem('codex-sidebar-open');
    var sidebarOpen;
    if (sidebarStored === '1') sidebarOpen = true;
    else if (sidebarStored === '0') sidebarOpen = false;
    else sidebarOpen = window.matchMedia('(min-width: 640px)').matches;
    root.setAttribute('data-sidebar', sidebarOpen ? 'open' : 'closed');
    var font = localStorage.getItem('codex-font');
    if (font === 'manuscrit' || font === 'feutre') {
      root.setAttribute('data-font', font);
    } else {
      root.setAttribute('data-font', 'standard');
    }
  } catch (e) {}
})();
`;
  return (
    <script
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: code }}
    />
  );
}
