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
    const variantExamples = lang === 'ja'
      ? '（例：目玉焼き、ゆで卵、炒り卵、茶碗蒸しなど）'
      : lang === 'en'
      ? '(e.g. fried egg, boiled egg, scrambled egg, steamed egg)'
      : '（如"煎鸡蛋"、"煮鸡蛋"、"炒鸡蛋"、"蒸蛋"等）';
    const langHint = lang === 'zh'
      ? '用中文回复，食物名称用中文'
      : lang === 'ja'
      ? '日本語で回答し、食物名は日本語で'
      : 'Reply in English, food names in English';
    const prompt = `The user entered a food name: "${food}"
List 5-8 common cooking methods or variants ${variantExamples}.
${langHint}
Return ONLY a JSON array, no explanation, no markdown:
["variant1", "variant2", "variant3", ...]`;

    try {
      const raw = await _callAI(provider, { GROQ_API_KEY, GEMINI_API_KEY, DEEPSEEK_API_KEY, CLAUDE_API_KEY }, prompt);
      const match = _cleanJson(raw).match(/\[[\s\S]*\]/);
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
    const langHint = lang === 'zh'
      ? '食物名用中文，营养数值用数字'
      : lang === 'ja'
      ? '食物名を日本語で、栄養値は数値で'
      : 'Food names in English, nutrition values as numbers';
    const healthyNote = lang === 'ja'
      ? '低油、低塩、低糖、栄養バランスの良い食品を優先'
      : lang === 'en'
      ? 'Prefer low-oil, low-salt, low-sugar, nutritionally balanced foods'
      : '优先推荐少油炸、少盐、少糖、营养均衡的食物';

    const pairPrompt = `The user selected the food: "${food}"
Generate 4-6 healthy pairing items that commonly go together with "${food}" as a complete meal. ${healthyNote}.
Include a mix of: side dishes, vegetables, and at least one drink (e.g. water, milk, tea, juice).
For each item, provide a typical single-serving weight (grams) and estimated nutrition.
${langHint}
Return ONLY a JSON array, no explanation, no markdown:
[
  {"name":"food name","grams":150,"kcal":120,"protein":5,"carbs":20,"fat":3},
  ...
]`;

    const selfPrompt = `Food: "${food}". Estimate nutrition for a typical single serving.
${langHint}
Return ONLY a single JSON object, no explanation, no markdown:
{"name":"${food}","grams":100,"kcal":0,"protein":0,"carbs":0,"fat":0}
Fill in reasonable estimated values.`;

    try {
      const keys = { GROQ_API_KEY, GEMINI_API_KEY, DEEPSEEK_API_KEY, CLAUDE_API_KEY };
      const [pairRaw, selfRaw] = await Promise.all([
        _callAI(provider, keys, pairPrompt),
        _callAI(provider, keys, selfPrompt),
      ]);
      const pairClean = _cleanJson(pairRaw);
      const pairMatch = pairClean.match(/\[[\s\S]*\]/);
      if (!pairMatch) return res.status(422).json({ error: 'No JSON array in pairings response', pairRaw });
      const pairings = JSON.parse(pairMatch[0]);
      const selfClean = _cleanJson(selfRaw);
      const selfMatch = selfClean.match(/\{[\s\S]*\}/);
      const selfItem  = selfMatch
        ? JSON.parse(selfMatch[0])
        : { name: food, grams: 100, kcal: 0, protein: 0, carbs: 0, fat: 0 };
      return res.status(200).json({ selected: selfItem, pairings, _provider: provider });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(400).json({ error: `Unknown mode: ${mode}` });
}

// ── JSON cleaner — fixes common AI output issues before parse ────────────────
// AIの出力によく見られるJSON問題を修正 / 修复 AI 输出中常见的 JSON 格式问题
function _cleanJson(raw) {
  return raw
    .replace(/```json\s*/gi, '')   // strip markdown code fences
    .replace(/```\s*/g, '')
    .replace(/\/\/[^\n]*/g, '')    // strip // comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // strip /* */ comments
    .replace(/,\s*([}\]])/g, '$1') // remove trailing commas before } or ]
    .replace(/\.\.\.\s*,?/g, '')   // remove ... ellipsis placeholders
    .replace(/[“”]/g, '"') // replace curly quotes
    .replace(/[‘’]/g, "'")
    .trim();
}

// ── Unified AI caller (same providers as parse-recipe.js) ────────────────────
async function _callAI(provider, keys, userPrompt) {
  const { GROQ_API_KEY, GEMINI_API_KEY, DEEPSEEK_API_KEY, CLAUDE_API_KEY } = keys;

  if (provider === 'groq') {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
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
