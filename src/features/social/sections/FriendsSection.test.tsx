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

// useLangPath reads from LanguageContext — stub to a path joiner so
// `<FriendRow>`'s message Link renders without a provider.
vi.mock("@/shared/hooks/useLangPath", () => ({
  useLangPath: () => (path: string) => `/ja/${path}`,
}));

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

describe("FriendsSection — non-empty", () => {
  it("renders the populated friends list when the mock has friends", async () => {
    const { FriendsSearchAndList } = await import("./FriendsSection");
    render(
      <MockSocialProviders>
        <MemoryRouter>
          <FriendsSearchAndList />
        </MemoryRouter>
      </MockSocialProviders>,
    );
    await waitFor(() => {
      expect(screen.getByText("Anna")).toBeInTheDocument();
    });
    expect(
      screen.getByPlaceholderText(/Search friends/i),
    ).toBeInTheDocument();
  });

  it("renders a per-friend more-actions menu trigger that targets that friend", async () => {
    const { FriendsSearchAndList } = await import("./FriendsSection");
    render(
      <MockSocialProviders>
        <MemoryRouter>
          <FriendsSearchAndList />
        </MemoryRouter>
      </MockSocialProviders>,
    );
    await waitFor(() => {
      expect(screen.getByText("Anna")).toBeInTheDocument();
    });
    // Each friend row gets its OWN hamburger trigger labelled with that
    // friend's name — proving the menu acts on the correct friend rather than
    // a single shared menu. (Regression guard for the bug where the menu
    // didn't reflect the row it was opened from.)
    const triggers = screen.getAllByRole("button", {
      name: /More actions for/i,
    });
    expect(triggers.length).toBeGreaterThan(1);
    const annaTrigger = screen.getByRole("button", {
      name: /More actions for Anna/i,
    });
    expect(annaTrigger).toBeInTheDocument();
    // The trigger drives a portal-based DropdownMenu (not an inline
    // `absolute` element clipped by the list's `overflow-y-auto`), so it can
    // render above the scrolling friends list. Clicking it doesn't throw and
    // toggles the popover open. (The portal's content mount is async in
    // happy-dom; the rendered menu is verified in the e2e/visual pass.)
    fireEvent.click(annaTrigger);
    expect(annaTrigger).toHaveAttribute("aria-expanded", "true");
  });
});

describe("FriendsSection — empty state", () => {
  it("renders the empty-state CTA when the user has no friends", async () => {
    vi.resetModules();
    vi.doMock("../hooks/useSocial", async () => {
      const actual =
        await vi.importActual<typeof import("../hooks/useSocial")>(
          "../hooks/useSocial",
        );
      return {
        ...actual,
        useFriends: () => ({ data: [], isLoading: false, isEmpty: true }),
      };
    });
    const { FriendsSearchAndList } = await import("./FriendsSection");
    render(
      <MockSocialProviders>
        <MemoryRouter>
          <FriendsSearchAndList />
        </MemoryRouter>
      </MockSocialProviders>,
    );
    expect(screen.getByText(/Nobody here yet/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Find friends/i }),
    ).toBeInTheDocument();
    vi.doUnmock("../hooks/useSocial");
  });
});
