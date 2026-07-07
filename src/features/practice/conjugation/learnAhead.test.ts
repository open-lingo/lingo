import { describe, it, expect, beforeEach } from "vitest";
import { hasLearnAheadAck, setLearnAheadAck, clearLearnAheadAck } from "./learnAhead";

describe("learn-ahead ack persistence (v1.5)", () => {
  beforeEach(() => clearLearnAheadAck());

  it("defaults to un-acked", () => {
    expect(hasLearnAheadAck()).toBe(false);
  });

  it("persists under the versioned trainer key", () => {
    setLearnAheadAck();
    expect(hasLearnAheadAck()).toBe(true);
    // The literal key is the storage contract — a rename would silently
    // re-prompt every learner who ticked "Don't ask again".
    expect(localStorage.getItem("lingo:conjugation-trainer:learn-ahead-ack:v1")).toBe("1");
  });

  it("clear resets to un-acked", () => {
    setLearnAheadAck();
    clearLearnAheadAck();
    expect(hasLearnAheadAck()).toBe(false);
  });
});
