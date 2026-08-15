/// <reference types="vitest" />
import fs from "fs";
import path from "path";
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

/**
 * Inject a Content-Security-Policy `<meta>` tag into the built index.html.
 *
 * Build-only on purpose (`apply: "build"`): Vite's dev server injects an
 * inline React-Refresh preamble script that a strict `script-src` would
 * block, so enforcing the policy in `vite dev` would break HMR. The static
 * S3+CloudFront/Amplify hosting can't set response headers from this repo,
 * so a `<meta http-equiv>` tag is the in-repo mechanism.
 *
 * Origins for `connect-src` are read from the same env the bundle is built
 * with (VITE_API_BASE_URL / VITE_OPS_API_BASE_URL / VITE_AUTH0_DOMAIN) so the
 * policy tracks whatever backend the build targets, with a `*.lambda-url`
 * wildcard fallback for the ops URL (unset in some prod envs).
 */
function originOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

function cspMetaPlugin(env: Record<string, string>): Plugin {
  const apiOrigin = originOf(env.VITE_API_BASE_URL);
  const opsOrigin = originOf(env.VITE_OPS_API_BASE_URL);
  const auth0Origin = env.VITE_AUTH0_DOMAIN ? `https://${env.VITE_AUTH0_DOMAIN}` : null;
  // TTS mp3s live on the asset CDN, not in the bundle. Same-origin in prod
  // (the site and the audio share openlingoapp.com), but a build served from
  // any other host — `vite preview`, staging — needs the origin spelled out
  // or every clip is blocked: `fetch`+decodeAudioData by connect-src, the
  // <audio> element path by media-src falling back to default-src.
  const assetOrigin = originOf(env.VITE_ASSET_BASE_URL);
  const mediaHosts = [
    assetOrigin,
    // Third-party Hangul letter clips (shared/audio/alphabetAudio.ts).
    "https://d27hu3tsvatwlt.cloudfront.net",
  ].filter(Boolean) as string[];

  // AdSense hosts were removed 2026-07-29 — ads + subscriptions are deferred,
  // and the allowances were doing active harm: `frame-src` listed ONLY the ad
  // hosts plus 'self', so Auth0's silent-auth iframe was blocked outright
  // ("Framing 'https://dev-...auth0.com/' violates ... frame-src"). Re-add a
  // scoped list when ads actually ship; do not restore this wholesale.
  const backends = [
    apiOrigin,
    opsOrigin,
    // Covers core + ops Lambda Function URLs (ops URL is unset in some envs).
    "https://*.lambda-url.us-west-1.on.aws",
    auth0Origin,
  ].filter(Boolean) as string[];

  const policy = [
    `default-src 'self'`,
    `base-uri 'self'`,
    `object-src 'none'`,
    // NOTE: `frame-ancestors` is deliberately absent. Browsers IGNORE it when
    // delivered via <meta> and log a warning for every script that reads the
    // policy — it was pure console noise here. Clickjacking protection has to
    // come from a real response header; add it to the CloudFront
    // response-headers policy in lingo-infra, not here.
    // 'wasm-unsafe-eval': onnxruntime-web (Whisper STT) instantiates WASM.
    `script-src 'self' 'wasm-unsafe-eval'`,
    // 'unsafe-inline': React inline style attrs + libs (md-editor, charts);
    // Google Fonts stylesheet is loaded from fonts.googleapis.com.
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src 'self' data: https://fonts.gstatic.com`,
    // data:/blob: for Noto emoji SVGs + generated art; https: for avatars.
    `img-src 'self' data: blob: https:`,
    `connect-src 'self' ${[...backends, ...mediaHosts].join(" ")}`,
    // <audio> playback: TTS clips off the asset CDN plus the third-party
    // Hangul alphabet clips (shared/audio/alphabetAudio.ts). Without this
    // media-src falls back to default-src 'self' and both are blocked.
    `media-src 'self' blob: ${mediaHosts.join(" ")}`.trim(),
    // Auth0 frames its own domain for silent auth (`checkSession`). This was
    // missing while the ad hosts were listed, which is what broke login.
    `frame-src ${["'self'", auth0Origin].filter(Boolean).join(" ")}`,
    // Whisper STT spins up a module worker from a blob URL.
    `worker-src 'self' blob:`,
  ].join("; ");

  return {
    name: "csp-meta",
    apply: "build",
    transformIndexHtml(html) {
      return html.replace(
        /<head>/i,
        `<head>\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />`,
      );
    },
  };
}

/**
 * Dev-only middleware that catches POSTs from `src/shared/devlog/devLog.ts`
 * and appends them to `/tmp/lingo-console.log`. Lets Claude tail the
 * file to see the user's actual browser console in real time without
 * hand-pasting screenshots.
 *
 * Active only when `vite` runs in serve mode. Quiet otherwise.
 */
function devLogMiddleware(): Plugin {
  const logFile = "/tmp/lingo-console.log";
  return {
    name: "dev-log-middleware",
    apply: "serve",
    configureServer(server) {
      try {
        fs.writeFileSync(logFile, `# lingo dev log — ${new Date().toISOString()}\n`);
      } catch {
        /* ignore */
      }
      server.middlewares.use("/__lingo-log", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end();
          return;
        }
        const chunks: Buffer[] = [];
        req.on("data", (c: Buffer) => chunks.push(c));
        req.on("end", () => {
          try {
            const body = Buffer.concat(chunks).toString("utf8");
            const { batch } = JSON.parse(body) as {
              batch: { level: string; ts: number; msg: string }[];
            };
            const lines = batch
              .map((e) => {
                const t = new Date(e.ts).toISOString().slice(11, 23);
                return `${t} [${e.level}] ${e.msg}`;
              })
              .join("\n");
            fs.appendFileSync(logFile, lines + "\n");
          } catch {
            /* ignore malformed payloads */
          }
          res.statusCode = 204;
          res.end();
        });
      });
    },
  };
}

/**
 * Dev-only middleware that mirrors the QA test-drive page's notes
 * (`/:lang/qa`) into /tmp/lingo-qa-notes.json on every save, so an agent
 * can watch marks/critiques land in real time while the tester works —
 * same idea as devLogMiddleware, but structured state instead of logs.
 */
/**
 * Same mirror pattern for the spine-planner page (/:lang/spine-plan) —
 * tile order, verdicts, and notes land in /tmp/lingo-spine-plan.json on
 * every debounced save so an agent can watch rewrite decisions live.
 */
function spinePlanMiddleware(): Plugin {
  const planFile = "/tmp/lingo-spine-plan.json";
  return {
    name: "spine-plan-middleware",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/__lingo-spine-plan", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end();
          return;
        }
        const chunks: Buffer[] = [];
        let size = 0;
        req.on("data", (c: Buffer) => {
          size += c.length;
          if (size > 1_000_000) {
            res.statusCode = 413;
            res.end();
            req.destroy();
            return;
          }
          chunks.push(c);
        });
        req.on("end", () => {
          try {
            const body = Buffer.concat(chunks).toString("utf8");
            JSON.parse(body); // validate before writing
            fs.writeFileSync(`${planFile}.tmp`, body);
            fs.renameSync(`${planFile}.tmp`, planFile);
            res.statusCode = 204;
          } catch {
            res.statusCode = 400;
          }
          res.end();
        });
      });
    },
  };
}

/**
 * Same mirror pattern for the review-queue page (/:lang/qa/review) —
 * Spencer's verdicts/answers land in /tmp/lingo-review-queue.json so an
 * agent can pick up decisions live instead of waiting on an export.
 */
function reviewQueueMiddleware(): Plugin {
  const queueFile = "/tmp/lingo-review-queue.json";
  return {
    name: "review-queue-middleware",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/__lingo-review-queue", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end();
          return;
        }
        const chunks: Buffer[] = [];
        let size = 0;
        req.on("data", (c: Buffer) => {
          size += c.length;
          if (size > 1_000_000) {
            res.statusCode = 413;
            res.end();
            req.destroy();
            return;
          }
          chunks.push(c);
        });
        req.on("end", () => {
          try {
            const body = Buffer.concat(chunks).toString("utf8");
            JSON.parse(body); // validate before writing
            fs.writeFileSync(`${queueFile}.tmp`, body);
            fs.renameSync(`${queueFile}.tmp`, queueFile);
            res.statusCode = 204;
          } catch {
            res.statusCode = 400;
          }
          res.end();
        });
      });
    },
  };
}

function qaNotesMiddleware(): Plugin {
  const notesFile = "/tmp/lingo-qa-notes.json";
  return {
    name: "qa-notes-middleware",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/__lingo-qa-notes", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end();
          return;
        }
        const chunks: Buffer[] = [];
        let size = 0;
        req.on("data", (c: Buffer) => {
          size += c.length;
          if (size > 1_000_000) {
            // A notes blob is a few KB — near-1MB means a bug; don't buffer.
            res.statusCode = 413;
            res.end();
            req.destroy();
            return;
          }
          chunks.push(c);
        });
        req.on("end", () => {
          try {
            const body = Buffer.concat(chunks).toString("utf8");
            JSON.parse(body); // validate before writing
            // tmp+rename: a watcher reading the file mid-write must never
            // see torn JSON (rename is atomic on the same filesystem).
            fs.writeFileSync(`${notesFile}.tmp`, body);
            fs.renameSync(`${notesFile}.tmp`, notesFile);
            res.statusCode = 204;
          } catch {
            res.statusCode = 400;
          }
          res.end();
        });
      });
    },
  };
}

/**
 * Vite's default static-file middleware sends `Content-Encoding: gzip`
 * for any file ending in `.gz`, which causes the browser to
 * auto-decompress before handing the bytes to JS. Kuromoji then tries
 * to gunzip the already-decompressed payload and dies with "invalid
 * file signature". Intercept /dict/*.dat.gz and serve raw bytes with
 * `Content-Encoding: identity` so kuromoji gets the gzipped bytes it
 * expects to decompress itself.
 */
/**
 * Serve TTS clips from disk in dev, falling back to the CDN and caching what
 * it fetches.
 *
 * The mp3s no longer live in the repo, so without this every dev session
 * depends on the network for audio — and offline work has none at all. This
 * makes local dev self-sufficient after first use:
 *
 *   1. `$TTS_LOCAL_DIR` (default `../lingo-data/out/tts`) — whatever the
 *      pipeline last generated. Read-only; nothing is written back here.
 *   2. `.tts-cache/` — clips previously pulled from the CDN.
 *   3. The CDN, which is then written into `.tts-cache/` for next time.
 *
 * So a fresh clone works with no setup (path 3), an offline laptop works for
 * anything already played (path 2), and someone iterating on generation sees
 * their own output immediately without publishing (path 1).
 *
 * Registered ahead of `server.proxy` so it wins for `/tts/*`; anything it
 * declines falls through to the proxy.
 */
function serveTtsLocally(): Plugin {
  const sourceDir = process.env.TTS_LOCAL_DIR
    ? path.resolve(process.env.TTS_LOCAL_DIR)
    : path.resolve(__dirname, "../lingo-data/out/tts");
  const cacheDir = path.resolve(__dirname, ".tts-cache");
  const origin = (process.env.VITE_TTS_PROXY_TARGET || "https://openlingoapp.com").replace(/\/+$/, "");

  return {
    name: "serve-tts-locally",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/tts", async (req, res, next) => {
        const rel = (req.url ?? "").split("?")[0].replace(/^\//, "");
        // Path traversal guard — `rel` comes straight off the request.
        if (!rel || rel.includes("..")) return next();

        // `/tts/v1/ja/x.mp3` arrives here as `v1/ja/x.mp3`; the pipeline's own
        // output has no version segment, so try both shapes.
        const unversioned = rel.replace(/^v\d+\//, "");
        const candidates = [
          path.join(cacheDir, rel),
          path.join(sourceDir, unversioned),
          path.join(sourceDir, rel),
        ];
        for (const file of candidates) {
          if (!fs.existsSync(file) || !fs.statSync(file).isFile()) continue;
          res.setHeader("Content-Type", rel.endsWith(".json") ? "application/json" : "audio/mpeg");
          res.setHeader("X-Tts-Source", file.startsWith(cacheDir) ? "cache" : "local");
          res.end(fs.readFileSync(file));
          return;
        }

        // Not local — pull it once, hand it back, and keep a copy.
        try {
          const upstream = await fetch(`${origin}/tts/${rel}`);
          const type = upstream.headers.get("content-type") ?? "";
          // A missing clip comes back as the SPA shell with a 200, not a 404
          // (the distribution maps 403/404 to index.html). Caching that would
          // poison the dir with HTML named .mp3, so only keep real audio.
          if (!upstream.ok || (rel.endsWith(".mp3") && !type.includes("audio"))) {
            res.statusCode = 404;
            res.end();
            return;
          }
          const buf = Buffer.from(await upstream.arrayBuffer());
          const dest = path.join(cacheDir, rel);
          fs.mkdirSync(path.dirname(dest), { recursive: true });
          fs.writeFileSync(dest, buf);
          res.setHeader("Content-Type", type || "audio/mpeg");
          res.setHeader("X-Tts-Source", "cdn");
          res.end(buf);
        } catch {
          next(); // offline and not cached — let the proxy produce the error
        }
      });
    },
  };
}

function serveDictAsBinary(): Plugin {
  return {
    name: "serve-dict-as-binary",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/dict", (req, res, next) => {
        if (!req.url || !req.url.endsWith(".dat.gz")) {
          next();
          return;
        }
        const filePath = path.resolve(
          __dirname,
          "src/pub/dict",
          req.url.replace(/^\//, ""),
        );
        if (!fs.existsSync(filePath)) {
          next();
          return;
        }
        const buf = fs.readFileSync(filePath);
        res.setHeader("Content-Type", "application/octet-stream");
        res.setHeader("Content-Encoding", "identity");
        res.setHeader("Content-Length", String(buf.length));
        res.setHeader("Cache-Control", "public, max-age=3600");
        res.end(buf);
      });
    },
  };
}

/**
 * Mirror kuromoji's dictionary files into the public dir so they're
 * served at `/dict/*` in both dev and prod. We considered configuring
 * the kuroshiro analyzer with a custom CDN URL, but copying is
 * simpler, hermetic, and doesn't add a runtime network dependency on
 * an external host (the dict ships as part of the deploy artifact).
 * Runs once on plugin configure; cheap enough not to gate behind a
 * build flag.
 */
function copyKuromojiDict(): Plugin {
  return {
    name: "copy-kuromoji-dict",
    configResolved() {
      const src = path.resolve(__dirname, "node_modules/kuromoji/dict");
      const dst = path.resolve(__dirname, "src/pub/dict");
      if (!fs.existsSync(src)) return;
      fs.mkdirSync(dst, { recursive: true });
      for (const f of fs.readdirSync(src)) {
        const srcFile = path.join(src, f);
        const dstFile = path.join(dst, f);
        if (
          !fs.existsSync(dstFile) ||
          fs.statSync(srcFile).mtimeMs > fs.statSync(dstFile).mtimeMs
        ) {
          fs.copyFileSync(srcFile, dstFile);
        }
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "VITE_");
  return {
  plugins: [
    react(),
    serveTtsLocally(),
    serveDictAsBinary(),
    copyKuromojiDict(),
    devLogMiddleware(),
    qaNotesMiddleware(),
    reviewQueueMiddleware(),
    spinePlanMiddleware(),
    cspMetaPlugin(env),
    // Service worker: the app is a daily-use tool, so returning visits are the
    // common case — precaching the learner path makes them load from disk
    // instead of re-paying the CDN round trips every morning (the shell is
    // served `no-cache` and this app's traffic is low enough that even the
    // hashed assets are frequently evicted from the CloudFront edge).
    VitePWA({
      // Updates apply on next navigation (autoUpdate = skipWaiting+claim);
      // registration lives in main.tsx, guarded off for the native wrapper.
      registerType: "autoUpdate",
      injectRegister: false,
      // The hand-maintained manifest in src/pub is the real one.
      manifest: false,
      workbox: {
        // Single-file sw.js — the deploy workflow uploads it `no-cache`
        // (like index.html); a separate hashed workbox chunk would need its
        // own exemption bookkeeping for zero benefit at this size.
        inlineWorkboxRuntime: true,
        // Precache = shell + everything on the open→lesson happy path.
        // Deliberately NOT **/*.js: dist also carries admin/dev routes, a
        // 23 MB Whisper WASM, the kuromoji dict, and thousands of emoji
        // SVGs — those stay network + runtime-cache. A chunk missing from
        // this list still gets cached forever on first use by the
        // runtime `/assets/` rule below, so the cost of drift is one
        // network fetch, not a broken page.
        globPatterns: [
          "index.html",
          "manifest.webmanifest",
          "assets/index-*.{js,css}",
          "assets/react-vendor-*.js",
          "assets/query-vendor-*.js",
          "assets/auth-vendor-*.js",
          "assets/i18n-vendor-*.js",
          "assets/dnd-vendor-*.js",
          "assets/ProtectedHome-*.js",
          "assets/LearnHomeSwitch-*.js",
          "assets/LearnPage-*.js",
          "assets/LessonPage-*.js",
          "assets/StepRenderer-*.js",
          "assets/mockLessons-*.js",
          "assets/frequencyResolver-*.js",
          "assets/courseDeck-*.js",
          "assets/moduleMastery-*.js",
          "assets/lessonEnumeration-*.js",
          "assets/grammarReviewPools-*.js",
          "assets/GrammarRuleStepView-*.js",
          "assets/hiragana-*.js",
          "assets/katakana-*.js",
          "assets/kanji-*.js",
          // Per-language TTS manifest chunks — fetched on every boot.
          "assets/ja-*.js",
          "assets/ja-keita-*.js",
          "assets/es-*.js",
          "assets/ko-*.js",
        ],
        // mockLessons is ~3 MB raw; the default 2 MB cap would silently
        // drop it from the precache manifest.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        // SPA routing offline/from-cache; real files must never fall back
        // to the shell (the CDN's 403→index.html mapping already taught us
        // how confusing HTML-named-.mp3 is — see serveTtsLocally).
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/assets\//, /^\/tts\//, /^\/dict\//, /^\/noto-emoji\//],
        runtimeCaching: [
          {
            // Hashed filenames — immutable by construction. Anything not
            // precached (admin pages, practice modes) caches on first use.
            urlPattern: /\/assets\/.*-[\w-]{8}\.(js|css|woff2?)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "hashed-assets",
              expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            // TTS clips: content-hash filenames under a version prefix,
            // never rewritten (a regeneration bumps the prefix). The
            // manifests under /tts/manifest/ are mutable and excluded.
            urlPattern: /\/tts\/v\d+\/.*\.mp3$/,
            handler: "CacheFirst",
            options: {
              cacheName: "tts-clips",
              expiration: { maxEntries: 600, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "font-css" },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
            handler: "CacheFirst",
            options: {
              cacheName: "font-files",
              expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
  publicDir: "src/pub",

  // Audio is served SAME-ORIGIN in production: CloudFront fronts both the app
  // and `/tts/*` from one distribution, so the app resolves relative paths and
  // never needs CORS. That matters because `loadBuffer` uses
  // fetch + decodeAudioData, which IS CORS-enforced — an absolute CDN base
  // silently killed every Web Audio clip on any origin except the apex (and
  // `www` serves the same SPA with no redirect, so it broke there too).
  //
  // Dev has no such luxury: localhost is a genuinely different origin, and the
  // mp3s no longer live in the repo. Proxying `/tts` keeps dev same-origin as
  // well, so local and prod exercise the identical code path.
  //
  // This covers `vite preview` too — `preview.proxy` defaults to `server.proxy`,
  // verified by the `via: ...cloudfront.net` header on a preview response. Do
  // not add a separate `preview` block for this.
  server: {
    proxy: {
      "/tts": {
        target: env.VITE_TTS_PROXY_TARGET || "https://openlingoapp.com",
        changeOrigin: true,
      },
    },
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // kuroshiro-analyzer-kuromoji uses Node's `path.join` to build
      // dict URLs. Vite externalizes node:path in the browser, leaving
      // path.join undefined. Aliasing to path-browserify provides the
      // shim. Required for kanji→hiragana conversion at runtime.
      path: "path-browserify",
    },
  },
  // The Whisper STT spike uses `new Worker(new URL(...), { type: 'module' })`
  // syntax (see `src/shared/speech/useWhisperRecognition.ts`). When the
  // worker imports any code that is itself code-split (transformers.js
  // pulls in onnxruntime-web as a separate chunk), Rollup needs the
  // worker output format to be 'es' — the default IIFE doesn't support
  // multi-chunk worker builds.
  worker: {
    format: "es",
  },
  // The Whisper bundle is heavy (~3 MB transformers.js + onnxruntime
  // WASM). Excluding from optimizeDeps prevents Vite's dev pre-bundle
  // step from choking on the ONNX runtime's dynamic WASM/threads code
  // paths. Pre-bundled prod build is unaffected.
  // kuroshiro + kuroshiro-analyzer-kuromoji ship CommonJS; include them
  // in optimizeDeps so Vite pre-bundles them into ESM for the dynamic
  // import in `shared/japanese/kanjiReading.ts`.
  optimizeDeps: {
    exclude: ["@huggingface/transformers"],
    include: ["kuroshiro", "kuroshiro-analyzer-kuromoji"],
  },
  build: {
    rollupOptions: {
      output: {
        // Group statically-imported heavy vendors into named, cache-stable
        // chunks. Route-specific vendors (charts/markdown/dnd) are only
        // reachable through lazy routes, so their chunks stay lazy too.
        // NB: no catch-all `vendor` bucket on purpose — assigning a chunk to
        // a dynamically-imported module (kuroshiro/kuromoji/transformers)
        // would pull it into an eager chunk and defeat its lazy import().
        // Anything unlisted falls through to Rollup's default splitting,
        // which preserves those async boundaries.
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          // React + router must live in ONE chunk — splitting React across
          // chunks breaks hook/context identity.
          if (
            /[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom|use-sync-external-store)[\\/]/.test(
              id,
            )
          )
            return "react-vendor";
          if (id.includes("@tanstack")) return "query-vendor";
          if (id.includes("@auth0")) return "auth-vendor";
          if (id.includes("i18next")) return "i18n-vendor";
          if (
            id.includes("recharts") ||
            id.includes("d3-") ||
            id.includes("victory-vendor")
          )
            return "charts-vendor";
          if (
            id.includes("@uiw") ||
            id.includes("react-markdown") ||
            /[\\/](remark|rehype|micromark|mdast|hast|unist|vfile|property-information|hastscript|comma-separated-tokens|space-separated-tokens|decode-named-character-reference)/.test(
              id,
            )
          )
            return "markdown-vendor";
          if (id.includes("@dnd-kit")) return "dnd-vendor";
        },
      },
    },
  },
  test: {
    // ARCHIVED old-course content — excluded from the run (2026-07-26 ruling).
    exclude: ["**/node_modules/**", "**/dist/**", "**/curriculum/_archive/**"],
    environment: "happy-dom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    // Several integration tests walk the entire JA curriculum (build every
    // lesson) and legitimately take 5-11s; the 5s default flakes them under
    // machine load. A real assertion failure still fails instantly — this
    // only prevents slow-but-passing whole-course walks from timing out.
    testTimeout: 20000,
  },
  };
});
