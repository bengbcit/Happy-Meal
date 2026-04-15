// motivate.js — Daily motivational quotes, language-aware
// 毎日の励ましメッセージ（言語対応） / 每日鼓励语，跟随语言实时切换

const Motivate = (() => {
  // Quote bank: 14 quotes × 3 languages, rotates by day of year
  // 14句×3言語、年間通算日でローテーション / 14句×3语言，按年内天数轮换
  const QUOTES = {
    zh: [
      '💪 每减少 500 大卡，就离目标更近一步！',
      '🥗 今天吃得好，明天身材好。',
      '🚶 运动不需要很大，一步一步来就对了。',
      '🧘 健康不是目的地，是一种生活方式。',
      '🥦 蔬菜是最好的药，多吃没有坏处。',
      '💧 喝够水，代谢快，减肥更容易。',
      '🌅 新的一天，新的机会，把握今天的饮食！',
      '🏆 坚持 21 天，好习惯就成了本能。',
      '🍳 自己做饭，最健康，最省钱。',
      '😴 睡好觉，皮质醇低，肚子的赘肉少一点。',
      '🎯 今日目标：蛋白质摄入要充足！',
      '🌿 少加工食品，多天然食物，简单有效。',
      '📊 记录你吃的，就是在管理你的身体。',
      '✨ 你已经比昨天的自己更努力了，继续！',
    ],
    en: [
      '💪 Every 500 kcal deficit gets you closer to your goal!',
      '🥗 Eat well today, feel great tomorrow.',
      '🚶 No workout is too small — every step counts.',
      '🧘 Health is not a destination, it\'s a lifestyle.',
      '🥦 Vegetables are nature\'s best medicine.',
      '💧 Stay hydrated — it speeds up your metabolism.',
      '🌅 New day, new chance — make your meals count!',
      '🏆 Stick with it for 21 days and it becomes habit.',
      '🍳 Home-cooked meals are the healthiest choice.',
      '😴 Good sleep keeps cortisol low and belly fat away.',
      '🎯 Today\'s goal: hit your protein target!',
      '🌿 Less processed, more natural — simple and effective.',
      '📊 Tracking what you eat is managing your body.',
      '✨ You\'re already more committed than yesterday — keep going!',
    ],
    ja: [
      '💪 500kcalの赤字が、目標への一歩！',
      '🥗 今日の食事が、明日の体を作る。',
      '🚶 どんな小さな運動も無駄じゃない。一歩ずつ。',
      '🧘 健康はゴールじゃなく、ライフスタイル。',
      '🥦 野菜は最高のクスリ。たくさん食べよう。',
      '💧 水分補給で代謝アップ。ダイエット加速！',
      '🌅 新しい一日、新しいチャンス。今日の食事を大切に！',
      '🏆 21日続ければ、習慣になる。',
      '🍳 手料理が一番ヘルシーで節約にもなる。',
      '😴 よく眠るとコルチゾールが下がり、お腹の脂肪も減る。',
      '🎯 今日の目標：タンパク質をしっかり摂ろう！',
      '🌿 加工食品を減らし、自然食品を増やすだけで効果あり。',
      '📊 食事を記録することが、体を管理すること。',
      '✨ 昨日よりも頑張っているあなたを応援してます！',
    ],
  };

  // Get today's quote index (0-13) based on day of year
  // 年間通算日からインデックスを取得 / 根据年内天数获取索引
  function _todayIdx() {
    const now  = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff  = now - start;
    const day   = Math.floor(diff / 86400000);
    return day % QUOTES.zh.length;
  }

  // Render quote to dashboard card
  // ダッシュボードカードに引用を表示 / 渲染鼓励语到主页卡片
  function render() {
    const el = document.getElementById('motivateText');
    if (!el) return;
    const lang  = I18n.current();
    const pool  = QUOTES[lang] || QUOTES.zh;
    el.textContent = pool[_todayIdx()];
  }

  // Called by I18n.set() when language changes
  // 言語変更時に I18n.set() から呼び出される / 语言切换时由 I18n.set() 调用
  function onLangChange() { render(); }

  return { render, onLangChange };
})();
