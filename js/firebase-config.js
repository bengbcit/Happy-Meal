// firebase-config.js — Firebase project configuration
// ⚠️ Replace with your actual Firebase project credentials
// ⚠️ 本物のFirebaseプロジェクトの認証情報に置き換えてください
// ⚠️ 请替换为你的真实 Firebase 项目配置（勿提交到 git）

const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID",
};

// EmailJS configuration
// EmailJS設定 / EmailJS 配置
const emailjsConfig = {
  publicKey:   'YOUR_EMAILJS_PUBLIC_KEY',
  serviceId:   'YOUR_EMAILJS_SERVICE_ID',
  templateId:  'YOUR_EMAILJS_TEMPLATE_ID',
};

// Vercel API base (leave empty for same-origin)
// Vercel APIベース（同一オリジンの場合は空のまま）/ Vercel API 基础路径
const API_BASE = '';
