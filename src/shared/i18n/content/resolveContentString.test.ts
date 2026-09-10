import { describe, expect, it } from "vitest";
import { sha256Hex16 } from "@/shared/tts/sha256";
import {
  resolveContentString,
  resolveContentStringFromCatalogs,
} from "./resolveContentString";

describe("resolveContentStringFromCatalogs (core lookup, synthetic catalogs)", () => {
  const en = "Teacher";
  const anchor = "m6/atom:せんせい/gloss";
  const freshCatalogs = {
    "./ja/m6.ko.json": {
      moduleId: "m6",
      lang: "ja",
      entries: [{ anchor, text: "선생님", enSourceHash: sha256Hex16(en) }],
    },
  };

  it("uiLocale 'en' always returns enText untouched, even with a matching catalog present", () => {
    expect(resolveContentStringFromCatalogs(freshCatalogs, "ja", anchor, en, "en")).toBe(en);
  });

  it("returns the translated string for a fresh catalog entry", () => {
    expect(resolveContentStringFromCatalogs(freshCatalogs, "ja", anchor, en, "ko")).toBe(
      "선생님",
    );
  });

  it("falls back to enText when no catalog exists for this module/locale", () => {
    expect(resolveContentStringFromCatalogs({}, "ja", anchor, en, "ko")).toBe(en);
  });

  it("falls back to enText when the catalog exists but has no entry for this anchor", () => {
    const catalogs = {
      "./ja/m6.ko.json": { moduleId: "m6", lang: "ja", entries: [] },
    };
    expect(resolveContentStringFromCatalogs(catalogs, "ja", anchor, en, "ko")).toBe(en);
  });

  it("falls back to enText when the entry is STALE (en text edited since translation)", () => {
    const staleCatalogs = {
      "./ja/m6.ko.json": {
        moduleId: "m6",
        lang: "ja",
        entries: [{ anchor, text: "선생님", enSourceHash: "0000000000000000" }],
      },
    };
    expect(resolveContentStringFromCatalogs(staleCatalogs, "ja", anchor, en, "ko")).toBe(en);
  });

  it("falls back to enText for a malformed anchor with no '/' separator", () => {
    expect(resolveContentStringFromCatalogs(freshCatalogs, "ja", "no-slash-anchor", en, "ko")).toBe(
      en,
    );
  });

  it("keys the lookup by lang AND moduleId — a same-moduleId anchor under a different lang doesn't match", () => {
    expect(resolveContentStringFromCatalogs(freshCatalogs, "es", anchor, en, "ko")).toBe(en);
  });

  it("a Korean gloss reaching the catalog as enText itself still just round-trips — this function never re-decides gloss language, it only checks hashes (KO-source de-coupling note: unlike the three grading de-couplings, there is no script assumption baked in here)", () => {
    // enText can legitimately BE non-Latin (e.g. this function called on an
    // already-English-instruction JA course has enText="Teacher"; nothing
    // about the lookup logic assumes enText is ASCII/Latin).
    const koSourceCatalogs = {
      "./ja/m6.es.json": {
        moduleId: "m6",
        lang: "ja",
        entries: [{ anchor, text: "Profesor", enSourceHash: sha256Hex16(en) }],
      },
    };
    expect(resolveContentStringFromCatalogs(koSourceCatalogs, "ja", anchor, en, "es")).toBe(
      "Profesor",
    );
  });
});

describe("resolveContentString (production wiring, real glob-loaded catalogs)", () => {
  it("falls back to English today — no translated *.ko.json / *.es.json sidecar exists yet under src/shared/i18n/content/", () => {
    // This pins the current, EXPECTED state (see the file header): the MT
    // wave that produces translated sidecars hasn't run. If this test ever
    // fails because a real ko/es catalog now exists, that's good news —
    // update the assertion, don't just delete the test.
    expect(resolveContentString("ja", "m6/atom:せんせい/gloss", "Teacher", "ko")).toBe("Teacher");
  });

  it("uiLocale 'en' short-circuits without even needing an anchor to resolve", () => {
    expect(resolveContentString("ja", "anything", "Hello", "en")).toBe("Hello");
  });
});
