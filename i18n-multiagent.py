#!/usr/bin/env python3
"""
i18n-multiagent.py — Multi-agent i18n gap fixer for Happy Meal
═══════════════════════════════════════════════════════════════

Architecture
────────────
  Orchestrator                 ← decides the whole workflow
    ├── ScannerAgent           ← reads i18n.js + scans JS, returns gap report
    ├── TranslatorAgent(en)  ┐
    ├── TranslatorAgent(ja)  ┘ ← run in PARALLEL threads
    ├── PatcherAgent           ← patches i18n.js with the translations
    └── VerifierAgent          ← re-reads the file, confirms completeness

Key ideas
─────────
  • Each agent has its own SYSTEM PROMPT  (what it is / what it must do)
  • Each agent has its own TOOLS          (what actions it can take)
  • Each agent runs an AGENTIC LOOP       (Claude ↔ tools until done)
  • Agents communicate via structured dicts (like JSON APIs)
  • The Orchestrator retries failed agents up to MAX_RETRIES times
  • Translator agents run in parallel threads to save time

Usage
─────
  python i18n-multiagent.py --key sk-ant-...   # full run
  python i18n-multiagent.py --check            # scan only, no changes
  CLAUDE_API_KEY=sk-ant-... python i18n-multiagent.py
"""

import re, os, sys, json, time, shutil, argparse, threading
from pathlib import Path
from typing import Optional
from copy import deepcopy

try:
    import anthropic
except ImportError:
    print("❌  pip install anthropic")
    sys.exit(1)

# Auto-load .env if present
try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent / ".env")
except ImportError:
    pass  # dotenv optional — pip install python-dotenv to enable


# ══════════════════════════════════════════════════════════════════════
# CONFIG
# ══════════════════════════════════════════════════════════════════════

SCRIPT_DIR  = Path(__file__).parent
I18N_FILE   = SCRIPT_DIR / "js" / "i18n.js"
JS_DIR      = SCRIPT_DIR / "js"
ALL_LANGS   = ["zh", "en", "ja"]
MASTER      = "zh"
MODEL       = "claude-haiku-4-5-20251001"   # fast + cheap for agents
MAX_RETRIES = 3


# ══════════════════════════════════════════════════════════════════════
# SHARED TOOL IMPLEMENTATIONS  (pure Python, no LLM needed)
# Agents call these; results are sent back to Claude as tool_results
# ══════════════════════════════════════════════════════════════════════

def _read_file(path: str) -> dict:
    p = Path(path)
    if not p.exists():
        return {"ok": False, "error": f"File not found: {path}"}
    return {"ok": True, "content": p.read_text(encoding="utf-8"), "size": p.stat().st_size}


def _write_file(path: str, content: str) -> dict:
    try:
        Path(path).write_text(content, encoding="utf-8")
        return {"ok": True, "bytes_written": len(content)}
    except Exception as e:
        return {"ok": False, "error": str(e)}


def _backup_file(path: str) -> dict:
    src = Path(path)
    bak = src.with_suffix(src.suffix + ".bak")
    try:
        shutil.copy2(src, bak)
        return {"ok": True, "backup_path": str(bak)}
    except Exception as e:
        return {"ok": False, "error": str(e)}


def _parse_i18n(content: str) -> dict:
    """Extract {lang: {key: value}} from i18n.js source."""
    def extract_block(text, lang):
        m = re.search(rf'\b{lang}\s*:\s*\{{', text)
        if not m:
            return None
        depth, pos = 0, m.end() - 1
        while pos < len(text):
            if text[pos] == '{':  depth += 1
            elif text[pos] == '}':
                depth -= 1
                if depth == 0:
                    return text[m.end():pos]
            pos += 1
        return None

    result = {}
    for lang in ALL_LANGS:
        block = extract_block(content, lang)
        if block is None:
            result[lang] = {}
            continue
        kv = {}
        for m in re.finditer(r"(\w+)\s*:\s*'((?:[^'\\]|\\.)*)'", block):
            kv[m.group(1)] = m.group(2).replace("\\'", "'").replace("\\\\", "\\")
        result[lang] = kv
    return result


def _scan_js_for_keys(js_dir: str) -> dict:
    """Find all I18n.get('key') calls across *.js files."""
    used = {}
    pat = re.compile(r"""I18n\.get\(\s*['"](\w+)['"]""")
    for f in sorted(Path(js_dir).glob("*.js")):
        for m in pat.finditer(f.read_text(encoding="utf-8")):
            used.setdefault(m.group(1), []).append(f.name)
    return used


def _patch_lang_block(content: str, lang: str, new_kv: dict) -> dict:
    """Insert new key-value pairs just before the closing } of lang's block."""
    def find_block_end(text, lang):
        m = re.search(rf'\b{lang}\s*:\s*\{{', text)
        if not m:
            return -1
        depth, pos = 0, m.end() - 1
        while pos < len(text):
            if text[pos] == '{':  depth += 1
            elif text[pos] == '}':
                depth -= 1
                if depth == 0:
                    return pos
            pos += 1
        return -1

    end = find_block_end(content, lang)
    if end == -1:
        return {"ok": False, "error": f"Cannot find {lang} block"}

    lines = ["\n      // ── auto-filled by i18n-multiagent ────────────"]
    for key, val in sorted(new_kv.items()):
        escaped = val.replace("\\", "\\\\").replace("'", "\\'")
        lines.append(f"      {key}: '{escaped}',")
    lines.append("    ")
    insert = "\n".join(lines)

    patched = content[:end] + insert + content[end:]
    return {"ok": True, "patched_content": patched}


# ══════════════════════════════════════════════════════════════════════
# BASE AGENT  — shared agentic loop logic
# ══════════════════════════════════════════════════════════════════════

class BaseAgent:
    NAME   = "BaseAgent"
    SYSTEM = "You are a helpful agent."
    TOOLS  = []   # list of tool dicts (Anthropic tool schema)

    def __init__(self, client: anthropic.Anthropic):
        self.client = client

    def _log(self, msg: str):
        print(f"  [{self.NAME}] {msg}")

    def _execute_tool(self, name: str, inp: dict) -> dict:
        """Dispatch a tool call to the correct Python function."""
        raise NotImplementedError

    def _run_loop(self, user_message: str) -> str:
        """
        Core agentic loop:
          1. Send message to Claude
          2. If Claude calls tools → execute them → feed results back
          3. Repeat until Claude gives a plain text response (stop_reason=end_turn)
          4. Return that final text
        """
        messages = [{"role": "user", "content": user_message}]
        steps = 0

        while steps < 10:   # safety cap — no infinite loops
            steps += 1
            resp = self.client.messages.create(
                model=MODEL,
                system=self.SYSTEM,
                tools=self.TOOLS,
                messages=messages,
                max_tokens=2048,
            )

            # Append assistant turn
            messages.append({"role": "assistant", "content": resp.content})

            if resp.stop_reason == "end_turn":
                # Claude finished — extract the text
                for block in resp.content:
                    if hasattr(block, "text"):
                        return block.text
                return ""

            if resp.stop_reason == "tool_use":
                # Claude wants to call one or more tools
                tool_results = []
                for block in resp.content:
                    if block.type == "tool_use":
                        self._log(f"→ tool call: {block.name}({list(block.input.keys())})")
                        result = self._execute_tool(block.name, block.input)
                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": json.dumps(result, ensure_ascii=False),
                        })
                messages.append({"role": "user", "content": tool_results})

        return "ERROR: agentic loop exceeded step limit"


# ══════════════════════════════════════════════════════════════════════
# AGENT 1 — ScannerAgent
# Goal: read i18n.js + scan JS files → return structured gap report
# ══════════════════════════════════════════════════════════════════════

class ScannerAgent(BaseAgent):
    NAME   = "Scanner"
    SYSTEM = """You are a code-analysis agent for an i18n system.
Your ONLY job: detect missing translation keys and used-but-undefined keys.

Steps you must follow:
1. Call read_file to get i18n.js content
2. Call parse_i18n to extract all language key sets
3. Call scan_js_for_keys to find all I18n.get() usages
4. Compare: find keys in zh but missing from en or ja
5. Compare: find keys used in JS but missing from zh
6. Return a JSON object with this exact shape (no other text):
{
  "lang_key_counts": {"zh": N, "en": N, "ja": N},
  "missing_by_lang": {"en": ["key1", ...], "ja": ["key1", ...]},
  "orphan_keys": ["key_used_in_js_but_not_in_zh"],
  "all_complete": true/false
}"""

    TOOLS = [
        {
            "name": "read_file",
            "description": "Read a file from the filesystem",
            "input_schema": {
                "type": "object",
                "properties": {"path": {"type": "string", "description": "Absolute or relative file path"}},
                "required": ["path"]
            }
        },
        {
            "name": "parse_i18n",
            "description": "Parse i18n.js content into {lang: {key: value}} dict",
            "input_schema": {
                "type": "object",
                "properties": {"content": {"type": "string", "description": "Raw i18n.js file content"}},
                "required": ["content"]
            }
        },
        {
            "name": "scan_js_for_keys",
            "description": "Scan all JS files for I18n.get('key') calls, returns {key: [files]}",
            "input_schema": {
                "type": "object",
                "properties": {"js_dir": {"type": "string", "description": "Path to the js/ directory"}},
                "required": ["js_dir"]
            }
        },
    ]

    def _execute_tool(self, name, inp):
        if name == "read_file":      return _read_file(inp["path"])
        if name == "parse_i18n":     return _parse_i18n(inp["content"])
        if name == "scan_js_for_keys": return _scan_js_for_keys(inp["js_dir"])
        return {"error": f"Unknown tool: {name}"}

    def run(self) -> dict:
        """
        If client is available → full agentic loop (Claude calls tools).
        If client is None      → run pure-Python fast path (same logic, no API).
        This lets --check mode work without an API key.
        """
        self._log("Starting scan …")

        if self.client is None:
            return self._run_pure_python()

        raw = self._run_loop(
            f"Please analyse i18n gaps.\n"
            f"i18n file: {I18N_FILE}\n"
            f"JS directory: {JS_DIR}\n"
            f"Master language: {MASTER}\n"
            f"All languages: {ALL_LANGS}"
        )
        try:
            clean = re.sub(r"^```(?:json)?\s*", "", raw.strip(), flags=re.MULTILINE)
            clean = re.sub(r"\s*```$", "", clean, flags=re.MULTILINE).strip()
            result = json.loads(clean)
            self._log(f"✅ Scan complete — zh:{result['lang_key_counts'].get('zh')} "
                      f"en:{result['lang_key_counts'].get('en')} "
                      f"ja:{result['lang_key_counts'].get('ja')}")
            return result
        except json.JSONDecodeError:
            self._log(f"⚠️  Could not parse JSON from agent. Falling back to pure-Python.")
            return self._run_pure_python()

    def _run_pure_python(self) -> dict:
        """Fast-path scanner — no LLM, same results."""
        content   = _read_file(str(I18N_FILE))["content"]
        lang_kvs  = _parse_i18n(content)
        used_keys = _scan_js_for_keys(str(JS_DIR))
        master    = set(lang_kvs.get(MASTER, {}).keys())

        missing_by_lang = {}
        for lang in ALL_LANGS:
            if lang == MASTER:
                continue
            missing = sorted(master - set(lang_kvs.get(lang, {}).keys()))
            if missing:
                missing_by_lang[lang] = missing

        orphans = sorted(set(used_keys.keys()) - master)
        counts  = {lang: len(lang_kvs.get(lang, {})) for lang in ALL_LANGS}
        complete = not missing_by_lang and not orphans

        self._log(f"✅ zh:{counts['zh']} en:{counts['en']} ja:{counts['ja']}"
                  + (f"  |  gaps: {list(missing_by_lang.keys())}" if missing_by_lang else "  |  all complete"))
        return {
            "lang_key_counts": counts,
            "missing_by_lang": missing_by_lang,
            "orphan_keys": orphans,
            "all_complete": complete,
        }


# ══════════════════════════════════════════════════════════════════════
# AGENT 2 — TranslatorAgent
# Goal: translate a list of keys into one target language
# (Two instances run in parallel threads for en + ja)
# ══════════════════════════════════════════════════════════════════════

class TranslatorAgent(BaseAgent):
    NAME = "Translator"

    SYSTEM = """You are a professional UI translator for 'Happy Meal', a health & diet app.
Translation rules:
- Keep emoji exactly as shown in the reference
- Keep {n} placeholder variables unchanged
- Keep ← → ✅ 💾 📧 and similar symbols unchanged
- Short UI labels: friendly, encouraging, natural

Your ONLY job: translate the keys you are given and return a JSON object.
Return ONLY valid JSON — no explanation, no markdown fences."""

    TOOLS = []  # Translator doesn't need file tools — data is passed directly

    def _execute_tool(self, name, inp):
        return {"error": "TranslatorAgent has no tools"}

    def run(self, lang: str, missing_keys: list, zh_kv: dict, en_kv: dict) -> dict:
        """
        Returns {"lang": lang, "translations": {key: value}, "success": bool}
        """
        self._log(f"Translating {len(missing_keys)} keys → {lang} …")

        lang_names = {"en": "English", "ja": "Japanese"}
        lang_name  = lang_names.get(lang, lang)

        # Build a rich reference: zh + en for context
        ref = []
        for key in sorted(missing_keys):
            ref.append(f"  {key}:")
            ref.append(f"    zh = {zh_kv.get(key, '')!r}")
            if en_kv.get(key):
                ref.append(f"    en = {en_kv[key]!r}")

        prompt = (
            f"Translate these Happy Meal UI strings into **{lang_name}**.\n\n"
            f"Reference (zh + en where available):\n"
            + "\n".join(ref)
            + "\n\nOutput — strict JSON only:\n"
              '{\n  "key1": "translation1",\n  "key2": "translation2"\n}'
        )

        raw = self._run_loop(prompt)

        try:
            clean = re.sub(r"^```(?:json)?\s*", "", raw.strip(), flags=re.MULTILINE)
            clean = re.sub(r"\s*```$", "", clean, flags=re.MULTILINE).strip()
            translations = json.loads(clean)
            self._log(f"✅ {lang}: {len(translations)}/{len(missing_keys)} keys translated")
            return {"lang": lang, "translations": translations, "success": True}
        except json.JSONDecodeError:
            self._log(f"⚠️  JSON parse failed for {lang}. Raw: {raw[:200]}")
            return {"lang": lang, "translations": {}, "success": False, "error": raw}


# ══════════════════════════════════════════════════════════════════════
# AGENT 3 — PatcherAgent
# Goal: apply translations to i18n.js safely (backup + patch + write)
# ══════════════════════════════════════════════════════════════════════

class PatcherAgent(BaseAgent):
    NAME   = "Patcher"
    SYSTEM = """You are a file-patching agent for an i18n system.
Your job: safely apply new translation keys to i18n.js.

Steps you must follow in order:
1. Call backup_file to create a .bak before touching anything
2. Call read_file to get current i18n.js content
3. For EACH language with new keys, call patch_lang_block
4. Call write_file to save the final patched content
5. Return a JSON summary:
{
  "patched_langs": ["en", "ja"],
  "keys_added": {"en": N, "ja": N},
  "backup_path": "...",
  "success": true
}"""

    TOOLS = [
        {
            "name": "backup_file",
            "description": "Create a .bak copy of a file before modifying it",
            "input_schema": {"type": "object", "properties": {"path": {"type": "string"}}, "required": ["path"]}
        },
        {
            "name": "read_file",
            "description": "Read a file",
            "input_schema": {"type": "object", "properties": {"path": {"type": "string"}}, "required": ["path"]}
        },
        {
            "name": "patch_lang_block",
            "description": "Insert new key-value pairs into a language block in i18n.js content",
            "input_schema": {
                "type": "object",
                "properties": {
                    "content":  {"type": "string", "description": "Current i18n.js file content"},
                    "lang":     {"type": "string", "description": "Language code: en or ja"},
                    "new_keys": {"type": "object", "description": "Dict of {key: translated_value} to add"},
                },
                "required": ["content", "lang", "new_keys"]
            }
        },
        {
            "name": "write_file",
            "description": "Write content to a file",
            "input_schema": {
                "type": "object",
                "properties": {
                    "path":    {"type": "string"},
                    "content": {"type": "string"},
                },
                "required": ["path", "content"]
            }
        },
    ]

    def _execute_tool(self, name, inp):
        if name == "backup_file":      return _backup_file(inp["path"])
        if name == "read_file":        return _read_file(inp["path"])
        if name == "patch_lang_block": return _patch_lang_block(inp["content"], inp["lang"], inp["new_keys"])
        if name == "write_file":       return _write_file(inp["path"], inp["content"])
        return {"error": f"Unknown tool: {name}"}

    def run(self, translations_by_lang: dict) -> dict:
        """
        translations_by_lang: {lang: {key: value, ...}}
        Returns {"success": bool, "keys_added": {lang: N}}
        """
        langs_with_data = {k: v for k, v in translations_by_lang.items() if v}
        if not langs_with_data:
            self._log("Nothing to patch.")
            return {"success": True, "keys_added": {}}

        self._log(f"Patching {list(langs_with_data.keys())} …")
        summary_lines = [f"  {lang}: {list(kv.items())[:3]}…" for lang, kv in langs_with_data.items()]
        prompt = (
            f"Apply these new translations to {I18N_FILE}.\n\n"
            f"Translations:\n{json.dumps(langs_with_data, ensure_ascii=False, indent=2)}\n\n"
            f"i18n file path: {I18N_FILE}"
        )

        raw = self._run_loop(prompt)

        try:
            clean = re.sub(r"^```(?:json)?\s*", "", raw.strip(), flags=re.MULTILINE)
            clean = re.sub(r"\s*```$", "", clean, flags=re.MULTILINE).strip()
            result = json.loads(clean)
            self._log(f"✅ Patch applied: {result.get('keys_added')}")
            return result
        except json.JSONDecodeError:
            self._log(f"⚠️  Could not parse patch result. Raw: {raw[:200]}")
            return {"success": False, "error": raw}


# ══════════════════════════════════════════════════════════════════════
# AGENT 4 — VerifierAgent
# Goal: re-parse i18n.js, confirm all languages are complete
# ══════════════════════════════════════════════════════════════════════

class VerifierAgent(BaseAgent):
    NAME   = "Verifier"
    SYSTEM = """You are a verification agent for an i18n system.
Your job: confirm that i18n.js is complete — every language has the same keys as zh.

Steps:
1. Call read_file to get current i18n.js
2. Call parse_i18n to extract key sets
3. Compare en and ja key sets against zh
4. Return a JSON report:
{
  "complete": true/false,
  "key_counts": {"zh": N, "en": N, "ja": N},
  "remaining_gaps": {"en": [], "ja": ["missing_key1"]},
  "verdict": "one-line human summary"
}"""

    TOOLS = [
        {
            "name": "read_file",
            "description": "Read a file",
            "input_schema": {"type": "object", "properties": {"path": {"type": "string"}}, "required": ["path"]}
        },
        {
            "name": "parse_i18n",
            "description": "Parse i18n.js content into {lang: {key: value}}",
            "input_schema": {"type": "object", "properties": {"content": {"type": "string"}}, "required": ["content"]}
        },
    ]

    def _execute_tool(self, name, inp):
        if name == "read_file":  return _read_file(inp["path"])
        if name == "parse_i18n": return _parse_i18n(inp["content"])
        return {"error": f"Unknown tool: {name}"}

    def run(self) -> dict:
        self._log("Verifying …")
        raw = self._run_loop(f"Verify that {I18N_FILE} is complete.")

        try:
            clean = re.sub(r"^```(?:json)?\s*", "", raw.strip(), flags=re.MULTILINE)
            clean = re.sub(r"\s*```$", "", clean, flags=re.MULTILINE).strip()
            result = json.loads(clean)
            status = "✅ COMPLETE" if result.get("complete") else "⚠️  INCOMPLETE"
            self._log(f"{status} — {result.get('verdict', '')}")
            return result
        except json.JSONDecodeError:
            self._log(f"⚠️  Could not parse verify result. Raw: {raw[:200]}")
            return {"complete": False, "remaining_gaps": {}, "error": raw}


# ══════════════════════════════════════════════════════════════════════
# ORCHESTRATOR
# Coordinates all agents, handles parallel translation + retry logic
# ══════════════════════════════════════════════════════════════════════

def run_parallel_translators(client, missing_by_lang, zh_kv, en_kv):
    """
    Spawn one TranslatorAgent per language in separate threads.
    Returns {lang: {key: translation}} when all threads finish.
    """
    results = {}
    threads = []

    def translate_one(lang, keys):
        agent = TranslatorAgent(client)
        agent.NAME = f"Translator[{lang}]"
        result = agent.run(lang, keys, zh_kv, en_kv)
        results[lang] = result.get("translations", {})

    for lang, keys in missing_by_lang.items():
        if keys:
            t = threading.Thread(target=translate_one, args=(lang, keys))
            threads.append(t)
            t.start()

    for t in threads:
        t.join()

    return results


class Orchestrator:
    SEP = "═" * 64

    def __init__(self, client: anthropic.Anthropic):
        self.client = client

    def _log(self, msg):
        print(f"[Orchestrator] {msg}")

    def run(self, check_only: bool = False):
        print(f"\n{self.SEP}")
        print(f"  Happy Meal i18n Multi-Agent  |  {time.strftime('%H:%M:%S')}")
        print(self.SEP)

        # ── Step 1: Scanner ──────────────────────────────────────────
        print(f"\n{'─'*40}")
        print(f"  STEP 1 / 4  —  ScannerAgent")
        print(f"{'─'*40}")
        scanner = ScannerAgent(self.client)
        scan    = scanner.run()

        if scan.get("error"):
            self._log(f"❌ Scanner failed: {scan['error'][:200]}")
            return

        missing_by_lang = {
            lang: keys
            for lang, keys in scan.get("missing_by_lang", {}).items()
            if keys
        }
        orphans = scan.get("orphan_keys", [])

        # Print gap summary
        print()
        for lang, keys in missing_by_lang.items():
            print(f"  ⚠️  [{lang.upper()}]  {len(keys)} missing key(s):")
            for k in keys:
                print(f"       {k}")
        if orphans:
            print(f"\n  ⚠️  [JS] {len(orphans)} key(s) used but not defined in zh:")
            for k in orphans:
                print(f"       {k}")
        if not missing_by_lang and not orphans:
            print(f"\n  ✅  Everything is complete — nothing to do!")
            return

        if check_only:
            self._log("Check-only mode — stopping here.")
            return

        # ── Step 2: Translators (parallel) ───────────────────────────
        print(f"\n{'─'*40}")
        print(f"  STEP 2 / 4  —  TranslatorAgents  (parallel: {list(missing_by_lang.keys())})")
        print(f"{'─'*40}")

        # We need the zh and en key-value dicts for reference
        # Re-parse from file (fast)
        content = I18N_FILE.read_text(encoding="utf-8")
        all_kv  = _parse_i18n(content)
        zh_kv   = all_kv.get(MASTER, {})
        en_kv   = all_kv.get("en", {})

        translations_by_lang = run_parallel_translators(
            self.client, missing_by_lang, zh_kv, en_kv
        )

        # Check translation coverage
        all_translated = True
        for lang, keys in missing_by_lang.items():
            got = translations_by_lang.get(lang, {})
            missed = set(keys) - set(got.keys())
            if missed:
                all_translated = False
                self._log(f"⚠️  [{lang}] translator missed: {list(missed)}")

        # ── Step 3: Patcher ──────────────────────────────────────────
        print(f"\n{'─'*40}")
        print(f"  STEP 3 / 4  —  PatcherAgent")
        print(f"{'─'*40}")
        patcher      = PatcherAgent(self.client)
        patch_result = patcher.run(translations_by_lang)

        if not patch_result.get("success"):
            self._log(f"❌ Patcher failed: {patch_result.get('error', '?')[:200]}")
            return

        # ── Step 4: Verifier (with retry) ────────────────────────────
        print(f"\n{'─'*40}")
        print(f"  STEP 4 / 4  —  VerifierAgent")
        print(f"{'─'*40}")

        for attempt in range(1, MAX_RETRIES + 1):
            verifier = VerifierAgent(self.client)
            verify   = verifier.run()

            if verify.get("complete"):
                break

            # Gaps remain — retry translation + patch for leftovers
            remaining = verify.get("remaining_gaps", {})
            leftover  = {lang: keys for lang, keys in remaining.items() if keys}

            if not leftover or attempt == MAX_RETRIES:
                break

            self._log(f"Retry {attempt}/{MAX_RETRIES}: {leftover}")
            retry_translations = run_parallel_translators(self.client, leftover, zh_kv, en_kv)
            patcher.run(retry_translations)

        # ── Final summary ────────────────────────────────────────────
        print(f"\n{self.SEP}")
        counts = verify.get("key_counts", {})
        if verify.get("complete"):
            print(f"  🎉  ALL DONE  —  zh:{counts.get('zh')} en:{counts.get('en')} ja:{counts.get('ja')}")
        else:
            gaps = verify.get("remaining_gaps", {})
            print(f"  ⚠️  Finished with gaps: {gaps}")
        print(self.SEP)


# ══════════════════════════════════════════════════════════════════════
# ENTRY POINT
# ══════════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        description="Multi-agent i18n gap fixer",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    parser.add_argument("--key",   default=os.environ.get("CLAUDE_API_KEY"), metavar="API_KEY",
                        help="Anthropic API key (or set CLAUDE_API_KEY env var)")
    parser.add_argument("--check", action="store_true",
                        help="Scan only — no translations, no file changes")
    args = parser.parse_args()

    if not args.check and not args.key:
        print("❌  No API key. Use --key sk-ant-... or set CLAUDE_API_KEY env var.")
        print("    For check-only mode, use --check (no key needed).")
        sys.exit(1)

    # --check mode doesn't call the API at all — pass None-safe client
    if args.check:
        Orchestrator(None).run(check_only=True)
    else:
        client = anthropic.Anthropic(api_key=args.key)
        Orchestrator(client).run(check_only=False)


if __name__ == "__main__":
    main()
