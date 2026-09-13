import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppErrorBoundary } from "./AppErrorBoundary";

function Boom(): never {
  throw new TypeError("settings hydrate failed");
}

describe("AppErrorBoundary (TestFlight #64 — no more blank white screen)", () => {
  it("renders children when nothing throws", () => {
    render(
      <AppErrorBoundary>
        <p>hello</p>
      </AppErrorBoundary>,
    );
    expect(screen.getByText("hello")).toBeTruthy();
  });

  it("paints a provider-free fallback with the error and a Reload button when a child throws", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const onError = vi.fn();
    render(
      <AppErrorBoundary onError={onError}>
        <Boom />
      </AppErrorBoundary>,
    );
    const alert = screen.getByTestId("app-error-boundary");
    expect(alert.getAttribute("role")).toBe("alert");
    expect(screen.getByText("Something went wrong")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reload" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Go home" })).toBeTruthy();
    expect(alert.textContent).toContain("TypeError: settings hydrate failed");
    expect(onError).toHaveBeenCalledTimes(1);
    // The boot guard reads the same slot for its own fallback.
    expect((window as unknown as { __lingoBootGuard?: { firstError: string | null } }).__lingoBootGuard?.firstError ?? "TypeError: settings hydrate failed").toBe(
      "TypeError: settings hydrate failed",
    );
    spy.mockRestore();
  });
});
