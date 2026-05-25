import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useRef } from "react";
import { render, screen, cleanup, act } from "@testing-library/react";
import { BackToCurrentButton } from "./BackToCurrentButton";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (
      _k: string,
      opts?: { defaultValue?: string } & Record<string, unknown>,
    ) => {
      if (!opts) return _k;
      if (typeof opts === "string") return opts;
      return opts.defaultValue ?? _k;
    },
  }),
}));

type IOCallback = (entries: Array<{ isIntersecting: boolean }>) => void;

class MockIntersectionObserver {
  callback: IOCallback;
  static instances: MockIntersectionObserver[] = [];
  constructor(cb: IOCallback) {
    this.callback = cb;
    MockIntersectionObserver.instances.push(this);
  }
  observe() {
    // Default to "in view" on first observation so initial state matches
    // happy-dom layout assumptions (target is initially visible).
    this.callback([{ isIntersecting: true }]);
  }
  unobserve() {
    // no-op
  }
  disconnect() {
    // no-op
  }
}

beforeEach(() => {
  MockIntersectionObserver.instances = [];
  (globalThis as unknown as { IntersectionObserver: typeof IntersectionObserver }).IntersectionObserver =
    MockIntersectionObserver as unknown as typeof IntersectionObserver;
});

afterEach(() => {
  cleanup();
});

function Harness() {
  const root = useRef<HTMLDivElement | null>(null);
  const target = useRef<HTMLDivElement | null>(null);
  return (
    <div ref={root} data-testid="root">
      <div ref={target} data-testid="target" />
      <BackToCurrentButton rootRef={root} targetRef={target} />
    </div>
  );
}

describe("BackToCurrentButton", () => {
  it("is hidden when the target is in view", () => {
    render(<Harness />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("becomes visible when the target leaves the viewport", () => {
    render(<Harness />);
    // Simulate the observer firing with the target no longer intersecting.
    const io = MockIntersectionObserver.instances[0];
    expect(io).toBeDefined();
    act(() => {
      io.callback([{ isIntersecting: false }]);
    });
    const btn = screen.getByRole("button");
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAccessibleName(/back to/i);
  });

  it("re-hides when the target comes back into view", () => {
    render(<Harness />);
    const io = MockIntersectionObserver.instances[0];
    act(() => io.callback([{ isIntersecting: false }]));
    expect(screen.getByRole("button")).toBeInTheDocument();
    act(() => io.callback([{ isIntersecting: true }]));
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("clicking it triggers scrollIntoView on the target", () => {
    const spy = vi.fn();
    // Patch the prototype to capture the call.
    const original = HTMLElement.prototype.scrollIntoView;
    HTMLElement.prototype.scrollIntoView = spy;
    try {
      render(<Harness />);
      const io = MockIntersectionObserver.instances[0];
      act(() => io.callback([{ isIntersecting: false }]));
      const btn = screen.getByRole("button");
      btn.click();
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0]).toMatchObject({
        behavior: "smooth",
        block: "center",
      });
    } finally {
      HTMLElement.prototype.scrollIntoView = original;
    }
  });
});
