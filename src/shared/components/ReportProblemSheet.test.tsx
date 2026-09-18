/**
 * "Report a problem" (lane REPORTBTN, 2026-09-18) — reachable from the
 * lesson header, a wrong-answer step footer, and the Home account menu.
 * Exercises the real `sendDiagnosticsReport` → `sendDiagnostics` → `fetch`
 * path (mocking only `fetch`), same style as
 * `src/features/sync/LayoutTracePanel.test.tsx`, which this sheet reuses
 * the transport of.
 *
 * Wrapped in a REAL `I18nextProvider` (not the bare-fallback default): a
 * `{{var}}` interpolation inside a `defaultValue` only resolves through a
 * real i18next instance — react-i18next's provider-less fallback returns
 * the template literally, unprocessed (same note as `LayoutTracePanel.test.tsx`
 * and `DailyWelcomeAd.test.tsx`). Interpolated assertions use a regex
 * matcher for the same reason.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import type { ReactElement } from "react";
import i18n from "@/shared/i18n/i18n";
import {
  ReportProblemFooterLink,
  ReportProblemHeaderButton,
  ReportProblemMenuRow,
  ReportProblemSheet,
} from "./ReportProblemSheet";
import { __resetErrorReporterForTests, setLessonContext } from "@/shared/telemetry/errorReporter";
import { clearSessionLog } from "@/shared/telemetry/sessionLog";

function renderI18n(ui: ReactElement) {
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);
}

function lastFetchBody(fetchSpy: ReturnType<typeof vi.spyOn>): Record<string, unknown> {
  const call = fetchSpy.mock.calls.at(-1) as [string, RequestInit];
  return JSON.parse(call[1].body as string);
}

describe("ReportProblemSheet", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    __resetErrorReporterForTests();
    clearSessionLog();
    fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ code: "K7P4QX" }), { status: 202 }));
  });

  afterEach(() => {
    setLessonContext(null);
    vi.restoreAllMocks();
  });

  it("renders nothing when closed", () => {
    renderI18n(<ReportProblemSheet open={false} onClose={() => {}} screen="lesson" />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders the note field, char count and what-we-send line when open", () => {
    renderI18n(<ReportProblemSheet open onClose={() => {}} screen="home" />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText(/what went wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/0\/280/)).toBeInTheDocument();
    expect(screen.getByText(/We send your last 20 actions/i)).toBeInTheDocument();
  });

  it("shows the lesson+step what-we-send copy only when opened from a lesson with context set", () => {
    setLessonContext({ lessonId: "ja-m12-03", stepIndex: 4, stepType: "build_sentence" });
    renderI18n(<ReportProblemSheet open onClose={() => {}} screen="lesson" />);
    expect(screen.getByText(/We send this lesson and step/i)).toBeInTheDocument();
  });

  it("caps the note textarea at 280 chars via maxLength", () => {
    renderI18n(<ReportProblemSheet open onClose={() => {}} screen="home" />);
    const textarea = screen.getByLabelText(/what went wrong/i) as HTMLTextAreaElement;
    expect(textarea.maxLength).toBe(280);
  });

  it("sends the diagnostics payload with note/screen and shows the returned code", async () => {
    renderI18n(<ReportProblemSheet open onClose={() => {}} screen="home" />);
    fireEvent.change(screen.getByLabelText(/what went wrong/i), {
      target: { value: "The tile bank had a duplicate word." },
    });
    fireEvent.click(screen.getByRole("button", { name: /^send$/i }));

    await waitFor(() => expect(screen.getByText(/K7P4QX/)).toBeInTheDocument());

    const sent = lastFetchBody(fetchSpy);
    expect(sent.note).toBe("The tile bank had a duplicate word.");
    expect(sent.screen).toBe("home");
    expect(sent.lessonId).toBeUndefined();
  });

  it("carries lessonId/stepIndex/stepType from the current lesson context on screen='lesson'", async () => {
    setLessonContext({ lessonId: "ja-m12-03", stepIndex: 4, stepType: "build_sentence" });
    renderI18n(<ReportProblemSheet open onClose={() => {}} screen="lesson" />);
    fireEvent.click(screen.getByRole("button", { name: /^send$/i }));

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const sent = lastFetchBody(fetchSpy);
    expect(sent.lessonId).toBe("ja-m12-03");
    expect(sent.stepIndex).toBe(4);
    expect(sent.stepType).toBe("build_sentence");
    expect(sent.screen).toBe("lesson");
  });

  it("sends an empty note as omitted, not a blank string", async () => {
    renderI18n(<ReportProblemSheet open onClose={() => {}} screen="home" />);
    fireEvent.click(screen.getByRole("button", { name: /^send$/i }));
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const sent = lastFetchBody(fetchSpy);
    expect(sent.note).toBeUndefined();
  });

  it("shows an error state and never crashes on a network failure", async () => {
    fetchSpy.mockRejectedValue(new TypeError("Failed to fetch"));
    renderI18n(<ReportProblemSheet open onClose={() => {}} screen="home" />);
    fireEvent.click(screen.getByRole("button", { name: /^send$/i }));
    await waitFor(() => expect(screen.getByText(/couldn't send/i)).toBeInTheDocument());
  });

  it("Copy button copies the code to the clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    renderI18n(<ReportProblemSheet open onClose={() => {}} screen="home" />);
    fireEvent.click(screen.getByRole("button", { name: /^send$/i }));
    await waitFor(() => expect(screen.getByText(/K7P4QX/)).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /^copy$/i }));
    expect(writeText).toHaveBeenCalledWith("K7P4QX");
  });
});

describe("ReportProblemHeaderButton", () => {
  beforeEach(() => {
    __resetErrorReporterForTests();
    clearSessionLog();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ code: "K7P4QX" }), { status: 202 }));
  });
  afterEach(() => vi.restoreAllMocks());

  it("has an accessible icon button (aria-label) that opens the sheet", () => {
    renderI18n(<ReportProblemHeaderButton />);
    const trigger = screen.getByLabelText(/report a problem/i);
    expect(trigger.tagName).toBe("BUTTON");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(trigger);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});

describe("ReportProblemFooterLink", () => {
  beforeEach(() => {
    __resetErrorReporterForTests();
    clearSessionLog();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ code: "K7P4QX" }), { status: 202 }));
  });
  afterEach(() => vi.restoreAllMocks());

  it("renders 'Something off? Report' and opens the sheet on click", () => {
    renderI18n(<ReportProblemFooterLink />);
    expect(screen.getByText(/something off/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^report$/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});

describe("ReportProblemMenuRow", () => {
  beforeEach(() => {
    __resetErrorReporterForTests();
    clearSessionLog();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ code: "K7P4QX" }), { status: 202 }));
  });
  afterEach(() => vi.restoreAllMocks());

  it("renders the menu row and opens the sheet on click", () => {
    renderI18n(<ReportProblemMenuRow />);
    fireEvent.click(screen.getByRole("button", { name: /report a problem/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
