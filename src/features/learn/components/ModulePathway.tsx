import { useEffect, useMemo, useRef } from "react";
import "./pathway.css";
import type { Lesson } from "@/shared/domain/course";
import { PathwayNode, type PathwayNodePos } from "./PathwayNode";

/** Snake offset cycle. Matches the approved mockup's S-curves. */
const SNAKE_PATTERN: PathwayNodePos[] = [0, 2, 3, 2, 0, -2, -3, -2];

function offsetForIndex(i: number): PathwayNodePos {
  return SNAKE_PATTERN[i % SNAKE_PATTERN.length];
}

/** Pick a short label for a node (under the disc) from a lesson title. */
function shortLabel(title: string): string {
  // "Vowels: あ い う え お" → "Vowels"
  // "Ka-row · か き く け こ" → "Ka-row"
  const cut = title.split(/[:·]/)[0]?.trim();
  return cut && cut.length > 0 ? cut : title;
}

/** Pick the glyph shown inside the node disc. Hiragana row titles include
 * the row's kana after the punctuator; fall back to the first character. */
function pickGlyph(title: string): string {
  // After ":" or "·" the first non-space token is the canonical kana.
  const tail = title.split(/[:·]/).slice(1).join(" ").trim();
  const tok = tail.split(/\s+/)[0];
  if (tok) {
    // Take a single visible grapheme — Intl.Segmenter is widely supported.
    if (typeof Intl !== "undefined" && (Intl as any).Segmenter) {
      const seg = new (Intl as any).Segmenter(undefined, {
        granularity: "grapheme",
      });
      const first = seg.segment(tok)[Symbol.iterator]().next().value;
      if (first?.segment) return first.segment as string;
    }
    return Array.from(tok)[0] ?? tok;
  }
  // No tail — fall back to first grapheme of the title.
  return Array.from(title)[0] ?? "?";
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
    d += `M ${p1.x} ${p1.y + 38} C ${p1.x} ${midY}, ${p2.x} ${midY}, ${p2.x} ${p2.y - 38} `;
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

  return (
    <div className="lingo-path" ref={pathRef}>
      <svg
        className="lingo-path-svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      />
      {lessons.map((lesson, i) => {
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
        // First-ever lesson with no progress logged → "Start ›" side flag
        // instead of the "Continue" pulse-pill above.
        const isFirstStart =
          isCurrent && i === 0 && completedIds.size === 0;
        const flag = isCurrent ? (isFirstStart ? "start" : "continue") : null;
        return (
          <PathwayNode
            key={lesson.id}
            glyph={pickGlyph(lesson.title)}
            label={shortLabel(lesson.title)}
            state={state}
            positionOffset={offsetForIndex(i)}
            reviewCount={reviewCounts?.[lesson.id]}
            flag={flag}
            onClick={() => onLessonClick(lesson)}
          />
        );
      })}
    </div>
  );
}
