import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Sheet } from "@/shared/components/ui/Sheet";
import { Textarea } from "@/shared/components/ui/Textarea";
import { Button } from "@/shared/components/ui/Button";
import { Icon } from "@/shared/components/Icon";
import { cn } from "@/shared/components/ui/cn";
import {
  getLessonContext,
  REPORT_NOTE_MAX_CHARS,
  REPORT_SESSION_LOG_EVENTS,
  sendDiagnosticsReport,
} from "@/shared/telemetry/errorReporter";
import { buildTapReplayDocument } from "@/shared/telemetry/sessionLog";

/**
 * "Report a problem" — lane REPORTBTN, 2026-09-18. Spencer: Android has no
 * TestFlight screenshot feedback and a new tester's (Riley's) verbal report
 * left nothing on the server — no error report, no diagnostics. This closes
 * that gap with an in-lesson (and Home-menu) action that posts the SAME
 * document the power-user "Send diagnostics" button posts
 * (`buildDiagnosticsDocument`/`POST /telemetry/diagnostics`) plus an
 * optional note and the current lesson/step, so a report reads back with
 * `scripts/ops/pull-diagnostics.mjs <CODE>` exactly like a diagnostics dump
 * does — no new endpoint, no new CloudWatch stream.
 *
 * One component, three call sites (lesson header icon button, wrong-answer
 * step footer link, Home account menu row) — see `ReportProblemHeaderButton`
 * / `ReportProblemFooterLink` / `ReportProblemMenuRow` below, each a thin
 * trigger that owns its own open state and renders this sheet.
 */

export type ReportProblemScreen = "lesson" | "home";

export type ReportProblemSheetProps = {
  open: boolean;
  onClose: () => void;
  /** Where the report was opened from — carried on the payload's `screen`
   *  field and used to pick the "what we send" copy (a Home-menu report has
   *  no lesson/step to describe). */
  screen: ReportProblemScreen;
};

type SendState = "idle" | "sending" | "error";

function fallbackCopy(text: string): void {
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  } catch {
    /* best effort — nothing else to fall back to */
  }
}

function copyText(text: string): void {
  if (navigator.clipboard?.writeText) {
    void navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

export function ReportProblemSheet({ open, onClose, screen }: ReportProblemSheetProps) {
  const { t } = useTranslation();
  const [note, setNote] = useState("");
  const [state, setState] = useState<SendState>("idle");
  const [code, setCode] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  const lessonCtx = screen === "lesson" ? getLessonContext() : null;

  function reset(): void {
    setNote("");
    setState("idle");
    setCode(null);
    setCodeCopied(false);
  }

  function handleClose(): void {
    onClose();
    // Delay the content reset past the close animation so the sheet
    // doesn't visibly blank itself before it's off-screen.
    setTimeout(reset, 200);
  }

  async function handleSend(): Promise<void> {
    setState("sending");
    setCode(null);
    const tapReplayDoc = buildTapReplayDocument();
    const result = await sendDiagnosticsReport({
      maxSessionLogEvents: REPORT_SESSION_LOG_EVENTS,
      tapReplay: tapReplayDoc ?? undefined,
      note: note.trim() ? note.trim() : undefined,
      lessonId: lessonCtx?.lessonId,
      stepIndex: lessonCtx?.stepIndex,
      stepType: lessonCtx?.stepType,
      screen,
    });
    if (result.ok && result.code) {
      setCode(result.code);
      setState("idle");
    } else {
      setState("error");
    }
  }

  return (
    <Sheet
      open={open}
      onClose={handleClose}
      side="auto"
      title={t("reportProblem.sheetTitle", "Report a problem")}
    >
      <div className="space-y-3">
        {code ? (
          <div className="space-y-3">
            <p className="text-sm text-text-secondary">
              {t("reportProblem.sentThanks", "Thanks — this helps us find it.")}
            </p>
            <div className="flex items-center justify-between gap-2 rounded-lg border border-accent/30 bg-accent-muted/30 px-3 py-2.5">
              <span className="text-base font-bold tracking-wide text-text-primary">
                {t("reportProblem.codeLabel", "Tell Spencer: {{code}}", { code })}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  copyText(code);
                  setCodeCopied(true);
                  setTimeout(() => setCodeCopied(false), 1500);
                }}
              >
                {codeCopied
                  ? t("reportProblem.copied", "Copied")
                  : t("reportProblem.copy", "Copy")}
              </Button>
            </div>
            <Button type="button" variant="secondary" className="w-full" onClick={handleClose}>
              {t("reportProblem.done", "Done")}
            </Button>
          </div>
        ) : (
          <>
            <label htmlFor="report-problem-note" className="block text-sm font-semibold text-text-primary">
              {t("reportProblem.noteLabel", "What went wrong?")}
            </label>
            <Textarea
              id="report-problem-note"
              rows={3}
              maxLength={REPORT_NOTE_MAX_CHARS}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("reportProblem.notePlaceholder", "Tell us what happened (optional)")}
              aria-describedby="report-problem-char-count report-problem-what-we-send"
            />
            <p id="report-problem-char-count" className="text-right text-xs text-text-muted">
              {t("reportProblem.charCount", "{{n}}/{{max}}", { n: note.length, max: REPORT_NOTE_MAX_CHARS })}
            </p>
            <p id="report-problem-what-we-send" className="text-xs leading-relaxed text-text-muted">
              {screen === "lesson" && lessonCtx?.lessonId
                ? t(
                    "reportProblem.whatWeSendLesson",
                    "We send this lesson and step, your last 20 actions, the tap replay if one was recorded, and your device/app info — never your typed answers.",
                  )
                : t(
                    "reportProblem.whatWeSendHome",
                    "We send your last 20 actions, the tap replay if one was recorded, and your device/app info — never your typed answers.",
                  )}
            </p>
            {state === "error" ? (
              <p role="alert" className="text-sm text-error">
                {t("reportProblem.error", "Couldn't send — check your connection and try again.")}
              </p>
            ) : null}
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="ghost" onClick={handleClose}>
                {t("common.cancel", "Cancel")}
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={state === "sending"}
                onClick={() => void handleSend()}
              >
                {state === "sending"
                  ? t("reportProblem.sending", "Sending…")
                  : t("reportProblem.send", "Send")}
              </Button>
            </div>
          </>
        )}
      </div>
    </Sheet>
  );
}

/** Icon-button trigger for the lesson header, next to the exit ✕. */
export function ReportProblemHeaderButton({ screen = "lesson" as const }: { screen?: ReportProblemScreen }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 rounded-xl p-2 text-text-muted transition hover:bg-surface-muted hover:text-text-primary"
        aria-label={t("reportProblem.headerAriaLabel", "Report a problem")}
      >
        <Icon name="flag" size={20} strokeWidth={2} />
      </button>
      <ReportProblemSheet open={open} onClose={() => setOpen(false)} screen={screen} />
    </>
  );
}

/** Text-link trigger for a wrong-answer step footer ("Something off? Report"). */
export function ReportProblemFooterLink({ className }: { className?: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <>
      <p className={cn("mt-1.5 text-xs", className)}>
        <span className="opacity-70">{t("reportProblem.footerPrompt", "Something off?")}</span>{" "}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="font-semibold underline underline-offset-2 opacity-80 hover:opacity-100"
        >
          {t("reportProblem.footerLink", "Report")}
        </button>
      </p>
      <ReportProblemSheet open={open} onClose={() => setOpen(false)} screen="lesson" />
    </>
  );
}

/** Row trigger for the Home account menu's Sync & diagnostics panel, styled
 *  to match `LayoutTracePanel.tsx`'s "Send diagnostics" row (same border-t
 *  divider + accent text-button treatment). */
export function ReportProblemMenuRow() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="flex items-center justify-between gap-2 border-t border-border pt-1.5">
        <Icon name="flag" size={12} className="text-text-muted" aria-hidden />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex-1 rounded px-1.5 py-0.5 text-left text-[10px] font-semibold text-accent hover:bg-accent-muted"
        >
          {t("reportProblem.menuRow", "Report a problem")}
        </button>
      </div>
      <ReportProblemSheet open={open} onClose={() => setOpen(false)} screen="home" />
    </>
  );
}
