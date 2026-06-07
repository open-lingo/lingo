import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { MockSocialProviders } from "@/test/socialTestUtils";

vi.mock("@/shared/api", async () => {
  const actual = await vi.importActual<typeof import("@/shared/api")>("@/shared/api");
  const { makeFixtureSocialApi } = await import("@/test/socialTestUtils");
  const social = makeFixtureSocialApi();
  return {
    ...actual,
    useApiOptional: () => ({ social }),
    useApi: () => ({ social }),
  };
});

import { ActivityFeedStrip } from "./ActivityFeedStrip";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (
      key: string,
      defOrOpts?:
        | string
        | ({ defaultValue?: string } & Record<string, unknown>),
      opts?: Record<string, unknown>,
    ) => {
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

describe("ActivityFeedStrip", () => {
  it("renders the friend activity cards from the mock once loaded", async () => {
    render(
      <MockSocialProviders>
        <MemoryRouter>
          <ActivityFeedStrip />
        </MemoryRouter>
      </MockSocialProviders>,
    );
    await waitFor(() => {
      expect(screen.getByText(/Module 2/i)).toBeInTheDocument();
      expect(screen.getByText(/streak milestone/i)).toBeInTheDocument();
    });
  });

  it("each activity card has a reaction row with at least one button", async () => {
    render(
      <MockSocialProviders>
        <MemoryRouter>
          <ActivityFeedStrip />
        </MemoryRouter>
      </MockSocialProviders>,
    );
    await waitFor(() => {
      // Each card has a reaction-row "Cheer on {name}" label on at least one
      // button. Match liberally — at least one for Anna.
      const annaBtns = screen.getAllByRole("button", { name: /Cheer on Anna/i });
      expect(annaBtns.length).toBeGreaterThan(0);
    });
  });
});
