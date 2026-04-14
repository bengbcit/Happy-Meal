// recipes.js — Recipe CRUD, filtering, rendering
// レシピのCRUD・フィルタリング・レンダリング / 菜谱的增删改查、筛选、渲染

const Recipes = (() => {
  let _currentFilter = 'all';

  // ── Render recipe grid ───────────────────────────────
  // レシピグリッドをレンダリング / 渲染菜谱卡片网格
  function render() {
    const el = document.getElementById('recipeList');
    if (!el) return;

    let list = State.getRecipes();
    if (_currentFilter !== 'all') {
      list = list.filter(r => (r.tags || []).includes(_currentFilter));
    }

    if (list.length === 0) {
      el.innerHTML = `<p class="placeholder-text" style="grid-column:1/-1">${I18n.get('no_recipes')}</p>`;
      return;
    }

    el.innerHTML = list.map(r => _cardHTML(r)).join('');
  }

  function _cardHTML(r) {
    const tags = (r.tags || []).map(t => `<span class="recipe-card-tag">${_tagLabel(t)}</span>`).join('');
    return `
      <div class="recipe-card" onclick="RecipeModal.open('${r.id}')">
        <div class="recipe-card-name">${r.name}</div>
        <div class="recipe-card-tags">${tags}</div>
        <div class="recipe-card-kcal">${r.kcal || '—'} ${I18n.get('kcal')}</div>
        <div class="recipe-card-macro">
          🥩${r.protein || 0}g &nbsp; 🍚${r.carbs || 0}g &nbsp; 🧈${r.fat || 0}g
        </div>
      </div>`;
  }

  function _tagLabel(tag) {
    const map = {
      'high-protein': '🥩 高蛋白', 'low-fat': '🥗 低脂',
      'low-carb': '🥦 低碳', 'high-carb': '🍚 高碳', 'vegetarian': '🌿 素食'
    };
    return map[tag] || tag;
  }

  // ── Filter ───────────────────────────────────────────
  function filter(tag) {
    _currentFilter = tag;
    // Update pill active states
    // ピルのアクティブ状態を更新 / 更新筛选按钮状态
    document.querySelectorAll('.filter-bar .pill').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === tag);
    });
    render();
  }

  return { render, filter };
})();

// ── RecipeAdd — handles URL + manual input form ──────
// レシピ追加フォーム / 菜谱添加表单
const RecipeAdd = (() => {
  let _selectedTags = [];

  function showTab(tab) {
    ['url', 'manual'].forEach(t => {
      document.getElementById(`addTab-${t}`)?.classList.toggle('active', t === tab);
      document.getElementById(`addPanel-${t}`)?.classList.toggle('hidden', t !== tab);
    });
  }

  function toggleTag(btn) {
    const tag = btn.dataset.tag;
    if (_selectedTags.includes(tag)) {
      _selectedTags = _selectedTags.filter(t => t !== tag);
      btn.classList.remove('selected');
    } else {
      _selectedTags.push(tag);
      btn.classList.add('selected');
    }
  }

  function save() {
    const name = document.getElementById('rName')?.value.trim();
    if (!name) { alert('请输入菜名'); return; }

    const recipe = {
      name,
      kcal:     parseFloat(document.getElementById('rKcal')?.value) || 0,
      protein:  parseFloat(document.getElementById('rProtein')?.value) || 0,
      carbs:    parseFloat(document.getElementById('rCarbs')?.value) || 0,
      fat:      parseFloat(document.getElementById('rFat')?.value) || 0,
      ingredients: (document.getElementById('rIngredients')?.value || '').split('\n').filter(Boolean),
      steps:       (document.getElementById('rSteps')?.value || '').split('\n').filter(Boolean),
      tags: [..._selectedTags],
      source: 'manual',
    };

    State.addRecipe(recipe);
    _clearForm();
    Recipes.render();
    App.showToast(I18n.get('saved_ok'));
    BMI.renderRecommend && BMI.renderRecommend(
      State.get().user.weight / ((State.get().user.height / 100) ** 2) || 22
    );
  }

  function _clearForm() {
    ['rName','rKcal','rProtein','rCarbs','rFat','rIngredients','rSteps'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    _selectedTags = [];
    document.querySelectorAll('#tagSelect .tag').forEach(b => b.classList.remove('selected'));
  }

  // Called by Parser after successful URL parse
  // URLパース成功後にパーサーから呼び出される / URL 解析成功后由 Parser 调用
  function saveFromParsed(recipe) {
    State.addRecipe(recipe);
    Recipes.render();
    App.showToast(I18n.get('saved_ok'));
  }

  return { showTab, toggleTag, save, saveFromParsed };
})();

// ── RecipeModal — full recipe detail ─────────────────
// レシピ詳細モーダル / 菜谱详情弹窗
const RecipeModal = (() => {
  let _currentId = null;

  function open(id) {
    const r = State.getRecipes().find(x => x.id === id);
    if (!r) return;
    _currentId = id;

    const tags = (r.tags || []).map(t => `<span class="recipe-card-tag">${_tagLabel(t)}</span>`).join('');
    const ingredients = (r.ingredients || []).map(i => `<li>${i}</li>`).join('');
    const steps = (r.steps || []).map((s, i) => `<li>${s}</li>`).join('');

    document.getElementById('recipeModalContent').innerHTML = `
      <div class="recipe-detail-name">${r.name}</div>
      <div class="recipe-detail-tags">${tags}</div>
      <div class="macro-chips">
        <span class="macro-chip kcal">🔥 ${r.kcal || '—'} ${I18n.get('kcal')}</span>
        <span class="macro-chip protein">🥩 ${r.protein || 0}g ${I18n.get('protein_lbl')}</span>
        <span class="macro-chip carb">🍚 ${r.carbs || 0}g ${I18n.get('carb_lbl')}</span>
        <span class="macro-chip fat">🧈 ${r.fat || 0}g ${I18n.get('fat_lbl')}</span>
      </div>
      ${ingredients ? `<div class="recipe-detail-section">
        <h4>${I18n.get('ingredients_lbl')}</h4>
        <ul>${ingredients}</ul>
      </div>` : ''}
      ${steps ? `<div class="recipe-detail-section">
        <h4>${I18n.get('steps_lbl')}</h4>
        <ol>${steps}</ol>
      </div>` : ''}
      ${r.sourceUrl ? `<p class="text-muted mt-8">🔗 <a href="${r.sourceUrl}" target="_blank">来源链接</a></p>` : ''}
      <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
        <button class="add-to-meal-btn" onclick="Tracker.addFromRecipe('${id}');RecipeModal.close()">
          ${I18n.get('add_to_meal')}
        </button>
        <button class="btn-small" style="color:#e74c3c;background:#fdecea"
          onclick="if(confirm('${I18n.get('delete_confirm')}'))RecipeModal.delete()">🗑 删除</button>
      </div>`;

    document.getElementById('recipeModal').classList.remove('hidden');
  }

  function close() {
    document.getElementById('recipeModal').classList.add('hidden');
    _currentId = null;
  }

  function _delete() {
    if (!_currentId) return;
    State.deleteRecipe(_currentId);
    Recipes.render();
    close();
  }

  function _tagLabel(tag) {
    const map = {
      'high-protein':'🥩 高蛋白','low-fat':'🥗 低脂',
      'low-carb':'🥦 低碳','high-carb':'🍚 高碳','vegetarian':'🌿 素食'
    };
    return map[tag] || tag;
  }

  // Expose delete as method
  RecipeModal_delete = _delete;

  return { open, close, delete: _delete };
})();
