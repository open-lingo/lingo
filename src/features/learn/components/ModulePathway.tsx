import { useEffect, useMemo, useRef } from "react";
import "./pathway.css";
import type { Lesson } from "@/shared/domain/course";
import { PathwayNode, type PathwayNodePos } from "./PathwayNode";

/** Snake offset cycle. Matches the approved mockup's S-curves. */
const SNAKE_PATTERN: PathwayNodePos[] = [0, 2, 3, 2, 0, -2, -3, -2];
/** Tighter offset cycle for nodes inside a row cluster. */
const CLUSTER_PATTERN: PathwayNodePos[] = [0, 1, 0, -1, 0];

function offsetForIndex(i: number, cluster: boolean): PathwayNodePos {
  const pattern = cluster ? CLUSTER_PATTERN : SNAKE_PATTERN;
  return pattern[i % pattern.length];
}

/** Pick a short label for a node (under the disc) from a lesson title. */
function shortLabel(title: string): string {
  // "Vowels: あ い う え お" → "Vowels"
  // "Ka-row · か き く け こ" → "Ka-row"
  // "Ka-row — Intro 1" → "Intro 1"
  // "Ka-row — Row test" → "Row test"
  if (title.includes("—")) {
    const tail = title.split("—").slice(1).join("—").trim();
    if (tail.length > 0) return tail;
  }
  const cut = title.split(/[:·]/)[0]?.trim();
  return cut && cut.length > 0 ? cut : title;
}

/** Pick the glyph shown inside the node disc. Strategy:
 *   1. First hiragana / katakana / CJK character anywhere in the title.
 *   2. If none, take the first non-space token after a `:` or `·` separator.
 *   3. Last resort: first grapheme of the title.
 * This handles both legacy titles ("Ka-row · かきくけこ") and the new
 * sub-lesson-derived row titles ("Ka-row" with no kana suffix). */
function pickGlyph(title: string): string {
  // (1) Any hiragana / katakana / CJK unified ideograph in the title.
  const jp = title.match(/[぀-ヿ一-鿿]/);
  if (jp) return jp[0];
  // (2) Token after a separator.
  const tail = title.split(/[:·—]/).slice(1).join(" ").trim();
  const tok = tail.split(/\s+/)[0];
  if (tok) {
    if (typeof Intl !== "undefined" && (Intl as any).Segmenter) {
      const seg = new (Intl as any).Segmenter(undefined, {
        granularity: "grapheme",
      });
      const first = seg.segment(tok)[Symbol.iterator]().next().value;
      if (first?.segment) return first.segment as string;
    }
    return Array.from(tok)[0] ?? tok;
  }
  // (3) Fall back to first grapheme of the title.
  return Array.from(title)[0] ?? "?";
}

/** Find a representative kana inside a row cluster — scan every sub-lesson
 *  title for the first kana character, fall back to a static rowId map for
 *  cases where neither the cluster title nor any sub-lesson title carries
 *  kana (the current derive-sub-lessons output drops the kana suffix). */
const ROW_GLYPH: Record<string, string> = {
  // Vowels — first row of the curriculum. Pseudo-row "l1" (no entry in
  // HIRAGANA_ROWS) but it clusters via the standard sub-lesson id shape.
  l1: "あ",
  ka: "か", sa: "さ", ta: "た", na: "な", ha: "は", ma: "ま",
  ya: "や", ra: "ら", wa: "わ",
  ga: "が", za: "ざ", "da-ba": "だ", pa: "ぱ",
  // Curriculum-restructure 2026-05-15: collapsed 6 yōon rows into 4 +
  // capstone. The capstone is a test-only row — keep an obvious glyph
  // so the pathway label reads as a "review" beat.
  "yoon-intro": "きゃ",
  "yoon-sh-ch": "しゃ",
  "yoon-voiced": "じゃ",
  "yoon-rare": "にゃ",
  "yoon-capstone": "◎",
};
function pickClusterGlyph(
  lessons: Lesson[],
  clusterTitleStr: string,
  clusterPrefix: string,
): string {
  const fromTitle = pickGlyph(clusterTitleStr);
  if (/[぀-ヿ一-鿿]/.test(fromTitle)) return fromTitle;
  for (const lesson of lessons) {
    const jp = lesson.title.match(/[぀-ヿ一-鿿]/);
    if (jp) return jp[0];
  }
  // Strip language + module prefix: "ja-m1-ka" → "ka"
  const rowId = clusterPrefix.replace(/^[a-z]{2}-m\d+-/, "");
  return ROW_GLYPH[rowId] ?? fromTitle;
}

/**
 * Detect the row-cluster prefix for a lesson id, if any. Lessons named
 * `ja-m1-<row>-<suffix>` are sub-lessons of a row cluster; everything
 * else is a standalone lesson.
 *
 * Returns `null` for non-cluster lessons (e.g. `ja-m1-l1`, `m1-l0`).
 */
function clusterPrefix(id: string): string | null {
  // Match `ja-m1-<rowId>-<suffix>` where suffix is `1|2|3|test` style.
  // The rowId itself may contain hyphens (e.g. `da-ba`, `yo-sh-ch`,
  // `yo-m-r`, `yo-n-h`), so we anchor on the trailing `-(\d+|test)$` segment.
  const m = /^(ja-m1-.+)-(\d+|test)$/.exec(id);
  if (!m) return null;
  return m[1];
}

/** Determine which row a sub-lesson id belongs to ("ka", "da-ba", etc.). */
function clusterTitle(lessons: Lesson[], prefix: string): string {
  const first = lessons.find((l) => clusterPrefix(l.id) === prefix);
  if (!first) return "";
  // Strip the sub-lesson tail off the title.
  return first.title.split("—")[0].trim();
}

type ClusterGroup =
  | { kind: "single"; lesson: Lesson }
  | { kind: "cluster"; prefix: string; lessons: Lesson[]; title: string };

/**
 * Group consecutive lessons sharing the same cluster prefix into a single
 * cluster group; everything else stays as a "single" group of one.
 */
function groupLessons(lessons: Lesson[]): ClusterGroup[] {
  const out: ClusterGroup[] = [];
  let i = 0;
  while (i < lessons.length) {
    const lesson = lessons[i];
    const prefix = clusterPrefix(lesson.id);
    if (!prefix) {
      out.push({ kind: "single", lesson });
      i++;
      continue;
    }
    // Collect every consecutive lesson with this prefix.
    const group: Lesson[] = [];
    let j = i;
    while (j < lessons.length && clusterPrefix(lessons[j].id) === prefix) {
      group.push(lessons[j]);
      j++;
    }
    out.push({
      kind: "cluster",
      prefix,
      lessons: group,
      title: clusterTitle(group, prefix),
    });
    i = j;
  }
  return out;
}

export type ModulePathwayProps = {
  lessons: Lesson[];
  completedIds: ReadonlySet<string>;
  /** Lesson id of the "current" (pulsing) node. May be undefined if the
   * module is fully complete. */
  currentLessonId?: string;
  isLessonLocked: (lessonId: string) => boolean;
  reviewCounts?: Record<string, number>;
  onLessonClick: (lesson: Lesson) => void;
};

/** Paints a single dashed cubic-bezier path connecting consecutive node
 * centers inside the .lingo-path container. Pure DOM, no React state. */
function paintPath(pathEl: HTMLElement) {
  const svg = pathEl.querySelector<SVGSVGElement>(".lingo-path-svg");
  if (!svg) return;
  const rows = Array.from(
    pathEl.querySelectorAll<HTMLElement>(".lingo-path-row"),
  );
  if (rows.length < 2) {
    svg.innerHTML = "";
    return;
  }
  const pathRect = pathEl.getBoundingClientRect();
  svg.setAttribute("viewBox", `0 0 ${pathRect.width} ${pathRect.height}`);
  svg.setAttribute("preserveAspectRatio", "none");
  const positions = rows.map((row) => {
    const disc = row.querySelector<HTMLElement>(".lingo-node-disc");
    const r = (disc ?? row).getBoundingClientRect();
    return {
      x: r.left + r.width / 2 - pathRect.left,
      y: r.top + r.height / 2 - pathRect.top,
    };
  });
  let d = "";
  for (let i = 0; i < positions.length - 1; i++) {
    const p1 = positions[i];
    const p2 = positions[i + 1];
    const midY = (p1.y + p2.y) / 2;
    d += `M ${p1.x} ${p1.y + 30} C ${p1.x} ${midY}, ${p2.x} ${midY}, ${p2.x} ${p2.y - 30} `;
  }
  svg.innerHTML = `<path d="${d}" />`;
}

export function ModulePathway({
  lessons,
  completedIds,
  currentLessonId,
  isLessonLocked,
  reviewCounts,
  onLessonClick,
}: ModulePathwayProps) {
  const pathRef = useRef<HTMLDivElement>(null);

  // Repaint key — changes whenever the visual contents change.
  const repaintKey = useMemo(
    () =>
      `${lessons.map((l) => l.id).join("|")}|${currentLessonId ?? ""}|${[...completedIds].sort().join(",")}`,
    [lessons, currentLessonId, completedIds],
  );

  useEffect(() => {
    const el = pathRef.current;
    if (!el) return;
    const paint = () => paintPath(el);
    paint();
    // Re-run on next frame too — fonts may shift glyph centers slightly.
    const raf = requestAnimationFrame(paint);

    const ro = new ResizeObserver(() => paint());
    ro.observe(el);
    window.addEventListener("resize", paint);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", paint);
    };
  }, [repaintKey]);

  const groups = useMemo(() => groupLessons(lessons), [lessons]);

  // Running global index for the outer snake pattern. Each cluster counts
  // as one slot so the outer wave keeps its rhythm.
  let outerIdx = 0;

  return (
    <div className="lingo-path" ref={pathRef}>
      <svg
        className="lingo-path-svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      />
      {groups.map((group) => {
        if (group.kind === "single") {
          const lesson = group.lesson;
          const i = outerIdx++;
          const done = completedIds.has(lesson.id);
          const locked = isLessonLocked(lesson.id);
          const isCurrent = lesson.id === currentLessonId && !done;
          const state = done
            ? "done"
            : isCurrent
              ? "current"
              : locked
                ? "locked"
                : "available";
          const isFirstStart =
            isCurrent && i === 0 && completedIds.size === 0;
          const flag = isCurrent
            ? isFirstStart
              ? "start"
              : "continue"
            : null;
          const isRecap = lesson.kind === "recap";
          const glyph = isRecap ? "" : pickGlyph(lesson.title);
          const label = isRecap ? "Recap" : shortLabel(lesson.title);
          return (
            <PathwayNode
              key={lesson.id}
              glyph={glyph}
              label={label}
              state={state}
              positionOffset={offsetForIndex(i, false)}
              reviewCount={reviewCounts?.[lesson.id]}
              flag={flag}
              isRecap={isRecap}
              onClick={() => onLessonClick(lesson)}
            />
          );
        }
        // Cluster — collapse to ONE node per row with sub-lesson progress dots.
        const clusterIdx = outerIdx++;
        const clusterLessons = group.lessons;
        const doneCount = clusterLessons.filter((l) =>
          completedIds.has(l.id),
        ).length;
        const total = clusterLessons.length;
        // First non-done, non-locked sub-lesson = where the click lands.
        const targetLesson =
          clusterLessons.find(
            (l) => !completedIds.has(l.id) && !isLessonLocked(l.id),
          ) ?? clusterLessons[clusterLessons.length - 1];
        const allDone = doneCount === total;
        const containsCurrent = clusterLessons.some(
          (l) => l.id === currentLessonId && !completedIds.has(l.id),
        );
        const everyLocked = clusterLessons.every((l) =>
          isLessonLocked(l.id),
        );
        const state = allDone
          ? "done"
          : containsCurrent
            ? "current"
            : everyLocked
              ? "locked"
              : "available";
        // Representative glyph: first kana found in the cluster title or
        // any sub-lesson title. Falls back gracefully if nothing matches.
        const repGlyph = pickClusterGlyph(
          clusterLessons,
          group.title,
          group.prefix,
        );
        // Detect first-start so we get the "Start ›" pill, not "Continue".
        const isFirstStart =
          containsCurrent && clusterIdx === 0 && completedIds.size === 0;
        const flag = containsCurrent
          ? isFirstStart
            ? "start"
            : "continue"
          : null;
        return (
          <PathwayNode
            key={group.prefix}
            glyph={repGlyph}
            label={group.title || "Row"}
            state={state}
            positionOffset={offsetForIndex(clusterIdx, false)}
            flag={flag}
            subProgress={{ done: doneCount, total }}
            onClick={() => onLessonClick(targetLesson)}
          />
        );
      })}
    </div>
  );
}
