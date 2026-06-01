import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  clearImpersonation,
  getImpersonation,
  getImpersonationTargetId,
  setImpersonation,
  subscribeImpersonation,
} from "./impersonation";

describe("impersonation store", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("returns null when no state is persisted", () => {
    expect(getImpersonation()).toBeNull();
    expect(getImpersonationTargetId()).toBeNull();
  });

  it("round-trips state through sessionStorage", () => {
    setImpersonation({
      targetUserId: "user-1",
      targetUsername: "alice",
      targetDisplayName: "Alice",
      adminUserId: "admin-1",
    });
    expect(getImpersonationTargetId()).toBe("user-1");
    expect(getImpersonation()).toEqual({
      targetUserId: "user-1",
      targetUsername: "alice",
      targetDisplayName: "Alice",
      adminUserId: "admin-1",
    });
  });

  it("clears state", () => {
    setImpersonation({
      targetUserId: "user-1",
      targetUsername: "alice",
      targetDisplayName: "",
      adminUserId: "admin-1",
    });
    clearImpersonation();
    expect(getImpersonationTargetId()).toBeNull();
  });

  it("notifies subscribers on set + clear", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeImpersonation(listener);

    setImpersonation({
      targetUserId: "u-1",
      targetUsername: "u",
      targetDisplayName: "",
      adminUserId: "a-1",
    });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({ targetUserId: "u-1" }),
    );

    clearImpersonation();
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenLastCalledWith(null);

    unsubscribe();
    setImpersonation({
      targetUserId: "u-2",
      targetUsername: "u2",
      targetDisplayName: "",
      adminUserId: "a-1",
    });
    expect(listener).toHaveBeenCalledTimes(2); // not fired after unsub
  });

  it("treats corrupted JSON as no state", () => {
    window.sessionStorage.setItem("lingo.impersonation", "{not valid json");
    expect(getImpersonation()).toBeNull();
  });

  it("treats partial / wrong-shape payload as no state", () => {
    window.sessionStorage.setItem(
      "lingo.impersonation",
      JSON.stringify({ targetUsername: "bob" }),
    );
    expect(getImpersonation()).toBeNull();
  });
});
