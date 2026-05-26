// tracker.js — Daily calorie/macro tracking
// 日次カロリー・栄養素追跡 / 每日卡路里与营养素追踪

const Tracker = (() => {
  // Today's date string YYYY-MM-DD
  // 今日の日付文字列 / 今日日期字符串
  let _date = _todayStr();

  function _todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function _fmtDate(d) {
    // Format date for display: 4/15 (Mon)
    const dt = new Date(d + 'T00:00:00');
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    return `${dt.getMonth()+1}/${dt.getDate()} (${days[dt.getDay()]})`;
  }

  // ── Navigate dates ───────────────────────────────────
  function prevDay() {
    const d = new Date(_date + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    _date = d.toISOString().slice(0, 10);
    render();
  }
  function nextDay() {
    const today = _todayStr();
    if (_date >= today) return;
    const d = new Date(_date + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    _date = d.toISOString().slice(0, 10);
    render();
  }

  // ── Totals for a date ────────────────────────────────
  // 指定日の合計を計算 / 计算指定日期的营养总量
  function getTotals(dateStr) {
    const log = State.getLog(dateStr);
    const totals = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
    Object.values(log.meals).forEach(items => {
      items.forEach(item => {
        totals.kcal    += item.kcal    || 0;
        totals.protein += item.protein || 0;
        totals.carbs   += item.carbs   || 0;
        totals.fat     += item.fat     || 0;
      });
    });
    return totals;
  }

  // Returns today's macro ratios for BMI recommendation
  // BMI推薦用の今日の栄養素比率 / 为 BMI 推荐返回今日营养素比例
  function getTodayMacros() {
    const t = getTotals(_todayStr());
    const total = t.protein + t.carbs + t.fat || 1;
    return {
      proteinRatio: t.protein / total,
      carbRatio:    t.carbs   / total,
      fatRatio:     t.fat     / total,
      kcal: t.kcal,
    };
  }

  // ── Add entry (from recipe or manual) ───────────────
  // レシピまたは手動からエントリを追加 / 从菜谱或手动添加记录
  function addFromRecipe(recipeId) {
    const r = State.getRecipes().find(x => x.id === recipeId);
    if (!r) return;
    _promptMealSelect(entry => {
      State.addLogEntry(_date, entry, {
        name: r.name, kcal: r.kcal, protein: r.protein,
        carbs: r.carbs, fat: r.fat, recipeId: r.id,
      });
      render();
      Charts.renderMacroRing();
      Charts.renderWeeklyKcal();
    });
  }

  function _promptMealSelect(cb) {
    const meal = prompt(
      `添加到哪一餐？\n1 早餐  2 午餐  3 晚餐  4 零食`,
      '1'
    );
    const map = {'1':'breakfast','2':'lunch','3':'dinner','4':'snack'};
    cb(map[meal?.trim()] || 'snack');
  }

  // ── Render ───────────────────────────────────────────
  function render() {
    // Date label
    const dateEl = document.getElementById('trackerDate');
    if (dateEl) dateEl.textContent = _fmtDate(_date);

    // Meal sections
    const container = document.getElementById('mealSections');
    if (!container) return;
    const meals = [
      { key: 'breakfast', label: I18n.get('meal_breakfast') },
      { key: 'lunch',     label: I18n.get('meal_lunch') },
      { key: 'dinner',    label: I18n.get('meal_dinner') },
      { key: 'snack',     label: I18n.get('meal_snack') },
    ];
    const log = State.getLog(_date);
    container.innerHTML = meals.map(m => _mealCardHTML(m, log.meals[m.key] || [], _date)).join('');

    // Render charts
    Charts.renderNutritionBar(getTotals(_date));
    Charts.renderWeeklyKcal();

    // Dashboard ring update
    renderSummary();
  }

  function _mealCardHTML(meal, items, dateStr) {
    const mealKcal = items.reduce((s, i) => s + (i.kcal || 0), 0);

    // Group items by groupId; ungrouped items each get their own solo group
    const groups = [];
    const seen = {};
    items.forEach((item, idx) => {
      const gid = item.groupId || ('solo_' + idx);
      if (!seen[gid]) {
        seen[gid] = { groupId: gid, name: item.groupName || null, items: [], indices: [] };
        groups.push(seen[gid]);
      }
      seen[gid].items.push(item);
      seen[gid].indices.push(idx);
    });

    const groupsHTML = groups.map(g => {
      const gKcal = g.items.reduce((s, i) => s + (i.kcal || 0), 0);
      const hasName = g.name && g.name.trim();

      if (hasName) {
        // Named group — show as a clickable badge + expandable list
        const detailId = `grp-${meal.key}-${g.groupId}`;
        const itemsDetail = g.items.map((item, i) => `
          <div class="meal-item meal-item-sub">
            <span class="meal-item-name">${item.name}</span>
            <span class="meal-item-kcal">${item.kcal || 0} kcal</span>
            <button class="meal-item-del" onclick="Tracker.removeEntry('${dateStr}','${meal.key}',${g.indices[i]});event.stopPropagation()">✕</button>
          </div>`).join('');
        return `
          <div class="meal-group">
            <div class="meal-group-header" onclick="this.nextElementSibling.classList.toggle('hidden')">
              <span class="meal-group-name">🍱 ${g.name}</span>
              <span class="meal-group-kcal">${gKcal} kcal</span>
              <span class="meal-group-toggle">▾</span>
            </div>
            <div class="meal-group-detail hidden" id="${detailId}">
              ${itemsDetail}
              <button class="meal-group-edit-btn" onclick="Tracker._editGroup('${dateStr}','${meal.key}','${g.groupId}');event.stopPropagation()">✏️ ${I18n.get('edit') || '编辑'}</button>
            </div>
          </div>`;
      } else {
        // Ungrouped — show items directly as before
        return g.items.map((item, i) => `
          <div class="meal-item">
            <span class="meal-item-name">${item.name}</span>
            <span class="meal-item-kcal">${item.kcal || 0} kcal</span>
            <button class="meal-item-del" onclick="Tracker.removeEntry('${dateStr}','${meal.key}',${g.indices[i]})">✕</button>
          </div>`).join('');
      }
    }).join('');

    return `
      <div class="meal-card">
        <div class="meal-header">
          <span class="meal-title">${meal.label}</span>
          <span class="meal-kcal">${mealKcal} kcal</span>
        </div>
        <div class="meal-items">${groupsHTML}</div>
        <button class="meal-add-btn" onclick="Tracker.addManual('${dateStr}','${meal.key}')">
          + ${I18n.get('add_food')}
        </button>
      </div>`;
  }

  // Edit group — re-open FoodSearch modal pre-filled with group items
  function _editGroup(dateStr, mealKey, groupId) {
    const log   = State.getLog(dateStr);
    const items = (log.meals[mealKey] || []).filter(i => i.groupId === groupId);
    FoodSearch.openEdit(dateStr, mealKey, groupId, items);
  }

  // Remove a log entry
  // ログエントリを削除 / 删除记录条目
  function removeEntry(dateStr, meal, idx) {
    State.removeLogEntry(dateStr, meal, parseInt(idx));
    render();
    Charts.renderMacroRing();
  }

  // Manual add dialog — opens AI-powered FoodSearch modal
  // 手動追加ダイアログ — AI食物検索モーダルを開く / 手动添加对话框 — 打开 AI 食物搜索弹窗
  function addManual(dateStr, meal) {
    FoodSearch.open(dateStr, meal);
  }

  // Dashboard summary ring
  // ダッシュボードサマリーリング / 仪表板营养环形图
  function renderSummary() {
    const t = getTotals(_todayStr());
    const todayKcalEl = document.getElementById('todayKcal');
    if (todayKcalEl) todayKcalEl.textContent = Math.round(t.kcal);

    const baseTarget = State.get().settings.targetKcal || 1800;
    // Add today's exercise burned to target so the ring shows adjusted budget
    const burned       = (typeof Exercise !== 'undefined') ? Exercise.getTodayBurned() : 0;
    const adjTarget    = baseTarget + burned;
    const targetEl     = document.getElementById('targetKcal');
    const targetRowEl  = document.getElementById('targetKcalRow');

    if (targetEl) {
      if (burned > 0) {
        // Show base + exercise breakdown
        const names = (typeof Exercise !== 'undefined') ? Exercise.getTodayExerciseNames() : [];
        const uniqueNames = [...new Set(names)];
        const exerciseNote = uniqueNames.length
          ? `+${burned}（${uniqueNames.join('、')}）`
          : `+${burned}`;
        targetEl.innerHTML = `${baseTarget} <span style="color:var(--accent-warm,#FF7A45);font-size:.82em">${exerciseNote}</span> = ${adjTarget}`;
      } else {
        targetEl.textContent = baseTarget;
      }
    }

    // Macro bars
    const macroBarsEl = document.getElementById('macroBars');
    if (!macroBarsEl) return;
    const items = [
      { label: I18n.get('protein_lbl'), val: t.protein, target: (adjTarget * 0.30) / 4, color: '#3498db' },
      { label: I18n.get('carb_lbl'),    val: t.carbs,   target: (adjTarget * 0.40) / 4, color: '#f39c12' },
      { label: I18n.get('fat_lbl'),     val: t.fat,     target: (adjTarget * 0.30) / 9, color: '#e74c3c' },
    ];
    macroBarsEl.innerHTML = items.map(item => {
      const pct = Math.min(100, (item.val / (item.target || 1)) * 100);
      return `
        <div class="macro-bar-row">
          <span>${item.label}</span>
          <div class="macro-bar-track">
            <div class="macro-bar-fill" style="width:${pct}%;background:${item.color}"></div>
          </div>
          <span>${Math.round(item.val)}g</span>
        </div>`;
    }).join('');

    // Pass exercise burned to ring so it shows extra segment
    Charts.renderMacroRing(t, adjTarget, burned);
  }

  // ── CSV import ───────────────────────────────────────
  // CSVファイルから食品エントリをインポート / 从 CSV 文件导入食物条目
  async function importCSV(file) {
    const statusEl = document.getElementById('importStatus');
    if (!file) return;
    if (statusEl) statusEl.innerHTML = `<span class="loading-spin"></span> 读取 CSV...`;
    try {
      const text = await file.text();
      const items = Parser.parseCSV(text);
      if (!items.length) throw new Error('no data');
      // Show selection prompt
      // 選択プロンプトを表示 / 显示选择提示
      const mealChoice = prompt(`CSV 解析到 ${items.length} 条食物，添加到哪一餐？\n1 早餐  2 午餐  3 晚餐  4 零食`, '4');
      const mealMap = {'1':'breakfast','2':'lunch','3':'dinner','4':'snack'};
      const meal = mealMap[mealChoice?.trim()] || 'snack';
      items.forEach(item => State.addLogEntry(_date, meal, item));
      render();
      Charts.renderMacroRing();
      if (statusEl) statusEl.textContent = `✅ 已导入 ${items.length} 条 → ${meal}`;
    } catch(e) {
      if (statusEl) statusEl.textContent = '❌ CSV 读取失败，请检查格式（需要 name/kcal/protein/carbs/fat 列）';
    }
  }

  // ── Image import — shows TrackerImportModal for review before saving ───────
  // 画像インポート：保存前にレビューモーダルを表示 / 图片导入：保存前显示审阅弹窗
  async function importImage(file) {
    const statusEl = document.getElementById('importStatus');
    if (!file) return;
    // Reset input so same file can be selected again
    document.getElementById('trackerImgInput').value = '';
    if (statusEl) statusEl.innerHTML = `<span class="loading-spin"></span> AI 识别中...`;
    try {
      const result = await Parser.fromImageForTracker(file);
      if (!result) throw new Error('empty');
      if (statusEl) statusEl.textContent = '';
      TrackerImportModal.show(result, _date);
    } catch(e) {
      const msg = e.message || '';
      if (msg.includes('Vision requires') || msg.includes('GEMINI') || msg.includes('CLAUDE')) {
        if (statusEl) statusEl.innerHTML =
          `❌ 图片识别需要 Gemini 或 Claude API key。` +
          `请在 Vercel 环境变量中添加 <b>GEMINI_API_KEY</b> 或 <b>CLAUDE_API_KEY</b>。`;
      } else {
        if (statusEl) statusEl.textContent = '❌ 识别失败：' + (msg || '请手动添加');
      }
    }
  }

  function init() {
    _date = _todayStr();
    render();
    renderSummary();
  }

  return { prevDay, nextDay, addFromRecipe, addManual, removeEntry,
           getTotals, getTodayMacros, renderSummary, render, importCSV, importImage, init, _editGroup };
})();

// ── TrackerImportModal ────────────────────────────────
// Review-and-edit modal shown after AI image recognition
// AI画像認識後のレビュー・編集モーダル / AI 图片识别后的审阅编辑弹窗
// Features: gram estimates, per-item meal assignment, edit before save
// 機能：グラム推定、食事別割り当て、保存前編集 / 支持克重估算、分餐分配、保存前编辑
const TrackerImportModal = (() => {
  let _items = [];
  let _date  = null;
  let _nextId = 0;

  const MEAL_KEYS = ['breakfast','lunch','dinner','snack'];

  function _mealLabel(m) {
    return { breakfast: I18n.get('meal_breakfast'), lunch: I18n.get('meal_lunch'),
             dinner: I18n.get('meal_dinner'), snack: I18n.get('meal_snack') }[m] || m;
  }

  // Normalize API response: handle {meals:{...}} or flat array
  // APIレスポンスを正規化: {meals:{...}} または フラット配列を処理
  // 标准化 API 返回: 支持 {meals:{...}} 结构或扁平数组
  function _normalize(raw) {
    const items = [];
    if (raw && raw.meals && typeof raw.meals === 'object') {
      // Grouped by meal: {meals:{breakfast:[...], lunch:[...], ...}}
      MEAL_KEYS.forEach(meal => {
        (raw.meals[meal] || []).forEach(item => {
          items.push({ id: _nextId++, meal, ...item });
        });
      });
    } else {
      // Flat array: [{name, kcal, protein, carbs, fat, meal?}, ...]
      const arr = Array.isArray(raw) ? raw : [raw];
      arr.forEach(item => {
        items.push({ id: _nextId++, meal: item.meal || 'snack', ...item });
      });
    }
    return items;
  }

  function show(raw, date) {
    _date  = date;
    _items = _normalize(raw);
    _render();
    document.getElementById('trackerImportModal')?.classList.remove('hidden');
  }

  function _render() {
    const el = document.getElementById('trackerImportContent');
    if (!el) return;

    if (_items.length === 0) {
      el.innerHTML = `<p class="placeholder-text">${I18n.get('no_food_detected') || '未识别到食物，请手动添加'}</p>`;
      return;
    }

    // Group by meal for display
    const grouped = {};
    MEAL_KEYS.forEach(m => { grouped[m] = []; });
    _items.forEach(item => { (grouped[item.meal] || grouped.snack).push(item); });

    const totalItems = _items.length;
    const hintTpl = I18n.get('import_hint') || '已识别 {n} 个食物，可编辑后保存';
    const hintText = hintTpl.replace('{n}', totalItems);
    const mealSections = MEAL_KEYS
      .filter(m => grouped[m].length > 0)
      .map(m => `
        <div class="tim-meal-group">
          <div class="tim-meal-label">${_mealLabel(m)}</div>
          ${grouped[m].map(item => _itemRowHTML(item)).join('')}
        </div>`).join('');

    el.innerHTML = `
      <p class="tim-hint">${hintText}</p>
      ${mealSections}
      <button class="btn-small tim-add-btn" onclick="TrackerImportModal.addEmpty()">
        ＋ ${I18n.get('add_food') || '添加食物'}
      </button>`;
  }

  function _itemRowHTML(item) {
    const mealOptions = MEAL_KEYS.map(m =>
      `<option value="${m}" ${item.meal===m?'selected':''}>${_mealLabel(m)}</option>`
    ).join('');
    return `
      <div class="tim-row" id="timRow-${item.id}">
        <div class="tim-row-top">
          <input class="inp tim-name" value="${_esc(item.name||'')}"
                 placeholder="${I18n.get('add_food')||'食物名'}"
                 onchange="TrackerImportModal._upd(${item.id},'name',this.value)"/>
          <select class="inp tim-meal-sel"
                  onchange="TrackerImportModal._upd(${item.id},'meal',this.value)">
            ${mealOptions}
          </select>
          <button class="row-del-btn" onclick="TrackerImportModal._del(${item.id})">−</button>
        </div>
        <div class="tim-nums">
          <label class="tim-num-label">
            <input class="inp tim-num" type="number" min="0" value="${item.grams||''}"
                   placeholder="0" onchange="TrackerImportModal._upd(${item.id},'grams',this.value)"/>
            <span class="tim-sep">g</span>
          </label>
          <label class="tim-num-label">
            <input class="inp tim-num" type="number" min="0" value="${item.kcal||''}"
                   placeholder="0" onchange="TrackerImportModal._upd(${item.id},'kcal',this.value)"/>
            <span class="tim-sep">kcal</span>
          </label>
          <label class="tim-num-label">
            <input class="inp tim-num" type="number" min="0" value="${item.protein||''}"
                   placeholder="0" onchange="TrackerImportModal._upd(${item.id},'protein',this.value)"/>
            <span class="tim-sep">${I18n.get('protein_lbl')||'蛋白g'}</span>
          </label>
          <label class="tim-num-label">
            <input class="inp tim-num" type="number" min="0" value="${item.carbs||''}"
                   placeholder="0" onchange="TrackerImportModal._upd(${item.id},'carbs',this.value)"/>
            <span class="tim-sep">${I18n.get('carb_lbl')||'碳水g'}</span>
          </label>
          <label class="tim-num-label">
            <input class="inp tim-num" type="number" min="0" value="${item.fat||''}"
                   placeholder="0" onchange="TrackerImportModal._upd(${item.id},'fat',this.value)"/>
            <span class="tim-sep">${I18n.get('fat_lbl')||'脂肪g'}</span>
          </label>
        </div>
      </div>`;
  }

  function _esc(s) { return (s||'').replace(/"/g,'&quot;'); }

  function _upd(id, field, val) {
    const item = _items.find(x => x.id === id);
    if (!item) return;
    if (['grams','kcal','protein','carbs','fat'].includes(field)) {
      item[field] = parseFloat(val) || 0;
    } else {
      item[field] = val;
    }
    // Re-render grouped view if meal changed (item moves to different section)
    if (field === 'meal') _render();
  }

  function _del(id) {
    _items = _items.filter(x => x.id !== id);
    _render();
  }

  // Add a blank row so user can manually add items
  // 空白行を追加してユーザーが手動で入力できるようにする / 添加空白行供用户手动录入
  function addEmpty() {
    _items.push({ id: _nextId++, name:'', grams:0, kcal:0, protein:0, carbs:0, fat:0, meal:'snack' });
    _render();
  }

  // Step 1: show naming + meal-assignment UI before saving
  function saveAll() {
    const valid = _items.filter(x => (x.name||'').trim());
    if (!valid.length) { close(); return; }

    // Auto-suggest group name from first 3 item names
    const suggested = valid.slice(0, 3).map(x => x.name.trim()).join('+');

    const el = document.getElementById('trackerImportContent');
    if (!el) return;
    el.innerHTML = `
      <div class="tim-save-section">
        <label class="tim-save-label">套餐名称</label>
        <input class="inp" id="timGroupName" value="${_esc(suggested)}" placeholder="给这组食物起个名字" />
      </div>
      <div class="tim-save-section">
        <label class="tim-save-label">分配到哪一餐？</label>
        <div class="tim-meal-btns">
          ${MEAL_KEYS.map(m => `
            <button class="tim-meal-pick" data-meal="${m}"
              onclick="TrackerImportModal._pickMeal('${m}',this)">
              ${_mealLabel(m)}
            </button>`).join('')}
        </div>
      </div>
      <p class="tim-hint" style="margin-top:6px">识别到 ${valid.length} 个食物，确认后保存为一个套餐</p>`;

    _pendingSave = valid;
    _pickedMeal  = 'breakfast';

    // Activate first meal button
    setTimeout(() => {
      const first = document.querySelector('.tim-meal-pick');
      if (first) first.classList.add('active');
    }, 0);

    const footer = document.querySelector('#trackerImportModal .modal-actions');
    if (footer) footer.innerHTML = `
      <button class="btn-secondary" onclick="TrackerImportModal._backToEdit()">← 返回编辑</button>
      <button class="btn-primary"   onclick="TrackerImportModal._doSave()">✅ 确认保存</button>`;
  }

  let _pendingSave = [];
  let _pickedMeal  = 'breakfast';

  function _pickMeal(meal, btn) {
    _pickedMeal = meal;
    document.querySelectorAll('.tim-meal-pick').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }

  function _backToEdit() {
    _pendingSave = [];
    _render();
    const footer = document.querySelector('#trackerImportModal .modal-actions');
    if (footer) footer.innerHTML = `
      <button class="btn-secondary" onclick="TrackerImportModal.close()" data-i18n="btn_cancel">取消</button>
      <button class="btn-primary" onclick="TrackerImportModal.saveAll()" data-i18n="btn_save_all">✅ 全部保存</button>`;
  }

  function _doSave() {
    const valid = _pendingSave;
    if (!valid.length) { close(); return; }
    const groupName = (document.getElementById('timGroupName')?.value || '').trim()
                      || valid.slice(0,3).map(x=>x.name.trim()).join('+');
    const groupId   = 'img_' + Date.now().toString(36);
    valid.forEach(item => {
      State.addLogEntry(_date, _pickedMeal, {
        name:      item.name.trim(),
        kcal:      item.kcal    || 0,
        protein:   item.protein || 0,
        carbs:     item.carbs   || 0,
        fat:       item.fat     || 0,
        grams:     item.grams   || 0,
        groupId,
        groupName,
      });
    });
    _pendingSave = [];
    close();
    Tracker.render();
    Charts.renderMacroRing();
    App.showToast(`✅ 已保存「${groupName}」→ ${_mealLabel(_pickedMeal)}`);
  }

  function close() {
    document.getElementById('trackerImportModal')?.classList.add('hidden');
    _items = [];
    _pendingSave = [];
  }

  return { show, saveAll, addEmpty, close, _upd, _del, _pickMeal, _backToEdit, _doSave };
})();
