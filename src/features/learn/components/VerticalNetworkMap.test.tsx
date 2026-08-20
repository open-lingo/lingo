import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import { VerticalNetworkMap } from "./VerticalNetworkMap";
import type { Layout, StationL } from "@/features/learn/transitTypes";
import type { CourseModule, SideQuest } from "@/shared/domain/course";

function mod(id: string, title: string): CourseModule {
  return { id, title, lessons: [] };
}

function station(partial: Partial<StationL> & Pick<StationL, "index" | "module" | "x">): StationL {
  return {
    y: 0,
    labelSide: "bottom",
    badge: `M${partial.index + 1}`,
    isReview: false,
    status: "locked",
    done: 0,
    total: 5,
    interchange: false,
    terminal: false,
    ...partial,
  };
}

const quest = (id: string, title: string, extra: Partial<SideQuest> = {}): SideQuest => ({
  id,
  title,
  emoji: "✨",
  meta: "",
  progress: 0,
  ...extra,
});

function makeLayout(): Layout {
  const stations: StationL[] = [
    station({ index: 0, x: 0, module: mod("m1", "First sounds"), status: "completed", done: 5, total: 5 }),
    station({ index: 1, x: 1, module: mod("m2", "Plain sentences"), status: "current", done: 2, total: 8 }),
    station({ index: 2, x: 2, module: mod("m3", "Verbs I"), status: "locked", interchange: true }),
  ];
  return {
    width: 3,
    vbY: 0,
    vbH: 100,
    skyGroundY: 0,
    mainPts: [],
    stations,
    spurs: [],
    depot: null,
    zones: [
      { x0: -1, x1: 1.5, label: "ZONE 1 · Start", numeral: "一" },
      { x0: 1.5, x1: 3, label: "ZONE 2 · Daily", numeral: "二" },
    ],
    zoneChipY: 0,
    branchTouched: new Map(),
  };
}

describe("VerticalNetworkMap", () => {
  afterEach(cleanup);

  const baseProps = () => ({
    layout: makeLayout(),
    currentIdx: 1,
    lang: "ja",
    onOpen: vi.fn(),
    questsByAnchor: new Map<number, SideQuest[]>([
      [2, [quest("q1", "Kana Blitz"), quest("q2", "Locked Quest", { comingSoon: true })]],
    ]),
    onQuest: vi.fn(),
    isSideQuestUnlocked: (q: SideQuest) => q.id === "q1",
  });

  it("renders one station row per module, in order, with its badge and title", () => {
    render(<VerticalNetworkMap {...baseProps()} />);
    const rows = screen.getAllByTestId("vnm-station");
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent("First sounds");
    expect(rows[1]).toHaveTextContent("Plain sentences");
    expect(rows[2]).toHaveTextContent("Verbs I");
  });

  it("opens the module when its station is tapped", () => {
    const props = baseProps();
    render(<VerticalNetworkMap {...props} />);
    fireEvent.click(screen.getByRole("button", { name: /First sounds/ }));
    expect(props.onOpen).toHaveBeenCalledWith(0);
  });

  it("marks the current station with aria-current", () => {
    render(<VerticalNetworkMap {...baseProps()} />);
    const current = screen.getByRole("button", { name: /Plain sentences/ });
    expect(current).toHaveAttribute("aria-current", "step");
  });

  it("shows a completion seal on completed stations only", () => {
    render(<VerticalNetworkMap {...baseProps()} />);
    const seals = screen.getAllByTestId("vnm-seal");
    expect(seals).toHaveLength(1);
    // it belongs to the completed (first) station
    expect(screen.getAllByTestId("vnm-station")[0]).toContainElement(seals[0]);
  });

  it("renders a labelled band for each zone", () => {
    render(<VerticalNetworkMap {...baseProps()} />);
    expect(screen.getByText(/ZONE 1 · Start/)).toBeInTheDocument();
    expect(screen.getByText(/ZONE 2 · Daily/)).toBeInTheDocument();
  });

  it("renders side-quest spurs at interchange stations and routes taps", () => {
    const props = baseProps();
    render(<VerticalNetworkMap {...props} />);
    const spur = screen.getByTestId("vnm-spur");
    const unlocked = within(spur).getByRole("button", { name: /Kana Blitz/ });
    fireEvent.click(unlocked);
    expect(props.onQuest).toHaveBeenCalledWith(expect.objectContaining({ id: "q1" }));
  });

  it("disables a locked / coming-soon side quest", () => {
    const props = baseProps();
    render(<VerticalNetworkMap {...props} />);
    const locked = screen.getByRole("button", { name: /Locked Quest/ });
    expect(locked).toBeDisabled();
    fireEvent.click(locked);
    expect(props.onQuest).not.toHaveBeenCalled();
  });
});
