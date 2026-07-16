import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

const mockFlags = vi.fn();
vi.mock("@/shared/contexts/FeatureFlagsContext", () => ({
  useFeatureFlags: () => mockFlags(),
}));

import { SocialGate } from "./SocialGate";

function renderAt(enabled: boolean) {
  mockFlags.mockReturnValue({ social: { enabled } });
  return render(
    <MemoryRouter initialEntries={["/ja/social"]}>
      <Routes>
        <Route
          path="/ja/social"
          element={
            <SocialGate>
              <div>social content</div>
            </SocialGate>
          }
        />
        <Route path="/home" element={<div>home content</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("SocialGate", () => {
  it("renders children when social is enabled", () => {
    renderAt(true);
    expect(screen.getByText("social content")).toBeInTheDocument();
  });

  it("redirects to /home when social is disabled", () => {
    renderAt(false);
    expect(screen.getByText("home content")).toBeInTheDocument();
    expect(screen.queryByText("social content")).toBeNull();
  });
});
