export type AlphabetEvent = {
  name: string;
  timestamp: string;
  data: Record<string, unknown>;
};

declare global {
  interface Window {
    __alphabetEvents__?: AlphabetEvent[];
    __alphabetDebug__?: boolean;
  }
}

export function logAlphabetEvent(
  name: string,
  data: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;
  const evt: AlphabetEvent = {
    name,
    timestamp: new Date().toISOString(),
    data,
  };
  if (!window.__alphabetEvents__) window.__alphabetEvents__ = [];
  window.__alphabetEvents__!.push(evt);

  if (window.__alphabetDebug__) {
    // eslint-disable-next-line no-console
    console.debug("[alphabet event]", evt);
  }
}

