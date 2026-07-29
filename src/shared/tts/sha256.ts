/**
 * Synchronous SHA-256 over UTF-8, returning the first 16 hex chars.
 *
 * ## Why not crypto.subtle
 *
 * `crypto.subtle.digest` is the obvious answer and it is ASYNC. `getTtsUrl`
 * is called synchronously from ~107 sites, many of them inside render to
 * decide whether a speaker button exists at all:
 *
 *     const hasAudio = getTtsUrl(example.ja) !== null;
 *
 * Making that async would turn every one of those into a loading state. A
 * self-contained sync implementation is far cheaper than that refactor.
 *
 * ## Why only 16 chars
 *
 * That is the pipeline's key: `sha256(f"{lang}:{text}").hexdigest()[:16]`
 * (see `lingo-data/pipeline/tts/generate.py`). Only H[0] and H[1] are needed
 * to produce it, so the final hex conversion stops after two words.
 *
 * Collision risk at 64 bits over ~15k (soon ~40k) keys is ~1e-11 — and a
 * collision degrades to "plays the wrong clip", not a crash. The pipeline has
 * used this width since inception; matching it exactly is the requirement.
 *
 * Verified byte-identical to Python's hashlib across the full production
 * manifest (14,380 entries, ja/ko/es/ja-keita) — see sha256.test.ts.
 */

// First 32 bits of the fractional parts of the cube roots of the first 64
// primes. FIPS 180-4 §4.2.2.
const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
  0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
  0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
  0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
  0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
  0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

const encoder = new TextEncoder();
// Scratch buffers reused across calls — this runs in render paths, and the
// allocation churn of a fresh Uint32Array(64) per call is pure waste.
const W = new Uint32Array(64);
const H = new Uint32Array(8);

function rotr(x: number, n: number): number {
  return ((x >>> n) | (x << (32 - n))) >>> 0;
}

/** Lowercase hex of the first 16 chars (8 bytes) of SHA-256(utf8(input)). */
export function sha256Hex16(input: string): string {
  const bytes = encoder.encode(input);
  const bitLenLo = (bytes.length * 8) >>> 0;
  const bitLenHi = Math.floor((bytes.length * 8) / 0x100000000);

  // Message + 0x80 + zero pad + 8-byte length, rounded up to a 64-byte block.
  const blockCount = Math.ceil((bytes.length + 9) / 64);
  const padded = new Uint8Array(blockCount * 64);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 8, bitLenHi);
  view.setUint32(padded.length - 4, bitLenLo);

  H[0] = 0x6a09e667;
  H[1] = 0xbb67ae85;
  H[2] = 0x3c6ef372;
  H[3] = 0xa54ff53a;
  H[4] = 0x510e527f;
  H[5] = 0x9b05688c;
  H[6] = 0x1f83d9ab;
  H[7] = 0x5be0cd19;

  for (let offset = 0; offset < padded.length; offset += 64) {
    for (let i = 0; i < 16; i++) W[i] = view.getUint32(offset + i * 4);
    for (let i = 16; i < 64; i++) {
      const w15 = W[i - 15];
      const w2 = W[i - 2];
      const s0 = (rotr(w15, 7) ^ rotr(w15, 18) ^ (w15 >>> 3)) >>> 0;
      const s1 = (rotr(w2, 17) ^ rotr(w2, 19) ^ (w2 >>> 10)) >>> 0;
      W[i] = (W[i - 16] + s0 + W[i - 7] + s1) >>> 0;
    }

    let a = H[0];
    let b = H[1];
    let c = H[2];
    let d = H[3];
    let e = H[4];
    let f = H[5];
    let g = H[6];
    let h = H[7];

    for (let i = 0; i < 64; i++) {
      const S1 = (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) >>> 0;
      const ch = ((e & f) ^ (~e & g)) >>> 0;
      const t1 = (h + S1 + ch + K[i] + W[i]) >>> 0;
      const S0 = (rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) >>> 0;
      const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
      const t2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + t1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) >>> 0;
    }

    H[0] = (H[0] + a) >>> 0;
    H[1] = (H[1] + b) >>> 0;
    H[2] = (H[2] + c) >>> 0;
    H[3] = (H[3] + d) >>> 0;
    H[4] = (H[4] + e) >>> 0;
    H[5] = (H[5] + f) >>> 0;
    H[6] = (H[6] + g) >>> 0;
    H[7] = (H[7] + h) >>> 0;
  }

  // 16 hex chars = 8 bytes = H[0] and H[1].
  return H[0].toString(16).padStart(8, "0") + H[1].toString(16).padStart(8, "0");
}
