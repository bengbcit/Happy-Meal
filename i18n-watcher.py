#!/usr/bin/env python3
"""
i18n-watcher.py — 监听 js/ 目录，文件一改动就自动修复 i18n 缺漏
用法：python i18n-watcher.py --provider groq
      python i18n-watcher.py --provider groq --interval 30
"""
import sys
import time
import subprocess
from pathlib import Path

try:
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler
except ImportError:
    print("❌  pip install watchdog")
    sys.exit(1)

import argparse

JS_DIR = Path(__file__).parent / "js"
AGENT = Path(__file__).parent / "i18n-agent.py"
COOLDOWN = 5   # seconds — ignore rapid repeated saves


class JSChangeHandler(FileSystemEventHandler):
    def __init__(self, provider, interval):
        self.provider = provider
        self.interval = interval
        self._last_run = 0

    def on_modified(self, event):
        if event.is_directory:
            return
        if not event.src_path.endswith(".js"):
            return
        # Skip the agent's own backup files
        if ".bak" in event.src_path:
            return

        now = time.time()
        if now - self._last_run < COOLDOWN:
            return   # debounce — don't re-run on every keystroke save

        self._last_run = now
        fname = Path(event.src_path).name
        print(
            f"\n📝  [{time.strftime('%H:%M:%S')}]  {fname} changed — running i18n check …")
        self._run_agent()

    def _run_agent(self):
        cmd = [sys.executable, str(AGENT), "--provider", self.provider]
        result = subprocess.run(cmd, capture_output=False)
        if result.returncode != 0:
            print("⚠️  Agent exited with error — check output above")


def main():
    p = argparse.ArgumentParser(
        description="Auto i18n fixer — watches js/ for changes")
    p.add_argument("--provider", default="groq",
                   choices=["groq", "claude", "gemini"])
    p.add_argument("--interval", type=int, default=0,
                   help="Also run every N minutes regardless of file changes (0=off)")
    args = p.parse_args()

    print(f"👀  Watching {JS_DIR}  |  provider={args.provider}")
    print(f"    Any .js change triggers i18n-agent automatically")
    print(f"    Ctrl+C to stop\n")

    handler = JSChangeHandler(args.provider, args.interval)
    observer = Observer()
    observer.schedule(handler, str(JS_DIR), recursive=False)
    observer.start()

    try:
        tick = 0
        while True:
            time.sleep(1)
            tick += 1
            # Optional: also run on a fixed interval
            if args.interval > 0 and tick % (args.interval * 60) == 0:
                print(f"\n⏰  [{time.strftime('%H:%M:%S')}]  Scheduled check …")
                handler._run_agent()
    except KeyboardInterrupt:
        print("\n👋  Watcher stopped.")
        observer.stop()
    observer.join()


if __name__ == "__main__":
    main()
