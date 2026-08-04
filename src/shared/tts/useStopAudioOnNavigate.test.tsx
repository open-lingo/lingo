import { describe, it, expect, vi, beforeEach } from "vitest";
import { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Link } from "react-router-dom";

const stopAllAudio = vi.fn();
vi.mock("@/shared/tts", () => ({ stopAllAudio: () => stopAllAudio() }));

const { useStopAudioOnNavigate } = await import("./useStopAudioOnNavigate");

function Harness() {
  useStopAudioOnNavigate();
  const [n, setN] = useState(0);
  return (
    <>
      <button type="button" onClick={() => setN(n + 1)}>
        rerender {n}
      </button>
      <Link to="/b">to b</Link>
      <Link to="/a">to a</Link>
    </>
  );
}

function renderHarness() {
  return render(
    <MemoryRouter initialEntries={["/a"]}>
      <Harness />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  stopAllAudio.mockClear();
});

describe("useStopAudioOnNavigate", () => {
  it("does not stop audio on mount", () => {
    renderHarness();
    expect(stopAllAudio).not.toHaveBeenCalled();
  });

  it("does not stop audio on a re-render at the same path", () => {
    renderHarness();
    fireEvent.click(screen.getByRole("button", { name: /rerender/ }));
    fireEvent.click(screen.getByRole("button", { name: /rerender/ }));
    // A lesson autoplays ~350ms after its step mounts; any stop triggered by an
    // unrelated re-render lands inside that window and eats the clip.
    expect(stopAllAudio).not.toHaveBeenCalled();
  });

  it("stops audio when the pathname changes", () => {
    renderHarness();
    fireEvent.click(screen.getByRole("link", { name: "to b" }));
    expect(stopAllAudio).toHaveBeenCalledTimes(1);
  });

  it("stops audio again on every subsequent navigation", () => {
    renderHarness();
    fireEvent.click(screen.getByRole("link", { name: "to b" }));
    fireEvent.click(screen.getByRole("link", { name: "to a" }));
    expect(stopAllAudio).toHaveBeenCalledTimes(2);
  });
});
