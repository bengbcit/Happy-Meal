// keys.js — API key management (stored in localStorage, never in git)
// APIキー管理 / API 密钥管理
// Usage: call Keys.setup() to open a settings dialog for the user to input keys

const Keys = (() => {
  function setup() {
    const claudeKey = prompt('Claude API Key (for recipe parsing):\n留空跳过', '');
    const emailAddr = prompt('邮箱地址 (用于周菜单提醒):', State.get().user.email || '');

    if (claudeKey) State.updateSettings({ claudeApiKey: claudeKey });
    if (emailAddr) {
      State.updateUser({ email: emailAddr });
      State.updateSettings({ emailAddress: emailAddr });
    }
    App.showToast('✅ 设置已保存');
  }

  return { setup };
})();
