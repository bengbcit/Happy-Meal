// bmi.js — BMI calculation, classification, calorie target & recipe recommendation
// BMI計算・分類・カロリー目標・レシピ推薦 / BMI计算、分级、热量目标与菜谱推荐

const BMI = (() => {
  // ── BMI classification thresholds (WHO standard)
  // WHO基準のBMI分類 / WHO 标准分级
  const THRESHOLDS = { thin: 18.5, normal: 24.9, overweight: 27.9 };

  // Calculate BMR using Mifflin-St Jeor equation
  // Mifflin-St Jeor式でBMRを計算 / 使用 Mifflin-St Jeor 公式计算基础代谢
  function _bmr(gender, age, height, weight) {
    // Male:   10*W + 6.25*H - 5*A + 5
    // Female: 10*W + 6.25*H - 5*A - 161
    const base = 10 * weight + 6.25 * height - 5 * age;
    return gender === 'male' ? base + 5 : base - 161;
  }

  // Estimate TDEE with sedentary activity level (×1.2)
  // 座り仕事レベルでTDEEを計算 / 估算久坐活动水平的 TDEE
  function _tdee(gender, age, height, weight) {
    return Math.round(_bmr(gender, age, height, weight) * 1.2);
  }

  // Recommended intake = TDEE − deficit
  // 推奨摂取量 = TDEE − 不足分 / 建议摄入 = TDEE − 热量缺口
  function _targetKcal(gender, tdee) {
    const deficit = gender === 'male' ? 500 : 400;
    return Math.max(1200, tdee - deficit);
  }

  // Map BMI value to label key
  // BMI値をラベルキーにマッピング / 将 BMI 值映射到标签
  function _classify(bmi) {
    if (bmi < THRESHOLDS.thin)       return 'bmi_thin';
    if (bmi <= THRESHOLDS.normal)    return 'bmi_normal';
    if (bmi <= THRESHOLDS.overweight) return 'bmi_overweight';
    return 'bmi_obese';
  }

  // Recommend priority order: Protein > Carbs > Fat (based on today's gaps)
  // 推薦優先順位：タンパク質 > 炭水化物 > 脂質（今日の不足に基づく）/ 推荐优先：蛋白质>碳水>脂肪
  function _preferredTags(bmiVal, todayMacros) {
    const tags = [];

    // Calculate today's macro gaps vs targets
    // 今日の栄養素の不足量を計算 / 计算今日营养素与目标的差距
    const target = State.get().settings.targetKcal || 1800;
    const proteinTarget = (target * 0.30) / 4;  // 30% of kcal → grams
    const carbTarget    = (target * 0.40) / 4;
    const fatTarget     = (target * 0.30) / 9;

    let proteinGap = proteinTarget, carbGap = carbTarget, fatGap = fatTarget;
    if (todayMacros) {
      proteinGap = Math.max(0, proteinTarget - todayMacros.protein);
      carbGap    = Math.max(0, carbTarget    - todayMacros.carbs);
      fatGap     = Math.max(0, fatTarget     - todayMacros.fat);
    }

    // Sort gaps: protein > carbs > fat (fixed priority)
    // 固定優先順位：タンパク質 > 炭水化物 > 脂質 / 固定优先级：蛋白质 > 碳水 > 脂肪
    // If protein is most needed → recommend high-protein recipes
    if (proteinGap > 0) tags.push('high-protein');

    // BMI modifier
    if (bmiVal > THRESHOLDS.normal) {
      // Overweight → prioritize low-fat and low-carb even if carb gap exists
      tags.push('low-fat');
      if (carbGap <= 0) tags.push('low-carb');
    } else if (bmiVal < THRESHOLDS.thin) {
      if (carbGap > 0) tags.push('high-carb');
    } else {
      tags.push('low-fat');
    }

    return [...new Set(tags)];  // deduplicate
  }

  // ── Public render ────────────────────────────────────
  function calc() {
    const gender = document.getElementById('bmiGender')?.value || 'male';
    const age    = parseFloat(document.getElementById('bmiAge')?.value) || 0;
    const height = parseFloat(document.getElementById('bmiHeight')?.value) || 0;
    const weight = parseFloat(document.getElementById('bmiWeight')?.value) || 0;

    if (!age || !height || !weight) return;

    const bmiVal = weight / ((height / 100) ** 2);
    const tdee   = _tdee(gender, age, height, weight);
    const target = _targetKcal(gender, tdee);

    // Persist to state
    // 状態に保存 / 保存到状态
    State.updateUser({ gender, age, height, weight });
    State.updateSettings({ targetKcal: target });

    // Render BMI result card
    // BMI結果カードをレンダリング / 渲染 BMI 结果卡片
    const resultEl = document.getElementById('bmiResult');
    const scoreEl  = document.getElementById('bmiScore');
    const labelEl  = document.getElementById('bmiLabel');
    const targetEl = document.getElementById('bmiTarget');
    const barFill  = document.getElementById('bmiBarFill');
    const targetKcalEl = document.getElementById('targetKcal');

    if (!resultEl) return;

    scoreEl.textContent = bmiVal.toFixed(1);
    labelEl.textContent = I18n.get(_classify(bmiVal));
    // Color by classification
    const colors = {
      bmi_thin: '#3498db', bmi_normal: '#2ecc71',
      bmi_overweight: '#f39c12', bmi_obese: '#e74c3c'
    };
    scoreEl.style.color = colors[_classify(bmiVal)] || '#2ecc71';

    const genderKey = gender === 'male' ? 'bmi_target_male' : 'bmi_target_female';
    targetEl.textContent = I18n.get(genderKey, { n: target });

    // BMI bar position (range 15–40 → 0%–100%)
    // BMIバーの位置 / BMI 进度条位置
    const pct = Math.min(100, Math.max(0, ((bmiVal - 15) / 25) * 100));
    barFill.style.left = pct + '%';

    resultEl.classList.remove('hidden');

    // Update target kcal in summary card
    if (targetKcalEl) targetKcalEl.textContent = target;

    // Refresh recommendations
    renderRecommend(bmiVal);
  }

  // Render recommended recipes on dashboard with priority label
  // 優先度ラベル付きでダッシュボードにおすすめレシピをレンダリング / 带优先级标签渲染主页推荐
  function renderRecommend(bmiVal) {
    const el = document.getElementById('recommendList');
    if (!el) return;

    const todayMacros = Tracker ? Tracker.getTodayMacros() : null;
    const preferred   = _preferredTags(bmiVal, todayMacros);
    const all         = State.getRecipes();

    // Score by priority: protein match scores 3, others 1
    // 優先度スコアリング：タンパク質マッチは3点、その他は1点 / 优先级评分：蛋白质匹配3分，其他1分
    const scored = all.map(r => {
      const tags  = r.tags || [];
      let score   = 0;
      if (tags.includes('high-protein')) score += 3;   // protein first
      if (preferred.some(t => tags.includes(t))) score += 1;
      // Penalize high-fat if overweight
      if (bmiVal > THRESHOLDS.normal && tags.includes('high-carb')) score -= 1;
      return { ...r, _score: score, _matched: preferred.filter(t=>tags.includes(t)) };
    }).sort((a, b) => b._score - a._score).slice(0, 5);

    if (scored.length === 0) {
      el.innerHTML = `<p class="placeholder-text">${I18n.get('no_recipes')}</p>`;
      return;
    }

    // Show why each recipe is recommended
    // 各レシピの推薦理由を表示 / 显示每个菜谱被推荐的原因
    el.innerHTML = scored.map(r => {
      const reasonIcons = (r._matched||[]).map(t => ({
        'high-protein':'🥩','low-fat':'🥗','low-carb':'🥦','high-carb':'🍚','vegetarian':'🌿'
      }[t]||'')).join('');
      return `
        <div class="recipe-small-row" onclick="RecipeModal.open('${r.id}')">
          <span class="recipe-small-name">${r.name}</span>
          <span style="font-size:.8rem">${reasonIcons}</span>
          <span class="recipe-small-kcal">${r.kcal||'—'} ${I18n.get('kcal')}</span>
        </div>`;
    }).join('');

    // Show priority hint
    // 優先度ヒントを表示 / 显示优先级提示
    const hint = document.createElement('p');
    hint.className = 'text-muted';
    hint.style.fontSize = '.75rem';
    hint.style.marginTop = '6px';
    hint.textContent = '推荐依据：蛋白质 > 碳水 > 脂肪';
    el.appendChild(hint);
  }

  // Log today's weight and refresh chart + BMI
  // 今日の体重を記録してチャートとBMIを更新 / 记录今日体重并刷新图表和BMI
  function logWeight() {
    const input = document.getElementById('weightLogInput');
    if (!input) return;
    const w = parseFloat(input.value);
    if (!w || w < 20 || w > 500) {
      App && App.toast && App.toast(I18n.get('invalid_weight') || '请输入有效体重 (20–500 kg)', 'warn');
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    State.addWeightEntry(today, w);

    // Also update profile weight so BMI recalculates from latest entry
    const bmiWeightEl = document.getElementById('bmiWeight');
    if (bmiWeightEl) { bmiWeightEl.value = w; }
    State.updateUser({ weight: w });
    calc();

    if (typeof Charts !== 'undefined') Charts.renderWeightChart();
    App && App.toast && App.toast('✅ 体重已记录', 'success');

    // Update last-logged display
    const lastEl = document.getElementById('weightLogLast');
    if (lastEl) lastEl.textContent = `上次记录：${today}  ${w} kg`;
  }

  // Init: restore saved BMI inputs
  // 初期化：保存されたBMI入力を復元 / 初始化：恢复保存的 BMI 输入
  function init() {
    const u = State.get().user;
    if (u.gender)  document.getElementById('bmiGender') && (document.getElementById('bmiGender').value = u.gender);
    if (u.age)     document.getElementById('bmiAge') && (document.getElementById('bmiAge').value = u.age);
    if (u.height)  document.getElementById('bmiHeight') && (document.getElementById('bmiHeight').value = u.height);
    if (u.weight)  document.getElementById('bmiWeight') && (document.getElementById('bmiWeight').value = u.weight);
    if (u.age && u.height && u.weight) calc();

    // Pre-fill today's weight from log if available
    const log = State.getWeightLog();
    const today = new Date().toISOString().slice(0, 10);
    const todayEntry = log.find(e => e.date === today);
    const lastEntry  = log[log.length - 1];
    const weightLogInput = document.getElementById('weightLogInput');
    if (weightLogInput) {
      if (todayEntry) weightLogInput.value = todayEntry.weight;
      else if (lastEntry) weightLogInput.value = lastEntry.weight;
    }
    const lastEl = document.getElementById('weightLogLast');
    if (lastEl && lastEntry) {
      lastEl.textContent = `上次记录：${lastEntry.date}  ${lastEntry.weight} kg`;
    }

    if (typeof Charts !== 'undefined') Charts.renderWeightChart();
  }

  return { calc, renderRecommend, init, logWeight };
})();
