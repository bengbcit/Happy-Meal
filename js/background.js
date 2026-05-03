// background.js — Custom background: upload image or generate via Pollinations.ai (free, no key needed)
// カスタム背景：画像アップロードまたは Pollinations.ai で無料生成 / 自定义背景：上传图片或免费 AI 生成
// Pollinations.ai: free image generation, no API key required
// https://image.pollinations.ai/prompt/{prompt}?width=1200&height=800&nologo=true

const BgPanel = (() => {
  const BG_KEY = 'hm_background';

  const THEME_KEY = 'hm_hero_theme';

  // Apply saved background and theme on load
  function init() {
    const saved = localStorage.getItem(BG_KEY);
    if (saved) _applyBg(saved);
    if (localStorage.getItem(THEME_KEY) === 'light') {
      document.body.classList.add('hero-light');
    }
  }

  function _applyBg(url) {
    const app = document.getElementById('mainApp');
    const gate= document.getElementById('authGate');
    if (app) {
      app.style.backgroundImage  = `url("${url}")`;
      app.style.backgroundSize   = 'cover';
      app.style.backgroundAttachment = 'fixed';
      app.style.backgroundPosition = 'center';
    }
    if (gate) {
      gate.style.backgroundImage = `url("${url}")`;
      gate.style.backgroundSize  = 'cover';
    }
  }

  // Toggle background settings panel
  // 背景設定パネルの切り替え / 切换背景设置面板
  function toggle() {
    document.getElementById('bgPanel')?.classList.toggle('hidden');
    document.getElementById('langMenu')?.classList.add('hidden');
    document.getElementById('profilePanel')?.classList.add('hidden');
  }

  // Upload image from file input
  // ファイル入力から画像をアップロード / 从文件输入上传图片
  function uploadBg(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const url = e.target.result;  // base64 data URL
      localStorage.setItem(BG_KEY, url);
      _applyBg(url);
      App.showToast('✅ 背景已更新！');
      document.getElementById('bgPanel')?.classList.add('hidden');
    };
    reader.readAsDataURL(file);
  }

  // Show/hide AI prompt input
  function showAIPrompt() {
    document.getElementById('aiBgSection')?.classList.toggle('hidden');
  }

  // Generate AI background via Pollinations.ai (completely free, no API key)
  // Pollinations.ai で AI 背景を無料生成（API キー不要）/ 通过 Pollinations.ai 免费生成 AI 背景
  async function generateAI() {
    const promptEl  = document.getElementById('aiBgPrompt');
    const statusEl  = document.getElementById('aiBgStatus');
    const userPrompt = promptEl?.value.trim();

    // Default prompt if empty
    // 空の場合はデフォルトプロンプト / 空时使用默认提示
    const basePrompt = userPrompt ||
      (I18n.current()==='ja' ? 'healthy food watercolor background, soft green, minimal'
      : I18n.current()==='en' ? 'healthy fresh food background, soft green tones, watercolor style'
      : '健康美食背景，清新绿色，水彩风格');

    // Translate prompt to English for better Pollinations results
    // より良い結果のためにプロンプトを英語に変換 / 将提示翻译为英文以获得更好效果
    const englishPrompt = _toEnPrompt(basePrompt);

    if (statusEl) statusEl.innerHTML = `<span class="loading-spin"></span> AI 生成中（约10秒）...`;

    // Pollinations.ai URL — free, no key needed, 1200×800 suitable for background
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(englishPrompt)}?width=1200&height=800&nologo=true&seed=${Date.now()}`;

    try {
      // Pre-load the image to verify it loaded successfully
      // 画像を事前ロードして正常にロードされたか確認 / 预加载图片验证成功
      await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload  = resolve;
        img.onerror = reject;
        img.src = url;
      });

      localStorage.setItem(BG_KEY, url);
      _applyBg(url);
      if (statusEl) statusEl.textContent = '✅ 生成成功！';
      App.showToast('🎨 AI 背景已生成！');
      if (promptEl) promptEl.value = '';
      setTimeout(() => document.getElementById('bgPanel')?.classList.add('hidden'), 1000);

    } catch (e) {
      if (statusEl) statusEl.textContent = '❌ 生成失败，请重试或换个描述';
    }
  }

  // Simple keyword-based Chinese→English prompt helper
  // シンプルなキーワードベースの中英プロンプト変換 / 简单关键词替换中英文提示
  function _toEnPrompt(text) {
    const map = {
      '健康':'healthy','美食':'food','背景':'background','清新':'fresh',
      '绿色':'green','水彩':'watercolor','风格':'style','减肥':'weight loss',
      '蔬菜':'vegetables','水果':'fruits','简约':'minimal','温馨':'cozy',
      '日式':'japanese style','自然':'natural','美丽':'beautiful',
    };
    let result = text;
    Object.entries(map).forEach(([zh,en]) => { result = result.replace(new RegExp(zh,'g'), en); });
    // If still mostly Chinese, append safe default
    if (/[\u4e00-\u9fa5]/.test(result)) result += ', beautiful food background, soft colors';
    return result + ', high quality, 4k';
  }

  // Switch hero theme preset (dark default / light green)
  function setTheme(theme) {
    if (theme === 'light') {
      document.body.classList.add('hero-light');
      localStorage.setItem(THEME_KEY, 'light');
    } else {
      document.body.classList.remove('hero-light');
      localStorage.removeItem(THEME_KEY);
    }
    document.getElementById('bgPanel')?.classList.add('hidden');
  }

  // Clear background
  // 背景をクリア / 清除背景
  function clearBg() {
    localStorage.removeItem(BG_KEY);
    const app  = document.getElementById('mainApp');
    const gate = document.getElementById('authGate');
    if (app)  { app.style.backgroundImage=''; }
    if (gate) { gate.style.backgroundImage=''; }
    App.showToast('背景已恢复默认');
    document.getElementById('bgPanel')?.classList.add('hidden');
  }

  return { init, toggle, uploadBg, showAIPrompt, generateAI, clearBg, setTheme };
})();
