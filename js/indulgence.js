// indulgence.js — Desserts, drinks, alcohol calorie lookup & warning
// スイーツ・ドリンク・アルコールのカロリー検索・警告 / 甜品、饮料、酒精热量查询与警告

const Indulgence = (() => {
  // Built-in database of common treats — names & sizes in zh/en/ja
  // 一般的なおやつのデータベース / 常见零食内置数据库
  const DB_BUILTIN = [
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
    // Starbucks Japan ☕
    { id:'c1',  cat:'cafe', icon:'☕',
      name: { zh:'甜蜜牛奶咖啡 G',       en:'Sweet Milk Coffee G',               ja:'スイートミルクコーヒー G' },
      size: { zh:'G杯',                  en:'G size',                             ja:'G サイズ' },
      kcal:396, protein:5.7, carbs:43.9, sugar:43.4, fat:21.9, rice:1.6 },
    { id:'c2',  cat:'cafe', icon:'☕',
      name: { zh:'甜蜜牛奶咖啡 V',       en:'Sweet Milk Coffee V',               ja:'スイートミルクコーヒー V' },
      size: { zh:'V杯',                  en:'V size',                             ja:'V サイズ' },
      kcal:462, protein:6.5, carbs:50.3, sugar:49.8, fat:26.1, rice:1.8 },
    { id:'c3',  cat:'cafe', icon:'🍵',
      name: { zh:'豆乳抹茶拿铁(冰) G',  en:'Soy Matcha Latte (Iced) G',         ja:'ソイ抹茶ティーラテ（I）G' },
      size: { zh:'G杯',                  en:'G size',                             ja:'G サイズ' },
      kcal:272, protein:9.6, carbs:37.2, sugar:35.0, fat:10.0, rice:1.1 },
    { id:'c4',  cat:'cafe', icon:'🍵',
      name: { zh:'豆乳抹茶拿铁(冰) V',  en:'Soy Matcha Latte (Iced) V',         ja:'ソイ抹茶ティーラテ（I）V' },
      size: { zh:'V杯',                  en:'V size',                             ja:'V サイズ' },
      kcal:329, protein:11.3, carbs:46.0, sugar:43.3, fat:11.8, rice:1.3 },
    { id:'c5',  cat:'cafe', icon:'🍵',
      name: { zh:'豆乳抹茶拿铁(热) G',  en:'Soy Matcha Latte (Hot) G',          ja:'ソイ抹茶ティーラテ（H）G' },
      size: { zh:'G杯',                  en:'G size',                             ja:'G サイズ' },
      kcal:306, protein:9.5, carbs:44.8, sugar:43.1, fat:10.8, rice:1.2 },
    { id:'c6',  cat:'cafe', icon:'🍵',
      name: { zh:'豆乳抹茶拿铁(热) V',  en:'Soy Matcha Latte (Hot) V',          ja:'ソイ抹茶ティーラテ（H）V' },
      size: { zh:'V杯',                  en:'V size',                             ja:'V サイズ' },
      kcal:400, protein:12.2, carbs:59.4, sugar:57.1, fat:13.2, rice:1.6 },
    { id:'c7',  cat:'cafe', icon:'🥭',
      name: { zh:'芒果星冰乐(无顶) G',  en:'Mango Frappuccino (No Top) G',      ja:'マンゴーフラペチーノ（NT）G' },
      size: { zh:'G杯',                  en:'G size',                             ja:'G サイズ' },
      kcal:191, protein:0.9, carbs:46.9, sugar:45.6, fat:0, rice:0.8 },
    { id:'c8',  cat:'cafe', icon:'🥭',
      name: { zh:'芒果星冰乐(无顶) V',  en:'Mango Frappuccino (No Top) V',      ja:'マンゴーフラペチーノ（NT）V' },
      size: { zh:'V杯',                  en:'V size',                             ja:'V サイズ' },
      kcal:233, protein:1.1, carbs:57.1, sugar:55.5, fat:0, rice:0.9 },
    { id:'c9',  cat:'cafe', icon:'🌰',
      name: { zh:'杏仁奶拿铁 G',        en:'Almond Milk Latte G',               ja:'アーモンドミルクラテ G' },
      size: { zh:'G杯',                  en:'G size',                             ja:'G サイズ' },
      kcal:117, protein:2.5, carbs:7.8, sugar:4.2, fat:9.3, rice:0.5 },
    { id:'c10', cat:'cafe', icon:'🌰',
      name: { zh:'杏仁奶拿铁 V',        en:'Almond Milk Latte V',               ja:'アーモンドミルクラテ V' },
      size: { zh:'V杯',                  en:'V size',                             ja:'V サイズ' },
      kcal:122, protein:2.9, carbs:8.9, sugar:5.1, fat:9.3, rice:0.5 },
    { id:'c11', cat:'cafe', icon:'🧊',
      name: { zh:'冰咖啡 G',            en:'Iced Coffee G',                      ja:'アイスコーヒー G' },
      size: { zh:'G杯',                  en:'G size',                             ja:'G サイズ' },
      kcal:14, protein:0.8, carbs:2.8, sugar:2.2, fat:0, rice:0.1 },
    { id:'c12', cat:'cafe', icon:'🧊',
      name: { zh:'冰咖啡 V',            en:'Iced Coffee V',                      ja:'アイスコーヒー V' },
      size: { zh:'V杯',                  en:'V size',                             ja:'V サイズ' },
      kcal:16, protein:0.9, carbs:3.1, sugar:2.5, fat:0, rice:0.1 },
    { id:'c13', cat:'cafe', icon:'🍰',
      name: { zh:'纽约芝士蛋糕',        en:'NY Cheesecake',                      ja:'NY チーズケーキ' },
      size: { zh:'1份',                  en:'1 slice',                            ja:'1ピース' },
      kcal:414, protein:6.6, carbs:30.1, sugar:29.1, fat:29.9, rice:1.7 },
    { id:'c14', cat:'cafe', icon:'🍫',
      name: { zh:'巧克力司康',          en:'Chocolate Scone',                    ja:'チョコスコーン' },
      size: { zh:'1个',                  en:'1 piece',                            ja:'1個' },
      kcal:332, protein:4.4, carbs:32.4, sugar:30.8, fat:20.9, rice:1.3 },
    { id:'c15', cat:'cafe', icon:'🥪',
      name: { zh:'火腿芝士三明治',      en:'Ham & Cheese Sandwich',              ja:'ハム＆チーズサンドイッチ' },
      size: { zh:'1个',                  en:'1 piece',                            ja:'1個' },
      kcal:342, protein:19.0, carbs:39.4, sugar:36.3, fat:12.7, rice:1.4 },
    { id:'c16', cat:'cafe', icon:'🥗',
      name: { zh:'根菜鸡肉沙拉卷',      en:'Root Veg & Chicken Salad Wrap',     ja:'根菜チキンサラダラップ' },
      size: { zh:'1个',                  en:'1 piece',                            ja:'1個' },
      kcal:203, protein:9.6, carbs:25.1, sugar:22.7, fat:7.2, rice:0.8 },
  ];

  // Category definitions — labels in zh/en/ja, rendered dynamically so language-switching works
  // カテゴリー定義（動的レンダリングで多言語対応） / 分类定义（动态渲染支持多语言）
  const CATS = [
    { key:'all',     icon:'',   label:{ zh:'全部',    en:'All',        ja:'すべて' } },
    { key:'dessert', icon:'🍰', label:{ zh:'甜品',    en:'Desserts',   ja:'スイーツ' } },
    { key:'drink',   icon:'🧋', label:{ zh:'饮料',    en:'Drinks',     ja:'ドリンク' } },
    { key:'alcohol', icon:'🍺', label:{ zh:'酒精',    en:'Alcohol',    ja:'アルコール' } },
    { key:'cafe',    icon:'☕', label:{ zh:'星巴克',  en:'Starbucks',  ja:'スターバックス' } },
    { key:'custom',  icon:'⭐', label:{ zh:'自定义',  en:'Custom',     ja:'カスタム' } },
  ];

  // Custom items — persisted in localStorage
  // カスタムアイテム（ローカルストレージに保存） / 自定义条目（存储在 localStorage）
  const CUSTOM_KEY = 'hm_custom_indulge';
  let _customItems = [];
  function _loadCustom() {
    try { _customItems = JSON.parse(localStorage.getItem(CUSTOM_KEY) || '[]'); } catch(e) { _customItems = []; }
  }
  function _saveCustom() {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(_customItems));
  }

  // Combined DB = builtins + custom
  function _allItems() { return DB_BUILTIN.concat(_customItems); }

  // Helper: localize a name/size field (string or {zh,en,ja} object)
  // ローカライズヘルパー / 本地化帮助函数
  function _loc(field) {
    if (!field) return '';
    if (typeof field === 'string') return field;
    const lang = (typeof I18n !== 'undefined' && I18n.current) ? I18n.current() : 'zh';
    return field[lang] || field['zh'] || field['en'] || '';
  }

  let _filter = 'all';
  let _query  = '';

  function _filtered() {
    const lang = (typeof I18n !== 'undefined' && I18n.current) ? I18n.current() : 'zh';
    return _allItems().filter(item => {
      const matchCat = _filter === 'all' || item.cat === _filter;
      const n = item.name;
      const localName = (typeof n === 'string' ? n : (n[lang] || n['zh'] || n['en'] || '')).toLowerCase();
      const matchQ   = !_query || localName.includes(_query.toLowerCase());
      return matchCat && matchQ;
    });
  }

  // Render category filter buttons (language-aware)
  // カテゴリーフィルターボタンをレンダリング / 渲染分类筛选按钮（支持多语言）
  function _renderCats() {
    const el = document.getElementById('indulgeCats');
    if (!el) return;
    el.innerHTML = CATS.map(c => {
      const label = _loc(c.label);
      const active = _filter === c.key ? ' active' : '';
      return `<button class="pill${active}" data-cat="${c.key}" onclick="Indulgence.filterCat('${c.key}')">${c.icon ? c.icon + ' ' : ''}${label}</button>`;
    }).join('');
  }

  // ── Quantity picker state ──────────────────────────────
  // 份数选择器状态 / 数量ピッカー状態
  let _pickerItemId = null;
  let _pickerQty    = 1;

  function openPicker(id) {
    const item = _allItems().find(x => x.id === id);
    if (!item) return;
    _pickerItemId = id;
    _pickerQty    = 1;
    _renderPicker(item);
    document.getElementById('indulgePickerModal')?.classList.remove('hidden');
  }

  function _renderPicker(item) {
    const q       = _pickerQty;
    const kcal    = Math.round(item.kcal    * q);
    const protein = +((item.protein || 0) * q).toFixed(1);
    const carbs   = +((item.carbs   != null ? item.carbs : (item.sugar || 0)) * q).toFixed(1);
    const fat     = +((item.fat     || 0) * q).toFixed(1);

    const addBtn  = (typeof I18n!=='undefined') ? I18n.get('indulge_add_btn') || '+ 今日记录' : '+ 今日记录';
    const servLbl = (typeof I18n!=='undefined') ? I18n.get('indulge_servings') || '份数' : '份数';
    const pLbl    = (typeof I18n!=='undefined'&&I18n.get('protein_lbl')) || '蛋白质';
    const cLbl    = (typeof I18n!=='undefined'&&I18n.get('carb_lbl'))    || '碳水';
    const fLbl    = (typeof I18n!=='undefined'&&I18n.get('fat_lbl'))     || '脂肪';
    const editHint = (typeof I18n!=='undefined') ? I18n.get('indulge_edit_hint')||'可直接修改数值' : '可直接修改数值';

    document.getElementById('indulgePickerContent').innerHTML = `
      <div style="text-align:center;padding:4px 0 10px">
        <div style="font-size:2rem">${item.icon || '🍽'}</div>
        <div style="font-weight:700;font-size:1rem;margin:4px 0 2px">${_loc(item.name)}</div>
        <div style="font-size:.75rem;color:var(--text-muted)">${_loc(item.size) || ''}</div>
      </div>
      <div class="indulge-picker-stepper">
        <button class="indulge-picker-btn" onclick="Indulgence._pickerStep(-1)">−</button>
        <div style="display:flex;flex-direction:column;align-items:center;gap:2px">
          <span style="font-size:1.5rem;font-weight:800;line-height:1">${q}</span>
          <span style="font-size:.72rem;color:var(--text-muted)">${servLbl}</span>
        </div>
        <button class="indulge-picker-btn" onclick="Indulgence._pickerStep(1)">＋</button>
      </div>
      <div style="font-size:.7rem;color:var(--text-muted);text-align:center;margin:-4px 0 6px">✏️ ${editHint}</div>
      <div class="indulge-picker-macros">
        <div class="indulge-pm-cell">
          <input class="indulge-pm-inp" id="pmKcal" type="number" min="0" value="${kcal}" style="color:var(--accent)"/>
          <span class="indulge-pm-lbl">kcal</span>
        </div>
        <div class="indulge-pm-cell">
          <input class="indulge-pm-inp" id="pmProtein" type="number" min="0" step="0.1" value="${protein}"/>
          <span class="indulge-pm-lbl">${pLbl} g</span>
        </div>
        <div class="indulge-pm-cell">
          <input class="indulge-pm-inp" id="pmCarbs" type="number" min="0" step="0.1" value="${carbs}"/>
          <span class="indulge-pm-lbl">${cLbl} g</span>
        </div>
        <div class="indulge-pm-cell">
          <input class="indulge-pm-inp" id="pmFat" type="number" min="0" step="0.1" value="${fat}"/>
          <span class="indulge-pm-lbl">${fLbl} g</span>
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-top:14px">
        <button class="btn-secondary" style="flex:1" onclick="Indulgence.closePicker()"
          data-i18n="btn_cancel">取消</button>
        <button class="btn-primary" style="flex:1" onclick="Indulgence.confirmPicker()">${addBtn}</button>
      </div>`;
  }

  function _pickerStep(delta) {
    _pickerQty = Math.max(0.5, +(_pickerQty + delta * 0.5).toFixed(1));
    // allow integer steps below 1; above 1 step by 1
    if (_pickerQty >= 1) _pickerQty = Math.round(_pickerQty);
    const item = _allItems().find(x => x.id === _pickerItemId);
    if (item) _renderPicker(item);
  }

  function closePicker() {
    document.getElementById('indulgePickerModal')?.classList.add('hidden');
    _pickerItemId = null;
  }

  function confirmPicker() {
    if (!_pickerItemId) return;
    // Read from editable fields — user may have manually adjusted values
    const kcal    = parseFloat(document.getElementById('pmKcal')?.value)    || 0;
    const protein = parseFloat(document.getElementById('pmProtein')?.value) || 0;
    const carbs   = parseFloat(document.getElementById('pmCarbs')?.value)   || 0;
    const fat     = parseFloat(document.getElementById('pmFat')?.value)     || 0;
    addTodayOverride(_pickerItemId, _pickerQty, { kcal, protein, carbs, fat });
    closePicker();
  }

  // Render indulgence grid
  // おやつグリッドをレンダリング / 渲染零食卡片网格
  function render() {
    _renderCats();
    const el = document.getElementById('indulgeList');
    if (!el) return;
    const list = _filtered();
    const noItemsText = (typeof I18n !== 'undefined') ? (I18n.get('indulge_no_items') || 'No items found') : 'No items found';
    if (list.length === 0) {
      el.innerHTML = `<p class="placeholder-text" style="grid-column:1/-1">${noItemsText}</p>`;
      return;
    }
    el.innerHTML = list.map(item => {
      const isCustom = item.custom === true;
      const delBtn = isCustom
        ? `<button class="indulge-del-btn" onclick="event.stopPropagation();Indulgence.deleteCustom('${item.id}')" title="删除">🗑</button>`
        : '';
      return `
      <div class="indulge-card" onclick="Indulgence.openPicker('${item.id}')">
        ${delBtn}
        <span class="indulge-icon">${item.icon || '🍽'}</span>
        <span class="indulge-name">${_loc(item.name)}</span>
        <span class="indulge-kcal">🔥 ${item.kcal} kcal</span>
        <span class="indulge-size">${_loc(item.size)}</span>
      </div>`;
    }).join('');
  }

  function filterCat(cat) {
    _filter = cat;
    render();
  }

  function search(q) {
    _query = q;
    render();
  }

  // ── Custom item management ─────────────────────────────
  // カスタムアイテム管理 / 自定义条目管理

  function openAddModal() {
    const modal = document.getElementById('indulgeAddModal');
    if (!modal) return;
    // Reset form
    ['indulgeAddName','indulgeAddSize','indulgeAddIcon',
     'indulgeAddKcal','indulgeAddProtein','indulgeAddCarbs','indulgeAddFat'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const catSel = document.getElementById('indulgeAddCat');
    if (catSel) catSel.value = _filter !== 'all' && _filter !== 'custom' ? _filter : 'dessert';
    modal.classList.remove('hidden');
  }

  function closeAddModal() {
    document.getElementById('indulgeAddModal')?.classList.add('hidden');
  }

  function saveCustom() {
    const name    = document.getElementById('indulgeAddName')?.value.trim();
    const size    = document.getElementById('indulgeAddSize')?.value.trim();
    const icon    = document.getElementById('indulgeAddIcon')?.value.trim() || '🍽';
    const cat     = document.getElementById('indulgeAddCat')?.value || 'dessert';
    const kcal    = parseFloat(document.getElementById('indulgeAddKcal')?.value)   || 0;
    const protein = parseFloat(document.getElementById('indulgeAddProtein')?.value) || 0;
    const carbs   = parseFloat(document.getElementById('indulgeAddCarbs')?.value)   || 0;
    const fat     = parseFloat(document.getElementById('indulgeAddFat')?.value)     || 0;
    if (!name) { App.showToast('❌ ' + ((typeof I18n!=='undefined'&&I18n.get('indulge_name_required'))||'请填写名称')); return; }
    const newItem = {
      id: 'u_' + Date.now(),
      cat, icon, custom: true,
      name,   // plain string for custom items
      size: size || '',
      kcal, protein, carbs, fat, sugar: carbs,
      rice: +(kcal / 250).toFixed(1),
    };
    _customItems.push(newItem);
    _saveCustom();
    closeAddModal();
    render();
    App.showToast('✅ ' + ((typeof I18n!=='undefined'&&I18n.get('saved_ok'))||'已保存'));
  }

  function deleteCustom(id) {
    const item = _customItems.find(x => x.id === id);
    if (!item) return;
    const name = typeof item.name === 'string' ? item.name : _loc(item.name);
    if (!confirm((typeof I18n!=='undefined'&&I18n.get('delete_confirm'))||'确定删除？')) return;
    _customItems = _customItems.filter(x => x.id !== id);
    _saveCustom();
    render();
    App.showToast('🗑 ' + name + ' ' + ((typeof I18n!=='undefined'&&I18n.get('deleted_ok'))||'已删除'));
  }

  // ── Add item to today's snack log + show warning toast ──
  // qty = number of servings (default 1, supports 0.5 steps)
  // override = optional {kcal,protein,carbs,fat} from user-edited picker fields
  // 今日のおやつログに追加してトースト警告を表示 / 添加到今日零食记录并显示警告提示
  function addTodayOverride(id, qty, override) {
    qty = qty || 1;
    const item = _allItems().find(x => x.id === id);
    if (!item) return;

    const localName = _loc(item.name);
    const qLabel    = qty !== 1 ? ` ×${qty}` : '';
    // Use override values if provided (user manually edited in picker)
    const kcal    = override ? override.kcal    : Math.round(item.kcal * qty);
    const protein = override ? override.protein : +((item.protein || 0) * qty).toFixed(1);
    const carbs   = override ? override.carbs   : +((item.carbs != null ? item.carbs : (item.sugar || 0)) * qty).toFixed(1);
    const fat     = override ? override.fat     : +((item.fat   || 0) * qty).toFixed(1);
    const sugar   = override ? override.carbs   : +((item.sugar || 0) * qty).toFixed(1);

    const today = new Date().toISOString().slice(0, 10);
    State.addLogEntry(today, 'snack', {
      name: localName + qLabel, kcal, protein, carbs, fat,
    });

    // Context-aware warning
    // 状況に応じた警告 / 情境化警告
    const riceEq    = +(kcal / 250).toFixed(1);
    const sugarCubes = Math.round(sugar / 4);

    const addedTpl    = (typeof I18n!=='undefined') ? I18n.get('indulge_added')       || '✅ {name}（{kcal} kcal）已加入今日记录' : '✅ {name}（{kcal} kcal）已加入今日记录';
    const kcalWarnTpl = (typeof I18n!=='undefined') ? I18n.get('warn_kcal')            || '⚠️ 相当于 {n} 碗白饭的热量！'           : '⚠️ 相当于 {n} 碗白饭的热量！';
    const sugarWarnTpl= (typeof I18n!=='undefined') ? I18n.get('warn_sugar')           || '🍬 含糖约 {n} 颗方糖'                    : '🍬 含糖约 {n} 颗方糖';
    const alcoholWarn = (typeof I18n!=='undefined') ? I18n.get('indulge_alcohol_warn') || '🍺 酒精会降低脂肪燃烧效率，适量饮用'     : '🍺 酒精会降低脂肪燃烧效率，适量饮用';

    let msg = addedTpl.replace('{name}', localName + qLabel).replace('{kcal}', kcal);
    if (kcal >= 300)    msg += '\n' + kcalWarnTpl.replace('{n}', riceEq);
    if (sugar >= 20)    msg += '\n' + sugarWarnTpl.replace('{n}', sugarCubes);
    if (item.cat === 'alcohol') msg += '\n' + alcoholWarn;

    App.showToast(msg, kcal >= 300 ? 'warning' : '');
    Tracker.renderSummary();
    Charts.renderMacroRing();
  }

  function addToday(id, qty) { addTodayOverride(id, qty, null); }

  function init() {
    _loadCustom();
    render();
  }

  return { render, filterCat, search, addToday, addTodayOverride,
           openPicker, closePicker, confirmPicker, _pickerStep,
           openAddModal, closeAddModal, saveCustom, deleteCustom, init };
})();
