// indulgence.js — Desserts, drinks, alcohol calorie lookup & warning
// スイーツ・ドリンク・アルコールのカロリー検索・警告 / 甜品、饮料、酒精热量查询与警告

const Indulgence = (() => {
  // Built-in database of common treats
  // 一般的なおやつのデータベース / 常见零食内置数据库
  const DB = [
    // Desserts 甜品
    { id:'d1',  cat:'dessert', icon:'🧁', name:'奶油蛋糕',      kcal:350, size:'1片(100g)',    sugar:30, rice:1.4 },
    { id:'d2',  cat:'dessert', icon:'🍰', name:'提拉米苏',       kcal:400, size:'1份(120g)',    sugar:28, rice:1.6 },
    { id:'d3',  cat:'dessert', icon:'🍩', name:'甜甜圈',         kcal:270, size:'1个(70g)',     sugar:22, rice:1.1 },
    { id:'d4',  cat:'dessert', icon:'🍪', name:'巧克力曲奇',     kcal:150, size:'2块(40g)',     sugar:12, rice:0.6 },
    { id:'d5',  cat:'dessert', icon:'🍮', name:'焦糖布丁',       kcal:180, size:'1个(100g)',    sugar:20, rice:0.7 },
    { id:'d6',  cat:'dessert', icon:'🍫', name:'黑巧克力',       kcal:170, size:'5格(30g)',     sugar:10, rice:0.7 },
    { id:'d7',  cat:'dessert', icon:'🍦', name:'冰淇淋球',       kcal:130, size:'1球(65g)',     sugar:14, rice:0.5 },
    { id:'d8',  cat:'dessert', icon:'🧇', name:'华夫饼+枫糖浆', kcal:420, size:'1份(150g)',    sugar:35, rice:1.7 },
    // Drinks 饮料
    { id:'k1',  cat:'drink',   icon:'🧋', name:'珍珠奶茶(全糖)', kcal:480, size:'1杯(500ml)',   sugar:52, rice:1.9 },
    { id:'k2',  cat:'drink',   icon:'🧋', name:'珍珠奶茶(半糖)', kcal:340, size:'1杯(500ml)',   sugar:34, rice:1.4 },
    { id:'k3',  cat:'drink',   icon:'🥤', name:'可乐',           kcal:140, size:'1罐(330ml)',   sugar:35, rice:0.6 },
    { id:'k4',  cat:'drink',   icon:'☕', name:'拿铁咖啡',       kcal:190, size:'1杯(350ml)',   sugar:15, rice:0.8 },
    { id:'k5',  cat:'drink',   icon:'🥛', name:'全脂牛奶',       kcal:150, size:'1杯(250ml)',   sugar:12, rice:0.6 },
    { id:'k6',  cat:'drink',   icon:'🍵', name:'抹茶拿铁',       kcal:240, size:'1杯(350ml)',   sugar:22, rice:1.0 },
    { id:'k7',  cat:'drink',   icon:'🧃', name:'果汁(橙汁)',     kcal:110, size:'1杯(250ml)',   sugar:22, rice:0.4 },
    { id:'k8',  cat:'drink',   icon:'🥤', name:'运动饮料',       kcal:80,  size:'1瓶(500ml)',   sugar:20, rice:0.3 },
    { id:'k9',  cat:'drink',   icon:'🥤', name:'星巴克摩卡',     kcal:370, size:'大杯(473ml)',  sugar:38, rice:1.5 },
    // Alcohol 酒精
    { id:'a1',  cat:'alcohol', icon:'🍺', name:'啤酒(普通)',     kcal:145, size:'1罐(350ml)',   sugar:11, rice:0.6 },
    { id:'a2',  cat:'alcohol', icon:'🍺', name:'精酿啤酒(IPA)', kcal:210, size:'1罐(350ml)',   sugar:15, rice:0.8 },
    { id:'a3',  cat:'alcohol', icon:'🍷', name:'红酒',           kcal:125, size:'1杯(150ml)',   sugar:4,  rice:0.5 },
    { id:'a4',  cat:'alcohol', icon:'🍸', name:'鸡尾酒(长岛冰茶)',kcal:280,size:'1杯(240ml)', sugar:18, rice:1.1 },
    { id:'a5',  cat:'alcohol', icon:'🥂', name:'香槟',           kcal:90,  size:'1杯(150ml)',   sugar:6,  rice:0.4 },
    { id:'a6',  cat:'alcohol', icon:'🥃', name:'威士忌(纯饮)',  kcal:105, size:'1杯(44ml)',    sugar:0,  rice:0.4 },
    { id:'a7',  cat:'alcohol', icon:'🍶', name:'日本酒(清酒)',  kcal:190, size:'1合(180ml)',   sugar:8,  rice:0.8 },
    { id:'a8',  cat:'alcohol', icon:'🍹', name:'莫吉托',         kcal:220, size:'1杯(240ml)',   sugar:20, rice:0.9 },
  ];

  let _filter = 'all';
  let _query  = '';

  function _filtered() {
    return DB.filter(item => {
      const matchCat = _filter === 'all' || item.cat === _filter;
      const matchQ   = !_query || item.name.toLowerCase().includes(_query.toLowerCase());
      return matchCat && matchQ;
    });
  }

  // Render indulgence grid
  // おやつグリッドをレンダリング / 渲染零食卡片网格
  function render() {
    const el = document.getElementById('indulgeList');
    if (!el) return;
    const list = _filtered();
    if (list.length === 0) {
      el.innerHTML = `<p class="placeholder-text" style="grid-column:1/-1">没有找到相关项目</p>`;
      return;
    }
    el.innerHTML = list.map(item => `
      <div class="indulge-card" onclick="Indulgence.addToday('${item.id}')">
        <span class="indulge-icon">${item.icon}</span>
        <span class="indulge-name">${item.name}</span>
        <span class="indulge-kcal">🔥 ${item.kcal} kcal</span>
        <span class="indulge-size">${item.size}</span>
        <button class="indulge-add-btn">+ 今日记录</button>
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

    const today = new Date().toISOString().slice(0, 10);
    State.addLogEntry(today, 'snack', {
      name: item.name, kcal: item.kcal,
      protein: 0, carbs: item.sugar || 0, fat: 0,
    });

    // Show context-aware warning
    // 状況に応じた警告を表示 / 显示情境化警告提示
    const riceEq = item.rice || (item.kcal / 250).toFixed(1);
    const sugarCubes = Math.round(item.sugar / 4);

    let msg = `✅ ${item.name} (${item.kcal} kcal) 已加入今日记录`;

    if (item.kcal >= 300) {
      msg += `\n⚠️ 相当于 ${riceEq} 碗白饭的热量！`;
    }
    if (item.sugar >= 20) {
      msg += `\n🍬 含糖约 ${item.sugar}g ≈ ${sugarCubes} 颗方糖`;
    }
    if (item.cat === 'alcohol') {
      msg += '\n🍺 酒精会降低脂肪燃烧效率，适量饮用';
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
