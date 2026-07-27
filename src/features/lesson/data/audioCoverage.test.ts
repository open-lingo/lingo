import { describe, expect, it } from "vitest";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { compileModule } from "./moduleCompiler";
import { getTtsUrl } from "@/shared/tts";

/**
 * Every audio-bearing surface a compiled lesson can play must resolve to a clip.
 *
 * FIVE separate silent-line classes shipped before this existed, and not one of
 * them failed anything — the step rendered, the play button worked, nothing
 * happened:
 *   1. the emitter had no pattern for the IR's `audio:` field (authored
 *      listening-comp beats);
 *   2. `clean()` strips ？ and getTtsUrl had no ？-fallback, so every
 *      IR-authored QUESTION build was mute;
 *   3. an atom declared in the IR but not registered in courseAtoms got no clip,
 *      which muted a whole conjugation ramp;
 *   4. kana-labelled male speakers fell through to the wrong voice corpus;
 *   5. a two-sentence build target keeps its internal 。 while the deck stores
 *      the text punctuation-free.
 *
 * The pattern is always the same: the emitter's idea of what needs a clip
 * drifting from what the compiler actually renders. So this guard asks the
 * question from the RENDERING side, walking compiled steps rather than source
 * patterns — the only side that cannot drift.
 *
 * If this fails after authoring, the fix is a TTS regen, not an edit here:
 *   node scripts/emit-tts-deck.mjs
 *   cd ../lingo-core && .venv-tts/bin/python -m scripts.tts.generate --lang ja --provider edge
 *   cd ../lingo-core && .venv-tts/bin/python -m scripts.tts.gen_dialogue_voices
 */

const IR_DIR = join(__dirname, "..", "..", "languages", "ja", "curriculum", "ir");
/** Fields whose value is spoken aloud. */
const AUDIO_FIELDS = ["audioKey", "audioText", "transcript", "promptAudioText"];

function missingClips(): { surfaces: number; missing: string[] } {
  const missing = new Set<string>();
  let surfaces = 0;

  const walk = (node: unknown, lessonId: string): void => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const item of node) walk(item, lessonId);
      return;
    }
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      if (AUDIO_FIELDS.includes(key) && typeof value === "string" && value) {
        surfaces++;
        if (!getTtsUrl(value, "ja")) missing.add(`${lessonId}: ${value}`);
      }
      walk(value, lessonId);
    }
  };

  for (const file of readdirSync(IR_DIR).filter((f) => f.endsWith(".ir.json"))) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    for (const lesson of compileModule(require(join(IR_DIR, file)))) {
      walk(lesson.steps, lesson.id);
    }
  }
  return { surfaces, missing: [...missing] };
}

describe("compiled lessons have audio for everything they speak", () => {
  const { surfaces, missing } = missingClips();

  it("walks a meaningful number of spoken surfaces", () => {
    expect(surfaces).toBeGreaterThan(1000);
  });

  it("resolves every one of them to a clip", () => {
    expect(
      missing.slice(0, 25),
      `${missing.length} spoken surface(s) have no clip. Regenerate TTS — see ` +
        "the header of this file for the three commands.",
    ).toEqual([]);
  });
});
