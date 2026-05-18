import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { isDevUnlockOn } from "@/shared/domain/mockProgress";
import {
  getSpeechLog,
  subscribeSpeechLog,
  type SpeechLogEntry,
} from "@/shared/speech";
import {
  clearSessionLog,
  downloadSessionLog,
  subscribeSessionLog,
  summarizeSessionLog,
  type SessionSummary,
} from "@/shared/telemetry/sessionLog";
import { LearnLessonLengthsOverlay } from "./LearnLessonLengthsOverlay";

export type LearnDevPanelProps = {
  unlocked: boolean;
  onToggle: () => void;
  onClearProgress: () => void;
  onClearGraduatedVocab: () => void;
};

export function LearnDevPanel({
  unlocked,
  onToggle,
  onClearProgress,
  onClearGraduatedVocab,
}: LearnDevPanelProps) {
  const [showLengths, setShowLengths] = useState(false);
  const [showSpeechLog, setShowSpeechLog] = useState(false);
  const [showSessionLog, setShowSessionLog] = useState(false);
  const { lang } = useParams<{ lang: string }>();
  if (!unlocked && !isDevUnlockOn()) return null;
  return (
    <>
      <div
        className="fixed bottom-[calc(var(--funding-meter-height,3.5rem)+4.5rem)] right-4 z-40 flex flex-col gap-2 rounded-xl border border-warning/50 bg-warning/10 px-3 py-2 text-xs text-text-secondary backdrop-blur sm:bottom-[calc(var(--funding-meter-height,3.5rem)+5rem)]"
        aria-label="Developer tools"
      >
        <div className="font-semibold text-warning">DEV</div>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={unlocked} onChange={onToggle} />
          Unlock all lessons
        </label>
        <button
          type="button"
          onClick={onClearProgress}
          className="rounded border border-border px-2 py-1 text-left hover:bg-surface-muted"
        >
          Clear progress
        </button>
        <button
          type="button"
          onClick={onClearGraduatedVocab}
          className="rounded border border-border px-2 py-1 text-left hover:bg-surface-muted"
        >
          Clear graduated vocab
        </button>
        <button
          type="button"
          onClick={() => setShowLengths(true)}
          className="rounded border border-border px-2 py-1 text-left hover:bg-surface-muted"
        >
          📏 Lesson lengths
        </button>
        <button
          type="button"
          onClick={() => setShowSpeechLog(true)}
          className="rounded border border-border px-2 py-1 text-left hover:bg-surface-muted"
        >
          📣 Speech log
        </button>
        <button
          type="button"
          onClick={() => setShowSessionLog(true)}
          className="rounded border border-border px-2 py-1 text-left hover:bg-surface-muted"
        >
          📊 Tester session log
        </button>
        {lang ? (
          <Link
            to={`/${lang}/lesson-preview`}
            className="rounded border border-border px-2 py-1 text-left hover:bg-surface-muted"
          >
            🧩 Step types
          </Link>
        ) : null}
      </div>
      {showLengths && (
        <LearnLessonLengthsOverlay onClose={() => setShowLengths(false)} />
      )}
      {showSpeechLog && (
        <SpeechLogOverlay onClose={() => setShowSpeechLog(false)} />
      )}
      {showSessionLog && (
        <SessionLogOverlay onClose={() => setShowSessionLog(false)} />
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Session log overlay — tester walkthrough summary + JSON export.           */
/*  Surfaces the lightweight telemetry buffer captured by sessionLog.ts so    */
/*  real testers can download their walkthrough trace and email it back.      */
/* -------------------------------------------------------------------------- */

function SessionLogOverlay({ onClose }: { onClose: () => void }) {
  const [summary, setSummary] = useState<SessionSummary>(() =>
    summarizeSessionLog(),
  );

  useEffect(() => {
    return subscribeSessionLog(() => setSummary(summarizeSessionLog()));
  }, []);

  const fmtMs = (ms: number) => {
    if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
    const m = Math.floor(ms / 60_000);
    const s = Math.round((ms % 60_000) / 1000);
    return `${m}m ${s}s`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-surface p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-text-primary">
            📊 Tester session log
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-border px-2 py-1 text-xs text-text-secondary hover:bg-surface-muted"
          >
            Close
          </button>
        </div>
        <p className="mb-3 text-xs text-text-muted">
          Session <span className="font-mono">{summary.sessionId}</span> · {summary.eventCount} events captured
        </p>

        {summary.eventCount === 0 ? (
          <p className="text-sm text-text-muted">
            No events yet. Start a lesson; events land here in real time.
          </p>
        ) : (
          <>
            <div className="mb-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
              <Stat label="Lessons started" value={summary.lessonsStarted} />
              <Stat label="Lessons completed" value={summary.lessonsCompleted} />
              <Stat label="Exits mid-lesson" value={summary.exitsMid} />
              <Stat label="Speech attempts" value={summary.speechAttempts} />
              <Stat label="Trace attempts" value={summary.traceAttempts} />
              <Stat label="Total active" value={fmtMs(summary.totalActiveMs)} />
            </div>

            {summary.perLessonMs.length > 0 && (
              <div className="mb-3">
                <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-text-muted">
                  Per-lesson time
                </h3>
                <ul className="space-y-0.5 text-xs">
                  {summary.perLessonMs.map((l, i) => (
                    <li
                      key={`${l.lessonId}-${i}`}
                      className="flex items-center justify-between rounded border border-border bg-surface-muted px-2 py-1"
                    >
                      <span className="font-mono text-text-secondary">{l.lessonId}</span>
                      <span className="flex items-center gap-2">
                        <span className="tabular-nums">{fmtMs(l.ms)}</span>
                        <span
                          className={`text-[10px] font-bold uppercase ${
                            l.completed ? "text-success" : "text-text-muted"
                          }`}
                        >
                          {l.completed ? "done" : "exited"}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={downloadSessionLog}
            disabled={summary.eventCount === 0}
            className="rounded-lg border border-accent bg-accent px-3 py-1.5 text-xs font-bold text-white hover:bg-accent-hover disabled:opacity-40"
          >
            ⬇ Download JSON
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Clear the session log? This cannot be undone.")) {
                clearSessionLog();
              }
            }}
            disabled={summary.eventCount === 0}
            className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary hover:bg-surface-muted disabled:opacity-40"
          >
            Clear log
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded border border-border bg-surface-muted px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wider text-text-muted">{label}</div>
      <div className="text-sm font-bold text-text-primary tabular-nums">{value}</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Speech log overlay (R1.3c, 2026-05-17)                                    */
/*                                                                            */
/*  Surfaces the last 20 Whisper attempts captured by speechLog.ts. Lives     */
/*  behind the dev panel so prod players never see it; the buffer itself is   */
/*  fed by SpeakingStepView regardless of dev flag (so dev-flag toggling      */
/*  mid-session shows recent attempts immediately).                           */
/* -------------------------------------------------------------------------- */

function SpeechLogOverlay({ onClose }: { onClose: () => void }) {
  const [entries, setEntries] = useState<readonly SpeechLogEntry[]>(() =>
    getSpeechLog(),
  );

  useEffect(() => {
    return subscribeSpeechLog(() => {
      // Cloning to a plain array forces React to re-render even though
      // the underlying buffer mutates in place.
      setEntries([...getSpeechLog()]);
    });
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-surface p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-text-primary">
            📣 Speech log (last {entries.length}/20)
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-border px-2 py-1 text-xs text-text-secondary hover:bg-surface-muted"
          >
            Close
          </button>
        </div>
        {entries.length === 0 ? (
          <p className="text-sm text-text-muted">
            No attempts yet. Play a speaking step in a lesson; entries land
            here.
          </p>
        ) : (
          <ul className="space-y-1 text-xs">
            {[...entries].reverse().map((e, i) => {
              const tone =
                e.verdict === "pass"
                  ? "text-success"
                  : e.verdict === "auto-pass"
                    ? "text-text-muted"
                    : "text-danger";
              const time = new Date(e.timestamp).toLocaleTimeString();
              return (
                <li
                  key={`${e.timestamp}-${i}`}
                  className="rounded border border-border bg-surface-muted px-2 py-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-text-secondary">
                      {time}
                    </span>
                    <span className={`font-bold uppercase ${tone}`}>
                      {e.verdict}
                    </span>
                  </div>
                  <div className="mt-0.5 text-text-secondary">
                    <span className="text-text-muted">step:</span> {e.stepId}{" "}
                    <span className="text-text-muted">· attempt</span>{" "}
                    {e.attemptNumber}
                  </div>
                  <div className="mt-0.5">
                    <span className="text-text-muted">target:</span>{" "}
                    <span className="font-japanese" lang="ja">
                      {e.targetKana}
                    </span>{" "}
                    <span className="text-text-muted">· heard:</span>{" "}
                    <span className="font-japanese" lang="ja">
                      {e.transcriptKana || "—"}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
