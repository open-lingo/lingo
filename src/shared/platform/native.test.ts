import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { IS_NATIVE, NATIVE_APP_ID, nativeCallbackUrl } from "./native";

describe("native platform constants", () => {
  it("keeps NATIVE_APP_ID in sync with capacitor.config.ts", () => {
    // These two cannot import each other — `capacitor.config.ts` is loaded by
    // the Capacitor CLI outside Vite (no `@/` alias) and `native.ts` is loaded
    // by the bundle. If they drift, the iOS app registers one URL scheme and
    // asks Auth0 to redirect to another, so login dead-ends in Safari with no
    // error the app can see. Read the config as text rather than importing it,
    // so this test doesn't need the CLI's types under happy-dom.
    // `process.cwd()`, not `import.meta.url`: under happy-dom `import.meta.url`
    // is an http:// URL and `fileURLToPath` rejects it. Vitest runs from the
    // repo root, where capacitor.config.ts lives.
    const config = readFileSync(
      path.resolve(process.cwd(), "capacitor.config.ts"),
      "utf8",
    );
    const appId = config.match(/appId:\s*"([^"]+)"/)?.[1];
    expect(appId).toBe(NATIVE_APP_ID);
  });

  it("is not native under the test/web runtime", () => {
    // The whole "shipping iOS doesn't touch the web app" claim rests on this
    // being false anywhere that isn't a Capacitor webview.
    expect(IS_NATIVE).toBe(false);
  });

  it("builds Auth0's Capacitor callback shape", () => {
    // Must match what gets pasted into Auth0's Allowed Callback URLs verbatim.
    expect(nativeCallbackUrl("tenant.us.auth0.com")).toBe(
      "com.openlingo.app://tenant.us.auth0.com/capacitor/com.openlingo.app/callback",
    );
  });
});
