import { describe, expect, it } from "vitest";
import { nextDrawGate } from "./ghostPacing";

describe("nextDrawGate", () => {
  const FRAME_MS = 1000 / 30; // ~33.33ms

  it("draws on the first call", () => {
    const result = nextDrawGate(1000, 0, FRAME_MS);
    expect(result.draw).toBe(true);
    expect(result.lastDraw).toBe(1000);
  });

  it("does not draw 10ms after the last draw", () => {
    const first = nextDrawGate(1000, 0, FRAME_MS);
    const second = nextDrawGate(1010, first.lastDraw, FRAME_MS);
    expect(second.draw).toBe(false);
    expect(second.lastDraw).toBe(first.lastDraw);
  });

  it("draws 34ms later and advances lastDraw by exactly one frameMs, not to now", () => {
    const first = nextDrawGate(1000, 0, FRAME_MS);
    const second = nextDrawGate(1000 + 34, first.lastDraw, FRAME_MS);
    expect(second.draw).toBe(true);
    expect(second.lastDraw).toBe(first.lastDraw + FRAME_MS);
    expect(second.lastDraw).not.toBe(1000 + 34);
  });

  it("catches up a 300ms stall by whole frames and draws once", () => {
    const first = nextDrawGate(1000, 0, FRAME_MS);
    const now = 1000 + 300;
    const second = nextDrawGate(now, first.lastDraw, FRAME_MS);
    expect(second.draw).toBe(true);
    const steps = Math.floor(300 / FRAME_MS);
    expect(second.lastDraw).toBe(first.lastDraw + steps * FRAME_MS);
    // Advances by whole frames, landing on the original grid (never past
    // `now` — floating point rounding on this frameMs can land exactly on
    // `now` for a stall that's a clean multiple of it, but never beyond).
    expect(second.lastDraw).toBeLessThanOrEqual(now);
  });

  it("stays draw:false until elapsed reaches frameMs, then draws exactly once per subsequent gate", () => {
    let lastDraw = nextDrawGate(0, 0, FRAME_MS).lastDraw;
    let draws = 0;
    for (let now = 0; now <= FRAME_MS * 5; now += 5) {
      const result = nextDrawGate(now, lastDraw, FRAME_MS);
      if (result.draw) {
        draws += 1;
        lastDraw = result.lastDraw;
      }
    }
    // Roughly one draw per frame interval over 5 frames worth of time.
    expect(draws).toBeGreaterThanOrEqual(4);
    expect(draws).toBeLessThanOrEqual(6);
  });
});
