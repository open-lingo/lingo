import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SubscribeButton } from "./SubscribeButton";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k: string, opts?: { defaultValue?: string } & Record<string, unknown>) => {
      if (!opts) return k;
      if (typeof opts === "string") return opts;
      return opts.defaultValue ?? k;
    },
  }),
}));

describe("SubscribeButton", () => {
  it("not-subscribed state shows Subscribe and fires onSubscribe", () => {
    const onSubscribe = vi.fn();
    const onUnsubscribe = vi.fn();
    render(
      <SubscribeButton
        isSubscribed={false}
        onSubscribe={onSubscribe}
        onUnsubscribe={onUnsubscribe}
      />,
    );
    const btn = screen.getByRole("button");
    expect(btn).toHaveTextContent("Subscribe");
    expect(btn).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(btn);
    expect(onSubscribe).toHaveBeenCalledTimes(1);
    expect(onUnsubscribe).not.toHaveBeenCalled();
  });

  it("subscribed state is pressed and fires onUnsubscribe", () => {
    const onSubscribe = vi.fn();
    const onUnsubscribe = vi.fn();
    render(
      <SubscribeButton
        isSubscribed
        onSubscribe={onSubscribe}
        onUnsubscribe={onUnsubscribe}
      />,
    );
    const btn = screen.getByRole("button");
    expect(btn).toHaveAttribute("aria-pressed", "true");
    // Both subscribed + hover labels are present in the DOM (CSS toggles them).
    expect(btn).toHaveTextContent("Subscribed");
    expect(btn).toHaveTextContent("Unsubscribe");
    fireEvent.click(btn);
    expect(onUnsubscribe).toHaveBeenCalledTimes(1);
    expect(onSubscribe).not.toHaveBeenCalled();
  });

  it("disables interaction while loading", () => {
    const onSubscribe = vi.fn();
    render(
      <SubscribeButton
        isSubscribed={false}
        loading
        onSubscribe={onSubscribe}
        onUnsubscribe={vi.fn()}
      />,
    );
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(onSubscribe).not.toHaveBeenCalled();
  });
});
