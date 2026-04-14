// parser.js — Recipe URL parsing via Claude API (proxied through Vercel serverless)
// Claude APIを使ったレシピURL解析 / 通过 Vercel serverless 代理调用 Claude API 解析菜谱

const Parser = (() => {

  // Auto-classify tags based on nutrition values
  // 栄養値に基づいてタグを自動分類 / 根据营养值自动分类标签
  function _autoTags(recipe) {
    const tags = [];
    const { protein = 0, carbs = 0, fat = 0, kcal = 500 } = recipe;
    // High protein: >25% of kcal from protein, or >30g
    if (protein * 4 > kcal * 0.25 || protein > 30) tags.push('high-protein');
    // Low fat: <20% of kcal from fat, or <10g
    if (fat * 9 < kcal * 0.20 || fat < 10)          tags.push('low-fat');
    // Low carb: <20% of kcal from carbs, or <20g
    if (carbs * 4 < kcal * 0.20 || carbs < 20)       tags.push('low-carb');
    // High carb: >55% of kcal from carbs
    if (carbs * 4 > kcal * 0.55)                      tags.push('high-carb');
    return tags;
  }

  // Parse recipe from a URL using backend serverless function
  // バックエンドサーバーレス関数を使ってURLからレシピを解析 / 通过后端 serverless 函数解析 URL
  async function fromUrl() {
    const urlInput = document.getElementById('recipeUrl');
    const statusEl = document.getElementById('parseStatus');
    const url = urlInput?.value.trim();

    if (!url || !url.startsWith('http')) {
      if (statusEl) statusEl.textContent = '请输入有效的 URL';
      return;
    }

    if (statusEl) statusEl.innerHTML = `<span class="loading-spin"></span> ${I18n.get('parse_loading')}`;

    try {
      // Call Vercel serverless function at /api/parse-recipe
      // Vercelサーバーレス関数を呼び出す / 调用 Vercel serverless 函数
      const resp = await fetch('/api/parse-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, lang: I18n.current() }),
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();

      if (!data.name) throw new Error('parse_empty');

      // Auto-tag based on nutrition
      // 栄養に基づいて自動タグ / 根据营养自动打标签
      data.tags = data.tags?.length ? data.tags : _autoTags(data);
      data.sourceUrl = url;

      // Show preview modal
      // プレビューモーダルを表示 / 显示预览弹窗
      ParseModal.show(data);
      if (statusEl) statusEl.textContent = '';
      if (urlInput) urlInput.value = '';

    } catch (err) {
      console.error('[Parser] fromUrl error:', err);
      if (statusEl) statusEl.textContent = I18n.get('parse_error');
    }
  }

  // Parse from plain text (future feature)
  // プレーンテキストから解析（将来機能）/ 从纯文本解析（未来功能）
  async function fromText(text) {
    try {
      const resp = await fetch('/api/parse-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang: I18n.current() }),
      });
      const data = await resp.json();
      data.tags = data.tags?.length ? data.tags : _autoTags(data);
      return data;
    } catch (err) {
      console.error('[Parser] fromText error:', err);
      return null;
    }
  }

  return { fromUrl, fromText, autoTags: _autoTags };
})();

// ── ParseModal — preview before saving ──────────────
// 保存前プレビューモーダル / 保存前预览弹窗
const ParseModal = (() => {
  let _pending = null;

  function show(recipe) {
    _pending = recipe;
    const tags = (recipe.tags || []).map(t => `<span class="recipe-card-tag">${t}</span>`).join('');
    const ingredients = (recipe.ingredients || []).map(i => `<li>${i}</li>`).join('');
    const steps = (recipe.steps || []).map((s, i) => `<li>${s}</li>`).join('');

    document.getElementById('parseModalContent').innerHTML = `
      <div style="font-weight:800;font-size:1.1rem">${recipe.name}</div>
      <div style="display:flex;flex-wrap:wrap;gap:5px">${tags}</div>
      <div class="macro-chips">
        <span class="macro-chip kcal">🔥 ${recipe.kcal || '—'} kcal</span>
        <span class="macro-chip protein">🥩 ${recipe.protein || 0}g 蛋白</span>
        <span class="macro-chip carb">🍚 ${recipe.carbs || 0}g 碳水</span>
        <span class="macro-chip fat">🧈 ${recipe.fat || 0}g 脂肪</span>
      </div>
      ${ingredients ? `<div class="recipe-detail-section"><h4>食材</h4><ul>${ingredients}</ul></div>` : ''}
      ${steps ? `<div class="recipe-detail-section"><h4>步骤</h4><ol>${steps}</ol></div>` : ''}
    `;
    document.getElementById('parseModal').classList.remove('hidden');
  }

  function save() {
    if (!_pending) return;
    RecipeAdd.saveFromParsed(_pending);
    close();
  }

  function close() {
    document.getElementById('parseModal').classList.add('hidden');
    _pending = null;
  }

  return { show, save, close };
})();
