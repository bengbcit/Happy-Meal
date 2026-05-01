// state.js — Global state + localStorage persistence
// グローバル状態管理 / 全局状态管理

const State = (() => {
  const KEY_PREFIX = 'hm_state';
  // Per-user key: hm_state_<uid> prevents data leakage between accounts
  // ユーザーごとのキー: アカウント間のデータ漏洩を防ぐ / 每个账号独立 key，防止数据混用
  let _currentKey = KEY_PREFIX;

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
    weightLog: [],        // [{ date: 'YYYY-MM-DD', weight: 65.5 }, ...]
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
      const raw = localStorage.getItem(_currentKey);
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
      localStorage.setItem(_currentKey, JSON.stringify(_s));
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

    // Switch to a different user's storage partition (called after Firebase login)
    // 別ユーザーのストレージに切り替え / 切换到指定用户的存储分区（Firebase 登录后调用）
    switchUser(uid) {
      const newKey = uid ? `${KEY_PREFIX}_${uid}` : KEY_PREFIX;
      if (newKey === _currentKey) return; // same user, nothing to do
      _currentKey = newKey;
      _s = JSON.parse(JSON.stringify(_default)); // reset to defaults first
      _load(); // then load this user's data
    },

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

    // Weight log helpers
    // 体重ログヘルパー / 体重记录辅助
    getWeightLog() { return _s.weightLog || []; },
    addWeightEntry(dateStr, weight) {
      if (!_s.weightLog) _s.weightLog = [];
      const idx = _s.weightLog.findIndex(e => e.date === dateStr);
      if (idx !== -1) {
        _s.weightLog[idx].weight = weight;
      } else {
        _s.weightLog.push({ date: dateStr, weight });
        _s.weightLog.sort((a, b) => a.date.localeCompare(b.date));
      }
      // Keep only last 90 days
      if (_s.weightLog.length > 90) _s.weightLog = _s.weightLog.slice(-90);
      _save();
    },
    removeWeightEntry(dateStr) {
      _s.weightLog = (_s.weightLog || []).filter(e => e.date !== dateStr);
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
      if (data.weightLog && Array.isArray(data.weightLog)) _s.weightLog = data.weightLog;
      if (data.user) Object.assign(_s.user, data.user);
      if (data.settings) Object.assign(_s.settings, data.settings);
      _save();
    },

    toCloud() {
      return {
        recipes: _s.recipes,
        logs: _s.logs,
        weeklyPlan: _s.weeklyPlan,
        weightLog: _s.weightLog || [],
        user: _s.user,
        settings: _s.settings,
      };
    }
  };
})();
