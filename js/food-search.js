// food-search.js — Smart food search modal for Tracker
// AI-powered: variant suggestions → healthy pairings → nutrition edit → save to log / recipe
// AI搭載：変体提案 → 健康的ペアリング → 栄養編集 → ログ/レシピ保存
// AI 驱动：变体建议 → 健康搭配 → 营养编辑 → 保存到追踪/菜谱

const FoodSearch = (() => {
  let _dateStr  = null;
  let _meal     = null;
  let _nextId   = 0;
  let _items    = [];   // [{id, name, grams, kcal, protein, carbs, fat, checked}]
  let _step     = 'search'; // 'search' | 'variants' | 'pairings'
  let _selectedVariant = '';

  const MEAL_KEYS = ['breakfast', 'lunch', 'dinner', 'snack'];

  // ── Public: open modal ───────────────────────────────
  function open(dateStr, meal) {
    _dateStr = dateStr;
    _meal    = meal;
    _items   = [];
    _step    = 'search';
    _selectedVariant = '';
    _renderModal();
    document.getElementById('fsMaskOverlay')?.classList.remove('hidden');
    setTimeout(() => document.getElementById('fsSearchInput')?.focus(), 80);
  }

  function close() {
    document.getElementById('fsMaskOverlay')?.classList.add('hidden');
    _items = [];
    _step  = 'search';
  }

  // ── Render the full modal content based on current step ─────────────────────
  function _renderModal() {
    const body = document.getElementById('fsBody');
    if (!body) return;

    if (_step === 'search') {
      body.innerHTML = `
        <div class="fs-search-row">
          <input id="fsSearchInput" class="inp fs-input" placeholder="输入食物名，如：鸡蛋、豆腐、鸡胸肉…"
            onkeydown="if(event.key==='Enter') FoodSearch._searchVariants()" />
          <button class="btn-primary fs-search-btn" onclick="FoodSearch._searchVariants()">
            <span id="fsSearchBtnTxt">搜索</span>
          </button>
        </div>
        <p class="fs-hint">AI 会分析常见烹饪方式供你选择</p>`;
    }

    if (_step === 'variants') {
      body.innerHTML = `<div class="fs-loading"><span class="loading-spin"></span> AI 分析中…</div>`;
    }

    if (_step === 'pairings') {
      body.innerHTML = `<div class="fs-loading"><span class="loading-spin"></span> 生成健康搭配中…</div>`;
    }
  }

  // ── Step 1: search variants ──────────────────────────
  async function _searchVariants() {
    const input = document.getElementById('fsSearchInput');
    const food  = input?.value?.trim();
    if (!food) return;

    _step = 'variants';
    _renderModal();

    try {
      const resp = await fetch('/api/suggest-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'variants', food, lang: I18n.current?.() || 'zh' }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.variants) throw new Error(data.error || '请求失败');
      _renderVariants(food, data.variants);
    } catch (e) {
      _showError(`变体搜索失败：${e.message}`);
    }
  }

  function _renderVariants(originalFood, variants) {
    const body = document.getElementById('fsBody');
    if (!body) return;

    // Include the original input as first option if not already there
    const allOptions = variants.includes(originalFood)
      ? variants
      : [originalFood, ...variants];

    body.innerHTML = `
      <p class="fs-hint">你输入的是「${originalFood}」，请选择具体做法：</p>
      <div class="fs-variants">
        ${allOptions.map(v => `
          <button class="fs-variant-btn" onclick="FoodSearch._selectVariant('${_esc(v)}')">
            ${v}
          </button>`).join('')}
      </div>
      <button class="fs-back-btn" onclick="FoodSearch._backToSearch()">← 重新搜索</button>`;
  }

  // ── Step 2: select variant → fetch pairings ──────────
  async function _selectVariant(variant) {
    _selectedVariant = variant;
    _step = 'pairings';
    _renderModal();

    try {
      const resp = await fetch('/api/suggest-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'pairings', food: variant, lang: I18n.current?.() || 'zh' }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || '请求失败');
      _renderPairings(data.selected, data.pairings || []);
    } catch (e) {
      _showError(`搭配推荐失败：${e.message}`);
    }
  }

  function _renderPairings(selected, pairings) {
    // Build items list: selected food first, then pairings — all checked by default
    _items = [];
    const allFoods = selected ? [selected, ...pairings] : pairings;
    allFoods.forEach(f => {
      _items.push({
        id:      _nextId++,
        name:    f.name    || '',
        grams:   f.grams   || 0,
        kcal:    f.kcal    || 0,
        protein: f.protein || 0,
        carbs:   f.carbs   || 0,
        fat:     f.fat     || 0,
        checked: true,
      });
    });

    _renderItemsTable();
  }

  function _renderItemsTable() {
    const body = document.getElementById('fsBody');
    if (!body) return;

    const mealLabel = {
      breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '零食'
    }[_meal] || _meal;

    body.innerHTML = `
      <div class="fs-pairings-header">
        <span class="fs-selected-label">「${_selectedVariant}」的健康搭配推荐</span>
        <span class="fs-meal-badge">${mealLabel}</span>
      </div>
      <p class="fs-hint">勾选要添加的食物，可编辑克重和营养数值</p>

      <div class="fs-items-list" id="fsItemsList">
        ${_items.map(item => _itemRowHTML(item)).join('')}
      </div>

      <button class="fs-add-row-btn" onclick="FoodSearch._addEmptyRow()">＋ 手动添加食物</button>

      <div class="fs-actions">
        <button class="btn-secondary" onclick="FoodSearch._backToSearch()">← 重新搜索</button>
        <div class="fs-actions-right">
          <button class="btn-secondary" onclick="FoodSearch._saveToRecipe()">📖 保存到菜谱</button>
          <button class="btn-primary" onclick="FoodSearch._confirmAdd()">✓ 添加到追踪</button>
        </div>
      </div>`;
  }

  function _itemRowHTML(item) {
    return `
      <div class="fs-item-row" id="fsRow-${item.id}">
        <label class="fs-check-wrap">
          <input type="checkbox" class="fs-checkbox" ${item.checked ? 'checked' : ''}
            onchange="FoodSearch._toggleCheck(${item.id}, this.checked)" />
        </label>
        <div class="fs-item-fields">
          <input class="inp fs-name-inp" value="${_esc(item.name)}" placeholder="食物名"
            onchange="FoodSearch._upd(${item.id},'name',this.value)" />
          <div class="fs-nums-row">
            <label class="fs-num-label">
              <input class="inp fs-num-inp" type="number" min="0" value="${item.grams}"
                onchange="FoodSearch._upd(${item.id},'grams',this.value)" />
              <span>g</span>
            </label>
            <label class="fs-num-label">
              <input class="inp fs-num-inp" type="number" min="0" value="${item.kcal}"
                onchange="FoodSearch._upd(${item.id},'kcal',this.value)" />
              <span>kcal</span>
            </label>
            <label class="fs-num-label">
              <input class="inp fs-num-inp" type="number" min="0" value="${item.protein}"
                onchange="FoodSearch._upd(${item.id},'protein',this.value)" />
              <span>蛋白g</span>
            </label>
            <label class="fs-num-label">
              <input class="inp fs-num-inp" type="number" min="0" value="${item.carbs}"
                onchange="FoodSearch._upd(${item.id},'carbs',this.value)" />
              <span>碳水g</span>
            </label>
            <label class="fs-num-label">
              <input class="inp fs-num-inp" type="number" min="0" value="${item.fat}"
                onchange="FoodSearch._upd(${item.id},'fat',this.value)" />
              <span>脂肪g</span>
            </label>
          </div>
        </div>
        <button class="row-del-btn" onclick="FoodSearch._delRow(${item.id})">−</button>
      </div>`;
  }

  // ── Item editing helpers ─────────────────────────────
  function _toggleCheck(id, checked) {
    const item = _items.find(x => x.id === id);
    if (item) item.checked = checked;
  }

  function _upd(id, field, val) {
    const item = _items.find(x => x.id === id);
    if (!item) return;
    if (['grams','kcal','protein','carbs','fat'].includes(field)) {
      item[field] = parseFloat(val) || 0;
    } else {
      item[field] = val;
    }
  }

  function _delRow(id) {
    _items = _items.filter(x => x.id !== id);
    document.getElementById(`fsRow-${id}`)?.remove();
  }

  function _addEmptyRow() {
    const newItem = { id: _nextId++, name: '', grams: 0, kcal: 0, protein: 0, carbs: 0, fat: 0, checked: true };
    _items.push(newItem);
    const list = document.getElementById('fsItemsList');
    if (list) {
      list.insertAdjacentHTML('beforeend', _itemRowHTML(newItem));
      list.querySelector(`#fsRow-${newItem.id} .fs-name-inp`)?.focus();
    }
  }

  // ── Confirm: add checked items to tracker log ────────
  function _confirmAdd() {
    const valid = _items.filter(x => x.checked && (x.name || '').trim());
    if (!valid.length) {
      App.showToast('请至少勾选一个食物');
      return;
    }
    valid.forEach(item => {
      State.addLogEntry(_dateStr, _meal, {
        name:    item.name.trim(),
        kcal:    item.kcal    || 0,
        protein: item.protein || 0,
        carbs:   item.carbs   || 0,
        fat:     item.fat     || 0,
        grams:   item.grams   || 0,
      });
    });
    close();
    Tracker.render();
    Charts.renderMacroRing();
    App.showToast(`✅ 已添加 ${valid.length} 个食物到${_mealLabel(_meal)}`);
  }

  // ── Save checked items to recipe library ────────────
  function _saveToRecipe() {
    const valid = _items.filter(x => x.checked && (x.name || '').trim());
    if (!valid.length) {
      App.showToast('请至少勾选一个食物');
      return;
    }

    // Build a combined recipe from selected items
    const recipeName = valid.length === 1
      ? valid[0].name.trim()
      : `${_selectedVariant || valid[0].name} 套餐`;

    const totalKcal    = valid.reduce((s, x) => s + (x.kcal    || 0), 0);
    const totalProtein = valid.reduce((s, x) => s + (x.protein || 0), 0);
    const totalCarbs   = valid.reduce((s, x) => s + (x.carbs   || 0), 0);
    const totalFat     = valid.reduce((s, x) => s + (x.fat     || 0), 0);
    const ingredients  = valid.map(x => `${x.name} ${x.grams || 0}g`);

    // Check for duplicate name
    const existing = State.getRecipes().find(
      r => r.name.trim().toLowerCase() === recipeName.trim().toLowerCase()
    );

    if (existing) {
      // Show inline confirmation instead of using confirm()
      _showDuplicateConfirm(recipeName, existing, {
        name: recipeName, kcal: Math.round(totalKcal),
        protein: Math.round(totalProtein), carbs: Math.round(totalCarbs),
        fat: Math.round(totalFat), ingredients, tags: [],
      });
      return;
    }

    _doSaveRecipe({
      name: recipeName, kcal: Math.round(totalKcal),
      protein: Math.round(totalProtein), carbs: Math.round(totalCarbs),
      fat: Math.round(totalFat), ingredients, tags: [],
    });
  }

  function _showDuplicateConfirm(name, existing, newRecipe) {
    const body = document.getElementById('fsBody');
    // Inject confirmation banner at top without wiping items
    const banner = document.createElement('div');
    banner.className = 'fs-dup-banner';
    banner.id = 'fsDupBanner';
    banner.innerHTML = `
      <span class="fs-dup-text">「${name}」已存在于菜谱库，要覆盖吗？</span>
      <div class="fs-dup-btns">
        <button class="btn-secondary fs-dup-cancel" onclick="document.getElementById('fsDupBanner').remove()">取消</button>
        <button class="btn-primary fs-dup-ok" onclick="FoodSearch._overwriteRecipe('${existing.id}')">覆盖</button>
      </div>`;
    body.insertAdjacentElement('afterbegin', banner);
    // Store pending recipe for overwrite
    FoodSearch._pendingRecipe = newRecipe;
    FoodSearch._pendingRecipeId = existing.id;
  }

  function _overwriteRecipe(existingId) {
    if (!FoodSearch._pendingRecipe) return;
    State.updateRecipe(existingId, FoodSearch._pendingRecipe);
    document.getElementById('fsDupBanner')?.remove();
    App.showToast(`✅ 菜谱「${FoodSearch._pendingRecipe.name}」已更新`);
    if (typeof Recipes !== 'undefined') Recipes.render();
    FoodSearch._pendingRecipe   = null;
    FoodSearch._pendingRecipeId = null;
  }

  function _doSaveRecipe(recipe) {
    State.addRecipe(recipe);
    App.showToast(`📖 已保存到菜谱：${recipe.name}`);
    if (typeof Recipes !== 'undefined') Recipes.render();
  }

  // ── Navigation helpers ───────────────────────────────
  function _backToSearch() {
    _step  = 'search';
    _items = [];
    _selectedVariant = '';
    _renderModal();
    setTimeout(() => document.getElementById('fsSearchInput')?.focus(), 80);
  }

  function _showError(msg) {
    const body = document.getElementById('fsBody');
    if (body) body.innerHTML = `
      <p class="fs-error">${msg}</p>
      <button class="fs-back-btn" onclick="FoodSearch._backToSearch()">← 返回搜索</button>`;
  }

  // ── Utilities ────────────────────────────────────────
  function _esc(s) { return (s || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }

  function _mealLabel(m) {
    return { breakfast:'早餐', lunch:'午餐', dinner:'晚餐', snack:'零食' }[m] || m;
  }

  // Public references needed for inline handlers
  FoodSearch._pendingRecipe   = null;
  FoodSearch._pendingRecipeId = null;

  return {
    open, close,
    _searchVariants, _selectVariant,
    _toggleCheck, _upd, _delRow, _addEmptyRow,
    _confirmAdd, _saveToRecipe, _overwriteRecipe,
    _backToSearch,
    // expose pending recipe slots
    _pendingRecipe:   null,
    _pendingRecipeId: null,
  };
})();
