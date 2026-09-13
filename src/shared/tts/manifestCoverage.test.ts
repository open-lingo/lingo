/**
 * Commit-time gate: every hash in a TTS manifest must resolve to real audio —
 * either staged in this commit (`tts-publish/<lang>/<hash>.mp3`, about to
 * ship via the deploy workflow's "publish staged TTS audio" step) or already
 * confirmed live on the CDN (`tts-publish/live/<lang>.txt`, written by
 * `scripts/tts-live-snapshot.mjs`).
 *
 * ## Why this exists
 *
 * `scripts/verify-tts-cdn.mjs` only samples 25 hashes across ALL languages
 * and is not run in CI. On 2026-09-13, 589 ES manifest hashes turned out to
 * be neither staged nor uploaded by any earlier pipeline run, and nothing
 * noticed — the sample never happened to land on one of the 589. A manifest
 * hash without a real object behind it doesn't 404; CloudFront serves the
 * SPA-shell `index.html` with a 200, so playback fails *silently* (see
 * `tts-publish/README.md`).
 *
 * This test is exhaustive over every manifest hash and runs on every
 * `vitest run` / `npm run preflight`, so a manifest update that outruns its
 * published audio fails the build instead of reaching prod.
 *
 * Coverage source for "already live" is a point-in-time snapshot, not a live
 * network check (tests must stay offline-safe and fast) — see
 * `tts-publish/README.md` for when to regenerate it.
 */
import { describe, it, expect } from "vitest";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MANIFEST_DIR = resolve(__dirname, "manifests");
const TTS_PUBLISH_DIR = resolve(__dirname, "../../../tts-publish");

const HASH_LEN = 16;

function hashesOf(doc: { hashes?: string }): string[] {
  const out: string[] = [];
  const src = doc.hashes ?? "";
  for (let i = 0; i + HASH_LEN <= src.length; i += HASH_LEN) out.push(src.slice(i, i + HASH_LEN));
  return out;
}

function manifestLangs(): string[] {
  return readdirSync(MANIFEST_DIR)
    .filter((f) => f.endsWith(".json") && f !== "index.json")
    .map((f) => f.slice(0, -".json".length));
}

function stagedSet(ttsPublishDir: string, lang: string): Set<string> {
  const dir = join(ttsPublishDir, lang);
  if (!existsSync(dir)) return new Set();
  return new Set(
    readdirSync(dir)
      .filter((f) => f.endsWith(".mp3"))
      .map((f) => f.slice(0, -".mp3".length)),
  );
}

/** null = no snapshot file for this language yet (caller should skip). */
function liveSet(ttsPublishDir: string, lang: string): Set<string> | null {
  const path = join(ttsPublishDir, "live", `${lang}.txt`);
  if (!existsSync(path)) return null;
  const body = readFileSync(path, "utf-8");
  return new Set(
    body
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean),
  );
}

/** The actual gate logic, factored out so both the real per-language checks
 * below and the synthetic "prove it fails" case exercise the same code. */
function uncoveredHashes(hashes: string[], staged: Set<string>, live: Set<string>): string[] {
  return hashes.filter((h) => !staged.has(h) && !live.has(h));
}

function failureMessage(lang: string, uncovered: string[]): string {
  const sample = uncovered.slice(0, 20);
  return (
    `${lang}: ${uncovered.length} manifest hash(es) are neither staged in ` +
    `tts-publish/${lang}/ nor listed in tts-publish/live/${lang}.txt (i.e. not ` +
    `published). First ${sample.length}:\n` +
    sample.map((h) => `  ${h}`).join("\n") +
    `\n\nCopy the missing mp3s from lingo-data/out/tts/${lang}/ into ` +
    `tts-publish/${lang}/ (or, if they're already uploaded to the CDN, ` +
    `regenerate the snapshot: node scripts/tts-live-snapshot.mjs ${lang}).`
  );
}

describe("TTS manifest coverage", () => {
  for (const lang of manifestLangs()) {
    const doc = JSON.parse(readFileSync(join(MANIFEST_DIR, `${lang}.json`), "utf-8"));
    const hashes = hashesOf(doc);

    // Nothing to check (e.g. ja-keita, which is override-only — see manifest.ts).
    if (hashes.length === 0) continue;

    const live = liveSet(TTS_PUBLISH_DIR, lang);
    if (live === null) {
      // eslint-disable-next-line no-console
      console.warn(
        `tts manifest coverage: SKIPPING ${lang} — tts-publish/live/${lang}.txt ` +
          `does not exist yet. Run \`node scripts/tts-live-snapshot.mjs ${lang}\` ` +
          `to generate it before this language can be gated.`,
      );
      it.skip(`${lang}: every manifest hash is staged or live (no snapshot yet)`, () => {});
      continue;
    }

    it(`${lang}: every manifest hash is staged in tts-publish/${lang}/ or listed in tts-publish/live/${lang}.txt`, () => {
      const staged = stagedSet(TTS_PUBLISH_DIR, lang);
      const uncovered = uncoveredHashes(hashes, staged, live);
      if (uncovered.length > 0) {
        throw new Error(failureMessage(lang, uncovered));
      }
      expect(uncovered).toEqual([]);
    });
  }

  it("flags a manifest hash that is neither staged nor live", () => {
    // Prove the gate can actually fail (not just pass vacuously): copy the
    // real ES manifest into a temp dir with one extra, fabricated hash
    // appended, then run the same read-manifest → diff-against-staged/live
    // path the real checks above use.
    //
    // Every real ES hash is treated as covered here via a synthetic live set
    // (every real hash not already staged) rather than the actual
    // tts-publish/live/es.txt snapshot — that file may legitimately not
    // exist yet in a given checkout (e.g. no sweep has run, or the CDN was
    // unreachable when one was attempted), and this test's job is to prove
    // the DIFFING MECHANISM fails on a genuinely uncovered hash, not to
    // assert today's real-world CDN coverage (that's what the per-language
    // tests above are for, and they correctly skip without a snapshot).
    // Only the fabricated hash should be reported.
    const tmpDir = mkdtempSync(join(tmpdir(), "tts-manifest-coverage-test-"));
    try {
      const real = JSON.parse(readFileSync(join(MANIFEST_DIR, "es.json"), "utf-8"));
      const fakeHash = "f00dfacef00dfaad"; // 16 hex chars, guaranteed not published
      const tampered = {
        ...real,
        count: real.count + 1,
        hashes: real.hashes + fakeHash,
      };
      writeFileSync(join(tmpDir, "es.json"), JSON.stringify(tampered));

      const hashes = hashesOf(tampered);
      const staged = stagedSet(TTS_PUBLISH_DIR, "es");
      const live = new Set(hashesOf(real).filter((h) => !staged.has(h)));
      const uncovered = uncoveredHashes(hashes, staged, live);

      expect(uncovered).toEqual([fakeHash]);
      expect(() => {
        if (uncovered.length > 0) throw new Error(failureMessage("es", uncovered));
      }).toThrow(/f00dfacef00dfaad/);
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
