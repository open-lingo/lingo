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

/** GET `url` as raw bytes through the native HTTP stack. Throws on non-2xx. */
export async function fetchBinaryNative(url: string): Promise<ArrayBuffer> {
  const { CapacitorHttp } = await import("@capacitor/core");
  const res = await CapacitorHttp.get({ url, responseType: "arraybuffer" });
  // A missing clip comes back from CloudFront as the SPA shell with a 200 in
  // some configurations, so a status check alone isn't sufficient downstream —
  // `decodeAudioData` is the real gate. This just catches the honest failures.
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`HTTP ${res.status}`);
  }
  return await toArrayBuffer(res.data);
}
