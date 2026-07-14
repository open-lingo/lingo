import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Icon } from "@/shared/components/Icon";
import { Switch } from "@/shared/components/ui";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { conjugateVerb, conjugateIAdj } from "@/features/languages/ja/conjugationEngine";
import { useCourseLevel } from "./useCourseLevel";
import {
  getTrainerType,
  isTypeUnlocked,
  unlockModuleForType,
  dueGrammarPointCount,
  type ConjugationTrainerType,
  type TrainerTypeId,
} from "./conjugation/trainerRegistry";
import { typeMasteryPercent } from "./conjugation/trainerSession";
import { hasLearnAheadAck, setLearnAheadAck } from "./conjugation/learnAhead";
import { LearnAheadDialog } from "./conjugation/LearnAheadDialog";
import { COMBO_MAP, combosForSelection, canExtendSelection } from "./conjugation/comboForms";
import {
  TYPE_GLYPH,
  TYPE_COLOR_VAR,
  TILE_ORDER,
  CONJ_TYPE_COLOR_CSS,
} from "./conjugation/typeColors";

/** Demo verb for rendering "what a combo produces" in the action-bar sub-line
 *  (みる is ichidan — the engine conjugates every combo chain form off it). */
const COMBO_DEMO = { dictionary: "みる", group: "ichidan" as const };
/** Demo i-adjective for the adjective stacks (かった/くなかった). */
const COMBO_DEMO_ADJ = "たかい";

/** Persisted "Combined forms" hub mode (v1.4.1). ON: tile greying guides
 *  pairable selections and sessions INCLUDE the stacked forms (no hidden
 *  proficiency gate — the toggle IS the intent). OFF: mix any tiles freely,
 *  individuals only. */
const COMBINED_MODE_KEY = "lingo:conjugation-trainer:combined-mode:v1";

function readCombinedMode(): boolean {
  try {
    return localStorage.getItem(COMBINED_MODE_KEY) !== "0";
  } catch {
    return true;
  }
}

function writeCombinedMode(on: boolean): void {
  try {
    localStorage.setItem(COMBINED_MODE_KEY, on ? "1" : "0");
  } catch {
    // no localStorage
  }
}

type Tile = {
  type: ConjugationTrainerType;
  unlocked: boolean;
  mastery: number; // 0–100 ink fill
  due: number; // capped display handled at render
  unlockModule: number;
};

/**
 * Conjugation trainer HUB — compact Ink Tiles selector (v1.2 Task 7). One
 * viewport at 390×844: slim header, 2×3 glyph tiles (ink fill = mastery, ≤3 due
 * pips), full-width Mix tile, sticky action bar. Selection drives the bar:
 *   0 selected → the one recommendation; 1 → the type's page; 2+ → combined drill.
 * NO form chips, NO question card here — the free drill lives at
 * `practice/conjugation/free`, per-type pages at `practice/conjugation/:typeId`.
 */
export function ConjugationPracticePage() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const navigate = useNavigate();
  const reachedModule = useCourseLevel();

  const [selected, setSelected] = useState<Set<TrainerTypeId>>(() => new Set());
  const [combinedMode, setCombinedMode] = useState<boolean>(readCombinedMode);
  // Learn-ahead (v1.5): locked tiles are selectable behind a one-time
  // confirmation; "Don't ask again" persists and skips the dialog for good.
  const [ackDone, setAckDone] = useState<boolean>(hasLearnAheadAck);
  const [aheadPrompt, setAheadPrompt] = useState<Tile | null>(null);

  const toggleCombinedMode = (on: boolean) => {
    setCombinedMode(on);
    writeCombinedMode(on);
    // Mode change resets the selection — an OFF-mode free-mix set (e.g. て+ます)
    // can be invalid under ON-mode pairing rules.
    setSelected(new Set());
  };

  const tiles = useMemo<Tile[]>(
    () =>
      TILE_ORDER.map((id) => {
        const type = getTrainerType(id)!;
        const unlocked = isTypeUnlocked(type, reachedModule);
        return {
          type,
          unlocked,
          mastery: unlocked ? typeMasteryPercent(id) : 0,
          due: unlocked ? dueGrammarPointCount(type) : 0,
          unlockModule: unlockModuleForType(type),
        };
        // reachedModule + selection re-render; mastery/due read live Track B state.
      }),
    [reachedModule],
  );

  const toggle = (id: TrainerTypeId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Deselecting is always silent; the dialog interposes only on the first
  // SELECTION of a locked tile without a persisted "don't ask again".
  const handleTilePress = (tile: Tile) => {
    if (!tile.unlocked && !selected.has(tile.type.id) && !ackDone) {
      setAheadPrompt(tile);
      return;
    }
    toggle(tile.type.id);
  };

  const confirmAhead = (dontAskAgain: boolean) => {
    if (dontAskAgain) setLearnAheadAck();
    // Clicking through ONCE flips the whole hub to advisory for this
    // visit: every tile renders unlocked with a "from Module N" chip
    // instead of lock chrome (Spencer QA 2026-07-13: "they should be
    // unlocked but have a suggested module instead after you click
    // through"). The checkbox only controls whether the dialog ever
    // comes back.
    setAckDone(true);
    if (aheadPrompt) toggle(aheadPrompt.type.id);
    setAheadPrompt(null);
  };

  // ── Recommendation (0 selected): the unlocked type with the most waiting. ──
  const recommended = useMemo(() => {
    const unlockedTiles = tiles.filter((tl) => tl.unlocked);
    if (unlockedTiles.length === 0) return null;
    return [...unlockedTiles].sort((a, b) => b.due - a.due)[0];
  }, [tiles]);

  const nextUnlockModule = useMemo(() => {
    const locked = tiles.filter((tl) => !tl.unlocked);
    if (locked.length === 0) return null;
    return Math.min(...locked.map((tl) => tl.unlockModule));
  }, [tiles]);

  // ── Combined-selection derivation (2+ selected). ──
  const selectedIds = useMemo(() => [...selected], [selected]);
  const individualFormCount = useMemo(() => {
    const forms = new Set<string>();
    for (const id of selectedIds) {
      const type = getTrainerType(id)!;
      const list = type.category === "verb" ? type.verbForms ?? [] : type.adjForms ?? [];
      for (const f of list) forms.add(f);
    }
    return forms.size;
  }, [selectedIds]);

  // Combos shown = combos INCLUDED: with the toggle on they're in the session
  // unconditionally (v1.4.1 — the old proficiency gate silently produced
  // all-base sessions that read as "no paired trainings here").
  const potentialCombos = useMemo(() => combosForSelection(selected), [selected]);
  const includedCombos = combinedMode ? potentialCombos : [];
  const comboFormCount = individualFormCount + includedCombos.length;
  const comboExamples = includedCombos.map((c) =>
    c.category === "i-adj"
      ? conjugateIAdj(COMBO_DEMO_ADJ, c.form)
      : conjugateVerb(COMBO_DEMO.dictionary, COMBO_DEMO.group, c.form),
  );

  // ON-mode selections that are a proper subset of a combo (e.g. い+ない needs
  // た): name the missing tile(s) so the path to stacked forms is visible.
  const missingComboTiles = useMemo(() => {
    if (!combinedMode || selectedIds.length < 2 || potentialCombos.length > 0) return null;
    const supersets = COMBO_MAP.filter((e) => selectedIds.every((id) => e.tiles.includes(id)));
    if (supersets.length === 0) return null;
    const smallest = [...supersets].sort((a, b) => a.tiles.length - b.tiles.length)[0];
    return smallest.tiles.filter((tid) => !selected.has(tid));
  }, [combinedMode, selectedIds, potentialCombos, selected]);

  const goType = (id: TrainerTypeId) => navigate(langPath(`practice/conjugation/${id}`));
  const goCombined = () =>
    navigate(
      langPath(
        `practice/conjugation/train?types=${selectedIds.join(",")}&combos=${combinedMode ? 1 : 0}`,
      ),
    );

  return (
    <div className="conj-scope mx-auto flex min-h-[calc(100dvh-8rem)] max-w-md flex-col">
      <style>{CONJ_TYPE_COLOR_CSS}</style>

      {/* Slim header + combined-forms mode toggle */}
      <div className="mb-3">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl font-bold text-text-primary">
            {t("practice.conjugation.title", { defaultValue: "Conjugation trainer" })}
          </h1>
          <Switch
            checked={combinedMode}
            onCheckedChange={toggleCombinedMode}
            labelLeading
            label={
              <span className="text-xs font-semibold text-text-secondary">
                {t("practice.conjugation.combinedToggle", { defaultValue: "Combined forms" })}
              </span>
            }
          />
        </div>
        <p className="text-sm text-text-secondary">
          {combinedMode
            ? t("practice.conjugation.hubSub", {
                defaultValue: "Tap a form to train — or combine tiles to drill stacked forms.",
              })
            : t("practice.conjugation.hubSubMixed", {
                defaultValue: "Tap any forms to mix them into one drill.",
              })}
        </p>
      </div>

      {/* 2×3 tile grid + full-width Mix tile */}
      <div className="grid grid-cols-2 gap-3">
        {tiles.map((tile) => (
          <TileButton
            key={tile.type.id}
            tile={tile}
            selected={selected.has(tile.type.id)}
            ahead={!tile.unlocked && ackDone}
            recommended={recommended?.type.id === tile.type.id && selected.size === 0}
            // Combined mode only: tiles that can't grow the selection toward
            // ANY combo dim out (て pairs with nothing; い pairs with た・ない).
            // Mixed mode (toggle off) allows any tiles together — individuals
            // only. Deselecting stays possible in both. Applies to locked
            // tiles too — once selectable (v1.5) they follow the same algebra.
            unpairable={combinedMode && !canExtendSelection(selected, tile.type.id)}
            onToggle={() => handleTilePress(tile)}
          />
        ))}

        {/* Mix — free drill (its own view). */}
        <button
          type="button"
          onClick={() => navigate(langPath("practice/conjugation/free"))}
          className="col-span-2 flex items-center justify-center gap-3 rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm font-bold text-text-primary transition active:translate-y-[2px]"
        >
          <span className="text-lg font-extrabold tracking-widest" lang="ja" aria-hidden>
            <span style={{ color: "var(--type-te)" }}>て</span>
            <span style={{ color: "var(--type-ta)" }}>た</span>
            <span style={{ color: "var(--type-nai)" }}>な</span>
            <span style={{ color: "var(--type-masu)" }}>ま</span>
            <span style={{ color: "var(--type-iadj)" }}>い</span>
          </span>
          {t("practice.conjugation.mixTile", { defaultValue: "Mix — free drill" })}
        </button>
      </div>

      {/* Sticky action bar */}
      <div className="sticky bottom-0 mt-auto -mx-4 border-t border-border bg-surface px-4 pb-3 pt-3">
        {selected.size === 0 ? (
          recommended ? (
            <ActionButton
              label={t("practice.conjugation.trainType", {
                defaultValue: "Train {{title}}",
                title: recommended.type.title,
              })}
              sub={
                recommended.due > 0
                  ? t("practice.conjugation.waiting", {
                      defaultValue: "{{count}} waiting",
                      count: recommended.due,
                    })
                  : undefined
              }
              onClick={() => goType(recommended.type.id)}
            />
          ) : (
            <div className="rounded-xl bg-surface-muted px-4 py-3 text-center text-sm text-text-secondary">
              {t("practice.conjugation.allLocked", {
                defaultValue: "Unlocks at Module {{module}}",
                module: nextUnlockModule ?? "",
              })}
            </div>
          )
        ) : selected.size === 1 ? (
          <ActionButton
            label={t("practice.conjugation.trainType", {
              defaultValue: "Train {{title}}",
              title: getTrainerType(selectedIds[0])!.title,
            })}
            onClick={() => goType(selectedIds[0])}
          />
        ) : (
          <div className="space-y-1.5">
            <ActionButton
              label={t("practice.conjugation.trainTogether", {
                defaultValue: "Train together · {{count}} forms",
                count: comboFormCount,
              })}
              onClick={goCombined}
            />
            {comboExamples.length > 0 ? (
              <p className="text-center text-xs text-text-muted">
                +{" "}
                <span lang="ja" className="font-medium text-text-secondary">
                  {comboExamples.join("・")}
                </span>{" "}
                {t("practice.conjugation.combosIncluded", { defaultValue: "included" })}
              </p>
            ) : missingComboTiles && missingComboTiles.length > 0 ? (
              <p className="text-center text-xs text-text-muted">
                {t("practice.conjugation.comboAddHint", { defaultValue: "Add" })}{" "}
                <span lang="ja" className="font-semibold text-text-secondary">
                  {missingComboTiles.map((tid) => TYPE_GLYPH[tid]).join("・")}
                </span>{" "}
                {t("practice.conjugation.comboAddHintTail", {
                  defaultValue: "for stacked forms",
                })}
              </p>
            ) : null}
          </div>
        )}
      </div>

      {/* Learn-ahead confirmation — conditional mount resets its checkbox. */}
      {aheadPrompt && (
        <LearnAheadDialog
          typeTitle={aheadPrompt.type.title}
          unlockModule={aheadPrompt.unlockModule}
          onConfirm={confirmAhead}
          onClose={() => setAheadPrompt(null)}
        />
      )}
    </div>
  );
}

// ─── Tile ──────────────────────────────────────────────────────────────

function TileButton({
  tile,
  selected,
  ahead,
  recommended,
  unpairable,
  onToggle,
}: {
  tile: Tile;
  selected: boolean;
  /** Locked-by-level but the learner clicked through the learn-ahead
   *  dialog: render as a NORMAL tile with an advisory module chip. */
  ahead: boolean;
  recommended: boolean;
  unpairable: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  const { type, unlocked, mastery, due } = tile;
  const colorVar = TYPE_COLOR_VAR[type.id];
  const glyph = TYPE_GLYPH[type.id];
  const pips = Math.min(due, 3); // ≤3 peeking cards — a 3-due and a 9-due tile look alike

  if (!unlocked && !ahead) {
    // Learn-ahead (v1.5): locked tiles are pressable — the hub interposes the
    // "Looking ahead?" dialog on first selection. Interior stays muted (lock +
    // Module N keep saying "ahead of your path"); the type-color ring appears
    // only when deliberately selected. Same pairing greying as unlocked tiles.
    return (
      <button
        type="button"
        onClick={unpairable ? undefined : onToggle}
        disabled={unpairable}
        aria-pressed={selected}
        style={
          {
            "--tc": `var(${colorVar})`,
            borderColor: selected ? `var(${colorVar})` : undefined,
            boxShadow: selected ? `0 0 0 2px var(${colorVar})` : undefined,
          } as React.CSSProperties
        }
        className={
          "relative flex h-[128px] flex-col items-center justify-center rounded-xl border bg-surface transition-all duration-150 " +
          (unpairable
            ? "border-border opacity-35 saturate-0"
            : "active:translate-y-[3px] active:scale-[0.98] " +
              (selected
                ? "-translate-y-0.5 border-2 opacity-90"
                : "border-border opacity-60 hover:border-[color:var(--tc)] hover:opacity-90"))
        }
      >
        <Icon name="lock" size={22} className="text-text-muted" />
        <span className="mt-1.5 text-3xl font-extrabold text-text-muted" lang="ja" aria-hidden>
          {glyph}
        </span>
        {/* Pill, not floating text — the bare label sat awkwardly against
            the glyph at some widths (Spencer QA 2026-07-13). */}
        <span className="absolute bottom-1.5 whitespace-nowrap rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-semibold text-text-muted">
          {t("practice.conjugation.moduleN", {
            defaultValue: "Module {{module}}",
            module: tile.unlockModule,
          })}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={unpairable ? undefined : onToggle}
      disabled={unpairable}
      aria-pressed={selected}
      style={
        {
          "--tc": `var(${colorVar})`,
          borderColor: selected ? `var(${colorVar})` : undefined,
          boxShadow: selected ? `0 0 0 2px var(${colorVar})` : undefined,
        } as React.CSSProperties
      }
      className={
        "relative flex h-[128px] flex-col items-center justify-center overflow-hidden rounded-xl border bg-surface transition-all duration-150 " +
        (unpairable
          ? "border-border opacity-35 saturate-0"
          : "active:translate-y-[3px] active:scale-[0.98] " +
            (selected
              ? "-translate-y-0.5 border-2"
              : "border-border hover:border-[color:var(--tc)]")) +
        (recommended ? " conj-tile-suggest" : "")
      }
    >
      {/* Ink fill = mastery (from the bottom). */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0"
        style={{
          height: `${mastery}%`,
          background: "color-mix(in srgb, var(--tc) 16%, transparent)",
          borderTop: "2px solid color-mix(in srgb, var(--tc) 45%, transparent)",
        }}
      />

      {/* Due pips — cards peeking over the top edge (≤3). */}
      {pips > 0 && (
        <span className="absolute -top-1 right-2.5 z-10 flex" aria-hidden>
          {Array.from({ length: pips }, (_, i) => (
            <span
              key={i}
              className="-ml-1.5 block h-5 w-3.5 rounded-[3px] border-[1.5px] border-surface"
              style={{
                background: "var(--tc)",
                transform: `rotate(${i * 6}deg) translateY(${i}px)`,
              }}
            />
          ))}
        </span>
      )}

      {/* Learn-ahead advisory — tile is fully usable, the chip just says
          where the course would introduce it. */}
      {!unlocked && (
        <span className="absolute left-2 top-2 z-[1] whitespace-nowrap rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-semibold text-text-muted">
          {t("practice.conjugation.aheadChip", {
            defaultValue: "M{{module}}",
            module: tile.unlockModule,
          })}
        </span>
      )}
      <span
        className="z-[1] text-3xl font-extrabold leading-none"
        style={{ color: "var(--tc)" }}
        lang="ja"
      >
        {glyph}
      </span>
      <span className="absolute bottom-2 z-[1] px-1 text-center text-[11px] font-bold text-text-secondary">
        {type.title}
      </span>
    </button>
  );
}

// ─── Action button ─────────────────────────────────────────────────────

function ActionButton({
  label,
  sub,
  onClick,
}: {
  label: string;
  sub?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-on-accent transition active:translate-y-[2px] hover:bg-accent-hover"
    >
      <span>{label}</span>
      {sub && (
        <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">
          {sub}
        </span>
      )}
      <Icon name="arrowRight" size={16} aria-hidden />
    </button>
  );
}
