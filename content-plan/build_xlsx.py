#!/usr/bin/env python3
"""Run the JavaScript artifact-tool catalogue builder in an isolated runtime directory."""
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parent.parent

def main():
    node = os.environ.get("CODEX_PRIMARY_RUNTIME_NODE")
    modules = os.environ.get("CODEX_PRIMARY_RUNTIME_NODE_MODULES")
    if not node or not modules:
        raise SystemExit("CODEX_PRIMARY_RUNTIME_NODE and CODEX_PRIMARY_RUNTIME_NODE_MODULES are required.")
    output = ROOT.parent / "outputs" / ROOT.parent.name
    with tempfile.TemporaryDirectory(prefix="tcg-catalogue-") as work:
        temp = Path(work)
        (temp / "node_modules").symlink_to(modules, target_is_directory=True)
        shutil.copy2(ROOT / "content-plan" / "build_xlsx.mjs", temp / "build_xlsx.mjs")
        subprocess.run([node, "--max-old-space-size=6144", str(temp / "build_xlsx.mjs"), "--root", str(ROOT), "--out", str(output), *sys.argv[1:]], cwd=temp, check=True)

if __name__ == "__main__":
    main()
