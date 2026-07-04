/* ============================================================
   MOL MANETA — galaxy-bg.js
   Animated galaxy background: stars, nebula, planets, particles.
   Self-contained, respects prefers-reduced-motion, pauses when
   the tab is hidden to save battery/CPU.
   ============================================================ */
(function () {
  'use strict';

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function init() {
    const host = document.getElementById('galaxy-bg');
    if (!host) return;

    const canvas = document.createElement('canvas');
    canvas.id = 'galaxy-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    host.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    let stars = [], particles = [], nebulae = [], planets = [];
    let running = true;
    let mouseX = 0.5, mouseY = 0.5;

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }

    function build() {
      const starCount = Math.min(180, Math.floor((w * h) / 9000));
      stars = Array.from({ length: starCount }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.4 + 0.3,
        tw: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.4 + 0.15
      }));

      const particleCount = reduceMotion ? 0 : Math.min(40, Math.floor(w / 40));
      particles = Array.from({ length: particleCount }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 2 + 0.6,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        hue: Math.random() < 0.5 ? '0,229,255' : '168,85,247'
      }));

      nebulae = [
        { x: w * 0.15, y: h * 0.2, r: Math.max(w, h) * 0.35, color: '0,229,255', drift: 0.02 },
        { x: w * 0.85, y: h * 0.75, r: Math.max(w, h) * 0.4, color: '168,85,247', drift: -0.015 },
        { x: w * 0.5, y: h * 0.9, r: Math.max(w, h) * 0.3, color: '57,255,20', drift: 0.01 }
      ];

      planets = reduceMotion ? [] : [
        { x: w * 0.88, y: h * 0.18, r: 46, color: '#38bdf8', ring: true, speed: 0.02, angle: 0 },
        { x: w * 0.08, y: h * 0.62, r: 26, color: '#a855f7', ring: false, speed: 0.015, angle: Math.PI }
      ];
    }

    function drawNebulae(t) {
      nebulae.forEach(n => {
        const nx = n.x + Math.sin(t * n.drift) * 40;
        const ny = n.y + Math.cos(t * n.drift * 0.7) * 30;
        const grad = ctx.createRadialGradient(nx, ny, 0, nx, ny, n.r);
        grad.addColorStop(0, `rgba(${n.color},0.08)`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      });
    }

    function drawStars(t) {
      ctx.save();
      stars.forEach(s => {
        const twinkle = 0.5 + Math.sin(t * s.speed + s.tw) * 0.5;
        ctx.globalAlpha = 0.25 + twinkle * 0.6;
        ctx.fillStyle = '#e8f6ff';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    function drawParticles() {
      particles.forEach(p => {
        p.x += p.vx + (mouseX - 0.5) * 0.06;
        p.y += p.vy + (mouseY - 0.5) * 0.06;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${p.hue},0.55)`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    function drawPlanets(t) {
      planets.forEach(p => {
        p.angle += p.speed * 0.01;
        const px = p.x + Math.sin(p.angle) * 14;
        const py = p.y + Math.cos(p.angle * 0.6) * 10;
        const grad = ctx.createRadialGradient(px - p.r * 0.3, py - p.r * 0.3, p.r * 0.1, px, py, p.r);
        grad.addColorStop(0, p.color);
        grad.addColorStop(1, 'rgba(5,8,16,0.9)');
        ctx.save();
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 24;
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, p.r, 0, Math.PI * 2);
        ctx.fill();
        if (p.ring) {
          ctx.strokeStyle = 'rgba(255,255,255,0.25)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(px, py, p.r * 1.7, p.r * 0.5, -0.4, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      });
    }

    function frame(ts) {
      if (!running) return;
      const t = ts / 1000;
      ctx.clearRect(0, 0, w, h);
      drawNebulae(t);
      drawStars(t);
      if (!reduceMotion) { drawParticles(); drawPlanets(t); }
      requestAnimationFrame(frame);
    }

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('mousemove', e => {
      mouseX = e.clientX / w; mouseY = e.clientY / h;
    }, { passive: true });
    document.addEventListener('visibilitychange', () => {
      running = !document.hidden;
      if (running) requestAnimationFrame(frame);
    });

    resize();
    requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
