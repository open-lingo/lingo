/**
 * "Send diagnostics" (A3b, 2026-09-17) — the one-tap button next to the
 * Layout-trace tools in the Sync panel. Exercises the real
 * `sendDiagnosticsReport` → `sendDiagnostics` → `fetch` path (mocking only
 * `fetch`, not the module) so this proves the button is actually wired to
 * a POST, not just that a mock got called.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/shared/i18n/i18n";
import { LayoutTracePanel } from "./LayoutTracePanel";
import { clearSessionLog, logSessionEvent } from "@/shared/telemetry/sessionLog";
import { __resetErrorReporterForTests } from "@/shared/telemetry/errorReporter";

// `{{code}}` interpolation in `syncManager.diagnostics.codeLabel`'s
// `defaultValue` needs a REAL i18next instance (react-i18next's bare
// fallback — no provider — returns `defaultValue` as a literal template,
// unprocessed) — same pattern as `DailyWelcomeAd.test.tsx`.
function renderPanel() {
  return render(
    <I18nextProvider i18n={i18n}>
      <LayoutTracePanel />
    </I18nextProvider>,
  );
}

describe("LayoutTracePanel — Send diagnostics", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    clearSessionLog();
    __resetErrorReporterForTests();
    localStorage.clear();
    fetchSpy = vi.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    clearSessionLog();
    __resetErrorReporterForTests();
  });

  it("renders a Send diagnostics button", () => {
    renderPanel();
    expect(screen.getByRole("button", { name: /send diagnostics/i })).toBeInTheDocument();
  });

  it("posts to the diagnostics endpoint and shows the returned code", async () => {
    fetchSpy.mockResolvedValue(new Response(JSON.stringify({ code: "K7P4QX" }), { status: 202 }));
    logSessionEvent("lesson_start", { lessonId: "ja-m12" });

    renderPanel();
    fireEvent.click(screen.getByRole("button", { name: /send diagnostics/i }));

    await waitFor(() => expect(screen.getByText(/K7P4QX/)).toBeInTheDocument());

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/telemetry\/diagnostics$/);
    const sent = JSON.parse(init.body as string);
    expect(sent.sessionLog).toHaveLength(1);
    expect(sent.sessionLog[0].payload.lessonId).toBe("ja-m12");
  });

  it("shows a Copy action once a code is back, and copies it", async () => {
    fetchSpy.mockResolvedValue(new Response(JSON.stringify({ code: "K7P4QX" }), { status: 202 }));
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });

    renderPanel();
    fireEvent.click(screen.getByRole("button", { name: /send diagnostics/i }));
    await waitFor(() => expect(screen.getByText(/K7P4QX/)).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /^copy$/i }));
    expect(writeText).toHaveBeenCalledWith("K7P4QX");
  });

  it("shows an error state and no code on failure, and never throws", async () => {
    fetchSpy.mockRejectedValue(new TypeError("Failed to fetch"));

    renderPanel();
    fireEvent.click(screen.getByRole("button", { name: /send diagnostics/i }));

    await waitFor(() => expect(screen.getByText(/couldn't send/i)).toBeInTheDocument());
    expect(screen.queryByText(/tell spencer/i)).not.toBeInTheDocument();
  });

  it("disables the button while a send is in flight", async () => {
    let resolveFetch!: (r: Response) => void;
    fetchSpy.mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      }),
    );

    renderPanel();
    const button = screen.getByRole("button", { name: /send diagnostics/i });
    fireEvent.click(button);

    await waitFor(() => expect(screen.getByRole("button", { name: /sending/i })).toBeDisabled());

    resolveFetch(new Response(JSON.stringify({ code: "K7P4QX" }), { status: 202 }));
    await waitFor(() => expect(screen.getByText(/K7P4QX/)).toBeInTheDocument());
  });
});
