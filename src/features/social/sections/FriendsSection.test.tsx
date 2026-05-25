import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

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
      <MemoryRouter>
        <FriendsSearchAndList />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText("Anna")).toBeInTheDocument();
    });
    expect(
      screen.getByPlaceholderText(/Search friends/i),
    ).toBeInTheDocument();
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
      <MemoryRouter>
        <FriendsSearchAndList />
      </MemoryRouter>,
    );
    expect(screen.getByText(/Nobody here yet/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Find friends/i }),
    ).toBeInTheDocument();
    vi.doUnmock("../hooks/useSocial");
  });
});
