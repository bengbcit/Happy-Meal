// api/suggest-food.js — Vercel Serverless Function
// Food variant suggestions + healthy pairing recommendations with nutrition estimates
// 食物変体提案と健康的な組み合わせ推薦 / 食物变体建议 + 健康搭配推荐（含营养估算）

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Pick first available AI provider (same priority as parse-recipe.js)
  const GROQ_API_KEY     = process.env.GROQ_API_KEY;
  const GEMINI_API_KEY   = process.env.GEMINI_API_KEY;
  const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
  const CLAUDE_API_KEY   = process.env.CLAUDE_API_KEY;

  const provider =
    GROQ_API_KEY     ? 'groq'     :
    GEMINI_API_KEY   ? 'gemini'   :
    DEEPSEEK_API_KEY ? 'deepseek' :
    CLAUDE_API_KEY   ? 'claude'   : null;

  if (!provider) return res.status(500).json({ error: 'No AI API key configured.' });

  const { mode, food, lang = 'zh' } = req.body || {};
  if (!mode || !food) return res.status(400).json({ error: 'mode and food are required' });

  // ── mode: "variants" — return cooking variants for a food name ──────────────
  // バリアント取得モード / 变体列表模式
  if (mode === 'variants') {
    const langHint = lang === 'zh' ? '用中文回复' : lang === 'ja' ? '日本語で回答' : 'Reply in English';
    const prompt = `用户输入了食物名称："${food}"
请列出 5-8 种常见的烹饪方式或变体（如"煎鸡蛋"、"煮鸡蛋"、"炒鸡蛋"、"蒸蛋"等）。
${langHint}
只返回 JSON 数组，不要解释，不要 markdown：
["变体1", "变体2", "变体3", ...]`;

    try {
      const raw = await _callAI(provider, { GROQ_API_KEY, GEMINI_API_KEY, DEEPSEEK_API_KEY, CLAUDE_API_KEY }, prompt);
      const match = raw.match(/\[[\s\S]*\]/);
      if (!match) return res.status(422).json({ error: 'No JSON array in response', raw });
      const variants = JSON.parse(match[0]);
      return res.status(200).json({ variants, _provider: provider });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── mode: "pairings" — return healthy food pairings with nutrition ──────────
  // ペアリング取得モード / 健康搭配模式
  if (mode === 'pairings') {
    const langHint = lang === 'zh' ? '食物名用中文' : lang === 'ja' ? '食物名を日本語で' : 'Food names in English';
    const prompt = `用户选择了食物："${food}"
请推荐 4-6 种健康的搭配食物（少油炸、少盐、少糖、营养均衡）。
每种搭配给出默认克重（合理的一份量）和对应的营养估算。
${langHint}
只返回 JSON 数组，不要解释，不要 markdown：
[
  {"name":"食物名","grams":150,"kcal":120,"protein":5,"carbs":20,"fat":3},
  ...
]`;

    try {
      const raw = await _callAI(provider, { GROQ_API_KEY, GEMINI_API_KEY, DEEPSEEK_API_KEY, CLAUDE_API_KEY }, prompt);
      const match = raw.match(/\[[\s\S]*\]/);
      if (!match) return res.status(422).json({ error: 'No JSON array in response', raw });
      const pairings = JSON.parse(match[0]);
      // Also include the selected food itself with nutrition estimate
      const selfPrompt = `食物："${food}"，默认一份量的克重和营养估算。
只返回单个 JSON 对象，不要解释，不要 markdown：
{"name":"${food}","grams":100,"kcal":0,"protein":0,"carbs":0,"fat":0}
请填入合理的估算数值。`;
      const selfRaw = await _callAI(provider, { GROQ_API_KEY, GEMINI_API_KEY, DEEPSEEK_API_KEY, CLAUDE_API_KEY }, selfPrompt);
      const selfMatch = selfRaw.match(/\{[\s\S]*\}/);
      const selfItem = selfMatch ? JSON.parse(selfMatch[0]) : { name: food, grams: 100, kcal: 0, protein: 0, carbs: 0, fat: 0 };
      return res.status(200).json({ selected: selfItem, pairings, _provider: provider });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(400).json({ error: `Unknown mode: ${mode}` });
}

// ── Unified AI caller (same providers as parse-recipe.js) ────────────────────
async function _callAI(provider, keys, userPrompt) {
  const { GROQ_API_KEY, GEMINI_API_KEY, DEEPSEEK_API_KEY, CLAUDE_API_KEY } = keys;

  if (provider === 'groq') {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        max_tokens: 1024,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });
    if (!r.ok) throw new Error(`Groq ${r.status}: ${await r.text()}`);
    return (await r.json()).choices?.[0]?.message?.content || '';
  }

  if (provider === 'gemini') {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: { maxOutputTokens: 1024 },
        }),
      }
    );
    if (!r.ok) throw new Error(`Gemini ${r.status}: ${await r.text()}`);
    return (await r.json()).candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  if (provider === 'deepseek') {
    const r = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${DEEPSEEK_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'deepseek-chat',
        max_tokens: 1024,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });
    if (!r.ok) throw new Error(`DeepSeek ${r.status}: ${await r.text()}`);
    return (await r.json()).choices?.[0]?.message?.content || '';
  }

  // Claude fallback
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });
  if (!r.ok) throw new Error(`Claude ${r.status}: ${await r.text()}`);
  return (await r.json()).content?.[0]?.text || '';
}
