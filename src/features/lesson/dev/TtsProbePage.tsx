import { Link } from "react-router-dom";

/**
 * DEV · The は/wa probe — six clips, one decision (R17 / the ha-wa issue).
 *
 * Spencer caught the course voice reading topic-marker は as "ha". These six
 * clips decide whether the repair is 14 sentences or 2,563. Clips regenerate
 * with the snippet in docs/issues/tts-topic-wa-mispronounced-2026-08-18.md;
 * the mp3s live in public/qa/tts-probe (dev/QA payload, ~95KB).
 */

const CLIPS: { id: string; text: string; answers: string }[] = [
  {
    id: "a",
    text: "わたしは がくせいです。",
    answers:
      "THE ONE THAT MATTERS. Ordinary topic は — if this says «watashi wa», the bug is confined to the awkward cases and the repair is 14 clips.",
  },
  {
    id: "b",
    text: "ははは せんせいに はなを あげる。",
    answers: "The reported failure — three は in a row (mother-topic-…).",
  },
  {
    id: "c",
    text: "ほんを よみます。",
    answers: "Ordinary を — should say «hon o yomimasu».",
  },
  {
    id: "d",
    text: "がっこうへ いきます。",
    answers: "Ordinary へ — should say «gakkou e ikimasu».",
  },
  {
    id: "e",
    text: "母は 先生に 花を あげる。",
    answers: "Candidate fix E: feed the synthesizer the KANJI spelling.",
  },
  {
    id: "f",
    text: "ははわ せんせいに はなを あげる。",
    answers:
      "Candidate fix F: feed it the phonetic わ. (The learner still sees は either way — the pipeline can split what is shown from what is spoken.)",
  },
];

export default function TtsProbePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-xl font-bold">The は/wa probe — sixty seconds</h1>
      <p className="mt-2 text-sm text-text-muted">
        Course voice (Nanami). Two questions: do A, C and D sound right? And
        between E and F, which fix do we ship? Answer on{" "}
        <Link to="../review" className="underline">
          the review queue
        </Link>{" "}
        under R17.
      </p>
      <div className="mt-6 flex flex-col gap-4">
        {CLIPS.map((c) => (
          <div key={c.id} className="rounded-xl border border-border p-4">
            <div className="flex items-baseline gap-3">
              <span className="text-lg font-bold uppercase">{c.id}</span>
              <span className="text-lg">{c.text}</span>
            </div>
            <p className="mt-1 text-sm text-text-muted">{c.answers}</p>
            <audio
              className="mt-3 w-full"
              controls
              preload="none"
              src={`/qa/tts-probe/${c.id}.mp3`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
