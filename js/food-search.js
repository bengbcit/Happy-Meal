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
  let _groupNameInput  = '';   // user-typed group name
  let _editGroupId     = null; // set when editing existing group

  // pending recipe for duplicate-overwrite
  let _pendingRecipe   = null;
  let _pendingRecipeId = null;

  // ── i18n helpers ─────────────────────────────────────
  function _t(key, fallback) {
    try { return I18n.get(key) || fallback; } catch { return fallback; }
  }
  function _lang() {
    try { return I18n.current() || 'zh'; } catch { return 'zh'; }
  }
  function _mealLabel(m) {
    return {
      breakfast: _t('meal_breakfast', '早餐'),
      lunch:     _t('meal_lunch',     '午餐'),
      dinner:    _t('meal_dinner',    '晚餐'),
      snack:     _t('meal_snack',     '零食'),
    }[m] || m;
  }

  // ── UI strings (tri-lingual) ─────────────────────────
  function _ui(key) {
    const lang = _lang();
    const MAP = {
      search_placeholder: {
        zh: '输入食物名，如：鸡蛋、豆腐、鸡胸肉…',
        en: 'Enter food name, e.g. egg, tofu, chicken…',
        ja: '食物名を入力、例：卵、豆腐、鶏むね肉…',
      },
      search_btn:   { zh: '搜索', en: 'Search', ja: '検索' },
      search_hint:  { zh: 'AI 会分析常见烹饪方式供你选择', en: 'AI will suggest cooking variants', ja: 'AIが調理法の候補を提案します' },
      loading_variants: { zh: 'AI 分析中…', en: 'Analyzing…', ja: 'AI分析中…' },
      loading_pairings: { zh: '生成健康搭配中…', en: 'Generating pairings…', ja: '健康的な組み合わせを生成中…' },
      you_searched: { zh: '你输入的是', en: 'You searched for', ja: '入力した食物' },
      choose_method: { zh: '请选择具体做法：', en: 'Choose a cooking method:', ja: '調理法を選んでください：' },
      back_search:  { zh: '← 重新搜索', en: '← Back to search', ja: '← 再検索' },
      pairing_label: { zh: '的健康搭配推荐', en: 'healthy pairings', ja: 'の健康的な組み合わせ' },
      hint_edit:    { zh: '勾选要添加的食物，可编辑克重和营养数值', en: 'Check foods to add, you can edit weight and nutrition', ja: 'チェックした食物を追加。栄養値も編集できます' },
      add_manual:   { zh: '＋ 手动添加食物', en: '＋ Add food manually', ja: '＋ 手動で追加' },
      save_recipe:  { zh: '📖 保存到菜谱', en: '📖 Save to recipes', ja: '📖 レシピに保存' },
      add_tracker:  { zh: '✓ 添加到追踪', en: '✓ Add to log', ja: '✓ ログに追加' },
      need_one:     { zh: '请至少勾选一个食物', en: 'Please check at least one food', ja: '少なくとも1つ選んでください' },
      added_ok:     { zh: '已添加', en: 'Added', ja: '追加しました' },
      items_unit:   { zh: '个食物到', en: 'food(s) to', ja: '個の食物を' },
      saved_recipe: { zh: '已保存到菜谱：', en: 'Saved to recipes: ', ja: 'レシピに保存しました：' },
      dup_ask:      { zh: '已存在于菜谱库，要覆盖吗？', en: 'already exists. Overwrite?', ja: 'はすでに存在します。上書きしますか？' },
      cancel:       { zh: '取消', en: 'Cancel', ja: 'キャンセル' },
      overwrite:    { zh: '覆盖', en: 'Overwrite', ja: '上書き' },
      updated:      { zh: '菜谱已更新', en: 'Recipe updated', ja: 'レシピを更新しました' },
      modal_title:  { zh: '🔍 添加食物', en: '🔍 Add Food', ja: '🔍 食物を追加' },
      gram:         { zh: 'g', en: 'g', ja: 'g' },
      protein_lbl:  { zh: '蛋白g', en: 'prot.g', ja: 'たんぱくg' },
      carbs_lbl:    { zh: '碳水g', en: 'carbs g', ja: '炭水g' },
      fat_lbl:      { zh: '脂肪g', en: 'fat g', ja: '脂質g' },
      back_err:          { zh: '← 返回搜索', en: '← Back', ja: '← 戻る' },
      your_food:         { zh: '✅ 你选择的食物', en: '✅ Your selected food', ja: '✅ 選択した食物' },
      ai_pairings:       { zh: '🤖 AI 推荐搭配（含饮品）', en: '🤖 AI recommended pairings (incl. drink)', ja: '🤖 AIおすすめ組み合わせ（飲み物含む）' },
      group_name_label:  { zh: '套餐名称', en: 'Meal name', ja: 'セット名' },
      group_name_ph:     { zh: '如：煎蛋生菜肠（留空自动生成）', en: 'e.g. Eggs & Salad (auto if empty)', ja: '例：目玉焼きセット（空白で自動）' },
      edit_group:        { zh: '编辑套餐', en: 'Edit meal set', ja: 'セットを編集' },
    };
    const row = MAP[key];
    if (!row) return key;
    return row[lang] || row['zh'] || key;
  }

  // ── Public: open modal ───────────────────────────────
  function open(dateStr, meal) {
    _dateStr         = dateStr;
    _meal            = meal;
    _items           = [];
    _step            = 'search';
    _selectedVariant = '';
    _groupNameInput  = '';
    _editGroupId     = null;
    _pendingRecipe   = null;
    _pendingRecipeId = null;

    // Update modal title for current language
    const titleEl = document.getElementById('fsModalTitle');
    if (titleEl) titleEl.textContent = _ui('modal_title');

    _renderModal();
    document.getElementById('fsMaskOverlay')?.classList.remove('hidden');
    setTimeout(() => document.getElementById('fsSearchInput')?.focus(), 80);
  }

  function close() {
    document.getElementById('fsMaskOverlay')?.classList.add('hidden');
    _items           = [];
    _step            = 'search';
    _groupNameInput  = '';
    _editGroupId     = null;
    _pendingRecipe   = null;
    _pendingRecipeId = null;
  }

  // Open in edit mode — pre-fill items from existing group
  function openEdit(dateStr, meal, groupId, existingItems) {
    _dateStr         = dateStr;
    _meal            = meal;
    _step            = 'pairings';
    _editGroupId     = groupId;
    _selectedVariant = existingItems[0]?.groupName || existingItems[0]?.name || '';
    _groupNameInput  = existingItems[0]?.groupName || '';
    _pendingRecipe   = null;
    _pendingRecipeId = null;

    _items = existingItems.map(i => ({
      id:      _nextId++,
      name:    i.name    || '',
      grams:   i.grams   || 0,
      kcal:    i.kcal    || 0,
      protein: i.protein || 0,
      carbs:   i.carbs   || 0,
      fat:     i.fat     || 0,
      checked: true,
    }));

    const titleEl = document.getElementById('fsModalTitle');
    if (titleEl) titleEl.textContent = '✏️ ' + (_ui('edit_group') || '编辑套餐');
    _renderItemsTable();
    document.getElementById('fsMaskOverlay')?.classList.remove('hidden');
  }

  // ── Render modal body based on current step ──────────
  function _renderModal() {
    const body = document.getElementById('fsBody');
    if (!body) return;

    if (_step === 'search') {
      body.innerHTML = `
        <div class="fs-search-row">
          <input id="fsSearchInput" class="inp fs-input"
            placeholder="${_ui('search_placeholder')}"
            onkeydown="if(event.key==='Enter') FoodSearch._searchVariants()" />
          <button class="btn-primary fs-search-btn" onclick="FoodSearch._searchVariants()">
            ${_ui('search_btn')}
          </button>
        </div>
        <p class="fs-hint">${_ui('search_hint')}</p>`;
    }

    if (_step === 'variants') {
      body.innerHTML = `<div class="fs-loading"><span class="loading-spin"></span> ${_ui('loading_variants')}</div>`;
    }

    if (_step === 'pairings') {
      body.innerHTML = `<div class="fs-loading"><span class="loading-spin"></span> ${_ui('loading_pairings')}</div>`;
    }
  }

  // ── Step 1: fetch variants ───────────────────────────
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
        body: JSON.stringify({ mode: 'variants', food, lang: _lang() }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.variants) throw new Error(data.error || 'Request failed');
      _renderVariants(food, data.variants);
    } catch (e) {
      _showError(e.message);
    }
  }

  function _renderVariants(originalFood, variants) {
    const body = document.getElementById('fsBody');
    if (!body) return;
    const allOptions = variants.includes(originalFood) ? variants : [originalFood, ...variants];
    body.innerHTML = `
      <p class="fs-hint">「${originalFood}」— ${_ui('choose_method')}</p>
      <div class="fs-variants" id="fsVariantsList">
        ${allOptions.map(v => `
          <button class="fs-variant-btn" data-variant="${_esc(v)}">${v}</button>`
        ).join('')}
      </div>
      <button class="fs-back-btn" onclick="FoodSearch._backToSearch()">${_ui('back_search')}</button>`;

    // 用事件委托绑定点击，避免 onclick 属性的引号冲突
    document.getElementById('fsVariantsList')?.addEventListener('click', e => {
      const btn = e.target.closest('[data-variant]');
      if (btn) _selectVariant(btn.dataset.variant);
    });
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
        body: JSON.stringify({ mode: 'pairings', food: variant, lang: _lang() }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Request failed');
      _renderPairings(data.selected, data.pairings || []);
    } catch (e) {
      _showError(e.message);
    }
  }

  function _renderPairings(selected, pairings) {
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

    // 第一项是选中的食物本身，其余是搭配建议
    const [mainItem, ...pairingItems] = _items;

    const mainHTML = mainItem ? `
      <div class="fs-section-label">${_ui('your_food')}</div>
      <div class="fs-items-list" id="fsMainItem">
        ${_itemRowHTML(mainItem)}
      </div>` : '';

    const pairingsHTML = pairingItems.length ? `
      <div class="fs-section-label">${_ui('ai_pairings')}</div>
      <div class="fs-items-list" id="fsItemsList">
        ${pairingItems.map(item => _itemRowHTML(item)).join('')}
      </div>` : '';

    const defaultName = _groupNameInput ||
      (_selectedVariant ? _selectedVariant : '');

    body.innerHTML = `
      <div class="fs-pairings-header">
        <span class="fs-selected-label">「${_selectedVariant}」</span>
        <span class="fs-meal-badge">${_mealLabel(_meal)}</span>
      </div>
      <div class="fs-group-name-row">
        <label class="fs-group-name-label">${_ui('group_name_label')}</label>
        <input class="inp fs-group-name-inp" id="fsGroupNameInp"
          placeholder="${_ui('group_name_ph')}"
          value="${_esc(defaultName)}"
          oninput="FoodSearch._setGroupName(this.value)" />
      </div>
      ${mainHTML}
      ${pairingsHTML}
      <button class="fs-add-row-btn" onclick="FoodSearch._addEmptyRow()">${_ui('add_manual')}</button>
      <div class="fs-actions">
        <button class="btn-secondary" onclick="FoodSearch._backToSearch()">${_ui('back_search')}</button>
        <div class="fs-actions-right">
          <button class="btn-secondary" onclick="FoodSearch._saveToRecipe()">${_ui('save_recipe')}</button>
          <button class="btn-primary" onclick="FoodSearch._confirmAdd()">${_ui('add_tracker')}</button>
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
          <input class="inp fs-name-inp" value="${_esc(item.name)}" placeholder="—"
            onchange="FoodSearch._upd(${item.id},'name',this.value)" />
          <div class="fs-nums-row">
            <label class="fs-num-label">
              <input class="inp fs-num-inp" type="number" min="0" value="${item.grams}"
                onchange="FoodSearch._upd(${item.id},'grams',this.value)" />
              <span>${_ui('gram')}</span>
            </label>
            <label class="fs-num-label">
              <input class="inp fs-num-inp" type="number" min="0" value="${item.kcal}"
                onchange="FoodSearch._upd(${item.id},'kcal',this.value)" />
              <span>kcal</span>
            </label>
            <label class="fs-num-label">
              <input class="inp fs-num-inp" type="number" min="0" value="${item.protein}"
                onchange="FoodSearch._upd(${item.id},'protein',this.value)" />
              <span>${_ui('protein_lbl')}</span>
            </label>
            <label class="fs-num-label">
              <input class="inp fs-num-inp" type="number" min="0" value="${item.carbs}"
                onchange="FoodSearch._upd(${item.id},'carbs',this.value)" />
              <span>${_ui('carbs_lbl')}</span>
            </label>
            <label class="fs-num-label">
              <input class="inp fs-num-inp" type="number" min="0" value="${item.fat}"
                onchange="FoodSearch._upd(${item.id},'fat',this.value)" />
              <span>${_ui('fat_lbl')}</span>
            </label>
          </div>
        </div>
        <button class="row-del-btn" onclick="FoodSearch._delRow(${item.id})">−</button>
      </div>`;
  }

  // ── Item helpers ─────────────────────────────────────
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
    // 优先插到搭配列表，没有则插到主食物列表后
    const list = document.getElementById('fsItemsList') || document.getElementById('fsMainItem');
    if (list) {
      list.insertAdjacentHTML('beforeend', _itemRowHTML(newItem));
      document.querySelector(`#fsRow-${newItem.id} .fs-name-inp`)?.focus();
    }
  }

  // ── Add to tracker ───────────────────────────────────
  function _confirmAdd() {
    const valid = _items.filter(x => x.checked && (x.name || '').trim());
    if (!valid.length) { App.showToast(_ui('need_one')); return; }

    // Build a group name from selected items (max 3 names joined)
    const groupName = _groupNameInput
      ? _groupNameInput.trim()
      : valid.slice(0, 3).map(x => x.name.trim()).join('+');
    const groupId = _editGroupId || ('g' + Date.now().toString(36));

    // If editing existing group: remove old entries first
    if (_editGroupId) {
      const log = State.getLog(_dateStr);
      const kept = (log.meals[_meal] || []).filter(i => i.groupId !== _editGroupId);
      log.meals[_meal] = kept;
      State._save && State._save();
    }

    valid.forEach(item => {
      State.addLogEntry(_dateStr, _meal, {
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
    close();
    Tracker.render();
    Charts.renderMacroRing();
    App.showToast(`✅ ${_ui('added_ok')} 「${groupName}」→ ${_mealLabel(_meal)}`);
  }

  // ── Save to recipe library ───────────────────────────
  function _saveToRecipe() {
    const valid = _items.filter(x => x.checked && (x.name || '').trim());
    if (!valid.length) { App.showToast(_ui('need_one')); return; }

    const recipeName   = valid.length === 1
      ? valid[0].name.trim()
      : `${_selectedVariant || valid[0].name} ${_lang() === 'ja' ? 'セット' : _lang() === 'en' ? 'Set' : '套餐'}`;
    const totalKcal    = valid.reduce((s, x) => s + (x.kcal    || 0), 0);
    const totalProtein = valid.reduce((s, x) => s + (x.protein || 0), 0);
    const totalCarbs   = valid.reduce((s, x) => s + (x.carbs   || 0), 0);
    const totalFat     = valid.reduce((s, x) => s + (x.fat     || 0), 0);
    const ingredients  = valid.map(x => `${x.name} ${x.grams || 0}g`);
    const newRecipe    = {
      name: recipeName,
      kcal: Math.round(totalKcal), protein: Math.round(totalProtein),
      carbs: Math.round(totalCarbs), fat: Math.round(totalFat),
      ingredients, tags: [],
    };

    const existing = State.getRecipes().find(
      r => r.name.trim().toLowerCase() === recipeName.trim().toLowerCase()
    );

    if (existing) {
      _showDuplicateConfirm(recipeName, existing, newRecipe);
    } else {
      _doSaveRecipe(newRecipe);
    }
  }

  function _showDuplicateConfirm(name, existing, newRecipe) {
    // Remove any existing banner first
    document.getElementById('fsDupBanner')?.remove();
    _pendingRecipe   = newRecipe;
    _pendingRecipeId = existing.id;

    const banner = document.createElement('div');
    banner.className = 'fs-dup-banner';
    banner.id = 'fsDupBanner';
    banner.innerHTML = `
      <span class="fs-dup-text">「${name}」${_ui('dup_ask')}</span>
      <div class="fs-dup-btns">
        <button class="btn-secondary" onclick="document.getElementById('fsDupBanner').remove()">${_ui('cancel')}</button>
        <button class="btn-primary" onclick="FoodSearch._overwriteRecipe()">${_ui('overwrite')}</button>
      </div>`;
    document.getElementById('fsBody')?.insertAdjacentElement('afterbegin', banner);
  }

  function _overwriteRecipe() {
    if (!_pendingRecipe || !_pendingRecipeId) return;
    State.updateRecipe(_pendingRecipeId, _pendingRecipe);
    document.getElementById('fsDupBanner')?.remove();
    App.showToast(`✅ 「${_pendingRecipe.name}」${_ui('updated')}`);
    if (typeof Recipes !== 'undefined') Recipes.render();
    _pendingRecipe   = null;
    _pendingRecipeId = null;
  }

  function _doSaveRecipe(recipe) {
    State.addRecipe(recipe);
    App.showToast(`📖 ${_ui('saved_recipe')}${recipe.name}`);
    if (typeof Recipes !== 'undefined') Recipes.render();
  }

  // ── Navigation ───────────────────────────────────────
  function _setGroupName(val) { _groupNameInput = val; }

  function _backToSearch() {
    _step = 'search';
    _items = [];
    _selectedVariant = '';
    _renderModal();
    setTimeout(() => document.getElementById('fsSearchInput')?.focus(), 80);
  }

  function _showError(msg) {
    const body = document.getElementById('fsBody');
    if (body) body.innerHTML = `
      <p class="fs-error">${msg}</p>
      <button class="fs-back-btn" onclick="FoodSearch._backToSearch()">${_ui('back_err')}</button>`;
  }

  function _esc(s) { return (s || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }

  return {
    open, close, openEdit,
    _searchVariants, _selectVariant,
    _toggleCheck, _upd, _delRow, _addEmptyRow,
    _confirmAdd, _saveToRecipe, _overwriteRecipe,
    _backToSearch, _setGroupName,
  };
})();
