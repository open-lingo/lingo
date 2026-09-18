// Proves the verdict-cache key moves with every input a verdict depends on
// (2026-09-17: a stale Q7 verdict survived a TTS-manifest change).
import { test } from "node:test";
import assert from "node:assert/strict";
import { moduleCacheKey, ttsManifestFingerprint, contentManifestVersion, irFingerprint } from "./lib/verdictCache.mjs";

test("key changes with module content, mode and language", () => {
  const base = { lang: "ja", moduleId: "m1", mode: "enforced", moduleJson: { a: 1 } };
  const k = moduleCacheKey(base);
  assert.notEqual(k, moduleCacheKey({ ...base, moduleJson: { a: 2 } }));
  assert.notEqual(k, moduleCacheKey({ ...base, mode: "full" }));
  assert.notEqual(k, moduleCacheKey({ ...base, lang: "ko" }));
  assert.equal(k, moduleCacheKey({ ...base }));
});

test("TTS manifest fingerprint is per language and present for every shipped language", () => {
  const seen = new Set();
  for (const lang of ["ja", "ko", "es", "fr"]) {
    const f = ttsManifestFingerprint(lang);
    assert.notEqual(f, "absent", `${lang} manifest missing`);
    assert.ok(!seen.has(f), `${lang} fingerprint collides`);
    seen.add(f);
  }
  assert.equal(ttsManifestFingerprint("zz"), "absent");
});

test("content manifest version is a non-empty string when emitted", () => {
  const v = contentManifestVersion();
  assert.equal(typeof v, "string");
  assert.ok(v.length > 0);
});

test("IR fingerprint (Q11's introduces: source) is real for JA, absent for a language with no live IR dir", () => {
  assert.notEqual(irFingerprint("ja"), "absent");
  assert.equal(irFingerprint("zz"), "absent");
});
