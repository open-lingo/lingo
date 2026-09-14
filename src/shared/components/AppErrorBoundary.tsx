import { Component, type ErrorInfo, type ReactNode } from "react";
import { CHUNK_RELOAD_FLAG } from "@/shared/utils/lazyRetry";

/**
 * Top-level React error boundary (TestFlight #64, build 11: a blank white
 * screen with no crash report). `RouteErrorBoundary` only covers the router
 * subtree; a throw in any provider above it — or in the router's own setup —
 * unmounted the whole root and left the WKWebView white. This wraps the
 * ENTIRE provider tree in main.tsx, so the fallback must not depend on any
 * provider: no i18n, no theme context, no router. Plain English, inline
 * colours (the cream/ink pair from index.css), `window.location` navigation.
 *
 * `public/boot-guard.js` is the layer under this one — it handles the cases
 * React never gets to (module-scope throws, missing chunks, a dead content
 * process).
 */
type Props = { children: ReactNode; onError?: (error: Error, info: ErrorInfo) => void };
type State = { error: Error | null };

// prod #86 (2026-09-14): a tab left open across a deploy hits this boundary
// with "Failed to fetch dynamically imported module" (or the sibling
// browser-native chunk-load phrasings) after `lazyRetry` has already burned
// its 3 retries + 1 reload for the OLD build. The generic "something went
// wrong" copy reads as a crash; it's actually just a stale tab. Swap in
// copy that tells the user to reload, and clear the build-keyed reload flag
// first so the manual Reload gets a full fresh retry budget for the NEW
// build's chunks instead of inheriting the old build's spent guard.
const CHUNK_ERROR_PATTERN = /dynamically imported module|Importing a module script failed|Loading chunk|ChunkLoadError/i;

function isChunkLoadError(error: Error): boolean {
  return CHUNK_ERROR_PATTERN.test(error.message);
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Keep a copy where a Reload-then-report flow can find it; the boot guard
    // reads the same slot so its fallback can show the reason on a re-throw.
    const guard = (window as unknown as { __lingoBootGuard?: { firstError: string | null } }).__lingoBootGuard;
    if (guard && !guard.firstError) guard.firstError = `${error.name}: ${error.message}`;
    console.error("[AppErrorBoundary]", error, info.componentStack);
    this.props.onError?.(error, info);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    const chunkError = isChunkLoadError(error);
    const heading = chunkError ? "Update available" : "Something went wrong";
    const body = chunkError
      ? "The app was updated while this page was open. Reload to get the new version."
      : "The app hit an error it couldn’t recover from. Reloading usually fixes it.";
    return (
      <div
        role="alert"
        data-testid="app-error-boundary"
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
          padding: "max(32px, env(safe-area-inset-top)) 24px max(32px, env(safe-area-inset-bottom))",
          background: "#f5f0e6",
          color: "#2a2420",
          font: "16px/1.4 -apple-system, 'Instrument Sans', system-ui, sans-serif",
          textAlign: "center",
        }}
      >
        <p style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{heading}</p>
        <p style={{ margin: 0, maxWidth: "22rem", color: "#6b625b", fontSize: 14 }}>{body}</p>
        <div style={{ display: "flex", gap: 10, marginTop: 6, flexWrap: "wrap", justifyContent: "center" }}>
          <button
            type="button"
            onClick={() => {
              // Reset the build-keyed reload guard so this manual reload
              // doesn't inherit a spent retry budget from the build that
              // just threw (prod #86).
              try {
                sessionStorage.removeItem(CHUNK_RELOAD_FLAG);
              } catch {
                // ignore
              }
              window.location.reload();
            }}
            style={{
              minHeight: 44,
              padding: "10px 28px",
              border: 0,
              borderRadius: 12,
              background: "#a5321f",
              color: "#fff",
              font: "inherit",
              fontWeight: 700,
              letterSpacing: ".02em",
              textTransform: "uppercase",
            }}
          >
            Reload
          </button>
          <button
            type="button"
            onClick={() => window.location.assign("/")}
            style={{
              minHeight: 44,
              padding: "10px 28px",
              border: "1.5px solid #a5321f",
              borderRadius: 12,
              background: "transparent",
              color: "#a5321f",
              font: "inherit",
              fontWeight: 700,
              letterSpacing: ".02em",
              textTransform: "uppercase",
            }}
          >
            Go home
          </button>
        </div>
        <p style={{ margin: "10px 0 0", maxWidth: "24rem", color: "#8a7f76", fontSize: 12, wordBreak: "break-word" }}>
          {error.name}: {error.message}
        </p>
      </div>
    );
  }
}
