/**
 * Node wrapper for `sidecar.py`: batches sentences, shells out once per
 * batch, and caches per-input results under `artifacts/lexical/ja/<sha1>.json`
 * (gitignored — see `.gitignore`'s `artifacts/` rule).
 *
 * Callers are responsible for the kana->kanji reconstruction described in
 * `sidecar.py`'s doc comment (this file only tags whatever text it is
 * given); `scripts/qa/procedural/lib/kanjiReconstruct.mjs` does that for
 * the Q3 check specifically, using the course's own atom kanji spellings as
 * an override dictionary (the mitigation `docs/tile-shrapnel-2026-09-17.md`
 * recommends: "treating the course lexicon as an override dictionary — a
 * known multi-morpheme word is one token").
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "../../../");
const CACHE_DIR = path.join(REPO_ROOT, "artifacts/lexical/ja");
// Env-overridable (2026-09-17, lane A7f — docs/procedural-qa-2026-09-17.md
// § Vacuity on CI): CI installs the JA venv at a path this repo-relative
// default already finds (scripts/lexical/ja/.venv), so this override
// exists for any environment that keeps the interpreter somewhere else
// (a shared/prebuilt venv, a non-default CI layout) — set
// LINGO_LEXICAL_PYTHON_JA for this sidecar specifically, or
// LINGO_LEXICAL_PYTHON to point every language sidecar at one interpreter
// that has all four sets of deps installed. Also handy for the deliberate-
// failure proof (point it at a nonexistent path to force `sidecarAvailable()`
// false without touching the real .venv).
const PYTHON = process.env.LINGO_LEXICAL_PYTHON_JA || process.env.LINGO_LEXICAL_PYTHON || path.join(HERE, ".venv/bin/python");
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

/**
 * Tag a batch of `{id, text}` items. Returns a `Map<id, tokens[]>`. Results
 * are cached per DISTINCT TEXT (not per id — two steps that share a
 * sentence share a cache entry), so repeated runs over the same module are
 * fast and offline.
 */
export function tagBatch(items) {
  const byText = new Map(); // text -> [ids]
  for (const { id, text } of items) {
    if (!byText.has(text)) byText.set(text, []);
    byText.get(text).push(id);
  }

  const toRun = [];
  const resolved = new Map(); // text -> tokens
  for (const text of byText.keys()) {
    const cached = readCache(text);
    if (cached) resolved.set(text, cached);
    else toRun.push(text);
  }

  if (toRun.length > 0) {
    if (!sidecarAvailable()) {
      throw new Error(
        `JA lexical sidecar not installed. Run:\n  cd scripts/lexical/ja && uv venv .venv --python 3.11 && uv pip install --python .venv/bin/python fugashi unidic-lite`,
      );
    }
    const payload = toRun.map((text, i) => ({ id: String(i), text }));
    const proc = spawnSync(PYTHON, [SIDECAR_PY], {
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

/** Tag a single string. Convenience wrapper over `tagBatch`. */
export function tagOne(text) {
  return tagBatch([{ id: "0", text }]).get("0");
}
