/**
 * Dev page for tuning Japanese STT. Live threshold sliders, engine
 * toggle (Web Speech API vs Whisper-small), per-word mic, full N-best
 * breakdown with raw → normalized → score so we can see exactly why a
 * verdict came out the way it did.
 *
 * Route: /:lang/speech-tune (gated by no auth requirement — pure local).
 *
 * Word list is hand-curated to surface the tricky cases Spencer flagged:
 * vowel-initial, small つ (gemination), yōon, long vowels, polite
 * conjugations, common phrases.
 */
import { useEffect, useState } from "react";
import {
  scoreAlternatives,
  type MatchResult,
  type Verdict,
  useSpeechRecognition,
  useWhisperRecognition,
  type UseSpeechRecognitionApi,
  type UseWhisperRecognitionApi,
  isSpeechRecognitionSupported,
} from "@/shared/speech";
import { getTtsUrl } from "@/shared/japanese/tts";
import { convertToHiragana } from "@/shared/japanese/kanjiReading";

type WordEntry = {
  jp: string;
  romaji: string;
  meaning: string;
  note?: string;
};

type WordGroup = {
  label: string;
  blurb: string;
  words: WordEntry[];
};

const GROUPS: WordGroup[] = [
  {
    label: "Vowel-initial (h-prepend trap)",
    blurb: "Chrome ASR loves to invent a leading /h/. Tests the normalizer.",
    words: [
      { jp: "あい", romaji: "ai", meaning: "love" },
      { jp: "うえ", romaji: "ue", meaning: "above" },
      { jp: "おい", romaji: "oi", meaning: "nephew / hey" },
      { jp: "いえ", romaji: "ie", meaning: "house" },
    ],
  },
  {
    label: "Small っ (gemination)",
    blurb: "The held consonant. ASR usually drops it or smears it.",
    words: [
      { jp: "がっこう", romaji: "gakkou", meaning: "school" },
      { jp: "きって", romaji: "kitte", meaning: "stamp" },
      { jp: "いっぱい", romaji: "ippai", meaning: "a lot" },
      { jp: "ちょっと", romaji: "chotto", meaning: "a bit / wait", note: "yōon + small tsu" },
      { jp: "まって", romaji: "matte", meaning: "wait!" },
    ],
  },
  {
    label: "Yōon (palatalized)",
    blurb: "Glide consonants. きょ vs き — pure short vs long-vowel pairs.",
    words: [
      { jp: "きょう", romaji: "kyou", meaning: "today" },
      { jp: "しゅみ", romaji: "shumi", meaning: "hobby" },
      { jp: "りゅう", romaji: "ryuu", meaning: "dragon" },
      { jp: "ぎゅうにゅう", romaji: "gyuunyuu", meaning: "milk", note: "two long vowels" },
      { jp: "しゃしん", romaji: "shashin", meaning: "photo" },
    ],
  },
  {
    label: "Long vowels",
    blurb: "おー vs お, いー vs い. Often collapsed by ASR.",
    words: [
      { jp: "おにいさん", romaji: "oniisan", meaning: "older brother" },
      { jp: "おかあさん", romaji: "okaasan", meaning: "mother" },
      { jp: "おとうさん", romaji: "otousan", meaning: "father" },
      { jp: "とけい", romaji: "tokei", meaning: "clock" },
      { jp: "せんせい", romaji: "sensei", meaning: "teacher" },
    ],
  },
  {
    label: "Polite conjugations",
    blurb: "ます / ました / ません — see whether the verb stem still scores.",
    words: [
      { jp: "たべます", romaji: "tabemasu", meaning: "eat" },
      { jp: "たべました", romaji: "tabemashita", meaning: "ate" },
      { jp: "たべません", romaji: "tabemasen", meaning: "don't eat" },
      { jp: "いきます", romaji: "ikimasu", meaning: "go" },
      { jp: "いきました", romaji: "ikimashita", meaning: "went" },
    ],
  },
  {
    label: "Survival phrases",
    blurb: "Multi-word, sandhi-heavy. The realistic learner target.",
    words: [
      { jp: "ありがとう", romaji: "arigatou", meaning: "thank you" },
      { jp: "すみません", romaji: "sumimasen", meaning: "excuse me / sorry" },
      { jp: "おねがいします", romaji: "onegaishimasu", meaning: "please" },
      { jp: "よろしく", romaji: "yoroshiku", meaning: "regards" },
    ],
  },
];

type Engine = "web" | "whisper";

type Dials = {
  perfect: number;
  close: number;
  alts: number;
  strict: boolean;
};

const DEFAULTS: Dials = { perfect: 0.85, close: 0.55, alts: 5, strict: false };

export function SpeechTunePage() {
  const [engine, setEngine] = useState<Engine>("web");
  const [dials, setDials] = useState<Dials>(DEFAULTS);
  const [activeWord, setActiveWord] = useState<WordEntry | null>(null);
  const [result, setResult] = useState<MatchResult | null>(null);
  // Map keyed by the converted (post-kuroshiro) transcript →
  // original Whisper output. Empty when no conversion happened.
  const [conversions, setConversions] = useState<Map<string, string>>(
    () => new Map(),
  );

  // Mount both hooks; only the active one is used. Web is always cheap to
  // mount; Whisper lazy-loads its worker only on first start().
  const webApi = useSpeechRecognition("ja-JP", { maxAlternatives: dials.alts });
  // Whisper produces a single transcript in the current spike; N-best isn't
  // wired yet (HF pipeline doesn't expose beam alternatives stably). The
  // alts dial still affects the Web Speech path.
  const whisperApi = useWhisperRecognition("ja");

  const api: UseSpeechRecognitionApi | UseWhisperRecognitionApi =
    engine === "web" ? webApi : whisperApi;
  const whisperStatus =
    engine === "whisper" ? whisperApi.status : null;
  const whisperProgress =
    engine === "whisper" ? whisperApi.downloadProgress : null;

  // Score whenever a fresh final result comes in for the active word.
  // Pre-convert each alternative through kuroshiro so Whisper's
  // kanji-bearing transcripts ("愛" for あい, "一寸" for ちょっと)
  // match the kana target. Pure-kana inputs short-circuit inside
  // convertToHiragana — no kuroshiro round-trip.
  useEffect(() => {
    if (!activeWord) return;
    if (!api.finished) return;
    if (api.alternatives.length === 0) return;

    let cancelled = false;
    void (async () => {
      const converted = await Promise.all(
        api.alternatives.map(async (a) => ({
          ...a,
          transcript: await convertToHiragana(a.transcript),
        })),
      );
      if (cancelled) return;

      const conv = new Map<string, string>();
      for (let i = 0; i < api.alternatives.length; i++) {
        const raw = api.alternatives[i].transcript;
        const cv = converted[i].transcript;
        if (raw !== cv) conv.set(cv, raw);
      }
      setConversions(conv);

      const r = scoreAlternatives(activeWord.jp, converted, {
        perfect: dials.perfect,
        close: dials.close,
        strict: dials.strict,
      });
      setResult(r);
    })();

    return () => {
      cancelled = true;
    };
  }, [activeWord, api.finished, api.alternatives, dials]);

  function startFor(word: WordEntry) {
    setActiveWord(word);
    setResult(null);
    setConversions(new Map());
    api.reset();
    api.start();
  }

  function playTts(word: WordEntry) {
    const url = getTtsUrl(word.jp);
    if (!url) return;
    const audio = new Audio(url);
    audio.play().catch(() => {});
  }

  const browserSupportsWeb = isSpeechRecognitionSupported();

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Speech tuning</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Live STT tuning bench. Switch engines, twist thresholds, see why each
          alt scored what it did. Tap any word to record.
        </p>
      </header>

      <section className="mb-6 rounded-2xl border border-border bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-secondary">
            Engine
          </h2>
          <button
            type="button"
            className="text-xs text-text-secondary underline-offset-2 hover:underline"
            onClick={() => setDials(DEFAULTS)}
          >
            Reset dials
          </button>
        </div>
        <div className="mb-4 grid grid-cols-2 gap-2">
          <EngineButton
            label="Web Speech API"
            sub={
              browserSupportsWeb
                ? "Chrome / Edge / Safari · cloud (Google/MS) or on-device (Apple)"
                : "Not supported in this browser"
            }
            active={engine === "web"}
            disabled={!browserSupportsWeb}
            onClick={() => setEngine("web")}
          />
          <EngineButton
            label="Whisper-small (local)"
            sub="transformers.js · ~80MB model · WebGPU / WASM"
            active={engine === "whisper"}
            onClick={() => setEngine("whisper")}
          />
        </div>

        {engine === "whisper" && whisperStatus === "loading" && (
          <div className="mb-3 rounded-lg border border-border bg-bg p-3 text-sm text-text-secondary">
            Loading Whisper model
            {whisperProgress != null && (
              <> — {Math.round(whisperProgress * 100)}%</>
            )}
            … this happens once, then it's cached.
          </div>
        )}
        {engine === "whisper" && whisperStatus === "error" && (
          <div className="mb-3 rounded-lg border border-error bg-red-50 p-3 text-sm text-error dark:bg-red-950/30">
            Whisper failed to load. Switch to Web Speech API above, or check
            the console.
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Slider
            label="Perfect threshold"
            value={dials.perfect}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => setDials((d) => ({ ...d, perfect: v }))}
          />
          <Slider
            label="Close threshold"
            value={dials.close}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => setDials((d) => ({ ...d, close: v }))}
          />
          <Slider
            label="Max alternatives (N-best)"
            value={dials.alts}
            min={1}
            max={5}
            step={1}
            onChange={(v) => setDials((d) => ({ ...d, alts: v }))}
            integer
          />
          <label className="flex items-center gap-2 self-end pb-2 text-sm text-text-primary">
            <input
              type="checkbox"
              checked={dials.strict}
              onChange={(e) =>
                setDials((d) => ({ ...d, strict: e.target.checked }))
              }
            />
            Strict mode (skip normalization)
          </label>
        </div>
      </section>

      <section className="mb-6 space-y-5">
        {GROUPS.map((g) => (
          <div key={g.label}>
            <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-text-secondary">
              {g.label}
            </h3>
            <p className="mb-3 text-xs text-text-secondary">{g.blurb}</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {g.words.map((w) => (
                <WordTile
                  key={w.jp}
                  word={w}
                  active={activeWord?.jp === w.jp}
                  recording={activeWord?.jp === w.jp && api.listening}
                  busy={
                    activeWord?.jp === w.jp &&
                    engine === "whisper" &&
                    (whisperStatus === "loading" ||
                      whisperStatus === "transcribing")
                  }
                  onRecord={() => startFor(w)}
                  onStop={() => api.stop()}
                  onPlay={() => playTts(w)}
                />
              ))}
            </div>
          </div>
        ))}
      </section>

      {activeWord && (
        <section className="rounded-2xl border border-border bg-surface p-4">
          <div className="mb-3 flex items-baseline gap-3">
            <h2 className="text-lg font-semibold text-text-primary">Result</h2>
            <span className="font-japanese text-2xl text-text-primary">
              {activeWord.jp}
            </span>
            <span className="text-sm text-text-secondary">
              ({activeWord.romaji} — {activeWord.meaning})
            </span>
          </div>

          {api.error && (
            <div className="mb-3 rounded-lg border border-error bg-red-50 p-2 text-sm text-error dark:bg-red-950/30">
              error: {api.error}
            </div>
          )}

          {api.listening && (
            <div className="mb-3 rounded-lg border border-accent bg-accent-muted p-2 text-sm text-accent">
              recording…{" "}
              {api.transcript && (
                <span className="font-japanese">"{api.transcript}"</span>
              )}
            </div>
          )}

          {engine === "whisper" && whisperStatus === "transcribing" && (
            <div className="mb-3 rounded-lg border border-border bg-bg p-2 text-sm text-text-secondary">
              transcribing…
            </div>
          )}

          {result && (
            <>
              <div className="mb-3">
                <VerdictPill verdict={result.verdict} score={result.bestScore} />
              </div>
              <p className="mb-3 text-sm text-text-secondary">
                Target normalized:{" "}
                <code className="font-japanese rounded bg-bg px-1.5 py-0.5 text-text-primary">
                  {result.targetNormalized || "(empty)"}
                </code>
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-wide text-text-secondary">
                    <tr>
                      <th className="px-2 py-1">#</th>
                      <th className="px-2 py-1">raw</th>
                      <th className="px-2 py-1">kanji→kana</th>
                      <th className="px-2 py-1">normalized</th>
                      <th className="px-2 py-1">score</th>
                      <th className="px-2 py-1">conf.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.alternatives.map((a, i) => {
                      const best = result.bestAlternative === a;
                      // `a.raw` carries the post-kuroshiro string (we
                      // passed converted alts into the scorer). Look up
                      // the pre-conversion Whisper output for the "raw"
                      // column; only populate "kanji→kana" when the
                      // converter actually changed the string.
                      const original = conversions.get(a.raw);
                      const rawDisplay = original ?? a.raw;
                      const convertedDisplay = original ? a.raw : "";
                      return (
                        <tr
                          key={i}
                          className={best ? "bg-accent-muted" : ""}
                        >
                          <td className="px-2 py-1 text-text-secondary">
                            {i + 1}
                          </td>
                          <td className="font-japanese px-2 py-1 text-text-primary">
                            {rawDisplay || "(empty)"}
                          </td>
                          <td className="font-japanese px-2 py-1 text-text-primary">
                            {convertedDisplay || (
                              <span className="text-text-secondary">—</span>
                            )}
                          </td>
                          <td className="font-japanese px-2 py-1 text-text-primary">
                            {a.normalized || "(empty)"}
                          </td>
                          <td className="px-2 py-1 font-mono text-text-primary">
                            {a.score.toFixed(3)}
                          </td>
                          <td className="px-2 py-1 font-mono text-text-secondary">
                            {a.confidence != null
                              ? a.confidence.toFixed(2)
                              : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}

function EngineButton({
  label,
  sub,
  active,
  disabled,
  onClick,
}: {
  label: string;
  sub: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl border-[1.5px] p-3 text-left transition-colors ${
        active
          ? "border-accent bg-accent-muted text-accent"
          : "border-border bg-bg text-text-primary hover:border-accent"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      <div className="text-sm font-semibold">{label}</div>
      <div className="mt-0.5 text-xs text-text-secondary">{sub}</div>
    </button>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  integer,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  integer?: boolean;
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-sm text-text-primary">{label}</span>
        <span className="font-mono text-sm text-text-secondary">
          {integer ? value : value.toFixed(2)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
      />
    </div>
  );
}

function WordTile({
  word,
  active,
  recording,
  busy,
  onRecord,
  onStop,
  onPlay,
}: {
  word: WordEntry;
  active: boolean;
  recording: boolean;
  busy: boolean;
  onRecord: () => void;
  onStop: () => void;
  onPlay: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border-[1.5px] p-3 ${
        active
          ? "border-accent bg-accent-muted/30"
          : "border-border bg-bg"
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="font-japanese truncate text-lg text-text-primary">
          {word.jp}
        </div>
        <div className="truncate text-xs text-text-secondary">
          {word.romaji} · {word.meaning}
          {word.note && <span className="ml-1 italic">— {word.note}</span>}
        </div>
      </div>
      <button
        type="button"
        onClick={onPlay}
        title="Play reference"
        className="rounded-full border border-border bg-surface px-2 py-1 text-xs text-text-secondary hover:border-accent hover:text-text-primary"
      >
        ▶
      </button>
      {recording ? (
        <button
          type="button"
          onClick={onStop}
          className="rounded-full bg-error px-3 py-1 text-xs font-semibold text-white"
        >
          stop
        </button>
      ) : (
        <button
          type="button"
          onClick={onRecord}
          disabled={busy}
          className={`rounded-full px-3 py-1 text-xs font-semibold text-white ${
            busy
              ? "cursor-not-allowed bg-text-secondary opacity-60"
              : "bg-accent hover:bg-accent-hover"
          }`}
        >
          🎤 record
        </button>
      )}
    </div>
  );
}

function VerdictPill({
  verdict,
  score,
}: {
  verdict: Verdict;
  score: number;
}) {
  const styles: Record<Verdict, string> = {
    perfect: "border-accent bg-accent-muted text-accent",
    close: "border-amber-500 bg-amber-100 text-amber-700 dark:bg-amber-950/30",
    "try-again": "border-error bg-red-50 text-error dark:bg-red-950/30",
  };
  const label: Record<Verdict, string> = {
    perfect: "Perfect",
    close: "Close",
    "try-again": "Try again",
  };
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border-[1.5px] px-3 py-1 text-sm font-semibold ${styles[verdict]}`}
    >
      {label[verdict]}
      <span className="font-mono text-xs opacity-80">
        ({score.toFixed(3)})
      </span>
    </span>
  );
}
