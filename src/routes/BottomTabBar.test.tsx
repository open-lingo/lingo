import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const LABELS: Record<string, string> = {
  "nav.home": "Home",
  "nav.learn": "Learn",
  "nav.practice": "Practice",
  "nav.shop": "Shop",
  "nav.primaryLabel": "Primary",
};
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string, fallback?: string) => LABELS[k] ?? fallback ?? k }),
}));
vi.mock("@/shared/hooks/useLangPath", () => ({
  useLangPath: () => (seg: string) => `/ja/${seg}`,
}));
vi.mock("@/shared/utils/routePrefetch", () => ({
  prefetchLearn: vi.fn(),
  prefetchPractice: vi.fn(),
}));
vi.mock("@/shared/components/Icon", () => ({
  Icon: ({ name }: { name: string }) => <span data-testid={`icon-${name}`} />,
}));

import { BottomTabBar } from "./BottomTabBar";

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <BottomTabBar />
    </MemoryRouter>,
  );

describe("BottomTabBar", () => {
  afterEach(cleanup);

  it("renders the four primary destinations with the right targets", () => {
    renderAt("/home");
    const nav = screen.getByRole("navigation", { name: "Primary" });
    const links = within(nav).getAllByRole("link");
    expect(links.map((l) => l.getAttribute("href"))).toEqual(["/home", "/ja/learn", "/ja/practice", "/ja/shop"]);
    expect(within(nav).getByText("Home")).toBeInTheDocument();
    expect(within(nav).getByText("Shop")).toBeInTheDocument();
  });

  it("marks the tab matching the current route as current", () => {
    renderAt("/ja/practice");
    const active = screen.getByRole("link", { name: /Practice/ });
    expect(active).toHaveAttribute("aria-current", "page");
    // and only that one
    expect(screen.getByRole("link", { name: /Home/ })).not.toHaveAttribute("aria-current");
  });

  it("treats deep learn/shop routes as their tab being active", () => {
    renderAt("/ja/learn/lessons/ja-m1-l1");
    expect(screen.getByRole("link", { name: /Learn/ })).toHaveAttribute("aria-current", "page");
  });
});
