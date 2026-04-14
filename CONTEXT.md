# 项目上下文 (Context File)
> 每次换电脑或开新对话时，把这个文件内容发给 Claude，它就能快速了解你的情况。

---

## 我是谁 / 项目目标
- 用户：DanL
- 项目名称：**Happy Meal / ハッピーミール / 健康食堂**
- 目标：一个减肥辅助 Web App，帮助管理菜谱、追踪营养、推荐每周饮食计划
- 部署平台：Vercel（与 Study Stars 项目同账户，新建项目）
- 同步方式：GitHub + git push/pull（台机 & 笔记本双端同步）

---

## 技术栈
- 前端：HTML / CSS / Vanilla JavaScript（无框架）
- 认证：Firebase Auth（Email/Password + Google 登录）—— 与 Study Stars 同账户，新建 Firebase 项目
- 数据库：Firebase Firestore —— 存菜谱库、每日饮食记录、用户档案
- 图表：Chart.js —— BMI 趋势、营养环形图、每周热量图
- 邮件：EmailJS —— 同账户，新建模板，发送每周菜单提醒
- AI 功能：Anthropic Claude API —— 从 URL / 文本解析菜谱、生成营养估算
- 多语言：中文 / 英文 / 日文（i18n.js，不添加韩文或其他语言）

---

## 账户复用说明
| 服务 | 复用方式 |
|------|---------|
| Vercel | 同账户 → Import Git Repo → 新建项目 `happy-meal` |
| Firebase | 同账户 → Console → 新建项目 `happy-meal-xxxx` |
| EmailJS | 同账户 → 新建 Email Template（weekly meal reminder） |
| Claude API | 同 API Key，在 `api/parse-recipe.js` Vercel serverless 中调用 |

---

## 文件结构
```
Happy-Meal/
├── CONTEXT.md              ← 你现在看的这个文件
├── README.md               ← 详细设置说明（Firebase / EmailJS / Claude API）
├── index.html              ← 主 HTML 入口（单页应用，tab 切换）
├── vercel.json             ← Vercel 部署配置
├── css/
│   └── style.css           ← 所有样式（绿色健康主题）
├── js/
│   ├── app.js              ← 主入口，Tab 路由，本地 Auth stub
│   ├── auth.js             ← Firebase 登录/注册
│   ├── firebase-config.js  ← Firebase 配置（勿提交真实密钥）
│   ├── firebase-init.js    ← Firebase 初始化 + onAuthStateChanged
│   ├── i18n.js             ← 多语言包（中 / 英 / 日）
│   ├── state.js            ← 全局状态 + localStorage
│   ├── bmi.js              ← BMI 计算、分类、推荐逻辑
│   ├── recipes.js          ← 菜谱 CRUD、分类（高蛋白/低脂等）
│   ├── tracker.js          ← 每日卡路里 / 蛋白质 / 碳水 / 脂肪追踪
│   ├── planner.js          ← 周一到周日自动菜单生成
│   ├── parser.js           ← URL 菜谱解析（调用 /api/parse-recipe）
│   ├── indulgence.js       ← 甜品 / 饮料 / 酒精卡路里提示
│   ├── charts.js           ← Chart.js 营养图表
│   ├── keys.js             ← API 密钥管理
│   └── theme.js            ← 主题切换（绿/深色）
└── api/
    └── parse-recipe.js     ← Claude API 代理（Vercel Serverless Function）
```

---

## 核心功能模块

### 1. 菜谱管理（Recipes）
- 从 URL / 粘贴文本 → Claude API 解析 → 生成结构化菜谱
- 分类标签：高蛋白 🥩 / 低脂 🥗 / 低碳 🥦 / 高碳 🍚 / 素食 🌿
- 字段：菜名、食材（含克重）、调料、步骤、营养信息（卡路里/蛋白质/碳水/脂肪）
- 支持手动添加 / 编辑 / 删除

### 2. BMI 与推荐（BMI & Recommend）
- 输入身高、体重、性别、年龄 → 计算 BMI
- 根据 BMI 分级（偏瘦/正常/偏重/肥胖）+ 当日已摄入宏量素比例
- 自动从菜谱库推荐合适菜谱
- 男女推荐热量目标不同（男约 500kcal 缺口，女约 400kcal 缺口）

### 3. 每日追踪（Daily Tracker）
- 早/午/晚餐 + 零食各自记录
- 从菜谱库直接添加 / 或手动输入
- 实时显示：已摄入热量 vs 目标热量、蛋白质/碳水/脂肪环形图
- 卡路里历史趋势（7日/30日折线图）

### 4. 每周菜单（Weekly Planner）
- 系统根据 BMI + 菜谱库自动排列周一至周日三餐
- 可手动替换某一餐
- EmailJS 发送每周菜单到邮箱

### 5. 甜品 / 饮料 / 酒精（Indulgence）
- 常见甜品、饮料、酒精热量快查表
- 添加到当日记录时自动弹出提示卡（"⚠️ 这杯奶茶 = 半碗饭"）
- 热量占比超标时给出提醒

---

## 当前进度
- [ ] CONTEXT.md 创建 ✅
- [ ] index.html 主框架
- [ ] CSS 绿色健康主题
- [ ] i18n.js 三语言
- [ ] state.js 全局状态
- [ ] bmi.js
- [ ] recipes.js
- [ ] tracker.js
- [ ] planner.js
- [ ] parser.js + api/parse-recipe.js
- [ ] indulgence.js
- [ ] charts.js
- [ ] Firebase 部署
- [ ] Vercel 部署

---

## 重要规则 / 偏好
- 回复语言：**中文**
- 代码注释：**英文 + 日文**（方便面试，绝不出现韩文）
- 界面语言：**只支持中文 / 英文 / 日文**
- 修改时：只改需要改的部分，不要重写整个文件
- API 密钥：不要把真实密钥写进回复或提交到 git
- **CONTEXT.md 触发词**：每当我说「总结到context.md」或「context.md summary so far」，Claude 就把本次对话要点追加到下方「开发日志 / Q&A 归档」章节

---

## 上次未完成的任务
- 日期：2026-04-15
- 任务：项目初始化，创建基础文件结构
- 完成：CONTEXT.md 创建、项目架构规划
- 下次从这里开始：继续构建 index.html + CSS + 核心 JS 模块

---

## 常用命令
```powershell
# 开始工作前（拉取最新）
cd C:\...\Happy-Meal
git pull

# 改完后同步
git add .
git commit -m "描述这次改动"
git push
```

---

## 如何使用这个文件省 Token
1. 开新对话第一句：「请先读 CONTEXT.md，然后帮我 [任务]」
2. 结束前说：「总结到context.md」或「context.md summary so far」
3. 换电脑后先 git pull，再开 Claude

---

## 追加功能建议（待评估）
> 以下是 Claude 建议的额外功能，DanL 可选择是否加入：

| 功能 | 说明 | 优先级 |
|------|------|--------|
| 💧 喝水提醒 | 每日喝水量追踪 + EmailJS/Browser 提醒 | ⭐⭐ |
| 🏋️ 运动消耗 | 记录运动类型/时长，自动增加热量余额 | ⭐⭐ |
| 📊 体重趋势图 | 每日体重记录 + 折线图，可视化减肥进度 | ⭐⭐⭐ |
| 🛒 购物清单 | 根据当周菜单自动生成食材购物清单 | ⭐⭐ |
| 🏆 打卡奖励 | 连续记录天数徽章（参考 Study Stars 积分系统） | ⭐ |
| 📸 进度照片 | 上传对比照，时间轴展示身材变化 | ⭐ |
| 🔖 食品条码 | 扫描包装食品条码自动填入营养信息 | ⭐⭐ |

---

## 开发日志 / Q&A 归档
> 说「总结到context.md」时，Claude 会把当次对话要点追加到这里。

---

### 2026-04-15 — 项目初始化

#### 项目决策
- 复用 Vercel / Firebase / EmailJS 账户 ✅（新建子项目）
- 三语言：中文 / 英文 / 日文
- 第一版核心功能：菜谱录入与分类、BMI+每周推荐、卡路里追踪
- 架构参照 Study Stars，单页应用 Tab 切换，无框架原生 JS

#### 📌 关键设计决定
| 决定 | 原因 |
|------|------|
| Claude API 解析菜谱 URL | 无需额外付费 API，复用已有 API Key |
| Vercel Serverless 代理 API Key | 避免前端暴露密钥，与 Study Stars 相同方案 |
| localStorage + Firestore 双存 | 离线可用，登录后同步云端 |
| 甜品/酒精单独模块 | 用户明确有这个需求，独立追踪避免心理负担 |
