/**
 * Dev-only concept preview: the learn pathway as a transit map (2026-07-15).
 *
 * Concept A — the course as a metro network (modules = stations, side quests
 * = branch spurs, progress = line fill) — with click-through into Concept B
 * (a per-module "district" view where lessons are local stops). Driven by
 * REAL course data (getMockCourse + lesson completion) so ja (17 modules +
 * quests) and es (16 modules) both render. Station spacing scales with the
 * module's lesson count, so module size is visible geography.
 *
 * Mobile gets the transit-app "line diagram" (vertical strip) by default;
 * the full network map stays available behind a toggle.
 *
 * Route: /:lang/transit-preview
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
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
import { cn } from "@/shared/components/ui/cn";
import "./transitMapConcept.css";

/* ── layout ──────────────────────────────────────────────────────────── */

type Pt = readonly [number, number];

const Y_LOW = 312;
const Y_HIGH = 234;
const RUN = 6;
const MAP_H = 528;
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

type SpurL = {
  color: string;
  d: string;
  dashed: boolean;
  stops: { x: number; y: number; quest: SideQuest }[];
};

type Layout = {
  width: number;
  mainPts: Pt[];
  stations: StationL[];
  spurs: SpurL[];
  zones: { x0: number; x1: number; label: string }[];
};

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

/** Path length at a station that sits on a horizontal segment of the line. */
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
): Layout {
  const stations: StationL[] = [];
  let x = 108;
  let prevLevel = 0;
  modules.forEach((m, i) => {
    const level = Math.floor(i / RUN) % 2;
    const y = level ? Y_HIGH : Y_LOW;
    if (i > 0) {
      const gap = Math.min(150, Math.max(94, 78 + m.lessons.length * 5));
      x += level !== prevLevel ? 152 : gap;
    }
    prevLevel = level;
    const display = getModuleDisplay(modules, i);
    stations.push({
      x,
      y,
      labelSide: level ? "bottom" : "top",
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

  const mainPts: Pt[] = [[stations[0].x - 56, stations[0].y]];
  for (let i = 1; i < stations.length; i++) {
    const prev = stations[i - 1];
    const cur = stations[i];
    if (prev.y !== cur.y) {
      const dy = Math.abs(cur.y - prev.y);
      mainPts.push([prev.x + 36, prev.y], [prev.x + 36 + dy, cur.y]);
    }
  }
  const last = stations[stations.length - 1];
  mainPts.push([last.x + 58, last.y]);

  const spurs: SpurL[] = [];
  let colorIdx = 0;
  for (const [anchor, quests] of questsByAnchor) {
    const st = stations[anchor];
    const dir = st.y === Y_LOW ? 1 : -1;
    const spurY = st.y + dir * 84;
    const shown = quests.slice(0, 3);
    const endX = st.x + 96 + (shown.length - 1) * 96 + 44;
    spurs.push({
      color: QUEST_COLORS[colorIdx % QUEST_COLORS.length],
      dashed: st.status === "locked",
      d: dOf([
        [st.x, st.y],
        [st.x + 84, spurY],
        [endX, spurY],
      ]),
      stops: shown.map((quest, k) => ({
        x: st.x + 96 + k * 96,
        y: spurY,
        quest,
      })),
    });
    colorIdx++;
  }

  const width = last.x + 170;
  const zones: Layout["zones"] = [];
  if (stations.length >= 9 && zoneLabels.length === 3) {
    const third = Math.ceil(stations.length / 3);
    const bounds = [
      44,
      (stations[third - 1].x + stations[third].x) / 2,
      (stations[Math.min(2 * third - 1, stations.length - 2)].x +
        stations[Math.min(2 * third, stations.length - 1)].x) /
        2,
      width - 28,
    ];
    for (let z = 0; z < 3; z++) {
      zones.push({ x0: bounds[z], x1: bounds[z + 1], label: zoneLabels[z] });
    }
  }
  return { width, mainPts, stations, spurs, zones };
}

/* ── per-language strings ────────────────────────────────────────────── */

const STRINGS: Record<
  string,
  { lineName: string; youAreHere: string; zones: string[]; mapTitle: string }
> = {
  ja: {
    lineName: "本線 Main Line",
    youAreHere: "現在地 YOU ARE HERE",
    zones: ["ZONE 1 · はじまり", "ZONE 2 · 日常", "ZONE 3 · 出発"],
    mapTitle: "学習路線図",
  },
  es: {
    lineName: "Línea principal",
    youAreHere: "¡ESTÁS AQUÍ!",
    zones: ["ZONA 1 · Fundamentos", "ZONA 2 · Vida diaria", "ZONA 3 · De viaje"],
    mapTitle: "Mapa de la línea",
  },
};
const stringsFor = (lang: string) =>
  STRINGS[lang] ?? {
    lineName: "Main Line",
    youAreHere: "YOU ARE HERE",
    zones: ["ZONE 1", "ZONE 2", "ZONE 3"],
    mapTitle: "Transit Map",
  };

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ── network map (Concept A) ─────────────────────────────────────────── */

function TrainMascot({ label }: { label: string }) {
  return (
    <g className="tmc-mascot" aria-hidden>
      {/* you-are-here chip (raised so station labels stay readable below) */}
      <rect
        x={-58}
        y={-82}
        width={116}
        height={20}
        rx={10}
        style={{ fill: "var(--tmc-ink)" }}
      />
      <text
        x={0}
        y={-68}
        textAnchor="middle"
        style={{ fill: "var(--tmc-panel)", fontSize: 9.5, fontWeight: 800 }}
      >
        {label}
      </text>
      {/* body */}
      <rect x={-18} y={-58} width={36} height={20} rx={6} style={{ fill: "var(--tmc-line-main)" }} />
      <rect x={-18} y={-58} width={36} height={5} rx={2.5} style={{ fill: "var(--tmc-ink)", opacity: 0.35 }} />
      {/* face windows */}
      <circle cx={-7} cy={-47} r={4.6} style={{ fill: "var(--tmc-panel)" }} />
      <circle cx={7} cy={-47} r={4.6} style={{ fill: "var(--tmc-panel)" }} />
      <circle className="tmc-mascot-eye" cx={-6} cy={-47} r={1.9} style={{ fill: "var(--tmc-ink)" }} />
      <circle className="tmc-mascot-eye" cx={8} cy={-47} r={1.9} style={{ fill: "var(--tmc-ink)" }} />
      {/* smile */}
      <path d="M -3 -41.5 Q 0 -39.5 3 -41.5" fill="none" style={{ stroke: "var(--tmc-panel)", strokeWidth: 1.4, strokeLinecap: "round" }} />
      {/* wheels */}
      <circle cx={-10} cy={-37} r={3} style={{ fill: "var(--tmc-ink)" }} />
      <circle cx={10} cy={-37} r={3} style={{ fill: "var(--tmc-ink)" }} />
    </g>
  );
}

function NetworkMap({
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
  const scrollerRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<SVGPathElement>(null);
  const trainRef = useRef<SVGGElement>(null);
  const [tip, setTip] = useState<StationL | null>(null);
  const strings = stringsFor(lang);

  const { segs } = useMemo(() => polySegs(layout.mainPts), [layout]);
  const current = layout.stations[currentIdx];
  const lenCurrent = useMemo(
    () => lenAtStation(layout.mainPts, segs, current.x, current.y),
    [layout, segs, current],
  );
  const { a: donePts, b: aheadPts } = useMemo(
    () => splitPoly(layout.mainPts, segs, lenCurrent),
    [layout, segs, lenCurrent],
  );

  /* line-draw + train ride on mount */
  useEffect(() => {
    const rail = railRef.current;
    const train = trainRef.current;
    if (!rail || !train) return;
    const startLen = lenAtStation(
      layout.mainPts, segs, layout.stations[0].x, layout.stations[0].y,
    );
    const place = (len: number) => {
      const [px, py] = pointAt(layout.mainPts, segs, len);
      train.setAttribute("transform", `translate(${px} ${py})`);
    };
    if (prefersReducedMotion()) {
      place(lenCurrent);
      return;
    }
    const total = rail.getTotalLength();
    rail.style.transition = "none";
    rail.style.strokeDasharray = `${total}`;
    rail.style.strokeDashoffset = `${total}`;
    place(startLen);
    // force reflow so the transition animates from the hidden state
    void rail.getBoundingClientRect();
    rail.style.transition = "";
    rail.style.strokeDashoffset = "0";

    let raf = 0;
    const rideMs = 1500;
    const delay = 650;
    const t0 = performance.now() + delay;
    const ease = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - t0) / rideMs));
      place(startLen + (lenCurrent - startLen) * ease(t));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [layout, segs, lenCurrent]);

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
    el.scrollLeft = Math.max(0, current.x - el.clientWidth * 0.45);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      el.removeEventListener("wheel", wheel);
    };
  }, [current.x]);

  const stationFill = (s: StationL): { fill: string; stroke: string } => {
    if (s.status === "completed")
      return { fill: "var(--tmc-done)", stroke: "var(--tmc-panel)" };
    if (s.status === "current")
      return { fill: "var(--tmc-panel)", stroke: "var(--tmc-line-main)" };
    return { fill: "var(--tmc-panel)", stroke: "var(--tmc-locked)" };
  };

  return (
    <div className="relative rounded-md border-2 border-text-primary bg-surface shadow-card overflow-hidden">
      {/* legend */}
      <div
        data-tm="legend"
        className="absolute right-3 top-3 z-[5] grid gap-1.5 rounded-sm border border-border bg-surface px-3.5 py-2.5 text-[11px] shadow-card min-w-[180px]"
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
            <span>Side quests</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span
            className="h-[5px] w-[22px] rounded-full"
            style={{
              background:
                "repeating-linear-gradient(90deg, var(--tmc-locked) 0 5px, transparent 5px 9px)",
            }}
          />
          <span>Locked / planned</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-[11px] w-[11px] rounded-full border-[3px]" style={{ borderColor: "var(--tmc-ink)", background: "var(--tmc-panel)" }} />
          <span>Interchange (branch)</span>
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
            {/* zones */}
            {layout.zones.map((z, i) => (
              <g key={z.label}>
                {i % 2 === 1 && (
                  <rect x={z.x0} y={56} width={z.x1 - z.x0} height={MAP_H - 100} fill="currentColor" opacity={0.035} />
                )}
                {i > 0 && (
                  <line x1={z.x0} y1={56} x2={z.x0} y2={MAP_H - 44} style={{ stroke: "var(--tmc-border)" }} strokeDasharray="2 6" />
                )}
                <text x={z.x0 + 18} y={82} data-tm="zone" style={{ fill: "var(--tmc-muted)", fontSize: 10.5, letterSpacing: "0.17em", fontWeight: 600 }}>
                  {z.label}
                </text>
              </g>
            ))}

            {/* quest spurs */}
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
                {spur.stops.map(({ x, y, quest }) => (
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
                        fill: "var(--tmc-panel)",
                        stroke: spur.dashed ? "var(--tmc-locked)" : spur.color,
                      }}
                    />
                    <text x={x} y={y - 16} textAnchor="middle" style={{ fontSize: 13 }}>
                      {quest.emoji}
                    </text>
                    <text
                      x={x}
                      y={y + 26}
                      textAnchor="middle"
                      data-tm="label"
                      style={{ fill: "var(--tmc-muted)", fontSize: 9.5 }}
                    >
                      {quest.title.length > 16 ? `${quest.title.slice(0, 15)}…` : quest.title}
                    </text>
                  </g>
                ))}
              </g>
            ))}

            {/* main line: ahead (dashed) under done (drawn) */}
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

            {/* stations */}
            {layout.stations.map((s) => {
              const dir = s.labelSide === "top" ? -1 : 1;
              const baseOffset = s.interchange || s.terminal ? 36 : 30;
              const titleY = s.y + dir * baseOffset + (dir < 0 ? 0 : 8);
              const badgeY = titleY + dir * 15;
              const short =
                s.module.title.length > 18
                  ? `${s.module.title.slice(0, 17)}…`
                  : s.module.title;
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
                  {/* touch/focus hit area */}
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

          {/* hover tooltip */}
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
              <div className="text-[15px] font-extrabold text-text-primary">
                {tip.module.title}
              </div>
              <div className="mb-2 text-[12px] text-text-muted">
                {tip.done}/{tip.total} lessons ·{" "}
                {tip.status === "completed"
                  ? "complete"
                  : tip.status === "current"
                    ? "in progress"
                    : "locked"}
              </div>
              <div className="text-[11px] font-semibold text-accent">
                Click to open district ↓
              </div>
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

  /* local line layout */
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
      <div
        className="tmc-district-panel w-full max-w-[900px] overflow-hidden rounded-md border-2 border-text-primary bg-surface shadow-popover"
        onClick={(e) => e.stopPropagation()}
      >
        {/* signage header */}
        <div className="flex items-center gap-4 px-5 py-4" style={{ background: "var(--color-text-primary)", color: "var(--color-surface)" }}>
          <div
            className="grid h-11 w-11 flex-none place-items-center rounded-full border-[3px] text-[15px] font-extrabold"
            style={{ borderColor: "var(--color-surface)", background: "var(--tmc-line-main)", color: "#fff" }}
          >
            {badge}
          </div>
          <div className="min-w-0 flex-1">
            {mod.eyebrow && (
              <div className="text-[10.5px] uppercase tracking-[0.14em] opacity-70">{mod.eyebrow}</div>
            )}
            <div className="truncate text-[19px] font-extrabold leading-tight">{mod.title}</div>
            <div className="text-[12px] opacity-75">
              {done}/{mod.lessons.length} lessons
              {status === "locked" ? " · locked — complete the previous station" : ""}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close district view"
            className="grid h-9 w-9 flex-none place-items-center rounded-full text-[16px] font-bold hover:opacity-75"
            style={{ border: "2px solid var(--color-surface)" }}
          >
            ✕
          </button>
        </div>

        {/* local map */}
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
            {/* quest loop */}
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
                      <text x={qx} y={questY - 14} textAnchor="middle" style={{ fontSize: 12 }}>{q.emoji}</text>
                      <text x={qx} y={questY + 26} textAnchor="middle" data-tm="d-label" style={{ fill: "var(--tmc-muted)", fontSize: 9.5 }}>
                        {q.title.length > 18 ? `${q.title.slice(0, 17)}…` : q.title}
                      </text>
                    </g>
                  );
                })}
              </>
            )}
            {/* main local line */}
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
              const short =
                s.lesson.title.length > 13 ? `${s.lesson.title.slice(0, 12)}…` : s.lesson.title;
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
                  {s.isCurrent && (
                    <circle className="tmc-pulse" cx={s.x} cy={120} r={12} fill="none" strokeWidth={2.5} style={{ stroke: "var(--tmc-line-main)" }} />
                  )}
                </Link>
              );
            })}
          </svg>
        </div>

        {/* footer */}
        <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-3">
          <button
            className="rounded-sm border border-border px-3 py-1.5 text-[12.5px] font-semibold text-text-secondary hover:bg-surface-muted disabled:opacity-40"
            disabled={index === 0}
            onClick={() => onNav(index - 1)}
          >
            ← Previous station
          </button>
          <button
            className="rounded-sm border border-border px-3 py-1.5 text-[12.5px] font-semibold text-text-secondary hover:bg-surface-muted disabled:opacity-40"
            disabled={index === course.modules.length - 1}
            onClick={() => onNav(index + 1)}
          >
            Next station →
          </button>
          <div className="flex-1" />
          {status !== "locked" && stops[nextIdx] && (
            <Link
              to={lessonHref(stops[nextIdx].lesson)}
              className="rounded-sm bg-accent px-4 py-1.5 text-[12.5px] font-bold text-accent-foreground hover:bg-accent-hover"
            >
              Continue L{nextIdx + 1} →
            </Link>
          )}
        </div>
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
          const state =
            s.status === "completed" ? "tmc-row-done" : s.status === "current" ? "tmc-row-now" : "tmc-row-future";
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
                    <span className="ml-1.5 align-middle" aria-hidden>🚃</span>
                  )}
                </span>
                <span className="text-[11px] text-text-muted">
                  {s.done}/{s.total} lessons
                  {s.terminal ? " · terminal" : ""}
                </span>
                {s.interchange && (
                  <span
                    className="mt-0.5 w-fit rounded-full px-2 py-[1px] text-[10px] font-bold text-white"
                    style={{ background: questColor.get(s.index) }}
                  >
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

/* ── page ────────────────────────────────────────────────────────────── */

export default function TransitMapConceptPage() {
  const lang = useLang();
  const p = useLangPath();
  const completedIds = useCompletedLessonIds();
  const completedSet = useMemo(() => new Set(completedIds), [completedIds]);
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [showMapMobile, setShowMapMobile] = useState(false);
  const strings = stringsFor(lang);

  const course = useMemo(() => getMockCourse(lang), [lang]);
  const modules = useMemo(
    () => course.modules.filter((m) => !m.comingSoon && m.lessons.length > 0),
    [course],
  );
  const viewCourse = useMemo(
    () => ({ ...course, modules }),
    [course, modules],
  );
  const statuses = useMemo(
    () => modules.map((_, i) => getModuleStatus(i, completedSet, modules)),
    [modules, completedSet],
  );
  const doneCounts = useMemo(
    () => modules.map((m) => m.lessons.filter((l) => completedSet.has(l.id)).length),
    [modules, completedSet],
  );
  const currentIdx = useMemo(
    () => getCurrentModuleIndex(viewCourse, completedSet),
    [viewCourse, completedSet],
  );
  const questsByAnchor = useMemo(() => {
    const map = new Map<number, SideQuest[]>();
    for (const q of course.sideQuests ?? []) {
      let anchor = 0;
      if (q.unlockAfter) {
        const byModule = modules.findIndex((m) => m.id === q.unlockAfter);
        const byLesson = modules.findIndex((m) => m.lessons.some((l) => l.id === q.unlockAfter));
        anchor = byModule >= 0 ? byModule : byLesson >= 0 ? byLesson : 0;
      }
      map.set(anchor, [...(map.get(anchor) ?? []), q]);
    }
    return map;
  }, [course.sideQuests, modules]);

  const layout = useMemo(
    () => buildLayout(modules, statuses, doneCounts, questsByAnchor, strings.zones),
    [modules, statuses, doneCounts, questsByAnchor, strings.zones],
  );

  const open = useCallback((i: number) => setOpenIdx(i), []);

  return (
    <div className="tmc-root mx-auto max-w-[1400px] px-3 pb-24 pt-4 sm:px-5">
      {/* signage board header */}
      <div className="mb-5 flex flex-wrap items-center gap-4 rounded-md px-5 py-4" style={{ background: "var(--color-text-primary)", color: "var(--color-surface)" }}>
        <div className="grid h-11 w-11 flex-none place-items-center rounded-full border-[3px] text-[18px] font-extrabold" style={{ borderColor: "var(--color-surface)", background: "var(--tmc-line-main)", color: "#fff" }}>
          M
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-[19px] font-extrabold leading-tight sm:text-[24px]">
            {strings.mapTitle} — {course.title}
          </h1>
          <div className="text-[12px] opacity-75">
            Transit-map concept · dev preview · real course data & progress
          </div>
        </div>
        <Link to={p("learn")} className="rounded-sm px-3 py-1.5 text-[12.5px] font-bold hover:opacity-75" style={{ border: "2px solid var(--color-surface)" }}>
          ← Classic view
        </Link>
      </div>

      {/* desktop: network map */}
      <div className="hidden md:block">
        <NetworkMap layout={layout} currentIdx={currentIdx} lang={lang} onOpen={open} />
        <p className="mt-3 max-w-[70ch] text-[13px] text-text-muted">
          Station spacing scales with module size; branches are side quests
          from real course data. Click any station for its district (local
          stops = lessons — all clickable). The dashed track ahead is honest
          roadmap UI.
        </p>
      </div>

      {/* mobile: line diagram + optional map */}
      <div className="md:hidden">
        <LineDiagram layout={layout} currentIdx={currentIdx} lang={lang} onOpen={open} />
        <button
          className="mt-3 w-full rounded-sm border-2 border-text-primary px-3 py-2 text-[13px] font-bold text-text-primary"
          onClick={() => setShowMapMobile((v) => !v)}
        >
          {showMapMobile ? "Hide network map" : "全体図 · View network map"}
        </button>
        {showMapMobile && (
          <div className="mt-3">
            <NetworkMap layout={layout} currentIdx={currentIdx} lang={lang} onOpen={open} />
          </div>
        )}
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
