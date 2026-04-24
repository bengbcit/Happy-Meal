// app.js — Main entry: tab routing, UI helpers
// メインエントリ：タブルーティング・UIヘルパー / 主入口：Tab 路由与 UI 辅助

const App = (() => {
  let _currentTab = 'dashboard';

  // Switch between main tabs
  // メインタブを切り替え / 切换主 Tab
  function switchTab(tabId) {
    document.querySelectorAll('.tab-page').forEach(el => {
      el.classList.toggle('active', el.id === `tab-${tabId}`);
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    _currentTab = tabId;

    // Fire custom event so scroll-reveal observer can re-run
    document.dispatchEvent(new CustomEvent('tabChanged', { detail: tabId }));

    // Lazy render on tab switch
    // タブ切り替え時に遅延レンダリング / Tab 切换时懒渲染
    if (tabId === 'recipes')    Recipes.render();
    if (tabId === 'tracker')    Tracker.render();
    if (tabId === 'planner')    Planner.render();
    if (tabId === 'exercise')   { Exercise.render(); Exercise.renderLog(); }
    if (tabId === 'indulgence') Indulgence.render();
    if (tabId === 'dashboard')  { BMI.init(); Tracker.renderSummary(); Charts.renderMacroRing(); Charts.renderWeightChart(); }
  }

  // Toast notification
  // トースト通知 / Toast 提示
  let _toastTimer = null;
  function showToast(msg, type = '') {
    const el = document.getElementById('indulgeToast');
    if (!el) return;
    el.textContent = msg;
    el.className = `toast${type ? ' ' + type : ''}`;
    if (_toastTimer) clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => el.classList.add('hidden'), 3500);
  }

  // Profile panel toggle
  // プロフィールパネルの切り替え / 个人资料面板切换
  const ProfilePanel = {
    toggle() {
      const el = document.getElementById('profilePanel');
      el?.classList.toggle('hidden');
    }
  };

  // Lang menu toggle
  // 言語メニューの切り替え / 语言菜单切换
  const LangMenu = {
    toggle() {
      const el = document.getElementById('langMenu');
      el?.classList.toggle('hidden');
    }
  };

  // Close dropdowns when clicking outside
  // 外部クリックでドロップダウンを閉じる / 点击外部关闭下拉菜单
  document.addEventListener('click', e => {
    if (!e.target.closest('.topbar-right')) {
      document.getElementById('langMenu')?.classList.add('hidden');
      document.getElementById('profilePanel')?.classList.add('hidden');
      document.getElementById('bgPanel')?.classList.add('hidden');
      document.getElementById('switchPanel')?.classList.add('hidden');
    }
    // Clicking a panel item (not the toggle button itself) should also close the panel
    if (e.target.closest('#switchPanel') && !e.target.closest('#profileName')) {
      setTimeout(() => document.getElementById('switchPanel')?.classList.add('hidden'), 80);
    }
    if (e.target.closest('#profilePanel') && !e.target.closest('#avatarBtn')) {
      setTimeout(() => document.getElementById('profilePanel')?.classList.add('hidden'), 80);
    }
  });

  // Initialize after login
  // ログイン後に初期化 / 登录后初始化
  function init() {
    I18n.init();
    ThemeManager.init();
    Motivate.render();   // daily quote — language-aware / 每日鼓励语
    BgPanel.init();      // restore saved background / 恢复已保存背景
    BMI.init();
    Recipes.render();
    Tracker.init();
    Planner.init();
    Indulgence.init();
    Charts.renderMacroRing();
    Charts.renderWeeklyKcal();
    Charts.renderWeightChart();
  }

  // Auto-enter if Firebase auth persists (checked by firebase-init.js)
  // Firebase認証が持続する場合は自動ログイン / 如果 Firebase 认证持久化则自动登录
  // If no Firebase config, show auth gate with local option visible
  window.addEventListener('DOMContentLoaded', () => {
    I18n.init();

    // Check if we have a persisted local session
    // 永続化されたローカルセッションを確認 / 检查是否有持久化的本地会话
    const savedUser = State.get().user;
    if (savedUser.displayName && savedUser.displayName !== '' && savedUser.displayName !== 'Guest') {
      // Will be handled by Firebase onAuthStateChanged
      // Firebase の onAuthStateChanged で処理 / 由 Firebase onAuthStateChanged 处理
    }
  });

  return { switchTab, showToast, init };
})();

// Make ProfilePanel and LangMenu globally accessible
// ProfilePanelとLangMenuをグローバルアクセス可能にする / 使 ProfilePanel 和 LangMenu 全局可访问
const ProfilePanel = { toggle() { document.getElementById('profilePanel')?.classList.toggle('hidden'); } };
const LangMenu     = { toggle() { document.getElementById('langMenu')?.classList.toggle('hidden'); } };
