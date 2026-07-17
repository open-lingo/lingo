import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Icon } from "@/shared/components/Icon";
import { Switch } from "@/shared/components/ui";
import { useLangPath } from "@/shared/hooks/useLangPath";
import type { ConjTrainerTypeMeta } from "@/shared/conjugation/types";
import { useCourseLevel } from "./useCourseLevel";
import { useConjugation } from "./conjugation/useConjugation";
import { hasLearnAheadAck, setLearnAheadAck } from "./conjugation/learnAhead";
import { LearnAheadDialog } from "./conjugation/LearnAheadDialog";

/** Persisted "Combined forms" hub mode (only meaningful when the provider
 *  supports combos). ON: pairing guidance + stacked forms; OFF: free-mix. */
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
  type: ConjTrainerTypeMeta;
  unlocked: boolean;
  mastery: number; // 0–100 ink fill
  due: number;
  unlockModule: number;
};

/**
 * Conjugation trainer HUB — language-agnostic. Every linguistic decision comes
 * from `useConjugation()` (the active language's provider); this component only
 * renders tiles, selection, and the sticky action bar.
 */
export function ConjugationPracticePage() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const navigate = useNavigate();
  const reachedModule = useCourseLevel();
  const conj = useConjugation();

  const supportsCombos = conj?.supportsCombos ?? false;

  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [combinedMode, setCombinedMode] = useState<boolean>(readCombinedMode);
  const [ackDone, setAckDone] = useState<boolean>(hasLearnAheadAck);
  const [aheadPrompt, setAheadPrompt] = useState<Tile | null>(null);

  const combosActive = supportsCombos && combinedMode;

  const toggleCombinedMode = (on: boolean) => {
    setCombinedMode(on);
    writeCombinedMode(on);
    setSelected(new Set());
  };

  const tiles = useMemo<Tile[]>(() => {
    if (!conj) return [];
    return conj.tileOrder.map((id) => {
      const type = conj.getType(id)!;
      const unlocked = conj.isTypeUnlocked(id, reachedModule);
      return {
        type,
        unlocked,
        mastery: unlocked ? conj.typeMasteryPercent(id) : 0,
        due: unlocked ? conj.dueCount(id) : 0,
        unlockModule: type.unlockModule,
      };
    });
  }, [conj, reachedModule]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleTilePress = (tile: Tile) => {
    if (!tile.unlocked && !selected.has(tile.type.id) && !ackDone) {
      setAheadPrompt(tile);
      return;
    }
    toggle(tile.type.id);
  };

  const confirmAhead = (dontAskAgain: boolean) => {
    if (dontAskAgain) setLearnAheadAck();
    setAckDone(true);
    if (aheadPrompt) toggle(aheadPrompt.type.id);
    setAheadPrompt(null);
  };

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

  const selectedIds = useMemo(() => [...selected], [selected]);
  const individualFormCount = conj ? conj.individualFormCount(selectedIds) : 0;

  const potentialCombos = useMemo(
    () => (conj && supportsCombos ? conj.combosForSelection(selectedIds) : []),
    [conj, supportsCombos, selectedIds],
  );
  const includedCombos = combosActive ? potentialCombos : [];
  const comboFormCount = individualFormCount + includedCombos.length;
  const comboExamples = includedCombos.map((c) => c.example);

  const missingComboTiles = useMemo(() => {
    if (!conj || !combosActive) return null;
    return conj.missingComboTiles(selectedIds);
  }, [conj, combosActive, selectedIds]);

  const goType = (id: string) => navigate(langPath(`practice/conjugation/${id}`));
  const goCombined = () =>
    navigate(
      langPath(
        `practice/conjugation/train?types=${selectedIds.join(",")}&combos=${combosActive ? 1 : 0}`,
      ),
    );

  if (!conj) {
    return (
      <div className="mx-auto max-w-md py-10 text-center text-sm text-text-secondary">
        {t("practice.conjugation.notAvailable", {
          defaultValue: "The conjugation trainer isn't available for this language yet.",
        })}
      </div>
    );
  }

  return (
    <div className="conj-scope mx-auto flex min-h-[calc(100dvh-8rem)] max-w-md flex-col">
      <style>{conj.scopeCss}</style>

      {/* Slim header + combined-forms mode toggle (combo-capable languages) */}
      <div className="mb-3">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl font-bold text-text-primary">
            {t("practice.conjugation.title", { defaultValue: "Conjugation trainer" })}
          </h1>
          {supportsCombos && (
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
          )}
        </div>
        <p className="text-sm text-text-secondary">
          {combosActive
            ? t("practice.conjugation.hubSub", {
                defaultValue: "Tap a form to train — or combine tiles to drill stacked forms.",
              })
            : t("practice.conjugation.hubSubMixed", {
                defaultValue: "Tap any forms to mix them into one drill.",
              })}
        </p>
      </div>

      {/* Tile grid + optional Mix tile */}
      <div className="grid grid-cols-2 gap-3">
        {tiles.map((tile) => (
          <TileButton
            key={tile.type.id}
            tile={tile}
            selected={selected.has(tile.type.id)}
            ahead={!tile.unlocked && ackDone}
            recommended={recommended?.type.id === tile.type.id && selected.size === 0}
            unpairable={combosActive && !conj.canExtendSelection(selectedIds, tile.type.id)}
            onToggle={() => handleTilePress(tile)}
          />
        ))}

        {conj.freeDrill && (
          <button
            type="button"
            onClick={() => navigate(langPath("practice/conjugation/free"))}
            className="col-span-2 flex items-center justify-center gap-3 rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm font-bold text-text-primary transition active:translate-y-[2px]"
          >
            <span className="text-lg font-extrabold tracking-widest" aria-hidden>
              {conj.mixGlyphs.map((g, i) => (
                <span key={i} style={{ color: `var(${g.colorVar})` }}>
                  {g.glyph}
                </span>
              ))}
            </span>
            {t("practice.conjugation.mixTile", { defaultValue: "Mix — free drill" })}
          </button>
        )}
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
              title: conj.getType(selectedIds[0])?.title ?? "",
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
                <span className="font-medium text-text-secondary">{comboExamples.join("・")}</span>{" "}
                {t("practice.conjugation.combosIncluded", { defaultValue: "included" })}
              </p>
            ) : missingComboTiles && missingComboTiles.length > 0 ? (
              <p className="text-center text-xs text-text-muted">
                {t("practice.conjugation.comboAddHint", { defaultValue: "Add" })}{" "}
                <span className="font-semibold text-text-secondary">
                  {missingComboTiles.map((tid) => conj.glyph(tid)).join("・")}
                </span>{" "}
                {t("practice.conjugation.comboAddHintTail", { defaultValue: "for stacked forms" })}
              </p>
            ) : null}
          </div>
        )}
      </div>

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
  ahead: boolean;
  recommended: boolean;
  unpairable: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  const { type, unlocked, mastery, due } = tile;
  const colorVar = type.colorVar;
  const glyph = type.glyph;
  const pips = Math.min(due, 3);

  if (!unlocked && !ahead) {
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
        <span className="mt-1.5 text-3xl font-extrabold text-text-muted" aria-hidden>
          {glyph}
        </span>
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
            (selected ? "-translate-y-0.5 border-2" : "border-border hover:border-[color:var(--tc)]")) +
        (recommended ? " conj-tile-suggest" : "")
      }
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0"
        style={{
          height: `${mastery}%`,
          background: "color-mix(in srgb, var(--tc) 16%, transparent)",
          borderTop: "2px solid color-mix(in srgb, var(--tc) 45%, transparent)",
        }}
      />

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

      {!unlocked && (
        <span className="absolute left-2 top-2 z-[1] whitespace-nowrap rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-semibold text-text-muted">
          {t("practice.conjugation.aheadChip", {
            defaultValue: "M{{module}}",
            module: tile.unlockModule,
          })}
        </span>
      )}
      <span className="z-[1] text-3xl font-extrabold leading-none" style={{ color: "var(--tc)" }}>
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
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-accent-foreground transition active:translate-y-[2px] hover:bg-accent-hover"
    >
      <span>{label}</span>
      {sub && (
        <span className="rounded-full bg-accent-foreground/20 px-2 py-0.5 text-xs font-semibold">{sub}</span>
      )}
      <Icon name="arrowRight" size={16} aria-hidden />
    </button>
  );
}
