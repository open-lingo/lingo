import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  AUTH_BYPASS,
  DEV_AUTH_BYPASS,
  NATIVE_AUTH_BYPASS,
} from "./bypass";

describe("auth bypass", () => {
  // The native bypass is the one door that CAN survive into a production
  // build, so "off unless someone deliberately opened it" is the property
  // worth pinning. The test run sets neither env var, which is exactly the
  // state a CI build and the deploy workflow are in.
  it("is off by default", () => {
    expect(DEV_AUTH_BYPASS).toBe(false);
    expect(NATIVE_AUTH_BYPASS).toBe(false);
    expect(AUTH_BYPASS).toBe(false);
  });

  it("cannot be enabled by the env var alone — it also needs a native build", () => {
    // Guards the fence, not the flag: `IS_NATIVE` is the term that makes a
    // leaked VITE_NATIVE_AUTH_BYPASS harmless in any browser build. If someone
    // later "simplifies" the condition down to the env var, this fails.
    // `process.cwd()`: under happy-dom `import.meta.url` is an http:// URL.
    const text = readFileSync(
      path.resolve(process.cwd(), "src/shared/auth/bypass.ts"),
      "utf8",
    );
    expect(text).toMatch(
      /NATIVE_AUTH_BYPASS\s*=\s*\n?\s*IS_NATIVE\s*&&\s*import\.meta\.env\.VITE_NATIVE_AUTH_BYPASS/,
    );
  });
});
