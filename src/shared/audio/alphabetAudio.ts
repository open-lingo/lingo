import { playLocalAudio } from "./volume";

export function getAlphabetAudioUrl(audioKey: string): string {
  // For Hangul we currently store the Romanization (e.g. "a", "eo", "g") as the audioKey.
  // The CDN pattern provided is:
  // https://d27hu3tsvatwlt.cloudfront.net/mfsource/kr/main/alpha_m/kr-m-zy-{romanization}.mp3
  //
  // If in the future we want to support multiple languages or different patterns,
  // we can add language/alphabet-specific routing here.

  if (!audioKey) return "";

  // If the key already looks like a full or root-relative URL, return it
  // as-is. JA TTS resolves to root-relative `/pub/tts/...` paths.
  if (/^https?:\/\//.test(audioKey) || audioKey.startsWith("/")) {
    return audioKey;
  }

  return `https://d27hu3tsvatwlt.cloudfront.net/mfsource/kr/main/alpha_m/kr-m-zy-${audioKey}.mp3`;
}

// Track which auto-play keys have already been played in this session to avoid
// double-play in React 18 StrictMode (effects mount/unmount twice in dev).
const playedAutoAudioKeys = new Set<string>();

export function autoPlayAlphabetAudio(
  audioKey: string | undefined,
  playbackKey: string,
): void {
  if (!audioKey) return;
  const url = getAlphabetAudioUrl(audioKey);
  if (!url) return;

  const key = `${playbackKey}:${audioKey}`;
  if (playedAutoAudioKeys.has(key)) return;
  playedAutoAudioKeys.add(key);

  playLocalAudio(url);
}

