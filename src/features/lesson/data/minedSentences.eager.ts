import { getMockLessonContent } from "./mockLessons";
import { setMinedLessonReader } from "./minedLessonReader";

/**
 * Eager half of the sentence miner — tests and the content emitter only
 * (resolved through `virtual:eager:minedSentences`; see lessonRegistry.ts).
 * Gives the miner the synchronous lesson reader it walks with. The browser
 * never gets this: there the miner reads the precomputed index, and
 * `minedSentences.ts` no longer pulls `mockLessons` (and with it the whole
 * Japanese runtime — romaji lexicon, kanji surfaces, grammar factories:
 * a 5.6 MB chunk) onto the Home path.
 */
setMinedLessonReader(getMockLessonContent);
