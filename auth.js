
(function () {
  const ACCOUNTS_KEY = 'mm_accounts_v1';
  const SESSION_KEY = 'mm_session_v1';

  function getAccounts() {
    try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY)) || []; } catch(e) { return []; }
  }
  function saveAccounts(a) { localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(a)); }
  function getSession() {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch(e) { return null; }
  }
  function setSession(s) { sessionStorage.setItem(SESSION_KEY, JSON.stringify(s)); }
  function clearSession() { sessionStorage.removeItem(SESSION_KEY); }

  // DOM helpers
  function $(s, c) { return (c||document).querySelector(s); }
  function el(t, a, ch) { const e=document.createElement(t); if(a) Object.keys(a).forEach(k=>e.setAttribute(k,a[k])); if(ch) e.innerHTML=ch; return e; }

  // ── Build the auth modal ────────────────────────────────────────
  const AUTH_STYLES = document.createElement('style');
  AUTH_STYLES.textContent = `
.wa-overlay{position:fixed;inset:0;background:rgba(1,4,10,0.8);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);display:none;align-items:center;justify-content:center;z-index:99999;animation:fadeIn .3s ease;}
.wa-overlay.show{display:flex;}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideUp{from{opacity:0;transform:translateY(30px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}
.wa-modal{background:linear-gradient(145deg,#0c1322,#0a1628);border:1px solid rgba(56,189,248,.12);border-radius:18px;padding:2rem;width:94%;max-width:420px;box-shadow:0 0 60px rgba(0,0,0,.6),0 0 0 1px rgba(56,189,248,.08);animation:slideUp .35s ease;position:relative;max-height:90vh;overflow-y:auto;}
.wa-modal h2{font-size:1.4rem;font-weight:800;margin:0 0 .3rem;color:#eef2ff;}
.wa-modal .wa-sub{color:#6b7fa3;font-size:.9rem;margin:0 0 1.2rem;}
.wa-field{margin-bottom:.85rem;}
.wa-field label{display:block;font-size:.82rem;color:#6b7fa3;margin-bottom:.3rem;font-weight:600;}
.wa-field input,.wa-field select{width:100%;padding:.7rem .9rem;border-radius:10px;border:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.03);color:#eef2ff;font-size:.95rem;font-family:'Cairo',sans-serif;transition:border .25s,box-shadow .25s;outline:none;}
.wa-field input:focus{border-color:rgba(56,189,248,.4);box-shadow:0 0 0 3px rgba(56,189,248,.1);}
.wa-field .wa-err{color:#ff6b6b;font-size:.78rem;margin-top:.25rem;display:none;}
.wa-field .wa-err.show{display:block;}
.wa-btn{width:100%;padding:.75rem;border-radius:10px;font-size:.95rem;font-weight:700;font-family:'Cairo',sans-serif;border:none;cursor:pointer;transition:opacity .2s,transform .15s;margin-top:.3rem;}
.wa-btn:active{transform:scale(.98);}
.wa-btn-primary{background:linear-gradient(135deg,#38bdf8,#00b8d4);color:#050810;}
.wa-btn-primary:hover{opacity:.9;}
.wa-btn-ghost{background:transparent;color:#38bdf8;border:1px solid rgba(56,189,248,.2);}
.wa-btn-ghost:hover{background:rgba(56,189,248,.06);}
.wa-divider{text-align:center;color:#4a5a7a;font-size:.82rem;margin:.9rem 0;position:relative;}
.wa-divider::before,.wa-divider::after{content:'';position:absolute;top:50%;width:42%;height:1px;background:rgba(255,255,255,.06);}
.wa-divider::before{left:0;}
.wa-divider::after{right:0;}
.wa-close{position:absolute;top:12px;left:16px;background:none;border:none;color:#6b7fa3;font-size:1.3rem;cursor:pointer;padding:.2rem .5rem;border-radius:6px;transition:background .2s;line-height:1;}
.wa-close:hover{background:rgba(255,255,255,.05);color:#eef2ff;}
.wa-toggle{text-align:center;margin-top:.8rem;font-size:.85rem;color:#6b7fa3;}
.wa-toggle a{color:#38bdf8;cursor:pointer;text-decoration:none;}
.wa-toggle a:hover{text-decoration:underline;}
.wa-success{text-align:center;padding:1rem 0;}
.wa-success .icon{font-size:3rem;margin-bottom:.5rem;}
.wa-success h3{color:#39ff14;margin:0 0 .3rem;}
.wa-success p{color:#6b7fa3;font-size:.9rem;}
.wa-pw-toggle{position:absolute;left:12px;top:50%;transform:translateY(-50%);background:none;border:none;color:#6b7fa3;cursor:pointer;padding:.3rem;font-size:.85rem;}
.wa-field{position:relative;}
.wa-field input[type=password]{padding-left:2.2rem;}
`;
  document.head.appendChild(AUTH_STYLES);

  let currentMode = 'login'; // 'login' | 'register' | 'success'
  let onLoggedIn = null;

  function buildModal() {
    const overlay = el('div', { class: 'wa-overlay', id: 'wa-auth-overlay' });
    overlay.innerHTML = `
<div class="wa-modal" id="wa-auth-modal">
  <button class="wa-close" id="wa-auth-close">&times;</button>
  <div id="wa-auth-body"></div>
</div>`;
    document.body.appendChild(overlay);
    $('#wa-auth-close').onclick = close;
    overlay.onclick = (e) => { if (e.target === overlay) close(); };
  }

  function open(mode, cb) {
    currentMode = mode || 'login';
    onLoggedIn = cb || null;
    const ov = $('#wa-auth-overlay');
    if (!ov) buildModal();
    render();
    $('#wa-auth-overlay').classList.add('show');
  }

  function close() {
    const ov = $('#wa-auth-overlay');
    if (ov) ov.classList.remove('show');
  }

  function render() {
    const body = $('#wa-auth-body');
    if (!body) return;
    body.innerHTML = currentMode === 'register' ? renderRegister() : currentMode === 'success' ? renderSuccess() : renderLogin();
    attachHandlers();
  }

  function renderLogin() {
    return `
<h2>تسجيل الدخول</h2>
<p class="wa-sub">أدخل بريدك الإلكتروني وكلمة المرور للدخول إلى حسابك.</p>
<div class="wa-field">
  <label>البريد الإلكتروني</label>
  <input type="email" id="wa-login-email" placeholder="your@email.com" autocomplete="email" />
  <div class="wa-err" id="wa-login-email-err"></div>
</div>
<div class="wa-field">
  <label>كلمة المرور</label>
  <input type="password" id="wa-login-pass" placeholder="••••••••" autocomplete="current-password" />
  <button class="wa-pw-toggle" id="wa-login-pw-toggle">👁</button>
  <div class="wa-err" id="wa-login-pass-err"></div>
</div>
<button class="wa-btn wa-btn-primary" id="wa-login-btn">دخول</button>
<div class="wa-divider">أو</div>
<div class="wa-toggle">ما عندكش حساب؟ <a id="wa-goto-register">إنشاء حساب جديد</a></div>
`;
  }

  function renderRegister() {
    return `
<h2>إنشاء حساب جديد</h2>
<p class="wa-sub">أدخل معلوماتك باش تفتح حساب فـ Mol Maneta.</p>
<div class="wa-field">
  <label>الاسم الكامل</label>
  <input type="text" id="wa-reg-name" placeholder="الاسم والنسب" autocomplete="name" />
  <div class="wa-err" id="wa-reg-name-err"></div>
</div>
<div class="wa-field">
  <label>البريد الإلكتروني</label>
  <input type="email" id="wa-reg-email" placeholder="your@email.com" autocomplete="email" />
  <div class="wa-err" id="wa-reg-email-err"></div>
</div>
<div class="wa-field">
  <label>رقم الهاتف</label>
  <input type="tel" id="wa-reg-phone" placeholder="06XXXXXXXX" autocomplete="tel" />
  <div class="wa-err" id="wa-reg-phone-err"></div>
</div>
<div class="wa-field">
  <label>كلمة المرور</label>
  <input type="password" id="wa-reg-pass" placeholder="•••••••• (6 أحرف على الأقل)" autocomplete="new-password" />
  <button class="wa-pw-toggle" id="wa-reg-pw-toggle">👁</button>
  <div class="wa-err" id="wa-reg-pass-err"></div>
</div>
<button class="wa-btn wa-btn-primary" id="wa-reg-btn">إنشاء الحساب</button>
<div class="wa-divider">أو</div>
<div class="wa-toggle">عندك حساب؟ <a id="wa-goto-login">تسجيل الدخول</a></div>
`;
  }

  function renderSuccess() {
    const s = getSession();
    return `
<div class="wa-success">
  <div class="icon">✅</div>
  <h3>مرحباً، ${s ? s.name : '!'}</h3>
  <p>تم تسجيل الدخول بنجاح. الآن يمكنك الطلب بسهولة.</p>
  <button class="wa-btn wa-btn-primary" id="wa-success-ok">موافق</button>
</div>
`;
  }

  function attachHandlers() {
    const loginBtn = $('#wa-login-btn');
    const regBtn = $('#wa-reg-btn');
    const goReg = $('#wa-goto-register');
    const goLogin = $('#wa-goto-login');
    const successOk = $('#wa-success-ok');

    if (loginBtn) loginBtn.onclick = handleLogin;
    if (regBtn) regBtn.onclick = handleRegister;
    if (goReg) goReg.onclick = () => { currentMode = 'register'; render(); };
    if (goLogin) goLogin.onclick = () => { currentMode = 'login'; render(); };
    if (successOk) successOk.onclick = () => { close(); if (typeof onLoggedIn === 'function') onLoggedIn(getSession()); };

    // password toggle
    const lt = $('#wa-login-pw-toggle');
    const rt = $('#wa-reg-pw-toggle');
    if (lt) lt.onclick = () => togglePw('#wa-login-pass', lt);
    if (rt) rt.onclick = () => togglePw('#wa-reg-pass', rt);

    // enter key
    const lp = $('#wa-login-pass'); if (lp) lp.onkeydown = (e) => { if (e.key === 'Enter' && loginBtn) loginBtn.click(); };
    const rp = $('#wa-reg-pass'); if (rp) rp.onkeydown = (e) => { if (e.key === 'Enter' && regBtn) regBtn.click(); };
  }

  function togglePw(sel, btn) {
    const inp = document.querySelector(sel);
    if (!inp) return;
    if (inp.type === 'password') { inp.type = 'text'; btn.textContent = '🙈'; }
    else { inp.type = 'password'; btn.textContent = '👁'; }
  }

  function showErr(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.classList.toggle('show', !!msg);
  }

  function clearErrs() {
    document.querySelectorAll('.wa-err').forEach(e => { e.textContent = ''; e.classList.remove('show'); });
  }

  function handleLogin() {
    clearErrs();
    const email = $('#wa-login-email').value.trim();
    const pass = $('#wa-login-pass').value;
    let ok = true;
    if (!email) { showErr('wa-login-email-err', 'البريد الإلكتروني مطلوب'); ok = false; }
    if (!pass) { showErr('wa-login-pass-err', 'كلمة المرور مطلوبة'); ok = false; }
    if (!ok) return;

    const accounts = getAccounts();
    const account = accounts.find(a => a.email.toLowerCase() === email.toLowerCase());
    if (!account) { showErr('wa-login-email-err', 'هذا الحساب غير موجود'); return; }
    // compare hashed password
    hashPass(pass).then(hash => {
      if (account.password !== hash) { showErr('wa-login-pass-err', 'كلمة المرور خاطئة'); return; }
      const session = { name: account.name, email: account.email, phone: account.phone || '' };
      setSession(session);
      localStorage.setItem('mm_account_v1', JSON.stringify(session));
      window.dispatchEvent(new Event('storage'));
      currentMode = 'success';
      render();
    });
  }

  function handleRegister() {
    clearErrs();
    const name = $('#wa-reg-name').value.trim();
    const email = $('#wa-reg-email').value.trim();
    const phone = $('#wa-reg-phone').value.trim();
    const pass = $('#wa-reg-pass').value;
    let ok = true;

    if (!name) { showErr('wa-reg-name-err', 'الاسم مطلوب'); ok = false; }
    if (!email) { showErr('wa-reg-email-err', 'البريد الإلكتروني مطلوب'); ok = false; }
    else if (!/\S+@\S+\.\S+/.test(email)) { showErr('wa-reg-email-err', 'بريد إلكتروني غير صالح'); ok = false; }
    if (!phone) { showErr('wa-reg-phone-err', 'رقم الهاتف مطلوب'); ok = false; }
    else if (!/^0[5-7]\d{8}$/.test(phone.replace(/[\s\-]/g,''))) { showErr('wa-reg-phone-err', 'رقم هاتف غير صالح (06/07/05XXXXXXXX)'); ok = false; }
    if (!pass) { showErr('wa-reg-pass-err', 'كلمة المرور مطلوبة'); ok = false; }
    else if (pass.length < 6) { showErr('wa-reg-pass-err', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'); ok = false; }
    if (!ok) return;

    const accounts = getAccounts();
    if (accounts.find(a => a.email === email)) { showErr('wa-reg-email-err', 'هذا البريد مسجل مسبقاً'); return; }

    hashPass(pass).then(hash => {
      accounts.push({ name, email, phone, password: hash, created: Date.now() });
      saveAccounts(accounts);
      const session = { name, email, phone };
      setSession(session);
      localStorage.setItem('mm_account_v1', JSON.stringify(session));
      window.dispatchEvent(new Event('storage'));
      currentMode = 'success';
      render();
    });
  }

  function hashPass(str) {
    // simple SHA-256 via Web Crypto
    const enc = new TextEncoder().encode(str);
    return crypto.subtle.digest('SHA-256', enc).then(buf => {
      const hash = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
      return hash;
    });
  }

  function logout() {
    clearSession();
    localStorage.removeItem('mm_account_v1');
    const nav = document.querySelector('.auth-nav');
    if (nav) nav.remove();
    // Also update navbar if present
    updateNavbar(null);
    // dispatch event for account modal sync
    window.dispatchEvent(new Event('storage'));
  }

  function updateNavbar(session) {
    // Look for auth-nav container
    let container = document.querySelector('.auth-nav');
    if (!container) {
      container = el('div', { class: 'auth-nav', style: 'display:inline-flex;align-items:center;gap:.5rem;' });
      const targets = document.querySelectorAll('.header-inner nav, .main-nav');
      if (targets.length) {
        targets[0].appendChild(container);
      }
    }
    if (session) {
      container.innerHTML = `<span style="color:#38bdf8;font-size:.9rem;font-weight:700;">👤 ${session.name}</span><button class="btn btn-outline" id="wa-logout-btn" style="font-size:.78rem;padding:.2rem .6rem;">خروج</button>`;
      const lo = document.getElementById('wa-logout-btn');
      if (lo) lo.onclick = logout;
    } else {
      container.innerHTML = `<button class="btn btn-outline" id="wa-show-login" style="font-size:.82rem;padding:.35rem 1rem;">تسجيل الدخول</button>`;
      const sl = document.getElementById('wa-show-login');
      if (sl) sl.onclick = () => open('login');
    }
  }

  // ── Auto-init ───────────────────────────────────────────────
  function init() {
    const session = getSession();
    if (session) {
      // Ensure session is valid (account still exists)
      const accounts = getAccounts();
      const exists = accounts.find(a => a.email === session.email);
      if (exists) {
        updateNavbar(session);
        localStorage.setItem('mm_account_v1', JSON.stringify({name:session.name,phone:session.phone||'',email:session.email||''}));
      } else {
        clearSession();
        localStorage.removeItem('mm_account_v1');
        updateNavbar(null);
      }
    } else {
      // No active session — still render the "تسجيل الدخول" button
      updateNavbar(null);
    }
    // Re-check on storage changes (for multi-tab)
    window.addEventListener('storage', (e) => {
      if (e.key === SESSION_KEY || e.key === ACCOUNTS_KEY) {
        const s = getSession();
        updateNavbar(s);
      }
    });
  }

  // Expose public API
  window.MMAuth = { open, close, logout, getSession, updateNavbar, init, getAccounts };

  // Run on load
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();