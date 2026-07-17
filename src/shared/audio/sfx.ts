/**
 * UI sound-effects layer — synthesized via Web Audio, no asset files.
 *
 * Distinct from `playJaAudio` (TTS) and `playLocalAudio` (per-word vocab
 * clips): sfx are short, ambient feedback pings, not pedagogically
 * meaningful. The palette is deliberately calm — soft attacks, sine/triangle
 * voices, low gain — to stay inside the app's "never scold, never blaring"
 * feedback philosophy. The wrong-answer sound is a quiet low thud, not a
 * buzzer.
 *
 * Names:
 *   - "correct"          graded answer right. Pitch rises a semitone per
 *                        consecutive correct (pass `combo`), capped at +7 —
 *                        the in-lesson streak is audible without a counter.
 *   - "incorrect"        graded answer wrong. Soft, brief, low.
 *   - "complete"         lesson-complete fanfare (short ascending arpeggio).
 *   - "tile"             a tile placed into the answer tray.
 *   - "match"            a successful match-pairs hit.
 *   - "passive-advance"  the passive-card acknowledgement chirp (pre-existing
 *                        call sites; previously an mp3 that never shipped).
 *
 * Honors the app-wide volume slider via `volume.ts` (sfx sit at 40% of it)
 * and the `settings.audio.soundEnabled` toggle, which SettingsContext pushes
 * into this module via `setSfxEnabled`. A light 10ms haptic fires on mobile
 * for tap-acknowledgement sounds.
 *
 * The AudioContext is created lazily on first play — every call site is a
 * user gesture (tap/click/Enter), so autoplay policies are satisfied. If the
 * context can't be created (old browser, test env) everything no-ops.
 */
import { getAudioVolume } from "./volume";

export type SfxName =
  | "correct"
  | "incorrect"
  | "complete"
  | "tile"
  | "match"
  | "passive-advance"
  | "lesson-start";

let sfxEnabled = true;

/** Pushed by SettingsContext from `settings.audio.soundEnabled`. */
export function setSfxEnabled(on: boolean): void {
  sfxEnabled = on;
}

export function getSfxEnabled(): boolean {
  return sfxEnabled;
}

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC: typeof AudioContext | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AC) return null;
  try {
    if (!ctx) ctx = new AC();
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  } catch {
    return null;
  }
}

type ToneOpts = {
  /** Start frequency in Hz. */
  freq: number;
  /** Offset from "now" in seconds. */
  at: number;
  /** Duration in seconds (attack + decay). */
  dur: number;
  /** Peak gain 0..1, before the master multiplier. */
  peak: number;
  type?: OscillatorType;
  /** Optional glide target frequency (linear ramp over the duration). */
  glideTo?: number;
};

/** One enveloped oscillator: 8ms soft attack, exponential decay to silence. */
function tone(ac: AudioContext, master: number, o: ToneOpts): void {
  const t0 = ac.currentTime + o.at;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = o.type ?? "sine";
  osc.frequency.setValueAtTime(o.freq, t0);
  if (o.glideTo !== undefined) {
    osc.frequency.linearRampToValueAtTime(o.glideTo, t0 + o.dur);
  }
  const peak = o.peak * master;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(peak, t0 + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + o.dur + 0.02);
}

function haptic(ms: number): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(ms);
    } catch {
      // Permissions / disabled — ignore.
    }
  }
}

export function playSfx(name: SfxName, opts: { combo?: number } = {}): void {
  if (!sfxEnabled) return;
  // SFX sit at 40% of the global volume — feedback pings, not foreground
  // sound. Stamped per play so slider moves take effect immediately.
  const master = Math.min(1, Math.max(0, getAudioVolume() * 0.4));
  if (master <= 0) return;
  const ac = getCtx();
  if (!ac) return;

  switch (name) {
    case "correct": {
      // Two-note rise (E5 → A5), shifted up a semitone per combo, cap +7.
      // At combo 8+ the interval stays put — endless rising reads as antsy.
      const semis = Math.min(Math.max((opts.combo ?? 1) - 1, 0), 7);
      const shift = Math.pow(2, semis / 12);
      tone(ac, master, { freq: 659.25 * shift, at: 0, dur: 0.1, peak: 0.5 });
      tone(ac, master, {
        freq: 880 * shift,
        at: 0.07,
        dur: 0.16,
        peak: 0.55,
      });
      haptic(10);
      return;
    }
    case "incorrect": {
      // Quiet low sigh — a single triangle dropping a fourth. No haptic:
      // the screen already explains; the sound only marks the moment.
      tone(ac, master, {
        freq: 196,
        at: 0,
        dur: 0.18,
        peak: 0.35,
        type: "triangle",
        glideTo: 147,
      });
      return;
    }
    case "complete": {
      // Short ascending major arpeggio with a sparkle on top: C5 E5 G5 C6.
      tone(ac, master, { freq: 523.25, at: 0, dur: 0.14, peak: 0.45 });
      tone(ac, master, { freq: 659.25, at: 0.1, dur: 0.14, peak: 0.45 });
      tone(ac, master, { freq: 783.99, at: 0.2, dur: 0.16, peak: 0.45 });
      tone(ac, master, { freq: 1046.5, at: 0.3, dur: 0.4, peak: 0.5 });
      tone(ac, master, {
        freq: 1318.5,
        at: 0.34,
        dur: 0.36,
        peak: 0.2,
        type: "triangle",
      });
      haptic(15);
      return;
    }
    case "tile": {
      // Tiny pluck — acknowledges the tap without celebrating it.
      tone(ac, master, {
        freq: 740,
        at: 0,
        dur: 0.05,
        peak: 0.25,
        type: "triangle",
      });
      return;
    }
    case "match": {
      // Two quick rising notes — smaller than "correct", per-pair scale.
      tone(ac, master, { freq: 587.33, at: 0, dur: 0.07, peak: 0.35 });
      tone(ac, master, { freq: 783.99, at: 0.05, dur: 0.1, peak: 0.4 });
      return;
    }
    case "passive-advance": {
      // The original ambient chirp, now actually audible.
      tone(ac, master, { freq: 880, at: 0, dur: 0.08, peak: 0.3 });
      haptic(10);
      return;
    }
    case "lesson-start": {
      // Train-departure cue for the lesson-start wipe: a two-tone horn
      // chord, then a rising whoosh that tracks the train across the screen.
      tone(ac, master, { freq: 293.66, at: 0, dur: 0.34, peak: 0.28, type: "sawtooth" });
      tone(ac, master, { freq: 369.99, at: 0, dur: 0.34, peak: 0.24, type: "sawtooth" });
      tone(ac, master, { freq: 220, at: 0.16, dur: 0.6, peak: 0.16, type: "sine", glideTo: 720 });
      haptic(18);
      return;
    }
  }
}
