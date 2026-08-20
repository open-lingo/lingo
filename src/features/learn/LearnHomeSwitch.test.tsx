import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

// Heavy children → stubs that just announce which branch rendered.
vi.mock("./TransitLearnPage", () => ({
  default: () => <div data-testid="transit-map">MAP</div>,
}));
vi.mock("./LearnPage", () => ({
  LearnPage: ({ variant }: { variant?: string }) => (
    <div data-testid="learn-page">LIST:{variant ?? "full"}</div>
  ),
}));
vi.mock("./components/TransitSignageHeader", () => ({
  TransitSignageHeader: () => <div data-testid="signage" />,
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

const pointer = { coarse: false };
vi.mock("@/shared/platform/nativeScroll", () => ({
  hasCoarsePointer: () => pointer.coarse,
}));

import { LearnHomeSwitch } from "./LearnHomeSwitch";

describe("LearnHomeSwitch — mobile forces the vertical map", () => {
  beforeEach(() => {
    cleanup();
    viewMode.value = "list";
    pointer.coarse = false;
  });

  it("renders the transit map on a touch device even when the stored preference is List", () => {
    pointer.coarse = true;
    viewMode.value = "list";
    render(<LearnHomeSwitch />);
    expect(screen.getByTestId("transit-map")).toBeInTheDocument();
    expect(screen.queryByTestId("learn-page")).not.toBeInTheDocument();
  });

  it("honors a stored List preference on desktop (fine pointer)", () => {
    pointer.coarse = false;
    viewMode.value = "list";
    render(<LearnHomeSwitch />);
    expect(screen.getByTestId("learn-page")).toHaveTextContent("LIST:list");
    expect(screen.queryByTestId("transit-map")).not.toBeInTheDocument();
  });

  it("renders the transit map on desktop when the stored preference is Path", () => {
    pointer.coarse = false;
    viewMode.value = "map";
    render(<LearnHomeSwitch />);
    expect(screen.getByTestId("transit-map")).toBeInTheDocument();
  });
});
