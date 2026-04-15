# 项目上下文 (Context File)
> 每次换电脑或开新对话时，把这个文件内容发给 Claude，它就能快速了解你的情况。

---

## 我是谁 / 项目目标
- **用户**: DanL
- **项目名称**: **Happy Meal / ハッピーミール / 健康食堂**
- **目标**: 一个减肥辅助 Web App，帮助管理菜谱、追踪营养、推荐每周饮食计划
- **部署平台**: Vercel（与 Study Stars 项目同账户，新建项目 `happy-meal`）
- **同步方式**: GitHub + git push/pull（台机 & 笔记本双端同步）

---

## 技术栈
- **前端**: HTML / CSS / Vanilla JavaScript（无框架）
- **认证**: Firebase Auth（Email/Password + Google 登录）—— 与 Study Stars 同账户，新建 Firebase 项目
- **数据库**: Firebase Firestore —— 存菜谱库、每日饮食记录、用户档案
- **图表**: Chart.js —— BMI 趋势、营养环形图、每周热量图
- **邮件**: EmailJS —— 同账户，新建模板，发送每周菜单提醒
- **AI 功能**: 多模型支持（优先级：Groq → Gemini → DeepSeek → Claude）
  - 触发场景：从 URL/图片/PDF/CSV 解析菜谱、生成营养估算
  - Vercel Serverless 代理：`api/parse-recipe.js`
- **多语言**: 中文 / 英文 / 日文（i18n.js，不添加韩文或其他语言）

---

## 账户复用说明
| 服务 | 复用方式 |
|------|---------|
| Vercel | 同账户 → 项目名 `happy-meal` → 域名 `happy-meal-two.vercel.app` |
| Firebase | 同账户 → 项目 `happy-meal-dca86` |
| EmailJS | 同账户 → Service: `service_mvd09ib` → Template: `template_bj3gsu9` |
| AI API | Vercel 环境变量：`GROQ_API_KEY` / `GEMINI_API_KEY` / `DEEPSEEK_API_KEY` / `CLAUDE_API_KEY` |

---

## 文件结构
```
Happy-Meal/
├── CONTEXT.md              ← 你现在看的这个文件
├── README.md               ← 详细设置说明
├── index.html              ← 主 HTML 入口（单页应用，tab 切换）
├── vercel.json             ← Vercel 部署配置（rewrites 模式）
├── .gitignore
├── css/
│   └── style.css           ← 所有样式（绿色健康主题，支持暗色模式）
├── js/
│   ├── app.js              ← 主入口，Tab 路由，Toast，ProfilePanel
│   ├── auth.js             ← Firebase Auth stub（firebase-init.js 加载后覆盖）
│   ├── firebase-config.js  ← Firebase + EmailJS 配置（已填入真实值）
│   ├── firebase-init.js    ← Firebase 初始化 + onAuthStateChanged + 登录流程
│   ├── i18n.js             ← 多语言包（中 / 英 / 日）
│   ├── state.js            ← 全局状态 + localStorage（含 Firestore 双存）
│   ├── bmi.js              ← BMI 计算（Mifflin-St Jeor）+ 按蛋白>碳水>脂肪推荐
│   ├── recipes.js          ← 菜谱 CRUD、分类、食材 +/- 行、图片/PDF 解析
│   ├── tracker.js          ← 每日四餐追踪 + CSV/图片上传解析
│   ├── planner.js          ← 周菜单生成 + 多邮箱发送 + 孩子模式
│   ├── parser.js           ← URL/文本/图片/CSV 解析入口（调 /api/parse-recipe）
│   ├── indulgence.js       ← 25+ 甜品/饮料/酒精热量数据库 + 警告 Toast
│   ├── charts.js           ← Chart.js：环形图、柱图、7日折线图
│   ├── keys.js             ← API 密钥管理对话框
│   └── theme.js            ← 主题（跟随系统暗色模式）
└── api/
    └── parse-recipe.js     ← Vercel Serverless：多模型 AI 菜谱解析代理
```

---

## 登录流程（按 login-flow.html 流程图）
```
打开应用
  ├─ 未登录 → 显示登录页
  │     ├─ 本地使用   → 主页（用户名: 本地用户，按钮: 退出本地登录）
  │     ├─ 邮箱链接登录（魔法链接）
  │     └─ 注册账号登录（邮箱+密码）→ 主页（用户名: email，按钮: 退出登录）
  │
  └─ 已登录 → 判断类型 → 对应主页
                 点击用户名 → 切换面板
                   ├─ 切换为本地账号
                   ├─ 切换为其他邮箱账号
                   └─ 添加新账号
```

**关键规则（来自 Study Stars 经验）：**
- `_onSignIn` 先调 `App.init()` 显示 UI，再异步加载 Firestore（不阻塞）
- Firebase 登录成功后清除 `hm_localMode` 标记
- 登录按钮点击后立即显示 loading，避免用户误以为没响应
- `var` + `const` 同文件 = SyntaxError，切换账号方法必须在 `const App = {}` 内部

---

## 核心功能模块

### 1. 菜谱管理（recipes.js）
- URL / 图片 / PDF → AI 解析 → 结构化菜谱
- 食材列表：每行有 +/- 按钮可动态增删，克重栏可手动调整
- 步骤列表：同样支持 +/- 动态增删
- 食材/步骤输入框旁有 🎤 语音按钮（跟随当前语言）
- 分类标签：高蛋白 🥩 / 低脂 🥗 / 低碳 🥦 / 高碳 🍚 / 素食 🌿

### 2. BMI 与推荐（bmi.js）
- Mifflin-St Jeor 公式计算 BMR → TDEE → 目标热量
- 推荐优先级：**蛋白质 > 碳水 > 脂肪**（根据今日已摄入比例缺口排序）
- 男女不同热量缺口目标（男 -500kcal，女 -400kcal）

### 3. 每日追踪（tracker.js）
- 早/午/晚/零食四餐记录
- 支持 CSV 上传 → 解析食谱列表
- 支持图片/截图上传 → AI 识别食物 → 填入对应餐

### 4. 每周菜单（planner.js）
- 自动生成 + 手动替换单餐
- 多邮箱地址栏（动态 +/- 添加）
- 孩子模式：热量目标和推荐菜谱单独按儿童标准生成

### 5. 甜品/饮料/酒精（indulgence.js）
- 25+ 内置数据 + 搜索 + 分类筛选
- 添加时显示热量警告 Toast

---

## 重要规则 / 偏好
- **回复语言**: 中文
- **代码注释**: 英文 + 日文（方便面试，绝不出现韩文）
- **界面语言**: 只支持中文 / 英文 / 日文
- **修改原则**: 只改需要改的部分，不重写整个文件
- **遇到不确定**: 直接提问，不要自己推断
- **输出格式**: 先说明修改点 → 再贴代码
- **API 密钥**: 不要把真实密钥写进回复或提交到 git
- **CONTEXT.md 触发词**: 每当我说「总结到context.md」或「context.md summary so far」，把本次对话要点追加到「开发日志」章节
- **自动总结规则**: 每次对话结束或有代码改动时，Claude 自动把本次改动要点追加到「开发日志」，无需触发词
- **鼓励语规则**: App 内所有鼓励语、提示语、Toast 消息，必须跟随当前语言选项（zh/en/ja）实时切换

---

## Git 工作流
- **平台**: GitHub → `github.com/bengbcit/Happy-Meal`
- **PowerShell**: `cd "I:\Projects and Coding\Apps\Happy Meal"`
- **操作**: `git pull` → 修改 → `git add .` → `git commit -m "feat/fix: 描述"` → `git push`
- **提交前缀**: `feat:` 新功能 / `fix:` 修复 / `chore:` 维护
- **冲突处理**: 发生冲突时提示用户手动解决，不自动合并

---

## 常用命令
```powershell
# 开始工作前
cd "I:\Projects and Coding\Apps\Happy Meal"
git pull

# 改完后
git add .
git commit -m "feat: 描述改动"
git push
```

---

## 当前进度
- [x] 项目初始化，文件结构创建
- [x] Firebase 配置（happy-meal-dca86）
- [x] EmailJS 配置（service_mvd09ib / template_bj3gsu9）
- [x] Vercel 部署（happy-meal-two.vercel.app）
- [x] vercel.json 404 修复（改用 rewrites）
- [x] AI 解析支持多模型（Groq/Gemini/DeepSeek/Claude 自动降级）
- [ ] Firebase Auth 开启（Email/Password + Google）
- [ ] Firestore 数据库创建
- [ ] 登录流程完善（按流程图）
- [ ] 菜谱食材 +/- 动态行 + 语音输入
- [ ] 图片/PDF 菜谱解析
- [ ] 追踪栏 CSV + 图片上传
- [ ] 周菜单多邮箱 + 孩子模式
- [ ] 主页推荐按蛋白>碳水>脂肪排序

---

## 下一步任务
- [ ] **Firebase Auth**: Console → Authentication → 开启 Email/Password + Google
- [ ] **Firestore**: Console → Firestore → Create database → asia-east1
- [ ] **Vercel 环境变量**: 加 `GROQ_API_KEY`（或其他 AI key）→ Redeploy
- [ ] **Google Cloud Console**: API Key → HTTP referrers → 加 `happy-meal-two.vercel.app/*`

---

## 如何使用这个文件省 Token
1. 开新对话第一句：「请先读 CONTEXT.md，然后帮我 [任务]」
2. 结束前说：「总结到context.md」或「context.md summary so far」
3. 换电脑后先 `git pull`，再开 Claude

---

## 开发日志 / Q&A 归档
> 说「总结到context.md」时，Claude 会把当次对话要点追加到这里。

---

### 2026-04-15 — 项目初始化
- 复用 Vercel / Firebase / EmailJS 账户（新建子项目）✅
- 三语言：中文 / 英文 / 日文
- 第一版核心功能：菜谱录入 + BMI推荐 + 卡路里追踪
- AI 解析改为多模型降级链：Groq → Gemini → DeepSeek → Claude

### 2026-04-16 — 双重 Bug 修复：ParseModal 重复声明 + firebase-init ReferenceError

#### ❓ Bug 1 — `Uncaught SyntaxError: Identifier 'ParseModal' has already been declared`
- **根本原因**: `recipes.js` 和 `parser.js` 都定义了 `const ParseModal = (() => {...})()`，浏览器解析时 SyntaxError，**整个 JS 停止执行**，所有按钮全失效
- **修复**: 删除 `recipes.js` 末尾多余的 `ParseModal`，保留 `parser.js` 里唯一的定义
- **教训**: 两个文件迭代时各自加了同名 const，没有做重复检查

#### ❓ Bug 2 — `ReferenceError: _setLoading is not defined` (firebase-init.js)
- **根本原因**: `firebase-init.js` 的 `Object.assign(Auth, {...})` 里调用了裸函数 `_setLoading()` / `_setErr()`，但这两个方法是定义在 **`Auth` 对象里的**（`Auth._setLoading`），全局作用域根本不存在
- **附加问题**: `_enterApp()` 被传入字符串 `_enterApp('User')`，但函数签名要求对象 `{displayName, email, isLocal}`
- **修复**:
  - 全部改为 `Auth._setLoading(...)` / `Auth._setErr(...)`
  - `_enterApp` 调用改为传对象：`_enterApp({ displayName, email, isLocal: false })`
  - 新增 `auth/invalid-credential`、`auth/popup-blocked` 等新版 Firebase 错误码映射
- **教训**: `Object.assign` 注入的方法里调用 helper，必须用 `Auth.xxx()`，不能裸调用

#### EmailJS 模板更新
- 新模板 ID: `template_y2lqtd8`（已更新到 `firebase-config.js`）
- To Email 字段必须填 `{{to_email}}`，否则发到固定地址

#### 📌 关键经验
| 经验 | 说明 |
|------|------|
| `const` 重复声明 = SyntaxError | 整个脚本文件停止解析，表现为所有 onclick 都失效，很难定位 |
| `Object.assign` 里调用 helper | 必须用 `Auth._method()` 而不是裸 `_method()`，后者在全局不存在 |
| `_enterApp` 参数类型 | 永远传对象 `{displayName, email, isLocal}`，不传字符串 |
| Firebase 新版错误码 | `auth/wrong-password` 已被 `auth/invalid-credential` 替代，两个都要处理 |

---

### 2026-04-16 — 运动Tab + 历史菜单 + 外食 + 小奖励改名 + AI背景

#### 新增文件
- `js/exercise.js` — Exercise + DiningOut 两个模块合一
- `js/background.js` — 背景上传 + Pollinations.ai 免费 AI 生图

#### 新功能
| 功能 | 说明 |
|------|------|
| 🏋️ 运动 Tab | 18种内置运动，MET公式算消耗，分钟可+/-调整，记录当日消耗 |
| 外食选项 | Planner 子Tab，12种内置外食 + 自定义，一键加入今日追踪 |
| 历史周菜单 | Planner 子Tab，列出所有保存过的周计划，点击可查看详情 |
| 小奖励 | 原"零食/酒"改名，图标🎁，提示语更正面 |
| 背景板 | Topbar 🎨按钮 → 上传图片 或 Pollinations.ai 免费 AI 生成 |

#### 技术要点
- Pollinations.ai：`https://image.pollinations.ai/prompt/{prompt}?width=1200&height=800&nologo=true` 完全免费无需 API Key
- 运动消耗公式：`MET × 体重(kg) × 时间(h)`，体重从 `State.get().user.weight` 读取
- 历史菜单从 `State.get().weeklyPlan` 读取所有 weekKey，倒序展示

#### 📌 关键经验
| 经验 | 说明 |
|------|------|
| Pollinations.ai 用 preload 验证 | 用 `new Image().onload` 确认生成成功再保存，避免背景设置成坏图 |
| 背景存 URL 而非 base64 | Pollinations URL 保存更省 localStorage，上传图片才用 base64 |
| MET × kg × h 公式简单准确 | 无需调用外部 API，参照 ACSM 数据即可 |

---

### 2026-04-16 — 登录流程重写 + 菜谱大升级 + 多邮箱 + 孩子模式 + 鼓励语

#### 新增规则
- 每次对话代码改动后自动总结到本文件，无需触发词
- 所有 App 内鼓励语、提示语跟随 zh/en/ja 语言选项实时切换

#### 登录流程（按 login-flow.html）
- `auth.js` 重写：本地/Firebase 两种模式，`_enterApp()` 根据 `isLocal` 分别渲染按钮
- 本地模式 → 用户名"本地用户"，显示"登录账号"+"退出本地模式"
- Firebase 模式 → 显示邮箱，显示"切换本地账号"+"退出登录"
- 点用户名 → `switchPanel` 弹出（切换本地/邮箱/添加账号）

#### 菜谱栏升级
- 食材改为动态行：食材名 + 克重格（可 +/-），支持语音输入 `VoiceInput.start('ingredient')`
- 步骤同样动态行 + 语音按钮，语音跟随当前语言（`zh-CN/en-US/ja-JP`）
- 新增"图片/PDF" Tab：拖放上传 → `Parser.fromFile()` → AI 解析 → ParseModal 预览

#### 追踪栏升级
- 快速导入卡：CSV（`Tracker.importCSV()`）+ 图片/截图（`Tracker.importImage()`）
- CSV 自动识别 name/kcal/protein/carbs/fat 列（兼容中英日列名）

#### 周菜单升级
- 🧑/👶 模式切换：孩子模式用儿童热量目标（男1600/女1400），优先低热量菜谱
- 多邮箱行（`Planner.addEmailRow()`），发送时遍历所有有效邮箱

#### 主页推荐逻辑
- 评分改为蛋白质 +3，其他匹配 +1，偏重时高碳 −1
- 显示推荐原因图标（🥩🥗🥦）+ 底部说明"推荐依据：蛋白质 > 碳水 > 脂肪"

#### api/parse-recipe.js 升级
- 支持 `fileBase64` 参数（图片/PDF）→ Gemini 或 Claude Vision 解析
- `mode:'tracker'` 参数 → 返回食物数组而非菜谱格式

#### 新增：鼓励语模块（motivate.js）
- 每日换一句，跟随 zh/en/ja，显示在主页顶部
- I18n.set() 时自动刷新

#### 📌 关键经验
| 经验 | 说明 |
|------|------|
| 动态行用数组维护 | `_ingredients[]` 存 `"名称\|克重"` 格式，渲染时解析 |
| 语音 lang 跟 I18n | `SpeechRecognition.lang` 在每次 start 时从 `I18n.current()` 读取 |
| CSV 列名模糊匹配 | 用 `includes()` 匹配中英日列名，兼容用户自定义 CSV |
| Vision API 只选 Gemini/Claude | Groq/DeepSeek 不支持图片，需先判断 `visionProvider` |

---

### 2026-04-16 — 部署修复 + 多模型 AI
- vercel.json 从 `builds+routes` 改为 `rewrites`，修复 404
- `api/parse-recipe.js` 重写支持 Groq / Gemini / DeepSeek / Claude
- Vercel 加环境变量即可切换模型，无需改代码
#### 📌 关键经验
| 经验 | 说明 |
|------|------|
| Vercel 静态+函数混用 | 用 `rewrites` 不用 `builds`，否则静态文件 404 |
| Firebase config 可提交 | 前端 config 是公开设计的，安全靠 Firestore Rules + 域名白名单 |
| AI Key 放环境变量 | `GROQ_API_KEY` 等放 Vercel Dashboard，不写进代码文件 |
