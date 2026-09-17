/**
 * Accessibility audit 2026-09-17 (docs/accessibility-2026-09-17.md, axe
 * `landmark-unique` + `heading-order`): the transit map mounts this
 * component's `layout="rail"` <aside> alongside SidebarNav's own fixed
 * desktop <aside> (`.tmc-rail > aside` in A2's finding table) — two
 * unlabelled `role="complementary"` landmarks on one page are indistinct to
 * assistive tech. Separately, this rail's own h3 sub-headings (quests,
 * review) had no h2 between them and the page's h1, which axe's
 * `heading-order` flags as a level skip. Both branches (`"stack"`, used by
 * the classic list LearnPage, and `"rail"`, used by the transit map) need
 * the same aria-label + sr-only h2.
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}));

// Heavy body components (course/profile/quest data, TanStack Query, SRS
// machinery) are irrelevant to the landmark/heading wiring under test —
// stub them, same doctrine as TransitLearnPage.test.tsx stubbing this whole
// component out for ITS unrelated tests.
vi.mock("./ProfileCard", () => ({
  ProfileCardBody: () => <div data-testid="profile-body" />,
}));
vi.mock("@/features/quests", () => ({
  QuestsCardBody: () => <h3>Today&apos;s quests</h3>,
}));
vi.mock("./LearnToolsRow", () => ({
  ReviewPracticeBody: () => <h3>Review &amp; practice</h3>,
}));
vi.mock("@/shared/components/ui", () => ({
  Card: ({ children, ...rest }: { children: React.ReactNode }) => (
    <div {...rest}>{children}</div>
  ),
}));
vi.mock("@/shared/components/ScrollArea", () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { LearnSidebar } from "./LearnSidebar";
import type { LearnSidebarProps } from "./LearnSidebar";

afterEach(() => cleanup());

const baseProps: Omit<LearnSidebarProps, "layout"> = {
  profile: {} as LearnSidebarProps["profile"],
  course: {} as LearnSidebarProps["course"],
  completedSet: new Set(),
  onJumpToModule: () => {},
  sideQuests: [],
  isSideQuestUnlocked: () => false,
};

describe.each([["rail"], ["stack"]] as const)(
  "LearnSidebar layout=%s a11y",
  (layout) => {
    it("labels its <aside> distinctly from SidebarNav's own aside", () => {
      const { container } = render(<LearnSidebar {...baseProps} layout={layout} />);
      const aside = container.querySelector("aside");
      expect(aside).not.toBeNull();
      const label = aside!.getAttribute("aria-label");
      expect(label).toBeTruthy();
      // SidebarNav's aside is labelled "Site navigation" — this rail must
      // not collide with it (that collision IS the axe finding).
      expect(label).not.toBe("Site navigation");
    });

    it("puts a heading before the stubbed h3 sections, one level up", () => {
      const { container } = render(<LearnSidebar {...baseProps} layout={layout} />);
      const headings = Array.from(container.querySelectorAll("h1,h2,h3,h4,h5,h6"));
      expect(headings.length).toBeGreaterThan(0);
      const first = headings[0];
      expect(first.tagName).toBe("H2");
      // sr-only, not a visible re-level of the shared h3 components.
      expect(first.className).toMatch(/sr-only/);
      // And it really does precede the h3s in document order.
      const h3s = headings.filter((h) => h.tagName === "H3");
      expect(h3s.length).toBeGreaterThan(0);
      h3s.forEach((h3) => {
        expect(
          first.compareDocumentPosition(h3) & Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy();
      });
    });
  },
);
