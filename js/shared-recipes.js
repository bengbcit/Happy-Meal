// shared-recipes.js — Shared Recipe Library: publish, browse, import
// 共有レシピライブラリ / 共享菜谱库

const SharedRecipes = (() => {
  let _currentFilter = 'all';
  let _cache = [];
  let _loading = false;

  function _db()  { return window.FirebaseCore?.db; }
  function _uid() { return window.FirebaseCore?.auth?.currentUser?.uid; }
  function _currentUser() { return window.FirebaseCore?.auth?.currentUser; }
  function _isOnline() { return navigator.onLine && !!_db(); }

  // ── Tag label map (reuse same labels as Recipes) ─────
  function _tagLabel(tag) {
    const map = {
      'high-protein':'🥩 高蛋白','low-fat':'🥗 低脂','low-carb':'🥦 低碳',
      'high-carb':'🍚 高碳','vegetarian':'🌿 素食','kids-favorite':'😋 孩子喜爱','adults-only':'🧑 仅大人'
    };
    return map[tag] || tag;
  }

  function _fmtDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const m = d.getMonth() + 1;
    const day = d.getDate();
    return `${d.getFullYear()}-${m < 10 ? '0' + m : m}-${day < 10 ? '0' + day : day}`;
  }

  // ── Firestore: load shared recipes ────────────────────
  async function load() {
    if (!_isOnline()) {
      const offlineEl = document.getElementById('sharedOffline');
      if (offlineEl) offlineEl.classList.remove('hidden');
      const grid = document.getElementById('sharedRecipeList');
      if (grid) grid.innerHTML = '';
      return;
    }
    _loading = true;
    const loadingEl = document.getElementById('sharedLoading');
    if (loadingEl) loadingEl.classList.remove('hidden');
    const offlineEl = document.getElementById('sharedOffline');
    if (offlineEl) offlineEl.classList.add('hidden');

    try {
      const { getDocs, collection, query, orderBy, limit } = window.FirebaseCore;
      const q = query(collection(_db(), 'shared_recipes'), orderBy('sharedAt', 'desc'), limit(50));
      const snap = await getDocs(q);
      _cache = [];
      snap.forEach(doc => {
        _cache.push({ id: doc.id, ...doc.data() });
      });
    } catch (e) {
      console.warn('[SharedRecipes] load failed:', e.message);
      const offlineEl2 = document.getElementById('sharedOffline');
      if (offlineEl2) offlineEl2.classList.remove('hidden');
    }
    _loading = false;
    if (loadingEl) loadingEl.classList.add('hidden');
    render();
  }

  // ── Firestore: publish a recipe ────────────────────────
  async function publish(recipe) {
    if (!_isOnline()) {
      App.showToast(I18n.get('share_error_offline'), 'warning');
      return;
    }
    const user = _currentUser();
    if (!user) {
      App.showToast(I18n.get('login_required_shared'), 'warning');
      return;
    }

    // Check for duplicate
    const existing = _cache.find(s => s.recipe.id === recipe.id && s.sharedBy.uid === user.uid);
    if (existing) {
      App.showToast(I18n.get('share_error_dup'), 'warning');
      return;
    }

    try {
      const { addDoc, collection } = window.FirebaseCore;
      const doc = {
        recipe: {
          id: recipe.id,
          name: recipe.name,
          kcal: recipe.kcal || 0,
          protein: recipe.protein || 0,
          carbs: recipe.carbs || 0,
          fat: recipe.fat || 0,
          ingredients: [...(recipe.ingredients || [])],
          steps: [...(recipe.steps || [])],
          tags: [...(recipe.tags || [])],
          source: recipe.source || 'manual',
          sourceUrl: recipe.sourceUrl || '',
        },
        sharedBy: {
          uid: user.uid,
          displayName: user.displayName || '',
          email: user.email || '',
        },
        sharedAt: new Date().toISOString(),
        importCount: 0,
        tags: [...(recipe.tags || [])],
        kcal: recipe.kcal || 0,
      };
      await addDoc(collection(_db(), 'shared_recipes'), doc);
      App.showToast(I18n.get('shared_library') + ' ✅');
      // Reload the cache so the newly published recipe appears
      await load();
    } catch (e) {
      console.warn('[SharedRecipes] publish failed:', e.message);
      App.showToast('❌ ' + e.message, 'warning');
    }
  }

  // ── Firestore: unpublish a recipe ──────────────────────
  async function unpublish(sharedId) {
    if (!_isOnline()) {
      App.showToast(I18n.get('share_error_offline'), 'warning');
      return;
    }
    try {
      const { deleteDoc, doc } = window.FirebaseCore;
      await deleteDoc(doc(_db(), 'shared_recipes', sharedId));
      _cache = _cache.filter(s => s.id !== sharedId);
      render();
      App.showToast(I18n.get('deleted_ok'));
    } catch (e) {
      console.warn('[SharedRecipes] unpublish failed:', e.message);
      App.showToast('❌ 取消分享失败: ' + e.message, 'warning');
    }
  }

  // ── Firestore: import a recipe to personal collection ──
  async function importRecipe(sharedId) {
    if (!_isOnline()) {
      App.showToast(I18n.get('share_error_offline'), 'warning');
      return;
    }
    const shared = _cache.find(s => s.id === sharedId);
    if (!shared) return;

    // Don't import own recipe
    const user = _currentUser();
    if (user && shared.sharedBy.uid === user.uid) {
      App.showToast('这是你自己的菜谱，无需导入', 'warning');
      return;
    }

    // Check if already in personal collection (by name)
    const existing = State.getRecipes().find(r => r.name === shared.recipe.name);
    if (existing) {
      App.showToast('菜谱已存在于你的列表中', 'warning');
      return;
    }

    // Copy recipe into personal state
    const newRecipe = {
      name: shared.recipe.name,
      kcal: shared.recipe.kcal || 0,
      protein: shared.recipe.protein || 0,
      carbs: shared.recipe.carbs || 0,
      fat: shared.recipe.fat || 0,
      ingredients: [...(shared.recipe.ingredients || [])],
      steps: [...(shared.recipe.steps || [])],
      tags: [...(shared.recipe.tags || [])],
      source: 'shared',
      sourceUrl: '',
    };
    State.addRecipe(newRecipe);

    // Increment import count — update local cache first, then Firestore
    shared.importCount = (shared.importCount || 0) + 1;
    try {
      const { updateDoc, doc, increment, getDoc } = window.FirebaseCore;
      if (typeof increment === 'function') {
        await updateDoc(doc(_db(), 'shared_recipes', sharedId), {
          importCount: increment(1)
        });
      } else {
        // Fallback: read current count + write
        const snap = await getDoc(doc(_db(), 'shared_recipes', sharedId));
        const current = snap.data()?.importCount || 0;
        await updateDoc(doc(_db(), 'shared_recipes', sharedId), {
          importCount: current + 1
        });
      }
    } catch (e) {
      console.warn('[SharedRecipes] increment failed:', e.message);
      // Local cache already updated, will show until next load()
    }

    App.showToast(I18n.get('imported_ok'));
    Recipes.render();
    render();
  }

  // ── Client-side filter ─────────────────────────────────
  function filter(tag) {
    _currentFilter = tag;
    const bar = document.querySelector('#recipePanel-shared .filter-bar');
    if (bar) {
      bar.querySelectorAll('.pill').forEach(btn => btn.classList.toggle('active', btn.dataset.filter === tag));
    }
    render();
  }

  // ── Render shared recipe grid ──────────────────────────
  function render() {
    const grid = document.getElementById('sharedRecipeList');
    if (!grid) return;

    let list = _cache;
    if (_currentFilter !== 'all') {
      list = list.filter(s => (s.tags || []).includes(_currentFilter));
    }

    if (list.length === 0) {
      grid.innerHTML = `<p class="placeholder-text" style="grid-column:1/-1">${I18n.get('no_shared_recipes')}</p>`;
      return;
    }

    const user = _currentUser();
    const currentUid = user?.uid;

    grid.innerHTML = list.map(s => {
      const r = s.recipe;
      const tags = (r.tags || []).map(t => `<span class="recipe-card-tag">${_tagLabel(t)}</span>`).join('');
      const isOwn = currentUid && s.sharedBy.uid === currentUid;

      const actionHtml = isOwn
        ? `<button class="btn-small shared-edit-btn" onclick="SharedRecipes._editOwnRecipe('${s.id}')">✏️ 编辑</button>
           <button class="btn-small shared-unpub-btn" onclick="SharedRecipes._confirmUnpublish('${s.id}')">${I18n.get('unpublish_recipe')}</button>`
        : `<button class="import-btn" onclick="SharedRecipes.importRecipe('${s.id}')">${I18n.get('import_recipe')}</button>`;

      return `
        <div class="recipe-card shared-recipe-card">
          <div class="recipe-card-name">${r.name}</div>
          <div class="recipe-card-tags">${tags}</div>
          <div class="recipe-card-kcal">${r.kcal || '—'} ${I18n.get('kcal')}</div>
          <div class="recipe-card-macro">🥩${r.protein||0}g &nbsp;🍚${r.carbs||0}g &nbsp;🧈${r.fat||0}g</div>
          <div class="shared-meta">
            <span class="shared-by">${I18n.get('shared_by', { name: s.sharedBy.displayName || s.sharedBy.email || 'User' })}</span>
            <span class="shared-date">${_fmtDate(s.sharedAt)}</span>
          </div>
          <div class="shared-actions">
            <span class="shared-count">${I18n.get('import_count', { n: s.importCount || 0 })}</span>
            <div style="display:flex;gap:6px;align-items:center">
              ${actionHtml}
            </div>
          </div>
        </div>`;
    }).join('');
  }

  // ── Check if a recipe is already published ────────────
  function isPublished(recipeId) {
    const user = _currentUser();
    if (!user) return false;
    return _cache.some(s => s.recipe.id === recipeId && s.sharedBy.uid === user.uid);
  }

  // ── Find shared doc id for a given recipe id ──────────
  function _findSharedId(recipeId) {
    const user = _currentUser();
    if (!user) return null;
    const found = _cache.find(s => s.recipe.id === recipeId && s.sharedBy.uid === user.uid);
    return found ? found.id : null;
  }

  // ── Sub-tab switching ──────────────────────────────────
  function showSubTab(name) {
    const minePanel   = document.getElementById('recipePanel-mine');
    const sharedPanel = document.getElementById('recipePanel-shared');
    const mineBtn     = document.getElementById('subRecipe-mine');
    const sharedBtn   = document.getElementById('subRecipe-shared');

    if (name === 'mine') {
      if (minePanel) minePanel.classList.remove('hidden');
      if (sharedPanel) sharedPanel.classList.add('hidden');
      if (mineBtn) mineBtn.classList.add('active');
      if (sharedBtn) sharedBtn.classList.remove('active');
    } else {
      if (minePanel) minePanel.classList.add('hidden');
      if (sharedPanel) sharedPanel.classList.remove('hidden');
      if (mineBtn) mineBtn.classList.remove('active');
      if (sharedBtn) sharedBtn.classList.add('active');
      // Load from Firestore when switching to shared tab
      load();
    }
  }

  // ── Edit own shared recipe — open personal copy in RecipeModal ──
  function _editOwnRecipe(sharedId) {
    const shared = _cache.find(s => s.id === sharedId);
    if (!shared) return;
    // Find the matching personal recipe by id
    const personal = State.getRecipes().find(r => r.id === shared.recipe.id);
    if (personal) {
      // Switch to My Recipes tab first so the modal is visible
      showSubTab('mine');
      RecipeModal.open(personal.id);
    } else {
      App.showToast('原菜谱已删除，无法编辑。请取消分享后重新发布。', 'warning');
    }
  }

  // ── Confirm before unpublishing ──
  function _confirmUnpublish(sharedId) {
    if (confirm(I18n.get('delete_confirm') || '确定取消分享？')) {
      unpublish(sharedId);
    }
  }

  return { load, publish, unpublish, importRecipe, filter, render, isPublished, showSubTab, _editOwnRecipe, _confirmUnpublish };
})();
