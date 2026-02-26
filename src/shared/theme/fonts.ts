import type { ThemeTokens } from "./types";

/** System font stack - no external loading. */
const SYSTEM =
  'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

/** Preselected fonts users can choose. id is stored in theme; value is the font-family CSS. */
export const FONT_PRESETS: { id: string; name: string; value: string }[] = [
  { id: "system", name: "System", value: SYSTEM },
  { id: "inter", name: "Inter", value: `"Inter", ${SYSTEM}` },
  { id: "open-sans", name: "Open Sans", value: `"Open Sans", ${SYSTEM}` },
  { id: "source-sans", name: "Source Sans 3", value: `"Source Sans 3", ${SYSTEM}` },
  { id: "nunito", name: "Nunito", value: `"Nunito", ${SYSTEM}` },
  { id: "lora", name: "Lora", value: `"Lora", Georgia, serif` },
  { id: "georgia", name: "Georgia", value: 'Georgia, "Times New Roman", Times, serif' },
  { id: "atkinson", name: "Atkinson Hyperlegible", value: `"Atkinson Hyperlegible", ${SYSTEM}` },
];

export const DEFAULT_FONT_ID = "system";

export function getFontFamily(fontId: string): string {
  return FONT_PRESETS.find((f) => f.id === fontId)?.value ?? SYSTEM;
}

export function getDefaultFontTokens(): ThemeTokens["font"] {
  return { family: getFontFamily(DEFAULT_FONT_ID) };
}
