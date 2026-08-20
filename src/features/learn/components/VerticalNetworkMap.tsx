import { Fragment } from "react";
import { cn } from "@/shared/components/ui/cn";
import { Icon } from "@/shared/components/Icon";
import { stringsFor } from "@/features/learn/transitStrings";
import type { Layout, Zone } from "@/features/learn/transitTypes";
import type { SideQuest } from "@/shared/domain/course";

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
      </ol>
    </div>
  );
}
