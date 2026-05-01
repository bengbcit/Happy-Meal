# Happy Meal Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add weight log history table to the dashboard and improve Japanese recipe nutrition/tag parsing.

**Architecture:** All changes are additive — no existing functions are deleted, only extended. Task 1 touches three files (state.js, bmi.js, index.html). Task 2 is a single-file change to api/parse-recipe.js.

**Tech Stack:** Vanilla JS, HTML/CSS, Chart.js (already loaded), Vercel serverless function (Node.js)

---

## File Map

| File | Change |
|------|--------|
| `js/state.js` | Add `removeWeightEntry(dateStr)` helper |
| `js/bmi.js` | Add `renderWeightLog`, `editWeightRow`, `saveWeightRow`, `deleteWeightRow`; call from `logWeight()` and `init()`; expose in return object |
| `index.html` | Add `<div id="weightLogHistory"></div>` below `#weightHistoryChart` |
| `css/style.css` | Add `.weight-log-table` styles |
| `api/parse-recipe.js` | Fix `_extractFocusedText` nutrition keywords; update AI prompt with Japanese nutrition hint and expanded tag vocabulary |

---

## Task 1: Add `removeWeightEntry` to state.js

**Files:**
- Modify: `js/state.js` (after `addWeightEntry` block, around line 161)

- [ ] **Step 1: Add the method**

In `js/state.js`, after the closing brace of `addWeightEntry` (after line 160), add:

```js
    removeWeightEntry(dateStr) {
      _s.weightLog = (_s.weightLog || []).filter(e => e.date !== dateStr);
      _save();
    },
```

- [ ] **Step 2: Verify**

Open browser console and run:
```js
State.addWeightEntry('2024-01-01', 70);
State.removeWeightEntry('2024-01-01');
console.log(State.getWeightLog().find(e => e.date === '2024-01-01')); // must be undefined
```

- [ ] **Step 3: Commit**

```bash
git add js/state.js
git commit -m "feat: add State.removeWeightEntry helper"
```

---

## Task 2: Add weight log table CSS

**Files:**
- Modify: `css/style.css` (append to end)

- [ ] **Step 1: Append styles**

Add to the very end of `css/style.css`:

```css
/* Weight log history table */
.weight-log-table {
  width: 100%;
  border-collapse: collapse;
  font-size: .85rem;
  margin-top: 10px;
}
.weight-log-table th {
  text-align: left;
  color: var(--text-muted, #888);
  font-weight: 500;
  padding: 4px 6px;
  border-bottom: 1px solid var(--border, #eee);
}
.weight-log-table td {
  padding: 5px 6px;
  border-bottom: 1px solid var(--border, #eee);
}
.weight-log-table tr:last-child td { border-bottom: none; }
.wl-actions { display: flex; gap: 4px; }
.wl-actions .icon-btn { font-size: .85rem; padding: 0 4px; line-height: 1.6; }
```

- [ ] **Step 2: Commit**

```bash
git add css/style.css
git commit -m "style: add weight log table styles"
```

---

## Task 3: Add weight log table UI to bmi.js

**Files:**
- Modify: `js/bmi.js`

- [ ] **Step 1: Add four functions before the `return` statement**

In `js/bmi.js`, just before the final `return { calc, renderRecommend, init, logWeight };` line (line 239), insert:

```js
  // ── Weight Log History Table ─────────────────────────
  function renderWeightLog() {
    const el = document.getElementById('weightLogHistory');
    if (!el) return;
    const log = State.getWeightLog();
    if (log.length === 0) { el.innerHTML = ''; return; }

    const u  = State.get().user;
    const hm = u.height > 0 ? (u.height / 100) ** 2 : 0;

    const entries = log.slice(-14).reverse(); // newest first
    el.innerHTML = `
      <table class="weight-log-table">
        <thead><tr>
          <th>日期</th><th>体重(kg)</th><th>BMI</th><th></th>
        </tr></thead>
        <tbody>
          ${entries.map(e => {
            const bmi = hm > 0 ? (e.weight / hm).toFixed(1) : '—';
            return `<tr id="wlr-${e.date}">
              <td>${e.date.slice(5)}</td>
              <td class="wl-weight">${e.weight}</td>
              <td>${bmi}</td>
              <td class="wl-actions">
                <button class="icon-btn" onclick="BMI.editWeightRow('${e.date}',${e.weight})" title="Edit">✏️</button>
                <button class="icon-btn" onclick="BMI.deleteWeightRow('${e.date}')" title="Delete">🗑</button>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>`;
  }

  function editWeightRow(date, current) {
    const row = document.getElementById(`wlr-${date}`);
    if (!row) return;
    row.innerHTML = `
      <td>${date.slice(5)}</td>
      <td colspan="2">
        <input type="number" id="wl-edit-${date}" value="${current}"
          step="0.1" min="20" max="500" style="width:80px;padding:2px 4px" />
      </td>
      <td style="display:flex;gap:4px">
        <button class="btn-primary" style="padding:2px 10px;font-size:.8rem"
          onclick="BMI.saveWeightRow('${date}')">保存</button>
        <button class="btn-secondary" style="padding:2px 8px;font-size:.8rem"
          onclick="BMI.renderWeightLog()">取消</button>
      </td>`;
    document.getElementById(`wl-edit-${date}`)?.focus();
  }

  function saveWeightRow(date) {
    const input = document.getElementById(`wl-edit-${date}`);
    const val   = input ? parseFloat(input.value) : NaN;
    if (!val || val < 20 || val > 500) return;
    State.addWeightEntry(date, val);
    if (typeof Charts !== 'undefined') Charts.renderWeightChart();
    renderWeightLog();
  }

  function deleteWeightRow(date) {
    if (!confirm('删除这条体重记录？')) return;
    State.removeWeightEntry(date);
    if (typeof Charts !== 'undefined') Charts.renderWeightChart();
    renderWeightLog();
  }
```

- [ ] **Step 2: Update the return statement**

Replace the existing return line:
```js
  return { calc, renderRecommend, init, logWeight };
```
With:
```js
  return { calc, renderRecommend, init, logWeight, renderWeightLog, editWeightRow, saveWeightRow, deleteWeightRow };
```

- [ ] **Step 3: Call `renderWeightLog()` from `logWeight()`**

In `logWeight()`, after the line `if (typeof Charts !== 'undefined') Charts.renderWeightChart();` (line 203), add:
```js
    renderWeightLog();
```

- [ ] **Step 4: Call `renderWeightLog()` from `init()`**

In `init()`, after the line `if (typeof Charts !== 'undefined') Charts.renderWeightChart();` (line 236), add:
```js
    renderWeightLog();
```

- [ ] **Step 5: Commit**

```bash
git add js/bmi.js
git commit -m "feat: add weight log history table with inline edit/delete"
```

---

## Task 4: Add `#weightLogHistory` div to index.html

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Insert the div**

In `index.html`, find the canvas tag (line 166):
```html
          <canvas id="weightHistoryChart" height="160"></canvas>
```

Add the div immediately after it:
```html
          <canvas id="weightHistoryChart" height="160"></canvas>
          <div id="weightLogHistory"></div>
```

- [ ] **Step 2: Manual verify in browser**

Open `index.html` in browser, log in, enter a weight value and click "记录今日体重". Confirm:
- The chart renders
- Below the chart a table appears showing the logged entry with ✏️ 🗑 buttons
- Clicking ✏️ turns the row into an input field
- Entering a new value and clicking 保存 updates the row and re-renders the chart
- Clicking 🗑 removes the row after confirmation

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add weightLogHistory container to dashboard"
```

---

## Task 5: Fix Japanese nutrition parsing in api/parse-recipe.js

**Files:**
- Modify: `api/parse-recipe.js`

**Fix A — Add nutrition keywords to `_extractFocusedText`**

- [ ] **Step 1: Update the INGREDIENT_KEYWORDS regex**

Find (line 344):
```js
  const INGREDIENT_KEYWORDS = /用料|食材|调料|主料|辅料|材料|配料|原料|食品|配方|Ingredients|ingredients|材料/;
```

Replace with:
```js
  const INGREDIENT_KEYWORDS = /用料|食材|调料|主料|辅料|材料|配料|原料|食品|配方|Ingredients|ingredients|材料/;
  const NUTRITION_KEYWORDS  = /エネルギー|カロリー|栄養|脂質|たんぱく質|糖質|食塩|kcal|栄養成分|熱量/;
```

- [ ] **Step 2: Update the segment filter**

Find (line 348):
```js
  const relevant = segments.filter(s => INGREDIENT_KEYWORDS.test(s) || STEP_KEYWORDS.test(s));
```

Replace with:
```js
  const relevant = segments.filter(s => INGREDIENT_KEYWORDS.test(s) || STEP_KEYWORDS.test(s) || NUTRITION_KEYWORDS.test(s));
```

- [ ] **Step 3: Extend the split regex to include nutrition section headers**

Find (line 347):
```js
  const segments = text.split(/(?=用料|食材|调料|主料|材料|配料|做法|步骤|Ingredients|Instructions|作り方)/i);
```

Replace with:
```js
  const segments = text.split(/(?=用料|食材|调料|主料|材料|配料|做法|步骤|Ingredients|Instructions|作り方|エネルギー|栄養成分|栄養|Nutrition)/i);
```

---

**Fix B — Add Japanese nutrition hint to AI system prompt**

- [ ] **Step 4: Locate the nutrition hint insertion point**

Find the `langHint` block (around line 147):
```js
  const langHint = {
    zh: '用中文输出菜名、食材和步骤',
    en: 'Output recipe name, ingredients and steps in English',
    ja: 'レシピ名・食材・手順を日本語で出力してください',
  }[lang] || '用中文输出';
```

Add a `nutritionHint` constant immediately after it:
```js
  const nutritionHint = `
Nutrition values may appear in a table or grid with Japanese labels:
- エネルギー or カロリー → kcal value
- たんぱく質 → protein (grams)
- 脂質 → fat (grams)
- 炭水化物 or 糖質 → carbs (grams)
- 食塩相当量 → sodium (ignore, do not include in macros)
If both per-serving and per-100g values appear, use per-serving values.
Extract these numbers if present; otherwise estimate from the ingredient list.`;
```

- [ ] **Step 5: Insert `nutritionHint` into the system prompt**

Find in the system prompt string (around line 177):
```js
Estimate reasonable nutrition values if not explicitly stated.
tags must only contain values from: high-protein, low-fat, low-carb, high-carb, vegetarian.`;
```

Replace with:
```js
${nutritionHint}
tags: pick ≤10 tags that clearly match this recipe from this vocabulary (mix Japanese/English as appropriate):
料理、レシピ、献立、メニュー、おかず、惣菜、定食、弁当、作り置き、時短、簡単、本格的、プロ、家庭料理、和食、洋食、中華、アジア、エスニック、イタリアン、フレンチ、食材、肉、牛肉、豚肉、鶏肉、ひき肉、魚介、海鮮、魚、エビ、イカ、貝、海藻、野菜、葉物、根菜、きのこ、豆、卵、乳製品、チーズ、ヨーグルト、穀物、米、パン、麺、パスタ、粉類、調味料、ソース、たれ、つゆ、だし、スパイス、ハーブ、油、オイル、酢、酒、みりん、砂糖、塩、こしょう、醤油、味噌、焼く、煮る、蒸す、揚げる、炒める、茹でる、和える、漬ける、燻製、オーブン、電子レンジ、圧力鍋、フライパン、主菜、副菜、汁物、スープ、サラダ、前菜、おつまみ、デザート、スイーツ、ドリンク、丼、カレー、唐揚げ、天ぷら、餃子、チャーハン、炊き込みご飯、お好み焼き、たこ焼き、ラーメン、うどん、そば、お茶漬け、朝食、昼食、夕食、ランチ、ディナー、おやつ、パーティー、おもてなし、運動後、ダイエット、健康、美容、離乳食、子供、高齢者、一人暮らし、節約、冷凍、冷蔵、乾物、缶詰、レトルト、常備菜、ベジタリアン、ビーガン、グルテンフリー、低糖質、糖質制限、卵不使用、乳不使用、アレルギー対応、初心者向け、中級、上級、春、夏、秋、冬、旬、クリスマス、お正月、ひな祭り、バレンタイン、韓国料理、インド料理、メキシカン、スペイン料理、地中海、ケーキ、クッキー、チョコレート、プリン、アイス、和菓子、大福、どら焼き、high-protein、low-fat、low-carb、high-carb、vegetarian
Only include tags clearly supported by the page content. Return [] if none apply clearly.`;
```

- [ ] **Step 6: Verify the prompt still produces valid JSON**

Deploy to Vercel (or test locally with `vercel dev`) and parse the oceans-nadia URL:
```
POST /api/parse-recipe
{ "url": "https://oceans-nadia.com/user/1471808/recipe/520232", "lang": "ja" }
```
Expected response includes `kcal`, `protein`, `fat`, `carbs` with non-zero values matching the screenshot (エネルギー 178kcal, たんぱく質 4.2g, 脂質 11.5g, 炭水化物 15.2g).

- [ ] **Step 7: Commit**

```bash
git add api/parse-recipe.js
git commit -m "feat: extract Japanese nutrition values and expanded tag vocabulary from recipe URLs"
```

---

## Task 6: Run QA

- [ ] **Step 1: Run the QA agent**

```bash
python hm_qa_agent.py
```

- [ ] **Step 2: Check the report**

The agent generates a report file. Read it and confirm:
- Weight log card: logging, chart render, and table (edit/delete) all pass
- Recipe URL import: nutrition values present in parsed result
- No regressions in other tabs (tracker, planner, recipes, exercise, indulgence)

- [ ] **Step 3: Fix any failures**

If the QA agent flags failures, diagnose and fix before marking this task complete.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: post-QA cleanup"
```
