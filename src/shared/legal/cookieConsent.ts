const STORAGE_KEY = "open-lingo-cookie-consent";

export type CookieConsentChoice = {
  /** Required for sign-in and app preferences; always true when saved. */
  essential: true;
  /** Google AdSense and similar ad measurement cookies. */
  advertising: boolean;
  /** ISO timestamp when the user chose. */
  decidedAt: string;
};

export function getCookieConsent(): CookieConsentChoice | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsentChoice;
    if (parsed.essential !== true || typeof parsed.advertising !== "boolean") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function hasCookieConsentDecision(): boolean {
  return getCookieConsent() !== null;
}

export function isAdvertisingConsentGranted(): boolean {
  return getCookieConsent()?.advertising === true;
}

export function saveCookieConsent(advertising: boolean): CookieConsentChoice {
  const choice: CookieConsentChoice = {
    essential: true,
    advertising,
    decidedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(choice));
  window.dispatchEvent(new CustomEvent("open-lingo-cookie-consent"));
  return choice;
}

export function clearCookieConsent(): void {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("open-lingo-cookie-consent"));
}
