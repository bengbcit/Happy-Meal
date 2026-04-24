# Happy Meal / ハッピーミール 🥗

**A trilingual health & weight-loss web app** — recipe management, AI-powered food parsing, calorie tracking, BMI recommendations, and weekly meal planning.  
**三言語対応の健康＆ダイエット Web アプリ** — レシピ管理・AI 食品解析・カロリー追跡・BMI 推薦・週間食事プランニング。

**Live demo:** https://happy-meal-two.vercel.app &nbsp;|&nbsp; **Stack:** Vanilla JS · Firebase · Vercel Serverless · Chart.js

---

## 📁 Project Structure / プロジェクト構造

```
Happy-Meal/
├── index.html              Single-page app entry point
├── vercel.json             Vercel rewrites config
├── api/
│   └── parse-recipe.js     Serverless: multi-model AI recipe parser
├── css/
│   └── style.css           All styles — green health theme, dark mode, video hero
├── img_vid/
│   ├── fitness.mp4         Hero background video (primary)
│   └── fitness2.mp4.mp4    Hero background video (fallback)
└── js/
    ├── app.js              Tab router, toast, profile panel, tabChanged event
    ├── auth.js             Auth stub + local mode (overridden by firebase-init)
    ├── firebase-config.js  Firebase + EmailJS config (fill in your keys)
    ├── firebase-init.js    Firebase init, onAuthStateChanged, Firestore sync
    ├── i18n.js             Translation strings + dynamic re-render on switch
    ├── state.js            Global state, per-user localStorage, Firestore helpers
    ├── bmi.js              BMI calc, weight logging, recipe recommendations
    ├── recipes.js          Recipe CRUD, filter pills, dynamic ingredient rows
    ├── tracker.js          Daily food log, TrackerImportModal, CSV import
    ├── planner.js          Weekly planner, history, dining-out, kids mode
    ├── parser.js           URL / file / CSV parser, ParseModal
    ├── indulgence.js       Treats database, calorie warnings
    ├── exercise.js         Exercise list (MET), DiningOut module
    ├── background.js       Custom background — upload or AI-generate
    ├── charts.js           Chart.js wrappers (macro ring, bar, weekly line, weight)
    ├── motivate.js         Daily motivational quotes (zh / en / ja, rotates)
    ├── theme.js            System dark-mode detection
    └── keys.js             In-app API key management dialog
```

---

## Changelog / 変更履歴

### V1.1 — Full Feature Launch (2026-04-23)

**English:**

- **AI Recipe Parsing** — URL import, image/PDF import, multi-model fallback chain (Groq → Gemini → DeepSeek → Claude), universal ingredient recognition across zh/en/ja sites
- **Smart Food Recognition** — upload a meal photo; AI identifies items, estimates gram weight, auto-splits one image into breakfast/lunch/dinner/snack; editable review modal before saving
- **Weight Tracking** — daily weight log; dual-axis history chart (weight + BMI); Firestore sync, 90-entry cap
- **BMI & Personalised Recommendations** — Mifflin-St Jeor → BMR → TDEE → deficit-adjusted daily target; recipe scoring by today's macro gap
- **Weekly Meal Planner** — auto-generate Mon–Sun plan; Kids mode; EmailJS delivery; history browser
- **Exercise Tracker** — 18 built-in exercises with MET values; dining-out sub-tab with 12 restaurant presets
- **Treats & Snack Calculator** — 25+ items with instant calorie lookup; rice-bowl-equivalent warning toast
- **Modern Home Screen** — full-viewport fitness video hero; scroll-based dashboard; IntersectionObserver card fade-in
- **Trilingual UI** — full zh/en/ja via `I18n` module; language switch re-renders all dynamic content instantly
- **Firebase Auth** — Email/Password + Google Sign-In; per-user localStorage partition; Firestore sync

**日本語：**

- **AI レシピ解析** — URL インポート、画像/PDF インポート、マルチモデルフォールバックチェーン（Groq → Gemini → DeepSeek → Claude）、zh/en/ja サイト対応の汎用食材認識
- **スマート食事認識** — 食事写真をアップロードするとAIが食材を識別・グラム推定し、朝食/昼食/夕食/スナックに自動分類；保存前に編集可能なレビューモーダル
- **体重管理** — 毎日の体重記録；デュアル軸履歴チャート（体重＋BMI）；Firestore同期、最大90エントリー
- **BMI＆パーソナライズ推薦** — Mifflin-St Jeor式 → BMR → TDEE → 赤字調整済み日次目標；本日のマクロ不足に基づくレシピスコアリング
- **週間食事プランナー** — BMI・カロリー目標に合わせた月〜日プランを自動生成；キッズモード；EmailJS送信；履歴ブラウザ
- **運動トラッカー** — MET値付き18種類のエクササイズ；12の飲食店プリセット付き外食サブタブ
- **おやつ＆スナック計算機** — 25種類以上の即時カロリー検索；ご飯一杯分超過時の警告トースト
- **モダンホーム画面** — 全画面フィットネス動画ヒーロー；スクロール式ダッシュボード；IntersectionObserver によるカードフェードイン
- **三言語UI** — `I18n` モジュールによる完全 zh/en/ja 対応；言語切替で全動的コンテンツを即時再描画
- **Firebase Auth** — メール/パスワード＋Google サインイン；ユーザーごとの localStorage パーティション；Firestore同期

---

## ✨ Features / 機能

### 🧠 AI Recipe Parsing / AI レシピ解析

**English:**
- **URL import** — paste any recipe link; the app fetches the page, extracts structured data (JSON-LD schema.org/Recipe first, then AI fallback), and fills in name, ingredients, macros, and steps automatically
- **Image / PDF import** — drag in a photo or PDF; vision AI reads the ingredients and steps
- **Multi-model fallback chain** — Groq → Gemini → DeepSeek → Claude; whichever key you configure gets used, with automatic failover
- **Universal ingredient recognition** — prompt handles every common section heading across Chinese, English, and Japanese sites (用料 / 食材 / 调料 / 配料 / Ingredients / 材料…)

**日本語：**
- **URL インポート** — レシピリンクを貼り付けると、アプリがページを取得し、構造化データ（JSON-LD schema.org/Recipe 優先、その後 AI フォールバック）を抽出し、名前・食材・栄養素・手順を自動入力
- **画像 / PDF インポート** — 写真または PDF をドラッグすると、ビジョン AI が食材と手順を読み取り
- **マルチモデルフォールバックチェーン** — Groq → Gemini → DeepSeek → Claude；設定したキーが使用され、自動フェイルオーバー
- **汎用食材認識** — 中国語・英語・日本語サイト全般のよく使われる見出しに対応（用料 / 食材 / 调料 / 配料 / Ingredients / 材料…）

---

### 📷 Smart Food Recognition / スマート食事認識

**English:**
- Upload a meal photo; AI identifies every food item, estimates **gram weight** per item, and infers which meal it belongs to from visual context
- A single image showing an entire day's food is split into **breakfast / lunch / dinner / snack** automatically
- An editable review modal appears before anything is saved — adjust names, grams, kcal, or meal assignment, then confirm

**日本語：**
- 食事の写真をアップロードすると、AI がすべての食材を識別し、アイテムごとのグラム重量を推定し、視覚的な文脈からどの食事に属するかを推測
- 一日分の食事をまとめた画像は、**朝食 / 昼食 / 夕食 / スナック**に自動分類
- 保存前に編集可能なレビューモーダルが表示 — 名前・グラム・kcal・食事区分を調整して確認

---

### ⚖️ Weight Tracking / 体重管理

**English:**
- Log your weight daily; BMI and calorie targets recalculate instantly
- Dual-axis history chart — weight (kg) on the left axis, live-calculated BMI on the right — up to 30 entries
- Weight log synced to Firestore alongside all other user data (max 90 entries retained)

**日本語：**
- 毎日体重を記録するとBMIとカロリー目標が即時再計算
- デュアル軸履歴チャート — 左軸に体重（kg）、右軸にリアルタイム計算BMI — 最大30エントリー
- 体重ログは他のユーザーデータとともにFirestoreに同期（最大90エントリー保存）

---

### 📏 BMI & Personalised Recommendations / BMI＆パーソナライズ推薦

**English:**
- Mifflin-St Jeor formula → BMR → TDEE → daily calorie target (deficit-adjusted, separate for male / female)
- Recipe recommendations scored by today's macro gap: protein deficiency → high-protein recipes rise first
- Recommendation scoring: protein match +3 pts, other tag match +1 pt, excess carbs −1 pt

**日本語：**
- Mifflin-St Jeor 式 → BMR → TDEE → 日次カロリー目標（赤字調整済み、男女別）
- 本日のマクロ不足に基づくレシピ推薦スコアリング：タンパク質不足 → 高タンパクレシピが優先
- 推薦スコアリング：タンパク質一致 +3pt、他タグ一致 +1pt、炭水化物過剰 −1pt

---

### 📅 Weekly Meal Planner / 週間食事プランナー

**English:**
- Auto-generate a Monday–Sunday plan matched to your BMI and calorie goal
- **Kids mode** — switches to child calorie targets (1 600 / 1 400 kcal)
- Send the plan to one or more email addresses via EmailJS
- History browser — tap any past week to review the saved plan

**日本語：**
- BMI とカロリー目標に合わせた月〜日プランを自動生成
- **キッズモード** — 子供向けカロリー目標に切り替え（1,600 / 1,400 kcal）
- EmailJS で一つまたは複数のメールアドレスにプランを送信
- 履歴ブラウザ — 過去の週をタップして保存プランを確認

---

### 🏋️ Exercise Tracker / 運動トラッカー

**English:**
- 18 built-in exercises with MET values; minute slider with +/− buttons
- Calorie burn formula: `MET × body weight (kg) × duration (h)`
- Dining-out sub-tab — 12 restaurant presets + custom options

**日本語：**
- MET値付きの18種類の内蔵エクササイズ；+/−ボタン付き分スライダー
- カロリー消費計算式：`MET × 体重（kg）× 時間（h）`
- 外食サブタブ — 12の飲食店プリセット＋カスタムオプション

---

### 🍰 Treats & Snack Calculator / おやつ＆スナック計算機

**English:**
- 25+ sweets, drinks, and alcohol items with instant calorie lookup
- Warning toast when a snack exceeds a rice-bowl equivalent

**日本語：**
- 25種類以上のお菓子・飲み物・アルコールの即時カロリー検索
- スナックがご飯一杯分を超えると警告トースト表示

---

### 🎬 Modern Home Screen / モダンホーム画面

**English:**
- Full-viewport fitness video hero (autoplay, muted, looping) with a dark overlay, app title, and daily motivational quote
- Scroll-based dashboard: video hero at top, then BMI card, today's summary, recommendations, and quick-nav cards to every section
- Cards fade in as they enter the viewport via `IntersectionObserver`
- Study Reminder shortcut button in the top-right bar

**日本語：**
- ダークオーバーレイ・アプリタイトル・日替わりモチベーション名言付きの全画面フィットネス動画ヒーロー（自動再生・無音・ループ）
- スクロール式ダッシュボード：上部に動画ヒーロー、続いて BMI カード・本日のサマリー・推薦・各セクションへのクイックナビカード
- `IntersectionObserver` によるビューポート進入時のカードフェードイン
- 右上バーの Study Reminder ショートカットボタン

---

### 🌐 Trilingual UI / 三言語 UI

**English:**
- Full Chinese / English / Japanese support via `I18n` module
- Language switch re-renders **all** dynamic content instantly — recipe cards, meal labels, day names, exercise names, planner grid, charts

**日本語：**
- `I18n` モジュールによる完全な中国語・英語・日本語対応
- 言語切替でレシピカード・食事ラベル・曜日名・エクササイズ名・プランナーグリッド・チャートを含むすべての動的コンテンツを即時再描画

---

### 🔐 Auth & Data Sync / 認証＆データ同期

**English:**
- Firebase Auth — Email/Password + Google Sign-In
- Each account gets an **isolated localStorage partition** (`hm_state_<uid>`) so switching accounts never mixes data
- Firestore sync on login, every 3 minutes, and on tab close
- Local / guest mode available with no account required

**日本語：**
- Firebase Auth — メール/パスワード＋Google サインイン
- 各アカウントに分離された localStorage パーティション（`hm_state_<uid>`）で、アカウント切替時のデータ混在を防止
- ログイン時・3分ごと・タブを閉じる際に Firestore 同期
- アカウント不要のローカル/ゲストモード対応

---

## 🛠 Tech Stack / 技術スタック

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla JS (no framework), HTML5, CSS3 |
| Auth | Firebase Authentication (Email + Google OAuth) |
| Database | Cloud Firestore |
| Charts | Chart.js — donut macro ring, weekly calorie bar |
| AI Parsing | Groq (Llama 3) · Google Gemini · DeepSeek · Anthropic Claude |
| Image AI | Gemini 1.5 Flash Vision / Claude Vision |
| Email | EmailJS |
| Background Art | Pollinations.ai (free generative image API, no key needed) |
| Deployment | Vercel (static + Serverless Functions) |
| i18n | Custom `I18n` module — zh / en / ja |

---

## 🚀 Getting Started / セットアップ手順

### Prerequisites / 前提条件

**EN:** A [Firebase](https://firebase.google.com) project with Authentication and Firestore enabled · A [Vercel](https://vercel.com) account · At least one AI API key (Groq is free and fast)

**JA:** Authentication と Firestore を有効化した [Firebase](https://firebase.google.com) プロジェクト · [Vercel](https://vercel.com) アカウント · 少なくとも1つの AI API キー（Groq は無料で高速）

---

### 1 — Clone and configure Firebase / クローン＆Firebase設定

**EN:**
```bash
git clone https://github.com/bengbcit/Happy-Meal.git
cd Happy-Meal
```
Edit `js/firebase-config.js` with your Firebase project credentials and (optionally) your EmailJS service details.

**JA:** `js/firebase-config.js` に Firebase プロジェクトの認証情報と（任意で）EmailJS のサービス詳細を入力してください。

---

### 2 — Deploy to Vercel / Vercel へデプロイ

**EN:**
```bash
npm i -g vercel
vercel
```
In the Vercel dashboard, add the following **Environment Variables** for the AI parser:

**JA:** Vercel ダッシュボードで AI パーサー用の **環境変数** を追加してください：

| Variable | Description |
|----------|-------------|
| `GROQ_API_KEY` | Groq API key (recommended — free tier) |
| `GEMINI_API_KEY` | Google Gemini API key |
| `DEEPSEEK_API_KEY` | DeepSeek API key |
| `CLAUDE_API_KEY` | Anthropic Claude API key |

**EN:** You only need **one** key; the app tries them in the order listed above.  
**JA:** キーは**1つ**あれば十分です；アプリは上記の順番で試みます。

---

### 3 — Firebase Auth domains / Firebase 認証ドメイン設定

**EN:** In Firebase Console → Authentication → Settings → Authorized domains, add your Vercel deployment URL (e.g. `happy-meal-two.vercel.app`).

**JA:** Firebase コンソール → Authentication → 設定 → 承認済みドメインに Vercel デプロイ URL を追加してください（例：`happy-meal-two.vercel.app`）。

---

### 4 — Firestore rules / Firestore ルール

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null
                         && request.auth.uid == userId;
    }
  }
}
```

---

## 🔒 Security / セキュリティ

**EN:**
- API keys belong in Vercel environment variables, **never** in source code
- `js/firebase-config.js` is intentionally committed with real Firebase web config — this is safe by design (Firebase security is enforced by Auth + Firestore rules, not by hiding the config)
- All Firestore reads and writes are restricted to the authenticated user's own document

**JA:**
- API キーは Vercel 環境変数に保管し、ソースコードには**絶対に**含めないこと
- `js/firebase-config.js` は Firebase Web コンフィグを含んだまま意図的にコミットされています — これは設計上安全です（Firebase のセキュリティはコンフィグの隠蔽ではなく、Auth ＋ Firestore ルールで確保されています）
- すべての Firestore 読み書きは認証済みユーザー自身のドキュメントのみに制限

---

## 📸 Screenshots / スクリーンショット

> *(Add screenshots here / スクリーンショットをここに追加)*

---

## 📄 License

MIT
