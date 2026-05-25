import { describe, it, expect, afterEach, vi } from "vitest";
import {
  render,
  screen,
  cleanup,
  waitFor,
  fireEvent,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { MockSocialProviders } from "@/test/socialTestUtils";
import { InviteFriendsCard } from "./InviteFriendsCard";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (
      key: string,
      defOrOpts?:
        | string
        | ({ defaultValue?: string } & Record<string, unknown>),
      opts?: Record<string, unknown>,
    ) => {
      // 3-arg form: t(key, default, opts) → interpolate {{x}} from opts.
      if (typeof defOrOpts === "string") {
        let out = defOrOpts;
        if (opts) {
          for (const [k, v] of Object.entries(opts)) {
            out = out.replace(new RegExp(`{{${k}}}`, "g"), String(v));
          }
        }
        return out;
      }
      if (defOrOpts && typeof defOrOpts === "object" && defOrOpts.defaultValue) {
        return defOrOpts.defaultValue;
      }
      return key;
    },
  }),
}));

afterEach(() => cleanup());

describe("InviteFriendsCard", () => {
  it("renders the lingot + ad-free pitch in the CTA card", async () => {
    render(
      <MockSocialProviders>
        <MemoryRouter>
          <InviteFriendsCard />
        </MemoryRouter>
      </MockSocialProviders>,
    );
    await waitFor(() => {
      expect(
        screen.getByText(/Invite a friend, both win/i),
      ).toBeInTheDocument();
    });
    // Subtitle mentions both rewards.
    expect(screen.getByText(/100 lingots/i)).toBeInTheDocument();
    expect(screen.getByText(/1h ad-free/i)).toBeInTheDocument();
  });

  it("opens the modal with the invite URL when Get link is clicked", async () => {
    render(
      <MockSocialProviders>
        <MemoryRouter>
          <InviteFriendsCard />
        </MemoryRouter>
      </MockSocialProviders>,
    );
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Get link/i }),
      ).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /Get link/i }));
    // Modal title + URL rendered.
    expect(
      screen.getByRole("dialog", { name: /Invite a friend/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/https:\/\/lingo\.app\/invite\/xxxx-yyyy-zzzz/),
    ).toBeInTheDocument();
  });
});
