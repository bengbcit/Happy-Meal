// app.js — Main entry: tab routing, UI helpers
// メインエントリ：タブルーティング・UIヘルパー / 主入口：Tab 路由与 UI 辅助

const App = (() => {
  let _currentTab = 'dashboard';
  const TAB_ORDER = ['dashboard','tracker','recipes','planner','exercise','indulgence'];

  // Switch between main tabs — CSS Scroll Snap version
  // scrollIntoView() lets the browser handle smooth snap natively (zero JS jank)
  // CSS スクロールスナップでタブ切替 / 用浏览器原生滚动吸附切换 Tab
  function switchTab(tabId) {
    _currentTab = tabId;
    sessionStorage.setItem('hm_tab', tabId);
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    // Scroll inside #tabScrollContainer
    const container = document.getElementById('tabScrollContainer');
    const el = document.getElementById(`tab-${tabId}`);
    if (container && el) {
      // el.offsetTop is relative to offsetParent; subtract container's offsetTop to get scroll position
      const top = el.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
      container.scrollTo({ top, behavior: 'smooth' });
    }

    document.dispatchEvent(new CustomEvent('tabChanged', { detail: tabId }));
    _lazyRender(tabId);
  }

  function _lazyRender(tabId) {
    if (tabId === 'recipes')    Recipes.render();
    if (tabId === 'tracker')    Tracker.render();
    if (tabId === 'planner')    Planner.render();
    if (tabId === 'exercise')   { Exercise.render(); Exercise.renderLog(); }
    if (tabId === 'indulgence') Indulgence.render();
    if (tabId === 'dashboard')  { BMI.init(); Tracker.renderSummary(); Charts.renderMacroRing(); Charts.renderWeightChart(); }
  }

  // Update active tab-btn as user freely scrolls (IntersectionObserver on scroll container)
  // 自由スクロール中にアクティブタブを更新 / 用户自由滚动时同步更新 Tab 高亮
  function _setupScrollObserver() {
    const container = document.getElementById('tabScrollContainer');
    if (!container) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          const tabId = entry.target.id.replace('tab-', '');
          if (tabId === _currentTab) return;
          _currentTab = tabId;
          document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
          });
          _lazyRender(tabId);
        }
      });
    }, {
      root: container,    // observe within #tabScrollContainer, not the viewport
      threshold: 0.5,
    });

    TAB_ORDER.forEach(id => {
      const el = document.getElementById(`tab-${id}`);
      if (el) observer.observe(el);
    });
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
    if (e.target.closest('#switchPanel') && !e.target.closest('#profileName')) {
      setTimeout(() => document.getElementById('switchPanel')?.classList.add('hidden'), 80);
    }
    if (e.target.closest('#profilePanel') && !e.target.closest('#avatarBtn')) {
      setTimeout(() => document.getElementById('profilePanel')?.classList.add('hidden'), 80);
    }
  });

  // Initialize after login
  // App.init() may be called more than once (auth.js + firebase-init.js both call it).
  // _appInited guards one-time setup; subsequent calls only re-render data.
  // App.init()は複数回呼ばれる可能性がある。_appInitedで1回限りの初期化を保護する。
  // App.init() 可能被多次调用，_appInited 保护只初始化一次，后续只刷新数据
  let _appInited = false;
  function init() {
    I18n.init();
    ThemeManager.init();
    Motivate.render();
    BgPanel.init();

    if (!_appInited) {
      _appInited = true;
      // One-time setup: register observers, init modules that set up state/event listeners
      // 一回限りの初期化：状態やイベントリスナーを設定するモジュールを初期化
      // 一次性初始化：设置状态和事件监听器
      Tracker.init();       // sets _date = today, binds nothing (onclick in HTML)
      Planner.init();
      Indulgence.init();
      _setupScrollObserver();
    }

    // Always re-render on every login (data may have changed from cloud sync)
    // ログインのたびに再レンダリング（クラウド同期でデータが変わっている可能性がある）
    // 每次登录都重新渲染（云端同步后数据可能已更新）
    BMI.init();
    Exercise.renderExerciseRecommend();
    Recipes.render();
    Charts.renderMacroRing();
    Charts.renderWeeklyKcal();
    Charts.renderWeightChart();
    Tracker.render();
    Tracker.renderSummary();

    // Restore last active tab after re-render (no animation)
    const savedTab = sessionStorage.getItem('hm_tab');
    if (savedTab && savedTab !== 'dashboard') {
      const container = document.getElementById('tabScrollContainer');
      const el = document.getElementById(`tab-${savedTab}`);
      if (container && el) {
        container.scrollTop = el.offsetTop - container.offsetTop;
        _currentTab = savedTab;
        document.querySelectorAll('.tab-btn').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.tab === savedTab);
        });
      }
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    I18n.init();
    const savedUser = State.get().user;
    // Firebase onAuthStateChanged handles auto-login; nothing needed here
  });

  return { switchTab, showToast, init };
})();

// Make ProfilePanel and LangMenu globally accessible
// ProfilePanelとLangMenuをグローバルアクセス可能にする / 使 ProfilePanel 和 LangMenu 全局可访问
const ProfilePanel = { toggle() { document.getElementById('profilePanel')?.classList.toggle('hidden'); } };
const LangMenu     = { toggle() { document.getElementById('langMenu')?.classList.toggle('hidden'); } };
