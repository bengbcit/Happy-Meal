// planner.js — Weekly meal planner: auto-generate, multi-email, kids mode
// 週間献立：自動生成・複数メール・子供モード / 周菜单：自动生成、多邮箱、孩子模式

const Planner = (() => {
  const DAYS     = ['mon','tue','wed','thu','fri','sat','sun'];
  const DAY_KEYS = ['day_mon','day_tue','day_wed','day_thu','day_fri','day_sat','day_sun'];
  const MEAL_SLOTS  = ['breakfast','lunch','dinner'];
  const MEAL_LABELS = ['🌅','☀️','🌙'];

  // Calorie targets by mode and gender
  // モードと性別によるカロリー目標 / 按模式和性别的热量目标
  const TARGETS = {
    adult: { male: 1800, female: 1500 },
    kid:   { male: 1600, female: 1400 },  // children 6-12 approx
  };

  let _mode = 'adult';  // 'adult' | 'kid'
  let _emails = [''];   // multi-email list

  // ── Mode toggle ──────────────────────────────────────
  function setMode(mode) {
    _mode = mode;
    document.getElementById('modeAdult')?.classList.toggle('active', mode === 'adult');
    document.getElementById('modeKid')?.classList.toggle('active', mode === 'kid');
    App.showToast(mode === 'kid' ? '👶 孩子模式：热量更低，菜谱更清淡' : '🧑 大人模式');
  }

  // ── ISO week key ─────────────────────────────────────
  function _weekKey(date) {
    const d = new Date(date);
    d.setHours(0,0,0,0);
    d.setDate(d.getDate() + 3 - ((d.getDay()+6)%7));
    const w1 = new Date(d.getFullYear(),0,4);
    const wn = 1 + Math.round(((d-w1)/86400000 - 3 + (w1.getDay()+6)%7)/7);
    return `${d.getFullYear()}-W${String(wn).padStart(2,'0')}`;
  }

  function _shuffle(arr) {
    const a=[...arr];
    for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
    return a;
  }

  // ── Auto generate ────────────────────────────────────
  // BMI・モードに基づいて週間プランを自動生成 / 根据 BMI 和模式自动生成周计划
  function autoGenerate() {
    const recipes = State.getRecipes();
    if (recipes.length === 0) { App.showToast('请先添加菜谱！'); return; }

    const { user } = State.get();
    const bmi = user.weight && user.height ? user.weight/((user.height/100)**2) : 22;
    const gender = user.gender || 'male';
    const targetKcal = TARGETS[_mode][gender];

    // For kids mode: prefer lower calorie + vegetarian/balanced
    // 子供モード: 低カロリー + 野菜中心 / 孩子模式：优先低热量+蔬菜
    let pool = recipes;
    if (_mode === 'kid') {
      const light = recipes.filter(r => (r.kcal||500) < 450);
      if (light.length >= 3) pool = light;
    } else if (bmi > 24.9) {
      const healthy = recipes.filter(r => { const t=r.tags||[]; return t.includes('low-fat')||t.includes('high-protein')||t.includes('low-carb'); });
      if (healthy.length >= 3) pool = healthy;
    }

    const weekKey = _weekKey(new Date());
    const plan = {};
    DAYS.forEach(day => {
      const shuffled = _shuffle(pool);
      plan[day] = MEAL_SLOTS.map((slot, i) => {
        if (slot === 'breakfast') {
          const light = pool.filter(r => (r.kcal||500) < 450);
          const pick = light.length > 0 ? light[Math.floor(Math.random()*light.length)] : shuffled[0];
          return pick?.id || null;
        }
        return shuffled[i % shuffled.length]?.id || null;
      });
    });

    // Update target kcal in state
    State.updateSettings({ targetKcal });
    State.setWeekPlan(weekKey, plan);
    render();
    App.showToast(`✅ 已生成本周菜单（${_mode==='kid'?'孩子':'大人'}，目标 ${targetKcal} kcal/天）`);
  }

  // ── Render weekly grid ───────────────────────────────
  function render() {
    const el = document.getElementById('weeklyGrid');
    if (!el) return;
    const weekKey = _weekKey(new Date());
    const plan    = State.getWeekPlan(weekKey);
    const recipes = State.getRecipes();

    el.innerHTML = DAYS.map((day, di) => {
      const meals = plan[day] || [null,null,null];
      const mealCards = MEAL_SLOTS.map((slot, si) => {
        const r = meals[si] ? recipes.find(x=>x.id===meals[si]) : null;
        return `
          <div class="week-meal">
            <span class="week-meal-label">${MEAL_LABELS[si]}</span>
            <span class="week-meal-name">${r?r.name:'—'}</span>
            <span class="week-meal-kcal">${r?r.kcal+' kcal':''}</span>
            <button class="week-meal-btn" onclick="Planner.swapMeal('${day}',${si})">换一个</button>
          </div>`;
      }).join('');
      return `
        <div class="week-day-card">
          <div class="week-day-label">${I18n.get(DAY_KEYS[di])}</div>
          <div class="week-meals">${mealCards}</div>
        </div>`;
    }).join('');

    renderEmailRows();
  }

  function swapMeal(day, slotIdx) {
    const weekKey = _weekKey(new Date());
    const plan    = State.getWeekPlan(weekKey);
    const recipes = State.getRecipes();
    if (!recipes.length) return;
    const current = plan[day]?.[slotIdx];
    const others  = recipes.filter(r=>r.id!==current);
    const next    = others[Math.floor(Math.random()*others.length)];
    if (!plan[day]) plan[day]=[null,null,null];
    plan[day][slotIdx] = next?.id || null;
    State.setWeekPlan(weekKey, plan);
    render();
  }

  // ── Multi-email rows ─────────────────────────────────
  // 複数メール行 / 多邮箱地址行
  function renderEmailRows() {
    const el = document.getElementById('emailRows');
    if (!el) return;
    // Sync from state if available
    if (_emails.length === 1 && !_emails[0]) {
      const saved = State.get().settings.emailAddresses;
      if (saved?.length) _emails = [...saved];
      else if (State.get().user.email) _emails = [State.get().user.email];
    }
    el.innerHTML = _emails.map((email, i) => `
      <div class="email-row dynamic-row">
        <input class="inp" type="email" placeholder="email@example.com"
               value="${email}" oninput="Planner._setEmail(${i}, this.value)"/>
        <button class="row-del-btn" onclick="Planner.removeEmailRow(${i})" title="删除">−</button>
      </div>`).join('');
  }

  function addEmailRow()        { _emails.push(''); renderEmailRows(); }
  function removeEmailRow(i)    { if(_emails.length>1) _emails.splice(i,1); renderEmailRows(); }
  function _setEmail(i, v)      { _emails[i]=v; State.updateSettings({ emailAddresses: [..._emails] }); }

  // ── Send to all emails ───────────────────────────────
  function sendEmail() {
    const validEmails = _emails.filter(e => e.includes('@'));
    if (!validEmails.length) { App.showToast(I18n.get('plan_no_email')); return; }
    if (typeof emailjs === 'undefined') { App.showToast('EmailJS 未加载'); return; }

    const { settings } = State.get();
    const weekKey = _weekKey(new Date());
    const plan    = State.getWeekPlan(weekKey);
    const recipes = State.getRecipes();

    const lines = DAYS.map((day, di) => {
      const meals = (plan[day]||[]).map((id,si) => {
        const r = id ? recipes.find(x=>x.id===id) : null;
        return `  ${MEAL_LABELS[si]} ${r?`${r.name}(${r.kcal}kcal)`:'—'}`;
      }).join('\n');
      return `${I18n.get(DAY_KEYS[di])}\n${meals}`;
    }).join('\n\n');

    const modeLabel = _mode==='kid' ? '👶 孩子菜单' : '🧑 大人菜单';
    let sentCount = 0;

    validEmails.forEach(toEmail => {
      emailjs.send(
        settings.emailjsServiceId || 'service_id',
        settings.emailjsTemplateId || 'template_id',
        { to_email: toEmail, subject:`Happy Meal ${modeLabel} ${weekKey}`, message: lines }
      ).then(() => {
        sentCount++;
        if (sentCount === validEmails.length) App.showToast(`📧 已发送到 ${sentCount} 个邮箱`);
      }).catch(err => App.showToast('发送失败: ' + err.text));
    });
  }

  // ── Sub-tab switching ────────────────────────────────
  // サブタブの切り替え / 子 Tab 切换
  function showSub(sub) {
    ['week','history','dining'].forEach(s => {
      document.getElementById(`subPlan-${s}`)?.classList.toggle('active', s===sub);
      document.getElementById(`planPanel-${s}`)?.classList.toggle('hidden', s!==sub);
    });
    if (sub==='history') renderHistory();
    if (sub==='dining')  DiningOut.init();
  }

  // ── History ──────────────────────────────────────────
  // 過去の週間プランを表示 / 显示历史周菜单列表
  function renderHistory() {
    const el = document.getElementById('historyList');
    if (!el) return;
    const allPlans = State.get().weeklyPlan || {};
    const keys = Object.keys(allPlans).sort().reverse();  // newest first

    if (!keys.length) {
      el.innerHTML = `<p class="placeholder-text">还没有历史菜单，先生成本周菜单吧！</p>`;
      return;
    }
    el.innerHTML = keys.map(k => `
      <div class="history-item" onclick="Planner.openHistory('${k}')">
        <span class="history-week">📅 ${k}</span>
        <span class="history-arrow">›</span>
      </div>`).join('');
  }

  function openHistory(weekKey) {
    const plan    = State.get().weeklyPlan[weekKey] || {};
    const recipes = State.getRecipes ? State.getRecipes() : State.get().recipes || [];
    const titleEl = document.getElementById('historyDetailTitle');
    const gridEl  = document.getElementById('historyDetailGrid');
    if (!gridEl) return;
    if (titleEl) titleEl.textContent = `📅 ${weekKey}`;

    gridEl.innerHTML = DAYS.map((day, di) => {
      const meals = plan[day] || [null,null,null];
      const mealCards = MEAL_SLOTS.map((_, si) => {
        const r = meals[si] ? recipes.find(x=>x.id===meals[si]) : null;
        return `
          <div class="week-meal">
            <span class="week-meal-label">${MEAL_LABELS[si]}</span>
            <span class="week-meal-name">${r?r.name:'—'}</span>
            <span class="week-meal-kcal">${r?r.kcal+' kcal':''}</span>
          </div>`;
      }).join('');
      return `
        <div class="week-day-card">
          <div class="week-day-label">${I18n.get(DAY_KEYS[di])}</div>
          <div class="week-meals">${mealCards}</div>
        </div>`;
    }).join('');

    document.getElementById('historyList')?.classList.add('hidden');
    document.getElementById('historyDetail')?.classList.remove('hidden');
  }

  function closeHistory() {
    document.getElementById('historyDetail')?.classList.add('hidden');
    document.getElementById('historyList')?.classList.remove('hidden');
  }

  function init() {
    render();
    renderEmailRows();
  }

  return { autoGenerate, render, swapMeal, sendEmail, setMode,
           addEmailRow, removeEmailRow, renderEmailRows, _setEmail,
           showSub, renderHistory, openHistory, closeHistory, init };
})();
