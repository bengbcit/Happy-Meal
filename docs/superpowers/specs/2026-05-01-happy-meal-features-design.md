# Happy Meal Feature Design — 2026-05-01

## Scope

Two features + one read-only audit:

1. **Weight Log History** — view and edit past weight entries on the dashboard
2. **Japanese Recipe Parsing** — extract nutrition values and comprehensive Japanese tags from URLs
3. **Indulgence Locations Audit** — report file/line of every icon, kcal, and g value (no code change)

---

## Feature 1: Weight Log History (Dashboard)

### What it does

Below the existing `#weightHistoryChart` canvas, add a read/edit table of the last 14 weight entries. No new tab, no modal — always visible, inline editing.

### Data

- `State.getWeightLog()` returns `[{ date, weight }, ...]` sorted ascending.
- `State.addWeightEntry(date, weight)` upserts (already handles updates).
- Add `State.removeWeightEntry(date)` — filters `_s.weightLog` by date and calls `_save()`.

### UI

Rendered by a new `BMI.renderWeightLog()` function called after every `logWeight()` and on `BMI.render()`.

```
| Date       | Weight | BMI   |      |
|------------|--------|-------|------|
| 2026-04-30 | 65.2   | 22.6  | ✏️ 🗑 |
| 2026-04-29 | 65.4   | 22.7  | ✏️ 🗑 |
...
```

- ✏️ replaces the row with an `<input type="number">` pre-filled with current weight + Save/Cancel buttons. On Save: `State.addWeightEntry(date, newVal)` → `Charts.renderWeightChart()` → `BMI.renderWeightLog()`.
- 🗑 calls `State.removeWeightEntry(date)` → re-renders chart + table.
- Shows last 14 entries, **newest first** (State returns ascending; slice + reverse before render).
- 14 rows keeps the page compact while matching the chart's visible range.

### Files changed

| File | Change |
|------|--------|
| `js/state.js` | Add `removeWeightEntry(date)` |
| `js/bmi.js` | Add `renderWeightLog()`, call it from `logWeight()` and `render()` |
| `index.html` | Add `<div id="weightLogHistory"></div>` below `#weightHistoryChart` |

---

## Feature 2: Japanese Recipe Parsing

### Problem

`oceans-nadia.com` and similar Japanese recipe sites:
- Do not include nutrition in their JSON-LD (the fast-path misses it)
- Display nutrition in a visible HTML table: `エネルギー`, `たんぱく質`, `脂質`, `炭水化物`, `糖質`, `食塩相当量`
- Use a wide variety of category tags not in the current tag vocabulary

### Fix A — `_extractFocusedText` (api/parse-recipe.js)

Add nutrition + tag keywords to the segment-split regex so the nutrition table is preserved before passing to AI:

```
エネルギー|カロリー|栄養|脂質|たんぱく質|糖質|食塩|kcal
```

### Fix B — AI system prompt

Add a paragraph instructing the AI to read Japanese nutrition tables:

> "Nutrition values may appear in a table or grid with Japanese labels:  
> エネルギー or カロリー → kcal,  たんぱく質 → protein (g),  脂質 → fat (g),  
> 炭水化物 or 糖質 → carbs (g),  食塩相当量 → sodium (ignore for macros).  
> Extract these values if present. Per-serving values are preferred over per-100g."

### Fix C — Tag vocabulary expansion

Replace the hardcoded allowed-tags list with the full Japanese taxonomy. Tags extracted by AI from page content.

**Categories:**

| Category | Tags |
|----------|------|
| 大分类 | 料理、レシピ、献立、メニュー、おかず、惣菜、定食、弁当、作り置き、時短、簡単、本格的、プロ、家庭料理、和食、洋食、中華、アジア、エスニック、イタリアン、フレンチ |
| 食材 | 食材、材料、原料、具材、肉、牛肉、豚肉、鶏肉、ひき肉、魚介、海鮮、魚、エビ、イカ、貝、海藻、野菜、葉物、根菜、きのこ、豆、卵、乳製品、チーズ、ヨーグルト、穀物、米、パン、麺、パスタ、粉類 |
| 調味 | 調味料、味付け、ソース、たれ、つゆ、だし、スパイス、ハーブ、油、オイル、酢、酒、みりん、砂糖、塩、こしょう、醤油、味噌、ケチャップ、マヨネーズ |
| 調理法 | 調理法、焼く、煮る、蒸す、揚げる、炒める、茹でる、和える、漬ける、燻製、オーブン、電子レンジ、圧力鍋、フライパン、鍋 |
| 菜式 | 主菜、副菜、汁物、スープ、サラダ、前菜、おつまみ、デザート、スイーツ、ドリンク、飲み物、酒の肴、丼、カレー、唐揚げ、天ぷら、餃子、チャーハン、炊き込みご飯、お好み焼き、たこ焼き、ラーメン、うどん、そば、お茶漬け |
| 場景 | 朝食、昼食、夕食、ランチ、ディナー、おやつ、パーティー、おもてなし、運動後、ダイエット、健康、美容、離乳食、子供、高齢者、一人暮らし、節約 |
| 保存 | 冷凍、冷蔵、乾物、缶詰、レトルト、インスタント、業務用、常備菜、作り置き |
| 食事制限 | ベジタリアン、ビーガン、グルテンフリー、低糖質、糖質制限、卵不使用、乳不使用、アレルギー対応 |
| 難易度 | 初心者向け、中級、上級 |
| 季節 | 春、夏、秋、冬、旬、クリスマス、お正月、ひな祭り、バレンタイン |
| 料理名 | ケーキ、クッキー、チョコレート、プリン、アイス、和菓子、大福、どら焼き |
| 外国料理 | 韓国料理、インド料理、メキシカン、スペイン料理、地中海 |
| 既存 EN | high-protein、low-fat、low-carb、high-carb、vegetarian |

AI is instructed to pick only tags that clearly match page content (≤10 tags per recipe).

### Files changed

| File | Change |
|------|--------|
| `api/parse-recipe.js` | Fix A: update `_extractFocusedText` keywords; Fix B: add nutrition paragraph to system prompt; Fix C: replace tag list in system prompt |

---

## Feature 3: Indulgence Locations (Read-only audit)

See separate section in chat response — no code changes required.

---

## Out of Scope

- Saving sodium/salt as a tracked macro (field doesn't exist in recipe schema)
- Editing existing recipes' tags retroactively
- UI for tag filtering on the Recipes page (separate feature)
