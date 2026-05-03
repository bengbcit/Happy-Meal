// exercise.js — Exercise calorie calculator using MET values + BMI/weight
// MET値とBMI・体重を使った運動カロリー計算 / 使用 MET 值和体重计算运动消耗热量

const Exercise = (() => {
  // MET database: Metabolic Equivalent of Task values (from ACSM / Compendium of Physical Activities)
  // METデータベース（ACSM / 身体活動の概要）/ MET 数据库
  const EXERCISES = [
    // key, icon, name_zh, name_en, name_ja, MET
    { id:'run',      icon:'🏃', zh:'跑步(慢速)', en:'Running (slow)',   ja:'ジョギング',     met:8.0,  cat:'cardio' },
    { id:'run_fast', icon:'🏃', zh:'跑步(快速)', en:'Running (fast)',   ja:'ランニング',     met:11.5, cat:'cardio' },
    { id:'walk',     icon:'🚶', zh:'快走',        en:'Brisk Walking',   ja:'ウォーキング',   met:3.5,  cat:'cardio' },
    { id:'swim',     icon:'🏊', zh:'游泳',        en:'Swimming',        ja:'水泳',           met:8.0,  cat:'cardio' },
    { id:'cycle',    icon:'🚴', zh:'骑车',        en:'Cycling',         ja:'サイクリング',   met:7.5,  cat:'cardio' },
    { id:'jump',     icon:'🪢', zh:'跳绳',        en:'Jump Rope',       ja:'なわとび',       met:12.3, cat:'cardio' },
    { id:'hiit',     icon:'🔥', zh:'HIIT',        en:'HIIT',            ja:'HIIT',           met:10.0, cat:'cardio' },
    { id:'pushup',   icon:'💪', zh:'俯卧撑',      en:'Push-ups',        ja:'腕立て伏せ',     met:8.0,  cat:'strength' },
    { id:'situp',    icon:'🧘', zh:'仰卧起坐',    en:'Sit-ups',         ja:'腹筋',           met:7.0,  cat:'strength' },
    { id:'pullup',   icon:'🏋️', zh:'引体向上',    en:'Pull-ups',        ja:'懸垂',           met:8.0,  cat:'strength' },
    { id:'squat',    icon:'🦵', zh:'深蹲',        en:'Squats',          ja:'スクワット',     met:5.0,  cat:'strength' },
    { id:'plank',    icon:'🪨', zh:'平板支撑',    en:'Plank',           ja:'プランク',       met:4.0,  cat:'strength' },
    { id:'yoga',     icon:'🧘', zh:'瑜伽',        en:'Yoga',            ja:'ヨガ',           met:3.0,  cat:'flex' },
    { id:'stretch',  icon:'🤸', zh:'拉伸',        en:'Stretching',      ja:'ストレッチ',     met:2.5,  cat:'flex' },
    { id:'badminton',icon:'🏸', zh:'羽毛球',      en:'Badminton',       ja:'バドミントン',   met:5.5,  cat:'sport' },
    { id:'basketball',icon:'🏀',zh:'篮球',        en:'Basketball',      ja:'バスケ',         met:8.0,  cat:'sport' },
    { id:'dance',     icon:'💃', zh:'跳舞',            en:'Dancing',              ja:'ダンス',           met:5.0,  cat:'sport' },
    { id:'dance_med', icon:'💃', zh:'跳舞（中等强度）', en:'Dancing (Moderate)',  ja:'ダンス（中等）',   met:5.5,  cat:'sport' },
    { id:'dance_hi',  icon:'🕺', zh:'跳舞（高等强度）', en:'Dancing (High Int.)', ja:'ダンス（高強度）', met:6.8,  cat:'sport' },
    { id:'stairs',    icon:'🪜', zh:'爬楼梯',          en:'Stair Climbing',       ja:'階段昇降',         met:8.8,  cat:'cardio' },
  ];

  // Load custom exercises + today's log from state
  const KEY_CUSTOM = 'hm_custom_exercises';
  const KEY_LOG    = 'hm_exercise_log';

  function _customList() {
    try { return JSON.parse(localStorage.getItem(KEY_CUSTOM) || '[]'); } catch { return []; }
  }
  function _todayLog() {
    const today = new Date().toISOString().slice(0,10);
    try {
      const all = JSON.parse(localStorage.getItem(KEY_LOG) || '{}');
      return all[today] || [];
    } catch { return []; }
  }
  function _saveLog(entries) {
    const today = new Date().toISOString().slice(0,10);
    try {
      const all = JSON.parse(localStorage.getItem(KEY_LOG) || '{}');
      all[today] = entries;
      localStorage.setItem(KEY_LOG, JSON.stringify(all));
    } catch {}
  }

  // Calorie calculation: MET × weight(kg) × duration(hours)
  // カロリー計算: MET × 体重(kg) × 時間(h) / 热量计算
  function _calcKcal(met, minutes) {
    const weight = State.get().user.weight || 65;
    return Math.round(met * weight * (minutes / 60));
  }

  let _catFilter = 'all';

  // ── Render exercise list ─────────────────────────────
  // 運動リストをレンダリング / 渲染运动列表
  function render() {
    const el = document.getElementById('exerciseList');
    if (!el) return;
    const lang = I18n.current();
    const all  = [...EXERCISES, ..._customList()];
    const list = _catFilter === 'all' ? all : all.filter(e => e.cat === _catFilter || e.cat === 'custom');

    el.innerHTML = `
      <!-- Category filter -->
      <div class="exercise-cats">
        ${[['all','全部/All'],['cardio','有氧'],['strength','力量'],['flex','柔韧'],['sport','运动'],['custom','自定义']]
          .map(([c,l]) => `<button class="pill${_catFilter===c?' active':''}" onclick="Exercise.filterCat('${c}')">${l}</button>`).join('')}
      </div>
      ${list.map(ex => _exCardHTML(ex, lang)).join('')}`;
  }

  function _exCardHTML(ex, lang) {
    const name = lang==='en' ? ex.en : lang==='ja' ? ex.ja : ex.zh;
    const defaultMin = 30;
    return `
      <div class="exercise-card" id="exCard-${ex.id}">
        <span class="ex-icon">${ex.icon}</span>
        <div class="ex-info">
          <span class="ex-name">${name}</span>
          <span class="ex-met">MET ${ex.met}</span>
        </div>
        <div class="ex-controls">
          <button class="ex-min-btn" onclick="Exercise.adjMin('${ex.id}',-5)">−</button>
          <input class="ex-min-inp" id="exMin-${ex.id}" type="number" value="${defaultMin}" min="1" max="300"
                 onchange="Exercise.updateKcal('${ex.id}')"/>
          <span class="ex-min-label">分钟</span>
          <button class="ex-min-btn" onclick="Exercise.adjMin('${ex.id}',5)">＋</button>
        </div>
        <div class="ex-kcal-preview" id="exKcal-${ex.id}">${_calcKcal(ex.met, defaultMin)} kcal</div>
        <button class="ex-log-btn" onclick="Exercise.logEntry('${ex.id}')">＋记录</button>
        ${ex.cat==='custom' ? `<button class="row-del-btn" onclick="Exercise.deleteCustom('${ex.id}')" style="margin-left:4px">−</button>` : ''}
      </div>`;
  }

  function filterCat(cat) { _catFilter = cat; render(); }

  // Adjust minutes with +/- buttons
  // +/-ボタンで分数を調整 / 用 +/- 按钮调整分钟数
  function adjMin(id, delta) {
    const inp = document.getElementById(`exMin-${id}`);
    if (!inp) return;
    const newVal = Math.max(1, (parseInt(inp.value)||30) + delta);
    inp.value = newVal;
    updateKcal(id);
  }

  function updateKcal(id) {
    const inp    = document.getElementById(`exMin-${id}`);
    const kcalEl = document.getElementById(`exKcal-${id}`);
    if (!inp || !kcalEl) return;
    const all = [...EXERCISES, ..._customList()];
    const ex  = all.find(e => e.id === id);
    if (!ex) return;
    kcalEl.textContent = _calcKcal(ex.met, parseInt(inp.value)||30) + ' kcal';
  }

  // Log an exercise entry to today's record
  // 今日の記録に運動エントリを追加 / 将运动记录添加到今日记录
  function logEntry(id) {
    const inp = document.getElementById(`exMin-${id}`);
    const all = [...EXERCISES, ..._customList()];
    const ex  = all.find(e => e.id === id);
    if (!ex || !inp) return;
    const minutes = parseInt(inp.value) || 30;
    const kcal    = _calcKcal(ex.met, minutes);
    const lang    = I18n.current();
    const name    = lang==='en' ? ex.en : lang==='ja' ? ex.ja : ex.zh;
    const log     = _todayLog();
    log.push({ id, name, icon: ex.icon, minutes, kcal, time: new Date().toTimeString().slice(0,5) });
    _saveLog(log);
    renderLog();
    App.showToast(`${ex.icon} ${name} ${minutes}分钟 → 消耗 ${kcal} kcal`);
  }

  // Render today's exercise log
  // 今日の運動ログをレンダリング / 渲染今日运动记录
  function renderLog() {
    const el = document.getElementById('exerciseLog');
    const totalEl = document.getElementById('totalBurned');
    if (!el) return;
    const log   = _todayLog();
    const total = log.reduce((s, e) => s + (e.kcal||0), 0);
    if (totalEl) totalEl.textContent = total;

    if (!log.length) { el.innerHTML = `<p class="placeholder-text">今日还没有运动记录</p>`; return; }
    el.innerHTML = log.map((entry, i) => `
      <div class="exercise-log-item">
        <span>${entry.icon}</span>
        <span class="ex-log-name">${entry.name}</span>
        <span class="ex-log-detail">${entry.minutes}分 · ${entry.kcal}kcal · ${entry.time}</span>
        <button class="row-del-btn" onclick="Exercise.removeLog(${i})">−</button>
      </div>`).join('');
  }

  function removeLog(idx) {
    const log = _todayLog();
    log.splice(idx, 1);
    _saveLog(log);
    renderLog();
  }

  // Add custom exercise
  // カスタム運動を追加 / 添加自定义运动
  function addCustom() {
    const name = document.getElementById('exName')?.value.trim();
    const met  = parseFloat(document.getElementById('exMET')?.value) || 5.0;
    if (!name) { App.showToast('请输入运动名称'); return; }
    const custom = _customList();
    custom.push({ id:'c_'+Date.now(), icon:'⚡', zh:name, en:name, ja:name, met, cat:'custom' });
    localStorage.setItem(KEY_CUSTOM, JSON.stringify(custom));
    document.getElementById('exName').value='';
    document.getElementById('exMET').value='';
    render();
  }

  function deleteCustom(id) {
    const custom = _customList().filter(e => e.id !== id);
    localStorage.setItem(KEY_CUSTOM, JSON.stringify(custom));
    render();
  }

  function init() { render(); renderLog(); }

  // Daily exercise recommendation for home dashboard
  // ホーム用今日の運動おすすめ / 主页今日运动推荐
  function renderExerciseRecommend() {
    const el = document.getElementById('exerciseRecommendList');
    if (!el) return;
    const lang = I18n.current();
    const POOL_IDS = ['walk','run','hiit','stairs','swim','dance_med','dance_hi'];
    const pool = EXERCISES.filter(e => POOL_IDS.includes(e.id));

    // Date-seeded shuffle so picks are consistent within the day
    const seed = parseInt(new Date().toISOString().slice(0,10).replace(/-/g,''));
    const shuffled = [...pool].sort((a,b) => ((seed * a.met * 31) % 97) - ((seed * b.met * 17) % 97));
    const picks = shuffled.slice(0, 3);

    const weight = State.get().user.weight || 65;
    el.innerHTML = picks.map(ex => {
      const name = lang==='en' ? ex.en : lang==='ja' ? ex.ja : ex.zh;
      const kcal = Math.round(ex.met * weight * 0.5); // 30 min
      return `<div class="recipe-list-item" style="cursor:default">
        <span>${ex.icon} ${name} <span style="font-size:.75rem;color:var(--text-faint)">30分钟</span></span>
        <span style="color:var(--accent-warm,#FF7A45);font-weight:600">${kcal} 千卡</span>
      </div>`;
    }).join('');
  }

  return { render, renderLog, filterCat, adjMin, updateKcal, logEntry, removeLog, addCustom, deleteCustom, init, renderExerciseRecommend };
})();

// ── DiningOut — restaurant meal options ───────────────
// 外食オプション / 外食选项模块
const DiningOut = (() => {
  const BUILTIN = [
    { id:'d1', cat:'fast',     icon:'🍔', zh:'麦当劳巨无霸套餐', en:'McDonald\'s Big Mac Meal', ja:'マックビッグマックセット', kcal:1100 },
    { id:'d2', cat:'fast',     icon:'🍟', zh:'薯条(大)',          en:'Large Fries',              ja:'Lサイズポテト',          kcal:490  },
    { id:'d3', cat:'fast',     icon:'🍕', zh:'比萨(2片)',         en:'Pizza (2 slices)',          ja:'ピザ2枚',               kcal:570  },
    { id:'d4', cat:'japanese', icon:'🍣', zh:'寿司套餐(10件)',    en:'Sushi Set (10pcs)',         ja:'寿司セット10貫',        kcal:450  },
    { id:'d5', cat:'japanese', icon:'🍜', zh:'拉面(豚骨)',        en:'Tonkotsu Ramen',            ja:'とんこつラーメン',      kcal:600  },
    { id:'d6', cat:'japanese', icon:'🍱', zh:'便当套餐',          en:'Bento Box',                 ja:'弁当セット',            kcal:700  },
    { id:'d7', cat:'chinese',  icon:'🥢', zh:'炒饭',              en:'Fried Rice',                ja:'チャーハン',            kcal:650  },
    { id:'d8', cat:'chinese',  icon:'🍲', zh:'麻婆豆腐+米饭',    en:'Mapo Tofu + Rice',          ja:'麻婆豆腐定食',          kcal:550  },
    { id:'d9', cat:'western',  icon:'🥩', zh:'牛排套餐',          en:'Steak Set',                 ja:'ステーキセット',        kcal:900  },
    { id:'d10',cat:'western',  icon:'🍝', zh:'意大利面(奶油)',    en:'Carbonara Pasta',           ja:'カルボナーラ',          kcal:750  },
    { id:'d11',cat:'fast',     icon:'🌮', zh:'墨西哥卷饼',        en:'Burrito',                   ja:'ブリトー',              kcal:600  },
    { id:'d12',cat:'chinese',  icon:'🍜', zh:'外卖炸鸡饭',        en:'Delivery Fried Chicken Rice', ja:'唐揚げ定食',          kcal:800  },
  ];

  let _catFilter = 'all';

  function _customList() {
    try { return JSON.parse(localStorage.getItem('hm_dining_custom') || '[]'); } catch { return []; }
  }

  function render() {
    const el = document.getElementById('diningList');
    if (!el) return;
    const lang = I18n.current();
    const all  = [...BUILTIN, ..._customList()];
    const list = _catFilter==='all' ? all : _catFilter==='custom' ? _customList() : all.filter(d=>d.cat===_catFilter);

    el.innerHTML = list.map(item => {
      const name = lang==='en' ? item.en : lang==='ja' ? item.ja : item.zh;
      return `
        <div class="indulge-card" onclick="DiningOut.addToToday('${item.id}')">
          <span class="indulge-icon">${item.icon}</span>
          <span class="indulge-name">${name}</span>
          <span class="indulge-kcal">🔥 ${item.kcal} kcal</span>
          <button class="indulge-add-btn">+ 今日记录</button>
          ${item.cat==='custom'?`<button class="row-del-btn" style="margin-top:4px" onclick="event.stopPropagation();DiningOut.deleteCustom('${item.id}')">−</button>`:''}
        </div>`;
    }).join('');
  }

  function filterCat(cat) {
    _catFilter = cat;
    document.querySelectorAll('.dining-cats .pill').forEach(b=>b.classList.toggle('active',b.dataset.dcat===cat));
    render();
  }

  function addCustom() {
    const name = document.getElementById('diningName')?.value.trim();
    const kcal = parseInt(document.getElementById('diningKcal')?.value) || 0;
    if (!name) { App.showToast('请输入餐厅/菜名'); return; }
    const custom = _customList();
    custom.push({ id:'dc_'+Date.now(), cat:'custom', icon:'🍽', zh:name, en:name, ja:name, kcal });
    localStorage.setItem('hm_dining_custom', JSON.stringify(custom));
    document.getElementById('diningName').value='';
    document.getElementById('diningKcal').value='';
    render();
  }

  function deleteCustom(id) {
    const c = _customList().filter(x=>x.id!==id);
    localStorage.setItem('hm_dining_custom', JSON.stringify(c));
    render();
  }

  function addToToday(id) {
    const all  = [...BUILTIN, ..._customList()];
    const item = all.find(x=>x.id===id);
    if (!item) return;
    const lang = I18n.current();
    const name = lang==='en' ? item.en : lang==='ja' ? item.ja : item.zh;
    const today= new Date().toISOString().slice(0,10);
    State.addLogEntry(today,'snack',{ name, kcal:item.kcal, protein:0, carbs:0, fat:0 });
    const riceEq = (item.kcal/250).toFixed(1);
    App.showToast(`🍽 ${name} (${item.kcal} kcal) 已记录${item.kcal>=500?' ⚠️ 约'+riceEq+'碗白饭热量':''}`,'');
    if(typeof Tracker!=='undefined') Tracker.renderSummary();
  }

  function init() { render(); }

  return { render, filterCat, addCustom, deleteCustom, addToToday, init };
})();
