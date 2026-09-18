import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  armLayoutTraceOnNextTap,
  disarmLayoutTrace,
  getLastLayoutTrace,
  isLayoutTraceArmed,
  isLayoutTraceRecording,
  subscribeLayoutTrace,
  type LayoutTrace,
} from "@/shared/dev/layoutTrace";
import {
  buildTapReplayDocument,
  subscribeSessionLog,
  type TapReplayDoc,
} from "@/shared/telemetry/sessionLog";
import { sendDiagnosticsReport } from "@/shared/telemetry/errorReporter";
import { getTestOutQueueDiagnostics } from "@/shared/domain/testOutSyncQueue";
import { formatReconcileStatusLine, readReconcileStatus } from "@/shared/domain/progressReconcile";
import { getActiveUserStorageId } from "@/features/settings/storage";

const TABLE_COLUMNS = [
  "t",
  "h2Top",
  "trayTop",
  "trayH",
  "bankTop",
  "bankH",
  "stageH",
  "rowH",
  "fitScale",
] as const;

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

function copyTraceJson(trace: LayoutTrace): void {
  const text = JSON.stringify(trace, null, 2);
  if (navigator.clipboard?.writeText) {
    void navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function copyTapReplayJson(doc: TapReplayDoc): void {
  const text = JSON.stringify(doc, null, 2);
  if (navigator.clipboard?.writeText) {
    void navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function copyText(text: string): void {
  if (navigator.clipboard?.writeText) {
    void navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

type DiagnosticsSendState = "idle" | "sending" | "error";

/**
 * TestFlight #174 diagnostic, in the Sync panel so Spencer can arm/read it
 * on his phone with no Mac in the loop. Arm here, navigate to a build-
 * sentence step, tap the first tile — `layoutTrace.ts` records the next
 * 700ms of stage geometry and the result reads back here.
 */
export function LayoutTracePanel() {
  const { t } = useTranslation();
  const [, forceRerender] = useState(0);
  useEffect(() => subscribeLayoutTrace(() => forceRerender((n) => n + 1)), []);
  const [copied, setCopied] = useState(false);
  // Golden-learner replay (2026-09-17, lane A2d, docs/golden-replay-2026-09-17.md):
  // re-derived on every session-log change, not just on mount, so the
  // button reflects taps logged AFTER the panel first opened.
  const [, forceTapRerender] = useState(0);
  useEffect(() => subscribeSessionLog(() => forceTapRerender((n) => n + 1)), []);
  const [tapCopied, setTapCopied] = useState(false);
  const tapReplayDoc = buildTapReplayDocument();

  const armed = isLayoutTraceArmed();
  const recording = isLayoutTraceRecording();
  const trace = getLastLayoutTrace();

  // ── One-tap "Send diagnostics" (A3b, 2026-09-17) — Spencer's #2 of "the
  // 4 things from my recent use": a button he can hit from wherever the
  // app is misbehaving, phone-only, no Mac. Bundles the session log, this
  // trace/tap-replay if present, and device info into one POST; the
  // server hands back a short code to read out over text/voice.
  const [diagState, setDiagState] = useState<DiagnosticsSendState>("idle");
  const [diagCode, setDiagCode] = useState<string | null>(null);
  const [diagCodeCopied, setDiagCodeCopied] = useState(false);

  async function handleSendDiagnostics(): Promise<void> {
    setDiagState("sending");
    setDiagCode(null);
    // Plain function calls, not hooks (`getActiveUserStorageId` reads
    // localStorage directly) — same non-React seam `testOutSyncQueue.ts`
    // and `useLessonSyncSource.ts` already use for "the current user",
    // rather than pulling in `useAuth()` here.
    const userId = getActiveUserStorageId();
    const queueDiag = getTestOutQueueDiagnostics();
    const result = await sendDiagnosticsReport({
      layoutTrace: trace ?? undefined,
      tapReplay: tapReplayDoc ?? undefined,
      sync: {
        pendingCount: queueDiag.pendingCount,
        lastChunkSize: queueDiag.lastChunkSize,
        lastAttemptAt: queueDiag.lastAttemptAt,
        lastSuccessAt: queueDiag.lastSuccessAt,
        lastError: queueDiag.lastError,
        reconcileLine: formatReconcileStatusLine(
          userId !== "anonymous" ? readReconcileStatus(userId) : null,
        ),
      },
    });
    if (result.ok && result.code) {
      setDiagCode(result.code);
      setDiagState("idle");
    } else {
      setDiagState("error");
    }
  }

  return (
    <div className="space-y-1 pb-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold text-text-primary">
          {t("syncManager.layoutTrace.title", { defaultValue: "Layout trace (#174)" })}
        </span>
        {recording ? (
          <span className="text-[10px] text-warning">
            {t("syncManager.layoutTrace.recording", { defaultValue: "Recording…" })}
          </span>
        ) : armed ? (
          <button
            type="button"
            onClick={() => disarmLayoutTrace()}
            className="rounded px-1 text-[10px] font-semibold text-text-muted hover:bg-surface-muted"
          >
            {t("syncManager.layoutTrace.cancel", { defaultValue: "Cancel" })}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => armLayoutTraceOnNextTap()}
            className="rounded px-1 text-[10px] font-semibold text-accent hover:bg-accent-muted"
          >
            {t("syncManager.layoutTrace.arm", { defaultValue: "Arm" })}
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 rounded bg-surface-muted/50 px-1.5 py-1">
        <span className="text-[10px] font-semibold text-text-primary">
          {t("syncManager.diagnostics.title", { defaultValue: "Diagnostics" })}
        </span>
        <button
          type="button"
          onClick={() => void handleSendDiagnostics()}
          disabled={diagState === "sending"}
          className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-accent hover:bg-accent-muted disabled:opacity-50"
        >
          {diagState === "sending"
            ? t("syncManager.diagnostics.sending", { defaultValue: "Sending…" })
            : t("syncManager.diagnostics.send", { defaultValue: "Send diagnostics" })}
        </button>
      </div>

      {diagState === "error" ? (
        <p className="text-[10px] text-danger">
          {t("syncManager.diagnostics.error", { defaultValue: "Couldn't send — check connection and try again." })}
        </p>
      ) : null}

      {diagCode ? (
        <div className="flex items-center justify-between gap-2 rounded border border-accent/30 bg-accent-muted/30 px-1.5 py-1">
          <span className="text-[13px] font-bold tracking-wide text-text-primary">
            {t("syncManager.diagnostics.codeLabel", { defaultValue: "Tell Spencer: {{code}}", code: diagCode })}
          </span>
          <button
            type="button"
            onClick={() => {
              copyText(diagCode);
              setDiagCodeCopied(true);
              setTimeout(() => setDiagCodeCopied(false), 1500);
            }}
            className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-accent hover:bg-accent-muted"
          >
            {diagCodeCopied
              ? t("syncManager.diagnostics.copied", { defaultValue: "Copied" })
              : t("syncManager.diagnostics.copy", { defaultValue: "Copy" })}
          </button>
        </div>
      ) : null}

      {armed && !recording ? (
        <p className="text-[10px] text-text-muted">
          {t("syncManager.layoutTrace.armedHint", {
            defaultValue: "Go to a build-sentence step and tap a tile.",
          })}
        </p>
      ) : null}

      {trace ? (
        <div className="space-y-1">
          <p className="text-[10px] leading-tight text-text-secondary">
            {t("syncManager.layoutTrace.summary", {
              defaultValue:
                "{{frames}} frames, {{changed}} changed, maxH2Jump {{maxH2Jump}}px, {{reversals}} reversals, meanDt {{meanDt}}ms, maxDt {{maxDt}}ms",
              frames: trace.frames,
              changed: trace.changed.length,
              maxH2Jump: trace.maxH2Jump,
              reversals: trace.h2Reversals,
              meanDt: trace.meanDt,
              maxDt: trace.maxDt,
            })}
          </p>

          <table className="w-full min-w-[520px] border-collapse text-[9px]">
            <thead>
              <tr className="text-left text-text-muted">
                {TABLE_COLUMNS.map((h) => (
                  <th key={h} className="pr-1.5 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trace.changed.slice(0, 12).map((f, i) => (
                <tr key={i} className="text-text-secondary">
                  {TABLE_COLUMNS.map((col) => (
                    <td key={col} className="pr-1.5 tabular-nums">
                      {f[col] ?? "–"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                copyTraceJson(trace);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-accent hover:bg-accent-muted"
            >
              {copied
                ? t("syncManager.layoutTrace.copied", { defaultValue: "Copied" })
                : t("syncManager.layoutTrace.copyJson", { defaultValue: "Copy JSON" })}
            </button>
            {tapReplayDoc ? (
              <button
                type="button"
                onClick={() => {
                  copyTapReplayJson(tapReplayDoc);
                  setTapCopied(true);
                  setTimeout(() => setTapCopied(false), 1500);
                }}
                className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-accent hover:bg-accent-muted"
              >
                {tapCopied
                  ? t("syncManager.tapReplay.copied", { defaultValue: "Copied" })
                  : t("syncManager.tapReplay.copyReplay", {
                      defaultValue: "Copy tap replay ({{n}} taps)",
                      n: tapReplayDoc.taps.length,
                    })}
              </button>
            ) : null}
          </div>
        </div>
      ) : !armed && !recording ? (
        <div className="space-y-1">
          <p className="text-[10px] text-text-muted">
            {t("syncManager.layoutTrace.none", { defaultValue: "No trace recorded yet." })}
          </p>
          {tapReplayDoc ? (
            <button
              type="button"
              onClick={() => {
                copyTapReplayJson(tapReplayDoc);
                setTapCopied(true);
                setTimeout(() => setTapCopied(false), 1500);
              }}
              className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-accent hover:bg-accent-muted"
            >
              {tapCopied
                ? t("syncManager.tapReplay.copied", { defaultValue: "Copied" })
                : t("syncManager.tapReplay.copyReplay", {
                    defaultValue: "Copy tap replay ({{n}} taps)",
                    n: tapReplayDoc.taps.length,
                  })}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
