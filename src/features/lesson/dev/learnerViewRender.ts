/**
 * THE LEARNER'S VIEW renderer — shared by every prototype-module emitter
 * (es m1/m2, fr m1/m2). Same paranoid contract as the original ja
 * `learnerView.emit.test.ts`: answers stripped, options/tiles shuffled
 * deterministically, explanations and reveal notes GONE (they follow the
 * answer), authoring comments never present. What is kept is exactly
 * what the learner is given: cards in full, prompts, the audio TEXT
 * where they hear audio, and the choices in front of them.
 */
import type { LessonStep } from "../types";

const LETTERS = ["a", "b", "c", "d", "e", "f"];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function shuffle<T>(items: T[], seed: string): T[] {
  const arr = [...items];
  let x = hash(seed) || 1;
  for (let i = arr.length - 1; i > 0; i--) {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    const j = (x >>> 0) % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

type Rec = Record<string, unknown>;

function choices(texts: string[], seed: string): string {
  return shuffle(texts, seed)
    .map((t, i) => `${LETTERS[i]}) ${t}`)
    .join("   ");
}

export type RenderCtx = {
  /** "Spanish" | "French" — used in prompts the learner reads. */
  languageName: string;
  mapExplained: boolean;
};

export function renderStep(raw: LessonStep, n: number, ctx: RenderCtx): string {
  const step = raw as unknown as Rec;
  const id = String(step.id);
  const t = String(step.type);
  const lang = ctx.languageName;
  const L = (s: string) => `${n}. [${t}] ${s}`;
  switch (raw.type) {
    case "info":
      return L(`CARD — ${raw.title}\n   ${raw.body}`);
    case "word_image_mcq": {
      const opts = shuffle(raw.options, id).map(
        (o, i) => `${LETTERS[i]}) ${o.word} ${o.emoji}`,
      );
      const audioMode = raw.options.some((o) => o.word === raw.meaningEn);
      return L(
        audioMode
          ? `AUDIO plays: "${raw.meaningEn}" — Which word do you hear?\n   ${opts.join("   ")}`
          : `What is the word for '${raw.meaningEn}'?\n   ${opts.join("   ")}`,
      );
    }
    case "speaking":
      if (raw.cue === "recall") {
        return L(
          `SAY IT IN ${lang.toUpperCase()}: "${raw.translation}" — the ${lang} is hidden until you try (a "Show answer" button waits if you're stuck)`,
        );
      }
      return L(`Say aloud: «${raw.targetPhrase}»  (${raw.translation})`);
    case "listening_comprehension": {
      const s = step as Rec;
      const opts = ((s.options ?? []) as Rec[]).map((o) => String(o.text));
      return L(
        `AUDIO plays: "${s.audioText ?? s.transcript}" — What did you hear?\n   ${choices(opts, id)}`,
      );
    }
    case "word_map": {
      const en = raw.pairs.map((p) => p.en).join(" · ");
      const chips = shuffle(raw.tokens, id).join(" | ");
      const how = ctx.mapExplained
        ? ""
        : `\n   (each English word in turn: tap the ${lang} word it maps to; solved chips lock in with their translation)`;
      ctx.mapExplained = true;
      const genders = raw.tokenGenders
        ? "\n   As chips solve they take a color + tiny letter: " +
          Object.entries(raw.tokenGenders)
            .map(
              ([i, g]) =>
                `${raw.tokens[Number(i)]} ${g === "m" ? "blue·m" : g === "f" ? "pink·f" : "grey·n"}`,
            )
            .join(", ") +
          " — untinted words stay neutral"
        : "";
      return L(
        `MAP THE SENTENCE${raw.audioText ? ` (audio plays: "${raw.audioText}")` : ""}\n   English, highlighted one at a time: ${en}\n   ${lang} chips: ${chips}${how}${genders}`,
      );
    }
    case "build_sentence":
      return L(
        `${step.prompt ?? "Build it"}\n   TILES: ${shuffle((step.tiles ?? []) as string[], id).join(" | ")}`,
      );
    case "particle_cloze": {
      const p = (step.prompt ?? {}) as Rec;
      const opts = (step.options ?? []) as string[];
      return L(
        `Fill the blank: ${p.before ?? ""} ___ ${p.after ?? ""}` +
          `${step.meaningEn ? `  (meaning: ${step.meaningEn})` : ""}\n   ${choices(opts, id)}`,
      );
    }
    case "tap_the_word": {
      const arity = raw.correctIndices.length;
      return L(
        `${raw.prompt}${arity > 1 ? ` (tap ${arity} words)` : ""}${raw.audioText ? `\n   (audio plays: "${raw.audioText}")` : ""}\n   SENTENCE: ${raw.tokens.join(" ")}${raw.meaningEn ? `\n   "${raw.meaningEn}"` : ""}`,
      );
    }
    case "multiple_choice": {
      const opts = ((step.options ?? []) as Rec[]).map((o) => String(o.text));
      return L(`${step.prompt}\n   ${choices(opts, id)}`);
    }
    case "translate": {
      const src = step.sourceText ?? "";
      return L(
        `TYPE IT IN ${lang.toUpperCase()}: "${src}" — free text box, no tiles, no options`,
      );
    }
    case "match_pairs": {
      const left = shuffle(raw.pairs.map((p) => p.source), id + "L").join(" | ");
      const right = shuffle(raw.pairs.map((p) => p.target), id + "R").join(" | ");
      return L(`${step.prompt ?? "Match the pairs"}\n   LEFT:  ${left}\n   RIGHT: ${right}`);
    }
    case "dialogue_sim": {
      const scene = `${raw.scene.emoji} ${raw.scene.title}${raw.scene.setting ? ` — ${raw.scene.setting}` : ""}`;
      const turns = raw.turns
        .map((turn, ti) => {
          const npc = `      ${turn.npc.speaker} (audio): «${turn.npc.kana}» — "${turn.npc.gloss}"`;
          const goal = `      YOUR GOAL: ${turn.goal}`;
          const reply =
            turn.reply.mode === "choice"
              ? `      REPLY OPTIONS: ${choices(turn.reply.options.map((o) => o.text), id + ti)}`
              : `      REPLY TILES: ${shuffle(turn.reply.tiles, id + ti).join(" | ")}`;
          return `   TURN ${ti + 1}:\n${npc}\n${goal}\n${reply}`;
        })
        .join("\n");
      return L(`CONVERSATION — ${scene}\n${turns}`);
    }
    default:
      return L(`!! UNRENDERED STEP TYPE — teach the emitter this one. Keys: ${Object.keys(step).join(", ")}`);
  }
}

export function emitHeader(title: string, languageName: string): string[] {
  return [
    `# ${title} — the learner's view`,
    "",
    "You are seeing exactly what a learner sees, in order. Answers are",
    "stripped; options and tiles are shuffled. Audio is written as the",
    "text a learner HEARS (they cannot read it unless a step shows it).",
    "On MEANING-prompted word-choice (MCQ) steps, tapping any option",
    "plays its audio before you commit. On hear-it steps (the audio IS",
    "the question) the options stay SILENT until you answer — your ear",
    "and the spelling are all you have.",
    `The course language is ${languageName}.`,
    "",
  ];
}

export async function emitModule(
  title: string,
  languageName: string,
  titles: ReadonlyArray<string>,
  build: (n: number) => Promise<LessonStep[]>,
): Promise<string> {
  const out = emitHeader(title, languageName);
  const ctx: RenderCtx = { languageName, mapExplained: false };
  for (let n = 1; n <= titles.length; n++) {
    const steps = await build(n);
    out.push(`## ${titles[n - 1]}`, "");
    steps.forEach((s, i) => out.push(renderStep(s, i + 1, ctx), ""));
  }
  return out.join("\n") + "\n";
}
