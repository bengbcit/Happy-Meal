// auth.js — Firebase Auth stub (overridden by firebase-init.js after load)
// Firebase Auth スタブ（firebase-init.jsのロード後に上書き）/ Firebase Auth 存根（firebase-init.js 加载后覆盖）

// Initial stub: local mode only
// 初期スタブ：ローカルモードのみ / 初始存根：仅本地模式
const Auth = {
  async login() {
    const email = document.getElementById('authEmail')?.value.trim();
    const pwd   = document.getElementById('authPwd')?.value;
    if (!email || !pwd) { _setErr('请输入邮箱和密码'); return; }
    _setLoading();
    // Replaced by firebase-init.js
    // firebase-init.jsに置き換えられる / 被 firebase-init.js 替换
    setTimeout(() => { _setErr('Firebase 未加载，以本地模式继续'); this.localMode(); }, 800);
  },

  async register() {
    const email = document.getElementById('authEmail')?.value.trim();
    const pwd   = document.getElementById('authPwd')?.value;
    if (!email || !pwd) { _setErr('请输入邮箱和密码'); return; }
    _setLoading();
    setTimeout(() => { _setErr('Firebase 未加载，以本地模式继续'); this.localMode(); }, 800);
  },

  async googleLogin() {
    _setLoading();
    setTimeout(() => { _setErr('Firebase 未加载，以本地模式继续'); this.localMode(); }, 800);
  },

  localMode() {
    State.updateUser({ displayName: 'Guest' });
    _enterApp('Guest');
  },

  logout() {
    localStorage.removeItem('hm_fbuser');
    window.location.reload();
  },
};

function _setErr(msg) {
  const el = document.getElementById('authErr');
  if (el) el.textContent = msg;
  // Reset form if loading was shown
  const form = document.getElementById('authForm');
  if (form && !form.querySelector('input')) {
    // Reload form
    App && App.showAuthForm && App.showAuthForm();
  }
}

function _setLoading() {
  const form = document.getElementById('authForm');
  if (form) form.innerHTML = `<div class="flex-center" style="padding:24px">
    <span class="loading-spin"></span>&nbsp; 登录中...
  </div>`;
}

function _enterApp(displayName) {
  document.getElementById('authGate')?.classList.add('hidden');
  document.getElementById('mainApp')?.classList.remove('hidden');
  const pn = document.getElementById('profileName');
  if (pn) pn.textContent = displayName || '—';
  State.updateUser({ displayName });
  App.init();
}

// Expose for firebase-init.js to call
// firebase-init.jsから呼び出すために公開 / 供 firebase-init.js 调用
window._enterApp = _enterApp;
window._setErr   = _setErr;
