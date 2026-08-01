import { describe, it, expect, beforeEach } from "vitest";
import {
  getStoryProgress,
  recordStoryRead,
  isStoryRead,
  clearStoryProgress,
  subscribeStoryProgress,
} from "./index";

describe("story progress", () => {
  beforeEach(() => {
    localStorage.clear();
    clearStoryProgress();
  });

  it("an unread story has no progress", () => {
    expect(getStoryProgress("ja-m3-about-me")).toBeNull();
    expect(isStoryRead("ja-m3-about-me")).toBe(false);
  });

  it("records a first read", () => {
    recordStoryRead("ja-m3-about-me");
    const p = getStoryProgress("ja-m3-about-me");
    expect(p?.reads).toBe(1);
    expect(p?.firstReadAt).toBeTruthy();
    expect(p?.lastReadAt).toBe(p?.firstReadAt);
    expect(isStoryRead("ja-m3-about-me")).toBe(true);
  });

  it("increments on re-read and keeps the first timestamp", () => {
    recordStoryRead("ja-m3-about-me");
    const first = getStoryProgress("ja-m3-about-me")!.firstReadAt;
    recordStoryRead("ja-m3-about-me");
    const p = getStoryProgress("ja-m3-about-me")!;
    expect(p.reads).toBe(2);
    expect(p.firstReadAt).toBe(first);
  });

  it("keeps the best score across reads", () => {
    recordStoryRead("s1", { correct: 1, total: 3 });
    expect(getStoryProgress("s1")?.bestScore).toEqual({ correct: 1, total: 3 });
    recordStoryRead("s1", { correct: 3, total: 3 });
    expect(getStoryProgress("s1")?.bestScore).toEqual({ correct: 3, total: 3 });
    recordStoryRead("s1", { correct: 2, total: 3 });
    expect(getStoryProgress("s1")?.bestScore).toEqual({ correct: 3, total: 3 });
  });

  it("a read with no score leaves an existing best score alone", () => {
    recordStoryRead("s1", { correct: 2, total: 2 });
    recordStoryRead("s1");
    expect(getStoryProgress("s1")?.bestScore).toEqual({ correct: 2, total: 2 });
  });

  it("does not replace best score when a tie occurs", () => {
    const score1 = { correct: 2, total: 3 };
    recordStoryRead("s1", score1);
    const score2 = { correct: 2, total: 4 };
    recordStoryRead("s1", score2);
    // The original object (score1) should be retained, not replaced by score2
    expect(getStoryProgress("s1")!.bestScore).toEqual(score1);
  });

  it("notifies subscribers and unsubscribes cleanly", () => {
    let calls = 0;
    const off = subscribeStoryProgress(() => { calls += 1; });
    recordStoryRead("s1");
    expect(calls).toBe(1);
    off();
    recordStoryRead("s2");
    expect(calls).toBe(1);
  });

  it("survives corrupt storage", () => {
    localStorage.setItem("lingo:story-progress:v1", "{not json");
    expect(getStoryProgress("s1")).toBeNull();
    recordStoryRead("s1");
    expect(getStoryProgress("s1")?.reads).toBe(1);
  });

  it("notifies subscribers when clearing progress", () => {
    let calls = 0;
    const off = subscribeStoryProgress(() => { calls += 1; });
    recordStoryRead("s1");
    expect(calls).toBe(1);
    clearStoryProgress();
    expect(calls).toBe(2);
    off();
  });
});
