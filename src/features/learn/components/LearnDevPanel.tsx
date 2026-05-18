import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { isDevUnlockOn } from "@/shared/domain/mockProgress";
import {
  getSpeechLog,
  subscribeSpeechLog,
  type SpeechLogEntry,
} from "@/shared/speech";
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
    </>
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
