import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DEFAULT_SETTINGS, type UserSettings } from "./types";

/**
 * One persisted value, two entry points. The point of these tests is that
 * Settings and the reader are not two independent knobs that happen to look
 * alike — a write from either is visible to the other, because both resolve
 * through `useStoryFontSize`.
 *
 * `SettingsProvider` needs auth + the API provider, so the store is faked at
 * the context boundary instead: `updateSetting` writes into a plain object and
 * re-renders, which is exactly the contract the hook depends on.
 */
const listeners = new Set<() => void>();
let stored: UserSettings;

const updateSetting = vi.fn((path: string, value: unknown) => {
  const [ns, key] = path.split(".");
  const namespace = (stored as unknown as Record<string, Record<string, unknown>>)[ns];
  stored = { ...stored, [ns]: { ...namespace, [key]: value } };
  listeners.forEach((l) => l());
});

vi.mock("@/shared/contexts/SettingsContext", async () => {
  const { useSyncExternalStore } = await import("react");
  return {
    useSettings: () => ({
      // Subscribed, so a write from either control repaints both of them.
      settings: useSyncExternalStore(
        (onChange: () => void) => {
          listeners.add(onChange);
          return () => void listeners.delete(onChange);
        },
        () => stored,
      ),
      updateSetting,
    }),
  };
});

const { STORY_FONT_STEPS, storyFontStepIndex, DEFAULT_STORY_FONT_SCALE } = await import(
  "./storyFontSize"
);
const { StoryFontSizeControl } = await import(
  "@/features/practice/stories/StoryFontSizeControl"
);
const { StoryTextSizeSetting } = await import(
  "@/features/settings/StoryTextSizeSetting"
);

beforeEach(() => {
  stored = { ...DEFAULT_SETTINGS, learning: { ...DEFAULT_SETTINGS.learning } };
  updateSetting.mockClear();
});

describe("storyFontStepIndex", () => {
  it("defaults an unset value to the default step", () => {
    const defaultIndex = STORY_FONT_STEPS.findIndex(
      (s) => s.scale === DEFAULT_STORY_FONT_SCALE,
    );
    expect(storyFontStepIndex(undefined)).toBe(defaultIndex);
    expect(storyFontStepIndex(null)).toBe(defaultIndex);
    expect(storyFontStepIndex(Number.NaN)).toBe(defaultIndex);
  });

  it("resolves an exact step to itself", () => {
    STORY_FONT_STEPS.forEach((step, i) => {
      expect(storyFontStepIndex(step.scale)).toBe(i);
    });
  });

  it("snaps an off-step value to the nearest step", () => {
    expect(storyFontStepIndex(1.14)).toBe(storyFontStepIndex(1.15));
    expect(storyFontStepIndex(99)).toBe(STORY_FONT_STEPS.length - 1);
    expect(storyFontStepIndex(0.1)).toBe(0);
  });
});

describe("story font size round-trip", () => {
  function renderBoth() {
    return render(
      <>
        <StoryTextSizeSetting />
        <StoryFontSizeControl />
      </>,
    );
  }

  const select = () => screen.getByRole("combobox") as HTMLSelectElement;

  it("shows the persisted step in both entry points", () => {
    stored.learning.storyFontSize = STORY_FONT_STEPS[3].scale;
    renderBoth();
    expect(select().value).toBe("3");
    // Top step is still reachable, bottom one too — nothing is disabled here.
    expect(screen.getByRole("button", { name: /Larger text/i })).not.toHaveProperty(
      "disabled",
      true,
    );
  });

  it("reflects the reader's A+ in the Settings select", () => {
    renderBoth();
    fireEvent.click(screen.getByRole("button", { name: /Larger text/i }));
    expect(updateSetting).toHaveBeenCalledWith(
      "learning.storyFontSize",
      STORY_FONT_STEPS[2].scale,
    );
    expect(select().value).toBe("2");
  });

  it("reflects a Settings change in the reader's control state", () => {
    renderBoth();
    fireEvent.change(select(), { target: { value: String(STORY_FONT_STEPS.length - 1) } });
    expect(stored.learning.storyFontSize).toBe(
      STORY_FONT_STEPS[STORY_FONT_STEPS.length - 1].scale,
    );
    // At the top step the reader can no longer grow the text.
    expect(
      (screen.getByRole("button", { name: /Larger text/i }) as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(
      (screen.getByRole("button", { name: /Smaller text/i }) as HTMLButtonElement).disabled,
    ).toBe(false);
  });

  it("clamps rather than ignoring an out-of-range step", () => {
    stored.learning.storyFontSize = STORY_FONT_STEPS[0].scale;
    renderBoth();
    const smaller = screen.getByRole("button", { name: /Smaller text/i }) as HTMLButtonElement;
    expect(smaller.disabled).toBe(true);
    fireEvent.click(smaller);
    expect(updateSetting).not.toHaveBeenCalled();
  });
});
