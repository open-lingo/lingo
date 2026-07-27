/**
 * Semantic sibling sets — the distractor source for JA build-tile banks.
 *
 * Spencer's ruling 2026-07-24: "particle distractors are good and so are
 * other words, if there is a time stated, add ashita and kyou, if there is a
 * color, include multiple, we want them to have to think for these sentences
 * and not entirely deductively reason their way out. they need to work the
 * right muscle."
 *
 * The old fill drew RANDOM prior-taught atoms, which let a learner solve a
 * build by elimination — あおい and あさ next to のまない are obviously not the
 * answer, so no Japanese was required. A same-category distractor removes
 * that shortcut: to pick きょう over あした you must actually read the prompt.
 *
 * Membership is by kana and a word may sit in several sets (えび is both an
 * animal and a food); `siblingsOf` unions them. Entries may name words the
 * course has not taught yet — `buildTileFloor` intersects these with the
 * prior-taught atom pool, so listing them early is harmless and means the
 * set starts working the module the word lands in.
 *
 * NOTE (2026-07-24): up to m6 the course has exactly ONE colour (あおい) and
 * no あした/きのう, so those two of Spencer's examples cannot fire yet — the
 * sets below are written so they start working automatically.
 */

/** Same-category words that make each other genuinely confusable. */
export const JA_SIBLING_SETS: Readonly<Record<string, readonly string[]>> = {
  time: ["きょう", "あした", "あす", "きのう", "あさ", "よる", "けさ", "こんばん", "いま", "まいにち"],
  colour: ["あおい", "あかい", "しろい", "くろい", "きいろい"],
  animal: ["ねこ", "いぬ", "うま", "かめ", "ぶた", "ぞう", "えび", "とり", "さかな"],
  person: ["ひと", "せんせい", "ともだち", "がくせい", "あに", "あね", "かぞく", "にほんじん"],
  place: ["いえ", "うち", "えき", "がっこう", "ぎんこう", "こうえん", "としょかん", "みせ", "へや", "いけ", "うみ", "かわ", "やま", "そら"],
  object: ["ほん", "かさ", "かぎ", "いす", "かばん", "ぼうし", "くるま", "ふね", "えんぴつ", "めがね", "まど", "とけい", "でんわ", "けいたい", "じしょ", "じてんしゃ", "てがみ", "きっぷ", "しゃしん"],
  food: ["ごはん", "みず", "ぎゅうにゅう", "きゅうり", "きのこ", "りょうり", "おちゃ", "ぷりん", "もも", "えび"],
  spatial: ["うえ", "なか", "した", "まえ", "うしろ", "そば", "となり"],
  placeDeictic: ["ここ", "そこ", "あそこ", "どこ"],
  thingDeictic: ["これ", "それ", "あれ", "どれ"],
  // Cross-verb negative confusion is the tested contrast (m6 IR's own
  // sibling-set note): never invented non-words like のむない, which belong
  // only in grammar antiPatterns.
  verbNegative: ["たべない", "みない", "のまない", "いかない", "かわない", "わからない", "しない", "こない", "ない", "いない", "あそばない"],
  verbPlain: ["たべる", "みる", "のむ", "いく", "かう", "わかる", "する", "くる", "ある", "いる", "あそぶ"],
  counterPeople: ["ひとり", "ふたり", "さんにん", "よにん", "ごにん"],
  counterThings: ["ひとつ", "ふたつ", "みっつ", "よっつ"],
  number: ["いち", "さん", "よん", "ご", "ろく", "なな", "はち", "きゅう", "じゅう", "ひゃく"],
};

/**
 * Particle distractors, as explicit CONTRAST pairs rather than one flat set.
 *
 * A particle distractor is only fair when the wrong choice is genuinely
 * wrong. に vs で (existence-location vs action-location) is a real m6
 * contrast; を on an existence verb is the pitfall the lesson teaches. But
 * は vs が is frequently DEFENSIBLE — swapping them often yields correct
 * Japanese with a different topic/focus nuance, and the IR already
 * hand-accepts both on several beats. Offering が against a は answer would
 * mark correct Japanese wrong, so that pair is deliberately absent.
 */
export const JA_PARTICLE_CONTRASTS: Readonly<Record<string, readonly string[]>> = {
  に: ["で", "を"],
  で: ["に", "を"],
  を: ["に", "で", "が"],
  が: ["を", "に"],
  は: ["を", "に", "で"],
  も: ["を", "に", "で"],
  と: ["に", "で", "を"],
  の: ["を", "に"],
  へ: ["に", "で"],
  から: ["に", "で", "まで"],
  まで: ["に", "から"],
};

const INDEX: ReadonlyMap<string, readonly string[]> = (() => {
  const index = new Map<string, string[]>();
  for (const members of Object.values(JA_SIBLING_SETS)) {
    for (const member of members) {
      const bucket = index.get(member) ?? [];
      for (const sibling of members) {
        if (sibling !== member && !bucket.includes(sibling)) bucket.push(sibling);
      }
      index.set(member, bucket);
    }
  }
  return index;
})();

/** Every same-category word for `kana`, excluding itself. [] when unknown. */
export function siblingsOf(kana: string): readonly string[] {
  return INDEX.get(kana) ?? [];
}

/** Genuinely-wrong particle alternatives for `kana`. [] when not a particle. */
export function particleContrastsFor(kana: string): readonly string[] {
  return JA_PARTICLE_CONTRASTS[kana] ?? [];
}
