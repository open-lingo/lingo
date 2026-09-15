/**
 * TestFlight #143: the cosmetics grid rendered 3 narrow columns at phone
 * width, wrapping card titles to 3 lines and descriptions to 6-7, with a
 * tiny Buy pill. Founder: "Button sizes too small to purchase and these
 * don't need descriptions the visual speaks for itself. Preview and buy
 * button maybe all we need?"
 *
 * These tests pin the fix at the render level (grid class + per-card
 * markup) rather than relying on a screenshot: 2 columns at phone width,
 * no description text on any card, and a Preview + Buy/Equip action on
 * every card.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import type { ReactNode } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import i18n from "@/shared/i18n/i18n";
import { SHOP_ITEMS } from "./shopCatalog";

const mockPurchaseShopItem = vi.fn();
vi.mock("@/shared/api/provider", () => ({
  useApi: () => ({
    progress: {
      purchaseShopItem: mockPurchaseShopItem,
      // AdFreeShopSection's useUserStats -> useProgressMe chain calls this;
      // resolve to no summary so it settles instead of hanging/throwing.
      getMe: vi.fn().mockResolvedValue(null),
    },
  }),
}));

// AdFreeShopSection pulls in useUserStats -> useProgressMe -> useAuth. Stub
// auth the same way PublicProfilePage.test.tsx does so it doesn't need a
// real Auth0Provider.
vi.mock("@/shared/auth/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    user: { sub: "auth0|test" },
    error: undefined,
    login: () => {},
    signup: () => {},
    logout: () => {},
  }),
}));

const mockShowToast = vi.fn();
vi.mock("@/shared/contexts/ToastContext", () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

vi.mock("@/features/shop/useShopState", () => ({
  useShopState: () => ({
    lingots: 1000,
    statsReady: true,
    statsError: false,
    shop: { purchases: [], inventory: {} },
    isLoading: false,
    isOwned: () => false,
    ownedQuantity: () => 0,
    refetchStats: vi.fn(),
    refetchShop: vi.fn(),
  }),
  useInvalidateShopQueries: () => vi.fn(),
}));

vi.mock("@/features/shop/useEquippedDecorator", () => ({
  useEquippedDecorator: () => ({ equippedId: null, equip: vi.fn(), isEquipping: false }),
}));
vi.mock("@/features/shop/useEquippedTitle", () => ({
  useEquippedTitle: () => ({ equippedId: null, equip: vi.fn(), isEquipping: false }),
}));
vi.mock("@/features/shop/useEquippedBanner", () => ({
  useEquippedBanner: () => ({ equippedId: null, equip: vi.fn(), isEquipping: false }),
}));

// The rewarded-ad modal pulls in its own ad-provider dependencies unrelated
// to this layout fix — stub it out. AdFreeShopSection is left real (see the
// useAuth/useApi mocks above) so its Buy buttons are covered by the
// min-h-[44px] assertion below.
vi.mock("@/features/ads/useRewardedAd", () => ({
  useRewardedAd: () => ({ open: vi.fn(), modalNode: null, isOpen: false }),
}));

// LingotBalance (header balance chip) reads the active-language route via
// useLangPath, which needs a LanguageProvider we don't otherwise mount here.
vi.mock("@/shared/hooks/useLangPath", () => ({
  useLangPath: () => (p: string) => `/ja/${p.replace(/^\//, "")}`,
  useLang: () => "ja",
}));

import ShopPage from "./ShopPage";

function renderShopPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0, gcTime: 0 } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter>
        <I18nextProvider i18n={i18n}>
          <QueryClientProvider client={client}>{children}</QueryClientProvider>
        </I18nextProvider>
      </MemoryRouter>
    );
  }
  return render(<ShopPage />, { wrapper: Wrapper });
}

describe("ShopPage cosmetics grid (TestFlight #143)", () => {
  beforeEach(() => {
    mockPurchaseShopItem.mockReset();
    mockShowToast.mockReset();
  });

  it("renders no description text on any card", () => {
    renderShopPage();
    // Sample descriptions across every section (powerup, frame, title,
    // banner) — none should be on the page. The i18n keys themselves are
    // untouched (see shopCatalog.ts / en.json); the card just stops
    // rendering them.
    expect(
      screen.queryByText("Protect your streak for one missed day."),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Show off with a golden avatar border."),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("A profile title for late-night learners."),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Cherry blossoms drift across a blush pink sky."),
    ).not.toBeInTheDocument();
  });

  it("renders a Preview and a Buy/Equip action for every catalog item", () => {
    renderShopPage();
    const previewButtons = screen.getAllByRole("button", { name: "Preview" });
    expect(previewButtons).toHaveLength(SHOP_ITEMS.length);

    // Scope to the cosmetic grid specifically — AdFreeShopSection (a
    // sibling section, real-rendered below) has its own 3 "Buy" packs that
    // aren't part of the catalog grid this test is pinning.
    const cosmeticGrids = screen.getAllByTestId("shop-cosmetic-grid");
    const buyButtonsInGrids = cosmeticGrids.flatMap((grid) =>
      Array.from(grid.querySelectorAll('[data-testid="shop-buy-button"]')),
    );
    // Every item is unowned in this fixture, so the primary action is
    // always "Buy" or "Buy again" (consumables with existing inventory) —
    // never "Equip"/"Equipped" (that path is covered by the equip-hook
    // wiring itself, unit-tested at useEquippedCosmetic).
    expect(buyButtonsInGrids).toHaveLength(SHOP_ITEMS.length);
  });

  it("uses a 2-column grid at phone width for every catalog section", () => {
    renderShopPage();
    // Scoped to the shop's own cosmetic/powerup grids — AdFreeShopSection
    // (real-rendered below) has its own unrelated 2/3-col grid that isn't
    // part of this fix.
    const grids = screen.getAllByTestId("shop-cosmetic-grid");
    expect(grids.length).toBeGreaterThan(0);
    for (const grid of grids) {
      // Base (phone, <640px, no breakpoint prefix) must be 2 columns —
      // the 3-col base class on the cosmetic branch was TestFlight #143's
      // root cause. sm/lg/xl grow from there.
      const classes = grid.className.split(/\s+/);
      expect(classes).toContain("grid-cols-2");
      expect(classes).not.toContain("grid-cols-3"); // bare (unprefixed) 3-col
      expect(classes).toContain("sm:grid-cols-3");
      expect(classes).toContain("lg:grid-cols-4");
      expect(classes).toContain("xl:grid-cols-5");
    }
  });

  it("every buy-family button (cosmetics, ad-free packs, the featured banner) is a real 44px tap target", () => {
    // TestFlight #143 follow-up: the ad-free pack cards and the featured
    // banner's price pill still used a small `size="sm"` Button. All three
    // surfaces are marked `data-testid="shop-buy-button"` specifically so
    // this assertion doesn't depend on label text (the featured banner's
    // buy control has no "Buy" word at all — just a lock/gem/price pill).
    renderShopPage();
    const buyButtons = screen.getAllByTestId("shop-buy-button");
    // Cosmetics (26 x Buy/Equip) + featured banner (1) + ad-free packs (3).
    expect(buyButtons.length).toBe(SHOP_ITEMS.length + 1 + 3);
    for (const btn of buyButtons) {
      expect(btn.classList.contains("min-h-[44px]")).toBe(true);
    }
  });

  it("opening Preview on a card shows its visual without charging lingots", () => {
    renderShopPage();
    const previewButtons = screen.getAllByRole("button", { name: "Preview" });
    fireEvent.click(previewButtons[0]!);

    // The preview modal opens (a dialog appears) and purchase is NOT
    // called just from previewing.
    expect(screen.getAllByRole("dialog").length).toBeGreaterThan(0);
    expect(mockPurchaseShopItem).not.toHaveBeenCalled();
  });
});
