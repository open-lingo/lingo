import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import {
  TILE_TOKEN_DEFS,
  defaultVars,
  formatVar,
  groupLabel,
  type TileTokenGroup,
  type TileVarMap,
} from "./tileSizingTokens";
import { TILE_QA_MESSAGE } from "./tileSizingMessage";

/**
 * `/:lang/qa/tiles` — TestFlight #137's ask, verbatim (Spencer,
 * 2026-09-15): "views of desktop and mobile, potentially different
 * sliders for each, dynamically updating so I can dial it in. size it
 * same physical dimension as my phone too if we can relative to my mac."
 *
 * Two real `<iframe>`s of `/:lang/qa/tiles/frame` (one at 430×932 CSS px —
 * the 15 Pro Max logical size, one at 1280×900) render the REAL step
 * components — not copies — so a slider here changes production code.
 * Values persist per-pane in localStorage; "Copy CSS" hands Fable a
 * paste-ready `:root{…}` + `@media` block for `src/index.css`.
 */

// Fixed width for BOTH panes' slider-grid wrapper (Spencer 2026-09-15: value
// boxes pushed off-screen at 1440px). Neither pane's outer column has an
// explicit width otherwise — it sizes to its widest child, which is the
// mobile bezel (~356px scaled) on the left and the 1280px-wide iframe stage
// on the right, so without an explicit width here the desktop slider grid
// silently inherited 1280px and pushed its number/unit columns far off the
// visible pane. Comfortably fits the widest label ("Kana-only word growth")
// plus a usable slider track.
const CONTROLS_W = 440;

const MOBILE_W = 430;
const MOBILE_H = 932;
const DESKTOP_W = 1280;
const DESKTOP_H = 900;
// 15 Pro Max: 460 ppi physical / 3x device pixel ratio = 153.3 CSS px/inch.
const PHONE_CSS_PX_PER_INCH = 153.3;
const PHONE_PHYSICAL_WIDTH_MM = 71.6;
const CARD_WIDTH_MM = 85.6;
const CARD_HEIGHT_MM = 53.98;
const SAFE_AREA_TOP_PT = 59;
const SAFE_AREA_BOTTOM_PT = 34;

const LS_MOBILE = "lingo:qa-tiles-vars:mobile:v1";
const LS_DESKTOP = "lingo:qa-tiles-vars:desktop:v1";
const LS_CALIBRATION = "lingo:qa-tiles-calibration:v1";

type Calibration = { macCssPxPerInch: number; oneToOne: boolean };
const DEFAULT_CALIBRATION: Calibration = { macCssPxPerInch: 127, oneToOne: false };

function loadVars(key: string, tier: "base" | "sm"): TileVarMap {
  const defaults = defaultVars(tier);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<TileVarMap>;
    const out: TileVarMap = { ...defaults };
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
    }
    return out;
  } catch {
    return defaults;
  }
}

function loadCalibration(): Calibration {
  try {
    const raw = localStorage.getItem(LS_CALIBRATION);
    if (!raw) return DEFAULT_CALIBRATION;
    return { ...DEFAULT_CALIBRATION, ...(JSON.parse(raw) as Partial<Calibration>) };
  } catch {
    return DEFAULT_CALIBRATION;
  }
}

// `tier` picks the fallback default `formatVar` uses for any key missing
// from `vars` (e.g. a token added after Spencer's stored blob was saved) —
// see the doc comment on `formatVar` in tileSizingTokens.ts. Never omit it:
// the two call sites below are mobile ("base") and desktop ("sm").
function formattedVars(vars: TileVarMap, tier: "base" | "sm"): Record<string, string> {
  const out: Record<string, string> = {};
  for (const def of TILE_TOKEN_DEFS) out[def.key] = formatVar(def, vars[def.key], tier);
  return out;
}

const GROUPS: TileTokenGroup[] = ["build", "match", "mcq", "option", "card"];

const BOX_H_KEY = "--tile-box-h";

function SliderPanel({
  vars,
  onChange,
  idPrefix,
  locked,
  lockedHeight,
}: {
  vars: TileVarMap;
  onChange: (key: string, value: number) => void;
  idPrefix: string;
  /** "Lock tile heights" (TestFlight #137) — while true, the --tile-box-h
   *  row is disabled (the frame is driving it from a live measurement, not
   *  this slider) and shows the measured value instead of the stored one. */
  locked: boolean;
  lockedHeight: number | null;
}) {
  return (
    <div className="space-y-4">
      {GROUPS.map((group) => (
        <div key={group}>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-text-muted">
            {groupLabel(group)}
          </p>
          {/* Fixed 4-column grid, not a flex row — a flex row's number/unit
              cells got pushed off the right edge of the pane at 1440px
              (Spencer's screenshot, 2026-09-15). `min-w-0` on the track
              column lets the slider itself shrink instead of forcing the
              row wider than the pane; both panes share this exact grid so
              their columns line up. */}
          <div className="space-y-1.5">
            {TILE_TOKEN_DEFS.filter((d) => d.group === group).map((def) => {
              const isBoxH = def.key === BOX_H_KEY;
              const rowLocked = isBoxH && locked;
              const displayValue = rowLocked ? (lockedHeight ?? vars[def.key]) : vars[def.key];
              return (
                <div
                  key={def.key}
                  className="grid grid-cols-[auto_1fr_4.5rem_2.5rem] items-center gap-2 text-xs"
                >
                  <label
                    htmlFor={`${idPrefix}-${def.key}`}
                    className={`w-36 shrink-0 truncate ${rowLocked ? "text-text-muted/60" : "text-text-secondary"}`}
                    title={def.label}
                  >
                    {def.label}
                    {rowLocked && " (locked)"}
                  </label>
                  <input
                    id={`${idPrefix}-${def.key}`}
                    type="range"
                    min={def.min}
                    max={def.max}
                    step={def.step}
                    disabled={rowLocked}
                    value={displayValue}
                    onChange={(e) => onChange(def.key, Number(e.target.value))}
                    className="h-1.5 min-w-0 accent-accent disabled:opacity-40"
                  />
                  <input
                    type="number"
                    min={def.min}
                    max={def.max}
                    step={def.step}
                    disabled={rowLocked}
                    value={displayValue}
                    onChange={(e) => onChange(def.key, Number(e.target.value))}
                    className="w-full min-w-0 rounded border border-border bg-surface px-1 py-0.5 text-right text-xs text-text-primary disabled:opacity-40"
                  />
                  <span className="shrink-0 truncate text-text-muted">{def.unit || "×"}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TileSizingQaPage() {
  const { language } = useLanguage();
  const langId = language?.id ?? "ja";

  const [mobileVars, setMobileVars] = useState<TileVarMap>(() =>
    loadVars(LS_MOBILE, "base"),
  );
  const [desktopVars, setDesktopVars] = useState<TileVarMap>(() =>
    loadVars(LS_DESKTOP, "sm"),
  );
  const [calibration, setCalibration] = useState<Calibration>(loadCalibration);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  // "Lock tile heights" (TestFlight #137). Locked = the FRAME measures its
  // own 8-tile fixture and drives --tile-box-h itself; the slider for that
  // one token is disabled and shows the measured value (SliderPanel above).
  // The underlying slider STATE (mobileVars["--tile-box-h"]) is untouched
  // while locked, so switching the toggle back off restores exactly what
  // it held before — per the brief, "When off, it restores the slider
  // value."
  const [mobileLocked, setMobileLocked] = useState(false);
  const [desktopLocked, setDesktopLocked] = useState(false);
  const [mobileLockedHeight, setMobileLockedHeight] = useState<number | null>(null);
  const [desktopLockedHeight, setDesktopLockedHeight] = useState<number | null>(null);

  // Desktop pane content-height (Spencer 2026-09-15: "make it scrollable").
  // The frame reports its own `scrollHeight`; the iframe is sized to fit it
  // exactly and the OUTER pane (a fixed-height `overflow-y-auto` box, see the
  // JSX below) is the only scroller — avoids a scrollbar nested inside
  // another scrollbar.
  const [desktopContentHeight, setDesktopContentHeight] = useState(DESKTOP_H);

  // Save/Load (Spencer 2026-09-15: "Save my sizing") — dev-only middleware
  // at POST/GET /__qa/tile-sizing (vite.config.ts, writes
  // docs/qa/tile-sizing.json). `import.meta.env.DEV` is statically false in
  // a production build, so the Save control cannot even render there.
  const isDev = import.meta.env.DEV;
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [hasSavedFile, setHasSavedFile] = useState(false);

  const mobileFrameRef = useRef<HTMLIFrameElement>(null);
  const desktopFrameRef = useRef<HTMLIFrameElement>(null);
  // Frames announce readiness via postMessage; until then, queued sends
  // would land before the frame's listener attaches and be lost.
  const mobileReady = useRef(false);
  const desktopReady = useRef(false);

  const sendVars = useCallback(
    (
      frame: HTMLIFrameElement | null,
      vars: TileVarMap,
      tier: "base" | "sm",
      locked: boolean,
    ) => {
      const formatted = formattedVars(vars, tier);
      // While locked, the FRAME is the source of truth for --tile-box-h
      // (it self-measures and self-applies) — omit it here so this push
      // can never stomp the live-measured value out from under the lock.
      // The frame also filters this key defensively on its own side.
      if (locked) delete formatted[BOX_H_KEY];
      frame?.contentWindow?.postMessage(
        {
          source: TILE_QA_MESSAGE.source,
          type: TILE_QA_MESSAGE.setVars,
          vars: formatted,
        },
        "*",
      );
    },
    [],
  );

  const postLock = useCallback((frame: HTMLIFrameElement | null, locked: boolean) => {
    frame?.contentWindow?.postMessage(
      { source: TILE_QA_MESSAGE.source, type: TILE_QA_MESSAGE.setLock, locked },
      "*",
    );
  }, []);

  useEffect(() => {
    localStorage.setItem(LS_MOBILE, JSON.stringify(mobileVars));
    if (mobileReady.current) sendVars(mobileFrameRef.current, mobileVars, "base", mobileLocked);
  }, [mobileVars, mobileLocked, sendVars]);

  useEffect(() => {
    localStorage.setItem(LS_DESKTOP, JSON.stringify(desktopVars));
    if (desktopReady.current) sendVars(desktopFrameRef.current, desktopVars, "sm", desktopLocked);
  }, [desktopVars, desktopLocked, sendVars]);

  useEffect(() => {
    localStorage.setItem(LS_CALIBRATION, JSON.stringify(calibration));
  }, [calibration]);

  // Offer "Load saved" if docs/qa/tile-sizing.json already exists (dev only).
  useEffect(() => {
    if (!isDev) return;
    fetch("/__qa/tile-sizing")
      .then((r) => setHasSavedFile(r.ok))
      .catch(() => setHasSavedFile(false));
  }, [isDev]);

  // Frame → parent "ready" handshake: push the current pane's vars the
  // instant a frame's listener attaches (covers first load AND any later
  // iframe reload). Also handles the lock-measurement + content-height
  // reports the frame sends while running.
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const data = e.data;
      if (!data || data.source !== TILE_QA_MESSAGE.source) return;
      if (data.type === TILE_QA_MESSAGE.ready) {
        if (data.view === "mobile") {
          mobileReady.current = true;
          sendVars(mobileFrameRef.current, mobileVars, "base", mobileLocked);
          if (mobileLocked) postLock(mobileFrameRef.current, true);
        } else if (data.view === "desktop") {
          desktopReady.current = true;
          sendVars(desktopFrameRef.current, desktopVars, "sm", desktopLocked);
          if (desktopLocked) postLock(desktopFrameRef.current, true);
        }
      } else if (data.type === TILE_QA_MESSAGE.lockMeasured) {
        const height = typeof data.height === "number" ? data.height : null;
        if (data.view === "mobile") setMobileLockedHeight(height);
        else if (data.view === "desktop") setDesktopLockedHeight(height);
      } else if (data.type === TILE_QA_MESSAGE.contentHeight) {
        // Only the desktop pane resizes its iframe to content — the mobile
        // pane is sized to the phone's physical footprint, not content.
        if (data.view === "desktop" && typeof data.height === "number") {
          setDesktopContentHeight(Math.max(data.height, 200));
        }
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
    // Intentionally NOT depending on mobileVars/desktopVars — the vars
    // effects above already re-push on every change; this handshake only
    // needs the LATEST values, read fresh via refs' closures each call.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sendVars, postLock, mobileLocked, desktopLocked]);

  const resetPane = (pane: "mobile" | "desktop") => {
    if (pane === "mobile") setMobileVars(defaultVars("base"));
    else setDesktopVars(defaultVars("sm"));
  };

  const toggleLock = (pane: "mobile" | "desktop") => {
    if (pane === "mobile") {
      const next = !mobileLocked;
      setMobileLocked(next);
      postLock(mobileFrameRef.current, next);
      if (!next) {
        setMobileLockedHeight(null);
        // Restore the slider's own value immediately rather than waiting
        // for the next unrelated vars-push.
        sendVars(mobileFrameRef.current, mobileVars, "base", false);
      }
    } else {
      const next = !desktopLocked;
      setDesktopLocked(next);
      postLock(desktopFrameRef.current, next);
      if (!next) {
        setDesktopLockedHeight(null);
        sendVars(desktopFrameRef.current, desktopVars, "sm", false);
      }
    }
  };

  // Resolved (fallback-applied) copies of both panes' vars — used for every
  // OUTPUT (CSS text, JSON, Save), never the raw state maps directly. A raw
  // map can be missing a key entirely (a token added after Spencer's stored
  // blob was saved, or after `docs/qa/tile-sizing.json` was written); without
  // this, Copy CSS emitted literal `"undefinedpx"` for those keys (Spencer,
  // 2026-09-15). `formatVar`'s own fallback (tileSizingTokens.ts) covers the
  // live iframes via `sendVars`; this covers everything the page ITSELF
  // renders as text.
  const resolvedMobile = useMemo(() => {
    const out: TileVarMap = {};
    for (const def of TILE_TOKEN_DEFS) {
      const v = mobileVars[def.key];
      out[def.key] = typeof v === "number" && Number.isFinite(v) ? v : def.base;
    }
    return out;
  }, [mobileVars]);
  const resolvedDesktop = useMemo(() => {
    const out: TileVarMap = {};
    for (const def of TILE_TOKEN_DEFS) {
      const v = desktopVars[def.key];
      out[def.key] = typeof v === "number" && Number.isFinite(v) ? v : def.sm;
    }
    return out;
  }, [desktopVars]);

  const cssText = useMemo(() => {
    const base = TILE_TOKEN_DEFS.map(
      (d) => `  ${d.key}: ${formatVar(d, resolvedMobile[d.key], "base")};`,
    ).join("\n");
    const smLines = TILE_TOKEN_DEFS.filter(
      (d) => resolvedDesktop[d.key] !== resolvedMobile[d.key],
    ).map((d) => `    ${d.key}: ${formatVar(d, resolvedDesktop[d.key], "sm")};`);
    const smBlock =
      smLines.length > 0
        ? `\n@media (min-width: 640px) {\n  :root {\n${smLines.join("\n")}\n  }\n}\n`
        : "";
    return `:root {\n${base}\n}\n${smBlock}`;
  }, [resolvedMobile, resolvedDesktop]);

  const jsonText = useMemo(
    () => JSON.stringify({ mobile: resolvedMobile, desktop: resolvedDesktop }, null, 2),
    [resolvedMobile, resolvedDesktop],
  );

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus(`${label} copied`);
    } catch {
      setCopyStatus(`${label}: clipboard blocked — see console`);
      // eslint-disable-next-line no-console
      console.log(text);
    }
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const save = async () => {
    try {
      const res = await fetch("/__qa/tile-sizing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: resolvedMobile,
          desktop: resolvedDesktop,
          savedAt: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setHasSavedFile(true);
      const now = new Date();
      setSaveStatus(
        `saved ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
      );
    } catch {
      setSaveStatus("save failed — see console");
      // eslint-disable-next-line no-console
      console.error("tile-sizing save failed");
    }
    setTimeout(() => setSaveStatus(null), 4000);
  };

  const loadSaved = async () => {
    try {
      const res = await fetch("/__qa/tile-sizing");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { mobile?: TileVarMap; desktop?: TileVarMap };
      if (data.mobile) setMobileVars({ ...defaultVars("base"), ...data.mobile });
      if (data.desktop) setDesktopVars({ ...defaultVars("sm"), ...data.desktop });
      setSaveStatus("loaded saved sizing");
    } catch {
      setSaveStatus("load failed — see console");
      // eslint-disable-next-line no-console
      console.error("tile-sizing load failed");
    }
    setTimeout(() => setSaveStatus(null), 4000);
  };

  const scale = calibration.oneToOne
    ? 1
    : calibration.macCssPxPerInch / PHONE_CSS_PX_PER_INCH;
  const scaledW = Math.round(MOBILE_W * scale);
  const scaledH = Math.round(MOBILE_H * scale);
  const phoneWidthOnScreenMm = calibration.oneToOne
    ? null
    : (scaledW / calibration.macCssPxPerInch) * 25.4;

  const cardWidthPx = (CARD_WIDTH_MM / 25.4) * calibration.macCssPxPerInch;
  const cardHeightPx = (CARD_HEIGHT_MM / 25.4) * calibration.macCssPxPerInch;

  return (
    <div className="mx-auto max-w-[1600px] p-4">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold text-text-primary">Tile sizing</h1>
          <p className="text-xs text-text-muted">
            TestFlight #137 — dial build/match/MCQ tile geometry live. Every
            token defaults to today's shipped rendering; nothing changes
            until a slider moves. Values persist per pane in this browser.
          </p>
        </div>
        <Link
          to={`/${langId}/qa`}
          className="rounded border border-border bg-surface px-2 py-1 text-xs hover:bg-surface-muted"
        >
          ← QA hub
        </Link>
      </header>

      {/* Physical-scale calibration */}
      <section className="mb-4 rounded-xl border border-border bg-surface p-3">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-text-muted">
          Physical scale (mobile pane)
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={calibration.oneToOne}
              onChange={(e) =>
                setCalibration((c) => ({ ...c, oneToOne: e.target.checked }))
              }
            />
            1:1 CSS px (no physical scaling)
          </label>
          <div
            className={`flex items-center gap-2 text-xs ${calibration.oneToOne ? "opacity-40" : ""}`}
          >
            <span className="text-text-secondary">Mac screen px/inch</span>
            <input
              type="range"
              min={80}
              max={260}
              step={1}
              disabled={calibration.oneToOne}
              value={calibration.macCssPxPerInch}
              onChange={(e) =>
                setCalibration((c) => ({
                  ...c,
                  macCssPxPerInch: Number(e.target.value),
                }))
              }
              className="h-1.5 w-40 accent-accent"
            />
            <span className="w-10 text-text-muted">
              {calibration.macCssPxPerInch}
            </span>
          </div>
          <div className="text-xs text-text-muted">
            scale = {scale.toFixed(3)}×
            {phoneWidthOnScreenMm != null && (
              <>
                {" "}
                · phone renders at ~{phoneWidthOnScreenMm.toFixed(1)}mm wide
                (real: {PHONE_PHYSICAL_WIDTH_MM}mm)
              </>
            )}
          </div>
        </div>
        <div
          className={`mt-2 flex items-center justify-center rounded-lg border-2 border-dashed border-accent bg-accent-muted text-[10px] font-semibold text-accent ${calibration.oneToOne ? "opacity-40" : ""}`}
          style={{ width: cardWidthPx, height: cardHeightPx }}
        >
          hold a credit card here — 85.60 × 53.98 mm
        </div>
      </section>

      <div className="flex gap-4 overflow-x-auto">
        {/* Mobile pane */}
        <div className="shrink-0">
          <h2 className="mb-2 text-sm font-semibold text-text-primary">
            Mobile — 430×932 CSS px (15 Pro Max)
          </h2>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => resetPane("mobile")}
              className="rounded border border-border bg-surface px-2 py-1 text-xs hover:bg-surface-muted"
            >
              Reset to shipped defaults
            </button>
            <label className="flex items-center gap-1.5 text-xs text-text-secondary">
              <input
                type="checkbox"
                checked={mobileLocked}
                onChange={() => toggleLock("mobile")}
              />
              Lock tile heights
              {mobileLocked && (
                <span className="text-text-muted">
                  ({mobileLockedHeight != null ? `${mobileLockedHeight}px` : "measuring…"})
                </span>
              )}
            </label>
          </div>
          <div
            className="mb-3 max-h-56 min-w-0 overflow-y-auto rounded-lg border border-border bg-surface-muted/40 p-2"
            style={{ width: CONTROLS_W }}
          >
            <SliderPanel
              vars={mobileVars}
              idPrefix="mobile"
              locked={mobileLocked}
              lockedHeight={mobileLockedHeight}
              onChange={(key, value) =>
                setMobileVars((v) => ({ ...v, [key]: value }))
              }
            />
          </div>
          {/* Scaled physical-size stage. The wrapper is sized to the
              SCALED footprint so surrounding layout doesn't overlap the
              transformed iframe (a scaled element keeps its original box
              for layout purposes unless the container is resized to
              match). */}
          <div
            className="relative overflow-hidden rounded-[2.5rem] border-[6px] border-text-primary/70 bg-black shadow-lg"
            style={{ width: scaledW, height: scaledH }}
          >
            <div
              style={{
                width: MOBILE_W,
                height: MOBILE_H,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              }}
            >
              <iframe
                ref={mobileFrameRef}
                title="Mobile tile preview"
                src={`/${langId}/qa/tiles/frame?view=mobile`}
                width={MOBILE_W}
                height={MOBILE_H}
                style={{ border: "none", display: "block" }}
              />
              {/* Safe-area bezel overlay, drawn in the SAME unscaled
                  coordinate space as the iframe so it scales with it. */}
              <div
                className="pointer-events-none absolute left-0 top-0 w-full border-b border-white/20 bg-black/35"
                style={{ height: SAFE_AREA_TOP_PT }}
              />
              <div
                className="pointer-events-none absolute bottom-0 left-0 w-full border-t border-white/20 bg-black/35"
                style={{ height: SAFE_AREA_BOTTOM_PT }}
              />
            </div>
          </div>
        </div>

        {/* Desktop pane */}
        <div className="shrink-0">
          <h2 className="mb-2 text-sm font-semibold text-text-primary">
            Desktop — 1280×900 CSS px
          </h2>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => resetPane("desktop")}
              className="rounded border border-border bg-surface px-2 py-1 text-xs hover:bg-surface-muted"
            >
              Reset to shipped defaults
            </button>
            <label className="flex items-center gap-1.5 text-xs text-text-secondary">
              <input
                type="checkbox"
                checked={desktopLocked}
                onChange={() => toggleLock("desktop")}
              />
              Lock tile heights
              {desktopLocked && (
                <span className="text-text-muted">
                  ({desktopLockedHeight != null ? `${desktopLockedHeight}px` : "measuring…"})
                </span>
              )}
            </label>
          </div>
          <div
            className="mb-3 max-h-56 min-w-0 overflow-y-auto rounded-lg border border-border bg-surface-muted/40 p-2"
            style={{ width: CONTROLS_W }}
          >
            <SliderPanel
              vars={desktopVars}
              idPrefix="desktop"
              locked={desktopLocked}
              lockedHeight={desktopLockedHeight}
              onChange={(key, value) =>
                setDesktopVars((v) => ({ ...v, [key]: value }))
              }
            />
          </div>
          {/* Element-only, scrollable (Spencer 2026-09-15: "I just need the
              element for desktop not the whole page, make it scrollable").
              The frame itself renders bare now (FOCUSED_FLOW_PATTERN in
              routes/focusedFlow.ts matches /qa/tiles/frame, and Layout.tsx
              additionally drops the sidebar for this one route — see the
              comments there) — this pane is a fixed-height (70vh) outer
              scroller, and the iframe is sized to the frame's REPORTED
              content height (contentHeight message) so there is exactly
              one scrollbar, not one nested inside another.
              Container width is the FULL `DESKTOP_W` (1280), not the old
              900px cap — the iframe itself is 1280 wide (matching a real
              desktop viewport's `sm:` tier), and the previous 900px
              container with `overflow-hidden` was silently CROPPING the
              right ~380px of every fixture (found while fixing this pane;
              it read as part of the same "doesn't fit" complaint). The
              outer row (`overflow-x-auto` below) already handles the
              combined width being wider than the browser window. */}
          <div
            className="overflow-y-auto rounded-lg border border-border"
            style={{ width: DESKTOP_W, height: "70vh" }}
          >
            <iframe
              ref={desktopFrameRef}
              title="Desktop tile preview"
              src={`/${langId}/qa/tiles/frame?view=desktop`}
              width={DESKTOP_W}
              height={desktopContentHeight}
              style={{ border: "none", display: "block" }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => copy(cssText, "CSS")}
          className="rounded border border-accent px-3 py-1.5 text-xs font-semibold text-accent hover:bg-surface-muted"
        >
          Copy CSS
        </button>
        <button
          type="button"
          onClick={() => copy(jsonText, "JSON")}
          className="rounded border border-border bg-surface px-3 py-1.5 text-xs hover:bg-surface-muted"
        >
          Copy JSON
        </button>
        {isDev && (
          <>
            <button
              type="button"
              onClick={save}
              className="rounded border border-accent px-3 py-1.5 text-xs font-semibold text-accent hover:bg-surface-muted"
            >
              Save
            </button>
            {hasSavedFile && (
              <button
                type="button"
                onClick={loadSaved}
                className="rounded border border-border bg-surface px-3 py-1.5 text-xs hover:bg-surface-muted"
              >
                Load saved
              </button>
            )}
          </>
        )}
        {copyStatus && (
          <span className="text-xs text-text-muted">{copyStatus}</span>
        )}
        {saveStatus && (
          <span className="text-xs text-text-muted">{saveStatus}</span>
        )}
      </div>

      <pre className="mt-3 max-h-64 overflow-auto rounded-lg border border-border bg-surface-muted/40 p-3 text-[11px] text-text-secondary">
        {cssText}
      </pre>
    </div>
  );
}
