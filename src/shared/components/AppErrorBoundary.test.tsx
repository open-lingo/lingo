import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { AppErrorBoundary } from "./AppErrorBoundary";
import { CHUNK_RELOAD_FLAG } from "@/shared/utils/lazyRetry";

function Boom(): never {
  throw new TypeError("settings hydrate failed");
}

function BoomChunk(): never {
  throw new Error("Failed to fetch dynamically imported module: https://app.openlingoapp.com/assets/ProtectedHome-DlN-DvKc.js");
}

afterEach(() => {
  sessionStorage.clear();
  vi.unstubAllGlobals();
});

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

  it("shows 'Update available' copy for a dynamically-imported-module error (prod #86)", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <AppErrorBoundary>
        <BoomChunk />
      </AppErrorBoundary>,
    );
    expect(screen.getByText("Update available")).toBeTruthy();
    expect(
      screen.getByText("The app was updated while this page was open. Reload to get the new version."),
    ).toBeTruthy();
    expect(screen.queryByText("Something went wrong")).toBeNull();
    spy.mockRestore();
  });

  it("clears the chunk-reload sessionStorage flag when Reload is clicked (prod #86)", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    sessionStorage.setItem(CHUNK_RELOAD_FLAG, "some-old-build-sha");
    const reload = vi.fn();
    vi.stubGlobal("location", { ...window.location, reload });

    render(
      <AppErrorBoundary>
        <BoomChunk />
      </AppErrorBoundary>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Reload" }));

    expect(sessionStorage.getItem(CHUNK_RELOAD_FLAG)).toBeNull();
    expect(reload).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});
