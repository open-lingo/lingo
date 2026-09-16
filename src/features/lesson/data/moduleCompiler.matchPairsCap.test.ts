/**
 * #157a (TestFlight b20, 2026-09-15): the review `match_pairs` grid is
 * capped at 6 pairs. `a8624814` (build 17) raised `--match-tile-h` and
 * dropped `--match-font-scale`, so 6 rows now need ~568px of stage while a
 * 16 Pro Max phone-height stage measures ~478px — the grid clips.
 * `MatchPairsStepView` has no round mechanism (checked before writing
 * this fix — a single fixed `pairs` array, no round state), so the
 * accepted fallback is one fewer pair, dropped deterministically, on a
 * phone-height stage only: `< 640px tall`, or `(pointer:coarse) and
 * (max-width:639px)`. Every taller/desktop stage keeps all 6 — this is a
 * device-shape trim, not a content change.
 *
 * These stubs mirror `formFactor.test.ts`'s device-shaped `matchMedia`
 * fake (not a hand-spelled re-parse of the query strings this file's
 * `isPhoneHeightStage` actually uses), so a typo in the query itself
 * would fail here rather than pass a mirrored typo.
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import { compileModule, isPhoneHeightStage, type ModuleIR } from "./moduleCompiler";
import m34Ir from "@/features/languages/ja/curriculum/ir/m34.ir.json";

const realMatchMedia = window.matchMedia;

afterEach(() => {
  window.matchMedia = realMatchMedia;
  vi.restoreAllMocks();
});

function stubDevice({ w, h, coarse }: { w: number; h: number; coarse: boolean }) {
  const evaluate = (query: string): boolean => {
    const minW = /min-width:\s*(\d+)px/.exec(query);
    const maxW = /max-width:\s*(\d+)px/.exec(query);
    const maxH = /max-height:\s*(\d+)px/.exec(query);
    if (minW && w < Number(minW[1])) return false;
    if (maxW && w > Number(maxW[1])) return false;
    if (maxH && h > Number(maxH[1])) return false;
    if (query.includes("pointer: coarse") && !coarse) return false;
    return true;
  };
  window.matchMedia = vi.fn((query: string) => ({
    matches: evaluate(query),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

/** The trailing `match_pairs` review step of a compiled lesson (the whole
 *  module — every lesson's steps array ends with one, per the "close on
 *  match" invariant). */
function matchSteps(ir: ModuleIR): { id: string; pairs: unknown[] }[] {
  return compileModule(ir)
    .map((l) => l.steps[l.steps.length - 1])
    .filter((s): s is typeof s & { pairs: unknown[] } => s.type === "match_pairs");
}

describe("isPhoneHeightStage", () => {
  it("is true on a 16 Pro Max portrait stage (430x932, touch) — short by pointer+width, not height", () => {
    stubDevice({ w: 430, h: 932, coarse: true });
    expect(isPhoneHeightStage()).toBe(true);
  });

  it("is true on any stage under 640px tall regardless of pointer (a short laptop window)", () => {
    stubDevice({ w: 1180, h: 600, coarse: false });
    expect(isPhoneHeightStage()).toBe(true);
  });

  it("is false on a landscape iPad / desktop-mirror stage (1180x820, touch)", () => {
    stubDevice({ w: 1180, h: 820, coarse: true });
    expect(isPhoneHeightStage()).toBe(false);
  });

  it("is false with no matchMedia at all (SSR/test-double safety)", () => {
    // @ts-expect-error — simulating an environment without the API
    window.matchMedia = undefined;
    expect(isPhoneHeightStage()).toBe(false);
  });
});

describe("compileModule match_pairs cap (#157a)", () => {
  it("never exceeds 6 pairs off a phone-height stage (unchanged cap)", () => {
    stubDevice({ w: 1180, h: 820, coarse: true });
    const steps = matchSteps(m34Ir as unknown as ModuleIR);
    expect(steps.length).toBeGreaterThan(0);
    for (const s of steps) expect(s.pairs.length).toBeLessThanOrEqual(6);
    // The real m34 pool is rich enough that at least one review lesson
    // still hits the un-trimmed 6-pair ceiling — otherwise this test
    // could pass by accident on a module that never reaches the cap.
    expect(steps.some((s) => s.pairs.length === 6)).toBe(true);
  });

  it("trims by exactly one pair on a phone-height stage — deterministic, same content, never below 5", () => {
    stubDevice({ w: 1180, h: 820, coarse: true });
    const deskSteps = matchSteps(m34Ir as unknown as ModuleIR);
    stubDevice({ w: 430, h: 932, coarse: true });
    const phoneSteps = matchSteps(m34Ir as unknown as ModuleIR);
    expect(phoneSteps.length).toBe(deskSteps.length);
    let sawATrim = false;
    for (let i = 0; i < phoneSteps.length; i++) {
      const desk = deskSteps[i].pairs;
      const phone = phoneSteps[i].pairs;
      const wantLen = Math.min(desk.length, 5);
      if (wantLen < desk.length) sawATrim = true;
      expect(phone.length).toBe(wantLen);
      // Deterministic drop: the phone grid is a PREFIX of the desktop
      // grid, in the same order — never a re-picked or re-ranked subset,
      // and the dropped pair is whichever sorted last (the "last pair").
      expect(phone).toEqual(desk.slice(0, wantLen));
    }
    // At least one review lesson actually had 6 to trim from — otherwise
    // this test could pass vacuously on an under-populated module.
    expect(sawATrim).toBe(true);
  });
});
