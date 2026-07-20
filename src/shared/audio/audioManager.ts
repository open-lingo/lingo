/**
 * Single-channel CONTENT-audio coordinator.
 *
 * Only one piece of "content" audio should play at a time — a spoken word, a
 * sentence, a listening clip, a conversation line. Starting a new one must
 * cancel whatever is mid-flight, across every playback backend we use:
 *   - Web Audio `AudioBufferSourceNode` (recorded TTS clips)
 *   - `HTMLAudioElement` (per-word / alphabet clips via `playLocalAudio`)
 *   - `speechSynthesis` (the non-JA voice fallback)
 *
 * Each backend claims the channel with `begin(stopFn)`, which first invokes
 * the previous holder's `stopFn` — so a fresh clip silences the current one no
 * matter which backend either uses. This is the timing foundation for
 * SEQUENCED playback (a future conversation player awaits each line via
 * `playJaAudioToEnd`; if a new line starts before the last finished, the old
 * one is cut cleanly instead of overlapping).
 *
 * NOT for SFX: short UI chirps (`playSfx`) deliberately bypass this and may
 * overlap content audio.
 *
 * The channel is a monotonically increasing token. Async callbacks capture
 * their token and check `isCurrent(token)` before acting, so a clip that has
 * already been superseded can't resume or clobber the new holder.
 */

type StopFn = () => void;

let currentStop: StopFn | null = null;
let token = 0;

/** Cancel the current holder (if any) and bump the channel. */
function cancelCurrent(): void {
  const prev = currentStop;
  currentStop = null;
  token += 1;
  if (prev) {
    try {
      prev();
    } catch {
      // Already stopped / GC'd — nothing to do.
    }
  }
}

export const audioManager = {
  /**
   * Claim the channel for a new clip: cancels whatever is playing, registers
   * this clip's `stop`, and returns the channel token. Keep the token and pass
   * it to `end()` when the clip finishes; check `isCurrent(token)` inside async
   * callbacks before touching shared state.
   */
  begin(stop: StopFn): number {
    cancelCurrent();
    currentStop = stop;
    return token;
  },

  /** True while `t` still owns the channel (hasn't been superseded). */
  isCurrent(t: number): boolean {
    return t === token;
  },

  /** The holder's clip ended naturally — release the channel if still ours. */
  end(t: number): void {
    if (t === token) currentStop = null;
  },

  /** Cancel whatever content audio is playing. Idempotent. */
  stop(): void {
    cancelCurrent();
  },
};
