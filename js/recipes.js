// recipes.js — Recipe CRUD, filtering, rendering + dynamic rows + voice input + media parse
// レシピCRUD・フィルタリング・動的行・音声入力・メディア解析 / 菜谱增删改查、动态行、语音、图片PDF解析

const Recipes = (() => {
  let _currentFilter = 'all';

  function render() {
    const el = document.getElementById('recipeList');
    if (!el) return;
    let list = State.getRecipes();
    if (_currentFilter !== 'all') list = list.filter(r => (r.tags || []).includes(_currentFilter));
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
        <div class="recipe-card-macro">🥩${r.protein||0}g &nbsp;🍚${r.carbs||0}g &nbsp;🧈${r.fat||0}g</div>
      </div>`;
  }

  function _tagLabel(tag) {
    const map = { 'high-protein':'🥩 高蛋白','low-fat':'🥗 低脂','low-carb':'🥦 低碳','high-carb':'🍚 高碳','vegetarian':'🌿 素食','adults-only':'🧑 仅大人' };
    return map[tag] || tag;
  }

  function filter(tag) {
    _currentFilter = tag;
    document.querySelectorAll('.filter-bar .pill').forEach(btn => btn.classList.toggle('active', btn.dataset.filter === tag));
    render();
  }

  return { render, filter };
})();

// ── RecipeAdd ─────────────────────────────────────────
const RecipeAdd = (() => {
  let _selectedTags = [];
  let _ingredients  = [''];  // array of strings
  let _steps        = [''];

  // ── Tab switching ────────────────────────────────────
  function showTab(tab) {
    ['url','media','manual'].forEach(t => {
      document.getElementById(`addTab-${t}`)?.classList.toggle('active', t === tab);
      document.getElementById(`addPanel-${t}`)?.classList.toggle('hidden', t !== tab);
    });
    if (tab === 'manual') { renderIngredientRows(); renderStepRows(); }
  }

  // ── Dynamic ingredient rows ──────────────────────────
  // 動的食材行をレンダリング / 渲染动态食材行
  function renderIngredientRows() {
    const el = document.getElementById('ingredientRows');
    if (!el) return;
    el.innerHTML = _ingredients.map((val, i) => `
      <div class="dynamic-row">
        <input class="inp" placeholder="${I18n.get('ph_ingredient_name') || '食材名'}"
               value="${_esc(val.split('|')[0] || '')}"
               oninput="RecipeAdd._setIngredientName(${i}, this.value)"/>
        <input class="inp inp-gram" type="number" placeholder="g"
               value="${_esc(val.split('|')[1] || '')}" min="0"
               oninput="RecipeAdd._setIngredientGram(${i}, this.value)"/>
        <button class="row-del-btn" onclick="RecipeAdd.removeIngredientRow(${i})" title="删除">−</button>
      </div>`).join('');
  }

  function addIngredientRow()               { _ingredients.push(''); renderIngredientRows(); }
  function removeIngredientRow(i)           { if (_ingredients.length > 1) _ingredients.splice(i, 1); renderIngredientRows(); }
  function _setIngredientName(i, v)         { const p = (_ingredients[i]||'').split('|'); p[0]=v; _ingredients[i]=p.join('|'); }
  function _setIngredientGram(i, v)         { const p = (_ingredients[i]||'').split('|'); p[1]=v; _ingredients[i]=p.join('|'); }

  // ── Dynamic step rows ────────────────────────────────
  function renderStepRows() {
    const el = document.getElementById('stepRows');
    if (!el) return;
    el.innerHTML = _steps.map((val, i) => `
      <div class="dynamic-row">
        <span class="step-num" style="min-width:20px;color:var(--text-muted);font-size:.8rem">${i+1}.</span>
        <input class="inp" placeholder="${I18n.get('ph_step') || '描述步骤'}"
               value="${_esc(val)}" oninput="RecipeAdd._setStep(${i}, this.value)"/>
        <button class="row-del-btn" onclick="RecipeAdd.removeStepRow(${i})" title="删除">−</button>
      </div>`).join('');
  }

  function addStepRow()           { _steps.push(''); renderStepRows(); }
  function removeStepRow(i)       { if (_steps.length > 1) _steps.splice(i, 1); renderStepRows(); }
  function _setStep(i, v)         { _steps[i] = v; }

  // ── Tag toggle ───────────────────────────────────────
  const _DIET_TAGS = ['low-fat', 'low-carb', 'high-protein'];

  function toggleTag(btn) {
    const tag = btn.dataset.tag;
    if (_selectedTags.includes(tag)) {
      _selectedTags = _selectedTags.filter(t => t !== tag);
      btn.classList.remove('selected');
    } else {
      _selectedTags.push(tag);
      btn.classList.add('selected');
      // Auto-add adults-only when a diet tag is toggled on
      if (_DIET_TAGS.includes(tag) && !_selectedTags.includes('adults-only')) {
        _selectedTags.push('adults-only');
        const adultBtn = document.querySelector('#tagSelect [data-tag="adults-only"]');
        if (adultBtn) adultBtn.classList.add('selected');
      }
    }
  }

  // ── Save manual recipe ───────────────────────────────
  function save() {
    const name = document.getElementById('rName')?.value.trim();
    if (!name) { App.showToast('请输入菜名'); return; }

    const ingredients = _ingredients
      .filter(x => x.trim())
      .map(x => { const [n,g] = x.split('|'); return g ? `${n.trim()} ${g.trim()}g` : n.trim(); });

    const recipe = {
      name,
      kcal:    parseFloat(document.getElementById('rKcal')?.value)    || 0,
      protein: parseFloat(document.getElementById('rProtein')?.value) || 0,
      carbs:   parseFloat(document.getElementById('rCarbs')?.value)   || 0,
      fat:     parseFloat(document.getElementById('rFat')?.value)     || 0,
      ingredients,
      steps: _steps.filter(s => s.trim()),
      tags: [..._selectedTags],
      source: 'manual',
    };

    State.addRecipe(recipe);
    _clearForm();
    Recipes.render();
    App.showToast(I18n.get('saved_ok'));
    BMI.renderRecommend && BMI.renderRecommend(_currentBMI());
  }

  function _clearForm() {
    ['rName','rKcal','rProtein','rCarbs','rFat'].forEach(id => { const e=document.getElementById(id); if(e) e.value=''; });
    _selectedTags=[]; _ingredients=['']; _steps=[''];
    document.querySelectorAll('#tagSelect .tag').forEach(b=>b.classList.remove('selected'));
    renderIngredientRows(); renderStepRows();
  }

  function _currentBMI() {
    const u = State.get().user;
    return u.weight && u.height ? u.weight/((u.height/100)**2) : 22;
  }

  // ── Populate from parsed recipe (URL or AI) ──────────
  // AI解析結果を手動入力フォームに反映 / 将 AI 解析结果填入手动录入表单
  function populateFromParsed(recipe) {
    showTab('manual');
    const set = (id, v) => { const e=document.getElementById(id); if(e) e.value=v||''; };
    set('rName', recipe.name); set('rKcal', recipe.kcal);
    set('rProtein', recipe.protein); set('rCarbs', recipe.carbs); set('rFat', recipe.fat);
    _ingredients = (recipe.ingredients||['']).map(ing => {
      // Try to extract grams from "食材 200g" pattern
      const m = ing.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*g$/i);
      return m ? `${m[1].trim()}|${m[2]}` : `${ing}|`;
    });
    if (_ingredients.length === 0) _ingredients = [''];
    _steps = recipe.steps?.length ? [...recipe.steps] : [''];
    renderIngredientRows(); renderStepRows();

    // Auto-select tags; auto-add adults-only if diet tags are present
    _selectedTags = recipe.tags || [];
    if (_DIET_TAGS.some(t => _selectedTags.includes(t)) && !_selectedTags.includes('adults-only')) {
      _selectedTags.push('adults-only');
    }
    document.querySelectorAll('#tagSelect .tag').forEach(b => {
      b.classList.toggle('selected', _selectedTags.includes(b.dataset.tag));
    });
  }

  function saveFromParsed(recipe) {
    State.addRecipe(recipe);
    Recipes.render();
    App.showToast(I18n.get('saved_ok'));
  }

  // ── Media file (image / PDF) handling ───────────────
  // 画像・PDFファイル処理 / 图片/PDF 文件处理
  function onDragOver(e) { e.preventDefault(); document.getElementById('mediaDropZone')?.classList.add('drag-over'); }
  function onDrop(e) {
    e.preventDefault();
    document.getElementById('mediaDropZone')?.classList.remove('drag-over');
    const file = e.dataTransfer?.files?.[0];
    if (file) onFileSelect(file);
  }

  async function onFileSelect(file) {
    if (!file) return;
    const statusEl = document.getElementById('mediaParseStatus');

    // Pre-validate before sending to API
    const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|gif|webp|avif|heic|heif|bmp)$/i.test(file.name);
    const isPDF   = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isImage && !isPDF) {
      if (statusEl) statusEl.textContent = '❌ 格式不对（支持 JPG / PNG / WEBP / AVIF / PDF）';
      return;
    }
    if (isImage && file.size < 20 * 1024) {
      if (statusEl) statusEl.textContent = '❌ 图片太小，无法识别（建议 > 20 KB）';
      return;
    }

    if (statusEl) statusEl.innerHTML = `<span class="loading-spin"></span> ${I18n.get('parse_loading')}`;

    try {
      const parsed = await Parser.fromFile(file);
      if (!parsed || !parsed.name) throw new Error('empty');
      ParseModal.show(parsed);
      if (statusEl) statusEl.textContent = '';
    } catch(e) {
      let msg;
      if (e.message === 'Unsupported file type')  msg = '❌ 格式不对（支持 JPG / PNG / WEBP / AVIF / PDF）';
      else if (e.message === 'empty')              msg = '❌ 未识别到菜谱内容（图片不清楚或内容不足）';
      else                                         msg = '❌ 解析失败，请重试';
      if (statusEl) statusEl.textContent = msg;
    }
  }

  // ── Voice input helpers (called by VoiceInput) ───────
  // Fills into the last empty row, or appends a new one if last is occupied
  function addVoiceIngredient(name, gram) {
    const last = _ingredients.length - 1;
    if (_ingredients[last] === '' || _ingredients[last] === '|' || !_ingredients[last]) {
      _ingredients[last] = `${name}|${gram || ''}`;
    } else {
      _ingredients.push(`${name}|${gram || ''}`);
    }
    renderIngredientRows();
    const inputs = document.querySelectorAll('#ingredientRows .dynamic-row input.inp:not(.inp-gram)');
    inputs[inputs.length - 1]?.focus();
  }

  function addVoiceStep(text) {
    const last = _steps.length - 1;
    if (!_steps[last] || _steps[last].trim() === '') {
      _steps[last] = text;
    } else {
      _steps.push(text);
    }
    renderStepRows();
    const inputs = document.querySelectorAll('#stepRows .dynamic-row input.inp');
    inputs[inputs.length - 1]?.focus();
  }

  function _esc(s) { return (s||'').replace(/"/g,'&quot;'); }

  return { showTab, renderIngredientRows, renderStepRows, addIngredientRow, removeIngredientRow,
           addStepRow, removeStepRow, toggleTag, save, populateFromParsed, saveFromParsed,
           onDragOver, onDrop, onFileSelect, addVoiceIngredient, addVoiceStep,
           _setIngredientName, _setIngredientGram, _setStep };
})();

// ── VoiceInput — speech recognition for ingredient/step rows ──
// 音声入力（食材・手順行） / 语音输入（食材/步骤行）
const VoiceInput = (() => {
  let _recognition = null;
  let _target = 'ingredient'; // 'ingredient' | 'step'
  let _active = false;

  function start(target) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { App.showToast('浏览器不支持语音输入'); return; }

    _target = target;
    if (_active && _recognition) { _recognition.stop(); return; }

    _recognition = new SpeechRecognition();
    _recognition.lang = _langCode();
    _recognition.continuous = false;
    _recognition.interimResults = false;

    // Visual feedback
    document.querySelectorAll('.voice-btn').forEach(b => b.classList.remove('recording'));
    const btn = document.querySelector(`.voice-btn[onclick*="${target}"]`);
    if (btn) btn.classList.add('recording');
    _active = true;

    _recognition.onresult = e => {
      const text = e.results[0][0].transcript.trim();
      _insertVoiceText(text);
    };
    _recognition.onend = () => {
      _active = false;
      document.querySelectorAll('.voice-btn').forEach(b => b.classList.remove('recording'));
    };
    _recognition.onerror = err => {
      _active = false;
      App.showToast('语音识别错误: ' + err.error);
    };
    _recognition.start();
  }

  function _langCode() {
    return { zh:'zh-CN', en:'en-US', ja:'ja-JP' }[I18n.current()] || 'zh-CN';
  }

  // Route voice transcript into the correct input rows
  // 音声テキストを食材/手順入力欄へ反映 / 将语音文本填入对应输入框
  function _insertVoiceText(text) {
    const parts = text.split(/[，,、。；;]+/).map(s => s.trim()).filter(Boolean);
    if (_target === 'ingredient') {
      parts.forEach(part => {
        const m = part.match(/^(.+?)\s*(\d+(?:\.\d+)?)\s*[克gG]/);
        RecipeAdd.addVoiceIngredient(m ? m[1].trim() : part, m ? m[2] : '');
      });
    } else {
      parts.forEach(part => RecipeAdd.addVoiceStep(part));
    }
    App.showToast(`🎤 识别: "${text}"`);
  }

  return { start };
})();

// ── RecipeModal ───────────────────────────────────────
const RecipeModal = (() => {
  let _currentId = null;

  function open(id) {
    const r = State.getRecipes().find(x => x.id === id);
    if (!r) return;
    _currentId = id;

    const tags = (r.tags||[]).map(t=>`<span class="recipe-card-tag">${_tl(t)}</span>`).join('');
    const ings = (r.ingredients||[]).map(i=>`<li>${i}</li>`).join('');
    const stps = (r.steps||[]).map((s,i)=>`<li>${s}</li>`).join('');

    document.getElementById('recipeModalContent').innerHTML = `
      <div class="recipe-detail-name">${r.name}</div>
      <div class="recipe-detail-tags">${tags}</div>
      <div class="macro-chips">
        <span class="macro-chip kcal">🔥 ${r.kcal||'—'} ${I18n.get('kcal')}</span>
        <span class="macro-chip protein">🥩 ${r.protein||0}g</span>
        <span class="macro-chip carb">🍚 ${r.carbs||0}g</span>
        <span class="macro-chip fat">🧈 ${r.fat||0}g</span>
      </div>
      ${ings?`<div class="recipe-detail-section"><h4>${I18n.get('ingredients_lbl')}</h4><ul>${ings}</ul></div>`:''}
      ${stps?`<div class="recipe-detail-section"><h4>${I18n.get('steps_lbl')}</h4><ol>${stps}</ol></div>`:''}
      ${r.sourceUrl?`<p class="text-muted mt-8">🔗 <a href="${r.sourceUrl}" target="_blank">来源</a></p>`:''}
      <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
        <button class="add-to-meal-btn" onclick="Tracker.addFromRecipe('${id}');RecipeModal.close()">
          ${I18n.get('add_to_meal')}</button>
        <button class="btn-small" style="color:#e74c3c;background:#fdecea"
          onclick="if(confirm('${I18n.get('delete_confirm')}'))RecipeModal._del()">🗑 删除</button>
      </div>`;
    document.getElementById('recipeModal').classList.remove('hidden');
  }

  function close() { document.getElementById('recipeModal').classList.add('hidden'); _currentId=null; }
  function _del()  { if(!_currentId)return; State.deleteRecipe(_currentId); Recipes.render(); close(); }
  function _tl(tag) { const m={'high-protein':'🥩 高蛋白','low-fat':'🥗 低脂','low-carb':'🥦 低碳','high-carb':'🍚 高碳','vegetarian':'🌿 素食','adults-only':'🧑 仅大人'}; return m[tag]||tag; }

  return { open, close, _del };
})();

// ParseModal is defined in parser.js — do not redeclare here
// ParseModal は parser.js で定義済み — ここで再宣言しない / ParseModal 已在 parser.js 定义，此处不重复声明

// ══════════════════════════════════════════════════════
// XhsImport — 导入小红书菜谱 (xhs_import.json)
// ══════════════════════════════════════════════════════
const XhsImport = (() => {

  // 解析并导入 hm_data 对象
  function _importData(hm_data) {
    const recipes = hm_data.recipes || [];
    if (!recipes.length) { App.toast('没有找到可导入的菜谱', 'warn'); return; }

    // 如果已有小红书来源的菜谱，询问是否替换（避免旧数据残留）
    const existingXhs = State.getRecipes().filter(r => r.source === '小红书' || (r.id || '').startsWith('xhs_'));
    if (existingXhs.length > 0) {
      const replace = confirm(`已有 ${existingXhs.length} 个小红书菜谱。\n点「确定」替换旧菜谱，点「取消」追加新菜谱。`);
      if (replace) {
        existingXhs.forEach(r => State.deleteRecipe(r.id));
      }
    }

    let added = 0, skipped = 0;
    const existing = new Set(State.getRecipes().map(r => r.name));

    recipes.forEach(r => {
      if (existing.has(r.name)) { skipped++; return; }
      const recipe = {
        id:          r.id || ('xhs_' + Math.random().toString(36).slice(2,10)),
        name:        r.name || '未知菜谱',
        kcal:        Number(r.kcal)    || 0,
        protein:     Number(r.protein) || 0,
        carbs:       Number(r.carbs)   || 0,
        fat:         Number(r.fat)     || 0,
        ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
        steps:       Array.isArray(r.steps)       ? r.steps       : [],
        tags:        Array.isArray(r.tags)         ? r.tags        : [],
        source:      r.source     || '小红书',
        source_url:  r.source_url || '',
      };
      State.addRecipe(recipe);
      added++;
    });

    Recipes.render();
    App.toast(`✅ 导入完成：新增 ${added} 个菜谱${skipped ? `，跳过 ${skipped} 个重复` : ''}`, 'success');
  }

  // 点按钮：先尝试 fetch xhs_import.json，失败则弹文件选择器
  async function run() {
    try {
      const res  = await fetch('xhs_import.json?t=' + Date.now());
      if (!res.ok) throw new Error('not found');
      const data = await res.json();
      _importData(data);
    } catch {
      // 本地文件协议下 fetch 会失败，改为弹文件选择器
      document.getElementById('xhsFileInput').click();
    }
  }

  // 从 <input type=file> 读取
  function fromFile(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target.result);
        _importData(data);
      } catch {
        App.toast('JSON 格式错误，请检查文件', 'error');
      }
    };
    reader.readAsText(file, 'utf-8');
    input.value = '';   // 允许重复选同一文件
  }

  return { run, fromFile };
})();
