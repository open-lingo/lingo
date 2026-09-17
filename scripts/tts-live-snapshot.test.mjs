import test from "node:test";
import assert from "node:assert/strict";
import {
  probeOnce,
  sweepPass,
  runSweep,
  POISON_FRACTION,
  MAX_PASS_ATTEMPTS,
} from "./tts-live-snapshot.mjs";

// --- probeOnce -------------------------------------------------------------
// Exercises the classification probeOnce is responsible for: a confirmed
// audio/* 200 is "live", a non-audio 200 (the CloudFront SPA-shell
// fallback) is "html" — the poisoning signature — and a clean 4xx is
// "other". Stubs global.fetch; no real network traffic.

function fakeResponse({ ok, status = 200, contentType }) {
  return {
    ok,
    status,
    headers: { get: (name) => (name === "content-type" ? contentType ?? null : null) },
  };
}

test("probeOnce: audio/* 200 is live", async () => {
  const origFetch = global.fetch;
  global.fetch = async () => fakeResponse({ ok: true, contentType: "audio/mpeg" });
  try {
    assert.equal(await probeOnce("https://example.test/x.mp3"), "live");
  } finally {
    global.fetch = origFetch;
  }
});

test("probeOnce: text/html 200 (SPA shell) is html, not live", async () => {
  const origFetch = global.fetch;
  global.fetch = async () => fakeResponse({ ok: true, contentType: "text/html; charset=utf-8" });
  try {
    assert.equal(await probeOnce("https://example.test/x.mp3"), "html");
  } finally {
    global.fetch = origFetch;
  }
});

test("probeOnce: clean 404 is other", async () => {
  const origFetch = global.fetch;
  global.fetch = async () => fakeResponse({ ok: false, status: 404 });
  try {
    assert.equal(await probeOnce("https://example.test/x.mp3"), "other");
  } finally {
    global.fetch = origFetch;
  }
});

// --- sweepPass ---------------------------------------------------------
test("sweepPass: partitions live/notLive and counts html separately", async () => {
  const origFetch = global.fetch;
  const byHash = {
    a: fakeResponse({ ok: true, contentType: "audio/mpeg" }),
    b: fakeResponse({ ok: true, contentType: "text/html" }),
    c: fakeResponse({ ok: false, status: 404 }),
  };
  global.fetch = async (url) => {
    const hash = url.split("/").pop().replace(".mp3", "");
    return byHash[hash];
  };
  try {
    const result = await sweepPass("tts/v1/x", ["a", "b", "c"]);
    assert.deepEqual(result.live, ["a"]);
    assert.deepEqual(result.notLive.sort(), ["b", "c"]);
    assert.equal(result.htmlCount, 1);
  } finally {
    global.fetch = origFetch;
  }
});

// --- runSweep: retry pass ------------------------------------------------
// Item A requirement (1): after the first sweep, re-HEAD every "not live"
// hash once more after a short delay, and only THEN count it missing.

test("runSweep: a hash that recovers on the retry pass is not counted missing", async () => {
  const sweepPassFn = async () => ({
    live: ["good"],
    notLive: ["flaky", "reallyMissing"],
    htmlCount: 0,
  });
  const probeFn = async (url) => {
    // "flaky" comes back live on the retry HEAD; "reallyMissing" never does.
    if (url.includes("flaky")) return "live";
    return "other";
  };
  const sleeps = [];
  const sleepFn = async (ms) => sleeps.push(ms);

  const result = await runSweep("test-lang", "tts/v1/x", ["good", "flaky", "reallyMissing"], {
    sweepPassFn,
    probeFn,
    sleepFn,
  });

  assert.equal(result.poisoned, false);
  assert.equal(result.live, 2); // good + flaky (recovered)
  assert.deepEqual(result.notLive, ["reallyMissing"]);
  assert.equal(result.retriedRecovered, 1);
  assert.equal(result.attempts, 1);
  assert.deepEqual(result.liveHashes, ["flaky", "good"].sort());
  // A ≥2s pause happened before the retry pass, plus one SPACING_MS sleep
  // per retried hash — confirms the delay actually ran, not just the count.
  assert.ok(sleeps.length >= 1);
  assert.ok(sleeps[0] >= 2000, `expected the first sleep to be the ≥2s retry-pass delay, got ${sleeps[0]}`);
});

// --- runSweep: poison guard ----------------------------------------------
// Item A requirement (2): if more than 25% of a language's hashes come back
// text/html in one pass, treat the pass as poisoned, wait, and redo the
// whole pass (max 3 attempts) instead of writing a result.

test("runSweep: a pass with >25% html is discarded and redone, then succeeds clean", async () => {
  let call = 0;
  const sweepPassFn = async () => {
    call++;
    if (call === 1) {
      // 3/4 = 75% html — well past the 25% poison floor.
      return { live: ["a"], notLive: ["b", "c", "d"], htmlCount: 3 };
    }
    // Second attempt: clean.
    return { live: ["a", "b", "c", "d"], notLive: [], htmlCount: 0 };
  };
  const sleeps = [];
  const sleepFn = async (ms) => sleeps.push(ms);

  const result = await runSweep("test-lang", "tts/v1/x", ["a", "b", "c", "d"], {
    sweepPassFn,
    probeFn: async () => "other",
    sleepFn,
  });

  assert.equal(call, 2);
  assert.equal(result.poisoned, false);
  assert.equal(result.attempts, 2);
  assert.equal(result.live, 4);
  assert.ok(sleeps.includes(10_000), "expected the 10s poison-wait to run before redoing the pass");
});

test("runSweep: still poisoned after MAX_PASS_ATTEMPTS writes nothing", async () => {
  let call = 0;
  const sweepPassFn = async () => {
    call++;
    // Always 100% html — never recovers.
    return { live: [], notLive: ["a", "b", "c", "d"], htmlCount: 4 };
  };
  const sleepFn = async () => {};

  const result = await runSweep("test-lang", "tts/v1/x", ["a", "b", "c", "d"], {
    sweepPassFn,
    probeFn: async () => "other",
    sleepFn,
  });

  assert.equal(call, MAX_PASS_ATTEMPTS);
  assert.equal(result.poisoned, true);
  assert.equal(result.attempts, MAX_PASS_ATTEMPTS);
  assert.deepEqual(result.liveHashes, []);
});

test("runSweep: a pass at exactly the 25% floor is NOT poisoned (strictly greater-than)", async () => {
  // 1/4 = 25% html — at the floor, not over it.
  const sweepPassFn = async () => ({ live: ["a", "b", "c"], notLive: ["d"], htmlCount: 1 });
  const result = await runSweep("test-lang", "tts/v1/x", ["a", "b", "c", "d"], {
    sweepPassFn,
    probeFn: async () => "other",
    sleepFn: async () => {},
  });
  assert.equal(result.poisoned, false);
  assert.equal(result.attempts, 1);
});

assert.ok(POISON_FRACTION === 0.25, "sanity: poison fraction constant is the documented 25%");
