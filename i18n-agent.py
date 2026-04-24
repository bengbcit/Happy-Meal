#!/usr/bin/env python3
"""
i18n-agent.py — Auto-detect and fill missing translation keys in Happy Meal's i18n.js

What it does (in order):
  1. Parse zh / en / ja key sets from js/i18n.js
  2. Find keys present in zh (master) but missing from en or ja
  3. Scan every .js file for I18n.get('key') calls — flag keys used in code
     but not yet defined anywhere in LANGS
  4. Call Claude API (Haiku — fast & cheap) to batch-translate all missing keys
  5. Patch i18n.js in-place  (creates i18n.js.bak backup first)
  6. Re-parse the patched file to verify completeness
  7. Print a full summary report

Usage:
  python i18n-agent.py                    # check gaps then auto-fix
  python i18n-agent.py --check            # report only, no file changes
  python i18n-agent.py --watch 60         # re-run every 60 s (dev mode)
  python i18n-agent.py --key sk-ant-...   # provide API key inline

Environment variable:
  CLAUDE_API_KEY  —  Anthropic API key  (alternative to --key flag)

Requirements:
  pip install anthropic
"""

import re
import os
import sys
import json
import time
import shutil
import argparse
from pathlib import Path

try:
    import anthropic
except ImportError:
    print("❌  anthropic not installed. Run:  pip install anthropic")
    sys.exit(1)

# Auto-load .env if present
try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent / ".env")
except ImportError:
    pass  # dotenv optional — pip install python-dotenv to enable


# ── Config ─────────────────────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).parent
I18N_FILE = SCRIPT_DIR / "js" / "i18n.js"
JS_DIR = SCRIPT_DIR / "js"

ALL_LANGS = ["zh", "en", "ja"]
MASTER = "zh"

LANG_NAMES = {"zh": "Chinese (Simplified)", "en": "English", "ja": "Japanese"}

# ── Provider configs ────────────────────────────────────────────────────────
# Each provider uses OpenAI-compatible chat completions (Groq/Gemini)
# or the native Anthropic SDK (claude).
PROVIDERS = {
    "claude": {
        "env_key":  "CLAUDE_API_KEY",
        "model":    "claude-haiku-4-5-20251001",
        "sdk":      "anthropic",
        "note":     "Native Anthropic SDK — best tool-use support",
    },
    "groq": {
        "env_key":  "GROQ_API_KEY",
        "model":    "llama-3.3-70b-versatile",   # free tier, fast, supports tools
        "sdk":      "openai_compat",
        "base_url": "https://api.groq.com/openai/v1",
        "note":     "Free tier, 3× faster than Claude Haiku",
    },
    "gemini": {
        "env_key":  "GEMINI_API_KEY",
        "model":    "gemini-1.5-flash",
        "sdk":      "openai_compat",
        "base_url": "https://generativelanguage.googleapis.com/v1beta/openai/",
        "note":     "Free tier via OpenAI-compatible endpoint",
    },
}

SYSTEM_PROMPT = (
    "You are a professional UI translator for a health & diet tracking web app "
    "called 'Happy Meal'. The app helps users manage recipes, track calories, "
    "calculate BMI, and plan weekly meals. "
    "Translations must be: short (UI labels), friendly, encouraging, and accurate. "
    "Never add extra explanation — output only what the UI should display."
)


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 1 — Parse i18n.js
# ══════════════════════════════════════════════════════════════════════════════

def extract_lang_block(content: str, lang: str):
    """
    Find the `lang: { ... }` block inside the LANGS object.
    Returns (inner_text, block_start_idx, block_end_idx+1).
    Uses brace counting so it handles any nesting correctly.
    """
    start_m = re.search(rf'\b{lang}\s*:\s*\{{', content)
    if not start_m:
        return None, -1, -1

    brace_open = start_m.end() - 1   # index of the opening {
    depth = 0
    pos = brace_open

    while pos < len(content):
        ch = content[pos]
        if ch == '{':
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0:
                inner = content[brace_open + 1: pos]
                return inner, start_m.start(), pos + 1
        pos += 1

    return None, -1, -1


def parse_kv(block: str) -> dict:
    """
    Extract  key: 'value'  pairs from a JS object body.
    Handles emoji, {n} placeholders, escaped single quotes, and ← arrows.
    """
    # Match identifier keys with single-quoted values (escaped quotes inside allowed)
    pattern = re.compile(r"(\w+)\s*:\s*'((?:[^'\\]|\\.)*)'")
    result = {}
    for m in pattern.finditer(block):
        key = m.group(1)
        val = m.group(2).replace("\\'", "'").replace("\\\\", "\\")
        result[key] = val
    return result


def load_all_langs(content: str) -> dict:
    """Parse all language blocks and return {lang: {key: value}}."""
    result = {}
    for lang in ALL_LANGS:
        block, _, _ = extract_lang_block(content, lang)
        if block is None:
            print(f"  ❌  Cannot find '{lang}:' block in i18n.js")
            sys.exit(1)
        result[lang] = parse_kv(block)
    return result


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 2 — Scan JS files for used keys
# ══════════════════════════════════════════════════════════════════════════════

def scan_used_keys(js_dir: Path) -> dict:
    """
    Scan every *.js file for  I18n.get('key')  calls.
    Returns {key: [list_of_filenames_where_used]}.
    """
    used = {}
    pattern = re.compile(r"""I18n\.get\(\s*['"](\w+)['"]""")
    for js_file in sorted(js_dir.glob("*.js")):
        text = js_file.read_text(encoding="utf-8")
        for m in pattern.finditer(text):
            key = m.group(1)
            used.setdefault(key, []).append(js_file.name)
    return used


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 3 — Translate via Claude
# ══════════════════════════════════════════════════════════════════════════════

def _build_client(provider: str, api_key: str):
    """
    Return a client object for the chosen provider.
    - claude  → anthropic.Anthropic
    - groq / gemini → openai.OpenAI pointed at their base_url
    """
    cfg = PROVIDERS[provider]
    if cfg["sdk"] == "anthropic":
        return anthropic.Anthropic(api_key=api_key)
    else:
        try:
            import openai
        except ImportError:
            print("❌  pip install openai   (needed for groq / gemini provider)")
            sys.exit(1)
        return openai.OpenAI(api_key=api_key, base_url=cfg["base_url"])


def _call_llm(client, provider: str, user_prompt: str) -> str:
    """
    Unified LLM call — handles both Anthropic and OpenAI-compat clients.
    Returns the raw text response.
    """
    cfg = PROVIDERS[provider]
    model = cfg["model"]

    if cfg["sdk"] == "anthropic":
        resp = client.messages.create(
            model=model, max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_prompt}]
        )
        return resp.content[0].text.strip()
    else:
        resp = client.chat.completions.create(
            model=model, max_tokens=1024,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content": user_prompt},
            ]
        )
        return resp.choices[0].message.content.strip()


def translate_batch(lang: str, missing_keys: list, zh_kv: dict, en_kv: dict,
                    client, provider: str) -> dict:
    """
    Translate missing_keys into `lang` using the given client/provider.
    Returns {key: translated_string}.
    """
    lang_name = LANG_NAMES[lang]

    ref_lines = []
    for key in sorted(missing_keys):
        zh_val = zh_kv.get(key, "")
        en_val = en_kv.get(key, "")
        ref_lines.append(f"  {key}:")
        ref_lines.append(f"    zh = {zh_val!r}")
        if en_val:
            ref_lines.append(f"    en = {en_val!r}")

    user_prompt = f"""Translate the following UI strings into **{lang_name}**.

Rules:
- Preserve emoji exactly as shown in zh/en
- Keep {{n}} placeholders exactly (they are runtime variables)
- Keep ← → arrows and special characters unchanged
- Output ONLY a JSON object — no markdown, no explanation

Reference strings (zh + en where available):
{chr(10).join(ref_lines)}

Output format (strict JSON, no code fences):
{{
  "key1": "translation1",
  "key2": "translation2"
}}"""

    raw = _call_llm(client, provider, user_prompt)
    raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.MULTILINE)
    raw = re.sub(r"\s*```$", "", raw, flags=re.MULTILINE).strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"    ⚠️  JSON parse error ({e}) — raw:\n{raw[:400]}")
        return {}


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 4 — Patch i18n.js in-place
# ══════════════════════════════════════════════════════════════════════════════

def escape_js_string(val: str) -> str:
    """Escape a Python string for use inside JS single quotes."""
    return val.replace("\\", "\\\\").replace("'", "\\'")


def patch_lang_block(content: str, lang: str, new_kv: dict) -> str:
    """
    Insert missing key-value pairs just before the closing } of `lang`'s block.
    Adds a comment so it's easy to spot what was auto-filled.
    """
    if not new_kv:
        return content

    _, _, end_idx = extract_lang_block(content, lang)
    if end_idx == -1:
        print(f"    ⚠️  Could not locate {lang} block — skipping patch")
        return content

    lines = ["", "      // ── auto-filled by i18n-agent ──────────────────"]
    for key in sorted(new_kv.keys()):
        escaped = escape_js_string(new_kv[key])
        lines.append(f"      {key}: '{escaped}',")
    lines.append("    ")   # indentation before closing }

    insert = "\n".join(lines)
    # end_idx points one past the closing } — insert just before it
    return content[: end_idx - 1] + insert + content[end_idx - 1:]


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 5 — Core agent run (single pass)
# ══════════════════════════════════════════════════════════════════════════════

def run_once(api_key: str | None, check_only: bool, provider: str = "claude") -> bool:
    """
    Execute one full check-and-fix cycle.
    Returns True if any changes were made (or needed).
    """
    sep = "─" * 60
    print(f"\n{sep}")
    print(f"🕐  {time.strftime('%Y-%m-%d %H:%M:%S')}  |  Happy Meal i18n Agent")
    print(sep)

    # ── Read file ──────────────────────────────────────────────────
    content = I18N_FILE.read_text(encoding="utf-8")
    print(f"📄  {I18N_FILE}  ({len(content):,} chars)")

    # ── Parse ──────────────────────────────────────────────────────
    lang_kvs = load_all_langs(content)
    for lang in ALL_LANGS:
        print(f"  {lang}: {len(lang_kvs[lang])} keys")

    zh_kv = lang_kvs[MASTER]
    master_keys = set(zh_kv.keys())

    # ── Find gaps in en / ja ───────────────────────────────────────
    print(f"\n📊  Gap Analysis")
    missing_by_lang: dict[str, list] = {}
    any_missing = False
    for lang in ALL_LANGS:
        if lang == MASTER:
            continue
        missing = sorted(master_keys - set(lang_kvs[lang].keys()))
        missing_by_lang[lang] = missing
        if missing:
            any_missing = True
            print(f"\n  ⚠️  {lang.upper()}  — {len(missing)} missing key(s):")
            for k in missing:
                print(f"       {k!r:40s}  zh={zh_kv[k]!r}")
        else:
            print(f"\n  ✅  {lang.upper()}  — complete")

    # ── Scan JS for used-but-undefined keys ───────────────────────
    print(f"\n🔍  Scanning JS files for I18n.get() usage …")
    used = scan_used_keys(JS_DIR)
    orphans = sorted(set(used.keys()) - master_keys)
    if orphans:
        any_missing = True
        print(f"  ⚠️  {len(orphans)} key(s) used in JS but not defined in zh:")
        for k in orphans:
            print(f"       {k!r:40s}  used in: {', '.join(used[k])}")
    else:
        print(f"  ✅  All I18n.get() keys are defined in zh")

    # ── Early exit if nothing to fix ──────────────────────────────
    if not any_missing:
        print(f"\n🎉  Everything is in sync — no changes needed.")
        return False

    total = sum(len(v) for v in missing_by_lang.values())
    print(f"\n{'📋 Check-only mode' if check_only else '🔧 Auto-fix mode'}:  "
          f"{total} translation(s) missing across "
          f"{sum(1 for v in missing_by_lang.values() if v)} language(s).")

    if check_only:
        return True

    if not api_key:
        print("❌  CLAUDE_API_KEY not set. Use --key or set the env var.")
        sys.exit(1)

    # ── Translate ──────────────────────────────────────────────────
    cfg = PROVIDERS[provider]
    print(
        f"\n🌐  Translating via [{provider}]  model={cfg['model']}  ({cfg['note']})")
    client = _build_client(provider, api_key)
    en_kv = lang_kvs.get("en", {})
    translations: dict[str, dict] = {}

    for lang, keys in missing_by_lang.items():
        if not keys:
            continue
        print(f"\n  [{lang}]  translating {len(keys)} key(s) …")
        result = translate_batch(lang, keys, zh_kv, en_kv, client, provider)
        translations[lang] = result
        print(f"  [{lang}]  ✅  received {len(result)} translation(s)")
        if len(result) != len(keys):
            still = sorted(set(keys) - set(result.keys()))
            print(f"  [{lang}]  ⚠️  missing in response: {still}")

    # ── Backup + Patch ─────────────────────────────────────────────
    backup = I18N_FILE.with_suffix(".js.bak")
    shutil.copy2(I18N_FILE, backup)
    print(f"\n💾  Backup saved → {backup.name}")

    patched = content
    for lang, new_kv in translations.items():
        if new_kv:
            patched = patch_lang_block(patched, lang, new_kv)
            print(f"  ✏️   Patched {len(new_kv)} key(s) into [{lang}] block")

    I18N_FILE.write_text(patched, encoding="utf-8")
    print(f"💾  Wrote patched file → {I18N_FILE.name}")

    # ── Verify ─────────────────────────────────────────────────────
    print(f"\n🔎  Verification pass …")
    content2 = I18N_FILE.read_text(encoding="utf-8")
    lang_kvs2 = load_all_langs(content2)
    all_ok = True

    for lang in ALL_LANGS:
        if lang == MASTER:
            continue
        still_missing = sorted(master_keys - set(lang_kvs2[lang].keys()))
        if still_missing:
            all_ok = False
            print(
                f"  ⚠️  [{lang}] still missing {len(still_missing)} key(s): {still_missing}")
        else:
            print(f"  ✅  [{lang}]  {len(lang_kvs2[lang])} keys — complete")

    if all_ok:
        print(
            f"\n🎉  i18n.js is fully complete in all {len(ALL_LANGS)} languages!")
    else:
        print(f"\n⚠️  Some keys still missing — re-run to retry.")

    return True


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 6 — Entry point
# ══════════════════════════════════════════════════════════════════════════════

def main():
    provider_list = ", ".join(PROVIDERS.keys())
    parser = argparse.ArgumentParser(
        description="Happy Meal i18n gap checker & auto-filler",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    parser.add_argument("--check", action="store_true",
                        help="Report only — no API call, no file changes")
    parser.add_argument("--provider", default="claude", choices=list(PROVIDERS.keys()),
                        metavar="PROVIDER",
                        help=f"AI provider: {provider_list}  (default: claude)")
    parser.add_argument("--key", default=None, metavar="API_KEY",
                        help="API key (overrides env var for chosen provider)")
    parser.add_argument("--watch", type=int, default=0, metavar="SECONDS",
                        help="Re-run every N seconds (0 = run once)")
    args = parser.parse_args()

    # Resolve API key: --key flag > env var for the chosen provider
    provider = args.provider
    api_key = args.key or os.environ.get(PROVIDERS[provider]["env_key"])

    if not args.check:
        if not api_key:
            env_name = PROVIDERS[provider]["env_key"]
            print(f"❌  No API key for [{provider}].")
            print(f"    Set {env_name} in .env, or use --key sk-...")
            sys.exit(1)
        print(f"🔑  Provider: {provider}  |  key: {api_key[:12]}…")

    if args.watch > 0:
        print(f"👀  Watch mode — every {args.watch}s  (Ctrl+C to stop)")
        try:
            while True:
                run_once(api_key, args.check, provider)
                print(f"\n⏳  Next check in {args.watch}s …")
                time.sleep(args.watch)
        except KeyboardInterrupt:
            print("\n👋  Stopped.")
    else:
        run_once(api_key, args.check, provider)


if __name__ == "__main__":
    main()
