import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import dialogueSpeakers from "../dialogueSpeakers.json";
import { langForSpeaker } from "@/features/lesson/components/steps/DialogueListenStepView";

/**
 * Invariant 23 — dialogue speakers get REAL distinct voices.
 *
 * The failure this exists to prevent is silent and was live for three
 * modules: `MALE_SPEAKERS` was hand-copied into both the runtime view and
 * the TTS emitter holding only the romanized names, so kana-labelled male
 * speakers (トム/ケン/たなか/たけし) fell through to the female Nanami corpus.
 * Nothing failed — the lines just played in the wrong voice.
 *
 * Defaulting to Nanami is the right behaviour for a female or role label and
 * the wrong behaviour for an unrecognized male one, and the code cannot tell
 * those apart. So the roster is closed: every speaker label that appears
 * anywhere in the course must be classified here, and an unclassified one is
 * a build failure rather than a quiet female voice.
 */

const CURRICULUM = join(__dirname, "..", "curriculum");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      return entry === "__tests__" ? [] : sourceFiles(path);
    }
    return /\.(ts|yaml)$/.test(entry) && !entry.endsWith(".test.ts") ? [path] : [];
  });
}

function speakersInCourse(): Map<string, string> {
  const found = new Map<string, string>();
  for (const path of sourceFiles(CURRICULUM)) {
    const src = readFileSync(path, "utf-8");
    for (const m of src.matchAll(/speaker:\s*"([^"]+)"/g)) {
      if (!found.has(m[1])) found.set(m[1], path.slice(path.indexOf("curriculum")));
    }
  }
  return found;
}

const { male, female, neutral } = dialogueSpeakers;
const classified = new Set([...male, ...female, ...neutral]);

describe("dialogue speaker registry (inv 23)", () => {
  it("classifies every speaker label used anywhere in the course", () => {
    const unclassified = [...speakersInCourse()]
      .filter(([speaker]) => !classified.has(speaker))
      .map(([speaker, where]) => `${speaker} (${where})`);

    expect(
      unclassified,
      "Add each of these to src/features/languages/ja/dialogueSpeakers.json under " +
        '"male", "female" or "neutral". An unclassified speaker plays the female ' +
        "Nanami voice by default, which is silently wrong for a male name.",
    ).toEqual([]);
  });

  it("routes male speakers to Keita and everyone else to the default corpus", () => {
    for (const speaker of male) expect(langForSpeaker(speaker)).toBe("ja-keita");
    for (const speaker of [...female, ...neutral]) {
      expect(langForSpeaker(speaker)).toBeUndefined();
    }
  });

  it("gives each speaker exactly one classification", () => {
    const all = [...male, ...female, ...neutral];
    expect(all.length).toBe(new Set(all).size);
  });

  it("keeps the emitter reading the same roster as the runtime view", () => {
    const emitter = readFileSync(
      join(__dirname, "..", "..", "..", "..", "..", "scripts", "emit-tts-deck.mjs"),
      "utf-8",
    );
    expect(emitter).toContain("dialogueSpeakers.json");
    expect(emitter).not.toMatch(/MALE_SPEAKERS\s*=\s*new Set\(\s*\[/);
  });
});
