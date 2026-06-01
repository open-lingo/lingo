import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  within,
  cleanup,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QuestsPanel } from "./QuestsPanel";

// Stub i18n: t() returns the defaultValue (or the key if undefined) — same
// shape as the real i18next instance in dev, no provider plumbing needed.
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (
      _key: string,
      opts?: { defaultValue?: string } & Record<string, unknown>,
    ) => {
      if (!opts) return _key;
      if (typeof opts === "string") return opts;
      if (opts.defaultValue) return opts.defaultValue;
      return _key;
    },
  }),
}));

vi.mock("@/shared/hooks/useUserStats", () => ({
  useUserStats: () => ({
    stats: {
      streak: 7,
      bestStreak: 14,
      lastActiveDate: null,
      xp: 250,
      level: 2,
      lingots: 42,
    },
    isReady: true,
    isLoading: false,
    isError: false,
    refetch: () => undefined,
  }),
}));

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
});

function renderPanel(initialTab: "all" | "daily" | "weekly" | "random" | "friend" = "all") {
  return render(
    <MemoryRouter>
      <QuestsPanel isOpen onClose={() => undefined} initialTab={initialTab} />
    </MemoryRouter>,
  );
}

describe("QuestsPanel", () => {
  it("renders the panel title", () => {
    renderPanel();
    expect(screen.getByText("Your quests")).toBeInTheDocument();
  });

  it("shows quests from all four types in the All tab", () => {
    renderPanel("all");
    // At least one entry per type from mockQuests.
    const titles = screen.getAllByText(/quests\.(daily|weekly|random|friend)\./);
    // i18n stub returns the keys when no defaultValue — confirm each
    // archetype has rendered at least once.
    const text = titles.map((el) => el.textContent ?? "").join("\n");
    expect(text).toMatch(/quests\.daily/);
    expect(text).toMatch(/quests\.weekly/);
    expect(text).toMatch(/quests\.random/);
    expect(text).toMatch(/quests\.friend/);
  });

  it("filters to daily when daily tab is clicked", () => {
    renderPanel("all");
    fireEvent.click(screen.getByRole("button", { name: /^Daily \d/i }));
    // At least one daily-namespaced quest renders.
    const dailies = screen.getAllByText(/^quests\.daily\./);
    expect(dailies.length).toBeGreaterThan(0);
    // Weekly quests should not show.
    expect(screen.queryByText(/^quests\.weekly\./)).toBeNull();
  });

  it("renders the level + XP header", () => {
    renderPanel();
    expect(screen.getByText("Level")).toBeInTheDocument();
    // 42 lingots is unique to the stat display.
    expect(screen.getByText("42")).toBeInTheDocument();
    // 250 XP is in the stat tile.
    expect(screen.getByText("250")).toBeInTheDocument();
  });

  it("shows progress bars (one in header + one per quest)", () => {
    const { container } = renderPanel("daily");
    // role=progressbar is on every QuestProgressBar.
    const bars = container.querySelectorAll('[role="progressbar"]');
    expect(bars.length).toBeGreaterThanOrEqual(2); // header + at least 1 quest
  });
});

describe("QuestsPanel — claim flow", () => {
  it("renders a Claim button once a daily quest is claimable", async () => {
    // Seed storage so daily-fifty-xp is past its target.
    localStorage.setItem(
      "lingo_quests_v1",
      JSON.stringify({
        "daily-fifty-xp": {
          id: "daily-fifty-xp",
          current: 60,
          status: "active",
        },
      }),
    );
    renderPanel("daily");
    const claim = screen.getByRole("button", { name: /Claim reward/i });
    expect(claim).toBeInTheDocument();
    fireEvent.click(claim);
    // After claim, the row updates — find the row's "Completed" label.
    expect(screen.getByText(/Completed/i)).toBeInTheDocument();
  });
});

describe("QuestsPanel — quest type coverage", () => {
  it("each tab renders at least one matching quest", () => {
    for (const tab of ["daily", "weekly", "random", "friend"] as const) {
      const { unmount, container } = renderPanel(tab);
      const rows = container.querySelectorAll('[role="progressbar"]');
      // header bar (1) + at least 1 quest = 2+.
      expect(rows.length).toBeGreaterThanOrEqual(2);
      unmount();
    }
  });

  it("clicking each tab is non-destructive (no crash)", () => {
    renderPanel("all");
    for (const label of ["Daily", "Weekly", "Random", "Friend", "All"]) {
      // Tab buttons end with the count badge — anchor on `Label <digits>`
      // so the friend rewards icon doesn't trip the match.
      fireEvent.click(
        screen.getByRole("button", { name: new RegExp(`^${label} \\d`) }),
      );
    }
  });
});

// Touch within() so the unused import doesn't trip lint-style warnings.
within;
