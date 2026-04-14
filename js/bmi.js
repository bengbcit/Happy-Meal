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

  // Choose which recipe categories to recommend based on BMI + today's macros
  // BMIと今日の栄養素に基づいておすすめカテゴリを選択 / 根据 BMI 和当日营养素选择推荐分类
  function _preferredTags(bmiVal, todayMacros) {
    const tags = [];
    // Always prefer high-protein for satiety
    tags.push('high-protein');
    if (bmiVal > THRESHOLDS.normal) {
      // Overweight+ → low fat + low carb
      tags.push('low-fat', 'low-carb');
    } else if (bmiVal < THRESHOLDS.thin) {
      // Underweight → high carb for energy
      tags.push('high-carb');
    } else {
      tags.push('low-fat');
    }
    // If today already consumed high carbs (>60% ratio) → suggest low carb
    if (todayMacros && todayMacros.carbRatio > 0.6) {
      if (!tags.includes('low-carb')) tags.push('low-carb');
    }
    return tags;
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

  // Render recommended recipes on dashboard
  // ダッシュボードにおすすめレシピをレンダリング / 渲染主页推荐菜谱
  function renderRecommend(bmiVal) {
    const el = document.getElementById('recommendList');
    if (!el) return;

    const todayMacros = Tracker ? Tracker.getTodayMacros() : null;
    const preferred   = _preferredTags(bmiVal, todayMacros);
    const all         = State.getRecipes();

    // Score recipes by tag match count
    // タグ一致数でレシピをスコアリング / 按标签匹配数量对菜谱评分
    const scored = all.map(r => {
      const tags = r.tags || [];
      const score = preferred.filter(t => tags.includes(t)).length;
      return { ...r, _score: score };
    }).sort((a, b) => b._score - a._score).slice(0, 5);

    if (scored.length === 0) {
      el.innerHTML = `<p class="placeholder-text" data-i18n="no_recipes">${I18n.get('no_recipes')}</p>`;
      return;
    }

    el.innerHTML = scored.map(r => `
      <div class="recipe-small-row" onclick="RecipeModal.open('${r.id}')">
        <span class="recipe-small-name">${r.name}</span>
        <span class="recipe-small-kcal">${r.kcal || '—'} ${I18n.get('kcal')}</span>
      </div>
    `).join('');
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
  }

  return { calc, renderRecommend, init };
})();
