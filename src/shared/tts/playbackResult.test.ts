/**
 * `playJaAudio` must report what actually came out of the speaker.
 *
 * The listening step views used to call `playLocalAudio` directly whenever
 * `getTtsUrl` returned a URL. The TTS manifest is bundled into the JS, so a URL
 * comes back even when the CDN object is gone (a deploy once deleted the
 * published corpus) or the learner is offline — and `playLocalAudio` swallows
 * both the `error` event and the `play()` rejection. Result: the learner taps
 * play in silence with no affordance, and KO/ES never reach the synthesis
 * fallback that would have worked.
 *
 * Routing those views through `playJaAudio` fixes the fallback. This return
 * value is what lets them tell "it spoke" from "nothing happened" — the JA
 * case, where `canSynthesize("ja")` is false by design.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { playJaAudio } from "./index";

/** A text certain to miss the bundled manifest, so the fallback path runs. */
const UNKNOWN = "この文章はマニフェストに存在しません";

function stubSynthesis() {
  vi.stubGlobal("speechSynthesis", {
    speak: vi.fn(),
    cancel: vi.fn(),
    getVoices: () => [],
    addEventListener: vi.fn(),
  });
  vi.stubGlobal(
    "SpeechSynthesisUtterance",
    class {
      text: string;
      lang = "";
      constructor(t: string) {
        this.text = t;
      }
    },
  );
}

describe("playJaAudio — PlaybackResult", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("reports 'silent' for JA when no recording resolves", async () => {
    // JA opts out of synthesis on purpose, so a missing clip is real silence —
    // exactly the case the UI has to explain instead of rendering a dead button.
    stubSynthesis();
    await expect(playJaAudio(UNKNOWN, "ja")).resolves.toBe("silent");
  });

  it("reports 'synthesis' for a language that allows the platform voice", async () => {
    stubSynthesis();
    await expect(playJaAudio("texto que no existe", "es")).resolves.toBe(
      "synthesis",
    );
  });

  it("reports 'silent' when the platform has no speech synthesis at all", async () => {
    vi.stubGlobal("speechSynthesis", undefined);
    await expect(playJaAudio("texto que no existe", "es")).resolves.toBe(
      "silent",
    );
  });

  it("never claims 'clip' when nothing was actually played", async () => {
    stubSynthesis();
    const result = await playJaAudio(UNKNOWN, "ja");
    expect(result).not.toBe("clip");
  });
});
