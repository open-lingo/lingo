import { Fragment } from "react";
import { cn } from "@/shared/components/ui/cn";
import { Icon } from "@/shared/components/Icon";
import { stringsFor } from "@/features/learn/transitStrings";
import type { Layout, Zone } from "@/features/learn/transitTypes";
import type { SideQuest } from "@/shared/domain/course";
import type { LearnTier } from "@/features/learn/learnTier";

/** Same three quest hues as the horizontal map, assigned in interchange order. */
const QUEST_COLORS = ["var(--tmc-q0)", "var(--tmc-q1)", "var(--tmc-q2)"];

export type VerticalNetworkMapProps = {
  layout: Layout;
  currentIdx: number;
  lang: string;
  /** Open a module's DistrictView (its lessons). */
  onOpen: (index: number) => void;
  /** Side quests anchored to each station index. */
  questsByAnchor: Map<number, SideQuest[]>;
  onQuest: (quest: SideQuest) => void;
  isSideQuestUnlocked: (quest: SideQuest) => boolean;
  /** Current tier. When the course has an N4 line, the tier changes are made
   *  from inline stops on the path itself (below), not a switcher at the top. */
  tier?: LearnTier;
  hasN4?: boolean;
  onSwitchTier?: (t: LearnTier) => void;
  n4Label?: string;
};

/**
 * The mobile learn map — the transit network drawn as a vertical, scroll-down
 * line instead of the horizontal pannable SVG (`NetworkMap`). A phone is tall
 * and narrow, so a metro map with branches never fit sideways; here the main
 * line runs top→bottom, zones are section bands, and side quests branch off as
 * spurs. It consumes the SAME `layout` as the desktop map (one `buildLayout`),
 * so the two can never disagree about station order, progress, or quests.
 *
 * Dark "night metro" panel (`.vnm-root` in transitLearnPage.css) — a
 * deliberate departure from the light app chrome so the map reads as its own
 * surface. Tapping a station calls `onOpen` → the shared `DistrictView`.
 */
export function VerticalNetworkMap({
  layout,
  currentIdx,
  lang,
  onOpen,
  questsByAnchor,
  onQuest,
  isSideQuestUnlocked,
  tier = "n5",
  hasN4 = false,
  onSwitchTier,
  n4Label = "N4 Line",
}: VerticalNetworkMapProps) {
  const strings = stringsFor(lang);
  const { stations, zones } = layout;
  const last = stations.length - 1;

  const zoneOf = (x: number): Zone | undefined =>
    zones.find((z) => x >= z.x0 && x < z.x1) ?? zones.find((z) => x >= z.x0 && x <= z.x1);

  // Match the horizontal map: interchanges take quest hues in order.
  const questColor = new Map<number, string>();
  stations.forEach((s) => {
    if (s.interchange) questColor.set(s.index, QUEST_COLORS[questColor.size % QUEST_COLORS.length]);
  });

  let lastZoneLabel: string | null = null;

  return (
    <div className="vnm-root" role="navigation" aria-label={strings.lineName}>
      <header className="vnm-header">
        <span className="vnm-header-badge" aria-hidden>
          M
        </span>
        <span className="vnm-header-text">
          <span className="vnm-header-line">{strings.lineName}</span>
          <span className="vnm-header-sub">
            Station {currentIdx + 1} of {stations.length}
          </span>
        </span>
      </header>

      <ol className="vnm-line">
        {tier === "n4" && hasN4 && onSwitchTier && (
          <li className="vnm-nav-row vnm-nav-back">
            <button
              type="button"
              className="vnm-nav-btn"
              data-testid="vnm-tier-back"
              onClick={() => onSwitchTier("n5")}
            >
              <span className="vnm-rail" aria-hidden>
                <span className="vnm-nav-node">N5</span>
                <span className="vnm-seg vnm-seg-bot is-ahead" />
              </span>
              <span className="vnm-nav-content">
                <span className="vnm-nav-title">← Back to the {strings.lineName}</span>
              </span>
            </button>
          </li>
        )}
        {stations.map((s, i) => {
          const zone = zoneOf(s.x);
          const showZone = zone != null && zone.label !== lastZoneLabel;
          if (zone) lastZoneLabel = zone.label;
          const quests = s.interchange ? questsByAnchor.get(s.index) ?? [] : [];

          return (
            <Fragment key={s.module.id}>
              {showZone && zone && (
                <li className="vnm-zone" aria-hidden>
                  <span className="vnm-zone-num">{zone.numeral}</span>
                  <span className="vnm-zone-label">{zone.label}</span>
                </li>
              )}
              <li className="vnm-row" data-testid="vnm-station" data-state={s.status}>
                <button
                  type="button"
                  className="vnm-station-btn"
                  aria-current={s.index === currentIdx ? "step" : undefined}
                  onClick={() => onOpen(s.index)}
                >
                  <span className="vnm-rail" aria-hidden>
                    {i > 0 && <span className={cn("vnm-seg vnm-seg-top", i > currentIdx && "is-ahead")} />}
                    <span className="vnm-node" data-state={s.status}>
                      {s.status === "completed" && (
                        <span className="vnm-seal" data-testid="vnm-seal">
                          {strings.seal}
                        </span>
                      )}
                      {s.status === "current" && <Icon name="mapPin" size={14} />}
                    </span>
                    {i < last && <span className={cn("vnm-seg vnm-seg-bot", i >= currentIdx && "is-ahead")} />}
                  </span>
                  <span className="vnm-content">
                    <span className="vnm-title">
                      {s.badge} · {s.module.title}
                    </span>
                    <span className="vnm-sub">
                      {s.done}/{s.total} lessons
                      {s.terminal ? " · terminal" : ""}
                    </span>
                  </span>
                </button>

                {quests.length > 0 && (
                  <div
                    className="vnm-spur"
                    data-testid="vnm-spur"
                    style={{ ["--vnm-spur" as string]: questColor.get(s.index) }}
                  >
                    {quests.map((q) => {
                      const unlocked = isSideQuestUnlocked(q) && !q.comingSoon;
                      return (
                        <button
                          key={q.id}
                          type="button"
                          className="vnm-quest"
                          disabled={!unlocked}
                          onClick={() => unlocked && onQuest(q)}
                        >
                          <span className="vnm-quest-emoji" aria-hidden>
                            {q.emoji}
                          </span>
                          <span className="vnm-quest-title">{q.title}</span>
                          {q.comingSoon && <span className="vnm-quest-soon">Soon</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </li>
            </Fragment>
          );
        })}
        {tier === "n5" && hasN4 && onSwitchTier && (
          <li className="vnm-nav-row vnm-nav-continue">
            <button
              type="button"
              className="vnm-nav-btn"
              data-testid="vnm-tier-continue"
              onClick={() => onSwitchTier("n4")}
            >
              <span className="vnm-rail" aria-hidden>
                <span className="vnm-seg vnm-seg-top is-ahead" />
                <span className="vnm-nav-node vnm-nav-node--n4">N4</span>
              </span>
              <span className="vnm-nav-content">
                <span className="vnm-nav-eyebrow">Interchange · end of the line</span>
                <span className="vnm-nav-title">Continue onto the {n4Label} →</span>
              </span>
            </button>
          </li>
        )}
      </ol>
    </div>
  );
}
