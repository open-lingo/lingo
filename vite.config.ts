/// <reference types="vitest" />
import fs from "fs";
import path from "path";
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

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

  // AdSense pulls scripts/iframes/pixels from a spread of Google ad hosts.
  const adSense = [
    "https://pagead2.googlesyndication.com",
    "https://*.googlesyndication.com",
    "https://*.google.com",
    "https://*.doubleclick.net",
    "https://*.adtrafficquality.google",
  ];
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
    `frame-ancestors 'self'`,
    // 'wasm-unsafe-eval': onnxruntime-web (Whisper STT) instantiates WASM.
    `script-src 'self' 'wasm-unsafe-eval' ${adSense.join(" ")}`,
    // 'unsafe-inline': React inline style attrs + libs (md-editor, charts);
    // Google Fonts stylesheet is loaded from fonts.googleapis.com.
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src 'self' data: https://fonts.gstatic.com`,
    // data:/blob: for Noto emoji SVGs + generated art; https: for avatars + ad pixels.
    `img-src 'self' data: blob: https:`,
    `connect-src 'self' ${[...backends, ...adSense].join(" ")}`,
    // AdSense renders creatives inside iframes.
    `frame-src 'self' ${adSense.join(" ")}`,
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
    serveDictAsBinary(),
    copyKuromojiDict(),
    devLogMiddleware(),
    qaNotesMiddleware(),
    cspMetaPlugin(env),
  ],
  publicDir: "src/pub",
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
  test: {
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
