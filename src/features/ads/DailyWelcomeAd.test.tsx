import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent, act } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/shared/i18n/i18n";
import {
  DAILY_WELCOME_STORAGE_KEY,
  DailyWelcomeAd,
  formatLocalDateKey,
} from "./DailyWelcomeAd";
import { AdProviderContext } from "./providers/AdProviderContext";
import { FakeAdProvider } from "./providers/FakeAdProvider";
import type { AdProvider } from "./providers/types";
import {
  saveCookieConsent,
  clearCookieConsent,
} from "@/shared/legal/cookieConsent";
import { AD_FREE_CHANGE_EVENT, AD_FREE_STORAGE_KEY } from "./adFree";

const FIXED_NOW = new Date("2026-05-25T12:00:00").getTime();
let nowSpy: ReturnType<typeof vi.spyOn> | null = null;

function mountWithProvider(provider: AdProvider = new FakeAdProvider()) {
  return render(
    <I18nextProvider i18n={i18n}>
      <AdProviderContext.Provider value={provider}>
        <DailyWelcomeAd />
      </AdProviderContext.Provider>
    </I18nextProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  nowSpy = vi.spyOn(Date, "now").mockReturnValue(FIXED_NOW);
  vi.stubEnv("VITE_ADSENSE_CLIENT", "ca-pub-test");
  vi.stubEnv("VITE_ADSENSE_ENABLED", "true");
  // Default: ad consent granted so the banner is allowed to show.
  saveCookieConsent(true);
});

afterEach(() => {
  cleanup();
  clearCookieConsent();
  localStorage.clear();
  vi.unstubAllEnvs();
  nowSpy?.mockRestore();
});

describe("DailyWelcomeAd", () => {
  it("shows on first render of the day", () => {
    mountWithProvider();
    expect(screen.getByTestId("daily-welcome-ad")).toBeInTheDocument();
  });

  it("renders the provider's ad inside the banner", () => {
    mountWithProvider();
    // FakeAdProvider tags its placeholder with `fake-ad-{slot}`.
    expect(screen.getByTestId("fake-ad-daily-welcome")).toBeInTheDocument();
  });

  it("does not show when the user has already seen it today", () => {
    localStorage.setItem(
      DAILY_WELCOME_STORAGE_KEY,
      formatLocalDateKey(new Date(FIXED_NOW)),
    );
    mountWithProvider();
    expect(screen.queryByTestId("daily-welcome-ad")).not.toBeInTheDocument();
  });

  it("shows on a new day even if a prior date is stored", () => {
    localStorage.setItem(DAILY_WELCOME_STORAGE_KEY, "2026-05-24");
    mountWithProvider();
    expect(screen.getByTestId("daily-welcome-ad")).toBeInTheDocument();
  });

  it("persists dismissal for the rest of the day when closed", () => {
    mountWithProvider();
    const closeBtn = screen.getByRole("button", { name: /dismiss/i });
    fireEvent.click(closeBtn);
    expect(screen.queryByTestId("daily-welcome-ad")).not.toBeInTheDocument();
    expect(localStorage.getItem(DAILY_WELCOME_STORAGE_KEY)).toBe(
      formatLocalDateKey(new Date(FIXED_NOW)),
    );
  });

  it("does not render when ad consent is missing", () => {
    clearCookieConsent();
    mountWithProvider();
    expect(screen.queryByTestId("daily-welcome-ad")).not.toBeInTheDocument();
  });

  it("does not render when an ad-free window is active", () => {
    const future = FIXED_NOW + 60_000;
    localStorage.setItem(AD_FREE_STORAGE_KEY, String(future));
    act(() => {
      window.dispatchEvent(new CustomEvent(AD_FREE_CHANGE_EVENT));
    });
    mountWithProvider();
    expect(screen.queryByTestId("daily-welcome-ad")).not.toBeInTheDocument();
  });

  it("does not render when the provider returns no fill", () => {
    const NullProvider: AdProvider = {
      id: "null",
      isReady: () => true,
      request: () => null,
    };
    mountWithProvider(NullProvider);
    expect(screen.queryByTestId("daily-welcome-ad")).not.toBeInTheDocument();
  });
});

describe("formatLocalDateKey", () => {
  it("formats a date as YYYY-MM-DD using local time fields", () => {
    const d = new Date(2026, 4, 25, 23, 30, 0); // local 2026-05-25 23:30
    expect(formatLocalDateKey(d)).toBe("2026-05-25");
  });

  it("zero-pads month and day", () => {
    const d = new Date(2026, 0, 3, 9, 0, 0); // local 2026-01-03
    expect(formatLocalDateKey(d)).toBe("2026-01-03");
  });
});
