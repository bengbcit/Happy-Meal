// api/parse-recipe.js — Vercel Serverless Function
// Multi-provider AI recipe parser: Groq → Gemini → DeepSeek → Claude (fallback chain)
// マルチプロバイダーAIレシピパーサー / 多模型菜谱解析，自动降级

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Auto-select available API key (priority: Groq → Gemini → DeepSeek → Claude)
  // 利用可能なAPIキーを自動選択 / 自动选择可用的 API Key
  const GROQ_API_KEY    = process.env.GROQ_API_KEY;
  const GEMINI_API_KEY  = process.env.GEMINI_API_KEY;
  const DEEPSEEK_API_KEY= process.env.DEEPSEEK_API_KEY;
  const CLAUDE_API_KEY  = process.env.CLAUDE_API_KEY;

  const provider =
    GROQ_API_KEY     ? 'groq'     :
    GEMINI_API_KEY   ? 'gemini'   :
    DEEPSEEK_API_KEY ? 'deepseek' :
    CLAUDE_API_KEY   ? 'claude'   : null;

  if (!provider) return res.status(500).json({ error: 'No AI API key configured. Add GROQ_API_KEY, GEMINI_API_KEY, DEEPSEEK_API_KEY, or CLAUDE_API_KEY in Vercel environment variables.' });

  const { url, text, fileBase64, fileType, fileName, lang = 'zh', mode = 'recipe' } = req.body || {};
  if (!url && !text && !fileBase64) return res.status(400).json({ error: 'url, text, or fileBase64 required' });

  // ── Handle image / PDF (base64) ──────────────────────
  // 画像・PDFをbase64で処理 / 处理 base64 图片/PDF
  if (fileBase64) {
    // Only Gemini and Claude support vision natively; use Gemini if available
    // GeminiとClaudeのみビジョンをサポート / 仅 Gemini 和 Claude 支持视觉
    const visionProvider = GEMINI_API_KEY ? 'gemini' : CLAUDE_API_KEY ? 'claude' : null;
    if (!visionProvider) return res.status(400).json({ error: 'Vision requires GEMINI_API_KEY or CLAUDE_API_KEY' });

    const trackerPrompt = mode === 'tracker'
      ? `Identify all food items visible in this image. Return a JSON array of objects: [{"name":"...","kcal":0,"protein":0,"carbs":0,"fat":0}]. Estimate portions. ${lang==='zh'?'用中文输出食物名称':lang==='ja'?'食品名は日本語で':'Output food names in English'}`
      : `Extract the recipe from this image. Return ONLY valid JSON: {"name":"...","kcal":0,"protein":0,"carbs":0,"fat":0,"ingredients":[],"steps":[],"tags":[]}. ${lang==='zh'?'用中文':''}`;

    try {
      let raw = '';
      if (visionProvider === 'gemini') {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
          { method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ contents:[{ parts:[
              { text: trackerPrompt },
              { inline_data: { mime_type: fileType, data: fileBase64 } }
            ]}] }) }
        );
        if (!r.ok) throw new Error(`Gemini vision error ${r.status}`);
        raw = (await r.json()).candidates?.[0]?.content?.parts?.[0]?.text || '';
      } else {
        // Claude vision
        const r = await fetch('https://api.anthropic.com/v1/messages', {
          method:'POST',
          headers:{ 'x-api-key':CLAUDE_API_KEY,'anthropic-version':'2023-06-01','content-type':'application/json' },
          body: JSON.stringify({ model:'claude-haiku-4-5-20251001', max_tokens:1024,
            messages:[{ role:'user', content:[
              { type:'image', source:{ type:'base64', media_type:fileType, data:fileBase64 } },
              { type:'text',  text: trackerPrompt }
            ]}]
          })
        });
        if (!r.ok) throw new Error(`Claude vision error ${r.status}`);
        raw = (await r.json()).content?.[0]?.text || '';
      }

      const jsonMatch = raw.match(/[\[{][\s\S]*[\]}]/);
      if (!jsonMatch) return res.status(422).json({ error:'No JSON in vision response', raw });
      return res.status(200).json(JSON.parse(jsonMatch[0]));
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── Fetch URL content ────────────────────────────────
  let sourceContent = text || '';
  if (url) {
    try {
      const pageResp = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HappyMealBot/1.0)' },
        signal: AbortSignal.timeout(8000),
      });
      const html = await pageResp.text();
      sourceContent = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .slice(0, 6000);
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
    let raw = '';

    // ── Groq (OpenAI-compatible, free tier, fastest)
    if (provider === 'groq') {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          max_tokens: 1024,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user',   content: sourceContent },
          ],
        }),
      });
      if (!r.ok) throw new Error(`Groq error ${r.status}: ${await r.text()}`);
      raw = (await r.json()).choices?.[0]?.message?.content || '';
    }

    // ── Gemini
    else if (provider === 'gemini') {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt + '\n\n' + sourceContent }] }],
            generationConfig: { maxOutputTokens: 1024 },
          }),
        }
      );
      if (!r.ok) throw new Error(`Gemini error ${r.status}: ${await r.text()}`);
      raw = (await r.json()).candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    // ── DeepSeek (OpenAI-compatible)
    else if (provider === 'deepseek') {
      const r = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${DEEPSEEK_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'deepseek-chat',
          max_tokens: 1024,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user',   content: sourceContent },
          ],
        }),
      });
      if (!r.ok) throw new Error(`DeepSeek error ${r.status}: ${await r.text()}`);
      raw = (await r.json()).choices?.[0]?.message?.content || '';
    }

    // ── Claude (fallback)
    else {
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
          system: systemPrompt,
          messages: [{ role: 'user', content: sourceContent }],
        }),
      });
      if (!r.ok) throw new Error(`Claude error ${r.status}: ${await r.text()}`);
      raw = (await r.json()).content?.[0]?.text || '';
    }

    // Parse JSON from whichever model responded
    // どのモデルの応答からもJSONをパース / 从任意模型响应中解析 JSON
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(422).json({ error: 'No JSON in response', raw });

    const recipe = JSON.parse(jsonMatch[0]);
    return res.status(200).json({ ...recipe, _provider: provider });

  } catch (e) {
    console.error('[parse-recipe] error:', e);
    return res.status(500).json({ error: e.message });
  }
}
