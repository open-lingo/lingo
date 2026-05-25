import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { FakeAdProvider } from "./FakeAdProvider";

afterEach(() => {
  cleanup();
});

describe("FakeAdProvider", () => {
  it("has id 'fake' and is always ready", () => {
    const provider = new FakeAdProvider();
    expect(provider.id).toBe("fake");
    expect(provider.isReady()).toBe(true);
  });

  it("renders a placeholder node with Sponsored label", () => {
    const provider = new FakeAdProvider();
    const result = provider.request({ slot: "daily-welcome", format: "banner" });
    expect(result).not.toBeNull();
    render(<>{result!.node}</>);
    // Match the "Sponsored" badge (case-insensitive).
    expect(screen.getByText(/sponsored/i)).toBeInTheDocument();
    // At least one element labels this as a demo / placeholder ad.
    expect(screen.getAllByText(/demo ad/i).length).toBeGreaterThan(0);
  });

  it("returns a unique impressionId per request", () => {
    const provider = new FakeAdProvider();
    const a = provider.request({ slot: "daily-welcome", format: "banner" });
    const b = provider.request({ slot: "daily-welcome", format: "banner" });
    expect(a).not.toBeNull();
    expect(b).not.toBeNull();
    expect(a!.impressionId).not.toBe(b!.impressionId);
  });

  it("includes the slot id on the rendered node for traceability", () => {
    const provider = new FakeAdProvider();
    const result = provider.request({ slot: "inline", format: "banner" });
    render(<>{result!.node}</>);
    expect(screen.getByTestId("fake-ad-inline")).toBeInTheDocument();
  });
});
