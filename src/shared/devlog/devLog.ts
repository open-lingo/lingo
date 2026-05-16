/**
 * Dev-only console log forwarder. Captures console.{log,info,warn,error,
 * debug} and POSTs each call to `/__lingo-log` on the Vite dev server,
 * which appends it to `/tmp/lingo-console.log` for tailing by Claude.
 *
 * The middleware is registered in `vite.config.ts`. This module is a
 * no-op in production builds.
 *
 * Original console methods are NOT replaced — they still fire in the
 * browser. We just add a fire-and-forget POST as a side effect.
 */

const SERVER_PATH = "/__lingo-log";
const QUEUE_MAX = 50;
const FLUSH_INTERVAL_MS = 250;

type LogLevel = "log" | "info" | "warn" | "error" | "debug";

type LogEntry = {
  level: LogLevel;
  ts: number;
  msg: string;
};

let installed = false;
let queue: LogEntry[] = [];
let flushTimer: number | null = null;

function safeStringify(arg: unknown): string {
  if (arg === null) return "null";
  if (arg === undefined) return "undefined";
  if (typeof arg === "string") return arg;
  if (typeof arg === "number" || typeof arg === "boolean") return String(arg);
  if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
  try {
    return JSON.stringify(arg);
  } catch {
    return "[unserializable]";
  }
}

function flush() {
  flushTimer = null;
  if (queue.length === 0) return;
  const batch = queue;
  queue = [];
  // Fire and forget. Failures are silent — we don't want logging to
  // produce more logging.
  try {
    void fetch(SERVER_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batch }),
      keepalive: true,
    });
  } catch {
    /* ignore */
  }
}

function scheduleFlush() {
  if (flushTimer != null) return;
  if (queue.length >= QUEUE_MAX) {
    flush();
    return;
  }
  flushTimer = window.setTimeout(flush, FLUSH_INTERVAL_MS);
}

function enqueue(level: LogLevel, args: unknown[]) {
  queue.push({
    level,
    ts: Date.now(),
    msg: args.map(safeStringify).join(" "),
  });
  scheduleFlush();
}

export function installDevLog(): void {
  if (installed) return;
  if (!import.meta.env.DEV) return;
  if (typeof window === "undefined") return;
  installed = true;

  const levels: LogLevel[] = ["log", "info", "warn", "error", "debug"];
  for (const level of levels) {
    const original = console[level].bind(console);
    console[level] = (...args: unknown[]) => {
      original(...args);
      enqueue(level, args);
    };
  }

  // Also capture unhandled errors and promise rejections.
  window.addEventListener("error", (e) => {
    enqueue("error", [`[uncaught]`, e.message, e.filename, `:${e.lineno}`]);
  });
  window.addEventListener("unhandledrejection", (e) => {
    enqueue("error", [`[unhandledrejection]`, safeStringify(e.reason)]);
  });

  // Initial breadcrumb so the tail shows session boundaries.
  enqueue("info", ["[devLog] installed", window.location.href]);
}
