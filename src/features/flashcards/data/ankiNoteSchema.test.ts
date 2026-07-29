import { describe, expect, it } from "vitest";
import {
  JA_VOCAB_NOTE_TYPE,
  atomNoteGuid,
  courseAtomToAnkiNote,
} from "./ankiNoteSchema";
import type { CourseAtom } from "@/features/languages/ja/courseAtoms";

const atom: CourseAtom = {
  id: "biiru",
  kana: "ビール",
  romaji: "biiru",
  meaningEn: "beer",
  emoji: "🍺",
  pos: "noun",
  fromModule: "m3",
  kind: "vocab",
};

describe("Anki note schema", () => {
  it("note type has recognition (ord 0) + production (ord 1) templates", () => {
    const ords = JA_VOCAB_NOTE_TYPE.templates.map((t) => t.ord);
    expect(ords).toEqual([0, 1]);
    expect(JA_VOCAB_NOTE_TYPE.type).toBe(0); // standard, multi-template
  });

  it("guid is deterministic and stable for the same atom", () => {
    expect(atomNoteGuid(atom)).toBe(atomNoteGuid(atom));
    expect(atomNoteGuid(atom)).not.toBe(
      atomNoteGuid({ ...atom, id: "hoteru", kana: "ホテル" }),
    );
  });

  it("maps atom + mined sentence into the ordered field set", () => {
    const note = courseAtomToAnkiNote(atom, {
      example: { text: "ビールをください", translation: "Beer, please" },
      wordAudio: "/tts/biiru.mp3",
    });
    expect(note.fields.AtomId).toBe("ja:biiru");
    expect(note.fields.Word).toBe("ビール");
    expect(note.fields.Meaning).toBe("beer");
    expect(note.fields.Sentence).toBe("ビールをください");
    expect(note.fields.WordAudio).toBe("/tts/biiru.mp3");
    // Every declared field is present (Anki joins by field order).
    for (const f of JA_VOCAB_NOTE_TYPE.fields) {
      expect(typeof note.fields[f]).toBe("string");
    }
  });
});
