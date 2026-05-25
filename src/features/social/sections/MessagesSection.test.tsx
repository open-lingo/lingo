import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { MessagesSection } from "./MessagesSection";

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

describe("MessagesSection", () => {
  it("renders the thread list once mocks land", async () => {
    render(
      <MemoryRouter>
        <MessagesSection />
      </MemoryRouter>,
    );
    await waitFor(() => {
      // First mock thread is with Anna — message appears in both the
      // thread list preview and the active conversation pane.
      expect(screen.getAllByText(/build_sentence trick/i).length).toBeGreaterThan(0);
    });
  });
});
