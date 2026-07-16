import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { DEFAULT_FEATURE_FLAGS } from "@/shared/config/featureFlags";

const mockFlags = vi.fn();
vi.mock("@/shared/contexts/FeatureFlagsContext", () => ({
  useFeatureFlags: () => mockFlags(),
}));
vi.mock("react-router-dom", () => ({ useLocation: () => ({ pathname: "/home" }) }));
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (_k: string, d?: string) => d ?? _k }) }));
vi.mock("@/shared/hooks/useLangPath", () => ({ useLangPath: () => (p: string) => `/ja/${p}` }));

import { useNavDestinations } from "./useNavDestinations";

describe("useNavDestinations social gating", () => {
  beforeEach(() => vi.clearAllMocks());

  it("omits social when the flag is off", () => {
    mockFlags.mockReturnValue({ ...DEFAULT_FEATURE_FLAGS, social: { enabled: false } });
    const { result } = renderHook(() => useNavDestinations());
    expect(result.current.some((d) => d.key === "social")).toBe(false);
  });

  it("includes social when the flag is on", () => {
    mockFlags.mockReturnValue({ ...DEFAULT_FEATURE_FLAGS, social: { enabled: true } });
    const { result } = renderHook(() => useNavDestinations());
    expect(result.current.some((d) => d.key === "social")).toBe(true);
  });
});

describe("useNavDestinations community gating", () => {
  beforeEach(() => vi.clearAllMocks());

  it("omits community when the flag is off", () => {
    mockFlags.mockReturnValue({
      ...DEFAULT_FEATURE_FLAGS,
      community: { ...DEFAULT_FEATURE_FLAGS.community, enabled: false },
    });
    const { result } = renderHook(() => useNavDestinations());
    expect(result.current.some((d) => d.key === "community")).toBe(false);
  });

  it("includes community when the flag is on", () => {
    mockFlags.mockReturnValue({
      ...DEFAULT_FEATURE_FLAGS,
      community: { ...DEFAULT_FEATURE_FLAGS.community, enabled: true },
    });
    const { result } = renderHook(() => useNavDestinations());
    expect(result.current.some((d) => d.key === "community")).toBe(true);
  });
});
