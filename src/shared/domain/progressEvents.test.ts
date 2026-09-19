import { describe, it, expect, beforeEach } from "vitest";
import {
  emitProgressChanged,
  subscribeProgressChanged,
  getProgressChangeVersion,
  resetProgressEventsForTests,
} from "./progressEvents";

describe("progressEvents", () => {
  beforeEach(() => resetProgressEventsForTests());

  it("notifies every subscriber with the reason, once per emit", () => {
    const seenA: string[] = [];
    const seenB: string[] = [];
    subscribeProgressChanged((e) => seenA.push(e.reason));
    subscribeProgressChanged((e) => seenB.push(e.reason));

    emitProgressChanged("reconcile_push");
    emitProgressChanged("lesson_end");

    expect(seenA).toEqual(["reconcile_push", "lesson_end"]);
    expect(seenB).toEqual(["reconcile_push", "lesson_end"]);
  });

  it("unsubscribe stops further notifications", () => {
    const seen: string[] = [];
    const unsubscribe = subscribeProgressChanged((e) => seen.push(e.reason));
    emitProgressChanged("lesson_end");
    unsubscribe();
    emitProgressChanged("bulk_complete");
    expect(seen).toEqual(["lesson_end"]);
  });

  it("one bad subscriber does not block the others", () => {
    const seen: string[] = [];
    subscribeProgressChanged(() => {
      throw new Error("boom");
    });
    subscribeProgressChanged((e) => seen.push(e.reason));

    expect(() => emitProgressChanged("placement")).not.toThrow();
    expect(seen).toEqual(["placement"]);
  });

  it("bumps a monotonic version once per emit, for memos that just need 'something changed'", () => {
    const start = getProgressChangeVersion();
    emitProgressChanged("srs_sync");
    expect(getProgressChangeVersion()).toBe(start + 1);
    emitProgressChanged("srs_sync");
    expect(getProgressChangeVersion()).toBe(start + 2);
  });

  it("carries a fresh timestamp per event", () => {
    const events: number[] = [];
    subscribeProgressChanged((e) => events.push(e.at));
    emitProgressChanged("ui_mutation");
    expect(events[0]).toBeGreaterThan(0);
  });
});
