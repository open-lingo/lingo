/**
 * SideQuestCard — ``comingSoon`` renders as disabled with a "Soon" pill,
 * and the click handler must not fire when the user taps it.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import type { SideQuest } from "@/shared/domain/course";
import { SideQuestCard } from "./SideQuestCard";

afterEach(() => {
  cleanup();
});

const baseQuest: SideQuest = {
  id: "anime-vocab",
  emoji: "🌸",
  title: "Anime Vocab",
  meta: "12 words",
  progress: 0,
};

describe("SideQuestCard", () => {
  it("shows the Soon pill + disables click when comingSoon=true", () => {
    const onClick = vi.fn();
    render(
      <SideQuestCard
        quest={{ ...baseQuest, comingSoon: true }}
        locked={false}
        onClick={onClick}
      />,
    );

    expect(screen.getByTestId("coming-soon-badge")).toBeInTheDocument();
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute("aria-disabled", "true");

    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("fires onClick normally when comingSoon is absent", () => {
    const onClick = vi.fn();
    render(
      <SideQuestCard quest={baseQuest} locked={false} onClick={onClick} />,
    );
    expect(screen.queryByTestId("coming-soon-badge")).toBeNull();
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalled();
  });
});
