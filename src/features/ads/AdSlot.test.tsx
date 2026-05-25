import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/shared/i18n/i18n";
import { AdSlot } from "./AdSlot";
import { AdProviderContext } from "./providers/AdProviderContext";
import { FakeAdProvider } from "./providers/FakeAdProvider";
import type { AdProvider } from "./providers/types";
import {
  saveCookieConsent,
  clearCookieConsent,
} from "@/shared/legal/cookieConsent";

beforeEach(() => {
  localStorage.clear();
  vi.stubEnv("VITE_ADSENSE_CLIENT", "ca-pub-test");
  vi.stubEnv("VITE_ADSENSE_ENABLED", "true");
  saveCookieConsent(true);
});

afterEach(() => {
  cleanup();
  clearCookieConsent();
  localStorage.clear();
  vi.unstubAllEnvs();
});

function mountWith(provider: AdProvider) {
  return render(
    <I18nextProvider i18n={i18n}>
      <AdProviderContext.Provider value={provider}>
        <AdSlot slot="banner" />
      </AdProviderContext.Provider>
    </I18nextProvider>,
  );
}

describe("AdSlot wired to AdProvider", () => {
  it("renders the provider's placeholder via the FakeAdProvider", () => {
    mountWith(new FakeAdProvider());
    expect(screen.getByTestId("fake-ad-banner")).toBeInTheDocument();
  });

  it("renders nothing when the provider returns null fill", () => {
    const NullProvider: AdProvider = {
      id: "null",
      isReady: () => true,
      request: () => null,
    };
    const { container } = mountWith(NullProvider);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when ads are disabled (consent withdrawn)", () => {
    clearCookieConsent();
    const { container } = mountWith(new FakeAdProvider());
    expect(container).toBeEmptyDOMElement();
  });
});
