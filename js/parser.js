// parser.js — Multi-source recipe parser: URL / image / PDF / CSV / text
// マルチソースレシピパーサー / 多来源菜谱解析器

const Parser = (() => {

  // Auto-tag based on macros
  function _autoTags(recipe) {
    const tags = [];
    const { protein=0, carbs=0, fat=0, kcal=500 } = recipe;
    if (protein*4 > kcal*0.25 || protein>30) tags.push('high-protein');
    if (fat*9 < kcal*0.20 || fat<10)         tags.push('low-fat');
    if (carbs*4 < kcal*0.20 || carbs<20)      tags.push('low-carb');
    if (carbs*4 > kcal*0.55)                  tags.push('high-carb');
    return tags;
  }

  // ── From URL ─────────────────────────────────────────
  async function fromUrl() {
    const urlInput = document.getElementById('recipeUrl');
    const statusEl = document.getElementById('parseStatus');
    const url = urlInput?.value.trim();
    if (!url || !url.startsWith('http')) { if(statusEl) statusEl.textContent='请输入有效的 URL'; return; }
    if (statusEl) statusEl.innerHTML = `<span class="loading-spin"></span> ${I18n.get('parse_loading')}`;
    try {
      const resp = await fetch('/api/parse-recipe', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ url, lang: I18n.current() }),
      });
      if (!resp.ok) throw new Error('HTTP '+resp.status);
      const data = await resp.json();
      if (!data.name) throw new Error('empty');
      data.tags = data.tags?.length ? data.tags : _autoTags(data);
      data.sourceUrl = url;
      ParseModal.show(data);
      if (statusEl) statusEl.textContent = '';
      if (urlInput) urlInput.value = '';
    } catch(e) {
      if (statusEl) statusEl.textContent = I18n.get('parse_error');
    }
  }

  // ── From file (image / PDF) ──────────────────────────
  // ファイル（画像・PDF）から解析 / 从文件（图片/PDF）解析
  async function fromFile(file) {
    if (!file) return null;
    const isImage = file.type.startsWith('image/');
    const isPDF   = file.type === 'application/pdf';
    if (!isImage && !isPDF) throw new Error('Unsupported file type');

    // Convert to base64
    // Base64に変換 / 转换为 base64
    const b64 = await _fileToBase64(file);

    const resp = await fetch('/api/parse-recipe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileBase64: b64,
        fileType: file.type,
        fileName: file.name,
        lang: I18n.current(),
      }),
    });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const data = await resp.json();
    if (!data.name) throw new Error('empty');
    data.tags = data.tags?.length ? data.tags : _autoTags(data);
    return data;
  }

  // ── From CSV ─────────────────────────────────────────
  // CSVから食品エントリをパース / 从 CSV 解析食物条目
  function parseCSV(text) {
    const lines = text.trim().split('\n').filter(Boolean);
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g,''));

    // Map common header names to our fields
    // 一般的なヘッダー名をフィールドにマッピング / 将常见标题映射到字段
    const COL = {
      name:    ['name','食物','food','item','菜名','品名','名前'],
      kcal:    ['kcal','calories','热量','卡路里','cal','カロリー','energy'],
      protein: ['protein','蛋白质','蛋白','タンパク質','pro'],
      carbs:   ['carbs','carbohydrates','碳水','糖质','炭水化物','carb'],
      fat:     ['fat','脂肪','fat(g)','脂質'],
    };

    function _findCol(headers, keys) {
      return headers.findIndex(h => keys.some(k => h.includes(k)));
    }
    const idx = {};
    Object.entries(COL).forEach(([field, keys]) => { idx[field] = _findCol(headers, keys); });

    const results = [];
    for (let i=1; i<lines.length; i++) {
      const cells = lines[i].split(',').map(c => c.trim().replace(/['"]/g,''));
      const name = idx.name >= 0 ? cells[idx.name] : cells[0];
      if (!name) continue;
      results.push({
        name,
        kcal:    idx.kcal    >= 0 ? parseFloat(cells[idx.kcal])    || 0 : 0,
        protein: idx.protein >= 0 ? parseFloat(cells[idx.protein]) || 0 : 0,
        carbs:   idx.carbs   >= 0 ? parseFloat(cells[idx.carbs])   || 0 : 0,
        fat:     idx.fat     >= 0 ? parseFloat(cells[idx.fat])     || 0 : 0,
      });
    }
    return results;
  }

  // ── From image for tracker (identify food) ───────────
  // トラッカー用：画像から食品を識別 / 追踪用：从图片识别食物
  async function fromImageForTracker(file) {
    const b64 = await _fileToBase64(file);
    const resp = await fetch('/api/parse-recipe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileBase64: b64, fileType: file.type, fileName: file.name,
        lang: I18n.current(), mode: 'tracker',  // tell backend to return food log entries
      }),
    });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    return await resp.json();
  }

  // Helper: file → base64 string
  function _fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve(reader.result.split(',')[1]); // strip "data:...;base64,"
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return { fromUrl, fromFile, fromImageForTracker, parseCSV, autoTags: _autoTags };
})();

// ── ParseModal ─────────────────────────────────────────
const ParseModal = (() => {
  let _pending = null;
  function show(recipe) {
    _pending = recipe;
    const ings = (recipe.ingredients||[]).map(i=>`<li>${i}</li>`).join('');
    const stps = (recipe.steps||[]).map(s=>`<li>${s}</li>`).join('');
    document.getElementById('parseModalContent').innerHTML = `
      <div style="font-weight:800;font-size:1.1rem">${recipe.name}</div>
      <div class="macro-chips">
        <span class="macro-chip kcal">🔥 ${recipe.kcal||'—'} kcal</span>
        <span class="macro-chip protein">🥩 ${recipe.protein||0}g</span>
        <span class="macro-chip carb">🍚 ${recipe.carbs||0}g</span>
        <span class="macro-chip fat">🧈 ${recipe.fat||0}g</span>
      </div>
      ${ings?`<div class="recipe-detail-section"><h4>食材</h4><ul>${ings}</ul></div>`:''}
      ${stps?`<div class="recipe-detail-section"><h4>步骤</h4><ol>${stps}</ol></div>`:''}`;
    document.getElementById('parseModal').classList.remove('hidden');
  }
  function save()  { if(!_pending)return; RecipeAdd.saveFromParsed(_pending); close(); }
  function close() { document.getElementById('parseModal').classList.add('hidden'); _pending=null; }
  return { show, save, close };
})();
