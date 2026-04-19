// api/parse-recipe.js — Vercel Serverless Function
// Multi-provider AI recipe parser: JSON-LD → Groq → Gemini → DeepSeek → Claude
// マルチプロバイダーAIレシピパーサー（JSON-LD優先） / 多模型菜谱解析，JSON-LD 优先

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

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

  const { url, text, fileBase64, fileType, fileName, lang = 'zh', mode = 'recipe' } = req.body || {};
  if (!url && !text && !fileBase64) return res.status(400).json({ error: 'url, text, or fileBase64 required' });

  // ── Handle image / PDF (base64) ──────────────────────────────────────────
  // 画像/PDFはビジョンAPIで処理 / 图片/PDF 使用视觉 API 处理
  if (fileBase64) {
    const visionProvider = GEMINI_API_KEY ? 'gemini' : CLAUDE_API_KEY ? 'claude' : null;
    if (!visionProvider) return res.status(400).json({ error: 'Vision requires GEMINI_API_KEY or CLAUDE_API_KEY' });

    // Vision prompt: explicitly handle multi-language ingredient section names
    // ビジョンプロンプト：多言語の食材セクション名を明示的に処理 / 视觉提示：明确处理多语言食材区块名称
    const visionPrompt = mode === 'tracker'
      ? `Analyze this food image carefully. Identify ALL food and drink items visible.
For each item estimate:
- name (${lang==='zh'?'in Chinese / 中文':lang==='ja'?'in Japanese / 日本語':'in English'})
- grams: estimated portion weight in grams (look at plate/bowl size, typical serving sizes)
- kcal: estimated calories for that portion
- protein, carbs, fat: macros in grams
- meal: which meal this item belongs to — detect from visual/contextual clues:
    morning context / 早餐食物 (toast, eggs, congee, milk) → "breakfast"
    lunch box / 午餐 (rice, noodles, lunch set) → "lunch"
    dinner / 晚餐 (hot dishes, soup, full meal) → "dinner"
    snacks / drinks / dessert → "snack"
  If the image shows MULTIPLE distinct meals (e.g. a full day's food photo), assign each item to the correct meal.
  If unclear, use "snack".

Return ONLY valid JSON (no markdown):
{
  "meals": {
    "breakfast": [{"name":"...","grams":150,"kcal":200,"protein":8,"carbs":30,"fat":4}],
    "lunch":     [...],
    "dinner":    [...],
    "snack":     [...]
  }
}
Include only meals that have detected items (omit empty arrays).`
      : `Extract the complete recipe from this image or document.
The ingredients section may be labeled: 用料、食材、调料、材料、配料、原料、食品、食料、原材料、Ingredients、材料 or similar.
Return ONLY valid JSON (no markdown):
{
  "name": "dish name",
  "kcal": estimated number,
  "protein": grams,
  "carbs": grams,
  "fat": grams,
  "ingredients": ["ingredient with amount", ...],
  "steps": ["step description", ...],
  "tags": []
}
${lang==='zh'?'菜名和食材用中文':lang==='ja'?'日本語で出力':'Output in English'}
Estimate nutrition if not provided. tags may include: high-protein, low-fat, low-carb, high-carb, vegetarian.`;

    try {
      let raw = '';
      if (visionProvider === 'gemini') {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
          { method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ contents:[{ parts:[
              { text: visionPrompt },
              { inline_data: { mime_type: fileType, data: fileBase64 } }
            ]}] }) }
        );
        if (!r.ok) throw new Error(`Gemini vision ${r.status}`);
        raw = (await r.json()).candidates?.[0]?.content?.parts?.[0]?.text || '';
      } else {
        const r = await fetch('https://api.anthropic.com/v1/messages', {
          method:'POST',
          headers:{'x-api-key':CLAUDE_API_KEY,'anthropic-version':'2023-06-01','content-type':'application/json'},
          body: JSON.stringify({ model:'claude-haiku-4-5-20251001', max_tokens:2048,
            messages:[{ role:'user', content:[
              { type:'image', source:{ type:'base64', media_type:fileType, data:fileBase64 } },
              { type:'text', text: visionPrompt }
            ]}]
          })
        });
        if (!r.ok) throw new Error(`Claude vision ${r.status}`);
        raw = (await r.json()).content?.[0]?.text || '';
      }

      const jsonMatch = raw.match(/[\[{][\s\S]*[\]}]/);
      if (!jsonMatch) return res.status(422).json({ error:'No JSON in vision response', raw });
      return res.status(200).json({ ...JSON.parse(jsonMatch[0]), _provider: visionProvider + '-vision' });
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── Fetch URL and try JSON-LD first ──────────────────────────────────────
  // URLを取得してJSON-LDを優先的に試みる / 获取 URL，优先尝试 JSON-LD
  let html = '';
  let sourceContent = text || '';

  if (url) {
    try {
      const pageResp = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,ja;q=0.7',
        },
        signal: AbortSignal.timeout(10000),
      });
      html = await pageResp.text();
    } catch (e) {
      return res.status(422).json({ error: 'Failed to fetch URL: ' + e.message });
    }

    // ── Try JSON-LD schema.org/Recipe (most modern recipe sites) ────────────
    // JSON-LD schema.org/Recipe を優先 / 优先尝试 JSON-LD 结构化数据（大多数现代菜谱网站支持）
    const jsonLdResult = _extractJsonLd(html);
    if (jsonLdResult) {
      return res.status(200).json({ ...jsonLdResult, _provider: 'json-ld', sourceUrl: url });
    }

    // ── Fallback: extract focused text for AI ────────────────────────────────
    // JSON-LD なし → AI 用テキストを抽出 / 无 JSON-LD → 提取关键文本供 AI 分析
    sourceContent = _extractFocusedText(html);
  }

  // ── AI parsing prompt (handles all ingredient section name variants) ─────
  // 食材セクション名のすべてのバリエーションを処理するAIプロンプト / 处理所有食材区块名称变体的 AI 提示
  const langHint = {
    zh: '用中文输出菜名、食材和步骤',
    en: 'Output recipe name, ingredients and steps in English',
    ja: 'レシピ名・食材・手順を日本語で出力してください',
  }[lang] || '用中文输出';

  const systemPrompt = `You are an expert recipe data extractor. Extract a complete structured recipe from the given webpage text.

IMPORTANT — Ingredients may appear under various section headings depending on the website and language:
- Chinese: 用料、食材、调料、主料、辅料、材料、配料、原料、食品、食料、原材料、食品用料、配方
- Japanese: 材料、食材、調味料、具材、調味料
- English: Ingredients, Materials, Components, What you need

Extract ALL ingredient sections (main ingredients, seasonings, sauces, etc.) and combine into one "ingredients" list.
For each ingredient, include the name AND the amount/quantity on the same line (e.g. "鸡翅 8个", "老抽 7ml", "盐 适量").

${langHint}

Return ONLY valid JSON (no markdown, no explanation):
{
  "name": "dish name",
  "kcal": estimated_number,
  "protein": grams_number,
  "carbs": grams_number,
  "fat": grams_number,
  "ingredients": ["ingredient + amount", ...],
  "steps": ["step 1", "step 2", ...],
  "tags": []
}

Estimate reasonable nutrition values if not explicitly stated.
tags must only contain values from: high-protein, low-fat, low-carb, high-carb, vegetarian.`;

  try {
    let raw = '';

    if (provider === 'groq') {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method:'POST',
        headers:{'Authorization':`Bearer ${GROQ_API_KEY}`,'Content-Type':'application/json'},
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          max_tokens: 2048,
          messages: [
            { role:'system', content: systemPrompt },
            { role:'user',   content: sourceContent },
          ],
        }),
      });
      if (!r.ok) throw new Error(`Groq ${r.status}: ${await r.text()}`);
      raw = (await r.json()).choices?.[0]?.message?.content || '';
    }

    else if (provider === 'gemini') {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        { method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({
            contents:[{ parts:[{ text: systemPrompt + '\n\n---\n\n' + sourceContent }] }],
            generationConfig:{ maxOutputTokens:2048 },
          }) }
      );
      if (!r.ok) throw new Error(`Gemini ${r.status}: ${await r.text()}`);
      raw = (await r.json()).candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    else if (provider === 'deepseek') {
      const r = await fetch('https://api.deepseek.com/chat/completions', {
        method:'POST',
        headers:{'Authorization':`Bearer ${DEEPSEEK_API_KEY}`,'Content-Type':'application/json'},
        body: JSON.stringify({
          model:'deepseek-chat',
          max_tokens:2048,
          messages:[
            { role:'system', content: systemPrompt },
            { role:'user',   content: sourceContent },
          ],
        }),
      });
      if (!r.ok) throw new Error(`DeepSeek ${r.status}: ${await r.text()}`);
      raw = (await r.json()).choices?.[0]?.message?.content || '';
    }

    else {
      // Claude fallback
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST',
        headers:{'x-api-key':CLAUDE_API_KEY,'anthropic-version':'2023-06-01','content-type':'application/json'},
        body: JSON.stringify({
          model:'claude-haiku-4-5-20251001',
          max_tokens:2048,
          system: systemPrompt,
          messages:[{ role:'user', content: sourceContent }],
        }),
      });
      if (!r.ok) throw new Error(`Claude ${r.status}: ${await r.text()}`);
      raw = (await r.json()).content?.[0]?.text || '';
    }

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(422).json({ error:'No JSON in response', raw });

    const recipe = JSON.parse(jsonMatch[0]);
    return res.status(200).json({ ...recipe, _provider: provider, sourceUrl: url });

  } catch (e) {
    console.error('[parse-recipe] error:', e);
    return res.status(500).json({ error: e.message });
  }
}

// ── JSON-LD extractor (schema.org/Recipe) ────────────────────────────────────
// schema.org/Recipe の JSON-LD を抽出 / 提取 schema.org/Recipe 的 JSON-LD 结构化数据
function _extractJsonLd(html) {
  const blocks = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  for (const block of blocks) {
    const jsonStr = block.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim();
    try {
      const data = JSON.parse(jsonStr);
      // Support single object, @graph array, or plain array
      const candidates = Array.isArray(data)
        ? data
        : data['@graph']
          ? data['@graph']
          : [data];

      for (const item of candidates) {
        const type = item['@type'];
        const isRecipe = type === 'Recipe' || (Array.isArray(type) && type.includes('Recipe'));
        if (!isRecipe) continue;

        // Extract ingredients — handles string array or HowToIngredient objects
        // 食材抽出 — 文字列配列または HowToIngredient オブジェクトを処理
        // 提取食材 — 支持字符串数组或 HowToIngredient 对象
        const rawIngredients = item.recipeIngredient || item.ingredients || [];
        const ingredients = rawIngredients.map(i =>
          typeof i === 'string' ? i.trim() : (i.name || '') + (i.amount ? ' ' + i.amount : '')
        ).filter(Boolean);

        // Extract steps — handles string, HowToStep, HowToSection
        // 手順抽出 / 提取步骤 — 支持字符串、HowToStep、HowToSection
        const steps = [];
        const instrRaw = item.recipeInstructions || item.instructions || [];
        const instrArr = Array.isArray(instrRaw) ? instrRaw : [instrRaw];
        for (const s of instrArr) {
          if (!s) continue;
          if (typeof s === 'string') {
            steps.push(s.trim());
          } else if (s['@type'] === 'HowToSection' && s.itemListElement) {
            s.itemListElement.forEach(sub => sub.text && steps.push(sub.text.trim()));
          } else if (s.text) {
            steps.push(s.text.trim());
          } else if (s.name) {
            steps.push(s.name.trim());
          }
        }

        // Extract nutrition
        // 栄養素抽出 / 提取营养
        const nutr = item.nutrition || {};
        const kcal   = parseInt(nutr.calories)           || 0;
        const protein = parseFloat(nutr.proteinContent)  || 0;
        const carbs   = parseFloat(nutr.carbohydrateContent) || 0;
        const fat     = parseFloat(nutr.fatContent)      || 0;

        if (!item.name || ingredients.length === 0) continue; // skip incomplete
        return { name: item.name, kcal, protein, carbs, fat, ingredients, steps };
      }
    } catch { /* malformed JSON-LD, skip */ }
  }
  return null;
}

// ── Focused text extractor for AI fallback ───────────────────────────────────
// AI フォールバック用のフォーカスされたテキスト抽出 / 为 AI 提取关键内容（去噪）
function _extractFocusedText(html) {
  // Strip scripts, styles, nav, footer, ads
  // スクリプト・スタイル・ナビ・フッター・広告を除去 / 去除脚本、样式、导航、页脚、广告
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<aside[\s\S]*?<\/aside>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Try to find ingredient / step sections by keyword density
  // キーワード密度で食材・手順セクションを特定 / 通过关键词密度定位食材/步骤区块
  const INGREDIENT_KEYWORDS = /用料|食材|调料|主料|辅料|材料|配料|原料|食品|配方|Ingredients|ingredients|材料/;
  const STEP_KEYWORDS = /做法|步骤|方法|做好|烹饪|烹调|How to|Instructions|Steps|作り方|手順/;

  const segments = text.split(/(?=用料|食材|调料|主料|材料|配料|做法|步骤|Ingredients|Instructions|作り方)/i);
  const relevant = segments.filter(s => INGREDIENT_KEYWORDS.test(s) || STEP_KEYWORDS.test(s));

  // Use focused segments if found, otherwise use full page text (truncated)
  const focused = relevant.length > 0 ? relevant.join('\n') : text;
  return focused.slice(0, 8000);
}
