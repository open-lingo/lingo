/**
 * Learner-turn production rungs for the interactive roleplay player.
 *
 * A run ramps difficulty across the learner's turns: build-from-tiles → type →
 * speak (with a run-level override to pin one mode). Each rung grades the
 * produced line against the authored text using the SAME primitives the lesson
 * steps + other practice surfaces use:
 *   - tiles  → assembled tiles must normalize to the target
 *   - type   → `gradeTypedAnswer` (+ wanakana kana compose) / `koreanInputMatches`
 *   - speak  → Web Speech recognition scored by `scoreAlternativesGeneric`
 *
 * On a clean/retried pass the parent credits production SRS; on give-up the
 * line is revealed without credit. The speak rung degrades to typing when the
 * browser has no speech recognition, so a turn is never a dead end.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import * as wanakana from "wanakana";
import { Button } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { TappableText } from "@/features/dictionary/TappableText";
import {
  gradeTypedAnswer,
  scoreAlternativesGeneric,
} from "@/shared/speech/loose-match";
import {
  useSpeechRecognition,
  type SpeechAlternative,
} from "@/shared/speech";
import {
  koreanInputMatches,
  romajaToHangul,
} from "@/features/languages/ko/romanization/romajaToHangul";
import { getSpeechRecognitionLang } from "@/features/practice/data/practiceDataLoader";
import type { Conversation } from "@/features/practice/content";
import { buildTilePool, gradeTiles } from "./conversationTiles";
import { playConversationLine } from "./conversationAudio";

export type TurnMode = "tiles" | "type" | "speak";

export interface TurnProps {
  conv: Conversation;
  lineIndex: number;
  lang: string;
  defaultTtsLang: string;
  /** Fired exactly once when produced correctly (retried = had a wrong try). */
  onPass: (retried: boolean) => void;
  /** Advance to the next line (after resolving — passed or revealed). */
  onAdvance: () => void;
}

function voiceForLine(conv: Conversation, lineIndex: number): string | undefined {
  const speakerId = conv.lines[lineIndex].speaker;
  return conv.speakers.find((s) => s.id === speakerId)?.voice;
}

/* -------------------------------------------------------------------------- */
/*  Shared: the "produced" reveal + advance                                   */
/* -------------------------------------------------------------------------- */

function ResolvedLine({
  conv,
  lineIndex,
  lang,
  defaultTtsLang,
  passed,
  onAdvance,
}: {
  conv: Conversation;
  lineIndex: number;
  lang: string;
  defaultTtsLang: string;
  passed: boolean;
  onAdvance: () => void;
}) {
  const { t } = useTranslation();
  const line = conv.lines[lineIndex];
  const voice = voiceForLine(conv, lineIndex);
  const play = useCallback(() => {
    void playConversationLine(line.text, voice, defaultTtsLang);
  }, [line.text, voice, defaultTtsLang]);

  // Play the produced line back once on resolve — hearing the correct
  // rendering is the reinforcement.
  useEffect(() => {
    play();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per resolve
  }, []);

  return (
    <div
      className={`mx-auto mt-4 max-w-md rounded-lg border p-4 text-center ${
        passed ? "border-success bg-success/10" : "border-border bg-surface-muted"
      }`}
    >
      <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
        {passed
          ? t("practice.conversation.youSaid", { defaultValue: "Nice — you said" })
          : t("practice.conversation.theLineWas", { defaultValue: "The line was" })}
      </p>
      <div className="mt-1 flex items-center justify-center gap-2">
        <p className="text-xl font-bold text-text-primary" lang={lang}>
          <TappableText text={line.text} lang={lang} />
        </p>
        <button
          type="button"
          onClick={play}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface transition hover:bg-surface-muted"
          aria-label={t("practice.conversation.playAudio", {
            defaultValue: "Play audio",
          })}
        >
          <Icon name="volume" size={16} className="text-accent" />
        </button>
      </div>
      {line.reading && (
        <p className="mt-0.5 text-sm text-text-muted">{line.reading}</p>
      )}
      <p className="mt-1 text-sm text-text-secondary">{line.translation}</p>
      <div className="mt-4 flex justify-center">
        <Button variant="primary" size="sm" onClick={onAdvance}>
          {t("practice.conversation.continue", { defaultValue: "Continue" })}
          <Icon name="arrowRight" size={14} aria-hidden />
        </Button>
      </div>
    </div>
  );
}

/** The "produce your line" prompt header shared by every rung. */
function ProducePrompt({ translation }: { translation: string }) {
  const { t } = useTranslation();
  return (
    <div className="text-center">
      <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
        {t("practice.conversation.yourLine", {
          defaultValue: "Your line — produce it",
        })}
      </p>
      <p className="mt-2 text-lg font-semibold text-text-primary">
        {translation}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tiles rung                                                                */
/* -------------------------------------------------------------------------- */

export function TilesTurn(props: TurnProps) {
  const { t } = useTranslation();
  const { conv, lineIndex, lang, defaultTtsLang, onPass, onAdvance } = props;
  const line = conv.lines[lineIndex];
  const pool = useMemo(
    () => buildTilePool(conv, lineIndex, lang),
    [conv, lineIndex, lang],
  );
  const [chosen, setChosen] = useState<number[]>([]);
  const [status, setStatus] = useState<
    "building" | "wrong" | "passed" | "revealed"
  >("building");
  const [hadWrong, setHadWrong] = useState(false);

  const chosenSet = new Set(chosen);
  const assembled = chosen.map((i) => pool.tiles[i]);

  if (status === "passed" || status === "revealed") {
    return (
      <ResolvedLine
        conv={conv}
        lineIndex={lineIndex}
        lang={lang}
        defaultTtsLang={defaultTtsLang}
        passed={status === "passed"}
        onAdvance={onAdvance}
      />
    );
  }

  const check = () => {
    if (gradeTiles(assembled, line.text)) {
      setStatus("passed");
      onPass(hadWrong);
    } else {
      setStatus("wrong");
      setHadWrong(true);
    }
  };

  return (
    <div className="space-y-4">
      <ProducePrompt translation={line.translation} />

      {/* Assembled answer row */}
      <div className="mx-auto flex min-h-[3rem] max-w-md flex-wrap items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-surface px-3 py-2">
        {assembled.length === 0 ? (
          <span className="text-sm text-text-muted">
            {t("practice.conversation.tapTiles", {
              defaultValue: "Tap the tiles in order",
            })}
          </span>
        ) : (
          chosen.map((tileIdx, pos) => (
            <button
              key={`${tileIdx}-${pos}`}
              type="button"
              onClick={() => {
                setChosen((c) => c.filter((_, p) => p !== pos));
                setStatus("building");
              }}
              className="rounded-lg border border-accent bg-accent-muted px-3 py-1.5 text-base font-medium text-accent"
              lang={lang}
            >
              {pool.tiles[tileIdx]}
            </button>
          ))
        )}
      </div>

      {/* Tile bank */}
      <div className="mx-auto flex max-w-md flex-wrap items-center justify-center gap-2">
        {pool.tiles.map((tile, i) =>
          chosenSet.has(i) ? (
            <span
              key={i}
              className="rounded-lg border border-border bg-surface-muted px-3 py-1.5 text-base font-medium text-text-muted opacity-40"
              aria-hidden
            >
              {tile}
            </span>
          ) : (
            <button
              key={i}
              type="button"
              onClick={() => {
                setChosen((c) => [...c, i]);
                setStatus("building");
              }}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-base font-medium text-text-primary transition hover:border-accent hover:bg-surface-muted"
              lang={lang}
            >
              {tile}
            </button>
          ),
        )}
      </div>

      {status === "wrong" && (
        <p className="text-center text-sm text-error">
          {t("practice.conversation.tilesWrong", {
            defaultValue: "Not quite — reorder the tiles and check again.",
          })}
        </p>
      )}

      <div className="flex items-center justify-center gap-2">
        <Button
          variant="primary"
          onClick={check}
          disabled={assembled.length === 0}
        >
          {t("practice.conversation.check", { defaultValue: "Check" })}
        </Button>
        {status === "wrong" && (
          <Button variant="outline" onClick={() => setStatus("revealed")}>
            <Icon name="eye" size={14} aria-hidden />
            {t("practice.conversation.showAnswer", {
              defaultValue: "Show answer",
            })}
          </Button>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Type rung                                                                 */
/* -------------------------------------------------------------------------- */

export function TypeTurn(props: TurnProps) {
  const { t } = useTranslation();
  const { conv, lineIndex, lang, defaultTtsLang, onPass, onAdvance } = props;
  const line = conv.lines[lineIndex];
  const isKo = lang === "ko";
  const isJa = lang === "ja";
  const [typed, setTyped] = useState("");
  const [status, setStatus] = useState<"typing" | "wrong" | "passed" | "revealed">(
    "typing",
  );
  const [hadWrong, setHadWrong] = useState(false);

  const koreanPreview = isKo ? romajaToHangul(typed) : "";
  const showKoreanPreview =
    isKo && koreanPreview !== typed && /[가-힣]/.test(koreanPreview);
  const japanesePreview = isJa ? wanakana.toKana(typed) : "";
  const showJapanesePreview = isJa && japanesePreview !== typed;

  const resolved = status === "passed" || status === "revealed";
  if (resolved) {
    return (
      <ResolvedLine
        conv={conv}
        lineIndex={lineIndex}
        lang={lang}
        defaultTtsLang={defaultTtsLang}
        passed={status === "passed"}
        onAdvance={onAdvance}
      />
    );
  }

  const grade = (): boolean => {
    if (isKo) return koreanInputMatches(typed, line.text);
    const candidate = isJa ? wanakana.toKana(typed) : typed;
    return gradeTypedAnswer([line.text], candidate).correct;
  };

  const check = () => {
    if (typed.trim() === "") return;
    if (grade()) {
      setStatus("passed");
      onPass(hadWrong);
    } else {
      setStatus("wrong");
      setHadWrong(true);
    }
  };

  return (
    <div className="space-y-3">
      <ProducePrompt translation={line.translation} />
      <form
        className="mx-auto flex max-w-md items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          check();
        }}
      >
        <input
          type="text"
          lang={defaultTtsLang}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-label={t("practice.conversation.yourLineAria", {
            defaultValue: "Your line",
          })}
          placeholder={
            isKo
              ? t("practice.conversation.typePlaceholderKo", {
                  defaultValue: "Type Korean, or English letters…",
                })
              : t("practice.conversation.typePlaceholder", {
                  defaultValue: "Type your line…",
                })
          }
          className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2.5 text-lg text-text-primary focus:border-accent focus:outline-none"
        />
        <Button type="submit" variant="primary" disabled={typed.trim() === ""}>
          {t("practice.conversation.check", { defaultValue: "Check" })}
        </Button>
      </form>

      {showJapanesePreview && (
        <PreviewLine
          label={t("practice.conversation.kana", { defaultValue: "Kana" })}
          value={japanesePreview}
          lang="ja"
        />
      )}
      {showKoreanPreview && (
        <PreviewLine
          label={t("practice.conversation.hangul", { defaultValue: "Hangul" })}
          value={koreanPreview}
          lang="ko"
        />
      )}

      {status === "wrong" && (
        <div className="mx-auto max-w-md rounded-lg border border-error bg-error/10 p-3 text-center">
          <p className="text-xs text-text-muted">
            {t("practice.conversation.typeWrong", {
              defaultValue: "Not quite — try again, or reveal the line.",
            })}
          </p>
          {line.reading && (
            <p className="mt-1 text-sm text-text-secondary">
              <span className="mr-1.5 text-xs font-bold uppercase tracking-wider text-text-muted">
                {t("practice.conversation.hint", { defaultValue: "Hint" })}
              </span>
              {line.reading}
            </p>
          )}
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => setStatus("revealed")}
          >
            <Icon name="eye" size={14} aria-hidden />
            {t("practice.conversation.showLine", { defaultValue: "Show line" })}
          </Button>
        </div>
      )}
    </div>
  );
}

function PreviewLine({
  label,
  value,
  lang,
}: {
  label: string;
  value: string;
  lang: string;
}) {
  return (
    <p className="mx-auto max-w-md text-center text-sm text-text-secondary">
      <span className="mr-2 text-xs font-bold uppercase tracking-wider text-text-muted">
        {label}
      </span>
      <span lang={lang} className="text-lg font-semibold text-text-primary">
        {value}
      </span>
    </p>
  );
}

/* -------------------------------------------------------------------------- */
/*  Speak rung (degrades to Type when unsupported)                            */
/* -------------------------------------------------------------------------- */

export function SpeakTurn(props: TurnProps) {
  const { t } = useTranslation();
  const { conv, lineIndex, lang, defaultTtsLang, onPass, onAdvance } = props;
  const line = conv.lines[lineIndex];
  const webLocale = useMemo(() => getSpeechRecognitionLang(lang), [lang]);
  const recog = useSpeechRecognition(webLocale, { maxAlternatives: 5 });
  const [status, setStatus] = useState<"idle" | "wrong" | "passed" | "revealed">(
    "idle",
  );
  const [hadWrong, setHadWrong] = useState(false);
  const [heard, setHeard] = useState("");

  // Score each finished attempt with the script-agnostic scorer.
  useEffect(() => {
    if (!recog.finished || status === "passed") return;
    const alts: SpeechAlternative[] =
      recog.alternatives.length > 0
        ? recog.alternatives
        : recog.transcript.trim()
          ? [{ transcript: recog.transcript }]
          : [];
    if (alts.length === 0) {
      setStatus("wrong");
      setHadWrong(true);
      return;
    }
    const result = scoreAlternativesGeneric(line.text, alts);
    setHeard(result.bestAlternative?.raw ?? "");
    if (result.verdict === "perfect" || result.verdict === "close") {
      setStatus("passed");
      onPass(hadWrong);
    } else {
      setStatus("wrong");
      setHadWrong(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recog.finished, recog.alternatives, recog.transcript]);

  // No speech recognition in this browser → degrade to typing, never a dead end.
  if (!recog.supported) {
    return <TypeTurn {...props} />;
  }

  if (status === "passed" || status === "revealed") {
    return (
      <ResolvedLine
        conv={conv}
        lineIndex={lineIndex}
        lang={lang}
        defaultTtsLang={defaultTtsLang}
        passed={status === "passed"}
        onAdvance={onAdvance}
      />
    );
  }

  return (
    <div className="space-y-3">
      <ProducePrompt translation={line.translation} />

      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => (recog.listening ? recog.stop() : recog.start())}
          className={`flex h-14 w-full max-w-md items-center justify-center gap-3 rounded-2xl border-[1.5px] text-white transition ${
            recog.listening
              ? "border-error bg-error motion-safe:animate-pulse"
              : "border-accent-hover bg-accent hover:bg-accent-hover"
          }`}
          aria-label={
            recog.listening
              ? t("practice.conversation.stopRecording", {
                  defaultValue: "Stop recording",
                })
              : t("practice.conversation.tapToSpeak", {
                  defaultValue: "Tap to speak",
                })
          }
        >
          <Icon name="mic" size={22} aria-hidden />
          <span className="text-base font-bold">
            {recog.listening
              ? t("practice.conversation.listeningStop", {
                  defaultValue: "Listening — tap to stop",
                })
              : t("practice.conversation.tapToSpeak", {
                  defaultValue: "Tap to speak",
                })}
          </span>
        </button>

        {heard && status === "wrong" && (
          <p className="rounded-xl bg-surface-muted px-4 py-2 text-base text-text-primary">
            <span className="mr-2 text-xs font-bold uppercase tracking-wider text-text-muted">
              {t("practice.conversation.heard", { defaultValue: "Heard" })}
            </span>
            <span lang={lang}>{heard}</span>
          </p>
        )}

        {status === "wrong" && (
          <div className="text-center">
            <p className="text-sm text-error">
              {t("practice.conversation.speakWrong", {
                defaultValue: "Not quite — give it another go.",
              })}
            </p>
            {line.reading && (
              <p className="mt-1 text-sm text-text-secondary">{line.reading}</p>
            )}
            <div className="mt-2 flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setStatus("revealed")}>
                <Icon name="eye" size={14} aria-hidden />
                {t("practice.conversation.showLine", { defaultValue: "Show line" })}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Mode dispatcher                                                           */
/* -------------------------------------------------------------------------- */

export function LearnerTurn({ mode, ...props }: TurnProps & { mode: TurnMode }) {
  if (mode === "tiles") return <TilesTurn {...props} />;
  if (mode === "speak") return <SpeakTurn {...props} />;
  return <TypeTurn {...props} />;
}
