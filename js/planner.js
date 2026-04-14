// planner.js — Weekly meal plan generation & email
// 週間献立生成・メール送信 / 每周菜单自动生成与邮件发送

const Planner = (() => {
  const DAYS = ['mon','tue','wed','thu','fri','sat','sun'];
  const DAY_KEYS = ['day_mon','day_tue','day_wed','day_thu','day_fri','day_sat','day_sun'];
  const MEAL_SLOTS = ['breakfast','lunch','dinner'];
  const MEAL_LABELS = ['🌅','☀️','🌙'];

  // Get ISO week string like "2025-W15"
  // ISO週文字列を取得 / 获取 ISO 周字符串
  function _weekKey(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const week1 = new Date(d.getFullYear(), 0, 4);
    const weekNum = 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    return `${d.getFullYear()}-W${String(weekNum).padStart(2,'0')}`;
  }

  // Shuffle array (Fisher-Yates)
  // 配列をシャッフル / 打乱数组
  function _shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Auto-generate weekly plan based on BMI & recipe tags
  // BMIとレシピタグに基づいて週間プランを自動生成 / 根据 BMI 和菜谱标签自动生成周菜单
  function autoGenerate() {
    const recipes = State.getRecipes();
    if (recipes.length === 0) {
      App.showToast('请先添加菜谱！');
      return;
    }

    const { user, settings } = State.get();
    const bmi = user.weight / ((user.height / 100) ** 2) || 22;

    // Select preferred recipe pool by BMI
    // BMIでレシピプールを選択 / 根据 BMI 选择菜谱池
    let pool = recipes;
    if (bmi > 24.9) {
      // Prefer low-fat + high-protein + low-carb
      const pref = recipes.filter(r => {
        const t = r.tags || [];
        return t.includes('low-fat') || t.includes('high-protein') || t.includes('low-carb');
      });
      if (pref.length >= 3) pool = pref;
    }

    const weekKey = _weekKey(new Date());
    const plan = {};

    DAYS.forEach(day => {
      const shuffled = _shuffle(pool);
      plan[day] = MEAL_SLOTS.map((slot, i) => {
        // Try to pick a recipe with appropriate tags per meal
        // 食事ごとに適切なタグのレシピを選ぶ / 每餐选择合适标签的菜谱
        let r = shuffled[i % shuffled.length];
        if (slot === 'breakfast') {
          // Breakfast: lighter (< 500 kcal preferred)
          const light = pool.filter(x => (x.kcal || 500) < 500);
          r = light.length > 0 ? light[Math.floor(Math.random() * light.length)] : r;
        }
        return r ? r.id : null;
      });
    });

    State.setWeekPlan(weekKey, plan);
    render();
  }

  // Render the weekly grid
  // 週間グリッドをレンダリング / 渲染周菜单网格
  function render() {
    const el = document.getElementById('weeklyGrid');
    if (!el) return;

    const weekKey = _weekKey(new Date());
    const plan = State.getWeekPlan(weekKey);
    const recipes = State.getRecipes();

    el.innerHTML = DAYS.map((day, di) => {
      const meals = plan[day] || [null, null, null];
      const mealCards = MEAL_SLOTS.map((slot, si) => {
        const rId = meals[si];
        const r = rId ? recipes.find(x => x.id === rId) : null;
        return `
          <div class="week-meal">
            <span class="week-meal-label">${MEAL_LABELS[si]}</span>
            <span class="week-meal-name">${r ? r.name : '—'}</span>
            <span class="week-meal-kcal">${r ? r.kcal + ' kcal' : ''}</span>
            <button class="week-meal-btn" onclick="Planner.swapMeal('${day}',${si})">换一个</button>
          </div>`;
      }).join('');

      return `
        <div class="week-day-card">
          <div class="week-day-label">${I18n.get(DAY_KEYS[di])}</div>
          <div class="week-meals">${mealCards}</div>
        </div>`;
    }).join('');
  }

  // Swap a single meal slot
  // 単一の食事スロットを交換 / 替换单个餐食
  function swapMeal(day, slotIdx) {
    const weekKey = _weekKey(new Date());
    const plan = State.getWeekPlan(weekKey);
    const recipes = State.getRecipes();
    if (recipes.length === 0) return;
    const current = plan[day]?.[slotIdx];
    const others = recipes.filter(r => r.id !== current);
    const next = others[Math.floor(Math.random() * others.length)];
    if (!plan[day]) plan[day] = [null, null, null];
    plan[day][slotIdx] = next?.id || null;
    State.setWeekPlan(weekKey, plan);
    render();
  }

  // Send weekly plan via EmailJS
  // EmailJSで週間プランをメール送信 / 通过 EmailJS 发送周菜单
  function sendEmail() {
    const { settings, user } = State.get();
    const email = settings.emailAddress || user.email;
    if (!email) { App.showToast(I18n.get('plan_no_email')); return; }
    if (typeof emailjs === 'undefined') { App.showToast('EmailJS 未加载'); return; }

    const weekKey = _weekKey(new Date());
    const plan = State.getWeekPlan(weekKey);
    const recipes = State.getRecipes();

    // Build plain text summary
    // プレーンテキストのサマリーを作成 / 构建纯文本摘要
    const lines = DAYS.map((day, di) => {
      const meals = (plan[day] || []).map((id, si) => {
        const r = id ? recipes.find(x => x.id === id) : null;
        return `  ${MEAL_LABELS[si]} ${r ? r.name + ` (${r.kcal}kcal)` : '—'}`;
      }).join('\n');
      return `${I18n.get(DAY_KEYS[di])}\n${meals}`;
    }).join('\n\n');

    emailjs.send(
      settings.emailjsServiceId || 'service_id',
      settings.emailjsTemplateId || 'template_id',
      { to_email: email, subject: `Happy Meal 本周菜单 ${weekKey}`, message: lines }
    ).then(() => App.showToast(I18n.get('plan_sent')))
     .catch(err => App.showToast('发送失败: ' + err.text));
  }

  function init() { render(); }

  return { autoGenerate, render, swapMeal, sendEmail, init };
})();
