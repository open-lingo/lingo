/**
 * Tests for the audio-capture utilities. Focus on the pure helpers
 * (`resampleLinear`, `concatFloat32`, `rms`) — the live mic path is
 * exercised manually in the spike, not in CI.
 */
import { describe, it, expect } from "vitest";
import {
  WHISPER_SAMPLE_RATE,
  concatFloat32,
  resampleLinear,
  rms,
} from "./audioCapture";

function sineWave(samples: number, freq: number, sampleRate: number) {
  const out = new Float32Array(samples);
  for (let i = 0; i < samples; i++) {
    out[i] = Math.sin((2 * Math.PI * freq * i) / sampleRate);
  }
  return out;
}

describe("resampleLinear", () => {
  it("returns the same buffer when rates match", () => {
    const buf = sineWave(1000, 440, 16000);
    const out = resampleLinear(buf, 16000, 16000);
    expect(out).toBe(buf);
  });

  it("downsamples 48 kHz → 16 kHz with length ~= input * 16000/48000", () => {
    const samples = 48000; // 1 second of 48 kHz audio
    const buf = sineWave(samples, 440, 48000);
    const out = resampleLinear(buf, 48000, WHISPER_SAMPLE_RATE);
    // floor(48000 / 3) = 16000
    expect(out.length).toBe(16000);
  });

  it("downsamples 44.1 kHz → 16 kHz with length ~= input * 16000/44100", () => {
    const samples = 44100;
    const buf = sineWave(samples, 220, 44100);
    const out = resampleLinear(buf, 44100, WHISPER_SAMPLE_RATE);
    // floor(44100 * 16000 / 44100) = 16000 — ratio = 44100/16000
    // outLen = floor(44100 / (44100/16000)) = 16000
    expect(out.length).toBe(16000);
  });

  it("preserves rough signal energy through resampling (within 20%)", () => {
    const buf = sineWave(48000, 440, 48000);
    const inputRms = rms(buf);
    const out = resampleLinear(buf, 48000, 16000);
    const outputRms = rms(out);
    // 0.7071 ideal for a sine; linear interp loses a bit on the
    // highest frequency components but 440 Hz is comfortably below
    // Nyquist (8 kHz). 20% slack.
    expect(Math.abs(outputRms - inputRms)).toBeLessThan(0.2);
  });

  it("returns an empty array for empty input", () => {
    const out = resampleLinear(new Float32Array(0), 48000, 16000);
    expect(out.length).toBe(0);
  });
});

describe("concatFloat32", () => {
  it("concatenates chunks in order", () => {
    const a = new Float32Array([1, 2, 3]);
    const b = new Float32Array([4, 5]);
    const c = new Float32Array([6]);
    const merged = concatFloat32([a, b, c]);
    expect(Array.from(merged)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("handles an empty list", () => {
    const merged = concatFloat32([]);
    expect(merged.length).toBe(0);
  });
});

describe("rms", () => {
  it("is zero for silence", () => {
    expect(rms(new Float32Array(100))).toBe(0);
  });

  it("is ~0.707 for a unit-amplitude sine", () => {
    const buf = sineWave(16000, 440, 16000);
    expect(rms(buf)).toBeGreaterThan(0.69);
    expect(rms(buf)).toBeLessThan(0.72);
  });
});
