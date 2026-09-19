/**
 * Node wrapper for `sidecar.py` (simplemma): batches sentences, shells out
 * once per batch, caches per-input results under
 * `artifacts/lexical/pt/<sha1>.json` (gitignored). Mirrors
 * `scripts/lexical/es/sidecar.mjs`; see that file (and `ja/sidecar.mjs`)
 * for the caching rationale. Kept as its own copy, not a shared import,
 * matching the JA/ES/FR sidecar's per-language-directory convention.
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const LANG = "pt";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "../../../");
const CACHE_DIR = path.join(REPO_ROOT, `artifacts/lexical/${LANG}`);
// Env-overridable (2026-09-17, lane A7f) — see scripts/lexical/ja/sidecar.mjs's
// matching comment for the rationale.
const PYTHON = process.env.LINGO_LEXICAL_PYTHON_PT || process.env.LINGO_LEXICAL_PYTHON || path.join(HERE, ".venv/bin/python");
const SIDECAR_PY = path.join(HERE, "sidecar.py");

function sha1(s) {
  return createHash("sha1").update(s, "utf8").digest("hex");
}

function cachePath(text) {
  return path.join(CACHE_DIR, `${sha1(text)}.json`);
}

function readCache(text) {
  const p = cachePath(text);
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function writeCache(text, tokens) {
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(cachePath(text), JSON.stringify(tokens), "utf8");
}

let venvChecked = false;
export function sidecarAvailable() {
  if (!venvChecked) {
    venvChecked = existsSync(PYTHON) && existsSync(SIDECAR_PY);
  }
  return venvChecked;
}

export function tagBatch(items) {
  const byText = new Map();
  for (const { id, text } of items) {
    if (!byText.has(text)) byText.set(text, []);
    byText.get(text).push(id);
  }

  const toRun = [];
  const resolved = new Map();
  for (const text of byText.keys()) {
    const cached = readCache(text);
    if (cached) resolved.set(text, cached);
    else toRun.push(text);
  }

  if (toRun.length > 0) {
    if (!sidecarAvailable()) {
      throw new Error(
        `${LANG.toUpperCase()} lexical sidecar not installed. Run:\n  cd scripts/lexical/${LANG} && uv venv .venv --python 3.11 && uv pip install --python .venv/bin/python -r ../requirements-pt.txt`,
      );
    }
    const payload = toRun.map((text, i) => ({ id: String(i), text }));
    const proc = spawnSync(PYTHON, [SIDECAR_PY, LANG], {
      input: JSON.stringify(payload),
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    });
    if (proc.status !== 0) {
      throw new Error(`sidecar.py failed (exit ${proc.status}): ${proc.stderr}`);
    }
    const out = JSON.parse(proc.stdout);
    for (let i = 0; i < toRun.length; i++) {
      const text = toRun[i];
      const tokens = out[i].tokens;
      resolved.set(text, tokens);
      writeCache(text, tokens);
    }
  }

  const result = new Map();
  for (const [text, ids] of byText) {
    const tokens = resolved.get(text) ?? [];
    for (const id of ids) result.set(id, tokens);
  }
  return result;
}

export function tagOne(text) {
  return tagBatch([{ id: "0", text }]).get("0");
}
