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
  // ログイン後に初期化 / 登录后初始化
  function init() {
    I18n.init();
    ThemeManager.init();
    Motivate.render();
    BgPanel.init();
    BMI.init();
    Exercise.renderExerciseRecommend();
    Recipes.render();
    Tracker.init();
    Planner.init();
    Indulgence.init();
    Charts.renderMacroRing();
    Charts.renderWeeklyKcal();
    Charts.renderWeightChart();
    _setupScrollObserver();
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
