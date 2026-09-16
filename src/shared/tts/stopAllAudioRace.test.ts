/**
 * TestFlight #151 ("it's still playing audio into the next step... audio
 * from previous tile should be prevented the moment continue is clicked").
 *
 * `stopAllAudio()` (`./index.ts`) only ever swept `activeSources` — a Set
 * populated inside `playBuffer()`, AFTER a clip's network fetch + decode
 * resolves. A `playJaAudio()` call whose fetch is STILL PENDING when
 * `stopAllAudio()` runs registers nothing to sweep: the stop is a no-op for
 * it, and once the fetch lands the clip starts playing anyway — straight
 * into whatever step mounted next. `BuildSentenceStepView.handleSubmit`
 * called `playJaAudio(step.targetSentence)` directly (unguarded by
 * `useStepAudioGuard`) on every correct Check, so a learner who tapped
 * Continue immediately (LessonPage.handleContinue calls `stopAllAudio()`
 * synchronously) could still hear the previous step's answer sentence land
 * on the new step once its fetch/decode finished.
 *
 * This file gets its own module instance (vitest isolates per test FILE),
 * which matters here: `shared/tts/index.ts` keeps its AudioContext in a
 * module-level singleton, so a test sharing a file with `index.test.ts`
 * would silently reuse whichever AudioContext stub an earlier test in that
 * file installed instead of this one.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getTtsUrl, playJaAudio, stopAllAudio } from "./index";

describe("stopAllAudio cancels a play still in flight when it was called", () => {
  let fetchResolve: ((r: Response) => void) | undefined;
  let startSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchResolve = undefined;
    startSpy = vi.fn();
    class FakeAudioContext {
      state = "running";
      destination = {};
      resume = () => Promise.resolve();
      createGain = () => ({ gain: { value: 1 }, connect: () => {} });
      createBufferSource = () => ({
        buffer: null,
        playbackRate: { value: 1 },
        detune: { value: 0 },
        connect: () => {},
        start: startSpy,
        stop: () => {},
        addEventListener: () => {},
        onended: null,
      });
      decodeAudioData = () => Promise.resolve({ duration: 1 } as AudioBuffer);
    }
    vi.stubGlobal("AudioContext", FakeAudioContext);
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            fetchResolve = resolve;
          }),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("a delayed play scheduled before stopAllAudio() never fires", async () => {
    const url = getTtsUrl("こんにちは");
    expect(url).not.toBeNull();

    // Kick off a play; its fetch is deliberately left pending — this is
    // the async gap `stopAllAudio()` used to be blind to.
    const playPromise = playJaAudio("こんにちは");

    // Wait until the module has actually reached `fetch()` (past the
    // async clip-store lookup) so the stop below lands mid-request, not
    // before the request was even issued.
    await vi.waitFor(() => {
      if (!fetchResolve) throw new Error("fetch not yet called");
    });

    // The step advances (Continue tapped) BEFORE the clip's network fetch
    // has resolved — exactly LessonPage.handleContinue's timing.
    stopAllAudio();

    // Now let the fetch/decode finish, as if the CDN answered late.
    fetchResolve!(
      new Response(new Uint8Array([1, 2, 3]).buffer, { status: 200 }),
    );
    await playPromise;

    // The clip must never have been started — it resolved after the stop.
    expect(startSpy).not.toHaveBeenCalled();
  });
});
