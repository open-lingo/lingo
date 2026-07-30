/**
 * Interactive conversation roleplay ("answer back").
 *
 * The app voices the non-learner speaker(s); the learner PRODUCES the
 * `learnerRole` speaker's lines turn by turn. Production ramps across the
 * learner's turns within a run — build-from-tiles → type → speak — with a
 * run-level override to pin one mode. A clean/retried pass credits production
 * SRS for the line's exercised atoms; a give-up reveals the line without
 * credit. Every line (app + learner) supports inline dictionary lookup.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Card, SegmentedControl } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { TappableText } from "@/features/dictionary/TappableText";
import type { Conversation } from "@/features/practice/content";
import { playConversationLine } from "./conversationAudio";
import { creditProductionForLine } from "./conversationSrs";
import { LearnerTurn, type TurnMode } from "./turns";

type RunMode = "auto" | TurnMode;

interface Props {
  conv: Conversation;
  lang: string;
  defaultTtsLang: string;
  onExit: () => void;
}

export function ConversationRoleplay({
  conv,
  lang,
  defaultTtsLang,
  onExit,
}: Props) {
  const { t } = useTranslation();
  const learnerRole = conv.learnerRole;
  const labelById = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of conv.speakers) m.set(s.id, s.label);
    return m;
  }, [conv.speakers]);
  const voiceById = useMemo(() => {
    const m = new Map<string, string | undefined>();
    for (const s of conv.speakers) m.set(s.id, s.voice);
    return m;
  }, [conv.speakers]);

  // Positions of the learner's lines drive the tiles→type→speak ramp.
  const learnerLineIdxs = useMemo(
    () =>
      conv.lines
        .map((line, i) => (line.speaker === learnerRole ? i : -1))
        .filter((i) => i >= 0),
    [conv.lines, learnerRole],
  );

  const [runMode, setRunMode] = useState<RunMode>("auto");
  const [lineIdx, setLineIdx] = useState(0);
  const [passed, setPassed] = useState(0);
  const [done, setDone] = useState(false);

  const line = conv.lines[lineIdx];
  const isLearnerLine = line?.speaker === learnerRole;

  // Auto-play app-role lines on entry.
  useEffect(() => {
    if (!line || isLearnerLine) return;
    let current = true;
    void playConversationLine(
      line.text,
      voiceById.get(line.speaker),
      defaultTtsLang,
      () => current,
    );
    return () => {
      current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineIdx]);

  const advance = useCallback(() => {
    if (lineIdx + 1 >= conv.lines.length) {
      setDone(true);
      return;
    }
    setLineIdx((i) => i + 1);
  }, [lineIdx, conv.lines.length]);

  const modeForLine = useCallback(
    (idx: number): TurnMode => {
      if (runMode !== "auto") return runMode;
      const pos = learnerLineIdxs.indexOf(idx);
      if (pos <= 0) return "tiles";
      if (pos === learnerLineIdxs.length - 1) return "speak";
      return "type";
    },
    [runMode, learnerLineIdxs],
  );

  const handlePass = useCallback(
    (retried: boolean) => {
      creditProductionForLine(line.text, lang, retried);
      setPassed((p) => p + 1);
    },
    [line, lang],
  );

  const header = (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-xl font-bold text-text-primary">{conv.title}</h2>
        <p className="text-sm text-text-secondary">{conv.situation}</p>
      </div>
      <Button variant="ghost" size="sm" onClick={onExit}>
        <Icon name="arrowLeft" size={16} aria-hidden />
        {t("practice.conversation.back", { defaultValue: "Back" })}
      </Button>
    </div>
  );

  if (done) {
    return (
      <div className="space-y-4">
        {header}
        <Card padding="lg" className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
            <Icon name="check" size={24} aria-hidden />
          </div>
          <p className="mt-3 text-lg font-semibold text-text-primary">
            {t("practice.conversation.roleplayDone", {
              defaultValue: "Roleplay complete",
            })}
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            {t("practice.conversation.produced", {
              defaultValue: "You produced {{correct}} of {{total}} lines.",
              correct: passed,
              total: learnerLineIdxs.length,
            })}
          </p>
          <div className="mt-4 flex justify-center">
            <Button variant="primary" onClick={onExit}>
              {t("practice.conversation.backToList", {
                defaultValue: "Back to conversations",
              })}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const label = line ? labelById.get(line.speaker) ?? line.speaker : "";

  return (
    <div className="space-y-4">
      {header}

      {/* Run-level mode override */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
          {t("practice.conversation.lineProgress", {
            defaultValue: "Line {{n}} of {{total}}",
            n: lineIdx + 1,
            total: conv.lines.length,
          })}
        </span>
        <SegmentedControl<RunMode>
          size="sm"
          ariaLabel={t("practice.conversation.modeAria", {
            defaultValue: "Production mode",
          })}
          value={runMode}
          onChange={setRunMode}
          options={[
            { value: "auto", label: t("practice.conversation.modeRamp", { defaultValue: "Ramp" }) },
            { value: "tiles", label: t("practice.conversation.modeTiles", { defaultValue: "Tiles" }) },
            { value: "type", label: t("practice.conversation.modeType", { defaultValue: "Type" }) },
            { value: "speak", label: t("practice.conversation.modeSpeak", { defaultValue: "Speak" }) },
          ]}
        />
      </div>

      <Card padding="lg">
        {isLearnerLine ? (
          <LearnerTurn
            key={lineIdx}
            mode={modeForLine(lineIdx)}
            conv={conv}
            lineIndex={lineIdx}
            lang={lang}
            defaultTtsLang={defaultTtsLang}
            onPass={handlePass}
            onAdvance={advance}
          />
        ) : (
          <div className="space-y-4 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
              {label}
            </p>
            <p className="text-2xl font-bold text-text-primary" lang={lang}>
              <TappableText text={line.text} lang={lang} />
            </p>
            {line.reading && (
              <p className="text-sm text-text-muted">{line.reading}</p>
            )}
            <p className="text-sm text-text-secondary">{line.translation}</p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() =>
                  void playConversationLine(
                    line.text,
                    voiceById.get(line.speaker),
                    defaultTtsLang,
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface transition hover:bg-surface-muted"
                aria-label={t("practice.conversation.playLine", {
                  defaultValue: "Play line",
                })}
              >
                <Icon name="volume" size={18} className="text-accent" />
              </button>
              <Button variant="primary" onClick={advance}>
                {t("practice.conversation.continue", { defaultValue: "Continue" })}
                <Icon name="arrowRight" size={14} aria-hidden />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
