// auth.js — Auth stub + local mode logic
// Firebase登録前のスタブ + ローカルモードロジック / Firebase 加载前的存根 + 本地模式逻辑
// NOTE: firebase-init.js overrides Auth.login / Auth.register / Auth.googleLogin after Firebase loads
// 注意: firebase-init.js が Firebase ロード後にメソッドを上書き / firebase-init.js 加载后覆盖方法

const LOCAL_MODE_KEY = 'hm_localMode'; // localStorage flag for local mode / ローカルモードフラグ

const Auth = {
  // ── Stub methods (overridden by firebase-init.js) ────
  async login() {
    const email = document.getElementById('authEmail')?.value.trim();
    const pwd   = document.getElementById('authPwd')?.value;
    if (!email || !pwd) { Auth._setErr('请输入邮箱和密码'); return; }
    Auth._setLoading('登录中...');
    setTimeout(() => { Auth._showLoginForm(); Auth._setErr('Firebase 未加载，请刷新重试'); }, 1000);
  },

  async register() {
    const email = document.getElementById('authEmail')?.value.trim();
    const pwd   = document.getElementById('authPwd')?.value;
    if (!email || !pwd) { Auth._setErr('请输入邮箱和密码'); return; }
    Auth._setLoading('注册中...');
    setTimeout(() => { Auth._showLoginForm(); Auth._setErr('Firebase 未加载，请刷新重试'); }, 1000);
  },

  async googleLogin() {
    Auth._setLoading('Google 登录中...');
    setTimeout(() => { Auth._showLoginForm(); Auth._setErr('Firebase 未加载，请刷新重试'); }, 1000);
  },

  // ── Local mode ───────────────────────────────────────
  // ローカルモードに入る / 进入本地模式
  localMode() {
    localStorage.setItem(LOCAL_MODE_KEY, '1');
    State.updateUser({ displayName: '本地用户', email: '', isLocal: true });
    _enterApp({ displayName: '本地用户', isLocal: true });
  },

  // ── Logout ───────────────────────────────────────────
  logout() {
    localStorage.removeItem(LOCAL_MODE_KEY);
    // firebase-init.js overrides this to also call Firebase signOut
    // firebase-init.js が Firebase signOut も呼び出すよう上書き / firebase-init.js 会覆盖此方法同时调用 Firebase signOut
    window.location.reload();
  },

  // ── Switch account panel ─────────────────────────────
  // アカウント切り替えパネル / 切换账号面板
  showSwitchPanel() {
    const panel = document.getElementById('switchPanel');
    if (panel) panel.classList.toggle('hidden');
    document.getElementById('profilePanel')?.classList.add('hidden');
  },

  switchToLocal() {
    // Sign out Firebase if logged in, then enter local mode
    // Firebase ログアウト後にローカルモードへ / 先登出 Firebase 再进入本地模式
    localStorage.setItem(LOCAL_MODE_KEY, '1');
    Auth.logout();
  },

  switchToEmail() {
    localStorage.removeItem(LOCAL_MODE_KEY);
    document.getElementById('mainApp')?.classList.add('hidden');
    document.getElementById('authGate')?.classList.remove('hidden');
    Auth._showLoginForm();
  },

  addAccount() {
    Auth.switchToEmail();
  },

  // ── UI helpers ───────────────────────────────────────
  _setLoading(msg = '处理中...') {
    const form = document.getElementById('authForm');
    if (form) form.innerHTML = `
      <div class="flex-center" style="padding:32px;gap:10px;flex-direction:column">
        <span class="loading-spin"></span>
        <span style="color:var(--text-muted);font-size:.9rem">${msg}</span>
      </div>`;
  },

  _setErr(msg) {
    const el = document.getElementById('authErr');
    if (el) el.textContent = msg;
  },

  _showLoginForm() {
    const form = document.getElementById('authForm');
    if (!form) return;
    const lang = typeof I18n !== 'undefined' ? I18n.current() : 'zh';
    form.innerHTML = `
      <input id="authEmail" type="email" class="inp"
        placeholder="${_t('ph_email', lang)}" autocomplete="username"/>
      <input id="authPwd" type="password" class="inp"
        placeholder="${_t('ph_pwd', lang)}" autocomplete="current-password"
        onkeydown="if(event.key==='Enter') Auth.login()"/>
      <button class="btn-primary w100" onclick="Auth.login()">${_t('btn_login', lang)}</button>
      <button class="btn-secondary w100" onclick="Auth.register()">${_t('btn_register', lang)}</button>
      <button class="btn-google w100" onclick="Auth.googleLogin()">
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="18"/> Google 登录
      </button>
      <p id="authErr" class="auth-err"></p>
      <hr class="auth-divider"/>
      <button class="btn-local" onclick="Auth.localMode()">${_t('btn_local', lang)}</button>`;
  },
};

// Simple translation helper for auth form (before I18n may be ready)
// 認証フォーム用のシンプルな翻訳ヘルパー / 认证表单的简单翻译
function _t(key, lang) {
  const m = {
    ph_email: { zh:'邮箱', en:'Email', ja:'メールアドレス' },
    ph_pwd:   { zh:'密码', en:'Password', ja:'パスワード' },
    btn_login: { zh:'登录', en:'Login', ja:'ログイン' },
    btn_register: { zh:'注册', en:'Register', ja:'新規登録' },
    btn_local: { zh:'👤 以本地模式进入', en:'👤 Enter as Guest', ja:'👤 ゲストとして入る' },
  };
  return m[key]?.[lang] || m[key]?.['zh'] || key;
}

// Enter main app — called from auth.js and firebase-init.js
// メインアプリに入る — auth.js と firebase-init.js から呼ばれる / 进入主应用
function _enterApp(userInfo) {
  document.getElementById('authGate')?.classList.add('hidden');
  document.getElementById('mainApp')?.classList.remove('hidden');

  // Update topbar profile name + logout button based on login type
  // ログインタイプに応じてプロフィール名とログアウトボタンを更新 / 根据登录类型更新显示
  const profileNameEl = document.getElementById('profileName');
  const profileActionsEl = document.getElementById('profileActions');

  if (profileNameEl) {
    profileNameEl.textContent = userInfo.isLocal
      ? (I18n?.get('local_user') || '本地用户')
      : (userInfo.displayName || userInfo.email || 'User');
  }

  if (profileActionsEl) {
    if (userInfo.isLocal) {
      // Local mode: show "退出本地登录" + "登录账号"
      // ローカルモード: "ローカルログアウト" + "アカウントでログイン" / 本地模式
      profileActionsEl.innerHTML = `
        <button class="btn-small" onclick="Auth.switchToEmail()" style="background:var(--green-lt);color:var(--green-dk)">
          📧 ${I18n?.get('btn_login') || '登录账号'}
        </button>
        <button class="btn-small" onclick="Auth.logout()">
          ${I18n?.get('btn_logout_local') || '退出本地模式'}
        </button>`;
    } else {
      // Firebase mode: show email + "退出登录"
      // Firebase モード: メール + "ログアウト" / Firebase 模式
      profileActionsEl.innerHTML = `
        <span style="font-size:.78rem;color:var(--text-muted);padding:4px 8px">${userInfo.email || ''}</span>
        <button class="btn-small" onclick="Auth.switchToLocal()">
          🏠 ${I18n?.get('switch_local') || '切换本地账号'}
        </button>
        <button class="btn-small" onclick="Auth.logout()">
          ${I18n?.get('btn_logout') || '退出登录'}
        </button>`;
    }
  }

  State.updateUser({
    displayName: userInfo.displayName || userInfo.email || '本地用户',
    email: userInfo.email || '',
    isLocal: !!userInfo.isLocal,
  });

  if (typeof App !== 'undefined') App.init();
}

// Expose globally for firebase-init.js
window._enterApp  = _enterApp;
window._t         = _t;
