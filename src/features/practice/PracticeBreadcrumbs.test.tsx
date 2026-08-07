import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

vi.mock("@/shared/hooks/useLangPath", () => ({
  useLang: () => "ko",
  useLangPath: () => (p: string) => `/ko/${p.replace(/^\//, "")}`,
}));

// One pillar loses its hub, on demand — the trail must then name the level
// WITHOUT offering a link to it. Every pillar has a hub today, so this is the
// only way to exercise the guard against the crumb the user complained about
// ("does nothing, not a real path").
let readingHasNoHub = false;
vi.mock("./pillars", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./pillars")>();
  return {
    ...actual,
    getPillarsForLanguage: (langId: string, flags: Parameters<typeof actual.getPillarsForLanguage>[1]) =>
      actual
        .getPillarsForLanguage(langId, flags)
        .map((p) => (readingHasNoHub && p.id === "reading" ? { ...p, route: "" } : p)),
  };
});

const i18n = (await import("i18next")).default;
const { initReactI18next } = await import("react-i18next");
const en = (await import("@/shared/i18n/locales/en.json")).default;
await i18n.use(initReactI18next).init({
  lng: "en",
  resources: { en: { translation: en } },
  interpolation: { escapeValue: false },
});

const { PracticeBreadcrumbs } = await import("./PracticeBreadcrumbs");
const { ReadingCrumbProvider, usePublishReadingItemKind } = await import("./readingCrumb");
type ReadingItemKind = import("./readingCrumb").ReadingItemKind;

/** Stands in for the reader, which is the only thing that knows the kind. */
function PublishKind({ kind }: { kind: ReadingItemKind }) {
  usePublishReadingItemKind(kind);
  return null;
}

function renderCrumbs(path: string, kind?: ReadingItemKind) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ReadingCrumbProvider>
        <Routes>
          <Route
            path="/:lang/practice/stories/:storyId"
            element={
              <>
                <PracticeBreadcrumbs />
                {kind ? <PublishKind kind={kind} /> : null}
              </>
            }
          />
          <Route path="/:lang/practice/*" element={<PracticeBreadcrumbs />} />
        </Routes>
      </ReadingCrumbProvider>
    </MemoryRouter>,
  );
}

/** The trail as the reader reads it, left to right. */
function trail(): string[] {
  return [...document.querySelectorAll("nav ol li")].map((li) => li.textContent ?? "");
}

describe("PracticeBreadcrumbs reading level", () => {
  it("names the pillar between Practice and the option", () => {
    renderCrumbs("/ko/practice/stories");
    expect(trail()).toEqual(["Practice", "Reading", "Stories"]);
  });

  it("links the Reading crumb to the pillar hub", () => {
    renderCrumbs("/ko/practice/stories");
    expect(screen.getByRole("link", { name: "Reading" }).getAttribute("href")).toBe(
      "/ko/practice/pillar/reading",
    );
  });

  it("groups the other reading options under the same level", () => {
    renderCrumbs("/ko/practice/cloze");
    expect(trail()).toEqual(["Practice", "Reading", "Fill in the blank"]);
  });

  it("puts a listening activity under Listening", () => {
    renderCrumbs("/ko/practice/conversation");
    expect(trail()[1]).toBe("Listening");
  });

  it("does not repeat a pillar that is already a real segment", () => {
    // Grammar's own hub IS practice/grammar, so the segment crumb already
    // says it — synthesizing would render "Grammar › Grammar".
    renderCrumbs("/ko/practice/grammar/conjugation");
    expect(trail().filter((c) => c === "Grammar")).toHaveLength(1);
  });

  it("does not synthesize on the pillar hub itself", () => {
    renderCrumbs("/ko/practice/pillar/reading");
    expect(trail()).toEqual(["Practice", "Reading"]);
  });

  it("renders a hubless pillar as plain text, never as a link", () => {
    readingHasNoHub = true;
    try {
      renderCrumbs("/ko/practice/stories");
      expect(screen.getByText("Reading")).toBeTruthy();
      expect(screen.queryByRole("link", { name: "Reading" })).toBeNull();
    } finally {
      readingHasNoHub = false;
    }
  });
});

describe("PracticeBreadcrumbs reading leaf", () => {
  it("says Story for a story", () => {
    renderCrumbs("/ko/practice/stories/ko-m3-who-is-that", "story");
    expect(trail()).toEqual(["Practice", "Reading", "Stories", "Story"]);
  });

  it("says Conversation for a conversation on the SAME route", () => {
    renderCrumbs("/ko/practice/stories/ko-m3-meeting", "conversation");
    expect(trail()).toEqual(["Practice", "Reading", "Stories", "Conversation"]);
  });

  it("falls back to Story before the reader has published", () => {
    renderCrumbs("/ko/practice/stories/ko-m3-who-is-that");
    expect(trail()[3]).toBe("Story");
  });
});
