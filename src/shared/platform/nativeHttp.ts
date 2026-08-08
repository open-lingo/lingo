/**
 * Binary fetch that works under `capacitor://`.
 *
 * WHY THIS EXISTS — the short version is CORS, but the shape of the problem
 * matters because it fails in a way that looks like it's working:
 *
 * In production the app and the TTS clips share an origin (CloudFront fronts
 * both `app.openlingoapp.com` and `/tts/*`), so `assetUrl` returns a RELATIVE
 * path and the browser never involves CORS. Inside a Capacitor webview the
 * bundle is served from `capacitor://localhost`, so that same relative path
 * resolves into the app bundle — where no mp3s live. Silence.
 *
 * Making the base absolute doesn't fix it either. Playback is `fetch` +
 * `decodeAudioData` (`shared/tts/index.ts`), which IS CORS-enforced, and the
 * bucket sends no `Access-Control-Allow-Origin`. So the `<audio>`-element
 * paths (alphabet clips) keep working while every Web Audio clip dies — it
 * breaks HALFWAY, which is the hardest version to notice.
 *
 * `CapacitorHttp` sidesteps the whole question: the request is made by the
 * native URLSession, not by the webview, so no origin is attached and no CORS
 * preflight happens. That turns "wait for a CloudFront response-headers policy
 * in lingo-infra" into "works today".
 *
 * ⚠️ NOT a general-purpose fetch replacement, and specifically NOT the
 * `CapacitorHttp: { enabled: true }` config option — that one monkey-patches
 * `window.fetch` globally, which would silently change the semantics of every
 * API call in the app. This is opt-in, one call site, binary GETs only.
 */

/**
 * Capacitor returns binary response bodies as base64 across the native bridge
 * (the bridge is JSON, so raw bytes cannot cross it). Web returns a real
 * ArrayBuffer/Blob. Handle all three rather than assuming one — the shape
 * differs by platform, and getting it wrong shows up as a decode error deep
 * inside `decodeAudioData` rather than anywhere near here.
 */
async function toArrayBuffer(data: unknown): Promise<ArrayBuffer> {
  if (data instanceof ArrayBuffer) return data;
  if (typeof Blob !== "undefined" && data instanceof Blob) {
    return await data.arrayBuffer();
  }
  if (typeof data === "string") {
    // Some paths hand back a full data: URI rather than bare base64.
    const b64 = data.startsWith("data:")
      ? (data.split(",")[1] ?? "")
      : data;
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes.buffer;
  }
  throw new Error(`unsupported native response body: ${typeof data}`);
}

/** Case-insensitive header lookup — native and web disagree on key casing. */
function header(headers: unknown, name: string): string {
  if (!headers || typeof headers !== "object") return "";
  const want = name.toLowerCase();
  for (const [k, v] of Object.entries(headers as Record<string, unknown>)) {
    if (k.toLowerCase() === want) return String(v ?? "");
  }
  return "";
}

/** GET `url` as raw bytes through the native HTTP stack. Throws on non-2xx. */
export async function fetchBinaryNative(url: string): Promise<ArrayBuffer> {
  const { CapacitorHttp } = await import("@capacitor/core");
  const res = await CapacitorHttp.get({ url, responseType: "arraybuffer" });
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`HTTP ${res.status}`);
  }
  // ⚠️ A 200 does NOT mean we got a clip. Point `VITE_ASSET_BASE_URL` at the
  // apex `openlingoapp.com` instead of `app.openlingoapp.com` and every /tts/
  // path returns the marketing site's SPA shell — 200, text/html, ~29 KB, no
  // 404 anywhere. `decodeAudioData` then rejects it and `loadBuffer` swallows
  // that as a console.warn, so the lesson plays through in total silence with
  // nothing in the UI to suggest a misconfiguration. That is exactly how the
  // first hardware build shipped mute (2026-08-07).
  //
  // Fail loudly here instead, naming the base URL, because the decode error
  // this replaces points at the audio stack and the real bug is one env line.
  const type = header(res.headers, "content-type").toLowerCase();
  if (type.includes("text/html")) {
    throw new Error(
      `expected audio, got text/html from ${url} — VITE_ASSET_BASE_URL is ` +
        `probably the marketing apex instead of https://app.openlingoapp.com`,
    );
  }
  return await toArrayBuffer(res.data);
}
