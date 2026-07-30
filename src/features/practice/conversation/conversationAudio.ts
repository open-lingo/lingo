/**
 * Conversation audio — multi-voice playback for authored dialogue lines.
 *
 * A conversation speaker may carry an explicit `voice` tag (e.g. JA
 * `ja-keita`, the male dialogue corpus). The tag names a voice-scoped TTS
 * manifest, so `getTtsUrl(text, voice)` resolves that speaker's clip. When a
 * speaker has no tag — or the tagged clip is missing, or the whole language
 * only ships one voice — playback falls back to the course default voice and,
 * failing that, to browser synthesis. A missing second voice therefore
 * degrades gracefully instead of blocking a turn (the dialogue-listen step
 * uses the same fallback chain).
 */
import { getTtsUrl, playJaAudioToEnd } from "@/shared/tts";

/**
 * Play one dialogue line to completion in its speaker's voice. Tries the
 * voice-tagged manifest first, then the course default; both missing, hands
 * off to the shared synthesis fallback (non-JA courses). `stillCurrent`
 * aborts between the resolution attempts so a replay / unmount cancels
 * cleanly.
 */
export async function playConversationLine(
  text: string,
  voice: string | undefined,
  defaultLang: string,
  stillCurrent: () => boolean = () => true,
): Promise<void> {
  const candidates = voice ? [voice, defaultLang] : [defaultLang];
  for (const lang of candidates) {
    if (!stillCurrent()) return;
    if (getTtsUrl(text, lang)) {
      await playConversationLineIn(text, lang);
      return;
    }
  }
  // No recorded clip anywhere — synthesis fallback (JA stays silent by design).
  if (!stillCurrent()) return;
  await playConversationLineIn(text, defaultLang);
}

/** Play a line in a specific manifest lang, awaiting the clip's end. */
async function playConversationLineIn(text: string, lang: string): Promise<void> {
  await playJaAudioToEnd(text, lang);
}

/** Does a playable clip exist for this line in either the voice or default? */
export function conversationLineHasAudio(
  text: string,
  voice: string | undefined,
  defaultLang: string,
): boolean {
  return Boolean(
    (voice && getTtsUrl(text, voice)) || getTtsUrl(text, defaultLang),
  );
}
