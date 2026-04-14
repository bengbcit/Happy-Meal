// firebase-init.js — Firebase initialization + Auth state management
// Firebase初期化・認証状態管理 / Firebase 初始化 + 认证状态管理

// Load Firebase modules dynamically (CDN)
// CDNからFirebaseモジュールを動的にロード / 从 CDN 动态加载 Firebase 模块
(async () => {
  if (!firebaseConfig || firebaseConfig.apiKey === 'YOUR_API_KEY') {
    console.warn('[Firebase] No config set, running in local mode.');
    return;
  }

  try {
    const { initializeApp }         = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js');
    const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
            GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }
      = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js');
    const { getFirestore, doc, setDoc, getDoc }
      = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');

    const app  = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db   = getFirestore(app);

    // Override Auth object with real Firebase methods
    // AuthオブジェクトをリアルなFirebaseメソッドで上書き / 用真实 Firebase 方法覆盖 Auth 对象
    Object.assign(Auth, {
      async login() {
        const email = document.getElementById('authEmail')?.value.trim();
        const pwd   = document.getElementById('authPwd')?.value;
        if (!email || !pwd) { _setErr('请输入邮箱和密码'); return; }
        _setLoading();
        try {
          await signInWithEmailAndPassword(auth, email, pwd);
        } catch (e) {
          Auth._showLoginForm();
          _setErr(_fbErr(e.code));
        }
      },

      async register() {
        const email = document.getElementById('authEmail')?.value.trim();
        const pwd   = document.getElementById('authPwd')?.value;
        if (!email || !pwd || pwd.length < 6) { _setErr('密码至少6位'); return; }
        _setLoading();
        try {
          await createUserWithEmailAndPassword(auth, email, pwd);
        } catch (e) {
          Auth._showLoginForm();
          _setErr(_fbErr(e.code));
        }
      },

      async googleLogin() {
        _setLoading();
        try {
          await signInWithPopup(auth, new GoogleAuthProvider());
        } catch (e) {
          Auth._showLoginForm();
          _setErr(_fbErr(e.code));
        }
      },

      async logout() {
        await signOut(auth);
        window.location.reload();
      },

      localMode() {
        _enterApp('Guest');
      },

      _showLoginForm() {
        const form = document.getElementById('authForm');
        if (!form) return;
        form.innerHTML = `
          <input id="authEmail" type="email" class="inp" placeholder="${I18n.get('ph_email')}" autocomplete="username"/>
          <input id="authPwd" type="password" class="inp" placeholder="${I18n.get('ph_pwd')}" autocomplete="current-password"
                 onkeydown="if(event.key==='Enter') Auth.login()"/>
          <button class="btn-primary w100" onclick="Auth.login()">${I18n.get('btn_login')}</button>
          <button class="btn-secondary w100" onclick="Auth.register()">${I18n.get('btn_register')}</button>
          <button class="btn-google w100" onclick="Auth.googleLogin()">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="18"/> Google 登录
          </button>
          <p id="authErr" class="auth-err"></p>
          <hr class="auth-divider"/>
          <button class="btn-local" onclick="Auth.localMode()">${I18n.get('btn_local')}</button>`;
      }
    });

    // Offline timeout: if Firebase doesn't respond in 8s, show local option
    // Firebase 8秒間応答なしでローカルオプションを表示 / 8秒无响应后显示本地选项
    const offlineTimer = setTimeout(() => {
      if (document.getElementById('authGate') &&
          !document.getElementById('authGate').classList.contains('hidden')) {
        _setErr('网络较慢，可以选择本地模式继续');
      }
    }, 8000);

    // Auth state listener
    // 認証状態リスナー / 认证状态监听
    onAuthStateChanged(auth, async user => {
      clearTimeout(offlineTimer);
      if (user) {
        _enterApp(user.displayName || user.email?.split('@')[0] || 'User');
        State.updateUser({ email: user.email, displayName: user.displayName || '' });

        // Load Firestore data (non-blocking)
        // Firestoreデータを非ブロッキングで読み込む / 非阻塞加载 Firestore 数据
        try {
          const snap = await getDoc(doc(db, 'users', user.uid));
          if (snap.exists()) {
            State.mergeFromCloud(snap.data());
            App.init(); // re-render with cloud data
          }
        } catch (e) {
          console.warn('[Firestore] load failed, using local data', e);
        }

        // Save to Firestore on window unload (or periodically)
        // ウィンドウアンロード時にFirestoreに保存 / 窗口卸载时保存到 Firestore
        window.addEventListener('beforeunload', () => {
          setDoc(doc(db, 'users', user.uid), State.toCloud(), { merge: true })
            .catch(e => console.warn('[Firestore] save failed', e));
        });
      }
    });

    // Initialize EmailJS
    // EmailJSを初期化 / 初始化 EmailJS
    if (typeof emailjs !== 'undefined' && emailjsConfig.publicKey !== 'YOUR_EMAILJS_PUBLIC_KEY') {
      emailjs.init(emailjsConfig.publicKey);
      State.updateSettings({
        emailjsServiceId: emailjsConfig.serviceId,
        emailjsTemplateId: emailjsConfig.templateId,
      });
    }

  } catch (e) {
    console.error('[Firebase] init error:', e);
  }
})();

// Firebase error code → human-readable message
// Firebaseエラーコードを人が読める形式に変換 / 将 Firebase 错误码转换为可读信息
function _fbErr(code) {
  const map = {
    'auth/user-not-found':      '邮箱未注册',
    'auth/wrong-password':      '密码错误',
    'auth/invalid-email':       '邮箱格式错误',
    'auth/email-already-in-use':'该邮箱已注册',
    'auth/weak-password':       '密码太简单（至少6位）',
    'auth/popup-closed-by-user':'Google 登录窗口被关闭',
    'auth/network-request-failed': '网络错误，请检查连接',
    'auth/too-many-requests':   '请求过多，请稍后再试',
  };
  return map[code] || '登录失败：' + code;
}
