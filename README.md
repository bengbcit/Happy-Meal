# Happy Meal 🥗 — 健康食堂 / ハッピーミール

A weight-loss assistant web app with recipe management, calorie tracking, BMI-based recommendations, and weekly meal planning.

---

## 🚀 Quick Setup

### 1. Firebase (new project, same account as Study Stars)
1. Go to [Firebase Console](https://console.firebase.google.com/) → Add project → name: `happy-meal`
2. Enable **Authentication** → Email/Password + Google
3. Enable **Firestore** → Start in production mode
4. Get your config: Project Settings → Your apps → `firebaseConfig`
5. Paste into `js/firebase-config.js`
6. In Google Cloud Console → Credentials → Browser Key → add your Vercel domain to HTTP referrers

### 2. Vercel (same account as Study Stars)
1. Push this repo to GitHub
2. Vercel Dashboard → Import Git Repo → select this repo
3. Add Environment Variables:
   - `CLAUDE_API_KEY` = your Anthropic Claude API key
4. Deploy!

### 3. EmailJS (same account as Study Stars)
1. EmailJS Dashboard → Email Templates → Create New Template
2. Template variables to use:
   - `{{to_email}}` — recipient
   - `{{subject}}` — email subject
   - `{{message}}` — weekly meal plan text
3. Copy Service ID + Template ID → paste into `js/firebase-config.js` → `emailjsConfig`

---

## 📁 File Structure
```
Happy-Meal/
├── index.html          # Single page app entry
├── vercel.json         # Vercel deployment config
├── .gitignore
├── css/
│   └── style.css       # All styles (green health theme)
├── js/
│   ├── app.js          # Main entry, tab routing
│   ├── auth.js         # Auth stub (overridden by firebase-init.js)
│   ├── firebase-config.js  # ⚠️ Fill in your keys
│   ├── firebase-init.js    # Firebase + EmailJS init
│   ├── i18n.js         # zh/en/ja translations
│   ├── state.js        # Global state + localStorage
│   ├── bmi.js          # BMI calc + recommendations
│   ├── recipes.js      # Recipe CRUD + display
│   ├── tracker.js      # Daily food log
│   ├── planner.js      # Weekly meal planner + email
│   ├── parser.js       # URL recipe parser
│   ├── indulgence.js   # Treats/drinks/alcohol lookup
│   ├── charts.js       # Chart.js wrappers
│   ├── theme.js        # Theme management
│   └── keys.js         # API key management dialog
└── api/
    └── parse-recipe.js # Vercel serverless: Claude API proxy
```

---

## ✨ Features
- **Recipe Import** — Paste any recipe URL → Claude AI parses it automatically
- **Smart Categories** — High-protein 🥩 / Low-fat 🥗 / Low-carb 🥦 / High-carb 🍚 / Vegetarian 🌿
- **BMI Calculator** — Mifflin-St Jeor equation, personalized calorie targets
- **Daily Tracker** — Log breakfast/lunch/dinner/snacks, see macro breakdown
- **Weekly Planner** — Auto-generate Mon–Sun meal plan based on your BMI, email it to yourself
- **Treats Database** — 25+ common desserts/drinks/alcohol with calorie warnings
- **Trilingual** — 中文 / English / 日本語

---

## 🔧 Development
Open `index.html` directly in browser for local testing (Firebase features require a domain).

For Vercel API functions, use `vercel dev` locally.

---

## ⚠️ Security Notes
- Never commit real API keys to git
- `firebase-config.js` contains placeholder values only
- Use Vercel Environment Variables for `CLAUDE_API_KEY`
