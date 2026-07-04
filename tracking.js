/* ============================================================
   MOL MANETA — tracking.js
   - Global toast utility (window.mmToast)
   - Customer-facing order tracking widget (#order-tracking)
     search by Order ID -> shows status timeline + progress bar
   ============================================================ */
(function () {
  'use strict';

  const STATUS_FLOW = [
    { key: 'received',   label: 'تم استلام الطلب', icon: '📥' },
    { key: 'review',     label: 'قيد المراجعة',     icon: '🔍' },
    { key: 'preparing',  label: 'قيد التحضير',      icon: '📦' },
    { key: 'shipped',    label: 'تم الشحن',         icon: '🚚' },
    { key: 'out',        label: 'خارج للتوصيل',     icon: '🛵' },
    { key: 'delivered',  label: 'تم التسليم',        icon: '✅' }
  ];
  const CANCELLED = { key: 'cancelled', label: 'ملغى', icon: '❌' };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  /* ── Global toast ─────────────────────────────────────── */
  function mmToast(msg, type, duration) {
    type = type || 'info';
    duration = duration || 3000;
    let host = document.getElementById('mm-toast-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'mm-toast-host';
      document.body.appendChild(host);
    }
    const el = document.createElement('div');
    el.className = 'mm-toast mm-toast-' + type;
    el.textContent = msg;
    host.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    const remove = () => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); };
    const t = setTimeout(remove, duration);
    el.addEventListener('click', () => { clearTimeout(t); remove(); });
  }
  window.mmToast = mmToast;

  /* ── Orders data ──────────────────────────────────────── */
  function getOrders() {
    try { return JSON.parse(localStorage.getItem('mm_orders_v1')) || []; } catch (e) { return []; }
  }

  function findOrder(id) {
    const orders = getOrders();
    const needle = (id || '').trim().toUpperCase();
    return orders.find(o => (o.id || '').toUpperCase() === needle);
  }

  function renderTimeline(order) {
    const isCancelled = order.status === 'cancelled';
    const history = order.history || [];
    const historyMap = {};
    history.forEach(h => { historyMap[h.status] = h.at; });

    const currentIdx = STATUS_FLOW.findIndex(s => s.key === order.status);
    const progressPct = isCancelled ? 100 : Math.max(0, Math.round((Math.max(currentIdx, 0) / (STATUS_FLOW.length - 1)) * 100));

    const steps = (isCancelled ? [STATUS_FLOW[0], CANCELLED] : STATUS_FLOW).map((s, i) => {
      const reached = isCancelled ? true : i <= currentIdx;
      const at = historyMap[s.key];
      return `
        <div class="ot-step ${reached ? 'reached' : ''} ${s.key === order.status ? 'current' : ''}">
          <div class="ot-dot">${s.icon}</div>
          <div class="ot-label">${esc(s.label)}</div>
          <div class="ot-time">${at ? new Date(at).toLocaleString('ar-MA') : ''}</div>
        </div>`;
    }).join('');

    return `
      <div class="ot-result ${isCancelled ? 'ot-cancelled' : ''}">
        <div class="ot-head">
          <div><strong>${esc(order.id)}</strong><span class="ot-product">${esc(order.product)}</span></div>
          <div class="ot-price">${esc(order.price)}</div>
        </div>
        <div class="ot-progress-bar"><div class="ot-progress-fill" style="width:${progressPct}%"></div></div>
        <div class="ot-timeline">${steps}</div>
      </div>`;
  }

  function initWidget() {
    const host = document.getElementById('order-tracking-result');
    const input = document.getElementById('order-tracking-input');
    const btn = document.getElementById('order-tracking-btn');
    if (!host || !input || !btn) return;

    function doSearch() {
      const id = input.value.trim();
      if (!id) { mmToast('دخل رقم الطلب أولاً', 'error'); return; }
      const order = findOrder(id);
      if (!order) {
        host.innerHTML = `<div class="ot-empty">⚠️ ماكايناش طلب بهاد الرقم. تأكد من رقم التتبع اللي توصلتي بيه.</div>`;
        return;
      }
      host.innerHTML = renderTimeline(order);
    }
    btn.addEventListener('click', doSearch);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });

    // auto-fill from ?order=ID in URL if present
    const params = new URLSearchParams(location.search);
    const preId = params.get('order');
    if (preId) { input.value = preId; doSearch(); }
  }

  /* ── Recently viewed products ─────────────────────────── */
  const RECENT_KEY = 'mm_recently_viewed_v1';
  function trackView(id) {
    if (!id) return;
    let list = [];
    try { list = JSON.parse(localStorage.getItem(RECENT_KEY)) || []; } catch (e) {}
    list = list.filter(x => x !== id);
    list.unshift(id);
    list = list.slice(0, 12);
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  }
  window.MMTracking = { trackView, getRecentlyViewed: () => {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; } catch (e) { return []; }
  }};

  // Track a "view" whenever a product card is opened via its details/view action,
  // or simply when it scrolls into view meaningfully (click-based is more reliable)
  document.addEventListener('click', e => {
    const card = e.target.closest('.product-card[data-id]');
    if (card) trackView(card.dataset.id);
  });

  document.addEventListener('DOMContentLoaded', initWidget);
})();
