/**
 * The learn pathway as a transit map (concept 2026-07-15, promoted to the
 * ja learn homepage 2026-07-16 behind `learn.transitMapHome`).
 *
 * Concept A — the course as a metro network (modules = stations, side quests
 * = branch loops/spurs, progress = line fill) — with click-through into
 * Concept B (a per-module "district" arrivals board where lessons are local
 * stops). Driven by REAL course data; the page also carries the classic
 * learn-page furniture (LearnSidebar side-quest rail + profile,
 * LearnToolsRow) plus the PlacementPrompt FTUE fallback in live mode.
 *
 * Routes:
 * - /:lang/learn          — live mode (real progress), ja only, via
 *   LearnHomeRoute in App.tsx; flip `learn.transitMapHome` in
 *   public/feature-flags.json to revert to the classic page without a build.
 * - /:lang/learn/classic  — the previous LearnPage, kept as the escape hatch
 *   (and where LearnDevPanel's unlock/clear-progress tools still live).
 * - /:lang/transit-preview — this page in `preview` mode: demo progress on
 *   by default + the demo/real toggle for design review.
 *
 * Layout notes:
 * - The panel flexes with the viewport and the SVG scales uniformly to fill
 *   it; the viewBox is CONTENT-FIT (computed from what the layout actually
 *   used) with a fixed art band on top for the parallax skyline, so no
 *   viewport wastes height on reserved-but-unused track levels.
 * - Branch lines are DEPTH-NESTED: overlapping x-ranges on the same side
 *   get pushed one notch deeper instead of sharing a rail.
 * - Geography: seeded skyline (buildings/hills/Fuji/torii/tower) parallaxes
 *   inside the map; stars/moon/clouds spread across the panel on a pinned
 *   layer; fare-zone chips sit inset on the horizon, not on the frame.
 *
 * TODO (Spencer 2026-07-15): full interaction QA pass now that this IS the
 * learn page — verify EVERY button/link works: stations, quest diamonds,
 * sprint-leg stops, depot link, board rows, stamp strip, prev/next station,
 * mobile rows + map toggle (+ demo toggle on the preview route).
 */
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useLang, useLangPath } from "@/shared/hooks/useLangPath";
import { getMockCourse } from "@/shared/domain/mockCourse";
import type {
  CourseModule,
  SideQuest,
} from "@/shared/domain/course";
import {
  getCurrentModuleIndex,
  getModuleDisplay,
  getModuleStatus,
  type ModuleStatus,
} from "@/features/learn/moduleProgress";
import {
  courseHasTier,
  deriveDefaultTier,
  modulesForTier,
  parseTierParam,
  readStoredTier,
  writeStoredTier,
  type LearnTier,
} from "@/features/learn/learnTier";
import { stringsFor, LEARN_HEADER_SUBTITLE } from "@/features/learn/transitStrings";
import { TransitSignageHeader } from "@/features/learn/components/TransitSignageHeader";
import { useCompletedLessonIds } from "@/features/learn/hooks/useCompletedLessonIds";
import { useLearnProfile } from "@/features/learn/hooks/useLearnProfile";
import { LearnSidebar } from "@/features/learn/components/LearnSidebar";
import { DistrictView, type QuestLeg } from "@/features/learn/components/DistrictView";
import { ProgressFloatCard } from "@/features/learn/components/ProgressFloatCard";
import { ResumeFab } from "@/features/learn/components/ResumeFab";
import { cn } from "@/shared/components/ui/cn";
import { Icon } from "@/shared/components/Icon";
import { PlacementPrompt } from "@/features/placement/components/PlacementPrompt";
import {
  isPlacementDismissed,
  dismissPlacement,
} from "@/features/placement/hooks/usePlacementDismissed";
import { getStoredSettings } from "@/features/settings/storage";
import { logSessionEvent } from "@/shared/telemetry/sessionLog";
import "./transitLearnPage.css";

/* ── layout ──────────────────────────────────────────────────────────── */

type Pt = readonly [number, number];

const LEVELS = [344, 266, 188] as const;
const LEVEL_SEQ = [0, 1, 2, 1] as const;
const RUNS = [5, 4, 5, 3, 6, 4] as const;
const LOOP_DOWN_Y = 452;
const LOOP_UP_Y = 96;
const DEPTH_STEP = 46;
const ART_BAND = 150; // reserved above the content for the skyline
const QUEST_COLORS = ["var(--tmc-q0)", "var(--tmc-q1)", "var(--tmc-q2)"];

/** Rough text width for plates/chips (JP glyphs ~10.5px, latin ~6.2px @10px). */
const plateW = (t: string) =>
  [...t].reduce((w, c) => w + (c.charCodeAt(0) > 0x2e80 ? 11.6 : 6.9), 0) + 18;

type StationL = {
  x: number;
  y: number;
  labelSide: "top" | "bottom";
  index: number;
  module: CourseModule;
  badge: string;
  isReview: boolean;
  status: ModuleStatus;
  done: number;
  total: number;
  interchange: boolean;
  terminal: boolean;
};

type QuestStop = { x: number; y: number; quest: SideQuest; leg?: QuestLeg; labelDy?: number };
type SpurL = {
  color: string;
  d: string;
  dashed: boolean;
  stops: QuestStop[];
  label: string;
  labelX: number;
  labelY: number; // plate center
  up: boolean;
  cap: Pt | null;
  capDir: "v" | "h";
};

type DepotL = { d: string; tracks: Pt[][]; labelX: number; labelY: number };

type Layout = {
  width: number;
  vbY: number;
  vbH: number;
  skyGroundY: number;
  mainPts: Pt[];
  stations: StationL[];
  spurs: SpurL[];
  depot: DepotL | null;
  zones: { x0: number; x1: number; label: string; numeral: string }[];
  zoneChipY: number;
  /** stations where a branch vertical enters/leaves (and on which side) —
   * labels shift aside when the vertical would pierce them */
  branchTouched: ReadonlyMap<number, "up" | "down">;
};

function levelOf(index: number): number {
  let i = index;
  let run = 0;
  for (;;) {
    const len = RUNS[run % RUNS.length];
    if (i < len) return LEVEL_SEQ[run % LEVEL_SEQ.length];
    i -= len;
    run++;
  }
}

function polySegs(pts: Pt[]): { segs: number[]; total: number } {
  const segs: number[] = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    segs.push(d);
    total += d;
  }
  return { segs, total };
}

function pointAt(pts: Pt[], segs: number[], len: number): Pt {
  let acc = 0;
  for (let i = 0; i < segs.length; i++) {
    if (len <= acc + segs[i] && segs[i] > 0) {
      const t = (len - acc) / segs[i];
      return [
        pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t,
        pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t,
      ];
    }
    acc += segs[i];
  }
  return pts[pts.length - 1];
}

function lenAtStation(pts: Pt[], segs: number[], sx: number, sy: number): number {
  let acc = 0;
  for (let i = 0; i < segs.length; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    if (y0 === sy && y1 === sy && sx >= Math.min(x0, x1) - 0.5 && sx <= Math.max(x0, x1) + 0.5) {
      return acc + Math.abs(sx - x0);
    }
    acc += segs[i];
  }
  return acc;
}

function splitPoly(pts: Pt[], segs: number[], len: number): { a: Pt[]; b: Pt[] } {
  const cut = pointAt(pts, segs, len);
  const a: Pt[] = [pts[0]];
  const b: Pt[] = [cut];
  let acc = 0;
  let cutDone = false;
  for (let i = 0; i < segs.length; i++) {
    acc += segs[i];
    if (!cutDone && acc >= len) {
      a.push(cut);
      cutDone = true;
      if (acc > len + 0.5) b.push(pts[i + 1]);
    } else if (cutDone) {
      b.push(pts[i + 1]);
    } else {
      a.push(pts[i + 1]);
    }
  }
  return { a, b };
}

const dOf = (pts: Pt[]) =>
  pts.map((p, i) => `${i ? "L" : "M"}${p[0]} ${p[1]}`).join(" ");

function buildLayout(
  modules: CourseModule[],
  statuses: ModuleStatus[],
  doneCounts: number[],
  questsByAnchor: Map<number, SideQuest[]>,
  softAnchors: ReadonlySet<number>,
  legsFor: (q: SideQuest) => QuestLeg[] | null,
  zoneLabels: string[],
  zoneNumerals: string[],
): Layout {
  const stations: StationL[] = [];
  let x = 150;
  modules.forEach((m, i) => {
    const level = levelOf(i);
    const y = LEVELS[level];
    if (i > 0) {
      const prevY = LEVELS[levelOf(i - 1)];
      const gap = Math.min(170, Math.max(108, 92 + m.lessons.length * 6));
      x += prevY !== y ? Math.abs(y - prevY) + 78 : gap;
    }
    const display = getModuleDisplay(modules, i);
    stations.push({
      x,
      y,
      labelSide: level === 2 ? "top" : "bottom",
      index: i,
      module: m,
      badge: display.badgeLabel,
      isReview: display.isReview,
      status: statuses[i],
      done: doneCounts[i],
      total: m.lessons.length,
      interchange: questsByAnchor.has(i),
      terminal: i === modules.length - 1,
    });
  });

  // No drawable modules (e.g. a language/tier with nothing shipped yet) —
  // return an empty-but-valid layout so the memo can't crash on stations[0].
  // The page renders an empty state instead of mounting the map (see below).
  if (stations.length === 0) {
    return {
      width: 0,
      vbY: 0,
      vbH: 0,
      skyGroundY: 0,
      mainPts: [],
      stations: [],
      spurs: [],
      depot: null,
      zones: [],
      zoneChipY: 0,
      branchTouched: new Map(),
    };
  }

  const mainPts: Pt[] = [[stations[0].x - 64, stations[0].y]];
  for (let i = 1; i < stations.length; i++) {
    const prev = stations[i - 1];
    const cur = stations[i];
    if (prev.y !== cur.y) {
      const dy = Math.abs(cur.y - prev.y);
      mainPts.push([prev.x + 34, prev.y], [prev.x + 34 + dy, cur.y]);
    }
  }
  const last = stations[stations.length - 1];
  mainPts.push([last.x + 62, last.y]);

  /* quest branch lines — depth-nested per side so overlapping x-ranges
     never share a rail (the "blue overlap" fix); loops rejoin when the
     span allows, spurs get terminus caps */
  const spurs: SpurL[] = [];
  const downIntervals: Array<Array<[number, number]>> = [];
  const upIntervals: Array<Array<[number, number]>> = [];
  const packDepth = (rows: Array<Array<[number, number]>>, x0: number, x1: number) => {
    for (let d = 0; ; d++) {
      rows[d] ??= [];
      if (rows[d].every(([a, b]) => x1 < a - 20 || x0 > b + 20)) {
        rows[d].push([x0, x1]);
        return d;
      }
    }
  };
  let maxDownY = LOOP_DOWN_Y;
  const anchorEntries = [...questsByAnchor.entries()].sort(
    (a, b) => stations[a[0]].x - stations[b[0]].x,
  );
  const branchTouched = new Map<number, "up" | "down">();
  let colorIdx = 0;
  for (const [rawAnchor, quests] of anchorEntries) {
    // soft (auto-spread) anchors slide off stations another branch already
    // touches — two verticals at one station read as a single smeared rail
    let anchor = rawAnchor;
    if (softAnchors.has(rawAnchor)) {
      let tries = 0;
      while (branchTouched.has(anchor) && anchor < stations.length - 2 && tries < 4) {
        anchor++;
        tries++;
      }
    }
    const a = stations[anchor];
    const shown = quests.slice(0, 3);
    // a quest with sub-lessons renders as a rectangular down-loop carrying
    // one stop per lesson (Travel Sprint's 4 legs)
    const legs = shown.length === 1 ? legsFor(shown[0]) : null;
    const up = legs ? false : a.y === LEVELS[2];
    const color = QUEST_COLORS[colorIdx % QUEST_COLORS.length];
    colorIdx++;

    // rejoin BEFORE depth packing so the claimed interval is the real span
    let rejoin: StationL | null = null;
    if (!legs && shown.length >= 2) {
      for (let j = anchor + 1; j <= Math.min(anchor + 4, stations.length - 1); j++) {
        if (stations[j].y === a.y && !branchTouched.has(j)) {
          const span = stations[j].x - a.x;
          if (span >= shown.length * 116 + 60) {
            rejoin = stations[j];
            break;
          }
        }
      }
    }

    // Branches drop VERTICALLY from their anchor (and climb vertically into
    // rejoins), so the only possible crossings are clean 90-degree ones.
    const CIRCUIT_W = 460;
    const intervalStart = legs ? a.x - CIRCUIT_W / 2 - 12 : a.x - 12;
    const intervalEnd = legs
      ? a.x + CIRCUIT_W / 2 + 12
      : rejoin
        ? rejoin.x + 12
        : a.x + shown.length * 112 + 62;
    const depth = packDepth(up ? upIntervals : downIntervals, intervalStart, intervalEnd);
    const loopY = up ? LOOP_UP_Y - depth * 40 : LOOP_DOWN_Y + depth * DEPTH_STEP;
    if (!up) maxDownY = Math.max(maxDownY, loopY);
    branchTouched.set(anchor, up ? "up" : "down");
    if (rejoin) branchTouched.set(rejoin.index, up ? "up" : "down");

    let d: string;
    let stops: QuestStop[];
    let labelX: number;
    let labelY: number | null = null;
    let cap: Pt | null = null;
    let capDir: "v" | "h" = "v";
    if (legs) {
      // self-contained rounded circuit under the station: drop from the
      // line into a closed rounded rectangle, one lesson stop per side-half
      const W = CIRCUIT_W;
      const Hh = 172;
      const r = 26;
      const left = a.x - W / 2;
      const right = a.x + W / 2;
      const top = loopY - 56; // circuit rides a bit higher than plain loops
      const bot = top + Hh;
      if (!up) maxDownY = Math.max(maxDownY, bot);
      d =
        `M ${a.x} ${a.y} V ${top}` +
        ` H ${left + r}` +
        ` A ${r} ${r} 0 0 0 ${left} ${top + r}` +
        ` V ${bot - r}` +
        ` A ${r} ${r} 0 0 0 ${left + r} ${bot}` +
        ` H ${right - r}` +
        ` A ${r} ${r} 0 0 0 ${right} ${bot - r}` +
        ` V ${top + r}` +
        ` A ${r} ${r} 0 0 0 ${right - r} ${top}` +
        ` H ${a.x}`;
      const spots: Array<[number, number, number]> = [
        [(left + a.x) / 2, top, 27],
        [(a.x + right) / 2, top, 27],
        [(left + a.x) / 2, bot, -17],
        [(a.x + right) / 2, bot, -17],
      ];
      stops = legs.slice(0, 4).map((leg, k) => ({
        x: spots[k][0],
        y: spots[k][1],
        quest: shown[0],
        leg,
        labelDy: spots[k][2],
      }));
      labelX = a.x;
      labelY = (top + bot) / 2 + 4;
      cap = null;
    } else if (rejoin) {
      d = dOf([
        [a.x, a.y],
        [a.x, loopY],
        [rejoin.x, loopY],
        [rejoin.x, rejoin.y],
      ]);
      stops = shown.map((quest, k) => ({
        x: a.x + ((rejoin.x - a.x) / (shown.length + 1)) * (k + 1),
        y: loopY,
        quest,
      }));
      labelX = (a.x + rejoin.x) / 2;
    } else {
      const end = a.x + shown.length * 112 + 62;
      d = dOf([
        [a.x, a.y],
        [a.x, loopY],
        [end, loopY],
      ]);
      stops = shown.map((quest, k) => ({
        x: a.x + 72 + k * 112,
        y: loopY,
        quest,
      }));
      labelX = a.x + (end - a.x) / 2;
      cap = [end, loopY];
    }
    spurs.push({
      color,
      d,
      dashed: a.status === "locked",
      stops,
      label: legs ? shown[0].title : shown.length > 1 ? `${shown[0].title} Line` : "",
      labelX,
      // plate center OUTSIDE the stop-label band
      labelY: labelY ?? (up ? loopY - 52 : loopY + 70),
      up,
      cap,
      capDir,
    });
  }

  // junction rings follow the FINAL branch endpoints (soft anchors may have
  // slid; rejoins are junctions too)
  stations.forEach((st) => {
    st.interchange = branchTouched.has(st.index);
  });

  /* practice depot: a low-level station past the first third, clear of
     branch horizontals — the rail yard links to the practice hub */
  let depot: DepotL | null = null;
  const anchors = anchorEntries.map(([a]) => a);
  for (let i = Math.floor(stations.length * 0.35); i < stations.length - 1; i++) {
    const s = stations[i];
    const nearBranch = anchors.some((a) => i >= a - 1 && i <= a + 3);
    if (s.y === LEVELS[0] && !s.interchange && !nearBranch) {
      // yard sits BELOW the station-label band (labels end ~y+74)
      const yardY = s.y + 100;
      depot = {
        d: dOf([
          [s.x, s.y],
          [s.x + 52, yardY - 40],
          [s.x + 52, yardY],
        ]),
        tracks: [
          [[s.x + 52, yardY - 8], [s.x + 132, yardY - 8]],
          [[s.x + 52, yardY], [s.x + 148, yardY]],
          [[s.x + 52, yardY + 8], [s.x + 118, yardY + 8]],
        ],
        labelX: s.x + 52,
        labelY: yardY + 24,
      };
      break;
    }
  }

  /* content-fit extents — the viewBox hugs what was actually drawn */
  let minC = Infinity;
  let maxC = -Infinity;
  stations.forEach((st) => {
    const isCurrent = st.status === "current";
    minC = Math.min(minC, st.y - (isCurrent ? 96 : st.labelSide === "top" ? 66 : 28));
    const labelsBelow = st.labelSide === "bottom" || isCurrent || st.terminal;
    maxC = Math.max(maxC, st.y + (labelsBelow ? 74 : 28));
    if (st.terminal) minC = Math.min(minC, st.y - 62);
  });
  minC = Math.min(minC, stations[0].y - 74); // main-line plate
  for (const sp of spurs) {
    if (sp.up) minC = Math.min(minC, (sp.stops[0]?.y ?? LOOP_UP_Y) - 60);
    else maxC = Math.max(maxC, Math.max(...sp.stops.map((q) => q.y), maxDownY) + 84);
  }
  if (depot) maxC = Math.max(maxC, depot.labelY + 12);

  const vbY = Math.floor(minC) - ART_BAND;
  // balance bottom padding so the rail band sits at the vertical center
  const bandCenter = (LEVELS[0] + LEVELS[2]) / 2;
  const bottomEdge = Math.max(Math.ceil(maxC) + 16, 2 * bandCenter - vbY);
  const vbH = bottomEdge - vbY;
  const skyGroundY = Math.floor(minC) - 12;

  const width = last.x + 190;
  const zones: Layout["zones"] = [];
  if (stations.length >= 9 && zoneLabels.length === 3) {
    const third = Math.ceil(stations.length / 3);
    const bounds = [
      0,
      (stations[third - 1].x + stations[third].x) / 2,
      (stations[Math.min(2 * third - 1, stations.length - 2)].x +
        stations[Math.min(2 * third, stations.length - 1)].x) /
        2,
      width,
    ];
    for (let z = 0; z < 3; z++) {
      zones.push({
        x0: bounds[z],
        x1: bounds[z + 1],
        label: zoneLabels[z],
        numeral: zoneNumerals[z] ?? String(z + 1),
      });
    }
  }
  return {
    width,
    vbY,
    vbH,
    skyGroundY,
    mainPts,
    stations,
    spurs,
    depot,
    zones,
    zoneChipY: vbY + 58,
    branchTouched,
  };
}

/* ── skyline geography (seeded, zone-themed, parallax) ───────────────── */

type Skyline = {
  farHillsD: string;
  farHills2D: string;
  mid: { x: number; w: number; h: number; windows: number[] }[];
  near: { x: number; w: number; h: number; windows: number[] }[];
  mountains: { x: number; baseY: number; w: number; h: number; cap: boolean }[];
  toriiX: number;
  pagodaX: number;
  stars: { x: number; y: number; r: number; delay: number; bright: boolean }[];
  clouds: { x: number; y: number; blobs: { dx: number; rx: number; ry: number }[] }[];
};

function makeSkyline(layout: Layout, lang: string): Skyline {
  // Spanish reads as a low-rise Latin-American townscape, not a skyscraper
  // city: fewer buildings, shorter, more spaced out.
  const isEs = lang === "es";
  // Full-scene scenery per Spencer's paint mockup: the railway threads
  // THROUGH the city — towers rise from the canvas bottom past the rails,
  // hills wave through the middle, landmarks are big. Composition: horizon
  // strip on the top third, celestial in its gaps; layer opacity/parallax
  // encode depth (far faint/slow → near bolder/fast).
  const bottom = layout.vbY + layout.vbH + 6;
  const H = layout.vbH;

  // hill waves flowing through the MIDDLE of the scene
  const mk = (base: number, amp0: number, wl: number) => {
    let d = `M 0 ${base}`;
    for (let hx = 0; hx <= layout.width; hx += wl) {
      const amp = amp0 + ((hx / wl) % 3) * (amp0 * 0.45);
      d += ` Q ${hx + wl * 0.25} ${base - amp - amp0 * 0.4} ${hx + wl * 0.5} ${base - amp}`;
      d += ` Q ${hx + wl * 0.75} ${base - amp + amp0 * 0.5} ${hx + wl} ${base - 8}`;
    }
    d += ` L ${layout.width} ${bottom} L 0 ${bottom} Z`;
    return d;
  };
  const farHillsD = mk(layout.vbY + H * 0.6, 46, 560);
  const farHills2D = mk(layout.vbY + H * 0.78, 34, 380);

  // mid + near towers, bottom-anchored, rising past the rails
  const mid: Skyline["mid"] = [];
  let mx = 70;
  let mi = 0;
  while (mx < layout.width - 100) {
    const r = (((mi + 7) * 69069) >>> 5) % 1000 / 1000;
    const w = (isEs ? 46 : 42) + ((mi * 61) % 4) * (isEs ? 22 : 16);
    const h = Math.round(H * (isEs ? 0.1 : 0.18) + r * H * (isEs ? 0.18 : 0.42));
    if (r > (isEs ? 0.42 : 0.22)) {
      mid.push({ x: mx, w, h, windows: Array.from({ length: Math.min(5, Math.floor(h / 46)) }, (_, k) => k) });
    }
    mx += w + (isEs ? 96 : 46) + ((mi * 37) % 5) * (isEs ? 44 : 30);
    mi++;
  }
  const near: Skyline["near"] = [];
  let nx = 150;
  let ni = 0;
  while (nx < layout.width - 140) {
    const r = (((ni + 13) * 40503) >>> 3) % 1000 / 1000;
    const w = (isEs ? 70 : 58) + ((ni * 71) % 4) * (isEs ? 26 : 20);
    const h = Math.round(H * (isEs ? 0.14 : 0.3) + r * H * (isEs ? 0.22 : 0.55));
    if (r > (isEs ? 0.55 : 0.42)) {
      near.push({ x: nx, w, h, windows: Array.from({ length: Math.min(7, Math.floor(h / 52)) }, (_, k) => k) });
    }
    nx += w + (isEs ? 320 : 210) + ((ni * 43) % 5) * (isEs ? 90 : 70);
    ni++;
  }

  // mountains sit IN the far hills (bases at the hill baseline) so they
  // rise from the landscape instead of floating on the old horizon line
  const mountains: Skyline["mountains"] = [
    {
      x: layout.zones.length ? layout.zones[0].x1 - 80 : layout.width * 0.3,
      baseY: layout.vbY + H * 0.68,
      w: Math.min(640, layout.width * 0.2),
      h: H * 0.44,
      cap: true,
    },
    {
      x: layout.zones.length ? layout.zones[2].x0 + 220 : layout.width * 0.74,
      baseY: layout.vbY + H * 0.72,
      w: Math.min(430, layout.width * 0.14),
      h: H * 0.3,
      cap: false,
    },
  ];

  // celestial: blue-noise star field (deterministic best-candidate sampling
  // — each star takes the candidate farthest from all placed stars, which
  // spreads points evenly with no lattice artifacts), moon + clouds spread
  // through the whole open sky, not a thin top band
  const hash = (n: number) => {
    let h = (n ^ 0x9e3779b9) >>> 0;
    h = Math.imul(h ^ (h >>> 16), 0x21f0aaad) >>> 0;
    h = Math.imul(h ^ (h >>> 15), 0x735a2d97) >>> 0;
    return ((h ^ (h >>> 15)) >>> 0) / 4294967296;
  };
  const stars: Skyline["stars"] = [];
  const skyDeep = H * 0.5; // stars fill the open sky (painted BEHIND the land)
  const inMountain = (px: number, py: number) =>
    mountains.some((m) => py > m.baseY - m.h - 24 && Math.abs(px - m.x) < m.w / 2 + 16);
  let seed = 1;
  const starCount = Math.round(layout.width / 55);
  for (let sIdx = 0; sIdx < starCount; sIdx++) {
    let best: [number, number] | null = null;
    let bestD = -1;
    for (let c = 0; c < 12; c++) {
      const px = 24 + hash(seed++) * (layout.width - 48);
      const py = layout.vbY + 12 + hash(seed++) * skyDeep;
      if (inMountain(px, py)) continue;
      let d = Infinity;
      for (const st of stars) d = Math.min(d, (st.x - px) ** 2 + (st.y - py) ** 2);
      if (stars.length === 0) d = 1e9;
      if (d > bestD) {
        bestD = d;
        best = [px, py];
      }
    }
    if (!best) continue;
    const cls = hash(seed++);
    stars.push({
      x: best[0],
      y: best[1],
      r: cls > 0.94 ? 2.1 : cls > 0.68 ? 1.5 : 1.0,
      delay: hash(seed++) * 4.2,
      bright: cls > 0.68,
    });
  }
  // flat-bottomed cartoon clouds: overlapping circles of varied sizes with
  // bottoms on a shared baseline, every instance seeded differently
  // clouds get the same best-candidate spread as the stars — x AND y — plus
  // a per-cloud scale so altitudes and sizes genuinely vary
  const clouds: Skyline["clouds"] = [];
  const cloudCount = Math.max(4, Math.round(layout.width / 350));
  for (let ci2 = 0; ci2 < cloudCount; ci2++) {
    let best: [number, number] | null = null;
    let bestD = -1;
    for (let c = 0; c < 10; c++) {
      const px = 80 + hash(seed++) * (layout.width - 160);
      const py = layout.vbY + 26 + hash(seed++) * (H * 0.42);
      if (inMountain(px, py)) continue;
      let d = Infinity;
      for (const cl of clouds) d = Math.min(d, (cl.x - px) ** 2 + (cl.y - py) ** 2);
      if (clouds.length === 0) d = 1e9;
      if (d > bestD) {
        bestD = d;
        best = [px, py];
      }
    }
    if (!best) continue;
    const scale2 = 0.7 + hash(seed++) * 0.8;
    const blobCount = 5 + (hash(seed++) > 0.5 ? 1 : 0);
    // size hierarchy: biggest puff in the CENTER, smallest at the ends —
    // a big blob on the outside reads as one lumpy mass
    const radii = Array.from({ length: blobCount }, () => (12 + hash(seed++) * 26) * scale2).sort((q, w) => w - q);
    const blobs: Skyline["clouds"][number]["blobs"] = [];
    let leftEdge = 0;
    let rightEdge = 0;
    radii.forEach((rx, bi) => {
      const ry = rx * (0.55 + hash(seed++) * 0.2);
      if (bi === 0) {
        blobs.push({ dx: 0, rx, ry });
        leftEdge = -rx;
        rightEdge = rx;
      } else if (bi % 2 === 1) {
        const dx = leftEdge - rx * 0.4;
        blobs.push({ dx, rx, ry });
        leftEdge = dx - rx;
      } else {
        const dx = rightEdge + rx * 0.4;
        blobs.push({ dx, rx, ry });
        rightEdge = dx + rx;
      }
    });
    clouds.push({ x: best[0], y: best[1], blobs });
  }

  const z = layout.zones;
  return {
    farHillsD,
    farHills2D,
    mid,
    near,
    mountains,
    toriiX: z.length ? (z[0].x1 + z[1].x0) / 2 + 140 : layout.width * 0.4,
    pagodaX: z.length ? (z[1].x0 + z[1].x1) / 2 : layout.width * 0.55,
    stars,
    clouds,
  };
}

function SkylineArt({
  sky,
  bottomY,
  vbH,
  hillsRef,
  bldgRef,
  cityRef,
  landmark,
}: {
  sky: Skyline;
  bottomY: number;
  vbH: number;
  hillsRef: React.RefObject<SVGGElement | null>;
  bldgRef: React.RefObject<SVGGElement | null>;
  cityRef: React.RefObject<SVGGElement | null>;
  /** Per-language landmark set: ja = torii/pagoda/Fuji cap, ko = palace
   *  gate/Namsan tower, es = Mayan step-pyramid + palms (tropical). */
  landmark: "ja" | "ko" | "es";
}) {
  const toriiH = Math.min(200, vbH * 0.4);
  const towerH = Math.min(230, vbH * 0.34);
  const gateH = toriiH;
  return (
    <>
      {/* FAR (slowest): celestial painted FIRST so every landform occludes
          it — a star can never sit in front of a hill */}
      <g ref={hillsRef} pointerEvents="none" aria-hidden>
        <g className="tmc-night">
          {sky.stars.map((st, i) => (
            <circle key={i} className="tmc-star" cx={st.x} cy={st.y} r={st.r} opacity={st.bright ? 0.95 : 0.5} style={{ fill: "var(--tmc-star)", animationDelay: `${st.delay}s` }} />
          ))}
        </g>
        {sky.clouds.map((c, i) => (
          <g key={i} style={{ fill: "var(--tmc-scene-cloud)" }}>
            {c.blobs.map((b, k) => (
              <ellipse key={k} cx={c.x + b.dx} cy={c.y - b.ry} rx={b.rx} ry={b.ry} />
            ))}
          </g>
        ))}
        {sky.mountains.map((m, i) => (
          <g key={i}>
            <path
              d={`M ${m.x - m.w / 2} ${m.baseY} L ${m.x - m.w * 0.07} ${m.baseY - m.h} L ${m.x + m.w * 0.005} ${m.baseY - m.h * 0.86} L ${m.x + m.w * 0.08} ${m.baseY - m.h} L ${m.x + m.w / 2} ${m.baseY} Z`}
              style={{ fill: "var(--tmc-scene-far2)" }}
            />
            {m.cap && landmark === "ja" && (
              <path
                d={`M ${m.x - m.w * 0.115} ${m.baseY - m.h * 0.85} L ${m.x - m.w * 0.07} ${m.baseY - m.h} L ${m.x + m.w * 0.005} ${m.baseY - m.h * 0.86} L ${m.x + m.w * 0.08} ${m.baseY - m.h} L ${m.x + m.w * 0.125} ${m.baseY - m.h * 0.85} L ${m.x + m.w * 0.06} ${m.baseY - m.h * 0.78} L ${m.x - m.w * 0.05} ${m.baseY - m.h * 0.78} Z`}
                style={{ fill: "var(--tmc-panel)" }}
                opacity={0.55}
              />
            )}
          </g>
        ))}
        <path d={sky.farHillsD} style={{ fill: "var(--tmc-scene-hill2)" }} />
        <path d={sky.farHills2D} style={{ fill: "var(--tmc-scene-hill)" }} />
      </g>
      {/* MID: city rising from the bottom, behind the rails */}
      <g ref={bldgRef} pointerEvents="none" aria-hidden>
        {sky.mid.map((b, i) => (
          <g key={i}>
            <rect x={b.x} y={bottomY - b.h} width={b.w} height={b.h} rx={2} style={{ fill: "var(--tmc-scene-mid)" }} />
            <g className="tmc-night">
              {b.windows.map((k) => (
                <rect key={k} x={b.x + 8 + (k % 2) * (b.w / 2)} y={bottomY - b.h + 14 + k * 40} width={6} height={9} rx={1} style={{ fill: "var(--tmc-window)" }} opacity={0.3} />
              ))}
            </g>
          </g>
        ))}
      </g>
      {/* NEAR (fastest): tallest towers + big landmarks */}
      <g ref={cityRef} pointerEvents="none" aria-hidden>
        {sky.near.map((b, i) => (
          <g key={i}>
            <rect x={b.x} y={bottomY - b.h} width={b.w} height={b.h} rx={2.5} style={{ fill: "var(--tmc-scene-near)" }} />
            <g className="tmc-night">
              {b.windows.map((k) => (
                <rect key={k} x={b.x + 10 + (k % 3) * (b.w / 3.4)} y={bottomY - b.h + 18 + k * 46} width={7} height={10} rx={1} style={{ fill: "var(--tmc-window)" }} opacity={0.35} />
              ))}
            </g>
          </g>
        ))}
        {landmark === "ja" ? (
          <>
            {/* big torii behind the climb */}
            <g style={{ fill: "var(--tmc-scene-accent)" }}>
              <rect x={sky.toriiX - toriiH * 0.34} y={bottomY - toriiH} width={toriiH * 0.075} height={toriiH} />
              <rect x={sky.toriiX + toriiH * 0.34 - toriiH * 0.075} y={bottomY - toriiH} width={toriiH * 0.075} height={toriiH} />
              <path d={`M ${sky.toriiX - toriiH * 0.5} ${bottomY - toriiH * 0.98} Q ${sky.toriiX} ${bottomY - toriiH * 1.12} ${sky.toriiX + toriiH * 0.5} ${bottomY - toriiH * 0.98} L ${sky.toriiX + toriiH * 0.5} ${bottomY - toriiH * 0.88} Q ${sky.toriiX} ${bottomY - toriiH * 1.0} ${sky.toriiX - toriiH * 0.5} ${bottomY - toriiH * 0.88} Z`} />
              <rect x={sky.toriiX - toriiH * 0.38} y={bottomY - toriiH * 0.78} width={toriiH * 0.76} height={toriiH * 0.05} />
            </g>
            {/* pagoda silhouette (the bare triangle tower read as a weird cone) */}
            <g style={{ fill: "var(--tmc-scene-accent2)" }}>
              <rect x={sky.pagodaX - 3} y={bottomY - towerH} width={6} height={towerH} />
              {[0.28, 0.52, 0.76].map((t, i) => {
                const w = towerH * (0.62 - i * 0.14);
                return (
                  <g key={i}>
                    <rect x={sky.pagodaX - w / 2} y={bottomY - towerH * t - towerH * 0.05} width={w} height={towerH * 0.05} rx={4} />
                    <rect x={sky.pagodaX - w / 2.6} y={bottomY - towerH * t - towerH * 0.115} width={w / 1.3} height={towerH * 0.075} rx={2} />
                  </g>
                );
              })}
              <rect x={sky.pagodaX - towerH * 0.1} y={bottomY - towerH * 1.0} width={towerH * 0.2} height={towerH * 0.05} rx={4} />
              <rect x={sky.pagodaX - 1.5} y={bottomY - towerH - 18} width={3} height={18} />
            </g>
          </>
        ) : landmark === "ko" ? (
          <>
            {/* palace gate (Gwanghwamun silhouette) at the torii anchor */}
            <g style={{ fill: "var(--tmc-scene-accent)" }}>
              {/* stone base with arch cutout */}
              <path d={`M ${sky.toriiX - gateH * 0.5} ${bottomY} L ${sky.toriiX - gateH * 0.5} ${bottomY - gateH * 0.55} L ${sky.toriiX + gateH * 0.5} ${bottomY - gateH * 0.55} L ${sky.toriiX + gateH * 0.5} ${bottomY} L ${sky.toriiX + gateH * 0.18} ${bottomY} A ${gateH * 0.18} ${gateH * 0.22} 0 0 0 ${sky.toriiX - gateH * 0.18} ${bottomY} Z`} />
              {/* pavilion body between the roofs */}
              <rect x={sky.toriiX - gateH * 0.42} y={bottomY - gateH * 0.76} width={gateH * 0.84} height={gateH * 0.16} />
              {/* lower hip roof */}
              <path d={`M ${sky.toriiX - gateH * 0.62} ${bottomY - gateH * 0.6} Q ${sky.toriiX} ${bottomY - gateH * 0.78} ${sky.toriiX + gateH * 0.62} ${bottomY - gateH * 0.6} L ${sky.toriiX + gateH * 0.5} ${bottomY - gateH * 0.55} L ${sky.toriiX - gateH * 0.5} ${bottomY - gateH * 0.55} Z`} />
              {/* upper hip roof */}
              <path d={`M ${sky.toriiX - gateH * 0.52} ${bottomY - gateH * 0.82} Q ${sky.toriiX} ${bottomY - gateH * 1.0} ${sky.toriiX + gateH * 0.52} ${bottomY - gateH * 0.82} L ${sky.toriiX + gateH * 0.4} ${bottomY - gateH * 0.76} L ${sky.toriiX - gateH * 0.4} ${bottomY - gateH * 0.76} Z`} />
            </g>
            {/* Namsan tower at the pagoda anchor */}
            <g style={{ fill: "var(--tmc-scene-accent2)" }}>
              {/* tapered shaft */}
              <path d={`M ${sky.pagodaX - towerH * 0.06} ${bottomY} L ${sky.pagodaX - towerH * 0.025} ${bottomY - towerH * 0.72} L ${sky.pagodaX + towerH * 0.025} ${bottomY - towerH * 0.72} L ${sky.pagodaX + towerH * 0.06} ${bottomY} Z`} />
              {/* observation pod */}
              <ellipse cx={sky.pagodaX} cy={bottomY - towerH * 0.78} rx={towerH * 0.11} ry={towerH * 0.07} />
              {/* deck ring under the pod */}
              <rect x={sky.pagodaX - towerH * 0.08} y={bottomY - towerH * 0.72} width={towerH * 0.16} height={towerH * 0.03} rx={2} />
              {/* antenna spire */}
              <rect x={sky.pagodaX - 1.5} y={bottomY - towerH * 1.0} width={3} height={towerH * 0.16} />
            </g>
          </>
        ) : (
          (() => {
            const cx = sky.toriiX;
            const H = toriiH * 1.55;
            const W = H * 1.6;
            const tierH = H / 5;
            const topY = bottomY - 4 * tierH;
            const cW = H * 0.28;
            const palms = [
              { dx: -towerH * 0.42, h: towerH * 0.74, lean: -towerH * 0.14 },
              { dx: towerH * 0.24, h: towerH * 1.08, lean: towerH * 0.18 },
            ];
            return (
              <>
                {/* Mayan step-pyramid (El Castillo) at the primary anchor */}
                <g data-tm="es-landmark" style={{ fill: "var(--tmc-scene-accent)" }}>
                  {Array.from({ length: 4 }).map((_, i) => {
                    const baseW = W * (1 - i * 0.19);
                    const topW = W * (1 - (i + 1) * 0.19);
                    const yB = bottomY - i * tierH;
                    const yT = bottomY - (i + 1) * tierH;
                    return (
                      <path
                        key={i}
                        d={`M ${cx - baseW / 2} ${yB} L ${cx - topW / 2} ${yT} L ${cx + topW / 2} ${yT} L ${cx + baseW / 2} ${yB} Z`}
                      />
                    );
                  })}
                  {/* temple crown + roof comb */}
                  <rect x={cx - cW / 2} y={topY - tierH * 0.9} width={cW} height={tierH * 0.9} />
                  <rect x={cx - cW * 0.62} y={topY - tierH * 1.04} width={cW * 1.24} height={tierH * 0.16} rx={1} />
                </g>
                {/* central staircase — lighter band up the front */}
                <path
                  d={`M ${cx - H * 0.09} ${bottomY} L ${cx - H * 0.045} ${topY} L ${cx + H * 0.045} ${topY} L ${cx + H * 0.09} ${bottomY} Z`}
                  style={{ fill: "var(--tmc-panel)" }}
                  opacity={0.5}
                />
                {/* palm cluster at the secondary anchor */}
                {palms.map((pl, i) => {
                  const px = sky.pagodaX + pl.dx;
                  const tx = px + pl.lean;
                  const ty = bottomY - pl.h;
                  return (
                    <g key={i}>
                      <path
                        d={`M ${px - pl.h * 0.04} ${bottomY} Q ${px + pl.lean * 0.4} ${bottomY - pl.h * 0.55} ${tx - pl.h * 0.03} ${ty} L ${tx + pl.h * 0.03} ${ty} Q ${px + pl.lean * 0.4 + pl.h * 0.05} ${bottomY - pl.h * 0.55} ${px + pl.h * 0.04} ${bottomY} Z`}
                        style={{ fill: "var(--tmc-scene-accent2)" }}
                      />
                      {[-1, -0.5, 0.5, 1, 0].map((fa, k) => {
                        const len = pl.h * 0.5;
                        const ex = tx + fa * len;
                        const ey = ty + (fa === 0 ? -len * 0.55 : Math.abs(fa) * len * 0.45 - len * 0.1);
                        const mx = (tx + ex) / 2;
                        const my = ty - len * 0.4;
                        return (
                          <path
                            key={k}
                            d={`M ${tx} ${ty} Q ${mx} ${my} ${ex} ${ey}`}
                            fill="none"
                            stroke="var(--tmc-scene-accent2)"
                            strokeWidth={pl.h * 0.055}
                            strokeLinecap="round"
                          />
                        );
                      })}
                    </g>
                  );
                })}
              </>
            );
          })()
        )}
      </g>
    </>
  );
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ── small pieces ────────────────────────────────────────────────────── */

function LinePlate({ x, y, text, color }: { x: number; y: number; text: string; color: string }) {
  const w = plateW(text);
  return (
    <g>
      <rect x={x - w / 2} y={y - 10} width={w} height={20} rx={10} style={{ fill: color }} />
      <text x={x} y={y + 3.5} textAnchor="middle" data-tm="label" style={{ fill: "var(--color-on-accent)", fontSize: 11, fontWeight: 800 }}>
        {text}
      </text>
    </g>
  );
}

function TrainMascot({
  label,
  vehicle = "train",
}: {
  label: string;
  /** es rides Mexico City's Metrobús BRT — a red bus instead of the train. */
  vehicle?: "train" | "bus";
}) {
  const isBus = vehicle === "bus";
  const bw = isBus ? 50 : 36;
  return (
    <g className="tmc-mascot" aria-hidden>
      <rect x={-58} y={-82} width={116} height={20} rx={10} style={{ fill: "var(--tmc-signage-bg)" }} />
      <text x={0} y={-68} textAnchor="middle" style={{ fill: "var(--tmc-signage-fg)", fontSize: 9.5, fontWeight: 800 }}>
        {label}
      </text>
      {/* body (red like the main line / the Metrobús) */}
      <rect x={-bw / 2} y={-58} width={bw} height={20} rx={isBus ? 5 : 6} style={{ fill: "var(--tmc-line-main)" }} />
      <rect x={-bw / 2} y={-58} width={bw} height={5} rx={2.5} style={{ fill: "var(--tmc-ink)", opacity: 0.35 }} />
      {isBus && (
        <>
          {/* side windows (rear) + door line */}
          <rect x={-bw / 2 + 4} y={-53} width={14} height={8} rx={2} style={{ fill: "var(--tmc-panel)", opacity: 0.5 }} />
          <rect x={-bw / 2 + 20} y={-53} width={3} height={13} rx={1} style={{ fill: "var(--tmc-ink)", opacity: 0.3 }} />
        </>
      )}
      {/* face windows */}
      <circle cx={isBus ? 6 : -7} cy={-47} r={4.6} style={{ fill: "var(--tmc-panel)" }} />
      <circle cx={isBus ? 17 : 7} cy={-47} r={4.6} style={{ fill: "var(--tmc-panel)" }} />
      <circle className="tmc-mascot-eye" cx={isBus ? 7 : -6} cy={-47} r={1.9} style={{ fill: "var(--tmc-ink)" }} />
      <circle className="tmc-mascot-eye" cx={isBus ? 18 : 8} cy={-47} r={1.9} style={{ fill: "var(--tmc-ink)" }} />
      <path d={isBus ? "M 9 -41.5 Q 12 -39.5 15 -41.5" : "M -3 -41.5 Q 0 -39.5 3 -41.5"} fill="none" style={{ stroke: "var(--tmc-panel)", strokeWidth: 1.4, strokeLinecap: "round" }} />
      {/* wheels */}
      <circle cx={isBus ? -16 : -10} cy={-37} r={3} style={{ fill: "var(--tmc-ink)" }} />
      <circle cx={isBus ? 16 : 10} cy={-37} r={3} style={{ fill: "var(--tmc-ink)" }} />
    </g>
  );
}

function GhostTrain({ vehicle = "train" }: { vehicle?: "train" | "bus" }) {
  const isBus = vehicle === "bus";
  const w = isBus ? 30 : 22;
  return (
    <g className="tmc-ghost" aria-hidden>
      <rect x={-w / 2} y={-14} width={w} height={11} rx={isBus ? 3 : 4} style={{ fill: "var(--tmc-line-main)" }} />
      {isBus && (
        <rect x={-w / 2 + 3} y={-11.5} width={8} height={5} rx={1.5} style={{ fill: "var(--tmc-panel)", opacity: 0.5 }} />
      )}
      <circle cx={isBus ? 4 : -4.5} cy={-8.5} r={2.2} style={{ fill: "var(--tmc-panel)" }} />
      <circle cx={isBus ? 10 : 4.5} cy={-8.5} r={2.2} style={{ fill: "var(--tmc-panel)" }} />
    </g>
  );
}

/** Panel-pinned ambient layer: just the soft sky gradient — stars, moon
 *  and cloud wisps live INSIDE the map now, placed in the skyline gaps. */
function FixedSky({ skyRef }: { skyRef: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div ref={skyRef} className="tmc-sky-layer" aria-hidden>
      <svg width="100%" height="100%">
        <defs>
          <linearGradient id="tmc-sky-day" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--tmc-sky-day)" }} stopOpacity="0.5" />
            <stop offset="100%" style={{ stopColor: "var(--tmc-sky-day)" }} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="tmc-sky-night" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--tmc-sky-night)" }} stopOpacity="0.8" />
            <stop offset="100%" style={{ stopColor: "var(--tmc-sky-night)" }} stopOpacity="0" />
          </linearGradient>
        </defs>
        <g className="tmc-day">
          <rect x="0" y="0" width="100%" height="45%" fill="url(#tmc-sky-day)" />
        </g>
        <g className="tmc-night">
          <rect x="0" y="0" width="100%" height="45%" fill="url(#tmc-sky-night)" />
          {/* the moon is pinned to the panel — celestial bodies don't scroll */}
          {/* NB: the layer is 150% panel width — 46% of it = ~69% of the panel */}
          <svg x="46%" y="30" width="46" height="46" overflow="visible">
            <path d="M 19 0 A 19 19 0 1 0 19 38 A 23 23 0 0 1 19 0 Z" style={{ fill: "var(--tmc-moon)", opacity: 0.9 }} />
          </svg>
        </g>
      </svg>
    </div>
  );
}

/* ── network map (Concept A) ─────────────────────────────────────────── */

function NetworkMap({
  layout,
  currentIdx,
  lang,
  demo,
  onDemoChange,
  demoToggle,
  onOpen,
  onQuest,
  langPath,
}: {
  layout: Layout;
  currentIdx: number;
  lang: string;
  demo: boolean;
  onDemoChange: (v: boolean) => void;
  /** show the demo/real switch (preview route only) */
  demoToggle: boolean;
  onOpen: (index: number) => void;
  onQuest: (quest: SideQuest) => void;
  langPath: (p: string) => string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const skyRef = useRef<HTMLDivElement>(null);
  const hillsRef = useRef<SVGGElement>(null);
  const bldgRef = useRef<SVGGElement>(null);
  const cityRef = useRef<SVGGElement>(null);
  const railRef = useRef<SVGPathElement>(null);
  const trainRef = useRef<SVGGElement>(null);
  const ghostRef = useRef<SVGGElement>(null);
  const userTookOver = useRef(false);
  const [tip, setTip] = useState<StationL | null>(null);
  const [scale, setScale] = useState<number | null>(null);
  const [panelH, setPanelH] = useState<number | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const strings = stringsFor(lang);
  // TODO(n4-scenery): the ja skyline (torii/pagoda/Fuji) renders for BOTH
  // tiers for now — no new scenery art per requirement 4. A distinct N4
  // scene (e.g. "leaving the starter city" — city → countryside →
  // mountains) would hook in here by threading a `tier` prop down to
  // `makeSkyline`/`SkylineArt`'s `landmark`. Scenery direction is an open
  // decision, not yet made: docs/n4-scoping-2026-07-16.md, "Open questions
  // for Spencer" §2 (Zone scenery).
  const sky = useMemo(() => makeSkyline(layout, lang), [layout, lang]);

  /* uniform scale: fill the flexed panel height (content-fit viewBox) */
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const measure = () => {
      setPanelH(el.clientHeight);
      setScale(Math.max(0.85, el.clientHeight / layout.vbH));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [layout.vbH]);
  const s = scale ?? 1;

  const { segs, total } = useMemo(() => polySegs(layout.mainPts), [layout]);
  const current = layout.stations[currentIdx];
  const lenCurrent = useMemo(
    () => lenAtStation(layout.mainPts, segs, current.x, current.y),
    [layout, segs, current],
  );
  const { a: donePts, b: aheadPts } = useMemo(
    () => splitPoly(layout.mainPts, segs, lenCurrent),
    [layout, segs, lenCurrent],
  );

  /* intro: line draws, then the mascot rides M1 → current with the camera
     following (until the user grabs the map) */
  useEffect(() => {
    if (scale === null) return;
    const rail = railRef.current;
    const train = trainRef.current;
    const scroller = scrollerRef.current;
    if (!rail || !train || !scroller) return;
    userTookOver.current = false;
    const startLen = lenAtStation(layout.mainPts, segs, layout.stations[0].x, layout.stations[0].y);
    const place = (len: number): number => {
      const [px, py] = pointAt(layout.mainPts, segs, len);
      // Orient the vehicle to the track so it noses up on the climbs.
      const [ax, ay] = pointAt(layout.mainPts, segs, Math.max(0, len - 3));
      const [bx, by] = pointAt(layout.mainPts, segs, Math.min(total, len + 3));
      const ang = (Math.atan2(by - ay, bx - ax) * 180) / Math.PI;
      train.setAttribute("transform", `translate(${px} ${py}) rotate(${ang.toFixed(2)})`);
      return px;
    };
    if (prefersReducedMotion()) {
      place(lenCurrent);
      scroller.scrollLeft = Math.max(0, current.x * s - scroller.clientWidth * 0.45);
      return;
    }
    const drawLen = rail.getTotalLength();
    rail.style.transition = "none";
    rail.style.strokeDasharray = `${drawLen}`;
    rail.style.strokeDashoffset = `${drawLen}`;
    place(startLen);
    scroller.scrollLeft = 0;
    void rail.getBoundingClientRect();
    rail.style.transition = "";
    rail.style.strokeDashoffset = "0";

    let raf = 0;
    const rideMs = Math.min(4200, Math.max(1200, (lenCurrent - startLen) * 0.9));
    const t0 = performance.now() + 700;
    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - t0) / rideMs));
      const px = place(startLen + (lenCurrent - startLen) * ease(t));
      if (!userTookOver.current) {
        scroller.scrollLeft = Math.max(0, px * s - scroller.clientWidth * 0.45);
      }
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [layout, segs, lenCurrent, scale, s, current.x]);

  /* ghost train ambling the whole line on a slow loop */
  useEffect(() => {
    const ghost = ghostRef.current;
    const container = scrollerRef.current;
    if (!ghost || prefersReducedMotion()) return;
    let raf = 0;
    let last = 0;
    const LOOP_MS = 44000;
    // A 44s ambient amble doesn't need 60fps — 30fps halves the polyline
    // walk + DOM writes with no visible difference.
    const FRAME_MS = 1000 / 30;
    const tick = (now: number) => {
      if (now - last >= FRAME_MS) {
        last = now;
        const gl = ((now % LOOP_MS) / LOOP_MS) * total;
        const [px, py] = pointAt(layout.mainPts, segs, gl);
        const [ax, ay] = pointAt(layout.mainPts, segs, Math.max(0, gl - 3));
        const [bx, by] = pointAt(layout.mainPts, segs, Math.min(total, gl + 3));
        const ang = (Math.atan2(by - ay, bx - ax) * 180) / Math.PI;
        ghost.setAttribute("transform", `translate(${px} ${py}) rotate(${ang.toFixed(2)})`);
      }
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    start();
    // Fully idle the loop while the map is scrolled off-screen (learn page
    // scrolled past, or the mobile map collapsed) instead of spinning forever.
    let io: IntersectionObserver | null = null;
    if (container && "IntersectionObserver" in window) {
      io = new IntersectionObserver(
        ([entry]) => (entry.isIntersecting ? start() : stop()),
        { threshold: 0 },
      );
      io.observe(container);
    }
    return () => {
      stop();
      io?.disconnect();
    };
  }, [layout, segs, total]);

  /* drag + wheel panning, sky + skyline parallax */
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    // Cache clientWidth (only changes on resize) so the scroll handler doesn't
    // force a layout read interleaved with the transform writes below.
    let clientW = el.clientWidth;
    let drag: { x: number; left: number } | null = null;
    const down = (e: PointerEvent) => {
      userTookOver.current = true;
      drag = { x: e.clientX, left: el.scrollLeft };
      el.classList.add("tmc-dragging");
    };
    const move = (e: PointerEvent) => {
      if (drag) el.scrollLeft = drag.left - (e.clientX - drag.x);
    };
    const up = () => {
      drag = null;
      el.classList.remove("tmc-dragging");
    };
    const wheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        userTookOver.current = true;
        el.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    };
    const onScroll = () => {
      const skyEl = skyRef.current;
      if (skyEl) {
        const slack = clientW * 0.45;
        skyEl.style.transform = `translateX(${-Math.min(el.scrollLeft * 0.1, slack)}px)`;
      }
      // skyline layers counter-translate in map units → slower apparent speed
      hillsRef.current?.setAttribute("transform", `translate(${(el.scrollLeft * (1 - 0.18)) / s} 0)`);
      bldgRef.current?.setAttribute("transform", `translate(${(el.scrollLeft * (1 - 0.45)) / s} 0)`);
      cityRef.current?.setAttribute("transform", `translate(${(el.scrollLeft * (1 - 0.68)) / s} 0)`);
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    el.addEventListener("wheel", wheel, { passive: false });
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(() => {
      clientW = el.clientWidth;
    });
    ro.observe(el);
    onScroll();
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      el.removeEventListener("wheel", wheel);
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, [s]);

  const stationFill = (st: StationL): { fill: string; stroke: string } => {
    if (st.status === "completed") return { fill: "var(--tmc-done)", stroke: "var(--tmc-panel)" };
    if (st.status === "current") return { fill: "var(--tmc-panel)", stroke: "var(--tmc-line-main)" };
    return { fill: "var(--tmc-panel)", stroke: "var(--tmc-locked)" };
  };

  return (
    <div className="relative rounded-md border-2 border-text-primary bg-surface shadow-card overflow-hidden">
      <FixedSky skyRef={skyRef} />

      {/* demo/real toggle — design-review aid, preview route only */}
      {demoToggle && (
        <div className="absolute left-3 top-3 z-[5] flex items-center gap-2">
          <div className="tmc-toggle" role="group" aria-label="Progress data source">
            <button className={cn(demo && "on")} onClick={() => onDemoChange(true)}>
              デモ demo state
            </button>
            <button className={cn(!demo && "on")} onClick={() => onDemoChange(false)}>
              my progress
            </button>
          </div>
        </div>
      )}

      {/* legend */}
      <div
        data-tm="legend"
        className="absolute right-3 top-3 z-[5] grid gap-2 rounded-sm border border-border bg-surface px-4 py-3 text-[13px] shadow-card min-w-[222px] 2xl:text-[15px] 2xl:min-w-[256px]"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
            Legend
          </span>
          <button
            type="button"
            onClick={() => setHelpOpen((v) => !v)}
            aria-label="How to read the map"
            aria-expanded={helpOpen}
            className="-mr-1 grid size-6 place-items-center rounded-full text-text-muted transition hover:bg-surface-muted hover:text-text-primary"
          >
            <Icon name="help" size={15} aria-hidden />
          </button>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="h-[6px] w-[26px] rounded-full" style={{ background: "var(--tmc-line-main)" }} />
          <span>{strings.lineName}</span>
        </div>
        {layout.spurs.length > 0 && (
          <div className="flex items-center gap-2.5">
            <span className="flex gap-0.5">
              {QUEST_COLORS.map((c) => (
                <span key={c} className="h-[6px] w-[8px] rounded-full" style={{ background: c }} />
              ))}
            </span>
            <span>Side-quest lines</span>
          </div>
        )}
        <div className="flex items-center gap-2.5">
          <span
            className="h-[6px] w-[26px] rounded-full"
            style={{ background: "repeating-linear-gradient(90deg, var(--tmc-locked) 0 6px, transparent 6px 10px)" }}
          />
          <span>Locked / planned</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="grid h-[16px] w-[16px] place-items-center rounded-full text-[8.5px] font-bold text-accent-foreground" style={{ background: "var(--tmc-seal)" }}>
            {strings.seal}
          </span>
          <span>Station complete</span>
        </div>
        {helpOpen && (
          <p className="mt-1 border-t border-border pt-2 text-[12px] leading-relaxed text-text-secondary">
            Stations are modules — spacing scales with lesson count. Branch
            lines are side quests, and dashed track is the roadmap ahead.
            Click a station to open its district; the depot links to practice.
          </p>
        )}
      </div>

      <div ref={scrollerRef} className="tmc-map-scroll">
        <div
          className="tmc-map-inner"
          style={{
            width: Math.round(layout.width * s),
            // center-clip when the readability floor oversizes the drawing
            marginTop: panelH !== null ? Math.min(0, Math.floor((panelH - layout.vbH * s) / 2)) : 0,
          }}
        >
          <svg
            viewBox={`0 ${layout.vbY} ${layout.width} ${layout.vbH}`}
            width={Math.round(layout.width * s)}
            height={Math.floor(layout.vbH * s)}
            role="img"
            aria-label="Course transit map"
          >
            {/* geography: hills/Fuji far, buildings/landmarks near */}
            <SkylineArt sky={sky} bottomY={layout.vbY + layout.vbH + 6} vbH={layout.vbH} hillsRef={hillsRef} bldgRef={bldgRef} cityRef={cityRef} landmark={lang === "ko" ? "ko" : lang === "es" ? "es" : "ja"} />

            {/* fare zones — tint bands + inset horizon chips */}
            {layout.zones.map((z, i) => (
              <g key={z.label} pointerEvents="none">
                {/* tint bleeds to the frame edges — no untinted gutters */}
                <rect x={z.x0} y={layout.vbY} width={z.x1 - z.x0} height={layout.vbH} fill="currentColor" opacity={i % 2 === 1 ? 0.03 : 0.012} />
                {i > 0 && <line x1={z.x0} y1={layout.vbY} x2={z.x0} y2={layout.vbY + layout.vbH} style={{ stroke: "var(--tmc-border)" }} strokeDasharray="2 6" />}
                <g>
                  <rect x={z.x0 + 20} y={layout.zoneChipY - 15} width={plateW(z.label) * 1.35 + 10} height={30} rx={5} style={{ fill: "var(--tmc-panel)", stroke: "var(--tmc-border)" }} strokeWidth={1} opacity={0.85} />
                  <text x={z.x0 + 20 + (plateW(z.label) * 1.35 + 10) / 2} y={layout.zoneChipY + 5} textAnchor="middle" data-tm="zone" style={{ fill: "var(--tmc-muted)", fontSize: 15, letterSpacing: "0.12em", fontWeight: 700 }}>
                    {z.label}
                  </text>
                </g>
              </g>
            ))}

            {/* quest branch lines */}
            {layout.spurs.map((spur, i) => (
              <g key={i}>
                <path
                  d={spur.d}
                  fill="none"
                  strokeWidth={5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  style={{ stroke: spur.dashed ? "var(--tmc-locked)" : spur.color }}
                  strokeDasharray={spur.dashed ? "6 8" : undefined}
                />
                {spur.cap && (
                  <line
                    x1={spur.cap[0] - (spur.capDir === "h" ? 8 : 0)}
                    y1={spur.cap[1] - (spur.capDir === "v" ? 8 : 0)}
                    x2={spur.cap[0] + (spur.capDir === "h" ? 8 : 0)}
                    y2={spur.cap[1] + (spur.capDir === "v" ? 8 : 0)}
                    strokeWidth={5}
                    strokeLinecap="round"
                    style={{ stroke: spur.dashed ? "var(--tmc-locked)" : spur.color }}
                  />
                )}
                {spur.label && (
                  <LinePlate x={spur.labelX} y={spur.labelY} text={spur.label} color={spur.dashed ? "var(--tmc-locked)" : spur.color} />
                )}
                {spur.stops.map(({ x, y, quest, leg, labelDy }, si) => {
                  if (leg) {
                    /* lesson stop on a sprint loop — while the quest is
                     * comingSoon (content deleted, remake pending) the dot
                     * renders but is inert; once live it links into the
                     * lesson. */
                    const stop = (
                      <g data-tm="quest" className={quest.comingSoon ? undefined : "tmc-station"}>
                        <circle className="tmc-hit" cx={x} cy={y} r={18} fill="transparent" stroke="none" />
                        <circle
                          cx={x}
                          cy={y}
                          r={8.5}
                          strokeWidth={3.5}
                          className="tmc-station-glyph"
                          style={{
                            fill: leg.done ? spur.color : "var(--tmc-panel)",
                            stroke: spur.dashed ? "var(--tmc-locked)" : spur.color,
                          }}
                        />
                        <text x={x} y={y + (labelDy ?? 27)} textAnchor="middle" data-tm="label" className="tmc-halo-text" style={{ fill: "var(--tmc-muted)", fontSize: 11 }}>
                          {leg.title}
                        </text>
                      </g>
                    );
                    return quest.comingSoon ? (
                      <g key={leg.lessonId} aria-label={`${quest.title}: ${leg.title}, coming soon`}>{stop}</g>
                    ) : (
                      <Link key={leg.lessonId} to={langPath(`learn/lessons/${leg.lessonId}`)} aria-label={`${quest.title}: ${leg.title}${leg.done ? ", completed" : ""}`}>
                        {stop}
                      </Link>
                    );
                  }
                  return (
                    <g
                      key={`${quest.id}-${si}`}
                      data-tm="quest"
                      className="tmc-station"
                      role="button"
                      tabIndex={0}
                      aria-label={quest.title}
                      onClick={() => onQuest(quest)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onQuest(quest);
                        }
                      }}
                    >
                      <circle className="tmc-hit" cx={x} cy={y} r={18} fill="transparent" stroke="none" />
                      <rect
                        x={x - 10}
                        y={y - 10}
                        width={20}
                        height={20}
                        rx={3.5}
                        transform={`rotate(45 ${x} ${y})`}
                        strokeWidth={3}
                        className="tmc-station-glyph"
                        style={{
                          fill: quest.progress >= 100 ? spur.color : "var(--tmc-panel)",
                          stroke: spur.dashed ? "var(--tmc-locked)" : spur.color,
                        }}
                      />
                      {/* emoji + title grouped on the OUTSIDE of the loop so
                          they never share a band with station labels */}
                      <text x={x} y={spur.up ? y - 38 : y + 31} textAnchor="middle" data-tm="label" style={{ fontSize: 15 }}>
                        {quest.emoji}
                      </text>
                      <text x={x} y={spur.up ? y - 20 : y + 49} textAnchor="middle" data-tm="label" className="tmc-halo-text" style={{ fill: "var(--tmc-muted)", fontSize: 11.5 }}>
                        {quest.title.length > 14 ? `${quest.title.slice(0, 13)}…` : quest.title}
                        {quest.progress > 0 && quest.progress < 100 ? ` · ${quest.progress}%` : ""}
                      </text>
                    </g>
                  );
                })}
              </g>
            ))}

            {/* practice depot */}
            {layout.depot && (
              <Link to={langPath("practice")} aria-label="Practice depot">
                <g>
                  <path d={layout.depot.d} fill="none" strokeWidth={4} strokeDasharray="1 7" strokeLinecap="round" style={{ stroke: "var(--tmc-muted)" }} />
                  {layout.depot.tracks.map((t, i) => (
                    <line key={i} x1={t[0][0]} y1={t[0][1]} x2={t[1][0]} y2={t[1][1]} strokeWidth={3} strokeLinecap="round" style={{ stroke: "var(--tmc-muted)" }} />
                  ))}
                  <text x={layout.depot.labelX} y={layout.depot.labelY} data-tm="label" className="tmc-halo-text" style={{ fill: "var(--tmc-muted)", fontSize: 11, fontWeight: 700 }}>
                    {strings.depot}
                  </text>
                </g>
              </Link>
            )}

            {/* main line: origin cap, ahead dashed, drawn done-section */}
            <line
              x1={layout.mainPts[0][0]}
              y1={layout.mainPts[0][1] - 9}
              x2={layout.mainPts[0][0]}
              y2={layout.mainPts[0][1] + 9}
              strokeWidth={6}
              strokeLinecap="round"
              style={{ stroke: "var(--tmc-line-main)" }}
            />
            <path
              d={dOf(aheadPts)}
              fill="none"
              strokeWidth={7}
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray="7 8"
              style={{ stroke: "var(--tmc-locked)" }}
            />
            <path
              ref={railRef}
              className="tmc-rail-main"
              d={dOf(donePts)}
              fill="none"
              strokeWidth={8}
              strokeLinejoin="round"
              strokeLinecap="round"
              style={{ stroke: "var(--tmc-line-main)" }}
            />
            <LinePlate
              x={layout.stations[0].x + plateW(strings.lineName) / 2 - 14}
              y={layout.stations[0].y - 60}
              text={strings.lineName}
              color="var(--tmc-line-main)"
            />

            {/* ghost train (under stations) */}
            <g ref={ghostRef}>
              <GhostTrain vehicle={lang === "es" ? "bus" : "train"} />
            </g>

            {/* stations */}
            {layout.stations.map((st) => {
              // the mascot parks above the current station — flip its labels
              // below so they stay readable when the station is on the top row
              const dir = st.terminal || st.status === "current" || st.labelSide !== "top" ? 1 : -1;
              const baseOffset = st.interchange || st.terminal ? 36 : 30;
              const titleY = st.y + dir * baseOffset + (dir < 0 ? 0 : 8);
              const badgeY = titleY + dir * 15;
              // a down-branch vertical passes through the label column —
              // side-anchor the labels so the rail doesn't pierce the text
              // (and truncate harder so they clear the left neighbor's title)
              const branchSide = layout.branchTouched.get(st.index);
              const sideShift =
                (branchSide === "down" && dir > 0) || (branchSide === "up" && dir < 0);
              const maxCh = sideShift ? 12 : 18;
              const short = st.module.title.length > maxCh ? `${st.module.title.slice(0, maxCh - 1)}…` : st.module.title;
              const labelX = sideShift ? st.x - 22 : st.x;
              const anchor = sideShift ? "end" : "middle";
              const paint = stationFill(st);
              return (
                <g
                  key={st.module.id}
                  className="tmc-station"
                  data-tm="station"
                  tabIndex={0}
                  role="button"
                  aria-label={`${st.badge} ${st.module.title}, ${st.done} of ${st.total} lessons`}
                  onMouseEnter={() => setTip(st)}
                  onMouseLeave={() => setTip(null)}
                  onFocus={() => setTip(st)}
                  onBlur={() => setTip(null)}
                  onClick={() => onOpen(st.index)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onOpen(st.index);
                    }
                  }}
                >
                  <circle className="tmc-hit" cx={st.x} cy={st.y} r={22} fill="transparent" stroke="none" />
                  {st.status === "current" && (
                    <circle className="tmc-pulse" cx={st.x} cy={st.y} r={13} fill="none" strokeWidth={3} style={{ stroke: "var(--tmc-line-main)" }} />
                  )}
                  <g className="tmc-station-glyph" style={{ animationDelay: `${st.index * 45}ms` }}>
                    {st.terminal ? (
                      <>
                        <rect x={st.x - 13} y={st.y - 13} width={26} height={26} rx={5} strokeWidth={4} style={{ fill: "var(--tmc-panel)", stroke: st.status === "completed" ? "var(--tmc-done)" : "var(--tmc-locked)" }} />
                        <rect x={st.x - 30} y={st.y - 58} width={60} height={20} rx={3} style={{ fill: "var(--tmc-signage-bg)" }} />
                        <text x={st.x} y={st.y - 44} textAnchor="middle" style={{ fill: "var(--tmc-signage-fg)", fontSize: 11, fontWeight: 800 }}>
                          GOAL
                        </text>
                        <line x1={st.x} y1={st.y - 38} x2={st.x} y2={st.y - 15} style={{ stroke: "var(--tmc-ink)" }} strokeWidth={1.5} />
                      </>
                    ) : st.isReview ? (
                      <rect x={st.x - 7} y={st.y - 7} width={14} height={14} rx={3} strokeWidth={3} style={{ fill: paint.fill, stroke: st.status === "completed" ? "var(--tmc-panel)" : paint.stroke }} />
                    ) : st.interchange ? (
                      <>
                        <circle cx={st.x} cy={st.y} r={11.5} strokeWidth={3.5} style={{ fill: "var(--tmc-panel)", stroke: "var(--tmc-ink)" }} />
                        <circle cx={st.x} cy={st.y} r={4.5} style={{ fill: st.status === "locked" ? "var(--tmc-locked)" : "var(--tmc-line-main)" }} />
                      </>
                    ) : (
                      <circle
                        cx={st.x}
                        cy={st.y}
                        r={st.status === "current" ? 9.5 : 8}
                        strokeWidth={st.status === "current" ? 4.5 : 3.5}
                        style={paint}
                      />
                    )}
                    {st.status === "completed" && !st.terminal && (
                      <g transform={`rotate(-14 ${st.x + 13} ${st.y - 13})`} aria-hidden>
                        <circle cx={st.x + 13} cy={st.y - 13} r={7.5} style={{ fill: "var(--tmc-seal)", opacity: 0.94 }} />
                        <text x={st.x + 13} y={st.y - 10.5} textAnchor="middle" style={{ fill: "var(--color-on-accent)", fontSize: 7.5, fontWeight: 800 }}>
                          {strings.seal}
                        </text>
                      </g>
                    )}
                  </g>
                  <text x={labelX} y={dir < 0 ? badgeY : titleY} textAnchor={anchor} data-tm="label" className="tmc-halo-text" style={{ fill: "var(--tmc-ink)", fontSize: 14, fontWeight: 800 }}>
                    {st.badge}
                  </text>
                  <text x={labelX} y={dir < 0 ? titleY : badgeY} textAnchor={anchor} data-tm="label" className="tmc-halo-text" style={{ fill: "var(--tmc-muted)", fontSize: 12 }}>
                    {short}
                  </text>
                </g>
              );
            })}

            {/* the rider */}
            <g ref={trainRef}>
              <TrainMascot label={strings.youAreHere} vehicle={lang === "es" ? "bus" : "train"} />
            </g>
          </svg>

          {tip && (
            <div
              data-tm="tip"
              className="tmc-tip rounded-sm border-2 border-text-primary bg-surface px-3.5 py-3 shadow-popover"
              style={{
                left: Math.max(8, Math.min(tip.x * s - 116, layout.width * s - 244)),
                top: tip.labelSide === "top" ? (tip.y - layout.vbY) * s + 34 * s : (tip.y - layout.vbY) * s - 150,
              }}
            >
              <div className="text-[10px] tracking-[0.12em] text-text-muted uppercase">
                Station {tip.badge}
                {tip.interchange ? " · Interchange" : ""}
                {tip.terminal ? " · Terminal" : ""}
              </div>
              <div className="text-[15px] font-extrabold text-text-primary">{tip.module.title}</div>
              <div className="mb-2 text-[12px] text-text-muted">
                {tip.done}/{tip.total} lessons ·{" "}
                {tip.status === "completed" ? "complete" : tip.status === "current" ? "in progress" : "locked"}
              </div>
              <div className="text-[11px] font-semibold text-accent">Click to open district ↓</div>
            </div>
          )}
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-[18px] left-3.5 z-[5] rounded-full border border-border bg-surface px-3 py-0.5 text-[11px] text-text-muted 2xl:text-[12px]">
        drag or scroll sideways · click a station
      </div>
    </div>
  );
}

/* ── mobile line diagram ─────────────────────────────────────────────── */

function LineDiagram({
  layout,
  currentIdx,
  lang,
  onOpen,
}: {
  layout: Layout;
  currentIdx: number;
  lang: string;
  onOpen: (index: number) => void;
}) {
  const strings = stringsFor(lang);
  const questColor = new Map<number, string>();
  layout.stations.forEach((s) => {
    if (s.interchange) questColor.set(s.index, QUEST_COLORS[questColor.size % QUEST_COLORS.length]);
  });
  return (
    <div className="overflow-hidden rounded-md border-2 border-text-primary bg-surface shadow-card">
      <div className="flex items-center gap-3 px-4 py-3" style={{ background: "var(--tmc-signage-bg)", color: "var(--tmc-signage-fg)" }}>
        <div className="grid h-8 w-8 flex-none place-items-center rounded-full border-2 text-[13px] font-extrabold" style={{ borderColor: "var(--tmc-signage-fg)", background: "var(--tmc-line-main)", color: "var(--color-on-accent)" }}>
          M
        </div>
        <div className="min-w-0">
          <div className="truncate text-[14px] font-extrabold leading-tight">{strings.lineName}</div>
          <div className="text-[11px] opacity-75">
            Station {currentIdx + 1} of {layout.stations.length}
          </div>
        </div>
      </div>
      <div className="py-1.5">
        {layout.stations.map((s, i) => {
          const state = s.status === "completed" ? "tmc-row-done" : s.status === "current" ? "tmc-row-now" : "tmc-row-future";
          return (
            <button
              key={s.module.id}
              data-tm="row"
              onClick={() => onOpen(s.index)}
              className={cn(
                "grid w-full grid-cols-[52px_1fr] items-stretch text-left min-h-[54px]",
                state,
                i === 0 && "tmc-row-first",
                i === layout.stations.length - 1 && "tmc-row-last",
                s.status === "current" && "bg-accent-muted/40",
              )}
            >
              <span className="tmc-row-rail">
                <span className="tmc-row-dot" />
              </span>
              <span className="flex flex-col justify-center gap-0.5 py-2 pr-3">
                <span className="text-[13.5px] font-bold leading-tight text-text-primary">
                  {s.badge} · {s.module.title}
                  {s.status === "current" && (
                    <Icon name="mapPin" size={13} className="ml-1.5 inline align-middle text-accent" aria-hidden />
                  )}
                  {s.status === "completed" && (
                    <span className="ml-1.5 inline-grid h-[15px] w-[15px] place-items-center rounded-full align-middle text-[8px] font-bold text-accent-foreground" style={{ background: "var(--tmc-seal)" }}>
                      {strings.seal}
                    </span>
                  )}
                </span>
                <span className="text-[11px] text-text-muted">
                  {s.done}/{s.total} lessons
                  {s.terminal ? " · terminal" : ""}
                </span>
                {s.interchange && (
                  <span className="mt-0.5 flex w-fit items-center gap-1 rounded-full px-2 py-[1px] text-[10px] font-bold text-white" style={{ background: questColor.get(s.index) }}>
                    <Icon name="sparkles" size={10} aria-hidden /> Side quests here
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── tier switcher (2026-07-17) ──────────────────────────────────────── */

/**
 * Compact interchange-style pill/tabs — "N5 Line" / "N4 Line" — rendered
 * near the map header. Only mounted when the course actually has n4
 * content (`hasN4` gate in the page component); es/ko never see this.
 */
function TierTabs({
  tier,
  onChange,
  n5Label,
  n4Label,
}: {
  tier: LearnTier;
  onChange: (t: LearnTier) => void;
  n5Label: string;
  n4Label: string;
}) {
  const opt = (t: LearnTier, label: string) => {
    const on = tier === t;
    return (
      <button
        key={t}
        type="button"
        data-tm="tier-tab"
        aria-pressed={on}
        onClick={() => onChange(t)}
        className={cn(
          "rounded-full px-3 py-1 text-[12px] font-bold transition",
          on
            ? "text-accent-foreground"
            : "text-text-secondary hover:text-text-primary",
        )}
        style={on ? { background: "var(--tmc-line-main)" } : undefined}
      >
        {label}
      </button>
    );
  };
  return (
    <div
      role="group"
      aria-label="Course tier"
      className="flex w-fit gap-0.5 rounded-full border border-border bg-surface-muted p-0.5"
    >
      {opt("n5", n5Label)}
      {opt("n4", n4Label)}
    </div>
  );
}

/**
 * The "graduation moment" — an interchange banner past the end of one
 * tier's line pointing onto the other. Spencer's ask (2026-07-16): the
 * learn page had NO way to reach the n4 tier at all. Shipped as a simple
 * banner below the map rather than an SVG node woven into `buildLayout`
 * (each tier is deliberately its own map/geometry — see the `modules`
 * filter comment above — so a true in-map interchange node would mean
 * threading tier-crossing state through `buildLayout`'s station/zone math
 * for a purely navigational affordance).
 */
function TierContinueBanner({
  tier,
  onSwitch,
  n4Label,
}: {
  tier: LearnTier;
  onSwitch: (t: LearnTier) => void;
  n4Label: string;
}) {
  if (tier === "n5") {
    return (
      <button
        type="button"
        data-tm="tier-continue"
        onClick={() => onSwitch("n4")}
        className="mt-3 flex w-full items-center justify-between gap-3 rounded-md border-2 border-dashed px-4 py-3 text-left transition hover:bg-surface-muted"
        style={{ borderColor: "var(--tmc-line-main)" }}
      >
        <span className="min-w-0">
          <span className="block text-[10.5px] font-bold uppercase tracking-wider text-text-muted">
            Interchange · end of the line
          </span>
          <span className="block truncate text-[14px] font-extrabold text-text-primary">
            Continue onto the {n4Label} →
          </span>
        </span>
        <span
          className="grid h-9 w-9 flex-none place-items-center rounded-full text-[12px] font-extrabold text-accent-foreground"
          style={{ background: "var(--tmc-line-main)" }}
        >
          N4
        </span>
      </button>
    );
  }
  return (
    <button
      type="button"
      data-tm="tier-continue"
      onClick={() => onSwitch("n5")}
      className="mt-3 flex w-fit items-center gap-2 rounded-full border border-border px-3.5 py-1.5 text-[12.5px] font-bold text-text-secondary transition hover:text-text-primary"
    >
      ← N5 Line
    </button>
  );
}

/* ── district view (Concept B) ───────────────────────────────────────── */

/* ── page ────────────────────────────────────────────────────────────── */

export default function TransitLearnPage({
  preview = false,
  headerRight,
}: {
  preview?: boolean;
  /** Right-side signage slot (view toggle). Absent → legacy classic-view link. */
  headerRight?: ReactNode;
}) {
  const lang = useLang();
  const p = useLangPath();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const realIds = useCompletedLessonIds();
  const realSet = useMemo(() => new Set(realIds), [realIds]);
  const realProfile = useLearnProfile();
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [showMapMobile, setShowMapMobile] = useState(false);
  // live mode always renders real progress; the demo overlay is a
  // design-review aid on the /transit-preview route only
  const [demo, setDemo] = useState(preview);
  const [placementDismissedByUser, setPlacementDismissedByUser] = useState(false);
  const strings = stringsFor(lang);

  // same FTUE fallback contract as the classic LearnPage: the first-session
  // arc owns the placement offer; this standalone prompt only appears once
  // the arc has run (it dismisses placement on finish)
  const showPlacement =
    !preview &&
    !placementDismissedByUser &&
    (lang === "ja" || lang === "ko") &&
    !isPlacementDismissed(lang) &&
    realIds.length === 0 &&
    getStoredSettings()?.learning?.ftueArcSeen === true;

  // one page_view per language visit, matching LearnPage's guard against
  // StrictMode double-fires; the variant field separates map traffic from
  // classic-page traffic in session logs
  const learnViewFiredRef = useRef<string | null>(null);
  useEffect(() => {
    if (preview) return;
    if (learnViewFiredRef.current === lang) return;
    learnViewFiredRef.current = lang;
    logSessionEvent("page_view", {
      page: "learn",
      langId: lang,
      variant: "transit-map",
      completedCount: realIds.length,
    });
  }, [preview, lang, realIds.length]);

  const course = useMemo(() => getMockCourse(lang), [lang]);

  // ── tier switcher (2026-07-17) ──────────────────────────────────────
  // Whether this course has ANY n4 content — the switcher's sole render
  // gate (es/ko: false, zero visual change). Guarded per requirement 5.
  const hasN4 = useMemo(() => courseHasTier(course, "n4"), [course]);

  // Explicit choice (query param OR localStorage) pins the tier for the
  // rest of the session and skips progress-derivation entirely; absent
  // either, the tier is derived from the learner's furthest-in-progress
  // module (across the FULL course, not one tier's filtered list) so a
  // learner who has graduated N5 lands straight on the N4 line.
  const courseId = course.id;
  const [tier, setTierState] = useState<LearnTier>(() => {
    const fromParam = parseTierParam(searchParams.get("tier"));
    const fromStorage = readStoredTier(courseId);
    return fromParam ?? fromStorage ?? deriveDefaultTier(course, realSet);
  });
  // realIds hydrates asynchronously (auth/progress settle after mount) —
  // re-derive the default once real progress lands, but ONLY when nothing
  // explicit (param/storage) is pinning the tier already.
  useEffect(() => {
    if (!hasN4) return;
    const fromParam = parseTierParam(searchParams.get("tier"));
    const fromStorage = readStoredTier(courseId);
    if (fromParam || fromStorage) return;
    setTierState(deriveDefaultTier(course, realSet));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course, realSet, hasN4, courseId]);

  const effectiveTier: LearnTier = hasN4 ? tier : "n5";
  const setTier = useCallback(
    (next: LearnTier) => {
      setTierState(next);
      setOpenIdx(null);
      writeStoredTier(courseId, next);
      setSearchParams(
        (prev) => {
          const nextParams = new URLSearchParams(prev);
          nextParams.set("tier", next);
          return nextParams;
        },
        { replace: true },
      );
    },
    [courseId, setSearchParams],
  );

  // This map draws ONE tier at a time. Other tiers are real, learnable
  // modules — they just belong to their own map (each map keeps its own
  // ZONE 1/2/3, so a tier's stations must not leak into another's thirds
  // split, `buildLayout`). Untagged modules are n5: the whole shipped
  // course predates the split.
  const modules = useMemo(() => modulesForTier(course, effectiveTier), [course, effectiveTier]);
  const viewCourse = useMemo(() => ({ ...course, modules }), [course, modules]);

  const demoSet = useMemo(() => {
    const s = new Set<string>();
    const cut = Math.max(1, Math.floor(modules.length * 0.42));
    modules.slice(0, cut).forEach((m) => m.lessons.forEach((l) => s.add(l.id)));
    const cur = modules[cut];
    cur?.lessons.slice(0, Math.min(3, Math.max(0, cur.lessons.length - 1))).forEach((l) => s.add(l.id));
    return s;
  }, [modules]);
  const completedSet = demo ? demoSet : realSet;
  const profile = useMemo(
    () => (demo ? { ...realProfile, streakDays: 12, xpEarnedToday: 85, levelLabel: "Level 7" } : realProfile),
    [demo, realProfile],
  );

  const statuses = useMemo(() => modules.map((_, i) => getModuleStatus(i, completedSet, modules)), [modules, completedSet]);
  const doneCounts = useMemo(() => modules.map((m) => m.lessons.filter((l) => completedSet.has(l.id)).length), [modules, completedSet]);
  const currentIdx = useMemo(() => getCurrentModuleIndex(viewCourse, completedSet), [viewCourse, completedSet]);

  /* side quests — same wiring as LearnPage (progress patch + click routes).
   * All side-quest lesson content was DELETED 2026-07-16 pending a full
   * content remake, so both maps are empty and every quest ships
   * comingSoon. Re-add entries here as remade lessons land. */
  const SIDEQUEST_TO_LESSON: Record<string, string> = {};
  const SIDEQUEST_TO_ROUTE: Record<string, string> = {};
  // Placeholder stop ids only — they keep the 4 Travel Sprint dots on the
  // map (legsFor) but no longer resolve to lessons in LESSONS.
  const TRAVEL_SPRINT_LESSONS = [
    "ja-sidequest-travel-navigation",
    "ja-sidequest-travel-ordering",
    "ja-sidequest-travel-help",
    "ja-sidequest-travel-shopping",
  ];
  const sideQuests: SideQuest[] = useMemo(() => {
    const base = (course.sideQuests ?? []).map((q) => {
      if (q.id === "ja-travel-sprint") {
        const done = TRAVEL_SPRINT_LESSONS.filter((l) => completedSet.has(l)).length;
        return { ...q, progress: Math.round((done / TRAVEL_SPRINT_LESSONS.length) * 100) };
      }
      const lessonId = SIDEQUEST_TO_LESSON[q.id];
      if (lessonId && completedSet.has(lessonId)) return { ...q, progress: 100 };
      return q;
    });
    if (!demo) return base;
    return base.map((q, i) => (i === 0 ? { ...q, progress: 100 } : i === 1 ? { ...q, progress: 55 } : q));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course.sideQuests, completedSet, demo]);

  const onSideQuestClick = (quest: SideQuest) => {
    if (quest.comingSoon) return;
    const route = SIDEQUEST_TO_ROUTE[quest.id];
    if (route) {
      navigate(p(route));
      return;
    }
    const lessonId = SIDEQUEST_TO_LESSON[quest.id];
    if (!lessonId) return;
    navigate(p(`learn/lessons/${lessonId}`));
  };
  const isSideQuestUnlocked = (quest: SideQuest): boolean => {
    if (!quest.unlockAfter) return true;
    const m = /-m(\d+)-complete$/.exec(quest.unlockAfter);
    if (!m) return false;
    const target = modules.find((mod) => mod.id === `m${m[1]}`);
    if (!target || target.lessons.length === 0) return false;
    return target.lessons.every((l) => completedSet.has(l.id));
  };

  const { questsByAnchor, softAnchors } = useMemo(() => {
    const map = new Map<number, SideQuest[]>();
    const soft = new Set<number>();
    const spread = [0.14, 0.4, 0.62];
    let unanchored = 0;
    for (const q of sideQuests) {
      if (q.isDaily) continue;
      let anchor: number | null = null;
      if (q.unlockAfter) {
        const m = /-m(\d+)-complete$/.exec(q.unlockAfter);
        if (m) {
          const idx = modules.findIndex((mod) => mod.id === `m${m[1]}`);
          if (idx >= 0) anchor = idx;
        }
      }
      if (anchor === null) {
        anchor = Math.min(modules.length - 2, Math.max(0, Math.floor(modules.length * spread[unanchored % spread.length])));
        soft.add(anchor);
        unanchored++;
      }
      map.set(anchor, [...(map.get(anchor) ?? []), q]);
    }
    return { questsByAnchor: map, softAnchors: soft };
  }, [sideQuests, modules]);

  const legsFor = useCallback(
    (q: SideQuest): QuestLeg[] | null => {
      if (q.id !== "ja-travel-sprint") return null;
      const titles = ["Navigation", "Ordering", "Help", "Shopping"];
      return TRAVEL_SPRINT_LESSONS.map((id, i) => ({
        title: titles[i],
        lessonId: id,
        // demo paints the first two legs done to match the 55% line state
        done: demo ? i < 2 : completedSet.has(id),
      }));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [completedSet, demo],
  );

  const layout = useMemo(
    () => buildLayout(modules, statuses, doneCounts, questsByAnchor, softAnchors, legsFor, strings.zones, strings.numerals),
    [modules, statuses, doneCounts, questsByAnchor, softAnchors, legsFor, strings.zones, strings.numerals],
  );

  const open = useCallback((i: number) => setOpenIdx(i), []);
  const jumpToModule = useCallback(
    (moduleId: string) => {
      const idx = modules.findIndex((m) => m.id === moduleId);
      if (idx >= 0) setOpenIdx(idx);
    },
    [modules],
  );

  const titleText = `${strings.mapTitle} — ${course.title}`;

  // Guard: a course whose N5 tier has no drawable modules (comingSoon-only or
  // an unshipped language) would otherwise mount the map with zero stations
  // and crash. Show an empty state instead.
  if (modules.length === 0) {
    return (
      <div className={cn("tmc-root mx-auto max-w-[min(2100px,96vw)]", effectiveTier === "n4" && "tmc-tier-n4")}>
        <TransitSignageHeader title={titleText} subtitle={LEARN_HEADER_SUBTITLE} />
        {hasN4 && (
          <div className="mb-3">
            <TierTabs tier={effectiveTier} onChange={setTier} n5Label="N5 Line" n4Label="N4 Line" />
          </div>
        )}
        <div className="mt-4 rounded-md border border-border bg-surface-muted px-6 py-16 text-center">
          <p className="text-[14px] font-bold text-text-primary">
            {strings.noModulesTitle}
          </p>
          <p className="mt-1 text-[13px] text-text-muted">
            {strings.noModulesBody}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      data-lang={lang}
      className={cn(
        "tmc-root mx-auto max-w-[min(2100px,96vw)]",
        effectiveTier === "n4" && "tmc-tier-n4",
      )}
    >
      {/* signage board header */}
      <TransitSignageHeader
        title={titleText}
        subtitle={
          preview
            ? "Transit-map concept · dev preview · click stations, board quests, visit the depot"
            : LEARN_HEADER_SUBTITLE
        }
        right={
          headerRight ?? (
            <Link
              to={p("learn/classic")}
              className="rounded-md border border-border px-3 py-1 text-[12.5px] font-bold text-text-primary transition hover:bg-surface-muted"
            >
              ← Classic view
            </Link>
          )
        }
      />

      {/* tier switcher — (a) compact pill/tabs near the map header. Only
          mounted when this course has n4 content at all (requirement 5). */}
      {hasN4 && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <TierTabs tier={effectiveTier} onChange={setTier} n5Label="N5 Line" n4Label="N4 Line" />
          <span className="text-[11px] text-text-muted">
            {effectiveTier === "n4" ? strings.n4LineName : strings.lineName}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,320px)] lg:items-stretch 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <div className="relative hidden md:block">
            <NetworkMap layout={layout} currentIdx={currentIdx} lang={lang} demo={demo} onDemoChange={setDemo} demoToggle={preview} onOpen={open} onQuest={onSideQuestClick} langPath={p} />
            <ProgressFloatCard course={viewCourse} completedSet={completedSet} />
            {/* Resume button — docked inside the map boundary; fades in so
                learners can jump straight back into their current lesson.
                Hidden in preview + while the placement FTUE is up. */}
            {!preview && !showPlacement && (
              <ResumeFab course={viewCourse} completedSet={completedSet} />
            )}
          </div>
          {/* (b) end-of-line interchange banner — the graduation moment /
              the way back. Below the map rather than woven into the SVG
              geometry (see TierContinueBanner's doc comment). */}
          {hasN4 && <TierContinueBanner tier={effectiveTier} onSwitch={setTier} n4Label={strings.n4LineName} />}
          <div className="md:hidden">
            <LineDiagram layout={layout} currentIdx={currentIdx} lang={lang} onOpen={open} />
            <button className="mt-3 w-full rounded-sm border-2 border-text-primary px-3 py-2 text-[13px] font-bold text-text-primary" onClick={() => setShowMapMobile((v) => !v)}>
              {showMapMobile ? strings.hideNetworkMap : strings.viewNetworkMap}
            </button>
            {showMapMobile && (
              <div className="mt-3">
                <NetworkMap layout={layout} currentIdx={currentIdx} lang={lang} demo={demo} onDemoChange={setDemo} demoToggle={preview} onOpen={open} onQuest={onSideQuestClick} langPath={p} />
              </div>
            )}
          </div>

          {preview && (
            <p className="mt-3 max-w-[72ch] text-[13px] text-text-muted 2xl:text-[14px]">
              Demo state is on by default — flip the toggle for your real progress.
            </p>
          )}
        </div>

        <div className="hidden lg:block lg:min-h-0">
          <LearnSidebar
            profile={profile}
            course={viewCourse}
            completedSet={completedSet}
            onJumpToModule={jumpToModule}
            sideQuests={sideQuests}
            isSideQuestUnlocked={isSideQuestUnlocked}
            onSideQuestClick={onSideQuestClick}
          />
        </div>
        <div className="lg:hidden">
          <LearnSidebar
            profile={profile}
            course={viewCourse}
            completedSet={completedSet}
            onJumpToModule={jumpToModule}
            sideQuests={sideQuests}
            isSideQuestUnlocked={isSideQuestUnlocked}
            onSideQuestClick={onSideQuestClick}
          />
        </div>
      </div>

      {openIdx !== null && (
        <DistrictView
          course={viewCourse}
          index={openIdx}
          statuses={statuses}
          completedSet={completedSet}
          quests={questsByAnchor.get(openIdx) ?? []}
          legsFor={legsFor}
          onQuest={onSideQuestClick}
          onClose={() => setOpenIdx(null)}
          onNav={setOpenIdx}
        />
      )}

      {showPlacement && (
        <PlacementPrompt
          onStart={() => {
            setPlacementDismissedByUser(true);
            navigate(p("learn/placement-test"));
          }}
          onSkip={() => {
            dismissPlacement(lang ?? "ja");
            setPlacementDismissedByUser(true);
          }}
        />
      )}

    </div>
  );
}
