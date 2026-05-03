import React, { useEffect, useRef } from 'react';

export default function MatrixRain() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const fontSize = 16;
    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    let colonnes = Math.floor(canvas.width / fontSize);
    let gouttes  = Array(colonnes).fill(1);

    const draw = () => {
      // Fond semi-transparent pour l'effet de traîne
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#00ff41';
      ctx.font = `${fontSize}px monospace`;

      // Recalcule les colonnes si resize a eu lieu
      colonnes = Math.floor(canvas.width / fontSize);
      if (gouttes.length !== colonnes) {
        gouttes = Array(colonnes).fill(1);
      }

      for (let i = 0; i < gouttes.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = gouttes[i] * fontSize;

        // Tête de la goutte plus brillante
        ctx.fillStyle = '#afffbc';
        ctx.fillText(char, x, y);

        // Remet la couleur verte pour les suivantes
        ctx.fillStyle = '#00ff41';

        if (y > canvas.height && Math.random() > 0.975) {
          gouttes[i] = 0;
        }
        gouttes[i]++;
      }
    };

    const interval = setInterval(draw, 45);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        opacity: 0.5,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}