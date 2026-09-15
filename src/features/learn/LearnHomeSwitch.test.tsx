import type React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

// Heavy children → stubs that just announce which branch rendered.
// The stubs must forward `headerRight`/`right` — the Path/List toggle is
// passed down as a prop, so a stub that drops it would make every
// "toggle present/absent" assertion below vacuously pass.
vi.mock("./TransitLearnPage", () => ({
  default: ({ headerRight }: { headerRight?: React.ReactNode }) => (
    <div data-testid="transit-map">MAP{headerRight}</div>
  ),
}));
vi.mock("./LearnPage", () => ({
  LearnPage: ({ variant }: { variant?: string }) => (
    <div data-testid="learn-page">LIST:{variant ?? "full"}</div>
  ),
}));
vi.mock("./components/TransitSignageHeader", () => ({
  TransitSignageHeader: ({ right }: { right?: React.ReactNode }) => (
    <div data-testid="signage">{right}</div>
  ),
}));
vi.mock("@/shared/hooks/useLangPath", () => ({ useLang: () => "ja" }));
vi.mock("@/shared/contexts/FeatureFlagsContext", () => ({ useFeatureFlags: () => ({}) }));
vi.mock("@/shared/config/featureFlags", () => ({ isTransitLearnHome: () => true }));
vi.mock("@/shared/domain/mockCourse", () => ({ getMockCourse: () => ({ title: "Japanese" }) }));
vi.mock("@/shared/utils/routePrefetch", () => ({ prefetchLesson: () => {} }));

const viewMode = { value: "list" as "list" | "map" };
vi.mock("./hooks/useLearnViewMode", () => ({
  useLearnViewMode: () => [viewMode.value, vi.fn()] as const,
}));

// The form factor is faked at the module seam rather than through
// window.matchMedia, so each case names the DEVICE SHAPE it models.
// `forceVerticalLearnMap` is the one field this component reads (see
// shared/platform/formFactor.ts: touch AND not landscape-≥1024).
const factor = {
  coarsePointer: false,
  tabletPortrait: false,
  landscapeLg: true,
  landscapeDesktopTouch: false,
  forceVerticalLearnMap: false,
};
vi.mock("@/shared/platform/formFactor", () => ({
  useFormFactor: () => factor,
}));

/** Desktop mouse, wide window. */
function asDesktop() {
  Object.assign(factor, {
    coarsePointer: false,
    tabletPortrait: false,
    landscapeLg: true,
    landscapeDesktopTouch: false,
    forceVerticalLearnMap: false,
  });
}
/** iPhone, any orientation. */
function asPhone() {
  Object.assign(factor, {
    coarsePointer: true,
    tabletPortrait: false,
    landscapeLg: false,
    landscapeDesktopTouch: false,
    forceVerticalLearnMap: true,
  });
}
/** iPad Air portrait, 820x1180. */
function asTabletPortrait() {
  Object.assign(factor, {
    coarsePointer: true,
    tabletPortrait: true,
    landscapeLg: false,
    landscapeDesktopTouch: false,
    forceVerticalLearnMap: true,
  });
}
/** iPad Air landscape, 1180x820 — Spencer's own mode. */
function asTabletLandscape() {
  Object.assign(factor, {
    coarsePointer: true,
    tabletPortrait: false,
    landscapeLg: true,
    landscapeDesktopTouch: true,
    forceVerticalLearnMap: false,
  });
}

import { LearnHomeSwitch } from "./LearnHomeSwitch";

describe("LearnHomeSwitch — phone/tablet-portrait force the vertical map", () => {
  beforeEach(() => {
    cleanup();
    viewMode.value = "list";
    asDesktop();
  });

  it("renders the transit map on a phone even when the stored preference is List", () => {
    asPhone();
    viewMode.value = "list";
    render(<LearnHomeSwitch />);
    expect(screen.getByTestId("transit-map")).toBeInTheDocument();
    expect(screen.queryByTestId("learn-page")).not.toBeInTheDocument();
  });

  it("honors a stored List preference on desktop (fine pointer)", () => {
    asDesktop();
    viewMode.value = "list";
    render(<LearnHomeSwitch />);
    expect(screen.getByTestId("learn-page")).toHaveTextContent("LIST:list");
    expect(screen.queryByTestId("transit-map")).not.toBeInTheDocument();
  });

  it("renders the transit map on desktop when the stored preference is Path", () => {
    asDesktop();
    viewMode.value = "map";
    render(<LearnHomeSwitch />);
    expect(screen.getByTestId("transit-map")).toBeInTheDocument();
  });

  // iPad pass (docs/ipad-scoping-2026-09-15.md §1): the forced map used to key
  // off `hasCoarsePointer()` alone, so a 1180x820 iPad in landscape — a touch
  // device with MORE width than a laptop — got a single-column vertical
  // scroller and no way back to the list. Landscape mirrors desktop now.
  it("keeps the stored List preference on a landscape iPad (touch, >=1024, landscape)", () => {
    asTabletLandscape();
    viewMode.value = "list";
    render(<LearnHomeSwitch />);
    expect(screen.getByTestId("learn-page")).toHaveTextContent("LIST:list");
    expect(screen.queryByTestId("transit-map")).not.toBeInTheDocument();
  });

  it("shows the Path/List toggle on a landscape iPad", () => {
    asTabletLandscape();
    viewMode.value = "map";
    render(<LearnHomeSwitch />);
    expect(screen.getByRole("button", { name: "List" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Path" })).toBeInTheDocument();
  });

  it("still forces the map on a PORTRAIT iPad and drops the toggle", () => {
    asTabletPortrait();
    viewMode.value = "list";
    render(<LearnHomeSwitch />);
    expect(screen.getByTestId("transit-map")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "List" })).not.toBeInTheDocument();
  });

  it("drops the toggle on a phone", () => {
    asPhone();
    viewMode.value = "map";
    render(<LearnHomeSwitch />);
    expect(screen.queryByRole("button", { name: "List" })).not.toBeInTheDocument();
  });
});
