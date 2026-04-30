/**
 * matrix.js — Pluie de caractères orange
 */
(function () {
  const canvas = document.getElementById('matrix-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, cols, drops;

  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*<>[]{}|アイウエオカキクケコサシスセソタチツテトナニヌネノ';
  const FONT_SIZE = 16;

  function init() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    cols  = Math.floor(W / FONT_SIZE);
    drops = Array(cols).fill(1);
  }

  function draw() {
    // Traîne sombre
    ctx.fillStyle = 'rgba(10, 10, 10, 0.05)';
    ctx.fillRect(0, 0, W, H);

    ctx.font = FONT_SIZE + 'px monospace';

    for (let i = 0; i < drops.length; i++) {
      const char = CHARS[Math.floor(Math.random() * CHARS.length)];
      const y    = drops[i] * FONT_SIZE;

      // Tête de colonne = orange vif
      if (drops[i] * FONT_SIZE < FONT_SIZE * 2) {
        ctx.fillStyle = '#ffffff';
      } else {
        // Dégradé orange → orange foncé selon la position
        const ratio = Math.min(drops[i] / (H / FONT_SIZE), 1);
        const r = 255;
        const g = Math.floor(107 - ratio * 60);  // 107 → ~47
        const b = 0;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
      }

      ctx.fillText(char, i * FONT_SIZE, y);

      // Reset aléatoire
      if (y > H && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
  }

  init();
  window.addEventListener('resize', init);
  setInterval(draw, 45);
})();
