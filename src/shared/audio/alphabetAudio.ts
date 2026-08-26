import { playLocalAudio } from "./volume";

export function getAlphabetAudioUrl(audioKey: string): string {
  if (!audioKey) return "";

  // If the key already looks like a full or root-relative URL, return it
  // as-is. JA TTS resolves to root-relative `/tts/v1/<lang>/<hash>.mp3` —
  // same-origin through CloudFront in prod, through the Vite `/tts` proxy in
  // dev. An absolute URL only appears if VITE_ASSET_BASE_URL is set.
  if (/^https?:\/\//.test(audioKey) || audioKey.startsWith("/")) {
    return audioKey;
  }

  // Bare keys have no resolvable clip. KR used to fall back to a third-party
  // CloudFront host here; that shipped an unlicensed URL in every bundle for
  // a course we don't sell — stripped 2026-08-25 for App Store review. When
  // KR ships, its clips go through our own /tts pipeline like JA.
  return "";
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

