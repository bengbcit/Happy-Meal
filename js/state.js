// state.js — Global state + localStorage persistence
// グローバル状態管理 / 全局状态管理

const State = (() => {
  const KEY = 'hm_state';

  // Default state structure
  // デフォルト状態 / 默认状态结构
  const _default = {
    user: {
      gender: 'male',
      age: 25,
      height: 170,
      weight: 65,
      email: '',
      displayName: '',
    },
    recipes: [],          // Array of recipe objects
    logs: {},             // { 'YYYY-MM-DD': { meals: { breakfast:[], lunch:[], dinner:[], snack:[] } } }
    weeklyPlan: {},       // { 'YYYY-Www': { mon:[], tue:[], ... } }  ([] = [recipeId, recipeId, recipeId] for B/L/D)
    settings: {
      targetKcal: 0,      // auto-calculated from BMI if 0
      emailAddress: '',
      emailjsServiceId: '',
      emailjsTemplateId: '',
      claudeApiKey: '',
    }
  };

  let _s = _default;

  function _load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Deep merge: keep defaults for any missing keys
        // キーが欠落している場合はデフォルトを保持 / 合并默认值
        _s = _deepMerge(_default, parsed);
      }
    } catch (e) {
      console.error('[State] load error', e);
      _s = JSON.parse(JSON.stringify(_default));
    }
  }

  function _save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(_s));
    } catch (e) {
      console.error('[State] save error', e);
    }
  }

  function _deepMerge(defaults, override) {
    const result = Object.assign({}, defaults);
    for (const key in override) {
      if (
        override[key] !== null &&
        typeof override[key] === 'object' &&
        !Array.isArray(override[key]) &&
        typeof defaults[key] === 'object' &&
        !Array.isArray(defaults[key])
      ) {
        result[key] = _deepMerge(defaults[key] || {}, override[key]);
      } else {
        result[key] = override[key];
      }
    }
    return result;
  }

  // Load on init / 初期化時に読み込む / 初始化加载
  _load();

  return {
    get() { return _s; },
    save() { _save(); },

    // Convenience helpers
    // 便利ヘルパー / 便利方法
    getRecipes() { return _s.recipes || []; },
    addRecipe(r) {
      r.id = r.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      r.createdAt = r.createdAt || new Date().toISOString();
      _s.recipes.push(r);
      _save();
      return r;
    },
    updateRecipe(id, updates) {
      const idx = _s.recipes.findIndex(r => r.id === id);
      if (idx !== -1) { _s.recipes[idx] = { ..._s.recipes[idx], ...updates }; _save(); }
    },
    deleteRecipe(id) {
      _s.recipes = _s.recipes.filter(r => r.id !== id);
      _save();
    },

    // Daily log helpers
    // 日次ログヘルパー / 每日记录辅助
    getLog(dateStr) {
      if (!_s.logs[dateStr]) {
        _s.logs[dateStr] = { meals: { breakfast: [], lunch: [], dinner: [], snack: [] } };
      }
      return _s.logs[dateStr];
    },
    addLogEntry(dateStr, meal, entry) {
      const log = this.getLog(dateStr);
      log.meals[meal].push(entry);
      _s.logs[dateStr] = log;
      _save();
    },
    removeLogEntry(dateStr, meal, idx) {
      const log = this.getLog(dateStr);
      log.meals[meal].splice(idx, 1);
      _save();
    },

    // Weekly plan helpers
    // 週間プランヘルパー / 每周计划辅助
    getWeekPlan(weekKey) {
      if (!_s.weeklyPlan[weekKey]) {
        _s.weeklyPlan[weekKey] = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };
      }
      return _s.weeklyPlan[weekKey];
    },
    setWeekPlan(weekKey, plan) {
      _s.weeklyPlan[weekKey] = plan;
      _save();
    },

    // User profile helpers
    // ユーザープロフィールヘルパー / 用户档案辅助
    updateUser(updates) {
      Object.assign(_s.user, updates);
      _save();
    },
    updateSettings(updates) {
      Object.assign(_s.settings, updates);
      _save();
    },

    // Merge from Firestore (cloud sync)
    // Firestoreからマージ / 从 Firestore 合并
    mergeFromCloud(data) {
      if (data.recipes && Array.isArray(data.recipes)) _s.recipes = data.recipes;
      if (data.logs) _s.logs = data.logs;
      if (data.weeklyPlan) _s.weeklyPlan = data.weeklyPlan;
      if (data.user) Object.assign(_s.user, data.user);
      if (data.settings) Object.assign(_s.settings, data.settings);
      _save();
    },

    toCloud() {
      return {
        recipes: _s.recipes,
        logs: _s.logs,
        weeklyPlan: _s.weeklyPlan,
        user: _s.user,
        settings: _s.settings,
      };
    }
  };
})();
