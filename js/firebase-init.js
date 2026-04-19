// firebase-init.js — Firebase initialization + Auth state management
// Firebase初期化・認証状態管理 / Firebase 初始化 + 认证状态管理

(async () => {
  if (!firebaseConfig || firebaseConfig.apiKey === 'YOUR_API_KEY') {
    console.warn('[Firebase] No config set, running in local mode.');
    return;
  }

  try {
    const { initializeApp } =
      await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js');
    const {
      getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
      GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged,
    } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js');
    const { getFirestore, doc, setDoc, getDoc } =
      await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');

    const app  = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db   = getFirestore(app);

    // Override Auth stub with real Firebase implementations
    // Firebase実装でAuthスタブを上書き / 用真实 Firebase 实现覆盖 Auth 存根
    // FIX: use Auth._setLoading / Auth._setErr (methods on Auth object, NOT bare globals)
    // 修正: Auth._setLoading / Auth._setErr を使う（グローバル関数ではなくAuthのメソッド）
    // 修复: 调用 Auth._setLoading / Auth._setErr，而不是裸全局函数（它们不存在）
    Object.assign(Auth, {

      async login() {
        const email = document.getElementById('authEmail')?.value.trim();
        const pwd   = document.getElementById('authPwd')?.value;
        if (!email || !pwd) { Auth._setErr('请输入邮箱和密码'); return; }
        Auth._setLoading('登录中...');
        try {
          await signInWithEmailAndPassword(auth, email, pwd);
          // onAuthStateChanged will call _enterApp automatically
          // onAuthStateChanged が自動的に _enterApp を呼び出す / onAuthStateChanged 会自动调用 _enterApp
        } catch (e) {
          Auth._showLoginForm();
          Auth._setErr(_fbErr(e.code));
        }
      },

      async register() {
        const email = document.getElementById('authEmail')?.value.trim();
        const pwd   = document.getElementById('authPwd')?.value;
        if (!email || !pwd || pwd.length < 6) { Auth._setErr('密码至少6位'); return; }
        Auth._setLoading('注册中...');
        try {
          await createUserWithEmailAndPassword(auth, email, pwd);
        } catch (e) {
          Auth._showLoginForm();
          Auth._setErr(_fbErr(e.code));
        }
      },

      async googleLogin() {
        // FIX: was calling bare _setLoading() which doesn't exist globally
        // 修正: グローバルに存在しない _setLoading() を呼び出していた
        // 修复: 之前调用的是不存在的全局 _setLoading()
        Auth._setLoading('Google 登录中...');
        try {
          await signInWithPopup(auth, new GoogleAuthProvider());
          // onAuthStateChanged handles the rest
        } catch (e) {
          Auth._showLoginForm();
          Auth._setErr(_fbErr(e.code));
        }
      },

      async logout() {
        try { await signOut(auth); } catch {}
        localStorage.removeItem('hm_localMode');
        window.location.reload();
      },

      localMode() {
        localStorage.setItem('hm_localMode', '1');
        _enterApp({ displayName: '本地用户', email: '', isLocal: true });
      },

      _showLoginForm() {
        const form = document.getElementById('authForm');
        if (!form) return;
        const lang = typeof I18n !== 'undefined' ? I18n.current() : 'zh';
        form.innerHTML = `
          <input id="authEmail" type="email" class="inp"
            placeholder="${I18n?.get('ph_email') || '邮箱'}" autocomplete="username"/>
          <input id="authPwd" type="password" class="inp"
            placeholder="${I18n?.get('ph_pwd') || '密码'}" autocomplete="current-password"
            onkeydown="if(event.key==='Enter') Auth.login()"/>
          <button class="btn-primary w100" onclick="Auth.login()">${I18n?.get('btn_login') || '登录'}</button>
          <button class="btn-secondary w100" onclick="Auth.register()">${I18n?.get('btn_register') || '注册'}</button>
          <button class="btn-google w100" onclick="Auth.googleLogin()">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="18"/> Google 登录
          </button>
          <p id="authErr" class="auth-err"></p>
          <hr class="auth-divider"/>
          <button class="btn-local" onclick="Auth.localMode()">${I18n?.get('btn_local') || '👤 以本地模式进入'}</button>`;
      },
    });

    // Offline timeout: 8s without Firebase response → show hint
    // 8秒以内にFirebase応答なし → ヒントを表示 / 8秒内无响应 → 显示提示
    const offlineTimer = setTimeout(() => {
      const gate = document.getElementById('authGate');
      if (gate && !gate.classList.contains('hidden')) {
        Auth._setErr('网络较慢，可以选择本地模式继续');
      }
    }, 8000);

    // Auth state listener — single source of truth for entering the app
    // 認証状態リスナー — アプリ進入の唯一の真実の情報源 / 认证状态监听 — 进入应用的唯一入口
    onAuthStateChanged(auth, async user => {
      clearTimeout(offlineTimer);
      if (user) {
        // FIX: If a DIFFERENT user logs in, clear localStorage to avoid data leakage between accounts
        // 別のユーザーがログインした場合、アカウント間のデータ漏洩を避けるためlocalStorageをクリア
        // 修复: 不同账号登录时清除 localStorage，避免数据串号
        const storedEmail = State.get().user.email;
        if (storedEmail && storedEmail !== user.email) {
          console.log('[Auth] Different user detected, clearing local state...');
          localStorage.removeItem('hm_state');
          // Re-initialize State with fresh defaults
          // 新しいデフォルトでStateを再初期化 / 用默认值重新初始化 State
          window.location.reload();
          return;
        }

        localStorage.removeItem('hm_localMode');

        // Show correct email/name immediately — NOT "本地用户"
        // 正しいメール/名前をすぐに表示 — "本地用户" ではない
        // 立刻显示正确邮箱/名字，而不是"本地用户"
        const displayName = user.displayName || user.email || 'User';
        _enterApp({ displayName, email: user.email || '', isLocal: false });

        // Also force-update the profile name element directly
        // プロフィール名要素を直接強制更新 / 直接强制更新用户名元素
        const pnEl = document.getElementById('profileName');
        if (pnEl) pnEl.innerHTML = `${user.email} <span style="font-size:.7rem;color:var(--text-muted)">▼</span>`;

        State.updateUser({ email: user.email || '', displayName: user.displayName || '' });

        // Helper: save local state to Firestore
        // Firestoreにローカル状態を保存するヘルパー / 保存本地数据到 Firestore 的辅助函数
        async function _saveToFirestore() {
          try {
            await setDoc(doc(db, 'users', user.uid), State.toCloud(), { merge: true });
            console.log('[Firestore] saved ✅');
          } catch (e) {
            console.warn('[Firestore] save failed:', e.message);
          }
        }

        // Expose globally so console & buttons can call it: FirebaseSync.push()
        // コンソールやボタンから呼び出せるようにグローバルに公開 / 暴露给控制台和按钮调用
        window.FirebaseSync = { push: _saveToFirestore };

        // Load Firestore data first, then save local data if cloud is empty
        // まずFirestoreからデータをロード、クラウドが空なら本地データを保存
        // 先加载云端数据，若云端为空则把本地数据上传
        try {
          const snap = await getDoc(doc(db, 'users', user.uid));
          if (snap.exists()) {
            State.mergeFromCloud(snap.data());
            if (typeof App !== 'undefined') App.init();
            console.log('[Firestore] loaded ✅');
          } else {
            // First login — push local data up immediately
            // 初回ログイン — 本地データをすぐに送信 / 首次登录，立刻上传本地数据
            await _saveToFirestore();
          }
        } catch (e) {
          console.warn('[Firestore] load failed, using local data:', e.message);
        }

        // Save every 3 minutes while app is open (auto-sync)
        // アプリが開いている間、3分ごとに保存 / 打开期间每3分钟自动同步
        setInterval(_saveToFirestore, 3 * 60 * 1000);

        // Also save when tab closes
        // タブを閉じる時にも保存 / 关闭标签时也保存
        window.addEventListener('beforeunload', () => {
          setDoc(doc(db, 'users', user.uid), State.toCloud(), { merge: true })
            .catch(() => {});
        });
      }
      // If user === null: not signed in, authGate stays visible (no action needed)
      // user === null の場合: 未ログイン、authGate はそのまま表示 / user 为 null 时不做任何操作
    });

    // Initialize EmailJS with config from firebase-config.js
    // firebase-config.js の設定で EmailJS を初期化 / 用 firebase-config.js 的配置初始化 EmailJS
    if (typeof emailjs !== 'undefined' &&
        emailjsConfig?.publicKey &&
        emailjsConfig.publicKey !== 'YOUR_EMAILJS_PUBLIC_KEY') {
      emailjs.init(emailjsConfig.publicKey);
      State.updateSettings({
        emailjsServiceId:  emailjsConfig.serviceId,
        emailjsTemplateId: emailjsConfig.templateId,
      });
      console.log('[EmailJS] initialized:', emailjsConfig.serviceId);
    }

  } catch (e) {
    console.error('[Firebase] init error:', e);
    // On critical failure, at least show local mode option
    // 致命的なエラーの場合でも少なくともローカルモードオプションを表示
    // 严重错误时至少显示本地模式选项
    Auth._setErr('Firebase 加载失败，可使用本地模式');
  }
})();

// Firebase error code → user-friendly message
// Firebaseエラーコードを人が読めるメッセージに変換 / Firebase 错误码转可读信息
function _fbErr(code) {
  const map = {
    'auth/user-not-found':        '邮箱未注册',
    'auth/wrong-password':        '密码错误',
    'auth/invalid-credential':    '邮箱或密码错误',  // newer Firebase error code
    'auth/invalid-email':         '邮箱格式错误',
    'auth/email-already-in-use':  '该邮箱已注册',
    'auth/weak-password':         '密码太简单（至少6位）',
    'auth/popup-closed-by-user':  '已关闭 Google 登录窗口',
    'auth/popup-blocked':         '弹窗被浏览器拦截，请允许弹窗后重试',
    'auth/network-request-failed':'网络错误，请检查连接',
    'auth/too-many-requests':     '请求过多，请稍后再试',
    'auth/cancelled-popup-request': '登录已取消',
    'auth/unauthorized-domain':     '域名未授权，请联系管理员（Firebase Console → Auth → Settings → Authorized domains）',
  };
  return map[code] || '登录失败：' + code;
}
