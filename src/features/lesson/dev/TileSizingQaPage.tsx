/**
 * `/:lang/qa/tiles` — tile sizing dial (TestFlight #137), rewritten
 * 2026-09-15 to Spencer's spec: "sizing not applying evenly to the different
 * step types, needs different separation for each step type AND they can
 * scale off the plain tile."
 *
 * Model
 *   - One PLAIN TILE section (build, dense tier). Every derived step type
 *     (12+ tiles, ≤6 tiles, listening build) scales off it with unitless
 *     multipliers; each derived section has a "scale / absolute" switch that
 *     sets or clears the `--X-abs` override the CSS prefers (see
 *     `tileSizingTokens.ts`). Match, options and the overlay card have their
 *     own absolute tokens (Spencer: match may be its own height as long as it
 *     is uniform).
 *   - You edit ONE tier at a time (Mobile <640px / Desktop ≥640px, the app's
 *     `sm:` breakpoint); both panes stay visible. Values persist per tier in
 *     localStorage and can be saved to `docs/qa/tile-sizing.json` through the
 *     dev-only Vite middleware (`/__qa/tile-sizing`).
 *   - Mobile pane: a 430×932 iframe scaled to the phone's PHYSICAL size on
 *     this screen (credit-card calibration). Desktop pane: a 1280px iframe of
 *     the bare lesson element, scaled to fit its column, height from the
 *     frame's reported content height, the outer pane scrolls.
 *   - Clicking a section header scrolls both panes to the fixture it dials.
 *
 * Protocol with the iframes: `tileSizingMessage.ts`. Lock-heights logic lives
 * in the frame (it measures and applies itself); the page only toggles it.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { TILE_QA_MESSAGE } from "./tileSizingMessage";
import {
  TILE_SECTIONS,
  TILE_TOKEN_DEFS,
  absDefault,
  defaultVars,
  formatAbs,
  formatVar,
  sectionTokens,
  type TileSection,
  type TileTier,
  type TileTokenDef,
  type TileVarMap,
} from "./tileSizingTokens";

const MOBILE_W = 430;
const MOBILE_H = 932;
const DESKTOP_W = 1280;
const PHONE_CSS_PX_PER_INCH = 153.3; // 15 Pro Max: 460 ppi / 3
const PHONE_SCREEN_WIDTH_MM = 71.6;
const CARD_WIDTH_MM = 85.6;
const CARD_HEIGHT_MM = 53.98;
const SAFE_TOP_PT = 59;
const SAFE_BOTTOM_PT = 34;

const LS_VARS = { base: "lingo:qa-tiles-vars:mobile:v1", sm: "lingo:qa-tiles-vars:desktop:v1" } as const;
const LS_MODES = { base: "lingo:qa-tiles-modes:mobile:v1", sm: "lingo:qa-tiles-modes:desktop:v1" } as const;
const LS_CALIBRATION = "lingo:qa-tiles-calibration:v1";

type SectionMode = "scale" | "abs";
type ModeMap = Partial<Record<TileSection, SectionMode>>;
type Calibration = { macCssPxPerInch: number; oneToOne: boolean };

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...(JSON.parse(raw) as T) };
  } catch {
    return fallback;
  }
}
function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode / blocked storage — the page still works for the session */
  }
}

/** The exact {property: value} block a tier's frame should apply. Scale
 *  tokens emit their scale key always and their abs key only in abs mode;
 *  in scale mode the abs key is CLEARED so the CSS fallback (base × scale)
 *  takes over again. */
function resolveTier(vars: TileVarMap, modes: ModeMap, tier: TileTier) {
  const set: Record<string, string> = {};
  const clear: string[] = [];
  for (const def of TILE_TOKEN_DEFS) {
    set[def.key] = formatVar(def, vars[def.key], tier);
    if (def.absKey) {
      if (modes[def.section] === "abs") set[def.absKey] = formatAbs(def, vars[def.absKey], tier);
      else clear.push(def.absKey);
    }
  }
  return { set, clear };
}

function cssBlock(vars: TileVarMap, modes: ModeMap, tier: TileTier): string {
  const { set } = resolveTier(vars, modes, tier);
  const lines = Object.entries(set).map(([k, v]) => `  ${k}: ${v};`);
  return tier === "base"
    ? `:root {\n${lines.join("\n")}\n}`
    : `@media (min-width: 640px) {\n  :root {\n${lines.map((l) => "  " + l).join("\n")}\n  }\n}`;
}

function fmt(n: number, step: number) {
  const d = step >= 1 ? 0 : Math.min(4, Math.ceil(-Math.log10(step)));
  return n.toFixed(d).replace(/\.?0+$/, "");
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  onReset,
  isDefault,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
  onReset: () => void;
  isDefault: boolean;
}) {
  return (
    <label className="grid grid-cols-[minmax(0,1fr)_7rem_4.5rem_1.5rem] items-center gap-2 text-xs">
      <span className="truncate text-text-muted" title={label}>
        {label}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-accent"
      />
      <span className="flex items-center gap-1">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={fmt(value, step)}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (Number.isFinite(v)) onChange(v);
          }}
          className="w-14 rounded border border-border bg-surface px-1 py-0.5 text-right tabular-nums"
        />
        <span className="w-6 text-text-muted">{unit || "×"}</span>
      </span>
      <button
        type="button"
        onClick={onReset}
        title="reset to shipped default"
        className={`rounded px-1 text-[10px] ${isDefault ? "invisible" : "text-text-muted hover:text-text-primary"}`}
      >
        ↺
      </button>
    </label>
  );
}

export default function TileSizingQaPage() {
  const langPath = useLangPath();
  const [tier, setTier] = useState<TileTier>("base");
  const [vars, setVars] = useState<Record<TileTier, TileVarMap>>(() => ({
    base: readJson(LS_VARS.base, defaultVars("base")),
    sm: readJson(LS_VARS.sm, defaultVars("sm")),
  }));
  const [modes, setModes] = useState<Record<TileTier, ModeMap>>(() => ({
    base: readJson(LS_MODES.base, {}),
    sm: readJson(LS_MODES.sm, {}),
  }));
  const [calibration, setCalibration] = useState<Calibration>(() =>
    readJson(LS_CALIBRATION, { macCssPxPerInch: 127, oneToOne: false }),
  );
  const [locked, setLocked] = useState<Record<TileTier, boolean>>({ base: false, sm: false });
  const [lockedHeight, setLockedHeight] = useState<Record<TileTier, number | null>>({ base: null, sm: null });
  const [desktopContentH, setDesktopContentH] = useState(1800);
  const [ready, setReady] = useState<Record<TileTier, boolean>>({ base: false, sm: false });
  const [status, setStatus] = useState<string | null>(null);
  const [hasSavedFile, setHasSavedFile] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ base: true });
  const [showCalibration, setShowCalibration] = useState(false);
  const mobileRef = useRef<HTMLIFrameElement>(null);
  const desktopRef = useRef<HTMLIFrameElement>(null);
  const desktopColRef = useRef<HTMLDivElement>(null);
  const [desktopColW, setDesktopColW] = useState(640);

  const frameFor = (t: TileTier) => (t === "base" ? mobileRef : desktopRef).current?.contentWindow ?? null;

  // Push the FULL resolved map for a tier (never a diff) so a reloaded
  // frame converges. Skips --tile-box-h while that pane is locked.
  const push = useCallback(
    (t: TileTier) => {
      const win = frameFor(t);
      if (!win) return;
      const { set, clear } = resolveTier(vars[t], modes[t], t);
      if (locked[t]) delete set["--tile-box-h"];
      win.postMessage({ source: TILE_QA_MESSAGE.source, type: TILE_QA_MESSAGE.setVars, vars: set }, "*");
      if (clear.length) win.postMessage({ source: TILE_QA_MESSAGE.source, type: TILE_QA_MESSAGE.clearVars, keys: clear }, "*");
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [vars, modes, locked],
  );

  useEffect(() => {
    if (ready.base) push("base");
    writeJson(LS_VARS.base, vars.base);
    writeJson(LS_MODES.base, modes.base);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vars.base, modes.base, ready.base]);
  useEffect(() => {
    if (ready.sm) push("sm");
    writeJson(LS_VARS.sm, vars.sm);
    writeJson(LS_MODES.sm, modes.sm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vars.sm, modes.sm, ready.sm]);
  useEffect(() => writeJson(LS_CALIBRATION, calibration), [calibration]);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const d = e.data;
      if (!d || d.source !== TILE_QA_MESSAGE.source) return;
      const t: TileTier = d.view === "desktop" ? "sm" : "base";
      if (d.type === TILE_QA_MESSAGE.ready) setReady((r) => ({ ...r, [t]: true }));
      else if (d.type === TILE_QA_MESSAGE.lockMeasured) setLockedHeight((h) => ({ ...h, [t]: d.height ?? null }));
      else if (d.type === TILE_QA_MESSAGE.contentHeight && t === "sm") setDesktopContentH(Math.max(600, Number(d.height) || 0));
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    fetch("/__qa/tile-sizing")
      .then((r) => setHasSavedFile(r.ok))
      .catch(() => setHasSavedFile(false));
  }, []);

  useEffect(() => {
    const el = desktopColRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setDesktopColW(el.clientWidth));
    ro.observe(el);
    setDesktopColW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const setVar = (key: string, value: number) =>
    setVars((v) => ({ ...v, [tier]: { ...v[tier], [key]: value } }));
  const resetVar = (def: TileTokenDef) =>
    setVars((v) => {
      const next = { ...v[tier], [def.key]: def[tier] };
      if (def.absKey) next[def.absKey] = absDefault(def, tier);
      return { ...v, [tier]: next };
    });
  const setMode = (section: TileSection, mode: SectionMode) =>
    setModes((m) => ({ ...m, [tier]: { ...m[tier], [section]: mode } }));
  const resetSection = (section: TileSection) =>
    setVars((v) => {
      const next = { ...v[tier] };
      for (const def of TILE_TOKEN_DEFS.filter((d) => d.section === section)) {
        next[def.key] = def[tier];
        if (def.absKey) next[def.absKey] = absDefault(def, tier);
      }
      return { ...v, [tier]: next };
    });
  const resetAll = () => {
    setVars((v) => ({ ...v, [tier]: defaultVars(tier) }));
    setModes((m) => ({ ...m, [tier]: {} }));
  };

  const toggleLock = (t: TileTier) => {
    const next = !locked[t];
    setLocked((l) => ({ ...l, [t]: next }));
    frameFor(t)?.postMessage({ source: TILE_QA_MESSAGE.source, type: TILE_QA_MESSAGE.setLock, locked: next }, "*");
    if (!next) setTimeout(() => push(t), 0);
  };
  const adoptLockedHeight = (t: TileTier) => {
    const h = lockedHeight[t];
    if (h == null) return;
    setVars((v) => ({ ...v, [t]: { ...v[t], "--tile-box-h": h } }));
    if (locked[t]) toggleLock(t);
  };

  const scrollPanesTo = (fixture: string) => {
    for (const t of ["base", "sm"] as TileTier[])
      frameFor(t)?.postMessage({ source: TILE_QA_MESSAGE.source, type: TILE_QA_MESSAGE.scrollTo, fixture }, "*");
  };

  const cssText = useMemo(
    () => `${cssBlock(vars.base, modes.base, "base")}\n\n${cssBlock(vars.sm, modes.sm, "sm")}\n`,
    [vars, modes],
  );
  const jsonPayload = () => ({
    mobile: resolveTier(vars.base, modes.base, "base").set,
    desktop: resolveTier(vars.sm, modes.sm, "sm").set,
    raw: { mobile: vars.base, desktop: vars.sm, modes },
    savedAt: new Date().toISOString(),
  });

  const flash = (msg: string, ms = 2500) => {
    setStatus(msg);
    setTimeout(() => setStatus(null), ms);
  };
  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      flash(`${label} copied`);
    } catch {
      // eslint-disable-next-line no-console
      console.log(text);
      flash(`${label}: clipboard blocked — printed to console`);
    }
  };
  const save = async () => {
    try {
      const res = await fetch("/__qa/tile-sizing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jsonPayload()),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setHasSavedFile(true);
      const now = new Date();
      flash(`saved ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")} → docs/qa/tile-sizing.json`, 4000);
    } catch {
      flash("save failed — dev server only", 4000);
    }
  };
  const load = async () => {
    try {
      const res = await fetch("/__qa/tile-sizing");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { raw?: { mobile?: TileVarMap; desktop?: TileVarMap; modes?: Record<TileTier, ModeMap> }; mobile?: TileVarMap; desktop?: TileVarMap };
      const m = data.raw?.mobile ?? data.mobile;
      const d = data.raw?.desktop ?? data.desktop;
      if (m) setVars((v) => ({ ...v, base: { ...defaultVars("base"), ...m } }));
      if (d) setVars((v) => ({ ...v, sm: { ...defaultVars("sm"), ...d } }));
      if (data.raw?.modes) setModes(data.raw.modes);
      flash("loaded docs/qa/tile-sizing.json");
    } catch {
      flash("load failed", 4000);
    }
  };

  // Physical scale for the mobile pane.
  const scale = calibration.oneToOne ? 1 : calibration.macCssPxPerInch / PHONE_CSS_PX_PER_INCH;
  const phoneW = Math.round(MOBILE_W * scale);
  const phoneH = Math.round(MOBILE_H * scale);
  const cardW = (CARD_WIDTH_MM / 25.4) * calibration.macCssPxPerInch;
  const cardH = (CARD_HEIGHT_MM / 25.4) * calibration.macCssPxPerInch;
  const desktopScale = Math.min(1, desktopColW / DESKTOP_W);

  const tierVars = vars[tier];
  const tierModes = modes[tier];
  const frameBase = `${langPath("/qa/tiles/frame")}`;

  return (
    <div className="min-h-screen bg-background px-4 pb-16 pt-3 text-text-primary">
      {/* Header */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h1 className="mr-2 text-lg font-bold">Tile sizing</h1>
        <div className="inline-flex overflow-hidden rounded-lg border border-border text-xs">
          {(["base", "sm"] as TileTier[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTier(t)}
              className={`px-3 py-1.5 font-semibold ${tier === t ? "bg-accent text-white" : "bg-surface text-text-muted hover:text-text-primary"}`}
            >
              {t === "base" ? "Editing: Mobile (<640px)" : "Editing: Desktop (≥640px)"}
            </button>
          ))}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-1.5 text-xs">
          {import.meta.env.DEV && (
            <>
              <button type="button" onClick={save} className="rounded-lg bg-accent px-3 py-1.5 font-semibold text-white">
                Save
              </button>
              <button
                type="button"
                onClick={load}
                disabled={!hasSavedFile}
                className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-40"
              >
                Load saved
              </button>
            </>
          )}
          <button type="button" onClick={() => copy(cssText, "CSS")} className="rounded-lg border border-border px-3 py-1.5">
            Copy CSS
          </button>
          <button type="button" onClick={() => copy(JSON.stringify(jsonPayload(), null, 2), "JSON")} className="rounded-lg border border-border px-3 py-1.5">
            Copy JSON
          </button>
          <button type="button" onClick={resetAll} className="rounded-lg border border-border px-3 py-1.5 text-text-muted">
            Reset {tier === "base" ? "mobile" : "desktop"} to shipped
          </button>
          <button
            type="button"
            onClick={() => setShowCalibration((s) => !s)}
            className="rounded-lg border border-border px-3 py-1.5 text-text-muted"
          >
            Physical scale {calibration.oneToOne ? "off" : `${scale.toFixed(2)}×`}
          </button>
          {status && <span className="rounded bg-surface-muted px-2 py-1 text-text-muted">{status}</span>}
        </div>
      </div>

      {showCalibration && (
        <div className="mb-3 flex flex-wrap items-center gap-4 rounded-xl border border-border bg-surface p-3 text-xs">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={calibration.oneToOne}
              onChange={(e) => setCalibration((c) => ({ ...c, oneToOne: e.target.checked }))}
            />
            1:1 CSS px (no physical scaling)
          </label>
          <label className={`flex items-center gap-2 ${calibration.oneToOne ? "opacity-40" : ""}`}>
            Mac screen px/inch
            <input
              type="range"
              min={80}
              max={200}
              step={1}
              disabled={calibration.oneToOne}
              value={calibration.macCssPxPerInch}
              onChange={(e) => setCalibration((c) => ({ ...c, macCssPxPerInch: Number(e.target.value) }))}
            />
            <span className="tabular-nums">{calibration.macCssPxPerInch}</span>
          </label>
          <span className="text-text-muted">
            phone renders {((phoneW / calibration.macCssPxPerInch) * 25.4).toFixed(1)} mm wide (real {PHONE_SCREEN_WIDTH_MM} mm)
          </span>
          <div
            className="flex items-center justify-center rounded-md border-2 border-dashed border-accent text-[10px] text-accent"
            style={{ width: cardW, height: cardH }}
          >
            hold a credit card here — 85.60 × 53.98 mm
          </div>
        </div>
      )}

      {/* Body: controls | panes */}
      <div className="grid gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
        {/* Controls */}
        <div className="max-h-[calc(100vh-6rem)] overflow-y-auto pr-1 lg:sticky lg:top-3">
          {TILE_SECTIONS.map((sec) => {
            const tokens = sectionTokens(sec.id);
            const mode: SectionMode = tierModes[sec.id] ?? "scale";
            const open = openSections[sec.id] ?? false;
            return (
              <section key={sec.id} className="mb-2 rounded-xl border border-border bg-surface" data-qa-section={sec.id}>
                <header className="flex items-center gap-2 px-3 py-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOpenSections((o) => ({ ...o, [sec.id]: !open }));
                      scrollPanesTo(sec.fixture);
                    }}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm font-semibold"
                    title="show this step type in both panes"
                  >
                    <span className="text-text-muted">{open ? "▾" : "▸"}</span>
                    <span className="truncate">{sec.label}</span>
                  </button>
                  {sec.derived && (
                    <span className="inline-flex overflow-hidden rounded border border-border text-[10px]">
                      {(["scale", "abs"] as SectionMode[]).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setMode(sec.id, m)}
                          className={`px-1.5 py-0.5 ${mode === m ? "bg-accent text-white" : "text-text-muted"}`}
                          title={m === "scale" ? "multipliers over the plain tile" : "absolute values for this step type only"}
                        >
                          {m === "scale" ? "× base" : "absolute"}
                        </button>
                      ))}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => resetSection(sec.id)}
                    className="text-[10px] text-text-muted hover:text-text-primary"
                    title="reset this section to shipped defaults"
                  >
                    reset
                  </button>
                </header>
                {open && (
                  <div className="space-y-1.5 border-t border-border px-3 py-2">
                    {sec.note && <p className="text-[11px] text-text-muted">{sec.note}</p>}
                    {sec.id === "base" && (
                      <div className="mb-1 flex flex-wrap items-center gap-2 rounded-lg bg-surface-muted px-2 py-1.5 text-[11px]">
                        <label className="flex items-center gap-1.5">
                          <input type="checkbox" checked={locked[tier]} onChange={() => toggleLock(tier)} />
                          Lock tile heights
                        </label>
                        <span className="text-text-muted">
                          {locked[tier] && lockedHeight[tier] != null ? `every build tile → ${lockedHeight[tier]}px` : "measures the tallest 8-tile fixture tile and pins all build tiles to it"}
                        </span>
                        {locked[tier] && lockedHeight[tier] != null && (
                          <button type="button" onClick={() => adoptLockedHeight(tier)} className="rounded border border-border px-1.5 py-0.5">
                            adopt as floor
                          </button>
                        )}
                      </div>
                    )}
                    {tokens.map((def) => {
                      const useAbs = def.kind === "scale" && mode === "abs" && def.absKey;
                      const key = useAbs ? def.absKey! : def.key;
                      const shipped = useAbs ? absDefault(def, tier) : def[tier];
                      const value = tierVars[key] ?? shipped;
                      return (
                        <Slider
                          key={key}
                          label={useAbs ? def.label.replace(" × base", "") : def.label}
                          value={value}
                          min={useAbs ? def.absMin! : def.min}
                          max={useAbs ? def.absMax! : def.max}
                          step={useAbs ? def.absStep! : def.step}
                          unit={useAbs ? def.absUnit ?? "px" : def.unit}
                          onChange={(v) => setVar(key, v)}
                          onReset={() => resetVar(def)}
                          isDefault={Math.abs(value - shipped) < 1e-9}
                        />
                      );
                    })}
                    {sec.derived && mode === "scale" && (
                      <p className="text-[10px] text-text-muted">
                        Effective now:{" "}
                        {tokens
                          .filter((d) => d.kind === "scale")
                          .map((d) => `${d.label.replace(" × base", "")} ${fmt(absDefaultLive(d, tierVars, tier), 0.1)}px`)
                          .join(" · ")}
                      </p>
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>

        {/* Panes */}
        <div className="grid gap-4 2xl:grid-cols-[auto_minmax(0,1fr)]">
          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-text-muted">
              <span>Mobile — {MOBILE_W}×{MOBILE_H} CSS px (15 Pro Max){tier === "base" ? " · editing" : ""}</span>
              <span>{calibration.oneToOne ? "1:1" : `${scale.toFixed(3)}× physical`}</span>
            </div>
            <div
              className="relative overflow-hidden rounded-[2.2rem] border-[6px] border-black bg-black shadow-xl"
              style={{ width: phoneW + 12, height: phoneH + 12 }}
            >
              <div className="absolute left-0 top-0 origin-top-left" style={{ transform: `scale(${scale})`, width: MOBILE_W, height: MOBILE_H }}>
                <iframe
                  ref={mobileRef}
                  title="mobile"
                  src={`${frameBase}?view=mobile`}
                  width={MOBILE_W}
                  height={MOBILE_H}
                  className="block bg-background"
                />
                <div aria-hidden className="pointer-events-none absolute left-0 right-0 top-0 border-b border-dashed border-error/50" style={{ height: SAFE_TOP_PT }} />
                <div aria-hidden className="pointer-events-none absolute bottom-0 left-0 right-0 border-t border-dashed border-error/50" style={{ height: SAFE_BOTTOM_PT }} />
              </div>
            </div>
          </div>
          <div ref={desktopColRef} className="min-w-0">
            <div className="mb-1 flex items-center justify-between text-xs text-text-muted">
              <span>Desktop — {DESKTOP_W} CSS px, lesson element only{tier === "sm" ? " · editing" : ""}</span>
              <span>{desktopScale < 1 ? `${desktopScale.toFixed(2)}× to fit` : "1:1"}</span>
            </div>
            <div className="max-h-[calc(100vh-7rem)] overflow-y-auto rounded-xl border border-border bg-surface">
              <div style={{ width: DESKTOP_W * desktopScale, height: desktopContentH * desktopScale }}>
                <iframe
                  ref={desktopRef}
                  title="desktop"
                  src={`${frameBase}?view=desktop`}
                  width={DESKTOP_W}
                  height={desktopContentH}
                  className="block origin-top-left bg-background"
                  style={{ transform: `scale(${desktopScale})` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Effective px of a scale token given the CURRENT base values (not the shipped ones). */
function absDefaultLive(def: TileTokenDef, vars: TileVarMap, tier: TileTier): number {
  const baseKey = def.key.endsWith("-font-scale") ? "--tile-font" : def.key.endsWith("-px-scale") ? "--tile-px" : "--tile-py";
  const baseDef = TILE_TOKEN_DEFS.find((d) => d.key === baseKey);
  const base = vars[baseKey] ?? (baseDef ? baseDef[tier] : 0);
  return base * (vars[def.key] ?? def[tier]);
}
