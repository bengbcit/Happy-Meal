# Happy Meal 🥗

**A trilingual health & weight-loss web app** — recipe management, AI-powered food parsing, calorie tracking, BMI recommendations, and weekly meal planning.

**Live demo:** https://happy-meal-two.vercel.app &nbsp;|&nbsp; **Stack:** Vanilla JS · Firebase · Vercel Serverless · Chart.js

---

## ✨ Features

### 🧠 AI Recipe Parsing
- **URL import** — paste any recipe link; the app fetches the page, extracts structured data (JSON-LD schema.org/Recipe first, then AI fallback), and fills in name, ingredients, macros, and steps automatically
- **Image / PDF import** — drag in a photo or PDF; vision AI reads the ingredients and steps
- **Multi-model fallback chain** — Groq → Gemini → DeepSeek → Claude; whichever key you configure gets used, with automatic failover
- **Universal ingredient recognition** — prompt handles every common section heading across Chinese, English, and Japanese sites (用料 / 食材 / 调料 / 配料 / Ingredients / 材料…)

### 📷 Smart Food Recognition (Tracker)
- Upload a meal photo; AI identifies every food item, estimates **gram weight** per item, and infers which meal it belongs to from visual context
- A single image showing an entire day's food is split into **breakfast / lunch / dinner / snack** automatically
- An editable review modal appears before anything is saved — adjust names, grams, kcal, or meal assignment, then confirm

### ⚖️ Weight Tracking
- Log your weight daily; BMI and calorie targets recalculate instantly
- Dual-axis history chart — weight (kg) on the left axis, live-calculated BMI on the right — up to 30 entries
- Weight log synced to Firestore alongside all other user data (max 90 entries retained)

### 📏 BMI & Personalised Recommendations
- Mifflin-St Jeor formula → BMR → TDEE → daily calorie target (deficit-adjusted, separate for male / female)
- Recipe recommendations scored by today's macro gap: protein deficiency → high-protein recipes rise first
- Recommendation scoring: protein match +3 pts, other tag match +1 pt, excess carbs −1 pt

### 📅 Weekly Meal Planner
- Auto-generate a Monday–Sunday plan matched to your BMI and calorie goal
- **Kids mode** — switches to child calorie targets (1 600 / 1 400 kcal)
- Send the plan to one or more email addresses via EmailJS
- History browser — tap any past week to review the saved plan

### 🏋️ Exercise Tracker
- 18 built-in exercises with MET values; minute slider with +/− buttons
- Calorie burn formula: `MET × body weight (kg) × duration (h)`
- Dining-out sub-tab — 12 restaurant presets + custom options

### 🍰 Treats & Snack Calculator
- 25+ sweets, drinks, and alcohol items with instant calorie lookup
- Warning toast when a snack exceeds a rice-bowl equivalent

### 🎬 Modern Home Screen
- Full-viewport fitness video hero (autoplay, muted, looping) with a dark overlay, app title, and daily motivational quote
- Scroll-based dashboard: video hero at top, then BMI card, today's summary, recommendations, and quick-nav cards to every section
- Cards fade in as they enter the viewport via `IntersectionObserver`
- Study Reminder shortcut button in the top-right bar

### 🌐 Trilingual UI
- Full Chinese / English / Japanese support via `I18n` module
- Language switch re-renders **all** dynamic content instantly — recipe cards, meal labels, day names, exercise names, planner grid, charts

### 🔐 Auth & Data Sync
- Firebase Auth — Email/Password + Google Sign-In
- Each account gets an **isolated localStorage partition** (`hm_state_<uid>`) so switching accounts never mixes data
- Firestore sync on login, every 3 minutes, and on tab close
- Local / guest mode available with no account required

---

## 🛠 Tech Stack

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

## 📁 Project Structure

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

## 🚀 Getting Started

### Prerequisites
- A [Firebase](https://firebase.google.com) project with Authentication and Firestore enabled
- A [Vercel](https://vercel.com) account for deployment
- At least one AI API key (Groq is free and fast)

### 1 — Clone and configure Firebase

```bash
git clone https://github.com/bengbcit/Happy-Meal.git
cd Happy-Meal
```

Edit `js/firebase-config.js` with your Firebase project credentials and (optionally) your EmailJS service details.

### 2 — Deploy to Vercel

```bash
# Install Vercel CLI if needed
npm i -g vercel
vercel
```

In the Vercel dashboard, add the following **Environment Variables** for the AI parser:

| Variable | Description |
|----------|-------------|
| `GROQ_API_KEY` | Groq API key (recommended — free tier) |
| `GEMINI_API_KEY` | Google Gemini API key |
| `DEEPSEEK_API_KEY` | DeepSeek API key |
| `CLAUDE_API_KEY` | Anthropic Claude API key |

You only need **one** key; the app tries them in the order listed above.

### 3 — Firebase Auth domains

In Firebase Console → Authentication → Settings → Authorized domains, add your Vercel deployment URL (e.g. `happy-meal-two.vercel.app`).

### 4 — Firestore rules

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

## 🔒 Security

- API keys belong in Vercel environment variables, **never** in source code
- `js/firebase-config.js` is intentionally committed with real Firebase web config — this is safe by design (Firebase security is enforced by Auth + Firestore rules, not by hiding the config)
- All Firestore reads and writes are restricted to the authenticated user's own document

---

## 📸 Screenshots

> *(Add screenshots here)*

---

## 📄 License

MIT
