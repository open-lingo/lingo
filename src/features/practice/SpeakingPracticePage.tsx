import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { useCourseLevel } from "./useCourseLevel";
import { SPEAKING_PROMPTS, type SpeakingPrompt } from "./data/ja-speaking-prompts";
import { playJaAudio } from "@/shared/japanese/tts";

type SpeakingMode = "echo" | "response";

export function SpeakingPracticePage() {
  const { t } = useTranslation();
  const courseLevel = useCourseLevel();

  const [mode, setMode] = useState<SpeakingMode>("echo");
  const [maxModule, setMaxModule] = useState<number>(Math.max(courseLevel, 5));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [stats, setStats] = useState({ attempted: 0, total: 0 });

  const prompts = useMemo(
    () =>
      SPEAKING_PROMPTS.filter(
        (p) => p.minModule <= maxModule && p.mode === mode,
      ),
    [maxModule, mode],
  );

  const prompt = prompts[currentIdx] as SpeakingPrompt | undefined;

  const handlePlay = useCallback(() => {
    if (prompt) {
      playJaAudio(prompt.targetPhrase);
    }
  }, [prompt]);

  const handleRecord = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      setTranscript("[Speech recognition not available in this browser]");
      setShowAnswer(true);
      return;
    }

    setIsRecording(true);
    setTranscript(null);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "ja-JP";
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const result = event.results[0][0].transcript;
      setTranscript(result);
      setIsRecording(false);
      setShowAnswer(true);
      setStats((prev) => ({ ...prev, attempted: prev.attempted + 1 }));
    };

    recognition.onerror = () => {
      setIsRecording(false);
      setTranscript("[Could not recognize speech]");
      setShowAnswer(true);
    };

    recognition.onend = () => setIsRecording(false);
    recognition.start();
  };

  const handleNext = () => {
    setTranscript(null);
    setShowAnswer(false);
    setCurrentIdx((i) => (i + 1) % Math.max(1, prompts.length));
    setStats((prev) => ({ ...prev, total: prev.total + 1 }));
  };

  const handleSkip = () => {
    setTranscript(null);
    setShowAnswer(false);
    setCurrentIdx((i) => (i + 1) % Math.max(1, prompts.length));
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          {t("practice.speaking.title", { defaultValue: "Speaking Practice" })}
        </h1>
        <p className="text-sm text-text-secondary">
          {t("practice.speaking.subtitle", {
            defaultValue: "Listen and repeat, or respond to prompts",
          })}
        </p>
      </div>

      {/* Controls */}
      <Card padding="sm">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs font-medium text-text-secondary">
            Mode
            <select
              value={mode}
              onChange={(e) => {
                setMode(e.target.value as SpeakingMode);
                setCurrentIdx(0);
                setTranscript(null);
                setShowAnswer(false);
              }}
              className="rounded-md border border-border bg-surface px-2 py-1 text-sm text-text-primary"
            >
              <option value="echo">Echo (repeat)</option>
              <option value="response">Response (answer)</option>
            </select>
          </label>

          <label className="flex items-center gap-1.5 text-xs font-medium text-text-secondary">
            Level
            <select
              value={maxModule}
              onChange={(e) => {
                setMaxModule(Number(e.target.value));
                setCurrentIdx(0);
              }}
              className="rounded-md border border-border bg-surface px-2 py-1 text-sm text-text-primary"
            >
              {Array.from({ length: Math.max(1, courseLevel - 4) }, (_, i) => i + 5).map((m) => (
                <option key={m} value={m}>
                  Up to M{m}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      {/* Prompt card */}
      {prompt ? (
        <Card padding="lg" className="text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
            {mode === "echo" ? "Listen, then repeat:" : "Listen, then respond:"}
          </p>

          <p className="mt-4 text-2xl font-bold text-text-primary">{prompt.targetPhrase}</p>
          <p className="mt-1 text-sm text-text-muted">{prompt.translation}</p>

          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handlePlay}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-surface-muted transition hover:bg-surface"
              aria-label="Play audio"
            >
              <Icon name="volume" size={20} className="text-accent" />
            </button>

            <button
              type="button"
              onClick={handleRecord}
              disabled={isRecording}
              className={`flex h-14 w-14 items-center justify-center rounded-full transition ${
                isRecording
                  ? "animate-pulse bg-red-500 text-white"
                  : "bg-accent text-white hover:bg-accent-hover"
              }`}
              aria-label={isRecording ? "Recording..." : "Record"}
            >
              <Icon name="mic" size={24} />
            </button>
          </div>

          {transcript && (
            <div className="mt-4 rounded-lg border border-border bg-surface-muted p-3">
              <p className="text-xs text-text-muted">You said:</p>
              <p className="mt-1 text-base text-text-primary">{transcript}</p>
            </div>
          )}

          {showAnswer && (
            <div className="mt-3 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={handleRecord}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-muted"
              >
                Try again
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="rounded-lg bg-accent px-4 py-1.5 text-xs font-medium text-white hover:bg-accent-hover"
              >
                Next →
              </button>
            </div>
          )}

          {!showAnswer && !isRecording && (
            <button
              type="button"
              onClick={handleSkip}
              className="mt-4 text-xs text-text-muted hover:text-text-secondary"
            >
              Skip →
            </button>
          )}
        </Card>
      ) : (
        <Card padding="lg" className="text-center">
          <p className="text-text-muted">No prompts available at this level.</p>
        </Card>
      )}

      {/* Progress bar */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-2">
        <span className="text-sm text-text-secondary">
          Progress: {currentIdx + 1}/{prompts.length}
        </span>
        <span className="text-sm text-text-secondary">
          Attempted: {stats.attempted}
        </span>
      </div>
    </div>
  );
}
