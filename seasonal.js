/* ============================================================
   MOL MANETA — seasonal.js
   Seasonal sales campaigns (Ramadan, Eid, Summer, Winter,
   Black Friday, New Year) with a live countdown banner.
   Config is set by the Admin Panel > Seasonal Sales and read
   here from localStorage — no page reload needed on the admin
   side, and this script re-checks on tab focus.
   ============================================================ */
(function () {
  'use strict';

  const KEY = 'mm_seasonal_campaign_v1';

  const CAMPAIGNS = {
    ramadan:   { name: 'رمضان كريم',      emoji: '🌙', grad: 'linear-gradient(90deg,#0f3d3e,#1a5f5f,#0f3d3e)' },
    eid:       { name: 'عيد مبارك',        emoji: '🎉', grad: 'linear-gradient(90deg,#3d2b0f,#a8752f,#3d2b0f)' },
    summer:    { name: 'تخفيضات الصيف',    emoji: '☀️', grad: 'linear-gradient(90deg,#0b3a4a,#00b4d8,#0b3a4a)' },
    winter:    { name: 'تخفيضات الشتاء',   emoji: '❄️', grad: 'linear-gradient(90deg,#0e1f3d,#3b5bdb,#0e1f3d)' },
    blackfriday: { name: 'Black Friday',  emoji: '🖤', grad: 'linear-gradient(90deg,#111,#a855f7,#111)' },
    newyear:   { name: 'رأس السنة',        emoji: '🎆', grad: 'linear-gradient(90deg,#1a0b3d,#e879f9,#1a0b3d)' }
  };

  function getConfig() {
    try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; }
  }

  function fmt2(n) { return String(n).padStart(2, '0'); }

  function render() {
    const cfg = getConfig();
    let host = document.getElementById('seasonal-banner');

    const isActive = cfg && cfg.active && cfg.campaign && CAMPAIGNS[cfg.campaign] &&
      cfg.endsAt && new Date(cfg.endsAt).getTime() > Date.now();

    if (!isActive) {
      if (host) host.remove();
      document.body.classList.remove('has-seasonal-banner');
      return;
    }

    const meta = CAMPAIGNS[cfg.campaign];

    if (!host) {
      host = document.createElement('div');
      host.id = 'seasonal-banner';
      host.innerHTML = `
        <div class="seasonal-inner">
          <span class="seasonal-emoji">${meta.emoji}</span>
          <strong class="seasonal-title"></strong>
          <span class="seasonal-discount"></span>
          <span class="seasonal-countdown" aria-live="polite">
            <b data-u="d">00</b><small>يوم</small>
            <b data-u="h">00</b><small>س</small>
            <b data-u="m">00</b><small>د</small>
            <b data-u="s">00</b><small>ث</small>
          </span>
          <button class="seasonal-close" aria-label="إغلاق">×</button>
        </div>`;
      document.body.insertBefore(host, document.body.firstChild.nextSibling);
      host.querySelector('.seasonal-close').addEventListener('click', () => {
        host.style.display = 'none';
        document.body.classList.remove('has-seasonal-banner');
        sessionStorage.setItem('mm_seasonal_dismissed_v1', '1');
      });
    }

    if (sessionStorage.getItem('mm_seasonal_dismissed_v1')) {
      host.style.display = 'none';
      return;
    }

    host.style.background = meta.grad;
    host.querySelector('.seasonal-title').textContent = cfg.bannerText || meta.name;
    host.querySelector('.seasonal-discount').textContent = cfg.discountText || '';
    document.body.classList.add('has-seasonal-banner');
    host.style.display = '';

    tickCountdown(host, cfg.endsAt);
  }

  let timerId = null;
  function tickCountdown(host, endsAt) {
    if (timerId) clearInterval(timerId);
    const end = new Date(endsAt).getTime();
    function update() {
      const diff = end - Date.now();
      if (diff <= 0) { render(); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      host.querySelector('[data-u="d"]').textContent = fmt2(d);
      host.querySelector('[data-u="h"]').textContent = fmt2(h);
      host.querySelector('[data-u="m"]').textContent = fmt2(m);
      host.querySelector('[data-u="s"]').textContent = fmt2(s);
    }
    update();
    timerId = setInterval(update, 1000);
  }

  document.addEventListener('DOMContentLoaded', render);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
  window.addEventListener('storage', e => { if (e.key === KEY) render(); });

  window.MMSeasonal = { render, CAMPAIGNS };
})();
