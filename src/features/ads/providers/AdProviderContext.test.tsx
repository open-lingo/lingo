import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { AdProviderContext, useAdProvider, selectDefaultProvider } from "./AdProviderContext";
import { FakeAdProvider } from "./FakeAdProvider";
import { AdSenseAdProvider } from "./AdSenseAdProvider";

afterEach(() => {
  cleanup();
});

function Probe() {
  const provider = useAdProvider();
  return <div data-testid="probe">{provider.id}</div>;
}

describe("AdProviderContext", () => {
  it("returns the provider supplied via the context", () => {
    const fake = new FakeAdProvider();
    render(
      <AdProviderContext.Provider value={fake}>
        <Probe />
      </AdProviderContext.Provider>,
    );
    expect(screen.getByTestId("probe").textContent).toBe("fake");
  });

  it("returns a Fake provider as the implicit default when no context wraps the tree", () => {
    render(<Probe />);
    // Default safety net is the fake provider (rendering nothing would
    // be surprising; safer to render placeholders during dev).
    expect(screen.getByTestId("probe").textContent).toBe("fake");
  });
});

describe("selectDefaultProvider", () => {
  it("returns the explicit override when one is supplied", () => {
    const provider = selectDefaultProvider({ override: "fake", env: {} });
    expect(provider.id).toBe("fake");
  });

  it("returns adsense when VITE_AD_PROVIDER=adsense", () => {
    const provider = selectDefaultProvider({
      env: { VITE_AD_PROVIDER: "adsense", VITE_ADSENSE_CLIENT: "ca-pub-1" },
    });
    expect(provider.id).toBe("adsense");
  });

  it("returns fake when no env hints are present", () => {
    const provider = selectDefaultProvider({ env: {} });
    expect(provider.id).toBe("fake");
  });

  it("auto-picks adsense when an ad client id is configured", () => {
    const provider = selectDefaultProvider({
      env: { VITE_ADSENSE_CLIENT: "ca-pub-1" },
    });
    expect(provider.id).toBe("adsense");
  });

  it("rejects an unknown VITE_AD_PROVIDER value and falls back to fake", () => {
    const provider = selectDefaultProvider({
      env: { VITE_AD_PROVIDER: "house-experimental" },
    });
    expect(provider.id).toBe("fake");
  });

  it("instantiates AdSenseAdProvider when adsense is selected", () => {
    const provider = selectDefaultProvider({
      env: { VITE_AD_PROVIDER: "adsense", VITE_ADSENSE_CLIENT: "ca-pub-1" },
    });
    expect(provider).toBeInstanceOf(AdSenseAdProvider);
  });

  it("instantiates FakeAdProvider when fake is selected", () => {
    const provider = selectDefaultProvider({ env: {} });
    expect(provider).toBeInstanceOf(FakeAdProvider);
  });
});
