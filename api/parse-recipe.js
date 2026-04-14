// api/parse-recipe.js — Vercel Serverless Function
// Proxies Claude API to parse recipe from URL or text
// Claude APIのプロキシ：URLまたはテキストからレシピを解析 / 代理 Claude API 解析菜谱

export default async function handler(req, res) {
  // CORS headers
  // CORSヘッダー / CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
  if (!CLAUDE_API_KEY) return res.status(500).json({ error: 'Claude API key not configured' });

  const { url, text, lang = 'zh' } = req.body || {};
  if (!url && !text) return res.status(400).json({ error: 'url or text required' });

  // Fetch page content if URL provided
  // URLが指定された場合はページコンテンツを取得 / 如果提供了 URL 则抓取页面内容
  let sourceContent = text || '';
  if (url) {
    try {
      const pageResp = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HappyMealBot/1.0)' },
        signal: AbortSignal.timeout(8000),
      });
      const html = await pageResp.text();
      // Strip HTML tags for cleaner input
      // HTMLタグを削除してクリーンな入力にする / 剥离 HTML 标签
      sourceContent = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .slice(0, 6000);  // Limit context length / コンテキスト長を制限
    } catch (e) {
      return res.status(422).json({ error: 'Failed to fetch URL: ' + e.message });
    }
  }

  // Language-aware system prompt
  // 言語対応システムプロンプト / 多语言系统提示
  const langHints = {
    zh: '用中文输出菜名和所有文字内容',
    en: 'Output recipe name and all text in English',
    ja: 'レシピ名とすべてのテキストを日本語で出力してください',
  };

  const systemPrompt = `You are a recipe parser. Extract structured recipe data from the given content.
${langHints[lang] || langHints.zh}
Return ONLY valid JSON with this exact structure:
{
  "name": "dish name",
  "kcal": number,
  "protein": number (grams),
  "carbs": number (grams),
  "fat": number (grams),
  "ingredients": ["ingredient 1", "ingredient 2"],
  "steps": ["step 1", "step 2"],
  "tags": ["high-protein"|"low-fat"|"low-carb"|"high-carb"|"vegetarian"]
}
If nutrition info is not available, estimate reasonable values based on the ingredients.
tags array must only contain values from: high-protein, low-fat, low-carb, high-carb, vegetarian.
Return ONLY the JSON object, no markdown, no explanation.`;

  try {
    const claudeResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',  // Fast + cheap for parsing
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: sourceContent }],
      }),
    });

    if (!claudeResp.ok) {
      const errBody = await claudeResp.text();
      return res.status(502).json({ error: 'Claude API error', detail: errBody });
    }

    const claudeData = await claudeResp.json();
    const raw = claudeData.content?.[0]?.text || '';

    // Parse JSON from response
    // レスポンスからJSONをパース / 从响应中解析 JSON
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(422).json({ error: 'No JSON in response', raw });

    const recipe = JSON.parse(jsonMatch[0]);
    return res.status(200).json(recipe);

  } catch (e) {
    console.error('[parse-recipe] error:', e);
    return res.status(500).json({ error: e.message });
  }
}
