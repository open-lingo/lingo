/** Regex for [card:cardId]display[/card] - display is required */
const CARD_EMBED_REGEX = /\[card:([^\]]+)\]([^[]*)\[\/card\]/g;

export type CardEmbed = {
  cardId: string;
  display: string;
  fullMatch: string;
};

export type ParsedSegment =
  | { type: "text"; text: string }
  | { type: "card"; cardId: string; display: string };

/**
 * Parse story body into text and card embed segments.
 * Returns array of { type: "text"|"card", ... } for rendering.
 */
export function parseStoryBody(body: string): ParsedSegment[] {
  if (!body) return [];

  const segments: ParsedSegment[] = [];
  let lastIndex = 0;

  for (const match of body.matchAll(CARD_EMBED_REGEX)) {
    const [full, cardId, display] = match;
    const index = match.index!;

    if (index > lastIndex) {
      segments.push({ type: "text", text: body.slice(lastIndex, index) });
    }
    segments.push({ type: "card", cardId: cardId.trim(), display: display.trim() || full });
    lastIndex = index + full.length;
  }

  if (lastIndex < body.length) {
    segments.push({ type: "text", text: body.slice(lastIndex) });
  }

  return segments;
}

/**
 * Extract all card IDs referenced in the body.
 */
export function getCardIdsFromBody(body: string): string[] {
  const ids: string[] = [];
  for (const match of body.matchAll(CARD_EMBED_REGEX)) {
    ids.push(match[1].trim());
  }
  return [...new Set(ids)];
}
