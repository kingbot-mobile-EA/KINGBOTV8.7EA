// ============================================================================
//  KingBot V8.7 Platform — Frontend core (API client, theme, auth, UI shell)
//  No framework. Vanilla JS. Mobile-first. Connects to the Render backend.
//  Configure API_BASE below (your Render URL after deploy).
// ============================================================================

// ---- Config ----
// For local dev: http://localhost:8080
// For production: your Render backend URL, e.g. https://kingbot-platform-backend.onrender.com
const API_BASE = (window.KINGBOT_CONFIG && window.KINGBOT_CONFIG.apiBase) ||
  localStorage.getItem("kingbot_api_base") ||
  "http://localhost:8080";

const THEMES = ["neo-cyber", "matrix", "blood-moon", "void"];
const THEME_META = {
  "neo-cyber": { name: "Neo Cyber", colors: ["#00c8ff", "#4d7cff"] },
  matrix: { name: "Matrix", colors: ["#00ff8c", "#00e5ff"] },
  "blood-moon": { name: "Blood Moon", colors: ["#ff3b5c", "#ffcc33"] },
  void: { name: "Void", colors: ["#a763ff", "#ff63e7"] },
};

// ---- API client ----
const api = {
  async req(path, opts = {}) {
    const token = localStorage.getItem("kingbot_token");
    const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;
    try {
      const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = new Error(data.error || `HTTP ${res.status}`);
        err.status = res.status;
        err.code = data.code;
        err.body = data;
        throw err;
      }
      return data;
    } catch (e) {
      if (e.status) throw e;
      throw new Error(`Network error — is the backend running at ${API_BASE}? (${e.message})`);
    }
  },
  get(p) { return this.req(p); },
  post(p, b) { return this.req(p, { method: "POST", body: JSON.stringify(b || {}) }); },
  patch(p, b) { return this.req(p, { method: "PATCH", body: JSON.stringify(b || {}) }); },
  del(p) { return this.req(p, { method: "DELETE" }); },
};

// ---- Theme ----
function applyTheme(theme) {
  if (!THEMES.includes(theme)) theme = "matrix";
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("kingbot_theme", theme);
  // update meta theme-color
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = THEME_META[theme].colors[0];
}
function initTheme() {
  applyTheme(localStorage.getItem("kingbot_theme") || "matrix");
}

// ---- Auth ----
function isLoggedIn() { return !!localStorage.getItem("kingbot_token"); }
function getUser() { try { return JSON.parse(localStorage.getItem("kingbot_user") || "null"); } catch { return null; } }
function setSession(token, user) {
  localStorage.setItem("kingbot_token", token);
  localStorage.setItem("kingbot_user", JSON.stringify(user));
}
function clearSession() {
  localStorage.removeItem("kingbot_token");
  localStorage.removeItem("kingbot_user");
}
function requireAuth() {
  if (!isLoggedIn()) { window.location.href = "login.html"; return false; }
  return true;
}
function hasActiveSub() { const u = getUser(); return !!(u && u.subscription && u.subscription.status === "active"); }

// ---- Toast ----
function toast(msg, bad = false) {
  let t = document.querySelector(".toast");
  if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); }
  t.textContent = msg;
  t.className = "toast show" + (bad ? " bad" : "");
  clearTimeout(t._t);
  t._t = setTimeout(() => (t.className = "toast"), 3200);
}

// ---- UI shell: nav + footer + AI chat ----
function brandSVG() {
  return `<div class="brand-logo"><svg viewBox="0 0 24 24" fill="none"><path d="M12 2 L20 6 V14 C20 18 16 21 12 22 C8 21 4 18 4 14 V6 Z" stroke="#021" stroke-width="1.5" fill="rgba(2,17,10,0.3)"/><circle cx="12" cy="11" r="2.4" fill="#021"/><path d="M8 16 h8" stroke="#021" stroke-width="1.5" stroke-linecap="round"/></svg></div>`;
}
function navHTML(active) {
  const logged = isLoggedIn();
  const links = [
    ["index.html", "Home", "home"],
    ["pricing.html", "Pricing", "pricing"],
    ["strategies.html", "Strategies", "strategies"],
    ["dashboard.html", "Dashboard", "dashboard"],
    ["guides.html", "Guides", "guides"],
  ];
  const linkHTML = (l) => `<a href="${l[0]}" class="${active === l[2] ? "active" : ""}">${l[1]}</a>`;
  return `
  <nav class="nav">
    <div class="wrap nav-inner">
      <a href="index.html" class="brand">${brandSVG()}<div><div class="brand-name">KING<span>BOT</span></div><div class="brand-sub">V8.7 · GIBSONFX</div></div></a>
      <div class="nav-links">${links.map(linkHTML).join("")}</div>
      <div class="nav-actions">
        <button class="theme-toggle" id="themeCycleBtn" title="Switch theme">◐</button>
        ${logged ? `<a href="profile.html" class="btn btn-ghost btn-sm">Profile</a><a href="#" class="btn btn-primary btn-sm" id="logoutBtn">Sign out</a>` : `<a href="login.html" class="btn btn-ghost btn-sm">Sign in</a><a href="signup.html" class="btn btn-primary btn-sm">Get started</a>`}
        <button class="menu-btn" id="menuBtn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg></button>
      </div>
    </div>
    <div class="mobile-menu" id="mobileMenu">${links.map(linkHTML).join("")}</div>
  </nav>`;
}
function footerHTML() {
  return `
  <footer class="footer">
    <div class="wrap">
      <div class="footer-grid">
        <div>
          <a href="index.html" class="brand" style="margin-bottom:12px">${brandSVG()}<div><div class="brand-name">KING<span>BOT</span></div><div class="brand-sub">V8.7 · GIBSONFX TECH</div></div></a>
          <p class="text-dim" style="font-size:13px;max-width:280px;margin-top:12px">The high-tech mobile platform for the KingBot V8.7 MICRO-FLIP EA. Connect your MetaTrader 5 from your phone — no PC, no Windows required.</p>
        </div>
        <div><h4>Platform</h4><a href="pricing.html">Pricing</a><a href="strategies.html">Strategies</a><a href="dashboard.html">Dashboard</a><a href="guides.html">Guides</a></div>
        <div><h4>Account</h4><a href="signup.html">Sign up</a><a href="login.html">Sign in</a><a href="profile.html">Profile</a><a href="analytics.html">Analytics</a></div>
        <div><h4>Legal</h4><a href="pages/privacy.html">Privacy</a><a href="pages/terms.html">Terms</a><a href="pages/security.html">Security</a><a href="pages/risk.html">Risk Disclosure</a></div>
      </div>
      <div class="footer-bot">
        <span>© ${new Date().getFullYear()} KingBot V8.7 · Powered by GIBSONFX TECH. All rights reserved.</span>
        <span class="mono">v8.7.0 · MT5 EA</span>
      </div>
    </div>
  </footer>`;
}

function aiChatHTML() {
  return `
  <button class="ai-fab" id="aiFab" title="AI Assistant" aria-label="Open AI assistant">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a3 3 0 0 1 3 3v1h1a3 3 0 0 1 3 3v3a4 4 0 0 1-4 4h-1l-2 2-2-2H9a4 4 0 0 1-4-4V9a3 3 0 0 1 3-3h1V5a3 3 0 0 1 3-3z"/><circle cx="9" cy="11" r="1" fill="currentColor"/><circle cx="15" cy="11" r="1" fill="currentColor"/></svg>
  </button>
  <div class="ai-panel" id="aiPanel">
    <div class="ai-head">${brandSVG()}<div class="ttl">KingBot AI Assistant<small>Trained on the V8.7 guide · GIBSONFX TECH</small></div></div>
    <div class="ai-body" id="aiBody">
      <div class="ai-msg bot">👋 I'm your KingBot V8.7 assistant. Ask me about setup, risk, pairs, profiles, protection layers, or connecting your EA from mobile.</div>
      <div class="ai-chips" id="aiChips"></div>
    </div>
    <div class="ai-input">
      <input id="aiInput" placeholder="Ask about the EA…" autocomplete="off" />
      <button id="aiSend"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></svg></button>
    </div>
  </div>`;
}

function mountShell(active) {
  initTheme();
  document.body.insertAdjacentHTML("afterbegin", navHTML(active));
  document.body.insertAdjacentHTML("beforeend", footerHTML());
  if (!document.body.dataset.noAi) document.body.insertAdjacentHTML("beforeend", aiChatHTML());
  wireShell();
}

function wireShell() {
  const menuBtn = document.getElementById("menuBtn");
  const mobileMenu = document.getElementById("mobileMenu");
  if (menuBtn) menuBtn.onclick = () => mobileMenu.classList.toggle("open");
  const themeBtn = document.getElementById("themeCycleBtn");
  if (themeBtn) themeBtn.onclick = () => {
    const cur = localStorage.getItem("kingbot_theme") || "matrix";
    const next = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length];
    applyTheme(next);
    toast(`Theme: ${THEME_META[next].name}`);
  };
  const logout = document.getElementById("logoutBtn");
  if (logout) logout.onclick = (e) => { e.preventDefault(); clearSession(); toast("Signed out"); setTimeout(() => (window.location.href = "index.html"), 500); };
  wireAIChat();
}

// ---- AI chat ----
let aiBusy = false;
function wireAIChat() {
  const fab = document.getElementById("aiFab");
  const panel = document.getElementById("aiPanel");
  if (!fab || !panel) return;
  fab.onclick = () => {
    panel.classList.toggle("open");
    if (panel.classList.contains("open") && !isLoggedIn()) {
      const body = document.getElementById("aiBody");
      const chips = document.getElementById("aiChips");
      if (chips) chips.innerHTML = "";
      body.querySelectorAll(".ai-msg").forEach((m, i) => { if (i > 0) m.remove(); });
      body.insertAdjacentHTML("beforeend", `<div class="ai-msg bot">Sign in to chat with the AI assistant, or browse the <a href="guides.html" style="color:var(--accent)">guides</a> and <a href="pricing.html" style="color:var(--accent)">pricing</a> freely.</div>`);
    }
  };
  const input = document.getElementById("aiInput");
  const send = document.getElementById("aiSend");
  if (send) send.onclick = sendAI;
  if (input) input.onkeydown = (e) => { if (e.key === "Enter") sendAI(); };
  loadChips();
}

async function loadChips() {
  const chips = document.getElementById("aiChips");
  if (!chips) return;
  try {
    const { suggestions } = await api.get("/api/ai/suggestions");
    chips.innerHTML = suggestions.slice(0, 4).map((s) => `<span class="ai-chip" data-q="${s.replace(/"/g, "&quot;")}">${s}</span>`).join("");
    chips.querySelectorAll(".ai-chip").forEach((c) => (c.onclick = () => { const inp = document.getElementById("aiInput"); if (inp) { inp.value = c.dataset.q; sendAI(); } }));
  } catch { /* ignore */ }
}

async function sendAI() {
  if (aiBusy) return;
  const input = document.getElementById("aiInput");
  const body = document.getElementById("aiBody");
  const chips = document.getElementById("aiChips");
  if (!input || !body) return;
  const text = input.value.trim();
  if (!text) return;
  if (!isLoggedIn()) { toast("Sign in to chat with the AI assistant", true); return; }
  body.insertAdjacentHTML("beforeend", `<div class="ai-msg user">${escapeHTML(text)}</div>`);
  if (chips) chips.innerHTML = "";
  input.value = "";
  body.insertAdjacentHTML("beforeend", `<div class="ai-typing" id="aiTyping"><span></span><span></span><span></span></div>`);
  body.scrollTop = body.scrollHeight;
  aiBusy = true;
  try {
    const reply = await api.post("/api/ai/chat", { messages: [{ role: "user", content: text }] });
    const typing = document.getElementById("aiTyping");
    if (typing) typing.remove();
    body.insertAdjacentHTML("beforeend", `<div class="ai-msg bot">${escapeHTML(reply.content)}</div>`);
  } catch (e) {
    const typing = document.getElementById("aiTyping");
    if (typing) typing.remove();
    body.insertAdjacentHTML("beforeend", `<div class="ai-msg bot">⚠️ ${escapeHTML(e.message)}</div>`);
  }
  body.scrollTop = body.scrollHeight;
  aiBusy = false;
}

// ---- Helpers ----
function escapeHTML(s) {
  return String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function fmtMoney(n) { return (n >= 0 ? "$" : "-$") + Math.abs(Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtPct(n) { return (Number(n) || 0).toFixed(1) + "%"; }
function fmtTime(iso) { const d = new Date(iso); return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); }

// ---- Expose ----
window.KB = { api, applyTheme, initTheme, isLoggedIn, getUser, setSession, clearSession, requireAuth, hasActiveSub, toast, mountShell, escapeHTML, fmtMoney, fmtPct, fmtTime, THEMES, THEME_META, API_BASE };

// ---- Service worker registration (PWA) ----
if ("serviceWorker" in navigator && location.protocol === "https:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
