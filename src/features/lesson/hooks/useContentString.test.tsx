/**
 * Rung 1b deliverable: mount a real step view with a FAKE `ko` catalog
 * entry and confirm the KO-source wiring actually swaps the rendered
 * string — not just that `resolveContentString`/`useContentString` are
 * unit-correct in isolation (see `resolveContentString.test.ts` and
 * `anchors.test.ts` for those).
 *
 * `react-i18next` is mocked with a MUTABLE locale (via `vi.hoisted`) so the
 * same mounted tree's `uiLocale` can be flipped between tests without
 * remounting a `LanguageProvider`/`I18nextProvider` — `InfoStepView` (and
 * every other wired step view) reads locale purely through
 * `useTranslation().i18n.language`, never React context, by design (see
 * `useContentString.ts`'s doc comment).
 *
 * `@/shared/i18n/content/resolveContentString` is partially mocked: the
 * real `resolveContentStringFromCatalogs` (the pure lookup this whole
 * feature is built on) runs unchanged, just against an in-memory fake
 * catalog instead of the real (currently-empty) `import.meta.glob` map —
 * `TRANSLATED_CATALOGS` has no `*.ko.json` sidecars checked in yet, so
 * without this the "ko" path would be untestable until the MT wave lands.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { sha256Hex16 } from "@/shared/tts/sha256";
import { bodyAnchor } from "@/shared/i18n/content/anchors";
import type { InfoStep } from "../types";

const mockLocale = vi.hoisted(() => ({ current: "en" }));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
    i18n: { language: mockLocale.current },
  }),
}));

const LESSON_ID = "ja-m6-info-test";
const MODULE_ID = "m6";
const EN_BODY = "Bowing is a common greeting in Japan.";
const KO_BODY = "인사할 때 일본에서는 흔히 고개를 숙입니다.";
const FAKE_ANCHOR = bodyAnchor(MODULE_ID, LESSON_ID, EN_BODY);

vi.mock("@/shared/i18n/content/resolveContentString", async () => {
  const actual = await vi.importActual<
    typeof import("@/shared/i18n/content/resolveContentString")
  >("@/shared/i18n/content/resolveContentString");

  const FAKE_CATALOGS = {
    "./ja/m6.ko.json": {
      moduleId: MODULE_ID,
      lang: "ko",
      entries: [
        {
          anchor: FAKE_ANCHOR,
          text: KO_BODY,
          enSourceHash: sha256Hex16(EN_BODY),
        },
      ],
    },
  };

  return {
    ...actual,
    resolveContentString: (
      lang: string,
      anchor: string,
      enText: string,
      uiLocale: string,
    ) =>
      actual.resolveContentStringFromCatalogs(
        FAKE_CATALOGS,
        lang,
        anchor,
        enText,
        uiLocale,
      ),
  };
});

// Imported AFTER the mocks so the module graph picks them up.
const { InfoStepView } = await import("../components/steps/InfoStepView");

function makeStep(): InfoStep {
  return {
    id: "info-test",
    type: "info",
    body: EN_BODY,
  };
}

describe("KO-source content wiring — mounted step view", () => {
  beforeEach(() => {
    mockLocale.current = "en";
  });

  it("renders the Korean catalog string under a ko UI locale", () => {
    mockLocale.current = "ko";
    render(
      <InfoStepView step={makeStep()} onContinue={vi.fn()} lessonId={LESSON_ID} />,
    );
    expect(screen.getByText(KO_BODY)).toBeInTheDocument();
    expect(screen.queryByText(EN_BODY)).not.toBeInTheDocument();
  });

  it("renders the original English string under the en UI locale (pure passthrough)", () => {
    mockLocale.current = "en";
    render(
      <InfoStepView step={makeStep()} onContinue={vi.fn()} lessonId={LESSON_ID} />,
    );
    expect(screen.getByText(EN_BODY)).toBeInTheDocument();
    expect(screen.queryByText(KO_BODY)).not.toBeInTheDocument();
  });

  it("renders the original English string under a UI locale with no matching catalog entry", () => {
    mockLocale.current = "es";
    render(
      <InfoStepView step={makeStep()} onContinue={vi.fn()} lessonId={LESSON_ID} />,
    );
    expect(screen.getByText(EN_BODY)).toBeInTheDocument();
  });
});
