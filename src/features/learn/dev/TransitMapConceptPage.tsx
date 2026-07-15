/**
 * Dev-only concept preview: the learn pathway as a transit map (2026-07-15).
 *
 * Concept A — the course as a metro network (modules = stations, side quests
 * = branch loops/spurs, progress = line fill) — with click-through into
 * Concept B (a per-module "district" view where lessons are local stops).
 * Driven by REAL course data; the page also carries the classic learn-page
 * furniture (LearnSidebar side-quest rail + profile, LearnToolsRow) and a
 * split-flap "departure board" that doubles as the Continue CTA.
 *
 * Because a fresh dev profile renders an all-grey map, the preview defaults
 * to a synthesized DEMO progress state (toggle top-left of the panel swaps
 * in your real progress). Ambient layer: drifting clouds by day, moon +
 * stars in dark themes, a ghost train ambling the line, hanko seals on
 * completed stations. All motion respects prefers-reduced-motion.
 *
 * Route: /:lang/transit-preview
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLang, useLangPath } from "@/shared/hooks/useLangPath";
import { getMockCourse } from "@/shared/domain/mockCourse";
import type {
  Course,
  CourseModule,
  Lesson,
  SideQuest,
} from "@/shared/domain/course";
import {
  getCurrentModuleIndex,
  getModuleDisplay,
  getModuleStatus,
  getNextLessonIndex,
  type ModuleStatus,
} from "@/features/learn/moduleProgress";
import { useCompletedLessonIds } from "@/features/learn/hooks/useCompletedLessonIds";
import { useLearnProfile } from "@/features/learn/hooks/useLearnProfile";
import { LearnSidebar } from "@/features/learn/components/LearnSidebar";
import { LearnToolsRow } from "@/features/learn/components/LearnToolsRow";
import { cn } from "@/shared/components/ui/cn";
import "./transitMapConcept.css";

/* ── layout ──────────────────────────────────────────────────────────── */

type Pt = readonly [number, number];

const LEVELS = [356, 274, 192] as const;
const LEVEL_SEQ = [0, 1, 2, 1] as const;
const RUNS = [5, 4, 5, 3, 6, 4] as const;
const MAP_H = 620;
const QUEST_COLORS = ["var(--tmc-q0)", "var(--tmc-q1)", "var(--tmc-q2)"];

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

type QuestStop = { x: number; y: number; quest: SideQuest };
type SpurL = {
  color: string;
  d: string;
  dashed: boolean;
  stops: QuestStop[];
  label: string;
  labelX: number;
  labelY: number;
  up: boolean;
};

type DepotL = { d: string; tracks: Pt[][]; labelX: number; labelY: number };

type Layout = {
  width: number;
  mainPts: Pt[];
  stations: StationL[];
  spurs: SpurL[];
  depot: DepotL | null;
  zones: { x0: number; x1: number; label: string; numeral: string }[];
  riverX: number;
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
  zoneLabels: string[],
  zoneNumerals: string[],
): Layout {
  const stations: StationL[] = [];
  let x = 116;
  modules.forEach((m, i) => {
    const level = levelOf(i);
    const y = LEVELS[level];
    if (i > 0) {
      const prevY = LEVELS[levelOf(i - 1)];
      const gap = Math.min(148, Math.max(92, 78 + m.lessons.length * 5));
      x += prevY !== y ? Math.abs(y - prevY) + 78 : gap;
    }
    const display = getModuleDisplay(modules, i);
    stations.push({
      x,
      y,
      // Lowest two levels label below the track, top level labels above —
      // keeps label bands from colliding across adjacent runs.
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

  const mainPts: Pt[] = [[stations[0].x - 60, stations[0].y]];
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

  /* quest branch lines — loops that rejoin when geometry allows, spurs
     otherwise; direction away from the track band */
  const spurs: SpurL[] = [];
  let colorIdx = 0;
  for (const [anchor, quests] of questsByAnchor) {
    const a = stations[anchor];
    const up = a.y === LEVELS[2];
    const loopY = up ? 116 : 474;
    const dx = Math.abs(loopY - a.y);
    const shown = quests.slice(0, 3);
    const color = QUEST_COLORS[colorIdx % QUEST_COLORS.length];
    colorIdx++;

    // same-level rejoin candidate within the next 4 stations (span must fit
    // the stop labels — ~80px wide each — without grazing)
    let rejoin: StationL | null = null;
    if (shown.length >= 2) {
      for (let j = anchor + 1; j <= Math.min(anchor + 4, stations.length - 1); j++) {
        if (stations[j].y === a.y) {
          const span = stations[j].x - a.x - 2 * dx;
          if (span >= shown.length * 100 + 40) {
            rejoin = stations[j];
            break;
          }
        }
      }
    }

    let d: string;
    let stops: QuestStop[];
    let labelX: number;
    if (rejoin) {
      const from = a.x + dx;
      const to = rejoin.x - dx;
      d = dOf([
        [a.x, a.y],
        [from, loopY],
        [to, loopY],
        [rejoin.x, rejoin.y],
      ]);
      stops = shown.map((quest, k) => ({
        x: from + ((to - from) / (shown.length + 1)) * (k + 1),
        y: loopY,
        quest,
      }));
      labelX = (from + to) / 2;
    } else {
      const end = a.x + dx + shown.length * 96 + 50;
      d = dOf([
        [a.x, a.y],
        [a.x + dx, loopY],
        [end, loopY],
      ]);
      stops = shown.map((quest, k) => ({
        x: a.x + dx + 70 + k * 96,
        y: loopY,
        quest,
      }));
      labelX = a.x + dx + (end - a.x - dx) / 2;
    }
    spurs.push({
      color,
      d,
      dashed: a.status === "locked",
      stops,
      // single-quest lines skip the line name — the stop label carries it
      label: shown.length > 1 ? `${shown[0].title} Line` : "",
      labelX,
      // line name sits OUTSIDE the stop-label band: below everything on
      // down-loops, in the sky above the emoji row on up-loops
      labelY: up ? loopY - 42 : loopY + 44,
      up,
    });
  }

  /* practice depot: first low-level station after the midpoint without a
     branch — the rail yard is the practice hub */
  let depot: DepotL | null = null;
  for (let i = Math.floor(stations.length * 0.35); i < stations.length - 1; i++) {
    const s = stations[i];
    if (s.y >= LEVELS[1] && !s.interchange) {
      // drop the yard well below the station-label band (labels end ~y+45)
      const yardY = s.y + 74;
      if (Math.abs(yardY - 474) < 44) continue; // keep clear of down-loops
      depot = {
        d: dOf([
          [s.x, s.y],
          [s.x + 52, yardY - 22],
          [s.x + 52, yardY],
        ]),
        tracks: [
          [[s.x + 52, yardY - 8], [s.x + 132, yardY - 8]],
          [[s.x + 52, yardY], [s.x + 148, yardY]],
          [[s.x + 52, yardY + 8], [s.x + 118, yardY + 8]],
        ],
        labelX: s.x + 52,
        labelY: yardY + 26,
      };
      break;
    }
  }

  const width = last.x + 190;
  const zones: Layout["zones"] = [];
  if (stations.length >= 9 && zoneLabels.length === 3) {
    const third = Math.ceil(stations.length / 3);
    const bounds = [
      48,
      (stations[third - 1].x + stations[third].x) / 2,
      (stations[Math.min(2 * third - 1, stations.length - 2)].x +
        stations[Math.min(2 * third, stations.length - 1)].x) /
        2,
      width - 30,
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
  return { width, mainPts, stations, spurs, depot, zones, riverX: width * 0.55 };
}

/* ── per-language strings ────────────────────────────────────────────── */

const STRINGS: Record<
  string,
  {
    lineName: string;
    youAreHere: string;
    zones: string[];
    numerals: string[];
    mapTitle: string;
    seal: string;
    river: string;
    depot: string;
    boardNext: string;
    boardTransfer: string;
    boardFare: string;
  }
> = {
  ja: {
    lineName: "本線 Main Line",
    youAreHere: "現在地 YOU ARE HERE",
    zones: ["ZONE 1 · はじまり", "ZONE 2 · 日常", "ZONE 3 · 出発"],
    numerals: ["一", "二", "三"],
    mapTitle: "学習路線図",
    seal: "済",
    river: "川",
    depot: "車両基地 Practice Depot →",
    boardNext: "つぎ NEXT",
    boardTransfer: "のりかえ TRANSFER",
    boardFare: "ICカード FARE CARD",
  },
  es: {
    lineName: "Línea principal",
    youAreHere: "¡ESTÁS AQUÍ!",
    zones: ["ZONA 1 · Fundamentos", "ZONA 2 · Vida diaria", "ZONA 3 · De viaje"],
    numerals: ["1", "2", "3"],
    mapTitle: "Mapa de la línea",
    seal: "✓",
    river: "río",
    depot: "Depósito · Práctica →",
    boardNext: "PRÓXIMA",
    boardTransfer: "TRANSBORDO",
    boardFare: "TARJETA",
  },
};
const stringsFor = (lang: string) => STRINGS[lang] ?? STRINGS.es;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ── small pieces ────────────────────────────────────────────────────── */

function TrainMascot({ label }: { label: string }) {
  return (
    <g className="tmc-mascot" aria-hidden>
      <rect x={-58} y={-82} width={116} height={20} rx={10} style={{ fill: "var(--tmc-ink)" }} />
      <text x={0} y={-68} textAnchor="middle" style={{ fill: "var(--tmc-panel)", fontSize: 9.5, fontWeight: 800 }}>
        {label}
      </text>
      <rect x={-18} y={-58} width={36} height={20} rx={6} style={{ fill: "var(--tmc-line-main)" }} />
      <rect x={-18} y={-58} width={36} height={5} rx={2.5} style={{ fill: "var(--tmc-ink)", opacity: 0.35 }} />
      <circle cx={-7} cy={-47} r={4.6} style={{ fill: "var(--tmc-panel)" }} />
      <circle cx={7} cy={-47} r={4.6} style={{ fill: "var(--tmc-panel)" }} />
      <circle className="tmc-mascot-eye" cx={-6} cy={-47} r={1.9} style={{ fill: "var(--tmc-ink)" }} />
      <circle className="tmc-mascot-eye" cx={8} cy={-47} r={1.9} style={{ fill: "var(--tmc-ink)" }} />
      <path d="M -3 -41.5 Q 0 -39.5 3 -41.5" fill="none" style={{ stroke: "var(--tmc-panel)", strokeWidth: 1.4, strokeLinecap: "round" }} />
      <circle cx={-10} cy={-37} r={3} style={{ fill: "var(--tmc-ink)" }} />
      <circle cx={10} cy={-37} r={3} style={{ fill: "var(--tmc-ink)" }} />
    </g>
  );
}

function GhostTrain() {
  return (
    <g className="tmc-ghost" aria-hidden>
      <rect x={-11} y={-14} width={22} height={11} rx={4} style={{ fill: "var(--tmc-line-main)" }} />
      <circle cx={-4.5} cy={-8.5} r={2.2} style={{ fill: "var(--tmc-panel)" }} />
      <circle cx={4.5} cy={-8.5} r={2.2} style={{ fill: "var(--tmc-panel)" }} />
    </g>
  );
}

/** Deterministic pseudo-random star field (Math.random is banned in tests
 *  and stars must not reshuffle on re-render). */
const STARS = Array.from({ length: 18 }, (_, i) => ({
  x: 90 + ((i * 419) % 1901),
  y: 14 + ((i * 137) % 82),
  r: 0.9 + (i % 3) * 0.5,
  delay: (i % 7) * 0.5,
}));

function SkyLayer({ width }: { width: number }) {
  return (
    <g pointerEvents="none" aria-hidden>
      {/* day */}
      <g className="tmc-day">
        <rect x={0} y={0} width={width} height={112} fill="url(#tmc-sky-day)" />
        {[0, 1, 2].map((i) => (
          <g key={i} className={cn("tmc-cloud", i === 1 && "b")} style={{ animationDelay: `${-i * 55}s` }}>
            <g transform={`translate(${120 + i * 340} ${38 + i * 18})`} opacity={0.55}>
              <ellipse cx={0} cy={0} rx={34} ry={12} style={{ fill: "var(--tmc-panel)" }} />
              <ellipse cx={22} cy={-6} rx={22} ry={10} style={{ fill: "var(--tmc-panel)" }} />
              <ellipse cx={-20} cy={-4} rx={18} ry={8} style={{ fill: "var(--tmc-panel)" }} />
            </g>
          </g>
        ))}
      </g>
      {/* night */}
      <g className="tmc-night">
        <rect x={0} y={0} width={width} height={112} fill="url(#tmc-sky-night)" />
        <circle cx={210} cy={44} r={16} style={{ fill: "#F5EDCf", opacity: 0.9 }} />
        <circle cx={203} cy={38} r={14} fill="url(#tmc-sky-night)" />
        {STARS.filter((s) => s.x < width - 60).map((s, i) => (
          <circle
            key={i}
            className="tmc-star"
            cx={s.x}
            cy={s.y}
            r={s.r}
            style={{ fill: "#EDE8D8", animationDelay: `${s.delay}s` }}
          />
        ))}
      </g>
    </g>
  );
}

/* ── network map (Concept A) ─────────────────────────────────────────── */

function NetworkMap({
  layout,
  currentIdx,
  lang,
  demo,
  onDemoChange,
  onOpen,
  langPath,
}: {
  layout: Layout;
  currentIdx: number;
  lang: string;
  demo: boolean;
  onDemoChange: (v: boolean) => void;
  onOpen: (index: number) => void;
  langPath: (p: string) => string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<SVGPathElement>(null);
  const trainRef = useRef<SVGGElement>(null);
  const ghostRef = useRef<SVGGElement>(null);
  const [tip, setTip] = useState<StationL | null>(null);
  const strings = stringsFor(lang);

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

  /* line-draw + mascot ride on mount / state change */
  useEffect(() => {
    const rail = railRef.current;
    const train = trainRef.current;
    if (!rail || !train) return;
    const startLen = lenAtStation(layout.mainPts, segs, layout.stations[0].x, layout.stations[0].y);
    const place = (len: number) => {
      const [px, py] = pointAt(layout.mainPts, segs, len);
      train.setAttribute("transform", `translate(${px} ${py})`);
    };
    if (prefersReducedMotion()) {
      place(lenCurrent);
      return;
    }
    const drawLen = rail.getTotalLength();
    rail.style.transition = "none";
    rail.style.strokeDasharray = `${drawLen}`;
    rail.style.strokeDashoffset = `${drawLen}`;
    place(startLen);
    void rail.getBoundingClientRect();
    rail.style.transition = "";
    rail.style.strokeDashoffset = "0";

    let raf = 0;
    const rideMs = 1500;
    const t0 = performance.now() + 650;
    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - t0) / rideMs));
      place(startLen + (lenCurrent - startLen) * ease(t));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [layout, segs, lenCurrent]);

  /* ghost train ambling the whole line on a slow loop */
  useEffect(() => {
    const ghost = ghostRef.current;
    if (!ghost || prefersReducedMotion()) return;
    let raf = 0;
    const LOOP_MS = 44000;
    const tick = (now: number) => {
      const [px, py] = pointAt(layout.mainPts, segs, ((now % LOOP_MS) / LOOP_MS) * total);
      ghost.setAttribute("transform", `translate(${px} ${py})`);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [layout, segs, total]);

  /* drag + wheel panning */
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let drag: { x: number; left: number } | null = null;
    const down = (e: PointerEvent) => {
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
        el.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    el.addEventListener("wheel", wheel, { passive: false });
    el.scrollLeft = Math.max(0, current.x - el.clientWidth * 0.4);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      el.removeEventListener("wheel", wheel);
    };
  }, [current.x]);

  const stationFill = (s: StationL): { fill: string; stroke: string } => {
    if (s.status === "completed") return { fill: "var(--tmc-done)", stroke: "var(--tmc-panel)" };
    if (s.status === "current") return { fill: "var(--tmc-panel)", stroke: "var(--tmc-line-main)" };
    return { fill: "var(--tmc-panel)", stroke: "var(--tmc-locked)" };
  };

  return (
    <div className="relative rounded-md border-2 border-text-primary bg-surface shadow-card overflow-hidden">
      {/* demo/real toggle */}
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

      {/* legend */}
      <div
        data-tm="legend"
        className="absolute right-3 top-3 z-[5] grid gap-1.5 rounded-sm border border-border bg-surface px-3.5 py-2.5 text-[11px] shadow-card min-w-[184px]"
      >
        <div className="flex items-center gap-2">
          <span className="h-[5px] w-[22px] rounded-full" style={{ background: "var(--tmc-line-main)" }} />
          <span>{strings.lineName}</span>
        </div>
        {layout.spurs.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="flex gap-0.5">
              {QUEST_COLORS.map((c) => (
                <span key={c} className="h-[5px] w-[7px] rounded-full" style={{ background: c }} />
              ))}
            </span>
            <span>Side-quest lines</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span
            className="h-[5px] w-[22px] rounded-full"
            style={{ background: "repeating-linear-gradient(90deg, var(--tmc-locked) 0 5px, transparent 5px 9px)" }}
          />
          <span>Locked / planned</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="grid h-[13px] w-[13px] place-items-center rounded-full text-[7px] font-bold text-white" style={{ background: "var(--tmc-seal)" }}>
            {strings.seal}
          </span>
          <span>Station complete</span>
        </div>
      </div>

      <div ref={scrollerRef} className="tmc-map-scroll">
        <div className="tmc-map-inner" style={{ width: layout.width }}>
          <svg
            viewBox={`0 0 ${layout.width} ${MAP_H}`}
            width={layout.width}
            height={MAP_H}
            role="img"
            aria-label="Course transit map"
          >
            <defs>
              <linearGradient id="tmc-sky-day" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#BEE0F2" stopOpacity="0.65" />
                <stop offset="100%" stopColor="#BEE0F2" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="tmc-sky-night" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#141B33" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#141B33" stopOpacity="0" />
              </linearGradient>
            </defs>

            <SkyLayer width={layout.width} />

            {/* river — soft geography behind everything */}
            <g pointerEvents="none" aria-hidden>
              <path
                d={`M ${layout.riverX} 92 C ${layout.riverX - 40} 220, ${layout.riverX + 70} 330, ${layout.riverX + 10} 440 S ${layout.riverX - 60} 570, ${layout.riverX - 30} 618`}
                fill="none"
                strokeWidth={16}
                strokeLinecap="round"
                style={{ stroke: "var(--tmc-river)", opacity: 0.28 }}
              />
              <text x={layout.riverX + 18} y={150} style={{ fill: "var(--tmc-river)", fontSize: 13, fontWeight: 700, opacity: 0.75 }}>
                {strings.river}
              </text>
            </g>

            {/* zones */}
            {layout.zones.map((z, i) => (
              <g key={z.label}>
                <rect
                  x={z.x0}
                  y={124}
                  width={z.x1 - z.x0}
                  height={392}
                  fill="currentColor"
                  opacity={i % 2 === 1 ? 0.03 : 0.012}
                />
                {i > 0 && (
                  <line x1={z.x0} y1={124} x2={z.x0} y2={516} style={{ stroke: "var(--tmc-border)" }} strokeDasharray="2 6" />
                )}
                {/* zone label rides the bottom edge — the top band belongs
                    to level-2 station labels and the sky */}
                <text x={z.x0 + 18} y={550} data-tm="zone" style={{ fill: "var(--tmc-muted)", fontSize: 10.5, letterSpacing: "0.17em", fontWeight: 600 }}>
                  {z.label}
                </text>
                <text x={z.x0 + 22} y={226} aria-hidden style={{ fill: "currentColor", opacity: 0.055, fontSize: 64, fontWeight: 800 }}>
                  {z.numeral}
                </text>
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
                {spur.label && (
                  <text
                    x={spur.labelX}
                    y={spur.labelY}
                    textAnchor="middle"
                    data-tm="label"
                    style={{ fill: spur.dashed ? "var(--tmc-locked)" : spur.color, fontSize: 10.5, fontWeight: 800 }}
                  >
                    {spur.label}
                  </text>
                )}
                {spur.stops.map(({ x, y, quest }) => {
                  const questDone = quest.progress >= 100;
                  return (
                    <g key={quest.id} data-tm="quest">
                      <rect
                        x={x - 8}
                        y={y - 8}
                        width={16}
                        height={16}
                        rx={3}
                        transform={`rotate(45 ${x} ${y})`}
                        strokeWidth={3}
                        style={{
                          fill: questDone ? spur.color : "var(--tmc-panel)",
                          stroke: spur.dashed ? "var(--tmc-locked)" : spur.color,
                        }}
                      />
                      <text x={x} y={spur.up ? y + 28 : y - 16} textAnchor="middle" style={{ fontSize: 13 }}>
                        {quest.emoji}
                      </text>
                      <text
                        x={x}
                        y={spur.up ? y - 18 : y + 27}
                        textAnchor="middle"
                        data-tm="label"
                        style={{ fill: "var(--tmc-muted)", fontSize: 9.5 }}
                      >
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
                  <text x={layout.depot.labelX} y={layout.depot.labelY} data-tm="label" style={{ fill: "var(--tmc-muted)", fontSize: 10, fontWeight: 700 }}>
                    {strings.depot}
                  </text>
                </g>
              </Link>
            )}

            {/* main line: ahead dashed under the drawn done-section */}
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
            <text x={layout.stations[0].x - 8} y={layout.stations[0].y - 46} data-tm="label" style={{ fill: "var(--tmc-line-main)", fontSize: 11, fontWeight: 800 }}>
              {strings.lineName}
            </text>

            {/* ghost train (under stations) */}
            <g ref={ghostRef}>
              <GhostTrain />
            </g>

            {/* stations */}
            {layout.stations.map((s) => {
              const dir = s.labelSide === "top" ? -1 : 1;
              const baseOffset = s.interchange || s.terminal ? 36 : 30;
              const titleY = s.y + dir * baseOffset + (dir < 0 ? 0 : 8);
              const badgeY = titleY + dir * 15;
              const short = s.module.title.length > 18 ? `${s.module.title.slice(0, 17)}…` : s.module.title;
              const paint = stationFill(s);
              return (
                <g
                  key={s.module.id}
                  className="tmc-station"
                  data-tm="station"
                  tabIndex={0}
                  role="button"
                  aria-label={`${s.badge} ${s.module.title}, ${s.done} of ${s.total} lessons`}
                  onMouseEnter={() => setTip(s)}
                  onMouseLeave={() => setTip(null)}
                  onFocus={() => setTip(s)}
                  onBlur={() => setTip(null)}
                  onClick={() => onOpen(s.index)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onOpen(s.index);
                    }
                  }}
                >
                  <circle className="tmc-hit" cx={s.x} cy={s.y} r={22} fill="transparent" stroke="none" />
                  {s.status === "current" && (
                    <circle className="tmc-pulse" cx={s.x} cy={s.y} r={13} fill="none" strokeWidth={3} style={{ stroke: "var(--tmc-line-main)" }} />
                  )}
                  <g className="tmc-station-glyph" style={{ animationDelay: `${s.index * 45}ms` }}>
                    {s.terminal ? (
                      <>
                        <rect x={s.x - 13} y={s.y - 13} width={26} height={26} rx={5} strokeWidth={4} style={{ fill: "var(--tmc-panel)", stroke: s.status === "completed" ? "var(--tmc-done)" : "var(--tmc-locked)" }} />
                        <rect x={s.x - 30} y={s.y - 58} width={60} height={20} rx={3} style={{ fill: "var(--tmc-ink)" }} />
                        <text x={s.x} y={s.y - 44} textAnchor="middle" style={{ fill: "var(--tmc-panel)", fontSize: 10, fontWeight: 800 }}>
                          GOAL
                        </text>
                        <line x1={s.x} y1={s.y - 38} x2={s.x} y2={s.y - 15} style={{ stroke: "var(--tmc-ink)" }} strokeWidth={1.5} />
                      </>
                    ) : s.isReview ? (
                      <rect x={s.x - 7} y={s.y - 7} width={14} height={14} rx={3} strokeWidth={3} style={{ fill: paint.fill, stroke: s.status === "completed" ? "var(--tmc-panel)" : paint.stroke }} />
                    ) : s.interchange ? (
                      <>
                        <circle cx={s.x} cy={s.y} r={11.5} strokeWidth={3.5} style={{ fill: "var(--tmc-panel)", stroke: "var(--tmc-ink)" }} />
                        <circle cx={s.x} cy={s.y} r={4.5} style={{ fill: s.status === "locked" ? "var(--tmc-locked)" : "var(--tmc-line-main)" }} />
                      </>
                    ) : (
                      <circle
                        cx={s.x}
                        cy={s.y}
                        r={s.status === "current" ? 9.5 : 8}
                        strokeWidth={s.status === "current" ? 4.5 : 3.5}
                        style={paint}
                      />
                    )}
                    {/* hanko seal on completed stations */}
                    {s.status === "completed" && !s.terminal && (
                      <g transform={`rotate(-14 ${s.x + 13} ${s.y - 13})`} aria-hidden>
                        <circle cx={s.x + 13} cy={s.y - 13} r={7.5} style={{ fill: "var(--tmc-seal)", opacity: 0.94 }} />
                        <text x={s.x + 13} y={s.y - 10.5} textAnchor="middle" style={{ fill: "#fff", fontSize: 7.5, fontWeight: 800 }}>
                          {strings.seal}
                        </text>
                      </g>
                    )}
                  </g>
                  <text x={s.x} y={dir < 0 ? badgeY : titleY} textAnchor="middle" data-tm="label" style={{ fill: "var(--tmc-ink)", fontSize: 12, fontWeight: 800 }}>
                    {s.badge}
                  </text>
                  <text x={s.x} y={dir < 0 ? titleY : badgeY} textAnchor="middle" data-tm="label" style={{ fill: "var(--tmc-muted)", fontSize: 9.5 }}>
                    {short}
                  </text>
                </g>
              );
            })}

            {/* the rider */}
            <g ref={trainRef}>
              <TrainMascot label={strings.youAreHere} />
            </g>
          </svg>

          {tip && (
            <div
              data-tm="tip"
              className="tmc-tip rounded-sm border-2 border-text-primary bg-surface px-3.5 py-3 shadow-popover"
              style={{
                left: Math.max(8, Math.min(tip.x - 116, layout.width - 244)),
                top: tip.labelSide === "top" ? tip.y + 40 : tip.y - 148,
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
      <div className="pointer-events-none absolute bottom-2.5 left-3.5 z-[5] rounded-full border border-border bg-surface px-3 py-0.5 text-[11px] text-text-muted">
        drag or scroll sideways · click a station
      </div>
    </div>
  );
}

/* ── departure board ─────────────────────────────────────────────────── */

function DepartureBoard({
  rows,
}: {
  rows: Array<{ key: string; tag: string; body: React.ReactNode; action?: React.ReactNode }>;
}) {
  return (
    <div className="mt-3 overflow-hidden rounded-md border-2 border-text-primary shadow-card" style={{ background: "var(--color-text-primary)", color: "var(--color-surface)" }}>
      <div className="flex items-center justify-between px-4 pt-2.5 pb-1.5 text-[10px] uppercase tracking-[0.22em] opacity-60">
        <span>Departures · 発車標</span>
        <span>{rows.length} services</span>
      </div>
      {rows.map((r, i) => (
        <div
          key={r.key}
          className="tmc-board-row flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/10 px-4 py-2.5"
          style={{ "--i": i } as CSSProperties}
        >
          <span className="w-[118px] flex-none text-[10.5px] font-bold tracking-[0.14em] opacity-70">{r.tag}</span>
          <span className="min-w-0 flex-1 text-[13.5px] font-bold">{r.body}</span>
          {r.action}
        </div>
      ))}
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
      <div className="flex items-center gap-3 px-4 py-3" style={{ background: "var(--color-text-primary)", color: "var(--color-surface)" }}>
        <div className="grid h-8 w-8 flex-none place-items-center rounded-full border-2 text-[13px] font-extrabold" style={{ borderColor: "var(--color-surface)", background: "var(--tmc-line-main)", color: "#fff" }}>
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
                    <span className="ml-1.5 align-middle" aria-hidden>
                      🚃
                    </span>
                  )}
                  {s.status === "completed" && (
                    <span className="ml-1.5 inline-grid h-[15px] w-[15px] place-items-center rounded-full align-middle text-[8px] font-bold text-white" style={{ background: "var(--tmc-seal)" }}>
                      {strings.seal}
                    </span>
                  )}
                </span>
                <span className="text-[11px] text-text-muted">
                  {s.done}/{s.total} lessons
                  {s.terminal ? " · terminal" : ""}
                </span>
                {s.interchange && (
                  <span className="mt-0.5 w-fit rounded-full px-2 py-[1px] text-[10px] font-bold text-white" style={{ background: questColor.get(s.index) }}>
                    ⇄ Side quests here
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

/* ── district view (Concept B) ───────────────────────────────────────── */

function DistrictView({
  course,
  index,
  statuses,
  completedSet,
  quests,
  onClose,
  onNav,
}: {
  course: Course;
  index: number;
  statuses: ModuleStatus[];
  completedSet: ReadonlySet<string>;
  quests: SideQuest[];
  onClose: () => void;
  onNav: (index: number) => void;
}) {
  const p = useLangPath();
  const mod = course.modules[index];
  const status = statuses[index];
  const nextIdx = getNextLessonIndex(mod.lessons, completedSet);
  const done = mod.lessons.filter((l) => completedSet.has(l.id)).length;
  const badge = getModuleDisplay(course.modules, index).badgeLabel;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const stops = useMemo(() => {
    let x = 76;
    return mod.lessons.map((lesson, k) => {
      if (k > 0) x += lesson.kind === "recap" ? 112 : 92;
      const isDone = completedSet.has(lesson.id);
      const isCurrent = status === "current" && k === nextIdx && !isDone;
      return { lesson, k, x, isDone, isCurrent };
    });
  }, [mod, completedSet, status, nextIdx]);
  const lastX = stops.length ? stops[stops.length - 1].x : 76;
  const svgW = lastX + 120;
  const questY = 196;

  const lessonHref = (lesson: Lesson) =>
    lesson.kind === "alphabet" && lesson.alphabetId
      ? p(`practice/alphabet/${lesson.alphabetId}/learn`)
      : p(`learn/lessons/${lesson.id}`);

  const stopGlyph = (s: (typeof stops)[number], isLast: boolean) => (
    <g className="tmc-d-stop">
      {isLast ? (
        <>
          <circle cx={s.x} cy={120} r={12} strokeWidth={3.5} style={{ fill: "var(--tmc-panel)", stroke: "var(--tmc-ink)" }} />
          <circle cx={s.x} cy={120} r={4.5} style={{ fill: s.isDone ? "var(--tmc-done)" : "var(--tmc-locked)" }} />
        </>
      ) : (
        <circle
          cx={s.x}
          cy={120}
          r={s.isCurrent ? 10 : 7.5}
          strokeWidth={s.isCurrent ? 4.5 : 3}
          style={{
            fill: s.isDone ? "var(--tmc-done)" : "var(--tmc-panel)",
            stroke: s.isDone
              ? "var(--tmc-panel)"
              : s.isCurrent
                ? "var(--tmc-line-main)"
                : status === "locked"
                  ? "var(--tmc-locked)"
                  : "var(--tmc-line-main)",
          }}
        />
      )}
    </g>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${mod.title} district`}
    >
      <div className="tmc-district-panel w-full max-w-[900px] overflow-hidden rounded-md border-2 border-text-primary bg-surface shadow-popover" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-4 px-5 py-4" style={{ background: "var(--color-text-primary)", color: "var(--color-surface)" }}>
          <div className="grid h-11 w-11 flex-none place-items-center rounded-full border-[3px] text-[15px] font-extrabold" style={{ borderColor: "var(--color-surface)", background: "var(--tmc-line-main)", color: "#fff" }}>
            {badge}
          </div>
          <div className="min-w-0 flex-1">
            {mod.eyebrow && <div className="text-[10.5px] uppercase tracking-[0.14em] opacity-70">{mod.eyebrow}</div>}
            <div className="truncate text-[19px] font-extrabold leading-tight">{mod.title}</div>
            <div className="text-[12px] opacity-75">
              {done}/{mod.lessons.length} lessons
              {status === "locked" ? " · locked — complete the previous station" : ""}
            </div>
          </div>
          <button onClick={onClose} aria-label="Close district view" className="grid h-9 w-9 flex-none place-items-center rounded-full text-[16px] font-bold hover:opacity-75" style={{ border: "2px solid var(--color-surface)" }}>
            ✕
          </button>
        </div>

        <div className="overflow-x-auto">
          <svg viewBox={`0 0 ${svgW} 260`} width={svgW} height={260} className="block" role="img" aria-label={`${mod.title} lessons`}>
            <text x={20} y={40} style={{ fill: "var(--tmc-muted)", fontSize: 10, letterSpacing: "0.16em", fontWeight: 600 }}>
              DISTRICT VIEW · LOCAL STOPS
            </text>
            {index > 0 && (
              <text x={20} y={112} style={{ fill: "var(--tmc-muted)", fontSize: 10 }}>
                ← {getModuleDisplay(course.modules, index - 1).badgeLabel}
              </text>
            )}
            {index < course.modules.length - 1 && (
              <text x={svgW - 20} y={112} textAnchor="end" style={{ fill: "var(--tmc-muted)", fontSize: 10 }}>
                {getModuleDisplay(course.modules, index + 1).badgeLabel} →
              </text>
            )}
            {quests.length > 0 && stops.length > 3 && (
              <>
                <path
                  d={dOf([
                    [stops[1].x, 120],
                    [stops[1].x + 62, questY],
                    [stops[stops.length - 2].x - 62, questY],
                    [stops[stops.length - 2].x, 120],
                  ])}
                  fill="none"
                  strokeWidth={4.5}
                  strokeLinejoin="round"
                  style={{ stroke: "var(--tmc-q1)" }}
                />
                {quests.slice(0, 3).map((q, k) => {
                  const qx = stops[1].x + 100 + k * 110;
                  return (
                    <g key={q.id}>
                      <rect x={qx - 7} y={questY - 7} width={14} height={14} rx={3} transform={`rotate(45 ${qx} ${questY})`} strokeWidth={3} style={{ fill: "var(--tmc-panel)", stroke: "var(--tmc-q1)" }} />
                      <text x={qx} y={questY - 14} textAnchor="middle" style={{ fontSize: 12 }}>
                        {q.emoji}
                      </text>
                      <text x={qx} y={questY + 26} textAnchor="middle" data-tm="d-label" style={{ fill: "var(--tmc-muted)", fontSize: 9.5 }}>
                        {q.title.length > 18 ? `${q.title.slice(0, 17)}…` : q.title}
                      </text>
                    </g>
                  );
                })}
              </>
            )}
            <path
              d={dOf([[24, 120], [svgW - 24, 120]])}
              fill="none"
              strokeWidth={7}
              strokeLinecap="round"
              style={{ stroke: status === "locked" ? "var(--tmc-locked)" : "var(--tmc-line-main)" }}
              strokeDasharray={status === "locked" ? "7 8" : undefined}
            />
            {stops.map((s) => {
              const isLast = s.k === stops.length - 1;
              const above = s.k % 2 === 0;
              const short = s.lesson.title.length > 13 ? `${s.lesson.title.slice(0, 12)}…` : s.lesson.title;
              const glyph = stopGlyph(s, isLast);
              const label = (
                <>
                  <text x={s.x} y={above ? 88 : 152} textAnchor="middle" data-tm="d-label" style={{ fill: "var(--tmc-ink)", fontSize: 11, fontWeight: 700 }}>
                    {s.lesson.kind === "recap" ? "Recap" : isLast ? "★" : `L${s.k + 1}`}
                  </text>
                  <text x={s.x} y={above ? 74 : 166} textAnchor="middle" data-tm="d-label" style={{ fill: "var(--tmc-muted)", fontSize: 9 }}>
                    {short}
                  </text>
                </>
              );
              return status === "locked" ? (
                <g key={s.lesson.id} opacity={0.75}>
                  {glyph}
                  {label}
                </g>
              ) : (
                <Link key={s.lesson.id} to={lessonHref(s.lesson)} aria-label={`${s.lesson.title}${s.isDone ? ", completed" : ""}`}>
                  {glyph}
                  {label}
                  {s.isCurrent && <circle className="tmc-pulse" cx={s.x} cy={120} r={12} fill="none" strokeWidth={2.5} style={{ stroke: "var(--tmc-line-main)" }} />}
                </Link>
              );
            })}
          </svg>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-3">
          <button className="rounded-sm border border-border px-3 py-1.5 text-[12.5px] font-semibold text-text-secondary hover:bg-surface-muted disabled:opacity-40" disabled={index === 0} onClick={() => onNav(index - 1)}>
            ← Previous station
          </button>
          <button className="rounded-sm border border-border px-3 py-1.5 text-[12.5px] font-semibold text-text-secondary hover:bg-surface-muted disabled:opacity-40" disabled={index === course.modules.length - 1} onClick={() => onNav(index + 1)}>
            Next station →
          </button>
          <div className="flex-1" />
          {status !== "locked" && stops[nextIdx] && (
            <Link to={lessonHref(stops[nextIdx].lesson)} className="rounded-sm bg-accent px-4 py-1.5 text-[12.5px] font-bold text-accent-foreground hover:bg-accent-hover">
              Continue L{nextIdx + 1} →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── page ────────────────────────────────────────────────────────────── */

export default function TransitMapConceptPage() {
  const lang = useLang();
  const p = useLangPath();
  const navigate = useNavigate();
  const realIds = useCompletedLessonIds();
  const realSet = useMemo(() => new Set(realIds), [realIds]);
  const profile = useLearnProfile();
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [showMapMobile, setShowMapMobile] = useState(false);
  const [demo, setDemo] = useState(true);
  const strings = stringsFor(lang);

  const course = useMemo(() => getMockCourse(lang), [lang]);
  const modules = useMemo(() => course.modules.filter((m) => !m.comingSoon && m.lessons.length > 0), [course]);
  const viewCourse = useMemo(() => ({ ...course, modules }), [course, modules]);

  /* demo progress: a flattering mid-course state so the concept reads even
     on a fresh profile — first ~42% of stations sealed, current mid-map */
  const demoSet = useMemo(() => {
    const s = new Set<string>();
    const cut = Math.max(1, Math.floor(modules.length * 0.42));
    modules.slice(0, cut).forEach((m) => m.lessons.forEach((l) => s.add(l.id)));
    const cur = modules[cut];
    cur?.lessons.slice(0, Math.min(3, Math.max(0, cur.lessons.length - 1))).forEach((l) => s.add(l.id));
    return s;
  }, [modules]);
  const completedSet = demo ? demoSet : realSet;

  const statuses = useMemo(() => modules.map((_, i) => getModuleStatus(i, completedSet, modules)), [modules, completedSet]);
  const doneCounts = useMemo(() => modules.map((m) => m.lessons.filter((l) => completedSet.has(l.id)).length), [modules, completedSet]);
  const currentIdx = useMemo(() => getCurrentModuleIndex(viewCourse, completedSet), [viewCourse, completedSet]);

  /* side quests — same wiring as LearnPage (progress patch + click routes) */
  const SIDEQUEST_TO_LESSON: Record<string, string> = {
    "ja-survival-phrasebook": "ja-sidequest-survival-phrases",
    "ko-survival-phrasebook": "ko-sidequest-survival-phrases",
  };
  const SIDEQUEST_TO_ROUTE: Record<string, string> = {
    "ja-travel-sprint": "learn/travel-sprint",
  };
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
    // demo paint: first line complete, second en route
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

  /* quest → station anchors: parse the module number out of unlockAfter;
     available-now quests spread along the first two-thirds of the line so
     branches don't pile at the start; daily quests stay rail-only */
  const questsByAnchor = useMemo(() => {
    const map = new Map<number, SideQuest[]>();
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
        unanchored++;
      }
      map.set(anchor, [...(map.get(anchor) ?? []), q]);
    }
    return map;
  }, [sideQuests, modules]);

  const layout = useMemo(
    () => buildLayout(modules, statuses, doneCounts, questsByAnchor, strings.zones, strings.numerals),
    [modules, statuses, doneCounts, questsByAnchor, strings.zones, strings.numerals],
  );

  const open = useCallback((i: number) => setOpenIdx(i), []);
  const jumpToModule = useCallback(
    (moduleId: string) => {
      const idx = modules.findIndex((m) => m.id === moduleId);
      if (idx >= 0) setOpenIdx(idx);
    },
    [modules],
  );

  /* departure board rows */
  const currentModule = modules[currentIdx];
  const nextLessonIdx = currentModule ? getNextLessonIndex(currentModule.lessons, completedSet) : 0;
  const nextLesson = currentModule?.lessons[nextLessonIdx];
  const nextHref = nextLesson
    ? nextLesson.kind === "alphabet" && nextLesson.alphabetId
      ? p(`practice/alphabet/${nextLesson.alphabetId}/learn`)
      : p(`learn/lessons/${nextLesson.id}`)
    : p("learn");
  const transferQuest = sideQuests.find((q) => !q.isDaily && isSideQuestUnlocked(q) && !q.comingSoon) ?? sideQuests.find((q) => !q.isDaily);
  const boardRows = [
    {
      key: "next",
      tag: strings.boardNext,
      body: currentModule ? (
        <>
          <span className="mr-2 inline-grid h-[20px] min-w-[26px] place-items-center rounded-full px-1 text-[10px] font-extrabold text-white" style={{ background: "var(--tmc-line-main)" }}>
            {getModuleDisplay(modules, currentIdx).badgeLabel}
          </span>
          {currentModule.title} · L{nextLessonIdx + 1} {nextLesson?.title ?? ""}
        </>
      ) : (
        "All stations cleared"
      ),
      action: (
        <Link to={nextHref} className="rounded-sm bg-accent px-4 py-1 text-[12px] font-bold text-accent-foreground hover:bg-accent-hover">
          Continue →
        </Link>
      ),
    },
    ...(transferQuest
      ? [
          {
            key: "transfer",
            tag: strings.boardTransfer,
            body: (
              <>
                {transferQuest.emoji} {transferQuest.title}
                <span className="ml-2 text-[11px] font-semibold opacity-60">{transferQuest.comingSoon ? "coming soon" : transferQuest.meta}</span>
              </>
            ),
            action: transferQuest.comingSoon ? undefined : (
              <button onClick={() => onSideQuestClick(transferQuest)} className="rounded-sm border border-white/40 px-3 py-1 text-[12px] font-bold hover:bg-white/10">
                Board →
              </button>
            ),
          },
        ]
      : []),
    {
      key: "fare",
      tag: strings.boardFare,
      body: (
        <>
          {profile.xpEarnedToday} XP today · {profile.streakDays}🔥 streak
          <span className="ml-2 text-[11px] font-semibold opacity-60">{profile.levelLabel}</span>
        </>
      ),
    },
  ];

  const titleText = `${strings.mapTitle} — ${course.title}`;

  return (
    <div className="tmc-root mx-auto max-w-[1480px] px-3 pb-24 pt-4 sm:px-5">
      {/* signage board header */}
      <div className="mb-5 flex flex-wrap items-center gap-4 rounded-md px-5 py-4" style={{ background: "var(--color-text-primary)", color: "var(--color-surface)" }}>
        <div className="grid h-11 w-11 flex-none place-items-center rounded-full border-[3px] text-[18px] font-extrabold" style={{ borderColor: "var(--color-surface)", background: "var(--tmc-line-main)", color: "#fff" }}>
          M
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-[19px] font-extrabold leading-tight sm:text-[24px]" aria-label={titleText}>
            {titleText.split("").map((ch, i) => (
              <span key={i} className="tmc-title-ch" style={{ "--i": i } as CSSProperties} aria-hidden>
                {ch === " " ? " " : ch}
              </span>
            ))}
          </h1>
          <div className="text-[12px] opacity-75">Transit-map concept · dev preview · click stations, board quests, visit the depot</div>
        </div>
        <Link to={p("learn")} className="rounded-sm px-3 py-1.5 text-[12.5px] font-bold hover:opacity-75" style={{ border: "2px solid var(--color-surface)" }}>
          ← Classic view
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,320px)] lg:items-start">
        <div className="min-w-0">
          {/* desktop: network map / mobile: line diagram */}
          <div className="hidden md:block">
            <NetworkMap layout={layout} currentIdx={currentIdx} lang={lang} demo={demo} onDemoChange={setDemo} onOpen={open} langPath={p} />
          </div>
          <div className="md:hidden">
            <LineDiagram layout={layout} currentIdx={currentIdx} lang={lang} onOpen={open} />
            <button className="mt-3 w-full rounded-sm border-2 border-text-primary px-3 py-2 text-[13px] font-bold text-text-primary" onClick={() => setShowMapMobile((v) => !v)}>
              {showMapMobile ? "Hide network map" : "全体図 · View network map"}
            </button>
            {showMapMobile && (
              <div className="mt-3">
                <NetworkMap layout={layout} currentIdx={currentIdx} lang={lang} demo={demo} onDemoChange={setDemo} onOpen={open} langPath={p} />
              </div>
            )}
          </div>

          <DepartureBoard rows={boardRows} />
          <LearnToolsRow course={viewCourse} completedSet={completedSet} />
          <p className="mt-3 max-w-[72ch] text-[13px] text-text-muted">
            Stations = modules (spacing scales with lesson count) · branch lines = the real side quests · dashed track = honest roadmap. Click a station for its district; the depot links to practice. Demo state is on by default — flip the toggle for your real progress.
          </p>
        </div>

        {/* right rail: the classic learn-page furniture */}
        <div className="hidden lg:block">
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
          onClose={() => setOpenIdx(null)}
          onNav={setOpenIdx}
        />
      )}
    </div>
  );
}
