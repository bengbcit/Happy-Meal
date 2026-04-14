// i18n.js — Internationalization: zh / en / ja
// 多言語パック / 多语言包 / Language pack

const I18n = (() => {
  // ── Translation strings ──────────────────────────────
  const LANGS = {
    zh: {
      app_name: 'Happy Meal',
      app_sub: '健康饮食 · 轻松减肥',
      btn_login: '登录',
      btn_register: '注册',
      btn_local: '👤 以本地模式进入',
      btn_logout: '退出登录',
      btn_save: '💾 保存菜谱',
      btn_save_recipe: '💾 保存菜谱',
      btn_cancel: '取消',
      btn_parse: '🔍 解析菜谱',
      btn_auto_plan: '✨ 自动生成',
      btn_email_plan: '📧 发送到邮箱',
      ph_email: '邮箱',
      ph_pwd: '密码',
      ph_url: 'https://... 菜谱网址',
      ph_rname: '菜名',
      ph_kcal: '热量(kcal)',
      ph_protein: '蛋白质(g)',
      ph_carbs: '碳水(g)',
      ph_fat: '脂肪(g)',
      ph_ingredients: '食材（每行一个，如：鸡胸肉 200g）',
      ph_steps: '步骤（每行一步）',
      ph_search: '搜索...',
      tab_home: '主页',
      tab_recipes: '菜谱',
      tab_tracker: '追踪',
      tab_planner: '周菜单',
      tab_indulgence: '零食/酒',
      bmi_title: '📏 我的 BMI',
      lbl_gender: '性别',
      lbl_age: '年龄',
      lbl_height: '身高 (cm)',
      lbl_weight: '体重 (kg)',
      opt_male: '男',
      opt_female: '女',
      today_summary: '📋 今日摘要',
      kcal: '千卡',
      target_kcal: '目标热量：',
      recommend_title: '💡 今日推荐菜谱',
      recommend_hint: '填写 BMI 信息后自动推荐',
      add_recipe: '➕ 添加菜谱',
      from_url: '从 URL 导入',
      manual_input: '手动录入',
      filter_all: '全部',
      nutrition_breakdown: '📊 营养分布',
      weekly_kcal: '📈 近7日热量',
      weekly_plan: '📅 本周菜单',
      indulgence_title: '🍰 甜品 / 饮料 / 酒精热量',
      indulgence_desc: '快速查询高热量零食，添加到今日记录',
      meal_breakfast: '🌅 早餐',
      meal_lunch: '☀️ 午餐',
      meal_dinner: '🌙 晚餐',
      meal_snack: '🍎 零食',
      add_food: '+ 添加食物',
      day_mon: '周一', day_tue: '周二', day_wed: '周三',
      day_thu: '周四', day_fri: '周五', day_sat: '周六', day_sun: '周日',
      bmi_thin: '偏瘦', bmi_normal: '正常', bmi_overweight: '偏重', bmi_obese: '肥胖',
      bmi_target_male: '男性建议每日摄入约 {n} 千卡（制造热量缺口）',
      bmi_target_female: '女性建议每日摄入约 {n} 千卡（制造热量缺口）',
      warn_sugar: '⚠️ 高糖！这相当于 {n} 颗方糖',
      warn_kcal: '⚠️ 这份零食 = {n} 碗白饭的热量！',
      no_recipes: '还没有菜谱，添加第一个吧！',
      protein_lbl: '蛋白质', carb_lbl: '碳水', fat_lbl: '脂肪',
      ingredients_lbl: '食材', steps_lbl: '步骤', nutrition_lbl: '营养成分',
      add_to_meal: '➕ 加入今日餐食',
      plan_sent: '本周菜单已发送到邮箱！',
      plan_no_email: '请先在设置中绑定邮箱',
      parse_loading: '🔍 正在解析菜谱...',
      parse_error: '解析失败，请手动录入',
      saved_ok: '✅ 已保存！',
      delete_confirm: '确定删除这个菜谱？',
    },

    en: {
      app_name: 'Happy Meal',
      app_sub: 'Eat Smart · Lose Weight',
      btn_login: 'Login',
      btn_register: 'Register',
      btn_local: '👤 Enter as Guest',
      btn_logout: 'Logout',
      btn_save: '💾 Save Recipe',
      btn_save_recipe: '💾 Save Recipe',
      btn_cancel: 'Cancel',
      btn_parse: '🔍 Parse Recipe',
      btn_auto_plan: '✨ Auto Generate',
      btn_email_plan: '📧 Send to Email',
      ph_email: 'Email',
      ph_pwd: 'Password',
      ph_url: 'https://... Recipe URL',
      ph_rname: 'Recipe name',
      ph_kcal: 'Calories (kcal)',
      ph_protein: 'Protein (g)',
      ph_carbs: 'Carbs (g)',
      ph_fat: 'Fat (g)',
      ph_ingredients: 'Ingredients (one per line, e.g. Chicken breast 200g)',
      ph_steps: 'Steps (one per line)',
      ph_search: 'Search...',
      tab_home: 'Home',
      tab_recipes: 'Recipes',
      tab_tracker: 'Tracker',
      tab_planner: 'Planner',
      tab_indulgence: 'Treats',
      bmi_title: '📏 My BMI',
      lbl_gender: 'Gender',
      lbl_age: 'Age',
      lbl_height: 'Height (cm)',
      lbl_weight: 'Weight (kg)',
      opt_male: 'Male',
      opt_female: 'Female',
      today_summary: '📋 Today\'s Summary',
      kcal: 'kcal',
      target_kcal: 'Target: ',
      recommend_title: '💡 Recommended Recipes',
      recommend_hint: 'Enter BMI info to get recommendations',
      add_recipe: '➕ Add Recipe',
      from_url: 'Import from URL',
      manual_input: 'Manual Entry',
      filter_all: 'All',
      nutrition_breakdown: '📊 Nutrition Breakdown',
      weekly_kcal: '📈 7-Day Calories',
      weekly_plan: '📅 Weekly Meal Plan',
      indulgence_title: '🍰 Sweets / Drinks / Alcohol',
      indulgence_desc: 'Quick lookup for high-calorie treats',
      meal_breakfast: '🌅 Breakfast',
      meal_lunch: '☀️ Lunch',
      meal_dinner: '🌙 Dinner',
      meal_snack: '🍎 Snack',
      add_food: '+ Add Food',
      day_mon: 'Mon', day_tue: 'Tue', day_wed: 'Wed',
      day_thu: 'Thu', day_fri: 'Fri', day_sat: 'Sat', day_sun: 'Sun',
      bmi_thin: 'Underweight', bmi_normal: 'Normal', bmi_overweight: 'Overweight', bmi_obese: 'Obese',
      bmi_target_male: 'Recommended {n} kcal/day for males (calorie deficit)',
      bmi_target_female: 'Recommended {n} kcal/day for females (calorie deficit)',
      warn_sugar: '⚠️ High sugar! That\'s about {n} sugar cubes',
      warn_kcal: '⚠️ This treat = {n} bowls of rice in calories!',
      no_recipes: 'No recipes yet — add your first one!',
      protein_lbl: 'Protein', carb_lbl: 'Carbs', fat_lbl: 'Fat',
      ingredients_lbl: 'Ingredients', steps_lbl: 'Steps', nutrition_lbl: 'Nutrition',
      add_to_meal: '➕ Add to Today\'s Meal',
      plan_sent: 'Weekly plan sent to your email!',
      plan_no_email: 'Please add an email in settings first',
      parse_loading: '🔍 Parsing recipe...',
      parse_error: 'Parse failed, please enter manually',
      saved_ok: '✅ Saved!',
      delete_confirm: 'Delete this recipe?',
    },

    ja: {
      app_name: 'ハッピーミール',
      app_sub: 'ヘルシー食事 · ダイエットサポート',
      btn_login: 'ログイン',
      btn_register: '新規登録',
      btn_local: '👤 ゲストとして入る',
      btn_logout: 'ログアウト',
      btn_save: '💾 レシピを保存',
      btn_save_recipe: '💾 レシピを保存',
      btn_cancel: 'キャンセル',
      btn_parse: '🔍 レシピを解析',
      btn_auto_plan: '✨ 自動生成',
      btn_email_plan: '📧 メールで送信',
      ph_email: 'メールアドレス',
      ph_pwd: 'パスワード',
      ph_url: 'https://... レシピURL',
      ph_rname: 'レシピ名',
      ph_kcal: 'カロリー(kcal)',
      ph_protein: 'タンパク質(g)',
      ph_carbs: '炭水化物(g)',
      ph_fat: '脂質(g)',
      ph_ingredients: '食材（1行に1つ、例：鶏胸肉 200g）',
      ph_steps: '手順（1行に1ステップ）',
      ph_search: '検索...',
      tab_home: 'ホーム',
      tab_recipes: 'レシピ',
      tab_tracker: '記録',
      tab_planner: '週間プラン',
      tab_indulgence: 'スイーツ/お酒',
      bmi_title: '📏 私のBMI',
      lbl_gender: '性別',
      lbl_age: '年齢',
      lbl_height: '身長 (cm)',
      lbl_weight: '体重 (kg)',
      opt_male: '男性',
      opt_female: '女性',
      today_summary: '📋 今日のまとめ',
      kcal: 'kcal',
      target_kcal: '目標カロリー：',
      recommend_title: '💡 おすすめレシピ',
      recommend_hint: 'BMI情報を入力すると自動でおすすめします',
      add_recipe: '➕ レシピを追加',
      from_url: 'URLからインポート',
      manual_input: '手動入力',
      filter_all: 'すべて',
      nutrition_breakdown: '📊 栄養内訳',
      weekly_kcal: '📈 7日間のカロリー',
      weekly_plan: '📅 週間献立',
      indulgence_title: '🍰 スイーツ/ドリンク/アルコール',
      indulgence_desc: '高カロリーのおやつをサクッと検索',
      meal_breakfast: '🌅 朝食',
      meal_lunch: '☀️ 昼食',
      meal_dinner: '🌙 夕食',
      meal_snack: '🍎 おやつ',
      add_food: '+ 食品を追加',
      day_mon: '月曜', day_tue: '火曜', day_wed: '水曜',
      day_thu: '木曜', day_fri: '金曜', day_sat: '土曜', day_sun: '日曜',
      bmi_thin: '痩せ', bmi_normal: '普通', bmi_overweight: '過体重', bmi_obese: '肥満',
      bmi_target_male: '男性推奨摂取量：{n} kcal/日（カロリー不足）',
      bmi_target_female: '女性推奨摂取量：{n} kcal/日（カロリー不足）',
      warn_sugar: '⚠️ 高糖！角砂糖約{n}個分です',
      warn_kcal: '⚠️ このおやつ＝ご飯{n}杯分のカロリー！',
      no_recipes: 'レシピがまだありません。最初の1つを追加しましょう！',
      protein_lbl: 'タンパク質', carb_lbl: '炭水化物', fat_lbl: '脂質',
      ingredients_lbl: '食材', steps_lbl: '手順', nutrition_lbl: '栄養成分',
      add_to_meal: '➕ 今日の食事に追加',
      plan_sent: '週間プランをメールで送信しました！',
      plan_no_email: '設定でメールアドレスを登録してください',
      parse_loading: '🔍 レシピを解析中...',
      parse_error: '解析に失敗しました。手動で入力してください',
      saved_ok: '✅ 保存しました！',
      delete_confirm: 'このレシピを削除しますか？',
    }
  };

  let _lang = localStorage.getItem('hm_lang') || 'zh';

  // Apply translations to DOM
  // DOMに翻訳を適用 / 将翻訳应用到 DOM
  function _apply() {
    const t = LANGS[_lang] || LANGS.zh;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (t[key]) el.textContent = t[key];
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
      const key = el.getAttribute('data-i18n-ph');
      if (t[key]) el.placeholder = t[key];
    });
    // Update active lang button
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active',
        (btn.onclick + '').includes(`'${_lang}'`) ||
        (btn.textContent.toLowerCase() === _lang)
      );
    });
    document.documentElement.lang = _lang;
  }

  return {
    set(lang) {
      if (!LANGS[lang]) return;
      _lang = lang;
      localStorage.setItem('hm_lang', lang);
      _apply();
    },
    get(key, vars = {}) {
      const t = LANGS[_lang] || LANGS.zh;
      let str = t[key] || key;
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, v);
      });
      return str;
    },
    current() { return _lang; },
    init() {
      _apply();
    }
  };
})();
