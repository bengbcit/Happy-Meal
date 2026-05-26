// indulgence.js — Desserts, drinks, alcohol calorie lookup & warning
// スイーツ・ドリンク・アルコールのカロリー検索・警告 / 甜品、饮料、酒精热量查询与警告

const Indulgence = (() => {
  // Built-in database of common treats — names & sizes in zh/en/ja
  // 一般的なおやつのデータベース / 常见零食内置数据库
  const DB = [
    // Desserts 甜品
    { id:'d1',  cat:'dessert', icon:'🧁',
      name: { zh:'奶油蛋糕',      en:'Cream Cake',          ja:'クリームケーキ' },
      size: { zh:'1片(100g)',     en:'1 slice (100g)',       ja:'1切れ(100g)' },
      kcal:350, sugar:30, rice:1.4 },
    { id:'d2',  cat:'dessert', icon:'🍰',
      name: { zh:'提拉米苏',       en:'Tiramisu',            ja:'ティラミス' },
      size: { zh:'1份(120g)',     en:'1 serving (120g)',     ja:'1人前(120g)' },
      kcal:400, sugar:28, rice:1.6 },
    { id:'d3',  cat:'dessert', icon:'🍩',
      name: { zh:'甜甜圈',         en:'Doughnut',            ja:'ドーナツ' },
      size: { zh:'1个(70g)',      en:'1 piece (70g)',        ja:'1個(70g)' },
      kcal:270, sugar:22, rice:1.1 },
    { id:'d4',  cat:'dessert', icon:'🍪',
      name: { zh:'巧克力曲奇',     en:'Chocolate Cookie',    ja:'チョコクッキー' },
      size: { zh:'2块(40g)',      en:'2 pieces (40g)',       ja:'2枚(40g)' },
      kcal:150, sugar:12, rice:0.6 },
    { id:'d5',  cat:'dessert', icon:'🍮',
      name: { zh:'焦糖布丁',       en:'Caramel Pudding',     ja:'キャラメルプリン' },
      size: { zh:'1个(100g)',     en:'1 cup (100g)',         ja:'1個(100g)' },
      kcal:180, sugar:20, rice:0.7 },
    { id:'d6',  cat:'dessert', icon:'🍫',
      name: { zh:'黑巧克力',       en:'Dark Chocolate',      ja:'ダークチョコレート' },
      size: { zh:'5格(30g)',      en:'5 squares (30g)',      ja:'5かけ(30g)' },
      kcal:170, sugar:10, rice:0.7 },
    { id:'d7',  cat:'dessert', icon:'🍦',
      name: { zh:'冰淇淋球',       en:'Ice Cream Scoop',     ja:'アイスクリーム' },
      size: { zh:'1球(65g)',      en:'1 scoop (65g)',        ja:'1球(65g)' },
      kcal:130, sugar:14, rice:0.5 },
    { id:'d8',  cat:'dessert', icon:'🧇',
      name: { zh:'华夫饼+枫糖浆', en:'Waffle + Maple Syrup', ja:'ワッフル+メープル' },
      size: { zh:'1份(150g)',     en:'1 serving (150g)',     ja:'1人前(150g)' },
      kcal:420, sugar:35, rice:1.7 },
    // Drinks 饮料
    { id:'k1',  cat:'drink',   icon:'🧋',
      name: { zh:'珍珠奶茶(全糖)', en:'Bubble Tea (full sugar)', ja:'タピオカミルクティー(フルシュガー)' },
      size: { zh:'1杯(500ml)',    en:'1 cup (500ml)',        ja:'1杯(500ml)' },
      kcal:480, sugar:52, rice:1.9 },
    { id:'k2',  cat:'drink',   icon:'🧋',
      name: { zh:'珍珠奶茶(半糖)', en:'Bubble Tea (half sugar)', ja:'タピオカミルクティー(ハーフシュガー)' },
      size: { zh:'1杯(500ml)',    en:'1 cup (500ml)',        ja:'1杯(500ml)' },
      kcal:340, sugar:34, rice:1.4 },
    { id:'k3',  cat:'drink',   icon:'🥤',
      name: { zh:'可乐',           en:'Cola',                ja:'コーラ' },
      size: { zh:'1罐(330ml)',    en:'1 can (330ml)',        ja:'1缶(330ml)' },
      kcal:140, sugar:35, rice:0.6 },
    { id:'k4',  cat:'drink',   icon:'☕',
      name: { zh:'拿铁咖啡',       en:'Latte',               ja:'カフェラテ' },
      size: { zh:'1杯(350ml)',    en:'1 cup (350ml)',        ja:'1杯(350ml)' },
      kcal:190, sugar:15, rice:0.8 },
    { id:'k5',  cat:'drink',   icon:'🥛',
      name: { zh:'全脂牛奶',       en:'Whole Milk',          ja:'全脂牛乳' },
      size: { zh:'1杯(250ml)',    en:'1 glass (250ml)',      ja:'1杯(250ml)' },
      kcal:150, sugar:12, rice:0.6 },
    { id:'k6',  cat:'drink',   icon:'🍵',
      name: { zh:'抹茶拿铁',       en:'Matcha Latte',        ja:'抹茶ラテ' },
      size: { zh:'1杯(350ml)',    en:'1 cup (350ml)',        ja:'1杯(350ml)' },
      kcal:240, sugar:22, rice:1.0 },
    { id:'k7',  cat:'drink',   icon:'🧃',
      name: { zh:'果汁(橙汁)',     en:'Orange Juice',        ja:'オレンジジュース' },
      size: { zh:'1杯(250ml)',    en:'1 glass (250ml)',      ja:'1杯(250ml)' },
      kcal:110, sugar:22, rice:0.4 },
    { id:'k8',  cat:'drink',   icon:'🥤',
      name: { zh:'运动饮料',       en:'Sports Drink',        ja:'スポーツドリンク' },
      size: { zh:'1瓶(500ml)',    en:'1 bottle (500ml)',     ja:'1本(500ml)' },
      kcal:80,  sugar:20, rice:0.3 },
    { id:'k9',  cat:'drink',   icon:'🥤',
      name: { zh:'星巴克摩卡',     en:'Starbucks Mocha',     ja:'スタバモカ' },
      size: { zh:'大杯(473ml)',   en:'Venti (473ml)',        ja:'Venti(473ml)' },
      kcal:370, sugar:38, rice:1.5 },
    // Alcohol 酒精
    { id:'a1',  cat:'alcohol', icon:'🍺',
      name: { zh:'啤酒(普通)',     en:'Beer (regular)',      ja:'ビール(レギュラー)' },
      size: { zh:'1罐(350ml)',    en:'1 can (350ml)',        ja:'1缶(350ml)' },
      kcal:145, sugar:11, rice:0.6 },
    { id:'a2',  cat:'alcohol', icon:'🍺',
      name: { zh:'精酿啤酒(IPA)', en:'Craft Beer (IPA)',    ja:'クラフトビール(IPA)' },
      size: { zh:'1罐(350ml)',    en:'1 can (350ml)',        ja:'1缶(350ml)' },
      kcal:210, sugar:15, rice:0.8 },
    { id:'a3',  cat:'alcohol', icon:'🍷',
      name: { zh:'红酒',           en:'Red Wine',            ja:'赤ワイン' },
      size: { zh:'1杯(150ml)',    en:'1 glass (150ml)',      ja:'1杯(150ml)' },
      kcal:125, sugar:4,  rice:0.5 },
    { id:'a4',  cat:'alcohol', icon:'🍸',
      name: { zh:'鸡尾酒(长岛冰茶)', en:'Cocktail (Long Island)', ja:'カクテル(ロングアイランド)' },
      size: { zh:'1杯(240ml)',    en:'1 glass (240ml)',      ja:'1杯(240ml)' },
      kcal:280, sugar:18, rice:1.1 },
    { id:'a5',  cat:'alcohol', icon:'🥂',
      name: { zh:'香槟',           en:'Champagne',           ja:'シャンパン' },
      size: { zh:'1杯(150ml)',    en:'1 glass (150ml)',      ja:'1杯(150ml)' },
      kcal:90,  sugar:6,  rice:0.4 },
    { id:'a6',  cat:'alcohol', icon:'🥃',
      name: { zh:'威士忌(纯饮)',  en:'Whisky (neat)',        ja:'ウイスキー(ストレート)' },
      size: { zh:'1杯(44ml)',     en:'1 shot (44ml)',        ja:'1杯(44ml)' },
      kcal:105, sugar:0,  rice:0.4 },
    { id:'a7',  cat:'alcohol', icon:'🍶',
      name: { zh:'日本酒(清酒)',  en:'Sake',                 ja:'日本酒(清酒)' },
      size: { zh:'1合(180ml)',    en:'1 cup (180ml)',        ja:'1合(180ml)' },
      kcal:190, sugar:8,  rice:0.8 },
    { id:'a8',  cat:'alcohol', icon:'🍹',
      name: { zh:'莫吉托',         en:'Mojito',              ja:'モヒート' },
      size: { zh:'1杯(240ml)',    en:'1 glass (240ml)',      ja:'1杯(240ml)' },
      kcal:220, sugar:20, rice:0.9 },
  ];

  // Helper: get localized field from a DB entry
  // ローカライズされたフィールドを取得 / 获取本地化字段
  function _loc(field) {
    const lang = (typeof I18n !== 'undefined' && I18n.current) ? I18n.current() : 'zh';
    return field[lang] || field['zh'] || '';
  }

  let _filter = 'all';
  let _query  = '';

  function _filtered() {
    const lang = (typeof I18n !== 'undefined' && I18n.current) ? I18n.current() : 'zh';
    return DB.filter(item => {
      const matchCat = _filter === 'all' || item.cat === _filter;
      const localName = (item.name[lang] || item.name['zh'] || '').toLowerCase();
      const matchQ   = !_query || localName.includes(_query.toLowerCase());
      return matchCat && matchQ;
    });
  }

  // Render indulgence grid
  // おやつグリッドをレンダリング / 渲染零食卡片网格
  function render() {
    const el = document.getElementById('indulgeList');
    if (!el) return;
    const list = _filtered();
    const noItemsText = (typeof I18n !== 'undefined') ? (I18n.get('indulge_no_items') || 'No items found') : 'No items found';
    const addTodayText = (typeof I18n !== 'undefined') ? (I18n.get('indulge_add_btn') || '+ 今日记录') : '+ 今日记录';
    if (list.length === 0) {
      el.innerHTML = `<p class="placeholder-text" style="grid-column:1/-1">${noItemsText}</p>`;
      return;
    }
    el.innerHTML = list.map(item => `
      <div class="indulge-card" onclick="Indulgence.addToday('${item.id}')">
        <span class="indulge-icon">${item.icon}</span>
        <span class="indulge-name">${_loc(item.name)}</span>
        <span class="indulge-kcal">🔥 ${item.kcal} kcal</span>
        <span class="indulge-size">${_loc(item.size)}</span>
        <button class="indulge-add-btn">${addTodayText}</button>
      </div>`).join('');
  }

  function filterCat(cat) {
    _filter = cat;
    document.querySelectorAll('.indulge-cats .pill').forEach(b => {
      b.classList.toggle('active', b.dataset.cat === cat);
    });
    render();
  }

  function search(q) {
    _query = q;
    render();
  }

  // Add item to today's snack log + show warning toast
  // 今日のおやつログに追加してトースト警告を表示 / 添加到今日零食记录并显示警告提示
  function addToday(id) {
    const item = DB.find(x => x.id === id);
    if (!item) return;

    const localName = _loc(item.name);
    const today = new Date().toISOString().slice(0, 10);
    State.addLogEntry(today, 'snack', {
      name: localName, kcal: item.kcal,
      protein: 0, carbs: item.sugar || 0, fat: 0,
    });

    // Show context-aware warning
    // 状況に応じた警告を表示 / 显示情境化警告提示
    const riceEq = item.rice || (item.kcal / 250).toFixed(1);
    const sugarCubes = Math.round(item.sugar / 4);

    // i18n warning strings — fall back to zh if key missing
    const addedTpl = (typeof I18n !== 'undefined')
      ? (I18n.get('indulge_added') || '✅ {name} ({kcal} kcal) 已加入今日记录')
      : '✅ {name} ({kcal} kcal) 已加入今日记录';
    const kcalWarnTpl = (typeof I18n !== 'undefined')
      ? (I18n.get('warn_kcal') || '⚠️ 相当于 {n} 碗白饭的热量！')
      : '⚠️ 相当于 {n} 碗白饭的热量！';
    const sugarWarnTpl = (typeof I18n !== 'undefined')
      ? (I18n.get('warn_sugar') || '🍬 含糖约 {n}g ≈ {s} 颗方糖')
      : '🍬 含糖约 {n}g ≈ {s} 颗方糖';
    const alcoholWarn = (typeof I18n !== 'undefined')
      ? (I18n.get('indulge_alcohol_warn') || '🍺 酒精会降低脂肪燃烧效率，适量饮用')
      : '🍺 酒精会降低脂肪燃烧效率，适量饮用';

    let msg = addedTpl.replace('{name}', localName).replace('{kcal}', item.kcal);

    if (item.kcal >= 300) {
      msg += '\n' + kcalWarnTpl.replace('{n}', riceEq);
    }
    if (item.sugar >= 20) {
      msg += '\n' + sugarWarnTpl.replace('{n}', sugarCubes);
    }
    if (item.cat === 'alcohol') {
      msg += '\n' + alcoholWarn;
    }

    App.showToast(msg, item.kcal >= 300 ? 'warning' : '');

    // Refresh tracker summary
    // トラッカーサマリーを更新 / 刷新追踪摘要
    Tracker.renderSummary();
    Charts.renderMacroRing();
  }

  function init() { render(); }

  return { render, filterCat, search, addToday, init };
})();
