import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { sha256Hex16 } from "./sha256";

/**
 * TEMPORARY migration guard — delete once the legacy manifest is gone.
 *
 * Verifies the TS hash against every entry the Python pipeline ever produced,
 * not just the sampled fixtures. Skips silently when the legacy manifest is
 * absent so it never blocks a post-migration checkout.
 */
const LEGACY = resolve(__dirname, "../../pub/tts/manifest.json");

describe("full legacy manifest cross-check", () => {
  it("derives the same path for every derivable legacy entry", () => {
    if (!existsSync(LEGACY)) return;
    const legacy = JSON.parse(readFileSync(LEGACY, "utf-8")) as Record<
      string,
      string | string[]
    >;

    let derivable = 0;
    let nonDerivable = 0;
    const mismatches: string[] = [];

    for (const [key, value] of Object.entries(legacy)) {
      const [lang] = key.split(/:(.*)/s);
      const paths = typeof value === "string" ? [value] : value;
      // `ja-keita` files live in the shared ja/ directory.
      const dir = lang === "ja-keita" ? "ja" : lang;
      const expected = `tts/${dir}/${sha256Hex16(key)}.mp3`;

      if (paths.length === 1 && paths[0] === expected) {
        derivable++;
      } else if (paths.length === 1 && paths[0].startsWith(`tts/${dir}/`)) {
        // Known non-derivable class (ja-keita, lost generator script).
        nonDerivable++;
      } else {
        nonDerivable++;
        if (mismatches.length < 5) mismatches.push(`${key} -> ${paths.join(",")}`);
      }
    }

    expect(derivable).toBe(13634);
    expect(nonDerivable).toBe(746);
    expect(derivable + nonDerivable).toBe(Object.keys(legacy).length);
  });
});
