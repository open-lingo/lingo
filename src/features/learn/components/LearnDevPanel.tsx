import { useEffect, useState } from "react";
import { Icon } from "@/shared/components/Icon";
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
  isTesterMode,
  setTesterMode,
  subscribeSessionLog,
  summarizeSessionLog,
  type SessionSummary,
} from "@/shared/telemetry/sessionLog";
import { ModalBackdrop } from "@/shared/components/ModalBackdrop";
import { Button } from "@/shared/components/ui/Button";
import { LearnLessonLengthsOverlay } from "./LearnLessonLengthsOverlay";

export type LearnDevPanelProps = {
  unlocked: boolean;
  onToggle: () => void;
  onShowProgressJson?: () => void;
  onClearProgress: () => void;
  onClearGraduatedVocab: () => void;
};

export function LearnDevPanel({
  unlocked,
  onToggle,
  onShowProgressJson,
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
        className="fixed bottom-[calc(var(--funding-meter-height,4.5rem)+4.5rem)] right-4 z-30 flex flex-col gap-2 rounded-xl border border-warning/50 bg-warning/10 px-3 py-2 text-xs text-text-secondary backdrop-blur sm:bottom-[calc(var(--funding-meter-height,4.5rem)+5rem)]"
        aria-label="Developer tools"
      >
        <div className="font-semibold text-warning">DEV</div>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={unlocked} onChange={onToggle} />
          Unlock all lessons
        </label>
        <button
          type="button"
          onClick={onShowProgressJson}
          className="rounded border border-border px-2 py-1 text-left font-mono hover:bg-surface-muted"
        >
          &lt;/&gt; Progress JSON
        </button>
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
          <Icon name="ruler" size={12} className="mr-1 inline-block" aria-hidden /> Lesson lengths
        </button>
        <button
          type="button"
          onClick={() => setShowSpeechLog(true)}
          className="rounded border border-border px-2 py-1 text-left hover:bg-surface-muted"
        >
          <Icon name="megaphone" size={12} className="mr-1 inline-block" aria-hidden /> Speech log
        </button>
        <button
          type="button"
          onClick={() => setShowSessionLog(true)}
          className="rounded border border-border px-2 py-1 text-left hover:bg-surface-muted"
        >
          <Icon name="barChart" size={12} className="mr-1 inline-block" aria-hidden /> Tester session log
        </button>
        {lang ? (
          <Link
            to={`/${lang}/lesson-preview`}
            className="rounded border border-border px-2 py-1 text-left hover:bg-surface-muted"
          >
            <Icon name="layoutGrid" size={12} className="mr-1 inline-block" aria-hidden /> Step types
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
  const [tester, setTester] = useState(() => isTesterMode());

  useEffect(() => {
    return subscribeSessionLog(() => {
      setSummary(summarizeSessionLog());
      setTester(isTesterMode());
    });
  }, []);

  const fmtMs = (ms: number) => {
    if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
    const m = Math.floor(ms / 60_000);
    const s = Math.round((ms % 60_000) / 1000);
    return `${m}m ${s}s`;
  };
  const fmtClock = (ts: number) =>
    new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <ModalBackdrop onClose={onClose} ariaLabelledBy="session-log-title">
      <div className="max-h-[80vh] w-full max-w-xl overflow-y-auto rounded-card border border-border bg-surface p-5 shadow-popover">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="session-log-title" className="flex items-center gap-1.5 text-lg font-bold text-text-primary">
            <Icon name="barChart" size={16} aria-hidden /> Tester log
          </h2>
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <label className="mb-3 flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/5 px-3 py-2 text-xs">
          <input
            type="checkbox"
            checked={tester}
            onChange={(e) => {
              setTesterMode(e.target.checked);
              setTester(e.target.checked);
            }}
          />
          <span>
            <span className="font-bold">Tester mode</span> — auto-download log
            after every lesson (browser may prompt once to allow).
          </span>
        </label>

        {summary.eventCount === 0 ? (
          <p className="text-sm text-text-muted">
            No events yet. Start a lesson; events land here in real time.
          </p>
        ) : (
          <>
            <div className="mb-3 grid grid-cols-3 gap-2 text-xs">
              <Stat label="Lessons done" value={summary.lessonsCompleted} />
              <Stat label="Total time" value={fmtMs(summary.totalActiveMs)} />
              <Stat
                label="Session start"
                value={summary.firstEventAt ? fmtClock(summary.firstEventAt) : "—"}
              />
            </div>

            {summary.perLessonMs.length > 0 && (
              <ul className="space-y-0.5 text-xs">
                {summary.perLessonMs.map((l, i) => (
                  <li
                    key={`${l.lessonId}-${i}`}
                    className="flex items-center justify-between gap-2 rounded border border-border bg-surface-muted px-2 py-1"
                  >
                    <span className="truncate font-mono text-text-secondary">
                      {l.lessonId}
                    </span>
                    <span className="flex shrink-0 items-center gap-2 tabular-nums">
                      <span className="text-text-muted">
                        {fmtClock(l.startedAt)} → {fmtClock(l.endedAt)}
                      </span>
                      <span>{fmtMs(l.ms)}</span>
                      <span
                        className={`text-[0.625rem] font-bold uppercase ${
                          l.completed ? "text-success" : "text-text-muted"
                        }`}
                      >
                        {l.completed ? "done" : "exited"}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={downloadSessionLog}
            disabled={summary.eventCount === 0}
          >
            ⬇ Download now
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              if (window.confirm("Clear the session log? This cannot be undone.")) {
                clearSessionLog();
              }
            }}
            disabled={summary.eventCount === 0}
          >
            Clear log
          </Button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded border border-border bg-surface-muted px-2 py-1.5">
      <div className="text-[0.625rem] uppercase tracking-wider text-text-muted">{label}</div>
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
    <ModalBackdrop onClose={onClose} ariaLabelledBy="speech-log-title">
      <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-card border border-border bg-surface p-5 shadow-popover">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="speech-log-title" className="flex items-center gap-1.5 text-lg font-bold text-text-primary">
            <Icon name="megaphone" size={16} aria-hidden /> Speech log (last {entries.length}/20)
          </h2>
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
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
                    : "text-error";
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
    </ModalBackdrop>
  );
}
